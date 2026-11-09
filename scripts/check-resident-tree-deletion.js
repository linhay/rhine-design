// Real native focus/DOM event order; no dispatched focus events. Production build.
async page => {
  const base = page.url().split('?')[0].split('#')[0];
  const probe = new URL(page.url()).searchParams.get('probe');
  const rows = [], failures = [], errors = [];
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(String(error)));
  const check = (value, message) => { if (!value) throw Error(message); };
  const item = id => page.locator(`[data-node-id="alpha-${id}"]`);
  const button = name => page.getByRole('button', { name, exact: true });
  const open = async (theme, width, zoom) => {
    await page.setViewportSize({ width, height: 754 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${base}?fixture=resident-tree&theme=${theme}&zoom=${zoom}&depth=26`);
    await item('depth-24').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const tree = document.querySelector('[role=tree]');
      window.__treeEvents = [];
      window.__watchedNode = null;
      for (const type of ['focusin', 'blur', 'focusout']) tree.addEventListener(type, event => {
        window.__treeEvents.push({ type, id: event.target.dataset.nodeId ?? 'empty-tree', related: event.relatedTarget?.tagName ?? null, connected: event.target.isConnected, active: document.activeElement?.tagName, trusted: event.isTrusted });
      }, true);
      const observer = new MutationObserver(records => {
        for (const record of records) for (const removed of record.removedNodes) if (removed === window.__watchedNode || removed.contains?.(window.__watchedNode)) {
          window.__treeEvents.push({ type: 'removed', id: window.__watchedNode.dataset.nodeId, connected: window.__watchedNode.isConnected });
        }
      });
      observer.observe(tree, { subtree: true, childList: true });
    });
    check(await item('depth-24').getAttribute('aria-level') === '26', 'not a real 26-level nested tree');
    check(await item('depth-24').getAttribute('aria-expanded') === null, 'leaf claims expanded');
  };
  const watchFocus = async () => item('depth-24').evaluate(el => { el.focus(); window.__watchedNode = el; window.__treeEvents.length = 0; });
  const mutate = async name => {
    if (probe === 'lost-focus') await page.evaluate(() => {
      const nativeFocus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (...args) { if (this.closest('[role=tree]')) return; return nativeFocus.apply(this, args); };
    });
    // Host data update without a pointer/focus transfer to the action button.
    // React removes actual DOM; ensuing blur/focusout remain native/trusted.
    await button(name).evaluate(el => el.click());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const focusEvidence = async expected => {
    const result = await page.evaluate(id => {
      const el = id ? document.querySelector(`[data-node-id="alpha-${id}"]`) : document.querySelector('[role=tree]');
      const row = el?.querySelector(':scope > .rhine-browse-row') ?? el;
      const rect = row.getBoundingClientRect(), tree = el.closest('[role=tree]').getBoundingClientRect();
      return { focused: el === document.activeElement, row: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }, tree: { top: tree.top, bottom: tree.bottom }, viewport: { width: innerWidth, height: innerHeight }, stops: document.querySelectorAll('[role=treeitem][tabindex="0"], [role=tree][tabindex="0"]').length, events: window.__treeEvents };
    }, expected);
    check(result.focused, `lost recovery to ${expected ?? 'empty tree'}: ${JSON.stringify(result.events)}`);
    check(result.stops === 1, 'tree must keep one Tab stop');
    check(result.row.top >= result.tree.top - 1 && result.row.bottom <= result.tree.bottom + 1, 'focused row outside actual tree viewport');
    check(result.row.top >= -1 && result.row.bottom <= result.viewport.height + 1, 'focused row outside browser viewport');
    check(result.events.some(event => event.type === 'focusout' && event.related === null && event.connected && event.trusted), 'did not observe native pre-detach focusout');
    check(result.events.some(event => event.type === 'removed' && !event.connected), 'missing actual focused-node removal');
    return result;
  };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    for (const kind of ['delete-leaf', 'delete-ancestor', 'empty-tree', 'explicit-blur-body', 'external-focus']) {
      const context = { kind, theme, width, zoom };
      try {
        await open(theme, width, zoom);
        if (kind === 'delete-ancestor') { await item('depth-20').focus(); await page.keyboard.press('Enter'); }
        else if (kind !== 'empty-tree') { await item('depth-24').focus(); await page.keyboard.press('Enter'); }
        await watchFocus();
        let evidence;
        if (kind === 'explicit-blur-body') {
          await item('depth-24').evaluate(el => el.blur());
          await mutate('移除选中子树');
          check(await page.evaluate(() => document.activeElement === document.body), 'explicit blur stole focus from body');
          evidence = { active: 'BODY', events: await page.evaluate(() => window.__treeEvents) };
        } else if (kind === 'external-focus') {
          await button('固定当前目标').focus();
          await mutate('移除选中子树');
          check(await button('固定当前目标').evaluate(el => document.activeElement === el), 'deletion stole external focus');
          evidence = { active: 'external action', events: await page.evaluate(() => window.__treeEvents) };
        } else {
          const stable = kind === 'empty-tree' ? null : await item(kind === 'delete-leaf' ? 'depth-23' : 'depth-19').elementHandle();
          await mutate(kind === 'empty-tree' ? '空快照' : '移除选中子树');
          const recovered = kind === 'empty-tree' ? null : kind === 'delete-leaf' ? 'depth-23' : 'depth-19';
          evidence = await focusEvidence(recovered);
          if (stable) check(await item(recovered).evaluate((el, prior) => el === prior, stable), 'surviving ancestor was remounted');
          if (kind === 'empty-tree') {
            await button('恢复合成快照').evaluate(el => el.click());
            check(await item('root').evaluate(el => el === document.activeElement), 'empty-to-data lost owned focus');
          } else {
            await page.keyboard.press('Home');
            check(await item('root').evaluate(el => el === document.activeElement), 'Home did not recover root');
            check(await item(recovered).getAttribute('aria-selected') === 'true', 'focus navigation changed selection');
            await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
            check(await item(recovered).evaluate(el => el === document.activeElement), 'Tab reentry did not retain selected stop');
          }
        }
        check(await page.locator('[role=treeitem][tabindex="0"], [role=tree][tabindex="0"]').count() === 1, 'not one final Tab stop');
        rows.push({ ...context, status: 'PASS', evidence });
      } catch (error) { failures.push({ ...context, error: String(error) }); }
    }
  }
  return { pass: !failures.length && !errors.length, rows, failures, errors, userAgent: await page.evaluate(() => navigator.userAgent), boundary: 'Native Chromium focus events and real React DOM deletion; host update via click() retains existing focus. CSS zoom; no native zoom/screen-reader/device/backend claim.' };
}
