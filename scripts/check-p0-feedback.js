// Production-page P0 checks. Optional ?p0Probe=clip|cover injects a browser-only
// negative control; its returned pass MUST be false. It never edits the product.
async page => {
  const origin = new URL(page.url()).origin;
  const probe = new URL(page.url()).searchParams.get('p0Probe') || 'none';
  const failures = [], cases = [], errors = [];
  page.setDefaultTimeout(6000);
  page.on('pageerror', error => errors.push(String(error)));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  // Measure rendered text line fragments, not the element's bounding box alone.
  // Scroll only genuinely scrollable ancestors; hidden/clip is not a user exit.
  const readable = locator => locator.evaluate(async element => {
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const nodes = [], walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const painted = el => {
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) return false;
      }
      return true;
    };
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim() && painted(node.parentElement)) nodes.push(node);
    }
    const fragments = [];
    for (const node of nodes) {
      let line;
      for (let i = 0; i < node.length; i++) {
        if (!node.textContent[i].trim()) continue;
        const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        if (!line || Math.abs(r.top - line.top) > 1) {
          line = { node, start: i, end: i + 1, top: r.top }; fragments.push(line);
        } else line.end = i + 1;
      }
    }
    const inner = el => {
      const r = el.getBoundingClientRect(), sx = r.width / (el.offsetWidth || r.width || 1), sy = r.height / (el.offsetHeight || r.height || 1);
      return { left: r.left + el.clientLeft * sx, right: r.left + (el.clientLeft + el.clientWidth) * sx,
        top: r.top + el.clientTop * sy, bottom: r.top + (el.clientTop + el.clientHeight) * sy, sx, sy };
    };
    const bad = []; let samples = 0;
    for (const fragment of fragments) {
      const range = document.createRange(); range.setStart(fragment.node, fragment.start); range.setEnd(fragment.node, fragment.end);
      for (let p = fragment.node.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p), b = inner(p), r = range.getBoundingClientRect();
        if (/^(auto|scroll)$/.test(s.overflowY) && p.scrollHeight > p.clientHeight) {
          p.scrollTop += (r.top < b.top ? r.top - b.top : r.bottom > b.bottom ? r.bottom - b.bottom : 0) / b.sy;
        }
        if (/^(auto|scroll)$/.test(s.overflowX) && p.scrollWidth > p.clientWidth) {
          p.scrollLeft += (r.left < b.left ? r.left - b.left : r.right > b.right ? r.right - b.right : 0) / b.sx;
        }
      }
      // The viewport scrolls even when the root's computed overflow is visible.
      // Modal scroll locks (hidden/clip) must never be bypassed by this check.
      if (![document.documentElement, document.body].some(e => /hidden|clip/.test(getComputedStyle(e).overflowY))) {
        const r = range.getBoundingClientRect();
        window.scrollBy(0, r.top < 0 ? r.top : r.bottom > innerHeight ? r.bottom - innerHeight : 0);
      }
      await frame();
      let left = 0, top = 0, right = innerWidth, bottom = innerHeight;
      for (let p = fragment.node.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p), b = inner(p);
        if (/^(hidden|clip|auto|scroll)$/.test(s.overflowX)) { left = Math.max(left, b.left); right = Math.min(right, b.right); }
        if (/^(hidden|clip|auto|scroll)$/.test(s.overflowY)) { top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom); }
      }
      const r = range.getBoundingClientRect();
      const fits = r.width > 0 && r.height > 0 && r.left >= left - 1 && r.right <= right + 1 && r.top >= top - 1 && r.bottom <= bottom + 1;
      const points = [r.left + Math.min(2, r.width / 2), (r.left + r.right) / 2, r.right - Math.min(2, r.width / 2)];
      // Hit testing normally ignores pointer-events:none, including opaque
      // covers inheriting Radix's body lock. Temporarily include opaque painted
      // surfaces in this synchronous measurement, then restore exact inline CSS.
      // No clicks/events or frames run while the measurement override is active.
      const opaque = Array.from(document.querySelectorAll('*')).filter(e => {
        const s = getComputedStyle(e), b = e.getBoundingClientRect();
        const rgba = s.backgroundColor.match(/^rgba?\(([^)]+)\)$/);
        const channels = rgba?.[1].split(',').map(Number);
        const alpha = channels?.length === 3 ? 1 : channels?.[3];
        let opacity = 1;
        for (let p = e; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
        return s.pointerEvents === 'none' && alpha >= .99 && opacity >= .99 && painted(e)
          && b.right > r.left && b.left < r.right && b.bottom > r.top && b.top < r.bottom;
      }).map(e => ({ e, value: e.style.getPropertyValue('pointer-events'), priority: e.style.getPropertyPriority('pointer-events') }));
      let unobstructed;
      try {
        opaque.forEach(({ e }) => e.style.setProperty('pointer-events', 'auto', 'important'));
        unobstructed = fits && points.every(x => {
          samples++;
          const hit = document.elementFromPoint(x, (r.top + r.bottom) / 2);
          return hit && (element.contains(hit) || hit.contains(element));
        });
      } finally {
        opaque.forEach(({ e, value, priority }) => value ? e.style.setProperty('pointer-events', value, priority) : e.style.removeProperty('pointer-events'));
      }
      if (!fits || !unobstructed || !painted(fragment.node.parentElement)) bad.push({ text: range.toString(), fits, unobstructed });
    }
    return { pass: fragments.length > 0 && !bad.length, lines: fragments.length, samples, failures: bad.slice(0, 5) };
  });
  const waitPainted = async locator => {
    const handle = await locator.elementHandle();
    try {
      const ready = await page.waitForFunction(e => {
        if (!e?.isConnected) return false;
        for (let p = e; p; p = p.parentElement) {
          const s = getComputedStyle(p); if (s.visibility !== 'visible' || s.display === 'none' || Number(s.opacity) < .99) return false;
        }
        return e.getBoundingClientRect().height > 0;
      }, handle, { timeout: 6000 });
      await ready.dispose();
    } finally { await handle?.dispose(); }
  };
  const inject = async title => {
    if (probe === 'clip') await title.evaluate(e => { const wrapper = document.createElement('div'); e.before(wrapper); wrapper.append(e); wrapper.style.cssText = 'height:1px;overflow:hidden'; });
    if (probe === 'cover') await page.evaluate(() => { const cover = document.createElement('div'); cover.dataset.p0Cover = ''; cover.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:2147483647'; document.body.append(cover); });
  };
  let serial = 0;
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const mode of ['full', 'system', 'manual']) for (const zoom of [1, 2]) {
    const context = { theme, mode, width: 400, height: 648, zoom, probe }, start = failures.length, observations = [];
    try {
      await page.setViewportSize({ width: 400, height: 648 });
      await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
      await page.goto(`${origin}/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}&motion=${mode === 'manual' ? 'reduced' : 'full'}`);
      await page.getByRole('checkbox', { name: '长导航', exact: true }).check();
      await page.getByRole('checkbox', { name: '长操作文案', exact: true }).check();
      for (const outcome of ['error', 'success']) {
        await page.getByRole('combobox', { name: '保存结果' }).selectOption(outcome);
        await page.getByRole('button', { name: '打开设置', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: '设置', exact: true });
        await waitPainted(dialog);
        const draft = dialog.getByRole('textbox', { name: '工作区名称' });
        await draft.fill('P0 合成草稿');
        await dialog.getByRole('link', { name: '用户管理与权限', exact: true }).click();
        await dialog.getByRole('button', { name: '编辑成员 30', exact: true }).scrollIntoViewIfNeeded();
        const save = dialog.getByRole('button', { name: '保存当前工作区设置' });
        const action = await readable(save); check(action.pass, { ...context, outcome, kind: 'save-action-readable', action });
        await save.click();
        const title = dialog.locator('.rhine-notice strong');
        await title.waitFor(); await waitPainted(title);
        const result = await readable(title); check(result.pass, { ...context, outcome, kind: 'save-result-readable', result });
        // Controlled long-content fixture in the real Notice DOM; does not claim
        // a server response or change the application's state/implementation.
        const original = await title.textContent();
        await title.evaluate(e => { e.textContent += '。合成说明：请检查工作区名称并保留输入，滚动后必须能读到完整错误与下一步操作。'.repeat(4) + '验证末句'; });
        await inject(title);
        const long = await readable(title); check(long.pass, { ...context, outcome, kind: 'long-result-readable', long });
        if (probe === 'none' && mode === 'full' && zoom === 2 && outcome === 'error') await page.screenshot({ path: `output/playwright/p0-feedback/${theme}-long-error-end.png` });
        if (!long.pass && serial < 3) await page.screenshot({ path: `output/playwright/p0-feedback/${probe}-failure-${serial++}.png` });
        await page.locator('[data-p0-cover]').evaluateAll(nodes => nodes.forEach(e => e.remove()));
        if (probe === 'clip') await title.evaluate(e => { const wrapper = e.parentElement; wrapper.replaceWith(e); });
        await title.evaluate((e, text) => { e.textContent = text; }, original);
        const close = dialog.getByRole('button', { name: '关闭设置', exact: true });
        const exit = await readable(close); check(exit.pass, { ...context, outcome, kind: 'close-action-readable', exit });
        await dialog.getByRole('link', { name: '账号', exact: true }).click();
        check(await draft.inputValue() === 'P0 合成草稿', { ...context, outcome, kind: 'draft-retained' });
        await close.click(); await dialog.waitFor({ state: 'detached' });
        // Radix restores focus in its close-auto-focus task, after DOM removal.
        // Record the immediate observation; the interruption script separately
        // exercises reopening before/through those lifecycle boundaries.
        const immediateFocus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.slice(0, 40) }));
        const restored = await page.waitForFunction(() => document.activeElement?.textContent === '打开设置', undefined, { timeout: 1000 });
        await restored.dispose();
        observations.push({ outcome, action, result, long, exit, immediateFocus, restoredFocus: await page.evaluate(() => document.activeElement?.textContent) });
        check(await page.getByRole('button', { name: '打开设置', exact: true }).evaluate(e => e === document.activeElement), { ...context, outcome, kind: 'exit-focus', immediateFocus });
        check((await page.getByText('已保存名称：', { exact: false }).textContent()).includes(outcome === 'success' ? 'P0 合成草稿' : '研究工作区'), { ...context, outcome, kind: 'saved-value' });
      }
    } catch (error) { failures.push({ ...context, kind: 'exception', error: String(error) }); }
    cases.push({ ...context, pass: failures.length === start, observations });
  }
  // Real ErrorSummary submission/focus/link/correction path, kept separate from
  // the synthetic long Notice text fixture above.
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const mode of ['full', 'system', 'manual']) {
    const context = { theme, mode, width: 400, height: 648, zoom: 2, scope: 'error-summary' }, start = failures.length, observations = [];
    try {
      await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
      await page.goto(`${origin}/?theme=${theme}#form-workflow`);
      if (mode === 'manual') await page.getByRole('radio', { name: '减少动态', exact: true }).check();
      await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
      const form = page.locator('#form-workflow form'), url = page.url();
      const name = form.getByRole('textbox', { name: '工作区名称', exact: true });
      const address = form.getByRole('textbox', { name: '服务地址', exact: true });
      await name.fill('保留的合成名称'); await address.fill('invalid');
      await form.getByRole('button', { name: '验证配置', exact: true }).click();
      const summary = form.getByRole('region', { name: '请修正以下问题', exact: true });
      await summary.waitFor();
      check(await summary.evaluate(e => e === document.activeElement), { ...context, kind: 'summary-submission-focus' });
      const link = summary.getByRole('link', { name: '请输入有效的 HTTPS 服务地址', exact: true });
      const errorText = await readable(link); check(errorText.pass, { ...context, kind: 'summary-error-readable', errorText });
      await link.click();
      check(await address.evaluate(e => e === document.activeElement) && page.url() === url, { ...context, kind: 'summary-field-link-focus-and-route' });
      check(await name.inputValue() === '保留的合成名称', { ...context, kind: 'summary-retains-other-input' });
      await address.fill('https://example.invalid');
      check(await address.evaluate(e => e === document.activeElement), { ...context, kind: 'typing-does-not-refocus-summary' });
      await form.getByRole('button', { name: '验证配置', exact: true }).click();
      const result = form.getByText('配置格式通过', { exact: true }); await result.waitFor(); await waitPainted(result);
      const visible = await readable(result); check(visible.pass, { ...context, kind: 'corrected-result-readable', visible });
      observations.push({ errorText, visible, correctedAddress: await address.inputValue(), retainedName: await name.inputValue() });
      check(await summary.count() === 0, { ...context, kind: 'correction-clears-summary' });
    } catch (error) { failures.push({ ...context, kind: 'exception', error: String(error) }); }
    cases.push({ ...context, pass: failures.length === start, observations });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { pass: !failures.length && !errors.length, probe, cases, failures, errors,
    scope: 'Chromium production page, CSS zoom; line clipping and three hit-test samples per line. Includes opaque solid-color pointer-events:none surfaces; does not prove every pixel, translucent/image/pseudo-element covers or assistive technology.' };
}
