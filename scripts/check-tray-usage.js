// Start on this revision's production preview. native=1 expects Chrome's real page zoom already set to 200%.
async page => {
  const origin = page.url().split('/').slice(0,3).join('/'), native = page.url().includes('native=1'), results = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const panel = () => page.getByRole('dialog',{name:'账号与用量概览'});
  const account = () => panel().getByRole('combobox',{name:'Agent A 当前账号'});
  const open = async () => { if (!await panel().isVisible()) await page.getByRole('button',{name:'切换用量面板'}).click(); await panel().waitFor(); await page.waitForTimeout(200); };
  const close = async () => { if (await panel().isVisible()) { await page.keyboard.press('Escape'); await panel().waitFor({state:'detached',timeout:3000}); } };
  const size = () => page.getByTestId('switch-feedback').evaluate(e=>({h:e.getBoundingClientRect().height,content:e.closest('[data-testid="tray-panel"]').scrollHeight}));
  const bounds = async () => {
    const b = await panel().evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:innerWidth,height:innerHeight};});
    if (b.x < -1 || b.y < -1 || b.right > b.width+1 || b.bottom > b.height+1) throw Error(`Popover bounds ${JSON.stringify(b)}`);
  };
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of (native ? [1] : [1,2])) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`${origin}/?fixture=tray-usage&theme=${theme}&zoom=${zoom}`);
    await panel().waitFor();
    if (await panel().locator('.rhine-dialog__head').count()) throw Error('Visible header retained');
    await close(); await page.getByRole('checkbox',{name:'长账号名',exact:true}).check(); await open();
    await close(); await page.getByRole('checkbox',{name:'首次切换失败',exact:true}).check(); await open();
    const other = await page.getByTestId('other-agent').textContent(), summary = await page.getByTestId('usage-summary').textContent(), before = await size();
    await account().selectOption('b');
    if (await account().inputValue() !== 'a' || !await account().isDisabled()) throw Error('Unconfirmed account committed');
    const busy = await size();
    await panel().getByRole('alert').waitFor();
    const failed = await size();
    if (await account().inputValue() !== 'a') throw Error('Failure changed account');
    if (!((await page.getByTestId('request-count').textContent()) || '').endsWith('1')) throw Error('Duplicate request');
    await panel().getByRole('button',{name:'重试切换'}).click();
    await page.waitForFunction(()=>document.querySelector('[data-testid="current-account"]')?.textContent?.startsWith('协作账号 B'));
    const success = await size();
    if ([busy,failed,success].some(s=>Math.abs(s.h-before.h)>1 || Math.abs(s.content-before.content)>1)) throw Error(`Unstable heights ${JSON.stringify({before,busy,failed,success})}`);
    if (await page.getByTestId('other-agent').textContent() !== other || await page.getByTestId('usage-summary').textContent() !== summary) throw Error('Other data changed');
    await bounds();
    await account().focus(); await page.keyboard.press('Escape'); await panel().waitFor({state:'detached',timeout:3000});
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='切换用量面板');
    await page.keyboard.press('Enter'); await panel().waitFor();
    await page.getByRole('button',{name:'切换用量面板'}).click(); await panel().waitFor({state:'detached',timeout:3000});
    await open();
    await page.mouse.click(5,5); await panel().waitFor({state:'detached',timeout:3000});
    await open();
    for (const state of ['loading','low','unknown','stale','connecting','unmatched','signed-out','shared']) {
      await close(); await page.getByRole('combobox',{name:'用量场景'}).selectOption(state); await open();
      if (['loading','stale','connecting','unmatched'].includes(state) && !await account().isDisabled()) throw Error(`Unavailable ${state}`);
      if (state==='unknown' && await panel().getByRole('progressbar').count()) throw Error('Unknown shown as progress');
      if (state==='stale' && !(await panel().textContent()).includes('上次数据 · 目录已过期')) throw Error('Cache not marked');
      if (state==='signed-out' && /研究账号|协作账号|1.28|128|61%/.test(await panel().textContent())) throw Error('Logged out data leak');
      if (state==='shared') {
        await panel().getByText('2026-10 周期剩余 未知',{exact:true}).scrollIntoViewIfNeeded();
        await page.getByTestId('usage-summary').scrollIntoViewIfNeeded();
        const scrolled = await panel().evaluate(e=>e.scrollTop>0 && e.scrollHeight>e.clientHeight);
        if (!scrolled) throw Error('Shared members not scrollable');
      }
      await bounds();
    }
    await close(); await page.getByRole('button',{name:'重置托盘示例'}).click(); await open();
    if (await account().inputValue()!=='a' || await page.getByRole('checkbox',{name:'长账号名',exact:true}).isChecked()) throw Error('Reset failed');
    results.push({theme,width,zoom,native,viewport:await page.evaluate(()=>({width:innerWidth,zoom:getComputedStyle(document.documentElement).zoom,dpr:devicePixelRatio})),pass:true,heights:{before,busy,failed,success}});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`${origin}/?fixture=tray-usage&motion=system`); await panel().waitFor();
  const system = await panel().evaluate(e=>getComputedStyle(e).animationDuration);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(`${origin}/?fixture=tray-usage&motion=reduced`); await panel().waitFor();
  const manual = await panel().evaluate(e=>getComputedStyle(e).animationDuration);
  if (parseFloat(system) > 0.01 || parseFloat(manual)>0.01) throw Error('Reduced motion ignored');
  return {pass:!errors.length,results,errors,reducedMotion:{system,manual}};
}
