// Final built review examples, or an isolated consumer build, at the current page's origin.
// playwright-cli open http://127.0.0.1:18342/review-platform/
// playwright-cli run-code --filename scripts/check-review-tools.js
async page => {
  const origin = await page.evaluate(() => location.origin);
  const failures = [], matrix = [], errors = [];
  const check = (value, name) => { if (!value) failures.push(name); };
  page.on('pageerror', error => errors.push(String(error)));
  const tools = () => page.getByRole('button', { name: /^评审工具/ });
  const drawer = () => page.getByRole('dialog', { name: '评审工具', exact: true });
  const close = async () => { await page.keyboard.press('Escape'); await drawer().waitFor({ state: 'detached' }); };
  const focusReturned = async () => {
    await page.waitForFunction(() => document.activeElement?.classList.contains('rhine-review-tools-trigger'));
  };
  await page.setViewportSize({ width: 1033, height: 954 });
  await page.goto(`${origin}/review-platform/`);
  await page.frameLocator('iframe').getByRole('heading', { name: '桌面工作区' }).waitFor();
  const after = await page.locator('iframe').boundingBox();
  check(await page.locator('.rhine-review-controls').evaluate(el => el.nextElementSibling?.classList.contains('rhine-review-viewport')), 'canvas immediately follows main controls');
  await page.screenshot({ path: 'output/playwright/74-after.png' });

  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880, 1280]) for (const zoom of [1, 2]) {
    const name = `${theme}/${width}/${zoom}`;
    await page.setViewportSize({ width, height: 954 });
    await page.goto(`${origin}/review-platform/#scene=workspace&theme=${theme}&width=fit&zoom=${zoom}`);
    const frame = page.frameLocator('iframe');
    const draft = frame.getByRole('textbox', { name: '工作区名称' });
    await draft.fill('辅助区保留草稿');
    await page.locator('.rhine-review-tools-trigger[data-phase=ready]').waitFor();
    const frameHandle = await page.locator('iframe').elementHandle();
    const inputHandle = await draft.elementHandle();
    const before = await page.locator('iframe').boundingBox();
    check(await page.getByLabel('CSS 缩放').count() === 0, `${name} closed content unmounted`);
    // Use an actual short viewport for scroll preservation; exact amount is not prescribed.
    const scroll = await page.locator('.rhine-review-main').evaluate(el => { el.scrollTop = 90; return el.scrollTop; });
    await tools().click();
    await drawer().waitFor();
    check(await page.getByLabel('画布尺寸').textContent().then(text => text.includes(`${zoom * 100}% CSS zoom`)), `${name} dimensions in drawer`);
    await drawer().evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
    const bounds = await drawer().boundingBox();
    check(bounds.x >= -1 && bounds.x + bounds.width <= width + 1, `${name} drawer within viewport`);
    check(await drawer().evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name} drawer no horizontal overflow`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} shell no horizontal overflow`);
    for (let index = 0; index < 9; index++) {
      await page.keyboard.press('Tab');
      check(await drawer().evaluate(el => el.contains(document.activeElement)), `${name} Tab ${index} remains inside drawer`);
    }
    await close(); await focusReturned();
    check(await page.getByLabel('CSS 缩放').count() === 0, `${name} closed settings removed`);
    check(await frameHandle.evaluate(el => el.isConnected && el === document.querySelector('iframe')), `${name} same iframe`);
    check(await inputHandle.evaluate(el => el.isConnected), `${name} same draft input`);
    check(await draft.inputValue() === '辅助区保留草稿', `${name} draft preserved`);
    check(await page.locator('.rhine-review-main').evaluate(el => el.scrollTop) === scroll, `${name} scroll preserved`);
    matrix.push({ name, drawer: bounds, frameBefore: before });
    if (width === 400 && zoom === 2) {
      await tools().click();
      await drawer().waitFor();
      await drawer().evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
      await page.screenshot({ path: `output/playwright/74-tools-${theme}-400-css200.png` });
      await close();
    }
  }
  await page.setViewportSize({ width: 1033, height: 954 });
  await page.goto(`${origin}/review-platform/`);
  const frame = page.frameLocator('iframe');
  const draft = frame.getByRole('textbox', { name: '工作区名称' });
  await draft.fill('主题宽度保留草稿');
  const identity = await page.locator('iframe').elementHandle();
  const draftIdentity = await draft.elementHandle();
  for (const theme of ['arknights', 'neo-brutalism', 'rhine']) {
    await page.getByLabel('界面主题').selectOption(theme);
    await frame.locator(`.rhine-theme[data-rhine-theme=${theme}]`).waitFor();
    for (const width of ['400', '520', '880', '1280', 'fit']) {
      await page.getByLabel('画布宽度').selectOption(width);
      check(await identity.evaluate(el => el.isConnected), `${theme}/${width} iframe identity`);
      check(await draftIdentity.evaluate(el => el.isConnected), `${theme}/${width} input identity`);
      check(await draft.inputValue() === '主题宽度保留草稿', `${theme}/${width} draft identity`);
    }
  }
  await tools().click();
  await page.getByRole('button', { name: '确认并清除反馈' }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('alertdialog').waitFor({ state: 'detached' });
  check(await drawer().isVisible(), 'first Escape only closes nested confirmation');
  await page.waitForFunction(() => document.activeElement?.textContent === '确认并清除反馈');
  await page.getByRole('button', { name: '确认并清除反馈' }).click();
  await page.getByRole('button', { name: '确认清除', exact: true }).click();
  await page.getByRole('alertdialog').waitFor({ state: 'detached' });
  await page.getByText('暂无评审反馈').waitFor();
  await page.waitForFunction(() => document.querySelector('[role=dialog]')?.contains(document.activeElement));
  check(await page.getByRole('button', { name: '确认并清除反馈' }).isDisabled(), 'empty feedback clear disabled');
  await close(); await focusReturned();
  check(await tools().textContent() === '评审工具', 'ready empty indicator compact');
  check(await draft.inputValue() === '主题宽度保留草稿', 'acknowledgement preserves draft');
  await page.getByRole('link', { name: '长反馈与辅助工具', exact: true }).click();
  await frame.getByText('从头部打开评审工具，检查长反馈、确认清除和逐层 Escape 归焦。').waitFor();
  await tools().click();
  check((await page.locator('.rhine-review-log').textContent()).includes('synthetic'.repeat(40)), 'full unbroken long feedback retained');
  check(await drawer().evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'long feedback wraps');
  await page.getByRole('button', { name: '确认并清除反馈' }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  check((await page.locator('.rhine-review-log').textContent()).includes('合成长反馈'), 'cancel keeps feedback');
  await close();

  // Both shell portals and real canvas animation honor manual and system reduction.
  await page.getByRole('link', { name: '桌面工作区', exact: true }).click();
  const canvas = frame.locator('canvas'); await canvas.waitFor();
  for (const mode of ['reduced', 'system']) {
    await page.emulateMedia({ reducedMotion: mode === 'system' ? 'reduce' : 'no-preference' });
    await tools().click(); await page.getByLabel('动态偏好').selectOption(mode);
    await frame.getByText('减少动态', { exact: true }).waitFor();
    check(await drawer().evaluate(el => getComputedStyle(el).animationName === 'none'), `${mode} drawer reduced`);
    const count = await canvas.getAttribute('data-frames'); await page.waitForTimeout(150);
    check(await canvas.getAttribute('data-frames') === count, `${mode} canvas stops`);
    await close(); await focusReturned();
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  check(!errors.length, `page errors: ${errors}`);
  return { after, matrix, failures, errors, browser: await page.evaluate(() => navigator.userAgent) };
}
