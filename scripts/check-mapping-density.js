// Production/fixed-consumer matrix; all data synthetic, zoom is CSS zoom.
async page => {
 page.setDefaultTimeout(7000);
 const {base,probe}=await page.evaluate(()=>({base:new URL('./',location.href).href.replace(/\/$/,''),probe:new URL(location.href).searchParams.get('densityProbe')}));
 const results=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));const assert=(ok,message)=>{if(!ok)throw Error(message);};
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880,1280])for(const zoom of [1,2])for(const height of [900,648]){
  const c={theme,width,zoom,height};try{
   await page.setViewportSize({width,height});await page.goto(`${base}/?fixture=template-settings&density=1&theme=${theme}&zoom=${zoom}`);
   const editor=page.getByRole('group',{name:'紧凑映射',exact:true}),grouped=page.getByRole('group',{name:'按目标汇合预览'}),readonly=page.getByRole('group',{name:'紧凑逐行只读'});
   if(probe==='density')await editor.evaluate(e=>e.classList.remove('rhine-mapping-editor--compact'));
   if(probe==='duplicate')await grouped.locator('.rhine-mapping-editor__target').first().evaluate(e=>e.parentElement.append(e.cloneNode(true)));
   const measure=async locator=>locator.evaluate(e=>({width:e.clientWidth,columns:getComputedStyle(e.querySelector('.rhine-mapping-editor__fields')).gridTemplateColumns.split(' ').length,overflow:e.scrollWidth>e.clientWidth+1}));
   const layout=await measure(editor),read=await measure(readonly);assert(layout.columns===(layout.width<360?1:4),'compact container breakpoint');assert(read.columns===(read.width<360?1:3),'readonly container breakpoint');assert(!layout.overflow&&!read.overflow,'editor overflow');
   if(width===520&&zoom===1)assert(layout.width>=360&&layout.width<480&&layout.columns===4,'520 short mapping not horizontal at actual ~450px');
   const original=await measure(page.getByRole('group',{name:'默认映射布局'}));assert(original.columns===(original.width<480?1:3),'default layout changed');
   const targetText=await grouped.locator('.rhine-mapping-editor__target').allTextContents();assert(targetText.length===3&&targetText[0]==='目标：Beta'&&targetText[1]==='目标：Delta','targets duplicated or reordered');
   const sourceText=await grouped.locator('.rhine-mapping-editor__sources').first().locator('li').allTextContents();assert(JSON.stringify(sourceText)===JSON.stringify(['Alpha','Beta']),'source order or same-value mapping lost');
   assert(await grouped.locator('select,button,input').count()===0,'grouped preview has editing controls');assert(await grouped.locator('.rhine-mapping-editor__branch:not([aria-hidden=true]),.rhine-mapping-editor__join:not([aria-hidden=true])').count()===0,'decorative semantics');
   const summary=page.getByRole('region',{name:'完整来源预览'});assert(await summary.getByText('6 个来源',{exact:true}).count()===1,'source count includes target nodes');assert(await summary.getByText('原名甲',{exact:true}).count()===1,'unchanged-name composition missing');await page.getByRole('group',{name:'空分组预览'}).getByText('暂无规则').waitFor();
   const textGeometry=await grouped.locator('.rhine-mapping-editor__value').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect(),p=e.closest('.rhine-mapping-editor').getBoundingClientRect();const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),rects=[];while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('.rhine-sr-only'))continue;const range=document.createRange();range.selectNodeContents(node);rects.push(...range.getClientRects());}return {overflow:e.scrollWidth>e.clientWidth+1,inside:r.left>=p.left-1&&r.right<=p.right+1,lines:rects.every(b=>b.left>=p.left-1&&b.right<=p.right+1)};}));assert(textGeometry.every(r=>!r.overflow&&r.inside&&r.lines),'long grouped text clipped');
   const targets=await editor.locator('select,button').evaluateAll(els=>els.map(e=>({w:e.getBoundingClientRect().width/Number(getComputedStyle(document.documentElement).zoom),h:e.getBoundingClientRect().height/Number(getComputedStyle(document.documentElement).zoom)})));assert(targets.every(r=>r.w>=44&&r.h>=44),'compact target below 44');
   const source=editor.getByRole('combobox',{name:'第1行 来源'}),target=editor.getByRole('combobox',{name:'第1行 目标'});await source.focus();await source.press('g');assert(await source.inputValue()==='c','native source typeahead');await page.keyboard.press('Tab');assert(await target.evaluate(e=>e===document.activeElement),'forward Tab target');await target.press('d');assert(await target.inputValue()==='d','native target typeahead');await page.keyboard.press('Shift+Tab');assert(await source.evaluate(e=>e===document.activeElement),'reverse Tab source');
   await editor.getByRole('button',{name:'添加规则'}).click();assert(await editor.getByRole('combobox',{name:'第5行 来源'}).evaluate(e=>e===document.activeElement),'add focus');await editor.getByRole('button',{name:'删除第5行'}).click();assert(await editor.getByRole('combobox',{name:'第4行 来源'}).evaluate(e=>e===document.activeElement),'delete focus');
   results.push({...c,pass:true,editorWidth:layout.width});
  }catch(error){results.push({...c,pass:false,error:String(error)});}
 }
 return {pass:results.every(r=>r.pass)&&!errors.length,results,errors,nativeZoom:'SKIPPED; CSS zoom only',screenReaderSpeech:'SKIPPED'};
}
