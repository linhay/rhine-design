// Run against the production preview with playwright-cli run-code --filename.
async page => {
  page.setDefaultTimeout(10000);
  const origin = new URL(page.url()).origin;
  const failures = [], errors = [];
  let scenarios = 0;
  page.on('pageerror', error => errors.push(String(error)));
  const check = (pass, context) => { if (!pass) failures.push(context); };
  const typography = async (selector, size, leading, weight, context) => {
    const actual = await page.locator(selector).first().evaluate(e => {
      const s = getComputedStyle(e);
      return { size:s.fontSize, leading:s.lineHeight, weight:s.fontWeight };
    });
    check(actual.size === `${size}px` && actual.leading === `${leading}px` && actual.weight === String(weight), { ...context, selector, actual, expected:{size,leading,weight} });
  };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
    for (const width of [400,520,880]) for (const zoom of [1,2]) {
      const context = {theme,width,zoom}, heading = theme === 'neo-brutalism' ? 750 : 600;
      await page.setViewportSize({width,height:1000});
      await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}#component-typography`);
      await page.getByRole('heading',{name:'公共组件文字配对',exact:true}).waitFor();
      await page.evaluate(value => { document.documentElement.style.zoom=String(value); },zoom);
      await page.getByRole('button',{name:'模拟复制',exact:true}).click();
      await page.locator('.rhine-copy>[role]').filter({hasText:'已复制'}).waitFor();
      await page.locator('.rhine-theme-preview[data-state=error]').waitFor();
      for (const inherited of [false,true]) {
        if (inherited) await page.locator('.rhine-theme').evaluate(e => { e.style.lineHeight='38px'; e.style.fontWeight='700'; });
        const state = {...context,inherited};
        await typography('.rhine-empty strong',16,24,heading,state);
        await typography('.rhine-error-summary h3',16,24,heading,state);
        for (const selector of ['.rhine-copy>[role]','.rhine-steps small','.rhine-fieldset>p','.rhine-theme-option__status','.rhine-theme-preview']) await typography(selector,12,18,400,state);
        await typography('.rhine-media-card__status',14,22,400,state);
      }
      await page.locator('.rhine-theme').evaluate(e => { e.style.lineHeight=''; e.style.fontWeight=''; });
      check(await page.locator('.rhine-empty').evaluate(e => e.scrollWidth <= e.clientWidth+1 && e.querySelector('strong').getBoundingClientRect().height >= 24), {...context,kind:'empty-wrap'});
      if (width === 400 && zoom === 2) await page.locator('.rhine-empty').screenshot({path:`output/playwright/issue-31/empty-${theme}.png`});
      const opener=page.getByRole('button',{name:'打开媒体示例',exact:true});
      await opener.click();
      const dialog=page.getByRole('dialog');
      await dialog.waitFor();
      await typography('.rhine-media-viewer__header p',12,18,400,context);
      await typography('.rhine-media-viewer__header h2',18,26,heading,context);
      await typography('.rhine-media-viewer__actions label',12,18,400,context);
      check(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth+1), {...context,kind:'viewer-wrap'});
      check(await dialog.locator('button,select').evaluateAll((elements, zoom) => elements.every(e => e.getBoundingClientRect().height/zoom >= 44),zoom), {...context,kind:'hit-targets'});
      await dialog.getByRole('button',{name:'下一项',exact:true}).click();
      check(await dialog.getByRole('heading',{name:'下一项合成媒体',exact:true}).isVisible(), {...context,kind:'next'});
      if (width === 400 && zoom === 2) await page.locator('.rhine-media-viewer__header').screenshot({path:`output/playwright/issue-31/media-${theme}.png`});
      const close=dialog.getByRole('button',{name:'关闭媒体查看器',exact:true});
      await close.scrollIntoViewIfNeeded();
      check(await close.evaluate(e => { const r=e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }), {...context,kind:'close-visible'});
      await close.click(); await dialog.waitFor({state:'detached'});
      await page.waitForFunction(() => document.activeElement?.textContent === '打开媒体示例');
      await opener.click(); await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
      await page.waitForFunction(() => document.activeElement?.textContent === '打开媒体示例');
      scenarios++;
    }
  }
  return {pass:!failures.length&&!errors.length,scenarios,failures,errors,scope:'Chromium, three themes, 400/520/880px, CSS zoom 100/200%; synthetic content and inherited-style stress. Native menu zoom is not covered.'};
}
