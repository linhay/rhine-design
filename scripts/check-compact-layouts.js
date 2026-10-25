// Open a fixed production preview, then run with playwright-cli run-code --filename.
// CSS zoom evidence is separate from native browser-menu zoom.
async page => {
  page.setDefaultTimeout(10000);
  const origin = new URL(page.url()).origin;
  const failures = [], errors = [], counts = { drawer: 0, date: 0, table: 0, account: 0 };
  page.on('pageerror', error => errors.push(String(error)));
  const check = (pass, context) => { if (!pass) failures.push(context); };
  const open = async (section, theme, width, zoom) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?theme=${theme}#${section}`);
    await page.locator(`#${section}`).waitFor();
    await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
  };
  const editLastSegment = async (input, context) => {
    await input.fill('2026-10-24');
    await input.focus();
    // The preview's zh-CN native date order is year/month/day.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    check(await input.inputValue() === '2026-10-25', { ...context, kind: 'edit-last-segment' });
    await page.keyboard.press('ArrowDown');
    check(await input.inputValue() === '2026-10-24', { ...context, kind: 'restore-last-segment' });
  };
  const measureDate = async (input, context) => {
    const dimensions = await input.evaluate(e => {
      const style = getComputedStyle(e);
      return { width: parseFloat(style.width), height: parseFloat(style.height), font: parseFloat(style.fontSize), padding: parseFloat(style.paddingLeft) };
    });
    check(dimensions.width >= 148 && dimensions.height >= 44 && dimensions.font >= 14, { ...context, kind: 'date-dimensions', dimensions });
  };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
      const context = { theme, width, zoom };
      await open('list-filter-bar', theme, width, zoom);
      const bar = page.getByRole('group', { name: '录制会话筛选', exact: true });
      const trigger = bar.getByRole('button', { name: /^更多筛选/ });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '录制会话筛选', exact: true });
      await dialog.evaluate(e => Promise.all(e.getAnimations().map(a => a.finished)));
      const start = dialog.getByLabel('开始日期', { exact: true });
      await measureDate(start, context);
      await editLastSegment(start, context);
      await dialog.getByLabel('结束日期', { exact: true }).fill('2026-10-26');
      await dialog.getByRole('button', { name: '清空日期', exact: true }).click();
      check(await start.inputValue() === '', { ...context, kind: 'clear-range' });
      await dialog.getByRole('checkbox', { name: '只看已审查' }).check();
      await start.focus(); await page.keyboard.type('2');
      check(await start.getAttribute('aria-invalid') === 'true', { ...context, kind: 'incomplete-date' });
      await dialog.getByRole('button', { name: '重置筛选', exact: true }).click();
      check(await start.evaluate(e => !e.value && !e.validity.badInput && e.getAttribute('aria-invalid') !== 'true'), { ...context, kind: 'reset-draft' });
      if (width === 400 && zoom === 2) {
        await start.fill('2026-10-24');
        await start.screenshot({ path: `output/playwright/issues-23-25/drawer-${theme}.png` });
      }
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      await page.waitForFunction(e => e === document.activeElement, await trigger.elementHandle());
      counts.drawer++;

      await open('spacing', theme, width, zoom);
      const surface = page.locator('#spacing .rhine-surface--padding-none');
      check(await surface.evaluate(e => getComputedStyle(e).padding === '0px' && getComputedStyle(e).overflow !== 'hidden'), { ...context, kind: 'surface-padding' });
      check(await surface.locator('td').first().evaluate(e => parseFloat(getComputedStyle(e).paddingLeft) > 0), { ...context, kind: 'table-cell-spacing' });
      const selection = surface.getByRole('checkbox').nth(1);
      await selection.uncheck(); await selection.check();
      await selection.focus(); await page.keyboard.press('Space');
      check(!await selection.isChecked(), { ...context, kind: 'table-keyboard-selection' });
      check(await surface.evaluate(e => e.getBoundingClientRect().right <= innerWidth + 1), { ...context, kind: 'table-bounds' });
      const scroll = surface.getByRole('region', { name: /可横向滚动/ });
      await scroll.focus();
      await scroll.evaluate(e => { e.scrollLeft = e.scrollWidth; });
      check(await scroll.evaluate(e => e === document.activeElement && e.querySelector('tbody tr td:last-child').getBoundingClientRect().right <= e.getBoundingClientRect().right + 1), { ...context, kind: 'table-last-column-reachable' });
      await scroll.evaluate(e => { e.scrollLeft = 0; });
      if (width === 400 && zoom === 2) await surface.screenshot({ path: `output/playwright/issues-23-25/table-${theme}.png` });
      counts.table++;

      await open('compact-account', theme, width, 1);
      await page.getByRole('combobox', { name: '样机宽度' }).selectOption(String(width));
      await page.getByRole('combobox', { name: '内容缩放' }).selectOption(String(zoom));
      for (const state of ['normal', 'zero', 'unknown', 'long']) {
        await page.getByRole('combobox', { name: '账号读数' }).selectOption(state);
        const card = page.getByTestId('compact-account-card');
        const layout = await card.evaluate(e => {
          const bars = e.querySelector('.rhine-timeline__bars').getBoundingClientRect();
          const legend = e.querySelector('.rhine-timeline__legend').getBoundingClientRect();
          const slider = e.querySelector('input[type=range]');
          const pairs = [...e.querySelectorAll('.compact-gallery-fact-pair')];
          return {
            gap: legend.top - bars.bottom,
            sliderHeight: parseFloat(getComputedStyle(slider).height),
            triggerHeight: parseFloat(getComputedStyle(e.querySelector('.rhine-timeline__legend-trigger')).height),
            aligned: [...pairs[0].children].every((child, i) => Math.abs(child.getBoundingClientRect().left - pairs[1].children[i].getBoundingClientRect().left) < 1),
            overflow: [...e.querySelectorAll('.compact-gallery-facts, .compact-gallery-facts span')].some(node => node.scrollWidth > node.clientWidth + 1),
          };
        });
        check(Math.abs(layout.gap / zoom - 12) < 1 && layout.sliderHeight >= 44 && layout.triggerHeight >= 44 && layout.aligned && !layout.overflow, { ...context, state, kind: 'account-layout', layout });
        if (state === 'normal') {
          const slider = card.getByRole('slider');
          await slider.focus(); await page.keyboard.press('ArrowRight');
          const detail = page.getByRole('dialog', { name: /时段详情$/ });
          await detail.waitFor(); await page.keyboard.press('Escape'); await detail.waitFor({ state: 'detached' });
          await page.getByRole('combobox', { name: '账号读数' }).focus();
          await slider.hover(); await detail.waitFor();
          await page.mouse.move(0, 0); await detail.waitFor({ state: 'detached' });
          const legend = card.getByRole('button', { name: '有输出', exact: true });
          await legend.click();
          const rule = page.getByRole('dialog', { name: '有输出规则', exact: true });
          await rule.waitFor(); await page.keyboard.press('Escape'); await rule.waitFor({ state: 'detached' });
        }
        if (width === 400 && zoom === 2 && state === 'long') await card.screenshot({ path: `output/playwright/issues-23-25/account-${theme}.png` });
        counts.account++;
      }
    }
    // Leave room for the gallery sidebar: max-width must not clamp the 280px fixture.
    await open('date-range-filter', theme, 1280, 2);
    for (const containerWidth of [150, 200, 280]) {
      await page.getByRole('combobox', { name: '日期容器宽度' }).selectOption(String(containerWidth));
      const context = { theme, containerWidth, zoom: 2 };
      const range = page.getByRole('group', { name: '局部日期', exact: true });
      check(await range.evaluate((e, expected) => Math.abs(parseFloat(getComputedStyle(e.parentElement).width) - expected) < 1, containerWidth), { ...context, kind: 'actual-container-width' });
      const start = range.getByLabel('开始日期', { exact: true });
      const single = page.getByLabel('独立日期', { exact: true });
      await measureDate(start, context); await measureDate(single, context);
      await editLastSegment(start, context); await editLastSegment(single, context);
      await single.fill(''); check(await single.inputValue() === '', { ...context, kind: 'clear-single' });
      await range.getByRole('button', { name: '清空日期', exact: true }).click();
      await page.getByRole('button', { name: '重置示例日期' }).click();
      check(await start.inputValue() === '2026-10-24' && await single.inputValue() === '2026-10-24', { ...context, kind: 'reset-example' });
      check(await page.getByRole('button', { name: '重置示例日期' }).evaluate(e => e === document.activeElement), { ...context, kind: 'reset-example-focus' });
      await single.screenshot({ path: `output/playwright/issues-23-25/single-${theme}-${containerWidth}.png` });
      counts.date++;
    }
  }
  return { pass: !failures.length && !errors.length, counts, failures, errors, scope: 'Chromium; real gallery, CSS zoom, native keyboard editing. Inspect date screenshots for full fragments/calendar visibility.' };
}
