// Regression for the interval between a nested popup closing and its modal scope resuming.
async page => {
  const origin = new URL(page.url()).origin, cases = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${origin}/?theme=${theme}#compact-filters`); await page.reload();
    await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
    await page.getByRole('button', { name: '在弹窗内选择', exact: true }).click();
    const input = page.getByRole('combobox', { name: '弹窗部门', exact: true });
    await input.click(); await input.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    const immediateInside = await page.getByRole('dialog').evaluate(element => element.contains(document.activeElement));
    // Assert the fast path before waiting; then separately verify normal navigation resumes.
    await page.waitForTimeout(50);
    const close = page.getByRole('button', { name: '关闭对话框', exact: true });
    await close.focus(); await page.keyboard.press('Shift+Tab');
    const resumed = await page.getByRole('dialog').evaluate(element => element.contains(document.activeElement) && document.activeElement?.getAttribute('aria-label') !== '关闭对话框');
    cases.push({ theme, width, zoom, immediateInside, resumed });
  }
  return { pass: cases.every(item => item.immediateInside && item.resumed) && !errors.length, cases, errors };
}
