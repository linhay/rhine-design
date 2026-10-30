async page => {
  const origin = await page.evaluate(() => location.origin);
  const params = await page.evaluate(() => Object.fromEntries(new URLSearchParams(location.search)));
  const failures = [], errors = [], layouts = [], behavior = [], motion = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const first = () => page.locator('[data-automation-card]').first();
  const second = () => page.locator('[data-automation-card]').nth(1);
  const waitIdle = () => first().filter({has:page.locator('[data-automation-facts]')}).getAttribute('data-pending');
  const stable = () => page.waitForTimeout(200);
  const measure = () => first().evaluate(el => {
    const cut = [];
    for (const node of el.querySelectorAll('[data-automation-facts] .rhine-text, h3, [data-automation-message], .rhine-notice strong')) {
      const range=document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) for (let parent=node; parent; parent=parent.parentElement) {
        const style=getComputedStyle(parent), b=parent.getBoundingClientRect();
        if ((['hidden','clip'].includes(style.overflowX) && (rect.left<b.left-1 || rect.right>b.right+1)) || (['hidden','clip'].includes(style.overflowY) && (rect.top<b.top-1 || rect.bottom>b.bottom+1))) cut.push(node.textContent);
      }
    }
    return { fits:el.scrollWidth<=el.clientWidth+1, pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1, cut };
  });
  const openClose = async label => {
    const help=first().getByRole('button',{name:/接管细则/});
    await help.focus(); await page.keyboard.press('Enter');
    const popup=page.getByRole('dialog',{name:/接管细则/}); await popup.waitFor();
    check(await popup.evaluate(el=>el.closest('.rhine-theme').getAttribute('data-rhine-theme'))===label.split('/')[0],{label,kind:'popover-theme'});
    await page.keyboard.press('Escape'); await stable();
    check(await help.evaluate(el=>el===document.activeElement),{label,kind:'popover-focus-return'});
    const log=first().getByRole('button',{name:'查看日志'});
    await log.focus(); await page.keyboard.press('Enter');
    await page.getByRole('dialog',{name:/执行日志/}).waitFor();
    await page.keyboard.press('Tab');
    check(await page.evaluate(()=>!!document.activeElement.closest('[role=dialog]')),{label,kind:'dialog-focus-contained'});
    await page.keyboard.press('Escape'); await stable();
    check(await log.evaluate(el=>el===document.activeElement),{label,kind:'dialog-focus-return'});
    // Real forward/reverse Tab walks cannot enter the now-closed overlays.
    for(const key of ['Tab','Shift+Tab']) {
      await help.focus();
      for(let i=0;i<8;i++) { await page.keyboard.press(key); check(await page.evaluate(()=>!document.activeElement.closest('[role=dialog],[hidden],[inert]')),{label,kind:'closed-overlay-tab-order',key,i}); }
    }
  };
  try {
    if(params.phase!=='behavior') for(const theme of ['rhine','arknights','neo-brutalism','neutral']) for(const width of [400,520,880]) for(const zoom of [1,2]) {
      const label=`${theme}/${width}/css${zoom*100}`;
      await page.setViewportSize({width,height:1000}); await page.goto(`${origin}/?fixture=automation-settings&theme=${theme}`);
      await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);},zoom);
      await page.getByLabel('自动化长名称').check();
      await page.getByLabel('最近执行结果').selectOption('unknown');
      await stable();
      if(params.automationProbe==='clip') await first().locator('[data-automation-facts]').evaluate(el=>{el.style.height='1px';el.style.overflow='hidden';});
      const bounds=await measure(); check(bounds.fits&&bounds.pageFits&&!bounds.cut.length,{label,kind:'long-critical-content-fit',bounds});
      check((await first().innerText()).includes('待确认（未提供计数）'),{label,kind:'unknown-no-fake-zero'});
      await openClose(label);
      const last=first().getByRole('button',{name:'查看日志'}); await last.scrollIntoViewIfNeeded();
      const reachable=await last.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>=43&&r.top>=0&&r.bottom<=innerHeight+1;});
      check(reachable,{label,kind:'last-action-reachable'});
      layouts.push({label,bounds,reachable});
      if(params.automationProbe) return {pass:!failures.length&&!errors.length,failures,errors,layouts};
    }
    if(params.phase==='layout') return {pass:!failures.length&&!errors.length,failures,errors,layouts};
    await page.setViewportSize({width:880,height:1000}); await page.goto(`${origin}/?fixture=automation-settings`);
    await first().getByRole('switch').focus(); await page.keyboard.press('Space');
    check(!(await first().getByRole('switch').isChecked()),{kind:'write-pending-keeps-confirmed-value'});
    await first().getByText('运行事实：开始中',{exact:true}).waitFor();
    check(await first().getByRole('switch').isChecked(),{kind:'accepted-intent-before-running'});
    await first().getByText('运行事实：运行中',{exact:true}).waitFor();
    await first().getByRole('switch').focus(); await page.keyboard.press('Space');
    await first().getByText('停用意图已保存，仍在收尾',{exact:true}).waitFor();
    check(!(await first().getByRole('switch').isChecked()),{kind:'saved-stop-not-drained'});
    await first().getByText('运行事实：已停止',{exact:true}).waitFor(); behavior.push('start-run-drain-stop');
    for(const scenario of ['lost','unknown']) {
      await page.getByLabel('自动化场景').selectOption(scenario);
      await first().getByRole('switch').click();
      await first().locator('[data-automation-message]').filter({hasText:'正在读取'}).waitFor();
      check(await first().getAttribute('data-write-unknown')==='true',{kind:'write-lost-reads-first',scenario});
      if(scenario==='unknown') {
        await first().getByText('此卡片读取失败',{exact:true}).waitFor();
        check(!(await first().getByRole('switch').isChecked()),{kind:'unknown-keeps-last-confirmed'});
        await first().getByRole('switch').focus(); await page.keyboard.press('Space');
        check(await waitIdle()==='idle',{kind:'unknown-does-not-rewrite'});
        await second().getByRole('switch').click();
        await first().getByRole('button',{name:'读取状态'}).click();
      }
      // Wait on this card; the independent second card may confirm earlier.
      await first().getByText('已确认意图：启用',{exact:true}).waitFor();
      const recovered=await first().evaluate(el=>({unknown:el.getAttribute('data-write-unknown'),checked:el.querySelector('[role=switch]').getAttribute('aria-checked')}));
      check(recovered.unknown==='false'&&recovered.checked==='true',{kind:'read-recovers-confirmed-intent',scenario,recovered});
      if(scenario==='unknown') {
        await second().getByText('已确认意图：启用',{exact:true}).waitFor();
        check(await second().getByRole('switch').isChecked(),{kind:'second-card-writes-independently'});
      }
      behavior.push(scenario);
    }
    await page.getByLabel('自动化场景').selectOption('read-error');
    await first().getByRole('button',{name:'读取状态'}).click();
    await first().getByText('此卡片读取失败',{exact:true}).waitFor();
    await second().getByRole('switch').click();
    await second().getByText('运行事实：开始中',{exact:true}).waitFor();
    check(await first().getByText('此卡片读取失败',{exact:true}).isVisible(),{kind:'local-error-persists'});
    await page.getByLabel('自动化场景').selectOption('normal');
    for(const label of ['首卡只读','首卡管理员']) {
      await page.getByLabel(label).click(); await first().getByRole('switch').focus(); await page.keyboard.press('Space');
      check(!(await first().getByRole('switch').isChecked()),{kind:'permission-blocks-write',label});
      check(await second().getByRole('switch').getAttribute('aria-readonly')!=='true',{kind:'permission-local-scope',label});
      await page.getByLabel(label).click();
    }
    await page.getByLabel('自动化场景').selectOption('unavailable');
    await first().getByRole('switch').click(); check(!(await first().getByRole('switch').isChecked()),{kind:'unavailable-blocks-write'});
    for(const value of ['updated','unchanged','skipped','failed','unknown']) {
      await page.getByLabel('最近执行结果').selectOption(value); await first().getByRole('button',{name:'读取状态'}).click();
      await page.waitForTimeout(750);
      const text=await first().innerText();
      check(text.includes({updated:'更新 3 项',unchanged:'未变化',skipped:'跳过（无适用对象）',failed:'失败（未完成）',unknown:'待确认（未提供计数）'}[value]),{kind:'outcome-preserved-after-read',value});
    }
    await page.getByLabel('自动化场景').selectOption('normal');
    await first().getByRole('switch').click(); await first().getByRole('button',{name:'取消等待'}).click();
    await page.waitForTimeout(800);
    check(await first().getAttribute('data-write-unknown')==='true'&&!(await first().getByRole('switch').isChecked()),{kind:'cancel-write-no-late-accept'});
    await first().getByRole('button',{name:'读取状态'}).click(); await first().getByText('运行事实：开始中',{exact:true}).waitFor();
    await page.getByRole('button',{name:'卸载卡片'}).click(); await page.waitForTimeout(2100);
    check(await page.locator('[data-automation-card]').count()===0,{kind:'unmounted-no-late-content'});
    await page.getByRole('button',{name:'重新挂载卡片'}).click(); check(!(await first().getByRole('switch').isChecked()),{kind:'remount-independent-synthetic-session'});
    for(const mode of ['normal','system','manual']) {
      await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
      await page.goto(`${origin}/?fixture=automation-settings&motion=${mode}`);
      // Start frame sampling before the delayed save. Role waits may outlast a 120ms transition.
      await page.evaluate(()=>{
        window.__automationMotion={samples:[],done:false}; const started=performance.now();
        const frame=()=>{const el=document.querySelector('[data-automation-card] .rhine-switch__track > span'),style=getComputedStyle(el);window.__automationMotion.samples.push({transition:style.transitionDuration,offset:style.insetInlineStart});if(performance.now()-started<1100)requestAnimationFrame(frame);else window.__automationMotion.done=true;};requestAnimationFrame(frame);
      });
      const toggle=first().getByRole('switch'); await toggle.focus(); await page.keyboard.press('Space');
      await first().getByText('运行事实：开始中',{exact:true}).waitFor();
      await page.waitForFunction(()=>window.__automationMotion.done);
      const sample=await page.evaluate(()=>window.__automationMotion.samples);
      check(mode==='normal' ? sample.some(s=>parseFloat(s.offset)>0&&parseFloat(s.offset)<14) : sample.every(s=>s.transition.split(',').every(value=>parseFloat(value)===0)),{kind:'reduced-motion-switch',mode,sample});
      await first().getByText('运行事实：运行中',{exact:true}).waitFor();
      check(await toggle.evaluate(el=>el===document.activeElement),{kind:'motion-keeps-focus-and-completes',mode}); motion.push({mode,sample});
    }
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(`${origin}/?theme=neutral#automation-settings`);
    check(await page.getByRole('main').getAttribute('aria-label')==='周期自动化设置'&&await page.locator('[data-automation-card]').count()===2,{kind:'real-shell-entry'});
    await openClose('neutral/shell/css100');
    await first().getByRole('switch').focus(); await page.keyboard.press('Space');
    await first().getByText('运行事实：运行中',{exact:true}).waitFor();
    check(await first().getByRole('switch').isChecked(),{kind:'real-shell-live-interaction'});
  } catch(error) { errors.push(String(error)); }
  return {pass:!failures.length&&!errors.length,failures,errors,layouts,behavior,motion,browser:await page.evaluate(()=>navigator.userAgent),data:'synthetic',zoom:'CSS zoom; native browser zoom not covered'};
}
