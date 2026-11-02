async page => {
  page.setDefaultTimeout(5000);
  const base = new URL(page.url()).origin, probe = new URL(page.url()).searchParams.get('graphiteProbe');
  const rows = [], errors = [], motions = [];
  const onError = error => errors.push(String(error)); page.on('pageerror', onError);
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const cases = probe ? [{width:400,zoom:2,mode:'normal'}] : [400,520,880].flatMap(width=>[1,2].map(zoom=>({width,zoom,mode:'normal'}))).concat(['system','manual'].map(mode=>({width:880,zoom:1,mode})));
  for (const {width,zoom,mode} of cases) {
    try {
      await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
      await page.setViewportSize({width,height:900});
      await page.goto(`${base}/?fixture=graphite&zoom=${zoom}&motion=${mode}`);
      const field = page.getByRole('textbox',{name:'工作区名称',exact:true});
      const draft = '保留的合成草稿 · 长名称与中文 English 0123456789';
      await field.fill(draft); const original = await field.elementHandle();
      await page.getByRole('button',{name:'保存设置',exact:true}).click();
      assert(await field.getAttribute('aria-invalid') === 'true' && await field.inputValue() === draft,'error/draft missing');
      await page.getByRole('button',{name:'重试保存',exact:true}).click();
      assert(await page.getByText('示例已保存',{exact:true}).isVisible(),'retry failed');
      await page.getByRole('button',{name:'模拟等待',exact:true}).click();
      assert(await page.getByRole('button',{name:'等待保存',exact:true}).getAttribute('aria-busy') === 'true','busy missing');
      await page.getByRole('button',{name:'取消等待',exact:true}).click();
      assert(await page.getByRole('button',{name:'保存设置',exact:true}).getAttribute('aria-busy') !== 'true','cancel failed');
      assert(await page.getByRole('button',{name:'撤销已同步修改'}).isDisabled(),'disabled enabled');
      const reading = page.getByRole('checkbox',{name:'加入稍后阅读'});
      await reading.focus(); await page.keyboard.press('Space'); assert(await reading.isChecked(),'keyboard selection failed');
      const state = page.getByLabel('记录列表状态');
      await state.selectOption('loading'); assert(await page.locator('.rhine-data').getAttribute('aria-busy')==='true','loading missing');
      assert(await page.locator('.rhine-data tbody tr').count()===3,'refresh lost existing rows');
      await state.selectOption('error'); await page.getByRole('button',{name:'重试',exact:true}).click(); assert(await state.inputValue()==='normal','table retry failed');
      await state.selectOption('empty'); assert(await page.locator('.rhine-empty strong').isVisible(),'empty missing');
      await state.selectOption('normal');
      assert(await page.getByText('3 条记录',{exact:true}).isVisible(),'record count missing');
      const scroll = page.getByRole('region',{name:'合成研究记录，可横向滚动'});
      const bounds = await scroll.boundingBox(); assert(bounds.x>=0 && bounds.x+bounds.width<=width+1,'table outside viewport');
      const needsScroll = await scroll.evaluate(e=>e.scrollWidth>e.clientWidth+1);
      if (needsScroll) { await scroll.focus(); for(let n=0;n<30;n++)await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200); assert(await scroll.evaluate(e=>e.scrollLeft>0),'table keyboard scroll failed');
        const end=await scroll.locator('thead th').last().boundingBox(); assert(end.x+end.width<=bounds.x+bounds.width+1,'last table column unreachable'); }
      const trigger = page.getByRole('button',{name:'调整工作区外观'}); await trigger.click();
      const dialog=page.getByRole('dialog'), note=dialog.getByRole('textbox',{name:'外观备注'});
      await note.fill('浮层保留的草稿'); const originalDialog=await dialog.elementHandle();
      for(const label of ['莱茵 · 纸面','明日方舟 · 战术终端','橙趣 · 粗描边','中性 · 黑白轻量','石墨 · 夜间工作区']) {
        const radio = dialog.getByRole('radio',{name:label,exact:true});
        await radio.focus(); await page.keyboard.press('Space');
        assert(await radio.isChecked(),'theme keyboard request failed');
        assert(await originalDialog.evaluate(e=>e.isConnected) && await note.inputValue()==='浮层保留的草稿','dialog remounted/draft lost');
        assert(await radio.evaluate(e=>e===document.activeElement),'theme focus lost');
      }
      await page.waitForFunction(()=>[...document.querySelectorAll('[role=dialog] .rhine-theme-preview img')].every(e=>e.complete&&e.naturalWidth===960));
      const paint=await dialog.evaluate(e=>({background:getComputedStyle(e).backgroundColor,scheme:getComputedStyle(e).colorScheme}));
      assert(paint.background==='rgb(39, 46, 51)' && paint.scheme==='dark','graphite portal paint missing');
      const box=await dialog.boundingBox(); assert(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=901,'dialog bounds');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.textContent==='调整工作区外观');
      assert(await original.evaluate(e=>e.isConnected) && await field.inputValue()===draft,'workspace remounted/draft lost');
      if(probe==='focus')await page.addStyleTag({content:'.rhine-theme button:focus-visible {outline:none!important}'});
      const focus=await trigger.evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));
      assert(focus.style!=='none'&&focus.width>=2,'return focus outline missing');
      const target=await trigger.boundingBox();assert(target.width>=44*zoom&&target.height>=44*zoom,'action target below 44px');
      if(probe==='overflow')await page.addStyleTag({content:'.rhine-grid {min-width:900px!important}'});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document horizontal overflow');
      if(width===400&&zoom===2)await page.screenshot({path:'output/playwright/graphite-400-zoom2.png',fullPage:true});
      rows.push({width,zoom,mode,pass:true,needsScroll,paint});
    } catch(error) { rows.push({width,zoom,mode,pass:false,error:String(error)}); }
  }
  if(!probe)for(const mode of ['system','manual']) {
    await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
    await page.goto(`${base}/?fixture=graphite&motion=${mode}`);
    await page.getByRole('button',{name:'调整工作区外观'}).click();
    const dialog=page.getByRole('dialog');await dialog.waitFor();
    const paint=await dialog.evaluate(e=>({animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration}));
    motions.push({mode,...paint,pass:paint.animation==='none'&&paint.transition.split(',').every(v=>parseFloat(v)===0)});
    await page.keyboard.press('Escape');
  }
  const shell=[];
  if(!probe)for(const width of [400,520,880])for(const zoom of [1,2]) {
    try {
      await page.emulateMedia({reducedMotion:'no-preference'}); await page.setViewportSize({width,height:900});
      await page.goto(`${base}/?theme=graphite#graphite`); await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),zoom);
      const field=page.getByRole('textbox',{name:'工作区名称',exact:true});await field.fill('展台草稿');const node=await field.elementHandle();
      await page.getByLabel('界面主题',{exact:true}).selectOption('neutral');await page.getByLabel('界面主题',{exact:true}).selectOption('graphite');
      assert(await node.evaluate(e=>e.isConnected)&&await field.inputValue()==='展台草稿','shell theme remount');
      assert(await page.locator('.ds-workspace').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'workspace horizontal overflow');
      const textClips=[];
      // Real fragments, after scrolling into view; horizontally scrollable table is checked separately above.
      for(const text of await page.locator('.compact-gallery .rhine-text:not(.rhine-data .rhine-text), .compact-gallery .rhine-selection strong').all()) {
        await text.scrollIntoViewIfNeeded();
        const bad=await text.evaluate(e=>{
          const r=document.createRange();r.selectNodeContents(e);const box=e.getBoundingClientRect();
          return [...r.getClientRects()].some(v=>v.width>0&&(v.left<box.left-1||v.right>box.right+1));
        });if(bad)textClips.push(await text.textContent());
      }
      assert(!textClips.length,'text fragments outside their bounds: '+textClips.join('|'));
      shell.push({width,zoom,pass:true});
    }catch(error){shell.push({width,zoom,pass:false,error:String(error)});}
  }
  await page.emulateMedia({reducedMotion:'no-preference'}); page.off('pageerror',onError);
  return {pass:rows.every(r=>r.pass)&&motions.every(r=>r.pass)&&shell.every(r=>r.pass)&&!errors.length,probe,rows,motions,shell,errors};
}
