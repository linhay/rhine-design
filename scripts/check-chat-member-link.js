async page => {
  page.setDefaultTimeout(4000);
  const { base, probe } = await page.evaluate(() => ({ base: `${location.origin}${location.pathname}`, probe: new URLSearchParams(location.search).get('memberProbe') }));
  const query = values => Object.entries(values).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
  const rows = [], errors = [];
  const onError = error => errors.push(String(error)); page.on('pageerror', onError);
  const assert = (value, message) => { if (!value) throw Error(message); };
  const themes = probe ? ['neutral'] : ['rhine', 'arknights', 'neo-brutalism', 'neutral'];
  try {
    for (const theme of themes) for (const width of probe ? [400] : [400, 520, 880]) for (const zoom of probe ? [2] : [1, 2]) for (const appearance of probe ? ['bubble'] : ['plain', 'bubble']) for (const scene of probe ? ['team'] : ['pair', 'team']) {
      const context = { theme, width, zoom, appearance, scene };
      try {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${base}?${query({ fixture: 'chat-member-link', ...context })}`);
        const viewport = page.getByRole('region', { name: '成员导航聊天消息' }); await viewport.waitFor();
        if (probe === 'clip') await page.addStyleTag({ content: '#member-author-member-c-1 strong { width:8px; overflow:hidden; white-space:nowrap; }' });
        if (probe === 'hidden-link') await viewport.locator('.rhine-sr-only').first().evaluate(node => { const link = document.createElement('a'); link.href = '?member=a'; link.textContent = '错误的隐藏作者入口'; node.append(link); });
        const geometry = await viewport.evaluate(node => ({
          viewportWidth: node.clientWidth, contentWidth: node.scrollWidth,
          rootWidth: node.parentElement.clientWidth, rootContentWidth: node.parentElement.scrollWidth,
          documentWidth: document.documentElement.scrollWidth, windowWidth: innerWidth,
          scrollable: node.scrollHeight > node.clientHeight,
        }));
        assert(geometry.contentWidth <= geometry.viewportWidth + 1 && geometry.rootContentWidth <= geometry.rootWidth + 1 && geometry.documentWidth <= geometry.windowWidth + 1, 'horizontal overflow: ' + JSON.stringify(geometry));
        assert(geometry.scrollable, 'fixture did not exercise an internally scrolling conversation');
        assert(await viewport.locator('.rhine-sr-only a, .rhine-sr-only button, .rhine-sr-only [tabindex]').count() === 0, 'hidden continuation exposes an interactive author');
        const structure = await viewport.locator('.rhine-chat-meta').evaluateAll(headers => headers.map(header => {
          const link = header.querySelector('a'), name = header.querySelector('strong'), time = header.querySelector('time');
          return { linked: !!link, text: name?.textContent, timestamp: time?.textContent, articleName: header.closest('article')?.getAttribute('aria-label'),
            singleLink: header.querySelectorAll('a').length === 1, onlyIdentity: !!link && link.children.length === 2 && link.children[0].classList.contains('rhine-chat-avatar') && link.children[1] === name,
            timeOutside: !!time && time.parentElement === header && !link?.contains(time), decorativeAvatar: link?.firstElementChild?.getAttribute('aria-hidden') === 'true',
            href: link?.getAttribute('href'), id: link?.id };
        }));
        assert(structure.every(row => row.timeOutside && row.articleName === `${row.text} · ${row.timestamp}`), 'time or article identity changed');
        assert(structure.filter(row => row.linked).every(row => row.singleLink && row.onlyIdentity && row.decorativeAvatar && row.id && row.href), 'author link does not wrap only avatar and name');
        assert(structure.filter(row => row.linked).length >= 2, 'read-only author navigation missing');
        assert(await page.getByText('只读观察', { exact: true }).isVisible(), 'fixture is not read-only');
        if (scene === 'team') {
          assert(await viewport.locator('[data-chat-entry="event-member"] .rhine-chat-event').count() === 1, 'event missing');
          assert(await viewport.locator('[data-chat-entry="event-member"] a, [data-chat-entry="member-unknown"] a').count() === 0, 'event or unknown target acquired a link');
        }
        const target = viewport.locator(scene === 'team' ? '#member-author-member-c-1' : '#member-author-member-b-1');
        await target.focus(); await target.scrollIntoViewIfNeeded();
        // Check every rendered text line after bringing it into both its own reader and the page.
        const text = await target.locator('strong').evaluate(async node => {
          const textNode = node.firstChild, groups = [], failures = [];
          if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return { pass: false, lines: 0, failures: ['name is not string text'] };
          let lastTop = null;
          for (let index = 0; index < textNode.length; index++) {
            const range = document.createRange(); range.setStart(textNode, index); range.setEnd(textNode, index + 1);
            const rect = range.getBoundingClientRect(); if (!rect.width) continue;
            if (lastTop === null || Math.abs(rect.top - lastTop) > 1) { groups.push({ start: index, end: index + 1 }); lastTop = rect.top; }
            else groups[groups.length - 1].end = index + 1;
          }
          for (const [index, group] of groups.entries()) {
            const range = document.createRange(); range.setStart(textNode, group.start); range.setEnd(textNode, group.end);
            for (let ancestor = node.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
              const style = getComputedStyle(ancestor), rect = range.getBoundingClientRect(), bounds = ancestor.getBoundingClientRect();
              if (/(auto|scroll)/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight && (rect.top < bounds.top || rect.bottom > bounds.bottom)) {
                const scale = bounds.height / ancestor.offsetHeight || 1;
                ancestor.scrollTop += ((rect.top + rect.bottom) / 2 - (bounds.top + bounds.bottom) / 2) / scale;
              }
            }
            let rect = range.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > innerHeight) window.scrollBy(0, (rect.top + rect.bottom) / 2 - innerHeight / 2);
            await new Promise(resolve => requestAnimationFrame(resolve));
            rect = range.getBoundingClientRect();
            if (rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1) failures.push({ line: index, kind: 'window clipping' });
            for (let ancestor = node; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
              const style = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
              if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) failures.push({ line: index, kind: 'horizontal text clipping', ancestor: ancestor.className });
              if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push({ line: index, kind: 'vertical text clipping', ancestor: ancestor.className });
            }
          }
          return { pass: groups.length > 0 && failures.length === 0, lines: groups.length, failures };
        });
        assert(text.pass, 'author text is clipped: ' + JSON.stringify(text));
        const collision = await target.evaluate(node => {
          const link = node.getBoundingClientRect(), time = node.parentElement.querySelector('time').getBoundingClientRect();
          return { overlap: Math.min(link.right, time.right) - Math.max(link.left, time.left) > 1 && Math.min(link.bottom, time.bottom) - Math.max(link.top, time.top) > 1,
            height: link.height, width: link.width, headerWidth: node.parentElement.getBoundingClientRect().width };
        });
        assert(!collision.overlap && collision.width >= 24 * zoom - 1 && collision.height >= 24 * zoom - 1, 'author hit target overlaps time or is too small');
        await viewport.focus(); await page.keyboard.press('End');
        await page.waitForFunction(() => { const node = document.querySelector('.rhine-chat-viewport'); return Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop) < 2; });
        rows.push({ ...context, pass: true, geometry, text, collision });
      } catch (error) { rows.push({ ...context, pass: false, error: String(error) }); }
    }
  } finally { page.off('pageerror', onError); }
  return { pass: rows.every(row => row.pass) && errors.length === 0, rows, errors, probe: probe || null,
    scope: 'Production Chromium, synthetic read-only host, CSS zoom; native browser zoom, screen-reader speech and real business routes are not covered.' };
}
