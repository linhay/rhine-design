async page => {
 page.setDefaultTimeout(3000);
 const base=await page.evaluate(()=>location.origin),rows=[];
 const probe=new URL(page.url()).searchParams.get('pickerProbe');
 if(probe==='preview')await page.route('**/graphite-*.png',route=>route.abort());
 for(const width of (probe?[400]:[400,520,880]))for(const zoom of (probe?[2]:[1,2])){
  try{
   await page.setViewportSize({width,height:900});await page.goto(`${base}/?fixture=theme-picker&theme=neutral&zoom=${zoom}`);
   await page.waitForFunction(()=>{const previews=[...document.querySelectorAll('.rhine-theme-preview')];return previews.length===5&&previews.every(e=>['ready','error'].includes(e.dataset.state))},null,{timeout:5000});
   if(!await page.locator('.rhine-theme-preview img').evaluateAll(images=>images.length===5&&images.every(e=>e.complete&&e.naturalWidth===960)))throw Error('five theme previews not loaded');
   const radios=page.getByRole('radio');if(await radios.count()!==5)throw Error('five themes missing');
   const selected=page.getByRole('radio',{name:'中性 · 黑白轻量'});await selected.focus();await page.keyboard.press('ArrowLeft');
   if(!await page.getByRole('radio',{name:'橙趣 · 粗描边'}).isChecked())throw Error('keyboard selection failed');
   const draft=page.getByRole('textbox',{name:'未保存草稿'});await draft.fill('继续编辑');
   await page.getByRole('button',{name:'弹窗内切换主题'}).click();const dialog=page.getByRole('dialog');
   await dialog.locator('label').filter({has:page.getByRole('radio',{name:'中性 · 黑白轻量'})}).click();
   if(!await dialog.getByRole('textbox',{name:'弹窗草稿'}).isVisible())throw Error('dialog lost');
   await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   if(await draft.inputValue()!=='继续编辑')throw Error('draft lost');
   await page.getByRole('checkbox',{name:'模拟预览失败'}).check();
   await page.waitForFunction(()=>document.querySelectorAll('[data-state=error]').length===5,null,{timeout:3000});
   await page.getByRole('checkbox',{name:'禁用主题选择'}).check();
   if(!await radios.evaluateAll(es=>es.every(e=>e.matches(':disabled'))))throw Error('disabled failure');
   rows.push({width,zoom,pass:true});
  }catch(e){rows.push({width,zoom,pass:false,error:String(e)});}
 }
 if(probe==='preview')await page.unroute('**/graphite-*.png');
 return {pass:rows.every(r=>r.pass),probe,rows};
}
