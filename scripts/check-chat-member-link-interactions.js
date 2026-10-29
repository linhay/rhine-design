async page => {
  page.setDefaultTimeout(4000);
  const { base, probe } = await page.evaluate(() => ({ base: `${location.origin}${location.pathname}`, probe: new URLSearchParams(location.search).get('memberProbe') }));
  const touchProbe = probe === 'touch24';
  const rows = [], motion = [], native = [], touch = [], errors = [];
  const mainContext = page.context(), watchedPages = new Map();
  const watchPage = target => {
    if (watchedPages.has(target)) return;
    const index = watchedPages.size, onError = error => errors.push({ page: index, error: String(error) });
    watchedPages.set(target, onError); target.on('pageerror', onError);
  };
  watchPage(page); mainContext.on('page', watchPage);
  const assert = (value, message) => { if (!value) throw Error(message); };
  const url = options => `${base}?${Object.entries({ fixture: 'chat-member-link', scene: 'team', ...options }).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}`;
  const settle = viewport => viewport.evaluate(node => new Promise(resolve => {
    let last = node.scrollTop, since = performance.now(); const start = since;
    function tick() { const now = performance.now(); if (Math.abs(last - node.scrollTop) > .1) { last = node.scrollTop; since = now; }
      if (now - since > 180 || now - start > 2500) resolve({ top: node.scrollTop, stable: now - since }); else requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }));
  async function returnCheck(viewport, id, top, loaded) {
    await page.waitForFunction(id => document.activeElement?.id === id, id);
    const final = await settle(viewport);
    assert(Math.abs(final.top - top) < 2, 'return displaced scrollTop: ' + JSON.stringify({ before: top, after: final.top }));
    assert(await viewport.locator('[data-chat-entry="member-history-a"], [data-chat-entry="member-history-b"]').count() === loaded, 'return lost loaded history');
    assert(await page.locator('[data-member-profile]').count() === 0, 'profile did not close');
    return final;
  }
  async function roundtrip(options) {
    await page.goto(url(options));
    const viewport = page.getByRole('region', { name: '成员导航聊天消息' }); await viewport.waitFor();
    await page.getByRole('button', { name: '加载更早消息', exact: true }).click();
    assert(await viewport.locator('[data-chat-entry="member-history-a"], [data-chat-entry="member-history-b"]').count() === 2, 'history was not loaded');
    await viewport.focus(); await page.keyboard.press('Home'); await settle(viewport);
    // Enter the author via real Tab, then reverse direction and enter it again.
    await page.keyboard.press('Tab');
    let id = await page.evaluate(() => document.activeElement?.id);
    assert(id?.startsWith('member-author-'), 'Tab did not enter a visible author link');
    const first = page.locator(`#${id}`);
    const focus = await first.evaluate(node => ({ visible: node.matches(':focus-visible'), outline: getComputedStyle(node).outlineWidth, hiddenHeader: !!node.closest('.rhine-sr-only') }));
    assert(focus.visible && parseFloat(focus.outline) >= 2 && !focus.hiddenHeader, 'keyboard focus ring missing or hidden');
    await page.keyboard.press('Shift+Tab');
    assert(await viewport.evaluate(node => node === document.activeElement), 'reverse Tab did not return to reader');
    await page.keyboard.press('Tab');
    const before = await settle(viewport);
    const expectedMember = await first.evaluate(node => new URL(node.href).searchParams.get('member'));
    await page.keyboard.press('Enter');
    await page.locator('[data-member-profile]').waitFor();
    assert(await page.evaluate(() => new URLSearchParams(location.search).get('member')) === expectedMember, 'Enter opened wrong member');
    assert(await page.locator('[data-member-profile] h2').evaluate(node => node === document.activeElement), 'destination heading did not receive focus');
    // Hidden retained chat cannot leak into the actual keyboard order in either direction.
    for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Tab']) {
      await page.keyboard.press(key);
      assert(await page.evaluate(() => !document.activeElement?.closest('[data-member-thread-host]')), 'hidden retained conversation entered Tab order');
    }
    await page.getByRole('button', { name: '返回聊天', exact: true }).click();
    const restored = await returnCheck(viewport, id, before.top, 2);
    // Each member is reachable by both visible name and decorative avatar, including the long name.
    const targets = ['member-a-1', 'member-b-1', 'member-c-1'];
    const activated = [];
    for (const entry of targets) for (const part of ['strong', '.rhine-chat-avatar']) {
      id = `member-author-${entry}`;
      const link = page.locator(`#${id}`); await link.focus(); await link.scrollIntoViewIfNeeded();
      const position = await settle(viewport), destination = await link.evaluate(node => new URL(node.href).searchParams.get('member'));
      // The independent time is visible/clickable without navigation.
      if (part === 'strong') {
        const time = link.locator('..').locator('time'); await time.click();
        assert(await page.locator('[data-member-profile]').count() === 0, 'timestamp navigated');
        await link.focus(); await link.scrollIntoViewIfNeeded();
      }
      const clickPosition = await settle(viewport);
      await link.locator(part).click(); await page.locator('[data-member-profile]').waitFor();
      assert(await page.evaluate(() => new URLSearchParams(location.search).get('member')) === destination, 'avatar/name destination differs');
      await page.goBack();
      await returnCheck(viewport, id, clickPosition.top, 2);
      activated.push({ entry, part, member: destination, beforeTop: position.top });
    }
    // Walk the entire visible author's tab sequence; continuations must never be stops.
    await viewport.focus(); await page.keyboard.press('Home'); await settle(viewport);
    const visited = [];
    const expected = await viewport.locator('.rhine-chat-member-link').count();
    for (let index = 0; index < expected + 1; index++) {
      await page.keyboard.press('Tab');
      const active = await page.evaluate(() => ({ id: document.activeElement?.id, hidden: !!document.activeElement?.closest('.rhine-sr-only'), author: document.activeElement?.classList.contains('rhine-chat-member-link') }));
      assert(!active.hidden, 'hidden continuation is keyboard reachable');
      if (active.author) visited.push(active.id);
    }
    assert(visited.length === expected && new Set(visited).size === expected, 'author Tab sequence lost or duplicated a visible entry');
    return { focus, restored, activated, tabStops: visited.length };
  }
  try {
    for (const theme of touchProbe ? [] : ['rhine', 'arknights', 'neo-brutalism', 'neutral']) for (const appearance of ['plain', 'bubble']) {
      const context = { theme, appearance, zoom: 2 };
      try { await page.setViewportSize({ width: 400, height: 900 }); rows.push({ ...context, pass: true, ...await roundtrip(context) }); }
      catch (error) { rows.push({ ...context, pass: false, error: String(error) }); }
    }
    for (const mode of touchProbe ? [] : ['system', 'manual']) {
      try {
        await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
        const result = await roundtrip({ theme: 'neutral', appearance: 'bubble', zoom: 2, motion: mode });
        const preference = await page.evaluate(() => ({ system: matchMedia('(prefers-reduced-motion:reduce)').matches, manual: document.querySelector('.rhine-theme')?.dataset.rhineMotion }));
        assert(mode === 'system' ? preference.system : preference.manual === 'reduced', 'reduced-motion setup not active');
        motion.push({ mode, pass: true, preference, ...result });
      } catch (error) { motion.push({ mode, pass: false, error: String(error) }); }
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Real browser-created tabs: the host must leave modified and auxiliary clicks native.
    await page.setViewportSize({ width: 880, height: 900 });
    for (const action of touchProbe ? [] : ['modified', 'middle', 'target']) {
      let popup;
      try {
        await page.goto(url({ theme: 'neutral', appearance: 'bubble', zoom: 1 }));
        const link = page.locator('#member-author-member-a-1'); await link.scrollIntoViewIfNeeded();
        const href = await link.evaluate(node => node.href);
        if (action === 'target') await link.evaluate(node => { node.target = '_blank'; node.rel = 'noopener'; });
        const modifiers = await page.evaluate(() => /Mac/.test(navigator.platform) ? ['Meta'] : ['Control']);
        [popup] = await Promise.all([page.context().waitForEvent('page', { timeout: 4000 }),
          link.click(action === 'middle' ? { button: 'middle' } : action === 'modified' ? { modifiers } : {})]); await popup.waitForLoadState(); await popup.locator('[data-member-profile]').waitFor();
        assert(popup.url() === href, 'native new tab opened another URL');
        assert(await popup.locator('[data-member-profile] h2').innerText() === '成员 A的个人空间', 'new tab could not initialize target from href');
        assert(await page.locator('[data-member-profile]').count() === 0, 'native new tab also navigated original chat');
        await popup.getByRole('button', { name: '返回聊天', exact: true }).click();
        await popup.getByRole('region', { name: '成员导航聊天消息' }).waitFor();
        native.push({ action, pass: true, destination: 'member=a' });
      } catch (error) { native.push({ action, pass: false, error: String(error) }); }
      finally { if (popup) await popup.close(); }
    }
    const browser = page.context().browser();
    const touchContext = await browser.newContext({ hasTouch: true, viewport: { width: 400, height: 900 } });
    touchContext.on('page', watchPage);
    try {
      const touchPage = await touchContext.newPage(); touchPage.setDefaultTimeout(4000);
      for (const appearance of ['plain', 'bubble']) {
        const geometry = [], activated = [];
        try {
          await touchPage.goto(url({ theme: 'neutral', appearance, zoom: 2 }));
          assert(await touchPage.evaluate(() => matchMedia('(any-pointer:coarse)').matches), 'coarse pointer emulation not active');
          if (touchProbe) await touchPage.addStyleTag({ content: '.rhine-chat-member-link { min-height:24px !important; min-inline-size:24px !important; }' });
          // A/B must remain single-line: a multi-line name alone cannot prove the minimum target height.
          for (const member of ['a', 'b', 'c']) {
            const link = touchPage.locator(`#member-author-member-${member}-1`); await link.scrollIntoViewIfNeeded();
            geometry.push(await link.evaluate((node, member) => {
              const rect = node.getBoundingClientRect(), time = node.parentElement.querySelector('time').getBoundingClientRect();
              const name = document.createRange(); name.selectNodeContents(node.querySelector('strong'));
              return { member, nameLines: name.getClientRects().length, width: rect.width / 2, height: rect.height / 2,
                overlap: Math.min(rect.right, time.right) - Math.max(rect.left, time.left) > 1 && Math.min(rect.bottom, time.bottom) - Math.max(rect.top, time.top) > 1 };
            }, member));
          }
          assert(geometry.filter(row => row.member !== 'c').every(row => row.nameLines === 1), 'coarse short-name fixture is not single-line');
          assert(geometry.every(row => row.width >= 44 && row.height >= 44 && !row.overlap), 'coarse author target is under 44px or overlaps time: ' + JSON.stringify(geometry));
          for (const member of ['a', 'b', 'c']) {
            const id = `member-author-member-${member}-1`, link = touchPage.locator(`#${id}`); await link.scrollIntoViewIfNeeded();
            await link.locator('.rhine-chat-avatar').tap(); await touchPage.locator('[data-member-profile]').waitFor();
            assert(await touchPage.evaluate(() => new URLSearchParams(location.search).get('member')) === member, 'touch did not open expected member');
            await touchPage.getByRole('button', { name: '返回聊天', exact: true }).tap();
            await touchPage.waitForFunction(id => document.activeElement?.id === id, id);
            activated.push(member);
          }
          touch.push({ appearance, pass: true, geometry, activated });
        } catch (error) { touch.push({ appearance, pass: false, geometry, activated, error: String(error) }); }
      }
    } finally { touchContext.off('page', watchPage); await touchContext.close(); }
  } finally {
    mainContext.off('page', watchPage);
    for (const [target, onError] of watchedPages) target.off('pageerror', onError);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  return { pass: [...rows, ...motion, ...native, ...touch].every(row => row.pass) && errors.length === 0, rows, motion, native, touch, errors, observedPages: watchedPages.size, probe: probe || null,
    scope: 'Production Chromium, actual keyboard and native new-tab actions, emulated touch, synthetic host state. CSS zoom is not native browser zoom; screen-reader speech and business services are not covered.' };
}
