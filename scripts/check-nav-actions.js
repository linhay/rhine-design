async page => {
 page.setDefaultTimeout(8000);
 const failures=[], errors=[], samples=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const origin=new URL(page.url()).origin;
 const check=(ok,context)=>{if(!ok)failures.push(context)};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2]){
  await page.setViewportSize({width:1100,height:1000});
  await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}#nav-actions`);
  await page.getByLabel('导航容器宽度').selectOption(String(width));
  await page.getByLabel('导航标题').selectOption('long');
  await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  const nav=page.getByRole('navigation',{name:'行操作示例'}),trigger=nav.getByRole('button');
  const context={theme,width,zoom};
  check(await trigger.count()===1,{...context,kind:'empty-actions'});
  const bounds=await trigger.evaluate(el=>({height:el.offsetHeight,width:el.offsetWidth,nested:!!el.closest('a'),opacity:getComputedStyle(el).opacity,fit:el.closest('nav').scrollWidth<=el.closest('nav').clientWidth+1}));
  check(bounds.height>=44&&bounds.width>=44&&!bounds.nested&&bounds.opacity==='1'&&bounds.fit,{...context,kind:'bounds',bounds});
  await nav.getByRole('link',{name:'没有动作的工作区',exact:true}).click();
  await trigger.click();
  await page.getByRole('menuitem',{name:'查看详情',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'工作区详情'});await dialog.waitFor();
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.endsWith('：更多操作'));
  check(await nav.getByRole('link',{name:'没有动作的工作区',exact:true}).getAttribute('aria-current')==='page',{...context,kind:'no-navigation'});
  await trigger.press('Space');await page.getByRole('menu').waitFor();
  await page.keyboard.press('Escape');await page.getByRole('menu').waitFor({state:'detached'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.endsWith('：更多操作'));
  if(width===400&&zoom===2){await nav.scrollIntoViewIfNeeded();await page.screenshot({path:`output/playwright/nav-${theme}.png`});}
  samples.push(context);
 }
 for(const reduced of [false,true]){
  await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  await page.goto(`${origin}/?proof=${Date.now()}#nav-actions`);await page.getByRole('navigation',{name:'行操作示例'}).getByRole('button').click();
  await page.getByRole('menuitem',{name:'查看详情',exact:true}).click();await page.getByRole('dialog').waitFor();
  await page.getByRole('button',{name:'关闭对话框',exact:true}).click();await page.getByRole('dialog').waitFor({state:'detached'});
 }
 await page.getByRole('radio',{name:'减少动态',exact:true}).check();
 const trigger=page.getByRole('navigation',{name:'行操作示例'}).getByRole('button');await trigger.press('Enter');await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.endsWith('：更多操作'));
 return {pass:!failures.length&&!errors.length,failures,errors,samples};
}
