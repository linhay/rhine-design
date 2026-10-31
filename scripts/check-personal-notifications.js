async page => {
  const origin = await page.evaluate(() => location.origin), params = await page.evaluate(() => Object.fromEntries(new URLSearchParams(location.search)));
  const failures = [], errors = [], layouts = [], behavior = [], motion = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const dialog = () => page.getByRole('dialog');
  const card = () => page.locator('[data-notification-rule="1"]');
  const action = name => dialog().getByRole('button', { name, exact: true });
  const settled = () => page.waitForFunction(() => document.querySelector('[data-notification-rule="1"]')?.dataset.pending === 'idle');
  const enter = async locator => { await locator.focus(); await page.keyboard.press('Enter'); };
  const activeText = () => page.evaluate(() => document.activeElement?.textContent || document.activeElement?.tagName);
  const start = async (theme = 'rhine', width = 880, zoom = 1, mode = 'normal') => {
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width, height: 648 });
    await page.goto(`${origin}/?fixture=personal-notifications&theme=${theme}${mode === 'manual' ? '&motion=manual' : ''}`);
    await page.locator('.rhine-theme').evaluate((element, zoom) => { element.style.zoom = String(zoom); }, zoom);
  };
  const open = async () => { await enter(page.getByRole('button', { name: '编辑成员甲 · 变更提醒', exact: true })); await dialog().waitFor(); await page.waitForTimeout(220); };
  const controls = async () => {
    const summary = dialog().locator('summary').filter({ hasText: '合成情境控制' });
    if (!(await summary.evaluate(el => el.parentElement.open))) await enter(summary);
    await summary.evaluate(el => Promise.all(el.parentElement.getAnimations().map(animation => animation.finished.catch(() => {}))));
  };
  const bounds = locator => locator.evaluate(el => {
    const cut = [];
    for (const node of el.querySelectorAll('.rhine-text, .rhine-badge, .rhine-notice strong, .rhine-notice__body, .rhine-multi-select__tags > li > span, button > span:not(.rhine-sr-only)')) {
      if (!node.getClientRects().length || node.closest('[hidden]') || (node.closest('details:not([open])') && !node.closest('summary'))) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      // Reveal each line in its actual scrolling ancestors before testing clipping.
      // Closed Disclosure content is intentionally excluded; open content is checked.
      for (let line = 0; line < range.getClientRects().length; line++) {
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if ((['auto', 'scroll'].includes(style.overflowY) || parent === document.scrollingElement) && parent.scrollHeight > parent.clientHeight) {
            const rect = range.getClientRects()[line], box = parent === document.scrollingElement ? { top: 0, height: innerHeight } : parent.getBoundingClientRect();
            const scale = parent === document.scrollingElement ? 1 : box.height / parent.offsetHeight;
            parent.scrollTop += ((rect.top + rect.bottom) / 2 - (box.top + box.height / 2)) / scale;
          }
          if (parent.matches('[role="dialog"]')) break;
        }
        const rect = range.getClientRects()[line];
        for (let parent = node; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if ((['hidden', 'clip'].includes(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) || (['hidden', 'clip'].includes(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1))) cut.push(node.textContent);
        // The viewport-positioned Dialog is not clipped by the scroll-locked body's flow box.
        if (style.position === 'fixed') break;
        }
      }
    }
    return { fits: el.scrollWidth <= el.clientWidth + 1, pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, cut: [...new Set(cut)] };
  });
  const reachable = async locator => {
    await locator.scrollIntoViewIfNeeded();
    return locator.evaluate(el => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { visible: r.width > 0 && r.height > 0 && Number(s.opacity) > 0 && s.visibility !== 'hidden', inView: r.top >= -1 && r.bottom <= innerHeight + 1, hit: el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)), height: r.height };
    });
  };
  const layout = async (label, root, last) => {
    const b = await bounds(root), end = await reachable(last);
    check(b.fits && b.pageFits && b.cut.length === 0 && end.visible && end.inView && end.hit, { kind: 'layout', label, bounds: b, end });
    layouts.push({ label, bounds: b, end });
  };
  // Observe only the recipe response delays; keep the browser clock and interactions real.
  await page.addInitScript(() => {
    const set = window.setTimeout, clear = window.clearTimeout, interval = window.setInterval;
    const state = window.__notificationTimers = { scheduled: 0, cancelled: 0, fired: 0, intervals: 0, pending: [] };
    window.setTimeout = function (handler, delay, ...args) {
      if (![450, 650].includes(Number(delay)) || typeof handler !== 'function') return set(handler, delay, ...args);
      state.scheduled++;
      const id = set(() => { state.pending = state.pending.filter(value => value !== id); state.fired++; handler(...args); }, delay);
      state.pending.push(id); return id;
    };
    window.clearTimeout = id => { if (state.pending.includes(id)) { state.cancelled++; state.pending = state.pending.filter(value => value !== id); } return clear(id); };
    window.setInterval = (...args) => { state.intervals++; return interval(...args); };
  });
  try {
    if (!params.phase || params.phase === 'layout') {
      for (const theme of params.probe ? ['rhine'] : ['rhine', 'arknights', 'neo-brutalism', 'neutral']) for (const width of params.probe ? [400] : [400, 520, 880]) for (const zoom of params.probe ? [2] : [1, 2]) {
        const label = `${theme}/${width}/css${zoom * 100}`; await start(theme, width, zoom);
        await page.getByRole('checkbox', { name: '通知长文', exact: true }).check();
        await layout(`${label}/cards`, page.locator('#personal-notifications'), page.getByRole('button', { name: '编辑成员甲 · 完成提醒', exact: true }));
        await open();
        if (params.probe === 'clip') await dialog().locator('[data-notification-audience]').evaluate(el => { el.style.height = '1px'; el.style.overflow = 'hidden'; });
        await layout(`${label}/editor`, dialog(), action('启用订阅'));
        await controls(); await action('停用全部渠道').click(); await enter(action('启用订阅'));
        check(await dialog().getByRole('combobox', { name: '接收渠道', exact: true }).evaluate(el => el === document.activeElement), { kind: 'invalid-channel-focus', label });
        await layout(`${label}/no-channel`, dialog(), action('保存停用草稿'));
        await dialog().getByRole('button', { name: '关闭对话框', exact: true }).click(); await dialog().waitFor({ state: 'hidden' });
        await page.getByRole('tab', { name: '通知记录', exact: true }).click();
        await layout(`${label}/unknown-delivery`, page.locator('[data-delivery-record]'), page.getByRole('button', { name: '读取投递状态', exact: true }));
      }
      // A narrow local host inside a wide desktop is distinct from a narrow viewport.
      for (const theme of ['rhine', 'arknights', 'neo-brutalism', 'neutral']) for (const zoom of [1, 2]) {
        await start(theme, 1280, zoom); await page.locator('main').evaluate((el, zoom) => { el.style.width = `${400 / zoom}px`; }, zoom);
        await page.getByRole('checkbox', { name: '通知长文', exact: true }).check();
        await layout(`${theme}/local400/css${zoom * 100}`, page.locator('main'), page.getByRole('button', { name: '编辑成员甲 · 完成提醒', exact: true }));
      }
    }
    if (!params.phase || params.phase === 'behavior') {
      await start(); await open(); await page.waitForTimeout(500);
      const input = dialog().getByRole('combobox', { name: '事件对象', exact: true });
      await input.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape');
      check(await dialog().isVisible() && await input.evaluate(el => el === document.activeElement), { kind: 'candidate-escape-focus' });
      await dialog().getByLabel('条件说明', { exact: true }).fill('当前条件草稿保留');
      await dialog().getByLabel('接收渠道', { exact: true }).selectOption('group'); await enter(action('查看示例')); await settled();
      check((await dialog().locator('[data-notification-preview]').textContent()).includes('登录后') && !(await dialog().locator('[data-notification-preview]').textContent()).includes('资源 A'), { kind: 'group-audience-preview' });
      await controls(); await dialog().getByRole('checkbox', { name: '模拟保存冲突', exact: true }).check();
      await enter(action('保存停用草稿')); await settled();
      check((await dialog().getByRole('alert').textContent()).includes('保存冲突') && await dialog().getByLabel('条件说明', { exact: true }).inputValue() === '当前条件草稿保留', { kind: 'save-conflict-draft' });
      await dialog().getByRole('checkbox', { name: '模拟保存冲突', exact: true }).uncheck();
      await enter(action('保存停用草稿')); await settled(); check(await card().getAttribute('data-enabled') === 'false', { kind: 'save-not-enable' });
      await enter(action('启用订阅')); await settled(); check(await card().getAttribute('data-enabled') === 'true', { kind: 'explicit-enable' });
      await action('撤销一个对象').click();
      check(!(await page.locator('body').textContent()).includes('资源 A') && (await dialog().getByRole('list', { name: '事件对象已选项' }).textContent()).includes('资源 B'), { kind: 'permission-scrub-partial' });
      check(await card().getAttribute('data-enabled') === 'false', { kind: 'revocation-pauses' });
      await action('撤销全部对象').click(); await enter(action('启用订阅'));
      check(await input.evaluate(el => el === document.activeElement), { kind: 'invalid-object-focus' });
      await page.keyboard.press('Escape'); await action('恢复可选范围').click();
      check(await dialog().getByRole('list', { name: '事件对象已选项' }).textContent() === '' && await card().getAttribute('data-enabled') === 'false', { kind: 'recovery-no-auto-selection-or-enable' });
      await enter(action('保存停用草稿')); await action('取消等待').click();
      check((await activeText()).includes('保存停用草稿'), { kind: 'cancel-focus' }); await page.waitForTimeout(750);
      check((await dialog().textContent()).includes('已取消等待') && await card().getAttribute('data-pending') === 'idle', { kind: 'cancel-remains-unconfirmed' });
      await dialog().getByRole('button', { name: '关闭对话框', exact: true }).focus(); await page.keyboard.press('Escape'); await dialog().waitFor({ state: 'hidden' });
      check((await activeText()).includes('编辑成员甲 · 变更提醒'), { kind: 'dialog-close-focus' });
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); check(!await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), { kind: 'closed-dialog-tab', i }); }
      await page.getByRole('tab', { name: '通知记录', exact: true }).focus(); await page.keyboard.press('Enter');
      const read = page.getByRole('button', { name: '读取投递状态', exact: true });
      await page.locator('summary').filter({ hasText: /^场景控制/ }).click(); await page.getByRole('checkbox', { name: '模拟投递读取失败', exact: true }).check();
      await enter(read); check((await activeText()).includes('读取投递状态'), { kind: 'read-pending-focus' });
      await page.waitForFunction(() => document.querySelector('[data-delivery-record]')?.getAttribute('data-pending') === 'false');
      check((await activeText()).includes('读取投递状态') && await page.getByText('投递结果未知', { exact: true }).isVisible(), { kind: 'read-failure-focus-unknown' });
      await page.getByRole('checkbox', { name: '模拟投递读取失败', exact: true }).uncheck(); await enter(read);
      await page.keyboard.press('Tab'); const moved = await activeText();
      await page.waitForFunction(() => document.querySelector('[data-delivery-record]')?.getAttribute('data-pending') === 'false');
      check(await page.getByText('渠道已受理，未确认已读', { exact: true }).isVisible(), { kind: 'accepted-not-read' });
      await page.getByRole('checkbox', { name: '模拟投递读取失败', exact: true }).check(); await enter(read);
      await page.waitForFunction(() => document.querySelector('[data-delivery-record]')?.getAttribute('data-pending') === 'false');
      check(await page.getByText('投递结果未知', { exact: true }).isVisible() && await page.getByText(/^上次确认：渠道已受理/).isVisible() && await page.getByText('渠道已受理，未确认已读', { exact: true }).count() === 0, { kind: 'later-failure-separates-history' });
      await enter(read); await page.getByRole('button', { name: '取消读取', exact: true }).click(); await page.waitForTimeout(750);
      check(await page.getByText('投递结果未知', { exact: true }).isVisible(), { kind: 'later-cancel-does-not-restore-certainty' });
      await page.getByRole('checkbox', { name: '模拟投递读取失败', exact: true }).uncheck();
      // A disappearing/disabled cancel action is not a stable destination; moving to the active tab is.
      await enter(read); await page.getByRole('tab', { name: '通知记录', exact: true }).focus(); await page.waitForTimeout(750);
      check(await page.getByRole('tab', { name: '通知记录', exact: true }).evaluate(el => el === document.activeElement), { kind: 'read-does-not-steal-focus', moved });
      await page.getByRole('tab', { name: '我的订阅', exact: true }).focus(); await page.keyboard.press('Enter'); await open();
      check(await dialog().getByLabel('条件说明', { exact: true }).inputValue() === '当前条件草稿保留', { kind: 'tabs-keep-draft' });
      await controls(); await dialog().getByLabel('切换合成身份', { exact: true }).selectOption('beta'); await dialog().waitFor({ state: 'hidden' }); await page.waitForTimeout(50);
      check(!(await page.locator('body').textContent()).includes('成员甲 ·') && !(await page.locator('body').textContent()).includes('资源 A'), { kind: 'member-isolation' });
      check(await page.getByLabel('当前身份', { exact: true }).evaluate(el => el === document.activeElement), { kind: 'identity-switch-focus' });
      await page.getByLabel('当前身份', { exact: true }).selectOption('admin'); check(await page.getByText('管理员全局规则', { exact: true }).isVisible() && await page.getByRole('tab', { name: '我的订阅', exact: true }).count() === 0, { kind: 'admin-isolation' });
      await page.getByLabel('当前身份', { exact: true }).selectOption('alpha'); await open(); await enter(action('查看示例'));
      await page.keyboard.press('Escape'); await dialog().waitFor({ state: 'hidden' }); await page.getByRole('button', { name: '卸载通知场景', exact: true }).click(); await page.waitForTimeout(800);
      const timers = await page.evaluate(() => ({ ...window.__notificationTimers, pending: window.__notificationTimers.pending.length }));
      check(timers.pending === 0 && timers.cancelled > 0 && timers.intervals === 0, { kind: 'unmount-cleanup', timers }); behavior.push({ complete: true, timers });
    }
    if (!params.phase || params.phase === 'motion') for (const mode of ['normal', 'system', 'manual']) {
      await start('rhine', 400, 2, mode); await open();
      const duration = await dialog().evaluate(el => getComputedStyle(el).animationDuration);
      await dialog().locator('summary').filter({ hasText: '合成情境控制' }).focus();
      await page.evaluate(() => {
        const el = document.querySelector('[role="dialog"] details'), start = performance.now();
        const samples = window.__notificationMotion = { values: [], done: false };
        const frame = () => { samples.values.push({ height: el.getBoundingClientRect().height, animations: el.getAnimations().length }); if (performance.now() - start < 350) requestAnimationFrame(frame); else samples.done = true; }; frame();
      });
      await controls(); await page.waitForFunction(() => window.__notificationMotion?.done);
      const samples = await page.evaluate(() => window.__notificationMotion.values);
      const heights = new Set(samples.map(value => Math.round(value.height))), animated = samples.some(value => value.animations > 0);
      check(mode === 'normal' ? animated && heights.size > 2 : !animated && heights.size <= 2, { kind: 'real-motion-samples', mode, samples });
      await action('停用全部渠道').click(); await enter(action('启用订阅'));
      check(await dialog().getByLabel('接收渠道', { exact: true }).evaluate(el => el === document.activeElement), { kind: 'motion-field-focus', mode });
      await enter(action('保存停用草稿')); await settled();
      check((await dialog().textContent()).includes('已保存停用草稿；尚未启用。'), { kind: 'motion-visible-result', mode });
      await layout(`${mode}/short/css200/result`, dialog(), action('保存停用草稿'));
      await page.keyboard.press('Escape'); await dialog().waitFor({ state: 'hidden' }); check((await activeText()).includes('编辑成员甲 · 变更提醒'), { kind: 'motion-close-focus', mode });
      motion.push({ mode, duration, samples });
    }
  } catch (error) { failures.push({ kind: 'exception', message: String(error) }); }
  return { pass: failures.length === 0 && errors.length === 0, failures, errors, layouts, behavior, motion, data: 'synthetic', zoom: 'CSS zoom; native browser zoom and screen reader speech not covered' };
}
