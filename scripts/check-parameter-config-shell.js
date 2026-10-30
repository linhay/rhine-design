// Run on a production source gallery. Observes only the synthetic 600ms request timer.
async page => {
  const base = page.url().split('/').slice(0, 3).join('/');
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.addInitScript(() => {
    const originalSet = window.setTimeout, originalClear = window.clearTimeout;
    window.__parameterRequests = new Set();
    window.setTimeout = function (callback, delay, ...args) {
      if (delay !== 600) return originalSet(callback, delay, ...args);
      const id = originalSet(() => { window.__parameterRequests.delete(id); callback(...args); }, delay);
      window.__parameterRequests.add(id); return id;
    };
    window.clearTimeout = function (id) { window.__parameterRequests.delete(id); return originalClear(id); };
  });
  await page.setViewportSize({ width: 880, height: 900 }); await page.goto(`${base}/#parameter-config`);
  const input = page.getByLabel('统一版本', { exact: true }); await input.fill('20.0.0');
  const handle = await input.elementHandle(), preservation = [];
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('combobox', { name: '界面主题', exact: true }).selectOption(theme);
    assert(await handle.evaluate(e => e.isConnected && e.value === '20.0.0'), 'theme/resize remounted or lost draft');
    preservation.push({ theme, width });
  }
  await page.getByRole('button', { name: '核对并提交' }).click();
  await page.getByRole('button', { name: '确认提交', exact: true }).click();
  assert(await page.evaluate(() => window.__parameterRequests.size === 1), 'request timer was not observed');
  await page.evaluate(() => { location.hash = 'foundation'; });
  await page.getByRole('heading', { name: '参数与生成预览', exact: true }).waitFor({ state: 'detached' });
  assert(await page.evaluate(() => window.__parameterRequests.size === 0), 'unmount retained request timer');
  await page.waitForTimeout(750); await page.evaluate(() => { location.hash = 'parameter-config'; });
  await page.getByRole('heading', { name: '参数与生成预览', exact: true }).waitFor();
  assert(await input.inputValue() === '12.4.0', 'old request affected remounted gallery');
  return { pass: true, preservation, unmountRequestCleared: true };
}
