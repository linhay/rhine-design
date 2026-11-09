// Run against a production gallery or its fresh installed-package consumer.
// ?timelineTheme=rhine&timelineMotion=reduce bounds a run; timelineProbe=inflate is a deliberate negative control.
async page => {
  page.setDefaultTimeout(7000);
  const initial = await page.evaluate(() => ({ base: location.origin + location.pathname, theme: new URL(location.href).searchParams.get('timelineTheme'), motion: new URL(location.href).searchParams.get('timelineMotion'), probe: new URL(location.href).searchParams.get('timelineProbe') })), base = initial.base;
  const failures = [], errors = [], cases = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  const check = (ok, context) => { if (!ok) failures.push(context); };
  const themes = initial.theme ? [initial.theme] : ['rhine', 'arknights', 'neo-brutalism'];
  const motions = initial.motion ? [initial.motion] : ['no-preference', 'reduce'];
  const expected = ['100 次（100%）', '重试后成功 100 次（100%）', '最终失败 100 次（100%）', '结果未知 100 次（100%）', '直接成功 70 次（70%）', '结果未知 10 次（10%）', '最终失败 1 次（<0.01%）', '直接成功 1 次（1%）', '无请求，占比不适用', '采集不完整', '缺失采集', '数据无效'];
  for (const theme of themes) for (const motion of motions) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const context = { theme, motion, width, zoom };
    try {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto(`${base}?theme=${theme}&case=${motion}-${width}-${zoom}#monitoring`);
      const slider = page.getByRole('slider', { name: '结果构成历史', exact: true });
      await slider.waitFor();
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      await slider.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      if (initial.probe === 'inflate') await page.locator('.rhine-timeline__bucket > [data-outcome=failed]').evaluateAll(elements => elements.forEach(e => { e.style.minHeight = '8px'; }));
      const geometry = await slider.evaluate(e => {
        const buckets = [...e.parentElement.querySelectorAll('.rhine-timeline__bucket')];
        return buckets.map(bucket => ({ height: bucket.getBoundingClientRect().height, parts: [...bucket.children].map(p => ({ kind: p.dataset.outcome, style: p.style.height, height: p.getBoundingClientRect().height, top: p.getBoundingClientRect().top, bottom: p.getBoundingClientRect().bottom, color: getComputedStyle(p).backgroundColor, min: getComputedStyle(p).minHeight, animation: getComputedStyle(p).animationName })) }));
      });
      check(geometry.length === 12 && geometry.every(b => Math.abs(b.height - 28 * zoom) < 0.1), { ...context, kind: 'equal-height', geometry });
      check(geometry.every(b => Math.abs(b.parts.reduce((sum, p) => sum + p.height, 0) - b.height) < 0.2 * zoom), { ...context, kind: 'exact-shares', geometry });
      check(geometry[6].parts[2].style === '0.001%' && geometry[6].parts[2].height < 0.1 * zoom && geometry[6].parts[1].height === 0, { ...context, kind: 'tiny-zero-not-inflated', geometry: geometry[6] });
      check(geometry.every(b => b.parts.every(p => p.animation === 'none' && p.min === '0px')), { ...context, kind: 'no-minimum-or-animation' });
      check(geometry[4].parts[0].top >= geometry[4].parts[1].bottom - .1 && geometry[4].parts[1].top >= geometry[4].parts[2].bottom - .1, { ...context, kind: 'bottom-to-top-order' });
      const palette = ['rgb(25, 184, 138)', 'rgb(239, 166, 41)', 'rgb(239, 100, 100)', 'rgb(197, 204, 211)'];
      check(geometry[5].parts.every((part, i) => part.color === palette[i]), { ...context, kind: 'result-colors', parts: geometry[5].parts });
      await slider.focus(); await page.keyboard.press('Home');
      for (let i = 0; i < expected.length; i++) {
        if (i) await page.keyboard.press('ArrowRight');
        const value = await slider.getAttribute('aria-valuetext');
        check(value.includes(expected[i]), { ...context, kind: 'keyboard-aria', i, value });
        const dialog = page.getByRole('dialog', { name: '结果构成历史时段详情', exact: true });
        await dialog.waitFor();
        check((await dialog.innerText()).includes(expected[i].replace(/^(直接成功|重试后成功|最终失败|结果未知) /, '')), { ...context, kind: 'detail-parity', i });
      }
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
      const popup = page.getByRole('dialog', { name: '结果构成历史时段详情', exact: true });
      await page.keyboard.press('Enter');
      check(await popup.getByRole('button', { name: '关闭时段详情' }).evaluate(e => e === document.activeElement), { ...context, kind: 'enter-detail' });
      // Read every row by scrolling within the real popup, checking clipping and text wrapping.
      for (const row of await popup.locator('dd').all()) {
        await row.scrollIntoViewIfNeeded();
        const measurement = await row.evaluate(e => {
          const r = e.getBoundingClientRect(), p = e.closest('[role=dialog]').getBoundingClientRect();
          return { visible: r.width > 0 && r.height > 0 && r.left >= p.left - 1 && r.right <= p.right + 1 && r.top >= p.top - 1 && r.bottom <= p.bottom + 1 && r.left >= 0 && r.right <= innerWidth, text: e.textContent };
        });
        check(measurement.visible, { ...context, kind: 'popup-readable', measurement });
      }
      await page.keyboard.press('Escape');
      await popup.waitFor({ state: 'hidden' });
      context.escapeImmediateFocus = await slider.evaluate(e => e === document.activeElement);
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '结果构成历史', undefined, { timeout: 2000 });
      check(await slider.evaluate(e => e === document.activeElement), { ...context, kind: 'escape-focus' });
      await page.getByRole('button', { name: '更新合成计数', exact: true }).click();
      await slider.focus();
      check((await slider.getAttribute('aria-valuetext')).includes('直接成功 50 次（50%）'), { ...context, kind: 'dynamic-update' });
      await page.keyboard.press('Escape');
      await slider.scrollIntoViewIfNeeded(); await slider.blur();
      const rect = await slider.boundingBox();
      await page.mouse.move(rect.x + rect.width * 5.5 / 12, rect.y + rect.height / 2);
      check((await slider.getAttribute('aria-valuetext')).includes('结果未知 10 次（10%）'), { ...context, kind: 'hover-selection' });
      check(await page.getByRole('slider', { name: '空构成历史', exact: true }).isDisabled() && await page.getByRole('slider', { name: '禁用构成历史', exact: true }).isDisabled(), { ...context, kind: 'empty-disabled' });
      const risk = page.getByRole('slider', { name: '自定义风险历史', exact: true });
      check((await risk.getAttribute('aria-valuetext')) === '低比例失败 · 低于 5%', { ...context, kind: 'custom-status' });
      await page.mouse.move(0, 0); await slider.focus(); await page.keyboard.press('Home');
      if (width === 400 && zoom === 2 && motion === 'reduce') await page.screenshot({ path: `output/playwright/timeline-97/${theme}-400-200.png` });
      cases.push(context);
    } catch (error) { failures.push({ ...context, kind: 'exception-or-timeout', error: String(error) }); }
  }
  for (const theme of themes) {
    try {
      await page.setViewportSize({ width: 520, height: 1000 });
      await page.goto(`${base}?theme=${theme}&case=nested#monitoring`);
      await page.mouse.move(0, 0);
      const legend = page.getByRole('list', { name: '请求结果图例', exact: true });
      const first = legend.getByRole('button', { name: '直接成功', exact: true });
      const other = legend.getByRole('button', { name: '结果未知', exact: true });
      await first.focus(); await page.keyboard.press('Enter');
      const close = page.getByRole('button', { name: '关闭直接成功规则', exact: true });
      await other.hover();
      check(await close.evaluate(e => e === document.activeElement), { theme, kind: 'legend-mixed-input' });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.textContent === '直接成功', undefined, { timeout: 2000 });
      await other.hover();
      check(await page.getByRole('dialog', { name: '结果未知规则', exact: true }).count() === 0, { theme, kind: 'legend-escape-protection' });
      await page.getByRole('button', { name: '在弹窗中查看构成', exact: true }).click();
      const outer = page.getByRole('dialog', { name: '构成详情焦点检查', exact: true });
      const nested = outer.getByRole('slider', { name: '弹窗结果构成', exact: true });
      await nested.focus(); await page.keyboard.press('Home'); await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '弹窗结果构成', undefined, { timeout: 2000 });
      check(await outer.isVisible(), { theme, kind: 'nested-escape-keeps-parent' });
      await page.keyboard.press('Escape');
      await outer.waitFor({ state: 'hidden' });
    } catch (error) { failures.push({ theme, kind: 'nested-or-legend-timeout', error: String(error) }); }
  }
  // True emulated touch input, using a context with touch enabled (not synthetic pointer events).
  const browser = page.context().browser();
  const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 400, height: 900 } });
  try {
    const touch = await touchContext.newPage();
    await touch.goto(`${base}#monitoring`);
    const slider = touch.getByRole('slider', { name: '结果构成历史', exact: true });
    await slider.scrollIntoViewIfNeeded();
    const rect = await slider.boundingBox();
    const selected = new Set();
    const dialog = touch.getByRole('dialog', { name: '结果构成历史时段详情', exact: true });
    for (let i = 0; i < expected.length; i++) {
      await touch.touchscreen.tap(rect.x + 1 + (rect.width - 2) * i / 11, rect.y + rect.height / 2);
      await dialog.waitFor();
      const index = Number(await slider.inputValue()), value = await slider.getAttribute('aria-valuetext');
      selected.add(index);
      check(value.includes(expected[index]) && (await dialog.innerText()).includes(expected[index].replace(/^(直接成功|重试后成功|最终失败|结果未知) /, '')), { kind: 'touch-details', index, value });
    }
    check(selected.size === 12, { kind: 'touch-all-buckets', selected: [...selected] });
    await dialog.getByRole('button', { name: '关闭时段详情' }).tap();
    await dialog.waitFor({ state: 'hidden' });
  } catch (error) { failures.push({ kind: 'touch-timeout', error: String(error) }); }
  finally { await touchContext.close(); page.off('pageerror', onError); }
  return { pass: failures.length === 0 && errors.length === 0, cases, failures, errors, browser: browser.version(), scope: 'Production Chromium, synthetic host data, CSS zoom 100/200%, emulated touch and reduced motion; native zoom, screen-reader speech and backend deduplication not verified.' };
}
