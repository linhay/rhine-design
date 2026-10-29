async page => {
 const base=new URL(page.url()).origin, results=[],errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
 for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520]) for(const zoom of [1,2]) {
  try {
   await page.setViewportSize({width,height:648});await page.goto(`${base}/?fixture=timeline-density&theme=${theme}&zoom=${zoom}&narrow=1`);await page.mouse.move(0,0);
   const section=page.getByRole('region',{name:'compact密度'}),slider=section.getByRole('slider'),a=section.getByRole('button',{name:'有输出',exact:true}),b=section.getByRole('button',{name:'未知',exact:true});
   await slider.focus();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});await page.keyboard.press('Tab');
   if(!await a.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')))throw Error('native Tab did not focus first legend');
   const rule=page.getByRole('dialog',{name:'有输出规则',exact:true});await rule.waitFor();await b.hover();
   if(!await rule.isVisible()||!await a.evaluate(e=>e===document.activeElement))throw Error('hover stole keyboard rule');
   await a.press('Enter');const close=rule.getByRole('button',{name:'关闭有输出规则'});await page.mouse.move(0,0);await b.hover();
   if(!await close.evaluate(e=>e===document.activeElement))throw Error('hover unmounted focused detail');
   await b.click();await page.getByRole('dialog',{name:'未知规则',exact:true}).waitFor();
   await slider.focus();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});await page.mouse.move(0,0);await a.hover();await rule.waitFor();
   results.push({theme,width,zoom,pass:true});
  }catch(e){results.push({theme,width,zoom,pass:false,error:String(e)});}
 }
 return {pass:results.every(x=>x.pass)&&!errors.length,results,errors};
}
