// First run: npm run build && npx vite preview --host 127.0.0.1 --port 18480 --strictPort
// Fixed regression port 18480 differs from npm run dev (18309).
// playwright-cli run-code --filename scripts/check-settings-theme.js (preview on port 18480).
async page => {
  const errors = [], failures = [];
  page.on('pageerror', error => errors.push(String(error)));
  const box = async locator => locator.evaluate(e => { const r = e.getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom, w:innerWidth, h:innerHeight }; });
  const inside = r => r.x >= -1 && r.y >= -1 && r.right <= r.w + 1 && r.bottom <= r.h + 1;
  let settingsCases = 0, themeCases = 0;
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880,1440]) for (const zoom of [1,2]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:18480/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}`);
    const url = page.url();
    const host = page.getByRole('textbox',{name:'宿主查询'});
    await host.fill('查询保留');
    await page.getByRole('button',{name:'打开设置',exact:true}).click();
    const outer = page.getByRole('dialog',{name:'设置',exact:true});
    const outerBounds = await box(outer);
    const help = outer.getByRole('button',{name:'设置帮助',exact:true});
    await help.focus(); await page.getByRole('tooltip').waitFor();
    await page.keyboard.press('Escape'); await page.getByRole('tooltip').waitFor({state:'detached'});
    if (!await outer.isVisible()) throw new Error('Tooltip Escape closed the settings dialog');
    await outer.getByRole('textbox',{name:'工作区名称'}).fill('已保存草稿');
    const save = outer.getByRole('button',{name:'保存设置',exact:true});
    await save.scrollIntoViewIfNeeded(); const saveBounds=await box(save); await save.click();
    await outer.getByRole('status').getByText('已保存演示草稿').waitFor();
    await outer.getByRole('link',{name:'用户管理与权限',exact:true}).click();
    const edit = outer.getByRole('button',{name:'编辑成员 12',exact:true});
    await edit.click();
    const inner=page.getByRole('dialog',{name:'编辑成员 12',exact:true});
    await inner.waitFor(); const innerBounds=await box(inner);
    await inner.getByRole('textbox',{name:'成员备注'}).fill('临时备注');
    await page.keyboard.press('Escape');
    await inner.waitFor({state:'detached'});
    await page.waitForFunction(()=>document.activeElement?.textContent==='编辑成员 12');
    const outerOpen=await outer.isVisible();
    await page.keyboard.press('Tab');
    const trapped=await outer.evaluate(e=>e.contains(document.activeElement));
    await outer.getByRole('link',{name:'公开项目',exact:true}).click();
    for (const state of ['loading','error','empty','normal']) await outer.getByRole('combobox',{name:'项目状态'}).selectOption(state);
    const close=outer.getByRole('button',{name:'关闭对话框',exact:true});
    await close.scrollIntoViewIfNeeded(); const closeBounds=await box(close); await close.click();
    await page.waitForFunction(()=>document.activeElement?.textContent==='打开设置');
    const pass=[outerBounds,saveBounds,innerBounds,closeBounds].every(inside)&&outerOpen&&trapped&&page.url()===url&&await host.inputValue()==='查询保留';
    if(!pass) failures.push({kind:'settings',theme,width,zoom,outerBounds,saveBounds,innerBounds,closeBounds,outerOpen,trapped});
    settingsCases++;
  }
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [390,400,520,880,889,1440]) for (const zoom of [1,2]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`http://127.0.0.1:18480/?fixture=theme-picker&theme=${theme}&zoom=${zoom}`);
    const draft=page.getByRole('textbox',{name:'未保存草稿',exact:true}); await draft.fill('保留原始输入节点');
    const handle=await draft.elementHandle();
    await page.waitForFunction(()=>[...document.querySelectorAll('.rhine-theme-preview img')].every(e=>e.complete&&e.naturalWidth===960));
    const srcs=await page.locator('.rhine-theme-preview img').evaluateAll(es=>es.map(e=>e.currentSrc));
    for (const name of ['莱茵 · 纸面','明日方舟 · 战术终端','橙趣 · 粗描边']) {
      const radio=page.getByRole('radio',{name,exact:true});
      await page.locator('label.rhine-theme-option').filter({has:radio}).click();
      if(!await radio.isChecked()) failures.push({kind:'theme-selection',theme,width,zoom,name});
    }
    await page.getByRole('checkbox',{name:'长主题名称',exact:true}).check();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    const cards=await page.locator('.rhine-theme-option').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,width:innerWidth,height:r.height};}));
    const stable=await handle.evaluate(e=>e.isConnected&&e.value==='保留原始输入节点');
    const srcsAfter=await page.locator('.rhine-theme-preview img').evaluateAll(es=>es.map(e=>e.currentSrc));
    await page.getByRole('button',{name:'弹窗内切换主题',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'外观设置',exact:true});
    const innerDraft=dialog.getByRole('textbox',{name:'弹窗草稿',exact:true}); await innerDraft.fill('继续编辑，不关闭');
    const innerHandle=await innerDraft.elementHandle();
    const radio=dialog.getByRole('radio',{name:'莱茵 · 纸面',exact:true});
    await dialog.locator('label.rhine-theme-option').filter({has:page.getByRole('radio',{name:'莱茵 · 纸面',exact:true})}).click();
    await radio.focus(); await page.keyboard.press('ArrowRight');
    const keyboard=await dialog.getByRole('radio',{name:'明日方舟 · 战术终端',exact:true}).isChecked();
    const dialogStable=await innerHandle.evaluate(e=>e.isConnected&&e.value==='继续编辑，不关闭');
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'detached'});
    await page.getByRole('checkbox',{name:'模拟预览失败',exact:true}).check();
    await page.waitForFunction(()=>document.querySelectorAll('.rhine-theme-preview[data-state=error]').length===3);
    const fallback=page.getByRole('radio',{name:/橙趣/});
    await page.locator('label.rhine-theme-option').filter({has:fallback}).click();
    const fallbackSelectable=await fallback.isChecked();
    await page.getByRole('checkbox',{name:'禁用主题选择',exact:true}).check();
    const disabled=await page.getByRole('radio').evaluateAll(es=>es.every(e=>e.matches(':disabled')));
    const pass=!overflow&&cards.every(r=>r.x>=-1&&r.right<=r.width+1&&r.height>=44)&&stable&&JSON.stringify(srcs)===JSON.stringify(srcsAfter)&&keyboard&&dialogStable&&fallbackSelectable&&disabled;
    if(!pass) failures.push({kind:'theme',theme,width,zoom,overflow,cards,stable,keyboard,dialogStable,fallbackSelectable,disabled});
    themeCases++;
  }
  return {pass:failures.length===0&&errors.length===0,settingsCases,themeCases,failures,errors};
}
