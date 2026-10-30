// Run against production preview or a freshly installed fixed-package consumer.
// Synthetic data only. CSS zoom is not native browser zoom.
async page => {
  page.setDefaultTimeout(15000);
  const base = await page.evaluate(()=>location.origin), results = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const assert = (value,message) => { if(!value) throw Error(message); };
  const navigate = async (dialog,id) => {
    const select = dialog.getByRole('combobox',{name:'对象设置栏目'});
    if(await select.isVisible()) await select.selectOption(id);
    else await dialog.getByRole('link',{name:{allocation:'分配',model:'模型',schedule:'调度'}[id],exact:true}).click();
  };
  const contexts=[];
  for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520,880]) for(const zoom of [1,2]) contexts.push({theme,width,zoom});
  contexts.push({theme:'neutral',width:400,zoom:2});
  for(const context of contexts) {
    const {theme,width,zoom}=context;
    try {
      await page.setViewportSize({width,height:648});
      await page.goto(`${base}/?fixture=settings-dialog&object=1&theme=${theme}&zoom=${zoom}`);
      await page.getByLabel('跨年日期与长异常状态').check();
      const metadata = page.getByRole('region',{name:'资源日期与分发状态'});
      const layout = await metadata.evaluate(element => {
        const items=[...element.querySelectorAll('p')]; const r=items.map(x=>x.getBoundingClientRect());
        return {sameLine:Math.abs(r[0].y-r[1].y)<1,font:items.map(x=>parseFloat(getComputedStyle(x).fontSize)),labels:items.map(x=>x.getAttribute('aria-label')),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth,pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};
      });
      assert(layout.sameLine && !layout.pageOverflow,'metadata wraps or page overflows');
      assert(layout.labels[0].includes('2025')&&layout.labels[0].includes('2026')&&layout.labels[1].includes('权限'),'incomplete date/status accessible names');
      if(layout.scrollWidth>layout.clientWidth+1) {
        await metadata.focus();
        // Drive actual keyboard repeat without requiring a per-key pixel delta.
        for(let round=0;round<12;round++) {
          for(let step=0;step<10;step++) await page.keyboard.down('ArrowRight');
          await page.keyboard.up('ArrowRight');
          await metadata.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          if(await metadata.evaluate(e=>{const t=e.querySelector('p:last-child').firstChild,r=document.createRange();r.setStart(t,t.length-1);r.setEnd(t,t.length);const text=r.getBoundingClientRect(),box=e.getBoundingClientRect();return text.right<=box.right+1&&text.left>=box.left-1;})) break;
        }
        await page.waitForFunction(()=>{const e=document.querySelector('.rhine-object-metadata'),t=e.querySelector('p:last-child').firstChild,r=document.createRange();r.setStart(t,t.length-1);r.setEnd(t,t.length);const text=r.getBoundingClientRect(),box=e.getBoundingClientRect();return document.activeElement===e&&text.right<=box.right+1&&text.left>=box.left-1;});
        assert(await metadata.evaluate(e=>document.activeElement===e),'metadata lost keyboard focus');
      }
      const quota=page.locator('[data-object-quota]'), loaded=await quota.boundingBox();
      await page.getByLabel('额度加载占位').check(); const skeleton=await quota.boundingBox();
      assert(Math.abs(loaded.height-skeleton.height)<1,'quota loading/complete heights differ');
      assert(loaded.height/zoom<100,'quota still reserves oversized minimum');
      await page.getByLabel('额度加载占位').uncheck();
      const trigger=page.getByRole('button',{name:'对象设置'});await trigger.click();
      const dialog=page.getByRole('dialog',{name:'合成资源 A · 设置'});
      const recipients=dialog.getByRole('combobox',{name:'分配人员'});await recipients.waitFor();
      assert((await page.locator('[data-notification-read]').textContent()).includes('读取中'),'settings waited for unrelated notification');
      assert(await dialog.getByText('合成人员甲',{exact:true}).isVisible(),'initial name missing');
      const frame=await dialog.boundingBox();
      const geometry=await dialog.evaluate(e=>{
        const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
        const footer=e.querySelector('.rhine-dialog__footer');
        return {footer:rect(footer),body:rect(e.querySelector('.rhine-dialog__settings-content')),buttons:[...footer.querySelectorAll('button')].map(rect)};
      });
      assert(geometry.body.height/zoom>=44,'body cannot show one full control');
      assert(geometry.buttons.every(b=>b.width/zoom>=43.9&&b.height/zoom>=43.9&&b.x>=geometry.footer.x-1&&b.right<=geometry.footer.right+1&&b.y>=geometry.footer.y-1&&b.bottom<=geometry.footer.bottom+1),'footer controls clipped or below 44px');
      for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!document.activeElement.closest('[hidden],[inert]')),'hidden partition entered Tab order');}

      // A clean nested dropdown consumes the first Escape; second closes the parent.
      await recipients.focus();await page.keyboard.press('ArrowDown');await page.getByRole('listbox').waitFor();
      await page.keyboard.press('Escape');assert(await dialog.isVisible(),'first Escape closed parent');
      assert(await page.getByRole('listbox').count()===0,'first Escape did not close candidates');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='对象设置');
      await trigger.click();await recipients.waitFor();
      await navigate(dialog,'model');await dialog.getByRole('textbox',{name:'模型名称'}).fill('独立模型草稿');
      await navigate(dialog,'schedule');await dialog.getByRole('combobox',{name:'执行调度'}).selectOption('manual');
      await navigate(dialog,'allocation');await recipients.focus();await page.keyboard.press('ArrowDown');
      await page.getByRole('option',{name:'合成人员乙',exact:true}).click();await page.keyboard.press('Escape');
      const save=dialog.getByRole('button',{name:'保存当前分区'});
      await page.evaluate(()=>{
        window.__objectBusy=false;
        const observer=new MutationObserver(()=>{
          const button=document.querySelector('button[form="rhine-object-allocation"][aria-busy="true"]');
          if(button) {observer.disconnect();button.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));window.__objectBusy=!!document.querySelector('form#rhine-object-allocation');}
        });observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-busy']});
      });
      await save.click();
      assert(await page.evaluate(()=>window.__objectBusy),'busy phase or protected Escape not observed');
      assert(await dialog.isVisible(),'busy Escape closed parent');
      await dialog.getByText('分配已保存（合成）',{exact:true}).waitFor();
      await navigate(dialog,'model');assert(await dialog.getByRole('textbox',{name:'模型名称'}).inputValue()==='独立模型草稿','model draft lost');
      await navigate(dialog,'schedule');assert(await dialog.getByRole('combobox',{name:'执行调度'}).inputValue()==='manual','schedule draft lost');
      const now=await dialog.boundingBox();assert(Math.abs(frame.height-now.height)<1&&Math.abs(frame.y-now.y)<1,'frame moved across sections');
      await dialog.getByRole('combobox',{name:'执行调度'}).focus();
      await page.keyboard.press('Escape');const prompt=page.getByRole('dialog',{name:'放弃未保存修改？'});await prompt.waitFor();
      await prompt.getByRole('button',{name:'继续编辑'}).click();await prompt.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.tagName==='SELECT' && document.activeElement?.value==='manual');
      await dialog.getByRole('button',{name:'关闭',exact:true}).click();await prompt.getByRole('button',{name:'放弃并关闭'}).click();await dialog.waitFor({state:'detached'});
      // Only allocation was saved; other partitions retain their confirmed original values.
      assert((await page.getByText(/已保存分配：/).textContent()).includes('模型：合成模型 A · 调度：每日'),'allocation saved another partition');
      await trigger.click();await recipients.waitFor();
      await recipients.focus();await page.keyboard.press('ArrowDown');await page.getByRole('option',{name:'合成人员乙',exact:true}).click();await page.keyboard.press('Escape');
      // Observe the first success DOM mutation and press Escape without polling/waiting a stable state.
      await page.evaluate(()=>{
        window.__objectImmediate = false;
        {
          const observer=new MutationObserver(()=>{
            if(document.querySelector('[data-allocation-success]')) {
              observer.disconnect();document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
              window.__objectImmediate = true;
            }
          });observer.observe(document.body,{subtree:true,childList:true});
        }
      });
      await save.click();await page.waitForFunction(()=>window.__objectImmediate);await dialog.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.textContent==='对象设置');
      // Closed and hidden content cannot enter real keyboard traversal.
      for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!document.activeElement.closest('[role="dialog"]')),'closed dialog remains in Tab order');}
      results.push({...context,pass:true,layout,geometry,quota:loaded.height/zoom});
    } catch(error) {results.push({...context,pass:false,error:String(error),scroll:await page.locator('.rhine-object-metadata').evaluate(e=>({left:e.scrollLeft,client:e.clientWidth,width:e.scrollWidth,focus:document.activeElement===e})).catch(()=>null)});}
  }
  return {pass:results.every(item=>item.pass)&&!errors.length,results,errors};
}
