// Use a production preview and run with playwright-cli run-code --filename.
async page => {
  page.setDefaultTimeout(10000);
  const origin = new URL(page.url()).origin;
  const failures = [], errors = [];
  let scenarios = 0;
  page.on('pageerror', error => errors.push(String(error)));
  const check = (pass, context) => { if (!pass) failures.push(context); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}#checkbox-rows`);
      await page.getByRole('heading', { name: '侧栏双行多选', exact: true }).waitFor();
      await page.evaluate(value => { document.documentElement.style.zoom = String(value); }, zoom);
      const container = page.locator('[data-checkbox-rows]');
      for (const requestedWidth of [160, 240, 320]) {
        const context = { theme, width, zoom, requestedWidth };
        await page.getByRole('combobox', { name: '侧栏宽度', exact: true }).selectOption(String(requestedWidth));
        const geometry = await container.evaluate((root, zoom) => {
          const rows = [...root.querySelectorAll('.rhine-check--row > label')];
          return rows.map(row => {
            const name = row.querySelector('.rhine-check__name'), hint = row.querySelector('.rhine-check__hint');
            const text = row.querySelector('.rhine-check__text');
            const r = row.getBoundingClientRect(), n = name.getBoundingClientRect(), h = hint?.getBoundingClientRect(), t = text.getBoundingClientRect();
            const style = getComputedStyle(row), ns = getComputedStyle(name), hs = hint && getComputedStyle(hint);
            const border = parseFloat(style.borderTopWidth);
            return { height:r.height / zoom, fits:row.scrollWidth <= row.clientWidth + 1, nameSize:ns.fontSize, nameLine:ns.lineHeight, nameWeight:ns.fontWeight, hintSize:hs?.fontSize, hintLine:hs?.lineHeight,
              aligned:!h || Math.abs(n.left-h.left)<1, gap:h ? (h.top-n.bottom)/zoom : null, top:(t.top-r.top)/zoom-border, bottom:(r.bottom-t.bottom)/zoom-border };
          });
        }, zoom);
        check(geometry.every(row => row.fits && row.height >= 44 && row.nameSize === '14px' && row.nameLine === '22px' && row.nameWeight === (theme === 'neo-brutalism' ? '600' : '500') && row.aligned && (row.gap === null || Math.abs(row.gap-4)<.1) && (!row.hintSize || row.hintSize === '12px' && row.hintLine === '18px') && Math.abs(row.top-row.bottom)<.1), { ...context, kind:'geometry', geometry });
        check(await container.evaluate(e => e.scrollWidth <= e.clientWidth + 1), { ...context, kind:'container-fit' });
        scenarios++;
      }
      const all = container.getByRole('checkbox', { name:'全部项目', exact:true });
      const input = container.getByRole('checkbox', { name:'示例项目 A', exact:true });
      check(await all.evaluate(e => e.indeterminate), { theme,width,zoom,kind:'mixed' });
      const row = input.locator('..');
      const selectedStyle = await row.evaluate(e => ({ background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderColor }));
      await row.getByText('内存卡 · 14 项', { exact:true }).click();
      check(!await input.isChecked(), { theme,width,zoom,kind:'hint-click' });
      await page.mouse.move(0, 0);
      const defaultStyle = await row.evaluate(e => ({ background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderColor }));
      check(defaultStyle.background !== selectedStyle.background && defaultStyle.border !== selectedStyle.border, { theme,width,zoom,kind:'selection-style' });
      const rowBox = await row.boundingBox();
      await row.click({ position:{x:rowBox.width / 2,y:4} });
      check(await input.isChecked(), { theme,width,zoom,kind:'padding-click' });
      await all.focus(); await page.keyboard.press('Tab');
      check(await input.evaluate(e => e === document.activeElement) && await row.evaluate(e => getComputedStyle(e).boxShadow.includes('inset')), { theme,width,zoom,kind:'keyboard-focus' });
      await page.keyboard.press('Space');
      check(!await input.isChecked(), { theme,width,zoom,kind:'space-toggle' });
      const disabled = container.getByRole('checkbox', { name:'不可用项目',exact:true });
      await disabled.locator('..').scrollIntoViewIfNeeded();
      const disabledBox = await disabled.locator('..').boundingBox();
      await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height / 2);
      check(!await disabled.isChecked(), { theme,width,zoom,kind:'disabled' });
      if (width === 400 && zoom === 2) {
        await page.getByRole('combobox', { name:'侧栏宽度',exact:true }).selectOption('160');
        await all.focus(); await page.keyboard.press('Tab');
        await container.screenshot({ path:`output/playwright/issue-29/${theme}.png` });
      }
    }
  }
  return { pass:!failures.length && !errors.length, scenarios, failures, errors, scope:'Chromium, three themes, 400/520/880px, 160/240/320px sidebar capped by available space, CSS zoom 100/200%; native browser menu zoom not covered.' };
}
