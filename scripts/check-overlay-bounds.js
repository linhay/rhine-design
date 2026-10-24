// Run with playwright-cli run-code --filename scripts/check-overlay-bounds.js against port 18480.
async page => {
  const errors = [], failures = [], cases = [];
  let tooltipCases = 0;
  page.on('pageerror', error => errors.push(String(error)));
  const bounds = async locator => locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  const contained = rect => rect.x >= -1 && rect.y >= -1 && rect.right <= rect.viewportWidth + 1 && rect.bottom <= rect.viewportHeight + 1 && rect.width > 0 && rect.height > 0;
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) for (const scope of ['document', 'theme', 'content']) for (const [edge, side] of [['top-left', 'left'], ['top-right', 'top'], ['bottom-left', 'bottom'], ['bottom-right', 'right']]) {
    const spec = { theme, width, zoom, scope, edge, side };
    await page.setViewportSize({ width, height: 758 });
    await page.goto(`http://127.0.0.1:18480/?${new URLSearchParams({ fixture: 'overlay-bounds', theme, zoom: String(zoom), scope, edge, side })}`);
    const trigger = page.getByRole('button', { name: '账号与日期', exact: true });
    await trigger.click();
    const popup = page.getByRole('dialog', { name: '工作区与日期详情' });
    await popup.waitFor();
    const popupRect = await bounds(popup);
    const draft = popup.getByRole('textbox', { name: '草稿名称' });
    await draft.fill('保留中的草稿');
    const draftRect = await bounds(draft);
    const apply = popup.getByRole('button', { name: '应用日期', exact: true });
    await apply.scrollIntoViewIfNeeded();
    const applyRect = await bounds(apply);
    await apply.click();
    const applied = await page.getByRole('status').innerText();
    const close = popup.getByRole('button', { name: '关闭详情', exact: true });
    await close.scrollIntoViewIfNeeded();
    const closeRect = await bounds(close);
    await close.click();
    await page.waitForFunction(() => document.activeElement?.textContent === '账号与日期');
    const focusReturned = await trigger.evaluate(element => element === document.activeElement);
    const menuTrigger = page.getByRole('button', { name: '对象操作', exact: true });
    await menuTrigger.click();
    const menu = page.getByRole('menu', { name: '对象操作' });
    await menu.waitFor();
    const menuRect = await bounds(menu);
    await menu.press('End');
    const last = menu.getByRole('menuitem', { name: '最后一项操作' });
    await last.scrollIntoViewIfNeeded();
    const lastRect = await bounds(last);
    await last.click();
    const selected = await page.getByRole('status').innerText();
    const pass = [popupRect, draftRect, applyRect, closeRect, menuRect, lastRect].every(contained) && applied === '已应用' && selected === '最后一项操作' && focusReturned;
    cases.push({ ...spec, pass });
    if (!pass) failures.push({ ...spec, popupRect, draftRect, applyRect, closeRect, menuRect, lastRect, focusReturned, applied, selected });
  }
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of [1,2]) for (const scope of ['document','theme','content']) {
    await page.setViewportSize({width,height:758});
    await page.goto(`http://127.0.0.1:18480/?fixture=overlay-bounds&theme=${theme}&zoom=${zoom}&scope=${scope}&edge=bottom-right&side=right`);
    await page.getByRole('button',{name:'辅助说明',exact:true}).focus();
    const tooltip=page.getByRole('tooltip'); await tooltip.waitFor();
    const tooltipRect=await bounds(tooltip);
    if(!contained(tooltipRect)) failures.push({kind:'tooltip',theme,width,zoom,scope,tooltipRect});
    tooltipCases++;
    await page.keyboard.press('Escape');
    await tooltip.waitFor({state:'detached'});
  }
  // Re-scaling an already open portal must preserve the input node and value.
  await page.goto('http://127.0.0.1:18480/?fixture=overlay-bounds&theme=neo-brutalism&zoom=1');
  await page.setViewportSize({ width: 400, height: 758 });
  await page.getByRole('button', { name: '账号与日期', exact: true }).click();
  const draft = page.getByRole('textbox', { name: '草稿名称' });
  await draft.fill('动态缩放保留');
  const input = await draft.elementHandle();
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await page.waitForTimeout(150);
  const stable = await input.evaluate(element => element.isConnected && element.value === '动态缩放保留');
  const dynamicBounds = await bounds(page.getByRole('dialog', { name: '工作区与日期详情' }));
  await page.keyboard.press('Escape');
  const escaped = await page.getByRole('dialog').count() === 0;
  return { pass: failures.length === 0 && errors.length === 0 && stable && contained(dynamicBounds) && escaped, cases: cases.length, tooltipCases, failures, errors, dynamic: { stable, bounds: dynamicBounds, escaped } };
}
