// Real browser raster check: computed outlines alone do not prove that a clip-path lets them paint.
async page => {
  const base=await page.evaluate(()=>location.origin+location.pathname), samples=[], failures=[], errors=[];
  const params=await page.evaluate(()=>Object.fromEntries(new URLSearchParams(location.search)));
  const zoom=params.choiceZoom==='2'?2:1;
  const recordError=e=>errors.push(e.message); page.on("pageerror",recordError);
  const check=(ok,details)=>{if(!ok)failures.push(details);};
  const go=async(theme,width,motion,section)=>{
    await page.setViewportSize({width,height:880}); await page.emulateMedia({reducedMotion:motion==="reduce"?"reduce":"no-preference"});
    await page.goto(`${base}?theme=${theme}&choiceAudit=${width}-${motion}#${section}`);
    if(zoom!==1) await page.evaluate(zoom=>{document.documentElement.style.zoom=String(zoom);},zoom);
    await page.evaluate(()=>document.fonts.ready);
    await page.mouse.move(0,0);
  };
  const sampleFocus=async(input, visual, frame, scenario)=>{
    // Establish keyboard modality before fixing the viewport. A real Tab
    // during capture can scroll the gallery to a distant control.
    await page.keyboard.press("Tab");
    await page.evaluate(()=>document.activeElement?.blur());
    await frame.scrollIntoViewIfNeeded();
    const box=async()=>visual.evaluate(e=>{const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height};});
    const before=await box();
    const viewport=page.viewportSize();
    if(before.x<0||before.y<0||before.x+before.w>viewport.width||before.y+before.h>viewport.height) throw Error("Focus target clipped by viewport");
    const x=Math.max(0,Math.floor(before.x)-12),y=Math.max(0,Math.floor(before.y)-12);
    const clip={x,y,width:Math.min(viewport.width,Math.ceil(before.x+before.w)+12)-x,height:Math.min(viewport.height,Math.ceil(before.y+before.h)+12)-y};
    const shot=()=>page.screenshot({clip,scale:"css",animations:"disabled"}).then(b=>b.toString("base64"));
    // Capture the same control twice, first without focus, then with visible keyboard focus.
    const plain=await shot();
    await input.evaluate(e=>e.focus({preventScroll:true}));
    if(!await input.evaluate(e=>e===document.activeElement&&e.matches(":focus-visible"))) throw Error("Target did not receive visible keyboard focus");
    const after=await box(); if(Object.keys(before).some(k=>Math.abs(before[k]-after[k])>0.25)) throw Error("Focus changed sample geometry");
    const focused=await shot();
    const paint=await page.evaluate(async({plain,focused,before,clip})=>{
      const load=async data=>{const img=new Image();img.src="data:image/png;base64,"+data;await img.decode();
        const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const ctx=c.getContext("2d");ctx.drawImage(img,0,0);return {data:ctx.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};};
      const [a,b]=await Promise.all([load(plain),load(focused)]);
      const rgb=(image,i)=>[image.data[i],image.data[i+1],image.data[i+2]];
      const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const colors=new Map();let changed=0,contrasting=0;
      // Only the band around the visual element; no changing text or selection fill.
      for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){
        const dx=clip.x+x+.5-before.x, dy=clip.y+y+.5-before.y;
        if(dx>=0&&dx<before.w&&dy>=0&&dy<before.h)continue;
        const i=(y*a.w+x)*4, from=rgb(a,i),to=rgb(b,i);if(from.join()===to.join())continue;
        const f=lum(from),t=lum(to),ratio=(Math.max(f,t)+.05)/(Math.min(f,t)+.05);
        changed++;if(ratio>=3){contrasting++;const key=JSON.stringify([from,to]);const old=colors.get(key);colors.set(key,{from,to,ratio,pixels:(old?.pixels??0)+1});}
      }
      return {changed,contrasting,dominant:[...colors.values()].sort((a,b)=>b.pixels-a.pixels)[0]??null};
    },{plain,focused,before,clip});
    const pass=paint.contrasting>=Math.floor(Math.min(before.w,before.h));
    samples.push({...scenario,...paint,pass});check(pass,{...scenario,reason:"No clearly painted focus ring",...paint});
  };
  try {
    const quick=Object.hasOwn(params,"choiceQuick");
    for(const theme of quick?["arknights"]:["rhine","neutral","graphite","arknights","neo-brutalism"])
      for(const [width,motion] of quick?[[880,"normal"]]:[[880,"normal"],[520,"normal"],[400,"reduce"]]){
        try {
          await go(theme,width,motion,"spacing");
          const group=page.getByRole("group",{name:"统计维度",exact:true});
          const volume=group.getByRole("radio",{name:"用量",exact:true}), count=group.getByRole("radio",{name:"次数",exact:true});
          const visual=input=>input.locator("xpath=following-sibling::span[1]");
          await sampleFocus(volume,visual(volume),group,{theme,width,motion,role:"SegmentedControl/compact selected focus"});
          await volume.press("ArrowRight");
          check(await count.isChecked()&&await count.evaluate(e=>e===document.activeElement)&&!await volume.isChecked(),{theme,width,motion,role:"SegmentedControl/arrow changes the one selected value"});
          await sampleFocus(count,visual(count),group,{theme,width,motion,role:"SegmentedControl/compact moved focus"});
          // The compact layout must still fit and keep its real label hit area.
          check(await group.evaluate(n=>n.scrollWidth<=n.clientWidth+2&&[...n.querySelectorAll("label")].every(e=>e.offsetWidth>=44&&e.offsetHeight>=44)),{theme,width,motion,role:"SegmentedControl/44px and fit"});
          await go(theme,width,motion,"selection");
          const standard=page.getByRole("group",{name:"展示指标",exact:true});
          const tokens=standard.getByRole("radio",{name:"Token",exact:true}), requests=standard.getByRole("radio",{name:"请求数",exact:true});
          await sampleFocus(tokens,visual(tokens),standard,{theme,width,motion,role:"SegmentedControl/standard selected focus"});
          await tokens.press("ArrowRight");
          check(await requests.isChecked()&&await requests.evaluate(e=>e===document.activeElement),{theme,width,motion,role:"SegmentedControl/standard arrow changes selection"});
          await requests.press("ArrowRight");
          // Native radios can either wrap or stop at the edge. Neither may enter a disabled option.
          const cost=standard.getByRole("radio",{name:"费用",exact:true});
          const stays=await requests.isChecked()&&await requests.evaluate(e=>e===document.activeElement);
          const wraps=await tokens.isChecked()&&await tokens.evaluate(e=>e===document.activeElement);
          check(await cost.isDisabled()&&!await cost.isChecked()&&(stays||wraps),{theme,width,motion,role:"SegmentedControl/edge arrow never activates the disabled option",edge:stays?"stays":wraps?"wraps":"other"});
          await go(theme,width,motion,"forms");
          const toggle=page.getByRole("switch",{name:"显示辅助说明",exact:true});
          const switchWrap=toggle.locator("xpath=ancestor::*[contains(@class,'rhine-switch')][1]");
          const track=switchWrap.locator(".rhine-switch__track");
          const thumb=()=>track.evaluate(el=>{
            const channel=value=>value.match(/[\d.]+/g).slice(0,3).map(Number);
            const lum=c=>channel(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
            const fg=getComputedStyle(el.firstElementChild).backgroundColor,bg=getComputedStyle(el).backgroundColor,f=lum(fg),b=lum(bg);
            return {fg,bg,ratio:(Math.max(f,b)+.05)/(Math.min(f,b)+.05),position:el.firstElementChild.getBoundingClientRect().left-el.getBoundingClientRect().left};
          });
          await sampleFocus(toggle,track,switchWrap,{theme,width,motion,role:"Switch/off focus"});
          const off=await thumb(); await toggle.press("Space");
          await track.evaluate(n=>Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished)));
          const on=await thumb();
          check(await toggle.isChecked()&&on.position>off.position,{theme,width,motion,role:"Switch/Space toggles and moves thumb"});
          for(const [state,v] of [["off",off],["on",on]]){const sample={theme,width,motion,role:`Switch/${state} thumb`,...v,pass:v.ratio>=3};samples.push(sample);check(sample.pass,sample);}
          await sampleFocus(toggle,track,switchWrap,{theme,width,motion,role:"Switch/on focus"});
        } catch(error) {failures.push({theme,width,motion,role:"scenario",error:String(error)});}
      }
  } finally {page.off("pageerror",recordError);}
  return {pass:!failures.length&&!errors.length,zoom,samples,failures,errors};
}
