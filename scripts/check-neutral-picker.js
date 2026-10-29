async page => {
 page.setDefaultTimeout(3000);
 const base=await page.evaluate(()=>location.origin),rows=[];
 for(const width of [400,520,880])for(const zoom of [1,2]){
  try{
   await page.setViewportSize({width,height:900});await page.goto(`${base}/?fixture=theme-picker&theme=neutral&zoom=${zoom}`);
   await page.waitForFunction(()=>[...document.querySelectorAll('.rhine-theme-preview img')].every(e=>e.complete&&e.naturalWidth===960),null,{timeout:5000});
   const radios=page.getByRole('radio');if(await radios.count()!==4)throw Error('four themes missing');
   const selected=page.getByRole('radio',{name:'中性 · 黑白轻量'});await selected.focus();await page.keyboard.press('ArrowLeft');
   if(!await page.getByRole('radio',{name:'橙趣 · 粗描边'}).isChecked())throw Error('keyboard selection failed');
   const draft=page.getByRole('textbox',{name:'未保存草稿'});await draft.fill('继续编辑');
   await page.getByRole('button',{name:'弹窗内切换主题'}).click();const dialog=page.getByRole('dialog');
   await dialog.locator('label').filter({has:page.getByRole('radio',{name:'中性 · 黑白轻量'})}).click();
   if(!await dialog.getByRole('textbox',{name:'弹窗草稿'}).isVisible())throw Error('dialog lost');
   await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   if(await draft.inputValue()!=='继续编辑')throw Error('draft lost');
   await page.getByRole('checkbox',{name:'模拟预览失败'}).check();
   await page.waitForFunction(()=>document.querySelectorAll('[data-state=error]').length===4,null,{timeout:3000});
   await page.getByRole('checkbox',{name:'禁用主题选择'}).check();
   if(!await radios.evaluateAll(es=>es.every(e=>e.matches(':disabled'))))throw Error('disabled failure');
   rows.push({width,zoom,pass:true});
  }catch(e){rows.push({width,zoom,pass:false,error:String(e)});}
 }
 return {pass:rows.every(r=>r.pass),rows};
}
