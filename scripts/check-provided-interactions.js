async (page, options = {}) => {
  // ego-browser Page API. Run against an already opened production preview.
  const base = new URL(await page.url());
  const samples = [], failures = [];
  let context = {};
  const check = (condition, test, actual) => { if (!condition) failures.push({ ...context, test, actual }); };
  const navigate = async (section, theme, zoom = 1) => {
    const url = new URL(base); url.search = `?theme=${theme}`; url.hash = section;
    if (await page.url() === url.href) await page.reload(); else await page.goto(url.href);
    await page.waitForSelector('.ds-section');
    await page.evaluate(zoom => { document.documentElement.style.zoom = String(zoom); document.querySelector('.ds-workspace').scrollTop = 0; }, zoom);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const closed = selector => page.waitForSelector(selector, { state:'hidden' });
  const focusName = text => page.waitForFunction(text => document.activeElement?.textContent?.trim() === text, text, { timeout:3000 });
  const focusSelector = selector => page.waitForFunction(selector => document.activeElement?.matches(selector), selector, { timeout:3000 });
  const clickFocusedButton = async (text) => {
    // Under root CSS zoom, the ego locator can reject a painted, visible button.
    // Reach it with real Tab, then verify its actual painted center before clicking.
    const point = await page.evaluate(text => {
      const button = document.activeElement;
      if (!(button instanceof HTMLButtonElement) || button.textContent.trim() !== text) throw new Error(`Wrong focused button for ${text}`);
      const rect=button.getBoundingClientRect(), x=rect.x+rect.width/2, y=rect.y+rect.height/2;
      if (x<0 || x>=innerWidth || y<0 || y>=innerHeight || document.elementFromPoint(x,y)?.closest('button')!==button) throw new Error(`Button ${text} is clipped or covered`);
      return {x,y};
    },text);
    await page.mouse.click(point.x,point.y);
  };
  try {
  const themes = options.themes ?? ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite'];
  if (!options.skipLayout) for (const theme of themes) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    context = { theme, width, zoom };
    await page.cdp('Emulation.setDeviceMetricsOverride', { width, height:800, deviceScaleFactor:1, mobile:false });
    for (const section of ['splitter', 'calendar', 'transfer', 'config-provider', 'qr-code']) {
      context = { theme, width, zoom, section };
      await navigate(section, theme, zoom);
      const layout = await page.evaluate(({ section, zoom }) => {
        const target = document.querySelector(section === 'config-provider' ? '.rhine-config' : section === 'qr-code' ? '.rhine-qr' : `.rhine-${section}`);
        const rect = target.getBoundingClientRect();
        const overflowing = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const result = { targetWidth:rect.width, viewport:innerWidth, overflowing, theme:document.querySelector('.rhine-theme').dataset.rhineTheme };
        if (section === 'calendar') {
          result.rows = [...target.querySelectorAll('tbody tr')].map(row => row.cells.length);
          result.minDayWidth = Math.min(...[...target.querySelectorAll('td button')].map(button => button.getBoundingClientRect().width / zoom));
          result.scrollable = target.querySelector('.rhine-calendar__viewport').scrollWidth >= target.querySelector('.rhine-calendar__viewport').clientWidth;
        }
        if (section === 'config-provider') {
          const buttons = target.querySelectorAll('.rhine-button');
          result.compactPadding = getComputedStyle(buttons[0]).paddingLeft;
          result.nestedPadding = getComputedStyle(target.querySelector(':scope .rhine-config .rhine-button')).paddingLeft;
          result.minHeight = Math.min(...[...buttons].map(button => button.getBoundingClientRect().height / zoom));
        }
        if (section === 'splitter') result.barWidth = target.querySelector('[role=separator]').getBoundingClientRect().width / zoom;
        return result;
      }, { section, zoom });
      check(layout.viewport === width, 'actual viewport matches requested width', layout);
      check(!layout.overflowing, 'document has no horizontal overflow', layout);
      check(layout.theme === theme, 'selected theme applied', layout);
      if (section === 'calendar') { check(layout.rows.length >= 4 && layout.rows.length <= 6 && layout.rows.every(count => count === 7), 'seven-column month rows', layout); check(layout.minDayWidth >= 43.5, 'calendar retains 44 CSS-pixel day targets', layout); }
      if (section === 'config-provider') { check(layout.compactPadding === '10px' && layout.nestedPadding === '16px', 'nested density resets', layout); check(layout.minHeight >= 43.5, 'density does not shrink standard targets', layout); }
      if (section === 'splitter') check(layout.barWidth >= 43.5, 'splitter hit width', layout);
      samples.push({ ...context, kind:'layout', ...layout });
    }
  }

  for (const theme of themes) {
    for (const [width, zoom] of (options.overlayScenarios ?? [[880,1], [400,2]])) {
      context = { theme, width, zoom, section:'nested-overlays' };
      await page.cdp('Emulation.setDeviceMetricsOverride', { width, height:800, deviceScaleFactor:1, mobile:false });
      await navigate('dropdown', theme, zoom);
      await page.click("loc=role:button[name='在对话框中检查浮层']");
      await page.waitForSelector('.rhine-dialog');
      await page.click("loc=role:button[name='对话框操作']"); await page.waitForSelector('[role=menu]');
      await page.keyboard.press('Escape'); await closed('[role=menu]');
      await focusName('对话框操作');
      check(await page.evaluate(() => document.querySelectorAll('.rhine-dialog').length === 1), 'first Escape keeps parent');
      // Deliberate immediate focus handoff beats deferred old-menu restoration.
      await page.click("loc=role:button[name='对话框操作']"); await page.waitForSelector('[role=menu]');
      await page.keyboard.press('Escape'); await page.focus('input[role=combobox]');
      await page.waitForSelector('[role=listbox]'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Escape');
      await closed('[role=listbox]'); await focusSelector('input[role=combobox]');
      context.step = 'cascader';
      await page.click("loc=role:button[name='对话框级联：未选择']"); await page.waitForSelector('[role=option]');
      await page.keyboard.press('Escape'); await closed('.rhine-popover'); await focusName('对话框级联：未选择');
      context.step = 'mentions-open';
      await page.focus('textarea[role=combobox]');
      // macOS End scrolls rather than moving the insertion point. Use actual
      // character navigation through this three-character prefilled draft.
      for (let caretStep=0; caretStep<3; caretStep++) await page.keyboard.press('ArrowRight');
      await page.waitForSelector('[role=listbox]');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await closed('[role=listbox]');
      const draft = await page.evaluate(() => document.querySelector('textarea').value);
      check(draft === '请 @林可 ', 'mention inserts at caret without losing text', draft);
      context.step = 'popconfirm';
      await page.keyboard.press('Tab'); await focusName('确认示例'); await clickFocusedButton('确认示例'); await page.waitForSelector('.rhine-popover');
      await page.keyboard.press('Escape'); await closed('.rhine-popover'); await focusName('确认示例');
      context.step = 'nested-image';
      await page.keyboard.press('Tab'); await focusName('嵌套预览'); await clickFocusedButton('嵌套预览'); await page.waitForFunction(() => document.querySelectorAll('.rhine-dialog').length === 2);
      await page.keyboard.press('Escape'); await page.waitForFunction(() => document.querySelectorAll('.rhine-dialog').length === 1); await focusName('嵌套预览');
      // Real Tab must stay in the parent, not in a closed popup or background.
      const tabTargets=[];
      for (let step=0; step<12; step++) { await page.keyboard.press(step < 6 ? 'Tab' : 'Shift+Tab'); tabTargets.push(await page.evaluate(() => ({ inside:!!document.activeElement?.closest('.rhine-dialog'), tag:document.activeElement?.tagName }))); }
      check(tabTargets.every(item => item.inside), 'closed layers do not escape parent Tab sequence', tabTargets);
      await page.keyboard.press('Escape'); await closed('.rhine-dialog'); await focusName('在对话框中检查浮层');
      samples.push({ ...context, kind:'keyboard', draft, tabTargets });
    }
  }

  if (options.onlyOverlays) return { pass:failures.length===0,sampleCount:samples.length,failures,samples,scope:'explicit overlay subset' };
  context = { section:'pointer-and-selection', theme:'rhine', width:880, zoom:1 };
  await page.cdp('Emulation.setDeviceMetricsOverride', { width:880, height:800, deviceScaleFactor:1, mobile:false });
  await navigate('splitter', 'rhine');
  const drag = await page.evaluate(() => { const root=document.querySelector('.rhine-splitter'), bar=root.querySelector('[role=separator]'); root.scrollIntoView(); const r=root.getBoundingClientRect(), b=bar.getBoundingClientRect(); return { x:b.x+b.width/2, y:b.y+b.height/2, end:r.x+(r.width-b.width)*.7+b.width/2 }; });
  await page.mouse.move(drag.x,drag.y); await page.mouse.down(); await page.mouse.move(drag.end,drag.y); await page.mouse.up();
  const ratio = await page.evaluate(() => Number(document.querySelector('[role=separator]').getAttribute('aria-valuenow')));
  check(Math.abs(ratio-70)<=1,'real pointer drag ratio',ratio);
  await page.keyboard.press('Home'); check(await page.evaluate(() => document.querySelector('[role=separator]').getAttribute('aria-valuenow')) === '20', 'splitter Home boundary');

  await navigate('transfer','rhine'); await page.focus(".rhine-transfer section:first-child li:first-child input:not(:disabled)"); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight');
  check(await page.evaluate(() => !!document.activeElement?.closest('section')?.querySelector('h3')?.textContent.includes('已选')), 'Transfer focus follows moved item');
  await navigate('calendar','rhine'); await page.focus('.rhine-calendar button[aria-pressed=true]'); await page.keyboard.press('End'); await page.keyboard.press('PageDown'); await page.keyboard.press('Enter');
  const date = await page.evaluate(() => document.querySelector('.rhine-calendar button[aria-pressed=true]')?.getAttribute('aria-label'));
  check(date?.includes('11月'), 'Calendar keyboard changes month then selects',date);
  await navigate('tree-select','rhine'); await page.click("loc=role:button[name='下拉资料选择：未选择']"); await page.waitForSelector('[role=tree]');
  await page.focus('[role=treeitem][aria-label="资料 A"]'); await page.keyboard.press('Enter'); await closed('.rhine-popover'); await focusName('下拉资料选择：资料 A');
  await navigate('menu','rhine'); await page.focus('.rhine-navigation-menu[data-orientation=horizontal]>ul>li:first-child>a'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  check(await page.evaluate(() => document.querySelector('.rhine-navigation-menu a[aria-current=page]')?.textContent) === '资料','native NavigationMenu activation');
  await navigate('tour','rhine'); await page.click("loc=role:button[name='开始引导']"); await page.waitForSelector('.rhine-tour'); await page.keyboard.press('Escape'); await closed('.rhine-tour'); await focusName('开始引导');
  samples.push({ ...context, kind:'pointer-and-selection', ratio, date });

  context = { section:'directory', width:400, zoom:1 };
  await page.cdp('Emulation.setDeviceMetricsOverride', { width:400, height:800, deviceScaleFactor:1, mobile:false });
  await navigate('calendar','rhine'); await page.click("loc=role:button[name='目录']");
  await page.fill('#gallery-search','MessageMeta');
  const found = await page.evaluate(() => [...document.querySelectorAll('#gallery-navigation a')].map(e=>e.textContent));
  check(found.includes('Chat 基石') && found.includes('MessageMeta') && found.length===2,'search preserves matching descendant and parent',found);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await focusName('目录');
  const closedTargets=[];
  for(let i=0;i<8;i++) { await page.keyboard.press('Tab'); closedTargets.push(await page.evaluate(()=>!!document.activeElement?.closest('.ds-sidebar-directory'))); }
  check(closedTargets.every(value=>!value),'compact directory is excluded from real Tab when closed',closedTargets);
  samples.push({ ...context, kind:'directory', found, closedTargets });

  for (const motion of ['normal','system-reduced','manual-reduced']) {
    context = { section:'motion', motion };
    await page.cdp('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion', value:motion==='system-reduced'?'reduce':'no-preference' }] });
    await navigate('spin','rhine');
    if(motion==='manual-reduced') await page.click('input[type=radio][value=reduced]');
    const animation = await page.evaluate(() => getComputedStyle(document.querySelector('.rhine-spin__mark')).animationName);
    check(motion==='normal'?animation!=='none':animation==='none','loading motion obeys preference',animation);
    await navigate('tour','rhine');
    if(motion==='manual-reduced') await page.click('input[type=radio][value=reduced]');
    await page.click("loc=role:button[name='开始引导']"); await page.waitForSelector('.rhine-tour'); await page.keyboard.press('Escape'); await closed('.rhine-tour'); await focusName('开始引导');
    samples.push({...context,kind:'motion',animation});
  }
  await page.cdp('Emulation.setEmulatedMedia',{features:[]});
  return { pass:failures.length===0, sampleCount:samples.length, failures, samples, scope:'Chromium production preview; CSS zoom only, no screen-reader speech or physical camera claim' };
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({ url:location.href,focus:document.activeElement?.outerHTML?.slice(0,500),inputs:[...document.querySelectorAll('textarea,input[role=combobox]')].map(input=>({value:input.value,caret:input.selectionStart,expanded:input.getAttribute('aria-expanded')})) }));
    return { pass:false, sampleCount:samples.length, failures:[...failures,{...context,test:'browser action or wait',error:String(error),diagnostic}],samples };
  }
}
