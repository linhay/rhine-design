// Browser real timers; synthetic clicks deliberately avoid moving pointer/focus into Toast.
async page => {
  const origin = await page.evaluate(() => location.origin), failures = [], samples = [];
  const check = (ok, kind, detail) => { if (!ok) failures.push({kind, detail}); };
  await page.goto(`${origin}/?fixture=toast-events`); await page.mouse.move(0, 0);
  const show = () => page.getByRole('button', {name:'显示成功通知',exact:true}).evaluate(el => el.click());
  const state = async label => { const value = await page.evaluate(() => ({time:performance.now(), open:!!document.querySelector('.rhine-toast'), hidden:document.hidden, focus:document.activeElement?.getAttribute('aria-label')})); samples.push({label,...value}); return value; };
  await show(); const first = await state('first'); await page.waitForTimeout(4700); await show(); const second = await state('second-near-expiry');
  await page.waitForTimeout(500); check((await state('old-expiry')).open, 'old-timer-closed-new-event');
  await page.waitForTimeout(3400); check((await state('new-3900')).open, 'new-lifetime-short');
  await page.getByRole('button', {name:'普通重渲染',exact:true}).evaluate(el => el.click());
  await page.waitForTimeout(1300); check(!(await state('new-expired-after-rerender')).open, 'rerender-extended');
  await show(); await page.waitForTimeout(1000);
  // Focus with the browser's keyboard entry, then a new delayed event while focused.
  await page.getByRole('button', {name:'1.5 秒后再次成功',exact:true}).click();
  await page.getByRole('button', {name:'普通重渲染',exact:true}).focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  check(await page.getByRole('button',{name:'关闭通知'}).evaluate(el => el === document.activeElement), 'tab-to-close');
  await page.waitForTimeout(5400); check((await state('focused-new-past-old-expiry')).open, 'focus-not-paused');
  await page.keyboard.press('Shift+Tab'); await page.mouse.move(0,0); await page.waitForTimeout(4200);
  check((await state('resumed-new-4200')).open, 'paused-new-not-full'); await page.waitForTimeout(1000);
  check(!(await state('resumed-new-expired')).open, 'resume-not-expiring');
  // Background visibility: real browser tab visibility, not document.hidden mocking.
  await show(); await page.waitForTimeout(1000); const other = await page.context().newPage(); await other.goto('about:blank'); await other.bringToFront();
  const hidden = await state('background');
  if (!hidden.hidden) {
    await page.bringToFront(); await other.close();
    return { pass: failures.length === 0, failures, samples, interval: second.time-first.time, visibility: 'SKIPPED: browser automation did not background document; visibilitychange timer logic is covered by unit tests; no native background claim', scope: 'Browser real timers, DOM click and real Tab; no speech claim.' };
  }
  await page.waitForTimeout(5200); await page.bringToFront(); await other.close();
  check((await state('visibility-resumed')).open, 'hidden-not-paused'); await page.waitForTimeout(3200);
  check((await state('visibility-remaining')).open, 'hidden-lost-remaining'); await page.waitForTimeout(1100);
  check(!(await state('visibility-expired')).open, 'hidden-not-expiring');
  return {pass:failures.length===0, failures, samples, interval:second.time-first.time, scope:'Browser timers, DOM click and real Tab; repeated screen-reader output is outside this feature.'};
}
