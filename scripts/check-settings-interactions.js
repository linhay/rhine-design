// Run after navigating to a production settings-dialog fixture (source or tarball consumer).
async page => {
  page.setDefaultTimeout(6000);
  const base=page.url().split('/').slice(0,3).join('/'), results=[],errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const assert=(ok,message)=>{if(!ok)throw new Error(message)};
  const trapped=async dialog=>assert(await dialog.evaluate(e=>e.contains(document.activeElement)),'focus escaped settings');
  for(const theme of ['rhine','arknights','neo-brutalism']) for(const width of [400,520,880,1280]) for(const zoom of [1,2]) {
    const c={theme,width,zoom};
    try {
      await page.setViewportSize({width,height:900});
      await page.goto(`${base}/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}`);
      const url=page.url(),host=page.getByRole('textbox',{name:'宿主查询'});
      await host.fill('保留宿主查询');
      const trigger=page.getByRole('button',{name:'打开设置',exact:true});await trigger.click();
      const d=page.getByRole('dialog',{name:'设置',exact:true});
      assert(await d.getAttribute('aria-describedby')===null,'dangling description');
      const frame=await d.boundingBox();
      const stable=async()=>{const r=await d.boundingBox();assert(Math.abs(r.y-frame.y)<1&&Math.abs(r.height-frame.height)<1,'section changed frame')};
      const draft=d.getByRole('textbox',{name:'工作区名称'});await draft.fill('跨主题草稿');
      const handle=await draft.elementHandle();
      for(const selectedTheme of ['rhine','arknights','neo-brutalism']) {
        await d.getByRole('combobox',{name:'界面主题'}).selectOption(selectedTheme);
        assert(await handle.evaluate(e=>e.isConnected&&e.value==='跨主题草稿'),'theme remounted draft');
        await stable();
      }
      await d.getByRole('combobox',{name:'界面主题'}).selectOption(theme);
      const search=d.getByRole('combobox',{name:'授权成员'});
      await search.fill('成员 2');
      const list=page.getByRole('listbox');await list.waitFor();
      const opt=list.getByRole('option',{name:'合成成员 2',exact:true});await opt.click();
      assert(await opt.getAttribute('aria-selected')==='true','multiselect did not select');
      await opt.click();assert(await opt.getAttribute('aria-selected')==='false','multiselect did not deselect');
      await page.getByRole('button',{name:'完成选择',exact:true}).click();
      // Immediate consecutive reverse/forward traversal after a nested FocusScope unmount.
      for(let i=0;i<8;i++){await page.keyboard.press('Shift+Tab');await trapped(d);}
      for(let i=0;i<8;i++){await page.keyboard.press('Tab');await trapped(d);}
      await search.fill('成员 2');await list.waitFor();await page.keyboard.press('Escape');await list.waitFor({state:'detached'});await trapped(d);
      assert(await d.isVisible(),'select Escape closed parent');
      await d.getByRole('link',{name:'用户管理与权限',exact:true}).click();await stable();
      const edit=d.getByRole('button',{name:'编辑成员 30',exact:true});await edit.click();
      const inner=page.getByRole('dialog',{name:'编辑成员 30',exact:true});await inner.getByRole('textbox',{name:'成员备注'}).fill('内层草稿');
      await page.keyboard.press('Escape');await inner.waitFor({state:'detached'});
      await page.waitForFunction(()=>document.activeElement?.textContent==='编辑成员 30');
      for(let i=0;i<8;i++){await page.keyboard.press('Shift+Tab');await trapped(d);}
      await d.getByRole('link',{name:'公开项目',exact:true}).click();
      for(const state of ['loading','error','empty','normal']) {
        await d.getByRole('combobox',{name:'项目状态'}).selectOption(state);await stable();
        const text={loading:'正在读取项目',error:'项目读取失败',empty:'暂无公开项目',normal:'项目标题'}[state];
        assert((await d.textContent()).includes(text)||await d.getByLabel(text).count()>0,`missing ${state}`);
      }
      await d.getByRole('link',{name:'异步栏目',exact:true}).click();await d.getByText('正在读取栏目', {exact:true}).waitFor({state:'attached'});await stable();await d.getByText('异步栏目已就绪').waitFor();await stable();
      await d.getByRole('link',{name:'账号',exact:true}).click();assert(await draft.inputValue()==='跨主题草稿','section lost draft');
      await d.getByRole('button',{name:'保存设置',exact:true}).click();assert(await d.getByRole('button',{name:'保存设置'}).isDisabled(),'save is not busy');await stable();
      await d.getByText('已保存演示草稿').waitFor();await stable();
      await draft.fill('将被撤销');await d.getByRole('button',{name:'取消草稿'}).click();assert(await draft.inputValue()==='跨主题草稿','undo failed');
      await d.getByRole('button',{name:'关闭设置',exact:true}).click();await d.waitFor({state:'detached'});await page.waitForFunction(()=>document.activeElement?.textContent==='打开设置');
      assert(page.url()===url&&await host.inputValue()==='保留宿主查询','host state changed');
      await trigger.click();assert(await draft.inputValue()==='跨主题草稿','reopen lost saved data');await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
      for(const outcome of ['error','conflict']) {
        await page.getByRole('combobox',{name:'保存结果'}).selectOption(outcome);await trigger.click();await draft.fill('保留失败草稿');await d.getByRole('button',{name:'保存设置'}).click();
        await d.getByText(outcome==='error'?'保存失败，草稿已保留':'内容已更新，请核对后重新保存').waitFor();assert(await draft.inputValue()==='保留失败草稿','failure discarded draft');await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
      }
      await page.getByRole('button',{name:'普通短弹窗'}).click();const short=page.getByRole('dialog',{name:'短对话框'});assert(!(await short.getAttribute('class')).includes('--bounded'),'short dialog became bounded');await page.keyboard.press('Escape');await short.waitFor({state:'detached'});
      await page.getByRole('button',{name:'有界普通表单示例'}).click();
      const form=page.getByRole('dialog',{name:'有界普通表单'}), head=form.locator('.rhine-dialog__head'), footer=form.locator('.rhine-dialog__footer');
      const headBefore=await head.boundingBox(), footerBefore=await footer.boundingBox();
      await form.getByRole('textbox',{name:'表单字段 30',exact:true}).focus();
      const field=await form.getByRole('textbox',{name:'表单字段 30',exact:true}).boundingBox(), bodyRect=await form.locator('.rhine-dialog__body').boundingBox();
      assert(Math.abs((await head.boundingBox()).y-headBefore.y)<1&&Math.abs((await footer.boundingBox()).y-footerBefore.y)<1,'plain bounded head/footer moved');
      assert(field.y>=bodyRect.y-1&&field.y+field.height<=bodyRect.y+bodyRect.height+1,'plain bounded last field unreachable');
      await page.keyboard.press('Escape');await form.waitFor({state:'detached'});
      if(zoom===1) for(const [triggerName,title] of [['普通抽屉示例','普通抽屉'],['辅助分栏示例','辅助分栏']]) {
        await page.getByRole('button',{name:triggerName}).click();const legacy=page.getByRole('dialog',{name:title,exact:true});
        assert(!(await legacy.getAttribute('class')).includes('--bounded'),'legacy mode became bounded');
        await legacy.getByRole('textbox').fill('保留既有模式');await page.keyboard.press('Tab');await trapped(legacy);
        await page.keyboard.press('Escape');await legacy.waitFor({state:'detached'});
      }
      results.push({...c,pass:true});
    }catch(error){results.push({...c,pass:false,error:String(error)});}
  }
  // System and manual reduced motion are independent paths.
  const motion=[];
  for(const mode of ['system','manual','full']) {
    await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
    await page.goto(`${base}/?fixture=settings-dialog&motion=${mode==='manual'?'reduced':'full'}`);
    await page.getByRole('button',{name:'打开设置',exact:true}).click();
    const duration=await page.getByRole('dialog',{name:'设置',exact:true}).evaluate(e=>getComputedStyle(e).animationDuration);
    motion.push({mode,duration,pass:mode==='full'?parseFloat(duration)>0:parseFloat(duration)===0});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  return {pass:results.every(r=>r.pass)&&motion.every(r=>r.pass)&&!errors.length,results,motion,errors};
}
