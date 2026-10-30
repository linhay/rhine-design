async page => {
  const {origin,probe} = await page.evaluate(()=>({origin:location.origin,probe:new URLSearchParams(location.search).get('captionProbe')}));
  const failures=[], errors=[], cases=[], motion=[];
  page.on('pageerror',error=>errors.push(error.message));
  const check=(pass,detail)=>{if(!pass)failures.push(detail);};
  const captionName='请求明细 · 合成数据';
  const table=page.getByRole('table',{name:captionName,exact:true});
  const region=page.getByRole('region',{name:`${captionName}，可横向滚动`,exact:true});
  const measure=()=>page.locator('.rhine-table').evaluate(el=>{
    const c=el.caption,b=c.getBoundingClientRect(),s=getComputedStyle(c),r=el.parentElement;
    return {caption:c.textContent,width:b.width,height:b.height,clip:s.clipPath,display:s.display,visibility:s.visibility,ariaHidden:c.getAttribute('aria-hidden'),hidden:c.hidden,
      regionName:r.getAttribute('aria-label'),tabIndex:r.tabIndex,overflow:r.scrollWidth>r.clientWidth+1,pageFits:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1};
  });
  try {
    for(const theme of ['rhine','arknights','neo-brutalism','neutral']) for(const width of [400,520,880]) for(const zoom of [1,2]) {
      const label=`${theme}/${width}/css${zoom*100}`;
      await page.setViewportSize({width,height:648});await page.goto(`${origin}/?fixture=data-caption&theme=${theme}`);
      await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
      await table.waitFor();const visible=await measure();
      check(visible.height>1&&visible.width>1&&visible.clip==='none'&&visible.pageFits,{kind:'default-visible',label,visible});
      const handle=await table.elementHandle();
      await page.getByLabel('隐藏重复表格标题').check();
      if(probe==='name')await page.locator('caption').evaluate(el=>{el.setAttribute('aria-hidden','true');el.textContent='';el.parentElement.parentElement.removeAttribute('aria-label');});
      const hidden=await measure();
      check(await table.count()===1&&await region.count()===1&&hidden.caption===captionName&&hidden.width<=zoom+0.1&&hidden.height<=zoom+0.1&&hidden.display!=='none'&&hidden.visibility==='visible'&&!hidden.ariaHidden&&!hidden.hidden&&hidden.pageFits&&hidden.tabIndex===0,{kind:'hidden-native-names-and-layout',label,hidden});
      if(probe) return {pass:!failures.length&&!errors.length,failures,errors,cases};
      check(await handle.evaluate(el=>el.isConnected),{kind:'same-table-instance',label});
      await page.getByLabel('表格状态').focus();await page.keyboard.press('Tab');
      check(await region.evaluate(el=>document.activeElement===el),{kind:'real-tab-reaches-scroll-region',label});
      await region.evaluate(el=>el.scrollLeft=0);await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);
      const scroll=await region.evaluate(el=>({left:el.scrollLeft,overflow:el.scrollWidth>el.clientWidth+1,focused:document.activeElement===el}));
      check(scroll.focused&&(!scroll.overflow||scroll.left>0),{kind:'native-keyboard-horizontal-scroll',label,scroll});
      const end=await region.evaluate(el=>{el.scrollLeft=el.scrollWidth;const cell=el.querySelector('tbody tr td:last-child'),b=cell.getBoundingClientRect(),r=el.getBoundingClientRect();return {fits:b.left>=r.left-1&&b.right<=r.right+1,align:getComputedStyle(cell).textAlign,value:cell.innerText};});
      check(end.fits&&end.align==='right'&&end.value==='9,600',{kind:'last-numeric-column-reachable',label,end});
      for(const state of ['loading','error','empty','normal']) {
        await page.getByLabel('表格状态').selectOption(state);
        check(await table.count()===1&&await region.count()===1,{kind:'state-keeps-names',label,state});
      }
      await page.getByLabel('隐藏重复表格标题').focus();await page.keyboard.press('Space');
      check((await measure()).height>1&&await handle.evaluate(el=>el.isConnected)&&await page.getByLabel('隐藏重复表格标题').evaluate(el=>document.activeElement===el),{kind:'keyboard-restore-visible-and-focus',label});
      cases.push({label,visible,hidden,scroll,end});
    }
    for(const mode of ['normal','system','manual']) {
      await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
      await page.goto(`${origin}/?fixture=data-caption&motion=${mode}`);
      await page.getByLabel('隐藏重复表格标题').focus();await page.keyboard.press('Space');
      check(await table.count()===1&&await region.count()===1&&(await measure()).height<=1.1,{kind:'motion-independent-caption-toggle',mode});motion.push(mode);
    }
  }catch(error){errors.push(String(error));}
  return {pass:!failures.length&&!errors.length,failures,errors,cases,motion,browser:await page.evaluate(()=>navigator.userAgent),zoom:'CSS zoom; native browser zoom untested'};
}
