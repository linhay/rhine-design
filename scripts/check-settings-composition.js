// Run against this revision's production preview; origin comes from the current page.
async page => {
  const native = page.url().includes('native=1');
  const origin = page.url().split('/').slice(0,3).join('/'), results = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of (native ? [1] : [1,2])) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?fixture=settings-composition&theme=${theme}&zoom=${zoom}`);
    await page.getByRole('checkbox', {name:'长产品名与状态'}).check();
    const shell = page.getByRole('region', {name:'设置组合工作区'}), header = shell.locator('.rhine-shell__content-header');
    const viewport = await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,zoom:getComputedStyle(document.documentElement).zoom}));
    const desktop = viewport.width / zoom - 32 >= 760;
    if (await header.isVisible() === desktop) throw Error('Empty header visibility');
    await page.getByRole('checkbox', {name:'显示顶部动作'}).check();
    if (!await header.isVisible()) throw Error('Visible action lost');
    await page.getByRole('button',{name:'完成顶部操作'}).click();
    if (desktop) {
      await page.getByRole('button',{name:'收起设置导航'}).focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='展开设置导航');
      if (!await header.isVisible()) throw Error('Restore header missing');
      await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='收起设置导航');
      if (await header.isVisible()) throw Error('Empty header remains');
    } else {
      await shell.getByRole('button',{name:'设置导航',exact:true}).click();
      await page.getByRole('dialog',{name:'设置导航',exact:true}).waitFor();
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='设置导航');
    }
    for (const state of ['current','checking','available','error']) {
      await page.getByRole('combobox',{name:'更新状态'}).selectOption(state);
      const area = page.getByTestId('update-area');
      const geometry = await area.evaluate(e=>{const s=e.querySelector('[role=status]').getBoundingClientRect(),b=e.querySelector('button').getBoundingClientRect(),r=e.getBoundingClientRect();return { aligned:Math.abs(s.right-b.right)<1, overflow:e.scrollWidth>e.clientWidth+1, right:r.right,x:r.x };});
      if (!geometry.aligned || geometry.overflow || geometry.x<0 || geometry.right>viewport.width+1) throw Error(JSON.stringify({theme,width,zoom,state,geometry}));
      if (state==='checking' && await area.locator('button').getAttribute('aria-busy')!=='true') throw Error('Busy feedback absent');
    }
    await page.getByRole('button',{name:'重置设置示例'}).click();
    if (await page.getByRole('checkbox',{name:'长产品名与状态'}).isChecked()) throw Error('Reset failed');
    results.push({theme,width,zoom,native,viewport,pass:true});
  }
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto(`${origin}/?fixture=settings-composition&motion=system`);
  await page.getByRole('combobox',{name:'更新状态'}).selectOption('checking');
  const system = await page.locator('.rhine-spinner').evaluate(e=>getComputedStyle(e).animationDuration);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(`${origin}/?fixture=settings-composition&motion=reduced`);
  await page.getByRole('combobox',{name:'更新状态'}).selectOption('checking');
  const manual = await page.locator('.rhine-spinner').evaluate(e=>getComputedStyle(e).animationDuration);
  return {pass:!errors.length,results,errors,reducedMotion:{system,manual}};
}
