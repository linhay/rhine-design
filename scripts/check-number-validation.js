async page => {
  const origin=await page.evaluate(()=>location.origin), negative=await page.evaluate(()=>new URLSearchParams(location.search).has('numberProbe'));
  page.setDefaultTimeout(6000);
  const quick=await page.evaluate(()=>new URLSearchParams(location.search).has('numberQuick'));
  const rows=[],errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  for(const theme of ((negative||quick)?['rhine']:['rhine','arknights','neo-brutalism','neutral','graphite'])) for(const [width,zoom,motion] of ((negative||quick)?[[400,1,'normal']]:[[400,1,'normal'],[520,1,'normal'],[880,1,'normal'],[400,2,'normal'],[880,1,'system'],[880,1,'manual']])) {
    const row={theme,width,zoom,motion,pass:false};rows.push(row);
    try{
      await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});
      await page.goto(`${origin}/?fixture=number-validation&theme=${theme}&motion=${motion}`);
      await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),zoom);
      const input=page.getByRole('spinbutton',{name:'数量',exact:true}), title=page.getByRole('textbox',{name:'配置名称',exact:true}), save=page.getByRole('button',{name:'保存配额',exact:true});
      const form=page.getByRole('form',{name:'合成配额设置'});
      for(const mode of ['native','manual']) {
        await page.getByLabel('校验方式',{exact:true}).selectOption(mode);
        for(const draft of ['-','101','']) {
          await input.fill(draft);
          if(negative) await input.evaluate(el=>el.setCustomValidity(''));
          assert(!(await input.evaluate(el=>el.validity.valid)),`${mode}: invalid draft considered valid (${draft})`);
          await save.click();
          assert((await input.inputValue())===draft,'invalid draft lost');
          const summary=page.getByRole('region',{name:'请修正以下问题',exact:true});await summary.waitFor();
          await page.waitForFunction(()=>document.activeElement?.classList.contains('rhine-error-summary'));
          const url=page.url();await summary.getByRole('link').filter({hasText:'数量'}).click();
          assert(await input.evaluate(el=>document.activeElement===el),'error link did not focus field');assert(page.url()===url,'error link changed route');
        }
        await input.fill('2.54');
        await form.evaluate(el=>el.requestSubmit());
        await page.getByText('已保存：合成配额，数量 2.5，批次 2',{exact:true}).waitFor();
        assert(await input.inputValue()==='2.5','submit did not commit precision');
        await input.fill('3.46');await input.press('Enter');await save.click();
        await page.getByText('已保存：合成配额，数量 3.5，批次 2',{exact:true}).waitFor();
        await input.fill('-');await input.press('Escape');assert(await input.inputValue()==='3.5','Escape lost accepted value');
      }
      await title.fill('');await input.fill('-');await save.click();
      const summary=page.getByRole('region',{name:'请修正以下问题',exact:true});assert(await summary.getByRole('link').count()===2,'multi-field summary incomplete');
      await title.fill('长期研究配置 · 合成名称 Synthetic configuration');await input.fill('4.25');
      await page.getByRole('button',{name:'脚本保存',exact:true}).click();
      await page.getByText('已保存：长期研究配置 · 合成名称 Synthetic configuration，数量 4.3，批次 2',{exact:true}).waitFor();
      await page.getByLabel('模拟业务错误',{exact:true}).check();assert(!(await input.evaluate(el=>el.validity.valid)),'external error not blocking');
      await page.getByLabel('模拟业务错误',{exact:true}).uncheck();
      for(const state of ['readonly','disabled']) {await page.getByLabel('字段状态',{exact:true}).selectOption(state);assert(!(await input.evaluate(el=>el.willValidate)),'noneditable validity participation');}
      await page.getByLabel('字段状态',{exact:true}).selectOption('editable');
      assert(await input.evaluate(el=>el.validity.valid),'validity did not recover');
      await input.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));
      assert(!(await input.evaluate(el=>el.validity.valid)),'composition allowed save');
      await input.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));
      assert(await input.evaluate(el=>el.validity.valid),'composition end left invalid state');
      // Synthetic edits leave two drafts pending; requestSubmit is the native browser path.
      const editPair=async(a,b)=>form.evaluate((el,{a,b})=>{
        const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
        for(const [name,value] of [['amount',a],['batch',b]]) {const input=el.elements.namedItem(name);setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}
      },{a,b});
      await editPair('5','6');await form.evaluate(el=>el.requestSubmit());
      await page.getByText('已保存：长期研究配置 · 合成名称 Synthetic configuration，数量 5，批次 6',{exact:true}).waitFor();
      await input.fill('10');await input.press('Enter');await page.getByLabel('数量限制批次',{exact:true}).check();
      await editPair('3','7');await form.evaluate(el=>el.requestSubmit());
      assert(!(await page.getByRole('spinbutton',{name:'批次数',exact:true}).evaluate(el=>el.validity.valid)),'changed bounds bypassed second validation');
      assert(await page.getByText('已保存：长期研究配置 · 合成名称 Synthetic configuration，数量 5，批次 6',{exact:true}).count()===1,'saved invalid changed constraints');
      row.geometry=await input.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width,height:r.height,viewport:innerWidth};});
      assert(row.geometry.width>40 && row.geometry.x>=0 && row.geometry.right<=width+1,'field outside viewport');
      row.pass=true;
    }catch(e){row.error=String(e);}
  }
  return {pass:rows.every(r=>r.pass)&&!errors.length,rows,errors,userAgent:await page.evaluate(()=>navigator.userAgent),boundary:'Synthetic composition, browser keyboard; CSS zoom; synthetic save only'};
}
