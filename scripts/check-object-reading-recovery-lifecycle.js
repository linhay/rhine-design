// Real 600ms synthetic request; each case first proves it entered the waiting state.
async page => {
  const origin=await page.evaluate(()=>location.origin);
  const results=[],failures=[];
  const check=(ok,name,detail)=>{if(!ok)failures.push({name,detail});};
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.setViewportSize({width:880,height:600});
  for(const action of ['wheel','keyboard','tab','close','cancel','object']) {
    await page.goto(`${origin}/?fixture=object-reading`);
    const entry=page.getByRole('button',{name:/^阅读：河谷观察笔记/}),dialog=page.getByRole('dialog');
    await entry.click();await page.waitForTimeout(220);
    await dialog.evaluate(d=>d.scrollTop=700);await settle();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
    await page.getByRole('combobox',{name:'阅读场景'}).selectOption('error');await entry.click();await page.waitForTimeout(220);
    await page.getByRole('button',{name:'重试正文',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'取消加载'}).waitFor();
    if(action==='wheel') {const b=await dialog.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.wheel(0,160);}
    if(action==='keyboard')await page.keyboard.press('Tab');
    if(action==='tab') {await page.getByRole('tab',{name:'来源',exact:true}).focus();await page.keyboard.press('Enter');}
    if(action==='cancel') {await page.getByRole('button',{name:'取消加载'}).focus();await page.keyboard.press('Enter');}
    if(action==='close'||action==='object') {await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')?.startsWith('阅读：'));}
    if(action==='object')await page.getByRole('button',{name:/^阅读：共享文件/}).click();
    const before=await page.evaluate(()=>({focus:document.activeElement?.getAttribute('aria-label') || (document.activeElement?.getAttribute('aria-labelledby')||'').split(' ').map(id=>document.getElementById(id)?.textContent).filter(Boolean).join(' ') || document.activeElement?.textContent,top:document.querySelector('[role="dialog"]')?.scrollTop}));
    await page.waitForTimeout(750);await settle();
    const after=await page.evaluate(()=>{const d=document.querySelector('[role="dialog"]'),a=document.activeElement,r=a.getBoundingClientRect();return {focus:a.getAttribute('aria-label') || (a.getAttribute('aria-labelledby')||'').split(' ').map(id=>document.getElementById(id)?.textContent).filter(Boolean).join(' ') || a.textContent,top:d?.scrollTop,readable:!!document.querySelector('[data-testid="reading-end"]'),visible:r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight};});
    if(['wheel','keyboard'].includes(action)){check(after.readable,`${action}: completes request`,after);check(after.top<700,`${action}: no late restore`,{before,after});}
    else {check(!after.readable,`${action}: request canceled`,after);check(after.focus===before.focus,`${action}: no late focus`,{before,after});}
    check(after.visible,`${action}: final visible focus`,after);results.push({action,before,after});
  }
  return {pass:failures.length===0,results,failures};
}
