async page => {
  page.setDefaultTimeout(3000);
  const base = await page.evaluate(()=>location.origin), rows = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const probe=page.url().includes("neutralProbe=radius");
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  for (const theme of (probe ? ['neutral'] : ['rhine','arknights','neo-brutalism','neutral'])) for (const width of (probe ? [400] : [400,520,880])) for (const zoom of (probe ? [1] : [1,2])) {
    try {
      await page.setViewportSize({width,height:900});
      await page.goto(`${base}/?fixture=neutral&theme=${theme}&zoom=${zoom}`);
      const field = page.getByRole('textbox',{name:'记录名称',exact:true});
      await field.fill('保留的合成草稿');
      await page.getByRole('button',{name:'保存示例',exact:true}).click();
      assert(await field.getAttribute('aria-invalid') === 'true','invalid field missing');
      assert(await field.inputValue() === '保留的合成草稿','draft lost');
      assert(await page.getByRole('button',{name:'暂不可用',exact:true}).isDisabled(),'disabled button enabled');
      await field.focus(); await page.keyboard.press('Tab');
      assert(await page.getByRole('button',{name:'保存示例',exact:true}).evaluate(e=>e===document.activeElement),'disabled field entered Tab order');
      const fieldHandle=await field.elementHandle();
      const edit = page.getByRole('tab',{name:'编辑',exact:true}); await edit.focus(); await page.keyboard.press('ArrowRight');
      assert(await page.getByRole('tab',{name:'详情',exact:true}).getAttribute('aria-selected')==='true','tab keyboard failed');
      for(let i=0;i<4;i++){await page.keyboard.press('Tab');assert(!await fieldHandle.evaluate(e=>e===document.activeElement),'hidden field entered Tab order');}
      await edit.click(); assert(await field.inputValue()==='保留的合成草稿','tab draft lost');
      const trigger=page.getByRole('button',{name:'打开外观设置',exact:true}); await trigger.click();
      const dialog=page.getByRole('dialog'); await dialog.waitFor();
      const draft=dialog.getByRole('textbox',{name:'弹窗草稿'});await draft.fill('浮层保留');
      await dialog.getByRole('button',{name:'中性 · 黑白轻量',exact:true}).click();
      assert(await dialog.evaluate(e=>e.closest('.rhine-theme')?.dataset.rhineTheme==='neutral'),'portal lost neutral');
      assert(await draft.inputValue()==='浮层保留','portal draft lost');
      if(probe) await page.addStyleTag({content:'.rhine-dialog { border-radius:0!important; }'});
      const paint=await dialog.evaluate(e=>({color:getComputedStyle(e).backgroundColor,radius:getComputedStyle(e).borderRadius}));
      assert(paint.color==='rgb(255, 255, 255)'&&paint.radius==='16px','neutral surface incorrect');
      const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,'dialog overflow');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.textContent==='打开外观设置',null,{timeout:3000});
      const ring=await trigger.evaluate(e=>getComputedStyle(e).outlineWidth);assert(parseFloat(ring)>=2,'keyboard focus ring missing');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,'document overflow');
      const target=await trigger.boundingBox(); assert(target.width>=44*zoom&&target.height>=44*zoom,'action target too small');
      rows.push({theme,width,zoom,pass:true});
    } catch(error) {rows.push({theme,width,zoom,pass:false,error:String(error)});}
  }
  const motions=[];
  for(const mode of ['system','manual']) {
    await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
    await page.goto(`${base}/?fixture=neutral&motion=${mode}`);
    await page.getByRole('button',{name:'保存示例',exact:true}).click();
    await page.getByRole('button',{name:'打开外观设置',exact:true}).click();
    const dialog=page.getByRole('dialog'); await dialog.waitFor();
    const duration=await dialog.evaluate(e=>getComputedStyle(e).animationDuration);
    const pass=await dialog.getByRole('textbox').isVisible()&&duration.split(',').every(v=>parseFloat(v)<=0.01);
    motions.push({mode,duration,pass}); await page.keyboard.press('Escape');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:880,height:900});
  await page.goto(`${base}/?fixture=neutral&theme=neutral`);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[role=tabpanel]')).opacity==='1');
  await page.screenshot({path:'output/playwright/neutral-880.png',fullPage:true});
  return {pass:rows.every(r=>r.pass)&&motions.every(r=>r.pass)&&!errors.length,rows,motions,errors};
}
