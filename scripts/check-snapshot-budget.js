async page => {
  const {origin,probe} = await page.evaluate(() => ({origin:location.origin,probe:new URLSearchParams(location.search).get('budgetProbe')}));
  const failures = [], errors = [], cases = [], motion = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (pass, detail) => { if (!pass) failures.push(detail); };
  const list = page.locator('[data-snapshot-list]');
  const summary = page.locator('[data-result-summary]');
  const readStatus = status => page.locator(`[data-snapshot-list][data-read-status="${status}"]`).waitFor();
  const facts = () => list.evaluate(el => ({text:el.innerText, summary:el.querySelector('[data-result-summary]').innerText,
    status:el.dataset.readStatus, notices:[...el.querySelectorAll('.rhine-notice')].map(n=>({role:n.getAttribute('role'),tone:n.className,text:n.innerText})),
    skeletons:el.querySelectorAll('.rhine-skeleton').length, busy:!!el.querySelector('[aria-busy=true]'),
    pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1}));
  const checkCached = (f,label,before) => check(f.text.includes('旧快照仍可读') && f.text.includes('任务已暂停') && f.text.includes('128.00 USD') && f.summary===before && f.summary.includes('14:32') && !f.skeletons && !f.busy && f.notices.some(n=>n.role==='status'&&n.tone.includes('rhine-tone-neutral')) && !f.notices.some(n=>n.role==='alert'),{kind:'cached-budget-readable-information',label,f,before});
  try {
    for (const theme of ['rhine','arknights','neo-brutalism','neutral']) for (const width of [400,520,880]) for (const zoom of [1,2]) {
      const label=`${theme}/${width}/css${zoom*100}`;
      await page.setViewportSize({width,height:648});
      await page.goto(`${origin}/?fixture=async-snapshot-recipes&theme=${theme}`);
      await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
      await page.getByLabel('异步配方场景').selectOption('cached-budget');
      const before=await summary.innerText();
      await readStatus('budget');
      // Deliberate browser-only negative control; never changes the shipped recipe.
      if(probe==='error') await list.locator('.rhine-notice').evaluate(el=>{el.classList.replace('rhine-tone-neutral','rhine-tone-error');el.setAttribute('role','alert');});
      const cached=await facts();checkCached(cached,label,before);check(cached.pageFits,{kind:'page-fit',label,cached});
      if(probe) break;
      await page.getByRole('button',{name:'重试读取',exact:true}).click();
      check(await list.getAttribute('data-read-status')==='refreshing' && await page.getByRole('button',{name:'读取现有结果',exact:true}).getAttribute('aria-busy')==='true',{kind:'retry-enters-busy',label});
      await readStatus('budget');checkCached(await facts(),label,before);
      await page.getByRole('button',{name:'暂停读取',exact:true}).click();
      check(await list.getAttribute('data-read-status')==='paused'&&(await facts()).text.includes('128.00 USD'),{kind:'manual-pause-keeps-readable-cache',label});
      await page.getByRole('button',{name:'恢复读取',exact:true}).click();await readStatus('budget');
      const retry=page.getByRole('button',{name:'重试读取',exact:true});await retry.focus();await page.keyboard.press('Enter');await readStatus('budget');
      check(await retry.evaluate(el=>document.activeElement===el),{kind:'keyboard-retry-focus-retained',label});
      await page.getByRole('tab',{name:'OAuth',exact:true}).click();await readStatus('budget');const other=await facts();
      check(other.summary===before&&other.summary.includes('全部：1')&&!other.text.includes('旧快照仍可读')&&!other.text.includes('128.00 USD')&&other.text.includes('此范围尚无可读快照')&&other.notices.some(n=>n.tone.includes('rhine-tone-warning')),{kind:'different-scope-not-readable-cache',label,other});
      await page.getByLabel('异步配方场景').selectOption('error');await readStatus('error');const error=await facts();
      check(error.text.includes('读取失败，保留上次快照')&&error.text.includes('任务已暂停')&&error.text.includes('128.00 USD')&&error.notices.some(n=>n.role==='alert'&&n.tone.includes('rhine-tone-error')),{kind:'real-read-failure-separate',label,error});
      await page.getByLabel('异步配方场景').selectOption('budget');await readStatus('budget');const empty=await facts();
      check(empty.text.includes('尚无已确认的结果快照')&&!empty.text.includes('128.00 USD')&&!empty.text.includes('此范围没有资源')&&!empty.skeletons&&!empty.busy&&empty.notices.some(n=>n.tone.includes('rhine-tone-warning')),{kind:'no-snapshot-budget-unknown',label,empty});
      cases.push({label,cached,other,error,empty});
    }
    if(!probe) for (const mode of ['normal','system','manual']) {
      await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
      await page.goto(`${origin}/?fixture=async-snapshot-recipes&motion=${mode}`);
      await page.getByLabel('异步配方场景').selectOption('cached-budget');const before=await summary.innerText();await readStatus('budget');checkCached(await facts(),mode,before);
      await page.getByRole('button',{name:'重试读取',exact:true}).click();await readStatus('budget');checkCached(await facts(),mode,before);motion.push(mode);
    }
  } catch(error) { errors.push(String(error)); }
  return {pass:!failures.length&&!errors.length,failures,errors,cases,motion,browser:await page.evaluate(()=>navigator.userAgent),zoom:'CSS zoom; native browser zoom untested'};
}
