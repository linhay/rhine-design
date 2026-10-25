// Run against a production preview: playwright-cli run-code --filename=scripts/check-dense-filters.js
async page => {
  page.setDefaultTimeout(10000);
  const origin = new URL(page.url()).origin;
  const failures = [], errors = [];
  let scenarios = 0;
  page.on('pageerror', error => errors.push(String(error)));
  const check = (pass, context) => { if (!pass) failures.push(context); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
      const context = { theme, width, zoom };
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}-${scenarios}#compact-filters`);
      await page.getByRole('heading', { name: '密集筛选控件', exact: true }).waitFor();
      await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      const tags = page.getByRole('list', { name: '部门已选项' });
      check(await tags.getByRole('listitem').count() === 2, { ...context, kind: 'bounded-tags' });
      check(await tags.evaluate(e => e.scrollWidth <= e.clientWidth + 1 && [...e.children].every(li => li.scrollWidth <= li.clientWidth + 1)), { ...context, kind: 'tags-fit' });
      await page.getByRole('button', { name: '展开已选项' }).click();
      check(await tags.getByRole('listitem').count() === 90 && await tags.evaluate(e => e.clientHeight <= 224 && e.scrollHeight > e.clientHeight), { ...context, kind: 'bounded-expansion' });
      await page.getByRole('button', { name: '移除合成部门 90', exact: true }).click();
      check(await page.getByRole('combobox', { name: '部门', exact: true }).evaluate(e => document.activeElement === e), { ...context, kind: 'remove-focus' });
      await page.getByRole('button', { name: '清空部门', exact: true }).click();
      await page.getByRole('button', { name: '全选部门', exact: true }).click();
      check(await tags.getByRole('listitem').count() === 2, { ...context, kind: 'reset-expansion' });
      const range = page.getByRole('group', { name: '日期区间', exact: true });
      const start = range.getByLabel('开始日期', { exact: true });
      await start.fill('2026-10-01'); await start.focus();
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowUp');
      check(await start.inputValue() === '2026-10-02', { ...context, kind: 'native-last-segment' });
      check(await range.evaluate(e => e.scrollWidth <= e.clientWidth + 1), { ...context, kind: 'date-fit' });
      if (width === 400 && zoom === 2) await range.screenshot({ path: `output/playwright/issue-27/date-${theme}.png` });
      const trigger = page.getByRole('button', { name: '更多筛选', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '紧凑筛选示例', exact: true });
      await dialog.evaluate(e => Promise.all(e.getAnimations().map(a => a.finished)));
      check(!await dialog.getAttribute('aria-describedby') && await dialog.locator('.rhine-list-filter-bar__feedback').count() === 0, { ...context, kind: 'omitted-feedback' });
      const segments = dialog.locator('fieldset.rhine-segmented');
      check(await segments.evaluate(e => {
        const items = [...e.querySelectorAll('label')].map(label => ({ label: label.getBoundingClientRect(), span: label.querySelector('span').getBoundingClientRect() }));
        return items.every(item => Math.abs(item.label.width - items[0].label.width) < 1 && Math.abs(item.label.width - item.span.width) < 1 && Math.abs(item.label.height - item.span.height) < 1);
      }), { ...context, kind: 'equal-segment-backgrounds' });
      await segments.getByRole('radio', { name: '今天', exact: true }).focus();
      await page.keyboard.press('ArrowRight');
      check(await segments.getByRole('radio', { name: '昨天', exact: true }).isChecked(), { ...context, kind: 'native-radio-keyboard' });
      check(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth + 1), { ...context, kind: 'drawer-fit' });
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      await trigger.waitFor();
      await page.waitForFunction(() => document.activeElement?.textContent?.includes('更多筛选'));
      for (const [state, text] of [['加载', '正在更新结果…'], ['失败', '暂时无法更新合成结果，请重试。']]) {
        await page.getByRole('button', { name: state, exact: true }).click();
        await trigger.click();
        check(await dialog.getByText(text, { exact: true }).isVisible(), { ...context, kind: `feedback-${state}` });
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      }
      scenarios++;
    }
  }
  return { pass: failures.length === 0 && errors.length === 0, scenarios, failures, errors, scope: 'Chromium, three themes, 400/520/880px, 100/200% CSS zoom; synthetic data only. Native menu zoom is not covered.' };
}
