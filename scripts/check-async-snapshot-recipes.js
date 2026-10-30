async page => {
  const {origin,probe} = await page.evaluate(() => ({origin:location.origin,probe:new URLSearchParams(location.search).get('asyncProbe')}));
  const failures = [], errors = [], cases = [], behavior = [], motion = [];
  page.on('pageerror',error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const ready = () => page.locator('[data-snapshot-list][data-read-status=ready]').waitFor();
  const measure = () => page.getByRole('tabpanel').locator('[data-async-card]').evaluate(el => {
    const outer = el.getBoundingClientRect();
    return {fits:el.scrollWidth <= el.clientWidth + 1, pageFits:document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      slots:[...el.querySelectorAll('[data-module]')].map(slot => { const b=slot.getBoundingClientRect(); return {module:slot.dataset.module,top:b.top-outer.top,height:b.height,fits:slot.scrollWidth <= slot.clientWidth+1}; })};
  });
  const stable = (a,b,label,kind) => check(a.slots.every((slot,i) => Math.abs(slot.top-b.slots[i].top)<1 && Math.abs(slot.height-b.slots[i].height)<1) && b.fits && b.pageFits && b.slots.every(slot=>slot.fits),{label,kind,a,b});
  try {
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of [1,2]) {
    const label=`${theme}/${width}/css${zoom*100}`;
    await page.setViewportSize({width,height:1000});
    await page.goto(`${origin}/?fixture=async-snapshot-recipes&theme=${theme}`);
    await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);},zoom);
    await ready();
    const baseline = await measure();
    check(baseline.fits && baseline.pageFits && baseline.slots.every(slot=>slot.fits),{label,kind:'baseline-inner-fit',baseline});
    const modules=[];
    for (const value of ['all','0','1','2','3','4','5']) {
      await page.getByLabel('模块加载演示').selectOption(value);
      if (probe==='slot') await page.getByRole('tabpanel').locator('[data-module="0"]').evaluate(el=>{el.style.minHeight='1px';el.style.height='1px';el.style.overflow='hidden';});
      const loading=await measure(); stable(baseline,loading,label,`module-${value}`);
      const hidden=await page.getByRole('tabpanel').locator('[data-module][aria-busy=true]').evaluateAll(slots=>slots.every(slot=>{
        const content=slot.querySelector('.rhine-async-slot-content');return content.inert && content.getAttribute('aria-hidden')==='true' && getComputedStyle(content).visibility==='hidden';
      }));
      check(hidden,{label,kind:'busy-content-inert',value});
      modules.push({value,loading});
    }
    await page.getByLabel('模块加载演示').selectOption('none');
    const oldSummary=await page.locator('[data-result-summary]').innerText();
    await page.getByRole('tab',{name:'OAuth',exact:true}).click();
    if(probe==='attribution') await page.locator('[data-result-summary]').evaluate(el=>{const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.data==='全部'){node.data='OAuth';break;}}});
    const transition=await page.locator('[data-snapshot-list]').evaluate(root=>{
      const card=root.querySelector('[role=tabpanel]:not([hidden]) [data-async-card]'),outer=card.getBoundingClientRect();
      return {summary:root.querySelector('[data-result-summary]').innerText,busy:root.querySelector('button').getAttribute('aria-busy'),updating:root.innerText.includes('正在后台读取，已有快照仍可读。'),skeletons:card.querySelectorAll('.rhine-skeleton').length,
        first:{fits:card.scrollWidth<=card.clientWidth+1,pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,slots:[...card.querySelectorAll('[data-module]')].map(slot=>{const b=slot.getBoundingClientRect();return {module:slot.dataset.module,top:b.top-outer.top,height:b.height,fits:slot.scrollWidth<=slot.clientWidth+1};})}};
    });
    check(transition.summary===oldSummary&&oldSummary.includes('全部'),{label,kind:'tab-retains-attributed-summary',oldSummary,transition});
    check(transition.busy!=='true'&&!transition.updating,{label,kind:'tab-no-global-busy-or-update-text',transition});
    check(transition.skeletons===6,{label,kind:'current-tab-six-skeletons',transition});
    const first=transition.first; stable(baseline,first,label,'unknown-six-slots');
    await ready();
    check((await page.locator('[data-result-summary]').innerText()).includes('OAuth：1'),{label,kind:'accepted-new-scope'});
    // Actual forward/reverse Tab walks cannot enter hidden panels or inert content.
    await page.getByLabel('模块加载演示').selectOption('5');
    for(const key of ['Tab','Shift+Tab']) {
      await page.getByRole('tab',{name:'OAuth',exact:true}).focus();
      for(let i=0;i<10;i++) {await page.keyboard.press(key);check(await page.evaluate(()=>!document.activeElement.closest('[hidden],[inert]')),{label,kind:'hidden-or-inert-tab-order',key,i});}
    }
    await page.getByLabel('模块加载演示').selectOption('none');
    await page.getByLabel('异步长文本').check();
    const long=await measure();check(long.fits&&long.pageFits&&long.slots.every(slot=>slot.fits),{label,kind:'long-inner-fit',long});
    await page.getByLabel('模块加载演示').selectOption('all');
    stable(long,await measure(),label,'known-long-space-retained');
    await page.getByLabel('模块加载演示').selectOption('none');
    await page.getByLabel('异步配方场景').selectOption('partial');
    const partialPending=await measure();await ready();const partialReady=await measure();
    stable(partialPending,partialReady,label,'partial-field-completion-stable');
    check((await page.getByRole('tabpanel').innerText()).includes('费用未知，未提供读数'),{label,kind:'partial-completion-exits-skeleton'});
    cases.push({label,baseline,modules,first,long,partialPending,partialReady});
    if(probe) return {pass:!failures.length&&!errors.length,failures,errors,cases,behavior,motion};
  }
  await page.getByLabel('模块加载演示').selectOption('none');
  await page.getByLabel('异步长文本').uncheck();
  for(const scenario of ['first','error','no-snapshot-error','empty','partial','stale','budget']) {
    await page.getByLabel('异步配方场景').selectOption(scenario);
    if(scenario==='partial') check((await page.getByRole('tabpanel').innerText()).includes('1.28 USD') && await page.getByRole('tabpanel').getByText('本周期费用尚未读取',{exact:true}).count()===1,{kind:'partial-pending-preserves-known'});
    if(scenario==='first') check((await page.locator('[data-result-summary]').innerText()).includes('尚无已确认') && await page.getByRole('tabpanel').locator('.rhine-skeleton').count()===6,{kind:'first-no-fake-zero'});
    const expected={error:'error','no-snapshot-error':'error',budget:'budget'}[scenario]||'ready';
    await page.locator(`[data-snapshot-list][data-read-status=${expected}]`).waitFor();
    const text=await page.locator('[data-snapshot-list]').innerText();
    if(scenario==='error')check(text.includes('保留上次快照')&&text.includes('任务已暂停')&&text.includes('全部：1'),{kind:'old-error',text});
    if(scenario==='no-snapshot-error')check(text.includes('尚无可用快照')&&!text.includes('0 条')&&await page.getByRole('tabpanel').locator('.rhine-skeleton').count()===0,{kind:'first-error-no-fake-zero',text});
    if(scenario==='empty')check(text.includes('此范围没有资源')&&text.includes('全部：0'),{kind:'valid-empty',text});
    if(scenario==='partial')check(text.includes('1.28 USD')&&text.includes('费用未知，未提供读数')&&text.includes('历史读取失败')&&text.includes('上次历史：12'),{kind:'partial-known-fields-history-preserved',text});
    if(scenario==='stale')check(text.includes('快照已过期')&&text.includes('2026-10-29 14:32'),{kind:'explicit-stale',text});
    if(scenario==='budget') {
      check(text.includes('已达到本轮读取预算')&&await page.getByRole('tabpanel').locator('.rhine-skeleton').count()===0,{kind:'budget-exits-busy',text});
      await page.getByRole('button',{name:'重试读取',exact:true}).click();
      check(await page.locator('[data-snapshot-list]').getAttribute('data-read-status')==='loading',{kind:'budget-retry'});
      await page.locator('[data-snapshot-list][data-read-status=budget]').waitFor();
    }
    behavior.push({scenario,text});
  }
  await page.getByLabel('异步配方场景').selectOption('delayed');await ready();
  await page.getByRole('tab',{name:'OAuth',exact:true}).click();
  await page.getByRole('tab',{name:'API Key',exact:true}).click();await ready();
  await page.waitForTimeout(1300);
  check((await page.locator('[data-result-summary]').innerText()).includes('API Key：1'),{kind:'rapid-scope-late-protection'});
  check((await page.getByRole('tabpanel').innerText()).includes('此接入方式不提供额度')&&await page.getByRole('tabpanel').locator('[data-module="1"] .rhine-skeleton').count()===0,{kind:'key-no-permanent-quota-loading'});
  // Explicit visibility simulation exercises the handler, not real browser background throttling.
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  check(await page.locator('[data-snapshot-list]').getAttribute('data-read-status')==='paused',{kind:'simulated-hidden-pause'});
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});await ready();
  await page.getByRole('button',{name:'暂停读取',exact:true}).click();
  check(await page.locator('[data-snapshot-list]').getAttribute('data-read-status')==='paused',{kind:'manual-pause'});
  await page.getByRole('button',{name:'恢复读取',exact:true}).click();await ready();
  await page.getByRole('button',{name:'演示搜索反馈'}).click();
  check((await page.locator('[data-search-feedback]').innerText()).includes('正在读取'),{kind:'independent-search-feedback'});
  await page.getByRole('button',{name:'更新此对象（合成）'}).click();
  await page.getByText('对象更新演示已完成',{exact:true}).waitFor();
  for(const task of ['paused','failed']) {
    await page.getByLabel('诊断任务状态').selectOption(task);await page.getByLabel('诊断读取状态').selectOption('error');
    const text=await page.locator('[data-diagnostic]').innerText();
    check(text.includes(`任务状态：${task}`)&&text.includes('读取失败，以下保留上次读取记录')&&text.includes('覆盖率：未知'),{kind:'diagnostic-old-task-preserved',task,text});
  }
  const tableEnd = await page.locator('[data-diagnostic] .rhine-table-scroll').evaluate(el=>{el.scrollLeft=el.scrollWidth;const cell=el.querySelector('tbody tr td:last-child'),outer=el.getBoundingClientRect(),b=cell.getBoundingClientRect();return {fits:b.right<=outer.right+1&&b.left>=outer.left-1,scroll:el.scrollLeft};});
  check(tableEnd.fits,{kind:'diagnostic-final-column-scroll',tableEnd});
  await page.getByLabel('合成复制失败').check();await page.getByRole('button',{name:'复制诊断命令'}).click();
  check(await page.getByText('已复制',{exact:true}).count()===0,{kind:'copy-awaits-promise'});
  await page.getByText('复制失败，请重试',{exact:true}).waitFor();
  await page.getByLabel('合成复制失败').uncheck();await page.getByRole('button',{name:'复制诊断命令'}).click();await page.getByText('已复制',{exact:true}).waitFor();
  await page.getByLabel('诊断空路径与命令').check();
  check(await page.getByRole('button',{name:'复制诊断命令'}).count()===0&&await page.getByText('未提供诊断命令',{exact:true}).count()===1,{kind:'empty-command-no-copy'});
  for(const mode of ['normal','system','manual']) {
    await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
    await page.goto(`${origin}/?fixture=async-snapshot-recipes&motion=${mode}`);await ready();
    await page.getByLabel('模块加载演示').selectOption('0');
    const skeleton=page.getByRole('tabpanel').locator('.rhine-skeleton > span[aria-hidden]').first();
    const sample=[];for(let i=0;i<4;i++){sample.push(await skeleton.evaluate(el=>({name:getComputedStyle(el).animationName,opacity:getComputedStyle(el).opacity})));await page.waitForTimeout(220);}
    check(mode==='normal'?new Set(sample.map(s=>s.opacity)).size>1:sample.every(s=>s.name==='none'),{kind:'skeleton-motion',mode,sample});
    await page.getByRole('tab',{name:'OAuth',exact:true}).click();await ready();
    check((await page.locator('[data-result-summary]').innerText()).includes('OAuth：1'),{kind:'motion-completes',mode});motion.push({mode,sample});
  }
  } catch(error) { errors.push(String(error)); }
  return {pass:!failures.length&&!errors.length,failures,errors,cases,behavior,motion,browser:await page.evaluate(()=>navigator.userAgent)};
}
