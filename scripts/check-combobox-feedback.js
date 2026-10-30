// Production fixture plus real parameter host. CSS zoom is not native browser zoom.
async page => {
  page.setDefaultTimeout(5000);
  const { base, probe } = await page.evaluate(() => ({ base: location.origin, probe: new URLSearchParams(location.search).get('probe') }));
  const assert = (ok, text) => { if (!ok) throw new Error(text); };
  const results = [], host = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const themes = ['rhine', 'arknights', 'neo-brutalism', 'neutral'];
  const cases = probe ? [{ theme: 'rhine', width: 400, zoom: 2, height: 648 }] : themes.flatMap(theme =>
    [400, 520, 880].flatMap(width => [1, 2].map(zoom => ({ theme, width, zoom, height: 900 }))))
    .concat(themes.map(theme => ({ theme, width: 400, zoom: 2, height: 648 })));
  const go = (c, states = true, motion = 'system') => page.goto(`${base}/?fixture=parameter-config${states ? '&combobox=states' : ''}&theme=${c.theme}&zoom=${c.zoom}&motion=${motion}`);
  const field = name => page.getByRole('combobox', { name, exact: true });
  const status = input => input.evaluate(e => {
    const s = document.getElementById(`${e.id}-status`), r = s.getBoundingClientRect(), st = getComputedStyle(s);
    return { text: s.textContent, hiddenRow: s.classList.contains('rhine-sr-only'), role: s.getAttribute('role'),
      visible: st.visibility !== 'hidden' && st.display !== 'none' && r.width > 1 && r.height > 1,
      described: e.getAttribute('aria-describedby')?.split(' ').includes(s.id), invalid: e.getAttribute('aria-invalid') };
  });
  const close = async input => { await input.press('Escape'); await page.waitForTimeout(200); };
  for (const c of cases) try {
    await page.setViewportSize({ width: c.width, height: c.height }); await go(c);
    const compact = field('紧凑状态呈现'), normal = field('默认状态呈现');
    assert((await status(normal)).visible && !(await status(normal)).hiddenRow, 'default routine status lost its row');
    assert((await status(compact)).hiddenRow && (await status(compact)).role === 'status' && (await status(compact)).described, 'compact routine status/live description missing');
    await page.getByRole('checkbox', { name: '字段校验失败' }).check(); await compact.click();
    assert((await status(compact)).invalid === 'true', 'validation aria-invalid missing');
    const description = await compact.evaluate(e => e.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id)?.textContent).join(' '));
    assert(description.includes('字段版本格式不正确') && description.includes('合成状态示例'), 'validation/hint description missing');
    if (probe === 'feedback-block') await compact.evaluate(e => e.addEventListener('keydown', event => { if (event.key === 'Enter') event.stopImmediatePropagation(); }, true));
    await compact.press('End');
    const popup = page.locator('.rhine-combobox__list[data-state=open]');
    await page.waitForTimeout(200);
    const bounds = await popup.boundingBox();
    assert(bounds.width > 0 && bounds.height > 0 && bounds.x >= -1 && bounds.x + bounds.width <= c.width + 1 && bounds.y >= -1 && bounds.y + bounds.height <= c.height + 1, 'popup outside viewport');
    await compact.press('Enter');
    assert(await compact.inputValue() === '12.4.0-alpha.11', 'validation blocked corrective End/Enter');
    await page.waitForTimeout(200); assert(await compact.evaluate(e => e === document.activeElement), 'selection lost input focus');
    await page.getByRole('checkbox', { name: '字段校验失败' }).check();
    await field('候选状态演示').selectOption('error-loading');
    const both = await status(compact);
    if (probe === 'feedback-hide') await compact.evaluate(e => { document.getElementById(`${e.id}-status`).style.visibility = 'hidden'; });
    assert((await status(compact)).visible && !both.hiddenRow && both.text.includes('候选读取失败'), 'compact fetch error hidden during retry');
    assert(await compact.evaluate(e => document.getElementById(`${e.id}-validation`)?.textContent.includes('字段版本格式不正确')), 'coexisting validation hidden');
    await compact.click(); assert(await page.getByRole('listbox').getAttribute('aria-busy') === 'true', 'loading busy missing');
    assert(await page.getByRole('listbox').textContent() === '正在读取…', 'loading popup missing');
    await close(compact); assert((await status(compact)).visible, 'fetch error disappears while closed');
    for (const suffix of ['status', 'validation']) {
      const feedback = page.locator(`[id="${await compact.getAttribute('id')}-${suffix}"]`); await feedback.scrollIntoViewIfNeeded();
      assert(await feedback.evaluate(e => { const r = e.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(e); return r.top >= -1 && r.bottom <= innerHeight + 1 && [...range.getClientRects()].every(t => t.left >= -1 && t.right <= innerWidth + 1); }), 'long error clipped or unreachable');
    }
    await field('候选状态演示').selectOption('error'); await compact.fill('99.0.0-new.12345678901234567890');
    await compact.press('End'); await compact.press('Enter');
    assert(await compact.inputValue() === '99.0.0-new.12345678901234567890' && await page.getByRole('listbox').getByRole('option').count() === 0, 'failed fetch selected stale candidates');
    await compact.press('Tab'); await page.getByRole('button', { name: '重试', exact: true }).press('Enter');
    await page.getByRole('listbox').getByRole('option', { name: '12.4.0', exact: true }).click();
    assert(await compact.inputValue() === '12.4.0', 'retry/pointer correction failed');
    await page.waitForTimeout(200); await field('候选状态演示').selectOption('empty'); await compact.click();
    assert((await status(compact)).hiddenRow && (await status(compact)).text === '暂无匹配结果', 'empty live status missing');
    assert(await page.getByRole('listbox').textContent() === '暂无匹配结果', 'empty popup missing'); await close(compact);
    await field('候选状态演示').selectOption('ready'); await compact.click();
    const prior = await compact.inputValue();
    const ime = await compact.evaluate(e => {
      const previous = e.value, setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      e.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); setter.call(e, '合成'); e.dispatchEvent(new Event('input', { bubbles: true }));
      e.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, isComposing: true }));
      e.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 229, isComposing: true }));
      return { previous, draft: e.value };
    });
    assert(ime.previous === prior && ime.draft === '合成' && await normal.inputValue() === prior, 'IME prematurely queried or selected');
    await compact.dispatchEvent('compositionend', { data: '合成' }); assert(await normal.inputValue() === '合成', 'IME completion not delivered'); await close(compact);
    for (const access of ['disabled', 'readonly']) {
      await field('字段可用性').selectOption(access);
      assert(await compact.getAttribute(access === 'disabled' ? 'disabled' : 'readonly') !== null, `${access} missing`);
      assert(await compact.getAttribute('aria-expanded') === 'false', `${access} popup remained open`);
    }
    await field('字段可用性').selectOption('editable'); await field('候选状态演示').selectOption('page'); await compact.click();
    await compact.press('Tab'); const more = page.getByRole('button', { name: '加载更多', exact: true });
    assert(await more.evaluate(e => e === document.activeElement), 'pagination Tab action unreachable'); await more.press('Enter');
    assert(await compact.evaluate(e => e === document.activeElement), 'last page did not return action focus to input'); await close(compact);
    await field('候选状态演示').selectOption('page-error'); await compact.click();
    assert(await page.getByRole('alert').filter({ hasText: '下一页读取失败' }).count() === 1, 'pagination error missing');
    await compact.press('Tab'); await page.getByRole('button', { name: '重试', exact: true }).press('Enter'); await close(compact);
    await field('紧凑多选').click(); await field('紧凑多选').press('End'); await field('紧凑多选').press('Enter');
    assert(await field('紧凑多选').getAttribute('aria-expanded') === 'true', 'multi-select closed on selection');
    await field('紧凑多选').press('Tab'); assert(await page.getByRole('button', { name: '完成选择' }).evaluate(e => e === document.activeElement), 'completion Tab failed');
    await page.getByRole('button', { name: '完成选择' }).press('Enter'); await page.waitForTimeout(200);
    assert(await field('紧凑多选').evaluate(e => e === document.activeElement), 'completion focus lost');
    await field('紧凑多选').press('Tab');
    assert(await page.evaluate(() => !document.activeElement.closest('.rhine-combobox__list')), 'closed completion remained in Tab order');
    for (let i = 0; i < 6 && !await page.getByRole('button', { name: '清空演示' }).evaluate(e => e === document.activeElement); i++) await page.keyboard.press('Tab');
    assert(await page.getByRole('button', { name: '清空演示' }).evaluate(e => e === document.activeElement), 'Tab could not exit selected-tag actions');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'document overflow');
    results.push({ ...c, pass: true, popup: bounds, paths: ['default', 'compact-live', 'validation-correction', 'coexisting-errors', 'retry-manual', 'empty-loading', 'IME', 'disabled-readOnly', 'pagination', 'completion-Tab'] });
  } catch (error) { results.push({ ...c, pass: false, error: String(error) }); }
  if (!probe || probe === 'smoke') for (const motion of (probe === 'smoke' ? ['normal'] : ['normal', 'system-reduced', 'manual-reduced'])) try {
    const c = { theme: 'rhine', width: 400, height: 648, zoom: 2 }; await page.setViewportSize({ width: c.width, height: c.height });
    await page.emulateMedia({ reducedMotion: motion === 'system-reduced' ? 'reduce' : 'no-preference' });
    await go(c, false, motion === 'manual-reduced' ? 'reduced' : 'system');
    const input = field('统一版本'); await input.click(); await page.getByRole('listbox').getByRole('option', { name: '12.10.0', exact: true }).waitFor();
    assert(JSON.stringify(await page.getByRole('listbox').getByRole('option').allTextContents()) === JSON.stringify(['12.10.0', '12.4.0', '12.4.0-rc.1', '12.4.0-alpha.11', '12.4.0-alpha.2', '12.3.9']), 'version order/dedup wrong');
    await close(input); const desktop = field('桌面应用构建号'); await desktop.click();
    assert(JSON.stringify(await page.getByRole('listbox').getByRole('option').allTextContents()) === JSON.stringify(['10000', '2401', '2400', '999']), 'desktop candidate isolation/order wrong'); await close(desktop);
    for (const [label, expected] of [['移动应用构建号', ['11000', '8102', '8101', '900']], ['独立软件版本', ['3.10.0', '3.2.1', '3.2.1-alpha.11', '3.2.1-alpha.2', '3.2.0']]]) {
      const independent = field(label); await independent.click();
      assert(JSON.stringify(await page.getByRole('listbox').getByRole('option').allTextContents()) === JSON.stringify(expected), `${label} candidate isolation/order wrong`);
      await close(independent);
    }
    await input.fill('illegal'); await page.getByRole('button', { name: '核对并提交' }).click();
    assert(await input.inputValue() === 'illegal' && await input.evaluate(e => e === document.activeElement), 'invalid submission cleared input or lost focus');
    await page.getByRole('listbox').getByRole('option', { name: '12.3.9', exact: true }).waitFor();
    assert(await input.inputValue() === 'illegal', 'candidate arrival replaced invalid input');
    await input.press('End'); await input.press('Enter'); assert(await input.inputValue() === '12.3.9' && await input.getAttribute('aria-invalid') === null, 'invalid original could not be corrected without clearing');
    await page.locator('summary').filter({ hasText: '合成服务控制' }).click(); await field('观测候选场景').selectOption('error');
    await page.waitForTimeout(500); await input.click();
    assert(await page.getByText('观测候选读取失败，可重试或继续手填。', { exact: true }).count() === 4, 'field errors missing');
    await input.press('Tab'); await page.getByRole('button', { name: '重试', exact: true }).press('Enter');
    await page.getByRole('listbox').getByRole('option', { name: '12.10.0', exact: true }).waitFor();
    assert(await page.getByText('观测候选读取失败，可重试或继续手填。', { exact: true }).count() === 3, 'retry changed another field'); await close(input);
    await field('观测候选场景').selectOption('normal'); await page.waitForTimeout(500); await field('观测候选场景').selectOption('error'); await page.waitForTimeout(500);
    assert(await page.getByText('观测候选读取失败，可重试或继续手填。', { exact: true }).count() === 4, 'reentered error scenario did not reset');
    assert(await input.inputValue() === '12.3.9', 'mode/retry changed draft');
    await input.fill('88.0.0-new.1'); await page.getByRole('button', { name: '核对并提交' }).click();
    const dialog = page.getByRole('dialog', { name: '核对配置变化' }); assert((await dialog.textContent()).includes('88.0.0-new.1'), 'manual new version did not reach review');
    await dialog.getByRole('button', { name: '返回编辑' }).click(); await dialog.waitFor({ state: 'detached' });
    await field('观测候选场景').selectOption('empty'); await page.waitForTimeout(500); await input.click();
    assert(await page.getByRole('listbox').textContent() === '暂无匹配结果', 'no history missing');
    await input.fill('89.0.0'); await close(input); assert(await input.inputValue() === '89.0.0', 'empty history blocked manual version');
    host.push({ motion, pass: true, paths: ['per-field-sort-dedup', 'invalid-original-correction', 'isolated-retry-reentry', 'manual-review', 'empty-manual'] });
  } catch (error) { host.push({ motion, pass: false, error: String(error) }); }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { pass: results.every(r => r.pass) && host.every(r => r.pass) && !errors.length, probe, browser: page.context().browser()?.version(), results, host, errors };
}
