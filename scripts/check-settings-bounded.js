// Run against a production preview or an installed-tarball consumer:
// playwright-cli goto http://127.0.0.1:18481/?fixture=settings-dialog
// playwright-cli run-code --filename scripts/check-settings-bounded.js
async page => {
  const base = page.url().split('/').slice(0,3).join('/'), results = [], errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const cases = [];
  for (const theme of ['rhine','arknights','neo-brutalism']) {
    for (const width of [400,520,880,1280]) for (const zoom of [1,2]) for (const height of [900,648]) cases.push({theme,width,zoom,height});
    // A 400px bordered iframe has 398px inner width; include that real consumer boundary.
    cases.push({theme,width:398,zoom:2,height:648});
    for (const [width,height] of [[390,680],[889,480],[1440,900]]) cases.push({theme,width,zoom:1,height});
  }
  const rect = e => {const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  for (const c of cases) {
    try {
      await page.setViewportSize({width:c.width,height:c.height});
      await page.goto(`${base}/?fixture=settings-dialog&theme=${c.theme}&zoom=${c.zoom}`);
      await page.getByRole('checkbox',{name:'长导航',exact:true}).check();
      await page.getByRole('checkbox',{name:'长操作文案',exact:true}).check();
      await page.getByRole('button',{name:'打开设置',exact:true}).click();
      const dialog=page.getByRole('dialog',{name:'设置',exact:true});
      await dialog.getByRole('link',{name:'用户管理与权限',exact:true}).click();
      const measure=()=>dialog.evaluate(d=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
        const body=d.querySelector('.rhine-dialog__settings-content'), nav=d.querySelector('.rhine-dialog__navigation'), footer=d.querySelector('.rhine-dialog__footer');
        return {dialog:rect(d),head:rect(d.querySelector('.rhine-dialog__head')),close:rect(d.querySelector('.rhine-dialog__head button')),footer:rect(footer),buttons:[...footer.querySelectorAll('button')].map(rect),labelsMatch:[...footer.querySelectorAll('button')].every(b=>(b.getAttribute('aria-label')||b.innerText).replace(/\s/g,'').includes(b.innerText.replace(/\s/g,''))),body:rect(body),nav:rect(nav),bodyScroll:body.scrollTop,navScroll:nav.scrollTop,overflow:body.scrollWidth>body.clientWidth+1,footerOverflow:footer.scrollHeight>footer.clientHeight+1,columns:getComputedStyle(d.querySelector('.rhine-dialog__settings-grid')).gridTemplateColumns,rootScroll:d.scrollTop};
      });
      const before=await measure();
      const body=dialog.getByRole('region',{name:'设置内容'});
      await body.focus(); await page.keyboard.press('End');
      await body.evaluate(e=>{e.scrollTop=e.scrollHeight;});
      const last=dialog.getByRole('button',{name:'编辑成员 30',exact:true});
      const lastRect=await last.evaluate(rect);
      const after=await measure();
      const navLast=dialog.getByRole('link',{name:'扩展设置 20 · 长栏目名称',exact:true});
      await navLast.scrollIntoViewIfNeeded();
      const navLastRect=await navLast.evaluate(rect), navAfter=await measure();
      const within=(r,b)=>r.x>=b.x-1&&r.right<=b.right+1&&r.y>=b.y-1&&r.bottom<=b.bottom+1;
      const same=(a,b)=>['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<1);
      const stable=['dialog','head','close','footer'].every(k=>same(before[k],after[k])&&same(before[k],navAfter[k]));
      const expectedColumns=c.width>=880&&c.zoom===1?2:1;
      const checks={labelsMatch:after.labelsMatch,stable,buttonsStable:before.buttons.every((r,i)=>same(r,after.buttons[i])),withinViewport:within(after.dialog,{x:0,y:0,right:c.width,bottom:c.height}),bodyNonzero:after.body.height>0,bodyScrolled:after.bodyScroll>0,lastReachable:within(lastRect,after.body),navReachable:within(navLastRect,navAfter.nav),footerVisible:after.buttons.every(r=>within(r,after.footer)),targets:after.buttons.every(r=>r.width/c.zoom>=44-.1&&r.height/c.zoom>=44-.1),noOverflow:!after.overflow&&!after.footerOverflow,columns:after.columns.split(' ').length===expectedColumns,noRootScroll:after.rootScroll===0};
      results.push({...c,pass:Object.values(checks).every(Boolean),checks,before,after});
      if(c.width===400&&c.zoom===2&&c.height===648) await page.screenshot({path:`output/playwright/settings-${c.theme}-400-200-short.png`});
    } catch(error) { results.push({...c,pass:false,error:String(error)}); }
  }
  return {pass:results.every(r=>r.pass)&&errors.length===0,cases:results.length,errors,failures:results.filter(r=>!r.pass),results};
}
