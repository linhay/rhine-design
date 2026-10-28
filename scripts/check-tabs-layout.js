// Run against the production gallery with playwright-cli run-code --filename.
// CSS zoom affects the outer gallery document; this gallery contains no iframe.
async page => {
  const origin = new URL(page.url()).origin, failures = [], cases = [], errors = [];
  const check = (ok, context) => { if (!ok) failures.push(context); };
  page.on('pageerror', error => errors.push(String(error)));
  page.setDefaultTimeout(10000);
  const measure = () => page.locator('[data-tabs-layout]').evaluateAll(elements => elements.map(root => {
    const list = root.querySelector('[role=tablist]'), panel = root.querySelector('[role=tabpanel]:not([hidden])');
    const rect = el => { const r = el.getBoundingClientRect(); return {x:r.x, width:r.width}; };
    return { id: root.dataset.tabsLayout, list: rect(list), panel: rect(panel), fits: root.scrollWidth <= root.clientWidth + 1,
      buttons: [...list.querySelectorAll('button')].map(button => {
        const style = getComputedStyle(button), line = getComputedStyle(button, '::after');
        const range = document.createRange(); range.selectNodeContents(button);
        return { ...rect(button), cssWidth: parseFloat(style.width), textWidth: range.getBoundingClientRect().width,
          flexGrow: style.flexGrow, align: style.textAlign, lineWidth: parseFloat(line.width), transform: line.transform,
          lineVisible: line.transform === 'matrix(1, 0, 0, 1, 0, 0)', selected: button.getAttribute('aria-selected') === 'true', fits: button.scrollWidth <= button.clientWidth + 1 };
      }) };
  }));
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const label = `${theme}/${width}/css${zoom * 100}`;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?theme=${theme}&case=${width}-${zoom}#summary-tabs`);
    await page.getByRole('tablist', { name: '满栏靠左', exact: true }).waitFor();
    await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
    await page.waitForTimeout(220);
    const normal = await measure();
    for (const result of normal) {
      check(result.fits && result.buttons.every(button => button.fits), { label, kind: 'fits', result });
      check(Math.abs(result.buttons[0].x - result.list.x) < 1, { label, kind: 'first-at-start', result });
      if (result.id !== 'content') check(Math.abs(result.list.width - result.panel.width) < 1, { label, kind: 'full-bar', result });
      if (result.id === 'full') {
        check(result.buttons.every(button => button.flexGrow === '0' && button.align === 'start'), { label, kind: 'content-alignment', result });
        // A short label must keep its intrinsic width whenever it fits on one line.
        const first = result.buttons[0];
        if (first.cssWidth >= 56) check(Math.abs(first.width - first.textWidth) < 1, { label, kind: 'intrinsic-button', result });
      }
      if (result.id === 'fill') check(Math.max(...result.buttons.map(b => b.width)) - Math.min(...result.buttons.map(b => b.width)) < 1, { label, kind: 'equal-fill', result });
      check(result.buttons.every(button => Math.abs(button.lineWidth - button.cssWidth) < 1 && button.lineVisible === button.selected), { label, kind: 'line-follows-button', result });
    }
    const group = page.locator('[data-tabs-layout=full]');
    const first = group.getByRole('tab', { name: '当前对象', exact: true });
    const last = group.getByRole('tab', { name: '自定义范围', exact: true });
    await group.getByRole('textbox').fill('合成草稿');
    await first.focus();
    for (const [key, name] of [['ArrowLeft', '自定义范围'], ['ArrowRight', '当前对象'], ['End', '自定义范围'], ['Home', '当前对象']]) {
      await page.keyboard.press(key);
      check(await group.getByRole('tab', { name, exact: true }).evaluate(el => el === document.activeElement && el.getAttribute('aria-selected') === 'true'), { label, kind: key });
      check(await page.locator('[data-tabs-layout] [role=tab][aria-selected=true]').count() === 3, { label, kind: 'controlled-sync' });
    }
    check(await group.getByRole('textbox').inputValue() === '合成草稿', { label, kind: 'draft-preserved' });
    check(await group.getByRole('tab', { name: '暂不可用' }).isDisabled(), { label, kind: 'disabled' });
    await last.click(); await page.waitForTimeout(220);
    check(await group.getByRole('tabpanel').evaluate(el => el.getAttribute('aria-labelledby') === document.querySelector('[data-tabs-layout=full] [aria-selected=true]').id), { label, kind: 'panel-relation' });
    check(await group.locator('[role=tabpanel][hidden]').count() === 2 && await group.getByRole('textbox').count() === 0, { label, kind: 'hidden-panel' });
    await page.getByLabel('布局对比标签').selectOption('long'); await page.waitForTimeout(220);
    const long = await measure();
    check(long.every(result => result.fits && result.buttons.every(button => button.fits && Math.abs(button.lineWidth - button.cssWidth) < 1 && button.lineVisible === button.selected)), { label, kind: 'long-fits', long });
    if (width === 400 && zoom === 2) {
      await group.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `output/playwright/tabs-${theme}.png` });
    }
    cases.push({ label, normal, long });
  }
  const detailed = [];
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    await page.setViewportSize({ width: 400, height: 1000 });
    await page.goto(`${origin}/?theme=${theme}&detailed=1#summary-tabs`);
    await page.getByLabel('摘要布局').selectOption('full');
    await page.getByLabel('摘要页签场景').selectOption('long');
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const list = page.getByRole('tablist', { name: '摘要页签规范示例' });
    const result = await list.evaluate(el => ({
      width: el.getBoundingClientRect().width, panelWidth: el.nextElementSibling.getBoundingClientRect().width,
      fits: el.scrollWidth <= el.clientWidth + 1,
      start: el.firstElementChild.getBoundingClientRect().left - el.getBoundingClientRect().left,
    }));
    check(result.fits && Math.abs(result.width - result.panelWidth) < 1 && Math.abs(result.start) < 1, { kind: 'detailed-full', theme, result });
    await page.getByLabel('摘要页签场景').selectOption('disabled');
    const first = list.getByRole('tab', { name: '主工作区', exact: true });
    await first.focus(); await page.keyboard.press('End');
    check(await first.evaluate(el => el === document.activeElement && el.getAttribute('aria-selected') === 'true'), { kind: 'detailed-disabled', theme });
    detailed.push({ theme, result });
  }
  const motion = [];
  for (const mode of ['system', 'manual']) {
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await page.locator('.rhine-theme').first().evaluate((el, mode) => el.setAttribute('data-rhine-motion', mode === 'manual' ? 'reduced' : 'system'), mode);
    const result = await page.locator('[data-tabs-layout=full]').evaluate(el => ({
      panel: getComputedStyle(el.querySelector('[role=tabpanel]:not([hidden])')).animationName,
      line: getComputedStyle(el.querySelector('[aria-selected=true]'), '::after').transitionDuration,
    }));
    check(result.panel === 'none' && result.line === '0s', { kind: 'reduced-motion', mode, result });
    motion.push({ mode, ...result });
  }
  return { pass: failures.length === 0 && errors.length === 0, failures, errors, cases, detailed, motion, browser: await page.evaluate(() => navigator.userAgent) };
}
