// Real Enter/typeahead input; no timers or programmatic select value changes.
async page => {
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[];
 const assert=(ok,message)=>{if(!ok) throw Error(message);};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const zoom of [1,2]){
  await page.setViewportSize({width:400,height:648});await page.goto(`${base}/?fixture=template-settings&theme=${theme}&zoom=${zoom}`);
  const group=page.getByRole('group',{name:'添加焦点规则'}),add=group.getByRole('button',{name:'添加规则'});
  for(const mode of ['batch','flush','handoff','cancel','reject']){
   try {
    await page.getByRole('combobox',{name:'添加行为'}).selectOption(mode);const count=await group.getByRole('listitem').count();await add.focus();await page.keyboard.press('Enter');
    if(['batch','flush'].includes(mode)) {
     const source=group.getByRole('combobox',{name:`第${count+1}行 来源`});assert(await source.evaluate(e=>e===document.activeElement),'new source not focused');await page.keyboard.press('b');assert(await source.inputValue()==='option-2','focused source does not accept native typeahead');
    }else if(mode==='handoff') assert(await page.getByRole('textbox',{name:'宿主添加后确认'}).evaluate(e=>e===document.activeElement),'host focus stolen');
    else {assert(await group.getByRole('listitem').count()===count,'cancel/reject appended');assert(await add.evaluate(e=>e===document.activeElement),'cancel/reject moved focus');await page.getByRole('combobox',{name:'添加行为'}).selectOption('batch');await add.focus();await page.keyboard.press('Tab');assert(!await group.getByRole('combobox').evaluateAll(els=>els.includes(document.activeElement)),'stale focus intent');}
    results.push({theme,zoom,mode,pass:true});
   }catch(error){results.push({theme,zoom,mode,pass:false,error:String(error)});}
  }
 }
 return {pass:results.every(r=>r.pass),results};
}
