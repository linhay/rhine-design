// Open the built gallery first; run with playwright-cli run-code --filename.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const cases = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${origin}/?theme=${theme}#compact-filters`);
    await page.reload();
    await page.getByRole('heading', { name: '密集筛选控件', exact: true }).waitFor();
    await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
    await page.getByRole('button', { name: '在弹窗内选择', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '搜索多选', exact: true });
    const input = dialog.getByRole('combobox', { name: '弹窗部门', exact: true });
    await input.fill('合成部门 99');
    const option = page.getByRole('option', { name: '合成部门 99', exact: true });
    await option.click();
    if (await option.getAttribute('aria-selected') !== 'true') throw Error('selection failed');
    await option.click();
    if (await option.getAttribute('aria-selected') !== 'false') throw Error('pointer deselection failed');
    await input.press('ArrowDown'); await input.press('Enter');
    if (await option.getAttribute('aria-selected') !== 'true') throw Error('keyboard selection failed');
    await input.press('ArrowDown'); await input.press('Enter');
    if (await option.getAttribute('aria-selected') !== 'false') throw Error('keyboard deselection failed');
    await option.click();
    const done = page.getByRole('button', { name: '完成选择', exact: true });
    const popup = await done.evaluate(el => { const r = el.closest('.rhine-combobox__list').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight }; });
    if (popup.left < -1 || popup.right > popup.width + 1 || popup.top < -1 || popup.bottom > popup.height + 1) throw Error(`popup outside viewport: ${JSON.stringify({ theme, width, zoom, popup })}`);
    await done.click();
    await page.getByRole('listbox').waitFor({ state: 'detached' });
    if (!await input.evaluate(el => el === document.activeElement)) throw Error('completion lost focus');
    if (!await dialog.isVisible() || await input.inputValue() !== '合成部门 99') throw Error('completion changed draft/dialog');
    await input.fill('');
    await page.getByRole('option', { name: '合成部门 99', exact: true }).waitFor();
    await done.scrollIntoViewIfNeeded();
    const rect = await done.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight }; });
    if (rect.left < -1 || rect.right > rect.width + 1 || rect.top < -1 || rect.bottom > rect.height + 1) throw Error(`completion outside viewport: ${JSON.stringify({ theme, width, zoom, rect })}`);
    await done.focus(); await done.press('Enter');
    await page.getByRole('listbox').waitFor({ state: 'detached' });
    await input.click(); await done.focus(); await done.press('Escape');
    await page.getByRole('listbox').waitFor({ state: 'detached' });
    if (!await dialog.isVisible()) throw Error('Escape closed parent dialog');
    cases.push({ theme, width, zoom, pass: true });
  }
  return { pass: !errors.length, cases: cases.length, errors };
}
