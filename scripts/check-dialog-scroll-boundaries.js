// Additional public API boundaries: footer without height, and text-only bounded body.
async page => {
 const origin=page.url().split('/').slice(0,3).join('/'),results=[];
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,880])for(const zoom of [1,2]) {
  const c={theme,width,zoom};
  try {
   await page.setViewportSize({width,height:648});
   await page.goto(`${origin}/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}`);
   await page.getByRole('button',{name:'自动高度操作区示例'}).click();
   const auto=page.getByRole('dialog',{name:'自动高度操作区'});
   const initial=await auto.evaluate(e=>{
    const footer=e.querySelector('.rhine-dialog__footer'),body=e.querySelector('.rhine-dialog__body');
    return {root:e.getBoundingClientRect().toJSON(),head:e.querySelector('.rhine-dialog__head').getBoundingClientRect().toJSON(),footer:footer.getBoundingClientRect().toJSON(),body:body.getBoundingClientRect().toJSON(),footerScrollHeight:footer.scrollHeight,footerClientHeight:footer.clientHeight};
   });
   await auto.getByRole('button',{name:'长操作 20',exact:true}).focus();
   const after=await auto.evaluate(e=>{
    const footer=e.querySelector('.rhine-dialog__footer'),r=footer.getBoundingClientRect(),last=footer.querySelector('button:last-child').getBoundingClientRect();
    return {head:e.querySelector('.rhine-dialog__head').getBoundingClientRect().toJSON(),lastInside:last.top>=r.top-1&&last.bottom<=r.bottom+1,scroll:footer.scrollTop,rootScroll:e.scrollTop};
   });
   const autoPass=initial.body.height>0&&initial.footer.height<=(648-32*zoom)*.4+1&&initial.footerScrollHeight>initial.footerClientHeight&&after.lastInside&&after.scroll>0&&after.rootScroll===0&&Math.abs(after.head.y-initial.head.y)<1;
   // Ancestor zoom changes while open must update the local-pixel cap.
   for(const changedZoom of [zoom===1?2:1,zoom]) {
    await page.evaluate(z=>document.documentElement.style.zoom=String(z),changedZoom);
    await page.waitForFunction(z=>{const e=document.querySelector('[role=dialog]');return e&&Math.abs(parseFloat(e.style.getPropertyValue('--rhine-dialog-footer-limit'))-(innerHeight/z-32)*.4)<1;},changedZoom);
   }
   await page.keyboard.press('Escape');await auto.waitFor({state:'detached'});
   await page.getByRole('button',{name:'纯文本长正文示例'}).click();
   const text=page.getByRole('dialog',{name:'纯文本长正文'}),region=text.getByRole('region',{name:'纯文本长正文内容'});
   const named=await region.count()===1;
   let keyboard=false;
   if(named) {
    await text.getByRole('button',{name:'关闭对话框'}).focus();await page.keyboard.press('Tab');
    keyboard=await region.evaluate(e=>document.activeElement===e);
    await page.keyboard.press('End');
    await page.waitForFunction(()=>{const e=document.querySelector('[aria-label="纯文本长正文内容"]');return e&&e.scrollTop>0&&e.scrollHeight-e.clientHeight-e.scrollTop<2;});
   }
   results.push({...c,pass:autoPass&&named&&keyboard,autoPass,named,keyboard,initial,after});
  }catch(error){results.push({...c,pass:false,error:String(error)});}
 }
 return {pass:results.every(r=>r.pass),results};
}
