async page => {
  const base=await page.evaluate(()=>location.origin+location.pathname), results=[], errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(pass,n)=>{if(!pass)throw Error(n);};
  const root=()=>page.getByRole('region',{name:'设置与数据列表 · 布局密度对照',exact:true});
  const density=()=>root().getByRole('combobox',{name:'对照布局',exact:true});
  const form=()=>root().getByRole('form',{name:'工作区设置表单',exact:true});
  const table=()=>root().getByRole('table',{name:'同步记录表',exact:true});
  const filter=()=>root().getByRole('combobox',{name:'按状态筛选',exact:true});
  const go=async(width,theme,zoom,motion)=>{
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion==='reduce'?'reduce':'no-preference'});
    await page.goto(base+'?theme='+theme+'&density='+[width,theme,zoom,motion].join('-')+'#spacing');
    await root().waitFor();
    await page.evaluate(factor=>{document.documentElement.style.zoom=String(factor);},zoom);
    await page.evaluate(()=>document.fonts.ready);
  };
  const measure=()=>root().evaluate(node=>{
    const settings=node.querySelector('[aria-label="工作区设置表单"]');
    const shell=node.querySelector('[data-density-table-surface]');
    const scroll=shell.querySelector('[role=region]');
    const fit=e=>e.scrollWidth<=e.clientWidth+2;
    const controls=[...node.querySelectorAll('button,select,input:not([type=checkbox]),label:has(input[type=checkbox])')];
    const box=e=>[e.offsetWidth,e.offsetHeight];
    const style=e=>{const css=getComputedStyle(e);return [css.fontSize,css.lineHeight,css.fontWeight];};
    const settingsGroups=[...settings.querySelectorAll('[data-boxed]')];
    return {pageFits:fit(document.documentElement),mainFits:fit(node.closest('main')),comparisonFits:fit(node),settingsFits:fit(settings),scrollFitsSurface:scroll.offsetWidth<=shell.clientWidth+2,
      settingsHeight:settings.offsetHeight,formText:settings.textContent,tableText:shell.textContent,frames:settingsGroups.filter(n=>parseFloat(getComputedStyle(n).borderTopWidth)>0).length,
      tablePadding:getComputedStyle(shell).paddingInlineStart,tableWidth:scroll.clientWidth,tableLocalOverflow:!fit(scroll),
      visibleTargets:controls.filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label')||e.textContent||e.tagName,box:box(e),style:style(e)}))};
  });
  for(const [width,theme,zoom,motion] of [[1280,'rhine',1,'default'],[880,'graphite',1,'default'],[520,'neutral',1,'reduce'],[400,'rhine',1,'default'],[880,'rhine',2,'reduce']]){
    await go(width,theme,zoom,motion);const key=[width,theme,zoom,motion].join('/');
    assert(await density().inputValue()==='grouped','B is the initial layout '+key);
    const b=await measure();await density().selectOption('framed');const a=await measure();
    assert([a,b].every(x=>x.pageFits&&x.mainFits&&x.comparisonFits&&x.settingsFits&&x.scrollFitsSurface),'overflow '+key);
    assert(a.formText===b.formText&&a.tableText===b.tableText,'same content '+key);
    assert(a.frames===2&&b.frames===0&&a.settingsHeight>b.settingsHeight,'settings density '+key);
    assert(a.tablePadding==='24px'&&b.tablePadding==='0px'&&b.tableWidth>a.tableWidth,'table outer spacing '+key);
    assert(JSON.stringify(a.visibleTargets.map(t=>t.style))===JSON.stringify(b.visibleTargets.map(t=>t.style)),'typography unchanged '+key);
    assert([a,b].every(x=>x.visibleTargets.every(t=>t.box[0]>=44&&t.box[1]>=44)), '44px targets '+key);
    if(width===400)assert(a.tableLocalOverflow&&b.tableLocalOverflow,'narrow table scroll stays local');
    results.push({kind:'layout',key,a:{settingsHeight:a.settingsHeight,frames:a.frames,tableWidth:a.tableWidth,tablePadding:a.tablePadding},b:{settingsHeight:b.settingsHeight,frames:b.frames,tableWidth:b.tableWidth,tablePadding:b.tablePadding,localTableScroll:b.tableLocalOverflow},targets:b.visibleTargets.length});
  }
  for(const [width,motion] of [[1280,'default'],[400,'reduce']]){
    await go(width,'rhine',1,motion);
    const name=form().getByRole('textbox',{name:'工作区名称',exact:true}), saved=form().getByRole('button',{name:'保存设置',exact:true});
    const checkbox=form().getByRole('checkbox',{name:'通知中包含最终失败的记录',exact:true});
    const time=form().getByRole('combobox',{name:'显示时区',exact:true});
    await name.fill('未保存的协作配置');await time.selectOption('utc');await checkbox.uncheck();
    await table().getByRole('checkbox',{name:'选择每日同步记录',exact:true}).check();
    await filter().selectOption('待复核');
    const stable=await name.elementHandle();
    await density().focus();await density().selectOption('framed');
    assert(await density().evaluate(n=>n===document.activeElement),'layout switch retains caller focus '+width);
    assert(await stable.evaluate(n=>n===document.getElementById(n.id)),'form input is not remounted '+width);
    assert(await name.inputValue()==='未保存的协作配置'&&await time.inputValue()==='utc'&&!await checkbox.isChecked(),'keeps draft and checkbox '+width);
    assert(await root().getByText('显示 1 条 · 已选 1 条（含其他状态）',{exact:true}).count()===1,'keeps filter and hidden selection '+width);
    await name.fill('');await saved.press('Enter');
    await form().getByRole('alert').waitFor();
    assert(await name.evaluate(n=>n===document.activeElement)&&await name.getAttribute('aria-invalid')==='true','invalid fields keep visible focus '+width);
    await density().selectOption('grouped');
    assert(await form().getByRole('alert').count()===1&&await name.inputValue()==='','switch retains draft error '+width);
    await name.fill('已保存的新名称');await saved.press('Enter');
    await form().getByText('已保存到本地演示。',{exact:true}).waitFor();
    await name.fill('临时名');await form().getByRole('button',{name:'撤销修改',exact:true}).press('Enter');
    assert(await name.inputValue()==='已保存的新名称'&&await form().getByRole('alert').count()===0,'save/revert stable '+width);
    const action=table().getByRole('button',{name:'查看详情：跨部门协作与访问权限核对',exact:true});
    await action.press('Enter');
    const dialog=page.getByRole('dialog',{name:'记录详情：跨部门协作与访问权限核对',exact:true});
    await dialog.waitFor();assert(await dialog.getByText('42',{exact:true}).count()===1,'detail shows same row '+width);
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='查看详情：跨部门协作与访问权限核对');
    assert(await filter().inputValue()==='待复核','closing detail preserves filter '+width);
    await filter().selectOption('all');assert(await table().getByRole('checkbox',{name:'选择每日同步记录',exact:true}).isChecked(),'restores filtered selection '+width);
    results.push({kind:'flow',width,motion,keys:'draft, validation, save/revert, filter, selection, detail, return focus'});
  }
  assert(!errors.length,errors.join('; '));
  await page.locator('body').evaluate((n,proof)=>n.dataset.densityProof=JSON.stringify({pass:true,results:proof,errors:[]}),results);
}
