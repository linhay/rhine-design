async page => {
 page.setDefaultTimeout(4000);
 const base=await page.evaluate(()=>location.origin),rows=[];
 const assert=(v,m)=>{if(!v)throw Error(m);};
 const anchor=async v=>v.evaluate(e=>{const r=e.getBoundingClientRect();const n=[...e.querySelectorAll('[data-chat-entry]')].find(n=>n.getBoundingClientRect().bottom>r.top+1);return {id:n.dataset.chatEntry,offset:n.getBoundingClientRect().top-r.top};});
 const settle=async v=>v.evaluate(e=>new Promise(resolve=>{let last=e.scrollTop,since=performance.now(),start=since;function tick(){const now=performance.now();if(Math.abs(last-e.scrollTop)>.1){last=e.scrollTop;since=now;}if(now-since>180||now-start>2500)resolve({top:e.scrollTop,elapsed:now-start,stable:now-since});else requestAnimationFrame(tick);}requestAnimationFrame(tick);}));
 const offset=async(v,id)=>v.evaluate((e,id)=>e.querySelector(`[data-chat-entry="${id}"]`).getBoundingClientRect().top-e.getBoundingClientRect().top,id);
 for(const theme of ['rhine','arknights','neo-brutalism','neutral'])for(const appearance of ['plain','bubble']){
  try{
   await page.setViewportSize({width:400,height:900});await page.goto(`${base}/?fixture=chat-layout&theme=${theme}&zoom=2&appearance=${appearance}`);
   const v=page.getByRole('region',{name:'合成聊天消息'});await v.waitFor();
   await v.scrollIntoViewIfNeeded();await v.focus();await page.keyboard.press('Home');await settle(v);
   const bounds=await v.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,(Math.max(0,bounds.y)+Math.min(900,bounds.y+bounds.height))/2);
   await page.mouse.wheel(0,10000);
   await page.waitForFunction(()=>{const e=document.querySelector('.rhine-chat-viewport');return Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2;},null,{timeout:4000});
   const wheelSettled=await settle(v);await page.waitForTimeout(220);
   assert(await v.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2),'native wheel rolled back');
   await page.getByRole('button',{name:'回到最新并跟随'}).click();
   await v.scrollIntoViewIfNeeded();await v.focus();await page.keyboard.press('PageUp');
   await page.waitForFunction(()=>document.querySelector('.rhine-chat-footer [role=status]').textContent.includes('已暂停'));
   await v.evaluate(e=>e.scrollTop=200);await page.waitForTimeout(80);
   const before=await anchor(v);
   await page.getByRole('checkbox',{name:'下次历史加载失败'}).check();
   const load=page.getByRole('button',{name:'加载更早消息',exact:true});await load.click();const loadHandle=await load.elementHandle();
   await page.getByRole('alert').waitFor();assert(await loadHandle.evaluate(e=>e===document.activeElement),'failure lost load focus');
   assert(Math.abs(await offset(v,before.id)-before.offset)<3,'failure displaced anchor');
   await page.getByRole('checkbox',{name:'下次历史加载失败'}).uncheck();await load.click();
   await page.getByRole('button',{name:'已到最早消息',exact:true}).waitFor();
   assert(await loadHandle.evaluate(e=>e===document.activeElement),'prepend lost load focus');
   assert(Math.abs(await offset(v,before.id)-before.offset)<3,'prepend displaced anchor');
   await page.getByRole('button',{name:'到达一条合成消息'}).click();
   assert(await page.getByRole('status').textContent().then(t=>t.includes('有新消息')),'new message not announced');
   assert(Math.abs(await offset(v,before.id)-before.offset)<3,'arrival displaced anchor');
   await page.getByRole('button',{name:'回到最新并跟随'}).click();
   assert(await v.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2),'resume did not reach bottom');
   await page.getByRole('button',{name:'播放合成流式记录'}).click();await page.waitForTimeout(700);
   assert(await v.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2),'stream did not follow');
   await v.scrollIntoViewIfNeeded();await v.focus();await page.keyboard.press('PageUp');const settled=await settle(v);
   const streamAnchor=await anchor(v);await page.waitForTimeout(600);
   const afterOffset=await offset(v,streamAnchor.id);assert(Math.abs(afterOffset-streamAnchor.offset)<3,'stream stole reading position '+JSON.stringify({streamAnchor,afterOffset,settled}));
   await page.getByRole('button',{name:'取消演示生成'}).click();const text=await v.textContent();await page.waitForTimeout(500);
   assert(await v.textContent()===text,'late stream after cancel');assert(text.includes('生成已取消；保留部分内容，未确认成功。'),'cancel misreported completion');
   await page.getByRole('combobox',{name:'聊天场景'}).selectOption('observer');
   const reading=v.getByRole('button',{name:/^阅读对象：/}).first();const handle=await reading.elementHandle();await reading.click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   await page.waitForFunction(e=>e===document.activeElement,handle,{timeout:3000});
   assert(await v.getByRole('button',{name:'接受请求'}).count()===0,'readOnly action leaked');
   assert(await page.getByRole('status').textContent().then(t=>t.includes('已暂停')),'source focus resumed follow');
   rows.push({theme,appearance,pass:true,wheelSettled,settled,streamAnchor,afterOffset});
  }catch(error){rows.push({theme,appearance,pass:false,error:String(error)});}
 }
 const motion=[];
 for(const mode of ['system','manual']){
  await page.emulateMedia({reducedMotion:mode==='system'?'reduce':'no-preference'});
  await page.goto(`${base}/?fixture=chat-layout&theme=neutral&motion=${mode}`);
  const v=page.getByRole('region',{name:'合成聊天消息'});const summary=v.locator('summary').first();await summary.focus();await summary.press('Enter');
  const expanded=await summary.evaluate(e=>e.parentElement.open);
  await page.getByRole('button',{name:'到达一条合成消息'}).click();
  const paused=await page.getByRole('status').textContent().then(t=>t.includes('有新消息')&&t.includes('暂停'));
  await page.getByRole('button',{name:'回到最新并跟随'}).click();
  motion.push({mode,pass:expanded&&paused&&await v.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<2)});
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 return {pass:rows.every(r=>r.pass)&&motion.every(r=>r.pass),rows,motion};
}
