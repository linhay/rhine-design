// Build both examples and serve dist at loopback port 18342; HTTP dev uses 18340.
// playwright-cli run-code --filename scripts/check-review.js
async page => {
  const failures = [], errors = [], requests = [], consoleErrors = [], consoleChecks = [];
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // Firefox renders an Error argument as only "Error"; inspect the actual exception too.
    consoleChecks.push(Promise.all(message.args().map(argument => argument.evaluate(value => value instanceof Error ? value.message : '').catch(() => ''))).then(messages => {
      if (!message.text().includes('合成渲染失败') && !messages.includes('合成渲染失败')) consoleErrors.push(message.text());
    }));
  });
  const check = (condition, message) => { if (!condition) failures.push(message); };
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => requests.push(request.url()));
  const http = 'http://127.0.0.1:18342/review-http/';
  const advanced = async () => { const details = page.locator('.rhine-review-options'); if (!await details.evaluate(element => element.open)) await details.locator('summary').click(); };
  const motion = async value => { await advanced(); await page.getByRole('combobox', { name: '动态偏好' }).selectOption(value); };
  let cases = 0;
  for (const base of [http, 'http://127.0.0.1:18340/review-http/']) {
    await page.goto(base);
    const frame = page.frameLocator('iframe');
    await frame.getByRole('heading', { name: '项目工作台' }).waitFor();
    check(await page.locator('.rhine-review-header').evaluate(element => getComputedStyle(element).display === 'flex'), `${base} stylesheet loaded`);
    await frame.getByRole('button', { name: '加载延迟模块' }).click();
    await frame.getByText('延迟模块已加载 · 资源 base 与产品路由互相独立').waitFor();
    await frame.getByRole('textbox', { name: '未保存草稿' }).fill('浏览器保留草稿');
    await frame.getByRole('button', { name: '新建项目', exact: true }).click();
    const input = frame.getByRole('textbox', { name: '项目名称' });
    const handle = await input.elementHandle();
    await input.focus();
    for (const theme of ['rhine', 'arknights', 'neo-brutalism']) {
      await page.getByRole('combobox', { name: '界面主题' }).selectOption(theme);
      await page.getByRole('combobox', { name: '画布宽度' }).selectOption('520');
      check(await input.inputValue() === '浏览器保留草稿', `${base} ${theme} draft`);
      check(await handle.evaluate(element => element.isConnected && element === element.ownerDocument.activeElement), `${base} ${theme} node/focus`);
      check(await frame.locator('.rhine-theme').count() === 1, `${base} single theme root`);
      await frame.locator(`.rhine-theme[data-rhine-theme="${theme}"]`).waitFor();
    }
    await frame.getByRole('button', { name: '保存项目', exact: true }).click();
    await frame.getByRole('dialog').waitFor({ state: 'detached' });
    check(await frame.getByText('浏览器保留草稿', { exact: true }).count() === 1, `${base} form submit`);
    await frame.getByRole('button', { name: '触发未实现操作' }).click();
    await page.getByRole('alert').filter({ hasText: '未实现模拟请求' }).waitFor();
    // Verify real navigation defaults never escape the runtime, while same-document anchors work.
    const child = page.frames().find(frame => frame !== page.mainFrame());
    const before = child.url();
    for (const href of ['/product/detail', '/api/export', 'https://synthetic.invalid/export']) {
      await child.evaluate(href => { const link = document.createElement('a'); link.href = href; link.textContent = '测试导航'; document.body.append(link); link.click(); link.remove(); }, href);
      check(child.url() === before, `${base} blocked ${href}`);
    }
    await child.evaluate(() => { const link = document.createElement('a'); link.href = '#local-section'; document.body.append(link); link.click(); link.remove(); });
    await child.waitForFunction(() => location.hash === '#local-section');
    check(child.url().endsWith('#local-section'), `${base} local anchor`);
    const beforeReset = await frame.getByRole('textbox', { name: '未保存草稿' }).elementHandle();
    await page.getByRole('button', { name: '重置场景' }).click();
    await beforeReset.evaluate(element => new Promise((resolve, reject) => { const start = performance.now(); const poll = () => { if (!element.isConnected) resolve(true); else if (performance.now() - start > 1500) reject(new Error('reset did not unmount previous session')); else requestAnimationFrame(poll); }; poll(); }));
    await frame.getByRole('textbox', { name: '未保存草稿' }).waitFor();
    check(await frame.getByRole('textbox', { name: '未保存草稿' }).inputValue() === '', `${base} reset`);
    for (const state of ['loading', 'empty', 'error', 'dense', 'normal']) {
      await page.getByRole('combobox', { name: '列表状态' }).selectOption(state);
      const expected = { loading: '正在加载合成项目…', empty: '暂无项目', error: '合成服务暂不可用', dense: '合成项目 1 · 跨团队设计评审与持续验证的长标题示例', normal: '合成项目 1' }[state];
      await frame.getByText(expected, { exact: true }).waitFor();
    }
    await page.getByRole('combobox', { name: '角色', exact: true }).selectOption('reader');
    await frame.getByText('合成数据 · 只读 · 独立产品路由', { exact: true }).waitFor();
    check(await frame.getByRole('button', { name: '新建项目', exact: true }).isDisabled(), `${base} read-only`);
    const deepLink = page.url(); await page.reload();
    await frame.getByRole('heading', { name: '项目工作台' }).waitFor();
    check(page.url() === deepLink, `${base} refresh URL`);
    await page.getByRole('combobox', { name: '角色', exact: true }).selectOption('editor');
    await page.goBack();
    check(await page.getByRole('combobox', { name: '角色', exact: true }).inputValue() === 'reader', `${base} history back`);
    await page.goForward();
    check(await page.getByRole('combobox', { name: '角色', exact: true }).inputValue() === 'editor', `${base} history forward`);
    cases++;
  }
  // Final artifact visual / keyboard matrix (CSS zoom, not browser zoom).
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880, 1280]) for (const zoom of [1, 2]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${http}#scene=projects&theme=${theme}&width=fit&zoom=${zoom}&d.status=dense`);
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: '新建项目', exact: true }).click();
    const dialog = frame.getByRole('dialog');
    await dialog.waitFor();
    await frame.getByRole('textbox', { name: '项目名称' }).fill('窄屏键盘');
    await page.keyboard.press('Tab');
    check(await dialog.evaluate(element => element.contains(element.ownerDocument.activeElement)), `${theme}/${width}/${zoom} focus trap`);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    try { await frame.getByRole('button', { name: '新建项目', exact: true }).evaluate(element => new Promise((resolve, reject) => { const start = performance.now(); const poll = () => { if (element === document.activeElement) resolve(true); else if (performance.now() - start > 1500) reject(new Error('focus timeout')); else requestAnimationFrame(poll); }; poll(); })); } catch { check(false, `${theme}/${width}/${zoom} focus return`); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    check(!overflow, `${theme}/${width}/${zoom} shell overflow`);
    if (width === 400 && zoom === 2) await page.screenshot({ path: `output/playwright/review-${theme}-400-css200.png`, fullPage: true });
    cases++;
  }
  await page.setViewportSize({ width: 400, height: 1000 });
  await page.goto('http://127.0.0.1:18342/review-platform/');
  await page.getByRole('button', { name: '场景目录' }).click();
  await page.getByRole('textbox', { name: '搜索场景' }).fill('没有此场景');
  await page.getByText('没有匹配场景').waitFor();
  await page.getByRole('textbox', { name: '搜索场景' }).fill('');
  await page.getByRole('textbox', { name: '搜索场景' }).focus();
  await page.keyboard.press('Escape');
  check(await page.getByRole('button', { name: '场景目录' }).evaluate(element => element === document.activeElement), 'mobile directory escape focus');
  await page.getByRole('button', { name: '场景目录' }).click();
  await page.getByRole('link', { name: '慢速初始化', exact: true }).click();
  check(await page.getByRole('button', { name: '场景目录' }).getAttribute('aria-expanded') === 'false', 'mobile directory closes after navigation');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('http://127.0.0.1:18342/review-platform/');
  const frame = page.frameLocator('iframe');
  const actualCanvas = frame.locator('canvas');
  await actualCanvas.waitFor();
  const frames = async () => Number(await actualCanvas.getAttribute('data-frames'));
  let count = await frames(); await page.waitForTimeout(120); check(await frames() > count, 'canvas plays');
  await motion('paused');
  await frame.getByText('已暂停', { exact: true }).waitFor();
  count = await frames(); await page.waitForTimeout(120); check(await frames() === count, 'canvas pauses');
  await motion('full');
  count = await frames(); await page.waitForTimeout(120); check(await frames() > count, 'canvas resumes');
  await motion('reduced');
  await frame.getByText('减少动态', { exact: true }).waitFor();
  count = await frames(); await page.waitForTimeout(120); check(await frames() === count, 'manual reduced');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await motion('system');
  count = await frames(); await page.waitForTimeout(120); check(await frames() === count, 'system reduced');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  count = await frames(); await page.waitForTimeout(120); check(await frames() > count, 'system resumes');
  const oldCanvas = await actualCanvas.elementHandle();
  await frame.getByRole('textbox', { name: '工作区名称' }).fill('内存工作区');
  await frame.getByRole('button', { name: '保存工作区' }).click();
  await frame.getByText('内存工作区已保存').waitFor();
  await page.getByRole('link', { name: '慢速初始化', exact: true }).click();
  await frame.getByRole('heading', { name: '桌面工作区' }).waitFor({ state: 'detached' });
  const oldCount = await oldCanvas.evaluate(element => element.dataset.frames);
  await page.getByRole('link', { name: '桌面工作区', exact: true }).click();
  await frame.getByRole('heading', { name: '桌面工作区' }).waitFor();
  await page.waitForTimeout(4200);
  check(await oldCanvas.evaluate(element => element.dataset.frames) === oldCount, 'unmounted canvas stops');
  check(await frame.getByText('慢速初始化完成').count() === 0, 'late setup discarded');
  await page.getByRole('link', { name: '渲染错误边界', exact: true }).click();
  await frame.getByRole('alert').waitFor();
  await page.getByRole('alert').filter({ hasText: '场景渲染失败' }).waitFor();
  await page.getByRole('link', { name: '桌面工作区', exact: true }).click();
  await frame.getByRole('heading', { name: '桌面工作区' }).waitFor();
  await page.screenshot({ path: 'output/playwright/review-platform.png', fullPage: true });
  const outbounds = requests.filter(url => !url.startsWith('http://127.0.0.1:1834') && !url.startsWith('data:'));
  const businessRequests = requests.filter(url => /\/api\//.test(url));
  check(!outbounds.length && !businessRequests.length, 'no real business/network egress');
  check(!errors.length, `page errors: ${errors}`);
  await Promise.all(consoleChecks);
  check(!consoleErrors.length, `console errors: ${consoleErrors}`);
  return { cases, failures, errors, consoleErrors, outbounds, businessRequests, requests: requests.length };
}
