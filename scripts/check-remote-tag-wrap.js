// Actual built CSS cascade, including the effective selector width inside a bounded Dialog.
async page => {
 page.setDefaultTimeout(7000);
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 const fullName='合成人员 1 · 跨团队长期协作与研究计划的详细名称';
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2]){
  const c={theme,width,zoom};let measurements=[];
  try{
   await page.setViewportSize({width,height:900});await page.goto(`${base}/?fixture=remote-selection&theme=${theme}&zoom=${zoom}&motion=reduced`);
   await page.getByRole('button',{name:'141px窄正文标签',exact:true}).click();const d=page.getByRole('dialog',{name:'窄正文已选对象'}),input=d.getByRole('combobox');
   await d.getByText('5 个候选项',{exact:true}).waitFor();const first=d.getByRole('button',{name:fullName,exact:true}),second=d.getByRole('button',{name:'合成人员 2',exact:true});
   const measure=async state=>{
    const m=await d.locator('[data-tag-width]').evaluate(e=>{
     const z=Number(getComputedStyle(document.documentElement).zoom),tags=e.querySelector('.rhine-multi-select__tags');
     const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left/z,right:r.right/z,width:r.width/z,height:r.height/z};};
     return {width:rect(e).width,overflow:e.scrollWidth>e.clientWidth+1,tagsOverflow:tags.scrollWidth>tags.clientWidth+1,bodyOverflow:e.closest('.rhine-dialog__body').scrollWidth>e.closest('.rhine-dialog__body').clientWidth+1,rows:[...tags.children].map(row=>({row:rect(row),buttons:[...row.querySelectorAll('button')].map(rect),activationFlex:getComputedStyle(row.querySelector('.rhine-multi-select__activate')).flex,wrap:getComputedStyle(row.querySelector('.rhine-multi-select__activate>span')).whiteSpace,textClipped:[...row.querySelectorAll('button>span')].some(s=>s.scrollWidth>s.clientWidth+1)}))};
    });measurements.push({state,...m});
    assert(m.width>=140&&m.width<=141.1,`expected approximately 141 CSS px selector, got ${m.width}`);assert(!m.overflow&&!m.tagsOverflow&&!m.bodyOverflow,`horizontal overflow ${JSON.stringify(m)}`);
    for(const r of m.rows){assert(r.buttons.every(b=>b.width>=43.9&&b.height>=43.9),'target below 44 CSS px');assert(r.buttons.every(b=>b.left>=r.row.left-1&&b.right<=r.row.right+1),'button extends beyond tag');assert(!r.textClipped&&r.wrap==='normal','full label clipped instead of wrapping');}
   };
   await measure('collapsed');assert(await first.getAttribute('aria-pressed')==='true','active state missing');assert(await first.evaluate(e=>getComputedStyle(e.closest('li')).boxShadow!=='none'),'active outline missing');assert(await first.textContent()===fullName,'label truncated in DOM');
   const draft=d.getByRole('textbox',{name:'当前对象草稿'});await draft.fill('甲草稿');await second.press('Space');assert(await draft.inputValue()==='','activation reused another draft');await draft.fill('乙草稿');await first.press('Enter');assert(await draft.inputValue()==='甲草稿','activation lost draft');assert(await page.getByRole('listbox').count()===0,'activation opened search');
   await first.focus();await page.keyboard.press('Tab');assert(await d.getByRole('button',{name:`移除${fullName}`,exact:true}).evaluate(e=>e===document.activeElement),'activation/remove not separate Tab targets');await page.keyboard.press('Shift+Tab');assert(await first.evaluate(e=>e===document.activeElement),'Shift+Tab did not return to activation');
   await d.getByRole('button',{name:'展开已选项'}).click();await measure('expanded');await d.getByRole('button',{name:'收起已选项'}).click();await measure('collapsed-again');await d.getByRole('button',{name:'展开已选项'}).click();await d.getByRole('button',{name:'合成人员 3',exact:true}).press('Enter');await d.getByRole('button',{name:'移除合成人员 3',exact:true}).press('Enter');assert(await first.getAttribute('aria-pressed')==='true','removal did not use host fallback');assert(await input.evaluate(e=>e===document.activeElement),'remove did not focus input');assert(await page.getByRole('listbox').count()===0,'remove opened search');await measure('after-remove');
   await d.getByRole('checkbox',{name:'只读选择器'}).check();await second.press('Space');assert(await second.getAttribute('aria-pressed')==='true','read-only activation blocked');assert(await d.getByRole('button',{name:'移除合成人员 2'}).isDisabled(),'read-only permits removal');await measure('read-only');
   await d.getByRole('checkbox',{name:'禁用选择器'}).check();assert(await first.isDisabled()&&await second.isDisabled(),'disabled permits activation');await measure('disabled');
   await page.keyboard.press('Escape');await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='141px窄正文标签');results.push({...c,pass:true,measurements});
  }catch(error){results.push({...c,pass:false,error:String(error),measurements});}
 }
 return {pass:results.every(r=>r.pass)&&!errors.length,results,errors};
}
