// Final production/fresh tarball: short viewport, full control rectangles, no scrolling to hide clipping.
async page=>{
 const probe=page.url().includes('probe=footer'),base=page.url().split('?')[0].split('#')[0],rows=[],failures=[],errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(5000);
 for(const theme of ['rhine','arknights','neo-brutalism'])for(const width of [400,520,880])for(const zoom of [1,2]){
  const context={theme,width,zoom,height:648};
  try{
   await page.setViewportSize({width,height:648});await page.goto(`${base}?fixture=compact-template&settings=1&theme=${theme}&zoom=${zoom}&motion=reduced`);
   await page.getByLabel('首次保存失败',{exact:true}).check();await page.getByRole('button',{name:'新建完整模板',exact:true}).click();
   if(probe)await page.addStyleTag({content:'.rhine-dialog__footer {max-height:40%!important;}'});
   const save=page.getByRole('button',{name:'保存完整模板',exact:true}),name=page.getByLabel('完整模板名称',{exact:true});
   const measure=async state=>{
    await page.waitForTimeout(60);
    const evidence=await page.locator('.rhine-dialog__footer').evaluate(el=>{
     const rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     return{footer:rect(el),client:el.clientHeight,scroll:el.scrollHeight,body:rect(document.querySelector('.rhine-dialog__settings-content')),buttons:[...el.querySelectorAll('button')].map(rect),content:[...el.querySelectorAll('strong')].flatMap(n=>{const r=document.createRange();r.selectNodeContents(n);return[...r.getClientRects()].map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom}));})};
    });
    const inside=r=>r.left>=evidence.footer.left-1&&r.right<=evidence.footer.right+1&&r.top>=evidence.footer.top-1&&r.bottom<=Math.min(evidence.footer.bottom,648)+1;
    const checks={bodyControl:evidence.body.height>=44*zoom,footerUnclipped:evidence.scroll<=evidence.client+1,buttons:evidence.buttons.every(r=>inside(r)&&r.width>=44*zoom-1&&r.height>=44*zoom-1),message:evidence.content.length>0&&evidence.content.every(inside)};
    const result={...context,state,checks,evidence};rows.push(result);if(!Object.values(checks).every(Boolean))failures.push(result);
   };
   await save.click();await measure('blank');await name.fill('常用模板');await save.click();await measure('duplicate');
   await name.fill('完整的合成跨团队模板名称-with-long-identifier');await save.click();await page.getByText('模板保存失败，草稿已保留。请重试。',{exact:true}).waitFor();await measure('failure');
   await save.click();await page.getByText('模板已保存',{exact:true}).waitFor();await measure('success');await save.click();await measure('unchanged');
   const overflow=await page.locator('.rhine-dialog__footer').evaluate(el=>{
    const strong=el.querySelector('strong');if(strong)strong.textContent='合成超长错误：'.repeat(80);
    const before={client:el.clientHeight,scroll:el.scrollHeight,body:document.querySelector('.rhine-dialog__settings-content').getBoundingClientRect().height};
    el.scrollTop=el.scrollHeight;const footer=el.getBoundingClientRect(),last=[...el.querySelectorAll(':scope > button')].at(-1)?.getBoundingClientRect();
    return {...before,lastReachable:!!last&&last.top>=footer.top&&last.bottom<=footer.bottom+1};
   });
   rows.push({...context,state:'long-error-scroll',checks:{body:overflow.body>=44*zoom-1,scroll:overflow.scroll>overflow.client,actionsReachable:overflow.lastReachable},evidence:overflow});
   if(!Object.values(rows.at(-1).checks).every(Boolean))failures.push(rows.at(-1));
   const override=await page.getByRole('dialog').evaluate(el=>{el.style.setProperty('--rhine-dialog-footer-limit','80px');return getComputedStyle(el.querySelector('.rhine-dialog__footer')).maxHeight;});
   rows.push({...context,state:'explicit-footer-limit',checks:{priority:override==='80px'},evidence:override});if(override!=='80px')failures.push(rows.at(-1));
  }catch(e){failures.push({...context,error:String(e)});}
 }
 return{pass:!failures.length&&!errors.length,rows,failures,errors};
}
