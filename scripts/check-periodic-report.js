async page => {
  const origin = await page.evaluate(() => location.origin);
  const probe = await page.evaluate(() => new URLSearchParams(location.search).get('reportProbe'));
  const failures = [], errors = [], layouts = [], behavior = [], motion = [];
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const set = window.setTimeout, clear = window.clearTimeout;
    const state = window.__reportTimers = { scheduled: 0, fired: 0, cancelled: 0, pending: [] };
    window.setTimeout = (callback, ms, ...args) => {
      if (![350, 1800, 450].includes(ms)) return set(callback, ms, ...args);
      const id = set(() => { state.fired++; state.pending = state.pending.filter(value => value !== id); callback(...args); }, ms);
      state.scheduled++; state.pending.push(id); return id;
    };
    window.clearTimeout = id => { if (state.pending.includes(id)) { state.cancelled++; state.pending = state.pending.filter(value => value !== id); } return clear(id); };
  });
  const root = () => page.locator('[data-report]');
  const generate = () => page.locator('[data-generate]');
  const read = () => page.locator('[data-read]');
  const enter = async locator => { await locator.focus(); await page.keyboard.press('Enter'); };
  const status = value => page.waitForFunction(value => document.querySelector('[data-report]')?.dataset.reportStatus === value, value);
  const start = async (theme = 'rhine', width = 880, zoom = 1, mode = 'normal') => {
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    // A desktop host with a narrow local report surface. Width is the physical local slot; CSS zoom reduces its effective content width.
    await page.setViewportSize({ width: 1100, height: 520 });
    await page.goto(`${origin}/?fixture=periodic-report&theme=${theme}${mode === 'manual' ? '&motion=manual' : ''}`);
    await page.locator('.rhine-periodic-fixture').evaluate((el, { width, zoom }) => { el.style.width = `${width / zoom}px`; el.style.maxWidth = '100%'; el.style.boxSizing = 'border-box'; el.style.zoom = String(zoom); }, { width, zoom });
  };
  const toggle = async text => {
    const summary = page.locator('summary').filter({ hasText: text });
    await enter(summary);
    await summary.evaluate(el => Promise.all(el.parentElement.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
    return summary;
  };
  const bounds = () => root().evaluate(el => {
    const cut = [], walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let lines = 0, text;
    while ((text = walker.nextNode())) {
      const node = text.parentElement;
      if (!text.textContent.trim() || node.closest('.rhine-sr-only,[aria-hidden=true],select') || (node.closest('details:not([open])') && !node.closest('summary'))) continue;
      const range = document.createRange(); range.selectNodeContents(text);
      for (const rect of range.getClientRects()) {
        lines++;
        for (let parent = node; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
          if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2)) cut.push(text.textContent);
          if (['hidden', 'clip'].includes(style.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2)) cut.push(text.textContent);
        }
      }
    }
    return { width: el.getBoundingClientRect().width, fits: el.scrollWidth <= el.clientWidth + 1, pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, lines, cut: [...new Set(cut)] };
  });
  for (const theme of ['rhine', 'arknights', 'neo-brutalism', 'neutral']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await start(theme, width, zoom); await page.getByLabel('报告长中文').check();
    await toggle('展开合并事项的每日来源'); await toggle('每日资料');
    if (probe === 'clip') await root().evaluate(el => { const summary = el.querySelector('[data-summary]'); summary.style.maxHeight = '35px'; summary.style.overflow = 'hidden'; });
    const b = await bounds(), label = `${theme}/${width}/CSS${zoom * 100}`;
    check(b.fits && b.pageFits && b.cut.length === 0 && b.lines > 30, { kind: 'layout', label, bounds: b });
    const last = page.locator('[data-daily]').last(); await last.scrollIntoViewIfNeeded();
    const end = await last.evaluate(el => { const r = el.getBoundingClientRect(); return { text: el.textContent, inView: r.top >= -1 && r.bottom <= innerHeight + 1, hit: el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }; });
    check(end.inView && end.hit && end.text.includes('2026-10-25'), { kind: 'last-daily-reachable', label, end });
    layouts.push({ label, bounds: b, end });
    if (probe) return { pass: !failures.length && !errors.length, failures, errors, layouts, probe };
  }
  await start();
  check((await page.locator('[data-coverage]').innerText()).includes('3 / 10 条材料（30%）'), { kind: 'weighted-counts' });
  await toggle('查看缺失日期'); check(await page.getByText('2026-10-21', { exact: true }).isVisible(), { kind: 'missing-day' });
  await toggle('每日资料');
  check(await page.locator('[data-daily=empty]').count() === 4 && await page.locator('[data-daily=missing]').count() === 1, { kind: 'missing-not-empty' });
  await toggle('每日资料');
  const hiddenFocus = [];
  for (const key of ['Tab', 'Shift+Tab']) {
    await generate().focus();
    for (let i = 0; i < 16; i++) { await page.keyboard.press(key); hiddenFocus.push(await page.evaluate(() => { const el = document.activeElement; return !!el.closest('details:not([open])') && el.tagName !== 'SUMMARY'; })); }
  }
  check(!hiddenFocus.some(Boolean), { kind: 'closed-disclosures-tab-order', hiddenFocus });
  await toggle('展开合并事项的每日来源');
  const link = page.getByRole('link', { name: '查看 2026-10-19 合成来源（新标签页）' });
  const popupPromise = page.waitForEvent('popup'); await enter(link); const popup = await popupPromise;
  await popup.waitForLoadState();
  check((await popup.locator('main').innerText()).includes('完成报告结构讨论'), { kind: 'real-source-link', url: popup.url() }); await popup.close();
  check(await link.evaluate(el => el === document.activeElement), { kind: 'source-context-kept' });
  for (const scenario of ['idle', 'empty', 'queued', 'generating', 'failed', 'unknown', 'invalid', 'read-error']) {
    await page.getByLabel('报告合成场景').selectOption(scenario);
    const text = await root().innerText();
    if (scenario === 'empty') check(text.includes('覆盖率不适用') && !text.includes('日报缺失') && await page.locator('[data-daily=empty]').count() === 7, { kind: 'confirmed-empty', text });
    if (['failed', 'unknown'].includes(scenario)) check(await page.locator('[data-daily]').count() === 7, { kind: 'failure-retains-materials', scenario });
    if (['queued', 'generating', 'unknown'].includes(scenario)) {
      check(await generate().getAttribute('aria-disabled') === 'true' && await generate().getAttribute('aria-busy') !== 'true' && await page.getByRole('button', { name: '停止等待' }).count() === 0, { kind: 'observed-task-not-local-request', scenario });
      await enter(generate()); check(await root().getAttribute('data-generation-count') === '0', { kind: 'no-duplicate-unknown-write', scenario });
      await enter(read()); await page.waitForFunction(() => !document.querySelector('[data-read]').hasAttribute('aria-busy'));
      check(await root().getAttribute('data-report-status') === scenario && await read().isEnabled() && await page.getByRole('button', { name: '停止等待' }).count() === 0, { kind: 'read-still-pending-is-refreshable', scenario });
    }
    if (scenario === 'invalid') { await toggle('展开合并事项的每日来源'); check(await page.getByText('未验证引用（无链接）').count() === 2 && await page.locator('a[href^="javascript:"]').count() === 0, { kind: 'invalid-reference-no-link' }); }
    if (scenario === 'read-error') { await enter(read()); await page.locator('.rhine-notice strong').filter({ hasText: '状态读取失败' }).waitFor(); check(await read().evaluate(el => el === document.activeElement), { kind: 'read-error-focus' }); check(await root().getAttribute('data-generation-count') === '0', { kind: 'refresh-never-generates' }); await enter(read()); await enter(page.getByRole('button', { name: '停止等待' })); check(await page.locator('.rhine-notice strong').filter({ hasText: '状态读取失败' }).isVisible(), { kind: 'cancel-retains-read-error' }); }
    behavior.push({ scenario, text });
  }
  for (const mode of ['normal', 'system', 'manual']) {
    await start('rhine', 400, 2, mode); await page.getByLabel('报告合成场景').selectOption('idle');
    await enter(generate());
    check(await generate().getAttribute('aria-busy') === 'true' && await generate().evaluate(el => el === document.activeElement), { kind: 'busy-immediate-focus', mode });
    const spin = await page.locator('.rhine-spinner').evaluate(el => ({ duration: getComputedStyle(el).animationDuration, play: getComputedStyle(el).animationPlayState }));
    check(mode === 'normal' ? spin.duration !== '0s' : spin.duration === '0s', { kind: 'motion-preference-style', mode, spin });
    await status('generating'); await status('completed');
    const visible = await page.locator('[data-summary]').evaluate(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && Number(s.opacity) > 0; });
    check(visible && (await page.locator('[data-report-feedback]').innerText()).includes('AI 摘要已生成'), { kind: 'same-result-with-motion', mode });
    await enter(read()); await page.waitForFunction(() => !document.querySelector('[data-read]').hasAttribute('aria-busy'));
    check(await root().getAttribute('data-generation-count') === '1', { kind: 'read-count', mode });
    await page.getByLabel('报告合成场景').selectOption('failed'); await enter(generate()); await status('failed');
    check(await generate().evaluate(el => el === document.activeElement), { kind: 'generation-error-focus', mode });
    motion.push({ mode, spin, visible });
  }
  await start();
  await enter(generate()); await status('generating');
  await page.getByLabel('报告周期').focus(); await page.getByLabel('报告周期').selectOption('month');
  check(await page.getByLabel('报告周期').evaluate(el => el === document.activeElement), { kind: 'period-change-focus' });
  await page.waitForTimeout(1900);
  check(await root().getAttribute('data-scope') === '示例人员 A:month' && await root().getAttribute('data-generation-count') === '0' && !(await page.locator('[data-report-feedback]').innerText()).includes('AI 摘要已生成'), { kind: 'late-period-response' });
  check((await page.locator('[data-period-boundary]').innerText()).includes('2026-11-01') && await page.locator('[data-daily]').count() === 31, { kind: 'month-explicit-boundary' });
  await enter(generate()); await status('generating'); await page.getByLabel('报告对象').selectOption('示例人员 B'); await page.waitForTimeout(1900);
  check(await root().getAttribute('data-scope') === '示例人员 B:month' && await root().getAttribute('data-generation-count') === '0', { kind: 'late-identity-response' });
  await enter(generate()); await status('generating'); await enter(page.getByRole('button', { name: '停止等待' })); check(await read().evaluate(el => el === document.activeElement), { kind: 'cancel-focus' }); await page.waitForTimeout(1900); await status('unknown');
  const cancelled = await page.evaluate(() => window.__reportTimers);
  check(cancelled.pending.length === 0 && cancelled.cancelled >= 3, { kind: 'real-timers-cancelled', cancelled });
  await enter(read()); await status('completed');
  await enter(generate()); await status('generating'); await enter(page.getByRole('button', { name: '卸载报告演示' }));
  await page.waitForTimeout(1900); const unmounted = await page.evaluate(() => window.__reportTimers);
  check(await root().count() === 0 && unmounted.pending.length === 0 && unmounted.cancelled > cancelled.cancelled, { kind: 'unmount-cleans-timers', unmounted });
  await enter(page.getByRole('button', { name: '挂载报告演示' })); check(await root().getAttribute('data-generation-count') === '0', { kind: 'remount-no-old-success' });
  await page.getByLabel('报告合成场景').selectOption('completed'); await toggle('每日资料');
  const last = page.locator('[data-daily]').last(); await last.scrollIntoViewIfNeeded(); check((await last.innerText()).includes('2026-10-31'), { kind: 'last-month-day-reachable' });
  // Real gallery routing rather than only the fixture.
  await page.goto(`${origin}/#periodic-report`); await page.getByRole('heading', { name: '周期报告与跨日来源', exact: true }).waitFor();
  check(await root().count() === 1, { kind: 'real-gallery-route' });
  return { pass: !failures.length && !errors.length, failures, errors, layouts, behavior, motion, cancelled, unmounted, browser: page.context().browser()?.version(), skipped: ['native browser zoom', 'screen-reader speech', 'native select keyboard option change (initial attempt did not change value; selection used selectOption)', 'real model/service/scheduler'] };
}
