// Production fixture; 100/200% here means CSS zoom, not native browser zoom.
async page => {
 const base=page.url().split('?')[0].split('#')[0],probe=page.url().includes('probe=clip');
 const rows=[],failures=[],errors=[];page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(String(e)));
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 const run=async(context,fn)=>{try{rows.push({...context,status:'PASS',evidence:await fn()});}catch(e){failures.push({...context,status:'FAIL',error:String(e)});}};
 const open=async(theme,width,zoom,motion='normal')=>{await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});await page.goto(`${base}?fixture=compact-template&theme=${theme}&zoom=${zoom}&motion=${motion==='manual'?'reduced':'system'}`);await page.evaluate(()=>document.fonts.ready);};
 const readable=async (locator,scroll=true)=>{
  if(scroll)await locator.scrollIntoViewIfNeeded();
  const result=await locator.evaluate(el=>{
   const range=document.createRange();range.selectNodeContents(el);const bounds=el.getBoundingClientRect();
   const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
   let left=0,right=innerWidth,top=0,bottom=innerHeight,visible=true;
   for(let n=el;n;n=n.parentElement){const s=getComputedStyle(n),r=n.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)visible=false;if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,r.left);right=Math.min(right,r.right);}if(/hidden|clip|auto|scroll/.test(s.overflowY)){top=Math.max(top,r.top);bottom=Math.min(bottom,r.bottom);}}
   return {visible,rects:rects.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),left,right,top,bottom,width:bounds.width,height:bounds.height};
  });
  assert(result.visible&&result.rects.length>0&&result.rects.every(r=>r.left>=result.left-1&&r.right<=result.right+1&&r.top>=result.top-1&&r.bottom<=result.bottom+1),'text clipped or hidden '+JSON.stringify(result));return result;
 };
 const feedback=async text=>{const node=page.getByRole('dialog',{name:'编辑完整模板'}).locator('.rhine-dialog__footer').getByText(text,{exact:true});await node.waitFor();await page.waitForTimeout(250);const evidence=await readable(node,false);await readable(page.getByRole('button',{name:'保存完整模板',exact:true}).locator('span').first(),false);const frame=await page.locator('.rhine-dialog__footer').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight}));assert(frame.scroll<=frame.client+1,'footer clips actions '+JSON.stringify(frame));return evidence;};
 const workflow=async()=>{
  await page.getByLabel('首次保存失败',{exact:true}).check();await page.getByRole('button',{name:'新建完整模板',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'编辑完整模板'}),save=dialog.getByRole('button',{name:'保存完整模板',exact:true}),name=dialog.getByLabel('完整模板名称',{exact:true});
  await save.click();await feedback('请输入模板名称');assert(await name.evaluate(el=>el===document.activeElement),'blank name focus');
  await name.fill('   ');await save.click();await feedback('请输入模板名称');
  await name.fill('常用模板');await save.click();await feedback('名称重复，请更名');
  await name.fill('合成新模板');await dialog.getByRole('button',{name:'获取合成目录',exact:true}).click();await dialog.getByRole('status',{name:'模板目录结果'}).filter({hasText:'目录已更新'}).waitFor();
  assert(await dialog.getByRole('list',{name:'模板模型已选项'}).locator(':scope>li').count()===0,'fetch auto-selected');
  await dialog.getByRole('combobox',{name:'模板模型',exact:true}).click();for(let i=0;i<10;i++)await page.getByRole('option',{name:`model-${i}`,exact:true}).click();await page.getByRole('option',{name:'完整的合成跨团队模型名称-with-a-very-long-unbroken-identifier-abcdefghijklmnopqrstuvwxyz',exact:true}).click();await page.getByRole('button',{name:'完成选择',exact:true}).click();
  await dialog.getByRole('tab',{name:'模型映射',exact:true}).click();await dialog.getByRole('button',{name:'添加规则',exact:true}).click();
  await dialog.getByRole('tab',{name:'模型白名单',exact:true}).click();await save.click();await feedback('第1行请选择来源');
  const source=dialog.getByRole('combobox',{name:'第1行 来源',exact:true}),target=dialog.getByRole('combobox',{name:'第1行 目标',exact:true});
  assert(await dialog.getByRole('tab',{name:'模型映射',exact:true}).getAttribute('aria-selected')==='true','cross-tab routing');
  assert(await source.evaluate(el=>el===document.activeElement),'cross-tab focus');
  await source.selectOption('model-0');await save.click();await feedback('第1行请选择目标');assert(await target.evaluate(el=>el===document.activeElement),'target focus');await target.selectOption('model-1');
  await dialog.getByRole('tab',{name:'模型白名单',exact:true}).click();assert(await dialog.getByRole('list',{name:'模板模型已选项'}).locator(':scope>li').count()===11,'tab draft lost');
  await save.click();await feedback('保存失败，请重试');assert(await name.inputValue()==='合成新模板','failure draft lost');assert(await page.locator('[aria-label="已保存模板"]').textContent()==='尚未保存模板','failure wrote data');
  await save.click();await feedback('已保存');assert((await page.locator('[aria-label="已保存模板"]').textContent()).includes('11 个模型 · 1 条映射'),'incomplete snapshot');
  await save.click();await feedback('无需保存');assert((await page.locator('[aria-label="模板写入次数"]').textContent()).includes('1 次'),'unchanged wrote again');
  await name.fill('继续编辑');assert(await dialog.getByText('已保存',{exact:true}).count()===0,'stale toast');
  await save.click();await feedback('已保存');await dialog.getByRole('button',{name:'关闭通知',exact:true}).click();assert(await dialog.getByText('已保存',{exact:true}).count()===0,'toast dismissal');
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();await dialog.waitFor({state:'hidden'});
  return {blank:true,whitespace:true,duplicate:true,crossTab:true,failedDraft:true,retry:true,noOp:true,editClearsSuccess:true};
 };
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2])await run({theme,width,zoom,kind:'layout-save'},async()=>{
  await open(theme,width,zoom);
  if(probe)await page.addStyleTag({content:'.rhine-multi-select[data-tag-density=compact] .rhine-multi-select__activate>span {white-space:nowrap!important;width:20px;overflow:hidden!important;}'});
  const tags=page.getByRole('list',{name:'紧凑模型已选项'}),buttons=tags.locator('button');assert(await tags.locator(':scope>li').count()===11,'hidden selected values');
  const sizes=await buttons.evaluateAll(nodes=>nodes.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
  assert(sizes.every(r=>r.w>=28*zoom-1&&r.h>=28*zoom-1),'compact target below 28px');assert(sizes.some(r=>r.h<44*zoom),'fine pointer not compact');
  await readable(tags.getByRole('button',{name:'完整的合成跨团队模型名称-with-a-very-long-unbroken-identifier-abcdefghijklmnopqrstuvwxyz',exact:true}).locator('span'));
  const group=page.getByRole('group',{name:'标签来源汇合',exact:true});assert(await group.locator('.rhine-mapping-editor__target').count()===2,'target duplication');assert(await group.locator('.rhine-mapping-editor__arrow').count()===2,'relation count');assert(await group.locator('button').count()===0,'fake interactive sources');
  assert(JSON.stringify(await group.locator('.rhine-badge').allTextContents())===JSON.stringify(['model-0','model-1','model-0','model-9','model-2','完整的合成跨团队模型名称-with-a-very-long-unbroken-identifier-abcdefghijklmnopqrstuvwxyz']),'source order/duplicates');
  for(const badge of await group.locator('.rhine-badge').all())await readable(badge);
  if(width/zoom>=520){const pos=await group.locator('.rhine-badge').evaluateAll(nodes=>nodes.slice(0,2).map(n=>n.getBoundingClientRect().top));assert(Math.abs(pos[0]-pos[1])<1,'sources failed to flow inline');}
  await tags.getByRole('button',{name:'model-1',exact:true}).press('Enter');assert(await tags.locator(':scope>li').count()===11,'activation removed');assert(await page.getByRole('status',{name:'当前模型'}).textContent()==='model-1','activation did not notify');
  await tags.getByRole('button',{name:'移除model-1',exact:true}).press('Enter');const input=page.getByRole('combobox',{name:'紧凑模型',exact:true});assert(await input.evaluate(el=>el===document.activeElement),'remove focus');assert(await tags.locator(':scope>li').count()===10,'remove failed');
  await input.press('Backspace');assert(await tags.locator(':scope>li').count()===9,'backspace failed');
  await page.getByLabel('只读紧凑标签',{exact:true}).check();assert(await tags.getByRole('button',{name:'移除model-0',exact:true}).isDisabled(),'readonly remove');assert(!await tags.getByRole('button',{name:'model-0',exact:true}).isDisabled(),'readonly inspection');
  await page.getByLabel('禁用紧凑标签',{exact:true}).check();assert(await tags.getByRole('button',{name:'model-0',exact:true}).isDisabled(),'disabled activate');
  await page.getByLabel('允许查看标签',{exact:true}).uncheck();assert(await tags.getByRole('button',{name:'model-0',exact:true}).count()===0,'static tag button');
  const standard=page.getByRole('list',{name:'标准标签对照已选项'});assert(await standard.locator('button').evaluate(el=>el.getBoundingClientRect().height)>=44*zoom-1,'default density changed');
  return {sizes,workflow:await workflow()};
 });
 for(const theme of probe?[]:['rhine','arknights','neo-brutalism'])for(const motion of ['normal','system','manual'])await run({theme,motion,kind:'motion-save'},async()=>{await open(theme,520,2,motion);return workflow();});
 return {pass:!failures.length&&!errors.length,rows,failures,errors,userAgent:await page.evaluate(()=>navigator.userAgent)};
}
