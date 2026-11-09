async page => {
  const { origin, probe } = await page.evaluate(() => ({ origin:location.origin, probe:new URLSearchParams(location.search).get('labelProbe') }));
  const failures = [], cases = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const label = `${theme}/${width}/css${zoom * 100}`;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?fixture=list-card-recipes&theme=${theme}`);
    await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); }, zoom);
    const panel = page.getByRole('tabpanel');
    check(await page.getByRole('button', {name:'批量设置',exact:true}).count() === 0, { label, kind:'initial-real-read-has-no-bulk' });
    await panel.getByRole('region').waitFor();
    await page.getByLabel('长资源名称', { exact: true }).check();
    if (probe === 'wrap') await panel.getByRole('region').evaluate(el => { el.style.flexWrap = 'wrap'; });
    const geometry = await page.locator('[data-list-recipe]').evaluate(root => {
      const list = root.querySelector('[role=tablist]'), bulk = root.querySelector('.rhine-recipe-bulk'), panel = root.querySelector('[role=tabpanel]:not([hidden])'), region = panel.querySelector('[role=region]');
      const r = el => { const b = el.getBoundingClientRect(); return { left:b.left, right:b.right, top:b.top, bottom:b.bottom, width:b.width, height:b.height }; };
      return { root:r(root), list:r(list), bulk:r(bulk), panel:r(panel), region:r(region), regionWidth:region.clientWidth, regionScroll:region.scrollWidth,
        tops:[...region.children].map(el => r(el).top), wraps:getComputedStyle(region).flexWrap,
        buttons:[...list.querySelectorAll('button'),bulk.querySelector('button')].map(el => r(el)),
        pageFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        cardFits:panel.querySelector('.rhine-recipe-card').scrollWidth <= panel.querySelector('.rhine-recipe-card').clientWidth + 1,
        relation:panel.getAttribute('aria-labelledby') === list.querySelector('[aria-selected=true]').id };
    });
    check(geometry.pageFits && geometry.cardFits, { label, kind:'inner-and-page-fit', geometry });
    check(geometry.relation && geometry.panel.top >= geometry.bulk.bottom - 1, { label, kind:'real-panel-below-actions', geometry });
    check(geometry.list.right <= geometry.bulk.left + 1 || geometry.list.top >= geometry.bulk.bottom - 1 || geometry.list.bottom <= geometry.bulk.top + 1, { label, kind:'actions-no-overlap', geometry });
    check(geometry.buttons.every(b => b.height >= 44 * zoom - 1), { label, kind:'44px-target', geometry });
    check(geometry.wraps === 'nowrap' && Math.max(...geometry.tops) - Math.min(...geometry.tops) < 1, { label, kind:'single-row', geometry });
    check(geometry.regionScroll > geometry.regionWidth, { label, kind:'local-overflow', geometry });
    const region = panel.getByRole('region');
    await panel.focus(); await page.keyboard.press('Tab');
    const focus = await region.evaluate(el => ({ active:el === document.activeElement, outline:getComputedStyle(el).outlineStyle }));
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(180);
    check(await region.evaluate(el => el.scrollLeft > 0), { label, kind:'native-arrow-scroll' });
    check(focus.active && focus.outline !== 'none', { label, kind:'visible-focus', focus });
    // A long final label cannot fit at once: verify its beginning then its final character, unclipped vertically.
    const edges = await region.evaluate(el => {
      const last = el.lastElementChild, text = last.firstElementChild.firstChild;
      el.scrollLeft = last.offsetLeft - el.offsetLeft;
      const range = document.createRange(); range.setStart(text,0); range.setEnd(text,1);
      const start = range.getBoundingClientRect(), outer = el.getBoundingClientRect();
      const startFits = start.left >= outer.left - 1 && start.right <= outer.right + 1;
      el.scrollLeft = el.scrollWidth;
      range.setStart(text,text.length-1); range.setEnd(text,text.length);
      const end = range.getBoundingClientRect();
      return { startFits, endFits:end.left >= outer.left - 1 && end.right <= outer.right + 1 && end.top >= outer.top - 1 && end.bottom <= outer.bottom + 1, scroll:el.scrollLeft };
    });
    check(edges.startFits && edges.endFits, { label, kind:'long-last-label-both-ends', edges });
    const tab = page.getByRole('tab', { name:'全部', exact:true });
    await tab.focus(); await page.keyboard.press('End');
    check(await page.getByRole('button', {name:'批量设置',exact:true}).count() === 0, { label, kind:'scope-real-read-has-no-bulk' });
    check(await page.getByRole('tab', { name:'API Key',exact:true }).evaluate(el => el === document.activeElement && el.getAttribute('aria-selected') === 'true'), { label, kind:'End' });
    for (const key of ['Tab','Shift+Tab']) {
      await page.getByRole('tab', { name:'API Key',exact:true }).focus();
      for (let i=0;i<7;i++) { await page.keyboard.press(key); check(await page.evaluate(() => !document.activeElement.closest('[role=tabpanel][hidden]')), { label, kind:'hidden-tab-order', key, i }); }
    }
    await page.getByRole('tab', { name:'API Key',exact:true }).focus(); await page.keyboard.press('Home');
    check(await tab.evaluate(el => el === document.activeElement && el.getAttribute('aria-selected') === 'true'), { label, kind:'Home' });
    await page.getByRole('button', { name:'批量设置',exact:true }).click();
    await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state:'hidden' });
    check(await tab.getAttribute('aria-selected') === 'true', { label, kind:'bulk-independent' });
    await page.getByLabel('有批量权限', { exact:true }).uncheck();
    check(await page.getByRole('tab').count() === 3 && await page.getByRole('button', {name:'批量设置',exact:true}).count() === 0, { label, kind:'readonly-keeps-tabs' });
    await page.getByLabel('可查看 API Key', { exact:true }).uncheck();
    check(await page.getByRole('tab', {name:'API Key',exact:true}).count() === 0, { label, kind:'authorized-types-only' });
    cases.push({ label, geometry, edges, focus });
  }
  const states = [];
  for (const scenario of ['loading','error','empty','no-labels']) {
    await page.getByLabel('列表配方状态').selectOption(scenario);
    const panel = page.getByRole('tabpanel');
    if (scenario === 'no-labels') await panel.getByText('暂无归属分组').waitFor();
    if (scenario !== 'no-labels') check(await page.getByRole('button', {name:'批量设置',exact:true}).count() === 0, { kind:'unavailable-has-no-bulk',scenario });
    const text = await panel.innerText();
    check(text.includes({ loading:'正在读取', error:'无法读取此分类', empty:'此分类暂无资源', 'no-labels':'暂无归属分组' }[scenario]), { kind:'state',scenario,text });
    states.push({scenario,text});
  }
  const motion = [];
  for (const mode of ['normal','system','manual']) {
    await page.emulateMedia({ reducedMotion:mode === 'system' ? 'reduce' : 'no-preference' });
    await page.goto(`${origin}/?fixture=list-card-recipes&motion=${mode}`);
    await page.getByLabel('列表配方状态').selectOption('loading');
    const result = await page.getByRole('tabpanel').locator('.rhine-skeleton > span[aria-hidden]').first().evaluate(el => ({ animation:getComputedStyle(el).animationName, state:getComputedStyle(el).animationPlayState }));
    check(mode === 'normal' ? result.animation !== 'none' : result.animation === 'none', { kind:'motion',mode,result });
    await page.getByRole('tab', {name:'OAuth',exact:true}).click();
    check(await page.getByRole('tabpanel').count() === 1, { kind:'motion-result',mode });
    motion.push({mode,result});
  }
  return { pass:failures.length === 0 && errors.length === 0, failures, errors, cases, states, motion, browser:await page.evaluate(() => navigator.userAgent) };
}
