// Run against the production gallery: playwright-cli run-code --filename scripts/check-tabs-actions.js.
// This measures CSS zoom, not native browser zoom. Data and operations are local synthetic examples.
async page => {
  const origin = new URL(page.url()).origin, failures = [], cases = [], errors = [];
  const check = (ok, context) => { if (!ok) failures.push(context); };
  page.on('pageerror', error => errors.push(String(error)));
  page.setDefaultTimeout(10000);
  const list = () => page.getByRole('tablist', { name: '栏内操作示例', exact: true });
  const root = () => list().locator('..').locator('..');
  const add = () => page.getByRole('button', { name: '新增示例', exact: true });
  const refresh = () => page.getByRole('button', { name: '刷新示例', exact: true });
  const selected = name => list().getByRole('tab', { name, exact: true });
  const measure = () => root().evaluate(el => {
    const header = el.querySelector('.rhine-tabs__header'), hr = header.getBoundingClientRect(), rr = el.getBoundingClientRect();
    const buttons = [...header.querySelectorAll('[role=group] button')], rects = buttons.map(b => b.getBoundingClientRect());
    const tabs = [...header.querySelectorAll('[role=tab]')];
    const panel = el.querySelector('[role=tabpanel]:not([hidden])');
    return { width: rr.width, headerWidth: hr.width, line: parseFloat(getComputedStyle(header).borderBottomWidth),
      fits: el.scrollWidth <= el.clientWidth + 1 && tabs.every(b => b.scrollWidth <= b.clientWidth + 1),
      outsideTablist: buttons.every(b => !b.closest('[role=tablist]')),
      targets: rects.map(r => ({ width:r.width, height:r.height })),
      glyphs: buttons.map(b => { const r = b.querySelector('svg').getBoundingClientRect(); return { width:r.width, height:r.height }; }),
      inside: rects.every(r => r.left >= hr.left - 1 && r.right <= hr.right + 1),
      gap: rects[1].left - rects[0].right,
      overlap: rects[0].right > rects[1].left + .5 && rects[0].bottom > rects[1].top + .5,
      lines: tabs.map(b => ({ width:parseFloat(getComputedStyle(b).width), lineWidth:parseFloat(getComputedStyle(b,'::after').width), visible:getComputedStyle(b,'::after').transform === 'matrix(1, 0, 0, 1, 0, 0)', selected:b.getAttribute('aria-selected') === 'true' })),
      panelPadding: parseFloat(getComputedStyle(panel).paddingTop), realPanel: Boolean(panel.querySelector('input')),
    };
  });
  await page.goto(`${origin}/?theme=rhine#summary-tabs`);
  await list().waitFor();
  for (const theme of ['rhine', 'arknights', 'neo-brutalism', 'neutral']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const label = `${theme}/${width}/css${zoom * 100}`;
    await page.getByRole('combobox', { name:'界面主题', exact:true }).selectOption(theme);
    await page.getByLabel('局部容器宽度', { exact:true }).selectOption('100%');
    await page.setViewportSize({ width, height:1100 });
    await page.evaluate(z => { document.documentElement.style.zoom = String(z); }, zoom);
    for (const style of ['plain','detailed']) for (const scenario of ['normal','long']) {
      await page.getByLabel('操作页签样式').selectOption(style);
      await page.getByLabel('摘要页签场景').selectOption(scenario);
      await page.waitForTimeout(220);
      const result = await measure();
      check(Math.abs(result.width - result.headerWidth) < 1 && result.line === 1 && result.inside && !result.overlap && result.outsideTablist && result.fits && result.realPanel, { label, style, scenario, kind:'header', result });
      check(result.targets.every(r => Math.abs(r.width - 44 * zoom) < 1 && Math.abs(r.height - 44 * zoom) < 1) && Math.abs(result.gap) < 1, { label, style, scenario, kind:'44px-adjacent-targets', result });
      check(result.glyphs.every(r => Math.abs(r.width - 20 * zoom) < 1 && Math.abs(r.height - 20 * zoom) < 1), { label, style, scenario, kind:'20px-glyphs', result });
      check(result.lines.every(l => Math.abs(l.width-l.lineWidth)<1 && l.visible === l.selected) && result.panelPadding === (style === 'plain' ? 20 : 24), { label, style, scenario, kind:'indicator-and-spacing', result });
      cases.push({ label, style, scenario, result });
    }
    await page.getByLabel('摘要页签场景').selectOption('normal');
    await add().click(); await page.getByRole('dialog', { name:'新增项目示例', exact:true }).waitFor();
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state:'hidden' });
    await page.waitForTimeout(220);
    check(await add().evaluate(el => document.activeElement === el), { label, kind:'dialog-escape-return' });
    if (width === 400 && zoom === 2) {
      await root().scrollIntoViewIfNeeded();
      await page.screenshot({ path:`output/playwright/tabs-actions-${theme}.png` });
    }
  }
  await page.setViewportSize({ width:1440, height:1100 });
  await page.evaluate(() => { document.documentElement.style.zoom = '1'; });
  await page.getByLabel('摘要页签场景').selectOption('normal');
  await root().getByRole('textbox', { name:'项目操作草稿', exact:true }).fill('合成草稿');
  await selected('项目').focus(); await page.keyboard.press('ArrowRight');
  check(await selected('协作').evaluate(el => document.activeElement === el && el.getAttribute('aria-selected') === 'true'), { kind:'arrow-switch' });
  await page.keyboard.press('Tab'); check(await add().evaluate(el => document.activeElement === el), { kind:'tab-to-actions' });
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home'); await page.keyboard.press('End');
  check(await selected('协作').getAttribute('aria-selected') === 'true', { kind:'actions-keyboard-isolation' });
  await page.keyboard.press('Tab'); check(await refresh().evaluate(el => document.activeElement === el), { kind:'tab-second-action' });
  await refresh().press('Enter');
  await selected('项目').click();
  check(await root().getByRole('textbox', { name:'项目操作草稿', exact:true }).inputValue() === '合成草稿', { kind:'draft-preserved' });
  check((await root().getByRole('tabpanel').textContent()).includes('已模拟刷新 1 次'), { kind:'refresh-result' });
  await selected('协作').click();
  for (const key of ['Tab', 'Shift+Tab']) {
    await selected('协作').focus();
    for (let i=0; i<8; i++) {
      await page.keyboard.press(key);
      check(await page.evaluate(() => !document.activeElement?.closest('[role=tabpanel][hidden]')), { kind:'inactive-panel-tab', key, i });
    }
  }
  await selected('项目').click();
  await add().click(); await page.getByRole('textbox', { name:'新项目名称', exact:true }).fill('合成项目');
  await page.getByRole('button', { name:'确认新增示例', exact:true }).click(); await page.getByRole('dialog').waitFor({ state:'hidden' }); await page.waitForTimeout(220);
  check(await add().evaluate(el => document.activeElement === el) && (await root().textContent()).includes('本地项目 3 个'), { kind:'create-and-return' });
  await page.getByLabel('摘要页签场景').selectOption('loading');
  const busy = refresh(); await busy.focus();
  const before = await root().textContent(); await busy.press('Enter'); await busy.press('Space');
  check(await busy.getAttribute('aria-busy') === 'true' && await busy.evaluate(el => document.activeElement === el) && await root().textContent() === before, { kind:'busy-focus-and-inert' });
  const motion = [];
  for (const mode of ['normal','system','manual']) {
    await page.emulateMedia({ reducedMotion:mode === 'system' ? 'reduce' : 'no-preference' });
    await page.getByRole('radio', { name:mode === 'manual' ? '减少动态' : '跟随系统', exact:true }).check();
    const animation = await busy.locator('.rhine-spinner').evaluate(el => getComputedStyle(el).animationName);
    check(mode === 'normal' ? animation !== 'none' : animation === 'none', { kind:'motion', mode, animation });
    await add().click(); await page.getByRole('dialog', { name:'新增项目示例', exact:true }).waitFor();
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state:'hidden' }); await page.waitForTimeout(220);
    check(await add().evaluate(el => document.activeElement === el), { kind:'motion-dialog-return', mode });
    await busy.focus(); await busy.press('Enter');
    check(await busy.evaluate(el => document.activeElement === el) && await root().textContent() === before, { kind:'motion-busy-inert', mode });
    motion.push({ mode, animation });
  }
  await page.getByLabel('摘要页签场景').selectOption('disabled');
  check(await add().isDisabled() && await refresh().isDisabled() && await selected('协作').isDisabled(), { kind:'disabled' });
  await selected('项目').focus(); await page.keyboard.press('End');
  check(await selected('项目').evaluate(el => document.activeElement === el), { kind:'disabled-tab-skip' });
  await page.keyboard.press('Tab');
  check(!await add().evaluate(el => document.activeElement === el) && !await refresh().evaluate(el => document.activeElement === el), { kind:'disabled-actions-skip' });
  await page.getByLabel('摘要页签场景').selectOption('normal');
  const header = root().locator('.rhine-tabs__header');
  await header.evaluate(el => { el.style.borderBottomWidth = '0px'; });
  const counterexampleDetected = (await measure()).line !== 1;
  await header.evaluate(el => { el.style.removeProperty('border-bottom-width'); });
  check(counterexampleDetected && (await measure()).line === 1, { kind:'missing-divider-counterexample' });
  return { pass:failures.length === 0 && errors.length === 0, failures, errors, cases, motion, counterexampleDetected, browser:await page.evaluate(() => navigator.userAgent) };
}
