// Production fixture. Run once per theme; ?readingQuick=1 limits to the baseline case.
// DOM scroll/focus prepares the scene; activation/navigation uses real browser keys.
async page => {
  const base = await page.evaluate(() => ({ href:location.href, theme:new URLSearchParams(location.search).get('theme') || 'rhine', quick:new URLSearchParams(location.search).has('readingQuick') }));
  const { theme, quick } = base;
  const results = [], failures = [], errors = [];
  const check = (ok, name, detail) => { if (!ok) failures.push({ name, detail }); };
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const dialog = page.getByRole('dialog');
  const entry = page.getByRole('button', { name: /^阅读：河谷观察笔记/ });
  const focus = () => dialog.evaluate(d => {
    const a = document.activeElement, r = a.getBoundingClientRect(), b = d.getBoundingClientRect();
    const panel = a.getAttribute('role') === 'tabpanel';
    const top = Math.max(r.top,b.top+2,0), bottom = Math.min(r.bottom,b.bottom-2,innerHeight);
    const rects = panel ? [{x:r.x,y:top,width:r.width,height:bottom-top}] : Array.from(a.getClientRects());
    const hit = rects.length > 0 && rects.every(rect => { const node=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2); return !!node && a.contains(node); });
    return { name: a.getAttribute('aria-label') || (a.getAttribute('aria-labelledby') || '').split(' ').map(id=>document.getElementById(id)?.textContent).filter(Boolean).join(' ') || a.textContent, role: a.getAttribute('role'), anchor: a.hasAttribute('data-reading-anchor'),
      visible: d.contains(a) && !a.closest('[hidden]') && r.width > 0 && r.height > 0 && (panel ? bottom-top>20 : r.top >= Math.max(b.top, 0) && r.bottom <= Math.min(b.bottom, innerHeight)) && r.left >= Math.max(0, b.left) && r.right <= Math.min(innerWidth, b.right),
      hit, focusRect: [r.x, r.y, r.width, r.height], dialogRect: [b.x, b.y, b.width, b.height], top: d.scrollTop };
  });
  const open = async () => { await entry.focus(); await page.keyboard.press('Enter'); await dialog.waitFor(); await page.waitForTimeout(220); await settle(); };
  const close = async () => { await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' }); await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label')?.startsWith('阅读：')); };
  const setTop = async top => { await dialog.evaluate((d, top) => { d.scrollTop = top; }, top); await settle(); return dialog.evaluate(d => d.scrollTop); };
  const savedFocus = async (name, top) => { const state = await focus(); check(Math.abs(state.top - top) < 2, `${name}: position`, state); check(state.visible && state.hit && !!state.name?.trim(), `${name}: meaningful visible hit focus`, state); return state; };
  const cases = quick ? [{ width:880, height:800, zoom:1, mode:'normal' }] : [
    ...[400,520,880].flatMap(width => [1,2].map(zoom => ({width,height:600,zoom,mode:'normal'}))),
    ...['system','manual'].map(mode => ({width:880,height:600,zoom:1,mode})),
  ];
  for (const config of cases) {
    const label = `${theme}/${config.width}/${config.zoom}/${config.mode}`;
    try {
      await page.setViewportSize({width:config.width,height:config.height});
      await page.emulateMedia({reducedMotion:config.mode==='system'?'reduce':'no-preference'});
      const url = await page.evaluate(({href,zoom}) => { const url=new URL(href); url.searchParams.set('fixture','object-reading'); url.searchParams.set('zoom',String(zoom)); return url.href; }, {href:base.href,zoom:config.zoom});
      await page.goto(url);
      if(config.mode==='manual') await page.getByRole('combobox',{name:'动态偏好'}).selectOption('reduced');
      await open();
      const bounds=await dialog.evaluate(d=>{const r=d.getBoundingClientRect();return {overflow:d.scrollWidth-d.clientWidth,center:r.x+r.width/2,w:innerWidth,top:r.top,bottom:r.bottom,h:innerHeight,duration:getComputedStyle(d).animationDuration};});
      check(bounds.overflow<2&&Math.abs(bounds.center-bounds.w/2)<2&&bounds.top>=0&&bounds.bottom<=bounds.h+1,`${label}: dialog geometry`,bounds);
      if(config.mode!=='normal')check(parseFloat(bounds.duration)<=.001,`${label}: reduced dialog`,bounds);
      const saved=await setTop(700); await close(); await open();
      const ordinary=await savedFocus(`${label}: reopen`,saved);
      await close(); await page.getByRole('combobox',{name:'阅读场景'}).selectOption('error'); await open();
      // Stable short placeholder must not replace the body memory.
      const placeholder=await dialog.evaluate(d=>({top:d.scrollTop,height:d.scrollHeight,client:d.clientHeight}));
      await page.getByRole('tab',{name:'正文',exact:true}).focus();
      for(let i=0;i<6 && !(await page.getByRole('button',{name:'重试正文',exact:true}).evaluate(el=>el===document.activeElement));i++) await page.keyboard.press('Tab');
      check(await page.getByRole('button',{name:'重试正文',exact:true}).evaluate(el=>el===document.activeElement),`${label}: Tab reaches retry`);
      await page.keyboard.press('Enter');
      await page.getByText('正在加载正文',{exact:true}).waitFor();
      const pending=await page.getByRole('button',{name:'取消加载'}).count(); check(pending===1,`${label}: actual waiting phase`,pending);
      if(config.mode!=='normal')check(await dialog.locator('.rhine-skeleton').evaluate(d=>parseFloat(getComputedStyle(d).animationDuration)<=.001),`${label}: reduced skeleton`);
      await page.getByTestId('reading-end').waitFor(); await settle();
      const retry=await savedFocus(`${label}: retry`,saved);
      await close(); await page.getByRole('combobox',{name:'阅读场景'}).selectOption('loading'); await open();
      await page.getByRole('button',{name:'完成模拟加载'}).focus(); await page.keyboard.press('Enter');
      await page.getByRole('button',{name:'取消加载'}).waitFor(); await page.getByTestId('reading-end').waitFor(); await settle();
      const loaded=await savedFocus(`${label}: loading completion`,saved);
      await page.getByRole('button',{name:'查看关联',exact:true}).focus(); const bottom=await setTop(100000);
      await page.keyboard.press('Enter'); await settle();
      let state=await focus(); check(state.name==='关联'&&state.visible&&state.hit,`${label}: bottom to related`,state);
      await page.keyboard.press('Home'); await settle();
      const returned=await savedFocus(`${label}: Home to saved body`,bottom); check(returned.anchor,`${label}: body reading anchor`,returned);
      // Source path and return use keyboard tab activation, preserving the body position.
      await page.getByRole('tab',{name:'来源',exact:true}).focus(); await settle(); await page.keyboard.press('Enter'); await settle();
      state=await focus();check(state.name==='来源'&&state.visible&&state.hit,`${label}: source tab`,state);
      await page.keyboard.press('Home'); await settle(); await savedFocus(`${label}: source return`,bottom);
      for(const key of ['Tab','Shift+Tab']) { await page.keyboard.press(key); state=await focus(); check(state.visible&&state.hit,`${label}: ${key} visible focus`,state); }
      await close();
      check((await page.getByTestId('reading-invariants').innerText()).includes('内容版本未修改 · 收件状态：未读'),`${label}: read only`);
      if(config.width===400&&config.zoom===2) { await open(); await page.screenshot({path:`output/playwright/reading-recovery-${theme}.png`}); await close(); }
      results.push({theme,...config,ordinary,placeholder,retry,loaded,returned});
    } catch(error) {errors.push({label,message:String(error)});}
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  return {pass:failures.length===0&&errors.length===0,theme,results,failures,errors,boundary:'Synthetic host; Chromium keyboard and CSS zoom, not native zoom, speech, other engines or real services.'};
}
