// Run against the production settings-dialog fixture with playwright-cli.
async page => {
  const origin = page.url().split('/').slice(0, 3).join('/');
  const results = [], errors = [];
  // macOS WebKit uses Option+Tab to include buttons with its default preferences.
  const isMac = await page.evaluate(() => navigator.platform.startsWith('Mac'));
  const tab = isMac && page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
  const onPageError = error => errors.push(error.message);
  page.on('pageerror', onPageError);
  try {
    for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
      for (const width of [400, 520, 880]) {
        for (const zoom of [1, 2]) {
          const scenario = { theme, width, zoom };
          const checks = {};
          try {
            await page.setViewportSize({ width, height: 648 });
            await page.goto(`${origin}/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}`);
            const trigger = page.getByRole('button', { name: '可选操作区示例' });
            await trigger.click();
            const dialog = page.getByRole('dialog', { name: '筛选记录' });
            const search = dialog.getByRole('textbox', { name: '筛选词' });
            const draft = dialog.getByRole('textbox', { name: '筛选备注' });
            const reset = dialog.getByRole('button', { name: '重置筛选' });
            const region = dialog.getByRole('region', { name: '筛选记录内容' });
            await draft.fill('draft');
            await draft.evaluate(element => { window.dialogDraft = element; });
            await search.evaluate(element => { window.dialogSearch = element; });
            const searchState = () => search.evaluate(element => ({
              sameNode: element === window.dialogSearch, focused: element === document.activeElement, value: element.value,
            }));
            const editing = state => state.sameNode && state.focused;
            checks.startsNatural = (await reset.count()) === 0 && (await region.count()) === 0;
            await search.focus();
            await page.keyboard.type('a');
            const first = await searchState();
            checks.firstKey = editing(first) && first.value === 'a';
            await page.keyboard.type('b');
            checks.continuedTyping = (await searchState()).value === 'ab';
            checks.footerReachable = await reset.evaluate(button => {
              const footer = button.parentElement;
              const action = button.getBoundingClientRect();
              const bounds = footer.getBoundingClientRect();
              const x = action.left + action.width / 2, y = action.top + action.height / 2;
              return action.width > 0 && action.height > 0 && action.top >= bounds.top - 1 &&
                action.bottom <= bounds.bottom + 1 && action.left >= bounds.left - 1 && action.right <= bounds.right + 1 &&
                action.top >= 0 && action.bottom <= innerHeight && action.left >= 0 && action.right <= innerWidth &&
                button.contains(document.elementFromPoint(x, y));
            });
            await search.focus();
            await page.keyboard.press('End');
            await page.keyboard.press('Backspace');
            if ((await searchState()).value !== '') await page.keyboard.press('Backspace');
            const cleared = await searchState();
            checks.clearWhileEditing = editing(cleared) && cleared.value === '' && (await reset.count()) === 0 && (await region.count()) === 0;
            await search.focus();
            await page.keyboard.type('x');
            await search.focus();
            await page.keyboard.press(tab);
            const tabToDraft = await draft.evaluate(element => element === document.activeElement);
            await page.keyboard.press(tab);
            const tabToReset = await reset.evaluate(element => element === document.activeElement);
            checks.keyboardOrder = tabToDraft && tabToReset;
            if (tabToReset) await page.keyboard.press('Enter');
            const keyboardReset = await searchState();
            checks.keyboardReset = editing(keyboardReset) && keyboardReset.value === '' && (await reset.count()) === 0;
            if (await reset.count() === 0) {
              await search.focus();
              await page.keyboard.type('y');
            }
            await reset.click();
            const pointerReset = await searchState();
            checks.pointerReset = editing(pointerReset) && pointerReset.value === '' && (await reset.count()) === 0;
            checks.draft = await draft.evaluate(element => element === window.dialogDraft && element.value === 'draft');
            await page.keyboard.press('Escape');
            await dialog.waitFor({ state: 'detached' });
            await trigger.waitFor({ state: 'visible' });
            await page.waitForFunction(() => document.activeElement?.textContent === '可选操作区示例', undefined, { timeout: 3000 });
            checks.closeReturn = true;
            await page.keyboard.press('Enter');
            await dialog.waitFor({ state: 'visible' });
            checks.reopen = (await search.inputValue()) === '' && (await draft.inputValue()) === '' && (await reset.count()) === 0;
            results.push({ ...scenario, pass: Object.values(checks).every(Boolean), checks, first });
          } catch (error) {
            results.push({ ...scenario, pass: false, checks, error: String(error) });
          }
        }
      }
    }
  } finally {
    page.off('pageerror', onPageError);
  }
  return { pass: results.every(result => result.pass) && errors.length === 0, browser: await page.evaluate(() => navigator.userAgent), tab, results, errors };
}
