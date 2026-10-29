async page => {
 page.setDefaultTimeout(3000);
 const base=await page.evaluate(()=>location.origin),rows=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const assert=(value,message)=>{if(!value)throw Error(message);};
 const probe=page.url().includes('chatProbe=height');
 for(const theme of (probe?['neutral']:['rhine','arknights','neo-brutalism','neutral']))for(const width of (probe?[400]:[400,520,880]))for(const zoom of (probe?[1]:[1,2]))for(const appearance of (probe?['bubble']:['plain','bubble']))for(const scene of (probe?['pair']:['pair','team','observer'])){
  try{
   await page.setViewportSize({width,height:900});
   await page.goto(`${base}/?fixture=chat-layout&theme=${theme}&zoom=${zoom}&appearance=${appearance}&scene=${scene}`);
   const viewport=page.getByRole('region',{name:'合成聊天消息'});await viewport.waitFor();
   await page.getByRole('combobox',{name:'聊天容器宽度'}).selectOption(String(width));
   if(probe)await page.addStyleTag({content:'.rhine-chat[data-layout=fill] > .rhine-chat-viewport {flex:none;height:32rem;}'});
   const geometry=await viewport.evaluate(e=>{
    const root=e.parentElement,frame=root.parentElement;
    const r=root.getBoundingClientRect(),f=frame.getBoundingClientRect(),v=e.getBoundingClientRect();
    return {height:r.height,frame:f.height,viewport:v.height,unused:r.bottom-root.lastElementChild.getBoundingClientRect().bottom,scrollable:e.scrollHeight>e.clientHeight,overflow:e.scrollWidth>e.clientWidth+1,
     rootOverflow:root.scrollHeight>root.clientHeight+1,readerCount:[...root.querySelectorAll('*')].filter(n=>getComputedStyle(n).overflowY==='auto'&&n.scrollHeight>n.clientHeight+1).length,
     border:getComputedStyle(root).borderTopWidth,documentOverflow:document.documentElement.scrollWidth>innerWidth+1};
   });
   assert(Math.abs(geometry.height-geometry.frame)<1&&geometry.viewport>100*zoom&&!geometry.rootOverflow&&Math.abs(geometry.unused)<1,'fill did not fit bounded frame');
   assert(geometry.scrollable&&geometry.readerCount===1&&!geometry.overflow&&!geometry.documentOverflow,'reading overflow');
   assert(geometry.border==='0px','fill frame still bordered');
   const mapping=await viewport.locator('article').evaluateAll(es=>es.map(e=>({name:e.getAttribute('aria-label'),side:e.dataset.align,tone:e.dataset.tone})));
   assert(mapping.every(e=>appearance==='plain'?e.side==='start':e.side===(e.name.startsWith('成员 A')?'end':'start')),'member mapping changed by role');
   if(scene==='team')assert(await viewport.locator('.rhine-chat-event').count()===1,'event lost');
   if(scene==='observer')assert(await viewport.getByRole('button',{name:'接受请求'}).count()===0,'readOnly action leaked');
   await viewport.evaluate(e=>e.scrollTop=0);
   if(appearance==='bubble'){
    const contrast=await viewport.evaluate(e=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number), lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
     return [...e.querySelectorAll('article[data-tone=strong] .rhine-chat-body :is(p,a,code,blockquote,.rhine-chat-card__summary,.rhine-badge)')].filter(n=>n.getClientRects().length).map(n=>{
      let el=n,bg='';while(el){bg=getComputedStyle(el).backgroundColor;if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')break;el=el.parentElement;}
      const a=lum(rgb(getComputedStyle(n).color)),b=lum(rgb(bg));return {tag:n.tagName,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
     });
    });
    assert(contrast.length>0&&contrast.every(c=>c.ratio>=4.5),'strong content contrast failed '+JSON.stringify(contrast));
   }
   await viewport.evaluate(e=>e.scrollTop=e.scrollHeight);
   const end=await viewport.locator('[data-chat-entry]').last().boundingBox(),v=await viewport.boundingBox();
   assert(end.y+end.height<=v.y+v.height+1,'last message unreachable');
   rows.push({theme,width,zoom,appearance,scene,pass:true,geometry});
  }catch(error){rows.push({theme,width,zoom,appearance,scene,pass:false,error:String(error)});}
 }
 return {pass:rows.every(r=>r.pass)&&!errors.length,rows,errors};
}
