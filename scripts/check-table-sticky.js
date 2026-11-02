async page => {
  const { origin, probe, quick } = await page.evaluate(() => ({ origin: location.origin, probe: new URLSearchParams(location.search).get('stickyProbe'), quick: new URLSearchParams(location.search).has('stickyQuick') }));
  const failures = [], errors = [], cases = [], dynamic = [], motion = [];
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(String(error)));
  const check = (ok, detail) => { if (!ok) failures.push(detail); };
  const region = page.getByRole('region', { name: '容器适配记录，可横向滚动', exact: true });
  const table = page.getByRole('table', { name: '容器适配记录', exact: true });
  const settle = () => page.waitForTimeout(80);
  const geometry = () => region.evaluate(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth, pinned: [...el.querySelectorAll('thead [data-sticky]')].map(h => ({ key: h.dataset.columnKey, side: h.dataset.sticky, offset: parseFloat(h.style[h.dataset.sticky]), width: h.offsetWidth })), headers: [...el.querySelectorAll('thead th')].map(h => ({ key: h.dataset.columnKey, width: h.offsetWidth })), rowCount: el.querySelectorAll('tbody tr').length }));
  const hitTarget = locator => locator.evaluate(el => {
    const b = el.getBoundingClientRect(), r = el.closest('.rhine-table-scroll').getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2, hit = document.elementFromPoint(x, y);
    return { x, y, visible: b.left >= r.left - 1 && b.right <= r.right + 1 && y > r.top && y < Math.min(r.bottom, innerHeight), hit: !!(hit && (el.contains(hit) || el.closest('label')?.contains(hit))), focused: document.activeElement === el, outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow, focusVisible: el.matches(':focus-visible') };
  });
  try {
    for (const theme of quick || probe ? ['rhine'] : ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite']) {
      for (const [width, zoom] of probe ? [[400, 2]] : quick ? [[520, 1], [400, 2]] : [[1280, 1], [880, 1], [520, 1], [400, 2]]) {
        for (const layout of quick || probe ? ['right', 'offset', 'all'] : ['left', 'right', 'both', 'multi', 'offset', 'all']) {
          const context = { theme, width, zoom, layout };
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`${origin}/?fixture=table-sticky&theme=${theme}&case=${width}-${layout}`);
          await page.getByLabel('固定列组合', { exact: true }).selectOption(layout);
          await page.evaluate(z => { document.documentElement.style.zoom = String(z); }, zoom);
          await settle();
          if (probe === 'force-pin') await page.addStyleTag({ content: '.rhine-table tbody tr > :last-child {position:sticky!important;right:0!important;min-width:200px!important;z-index:1!important}' });
          const initial = await geometry();
          check(width !== 1280 || initial.pinned.length > 0, { kind: 'wide-preserves-pinning', context, initial });
          check(width !== 400 || initial.pinned.length === 0, { kind: 'narrow-unpins', context, initial });
          const handle = await table.elementHandle();
          await region.evaluate(el => { el.scrollTop = 0; el.scrollIntoView({ block: 'start' }); });
          const positions = [];
          for (const position of [0, .5, 1]) {
            await region.evaluate((el, p) => { el.scrollLeft = (el.scrollWidth - el.clientWidth) * p; }, position);
            positions.push(await region.evaluate((el, position) => {
              const r = el.getBoundingClientRect(), row = el.querySelector('tbody tr'), b = row.getBoundingClientRect(), h = el.querySelector('thead').getBoundingClientRect();
              const y = Math.max(r.top, h.bottom, b.top) + 10;
              const points = Array.from({ length: 17 }, (_, i) => {
                const x = r.left + (i + .5) * r.width / 17, hit = document.elementFromPoint(x, y), cell = hit?.closest('td,th');
                return { x, y, cell: cell && [...row.cells].indexOf(cell), text: cell?.textContent, rowHit: !!cell && cell.parentElement === row };
              });
              return { position, scrollLeft: el.scrollLeft, points };
            }, position));
          }
          check(positions.every(p => p.points.some(point => point.rowHit)), { kind: 'start-middle-end-real-row-hits', context, positions });
          if (width === 400) check(positions[1].points.some(p => p.text?.includes('跨区域协作资料')), { kind: 'middle-reaches-name-not-overlay', context, positions });
          // Individually expose every non-whitespace character in both rows. This
          // proves horizontal reachability, not simultaneous visibility of a long line.
          const readable = await region.evaluate(el => {
            let characters = 0; const misses = [];
            const rows = [...el.querySelectorAll('tbody tr')];
            for (const row of rows) for (const cell of [...row.cells].slice(2)) {
              const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT), nodes = [];
              while (walker.nextNode()) nodes.push(walker.currentNode);
              for (const node of nodes) for (let i = 0; i < node.textContent.length; i++) {
                if (!node.textContent[i].trim()) continue;
                const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
                let b = range.getBoundingClientRect(), r = el.getBoundingClientRect(), scale = r.width / el.clientWidth;
                const headers = [...el.querySelectorAll('thead [data-sticky]')];
                const extent = side => Math.max(0, ...headers.filter(h => h.dataset.sticky === side).map(h => parseFloat(h.style[side]) + h.offsetWidth));
                const left = r.left + extent('left') * scale, right = r.right - extent('right') * scale;
                if (!cell.hasAttribute('data-sticky')) el.scrollLeft += ((b.left + b.right) / 2 - (left + right) / 2) / scale;
                const header = el.querySelector('thead').getBoundingClientRect();
                const top = Math.max(r.top, header.bottom), bottom = Math.min(r.bottom, innerHeight);
                el.scrollTop += ((b.top + b.bottom) / 2 - (top + bottom) / 2) / scale;
                b = range.getBoundingClientRect(); r = el.getBoundingClientRect();
                const x = (b.left + b.right) / 2, y = (b.top + b.bottom) / 2, hit = document.elementFromPoint(x, y);
                const visible = x >= r.left && x < r.right && y >= Math.max(r.top, el.querySelector('thead').getBoundingClientRect().bottom) && y < Math.min(r.bottom, innerHeight);
                if (!(visible && hit && cell.contains(hit)) && misses.length < 12) misses.push({ text: node.textContent, character: i, x, y, hit: hit?.closest('td,th')?.textContent, visible });
                characters++;
              }
            }
            return { characters, misses };
          });
          check(readable.characters === 145 && !readable.misses.length, { kind: 'all-business-text-reachable', context, readable });
          if (probe) return { pass: !failures.length && !errors.length, failures, errors, cases };
          await region.evaluate(el => { el.scrollTop = 0; el.scrollLeft = 0; el.scrollIntoView({ block: 'start' }); });
          await region.focus();
          const keyboard = [];
          for (let i = 0; i < 9; i++) {
            await page.keyboard.press('Tab'); await settle();
            const active = table.locator(':focus');
            check(await active.count() === 1, { kind: 'tab-stays-in-table-sequence', context, step: i });
            if (!await active.count()) break;
            const target = await hitTarget(active);
            keyboard.push({ step: i, ...target });
            check(target.visible && target.hit && target.focused && target.focusVisible && (target.outline !== 'none' || target.shadow !== 'none'), { kind: 'keyboard-target-visible-hit', context, step: i, target });
            const name = await active.evaluate(el => el.textContent);
            if (name === '打开记录' || name === '查看记录') {
              await page.keyboard.press('Enter');
              check((await page.getByRole('status').last().innerText()).includes(name === '打开记录' ? '已打开' : '已查看'), { kind: 'keyboard-action-completes', context, name });
            }
          }
          check(await handle.evaluate(el => el.isConnected), { kind: 'same-table-instance', context });
          cases.push({ ...context, initial, positions, readable, keyboard });
        }
      }
    }
    // Constant table widths with a shrinking host: keep the exact focused node.
    for (const state of ['ready', 'loading', 'error']) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${origin}/?fixture=table-sticky&dynamic=${state}`);
      await page.getByLabel('固定列组合').selectOption('offset');
      await page.getByLabel('表格容器宽度').selectOption('800');
      await page.getByLabel('固定列表格状态').selectOption(state); await settle();
      const action = table.getByRole('button', { name: '打开记录', exact: true }).first();
      await action.focus(); const handle = await action.elementHandle();
      const wide = await geometry();
      await page.getByLabel('表格容器宽度').selectOption('110'); await settle();
      const narrow = await geometry();
      check(wide.pinned.length === 4 && narrow.pinned.length === 0 && narrow.width <= 110 && narrow.width >= 100 && wide.scrollWidth === narrow.scrollWidth, { kind: 'resize-viewport-with-unchanged-table', state, wide, narrow });
      const narrowedFocus = await hitTarget(action);
      check(await handle.evaluate(el => el === document.activeElement && el.isConnected), { kind: 'resize-keeps-focus-node', state });
      check(narrowedFocus.visible && narrowedFocus.hit, { kind: 'resized-focus-visible-hit', state, narrowedFocus });
      await page.getByLabel('表格容器宽度').selectOption('800'); await settle();
      const restored = await geometry();
      check(restored.pinned.length === 4 && await handle.evaluate(el => el === document.activeElement && el.isConnected), { kind: 'restore-pinning-and-focus', state, restored });
      dynamic.push({ state, wide, narrow, restored });
    }
    for (const preference of ['normal', 'system', 'manual']) {
      await page.emulateMedia({ reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
      await page.setViewportSize({ width: 880, height: 800 });
      await page.goto(`${origin}/?theme=rhine&stickyMotion=${preference}#advanced-data`);
      if (preference === 'manual') await page.getByRole('radio', { name: '减少动态', exact: true }).check();
      const original = page.getByRole('table', { name: '项目记录', exact: true });
      const first = original.locator('tbody input[type=checkbox]').first();
      await first.focus(); await page.keyboard.press('Space');
      const handle = await first.elementHandle();
      await page.setViewportSize({ width: 400, height: 800 });
      await page.evaluate(() => { document.documentElement.style.zoom = '2'; }); await settle();
      const target = await hitTarget(first);
      check(await first.isChecked() && await handle.evaluate(el => el === document.activeElement && el.isConnected) && target.visible && target.hit && await original.locator('thead [data-sticky]').count() === 0, { kind: 'motion-keeps-selected-focus-visible', preference, target });
      motion.push({ preference, target });
    }
  } catch (error) { errors.push(String(error)); }
  return { pass: !failures.length && !errors.length, failures, errors, cases, dynamic, motion, browser: await page.evaluate(() => navigator.userAgent), boundary: 'Production Chromium; CSS zoom. Text character reachability, real hit tests and native keyboard; no spoken screen reader/native zoom/backend claims.' };
}
