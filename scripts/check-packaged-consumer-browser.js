async (page, options) => {
  const samples=[],failures=[],base=options.base.replace(/\/?$/,'/'),sections=['form','image','tour','data','semantics'];let context={},serial=0;
  const assert=(condition,message,value)=>{if(!condition)throw new Error(`${message}${value===undefined?'':': '+JSON.stringify(value)}`);};
  const record=async sample=>{samples.push(sample);if(options.record)await options.record(sample);};
  const activate=(name,scope)=>options.activate(name,scope);
  const go=async(scene,theme='rhine',zoom=1)=>{
    const url=base+'?run='+encodeURIComponent(`${options.engine}-${++serial}`)+'#'+scene;
    await page.goto(url);await page.waitForSelector(`[data-scene=${scene}]`);
    await page.selectOption('.consumer>.rhine-field select',theme);
    await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);window.scrollTo(0,0);},zoom);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  const data=()=>page.evaluate(async()=>{
    const form=document.getElementById('consumer-form'),data=new FormData(form),result={};
    for(const[key,value]of data){const saved=value instanceof File?{name:value.name,size:value.size,text:await value.text()}:value;const prev=result[key];result[key]=prev===undefined?saved:Array.isArray(prev)?[...prev,saved]:[prev,saved];}
    return result;
  });
  try{
    await page.goto(base+'root-only/root-only.html');await page.waitForSelector('[data-root-only]');
    const automatic=await page.evaluate(()=>({button:getComputedStyle(document.querySelector('.rhine-button')).minHeight,color:document.querySelector('.rhine-color input[type=text]').getBoundingClientRect().height,token:getComputedStyle(document.querySelector('.rhine-theme')).getPropertyValue('--rhine-ink').trim()}));
    assert(automatic.button==='44px'&&automatic.color>=43.5&&automatic.token,'root-only entry lost automatic CSS',automatic);await record({kind:'root-only-css',pass:true,result:automatic});
    if(options.cssNegative){const negative=await page.evaluate(()=>{const sheets=[...document.styleSheets],before=sheets.map(sheet=>sheet.disabled);sheets.forEach(sheet=>sheet.disabled=true);const missing=getComputedStyle(document.querySelector('.rhine-button')).minHeight;for(let i=0;i<sheets.length;i++)sheets[i].disabled=before[i];return{missing,detected:missing!=='44px',restored:getComputedStyle(document.querySelector('.rhine-button')).minHeight};});assert(negative.detected&&negative.restored==='44px','CSS-loss counterexample was not detected',negative);await record({kind:'css-loss-counterexample',pass:true,result:negative});}
    if(options.interactions!==false)for(const[width,zoom]of(options.scenarios??[[880,1],[400,2]])){
      await options.viewport(width,800);
      context={kind:'form',width,zoom};await go('form','rhine',zoom);
      const artifact=await page.evaluate(async()=>{const health=await(await fetch('/health')).json();const logo=document.querySelector('img[alt="公共SVG入口"]');return{artifact:health.artifact,logo:!!logo?.complete&&logo.naturalWidth>0,count:document.querySelector('.consumer').textContent.includes('公开值导出：136')};});
      assert(artifact.artifact===options.artifact&&artifact.logo&&artifact.count,'wrong artifact or missing public entry asset',artifact);
      await activate('提交快照');await page.waitForFunction(()=>document.activeElement?.classList.contains('rhine-error-summary'));
      await page.press('a[href="#workspace"]','Enter');assert(await page.evaluate(()=>document.activeElement.id==='workspace'&&location.hash==='#form'),'error summary changed route or lost field');
      await page.fill('#workspace','制品自由文本');let expectedTime;if(options.editTime)expectedTime=await options.editTime();else{const before=await page.evaluate(()=>document.getElementById('time').value);await page.focus('#time');await page.keyboard.press('ArrowUp');const edited=await page.evaluate(()=>({value:document.getElementById('time').value,valid:document.getElementById('time').validity.valid}));assert(edited.value!==before&&edited.valid,'native time editing failed',edited);expectedTime=edited.value;}await page.fill('#color','#abcdef');await page.setInputFiles('#attachment-file',[options.uploadFile]);
      const normal=await data();assert(normal.workspace==='制品自由文本'&&normal.score==='2'&&normal.volume==='30'&&normal.time===expectedTime&&normal.color==='#abcdef'&&normal.externalTime==='10:00','native field values did not serialize',normal);
      assert(JSON.stringify(normal.path)===JSON.stringify(['r','leaf'])&&normal.members==='a'&&normal.attachments?.text===options.uploadText,'composite values/files did not serialize',normal);
      await activate('提交快照');await page.waitForSelector('[data-snapshot]');
      // Consumer-owned checkbox labels are exact and do not depend on browser locale.
      await options.toggle('只读字段');await page.focus('#workspace');await page.keyboard.type('X');await page.focus('#volume');await page.keyboard.press('ArrowRight');
      const readonly=await data();assert(readonly.workspace===normal.workspace&&readonly.volume===normal.volume&&readonly.attachments?.text===normal.attachments.text,'readonly changed content or dropped controlled files',readonly);
      await options.toggle('禁用字段');const disabled=await data();assert(Object.keys(disabled).length===0,'disabled controls remained successful fields',disabled);await record({...context,pass:true,result:{normal,readonly,disabled}});

      context={kind:'data',width,zoom};await go('data','rhine',zoom);
      await page.selectOption('[data-scene=data] select','lazy');await page.press('#data-path','Space');await page.press('.rhine-cascader [role=option]','Space');
      await page.waitForFunction(()=>document.querySelector('.rhine-cascader')?.getAttribute('aria-busy')==='true');assert(await page.evaluate(()=>document.querySelector('[data-expansion]').textContent.includes('r')&&document.getElementById('data-path').textContent.includes('未选择')),'unloaded branch was treated as a leaf');
      await page.selectOption('[data-scene=data] select','error');
      if(!await page.evaluate(()=>!!document.querySelector('.rhine-cascader'))){await page.press('#data-path','Space');await page.press('.rhine-cascader [role=option]','Space');}
      await page.press('.rhine-cascader .rhine-data-feedback button','Space');await page.waitForFunction(()=>document.querySelector('.rhine-cascader')?.getAttribute('aria-busy')==='true');
      await page.selectOption('[data-scene=data] select','ready');
      if(!await page.evaluate(()=>!!document.querySelector('.rhine-cascader'))){await page.press('#data-path','Space');await page.press('.rhine-cascader [role=option]','Space');}
      await page.press('.rhine-cascader [role=option]','Space');await page.waitForFunction(()=>document.getElementById('data-path').textContent.includes('根 / 叶子'));
      await page.press('.rhine-transfer section:first-child li:first-child input[type=checkbox]','Space');
      await page.selectOption('[data-scene=data] select','loading');await page.selectOption('[data-scene=data] select','ready');assert(await page.evaluate(()=>document.querySelector('.rhine-transfer section:first-child li:first-child input[type=checkbox]').checked),'loading erased temporary selection');
      await page.selectOption('[data-scene=data] select','error');await page.press('.rhine-transfer .rhine-data-feedback button','Space');await page.selectOption('[data-scene=data] select','ready');await page.press('.rhine-transfer__actions button:first-child','Space');
      const moved=await page.evaluate(()=>{const input=document.activeElement;return input instanceof HTMLInputElement&&input.closest('section')?.querySelector('h3').textContent.includes('已选');});assert(moved,'accepted move lost destination focus');await page.selectOption('[data-scene=data] select','empty');assert(await page.evaluate(()=>document.querySelector('.rhine-transfer').textContent.includes('原值保留')),'confirmed missing detail was silently discarded');await record({...context,pass:true});

      context={kind:'image',width,zoom};await go('image','rhine',zoom);await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loaded');
      await activate('慢速图片');await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loading');
      const released=await page.evaluate(async()=>await(await fetch('/release-image?run='+encodeURIComponent(new URLSearchParams(location.search).get('run')))).json());assert(released.released===1,'fixture did not hold a real resource',released);await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loaded');
      await activate('损坏图片');await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='error');await activate('可恢复图片');await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='error');await activate('重试缩略图');await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loaded');
      await activate('查看制品图');await page.waitForFunction(()=>{const image=document.querySelector('.rhine-image__preview img');return image?.complete&&image.naturalWidth>0;});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.rhine-dialog')&&document.activeElement?.getAttribute('aria-label')==='查看制品图');await record({...context,pass:true});

      context={kind:'tour',width,zoom};await go('tour','rhine',zoom);await activate('开启目标引导');await page.waitForFunction(()=>document.querySelector('.rhine-tour')?.dataset.targetState==='ready');
      let geometry=await page.evaluate(zoom=>{const panel=document.querySelector('.rhine-tour'),target=document.getElementById('package-target'),halo=document.querySelector('[data-rhine-tour-target]'),p=panel.getBoundingClientRect(),t=target.getBoundingClientRect(),h=halo.getBoundingClientRect();return{bounded:p.left>=-1&&p.top>=-1&&p.right<=innerWidth+1&&p.bottom<=innerHeight+1,padding:Math.abs(t.left-h.left-8*zoom)<1,link:target.getAttribute('aria-describedby').split(/\s+/).every(id=>!!document.getElementById(id))};},zoom);assert(geometry.bounded&&geometry.padding&&geometry.link,'guide geometry/description was wrong',geometry);
      await activate('转到目标');await page.fill('#package-target','制品目标草稿');assert(await page.evaluate(()=>document.activeElement.id==='package-target'&&!!document.querySelector('.rhine-tour')),'target editing dismissed or refocused guide');
      await options.toggle('移除消费目标');await page.waitForFunction(()=>document.querySelector('.rhine-tour')?.dataset.targetState==='missing');assert(await page.evaluate(()=>[...document.querySelectorAll('.rhine-tour button')].find(button=>button.textContent==='完成')?.disabled&&!document.querySelector('[data-rhine-tour-target]')),'missing target was marked complete');
      await activate('重新查找');await page.waitForFunction(()=>document.querySelector('.rhine-tour')?.dataset.targetState==='ready');assert(await page.evaluate(()=>document.getElementById('package-target').value==='制品目标草稿'),'recovery cleared host text');await activate('关闭引导');await page.waitForFunction(()=>!document.querySelector('.rhine-tour'));assert(await page.evaluate(()=>document.getElementById('package-target').getAttribute('aria-describedby')==='package-target-help'),'guide failed to remove its own description');await record({...context,pass:true,result:geometry});

      context={kind:'semantics',width,zoom};await go('semantics','rhine',zoom);assert(await page.evaluate(()=>document.querySelectorAll('.rhine-masonry [role=listitem]').length===3),'Masonry has no real list items');await page.focus('[role=tree]>[role=treeitem]');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert(await page.evaluate(()=>document.querySelector('[data-scene=semantics]>p[data-selected]').textContent==='选中：leaf'),'controlled Tree sample did not react');await record({...context,pass:true});
    }
    if(options.layouts!==false)for(const theme of ['rhine','arknights','neo-brutalism','neutral','graphite'])for(const width of [400,520,880])for(const zoom of [1,2])for(const scene of sections){
      context={kind:'layout',theme,width,zoom,scene};await options.viewport(width,800);await go(scene,theme,zoom);
      const result=await page.evaluate(()=>({viewport:innerWidth,theme:document.querySelector('[data-rhine-theme]')?.getAttribute('data-rhine-theme'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,clipped:[...document.querySelectorAll('[data-scene] button,[data-scene] select,[data-scene] textarea,[data-scene] fieldset,[data-scene] input:not([type=hidden]):not([type=radio]):not([type=checkbox])')].filter(element=>{const rect=element.getBoundingClientRect();return rect.width>0&&(rect.left<0||rect.right>innerWidth+1);}).map(element=>({tag:element.tagName,id:element.id,rect:element.getBoundingClientRect().toJSON()}))}));
      assert(result.viewport===width&&result.theme===theme&&!result.overflow&&!result.clipped.length,'packaged native controls were clipped',result);await record({...context,pass:true,result});
    }
    if(options.motion&&options.media)for(const motion of ['normal','system-reduced','manual-reduced']){
      context={kind:'motion',width:400,zoom:2,motion};await options.viewport(400,800);await options.media(motion==='system-reduced'?'reduce':'no-preference');await go('image','rhine',2);
      if(motion==='manual-reduced')await page.evaluate(()=>document.querySelector('.rhine-theme').setAttribute('data-rhine-motion','reduced'));
      await activate('慢速图片');await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loading');
      const animation=await page.evaluate(()=>getComputedStyle(document.querySelector('.rhine-image>button .rhine-spinner')).animationName);assert(motion==='normal'?animation!=='none':animation==='none','resource busy motion did not follow preference',animation);
      await page.evaluate(async()=>await fetch('/release-image?run='+encodeURIComponent(new URLSearchParams(location.search).get('run'))));await page.waitForFunction(()=>document.querySelector('[data-image-state]')?.dataset.imageState==='loaded');
      await go('tour','rhine',2);if(motion==='manual-reduced')await page.evaluate(()=>document.querySelector('.rhine-theme').setAttribute('data-rhine-motion','reduced'));await activate('开启目标引导');await page.waitForFunction(()=>document.querySelector('.rhine-tour')?.dataset.targetState==='ready');await activate('转到目标');await page.fill('#package-target','动态偏好路径');assert(await page.evaluate(()=>document.activeElement.id==='package-target'&&!!document.querySelector('.rhine-tour')),'motion preference broke guide focus');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.rhine-tour'));await record({...context,pass:true,result:{animation}});
    }
    if(options.media)await options.media('no-preference');
  }catch(error){failures.push({...context,error:String(error)});}
  return{pass:failures.length===0,sampleCount:samples.length,samples,failures,artifact:options.artifact,engine:options.engine};
}
