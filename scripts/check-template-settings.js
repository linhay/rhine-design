// Run in a production gallery or a fresh fixed-tarball consumer. Synthetic data, CSS zoom.
async page => {
 page.setDefaultTimeout(7000);
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[],errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 const assert=(value,message)=>{if(!value)throw Error(message);};
 for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520,880,1280]) for(const zoom of [1,2]) for(const height of [900,648]) {
  const c={theme,width,zoom,height};
  try {
   await page.setViewportSize({width,height});await page.goto(`${base}/?fixture=template-settings&theme=${theme}&zoom=${zoom}`);
   await page.getByRole('button',{name:'载入八行草稿'}).click();const trigger=page.getByRole('button',{name:'打开模板工作区'});await trigger.click();
   const d=page.getByRole('dialog',{name:'模板配置'}), editor=d.getByRole('group',{name:'模板规则'}), body=d.getByRole('region');
   const measure=()=>d.evaluate(e=>{const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};const body=e.querySelector('.rhine-dialog__settings-content'), footer=e.querySelector('.rhine-dialog__footer');return {frame:rect(e),head:rect(e.querySelector('.rhine-dialog__head')),body:rect(body),footer:rect(footer),buttons:[...footer.querySelectorAll('button')].map(rect),overflow:body.scrollWidth>body.clientWidth+1};});
   const first=await measure();const stable=async()=>{const now=await measure();for(const key of ['frame','head','footer'])for(const axis of ['x','y','width','height'])assert(Math.abs(now[key][axis]-first[key][axis])<1,`unstable ${key}.${axis}`);return now;};
   assert(first.body.height>=128,`body only ${first.body.height}px`);
   const within=(r,b)=>r.x>=b.x-1&&r.right<=b.right+1&&r.y>=b.y-1&&r.bottom<=b.bottom+1;
   assert(first.buttons.every(r=>r.width/zoom>=43.9&&r.height/zoom>=43.9&&within(r,first.footer)),'footer target/clipping');
   const fields=editor.locator('.rhine-mapping-editor__fields').first();
   const layout=await fields.evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,width:e.closest('.rhine-mapping-editor').getBoundingClientRect().width,zoom:Number(getComputedStyle(document.documentElement).zoom)}));
   assert(layout.columns===(layout.width/zoom<480?1:4),'incorrect container reflow');
   const edited=d.getByRole('combobox',{name:'第3行 目标'});await edited.selectOption('option-8');
   await d.getByRole('link',{name:'其他设置',exact:true}).click();await stable();await d.getByRole('link',{name:'模板编辑',exact:true}).click();
   assert(await edited.inputValue()==='option-8','section lost row draft');
   const surviving=await d.getByRole('combobox',{name:'第4行 目标'}).elementHandle();
   await d.getByRole('button',{name:'删除第3行',exact:true}).click();
   assert(await surviving.evaluate(e=>e.isConnected) && await d.getByRole('combobox',{name:'第3行 目标'}).evaluate((e,id)=>e.id===id,await surviving.getAttribute('id')),'middle deletion replaced following control');
   assert(await d.getByRole('combobox',{name:'第3行 来源'}).evaluate(e=>e===document.activeElement),'middle delete focus');
   await d.getByRole('button',{name:'添加规则'}).click();assert(await d.getByRole('combobox',{name:'第8行 来源'}).evaluate(e=>e===document.activeElement),'add focus');
   await d.getByRole('combobox',{name:'第8行 来源'}).selectOption('option-3');await d.getByRole('combobox',{name:'第8行 目标'}).selectOption('option-1');
   // Native typeahead selection is verified separately by check-template-keyboard.js.
   await d.getByRole('button',{name:'删除第8行',exact:true}).click();assert(await d.getByRole('combobox',{name:'第7行 来源'}).evaluate(e=>e===document.activeElement),'last delete focus');
   await stable();
   await body.evaluate(e=>{e.scrollTop=0;});const b=await body.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.wheel(0,200);
   await page.waitForFunction(()=>document.querySelector('.rhine-dialog__settings-content').scrollTop>0);const down=await body.evaluate(e=>e.scrollTop);await page.mouse.wheel(0,-150);await page.waitForFunction(previous=>document.querySelector('.rhine-dialog__settings-content').scrollTop<previous,down);await stable();
   const last=d.getByRole('button',{name:'添加规则'});await last.focus();const lastBox=await last.boundingBox(),after=await stable();assert(within({...lastBox,right:lastBox.x+lastBox.width,bottom:lastBox.y+lastBox.height},after.body),'last action unreachable');assert(!after.overflow,'horizontal overflow');
   const targets=await editor.locator('select,button').evaluateAll(elements=>elements.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));assert(targets.every(r=>r.w/zoom>=43.9&&r.h/zoom>=43.9),'editor target below 44px');
   for(const key of ['Tab','Shift+Tab'])for(let i=0;i<12;i++){await page.keyboard.press(key);assert(await d.evaluate(e=>e.contains(document.activeElement)),'focus escaped');}
   await page.keyboard.press('Escape');await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='打开模板工作区');
   for(const mode of ['disabled','readonly']) {
    await page.getByRole('combobox',{name:'编辑器状态'}).selectOption(mode);await trigger.click();
    if(mode==='disabled') assert(await editor.locator('select:not(:disabled),button:not(:disabled)').count()===0,'disabled permits mutation');
    else {assert(await editor.locator('select,button').count()===0,'read-only has mutation controls');assert(!(await measure()).overflow,'read-only long text overflow');}
    await stable();await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
   }
   results.push({...c,pass:true,bodyHeight:first.body.height,layout});
  }catch(error){results.push({...c,pass:false,error:String(error)});}
 }
 const motion=[];
 for(const mode of ['system','manual','full']){
  await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});await page.goto(`${base}/?fixture=template-settings&motion=${mode==='manual'?'reduced':'full'}`);await page.getByRole('button',{name:'打开模板工作区'}).click();const duration=await page.getByRole('dialog').evaluate(e=>getComputedStyle(e).animationDuration);motion.push({mode,duration,pass:mode==='full'?parseFloat(duration)>0:parseFloat(duration)===0});
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 return {pass:results.every(r=>r.pass)&&motion.every(r=>r.pass)&&!errors.length,results,motion,errors};
}
