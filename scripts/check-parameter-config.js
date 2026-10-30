// Run with playwright-cli run-code --filename scripts/check-parameter-config.js
// against the production ?fixture=parameter-config. ?probe=clip is a negative control.
async page => {
  page.setDefaultTimeout(6000);
  const base = page.url().split('/').slice(0, 3).join('/'), probe = page.url().includes('probe=clip') ? 'clip' : null;
  const results = [], interactions = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const fixture = (theme, zoom, motion = 'system') => `${base}/?fixture=parameter-config&theme=${theme}&zoom=${zoom}&motion=${motion}`;
  const review = () => page.getByRole('button', { name: '核对并提交', exact: true });
  const summary = text => page.locator('summary').filter({ hasText: text });
  const settle = () => page.waitForTimeout(230);
  const reaches = async (locator, container) => {
    await locator.scrollIntoViewIfNeeded();
    return locator.evaluate((e, selector) => {
      const region = e.closest(selector), r = e.getBoundingClientRect(), c = region.getBoundingClientRect();
      // Include actual padding/border frame, not merely document overflow.
      return r.width > 0 && r.height > 0 && r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1;
    }, container);
  };
  const cases = probe ? [{ theme: 'rhine', width: 400, zoom: 2, height: 648 }] :
    ['rhine', 'arknights', 'neo-brutalism'].flatMap(theme => [400, 520, 880].flatMap(width => [1, 2].map(zoom => ({ theme, width, zoom, height: 900 }))))
      .concat(['rhine', 'arknights', 'neo-brutalism'].map(theme => ({ theme, width: 400, zoom: 2, height: 648 })));
  for (const c of cases) {
    try {
      await page.setViewportSize({ width: c.width, height: c.height });
      await page.goto(fixture(c.theme, c.zoom));
      const version = page.getByRole('textbox', { name: '统一版本', exact: true });
      const preview = page.getByRole('region', { name: '完整生成结果' });
      assert(await page.getByRole('textbox').count() === 1, 'low frequency inputs are initially exposed');
      assert(await preview.getByRole('listitem').count() === 11, 'expected eleven results');
      // Real forward/reverse traversal must not reach retained closed input DOM.
      await version.focus();
      for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 10; i++) {
        await page.keyboard.press(key);
        assert(await page.evaluate(() => !document.activeElement?.matches('details:not([open]) input, details:not([open]) select, details:not([open]) button')), 'closed parameter/service control entered Tab order');
      }
      const layout = await page.locator('.rhine-parameter-config__layout').evaluate(e => {
        const a = e.children[0].getBoundingClientRect(), b = e.children[1].getBoundingClientRect();
        return { sideBySide: b.left > a.left + a.width - 1, inputWidth: a.width, previewWidth: b.width };
      });
      assert(layout.sideBySide === (c.width === 880 && c.zoom === 1), 'container layout differs from expected columns');
      await summary('独立参数').focus(); await page.keyboard.press('Enter');
      assert(await page.getByRole('textbox').count() === 4, 'expected exactly four text parameters');
      await version.fill('18.0.0-rc.123456789012345678901234567890+synthetic.long.metadata');
      const fields = await page.getByRole('textbox').evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect(), p = e.closest('fieldset').getBoundingClientRect();
        return { width: r.width, left: r.left, right: r.right, frameLeft: p.left, frameRight: p.right };
      }));
      assert(fields.every(r => r.width >= 100 && r.left >= r.frameLeft && r.right <= r.frameRight + 1), 'input inner frame clips fields');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'document horizontal overflow');
      if (probe === 'clip') await preview.evaluate(e => { e.style.maxHeight = '80px'; e.style.overflow = 'hidden'; });
      await preview.focus();
      assert(await preview.evaluate(e => parseFloat(getComputedStyle(e).outlineWidth) >= 2), 'result keyboard focus outline missing');
      const start = await preview.evaluate(e => e.scrollTop);
      await page.keyboard.press('PageDown'); await page.waitForTimeout(180);
      const scrolled = await preview.evaluate(e => e.scrollTop);
      assert(scrolled > start, 'actual PageDown did not scroll results');
      await page.keyboard.press('Control+End');
      await preview.evaluate(e => { e.scrollTop = e.scrollHeight; });
      const last = preview.getByRole('listitem').last();
      assert(await reaches(last, '.rhine-parameter-config__results'), 'last result clipped by actual inner frame');
      // Range fragments of the longest generated text must fit its content box.
      const wrapped = await preview.locator('li').first().locator('pre').evaluate(e => {
        const range = document.createRange(); range.selectNodeContents(e); const r = e.getBoundingClientRect();
        return [...range.getClientRects()].every(t => t.left >= r.left - 1 && t.right <= r.right + 1);
      });
      assert(wrapped, 'long version text extends outside result content box');
      await review().click();
      const dialog = page.getByRole('dialog', { name: '核对配置变化' });
      assert((await dialog.textContent()).includes('影响 10 / 11 条结果'), 'impact count wrong');
      assert(await dialog.locator('dt').count() === 1, 'unchanged parameters appear in summary');
      assert(await dialog.locator('details').getAttribute('open') === null, 'full diff should start closed');
      await summary('完整结果差异').focus(); await page.keyboard.press('Enter'); await settle();
      const diffLast = dialog.locator('.rhine-parameter-config__diff li').last().locator('pre').last();
      const diffEnd = await diffLast.evaluate(e => {
        const region = e.closest('.rhine-dialog__body'); region.scrollTop = region.scrollHeight;
        const range = document.createRange(), text = e.lastChild;
        range.setStart(text, Math.max(0, text.length - 1)); range.setEnd(text, text.length);
        const r = range.getBoundingClientRect(), c = region.getBoundingClientRect();
        const all = document.createRange(); all.selectNodeContents(e); const box = e.getBoundingClientRect();
        const horizontal = [...all.getClientRects()].every(t => t.left >= box.left - 1 && t.right <= box.right + 1);
        return { reachable: r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1, horizontal, lastLine: { top: r.top, bottom: r.bottom }, body: { top: c.top, bottom: c.bottom } };
      });
      assert(diffEnd.reachable && diffEnd.horizontal, `last complete diff/header fragment clipped: ${JSON.stringify(diffEnd)}`);
      const body = await dialog.locator('.rhine-dialog__body').boundingBox();
      assert(body.height > 0, 'dialog body collapsed');
      for (const name of ['返回编辑', '确认提交', '关闭对话框']) {
        const b = dialog.getByRole('button', { name, exact: true });
        await b.scrollIntoViewIfNeeded(); const rect = await b.boundingBox();
        assert(rect.width > 0 && rect.height > 0 && rect.x >= -1 && rect.x + rect.width <= c.width + 1 && rect.y >= -1 && rect.y + rect.height <= c.height + 1, `${name} unreachable in viewport`);
      }
      if (c.theme === 'rhine' && c.width === 400 && c.zoom === 2 && c.height === 648)
        await page.screenshot({ path: 'output/playwright/parameter-config-short-dialog.png' });
      await dialog.getByRole('button', { name: '返回编辑' }).click(); await settle();
      assert(await review().evaluate(e => e === document.activeElement), 'cancel did not return focus');
      assert((await version.inputValue()).startsWith('18.0.0-rc.'), 'cancel lost draft');
      if (c.theme === 'rhine' && c.width === 880 && c.zoom === 1)
        await page.screenshot({ path: 'output/playwright/parameter-config-wide.png', fullPage: true });
      results.push({ ...c, pass: true, layout, minFieldWidth: Math.min(...fields.map(r => r.width)), pageDownDelta: scrolled - start, dialogBody: body });
    } catch (error) { results.push({ ...c, pass: false, error: String(error) }); }
  }
  if (!probe) for (const mode of ['normal', 'system-reduced', 'manual-reduced']) {
    try {
      await page.emulateMedia({ reducedMotion: mode === 'system-reduced' ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: 400, height: 648 });
      await page.goto(fixture('rhine', 2, mode === 'manual-reduced' ? 'reduced' : 'system'));
      const version = page.getByLabel('统一版本', { exact: true });
      await summary('独立参数').click();
      const mobile = page.getByRole('textbox', { name: '移动应用构建号' }); await mobile.fill('invalid');
      await summary('独立参数').click(); await review().click();
      assert(await mobile.evaluate(e => e === document.activeElement && e.closest('details').open), 'invalid hidden field not expanded/focused');
      assert((await page.getByRole('region', { name: '完整生成结果' }).textContent()).includes('待校验'), 'invalid results labeled valid');
      await mobile.fill('9100'); await version.fill('13.0.0');
      await summary('合成服务控制').click(); await page.getByRole('combobox', { name: '提交结果' }).selectOption('error');
      await review().click(); let d = page.getByRole('dialog');
      const duration = await d.evaluate(e => getComputedStyle(e).animationDuration);
      assert(mode === 'normal' ? parseFloat(duration) > 0 : parseFloat(duration) === 0, `motion duration ${duration}`);
      await d.getByRole('button', { name: '确认提交', exact: true }).dblclick({ delay: 10 });
      await d.getByText('提交未完成', { exact: true }).waitFor();
      assert(await page.getByTestId('parameter-attempts').textContent() === '1', 'duplicate request accepted');
      assert(await version.inputValue() === '13.0.0', 'error lost draft');
      await d.getByRole('button', { name: '重试提交' }).click(); await d.waitFor({ state: 'detached' });
      await page.getByText('已保存合成配置', { exact: true }).waitFor();
      assert(await page.getByTestId('parameter-saved-version').textContent() === '13.0.0', 'retry failed to save');
      await version.fill('14.0.0'); await page.getByRole('combobox', { name: '提交结果' }).selectOption('conflict');
      await review().click(); d = page.getByRole('dialog'); await d.getByRole('button', { name: '确认提交' }).click();
      await d.getByText('基线冲突', { exact: true }).waitFor(); await page.keyboard.press('Escape'); await d.waitFor({ state: 'detached' });
      await review().click(); d = page.getByRole('dialog'); assert(await d.getByRole('button', { name: '确认提交' }).count() === 0, 'reopen bypasses conflict');
      await d.getByRole('button', { name: '读取新基线' }).click(); await d.waitFor({ state: 'detached' });
      assert(await version.inputValue() === '14.0.0', 'refresh discarded draft');
      await review().click(); d = page.getByRole('dialog');
      assert((await d.textContent()).includes('12.5.0'), 'review did not use refreshed baseline');
      await d.getByRole('button', { name: '确认提交' }).click();
      await d.getByRole('button', { name: '返回编辑' }).click(); await d.waitFor({ state: 'detached' });
      await version.fill('15.0.0'); await page.waitForTimeout(750);
      assert(await page.getByTestId('parameter-saved-version').textContent() === '12.5.0' && await version.inputValue() === '15.0.0', 'canceled response overwrote later draft');
      await review().click(); d = page.getByRole('dialog'); await d.getByRole('button', { name: '确认提交' }).click(); await d.waitFor({ state: 'detached' });
      assert(await page.getByTestId('parameter-saved-version').textContent() === '15.0.0', 'final save failed');
      interactions.push({ mode, pass: true, duration, paths: ['hidden-invalid', 'duplicate', 'error-retry', 'conflict-reopen', 'refresh-retain', 'cancel-stale', 'success'] });
    } catch (error) { interactions.push({ mode, pass: false, error: String(error) }); }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { pass: results.every(r => r.pass) && interactions.every(r => r.pass) && errors.length === 0, probe, browser: page.context().browser()?.version(), results, interactions, errors };
}
