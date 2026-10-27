// Production preview, isolated playwright-cli session; synthetic data only.
async page => {
  page.setDefaultTimeout(8000);
  const origin = new URL(page.url()).origin;
  const failures = [], errors = [], samples = [];
  page.on('pageerror', error => errors.push(String(error)));
  const check = (ok, context) => { if (!ok) failures.push(context); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width: 1100, height: 1000 });
    await page.goto(`${origin}/?theme=${theme}#single-search`);
    await page.getByRole('searchbox', { name: '搜索合成条目' }).waitFor();
    await page.getByLabel('搜索容器宽度').selectOption(String(width));
    await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
    const input = page.getByRole('searchbox', { name: '搜索合成条目', exact: true });
    const context = { theme, width, zoom };
    check(await page.locator('[data-search-example] button').count() === 0, { ...context, kind: 'input-only' });
    const typography = await input.evaluate(el => { const s = getComputedStyle(el), p = getComputedStyle(el, '::placeholder'); return { size: s.fontSize, line: s.lineHeight, weight: s.fontWeight, placeholder: p.fontSize, height: el.offsetHeight, fits: el.parentElement.scrollWidth <= el.parentElement.clientWidth + 1 }; });
    check(typography.size === '14px' && typography.line === '22px' && typography.weight === '400' && typography.placeholder === '14px' && typography.height >= 44 && typography.fits, { ...context, kind: 'body-type-and-bounds', typography });
    await page.getByLabel('搜索场景').selectOption('long');
    await input.fill('跨区域联合研究项目中的长中文合成查询'.repeat(5));
    await page.getByRole('status').filter({ hasText: '找到' }).waitFor();
    check(await input.evaluate(el => el.getBoundingClientRect().right <= el.parentElement.getBoundingClientRect().right + 1), { ...context, kind: 'long-query' });
    await input.press('Escape'); check(await input.inputValue() === '' && await input.evaluate(el => document.activeElement === el), { ...context, kind: 'clear-focus' });
    for (const [state, message] of [['loading', '正在搜索'], ['empty', '没有匹配结果'], ['error', '搜索失败']]) {
      await page.getByLabel('搜索场景').selectOption(state); await input.fill('合成查询');
      await page.getByRole('status').filter({ hasText: message }).waitFor();
      check(!!await input.getAttribute('aria-describedby'), { ...context, kind: `description-${state}` });
    }
    await page.getByLabel('搜索场景').selectOption('disabled'); check(await input.isDisabled(), { ...context, kind: 'disabled' });
    if (width === 400 && zoom === 2) await page.screenshot({ path: `output/playwright/search-${theme}.png` });
    samples.push({ ...context, typography });
  }
  for (const reduced of [false, true]) {
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto(`${origin}/#single-search`);
    await page.getByRole('searchbox').fill('动效偏好');
    await page.getByRole('status').filter({ hasText: '找到' }).waitFor();
  }
  await page.getByRole('radio', { name: '减少动态', exact: true }).check();
  await page.getByRole('searchbox').press('Escape');
  check(await page.getByRole('searchbox').inputValue() === '', { kind: 'manual-reduced-clear' });
  return { pass: !failures.length && !errors.length, failures, errors, samples, scope: 'Production Chromium, 3 themes × 400/520/880 container × CSS zoom 1/2. OS IME and native zoom recorded separately.' };
}
