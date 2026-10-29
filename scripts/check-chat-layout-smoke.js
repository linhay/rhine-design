async page => {
 page.setDefaultTimeout(3000);const base=await page.evaluate(()=>location.origin),defaults=[];
 for(const theme of ['rhine','arknights','neo-brutalism','neutral']){
  await page.setViewportSize({width:880,height:900});await page.goto(`${base}/?fixture=chat-layout&theme=${theme}&layout=standalone&appearance=plain`);
  const v=page.getByRole('region',{name:'合成聊天消息'});await v.waitFor();
  const state=await v.evaluate(e=>({height:getComputedStyle(e).height,layout:e.parentElement.dataset.layout,controls:e.parentElement.dataset.controls,appearance:e.parentElement.dataset.appearance}));
  defaults.push({theme,pass:state.height==='512px'&&state.layout==='standalone'&&state.controls==='full'&&state.appearance==='plain',state});
 }
 await page.goto(`${base}/?fixture=chat-layout&theme=neutral&appearance=bubble`);
 const v=page.getByRole('region',{name:'合成聊天消息'});await v.waitFor();await v.evaluate(e=>e.scrollTop=0);
 const link=v.locator('[data-chat-entry=a1] a');await link.focus();
 const ring=await link.evaluate(e=>({outline:getComputedStyle(e).outlineWidth,shadow:getComputedStyle(e).boxShadow}));
 await page.locator('.rhine-theme').evaluate(e=>e.dir='rtl');
 const rtl=await v.locator('[data-chat-entry=a1]').evaluate(e=>{const a=e.querySelector('article').getBoundingClientRect(),r=e.getBoundingClientRect();return Math.abs(a.left-r.left)<1;});
 await page.locator('.rhine-theme').evaluate(e=>e.dir='ltr');
 await v.evaluate(e=>e.scrollTop=0);await page.locator('.rhine-chat').screenshot({path:'output/playwright/chat99-neutral-bubble.png'});
 await page.getByRole('combobox',{name:'消息外观'}).selectOption('plain');await v.evaluate(e=>e.scrollTop=0);
 await page.locator('.rhine-chat').screenshot({path:'output/playwright/chat99-neutral-plain.png'});
 await page.goto(`${base}/?fixture=chat-layout&viewport=1&theme=neutral`);await page.getByRole('region',{name:'全高聊天消息'}).waitFor();
 await page.screenshot({path:'output/playwright/chat99-full-viewport.png'});
 return {pass:defaults.every(r=>r.pass)&&rtl&&ring.outline==='2px'&&ring.shadow!=='none',defaults,rtl,ring};
}
