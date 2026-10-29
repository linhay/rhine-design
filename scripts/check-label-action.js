// Run against the built gallery or a fresh installed-tarball fixture.
async page => {
  const probe = page.url().includes('probe=clip');
  const base = page.url().split('?')[0].split('#')[0];
  const label = '可授权的合成目录对象与跨团队长期协作计划', actionName = '获取候选目录与最新可用对象';
  const rows = [], failures = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const focused = el => el.evaluate(node => node === document.activeElement);
  const run = async (context, fn) => { try { rows.push({ ...context, status: 'PASS', evidence: await fn() }); } catch(e) { failures.push({ ...context, error: String(e) }); } };
  const open = async (theme, width, zoom, motion = 'normal') => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: motion === 'system' ? 'reduce' : 'no-preference' });
    await page.goto(`${base}?fixture=label-action&theme=${theme}&zoom=${zoom}&motion=${motion === 'manual' ? 'reduced' : 'system'}`);
  };
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880]) for (const zoom of [1,2]) await run({ theme, width, zoom, kind:'layout-keyboard' }, async () => {
    await open(theme,width,zoom);
    const input=page.getByRole('combobox',{name:label,exact:true}), action=page.getByRole('button',{name:actionName,exact:true});
    await action.scrollIntoViewIfNeeded();
    if (probe) await page.addStyleTag({content:'.rhine-combobox__label-action .rhine-button { white-space:nowrap!important; width:60px!important; overflow:hidden!important; }'});
    const geometry=await action.evaluate(button=>{
      const heading=button.closest('.rhine-combobox__heading'), label=heading.querySelector('label'), root=heading.closest('.rhine-combobox');
      const rect=button.getBoundingClientRect(), h=heading.getBoundingClientRect(), r=root.getBoundingClientRect();
      const textRects=el=>{ const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom})); };
      return {button:{width:rect.width,height:rect.height,left:rect.left,right:rect.right},heading:{left:h.left,right:h.right},root:{left:r.left,right:r.right},label:textRects(label),text:textRects(button.querySelector('span')),viewport:innerWidth};
    });
    assert(geometry.button.width>=44*zoom-1&&geometry.button.height>=44*zoom-1,'44px target');
    assert(geometry.root.left>=-1&&geometry.root.right<=width+1,'field overflow');
    assert(geometry.label.every(r=>r.left>=geometry.root.left-1&&r.right<=geometry.root.right+1),'label text clipping');
    assert(geometry.text.every(r=>r.left>=geometry.button.left-1&&r.right<=geometry.button.right+1),'action text clipping');
    await input.click(); await input.press('Shift+Tab');
    assert(await focused(action),'open input ShiftTab did not reach title action');
    await page.waitForTimeout(100); assert(await focused(action),'late close stole title focus');
    assert(await input.getAttribute('aria-expanded')==='false','title focus did not close candidates');
    await action.press('Tab'); assert(await focused(input),'title Tab did not return input');
    await input.press('Tab'); const done=page.getByRole('button',{name:'完成选择',exact:true});
    assert(await focused(done),'input Tab completion'); await done.press('Shift+Tab'); await input.press('Shift+Tab'); assert(await focused(action),'completion reverse path');
    await input.click(); await action.click(); await page.getByRole('status',{name:'目录获取结果'}).filter({hasText:'目录已更新'}).waitFor();
    assert(await focused(action),'click action lost focus'); assert(await input.getAttribute('aria-expanded')==='false','click action opened input');
    assert(await page.getByRole('list',{name:`${label}已选项`}).textContent()==='合成目录对象 1×','fetch modified selection');
    assert(await page.getByLabel('目录对象草稿',{exact:true}).inputValue()==='保留的合成草稿','fetch modified draft');
    await input.click(); await input.press('Tab'); const more=page.getByRole('button',{name:'加载更多',exact:true}); assert(await focused(more),'pagination order');
    await more.press('Shift+Tab'); await input.press('Shift+Tab'); assert(await focused(action),'pagination reverse action');
    await page.getByRole('button',{name:'打开目录工作区',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'目录配置工作区',exact:true}), nestedInput=dialog.getByRole('combobox',{name:label,exact:true}), nestedAction=dialog.getByRole('button',{name:actionName,exact:true});
    await nestedInput.click(); await nestedInput.press('Shift+Tab'); assert(await focused(nestedAction),'dialog reverse action');
    await page.waitForTimeout(100); assert(await focused(nestedAction),'dialog delayed focus');
    await nestedInput.click(); await page.getByRole('button',{name:'完成选择',exact:true}).click(); await nestedInput.click();
    assert(await nestedInput.getAttribute('aria-expanded')==='true','rapid reopen');
    await nestedInput.press('Shift+Tab'); await nestedAction.press('Enter');
    await dialog.getByRole('status',{name:'目录获取结果'}).filter({hasText:'目录已更新'}).waitFor(); assert(await focused(nestedAction),'dialog action stole focus');
    await dialog.getByRole('button',{name:'检查草稿',exact:true}).click(); const child=page.getByRole('dialog',{name:'检查目录草稿',exact:true}); await child.waitFor();
    await child.getByRole('button',{name:'继续检查',exact:true}).press('Escape'); await child.waitFor({state:'hidden'});
    await page.waitForFunction(() => document.activeElement?.textContent === '检查草稿');
    assert(await focused(dialog.getByRole('button',{name:'检查草稿',exact:true})),'nested dialog return focus');
    return geometry;
  });
  for (const theme of (probe ? [] : ['rhine','arknights','neo-brutalism'])) for (const motion of ['normal','system','manual']) await run({theme,motion,kind:'async'},async()=>{
    await open(theme,400,1,motion);
    const action=page.locator('.rhine-combobox__label-action button'), result=page.getByRole('status',{name:'目录获取结果'}), scenario=page.getByLabel('目录响应',{exact:true}), draft=page.getByLabel('目录对象草稿',{exact:true});
    const selected=page.getByRole('list',{name:`${label}已选项`}), initial=await selected.textContent();
    await draft.fill('独立编辑草稿'); await scenario.selectOption('failure'); await action.click();
    assert(await action.getAttribute('aria-busy')==='true','busy absent');
    const animation = await action.locator('.rhine-spinner').evaluate(el => getComputedStyle(el).animationName);
    assert(motion === 'normal' ? animation !== 'none' : animation === 'none', 'motion preference');
    await result.filter({hasText:'获取失败'}).waitFor(); assert(await selected.textContent()===initial,'failure selection');
    await action.click(); await result.filter({hasText:'目录已更新'}).waitFor();
    await scenario.selectOption('empty'); await action.click(); await result.filter({hasText:'目录为空'}).waitFor();
    assert(await selected.textContent()===initial&&await draft.inputValue()==='独立编辑草稿','empty lost draft');
    await scenario.selectOption('late'); await action.click(); assert(await action.getAttribute('aria-busy')==='true','late pending precondition');
    await page.getByRole('button',{name:'取消获取目录',exact:true}).click(); await page.waitForTimeout(1400); assert((await result.textContent()).startsWith('已取消获取'),'cancelled response applied');
    await action.click(); await scenario.selectOption('empty'); await action.click(); await result.filter({hasText:'目录为空'}).waitFor(); await page.waitForTimeout(900);
    assert((await result.textContent()).startsWith('目录为空'),'older result replaced retry');
    for(const name of ['禁用目录字段','只读目录字段']){await page.getByLabel(name,{exact:true}).check();assert(await action.isDisabled(),'host action lock');await page.getByLabel(name,{exact:true}).uncheck();}
    await action.click(); await page.getByLabel('挂载目录示例',{exact:true}).uncheck(); await page.waitForTimeout(1400); await page.getByLabel('挂载目录示例',{exact:true}).check();
    assert(await draft.inputValue()==='保留的合成草稿','unmount response changed new draft');
    await page.getByRole('button',{name:'显式提交合成表单',exact:true}).click(); assert(await result.textContent()==='表单已显式提交','explicit submission');
    return {selectionPreserved:true,draftPreserved:true,animation};
  });
  return {pass:failures.length===0&&errors.length===0,rows,failures,errors};
}
