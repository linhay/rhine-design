// Real native Select typeahead with host-provided Latin synthetic labels.
// No selectOption, DOM option mutation or scripted change event.
async page => {
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[];
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880,1280])for(const zoom of [1,2]){
  try {
   await page.setViewportSize({width,height:648});await page.goto(`${base}/?fixture=template-settings&keyboard=latin&theme=${theme}&zoom=${zoom}`);
   await page.getByRole('button',{name:'打开模板工作区'}).click();const d=page.getByRole('dialog',{name:'模板配置'});const nav=async name=>{const select=d.getByRole('combobox',{name:'模板工作区栏目'});if(await select.isVisible()) await select.selectOption({label:name});else await d.getByRole('link',{name,exact:true}).click();};await nav('模板编辑');
   const source=d.getByRole('combobox',{name:'第1行 来源'}),target=d.getByRole('combobox',{name:'第1行 目标'});
   await source.focus();await source.press('b');await target.focus();await target.press('g');
   if(await source.inputValue()!=='option-2' || await target.inputValue()!=='option-3')throw Error('native typeahead did not update controlled values');
   await nav('其他设置');await nav('模板编辑');
   if(await source.inputValue()!=='option-2' || await target.inputValue()!=='option-3')throw Error('typeahead draft lost after section switch');
   results.push({theme,width,zoom,pass:true,source:'option-2',target:'option-3'});
  }catch(error){results.push({theme,width,zoom,pass:false,error:String(error)});}
 }
 return {pass:results.every(r=>r.pass),method:'native keyboard typeahead, host-controlled values retained across sections',nativePopupArrowKeys:'SKIPPED: also unchanged in standalone HTML select automation',results};
}
