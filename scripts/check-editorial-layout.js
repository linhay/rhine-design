async page => {
  page.setDefaultTimeout(5000);
  const {base,probe,quick,paletteFilter,shell}=await page.evaluate(()=>({base:location.origin,shell:new URLSearchParams(location.search).has('editorialShell'),paletteFilter:new URLSearchParams(location.search).get('onlyPalette'),probe:new URLSearchParams(location.search).get('probe'),quick:new URLSearchParams(location.search).has('quick')}));
  const samples=[],failures=[],errors=[],rows=[],observations=[],portalSamples=[];
  const onError=e=>errors.push(String(e));page.on('pageerror',onError);
  const check=(ok,detail)=>{if(!ok)failures.push(detail);};
  const assert=(ok,detail)=>{if(!ok)throw new Error(detail);};
  const settle=()=>page.waitForTimeout(220);let context;
  const measure = async (locator, role, kind = 'text', pseudo = null) => {
    await locator.scrollIntoViewIfNeeded();
    const probeControlOpacity = probe === 'opacity' && ['return-focus','textarea-boundary'].includes(role);
    if (probeControlOpacity) await locator.evaluate(e=>e.style.opacity='0.1');
    const strokeOnly = kind==='graphic' && ['chart-line','chart-missing'].includes(role);
    const value = await locator.evaluate((el, { kind, pseudo, strokeOnly }) => {
      const css = getComputedStyle(el, pseudo), chain = [];
      const rgba = value => {
        // Browser resolves CSS Color 4 too; no hand-parsed color(srgb) fallback.
        const rgb = value.match(/^rgba?\(([^)]+)\)$/);
        if (rgb) { const parts = rgb[1].split(/[,\s/]+/).map(Number); return [...parts.slice(0,3), parts[3] ?? 1]; }
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
        const p = [...ctx.getImageData(0, 0, 1, 1).data]; return [...p.slice(0, 3), p[3] / 255];
      };
      const over = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3])).concat(1);
      const lum = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
      // Compositing is affine in each alpha, so endpoint combinations bound
      // each RGB channel. Luminance is monotone in each channel, but need not
      // be monotone along a mixed-channel color path (e.g. red over green).
      const luminanceRange = colors => [
        lum([0,1,2].map(i=>Math.min(...colors.map(c=>c[i])))),
        lum([0,1,2].map(i=>Math.max(...colors.map(c=>c[i])))),
      ];
      const contrastLowerBound = (foregrounds, backgrounds) => {
        const [fMin,fMax] = luminanceRange(foregrounds), [bMin,bMax] = luminanceRange(backgrounds);
        return fMax < bMin ? (bMin+.05)/(fMax+.05) : bMax < fMin ? (fMin+.05)/(bMax+.05) : 1;
      };
      const shadowColor = css.boxShadow.match(/rgba?\([^)]+\)/)?.[0];
      const shadowGeometry = css.boxShadow.replace(/rgba?\([^)]+\)/, '').trim();
      const insetFocus = kind === 'focus' && css.outlineStyle === 'none' && !!shadowColor && /^0px 0px 0px [1-9][\d.]*px inset$/.test(shadowGeometry);
      let node = kind === 'boundary' || (kind === 'focus' && !insetFocus) ? el.parentElement : el;
      while (node) { const s = getComputedStyle(node); chain.unshift({ tag: node.tagName, color: s.backgroundColor, image: s.backgroundImage, opacity: s.opacity }); node = node.parentElement; }
      let backgrounds = [[255, 255, 255, 1]], unsupported = [], opacityIssues = [];
      for (const layer of chain) {
        const color = rgba(layer.color);
        if (color[3] === 1) { unsupported = []; backgrounds = [color]; }
        else backgrounds = backgrounds.map(bg => over(color, bg));
        if (layer.image !== 'none') {
          // Only the existing single-color sweep, grid and dot shapes. Compose
          // CSS image layers back-to-front, including every grid intersection.
          const images = layer.image.match(/(?:linear|radial)-gradient\((?:[^()]|\([^()]*\))*\)/g) || [];
          const known = images.join(', ') === layer.image && images.every(image => {
            const shape = image.replace(/rgba?\([^)]+\)/g,'C');
            const stops = image.match(/rgba?\([^)]+\)/g)?.map(rgba) || [];
            const painted = stops.filter(c=>c[3]>0);
            return /^(?:linear-gradient\(105deg, C 30%, C 50%, C 70%\)|linear-gradient\((?:90deg, )?C 1px, C 1px\)|radial-gradient\(circle, C 0?\.8px, C 0?\.9px\))$/.test(shape) && painted.length > 0 && painted.every(c=>c.slice(0,3).join()===painted[0].slice(0,3).join());
          });
          if (known) for (const image of images.reverse()) {
            const stops = image.match(/rgba?\([^)]+\)/g).map(rgba);
            backgrounds = backgrounds.flatMap(bg=>stops.map(stop=>over(stop,bg)));
          }
          else unsupported.push('background-image: ' + layer.image);
        }
        if (Number(layer.opacity) !== 1) opacityIssues.push('ancestor opacity: ' + layer.opacity);
      }
      if (Number(css.opacity) !== 1) opacityIssues.push('measured opacity: ' + css.opacity);
      const strokePainted=kind==='graphic' && css.stroke!=='none' && parseFloat(css.strokeWidth)>0 && Number(css.strokeOpacity)>0 && rgba(css.stroke)[3]>0;
      const fillPainted=kind==='graphic' && !strokeOnly && css.fill!=='none' && Number(css.fillOpacity)>0 && rgba(css.fill)[3]>0;
      if(strokePainted && Number(css.strokeOpacity)!==1)opacityIssues.push('stroke opacity: '+css.strokeOpacity);
      if(fillPainted && Number(css.fillOpacity)!==1)opacityIssues.push('fill opacity: '+css.fillOpacity);
      unsupported.push(...opacityIssues);
      const disabled = el.matches(':disabled,[aria-disabled=true]');
      const raw = kind === 'boundary' ? css.borderTopColor : kind === 'focus' ? (insetFocus ? shadowColor : css.outlineColor) : kind === 'indicator' ? css.backgroundColor : kind === 'graphic' ? (strokePainted ? css.stroke : fillPainted ? css.fill : 'rgba(0,0,0,0)') : css.color;
      const foregrounds = backgrounds.map(bg => {
        let fg = over(rgba(raw), bg);
        if (disabled && Number(css.opacity) !== 1) fg = over([...fg.slice(0,3), Number(css.opacity)], bg);
        return fg;
      });
      const bg = backgrounds[0], fg = foregrounds[0];
      // Channel envelopes include interior luminance extrema. Overlapping
      // foreground/background intervals cannot certify contrast.
      let ratio = contrastLowerBound(foregrounds, backgrounds);
      const boundaryFillRatio = kind === 'boundary' ? contrastLowerBound(backgrounds.map(bg=>over(rgba(css.backgroundColor),bg)),backgrounds) : null;
      if (boundaryFillRatio !== null) ratio = Math.max(ratio,boundaryFillRatio);
      const large = parseFloat(css.fontSize) >= 24 || (parseFloat(css.fontSize) >= 56 / 3 && parseFloat(css.fontWeight) >= 700);
      const threshold = kind === 'text' ? (large ? 3 : 4.5) : 3;
      const visible = !!el.getClientRects().length && css.visibility === 'visible' && css.display !== 'none';
      const graphicPainted = strokePainted || fillPainted;
      const drawn = kind === 'focus' ? (insetFocus || (css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0)) && el.matches(':focus-visible') : kind === 'indicator' ? css.content !== 'none' && css.transform !== 'matrix(0, 0, 0, 1, 0, 0)' : kind === 'boundary' ? boundaryFillRatio >= 3 || (css.borderTopStyle !== 'none' && parseFloat(css.borderTopWidth) > 0) : kind === 'graphic' ? graphicPainted : true;
      return { paint: kind==='graphic' ? {stroke:css.stroke,strokeWidth:css.strokeWidth,strokeOpacity:css.strokeOpacity,fill:css.fill,fillOpacity:css.fillOpacity,strokePainted,fillPainted,strokeOnly} : null, measuredOpacity: css.opacity, measuredDisplay: css.display, raw, foreground: fg, background: bg, ratio, boundaryFillRatio, ratioBound: backgrounds.length > 1, backgroundLuminanceRange: luminanceRange(backgrounds), foregroundLuminanceRange: luminanceRange(foregrounds), backgrounds, insetFocus, threshold, disabled, visible, drawn, unsupported, chain, fontSize: css.fontSize, fontWeight: css.fontWeight, text: (el.value || el.textContent || '').trim().slice(0, 90) };
    }, { kind, pseudo, strokeOnly });
    if (probeControlOpacity) await locator.evaluate(e=>e.style.removeProperty('opacity'));
    const sample = { ...context, role, kind, pseudo, ...value, status: value.disabled ? 'EXEMPT' : value.unsupported.length ? 'UNMEASURED' : value.visible && value.drawn && value.ratio >= value.threshold ? 'PASS' : 'FAIL' };
    samples.push(sample);
    check(sample.status === 'PASS' || sample.status === 'EXEMPT', { ...context, role, kind, status: sample.status, ratio: value.ratio, threshold: value.threshold, unsupported: value.unsupported });
    return sample;
  };
  const keyboardFocus = async (locator, role) => {
    await locator.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await settle();
    await measure(locator, role, 'focus');
  };
  const allCases=[400,520,880].flatMap(width=>[1,2].map(zoom=>({width,zoom,motion:'normal'}))).concat(['system','manual'].map(motion=>({width:880,zoom:1,motion})));
  const cases=quick||probe?[{width:880,zoom:1,motion:'normal'}]:allCases;
  const scenes=quick||probe?[['chart','unknown-marker','graphic-opacity','inactive-paint','missing-fill-only'].includes(probe)?'overview':'report']:['report','release','overview'];
  const palettes=quick||probe?['swiss']:paletteFilter?[paletteFilter]:['neutral','swiss'];
  const layouts=['editorial'];
  const sceneLabels={report:'研究报告',release:'发布说明',overview:'数据概览'};
  const valueLabels={report:'有效样本',release:'构建体积',overview:'p95 延迟'};
  const highTitle={report:'检索与结果核对',release:'界面资源与基础样式',overview:'跨多层上下文加载并保留阅读位置的详情读取路径'};
  for(const scene of scenes)for(const palette of palettes)for(const layout of layouts)for(const scenario of cases){
    context={scene,palette,layout,...scenario};const {width,zoom,motion}=scenario;
    const startFailures=failures.length;
    try{
      await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});
      await page.goto(shell ? `${base}/?theme=graphite&editorialCase=${scene}-${palette}-${width}-${zoom}-${motion}#editorial-layout` : `${base}/?fixture=editorial-layout&scene=${scene}&palette=${palette}&zoom=${zoom}&motion=${motion}`);
      if(shell){
        await page.evaluate(zoom=>document.documentElement.style.zoom=String(zoom),zoom);
        await page.getByLabel('局部配色',{exact:true}).selectOption(palette);
        await page.getByRole('tab',{name:sceneLabels[scene],exact:true}).click();
        const motionControl=page.getByRole('radio',{name:motion==='manual'?'减少动态':'跟随系统',exact:true});await motionControl.focus();await page.keyboard.press('Space');
      }
      const initialHash=await page.evaluate(()=>location.hash);
      await page.evaluate(()=>document.fonts.ready);await settle();
      const main=page.locator(`section[data-scene=${scene}]`),root=page.locator('.rhine-theme');
      if(probe==='overflow')await main.locator('.rhine-editorial-grid').evaluate(e=>e.style.minWidth='1000px');
      if(probe==='clip')await main.locator('[data-evidence=summary]').evaluate(e=>{e.style.height='10px';e.style.overflow='hidden';});
      if(probe==='portal')await root.evaluate(e=>{e.setAttribute('data-rhine-editorial','neutral');e.querySelector('.rhine-editorial-wrap').style.setProperty('--rhine-green','#2348b5');});
      const shape=await main.evaluate(e=>{
        const fragments=selector=>{const element=e.querySelector(selector),r=document.createRange();r.selectNodeContents(element);return [...r.getClientRects()].map(b=>({x:b.x,y:b.y,width:b.width,height:b.height}));};
        const clipped=[];for(const el of e.querySelectorAll('h1,h2,h3,p,label,li,.rhine-notice__body')){
          if(!el.checkVisibility({checkVisibilityCSS:true}))continue;
          for(const node of el.childNodes){if(node.nodeType!==Node.TEXT_NODE||!node.textContent.trim())continue;const r=document.createRange();r.selectNodeContents(node);
            for(const rect of r.getClientRects())for(let a=el;a&&a!==e.parentElement;a=a.parentElement){const css=getComputedStyle(a),box=a.getBoundingClientRect();
              if((['hidden','clip'].includes(css.overflowX)&&(rect.left<box.left-1||rect.right>box.right+1))||(['hidden','clip'].includes(css.overflowY)&&(rect.top<box.top-1||rect.bottom>box.bottom+1)))clipped.push({text:node.textContent.slice(0,60),ancestor:a.className});
            }
          }
        }
        const style=getComputedStyle(e.querySelector('.rhine-editorial-prose'));
        return{clipped,titleFragments:fragments('h1'),summaryFragments:fragments('[data-evidence=summary]'),proseWidth:e.querySelector('.rhine-editorial-prose').getBoundingClientRect().width,proseFont:style.fontSize,proseLineHeight:style.lineHeight,text:e.innerText,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};
      });
      check(!shape.clipped.length,{...context,role:'content-clipping',clipped:shape.clipped});check(shape.documentWidth<=width+1,{...context,role:'document-overflow',documentWidth:shape.documentWidth,width});
      observations.push({...context,...shape});
      if(!probe&&motion==='normal'&&((width===880&&zoom===1)||(width===400&&zoom===2))){await page.screenshot({path:`screenshots/${scene}-${palette}-${layout}-${width}-${zoom}.png`,fullPage:true});}
      await measure(main.locator('h1'),'heading');await measure(main.locator('[data-evidence=summary]'),'summary');await measure(main.locator('.rhine-editorial-prose').first(),'prose');
      await measure(main.locator('.rhine-text--muted').first(),'muted');await measure(main.locator('.rhine-tone-warning .rhine-notice__body').first(),'warning');
      const table=main.getByRole('region',{name:`${sceneLabels[scene]}明细，可横向滚动`});
      await measure(table.locator('.rhine-tone-success'),'success-badge');await measure(table.locator('.rhine-tone-error'),'error-badge');
      await measure(table.locator('[data-evidence=table-value]').last(),'unknown-unit');
      const primary=main.locator('[data-evidence=save]');
      if(probe==='contrast')await primary.evaluate(e=>e.style.color=getComputedStyle(e).backgroundColor);
      await measure(primary,'primary');await primary.hover();await settle();await measure(primary,'primary-hover');await page.mouse.move(0,0);
      await measure(main.getByRole('button',{name:'提交评审',exact:true}),'disabled');
      const selectedTab=page.getByRole('tab',{name:sceneLabels[scene],exact:true});await measure(selectedTab,'selected-tab');await measure(selectedTab,'selected-indicator','indicator','::after');
      if(scene==='report'){
        await main.getByRole('button',{name:'跳到证据',exact:true}).click();assert(await main.locator('[data-anchor=evidence]').evaluate(e=>e===document.activeElement),'report evidence anchor focus');
        await main.getByRole('button',{name:'待验证假设',exact:true}).click();const cb=main.getByRole('checkbox',{name:'加入下一轮验证'});await cb.focus();await page.keyboard.press('Space');assert(await cb.isChecked(),'report hypothesis task');
        await page.keyboard.press('Space');assert(!(await cb.isChecked()),'report hypothesis cancel');
      }
      if(scene==='release'){
        await main.getByRole('button',{name:'定位兼容说明'}).click();assert(await main.locator('[data-anchor=compatibility]').evaluate(e=>e===document.activeElement),'release compatibility focus');
        const disclosure=main.locator('summary').filter({hasText:'展开迁移核对项'});await disclosure.focus();await page.keyboard.press('Enter');await settle();assert(await main.getByText('固定并核对实际候选修订。',{exact:true}).isVisible(),'release migration disclosure');await page.keyboard.press('Enter');
      }
      if(scene==='overview'){
        if(probe==='chart')await main.locator('.rhine-chart__line').evaluate(e=>e.style.strokeWidth='0');
        if(probe==='unknown-marker')await main.locator('.rhine-chart__missing').evaluate(e=>e.style.strokeWidth='0');
        if(probe==='missing-fill-only')await main.locator('.rhine-chart__missing').evaluate(e=>{e.style.stroke='none';e.style.fill='black';});
        if(probe==='inactive-paint')await main.locator('.rhine-chart__line').evaluate(e=>{e.style.fill='rgba(0,0,0,0)';e.style.fillOpacity='0.01';});
        if(probe==='graphic-opacity')await main.locator('.rhine-chart__line').evaluate(e=>e.style.strokeOpacity='0.01');
        if(['graphic-opacity','inactive-paint'].includes(probe)){
          await main.locator('svg.rhine-chart__plot').evaluate((svg,probe)=>{const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');rect.setAttribute('class','rhine-paint-probe');rect.setAttribute('x','10');rect.setAttribute('y','10');rect.setAttribute('width','20');rect.setAttribute('height','20');rect.style.fill='rgb(32,38,49)';rect.style.fillOpacity=probe==='graphic-opacity'?'0.01':'1';rect.style.stroke='rgba(0,0,0,0)';rect.style.strokeOpacity='0.01';svg.append(rect);},probe);
          await measure(main.locator('.rhine-paint-probe'),'paint-control-fill','graphic');
        }
        const drawn=await main.locator('.rhine-chart__line').evaluate(e=>{const s=getComputedStyle(e);return s.stroke!=='none'&&parseFloat(s.strokeWidth)>0&&parseFloat(s.opacity)===1&&e.getClientRects().length>0;});
        check(drawn,{...context,role:'chart-stroke'});
        const chart=main.locator('svg.rhine-chart__plot');await chart.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
        assert((await main.locator('.rhine-chart__inspection').innerText()).includes('11:00：未知'),'chart unknown keyboard read');
        await measure(main.locator('.rhine-chart__inspection'),'chart-inspection');await measure(main.locator('.rhine-chart__line'),'chart-line','graphic');await measure(main.locator('.rhine-chart__missing'),'chart-missing','graphic');
        const details=main.getByText('查看摘要读取 p95数据表',{exact:true});await details.focus();await page.keyboard.press('Enter');assert(await main.getByRole('table',{name:'摘要读取 p95原始采样'}).isVisible(),'chart raw data');await page.keyboard.press('Enter');
      }
      const sort=table.locator('thead button');await sort.focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');
      if(probe==='sort')await table.evaluate(e=>{const body=e.querySelector('tbody');body.prepend(body.lastElementChild);});
      assert((await table.locator('tbody tr').first().innerText()).includes(highTitle[scene]),'descending-sort-result');assert((await table.locator('tbody tr').last().innerText()).includes('未知'),'unknown sorted last');
      const readyTrigger=table.locator('tbody tr').filter({has:page.locator('.rhine-tone-success')}).getByRole('button',{name:/^查看/});
      const readyName=await readyTrigger.getAttribute('aria-label'),readyNote=`${scene} 已核对记录备注`;const readyDialog=page.getByRole('dialog',{name:'记录详情'});
      await readyTrigger.focus();await page.keyboard.press('Enter');await readyDialog.waitFor();await readyDialog.getByLabel('详情备注').fill(readyNote);await readyDialog.getByRole('button',{name:'保存本地备注'}).click();await readyDialog.waitFor({state:'detached'});await settle();
      await main.getByLabel('记录筛选',{exact:true}).selectOption('attention');assert(await table.getByRole('button',{name:readyName,exact:true}).count()===0,'ready row must actually unmount');
      await main.getByLabel('记录筛选',{exact:true}).selectOption('all');const restoredReadyTrigger=table.getByRole('button',{name:readyName,exact:true});await restoredReadyTrigger.focus();await page.keyboard.press('Enter');await readyDialog.waitFor();
      assert(await readyDialog.getByLabel('详情备注').inputValue()===readyNote,'ready saved note survives attention/all filter');await readyDialog.getByLabel('详情备注').fill('取消已核对记录草稿');await page.keyboard.press('Escape');await readyDialog.waitFor({state:'detached'});await settle();
      await main.getByLabel('记录筛选',{exact:true}).selectOption('attention');assert(await table.locator('tbody tr').count()===2,'filter result');
      const scroll=await table.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));
      if(scroll.scroll>scroll.width+1){await table.focus();for(let n=0;n<6;n++)await page.keyboard.press('ArrowRight');await page.waitForTimeout(150);assert(await table.evaluate(e=>e.scrollLeft>0),'table keyboard scroll');}
      const trigger=table.getByRole('button',{name:/^查看/}).first();const savedTriggerName=await trigger.getAttribute('aria-label');await trigger.focus();
      const reachable=await trigger.evaluate(e=>{const a=e.closest('.rhine-table-scroll').getBoundingClientRect(),b=e.getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1;});assert(reachable,'detail column reachable');
      await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'记录详情'});await dialog.waitFor();await settle();const originalDialog=await dialog.elementHandle();
      const dialogDraft=dialog.getByLabel('详情备注');await dialogDraft.fill('保留详情草稿');
      const paint=await dialog.evaluate(e=>({root:e.parentElement.className,accent:getComputedStyle(e).getPropertyValue('--rhine-green').trim(),background:getComputedStyle(e).backgroundColor,radius:getComputedStyle(e).borderRadius,animation:getComputedStyle(e).animationDuration}));
      check(paint.accent===(palette==='swiss'?'#2348b5':'#343434'),{...context,role:'portal-palette',paint});
      assert(paint.radius==='4px','portal geometry');
      assert(motion==='normal'?parseFloat(paint.animation)>.01:parseFloat(paint.animation)<=.01,'actual motion duration');
      portalSamples.push({...context,...paint});await measure(dialog.getByRole('heading',{name:'记录详情',exact:true}),'dialog-title');await measure(dialogDraft,'dialog-input');await measure(dialogDraft,'dialog-input-boundary','boundary');
      const factor=dialog.getByLabel('详情配色');await factor.focus();await factor.selectOption(palette==='swiss'?'neutral':'swiss');
      assert(await originalDialog.evaluate(e=>e.isConnected)&&await dialogDraft.inputValue()==='保留详情草稿','mode switch preserves dialog/draft');
      assert(await factor.evaluate(e=>e===document.activeElement),'palette focus preserved');
      await factor.selectOption(palette);
      assert(await originalDialog.evaluate(e=>e.isConnected)&&await dialogDraft.inputValue()==='保留详情草稿','layout preserves dialog/draft');
      const box=await dialog.boundingBox();assert(box.x>=-1&&box.x+box.width<=width+1&&box.y>=-1&&box.y+box.height<=1001,'dialog viewport bounds');
      await dialog.getByRole('button',{name:'取消编辑',exact:true}).click();await dialog.waitFor({state:'detached'});await settle();assert(await trigger.evaluate(e=>e===document.activeElement),'cancel return focus');
      await page.keyboard.press('Enter');await dialog.waitFor();assert(await dialog.getByLabel('详情备注').inputValue()==='尚无备注','cancel must not commit');
      const savedNote=`${scene} 已核对本地备注`;
      await dialog.getByLabel('详情备注').fill(savedNote);await dialog.getByRole('button',{name:'保存本地备注'}).click();await dialog.waitFor({state:'detached'});await settle();
      await main.getByLabel('记录筛选',{exact:true}).selectOption('ready');
      assert(await table.getByRole('button',{name:savedTriggerName,exact:true}).count()===0,'saved row must actually unmount');
      await main.getByLabel('记录筛选',{exact:true}).selectOption('all');
      await sort.focus();await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
      await main.getByLabel('记录筛选',{exact:true}).selectOption('attention');
      await trigger.focus();await page.keyboard.press('Enter');await dialog.waitFor();assert(await dialog.getByLabel('详情备注').inputValue()===savedNote,'saved note survives filter remount and sort');
      await dialog.getByLabel('详情备注').fill('取消不得覆盖已保存备注');await dialog.getByRole('button',{name:'取消编辑',exact:true}).click();await dialog.waitFor({state:'detached'});await settle();
      await page.keyboard.press('Enter');await dialog.waitFor();assert(await dialog.getByLabel('详情备注').inputValue()===savedNote,'cancel must preserve saved note');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await settle();assert(await trigger.evaluate(e=>e===document.activeElement),'Escape return focus');
      if(probe==='focus')await page.addStyleTag({content:'[data-rhine-editorial] button:focus-visible{outline:none!important;box-shadow:none!important}'});
      await keyboardFocus(trigger,'return-focus');
      const field=main.getByLabel('跟进草稿');const originalField=await field.elementHandle();await field.fill('待核对的长中文草稿，保留未知数据与单位。');
      await measure(field,'textarea');await measure(field,'textarea-boundary','boundary');await primary.click();await settle();assert(await field.getAttribute('aria-invalid')==='true'&&(await field.inputValue()).startsWith('待核对'),'failure preserves draft');
      await measure(field,'error-boundary','boundary');await measure(main.locator('.rhine-field__error'),'error-text');await main.getByRole('button',{name:'重试保存',exact:true}).click();await settle();
      await measure(main.locator('.rhine-tone-success .rhine-notice__body'),'success-notice');
      await main.getByRole('button',{name:'模拟等待',exact:true}).click();assert(await primary.getAttribute('aria-busy')==='true','waiting');await main.getByRole('button',{name:'取消等待',exact:true}).click();assert(await primary.getAttribute('aria-busy')!=='true','cancel waiting');
      const popTrigger=main.getByRole('button',{name:'查看数据口径'});await popTrigger.click();await settle();const pop=page.locator('.rhine-popover');
      check(await pop.evaluate((e,p)=>getComputedStyle(e).getPropertyValue('--rhine-green').trim()===(p==='swiss'?'#2348b5':'#343434'),palette),{...context,role:'popover-palette'});await measure(pop.locator('.rhine-text').first(),'popover-text');await page.keyboard.press('Escape');await pop.waitFor({state:'detached'});await settle();assert(await popTrigger.evaluate(e=>e===document.activeElement),'popover focus return');
      await selectedTab.focus();await page.keyboard.press('ArrowRight');
      const nextScene={report:'release',release:'overview',overview:'report'}[scene];const other=page.locator(`section[data-scene=${nextScene}]`);
      const otherTrigger=other.getByRole('region',{name:`${sceneLabels[nextScene]}明细，可横向滚动`}).locator('tbody tr').nth(1).getByRole('button',{name:/^查看/});await otherTrigger.focus();await page.keyboard.press('Enter');await dialog.waitFor();
      assert(await dialog.getByLabel('详情备注').inputValue()==='尚无备注','same row id must not share notes across scenes');
      await dialog.getByLabel('详情备注').fill('取消另一场景草稿');await dialog.getByRole('button',{name:'取消编辑',exact:true}).click();await dialog.waitFor({state:'detached'});await settle();
      await page.keyboard.press('Enter');await dialog.waitFor();assert(await dialog.getByLabel('详情备注').inputValue()==='尚无备注','other scene cancel must not commit');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await settle();
      await page.getByRole('tab',{name:sceneLabels[nextScene],exact:true}).focus();await page.keyboard.press('ArrowLeft');
      assert(await originalField.evaluate(e=>e.isConnected)&&(await field.inputValue()).startsWith('待核对'),'scene tab draft preserved');
      await trigger.focus();await page.keyboard.press('Enter');await dialog.waitFor();assert(await dialog.getByLabel('详情备注').inputValue()===savedNote,'saved note survives scene tabs');await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});await settle();
      for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!document.activeElement.closest('[hidden],[inert]')),'hidden tab focus leak');}
      await main.getByLabel('记录筛选',{exact:true}).selectOption('all');await restoredReadyTrigger.focus();await page.keyboard.press('Enter');await readyDialog.waitFor();
      assert(await readyDialog.getByLabel('详情备注').inputValue()===readyNote,'other record save and cancellation preserve ready note');await page.keyboard.press('Escape');await readyDialog.waitFor({state:'detached'});await settle();await main.getByLabel('记录筛选',{exact:true}).selectOption('attention');
      assert(await main.getByLabel('记录筛选').inputValue()==='attention','filter retained');
      assert(await page.evaluate(()=>location.hash)===initialHash,'section navigation changed gallery route');
      if(shell){
        assert(await page.locator('main').count()===1,'nested main landmarks');
        await page.evaluate(()=>{location.hash='neutral';});
        await page.waitForFunction(()=>!document.querySelector('.rhine-theme').hasAttribute('data-rhine-editorial'));
        assert(await root.getAttribute('data-rhine-theme')==='graphite','prior global theme not restored');
        assert(await page.getByLabel('界面主题',{exact:true}).isEnabled(),'global theme selector stays disabled');
        assert(await page.getByRole('dialog').count()===0,'portal not cleaned');
      }
      rows.push({...context,status:failures.length===startFailures?'PASS':'FAIL'});
    }catch(error){failures.push({...context,role:'scenario',error:String(error)});rows.push({...context,status:'ERROR',error:String(error)});}
  }
  page.off('pageerror',onError);
  return{pass:failures.length===0&&errors.length===0,probe,quick,shell,base,rows,samples,failures,errors,observations,portalSamples,browser:await page.evaluate(()=>navigator.userAgent),nativeZoom:'SKIPPED: matrix uses CSS zoom only',screenReader:'SKIPPED: no speech-output test',counts:{scenarios:rows.length,PASS:samples.filter(s=>s.status==='PASS').length,EXEMPT:samples.filter(s=>s.status==='EXEMPT').length,FAIL:samples.filter(s=>s.status==='FAIL').length,UNMEASURED:samples.filter(s=>s.status==='UNMEASURED').length}};
}
