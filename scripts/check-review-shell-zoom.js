// Additional boundary: zoom the OUTER document, not the canvas URL's zoom setting.
// Run at a built review-platform origin with playwright-cli run-code --filename ...
async page => {
  const origin = await page.evaluate(() => location.origin);
  const failures = [], cases = [];
  const check = (value, label) => { if (!value) failures.push(label); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520]) {
    const label = `${theme}/${width}/shell-css200`;
    await page.setViewportSize({ width, height: 954 });
    await page.goto(`${origin}/review-platform/?shell-case=${theme}-${width}#scene=long-feedback&theme=${theme}&width=fit&zoom=1`);
    await page.locator('.rhine-review-tools-trigger[data-phase=ready]').waitFor();
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const tools = page.getByRole('button', { name: /^评审工具/ });
    await tools.click();
    const drawer = page.getByRole('dialog', { name: '评审工具', exact: true });
    await drawer.waitFor();
    await drawer.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
    const bounds = await drawer.boundingBox();
    check(bounds.x >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y >= -1 && bounds.y + bounds.height <= 955, `${label} drawer bounds`);
    check(await drawer.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${label} long feedback wraps`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${label} no document horizontal overflow`);
    check((await page.locator('.rhine-review-log').textContent()).includes('synthetic'.repeat(40)), `${label} complete feedback`);
    // Scroll actual long feedback to its action; the close control remains reachable by keyboard.
    await page.getByRole('button', { name: '确认并清除反馈' }).click();
    const confirm = page.getByRole('alertdialog'); await confirm.waitFor();
    await confirm.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
    const confirmBounds = await confirm.boundingBox();
    check(confirmBounds.x >= -1 && confirmBounds.x + confirmBounds.width <= width + 1, `${label} confirm bounds`);
    check(await confirm.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${label} confirm no horizontal overflow`);
    await page.keyboard.press('Escape'); await confirm.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.textContent === '确认并清除反馈');
    check(await drawer.isVisible(), `${label} inner Escape preserves drawer`);
    await page.keyboard.press('Escape'); await drawer.waitFor({ state: 'detached' });
    await page.waitForFunction(() => document.activeElement?.classList.contains('rhine-review-tools-trigger'));
    check(await page.getByLabel('CSS 缩放').count() === 0, `${label} closed controls unmounted`);
    cases.push({ label, bounds, confirmBounds });
  }
  // A ready scene's feedback updates must not move the header/canvas or reset scroll/focus.
  await page.setViewportSize({ width: 400, height: 954 });
  await page.goto(`${origin}/review-platform/?shell-case=steady`);
  const input = page.frameLocator('iframe').getByRole('textbox', { name: '工作区名称' });
  await input.fill('合成反馈稳定性');
  await page.locator('.rhine-review-tools-trigger[data-phase=ready]').waitFor();
  const geometry = () => page.evaluate(() => ({header: document.querySelector('header').getBoundingClientRect().height, main: document.querySelector('main').scrollTop, top: document.querySelector('iframe').getBoundingClientRect().top}));
  await page.locator('main').evaluate(el => {el.scrollTop = 80;});
  const before = await geometry();
  // The public context.report path is exercised by a real synthetic save.
  await page.frameLocator('iframe').getByRole('button', { name: '保存工作区' }).evaluate(el => el.click());
  await page.frameLocator('iframe').getByText('内存工作区已保存').waitFor();
  const after = await geometry();
  check(JSON.stringify(before) === JSON.stringify(after), 'ready feedback preserves header/canvas geometry and scroll');
  await input.focus(); await page.waitForTimeout(250);
  check(await input.evaluate(el => el === document.activeElement), 'ready does not steal focus');
  return { cases, before, after, failures, browser: await page.evaluate(() => navigator.userAgent) };
}
