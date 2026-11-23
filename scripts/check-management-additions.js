// Production browser check for #219–#223. Native Playwright Page, no test runner.
// Return pass/failures; CSS zoom does not prove browser-native zoom or spoken AT.
async (page,{quick=false}={})=>{
 const base=await page.evaluate(()=>location.origin+location.pathname),failures=[],samples=[];
 const check=(value,tag,message)=>{if(!value)failures.push({tag,message});};
 const goto=async(section,theme='rhine',width=880,zoom=1,motion='normal')=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:motion==='system'?'reduce':'no-preference'});
  await page.goto(base+'?theme='+theme+'&run='+samples.length+'#'+section);
  await page.locator('.rhine-theme').waitFor({state:'attached'});
  if(await page.evaluate(()=>location.origin+location.pathname)!==base)throw new Error('Browser changed the fixture origin/path during this run.');
  await page.evaluate(({zoom,motion})=>{document.documentElement.style.zoom=String(zoom);const root=document.querySelector('.rhine-theme');root.dataset.rhineMotion=motion==='manual'?'reduced':'system';}, {zoom,motion});
  await page.locator('main h1,main h2,main h3').first().waitFor({state:'visible'});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.querySelector('main')?.getAnimations({subtree:true}).every(animation=>animation.playState!=='running'||animation.effect.getTiming().iterations===Infinity),undefined,{timeout:5000});
 };
 const matrix=quick?[{theme:'rhine',width:520,zoom:2}]:['rhine','arknights','neo-brutalism','neutral','graphite'].flatMap(theme=>[400,520,880].flatMap(width=>[1,2].map(zoom=>({theme,width,zoom}))));
 for(const scope of matrix)for(const section of ['icon','tree','rich-text','monitoring']){
  const tag=[section,scope.theme,scope.width,scope.zoom].join('/');
  try{
   await goto(section,scope.theme,scope.width,scope.zoom);
   const measured=await page.evaluate(({section,zoom})=>{
    const main=document.querySelector('main'),theme=document.querySelector('.rhine-theme');
    const buttons=[...main.querySelectorAll('button,a.rhine-button,summary')].filter(n=>n.getClientRects().length&&!n.closest('[inert]'));
    const small=buttons.filter(n=>n.getBoundingClientRect().height/zoom<43.5).map(n=>({name:n.getAttribute('aria-label')||n.textContent,height:n.getBoundingClientRect().height/zoom}));
    const icons=[...main.querySelectorAll('.rhine-icon')].filter(n=>n.getClientRects().length);
    const badIcons=icons.filter(n=>{const p=n.querySelector('path');return !p?.getAttribute('d')||getComputedStyle(n).stroke!==getComputedStyle(n).color||!Number.isFinite(p.getBBox().width)||(p.getBBox().width<=0&&p.getBBox().height<=0);}).length;
    const platforms=[...main.querySelectorAll('.rhine-platform-mark')];
    const badPlatforms=platforms.filter(n=>getComputedStyle(n).fill!==getComputedStyle(n).color||!n.querySelector('path')?.getAttribute('d')).length;
    const content=main.querySelector('[aria-label="只读报告正文"] .rhine-rich-text__blocks');
    const line=main.querySelector('.rhine-chart[data-density=compact] .rhine-chart__line');
    const plot=main.querySelector('.rhine-chart[data-density=compact] .rhine-chart__plot');
    return {theme:theme.dataset.rhineTheme,mainOverflow:main.scrollWidth>main.clientWidth+2,rootOverflow:document.documentElement.scrollWidth>innerWidth+2,small,badIcons,badPlatforms,icons:icons.length,platforms:platforms.length,inertTargets:main.querySelectorAll('[inert] button').length,
     richMark:[...(content?.querySelectorAll('mark')||[])].map(n=>n.textContent).join(''),unsafeContent:content?.querySelectorAll('script,img,iframe,video,svg').length,
     line:line?.getAttribute('d'),compactHeight:plot?.getBoundingClientRect().height/zoom,treeStops:[...main.querySelectorAll('[role=treeitem][tabindex="0"]')].length,section};
   },{section,zoom:scope.zoom});
   check(!measured.mainOverflow&&!measured.rootOverflow,tag,'no page or main horizontal overflow');check(measured.small.length===0,tag,'44px visible action targets: '+JSON.stringify(measured.small));
   if(section==='icon'){check(measured.badIcons===0&&measured.icons>100,tag,'all concrete icon paths inherit currentColor');check(measured.badPlatforms===0&&measured.platforms>=6,tag,'inline platform marks inherit currentColor');}
   if(section==='tree')check(measured.treeStops===1,tag,'one visible treeitem in normal Tab order');
   if(section==='rich-text'){check(measured.richMark==='跨格式边界🙂',tag,'cross-format Chinese/emoji mark');check(measured.unsafeContent===0,tag,'no executable or remote-resource content element');}
   if(section==='monitoring'){check(measured.line&&!/NaN|Infinity/.test(measured.line)&&measured.line.split('M').length===3,tag,'two finite runs separated by unknown');check(measured.compactHeight>=43.5,tag,'compact interaction target retains 44px');}
   samples.push({tag,measured});
  }catch(error){failures.push({tag,message:String(error)});}
 }
 const flow=async(tag,run)=>{try{await run();samples.push({tag,pass:true});}catch(error){failures.push({tag,message:String(error)});}};
 await flow('icon-actions-menu-states',async()=>{
  await goto('icon');await page.getByRole('button',{name:'导出演示',exact:true}).click();await page.getByRole('button',{name:'移除演示',exact:true}).focus();await page.keyboard.press('Enter');
  check((await page.getByText('演示动作次数：2',{exact:true}).count())===1,'icons','button and named icon action use real input');
  await page.getByRole('button',{name:'管理动作',exact:true}).click();await page.getByRole('menuitem',{name:'编辑演示',exact:true}).click();
  await page.getByLabel('图标动作状态').selectOption('busy');check(await page.getByRole('button',{name:'移除演示',exact:true}).getAttribute('aria-busy')==='true','icons','busy keeps named action');
  await page.getByLabel('图标动作状态').selectOption('disabled');check(await page.getByRole('button',{name:'移除演示',exact:true}).isDisabled(),'icons','disabled action unavailable');
  await page.getByLabel('检查图标名称').fill('constructor');check(await page.getByText('图标名称不受支持',{exact:true}).isVisible(),'icons','unknown name has explicit host validation');
  await page.getByLabel('未知平台后备').selectOption('unsupported');check(await page.getByText('未支持的平台',{exact:true}).isVisible(),'platform','unsupported platform never mislabels brand');
  for(const state of ['busy','disabled']){await page.getByLabel('平台下载状态').selectOption(state);check(await page.getByRole('link',{name:state==='busy'?'正在准备macOS':'下载 macOS 版本',exact:true}).getAttribute('href')===null,'platform','unavailable download has no href '+state);}
 });
 await flow('tree-keyboard-proposal-host-failure-retry',async()=>{
  await goto('tree');await page.getByLabel('标记节点名称').fill('资源');const item=page.getByRole('treeitem',{name:'资源甲',exact:true});await item.focus();await page.keyboard.press('Shift+F10');
  const popup=page.getByRole('dialog',{name:'移动资源甲',exact:true});await popup.getByLabel('目标节点').selectOption('other');await popup.getByLabel('放置位置').selectOption('inside');await popup.getByRole('button',{name:'提出移动',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'宿主确认移动',exact:true});await dialog.waitFor({state:'visible'});check(await dialog.getByText('尚未移动',{exact:true}).isVisible(),'tree','proposal does not mutate before confirmation');
  await dialog.getByRole('button',{name:'取消提案',exact:true}).click();await page.getByLabel('移动确认结果').selectOption('fail');await item.focus();await page.keyboard.press('Shift+F10');
  await popup.getByLabel('目标节点').selectOption('other');await popup.getByRole('button',{name:'提出移动',exact:true}).click();await dialog.getByRole('button',{name:'确认移动',exact:true}).click();await dialog.getByText('移动未完成',{exact:true}).waitFor();
  check((await page.getByText(/树revision：1；选择：a/).count())===1,'tree','failure retains host tree and selection');await dialog.getByRole('button',{name:'重试移动',exact:true}).click();await dialog.getByText('合成移动已确认',{exact:true}).waitFor();
  check((await page.getByText(/树revision：2；选择：a/).count())===1,'tree','explicit retry success increments host revision once');await dialog.getByRole('button',{name:'取消提案',exact:true}).click();
  await page.getByLabel('组织树状态').selectOption('readonly');check(await page.getByRole('button',{name:'移动资源甲',exact:true}).isDisabled(),'tree','readOnly blocks move');
  await page.getByLabel('组织树状态').selectOption('error');await page.getByRole('button',{name:'重试读取',exact:true}).click();check(await page.getByLabel('组织树状态').inputValue()==='normal','tree','read failure retry delegates to host');
 });
 await flow('rich-source-highlight-copy-expand-safety',async()=>{
  await goto('rich-text');const region=page.getByRole('region',{name:'只读报告正文',exact:true});
  await region.getByRole('button',{name:/继续显示/}).click();await region.getByRole('button',{name:'复制原文',exact:true}).click();await region.getByText('复制失败，请重试',{exact:true}).waitFor();
  await region.getByRole('button',{name:'复制原文',exact:true}).click();await page.getByText('原文复制值逐字一致',{exact:true}).waitFor();
  const before=await region.locator('.rhine-rich-text__blocks').textContent();await page.getByLabel('正文搜索高亮').fill('');check(await region.locator('mark').count()===0,'rich','clearing search removes all marks');check(await region.locator('.rhine-rich-text__blocks').textContent()===before,'rich','highlight never mutates rendered content');
  check(await region.locator('a,img,script,iframe').count()===0,'rich','default has no navigation or remote resource');
  await page.getByLabel('允许安全http(s)导航').check();check(await region.locator('a').count()===1,'rich','only safe explicit navigation enabled');
  await page.getByLabel('只读内容场景').selectOption('large');check(await page.getByText('内容超出单次呈现上限',{exact:true}).isVisible(),'rich','source limit is explicit');
  await page.getByLabel('只读内容场景').selectOption('long');check(await region.locator('.rhine-rich-text__blocks>p').count()===6,'rich','long content DOM begins with bounded batch');
 });
 await flow('compact-inspection-all-states-full-raw-data',async()=>{
  await goto('monitoring');const figure=page.getByRole('figure',{name:'CPU历史',exact:true}),plot=figure.getByRole('img');await plot.focus();await page.keyboard.press('End');check((await figure.locator('.rhine-chart__inspection').textContent()).includes('10:50：未知'),'chart','actual latest unknown accessible');
  await figure.locator('summary').click();check(await figure.getByRole('cell',{name:'0',exact:true}).isVisible(),'chart','raw zero retained in full data');
  await page.getByLabel('格式化数值').selectOption('full');check(!(await figure.textContent()).includes('% %'),'chart','complete unit not repeated');
  for(const state of ['unknown','empty','single','extreme','stale','error','loading']){await page.getByLabel('紧凑趋势状态').selectOption(state);const text=await figure.textContent();check(state==='unknown'?text.includes('所有采样值均未知'):state==='empty'?text.includes('暂无采样'):state==='stale'?text.includes('数据已陈旧'):state==='error'?text.includes('图表读取失败'):state==='loading'?text.includes('正在读取'):true,'chart','truthful state '+state);if(state==='extreme')check(!/NaN|Infinity/.test(await figure.locator('.rhine-chart__line').getAttribute('d')),'chart','finite extreme coordinates');}
 });
 for(const motion of ['system','manual'])await flow('reduced-'+motion,async()=>{
  await goto('tree','rhine',520,2,motion);await page.getByRole('treeitem',{name:'资源甲',exact:true}).focus();await page.keyboard.press('Shift+F10');await page.getByRole('dialog',{name:'移动资源甲',exact:true}).getByRole('button',{name:'取消移动',exact:true}).click();
  await goto('rich-text','rhine',520,2,motion);await page.getByRole('region',{name:'只读报告正文',exact:true}).getByRole('button',{name:/继续显示/}).click();
  await goto('monitoring','rhine',520,2,motion);await page.getByRole('figure',{name:'CPU历史',exact:true}).getByRole('img').focus();await page.keyboard.press('End');
 });
 return {pass:failures.length===0,base,samples,failures,userAgent:await page.evaluate(()=>navigator.userAgent),limits:['synthetic showcase, no real backend or consumer upgrade','CSS zoom only; native zoom and spoken assistive output not proven','Ego and native browser paths reported independently']};
}
