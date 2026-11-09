// Run against a production build; ?probe=round is a deliberate label regression.
async page => {
  const base = await page.evaluate(() => location.origin + location.pathname);
  const probe = await page.evaluate(() => new URL(location.href).searchParams.get('probe'));
  const failures = [], cases = [];
  for (const theme of ['rhine', 'neutral', 'arknights', 'neo-brutalism', 'graphite']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const context = { theme, width, zoom };
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: zoom === 2 ? 'reduce' : 'no-preference' });
    await page.goto(`${base}?theme=${theme}#monitoring`);
    const select = page.getByLabel('占比边界场景', { exact: true });
    await select.waitFor();
    await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
    const chart = page.getByRole('figure', { name: '合成互斥结果构成', exact: true });
    if (probe === 'round') await chart.locator('li').evaluateAll(items => items.forEach((item, i) => { const text = [...item.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.includes('（')); if (text) text.textContent = i ? '（100.0%）' : '（0.0%）'; }));
    const text = await chart.innerText();
    if (!text.includes('0.01%') || !text.includes('99.99%')) failures.push({ ...context, kind: 'boundary-text', text });
    const weights = await chart.locator('.rhine-chart__stack > span').evaluateAll(items => items.map(e => ({ weight: Number(e.style.flexGrow), min: getComputedStyle(e).minWidth })));
    if (weights.length !== 2 || weights[0].weight !== .0001 || weights.some(item => item.min !== '0px')) failures.push({ ...context, kind: 'exact-weight', weights });
    for (const item of await chart.locator('li').all()) {
      await item.scrollIntoViewIfNeeded();
      const measurement = await item.evaluate(e => {
        const range = document.createRange(); range.selectNodeContents(e);
        const rects = [...range.getClientRects()].filter(r => r.width && r.height);
        const clips = [];
        for (let p = e; p; p = p.parentElement) {
          const s = getComputedStyle(p), r = p.getBoundingClientRect();
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX + s.overflowY)) clips.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        const visible = rects.every(r => r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1 && clips.every(c => r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1));
        return { visible, text: e.textContent, lines: rects.length };
      });
      if (!measurement.visible) failures.push({ ...context, kind: 'clipped-legend', measurement });
    }
    await select.focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Escape'); await page.keyboard.press('Shift+Tab');
    if (!await select.evaluate(e => e === document.activeElement)) failures.push({ ...context, kind: 'keyboard-tab-return' });
    await select.selectOption('extreme');
    if (!(await chart.innerText()).includes('<0.01%') || !(await chart.innerText()).includes('>99.99%')) failures.push({ ...context, kind: 'extreme-text' });
    for (const [value, expected] of [['zero', '100.0%'], ['third', '33.3%'], ['unknown', '总量未知'], ['negative', '包含负数'], ['all-zero', '总量为 0'], ['nonfinite', '总量未知']]) {
      await select.selectOption(value);
      if (!(await chart.innerText()).includes(expected)) failures.push({ ...context, kind: value });
    }
    await select.selectOption('tiny');
    cases.push(context);
  }
  return { pass: !failures.length, cases, failures, browser: page.context().browser().version(), input: 'Playwright browser keyboard; CSS zoom; no screen-reader or OS input claim' };
}
