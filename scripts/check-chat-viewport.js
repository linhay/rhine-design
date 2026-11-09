async page => {
 page.setDefaultTimeout(3000);const base=await page.evaluate(()=>location.origin),rows=[];
 for(const theme of ['rhine','arknights','neo-brutalism','neutral'])for(const width of [400,520,880])for(const zoom of [1,2])for(const appearance of ['plain','bubble']){
  try{
   await page.setViewportSize({width,height:900});await page.goto(`${base}/?fixture=chat-layout&viewport=1&theme=${theme}&zoom=${zoom}&appearance=${appearance}`);
   const v=page.getByRole('region',{name:'全高聊天消息'});await v.waitFor();
   const geometry=await v.evaluate(e=>{const root=e.parentElement,host=root.parentElement,header=host.querySelector('header'),r=root.getBoundingClientRect(),h=header.getBoundingClientRect(),v=e.getBoundingClientRect();return {bottom:r.bottom,headerBottom:h.bottom,top:r.top,viewportHeight:v.height,pageHeight:document.documentElement.scrollHeight,windowHeight:innerHeight,zoom:parseFloat(getComputedStyle(document.documentElement).zoom),overflow:root.scrollHeight>root.clientHeight+1,readers:[...host.querySelectorAll('*')].filter(n=>getComputedStyle(n).overflowY==='auto'&&n.scrollHeight>n.clientHeight+1).length};});
   if(Math.abs(geometry.bottom-900)>2||Math.abs(geometry.top-geometry.headerBottom)>1||geometry.pageHeight>902||geometry.overflow||geometry.readers!==1)throw Error(JSON.stringify(geometry));
   const pageScroll=await page.evaluate(()=>{window.scrollTo(0,document.documentElement.scrollHeight);return window.scrollY;});if(pageScroll!==0)throw Error('host page scrolls');
   await v.focus();await page.keyboard.press('Home');await page.waitForTimeout(350);
   const first=await v.locator('[data-chat-entry]').first().boundingBox(),bounds=await v.boundingBox();
   if(first.y<bounds.y-2)throw Error('Home did not reach first row');
   await page.getByRole('button',{name:'回到最新并跟随'}).click();
   if(!await v.evaluate(e=>Math.abs(e.scrollHeight-e.scrollTop-e.clientHeight)<2))throw Error('last row unreachable');
   rows.push({theme,width,zoom,appearance,pass:true,geometry});
  }catch(e){rows.push({theme,width,zoom,appearance,pass:false,error:String(e)});}
 }
 return {pass:rows.every(r=>r.pass),rows};
}
