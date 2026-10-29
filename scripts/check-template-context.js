// Shared object context and explicit Switch submission; synthetic host pagination.
async page => {
 page.setDefaultTimeout(7000);
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880,1280])for(const zoom of [1,2]){
  const c={theme,width,zoom};
  try{
   await page.setViewportSize({width,height:648});await page.goto(`${base}/?fixture=template-settings&theme=${theme}&zoom=${zoom}`);
   const actual=page.locator('[aria-label="已应用目标状态"]'),before=await actual.textContent();
   const trigger=page.getByRole('button',{name:'打开模板工作区'});await trigger.click();const d=page.getByRole('dialog',{name:'模板配置'}),bar=d.getByRole('complementary',{name:'批量对象栏'}),input=bar.getByRole('combobox',{name:'目标对象'});
   const nav=async name=>{await d.getByRole('link',{name,exact:true}).click();};
   const rect=async()=>d.evaluate(e=>{const r=e.getBoundingClientRect(),f=e.querySelector('.rhine-dialog__footer').getBoundingClientRect();return [r.x,r.y,r.width,r.height,f.x,f.y,f.width,f.height];});const frame=await rect();
   await input.click();await page.getByRole('option',{name:'合成对象甲',exact:true}).click();await page.getByRole('button',{name:'加载更多',exact:true}).click();await page.getByRole('option',{name:'合成对象丙',exact:true}).waitFor();await input.focus();await page.keyboard.press('Tab');assert(await page.getByRole('button',{name:'完成选择',exact:true}).evaluate(e=>e===document.activeElement),'Portal completion Tab');await page.keyboard.press('Shift+Tab');assert(await input.evaluate(e=>e===document.activeElement),'Portal return Shift+Tab');await page.keyboard.press('Escape');assert(await d.isVisible(),'candidate Escape closed Dialog');await input.click();await page.getByRole('button',{name:'完成选择',exact:true}).click();assert(await input.evaluate(e=>e===document.activeElement),'completion did not restore target input');
   assert(await bar.count()===1,'one selected target removed batch bar');await nav('其他设置');assert(await d.getByRole('switch',{name:'启用调度'}).isChecked(),'single batch target initial value');
   await input.fill('乙');await page.getByRole('option',{name:'合成对象乙',exact:true}).click();await page.getByRole('button',{name:'完成选择'}).click();
   const toggle=d.getByRole('switch',{name:'启用调度'});assert(!(await toggle.isChecked()),'mixed value misrepresented');await d.getByText('部分对象已开启',{exact:true}).waitFor();assert(await d.getByRole('button',{name:'预览',exact:true}).isDisabled(),'untouched switch became an intent');
   await toggle.press('Space');assert(await toggle.isChecked(),`Space did not stage enabled: ${await toggle.evaluate(e=>JSON.stringify({focused:e===document.activeElement,active:document.activeElement?.outerHTML,checked:e.checked}))}`);assert(await input.inputValue()==='乙','Space leaked into object query');assert(await actual.textContent()===before,'switch applied immediately');
   await nav('模板编辑');await d.getByRole('textbox',{name:'模板名称'}).fill('跨栏目草稿');await nav('其他设置');assert(await toggle.isChecked(),'switch draft lost');assert(await input.inputValue()==='乙','target query lost');
   await d.getByRole('button',{name:'预览',exact:true}).click();assert(await input.isDisabled(),'preview target remains editable');for(const button of await bar.getByRole('button',{name:/^(移除|清空选择)/}).all())assert(await button.isDisabled(),'preview target removal remains enabled');await d.getByText('关闭 → 开启',{exact:true}).waitFor();assert(await actual.textContent()===before,'preview applied');
   await d.getByRole('button',{name:'返回',exact:true}).click();assert(!(await input.isDisabled()),'return did not unlock targets');await nav('模板编辑');assert(await d.getByRole('textbox',{name:'模板名称'}).inputValue()==='跨栏目草稿','template draft lost');
   await nav('其他设置');await d.getByRole('button',{name:'预览',exact:true}).click();await d.getByRole('button',{name:'确认',exact:true}).click();assert((await actual.textContent()).includes('合成对象乙：开启'),'confirmation did not apply');
   const layout=await d.locator('.template-settings-layout').evaluate(e=>{const p=e.parentElement,b=e.querySelector('.template-settings-targets').getBoundingClientRect(),f=e.querySelector('.template-settings-feature').getBoundingClientRect();return {columns:getComputedStyle(e).gridTemplateColumns.split(' ').length,width:p.clientWidth,stacked:b.bottom<=f.y+1,overflow:p.scrollWidth>p.clientWidth+1};});
   assert(layout.columns===(layout.width>=600?2:1),'object bar breakpoint');assert(!layout.overflow,'context horizontal overflow');if(layout.columns===1)assert(layout.stacked,'narrow object bar not above feature');const current=await rect();assert(current.every((n,i)=>Math.abs(n-frame[i])<1),'frame/footer moved');
   await page.keyboard.press('Escape');await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='打开模板工作区');
   await trigger.click();await nav('模板编辑');assert(await d.getByRole('textbox',{name:'模板名称'}).inputValue()==='跨栏目草稿','Escape discarded template draft');assert(await input.inputValue()==='乙','Escape discarded object context');await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
   const single=page.getByRole('button',{name:'设置合成对象甲'});await single.click();await d.getByText('当前对象：合成对象甲',{exact:true}).waitFor();assert(await d.getByRole('complementary').count()===0,'single has object bar');assert(await d.getByRole('combobox',{name:'目标对象'}).count()===0,'single has target search');assert(await d.getByRole('button',{name:'清空选择'}).count()===0,'single has clear selection');
   await nav('其他设置');assert(await toggle.isChecked(),'single current value wrong');await toggle.press('Space');await d.getByRole('button',{name:'预览',exact:true}).click();assert(await d.getByText('合成对象乙',{exact:true}).count()===0,'single preview includes another target');await d.getByRole('button',{name:'确认',exact:true}).click();assert((await actual.textContent()).includes('合成对象甲：关闭'),'single confirmation wrong');assert((await actual.textContent()).includes('合成对象乙：开启'),'single changed other target');
   assert(!(await d.locator('.rhine-dialog__settings-content').evaluate(e=>e.scrollWidth>e.clientWidth+1)),'single overflow');await page.keyboard.press('Escape');await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='设置合成对象甲');
   results.push({...c,pass:true,layout});
  }catch(error){results.push({...c,pass:false,error:String(error)});}
 }
 return {pass:results.every(r=>r.pass)&&!errors.length,results,errors};
}
