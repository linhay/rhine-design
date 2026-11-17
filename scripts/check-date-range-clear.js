// Production #date-range-filter regression using the ego-browser Page API.
// Inspect pass/failures. CSS zoom is not browser-native zoom or a screen-reader test.
async (page, { quick = false } = {}) => {
  const origin = await page.evaluate(() => location.origin);
  const pathname = await page.evaluate(() => location.pathname);
  const samples = [], failures = [];
  const check = (ok, tag, message) => { if (!ok) failures.push({ tag, message }); };
  const matrix = quick ? [{ theme: 'rhine', width: 880, zoom: 1, motion: 'normal', key: 'click' }] :
    ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite'].flatMap(theme =>
      [400, 520, 880].flatMap((width, widthIndex) => [1, 2].map((zoom, zoomIndex) => ({ theme, width, zoom, motion: 'normal', key: ['click', 'Enter', 'Space'][(widthIndex + zoomIndex) % 3] }))));
  if (!quick) for (const motion of ['system', 'manual']) for (const key of ['click', 'Enter', 'Space']) matrix.push({ theme: 'rhine', width: 400, zoom: 2, motion, key });
  const waitForDialog = name => page.waitForFunction(name => {
    const node = [...document.querySelectorAll('[role="dialog"]')].find(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === name);
    return node && Number(getComputedStyle(node).opacity) >= .99 && node.getAnimations().every(animation => animation.playState !== 'running');
  }, name, { timeout: 3000 });
  const read = () => page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    const name = node => node && document.getElementById(node.getAttribute('aria-labelledby'))?.textContent;
    const drawer = dialogs.find(node => name(node) === '日期更多筛选');
    const parent = dialogs.find(node => name(node) === '日期筛选设置');
    const group = drawer?.querySelector('fieldset');
    const active = document.activeElement;
    const style = active && getComputedStyle(active);
    const rect = active?.getBoundingClientRect();
    return { dialogs: dialogs.map(name), groupFocus: active === group, activeTag: active?.tagName,
      activeName: active?.getAttribute('aria-label') || active?.labels?.[0]?.textContent || (active?.tagName === 'FIELDSET' ? active.querySelector('legend')?.textContent : active?.textContent?.slice(0, 70)),
      connected: !!active?.isConnected, inDrawer: !!drawer?.contains(active),
      dateFocus: active?.matches('input[type="date"]') && !!group?.contains(active),
      values: [...(drawer?.querySelectorAll('input[type="date"]') || [])].map(node => node.value),
      clearDisabled: [...(drawer?.querySelectorAll('button') || [])].find(node => node.textContent === '清空日期')?.disabled,
      count: parent?.querySelector('p[role="status"]')?.textContent,
      note: parent?.querySelector('input')?.value,
      outline: { style: style?.outlineStyle, width: style?.outlineWidth, keyboard: active?.matches(':focus-visible') },
      viewport: { width: innerWidth, height: innerHeight, zoom: document.documentElement.style.zoom },
      rect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      overflow: document.documentElement.scrollWidth > innerWidth,
      errors: window.__issue217Errors || [] };
  });
  for (const scenario of matrix) {
    const tag = [scenario.theme, scenario.width, scenario.zoom, scenario.motion, scenario.key].join('/');
    try {
      await page.cdp('Emulation.setDeviceMetricsOverride', { width: scenario.width, height: 900, deviceScaleFactor: 1, mobile: false });
      await page.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: scenario.motion === 'system' ? 'reduce' : 'no-preference' }] });
      await page.goto(origin + pathname + '?clearRun=' + encodeURIComponent(tag) + '#date-range-filter');
      await page.evaluate(s => {
        document.documentElement.style.zoom = String(s.zoom);
        const theme = document.querySelector('.rhine-theme');
        theme.dataset.rhineTheme = s.theme; theme.dataset.rhineMotion = s.motion === 'manual' ? 'reduced' : 'system';
        window.__issue217Errors = [];
        window.addEventListener('error', event => window.__issue217Errors.push(event.message));
        window.addEventListener('unhandledrejection', event => window.__issue217Errors.push(String(event.reason)));
      }, scenario);
      await page.click("loc=role:button[name='打开日期筛选设置']");
      await waitForDialog('日期筛选设置');
      await page.fill("loc=role:textbox[name='设置备注']", '保留本轮设置草稿');
      await page.click("loc=role:button[name='更多筛选，已选 1 项']");
      await waitForDialog('日期更多筛选');
      await page.waitForSelector("loc=role:button[name='清空日期']", { state: 'visible' });
      if (scenario.key === 'click') await page.click("loc=role:button[name='清空日期']");
      // Programmatic action focus is setup; activation and post-clear Tab are real keys.
      else { await page.focus("loc=role:button[name='清空日期']"); await page.keyboard.press(scenario.key); }
      const cleared = await read();
      check(cleared.groupFocus && cleared.inDrawer && cleared.activeName === '筛选日期', tag, 'clear hands off to stable named group inside drawer');
      check(cleared.values.length === 2 && cleared.values.every(value => value === '') && cleared.clearDisabled, tag, 'both dates cleared and clear disabled');
      check(cleared.count?.includes('回传次数：1'), tag, 'exactly one range callback');
      check(!cleared.overflow, tag, 'no page horizontal overflow');
      if (scenario.key !== 'click') {
        check(cleared.outline.style !== 'none' && parseFloat(cleared.outline.width) > 0, tag, 'keyboard handoff has visible outline');
        await page.keyboard.press('Tab');
        const tabbed = await read();
        check(tabbed.dateFocus && tabbed.activeName === '开始日期', tag, 'Tab continues to editable start date');
      }
      // Click exercises immediate Escape; keyboard paths also wait for host result.
      if (scenario.key !== 'click') {
        await page.waitForFunction(() => ![...document.querySelectorAll('.rhine-list-filter-bar')].some(node => node.textContent.includes('正在')), undefined, { timeout: 3000 });
        const settled = await read();
        check(settled.dateFocus && settled.inDrawer, tag, 'async result does not steal editing focus');
      }
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length < 2, undefined, { timeout: 3000 });
      const escaped = await read();
      check(escaped.dialogs.length === 1 && escaped.dialogs[0] === '日期筛选设置', tag, 'one Escape closes only drawer');
      if (escaped.dialogs.length === 1) {
        await page.waitForFunction(() => document.activeElement?.tagName === 'BUTTON' && document.activeElement.textContent === '更多筛选', undefined, { timeout: 3000 });
        check(escaped.note === '保留本轮设置草稿' && escaped.count?.includes('回传次数：1'), tag, 'settings draft and cleared range survive');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0, undefined, { timeout: 3000 });
        await page.waitForFunction(() => document.activeElement?.textContent === '打开日期筛选设置', undefined, { timeout: 3000 });
      }
      check(cleared.errors.length === 0 && escaped.errors.length === 0, tag, 'no observed interaction errors');
      samples.push({ scenario, cleared, escaped });
    } catch (error) { failures.push({ tag, message: String(error), state: await read().catch(() => null) }); }
  }
  await page.cdp('Emulation.clearDeviceMetricsOverride');
  await page.cdp('Emulation.setEmulatedMedia', { features: [] });
  return { pass: failures.length === 0, samples, failures, userAgent: await page.evaluate(() => navigator.userAgent), scope: 'Production showcase; CSS zoom, synthetic host result; no real service, native zoom or spoken screen reader evidence.' };
}
