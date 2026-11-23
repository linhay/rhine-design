async page=>{
 const origin=await page.evaluate(()=>location.origin), results=[], errors=[];page.on('pageerror',e=>errors.push(e.message));
 const verify=(ok,description)=>{if(!ok)throw Error(description);results.push(description);};
 const go=async(width,theme,label,zoom=1,reduce=false)=>{
  await page.setViewportSize({width,height:760});await page.emulateMedia({reducedMotion:reduce?'reduce':'no-preference'});
  await page.goto(origin+'/?theme='+theme+'&reading='+label+'#rich-text');
  await page.locator('#reading-comparison-title').waitFor();
  if(zoom!==1) await page.locator('main').evaluate((node,zoom)=>node.style.zoom=String(zoom),zoom);
  await page.evaluate(()=>document.fonts.ready);
 };
 const A=()=>page.getByRole('region',{name:'14/22 报告正文',exact:true}), B=()=>page.getByRole('region',{name:'16/28 报告正文',exact:true});
 for(const [width,theme,zoom] of [[1440,'rhine',1],[880,'graphite',1],[400,'rhine',1],[880,'rhine',2]]){
  const key=[width,theme,zoom].join('/');await go(width,theme,key,zoom);
  const measure=region=>region.locator('p').first().evaluate(e=>{const style=getComputedStyle(e),r=e.getBoundingClientRect();return {size:style.fontSize,leading:style.lineHeight,overflow:e.scrollWidth>e.clientWidth+1,width:r.width,top:r.top};});
  const [a,b]=await Promise.all([measure(A()),measure(B())]);
  verify(await A().textContent()===await B().textContent(),'same source '+key);
  verify(a.size==='14px'&&a.leading==='22px'&&b.size==='16px'&&b.leading==='28px','independent type scales '+key);
  const heading=region=>region.getByRole('heading').first().evaluate(n=>[getComputedStyle(n).fontSize,getComputedStyle(n).lineHeight]);
  verify(JSON.stringify(await heading(A()))===JSON.stringify(await heading(B())),'report headings keep their original scale '+key);
  verify(!a.overflow&&!b.overflow&&Math.abs(a.width-b.width)<=1&&a.width/zoom<=545,'equal safe measure '+key);
  if(width===1440)verify(Math.abs(a.top-b.top)<1,'wide comparison is parallel');
  if(width===400)verify(b.top>a.top,'narrow comparison flows in source order');
  verify(await page.getByRole('textbox',{name:'正文搜索高亮'}).evaluate(n=>getComputedStyle(n).fontSize==='14px'),'controls not rescaled '+key);
 }
 await go(880,'rhine','font');const region=page.getByRole('region',{name:'只读报告正文',exact:true});
 const fonts=()=>region.locator('code').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).fontFamily));
 const typographicScale=locator=>locator.evaluate(n=>{const s=getComputedStyle(n);return s.fontSize+'/'+s.lineHeight});
 const prose=()=>region.locator('p').first();
 const message=page.getByRole('region',{name:'合成消息正文',exact:true}).locator('p').first();
 verify(await typographicScale(prose())==='14px/22px'&&await typographicScale(message)==='14px/22px','ordinary report and chat keep 14/22');
 const defaults=await fonts();verify(defaults.length===2&&defaults.every(x=>x.includes('Menlo')&&x.includes('Consolas')),'inline and fenced code use canonical stack');
 await region.evaluate(n=>n.style.setProperty('--rhine-mono','"Courier New", monospace'));
 verify((await fonts()).every(x=>x.includes('Courier New')),'public monospace override applies to both kinds');
 const pre=region.locator('pre');verify(await pre.evaluate(n=>n.scrollWidth>n.clientWidth&&n.tabIndex===0),'long code keeps its local keyboard scroll');
 await region.getByRole('button',{name:'复制原文',exact:true}).click();await region.getByText('复制失败，请重试',{exact:true}).waitFor();await region.getByRole('button',{name:'复制原文',exact:true}).click();await page.getByText('原文复制值逐字一致',{exact:true}).waitFor();verify(true,'copy still emits the original source after a retry');
 for(const [width,way] of [[400,'keyboard'],[880,'pointer']]){
  await go(width,'rhine','expand-'+way,1,way==='pointer');
  await page.getByRole('combobox',{name:'只读内容场景'}).selectOption('long');
  const more=region.getByRole('button',{name:/继续显示/}), paras=region.locator('.rhine-rich-text__blocks>p');
  verify(await typographicScale(prose())==='16px/28px','long report uses approved 16/28 '+way);
  verify(await typographicScale(more)==='14px/22px'&&await typographicScale(message)==='14px/22px','release controls and chat stay 14/22 '+way);
  for(let i=0;i<9;i++){
   const before=await paras.count();if(way==='pointer')await more.click();else await more.press('Enter');
   const target=paras.nth(before);await target.waitFor();
   const position=await target.evaluate(n=>{const r=n.getBoundingClientRect(),workspace=n.closest('.ds-workspace')?.getBoundingClientRect();const min=Math.max(0,workspace?.top??0),max=Math.min(innerHeight,workspace?.bottom??innerHeight);return {active:n===document.activeElement,inView:r.top>=min-1&&r.top<max-8,tabIndex:n.tabIndex,text:n.textContent};});
   verify(position.active&&position.inView&&position.tabIndex===-1&&position.text.startsWith('合成段落'+before+'，'),'new paragraph is focused and visible '+way+' '+before);
  }
  verify(await paras.count()===55&&await more.count()===0,'final batch stays bounded '+way);
  await page.getByRole('combobox',{name:'只读内容场景'}).selectOption('normal');
  verify(await typographicScale(prose())==='14px/22px','switching to ordinary content restores its original scale '+way);
 }
 verify(errors.length===0,errors.join('; ')||'no page errors');await page.locator('body').evaluate((e,x)=>e.dataset.richReadingProof=JSON.stringify(x),results);
}
