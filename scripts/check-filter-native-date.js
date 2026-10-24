async page => {
  await page.goto(`http://127.0.0.1:18484/?fixture=list-filters&theme=neo-brutalism&proof=${Date.now()}#list-filter-bar`);
  const checks = [];
  const check = (name, pass, evidence = {}) => checks.push({ name, pass: Boolean(pass), ...evidence });
  await page.getByRole('group', { name: '录制会话筛选', exact: true }).getByRole('button', { name: /^更多筛选/ }).click();
  const dialog = page.getByRole('dialog', { name: '录制会话筛选', exact: true });
  const start = dialog.getByLabel('开始日期', { exact: true });
  const end = dialog.getByLabel('结束日期', { exact: true });
  const inspect = () => start.evaluate(element => ({ value: element.value, badInput: element.validity.badInput, invalid: element.getAttribute('aria-invalid') }));
  await start.fill('2026-10-20'); await end.fill('2026-10-24');
  await start.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Backspace');
  await page.waitForTimeout(100);
  let value = await inspect();
  check('Deleting a native date segment keeps accepted range and reports invalid', value.badInput && value.invalid === 'true' && (await page.locator('#list-filter-bar .rhine-list-filter-bar__active').first().innerText()).includes('2026-10-20 — 2026-10-24'), value);
  await page.keyboard.type('2026'); await page.waitForTimeout(100); value = await inspect();
  check('Typing the complete year repairs native draft', value.value === '2026-10-20' && !value.badInput && value.invalid !== 'true', value);
  await dialog.getByRole('button', { name: '清空日期', exact: true }).click();
  await start.evaluate(element => { window.nativeDateEvents = []; for (const name of ['input', 'change', 'keyup', 'blur']) element.addEventListener(name, event => window.nativeDateEvents.push({ event: event.type, key: event.key, value: element.value, badInput: element.validity.badInput })); });
  await start.focus(); await page.keyboard.type('2'); await page.waitForTimeout(100); value = await inspect();
  check('Empty date native fragment is invalid even when no input/change fires', value.badInput && value.invalid === 'true' && await dialog.getByRole('button', { name: '清空日期', exact: true }).isEnabled(), { ...value, events: await page.evaluate(() => window.nativeDateEvents) });
  if (await dialog.getByRole('button', { name: '清空日期', exact: true }).isEnabled()) {
    await dialog.getByRole('button', { name: '清空日期', exact: true }).click(); await page.waitForTimeout(100); value = await inspect();
    check('Clear removes an empty native fragment and validation error', value.value === '' && !value.badInput && value.invalid !== 'true', value);
  }
  await dialog.getByRole('button', { name: '今天', exact: true }).click();
  await start.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Backspace');
  await dialog.getByRole('button', { name: '今天', exact: true }).click(); await page.waitForTimeout(100); value = await inspect();
  check('Applying the same preset clears a rejected native draft', value.value === '2026-10-24' && !value.badInput && value.invalid !== 'true', value);
  return { complete: checks.every(item => item.pass), checks, scope: 'Real native date segmentation in isolated Chromium; keyboard presses use page.keyboard so locator focus does not reset year digit buffering.' };
}
