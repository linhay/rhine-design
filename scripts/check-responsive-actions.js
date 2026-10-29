// Built gallery or fixed installed-tarball fixture. CSS zoom is not native browser zoom.
async page=>{
 const base=page.url().split('?')[0].split('#')[0],probe=page.url().includes('probe=overflow'),rows=[],failures=[],errors=[];
 page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(String(e)));
 const check=(ok,message)=>{if(!ok)throw Error(message);};
 const run=async(context,fn)=>{try{rows.push({...context,status:'PASS',evidence:await fn()});}catch(e){failures.push({...context,error:String(e)});}};
 const open=async(theme,width,zoom,motion='normal')=>{await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});await page.goto(`${base}?fixture=responsive-actions&theme=${theme}&zoom=${zoom}&motion=${motion==='manual'?'reduced':'system'}`);await page.evaluate(()=>document.fonts.ready);};
 const group=()=>page.locator('.rhine-responsive-actions');
 const waitMode=async mode=>page.waitForFunction(expected=>document.querySelector('.rhine-responsive-actions')?.dataset.mode===expected,mode);
 const focusIs=async locator=>locator.evaluate(el=>el===document.activeElement);
 const stable=async()=>page.evaluate(()=>new Promise(resolve=>{let n=0;const samples=[];function frame(){samples.push(document.querySelector('.rhine-responsive-actions')?.dataset.mode);if(++n<12)requestAnimationFrame(frame);else resolve(samples);}requestAnimationFrame(frame);}));
 const geometry=async zoom=>{
  await page.waitForFunction(()=>{const root=document.querySelector('.rhine-responsive-actions'),p=[...root.querySelectorAll('.rhine-responsive-actions__probe')];return root.dataset.mode===(p[0].offsetWidth<=root.clientWidth?'text':p[1].offsetWidth<=root.clientWidth?'icons':'menu');});
  const evidence=await group().evaluate(root=>{
   const host=root.parentElement,probes=[...root.querySelectorAll('.rhine-responsive-actions__probe')].map(el=>el.offsetWidth),available=root.clientWidth;
   const buttons=[...root.querySelectorAll('[data-action-id],.rhine-responsive-actions__menu button')].filter(el=>el.getBoundingClientRect().width>0).map(el=>{const r=el.getBoundingClientRect();return{label:el.getAttribute('aria-label'),width:r.width,height:r.height,left:r.left,right:r.right};});
   return{mode:root.dataset.mode,available,probes,hostWidth:host.clientWidth,hostScroll:host.scrollWidth,documentWidth:document.documentElement.clientWidth,documentScroll:document.documentElement.scrollWidth,viewport:innerWidth,buttons};
  });
  const expected=evidence.probes[0]<=evidence.available?'text':evidence.probes[1]<=evidence.available?'icons':'menu';
  check(evidence.mode===expected,'wrong measured mode '+JSON.stringify(evidence));
  check(evidence.hostScroll<=evidence.hostWidth+1&&evidence.documentScroll<=evidence.documentWidth+1,'measurement/host overflow '+JSON.stringify(evidence));
  check(evidence.buttons.every(b=>b.width>=44*zoom-1&&b.height>=44*zoom-1&&b.left>=-1&&b.right<=evidence.viewport+1),'target clipped or shrunk '+JSON.stringify(evidence));
  check(evidence.buttons.length===(expected==='menu'?1:4),'actions lost or duplicated');return evidence;
 };
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2])await run({theme,width,zoom,kind:'layout'},async()=>{
  await open(theme,width,zoom);const evidence=[];
  for(const container of ['680','240','56']){
   await page.getByLabel('动作容器宽度',{exact:true}).selectOption(container);await page.waitForTimeout(80);evidence.push(await geometry(zoom));
  }
  await page.getByLabel('长动作与多语言',{exact:true}).check();await page.getByLabel('动作字体',{exact:true}).selectOption('mono');
  if(probe)await page.addStyleTag({content:'.rhine-responsive-actions__measure {width:auto!important;overflow:visible!important;}'});
  await page.waitForTimeout(80);evidence.push(await geometry(zoom));
  const samples=await stable();check(new Set(samples).size===1,'mode oscillation');
  if(!probe){
   const more=page.getByRole('button',{name:'更多操作',exact:true});await more.focus();await page.getByRole('tooltip').filter({hasText:'更多操作'}).waitFor();await more.press('ArrowDown');
   const menu=page.getByRole('menu',{name:'更多操作',exact:true});await menu.waitFor();check(await menu.getByRole('menuitem').count()===4,'menu lost actions');
   const fit=await menu.evaluate(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,scroll:el.scrollWidth,client:el.clientWidth,viewport:innerWidth};});check(fit.left>=-1&&fit.right<=fit.viewport+1&&fit.scroll<=fit.client+1,'long menu clipping');
   await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});await page.waitForTimeout(60);check(await focusIs(more),'Escape did not return more');
   await page.getByRole('button',{name:'操作区之后',exact:true}).focus();await page.getByLabel('长动作与多语言',{exact:true}).uncheck();await page.getByLabel('动作字体',{exact:true}).selectOption('default');await page.getByLabel('动作容器宽度',{exact:true}).selectOption('680');await page.waitForTimeout(80);evidence.push(await geometry(zoom));
  }
  return evidence;
 });
 for(const theme of probe?[]:['rhine','arknights','neo-brutalism'])await run({theme,kind:'focus-permission-content'},async()=>{
  await open(theme,880,1);await waitMode('text');
  const copy=page.getByRole('button',{name:'复制',exact:true});const node=await copy.elementHandle();await copy.focus();
  await page.locator('[data-action-container]').evaluate(el=>el.style.width='240px');await waitMode('icons');check(await copy.evaluate((el,prior)=>el===prior,node),'button DOM replaced');check(await focusIs(copy),'text-icons focus lost');await page.getByRole('tooltip').filter({hasText:'复制'}).waitFor();
  await page.locator('[data-action-container]').evaluate(el=>el.style.width='160px');await waitMode('menu');const more=page.getByRole('button',{name:'更多操作',exact:true});check(await focusIs(more),'collapse handoff');
  await more.press('ArrowDown');const menu=page.getByRole('menu',{name:'更多操作',exact:true});await menu.waitFor();await page.keyboard.press('End');await page.waitForFunction(()=>document.activeElement?.textContent==='管理');const manage=menu.getByRole('menuitem',{name:'管理',exact:true});check(await focusIs(manage),'End menu order');
  await page.locator('[data-action-container]').evaluate(el=>el.style.width='680px');await page.waitForTimeout(60);await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});await page.waitForTimeout(60);check(await group().getAttribute('data-mode')==='menu'&&await focusIs(more),'close after widening lost more focus');await more.press('ArrowDown');await menu.waitFor();await page.keyboard.press('End');await page.setViewportSize({width:520,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');await page.waitForTimeout(100);check(await focusIs(manage),'open menu resize/zoom focus');check(await group().getAttribute('data-mode')==='menu','open menu unpinned');
  await page.getByLabel('有管理权限',{exact:true}).evaluate(el=>el.click());await manage.waitFor({state:'detached'});check(await menu.getByRole('menuitem').count()===3,'permission not removed');check(await focusIs(menu.getByRole('menuitem',{name:'详情',exact:true})),'removed item focus recovery');
  await page.getByLabel('无可用动作',{exact:true}).evaluate(el=>el.click());await menu.waitFor({state:'detached'});await page.waitForTimeout(60);check(await group().count()===0,'empty group left behind');check(await focusIs(page.getByRole('button',{name:'操作区之后',exact:true})),'empty group focus');
  await page.getByLabel('无可用动作',{exact:true}).evaluate(el=>el.click());await page.waitForTimeout(60);check(await page.getByRole('menu').count()===0,'restored group automatically opened');
  await page.getByLabel('有管理权限',{exact:true}).check();await page.evaluate(()=>document.documentElement.style.zoom='1');await page.setViewportSize({width:880,height:900});await waitMode('text');
  await page.getByLabel('刷新动作文字',{exact:true}).fill('A very long dynamically updated action label for the complete synthetic collection');await waitMode('icons');await page.getByLabel('刷新动作文字',{exact:true}).fill('刷新');await waitMode('text');
  await page.getByLabel('禁用复制',{exact:true}).check();check(await page.getByRole('button',{name:'复制',exact:true}).isDisabled(),'disabled text action');await page.getByLabel('动作容器宽度',{exact:true}).selectOption('56');await waitMode('menu');await more.press('ArrowDown');await menu.waitFor();check(await menu.getByRole('menuitem',{name:'复制',exact:true}).getAttribute('data-disabled')!==null,'disabled menu action');await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
  await page.locator('[data-action-container]').evaluate(el=>el.style.width='680px');await page.waitForTimeout(60);check(await group().getAttribute('data-mode')==='menu','focused more not retained');await more.press('Tab');await waitMode('text');check(await focusIs(page.getByRole('button',{name:'操作区之后',exact:true})),'Tab release stole external focus');
  return{nodeStable:true,resizeZoomFocus:true,permissionFocus:true,emptyReset:true,dynamicLabels:true,disabled:true,menuPinAndRestore:true};
 });
 for(const theme of probe?[]:['rhine','arknights','neo-brutalism'])for(const motion of ['normal','system','manual'])await run({theme,motion,kind:'busy-motion'},async()=>{
  await open(theme,520,2,motion);await waitMode('icons');const refresh=page.getByRole('button',{name:'刷新',exact:true});await refresh.press('Enter');await refresh.press('Enter');check(await refresh.getAttribute('aria-busy')==='true','busy missing');
  const animation=await refresh.locator('.rhine-spinner').evaluate(el=>getComputedStyle(el).animationName);check(motion==='normal'?animation!=='none':animation==='none','reduced motion spinner');
  await page.locator('[data-action-container]').evaluate(el=>el.style.width='56px');await waitMode('menu');await page.getByRole('button',{name:'更多操作',exact:true}).press('ArrowDown');
  const menu=page.getByRole('menu',{name:'更多操作',exact:true}),pending=menu.getByRole('menuitem',{name:'刷新（处理中）',exact:true});await pending.waitFor();check(await pending.getAttribute('data-disabled')!==null,'busy menu guard');await pending.evaluate(el=>el.click());
  await page.locator('[role="status"][aria-label="动作结果"]').filter({hasText:'刷新完成 · 执行 1 次'}).waitFor();check(await menu.getByRole('menuitem',{name:'刷新',exact:true}).count()===1,'busy did not settle');await page.keyboard.press('Escape');return{animation,oneExecution:true};
 });
 if(!probe)await run({kind:'native-observer-lifecycle'},async()=>{
  await page.addInitScript(()=>{
   const Native=window.ResizeObserver,records=[];window.__actionObservers=records;
   window.ResizeObserver=class extends Native {constructor(callback){super(callback);this.record={owned:false,active:false};records.push(this.record);}observe(target,options){if(target.classList.contains('rhine-responsive-actions')){this.record.owned=true;this.record.active=true;}super.observe(target,options);}disconnect(){this.record.active=false;super.disconnect();}};
  });
  await open('rhine',880,1);const evidence=[];
  for(let i=0;i<3;i++){
   await waitMode('text');check(await page.evaluate(()=>window.__actionObservers.filter(r=>r.owned&&r.active).length)===1,'duplicate active root observers');
   await page.getByLabel('挂载自适应动作',{exact:true}).uncheck();await page.waitForTimeout(30);const active=await page.evaluate(()=>window.__actionObservers.filter(r=>r.owned&&r.active).length);check(active===0,'observer leaked after unmount');evidence.push(active);
   await page.getByLabel('挂载自适应动作',{exact:true}).check();
  }
  return{unmountActiveCounts:evidence};
 });
 return{pass:!failures.length&&!errors.length,rows,failures,errors,userAgent:await page.evaluate(()=>navigator.userAgent)};
}
