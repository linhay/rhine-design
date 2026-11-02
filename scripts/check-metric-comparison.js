// Production showcase or frozen installed package. CSS zoom is not native browser zoom.
async page => {
  const origin = await page.evaluate(() => location.origin), failures = [], cases = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const check = (ok, kind, detail) => { if (!ok) failures.push({kind,detail}); };
  const measure = () => page.locator('[data-comparison-example], [data-comparison-pair]').evaluateAll(roots => roots.map(root => {
    const clipped = [];
    for (const el of root.querySelectorAll('p,summary,button,.rhine-badge')) {
      if (el.closest('details:not([open])') && !el.matches('summary')) continue;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rects = [];
      while (walker.nextNode()) {
        const text = walker.currentNode;
        if (text.parentElement?.closest('[aria-hidden=true]')) continue;
        const range = document.createRange(); range.selectNodeContents(text); rects.push(...range.getClientRects());
      }
      for (const r of rects) {
        if (r.width === 0 || r.height === 0) continue;
        if (r.left < -1 || r.right > innerWidth + 1) clipped.push(el.textContent);
        for (let ancestor = el; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor), box = ancestor.getBoundingClientRect();
          if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (r.left < box.left - 1 || r.right > box.right + 1)) clipped.push(el.textContent);
          if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (r.top < box.top - 1 || r.bottom > box.bottom + 1)) clipped.push(el.textContent);
        }
      }
    }
    return { id:root.getAttribute('data-comparison-example') || 'pair', clipped:[...new Set(clipped)], fits: root.scrollWidth <= root.clientWidth + 1 };
  }));
  for (const theme of ['rhine','arknights','neo-brutalism','neutral','graphite']) for (const width of [400,520,880]) for (const zoom of [1,2]) {
    const label = `${theme}/${width}/css${zoom}`;
    await page.setViewportSize({width,height:800}); await page.goto(`${origin}/?fixture=metric-comparison&theme=${theme}`);
    await page.evaluate(zoom => document.documentElement.style.zoom = String(zoom), zoom);
    const precision = page.locator('[data-comparison-example=precision]'), summary = precision.locator('summary');
    await summary.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(230);
    check(await precision.locator('details').evaluate(el=>el.open) && await precision.getByText(/原始当前值 1,234,567/).isVisible(), 'precise-value-keyboard', label);
    await precision.getByText(/原始当前值 1,234,567/).scrollIntoViewIfNeeded();
    const result = await measure(); check(result.every(r=>r.fits && !r.clipped.length), 'layout', {label,result});
    await summary.focus(); await page.keyboard.press('Space'); await page.waitForTimeout(230);
    check(await summary.evaluate(el=>el===document.activeElement) && !(await precision.locator('details').evaluate(el=>el.open)), 'disclosure-return', label);
    const pair = page.locator('[data-comparison-pair]');
    await page.getByLabel('合成读取场景').selectOption('baseline-fail'); await page.getByLabel('比较工作区').selectOption('south');
    await pair.getByRole('alert').waitFor();
    check(await pair.getAttribute('data-scope')==='north' && await pair.getAttribute('data-selected-scope')==='south', 'failure-scope', label);
    check(await pair.getByText(/陈旧快照/).isVisible(), 'stale-visible', label);
    await page.getByLabel('合成读取场景').selectOption('normal'); const retry = pair.getByRole('button',{name:'重新读取比较',exact:true});
    await retry.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('[data-comparison-pair]')?.getAttribute('data-read-status')==='ready');
    check(await pair.getAttribute('data-scope')==='south' && await pair.getByText(/^基准 200 次/).isVisible(), 'retry-pair', label);
    check(await retry.evaluate(el=>el===document.activeElement), 'retry-focus', label);
    const after = await measure(); check(after.every(r=>r.fits && !r.clipped.length), 'long-scope-layout', {label,after});
    await pair.locator('summary').scrollIntoViewIfNeeded();
    check(await pair.locator('summary').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;}), 'last-action-reachable', label);
    if (width===400 && zoom===2) { await page.screenshot({path:`output/playwright/metric-${theme}.png`}); }
    cases.push({label,result,after});
  }
  await page.locator('[data-accepted-pair]').evaluate(el=>{el.style.height='1px';el.style.overflow='hidden';});
  const negative = await measure(); check(negative.some(r=>r.clipped.length), 'negative-not-detected', negative);
  for (const motion of ['normal','system','manual']) {
    await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});
    await page.goto(`${origin}/?fixture=metric-comparison&motion=${motion}`);
    const pair=page.locator('[data-comparison-pair]');
    await page.getByLabel('合成读取场景').selectOption('out-of-order');
    await pair.getByRole('button',{name:'重新读取比较',exact:true}).click();
    await page.getByLabel('比较工作区').selectOption('south');
    await page.waitForFunction(()=>document.querySelector('[data-comparison-pair]')?.getAttribute('data-read-status')==='ready');
    await page.waitForTimeout(1700);
    check(await pair.getAttribute('data-scope')==='south' && await pair.getByText(/^基准 200 次/).isVisible(), 'latest-scope-wins', motion);
    const summary=pair.locator('summary');await summary.focus();await page.keyboard.press('Enter');await page.waitForTimeout(240);
    check(await pair.getByText(/当前 240 次，基准 200 次/).isVisible(), 'motion-detail-painted', motion);
    await page.keyboard.press('Space');await page.waitForTimeout(240);check(await summary.evaluate(el=>el===document.activeElement), 'motion-focus', motion);
    await pair.getByRole('button',{name:'重新读取比较',exact:true}).click();
    await pair.getByRole('button',{name:'取消读取',exact:true}).focus();await page.keyboard.press('Enter');
    check(await pair.getAttribute('data-read-status')==='cancelled', 'cancel', motion);
    check(await pair.getByRole('button',{name:'重新读取比较',exact:true}).evaluate(el=>el===document.activeElement), 'cancel-focus', motion);
    await pair.getByRole('button',{name:'重新读取比较',exact:true}).click();await page.getByRole('button',{name:'退出比较示例',exact:true}).click();await page.waitForTimeout(1800);
    check(await pair.count()===0,'exit-cleanup',motion);cases.push({motion});
  }
  check(errors.length===0,'pageerrors',errors);
  return {pass:!failures.length,failures,cases,negative,errors,scope:'Synthetic provider; real keyboard Enter/Space; selectOption; CSS zoom; reduced-motion media/manual. No native select or speech claim.'};
}
