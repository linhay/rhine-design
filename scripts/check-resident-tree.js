// Run against built gallery or a fresh installed fixed-candidate consumer.
async page => {
  const base = page.url().split('?')[0].split('#')[0], probe = page.url().match(/[?&]probe=([^&#]+)/)?.[1];
  const rows = [], failures = [], errors = [];
  page.setDefaultTimeout(4000); page.on('pageerror', error => errors.push(String(error)));
  const check = (condition, message) => { if (!condition) throw Error(message); };
  const run = async (context, action) => { try { rows.push({ ...context, status: 'PASS', evidence: await action() }); } catch (error) { failures.push({ ...context, error: String(error) }); } };
  const open = async (theme='rhine', width=880, zoom=1, motion='normal') => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: motion === 'system' ? 'reduce' : 'no-preference' });
    await page.goto(`${base}?fixture=resident-tree&theme=${theme}&zoom=${zoom}&motion=${motion === 'manual' ? 'reduced' : 'system'}`);
    await page.getByRole('tree').waitFor(); await page.evaluate(() => document.fonts.ready);
  };
  const item = id => page.locator(`[data-node-id="${id}"]`);
  const button = name => page.getByRole('button', { name, exact: true });
  const selected = async id => check(await item(id).getAttribute('aria-selected') === 'true', `selection missing ${id}`);
  const focusIs = locator => locator.evaluate(element => element === document.activeElement);
  const visibleRow = async id => item(id).locator(':scope > .rhine-browse-row').evaluate(el => {
    const row = el.getBoundingClientRect(), tree = el.closest('[role=tree]').getBoundingClientRect();
    return row.top >= tree.top - 1 && row.bottom <= tree.bottom + 1;
  });
  const geometry = async () => page.evaluate(() => {
    const tree = document.querySelector('[role=tree]');
    const last = tree.querySelector('[data-node-id="alpha-item-13"]'); last.scrollIntoView({ block: 'nearest' });
    const tr = tree.getBoundingClientRect(), lr = last.querySelector('.rhine-browse-row').getBoundingClientRect();
    const textRects = [];
    for (const label of tree.querySelectorAll('.rhine-browse-label')) {
      const range = document.createRange(); range.selectNodeContents(label);
      for (const rect of range.getClientRects()) if (rect.width && rect.height) textRects.push({ left: rect.left, right: rect.right, width: rect.width });
    }
    return { client: tree.clientWidth, scroll: tree.scrollWidth, inner: { left: tr.left + tree.clientLeft * (tr.width / tree.offsetWidth), right: tr.right - tree.clientLeft * (tr.width / tree.offsetWidth) }, textRects, lastVisible: lr.top >= tr.top && lr.bottom <= tr.bottom, document: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, levels: [...tree.querySelectorAll('[role=treeitem]')].map(el => ({ level: el.getAttribute('aria-level'), expanded: el.getAttribute('aria-expanded'), children: !!el.querySelector(':scope > [role=group]') })) };
  });
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of [1,2]) await run({ kind: 'long-layout', theme, width, zoom }, async () => {
    await open(theme,width,zoom);
    if (probe === 'clip') await page.addStyleTag({ content: '.rhine-browse-label {white-space:nowrap!important;overflow:hidden!important;}' });
    const result = await geometry();
    check(result.document && result.scroll <= result.client + 1, 'document/tree overflow');
    check(result.textRects.every(rect => rect.left >= result.inner.left - 1 && rect.right <= result.inner.right + 1), 'necessary identity clipped inside tree');
    check(result.lastVisible, 'last tree row is not scroll reachable');
    check(result.levels.some(node => node.level === '8') && result.levels.every(node => node.expanded === null || node.children), 'hierarchy/group metadata');
    check(await page.locator('[role=treeitem][tabindex="0"]').count() === 1, 'not one tree stop');
    await item('alpha-root').focus(); await page.keyboard.press('End'); check(await visibleRow('alpha-item-13'),'End focused row is outside actual tree viewport');
    await page.keyboard.press('Home'); check(await visibleRow('alpha-root'),'Home focused row is outside actual tree viewport');
    const separator = page.getByRole('separator');
    if (await separator.count()) { await separator.focus(); await separator.press('ArrowRight'); check(await separator.getAttribute('aria-valuenow') === '50', 'keyboard separator'); }
    // Walk actual Tab order: narrow hidden separator must not receive focus.
    await item('alpha-root').focus(); await page.keyboard.press('Tab');
    check((await page.evaluate(() => document.activeElement?.getAttribute('role') === 'separator')) === (width / zoom - 24 >= 600), 'hidden separator in actual Tab order');
    return { ...result, textRects: result.textRects.length };
  });
  if (probe === 'clip' || probe === 'focus') return { pass: !failures.length && !errors.length, rows, failures, errors };
  await run({ kind: 'keyboard-selection-focus' }, async () => {
    await open(); await item('alpha-root').focus();
    await page.keyboard.press('ArrowRight'); check(await focusIs(item('alpha-depth-0')), 'right did not go to first child'); await selected('alpha-root');
    await page.keyboard.press('ArrowLeft'); check(await item('alpha-depth-0').getAttribute('aria-expanded') === 'false', 'left did not collapse');
    check(await item('alpha-depth-1').count() === 0, 'collapsed descendant remains');
    await page.keyboard.press('ArrowLeft'); check(await focusIs(item('alpha-root')), 'left parent focus');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    check(await focusIs(item('alpha-depth-1')), 'expand then first child');
    await page.keyboard.press('End'); check(await focusIs(item('alpha-item-13')), 'End'); await selected('alpha-root');
    await page.keyboard.press('Space'); await selected('alpha-item-13');
    await page.keyboard.press('Home'); await selected('alpha-item-13');
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); check(await focusIs(item('alpha-item-13')), 'reentry did not focus selection'); check(await visibleRow('alpha-item-13'),'selected reentry row outside tree viewport');
    await page.keyboard.press('ArrowUp'); check(await focusIs(item('alpha-item-12')), 'up');
    await page.keyboard.press('Enter'); await selected('alpha-item-12');
    return { arrows: true, independentSelection: true, reentrySelected: true };
  });
  await run({ kind: 'refresh-delete-target-focus-ownership' }, async () => {
    await open(); await item('alpha-depth-6').focus();
    // External data mutation through the real host action without moving focus.
    await item('alpha-depth-6').press('Enter');
    await button('移除选中子树').evaluate(element => element.click());
    check(await focusIs(item('alpha-depth-5')), 'deleted focus not restored to surviving parent'); check(await visibleRow('alpha-depth-5'),'recovered parent row outside tree viewport');
    const stable = await item('alpha-depth-5').elementHandle();
    await button('刷新快照').evaluate(element => element.click()); await page.waitForTimeout(550);
    check(await item('alpha-depth-5').evaluate((el, prior) => el === prior, stable), 'refresh remounted node');
    check(await focusIs(item('alpha-depth-5')), 'refresh lost tree focus');
    await item('alpha-depth-5').evaluate(element => element.blur());
    await button('移除选中子树').evaluate(element => element.click());
    check(!await item('alpha-depth-4').evaluate(element => element.contains(document.activeElement)), 'explicit blur reacquired focus');
    await item('alpha-depth-4').focus(); await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await button('空快照').evaluate(element => element.click());
    check(!await focusIs(page.getByRole('tree')), 'window blur reacquired tree');
    await button('恢复合成快照').click(); await item('alpha-depth-6').focus();
    await page.locator('h2').dispatchEvent('pointerdown');
    await button('空快照').evaluate(element => element.click()); check(!await focusIs(page.getByRole('tree')), 'external pointer reacquired tree');
    await button('刷新失败示例').click(); await button('刷新快照').click();
    check((await page.getByLabel('快照状态').textContent()).includes('首次读取中'), 'no-snapshot loading not distinct'); await page.waitForTimeout(550);
    check((await page.getByLabel('快照状态').textContent()).includes('读取失败，暂无快照'), 'no-snapshot failure misreported');
    await button('刷新失败示例').click(); await button('刷新快照').click(); await page.waitForTimeout(550);
    check(await item('alpha-root').count() === 1, 'refresh did not restore empty snapshot');
    await button('刷新失败示例').click(); await button('刷新快照').click(); await page.waitForTimeout(550);
    check((await page.getByLabel('快照状态').textContent()).includes('刷新失败，保留旧快照'), 'failure lost old snapshot');
    await button('刷新失败示例').click(); await button('固定当前目标').click(); await page.getByLabel('画布目标').selectOption('beta');
    check(await item('alpha-root').count() === 1, 'canvas changed fixed target');
    check(await page.getByText('树保持固定目标；恢复跟随后再联动。').isVisible(), 'target divergence not stated');
    await button('刷新快照').evaluate(element => element.click()); await button('恢复跟随').evaluate(element => element.click());
    await page.waitForTimeout(650); check(await item('beta-root').count() === 1, 'follow target missing'); check(!(await item('beta-root').textContent()).includes('快照'), 'stale request changed new target');
    await button('卸载工作台').click(); check(await page.getByRole('tree').count() === 0, 'unmounted tree remains');
    return { deletionParent: true, stableNode: true, blurReleased: true, pointerReleased: true, noSnapshotStates: true, failedSnapshotRetained: true, fixedFollow: true, staleTargetCancelled: true };
  });
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const motion of ['normal','system','manual']) await run({ kind: 'update-animation-cleanup', theme, motion }, async () => {
    await open(theme,520,2,motion); await button('刷新快照').click();
    await page.locator('[data-updated]').waitFor();
    const marker = page.locator('[data-updated] > .rhine-browse-row');
    const sample = () => marker.evaluate(el => ({ name: getComputedStyle(el).animationName, time: el.getAnimations()[0]?.currentTime ?? null, text: el.textContent }));
    const first = await sample(); await page.waitForTimeout(150); const next = await sample();
    if (motion === 'normal') check(first.name !== 'none' && next.time > first.time, 'real update animation did not advance');
    else check(first.name === 'none' && first.time === null, 'reduced update still animates');
    check(first.text.includes('已更新'), 'update lacks text'); await page.locator('[data-updated]').waitFor({ state: 'detached' });
    return { first, next, cleanedAfterOneSecond: true };
  });
  for (const theme of ['rhine','arknights','neo-brutalism']) await run({ kind: 'canvas-portal-tabs-continuity', theme }, async () => {
    await open(theme,880,2); const canvas = page.getByRole('button', { name: /^合成几何画布/ }); await canvas.scrollIntoViewIfNeeded();
    const rect = await canvas.boundingBox();
    // DTO point (27,126) uniquely hits item-8 regardless of CSS zoom.
    await page.mouse.move(rect.x + rect.width * 27 / 320, rect.y + rect.height * 126 / 240);
    check(await item('alpha-item-8').getAttribute('data-hovered') !== null, 'canvas hover identity');
    await page.mouse.click(rect.x + rect.width * 27 / 320, rect.y + rect.height * 126 / 240); await selected('alpha-item-8');
    await item('alpha-depth-6').locator(':scope > .rhine-browse-row').hover(); check(await page.locator('[data-canvas-id="alpha-depth-6"]').getAttribute('data-hovered') !== null, 'tree hover identity');
    await item('alpha-depth-6').press('Enter'); await selected('alpha-depth-6');
    const trigger = button('查看节点详情'); await trigger.click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
    check(await dialog.evaluate(el => el.closest('.rhine-theme')?.getAttribute('data-rhine-theme')) === theme, 'Portal theme scope');
    await page.getByRole('tab', { name: '草稿', exact: true }).click(); await button('复制失败示例').click(); await button('复制合成草稿').click();
    await page.getByRole('alert').filter({hasText:'复制失败，请重试'}).waitFor();
    const treeNode = await item('alpha-depth-6').elementHandle(), dialogNode = await dialog.elementHandle();
    await page.setViewportSize({width:400,height:900});
    const nextTheme = theme === 'rhine' ? 'arknights' : 'rhine';
    await page.getByLabel('配方主题', { exact:true }).selectOption(nextTheme);
    check(await dialog.evaluate(el => el.closest('.rhine-theme')?.getAttribute('data-rhine-theme')) === nextTheme,'controlled Provider did not update Portal');
    check(await dialog.evaluate((el,prior) => el === prior,dialogNode) && await item('alpha-depth-6').evaluate((el,prior)=>el===prior,treeNode), 'resize/theme remounted tree or detail');
    check(await page.getByRole('tab', { name: '草稿', exact:true }).getAttribute('aria-selected') === 'true', 'detail tab lost');
    await page.getByRole('tab', { name:'身份',exact:true }).click();
    if(probe === 'inactive') await page.locator('[role=tabpanel][hidden]').evaluate(el => { el.hidden=false; el.style.cssText='position:absolute;opacity:0;pointer-events:none'; });
    const traversed=[];
    for(let i=0;i<9;i++){await page.keyboard.press('Tab');traversed.push(await page.evaluate(()=>document.activeElement?.textContent));}
    check(!traversed.some(value=>value?.includes('复制合成草稿')||value==='复制失败示例'),'inactive detail content enters actual Tab order');
    await page.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'}); await page.waitForTimeout(100); check(await focusIs(trigger), 'Escape trigger focus');
    return { zoomMapping:true, sharedHover:true, scopedPortal:true, asyncCopyFailure:true, preservedInstances:true, hiddenTabsExcluded:true, escapeFocus:true };
  });
  await run({kind:'split-pointer-deltas'},async()=>{
    await open(); const separator=page.getByRole('separator'); const r=await separator.boundingBox(), split=await page.locator('.rhine-browse-split').boundingBox();
    await page.mouse.move(r.x+r.width/2,r.y+10);await page.mouse.down();await page.mouse.move(r.x+r.width/2+20,r.y+10);await page.mouse.move(r.x+r.width/2+40,r.y+10);await page.mouse.up();
    const ratio=Number(await separator.getAttribute('aria-valuenow'));check(Math.abs(ratio-(48+40/split.width*100))<=1,'cumulative splitter delta reapplied');
    return {ratio,expected:48+40/split.width*100};
  });
  await run({kind:'native-timer-unmount-and-rapid-update'},async()=>{
    await page.addInitScript(()=>{
      const nativeSet=window.setTimeout.bind(window), nativeClear=window.clearTimeout.bind(window), records=[];
      window.__browseTimers=records;
      window.setTimeout=(callback,delay,...args)=>{const record={delay,active:true,fired:false,cancelled:false,id:0};const id=nativeSet(()=>{record.active=false;record.fired=true;if(typeof callback==='function')callback(...args);},delay);record.id=id;if(delay===500||delay===1000)records.push(record);return id;};
      window.clearTimeout=id=>{const record=records.find(entry=>entry.id===id);if(record){record.active=false;record.cancelled=true;}nativeClear(id);};
    });
    await open(); await button('刷新快照').click();await page.locator('[data-updated]').waitFor();
    const first=await page.locator('[data-updated] > .rhine-browse-row').evaluate(el=>getComputedStyle(el).animationName);
    await button('刷新快照').evaluate(el=>el.click());
    await page.locator('[data-update-cycle="0"]').waitFor();
    const second=await page.locator('[data-updated] > .rhine-browse-row').evaluate(el=>getComputedStyle(el).animationName);
    check(first!==second && second==='rhine-browse-update-even','rapid update did not restart animation');
    await button('卸载工作台').click();
    check(await page.evaluate(()=>window.__browseTimers.filter(record=>record.active).length)===0,'highlight timer retained on unmount');
    await button('挂载工作台').click();await button('刷新快照').click();await button('卸载工作台').click();
    await page.waitForTimeout(1100);
    const records=await page.evaluate(()=>window.__browseTimers);
    check(records.some(record=>record.delay===1000&&record.cancelled)&&records.some(record=>record.delay===500&&record.cancelled),'missing native cancellation evidence');
    check(records.every(record=>!record.active)&&records.filter(record=>record.cancelled).every(record=>!record.fired),'cancelled callback fired after unmount');
    return{first,second,records};
  });
  return { pass: !failures.length && !errors.length, rows, failures, errors, userAgent: await page.evaluate(()=>navigator.userAgent), boundary: 'Synthetic browser production build; CSS zoom; no native zoom/screen-reader/device/backend claim.' };
}
