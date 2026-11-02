// Production gallery/fresh-package consumer. ?probe=href restores the forbidden address.
async page => {
  page.setDefaultTimeout(5000);
  const initial = await page.evaluate(() => ({ base: location.origin + location.pathname, probe: new URL(location.href).searchParams.get('probe') }));
  const failures = [], cases = [];
  const check = (ok, detail) => { if (!ok) failures.push(detail); };
  const label = '待开放的跨区域联合研究与长期验证工作区';
  for (const theme of ['rhine', 'neutral', 'arknights', 'neo-brutalism', 'graphite']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const c = { theme, width, zoom };
    try {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: zoom === 2 ? 'reduce' : 'no-preference' });
      await page.goto(`${initial.base}?theme=${theme}#nav-actions`);
      await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
      const nav = page.getByRole('navigation', { name: '禁用导航示例', exact: true });
      const blocked = nav.getByRole('link', { name: label, exact: true });
      const available = nav.getByRole('link', { name: '可用工作区', exact: true });
      const toggle = page.getByRole('button', { name: '启用待开放工作区', exact: true });
      await blocked.scrollIntoViewIfNeeded();
      if (initial.probe === 'href') await blocked.evaluate(e => e.setAttribute('href', '?navigationTarget=restricted#nav-actions'));
      check(await blocked.getAttribute('href') === null && await blocked.getAttribute('aria-disabled') === 'true' && await blocked.getAttribute('aria-current') === 'page', { ...c, kind: 'disabled-address-semantics' });
      check(await blocked.getAttribute('tabindex') === '-1', { ...c, kind: 'disabled-tabindex' });
      const before = page.context().pages().length, url = page.url();
      await blocked.click({ force: true });
      await blocked.click({ force: true, modifiers: ['Meta'] });
      await blocked.click({ force: true, button: 'middle' });
      check(page.url() === url && page.context().pages().length === before && await page.getByText('导航与动作回调：0', { exact: true }).count() === 1, { ...c, kind: 'disabled-browser-activation' });
      for (const extra of page.context().pages()) if (extra !== page) await extra.close();
      check(await nav.getByRole('button', { name: `${label}：更多操作`, exact: true }).isDisabled(), { ...c, kind: 'trailing-disabled' });
      await available.focus(); await page.keyboard.press('Tab');
      check(await page.getByRole('button', { name: '打开设置禁用示例', exact: true }).evaluate(e => e === document.activeElement), { ...c, kind: 'tab-skips-disabled-row' });
      await toggle.click();
      check((await blocked.getAttribute('href'))?.includes('navigationTarget=restricted') && await blocked.getAttribute('aria-disabled') === null, { ...c, kind: 'enabled-address' });
      await blocked.focus(); await page.keyboard.press('Enter');
      check(await page.getByText('导航与动作回调：1', { exact: true }).count() === 1, { ...c, kind: 'enabled-keyboard' });
      const geometry = await blocked.evaluate(e => {
        const r = e.getBoundingClientRect(), label = e.querySelector('span'), range = document.createRange(); range.selectNodeContents(label);
        return { visible: [...range.getClientRects()].every(t => t.left >= r.left - 1 && t.right <= r.right + 1 && t.right <= innerWidth + 1), height: r.height };
      });
      check(geometry.visible && geometry.height >= 44 * zoom, { ...c, kind: 'long-name-target', geometry });
      await nav.getByRole('button', { name: `${label}：更多操作`, exact: true }).click();
      await page.getByRole('menuitem', { name: '查看合成摘要', exact: true }).click();
      check(await page.getByText('导航与动作回调：2', { exact: true }).count() === 1, { ...c, kind: 'trailing-enabled' });
      await blocked.focus();
      // Host state update while focus remains on the link; activation tests above use browser input.
      await page.getByRole('button', { name: '禁用待开放工作区', exact: true }).evaluate(e => e.click());
      check(await blocked.evaluate(e => e === document.activeElement) && await blocked.getAttribute('href') === null, { ...c, kind: 'dynamic-focus-retained' });
      await page.keyboard.press('Enter');
      check(await page.getByText('导航与动作回调：2', { exact: true }).count() === 1, { ...c, kind: 'disabled-focused-enter' });
      await page.getByRole('button', { name: '打开设置禁用示例', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '禁用设置栏目', exact: true });
      const select = dialog.getByRole('combobox', { name: '合成设置栏目', exact: true });
      if (await select.isVisible()) {
        check(await select.getByRole('option', { name: '待开放栏目', exact: true }).isDisabled(), { ...c, kind: 'mobile-disabled-option' });
        await select.selectOption('appearance');
      } else {
        const disabledSetting = dialog.getByRole('link', { name: '待开放栏目', exact: true });
        check(await disabledSetting.getAttribute('href') === null, { ...c, kind: 'desktop-disabled-address' });
        await dialog.getByRole('link', { name: '外观设置', exact: true }).click();
      }
      check(await dialog.getByText('当前栏目：appearance', { exact: true }).count() === 1, { ...c, kind: 'settings-selection' });
      await dialog.getByRole('button', { name: '锁定栏目切换', exact: true }).click();
      check(await dialog.locator('.rhine-settings-navigation a[href]').count() === 0 && await dialog.locator('select').isDisabled(), { ...c, kind: 'settings-locked' });
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: '打开设置禁用示例', exact: true }).waitFor();
      check(await page.getByRole('button', { name: '打开设置禁用示例', exact: true }).evaluate(e => e === document.activeElement), { ...c, kind: 'dialog-return-focus' });
      cases.push(c);
    } catch (error) { failures.push({ ...c, kind: 'exception', error: String(error) }); }
  }
  // Browser-engine native opening: new pages must independently resolve their destination.
  await page.goto(`${initial.base}?theme=rhine#nav-actions`);
  const available = page.getByRole('navigation', { name: '禁用导航示例', exact: true }).getByRole('link', { name: '可用工作区', exact: true });
  for (const method of ['middle', 'modified']) {
    const popupPromise = page.context().waitForEvent('page');
    await available.click(method === 'middle' ? { button: 'middle' } : { modifiers: ['Meta'] });
    const popup = await popupPromise; await popup.waitForLoadState();
    check(popup.url().includes('navigationTarget=available') && await popup.getByText('独立导航目标：可用工作区', { exact: true }).count() === 1, { kind: 'enabled-new-page', method });
    await popup.close();
  }
  return { pass: !failures.length, cases, failures, browser: page.context().browser().version(), boundaries: 'Browser-engine keyboard/middle/Meta input; programmatic selectOption and focused host state update labelled separately; no OS context menu or screen-reader claim' };
}
