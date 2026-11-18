// Narrow menu keyboard handoff into a controlled Dialog. CSS zoom is not native browser zoom.
async page=>{
  const failures=[],errors=[];
  page.setDefaultTimeout(8000);
  page.on('pageerror',error=>errors.push(String(error)));
  const base=page.url().split('?')[0].split('#')[0];
  await page.setViewportSize({width:960,height:800});
  await page.goto(base+'?fixture=responsive-actions&handoff=dialog&theme=rhine');
  await page.evaluate(()=>document.fonts.ready);
  const more=page.getByRole('button',{name:'更多操作',exact:true});
  const dialog=page.getByRole('dialog',{name:'示例设置'});
  const openSettings=async()=>{
    await more.focus();
    await page.getByRole('tooltip').filter({hasText:'更多操作'}).waitFor();
    await more.press('Enter');
    const item=page.getByRole('menuitem',{name:'打开设置',exact:true});
    await item.waitFor();
    await item.focus();
    await item.press('Enter');
    await dialog.waitFor();
    await page.waitForFunction(()=>!!document.activeElement?.closest('[role="dialog"]'));
    await page.waitForTimeout(80);
  };
  await openSettings();
  if(await page.getByRole('tooltip').count()!==0)failures.push('dialog focus left an old tooltip');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='更多操作');
  await more.press('Enter');
  await page.getByRole('menuitem',{name:'刷新状态',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('menu').waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='更多操作');
  await more.hover();
  await page.getByRole('tooltip').filter({hasText:'更多操作'}).waitFor();
  await openSettings();
  await page.getByLabel('暂时不能关闭',{exact:true}).check();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  if(!await dialog.isVisible())failures.push('busy dialog closed against its own restriction');
  await page.getByLabel('暂时不能关闭',{exact:true}).uncheck();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  return{pass:!failures.length&&!errors.length,failures,errors,userAgent:await page.evaluate(()=>navigator.userAgent)};
}
