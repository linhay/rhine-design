// Production gallery / installed-package gallery. Playwright CLI run-code --filename.
async page => {
  const origin = await page.evaluate(() => location.origin), failures = [], cases = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const check = (ok, kind, detail) => { if (!ok) failures.push({ kind, detail }); };
  const measure = () => page.locator('.rhine-toast').evaluate(root => {
    const visible = el => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0 || r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1) return false;
      for (let a = el; a; a = a.parentElement) {
        const s = getComputedStyle(a), b = a.getBoundingClientRect();
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
        if (/(hidden|clip|auto|scroll)/.test(s.overflowY) && (r.top < b.top - 1 || r.bottom > b.bottom + 1)) return false;
        if (/(hidden|clip|auto|scroll)/.test(s.overflowX) && (r.left < b.left - 1 || r.right > b.right + 1)) return false;
      }
      return true;
    };
    const nodes = [...root.querySelectorAll('strong,p,button')];
    return { fits: nodes.every(visible), button: root.querySelector('button').getBoundingClientRect().toJSON(), text: root.textContent, animation: getComputedStyle(root).animationDuration };
  });
  for (const theme of ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    const label = `${theme}/${width}/css${zoom}`;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/?fixture=toast-events&theme=${theme}`);
    await page.evaluate(zoom => document.documentElement.style.zoom = String(zoom), zoom);
    await page.getByLabel('长通知内容').check(); await page.getByRole('button', { name: '显示错误通知', exact: true }).click();
    await page.waitForTimeout(220); const result = await measure(); check(result.fits, 'long-content', { label, result });
    const close = page.getByRole('button', { name: '关闭通知' });
    await close.focus(); await page.keyboard.press('Space'); check(await close.count() === 0, 'keyboard-close', label);
    await page.getByRole('button', { name: '显示警告通知', exact: true }).click(); await page.waitForTimeout(220);
    check((await measure()).fits, 'warning', label);
    if (width === 400 && zoom === 2) await page.screenshot({ path: `output/playwright/toast-${theme}.png` });
    cases.push({ label, result });
  }
  // The same geometry assertion must reject a deliberately clipped text ancestor.
  await page.locator('.rhine-toast > div').evaluate(el => { el.style.height = '1px'; el.style.overflow = 'hidden'; });
  const negative = await measure(); check(!negative.fits, 'negative-did-not-detect-clipping', negative);
  for (const motion of ['normal', 'system', 'manual']) {
    await page.emulateMedia({ reducedMotion: motion === 'system' ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width: 880, height: 700 });
    await page.goto(`${origin}/?fixture=toast-events&motion=${motion}`);
    await page.getByRole('button', { name: '显示成功通知', exact: true }).click();
    const close = page.getByRole('button', { name: '关闭通知' }); await close.focus();
    const handle = await close.elementHandle();
    await page.getByRole('button', { name: '1.5 秒后再次成功', exact: true }).evaluate(el => el.click());
    check(await page.getByRole('button', { name: '1.5 秒后再次成功', exact: true }).isDisabled(), 'delayed-disabled', motion);
    await page.waitForTimeout(1700);
    check(await handle.evaluate(el => el.isConnected && el === document.activeElement), 'focused-node-survives-new-event', motion);
    check((await measure()).fits, 'painted-after-event', motion);
    const animation = await page.locator('.rhine-toast').evaluate(el => getComputedStyle(el).animationDuration);
    check(motion === 'normal' ? parseFloat(animation) > 0 : parseFloat(animation) <= 0.001, 'motion-style', { motion, animation });
    await page.keyboard.press('Space'); check(await close.count() === 0, 'motion-close', motion);
    await page.getByRole('button', { name: '1.5 秒后再次成功', exact: true }).click();
    await page.getByRole('button', { name: '退出通知示例', exact: true }).click(); await page.waitForTimeout(1700);
    check(await close.count() === 0, 'exit-cancels-delayed-event', motion);
    cases.push({ motion, animation });
  }
  check(errors.length === 0, 'pageerrors', errors);
  return { pass: failures.length === 0, cases, negative, failures, errors, scope: 'CSS zoom; browser keyboard; reduced-motion emulation/manual. No speech claim.' };
}
