// Open the built gallery first; run via Playwright run-code --filename.
async page => {
  const origin = new URL(page.url()).origin, rows = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  for (const theme of ['rhine', 'arknights', 'neo-brutalism']) for (const width of [400, 520, 880]) for (const zoom of [1, 2]) {
    await page.setViewportSize({width,height:1000});
    await page.emulateMedia({reducedMotion: zoom === 2 ? 'reduce' : 'no-preference'});
    await page.goto(`${origin}/?fixture=remote-selection&theme=${theme}&zoom=${zoom}&motion=${zoom === 2 ? 'reduced' : 'system'}`);
    await page.getByText('5 个候选项',{exact:true}).waitFor();
    const input=page.getByRole('combobox',{name:'合成授权对象',exact:true});
    const first=page.getByRole('button',{name:/^合成人员 1 ·/}), second=page.getByRole('button',{name:'合成人员 2',exact:true});
    const draft=page.getByLabel('当前对象草稿',{exact:true});
    await draft.fill('合成草稿 A'); await second.press('Space');
    assert(await draft.inputValue()==='', 'activation leaked draft'); await draft.fill('合成草稿 B'); await first.press('Enter');
    assert(await draft.inputValue()==='合成草稿 A','draft lost'); assert(await first.getAttribute('aria-pressed')==='true','missing active state');
    assert(await page.getByRole('listbox').count()===0,'activation opened dropdown');
    await page.getByRole('button',{name:'展开已选项',exact:true}).click();
    await page.getByRole('button',{name:'合成人员 3',exact:true}).click();
    await page.getByRole('button',{name:'移除合成人员 3',exact:true}).click();
    assert(await first.getAttribute('aria-pressed')==='true','host fallback failed');
    assert(await page.getByRole('listbox').count()===0,'remove opened dropdown');
    await page.getByLabel('只读选择器',{exact:true}).check(); await second.click();
    assert(await draft.inputValue()==='合成草稿 B','read-only activation failed');
    assert(!await page.getByRole('button',{name:'移除合成人员 2',exact:true}).isEnabled(),'read-only removal enabled');
    await page.getByLabel('只读选择器',{exact:true}).uncheck();
    await page.getByLabel('禁用选择器',{exact:true}).check(); assert(!await second.isEnabled(),'disabled activation enabled');
    await page.getByLabel('禁用选择器',{exact:true}).uncheck(); await page.getByText('5 个候选项',{exact:true}).waitFor();
    await input.click(); await input.press('Tab');
    let more=page.getByRole('button',{name:'加载更多',exact:true}), done=page.getByRole('button',{name:'完成选择',exact:true});
    assert(await more.evaluate(el=>el===document.activeElement),'input→more');
    await more.press('Tab'); assert(await done.evaluate(el=>el===document.activeElement),'more→done');
    await done.press('Shift+Tab'); assert(await more.evaluate(el=>el===document.activeElement),'done→more');
    await more.press('Enter'); await page.getByRole('button',{name:'重试',exact:true}).waitFor();
    assert(await page.getByRole('listbox').getByRole('option').count()===5,'failure lost candidates');
    const retry=page.getByRole('button',{name:'重试',exact:true});
    assert(await retry.evaluate(el=>!el.closest('[role=listbox]')),'action in listbox');
    await retry.click(); await page.getByText('10 个候选项',{exact:true}).waitFor();
    await more.click(); await retry.waitFor(); await retry.click(); await page.getByText('12 个候选项',{exact:true}).waitFor();
    assert(await more.count()===0,'terminal more');
    await done.scrollIntoViewIfNeeded();
    const bounds=await done.evaluate(el=>{const p=el.closest('.rhine-combobox__list').getBoundingClientRect();return {left:p.left,right:p.right,top:p.top,bottom:p.bottom,width:innerWidth,height:innerHeight};});
    assert(bounds.left>=-1&&bounds.right<=bounds.width+1&&bounds.top>=-1&&bounds.bottom<=bounds.height+1,`popup bounds ${JSON.stringify({theme,width,zoom,bounds})}`);
    await done.click(); assert(await page.getByRole('listbox').count()===0,'completion did not close');
    await page.getByRole('button',{name:'弹窗分页',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'合成对象配置',exact:true}), nested=dialog.getByRole('combobox');
    await dialog.getByText('5 个候选项',{exact:true}).waitFor(); await nested.click(); await nested.press('Tab'); await more.press('Tab');
    assert(await done.evaluate(el=>el===document.activeElement),'Radix double Tab');
    await done.press('Escape'); assert(await dialog.isVisible(),'Escape closed host');
    await page.waitForFunction(id => document.activeElement?.id === id, await nested.getAttribute('id'));
    assert(await nested.evaluate(el=>el===document.activeElement),'Escape lost focus');
    // A Tab exit must not leave restoration state that steals a later outside click.
    await nested.click(); await nested.press('Tab'); await more.press('Tab'); await done.press('Tab');
    await page.getByRole('listbox').waitFor({state:'hidden'});
    await nested.click();
    const otherField=dialog.getByLabel('当前对象草稿',{exact:true});
    await otherField.click(); await page.getByRole('listbox').waitFor({state:'hidden'});
    await page.waitForTimeout(100);
    assert(await otherField.evaluate(el=>el===document.activeElement),'Tab exit left stale focus restoration');
    await nested.click(); await nested.press('Escape');
    await nested.press('Escape'); await dialog.waitFor({state:'hidden'});
    rows.push({theme,width,zoom,status:'PASS'});
  }
  assert(errors.length===0,errors.join('\n'));
  return rows;
}
