async page=>{
 page.setDefaultTimeout(8000);const failures=[],errors=[],samples=[];const origin=new URL(page.url()).origin;
 const contrast=({color,bg})=>{const luminance=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const values=[luminance(color),luminance(bg)].sort((a,b)=>a-b);return (values[1]+.05)/(values[0]+.05);};
 page.on('pageerror',e=>errors.push(String(e)));const check=(ok,ctx)=>{if(!ok)failures.push(ctx)};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2]){
  const context={theme,width,zoom};await page.setViewportSize({width,height:1000});await page.goto(`${origin}/?theme=${theme}&proof=${Date.now()}#button-actions`);
  await page.getByLabel('按钮容器宽度').selectOption(String(width));await page.evaluate(z=>document.documentElement.style.zoom=String(z),zoom);
  const demo=page.locator('[data-button-actions]');const buttons=demo.locator('button');
  const dims=()=>buttons.evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {w:e.offsetWidth,h:e.offsetHeight,size:s.fontSize,line:s.lineHeight,pad:s.paddingInlineStart,large:e.classList.contains('rhine-button--large'),fit:e.scrollWidth<=e.clientWidth+1}}));
  const normal=await dims();check(normal.every(x=>x.h>=(x.large?52:44)&&x.size===(x.large?'16px':'14px')&&x.line===(x.large?'24px':'22px')&&x.pad===(x.large?'24px':'16px')&&x.fit),{...context,kind:'size-contract',normal});
  for(const state of ['disabled','busy']){await page.getByLabel('按钮状态').selectOption(state);const ds=await dims();check(ds.every((x,i)=>x.w===normal[i].w&&x.h===normal[i].h),{...context,kind:`stable-${state}`});if(state==='disabled')check(await buttons.first().isDisabled(),{...context,kind:'disabled'});else check(await buttons.first().getAttribute('aria-busy')==='true',{...context,kind:'busy'});}
  await page.getByLabel('按钮状态').selectOption('normal');
  const logout=demo.getByRole('button',{name:'退出登录',exact:true}).nth(1);await logout.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
  await page.getByRole('status').filter({hasText:'large退出登录'}).waitFor();check(await logout.evaluate(e=>document.activeElement===e),{...context,kind:'keyboard-focus'});
  const disconnect=demo.getByRole('button',{name:'断开连接',exact:true}).nth(1);await disconnect.focus();await page.keyboard.press('Space');await page.getByRole('status').filter({hasText:'large断开连接'}).waitFor();
  for(const label of ['退出登录','断开连接','删除记录']){
   const button=demo.getByRole('button',{name:label,exact:true}).nth(1);await page.mouse.move(0,0);await page.waitForTimeout(350);const normalColor=await button.evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));check(contrast(normalColor)>=4.5,{...context,kind:`contrast-default-${label}`,normalColor,ratio:contrast(normalColor)});await button.hover();await page.waitForTimeout(350);const color=await button.evaluate(e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
   check(contrast(color)>=4.5,{...context,kind:`contrast-hover-${label}`,color,ratio:contrast(color)});
   await page.mouse.down();check(await button.evaluate(e=>e.matches(':active')),{...context,kind:`active-${label}`});await page.mouse.move(0,0);await page.mouse.up();
   await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
   check(await button.evaluate(e=>e.matches(':focus-visible')&&(getComputedStyle(e).outlineStyle!=='none'||getComputedStyle(e).boxShadow!=='none')),{...context,kind:`focus-${label}`});
   samples.push({...context,label,color});
  }
  await page.getByLabel('按钮状态').selectOption('long');check(await demo.evaluate(e=>e.scrollWidth<=e.clientWidth+1),{...context,kind:'long-container'});check((await dims()).every(x=>x.fit),{...context,kind:'long-text'});
  await page.getByLabel('按钮状态').selectOption('normal');await demo.getByRole('button',{name:'删除记录',exact:true}).nth(1).click();
  const dialog=page.getByRole('alertdialog',{name:'删除合成记录'});await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  if(width===880&&zoom===1)await demo.screenshot({path:`output/playwright/buttons-${theme}.png`});
 }
 for(const mode of ['system','manual']){
  await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});await page.goto(`${origin}/?proof=${Date.now()}#button-actions`);
  if(mode==='manual')await page.getByRole('radio',{name:'减少动态',exact:true}).check();await page.locator('[data-button-actions]').getByRole('button',{name:'退出登录',exact:true}).first().press('Enter');await page.getByRole('status').filter({hasText:'合成操作完成'}).waitFor();
 }
 return {pass:!failures.length&&!errors.length,failures,errors,samples};
}
