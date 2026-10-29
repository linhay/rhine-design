// Saved templates and targets belong to this synthetic host, never the library component.
async page => {
 page.setDefaultTimeout(7000);
 const base=new URL('./',page.url()).href.replace(/\/$/,''),results=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880,1280])for(const zoom of [1,2]){
  const c={theme,width,zoom};
  try{
   await page.setViewportSize({width,height:648});await page.goto(`${base}/?fixture=template-settings&theme=${theme}&zoom=${zoom}`);
   const trigger=page.getByRole('button',{name:'打开模板工作区'});await trigger.click();const d=page.getByRole('dialog',{name:'模板配置'});
   const actual=page.locator('[aria-label="已应用目标状态"]'), original=await actual.textContent();
   const nav=async name=>{await d.getByRole('link',{name,exact:true}).click();};
   await d.getByRole('combobox',{name:'已保存模板'}).selectOption('basic');
   assert(await d.getByRole('group',{name:'已保存模板规则'}).locator('select,button').count()===0,'apply page exposes rule editing');
   for(const name of ['合成对象甲','合成对象乙','合成对象丙']){await d.getByRole('combobox',{name:'目标对象'}).fill(name);await page.getByRole('option',{name,exact:true}).click();}await page.getByRole('button',{name:'完成选择'}).click();
   await d.getByRole('button',{name:'预览',exact:true}).click();await d.getByText('规则 0 → 1 条',{exact:true}).waitFor();await d.getByText('不变',{exact:true}).waitFor();await d.getByText('跳过：此对象不可编辑',{exact:true}).waitFor();assert(await actual.textContent()===original,'preview applied changes');
   await d.getByRole('button',{name:'返回',exact:true}).click();await nav('模板编辑');await d.getByRole('textbox',{name:'模板名称'}).fill('改名模板');
   await d.getByRole('combobox',{name:'第1行 目标'}).selectOption('option-3');await d.getByRole('button',{name:'保存',exact:true}).click();
   assert(await d.getByRole('combobox',{name:'第1行 来源'}).isDisabled(),'saving does not lock editor');await d.getByText('模板已更新，原选择已失效，请重新选择版本').waitFor();
   assert(await actual.textContent()===original,'template save applied targets');await nav('应用配置');assert(await d.getByRole('combobox',{name:'已保存模板'}).inputValue()==='','stale selected version');
   await d.getByRole('combobox',{name:'已保存模板'}).selectOption('basic');await nav('其他设置');await d.getByRole('switch',{name:'启用调度'}).check();await d.getByRole('button',{name:'预览',exact:true}).click();
   await d.getByText('替换 合成选项 1：合成选项 2 → 合成选项 3',{exact:true}).waitFor();
   assert((await d.textContent()).includes('关闭 → 开启'),'missing per-target boolean difference');assert(await actual.textContent()===original,'intent prematurely applied');await d.getByRole('button',{name:'确认',exact:true}).click();
   assert((await actual.textContent()).includes('合成对象乙：开启，1条规则'),'apply did not update target');assert((await actual.textContent()).includes('合成对象丙：开启，0条规则'),'skip mutated target');
   await nav('其他设置');await d.getByRole('switch',{name:'启用调度'}).uncheck();await d.getByRole('button',{name:'预览',exact:true}).click();await d.getByRole('button',{name:'确认',exact:true}).click();assert((await actual.textContent()).includes('合成对象甲：关闭，1条规则'),'all off intent failed');
   await nav('模板编辑');await d.getByRole('button',{name:'新建模板'}).click();await d.getByRole('textbox',{name:'模板名称'}).fill('改名模板');await d.getByRole('button',{name:'保存',exact:true}).click();await d.getByText('模板名称重复',{exact:true}).waitFor();
   await d.getByRole('textbox',{name:'模板名称'}).fill('新空模板');await d.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('checkbox',{name:'模拟模板保存失败'}).check();await trigger.click();
   assert(await d.getByRole('textbox',{name:'模板名称'}).inputValue()==='新空模板','close lost host draft');await d.getByRole('button',{name:'保存',exact:true}).click();await d.getByText('保存失败，草稿已保留，请重试',{exact:true}).waitFor();
   await d.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('checkbox',{name:'模拟模板保存失败'}).uncheck();await trigger.click();await d.getByRole('button',{name:'保存',exact:true}).click();await d.getByText('模板已保存，目标对象未改变',{exact:true}).waitFor();
   await nav('应用配置');await d.getByRole('combobox',{name:'已保存模板'}).selectOption({label:'新空模板 · v1'});await d.getByText('空模板：应用后清空规则',{exact:true}).waitFor();
   await nav('其他设置');assert(!(await d.getByRole('switch',{name:'启用调度'}).isChecked()),'applied value not reflected');await d.getByRole('button',{name:'预览',exact:true}).click();assert((await d.textContent()).includes('规则 1 → 0 条'),'empty template not shown as clearing');await d.getByRole('button',{name:'确认',exact:true}).click();assert((await actual.textContent()).includes('合成对象甲：关闭，0条规则'),'empty template apply failed');
   // Host-supplied duplicate and missing-target errors, with source option disabling.
   await d.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('button',{name:'载入重复来源与空目标'}).click();await trigger.click();await d.getByText('请选择目标',{exact:true}).waitFor();await d.getByText('来源重复，请选择不同来源',{exact:true}).waitFor();
   await d.getByRole('button',{name:'删除第2行',exact:true}).click();await d.getByRole('button',{name:'删除第1行',exact:true}).click();assert(await d.getByRole('button',{name:'添加规则'}).evaluate(e=>e===document.activeElement),'empty list did not return focus to add');await d.getByText('模板暂无规则',{exact:true}).waitFor();
   await page.keyboard.press('Escape');await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='打开模板工作区');
   await page.getByRole('group',{name:'宿主焦点交接规则'}).getByRole('button',{name:'删除第1行',exact:true}).click();assert(await page.getByRole('textbox',{name:'宿主删除后确认'}).evaluate(e=>e===document.activeElement),'component stole host focus after deletion');
   results.push({...c,pass:true});
  }catch(error){results.push({...c,pass:false,error:String(error)});}
 }
 return {pass:results.every(r=>r.pass)&&!errors.length,results,errors};
}
