// Run with playwright-cli run-code --filename after opening the production fixture.
// Uses the theme in the current URL; execute once for each of the three themes.
async page => {
  const base = new URL(page.url());
  const theme = base.searchParams.get('theme') || 'rhine';
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const result = [];
  for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width, height: 900 });
    base.searchParams.set('fixture', 'object-reading');
    base.searchParams.set('zoom', String(zoom));
    await page.goto(base.href);
    await page.getByRole('searchbox', { name: '搜索名称' }).fill('观察');
    await page.getByRole('combobox', { name: '类型', exact: true }).selectOption('note');
    const entry = page.getByRole('button', { name: /^阅读：河谷观察笔记/ });
    await entry.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await page.waitForTimeout(200);
    assert(await dialog.count() === 1, 'one dialog');
    assert(await dialog.getByRole('button', { name: '关闭对话框' }).count() === 1, 'one close');
    const bounds = await dialog.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, center: r.x + r.width / 2, overflow: el.scrollWidth - el.clientWidth, viewport: innerWidth };
    });
    assert(bounds.x >= 0 && bounds.right <= width + 1 && bounds.y >= 0 && bounds.bottom <= 901, `bounds ${JSON.stringify(bounds)}`);
    assert(Math.abs(bounds.center - width / 2) < 2 && bounds.overflow < 2, `center/overflow ${JSON.stringify(bounds)}`);
    for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 8; i++) {
      await page.keyboard.press(key);
      assert(await dialog.evaluate(el => el.contains(document.activeElement)), `${key} focus escapes`);
    }
    await dialog.getByRole('button', { name: '关闭对话框' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `output/playwright/reading-${theme}-${width}-${zoom}.png` });
    const end = dialog.getByTestId('reading-end');
    await end.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const position = await dialog.evaluate(el => el.scrollTop);
    assert(position > 0, 'long content scroll');
    const endBounds = await end.boundingBox();
    assert(endBounds && endBounds.y >= 0 && endBounds.y + endBounds.height <= 901, 'last paragraph reachable');
    await dialog.getByRole('button', { name: '查看关联', exact: true }).click();
    assert(await dialog.getByRole('tab', { name: '关联', exact: true }).evaluate(el => el === document.activeElement && !el.closest('[hidden]')), 'bottom jump has visible tab focus');
    const target = width === 520 ? '对话' : '目标';
    await dialog.getByRole('button', { name: `打开关联${target}` }).click();
    const heading = page.getByRole('heading', { name: target === '目标' ? '目标：河谷资料整理' : '对话：河谷观察讨论' });
    await heading.waitFor();
    await page.waitForFunction(() => document.activeElement?.tagName === 'H3');
    assert(await dialog.count() === 0, 'dialog closes for destination');
    await page.getByRole('button', { name: '返回工作空间' }).click();
    assert(await entry.evaluate(el => el === document.activeElement), 'return entry focus');
    assert(await page.getByRole('searchbox').inputValue() === '观察', 'query restored');
    assert(await page.getByRole('combobox', { name: '类型', exact: true }).inputValue() === 'note', 'type restored');
    assert(await page.getByRole('combobox', { name: '目录', exact: true }).inputValue() === 'research', 'folder restored');
    await page.keyboard.press('Enter');
    await dialog.waitFor();
    assert(await dialog.getByRole('tab', { name: '关联', exact: true }).getAttribute('aria-selected') === 'true', 'tab restored');
    await dialog.getByRole('tab', { name: '正文', exact: true }).click();
    await page.waitForTimeout(80);
    const restored = await dialog.evaluate(el => el.scrollTop);
    assert(restored >= position - 2, `reading position restored ${restored}/${position}`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label')?.startsWith('阅读：'));
    assert(await entry.evaluate(el => el === document.activeElement), 'Escape entry focus');
    assert((await page.getByTestId('reading-invariants').innerText()).includes('内容版本未修改 · 收件状态：未读'), 'read invariants');
    await entry.click();
    await dialog.getByRole('tab', { name: '来源', exact: true }).click();
    const path = dialog.getByRole('tabpanel');
    assert(await path.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'long source path wraps');
    await dialog.getByRole('button', { name: '关闭对话框' }).click();
    await dialog.waitFor({ state: 'detached' });
    result.push({ theme, width, cssZoom: zoom, status: 'PASS', position, restored });
  }
  return result;
}
