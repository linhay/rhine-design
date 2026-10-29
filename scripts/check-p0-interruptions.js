// Real browser time and React lifecycle. ?p0Probe=stale-timer|lost-draft|inactive-focus
// is an opt-in browser-only negative control, expected to return pass:false.
async page => {
  const origin = new URL(page.url()).origin, probe = new URL(page.url()).searchParams.get('p0Probe') || 'none';
  const failures = [], cases = [], errors = [];
  page.setDefaultTimeout(6000);
  page.on('pageerror', error => errors.push(String(error)));
  const check = (ok, detail) => { if (!ok) failures.push(detail); };
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const instrumentTimers = () => page.evaluate(probe => {
    const set = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window);
    const state = { entries: [] }; window.__p0Timers = state;
    window.setTimeout = (callback, delay, ...args) => {
      if (typeof callback !== 'function' || ![500, 700].includes(delay)) return set(callback, delay, ...args);
      const entry = { delay, created: performance.now(), fired: null, cleared: null, clearAttempted: null, id: 0 };
      entry.id = set(() => { entry.fired = performance.now(); callback(...args); }, delay);
      state.entries.push(entry); return entry.id;
    };
    window.clearTimeout = id => {
      const entry = state.entries.find(item => item.id === id);
      if (entry) {
        entry.clearAttempted = performance.now();
        if (probe === 'stale-timer' && entry.delay === 700) return;
        entry.cleared = performance.now();
      }
      clear(id);
    };
  }, probe);
  const timers = () => page.evaluate(() => window.__p0Timers.entries);
  const until = async deadline => {
    const ready = await page.waitForFunction(t => performance.now() >= t, deadline, { timeout: 6000 }); await ready.dispose();
  };
  const newestTimer = async (delay, afterId = -1) => {
    const ready = await page.waitForFunction(({ delay, afterId }) => window.__p0Timers.entries.some(e => e.delay === delay && e.id > afterId && !e.fired && !e.cleared), { delay, afterId });
    await ready.dispose(); return (await timers()).filter(e => e.delay === delay).at(-1);
  };
  const gallery = async (section, theme, mode) => {
    await page.goto(`${origin}/?theme=${theme}#${section}`);
    if (mode === 'manual') await page.getByRole('radio', { name: '减少动态', exact: true }).check();
    await frames();
  };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const mode of ['full', 'system', 'manual']) {
    const context = { theme, mode, probe }, start = failures.length, observations = [];
    await page.setViewportSize({ width: 400, height: 900 });
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    try {
      await page.goto(`${origin}/?fixture=settings-dialog&theme=${theme}&motion=${mode === 'manual' ? 'reduced' : 'full'}`);
      const trigger = page.getByRole('button', { name: '打开设置', exact: true });
      const dialog = page.getByRole('dialog', { name: '设置', exact: true });
      const transient = [];
      for (let cycle = 0; cycle < 3; cycle++) {
        await trigger.focus(); await page.keyboard.press('Enter');
        const sample = await dialog.evaluate(e => ({ duration: getComputedStyle(e).animationDuration,
          active: e.contains(document.activeElement), animations: e.getAnimations().map(a => ({ time: a.currentTime, duration: a.effect.getTiming().duration, state: a.playState })) }));
        transient.push(sample);
        check(sample.active, { ...context, kind: 'immediate-open-focus', cycle, sample });
        check(mode === 'full' ? parseFloat(sample.duration) > 0 : parseFloat(sample.duration) === 0, { ...context, kind: 'dialog-motion-policy', sample });
        // No animation-finished wait: Escape interrupts the actual entrance.
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
        await frames();
        check(await trigger.evaluate(e => e === document.activeElement), { ...context, kind: 'rapid-close-focus', cycle });
      }
      if (mode === 'full') check(transient.some(s => s.animations.some(a => a.state === 'running' && a.time < a.duration)), { ...context, kind: 'entrance-interruption-window-exercised', transient });
      observations.push({ stage: 'rapid-dialog', transient });
      await instrumentTimers();
      for (const outcome of ['error', 'success']) {
        await page.getByRole('combobox', { name: '保存结果' }).selectOption(outcome);
        await trigger.click();
        const draft = dialog.getByRole('textbox', { name: '工作区名称' });
        await draft.fill('已提交 A');
        const save = dialog.getByRole('button', { name: '保存当前工作区设置' });
        await save.click(); const request = await newestTimer(500);
        await save.press('Enter');
        check((await timers()).filter(e => e.delay === 500 && e.created >= request.created).length === 1, { ...context, outcome, kind: 'duplicate-save-guard' });
        // This host explicitly permits closing while saving. Completion may update
        // the saved value, but must not overwrite a new edit after reopening.
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
        await trigger.focus(); await page.keyboard.press('Enter');
        await draft.fill('重新打开后的 B');
        const editedBeforeCompletion = await page.evaluate(id => !window.__p0Timers.entries.find(e => e.id === id).fired, request.id);
        check(editedBeforeCompletion, { ...context, outcome, kind: 'pending-reopen-window-exercised' });
        await until(request.created + request.delay + 80);
        if (probe === 'lost-draft') await draft.evaluate(e => { e.value = '已提交 A'; });
        check(await draft.inputValue() === '重新打开后的 B', { ...context, outcome, kind: 'late-result-keeps-new-draft' });
        observations.push({ stage: 'late-save', outcome, editedBeforeCompletion, request: (await timers()).find(e => e.id === request.id), draft: await draft.inputValue() });
        const notice = dialog.locator('.rhine-notice');
        check((await notice.textContent()).includes(outcome === 'success' ? '已保存' : '保存失败'), { ...context, outcome, kind: 'captured-save-result' });
        // Backend outcome is a fixture control; change only the synthetic result,
        // without closing the editor or claiming a real network persistence test.
        await page.getByRole('combobox', { name: '保存结果', includeHidden: true }).selectOption('success', { force: true });
        await draft.fill('修正后 C'); await save.click();
        await dialog.getByText('已保存演示草稿', { exact: true }).waitFor();
        check(await draft.inputValue() === '修正后 C', { ...context, outcome, kind: 'retry-keeps-corrected-draft' });
        check((await page.getByText('已保存名称：', { exact: false }).textContent()).includes('修正后 C'), { ...context, outcome, kind: 'retry-saved-value' });
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      }
      // Real route unmount; timer observer records cleanup without substituting a
      // fake clock or treating an absent DOM node alone as cancellation evidence.
      await gallery('settings-dialog', theme, mode); await instrumentTimers();
      await page.getByRole('button', { name: '打开设置', exact: true }).click();
      await dialog.getByRole('link', { name: '异步栏目', exact: true }).click();
      await dialog.getByRole('button', { name: '保存当前工作区设置' }).click();
      const pending = (await timers()).filter(e => !e.fired && !e.cleared);
      check(pending.length === 2, { ...context, kind: 'unmount-pending-precondition', pending });
      await page.evaluate(() => { location.hash = '#top'; });
      await dialog.waitFor({ state: 'detached' }); await frames();
      await until(Math.max(...pending.map(e => e.created + e.delay)) + 80);
      const after = await timers();
      observations.push({ stage: 'settings-unmount', pending, after });
      check(pending.length === 2 && pending.every(e => { const final = after.find(item => item.id === e.id); return final.cleared !== null && final.fired === null; }), { ...context, kind: 'settings-unmount-cancels-pending', after });
    } catch (error) { failures.push({ ...context, kind: 'settings-exception', error: String(error) }); }
    try {
      await gallery('summary-tabs', theme, mode);
      const group = page.locator('[data-tabs-layout=full]'), first = group.getByRole('tab', { name: '当前对象', exact: true });
      await group.getByRole('textbox').fill('页签草稿 D'); await first.focus();
      const samples = [];
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(i % 2 ? 'Home' : 'End');
        if (probe === 'inactive-focus' && i === 0) await group.locator('[role=tabpanel][hidden] input').evaluate(e => { e.parentElement.closest('[role=tabpanel]').hidden = false; e.focus(); });
        const sample = await group.evaluate(e => {
          const selected = e.querySelector('[role=tab][aria-selected=true]'), panel = document.getElementById(selected.getAttribute('aria-controls'));
          const focusedPanel = document.activeElement?.closest('[role=tabpanel]');
          return { selected: selected.textContent, focused: selected === document.activeElement, panelCount: e.querySelectorAll('[role=tabpanel]:not([hidden])').length,
            inactiveFocus: Boolean(focusedPanel && focusedPanel !== panel), duration: getComputedStyle(panel).animationDuration,
            animations: panel.getAnimations().map(a => ({ time: a.currentTime, duration: a.effect.getTiming().duration, state: a.playState })) };
        }); samples.push(sample);
        check(sample.focused && !sample.inactiveFocus && sample.panelCount === 1, { ...context, kind: 'rapid-tabs-focus-and-panel', step: i, sample });
        // Restore the deliberate breach after recording it, so unrelated paths
        // still execute and a control cannot pass merely by causing a timeout.
        if (probe === 'inactive-focus' && i === 0) await group.evaluate(e => {
          const selected = e.querySelector('[role=tab][aria-selected=true]');
          e.querySelectorAll('[role=tabpanel]').forEach(p => { p.hidden = p.id !== selected.getAttribute('aria-controls'); });
          selected.focus();
        });
      }
      observations.push({ stage: 'rapid-tabs', samples });
      check(await group.getByRole('textbox').inputValue() === '页签草稿 D', { ...context, kind: 'rapid-tabs-draft' });
      if (mode === 'full') check(samples.some(s => s.animations.some(a => a.state === 'running' && a.time < a.duration)), { ...context, kind: 'tabs-interruption-window-exercised' });
      else check(samples.every(s => parseFloat(s.duration) === 0), { ...context, kind: 'reduced-tabs-full-path' });
      await group.getByRole('tab', { name: '自定义范围', exact: true }).focus(); await page.keyboard.press('Enter');
      for (const key of ['Tab', 'Shift+Tab']) for (let i = 0; i < 8; i++) {
        await page.keyboard.press(key);
        check(await page.evaluate(() => !document.activeElement?.closest('[role=tabpanel][hidden]')), { ...context, kind: 'tabs-hidden-traversal', key, step: i });
      }
    } catch (error) { failures.push({ ...context, kind: 'tabs-exception', error: String(error) }); }
    try {
      await gallery('motion', theme, mode); await instrumentTimers();
      const card = page.locator('[data-kind=result]');
      await card.getByRole('button', { name: '播放操作 → 结果', exact: true }).click();
      const old = await newestTimer(700); await until(old.created + 250);
      const replay = card.getByRole('button', { name: '重播操作 → 结果', exact: true });
      await replay.click(); const fresh = await newestTimer(700, old.id);
      check(fresh.id !== old.id, { ...context, kind: 'replay-new-generation', old, fresh });
      await until(old.created + 740);
      const middle = (await timers()).find(e => e.id === old.id);
      check(middle.cleared !== null && middle.fired === null && await card.locator('.ds-result-reveal').count() === 0, { ...context, kind: 'replay-cancels-old-completion', middle });
      check(await replay.evaluate(e => e === document.activeElement), { ...context, kind: 'replay-focus' });
      const result = card.getByText('已完成 · 演示', { exact: true }); await result.waitFor();
      const resultHandle = await result.elementHandle();
      const painted = await page.waitForFunction(e => Number(getComputedStyle(e).opacity) >= .99, resultHandle);
      await painted.dispose(); await resultHandle.dispose();
      await result.scrollIntoViewIfNeeded();
      const resultState = await result.evaluate(e => {
        const r = e.getBoundingClientRect(); let left = 0, top = 0, right = innerWidth, bottom = innerHeight;
        for (let p = e.parentElement; p; p = p.parentElement) {
          const s = getComputedStyle(p), b = p.getBoundingClientRect();
          if (/hidden|clip|auto|scroll/.test(s.overflowX)) { left = Math.max(left, b.left + p.clientLeft); right = Math.min(right, b.left + p.clientLeft + p.clientWidth); }
          if (/hidden|clip|auto|scroll/.test(s.overflowY)) { top = Math.max(top, b.top + p.clientTop); bottom = Math.min(bottom, b.top + p.clientTop + p.clientHeight); }
        }
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { text: e.textContent, opacity: getComputedStyle(e).opacity, duration: getComputedStyle(e).animationDuration, rect: r.toJSON(),
          reachable: r.left >= left - 1 && r.right <= right + 1 && r.top >= top - 1 && r.bottom <= bottom + 1 && Boolean(hit && (e.contains(hit) || hit.contains(e))) };
      });
      check(resultState.reachable, { ...context, kind: 'motion-result-scroll-reachable', resultState });
      check(await replay.evaluate(e => e === document.activeElement), { ...context, kind: 'result-scroll-keeps-focus' });
      if (probe === 'none' && mode === 'full') await page.screenshot({ path: `output/playwright/p0-feedback/${theme}-motion-result.png` });
      check(resultState.rect.width > 0 && resultState.rect.height > 0 && (mode === 'full' ? parseFloat(resultState.duration) > 0 : parseFloat(resultState.duration) === 0), { ...context, kind: 'motion-result-policy', resultState });
      await replay.click(); const resetTimer = await newestTimer(700);
      await card.getByRole('button', { name: '复位操作 → 结果', exact: true }).click();
      await until(resetTimer.created + 780);
      const reset = (await timers()).find(e => e.id === resetTimer.id);
      check(reset.cleared !== null && reset.fired === null && await card.locator('.ds-result-reveal').count() === 0, { ...context, kind: 'reset-cancels-result', reset });
      await card.getByRole('button', { name: '播放操作 → 结果', exact: true }).click(); const unmountTimer = await newestTimer(700);
      await page.evaluate(() => { location.hash = '#top'; }); await card.waitFor({ state: 'detached' });
      await until(unmountTimer.created + 780);
      const unmount = (await timers()).find(e => e.id === unmountTimer.id);
      observations.push({ stage: 'motion-lifecycle', old, fresh, middle, resultState, reset, unmount });
      check(unmount.cleared !== null && unmount.fired === null, { ...context, kind: 'motion-unmount-cancels-result', unmount });
    } catch (error) { failures.push({ ...context, kind: 'motion-exception', error: String(error) }); }
    cases.push({ ...context, pass: start === failures.length, observations });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { pass: !failures.length && !errors.length, probe, cases, failures, errors,
    scope: 'Chromium production React UI, real timers observed at 500/700ms; synthetic host data. No real backend or native assistive-technology claims.' };
}
