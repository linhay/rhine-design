// Synthetic state and motion checks, separate from the layout matrix.
async page => {
  const base=await page.evaluate(()=>location.origin), results=[];
  const assert=(value,message)=>{if(!value)throw Error(message);};
  page.setDefaultTimeout(15000);
  for(const preference of ['normal','manual','system']) {
    try {
      await page.emulateMedia({reducedMotion:preference==='system'?'reduce':'no-preference'});
      await page.setViewportSize({width:400,height:648});
      const url=`${base}/?fixture=settings-dialog&object=1&zoom=2&motion=${preference==='manual'?'reduced':'system'}`;
      await page.goto(url);await page.getByLabel('额度加载占位').check();
      const animation=await page.locator('[data-object-quota] .rhine-skeleton > span[aria-hidden]').first().evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));
      assert(preference==='normal' ? animation.name!=='none' : animation.name==='none','skeleton motion preference not applied');
      await page.getByLabel('模拟分配首次保存失败').check();
      const trigger=page.getByRole('button',{name:'对象设置'});await trigger.click();
      const dialog=page.getByRole('dialog',{name:'合成资源 A · 设置'}), input=dialog.getByRole('combobox',{name:'分配人员'});
      await input.waitFor();await input.focus();await page.keyboard.press('ArrowDown');
      await page.getByRole('option',{name:'合成人员乙',exact:true}).click();await page.keyboard.press('Escape');
      const save=dialog.getByRole('button',{name:'保存当前分区'});await save.focus();await page.keyboard.press('Enter');
      await dialog.getByText('分配保存失败，草稿已保留',{exact:true}).waitFor();
      assert(await dialog.getByText('合成人员乙',{exact:true}).isVisible(),'failed save discarded draft');
      assert(!await dialog.getByText('分配已保存（合成）',{exact:true}).count(),'failure claimed success');
      // Real Enter retries from the unchanged draft, with no interaction behind the modal.
      await save.focus();await page.keyboard.press('Enter');await dialog.getByText('分配已保存（合成）',{exact:true}).waitFor();
      await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.textContent==='对象设置');
      results.push({preference,pass:true,animation});
    }catch(error){results.push({preference,pass:false,error:String(error)});}
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(const mode of ['批量入口','只读入口','外部动作执行中','模拟设置读取失败']) {
    try {
      await page.goto(`${base}/?fixture=settings-dialog&object=1&motion=reduced`);await page.getByLabel(mode).check();
      const trigger=page.getByRole('button',{name:'对象设置'});
      if(mode==='外部动作执行中') await page.evaluate(()=>{
        window.__externalLock=false;
        const observer=new MutationObserver(()=>{
          const dialog=document.querySelector('[role="dialog"]'), nav=dialog?.querySelector('select');
          if(nav?.disabled) {observer.disconnect();dialog.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));window.__externalLock=dialog.isConnected&&nav.disabled;}
        });observer.observe(document.body,{subtree:true,childList:true});
      });
      await trigger.click();
      const dialog=page.getByRole('dialog');await dialog.waitFor();
      if(mode==='批量入口'||mode==='只读入口') {
        assert(!await dialog.getByRole('option',{name:'分配',exact:true}).count(),'unsupported allocation in compact navigation');
        assert(!await dialog.getByRole('combobox',{name:'分配人员'}).count(),'unsupported allocation form');
        if(mode==='只读入口')assert(!await dialog.getByRole('button',{name:'保存当前分区'}).count(),'read-only save action');
      }else if(mode==='外部动作执行中') {
        assert(await page.evaluate(()=>window.__externalLock),'external busy did not lock navigation and Escape in its actual busy phase');
        assert(await dialog.isVisible(),'external busy Escape closed the dialog');
        await page.waitForFunction(()=>!document.querySelector('[role="dialog"] button[aria-busy="true"]'));
        await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
      }else {
        await dialog.getByText('对象设置读取失败',{exact:true}).waitFor();
        assert(!await dialog.getByRole('combobox',{name:'分配人员'}).count(),'failed read produced editable settings');
        assert(await dialog.getByRole('button',{name:'保存当前分区'}).isDisabled(),'failed read enabled save');
        await dialog.getByRole('button',{name:'重试读取设置'}).focus();await page.keyboard.press('Enter');
        assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'retry lost Dialog focus');
        await dialog.getByText('对象设置读取失败',{exact:true}).waitFor();
        assert(!await dialog.getByText('分配已保存（合成）',{exact:true}).count(),'failed retry claimed success');
        let reached=false;for(let i=0;i<12;i++){await page.keyboard.press('Tab');if(await dialog.getByRole('button',{name:'重试读取设置'}).evaluate(e=>document.activeElement===e)){reached=true;break;}}assert(reached,'keyboard cannot reach retry after failure');
      }
      results.push({mode,pass:true});
    }catch(error){results.push({mode,pass:false,error:String(error)});}
  }
  return {pass:results.every(item=>item.pass),results};
}
