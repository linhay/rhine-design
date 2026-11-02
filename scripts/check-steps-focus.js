// Run against the production #navigation showcase with the ego-browser Page API.
// Returns evidence; callers must inspect pass/failures, not just the process exit code.
async (page) => {
  await page.cdp('Emulation.setDeviceMetricsOverride',{width:880,height:800,deviceScaleFactor:1,mobile:false});
  await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await page.evaluate(()=>{document.documentElement.style.zoom='1';});
  const failures=[], samples=[];
  const check=(ok,message)=>{if(!ok) failures.push(message);};
  const host='[data-steps-demo="host"]', standalone='[data-steps-demo="standalone"]';
  const probe=new URL(await page.url()).searchParams.get('stepsProbe');
  const domClick=async (selector,text)=>page.evaluate(({selector,text})=>{
    const node=[...document.querySelectorAll(selector)].find(node=>node.textContent===text);
    if(!node) throw new Error(`Missing ${text}`); node.click();
  },{selector,text});
  const inspect=async (scope,expected)=>page.evaluate(({scope,expected})=>{
    const root=document.querySelector(scope),active=document.activeElement,current=root.querySelector('[aria-current="step"]');
    const rect=active.getBoundingClientRect(),style=getComputedStyle(active);
    const label=active.querySelector('strong'); const range=document.createRange(); if(label)range.selectNodeContents(label);
    const textRects=label?[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})):[];
    return {expected,active:active.tagName,connected:active.isConnected,current:active===current,
      heading:active===root.querySelector('h4'),button:active.tagName==='BUTTON',body:active===document.body,
      visible:rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth&&style.visibility==='visible'&&style.opacity!=='0',
      focusVisible:active.matches(':focus-visible'),outline:style.outlineStyle,outlineWidth:style.outlineWidth,
      currentIndex:[...root.querySelectorAll('.rhine-steps>li')].indexOf(current),buttons:root.querySelectorAll('.rhine-steps button').length,
      draft:root.querySelector('input:not([type="checkbox"])')?.value,error:current?.textContent.includes('请核对范围'),textRects,
      viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth};
  },{scope,expected});
  const activate=async(scope,index,key,expected,tag)=>{
    const selector=`${scope} .rhine-steps>li:nth-child(${index+1}) button`;
    await page.evaluate(selector=>document.querySelector(selector).scrollIntoView({block:'center'}),selector);
    await page.focus(selector);
    if(probe==='lost-focus') await page.evaluate(()=>{
      document.addEventListener('focusin',event=>{if(event.target.matches('.rhine-steps>li')) event.target.blur();},{capture:true,once:true});
    });
    await page.keyboard.press(key);
    const state=await inspect(scope,expected); samples.push({tag,key,...state});
    check(state.connected&&!state.body,`${tag}: connected meaningful focus`);
    check(state[expected],`${tag}: ${expected} focus`);
    check(state.visible,`${tag}: visible focus target`);
    if(expected==='current') {
      check(state.currentIndex===index&&state.buttons===index,`${tag}: current semantics and no skipping`);
      check(state.focusVisible&&state.outline!=='none'&&parseFloat(state.outlineWidth)>0,`${tag}: visible keyboard outline`);
    }
    return state;
  };
  // Full keyboard paths: first, middle, and all-complete return; repeat with Enter and Space.
  for(const key of ['Enter','Space']) {
    await domClick(`${standalone} button`,'重置步骤');
    await domClick(`${standalone} button`,'模拟本步完成');
    await activate(standalone,0,key,'current',`first/${key}`);
    for(let i=0;i<3;i++) await domClick(`${standalone} button`,'模拟本步完成');
    await activate(standalone,2,key,'current',`complete/${key}`);
    await activate(standalone,1,key,'current',`middle/${key}`);
    await activate(standalone,0,key,'current',`continuous/${key}`);
    await page.keyboard.press('Tab');
    check(await page.evaluate(()=>document.activeElement.textContent==='模拟本步完成'),`first/${key}: next Tab`);
    for(const mode of ['accept','reject','focus','layout','flush','flush-focus']) {
      await domClick(`${host} button`,'恢复到核对结果');
      await page.selectOption(`${host} select`,mode);
      await activate(host,1,key,mode==='reject'?'button':['focus','layout','flush-focus'].includes(mode)?'heading':'current',`${mode}/${key}`);
      if(mode==='reject') {
        await page.focus(`${host} input:not([type="checkbox"])`);
        await domClick(`${host} button`,'外部切换步骤');
        check(await page.evaluate(selector=>document.activeElement===document.querySelector(selector),`${host} input:not([type="checkbox"])`),`rejected/${key}: external update preserves field focus`);
      } else {
        await page.keyboard.press('Tab');
        check(await page.evaluate(selector=>document.activeElement===document.querySelector(selector),`${host} input:not([type="checkbox"])`),`${mode}/${key}: next Tab enters draft`);
      }
    }
  }
  if(!probe) for(const theme of ['rhine','arknights','neo-brutalism','neutral','graphite']) {
    for(const config of [{width:880,height:800,zoom:1,motion:'normal'},{width:520,height:600,zoom:1,motion:'system'},{width:400,height:520,zoom:2,motion:'manual'}]) {
      await page.cdp('Emulation.setDeviceMetricsOverride',{width:config.width,height:config.height,deviceScaleFactor:1,mobile:false});
      await page.cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:config.motion==='system'?'reduce':'no-preference'}]});
      await page.selectOption('select >> nth=0',theme);
      await page.evaluate(({zoom,motion})=>{
        document.documentElement.style.zoom=String(zoom);
        const radio=[...document.querySelectorAll('input[type="radio"]')].find(x=>x.closest('label')?.textContent.includes(motion==='manual'?'减少动态':'跟随系统')); radio?.click();
      },config);
      await page.selectOption(`${host} select`,'accept');
      await page.evaluate(selector=>{for(const input of document.querySelectorAll(`${selector} [role="switch"]`)) if(!input.checked)input.click();},host);
      await domClick(`${host} button`,'恢复到核对结果');
      const state=await activate(host,0,'Enter','current',`${theme}/${config.width}/${config.zoom}/${config.motion}`);
      check(state.draft==='合成任务草稿'&&state.error,`${theme}: retains draft/error`);
      check(!state.overflow,`${theme}/${config.width}: no document overflow`);
      // Content can exceed a short viewport; each label line must remain inside horizontal bounds.
      check(state.textRects.every(r=>r.x>=-1&&r.x+r.width<=config.width+1),`${theme}/${config.width}: full long label width`);
    }
  }
  return {pass:failures.length===0,failures,samples,probe,browser:await page.evaluate(()=>navigator.userAgent),boundary:'Real browser keyboard; programmatic setup/focus; CSS zoom, not native zoom. No speech or backend claim.'};
}
