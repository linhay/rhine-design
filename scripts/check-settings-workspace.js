// Production or immutable tarball fixture. All data synthetic; zoom is CSS zoom.
async page => {
  page.setDefaultTimeout(6000);
  const base = new URL(page.url()).origin, results = [], errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const assert = (value, label) => { if (!value) throw Error(label); };
  for (const theme of ['rhine','arknights','neo-brutalism']) for (const width of [400,520,880,1280]) for (const zoom of [1,2]) for (const height of [900,648]) {
    const c = {theme,width,zoom,height};
    try {
      await page.setViewportSize({width,height});
      await page.goto(`${base}/?fixture=settings-dialog&theme=${theme}&zoom=${zoom}`);
      const trigger = page.getByRole('button',{name:'打开稳定工作区'});
      await trigger.click();
      const d = page.getByRole('dialog',{name:'配置工作区'});
      const measure = () => d.evaluate(e => {
        const rect = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
        const grid=e.querySelector('.rhine-dialog__settings-grid'), nav=e.querySelector('.rhine-dialog__navigation'), body=e.querySelector('.rhine-dialog__settings-content'),footer=e.querySelector('.rhine-dialog__footer');
        return {frame:rect(e),head:rect(e.querySelector('.rhine-dialog__head')),body:rect(body),nav:rect(nav),footer:rect(footer),gap:parseFloat(getComputedStyle(grid).rowGap),columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,buttons:[...footer.querySelectorAll('button')].map(rect),overflow:body.scrollWidth>body.clientWidth+1};
      });
      const initial=await measure();
      const stable=async()=>{const now=await measure();for(const k of ['frame','head','footer']) for(const a of ['x','y','width','height']) assert(Math.abs(now[k][a]-initial[k][a])<1,`unstable ${k}.${a}`);return now;};
      assert(initial.body.height>=128,`body only ${initial.body.height}px`);
      if(initial.columns===1) assert(Math.abs(initial.body.y-initial.nav.bottom-initial.gap*zoom)<1,'navigation track leaves blank space');
      const within=(a,b)=>a.x>=b.x-1&&a.right<=b.right+1&&a.y>=b.y-1&&a.bottom<=b.bottom+1;
      assert(initial.buttons.every(b=>within(b,initial.footer)&&b.width/zoom>=43.9&&b.height/zoom>=43.9),'footer target or clipping');
      assert(!initial.overflow,'body overflow');
      await d.getByRole('link',{name:'模板编辑',exact:true}).click();
      await d.getByRole('textbox',{name:'模板名称'}).fill('保留栏目草稿');await stable();
      await d.getByRole('link',{name:'其他设置',exact:true}).click();await stable();
      const navLast=await d.getByRole('link',{name:'其他设置',exact:true}).boundingBox();
      const nav=(await measure()).nav;
      assert(navLast.y>=nav.y-1&&navLast.y+navLast.height<=nav.bottom+1,'last navigation unreachable');
      await d.getByRole('link',{name:'模板编辑',exact:true}).click();
      assert(await d.getByRole('textbox',{name:'模板名称'}).inputValue()==='保留栏目草稿','draft lost');
      await d.getByRole('button',{name:'关闭',exact:true}).click();
      await page.waitForFunction(()=>document.activeElement?.textContent==='打开稳定工作区');
      for(const state of ['eight','loading','error']) {
        await page.getByRole('combobox',{name:'工作区内容状态'}).selectOption(state);await trigger.click();await stable();
        if(state==='eight') {
          const last=d.getByRole('textbox',{name:'编辑条目 8',exact:true});await last.focus();const r=await last.boundingBox(), body=(await measure()).body;
          assert(r.y>=body.y-1&&r.y+r.height<=body.bottom+1,'last row unreachable');await stable();
          await d.getByRole('textbox',{name:'编辑条目 3',exact:true}).fill('跨栏目保留条目');
          await d.getByRole('link',{name:'其他设置',exact:true}).click();await d.getByRole('link',{name:'模板编辑',exact:true}).click();
          assert(await d.getByRole('textbox',{name:'编辑条目 3',exact:true}).inputValue()==='跨栏目保留条目','row draft lost on section switch');
          await d.getByRole('button',{name:'添加条目'}).click();await d.getByRole('textbox',{name:'编辑条目 9',exact:true}).waitFor();await stable();
          for(const key of ['Tab','Shift+Tab']) for(let i=0;i<16;i++){await page.keyboard.press(key);assert(await d.evaluate(e=>e.contains(document.activeElement)),'focus escaped');}
        }
        if(state==='error'){await d.getByRole('button',{name:'重试'}).click();await d.getByRole('textbox',{name:'编辑条目 8',exact:true}).waitFor();await stable();}
        await page.keyboard.press('Escape');await d.waitFor({state:'detached'});
      }
      results.push({...c,pass:true,initial});
    } catch(error) {results.push({...c,pass:false,error:String(error)});}
  }
  return {pass:results.every(r=>r.pass)&&!errors.length,results,errors};
}
