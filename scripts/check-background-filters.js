// Run against a fixed production preview on 18484 with playwright-cli run-code --filename.
async page => {
  const errors=[],failures=[]; let filterCases=0,orbitCases=0;
  page.on('pageerror',e=>errors.push(String(e)));
  const check=(ok,detail)=>{if(!ok) failures.push(detail);};
  const horizontal=async root=>root.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&e.scrollWidth<=e.clientWidth+1;});
  for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520,880]) for(const zoom of [1,2]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:18484/?fixture=list-filters&theme=${theme}&zoom=${zoom}`);
    const bars=page.locator('.rhine-list-filter-bar');
    for(let i=0;i<3;i++) {
      const bar=bars.nth(i), trigger=bar.getByRole('button',{name:/^更多筛选/});
      check(await bar.getByRole('combobox').count()===2,{theme,width,zoom,i,kind:'primary-limit'});
      await trigger.click(); const dialog=page.getByRole('dialog');
      await dialog.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
      check(await horizontal(dialog),{theme,width,zoom,i,kind:'drawer-overflow'});
      if(i<2) await dialog.getByRole('checkbox',{name:'只看已审查'}).check();
      else await dialog.getByRole('combobox',{name:'统计范围'}).selectOption({label:'示例团队 / 跨部门体验与可访问性协作小组'});
      await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
      await page.waitForFunction(e=>e===document.activeElement,await trigger.elementHandle());
      check(await trigger.evaluate(e=>e===document.activeElement),{theme,width,zoom,i,kind:'return-focus'});
      check(await horizontal(bar),{theme,width,zoom,i,kind:'summary-overflow'});
      const chip=bar.getByRole('button',{name:/^清除/}).first(); await chip.click();
      check(await bar.evaluate(e=>e.contains(document.activeElement)),{theme,width,zoom,i,kind:'clear-focus'});
      await page.getByRole('combobox',{name:'示例状态'}).selectOption('loading');
      await trigger.click();
      check(await dialog.getByRole('status').textContent().then(t=>t.includes('正在更新结果')),{theme,width,zoom,i,kind:'pending'});
      await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
      await page.getByRole('combobox',{name:'示例状态'}).selectOption('error');
      await trigger.click(); check(await dialog.getByText('未能更新结果',{exact:true}).isVisible(),{theme,width,zoom,i,kind:'error'});
      await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'});
      await page.getByRole('combobox',{name:'示例状态'}).selectOption('empty');
      check(await bar.getByRole('status').textContent().then(t=>/0 条|无用量/.test(t)),{theme,width,zoom,i,kind:'empty'});
      await page.getByRole('combobox',{name:'示例状态'}).selectOption('disabled');
      check(await bar.getByRole('button',{name:'刷新',exact:true}).isDisabled(),{theme,width,zoom,i,kind:'disabled'});
      await page.getByRole('combobox',{name:'示例状态'}).selectOption('normal');
      filterCases++;
    }
  }
  for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520,880,1280]) for(const zoom of [1,2]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`http://127.0.0.1:18484/?fixture=orbit-entry&theme=${theme}&zoom=${zoom}`);
    const input=page.getByRole('textbox',{name:'示例昵称'}); await input.fill('保留草稿');
    const handle=await input.elementHandle();
    const canvas=await page.locator('.rhine-orbit canvas').first().elementHandle();
    const layout=await page.locator('.ds-orbit-entry').evaluate(e=>{
      const r=e.getBoundingClientRect(), bg=e.querySelector('.rhine-orbit'), c=bg.querySelector('canvas').getBoundingClientRect(), intro=e.querySelector('.ds-orbit-entry-intro').getBoundingClientRect(), form=e.querySelector('.ds-orbit-entry-form');
      return {inside:r.left>=0&&r.right<=innerWidth+1,clear:intro.bottom<=c.top,formClear:getComputedStyle(form).backgroundColor!=='rgba(0, 0, 0, 0)',noControl:!bg.querySelector('button'),noFrame:getComputedStyle(bg).borderTopWidth==='0px'&&getComputedStyle(bg).boxShadow==='none',full:Math.abs(bg.getBoundingClientRect().width-r.width)<2, narrow:e.parentElement.clientWidth<=760};
    });
    check(layout.inside&&layout.clear&&layout.formClear&&layout.noControl&&layout.noFrame&&layout.full===layout.narrow,{theme,width,zoom,kind:'orbit-layout',layout});
    await page.getByRole('combobox',{name:'验收主题'}).selectOption(theme==='rhine'?'arknights':'rhine');
    await page.setViewportSize({width:width+80,height:1000});
    check(await handle.evaluate(e=>e.isConnected&&e.value==='保留草稿')&&await canvas.evaluate(e=>e.isConnected),{theme,width,zoom,kind:'stable-nodes'});
    orbitCases++;
  }
  return {pass:!failures.length&&!errors.length,filterCases,orbitCases,failures,errors};
}
