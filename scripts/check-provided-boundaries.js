async (page, options = {}) => {
  const base = new URL(await page.url()), samples = [], failures = [], observed = new Set();
  let context = {};
  const selectors = { avatar:'.rhine-avatar',carousel:'.rhine-carousel',listy:'.rhine-virtual',upload:'.rhine-upload',rate:'.rhine-rate:first-of-type',collapse:'.rhine-collapse',transfer:'.rhine-transfer',mentions:'.rhine-mentions','color-picker':'.rhine-color',anchor:'.rhine-anchor' };
  const sections = options.sections ?? Object.keys(selectors);
  const assert = (value, message, actual) => { if (!value) throw new Error(`${message}${actual === undefined ? '' : ': '+JSON.stringify(actual)}`); };
  const record = async sample => { samples.push(sample); if(options.record) await options.record(sample); };
  const go = async (section,theme,zoom,anchor) => {
    const url=new URL(base);url.search=`?theme=${theme}`;url.hash=anchor?`${section}::${encodeURIComponent(anchor)}`:section;
    if(await page.url()===url.href)await page.reload();else await page.goto(url.href);
    await page.waitForSelector(`.ds-section ${selectors[section]}`);
    await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);window.scrollTo(0,0);document.querySelector('.ds-workspace').scrollTop=0;},zoom);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(!observed.has(section)) { observed.add(section); if(options.snapshot)await options.snapshot(section,await page.snapshot({scope:'full_page'})); }
  };
  const activate = (name) => page.press(`loc=role:button[name='${name}']`,'Space');
  const layout = () => page.evaluate(()=>{
    const main=document.querySelector('.ds-workspace').getBoundingClientRect(),left=Math.max(0,main.left),right=Math.min(innerWidth,main.right);
    const controls=[...document.querySelectorAll('.ds-section button,.ds-section select,.ds-section fieldset,.ds-section input:not([type=radio]):not([type=checkbox]),.ds-section textarea')];
    return { width:innerWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
      clipped:controls.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<left-1||r.right>right+1);}).map(e=>({tag:e.tagName,name:e.getAttribute('aria-label')||e.textContent?.trim().slice(0,30),rect:e.getBoundingClientRect().toJSON()})) };
  });
  const run = async section => {
    context.step='initial';
    if(section==='avatar') {
      await activate('显示失败图片');await page.waitForFunction(()=>document.querySelector('.rhine-avatar').textContent==='示');
      context.step='recover-src';await activate('换成有效图片');await page.waitForFunction(()=>{const img=document.querySelector('.rhine-avatar img');return img?.complete&&img.naturalWidth>0;});
      const recovered=await page.evaluate(()=>({complete:document.querySelector('.rhine-avatar img').complete,width:document.querySelector('.rhine-avatar img').naturalWidth}));
      await activate('显示失败图片');await page.waitForFunction(()=>!document.querySelector('.rhine-avatar img')&&document.querySelector('.rhine-avatar').textContent==='示');
      return {recovered,retryFallback:true};
    }
    if(section==='rate') {
      await page.press('.ds-section .rhine-rate:first-of-type input[value="4"]','Space');await page.keyboard.press('ArrowRight');
      const ratings=await page.evaluate(()=>[...document.querySelectorAll('.ds-section .rhine-rate')].map(group=>({name:group.querySelector('input').name,checked:[...group.querySelectorAll('input:checked')].map(input=>input.value)})));
      assert(ratings.length===2&&ratings[0].name!==ratings[1].name&&ratings[0].checked[0]==='5'&&ratings[1].checked[0]==='3','radio groups interfered',ratings);return {ratings};
    }
    if(section==='carousel') {
      await page.fill('.rhine-carousel input','保留轮播编辑草稿');await page.keyboard.press('ArrowLeft');
      assert(await page.evaluate(()=>!!document.querySelector('.rhine-carousel input')&&document.querySelector('.rhine-carousel input').value==='保留轮播编辑草稿'&&document.querySelector('.ds-section').textContent.includes('切页请求：0')),'editing changed the slide');
      await activate('传入越界索引');assert(await page.evaluate(()=>document.querySelector('.rhine-carousel').textContent.includes('2 / 2')),'out-of-range presentation was not clamped');
      await activate('下一张');await page.waitForSelector('.rhine-carousel input');
      context.step='empty-and-single';await page.press('.ds-section input[type=radio][value=empty]','Space');
      const empty=await page.evaluate(()=>({text:document.querySelector('.rhine-carousel').textContent,disabled:[...document.querySelectorAll('.rhine-carousel button')].every(button=>button.disabled),requests:document.querySelector('.ds-section').textContent.match(/切页请求：(\d+)/)?.[1]}));
      assert(empty.text.includes('0 / 0')&&empty.disabled&&empty.requests==='1','empty carousel emitted a request',empty);
      await page.press('.ds-section input[type=radio][value=single]','Space');
      assert(await page.evaluate(()=>document.querySelector('.rhine-carousel input').value==='保留轮播编辑草稿'&&[...document.querySelectorAll('.rhine-carousel button')].every(button=>button.disabled)),'single slide or host draft changed');return {empty};
    }
    if(section==='listy') {
      await page.fill('#virtual-draft-1','条目1独立草稿');await page.keyboard.press('Enter');
      let state=await page.evaluate(()=>({focus:document.activeElement.id,value:document.querySelector('#virtual-draft-1')?.value,position:document.querySelector('#virtual-draft-1')?.closest('[role=listitem]')?.getAttribute('aria-posinset')}));
      assert(state.focus==='virtual-draft-1'&&state.value==='条目1独立草稿'&&state.position==='2','reorder lost identity/focus',state);
      context.step='distant-row';await page.keyboard.press('Shift+Enter');
      state=await page.evaluate(()=>({focus:document.activeElement.id,value:document.querySelector('#virtual-draft-1')?.value,position:document.querySelector('#virtual-draft-1')?.closest('[role=listitem]')?.getAttribute('aria-posinset'),scroll:document.querySelector('.rhine-virtual').scrollTop,count:document.querySelectorAll('.rhine-virtual [role=listitem]').length}));
      assert(state.focus==='virtual-draft-1'&&state.value==='条目1独立草稿'&&state.position==='100'&&state.scroll>0&&state.count<=8,'distant focused row was lost',state);
      await page.keyboard.press('Tab');await page.keyboard.press('Space');
      assert(await page.evaluate(()=>!document.querySelector('#virtual-draft-1')&&document.activeElement.matches('.rhine-virtual')),'removed row did not hand focus to list');
      await activate('仅显示两行');await page.waitForFunction(()=>document.querySelector('.rhine-virtual').scrollTop===0&&document.querySelectorAll('.rhine-virtual [role=listitem]').length===2);
      return {moved:state,removedFocus:'list',filtered:true};
    }
    if(section==='upload') {
      await page.press("loc=role:checkbox[name='禁用本地文件操作']",'Space');
      const disabled=await page.evaluate(()=>({picker:document.querySelector('.rhine-upload input').disabled,remove:document.querySelector('.rhine-upload button').disabled,count:document.querySelectorAll('.rhine-upload li').length}));
      assert(disabled.picker&&disabled.remove&&disabled.count===1,'disabled upload still mutates',disabled);
      const tabTargets=[];for(let i=0;i<3;i++){await page.keyboard.press('Tab');tabTargets.push(await page.evaluate(()=>!!document.activeElement.closest('.rhine-upload')));}assert(tabTargets.every(value=>!value),'disabled upload remains in Tab',tabTargets);
      await page.press("loc=role:checkbox[name='禁用本地文件操作']",'Space');
      if(options.uploadFile) {
        await page.setInputFiles('.rhine-upload input[type=file]',[options.uploadFile]);await page.waitForFunction(()=>document.querySelectorAll('.rhine-upload li').length===2);
        await page.press('.rhine-upload li:first-child button','Space');await page.waitForFunction(()=>document.activeElement.matches('.rhine-upload input[type=file]'));
        assert(await page.evaluate(()=>document.querySelectorAll('.rhine-upload li').length===1),'accepted file removal did not update');
      }
      return {disabled,tabTargets};
    }
    if(section==='collapse') {
      const second='.rhine-collapse section[data-rhine-collapse-key=b]';await page.fill(`${second} input`,'第二组保留草稿');await page.press(`${second} [role=region] button`,'Space');
      const constrained=await page.evaluate(()=>({panels:document.querySelectorAll('.rhine-collapse [role=region]').length,key:document.activeElement.closest('[data-rhine-collapse-key]')?.dataset.rhineCollapseKey,value:document.querySelector('.rhine-collapse section[data-rhine-collapse-key=b] input')?.value}));
      assert(constrained.panels===1&&constrained.key==='b'&&constrained.value==='第二组保留草稿','mode switch lost the active panel',constrained);
      context.step='closed-panel-tab';await page.focus('.rhine-collapse section[data-rhine-collapse-key=a]>button');
      const sequence=[];for(const key of ['Tab','Tab','Shift+Tab','Shift+Tab']){await page.keyboard.press(key);sequence.push(await page.evaluate(()=>({tag:document.activeElement.tagName,key:document.activeElement.closest('[data-rhine-collapse-key]')?.dataset.rhineCollapseKey})));}
      assert(sequence[0].key==='b'&&sequence[1].tag==='INPUT'&&sequence[1].key==='b','closed panel leaked keyboard controls',sequence);
      await page.press('.rhine-collapse section[data-rhine-collapse-key=a]>button','Space');await page.press(`${second}>button`,'Space');
      assert(await page.evaluate(()=>document.querySelector('.rhine-collapse section[data-rhine-collapse-key=b] input').value==='第二组保留草稿'),'host draft lost across panel unmount');return {constrained,sequence};
    }
    if(section==='transfer') {
      await page.selectOption('.ds-section select','reject');await page.press("loc=role:checkbox[name='周宁']",'Space');await activate('移到已选');
      assert(await page.evaluate(()=>{const input=[...document.querySelectorAll('.rhine-transfer input')].find(e=>e.closest('label').textContent==='周宁');return input.checked&&input.closest('section').querySelector('h3').textContent.includes('可选');}),'rejected move cleared checks');
      await activate('刷新同值数组');assert(await page.evaluate(()=>document.activeElement.textContent==='刷新同值数组'),'equivalent target consumed stale focus');
      context.step='delayed-acceptance';await page.selectOption('.ds-section select','delay');await activate('移到已选');await activate('接受并继续编辑');
      assert(await page.evaluate(()=>{const active=document.activeElement,id=[...document.querySelectorAll('.ds-section label')].find(e=>e.textContent==='后续编辑')?.htmlFor;const input=[...document.querySelectorAll('.rhine-transfer input')].find(e=>e.closest('label').textContent==='周宁');return active.id===id&&!input.checked&&input.closest('section').querySelector('h3').textContent.includes('已选');}),'late acceptance stole focus or kept stale checks');
      await go('transfer',context.theme,context.zoom);context.step='partial-acceptance';await page.selectOption('.ds-section select','partial');await page.press("loc=role:checkbox[name='周宁']",'Space');await page.press("loc=role:checkbox[name='陈页']",'Space');await activate('移到已选');
      const partial=await page.evaluate(()=>[...document.querySelectorAll('.rhine-transfer input')].map(e=>({name:e.closest('label').textContent,checked:e.checked,side:e.closest('section').querySelector('h3').textContent})));
      assert(partial.find(e=>e.name==='陈页')?.checked&&!partial.find(e=>e.name==='周宁')?.checked&&partial.find(e=>e.name==='周宁')?.side.includes('已选'),'partial acceptance discarded rejected checks',partial);
      await page.press("loc=role:checkbox[name='禁用穿梭操作']",'Space');assert(await page.evaluate(()=>[...document.querySelectorAll('.rhine-transfer input,.rhine-transfer button')].every(e=>e.disabled)),'disabled transfer has an enabled action');return {rejected:true,lateFocus:'followup',partial};
    }
    if(section==='mentions') {
      await page.focus('.ds-section textarea');for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');await page.waitForSelector('[role=listbox]');await page.keyboard.press('ArrowUp');
      const active=await page.evaluate(()=>document.getElementById(document.querySelector('.ds-section textarea').getAttribute('aria-activedescendant'))?.textContent);
      assert(active==='周宁','initial ArrowUp did not start at last option',active);const animation=await page.evaluate(()=>getComputedStyle(document.querySelector('.rhine-combobox__list')).animationName);await page.keyboard.press('Enter');await page.waitForSelector('[role=listbox]',{state:'hidden'});
      assert(await page.evaluate(()=>document.querySelector('.ds-section textarea').value==='请 @周宁 '),'mention insertion lost the draft');return {active,animation};
    }
    if(section==='color-picker') {
      await page.fill('.rhine-color input[type=text]','invalid');
      let state=await page.evaluate(()=>({invalid:document.querySelector('.rhine-color input[type=text]').getAttribute('aria-invalid'),error:document.querySelector('.rhine-color [role=alert]')?.id,described:document.querySelector('.rhine-color input[type=text]').getAttribute('aria-describedby'),swatch:document.querySelector('.rhine-color input[type=color]').value}));
      assert(state.invalid==='true'&&state.error&&state.error===state.described&&state.swatch==='#425c4b','color error relation or swatch changed',state);
      await page.fill('.rhine-color input[type=text]','#112233');await page.waitForSelector('.rhine-color [role=alert]',{state:'hidden'});await page.fill('.rhine-color input[type=text]','#12');
      assert(await page.evaluate(()=>document.querySelector('.rhine-color input[type=color]').value==='#112233'),'invalid draft replaced the last valid swatch');
      await page.fill('.rhine-color input[type=text]','#abcdef');await page.press("loc=role:checkbox[name='禁用颜色输入']",'Space');assert(await page.evaluate(()=>[...document.querySelectorAll('.rhine-color input')].every(e=>e.disabled)&&!document.querySelector('.rhine-color [role=alert]')),'corrected/disabled color state mismatch');return state;
    }
    if(section==='anchor') {
      await go('anchor',context.theme,context.zoom,'anchor-a');await page.fill('.ds-section .rhine-field input','锚点往返草稿');await page.click("loc=role:link[name='第二节']");
      await page.waitForFunction(()=>location.hash==='#anchor::anchor-b'&&document.activeElement.id==='anchor-b');
      context.step='history-back-forward';await page.evaluate(()=>history.back());await page.waitForFunction(()=>location.hash==='#anchor::anchor-a'&&document.activeElement.id==='anchor-a');
      await page.evaluate(()=>history.forward());await page.waitForFunction(()=>location.hash==='#anchor::anchor-b'&&document.activeElement.id==='anchor-b');
      assert(await page.evaluate(()=>document.querySelector('.ds-section .rhine-field input').value==='锚点往返草稿'&&document.title.startsWith('Anchor')),'anchor history remounted the chapter');
      const url=new URL(base);url.search=`?theme=${context.theme}`;url.hash='anchor-a';await page.goto(url.href);await page.waitForFunction(()=>document.title.startsWith('Anchor')&&document.activeElement.id==='anchor-a');
      assert(await page.evaluate(()=>document.title.startsWith('Anchor')&&document.activeElement.id==='anchor-a'),'legacy anchor deep link was lost');return {history:true,draft:true,legacy:true};
    }
  };
  try {
    if(options.interactions!==false) for(const [width,zoom] of (options.scenarios??[[880,1],[400,2]]))for(const section of sections){
      context={kind:'interaction',theme:'rhine',width,zoom,section};await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:false});await go(section,'rhine',zoom);
      const result=await run(section);await record({...context,pass:true,result});
    }
    if(options.layouts!==false) for(const theme of (options.themes??['rhine','arknights','neo-brutalism','neutral','graphite']))for(const width of [400,520,880])for(const zoom of [1,2])for(const section of sections){
      context={kind:'layout',theme,width,zoom,section};await page.cdp('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:false});await go(section,theme,zoom);
      if(section==='color-picker')await page.fill('.rhine-color input[type=text]','invalid');
      const measured=await layout();assert(measured.width===width&&!measured.overflow&&measured.clipped.length===0,'clipped native control/fieldset',measured);
      if(section==='rate'||section==='color-picker'||section==='upload'){
        const targets=await page.evaluate(({section,zoom})=>{
          const nodes=section==='rate'?[...document.querySelectorAll('.ds-section .rhine-rate label')]:section==='color-picker'?[...document.querySelectorAll('.rhine-color input')]:[document.querySelector('.rhine-upload input[type=file]')];
          return nodes.map(node=>({height:node.getBoundingClientRect().height/zoom,width:node.getBoundingClientRect().width/zoom}));
        },{section,zoom});assert(targets.every(target=>target.height>=43.5&&target.width>=43.5),'standard target under 44 CSS pixels',targets);measured.targets=targets;
      }
      await record({...context,pass:true,result:measured});
    }
    if(options.interactions!==false&&options.sections===undefined)for(const motion of ['normal','system-reduced','manual-reduced']){
      context={kind:'motion',section:'mentions',theme:'rhine',width:400,zoom:2,motion};await page.cdp('Emulation.setDeviceMetricsOverride',{width:400,height:800,deviceScaleFactor:1,mobile:false});await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:motion==='system-reduced'?'reduce':'no-preference'}]});await go('mentions','rhine',2);
      if(motion==='manual-reduced')await page.press('input[type=radio][value=reduced]','Space');const result=await run('mentions');assert(motion==='normal'?result.animation!=='none':result.animation==='none','reduced motion did not apply',result);await record({...context,pass:true,result});
    }
    await page.cdp('Emulation.setEmulatedMedia',{features:[]});
  } catch(error) {
    let diagnostic;
    if(!/unresponsive|control|inactive|unassigned|task space not found/i.test(String(error))) {try{diagnostic=await page.evaluate(()=>({url:location.href,focus:document.activeElement?.outerHTML.slice(0,350),body:document.querySelector('.ds-section')?.textContent.slice(0,1200)}));}catch{ /* Preserve original failure. */ }}
    failures.push({...context,error:String(error),diagnostic});
  }
  return {pass:failures.length===0,sampleCount:samples.length,samples,failures,scope:'Owned Chromium production gallery; native keys/history/file API, CSS zoom, no OS picker or screen-reader claim'};
}
