async page => {
  const origin = await page.evaluate(() => location.origin);
  page.setDefaultTimeout(5000);
  const broken = await page.evaluate(()=>new URLSearchParams(location.search).has('imeProbe'));
  const results = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const probe = async (input, signal) => input.evaluate((el, {signal,broken}) => {
    if (signal === 'lifecycle') el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles:true }));
    const event = new KeyboardEvent('keydown', {key:'Escape', bubbles:true, cancelable:true, isComposing:signal==='isComposing', keyCode:signal==='229'?229:27});
    if (broken) event.stopImmediatePropagation=()=>{};
    el.dispatchEvent(event);
    if (signal === 'lifecycle') el.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true, data:el.value}));
    return {defaultPrevented:event.defaultPrevented, isTrusted:event.isTrusted};
  }, {signal,broken});
  for (const theme of (broken ? ['rhine'] : ['rhine','arknights','neo-brutalism','neutral','graphite'])) {
    for (const [width, zoom, motion] of (broken ? [[400,1,'normal']] : [[400,1,'normal'],[520,1,'normal'],[880,1,'normal'],[400,2,'normal'],[880,1,'system'],[880,1,'manual']])) {
      const row = {theme,width,zoom,motion,pass:false}; results.push(row);
      try {
        await page.setViewportSize({width,height:900});
        await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});
        await page.goto(`${origin}/?fixture=overlay-composition&theme=${theme}&motion=${motion}`);
        await page.evaluate(zoom => { document.documentElement.style.zoom=String(zoom); }, zoom);
        const trigger = page.getByRole('button',{name:'打开对话框',exact:true});
        await trigger.click();
        const dialog = page.getByRole('dialog',{name:'编辑工作区',exact:true});
        const input = page.getByRole('textbox',{name:'工作区名称',exact:true});
        const draft='长期研究工作区 · 合成中文输入与退出边界 Synthetic draft';
        await input.fill(draft);
        for (const signal of ['lifecycle','isComposing','229']) {
          assert(!(await probe(input,signal)).defaultPrevented, `IME default blocked: ${signal}`);
          assert(await dialog.isVisible(), `Dialog dismissed: ${signal}`);
          assert(await input.inputValue()===draft,'draft lost');
        }
        await page.getByRole('button',{name:'对话框内详情',exact:true}).click();
        const pop = page.getByRole('dialog',{name:'嵌套详情',exact:true});
        const note = page.getByRole('textbox',{name:'详情备注',exact:true});
        await note.fill(draft);
        for (const signal of ['lifecycle','isComposing','229']) {
          assert(!(await probe(note,signal)).defaultPrevented,'nested default blocked');
          assert(await pop.isVisible() && await dialog.isVisible(),'nested layer dismissed');
        }
        const combo=page.getByRole('combobox',{name:'嵌套候选',exact:true});
        await combo.fill('合成');
        for (const signal of ['lifecycle','isComposing','229']) {
          assert(!(await probe(combo,signal)).defaultPrevented,'combo default blocked');
          assert(await combo.getAttribute('aria-expanded')==='true','combo dismissed');
        }
        await combo.press('Escape');
        await page.waitForFunction(()=>document.querySelector('[role=combobox]')?.getAttribute('aria-expanded')==='false');
        assert(await pop.isVisible() && await dialog.isVisible(),'Escape skipped layer');
        await combo.press('Escape');
        await pop.waitFor({state:'hidden'});
        assert(await dialog.isVisible(),'outer closed with popover');
        row.immediateFocus = await page.evaluate(()=>document.activeElement?.outerHTML);
        await page.waitForFunction(()=>document.activeElement?.textContent==='对话框内详情');
        await page.keyboard.press('Tab');
        assert(await page.evaluate(()=>!!document.activeElement?.closest('.rhine-dialog')),'Tab escaped modal');
        await page.keyboard.press('Shift+Tab');
        assert(await page.evaluate(()=>!!document.activeElement?.closest('.rhine-dialog')),'reverse Tab escaped modal');
        await page.keyboard.press('Escape');
        await dialog.waitFor({state:'hidden'});
        await page.waitForFunction(()=>document.activeElement?.textContent==='打开对话框');
        await page.keyboard.press('Tab');
        assert(await page.evaluate(()=>!document.activeElement?.closest('.rhine-dialog')),'closed content tabbable');
        row.pass=true;
      } catch(e) { row.error=String(e); }
    }
  }
  return {pass:results.every(x=>x.pass)&&!errors.length, results,errors, userAgent:await page.evaluate(()=>navigator.userAgent), boundary:'Synthetic composition / browser keyboard; CSS zoom; no OS IME or screen reader claim'};
}
