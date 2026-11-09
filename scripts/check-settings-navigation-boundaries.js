async page => {
 page.setDefaultTimeout(7000);const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[];
 for(const theme of ['rhine','arknights','neo-brutalism']){
  await page.setViewportSize({width:1280,height:900});await page.goto(`${base}/?fixture=template-settings&theme=${theme}`);await page.getByRole('button',{name:'设置合成对象甲'}).click();const d=page.getByRole('dialog');
  for(const width of [559,559.5,559.99,560,560.5]){
   await d.evaluate((e,width)=>{const s=getComputedStyle(e);e.style.width=`${width+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight)+parseFloat(s.borderLeftWidth)+parseFloat(s.borderRightWidth)}px`;},width);
   const r=await d.evaluate(e=>{const s=getComputedStyle(e),nav=e.querySelector('.rhine-dialog__navigation'),select=e.querySelector('.rhine-settings-navigation select'),root=e.querySelector('.rhine-settings-navigation');return {width:e.getBoundingClientRect().width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth),selectVisible:select.getClientRects().length>0,navHeight:nav.getBoundingClientRect().height,selectHeight:select.getBoundingClientRect().height,columns:getComputedStyle(e.querySelector('.rhine-dialog__settings-grid')).gridTemplateColumns.split(' ').length,rootOverflow:root.scrollWidth>root.clientWidth+1};});
   results.push({theme,requestedWidth:width,...r,pass:Math.abs(r.width-width)<.02&&(Math.abs(r.width-560)<=1/64||r.selectVisible===(r.width<560))&&!r.rootOverflow&&(r.selectVisible?r.navHeight===r.selectHeight&&r.columns===1:r.columns===2)});
  }
 }
 return {pass:results.every(r=>r.pass),results};
}
