async page => {
  const origin = await page.evaluate(() => location.origin);
  const params = await page.evaluate(() => Object.fromEntries(new URLSearchParams(location.search)));
  const failures = [], errors = [], layouts = [], behavior = [], motion = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const card = () => page.locator('[data-lifecycle-card]');
  const summary = () => card().locator('[data-lifecycle-summary]');
  // Keep a stable node locator: busyLabel changes the accessible name during a read.
  const read = () => card().getByRole('button').first();
  const settled = () => page.waitForFunction(() => document.querySelector('[data-lifecycle-card]')?.getAttribute('data-pending') === 'false');
  const timers = () => page.evaluate(() => ({...window.__lifecycleTimers, pending:window.__lifecycleTimers.pending.length}));
  const result = () => ({pass:!failures.length&&!errors.length,failures,errors,layouts,behavior,motion,data:'synthetic',zoom:'CSS zoom; native browser zoom not covered'});
  // Observe the fixture's real 650ms transport without replacing time or invoking its callbacks.
  await page.addInitScript(() => {
    if (window.__lifecycleTimers) return;
    const set = window.setTimeout, clear = window.clearTimeout, interval = window.setInterval;
    const state = window.__lifecycleTimers = {scheduled:0,fired:0,cancelled:0,intervals:0,pending:[]};
    window.setTimeout = function(handler, delay, ...args) {
      if (Number(delay) !== 650 || typeof handler !== 'function') return set(handler, delay, ...args);
      state.scheduled++;
      const id = set(() => {state.pending=state.pending.filter(value=>value!==id);state.fired++;handler(...args);}, delay);
      state.pending.push(id); return id;
    };
    window.clearTimeout = id => {if(state.pending.includes(id)){state.cancelled++;state.pending=state.pending.filter(value=>value!==id);}return clear(id);};
    window.setInterval = (...args) => {state.intervals++;return interval(...args);};
  });
  const measure = () => card().evaluate(el => {
    const cut = [];
    for (const node of el.querySelectorAll('.rhine-text, .rhine-badge, .rhine-notice strong, .rhine-notice__body')) {
      const range=document.createRange();range.selectNodeContents(node);
      for(const rect of range.getClientRects()) for(let parent=node;parent;parent=parent.parentElement) {
        const style=getComputedStyle(parent), box=parent.getBoundingClientRect();
        if((['hidden','clip'].includes(style.overflowX)&&(rect.left<box.left-1||rect.right>box.right+1))||(['hidden','clip'].includes(style.overflowY)&&(rect.top<box.top-1||rect.bottom>box.bottom+1))) cut.push(node.textContent);
      }
    }
    return {fits:el.scrollWidth<=el.clientWidth+1,pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,cut};
  });
  const assertOriginals = async label => {
    const ids=await card().locator('[data-lifecycle-object]').evaluateAll(nodes=>nodes.map(node=>node.dataset.lifecycleObject));
    check(ids.join(',')==='A,B,C,D,E',{kind:'fixed-original-targets',label,ids});
  };
  const captureLayout = async label => {
    const bounds=await measure();check(bounds.fits&&bounds.pageFits&&!bounds.cut.length,{label,kind:'long-critical-content-fit',bounds});
    const notices=[];
    for(const notice of await card().locator('.rhine-notice').all()) {
      await notice.scrollIntoViewIfNeeded();
      const value=await notice.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {text:el.textContent,visible:Number(s.opacity)>0&&s.visibility!=='hidden'&&r.width>0&&r.height>0,reachable:r.top>=0&&r.bottom<=innerHeight+1&&el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};});
      check(value.visible&&value.reachable,{label,kind:'notice-visible-and-reachable',value});notices.push(value);
    }
    const last=card().locator('[data-lifecycle-object="E"]');await last.scrollIntoViewIfNeeded();
    const lastVisible=await last.evaluate(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight+1;});
    await read().scrollIntoViewIfNeeded();
    const reachable=await read().evaluate(el=>{const r=el.getBoundingClientRect();return r.height>=43&&r.top>=0&&r.bottom<=innerHeight+1&&el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));});
    check(lastVisible&&reachable,{label,kind:'last-object-and-action-reachable',lastVisible,reachable});layouts.push({label,bounds,notices,lastVisible,reachable});
  };
  try {
    if(params.phase!=='behavior') for(const theme of ['rhine','arknights','neo-brutalism','neutral']) for(const width of [400,520,880]) for(const zoom of [1,2]) {
      const label=`${theme}/${width}/css${zoom*100}`;
      await page.setViewportSize({width,height:1000});await page.goto(`${origin}/?fixture=object-lifecycle&theme=${theme}`);
      await page.evaluate(value=>{document.documentElement.style.zoom=String(value);},zoom);
      await page.getByLabel('生命周期长文').check();await page.getByLabel('保留对象历史').check();await settled();
      check(await summary().innerText()==='已结束',{label,kind:'complete-fresh-removed'});
      check(await card().locator('.rhine-badge:not(.rhine-tone-neutral)').count()===0,{label,kind:'removed-neutral-tone'});
      await assertOriginals(label);
      if(params.lifecycleProbe==='clip') {
        await card().locator('.rhine-lifecycle-objects').evaluate(el=>{el.style.height='1px';el.style.overflow='hidden';});
        const bounds=await measure();check(!bounds.cut.length,{label:`${label}/removed`,kind:'long-critical-content-fit',bounds});layouts.push({label:`${label}/removed`,bounds});return result();
      }
      await captureLayout(`${label}/removed`);
      await page.getByRole('button',{name:'推进合成时钟至过期'}).click();await page.waitForTimeout(250);
      check(await summary().innerText()==='未知',{label:`${label}/expired`,kind:'expired-current-unknown'});await captureLayout(`${label}/expired`);
      await page.getByLabel('生命周期场景').selectOption('timeout');await read().click();await settled();await page.waitForTimeout(250);
      check(await card().getByText('读取未确认',{exact:true}).isVisible(),{label:`${label}/error`,kind:'read-error-visible'});await captureLayout(`${label}/error`);
    }
    if(params.phase==='layout') return result();
    await page.setViewportSize({width:880,height:1000});await page.goto(`${origin}/?fixture=object-lifecycle`);
    await page.getByText('此功能已退役',{exact:true}).waitFor();await page.waitForTimeout(800);
    const retired=await timers();check(await card().count()===0&&retired.scheduled===0&&retired.intervals===0,{kind:'retired-zero-read-zero-poll',retired});
    await page.getByLabel('保留对象历史').check();
    check(await card().getAttribute('data-pending')==='true'&&await summary().innerText()==='未知'&&await card().locator('.rhine-skeleton').count()===1,{kind:'cold-loading-unknown'});
    await settled();check(await summary().innerText()==='已结束',{kind:'all-removed-ended'});
    check(await card().locator('[data-lifecycle-object] .rhine-badge').allTextContents().then(values=>values.every(value=>value==='已移除')),{kind:'every-original-explicitly-removed'});
    const originalTime=await card().locator('[data-lifecycle-times]').innerText();
    await page.getByRole('button',{name:'推进合成时钟至过期'}).click();
    if(params.expiredProbe==='ended') await summary().locator('.rhine-badge').evaluate(el=>{el.textContent='已结束';});
    check(await summary().innerText()==='未知'&&await card().getByText('上次记录：已移除',{exact:true}).count()===5,{kind:'removal-evidence-expires'});
    if(params.expiredProbe==='ended') return result();
    await read().focus();await page.keyboard.press('Enter');await settled();
    check(await summary().innerText()==='未知'&&(await card().locator('[data-lifecycle-times]').innerText()).replace('上次记录','观测时间')===originalTime,{kind:'retry-does-not-renew-expired-evidence'});
    const beforeService=await timers();await page.getByRole('button',{name:'服务提供新观测'}).click();
    check(await summary().innerText()==='未知'&&(await timers()).scheduled===beforeService.scheduled,{kind:'service-update-does-not-accept-or-read'});
    await read().focus();await page.keyboard.press('Enter');await settled();
    check(await summary().innerText()==='已结束'&&(await card().locator('[data-lifecycle-times]').innerText())!==originalTime,{kind:'explicit-read-accepts-new-fresh-evidence'});
    await page.getByLabel('生命周期场景').selectOption('stopped');await settled();
    check(await summary().innerText()==='仍有对象'&&await card().getByText('自动管理：已停止',{exact:true}).isVisible(),{kind:'stopped-not-removed'});
    behavior.push('cold/removed/expired/retry-unchanged/new-observation-recovery/stopped');
    for(const scenario of ['partial','timeout','denied','replacement']) {
      await page.getByLabel('生命周期场景').selectOption(scenario);
      const before=await card().locator('[data-lifecycle-times]').innerText();
      await read().focus();await page.keyboard.press('Enter');await settled();
      await card().getByText('读取未确认',{exact:true}).waitFor();
      const after=await card().locator('[data-lifecycle-times]').innerText();
      check(await summary().innerText()==='未知'&&after.replace('上次记录','观测时间')===before,{kind:'failed-read-preserves-time',scenario,before,after});
      check(await card().getByText('上次记录：仍存在',{exact:true}).count()===5,{kind:'failed-read-preserves-complete-seed',scenario});
      check(await read().evaluate(el=>el===document.activeElement),{kind:'error-preserves-focus',scenario});await assertOriginals(scenario);
      await page.keyboard.press('Enter');
      check(await card().getAttribute('data-pending')==='true'&&await summary().innerText()==='未知'&&await card().getByText('读取未确认',{exact:true}).isVisible(),{kind:'retry-retains-error-and-unknown',scenario});
      const retryCancel=card().getByRole('button',{name:'取消等待'});await retryCancel.focus();await page.keyboard.press('Enter');const cancelledRetry=await timers();
      await page.waitForTimeout(700);
      check(await summary().innerText()==='未知'&&(await card().locator('[data-lifecycle-times]').innerText())===after&&await card().getByText('读取未确认',{exact:true}).isVisible(),{kind:'cancel-retry-keeps-error-time-and-unknown',scenario});
      check(await read().evaluate(el=>el===document.activeElement)&&cancelledRetry.pending===0&&(await timers()).fired===cancelledRetry.fired,{kind:'cancel-retry-keeps-focus-and-clears-response',scenario,cancelledRetry});behavior.push(scenario);
    }
    await page.getByLabel('生命周期场景').selectOption('cold-error');await settled();
    check(await summary().innerText()==='未知'&&await card().locator('[data-lifecycle-times]').count()===0&&await card().locator('.rhine-skeleton').count()===0,{kind:'cold-error-unknown-no-fake-snapshot'});
    await page.getByLabel('生命周期场景').selectOption('removed');
    const cancel=card().getByRole('button',{name:'取消等待'});await cancel.focus();await page.keyboard.press('Enter');
    const cancelled=await timers();await page.waitForTimeout(800);
    check(await summary().innerText()==='未知'&&(await timers()).fired===cancelled.fired&&cancelled.pending===0,{kind:'cancel-clears-real-response',cancelled});
    check(await read().evaluate(el=>el===document.activeElement),{kind:'cancel-hands-focus-to-read'});
    await page.keyboard.press('Enter');check(await card().getAttribute('data-pending')==='true',{kind:'keyboard-starts-new-read'});
    await page.keyboard.press('Tab');check(await cancel.evaluate(el=>el===document.activeElement),{kind:'forward-tab-cancel'});
    await page.keyboard.press('Shift+Tab');check(await read().evaluate(el=>el===document.activeElement),{kind:'reverse-tab-read'});
    await page.getByLabel('保留对象历史').uncheck();const exit=await timers();await page.waitForTimeout(800);
    check(await card().count()===0&&exit.pending===0&&(await timers()).fired===exit.fired,{kind:'retire-during-read-no-late-card',exit});
    await page.getByLabel('保留对象历史').check();const mounted=await timers();
    await page.getByRole('button',{name:'卸载场景',exact:true}).click();await page.waitForTimeout(800);
    check(await card().count()===0&&(await timers()).pending===0&&(await timers()).fired===mounted.fired,{kind:'unmount-cancels-real-response',mounted,after:await timers()});
    await page.getByRole('button',{name:'重新挂载场景',exact:true}).click();await settled();
    check(await summary().innerText()==='已结束',{kind:'remount-accepts-new-read'});behavior.push('cancel/tab/retire/unmount/remount');
    for(const mode of ['normal','system','manual']) {
      await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});await page.goto(`${origin}/?fixture=object-lifecycle&motion=${mode}`);
      // Sample frames before the 650ms read settles; style declarations alone do not prove motion.
      await page.evaluate(() => {
        window.__lifecycleMotion={samples:[],done:false};const start=performance.now();
        const frame=()=>{const el=document.querySelector('.rhine-skeleton>span[aria-hidden]');if(el){const style=getComputedStyle(el);window.__lifecycleMotion.samples.push({opacity:style.opacity,animation:style.animationName});}if(performance.now()-start<900)requestAnimationFrame(frame);else window.__lifecycleMotion.done=true;};requestAnimationFrame(frame);
      });
      const retain=page.getByLabel('保留对象历史');await retain.focus();await page.keyboard.press('Space');
      await settled();await page.waitForFunction(()=>window.__lifecycleMotion.done);
      const sample=await page.evaluate(()=>window.__lifecycleMotion.samples);
      check(sample.length>2&&(mode==='normal'?new Set(sample.map(value=>value.opacity)).size>1:sample.every(value=>value.animation==='none')),{kind:'actual-skeleton-motion',mode,sample});
      check(await retain.evaluate(el=>el===document.activeElement)&&await summary().innerText()==='已结束',{kind:'motion-path-completes-keeps-focus',mode});
      const expiry=page.getByRole('button',{name:'推进合成时钟至过期'});await expiry.focus();await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      const notice=await card().locator('.rhine-notice').evaluate(el=>{let visible=true;for(let parent=el;parent;parent=parent.parentElement){const s=getComputedStyle(parent);visible=visible&&s.visibility!=='hidden'&&s.display!=='none'&&Number(s.opacity)>0;}const r=el.getBoundingClientRect();return {visible:visible&&r.width>0&&r.height>0,text:el.textContent};});
      check(notice.visible&&notice.text.includes('当前状态未知')&&await expiry.evaluate(el=>el===document.activeElement),{kind:'notice-visible-focus-retained',mode,notice});motion.push({mode,sample,notice});
    }
    await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(`${origin}/?theme=neutral#object-lifecycle`);
    check(await page.getByRole('main').getAttribute('aria-label')==='对象生命周期与观测'&&await page.getByText('此功能已退役',{exact:true}).isVisible(),{kind:'real-shell-entry'});
    await page.getByLabel('保留对象历史').check();await settled();check(await summary().innerText()==='已结束',{kind:'real-shell-live-path'});
  } catch(error) { errors.push(String(error)); }
  return {...result(),browser:await page.evaluate(()=>navigator.userAgent)};
}
