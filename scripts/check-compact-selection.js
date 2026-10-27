async page => {
 page.setDefaultTimeout(10000);
 const origin=new URL(page.url()).origin, failures=[],errors=[],samples=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const check=(ok,ctx)=>{if(!ok)failures.push(ctx)};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2]){
  const context={theme,width,zoom};
  await page.setViewportSize({width,height:1000});await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}#compact-selection`);
  await page.getByLabel('组合宽度').selectOption(String(width));await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  const cards=page.locator('[data-card]');
  const measure=()=>cards.evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,fit:e.scrollWidth<=e.clientWidth+1,widths:[...e.querySelectorAll('.ds-choice-card__actions button')].map(b=>b.offsetWidth)})));
  const before=await measure();check(Math.abs(before[0].height-before[1].height)<1&&before.every(x=>x.fit&&x.widths[0]===64&&x.widths[1]===112),{...context,kind:'equal-cards-actions',before});
  await page.getByRole('tab',{name:'备用区',exact:true}).focus();await page.keyboard.press('Home');await page.keyboard.press('End');
  await page.getByRole('button',{name:'切换操作',exact:true}).click();await page.getByRole('menuitem',{name:'设为当前项',exact:true}).click();
  const frames=await page.evaluate(()=>new Promise(resolve=>{const data=[],start=performance.now();function frame(){data.push([...document.querySelectorAll('[data-card]')].map(e=>e.getBoundingClientRect().height));if(performance.now()-start<900)requestAnimationFrame(frame);else resolve(data)}requestAnimationFrame(frame)}));
  check(frames.every(f=>f.every((height,i)=>Math.abs(height-before[i].height)<1)),{...context,kind:'card-frame-stability',range:frames.slice(0,2).concat(frames.slice(-2))});
  check(await page.getByRole('tab',{name:'备用区',exact:true}).getAttribute('aria-selected')==='true',{...context,kind:'tab-identity'});
  const trigger=page.getByRole('button',{name:'选择 合成对象 B 的授权分组'});await trigger.click();const dialog=page.getByRole('dialog',{name:'分组选择'});await dialog.waitFor();await dialog.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
  const box=await dialog.boundingBox();
  await page.evaluate(()=>{window.__frames=[];window.__sampling=true;function frame(){const e=document.querySelector('[role=dialog]');if(e){const r=e.getBoundingClientRect();window.__frames.push({height:r.height,y:r.y});}if(window.__sampling)requestAnimationFrame(frame)}requestAnimationFrame(frame)});
  for(const value of ['four','last','empty','loading','error','two'])await dialog.getByLabel('预览内容').selectOption(value);
  await dialog.getByLabel('候选分组').selectOption('beta');check(await dialog.getByText('已确认：示例组').count()===1,{...context,kind:'preview-only'});
  const save=dialog.getByRole('button',{name:'保存',exact:true});await save.click();await page.keyboard.press('Escape');check(await dialog.count()===1,{...context,kind:'busy-blocks-close'});
  await dialog.getByText('已确认：联合研究组').waitFor();check(await save.isDisabled(),{...context,kind:'confirmed-save'});
  const heights=await page.evaluate(()=>{window.__sampling=false;return window.__frames});
  check(heights.every(r=>Math.abs(r.height-box.height)<1&&Math.abs(r.y-box.y)<1),{...context,kind:'dialog-frame-stability',box,range:heights.slice(0,1).concat(heights.slice(-1))});
  const footer=await save.boundingBox();const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  check(footer.y>=0&&footer.y+footer.height<=viewport.height+1&&footer.x>=0&&footer.x+footer.width<=viewport.width+1,{...context,kind:'footer-reachable',footer,viewport});
  await dialog.getByLabel('候选分组').selectOption('none');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await trigger.click();check(await dialog.getByLabel('候选分组').inputValue()==='beta',{...context,kind:'discard-draft'});
  await dialog.getByRole('button',{name:'关闭对话框'}).click();await dialog.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.startsWith('选择 '));
  await page.getByLabel('组合场景').selectOption('error');await trigger.click();await dialog.getByLabel('候选分组').selectOption('none');await dialog.getByRole('button',{name:'保存',exact:true}).click();await dialog.getByText('保存失败，请重试；确认值未改变。').waitFor();check(await dialog.getByText('已确认：联合研究组').count()===1,{...context,kind:'failure-preserves-confirmed'});
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.getByLabel('组合场景').selectOption('long');check((await measure()).every(x=>x.fit),{...context,kind:'long-fit'});
  for(const layout of ['fill','content']){await page.getByLabel('页签布局').selectOption(layout);check(await page.getByRole('tablist',{name:'选择摘要'}).evaluate(el=>el.scrollWidth<=el.clientWidth+1),{...context,kind:`tabs-${layout}`});}
  if(width===400&&zoom===2){await cards.first().scrollIntoViewIfNeeded();await page.screenshot({path:`output/playwright/compact-${theme}.png`});}
  samples.push(context);
 }
 return {pass:!failures.length&&!errors.length,failures,errors,samples};
}
