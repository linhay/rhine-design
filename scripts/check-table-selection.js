async page => {
  const { origin, probe } = await page.evaluate(() => ({ origin: location.origin, probe: new URLSearchParams(location.search).get('selectionProbe') }));
  const motionOnly = await page.evaluate(() => new URLSearchParams(location.search).has('selectionMotionOnly'));
  const failures = [], errors = [], cases = [], motions = [];
  const check = (ok, detail) => { if (!ok) failures.push(detail); };
  page.setDefaultTimeout(5000);
  page.on('pageerror', error => errors.push(String(error)));
  const longName = '非常长的工作区名称与跨区域协作资料—Workspace-2026-archive';
  const identifier = 'WorkspaceArchive2026UnbrokenIdentifierABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const region = page.getByRole('region', { name: '项目记录，可横向滚动', exact: true });
  const table = page.getByRole('table', { name: '项目记录', exact: true });
  const measure = () => table.evaluate(el => [...el.querySelectorAll('.rhine-table__selection')].map(cell => {
    const label = cell.querySelector('label'), input = cell.querySelector('input'), text = label?.querySelector('span');
    return { name: text?.textContent, rowHeight: cell.parentElement.offsetHeight, cellWidth: cell.offsetWidth,
      labelWidth: label?.offsetWidth, labelHeight: label?.offsetHeight, textWidth: text?.offsetWidth, textHeight: text?.offsetHeight,
      clip: text && getComputedStyle(text).clipPath, display: text && getComputedStyle(text).display,
      hidden: text?.hasAttribute('aria-hidden'), disabled: input?.disabled, checked: input?.checked, mixed: input?.indeterminate };
  }));
  try {
    for (const theme of motionOnly ? [] : ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite']) {
      for (const [width, zoom] of [[880, 1], [520, 1], [400, 2]]) {
        for (const compact of [false, true]) for (const single of [false, true]) {
          const context = { theme, width, zoom, compact, single };
          await page.setViewportSize({ width, height: 800 });
          await page.goto(`${origin}/?theme=${theme}&selectionCase=${width}-${zoom}-${compact}-${single}#advanced-data`);
          // Isolate selection from the separately tracked sticky-budget defect (#173).
          await page.getByLabel('固定右侧列', { exact: true }).uncheck();
          await page.getByLabel('紧凑密度', { exact: true }).setChecked(compact);
          await page.getByLabel('表格单选', { exact: true }).setChecked(single);
          await page.evaluate(z => { document.documentElement.style.zoom = String(z); }, zoom);
          if (probe === 'visible-label') await page.addStyleTag({ content: '.rhine-table__selection label > span {position:static;width:auto;height:auto;clip-path:none;white-space:normal;margin:0}' });
          const rows = await measure();
          check(rows.filter(row => row.name).every(row => row.labelWidth >= 44 && row.labelHeight >= 44 && row.labelHeight <= 45 && row.textWidth <= 1 && row.textHeight <= 1 && row.clip !== 'none' && row.display !== 'none' && !row.hidden), { kind: 'compact-label-and-target', context, rows });
          check(rows.every(row => row.rowHeight < 200), { kind: 'selection-does-not-dominate-row-height', context, rows });
          const role = single ? 'radio' : 'checkbox';
          for (const name of [longName, identifier, '记录 3', '不可选择的记录']) {
            check(await table.getByRole(role, { name: `选择${name}`, exact: true }).count() === 1, { kind: 'full-accessible-name', context, name });
          }
          check(await table.getByRole(role, { name: '选择不可选择的记录', exact: true }).isDisabled(), { kind: 'disabled-row', context });
          check(await page.getByLabel('表格单选', { exact: true }).evaluate(el => {
            const text = el.closest('label').querySelector('span'); return text.offsetWidth > 1 && getComputedStyle(text).clipPath === 'none';
          }), { kind: 'ordinary-checkbox-still-visible', context });
          if (probe) return { pass: !failures.length && !errors.length, failures, errors, cases };
          // Start at the real region and Tab through the native header controls.
          await region.focus();
          await page.keyboard.press('Tab');
          if (!single) {
            check(await table.getByRole('checkbox', { name: '选择当前可见行' }).evaluate(el => el === document.activeElement), { kind: 'tab-header', context });
            await page.keyboard.press('Tab');
          }
          check(await table.getByRole('button', { name: '项目名称', exact: false }).evaluate(el => el === document.activeElement), { kind: 'tab-sort', context });
          await page.keyboard.press('Tab');
          const first = table.getByRole(role, { name: `选择${longName}`, exact: true });
          check(await first.evaluate(el => el === document.activeElement && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), { kind: 'native-tab-and-focus-visible', context });
          await page.keyboard.press('Space');
          check(await first.isChecked(), { kind: 'space-selects-row', context });
          if (!single) check(await table.getByRole('checkbox', { name: '选择当前可见行' }).evaluate(el => el.indeterminate && el.getAttribute('aria-checked') === 'mixed'), { kind: 'mixed-header', context });
          // Scroll the label into the non-sticky body and click its outer hit area.
          await first.evaluate(el => { const r = el.closest('.rhine-table-scroll'); r.scrollLeft = 0; r.scrollTop = 0; r.scrollIntoView({ block: 'start' }); });
          const target = await first.evaluate(el => {
            const label = el.closest('label'), b = label.getBoundingClientRect(), r = el.closest('.rhine-table-scroll').getBoundingClientRect();
            const x = b.left + 3 * (b.width / label.offsetWidth), y = b.top + b.height / 2;
            const hit = document.elementFromPoint(x, y);
            return { x, y, visible: x >= r.left && x < r.right && y >= r.top && y < r.bottom && y >= 0 && y < innerHeight, hit: !!hit && label.contains(hit) };
          });
          check(target.visible && target.hit, { kind: 'first-row-label-visible-hit', context, target });
          if (target.visible && target.hit) {
            await page.mouse.click(target.x, target.y);
            check(await first.isChecked() === single, { kind: 'outer-label-click', context });
          }
          if (!single) {
            const all = table.getByRole('checkbox', { name: '选择当前可见行', exact: true });
            await all.focus(); await page.keyboard.press('Space');
            check(await all.isChecked() && !(await table.getByRole('checkbox', { name: '选择不可选择的记录' }).isChecked()), { kind: 'select-all-eligible-only', context });
            await page.getByRole('navigation', { name: '项目记录分页' }).getByRole('button', { name: '下一页' }).click();
            check((await page.getByRole('status').filter({ hasText: /^已选 \d+ 项/ }).innerText()).includes('off-page') && (await page.getByRole('status').filter({ hasText: /^已选 \d+ 项/ }).innerText()).includes('one'), { kind: 'off-page-keys-retained', context });
            await page.getByRole('navigation', { name: '项目记录分页' }).getByRole('button', { name: '上一页' }).click();
            check(await first.isChecked(), { kind: 'selection-survives-page-return', context });
          } else {
            await first.focus(); await page.keyboard.press('ArrowDown');
            const selected = await table.locator('input[type=radio]:checked').count();
            check(selected === 1 && !(await first.isChecked()), { kind: 'native-radio-arrow-selection', context });
          }
          for (const state of ['loading', 'disabled', 'error', 'ready']) {
            await page.getByLabel('演示状态', { exact: true }).selectOption(state);
            check(await first.isDisabled() === ['loading', 'disabled'].includes(state), { kind: 'state-preserves-selection-contract', context, state });
          }
          const pageFits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
          check(pageFits, { kind: 'page-does-not-overflow', context });
          const names = await table.getByRole('rowheader').allTextContents();
          check(names.includes(longName) && names.includes(identifier), { kind: 'visible-identity-retained', context });
          cases.push({ ...context, rows, target, pageFits });
        }
      }
    }
    for (const motion of ['normal', 'system', 'manual']) {
      await page.emulateMedia({ reducedMotion: motion === 'system' ? 'reduce' : 'no-preference' });
      await page.goto(`${origin}/?theme=rhine&selectionMotion=${motion}#advanced-data`);
      if (motion === 'manual') await page.getByRole('radio', { name: '减少动态', exact: true }).check();
      await page.getByLabel('固定右侧列', { exact: true }).uncheck();
      const first = table.getByRole('checkbox', { name: `选择${longName}`, exact: true });
      await first.focus(); await page.keyboard.press('Space');
      const preference = await page.locator('[data-rhine-motion]').getAttribute('data-rhine-motion');
      const system = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
      check(await first.isChecked() && await first.evaluate(el => el === document.activeElement) && (motion !== 'manual' || preference === 'reduced') && (motion !== 'system' || system), { kind: 'motion-independent-selection', motion, preference, system });
      motions.push({ motion, preference, system });
    }
  } catch (error) { errors.push(String(error)); }
  return { pass: !failures.length && !errors.length, failures, errors, cases, motions, browser: await page.evaluate(() => navigator.userAgent), boundary: 'Production Chromium; CSS zoom. Native zoom and spoken screen reader excluded. Sticky-budget behavior is tracked separately in #173.' };
}
