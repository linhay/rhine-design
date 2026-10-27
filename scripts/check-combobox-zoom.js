// Open the built gallery, then run with Playwright CLI run-code --filename.
async page => {
  const origin = new URL(page.url()).origin;
  page.setDefaultTimeout(10000);
  const failures = [], errors = [], cases = [];
  page.on('pageerror', error => errors.push(String(error)));
  const bounds = locator => locator.evaluate(element => {
    const r = element.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight };
  });
  const contained = r => r.left >= -1 && r.top >= -1 && r.right <= r.width + 1 && r.bottom <= r.height + 1;
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    for (const width of [400, 520, 880]) for (const zoom of [1, 2]) for (const modal of [false, true]) {
      const spec = { theme, width, zoom, modal };
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`${origin}/?theme=${theme}#compact-filters`);
      await page.reload();
      await page.getByRole('heading', { name: '密集筛选控件', exact: true }).waitFor();
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      if (modal) await page.getByRole('button', { name: '在弹窗内选择', exact: true }).click();
      const label = modal ? '弹窗部门' : '部门';
      const input = page.getByRole('combobox', { name: label, exact: true });
      await input.fill('合成部门 99');
      const list = page.getByRole('listbox', { name: label, exact: true });
      await list.getByRole('option', { name: '合成部门 99', exact: true }).waitFor();
      await page.waitForTimeout(200);
      const popup = list.locator('..');
      const completion = popup.getByRole('button', { name: '完成选择', exact: true });
      await input.press('Tab');
      const tabIn = await completion.evaluate(element => element === document.activeElement);
      await completion.press('Shift+Tab');
      const tabBack = await input.evaluate(element => element === document.activeElement);
      await input.press('Tab'); await completion.press('Tab');
      await list.waitFor({ state: 'detached' });
      const fieldForTab = page.locator('.rhine-multi-select').filter({ has: input });
      const tabOut = await fieldForTab.getByRole('list', { name: `${label}已选项`, exact: true }).getByRole('button').first().evaluate(element => element === document.activeElement);
      await input.click(); await list.waitFor();

      const rect = await bounds(popup);
      await list.getByRole('option', { name: '合成部门 99', exact: true }).click();
      const selected = await list.getByRole('option', { name: '合成部门 99', exact: true }).getAttribute('aria-selected');
      await input.press('Escape');
      await list.waitFor({ state: 'detached' });
      const focusRetained = await input.evaluate(element => element === document.activeElement);
      await input.fill('没有匹配的合成部门');
      await list.getByText('暂无匹配结果', { exact: true }).waitFor();
      await input.fill('合成部门 98');
      await input.press('ArrowDown');
      await input.press('Enter');
      const keyboardSelected = await list.getByRole('option', { name: '合成部门 98', exact: true }).getAttribute('aria-selected');
      const node = await input.elementHandle();
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom === 1 ? 2 : 1); }, zoom);
      await page.waitForTimeout(200);
      const stable = await node.evaluate(element => element.isConnected && element.value === '合成部门 98');
      const dynamic = await bounds(popup);
      const option = list.getByRole('option', { name: '合成部门 98', exact: true });
      await option.click();
      const toggledOff = await option.getAttribute('aria-selected') === 'false';
      await input.press('ArrowDown');
      await input.press('Enter');
      const toggledOn = await option.getAttribute('aria-selected') === 'true';
      await input.fill('');
      await list.getByRole('option').last().waitFor();
      const done = popup.getByRole('button', { name: '完成选择', exact: true });
      await done.scrollIntoViewIfNeeded();
      const doneBounds = await bounds(done);
      await done.click();
      await list.waitFor({ state: 'detached' });
      const completed = await input.evaluate(element => element === document.activeElement && element.value === '' && element.getAttribute('aria-expanded') === 'false');
      const field = page.locator('.rhine-multi-select').filter({ has: input });
      let cleared = true;
      for (const initiallyOpen of [false, true]) {
        await input.fill('合成部门 99');
        await input.press('ArrowDown'); await input.press('Enter');
        if (!initiallyOpen) await popup.getByRole('button', { name: '完成选择', exact: true }).click();
        await field.getByRole('button', { name: '清空选择', exact: true }).click();
        await list.waitFor({ state: 'detached' });
        cleared = cleared && await input.evaluate(element => element === document.activeElement && element.value === '合成部门 99' && element.getAttribute('aria-expanded') === 'false') && await field.getByRole('button', { name: '清空选择', exact: true }).count() === 0;
      }
      for (const name of ['合成部门 99', '合成部门 98']) {
        await input.fill(name); await input.press('ArrowDown'); await input.press('Enter');
      }
      await popup.getByRole('button', { name: '完成选择', exact: true }).click();
      await field.getByRole('button', { name: '移除合成部门 99', exact: true }).click();
      const tagRemoved = await input.evaluate(element => element === document.activeElement && element.value === '合成部门 98' && element.getAttribute('aria-expanded') === 'false');
      await input.fill(''); await input.press('Backspace');
      const backspaceRetained = await input.getAttribute('aria-expanded') === 'true' && await field.getByRole('button', { name: '清空选择', exact: true }).count() === 0;
      await input.press('Escape');
      const pass = tabIn && tabBack && tabOut && cleared && tagRemoved && backspaceRetained && contained(rect) && contained(dynamic) && selected === 'true' && keyboardSelected === 'true' && focusRetained && stable && toggledOff && toggledOn && contained(doneBounds) && completed;
      cases.push({ ...spec, pass });
      if (!pass) failures.push({ ...spec, rect, dynamic, selected, keyboardSelected, focusRetained, stable, toggledOff, toggledOn, doneBounds, completed, cleared, tagRemoved, backspaceRetained, tabIn, tabBack, tabOut });
      if (modal) {
        await input.press('Escape');
        await page.getByRole('dialog', { name: '搜索多选', exact: true }).waitFor({ state: 'detached' });
      }
    }
  }
  return { pass: !failures.length && !errors.length, cases: cases.length, failures, errors };
}
