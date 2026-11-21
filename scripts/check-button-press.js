async page => {
  const context = await page.evaluate(() => ({origin: location.origin, baseline: new URLSearchParams(location.search).has('pressBaseline')}));
  const cases = context.baseline
    ? [['neo-brutalism', 520, 'normal', 1], ['rhine', 520, 'system', 1]]
    : [
      ...['rhine', 'neutral', 'graphite', 'arknights', 'neo-brutalism'].map(theme => [theme, 520, 'normal', 1]),
      ['rhine', 400, 'normal', 1], ['neo-brutalism', 880, 'normal', 1], ['neo-brutalism', 880, 'normal', 2],
      ['rhine', 520, 'system', 1], ['rhine', 520, 'manual', 1],
      ['neo-brutalism', 520, 'system', 1], ['neo-brutalism', 520, 'manual', 1],
    ];
  const failures = [], results = [], errors = [], dangerContrast = [];
  const onError = error => errors.push(error.message);
  page.on('pageerror', onError);
  const closeTo = (a, b) => a.every((value, i) => Math.abs(value - b[i]) < .25);
  try {
    for (const [theme, width, motion, zoom] of cases) {
      const label = [theme, width, motion, zoom].join('/');
      const expect = (ok, message) => {if (!ok) failures.push(label + ': ' + message);};
      await page.setViewportSize({width, height: 860});
      await page.emulateMedia({reducedMotion: motion === 'system' ? 'reduce' : 'no-preference'});
      await page.goto(context.origin + '/?theme=' + theme + '&pressRun=' + label + '#button-actions');
      if (motion === 'manual') await page.getByRole('radio', {name: '减少动态', exact: true}).check();
      const group = page.getByRole('region', {name:'按钮按压回归'});
      const button = group.getByRole('button', {name:'按压边界示例'}), toggle = group.getByRole('checkbox', {name:'禁用按压示例'});
      const count = async () => Number((await group.getByRole('status').textContent()).match(/\d+/)[0]);
      if (zoom !== 1) await group.evaluate((node, factor) => {node.style.zoom = String(factor);}, zoom);
      const env = await button.evaluate(node => ({theme:node.closest('.rhine-theme').dataset.rhineTheme, manual:node.closest('.rhine-theme').dataset.rhineMotion, system:matchMedia('(prefers-reduced-motion:reduce)').matches}));
      expect(env.theme === theme && env.system === (motion === 'system') && (env.manual === 'reduced') === (motion === 'manual'), 'unexpected theme or motion setting');
      const sample = async (point) => button.evaluate((node, [x, y]) => {
        const rect = e => {const r = e.getBoundingClientRect();return [r.x, r.y, r.width, r.height];};
        const style = getComputedStyle(node); const feedback = getComputedStyle(node, '::after');
        return {box:rect(node), label:rect(node.firstElementChild), hit:node.contains(document.elementFromPoint(x,y)), focus:document.activeElement===node, outline:style.outlineStyle, shadow:style.boxShadow, feedback:{opacity:Number(feedback.opacity), inset:feedback.top, duration:feedback.transitionDuration, events:feedback.pointerEvents}};
      }, point);
      const settle = () => button.evaluate(node => Promise.all(node.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{}))));
      const edges = {};
      for (const edge of ['top', 'right', 'bottom', 'left', 'center']) {
        await button.evaluate(async node => {
          node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
          // Let the engine finish its scroll placement before choosing the
          // edge in viewport coordinates; measure the press only after that.
          let previous = '', stable = 0;
          for (let frame = 0; frame < 30 && stable < 3; frame++) {
            await new Promise(resolve=>requestAnimationFrame(resolve));
            const rect=node.getBoundingClientRect(), key=[rect.x,rect.y,rect.width,rect.height].join();
            stable=key===previous?stable+1:0;previous=key;
          }
          if (stable < 3) throw Error('button position did not settle before the edge sample');
        });
        const pt = await button.evaluate((node, side) => {
          const r = node.getBoundingClientRect(), x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2);
          const candidates = {top:[x,Math.ceil(r.y),0,1],right:[Math.floor(r.right-1),y,-1,0],bottom:[x,Math.floor(r.bottom-1),0,-1],left:[Math.ceil(r.x),y,1,0],center:[x,y,0,0]};
          const [a,b,dx,dy] = candidates[side];
          // The tactical theme uses a skewed clip-path. Sample the first point
          // inside the resting hit shape, not the transparent bounding rectangle.
          for (let step = 0; step < 18; step++) {
            const px = a+dx*step, py = b+dy*step;
            if (node.contains(document.elementFromPoint(px,py))) return [px,py];
          }
          return [a,b];
        }, edge);
        await page.mouse.move(...pt);await settle();
        const before = await sample(pt), total = await count();
        await page.mouse.down();const initial = await sample(pt);await settle();const down = await sample(pt);
        await page.mouse.up();const released = (await count()) - total;
        expect(before.hit && initial.hit && down.hit && released === 1, edge + ' loses its hit or activation');
        expect(closeTo(before.box, initial.box) && closeTo(before.box, down.box) && closeTo(before.label, down.label), edge + ' moves button or label');
        expect(down.feedback.events === 'none' && down.feedback.opacity > before.feedback.opacity, edge + ' lacks noninteractive press feedback');
        if (motion !== 'normal') expect(down.feedback.inset === before.feedback.inset && down.feedback.duration.split(',').every(s=>parseFloat(s)===0), edge + ' moves or animates in reduced motion');
        if (theme === 'neo-brutalism') expect(before.shadow !== 'none' && down.shadow === 'none', edge + ' loses the hard-shadow press cue');
        edges[edge] = {released, before, down};
      }
      let tabKey = 'Tab';
      await toggle.focus();await page.keyboard.press(tabKey);
      if (!await button.evaluate(node => node === document.activeElement)) {
        // WebKit on macOS may skip push buttons with Tab alone; Option+Tab
        // is its explicit native path through all controls.
        tabKey = 'Alt+Tab'; await toggle.focus();await page.keyboard.press(tabKey);
      }
      const r = await button.boundingBox(), focused = await sample([r.x+r.width/2,r.y+r.height/2]);
      expect(focused.focus && (focused.outline !== 'none' || focused.shadow.includes('inset')), 'keyboard focus indicator missing');
      const beforeKeys = await count();await page.keyboard.press('Enter');await page.keyboard.press('Space');
      expect((await count()) - beforeKeys === 2, 'keyboard action stopped');
      await toggle.check();const beforeDisabled = await count();await button.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
      const disabled = await sample([r.x+r.width/2,r.y+r.height/2]);
      expect(await button.getAttribute('aria-disabled')==='true' && disabled.focus && await count()===beforeDisabled, 'disabled action changes focus or activates');
      results.push({theme,width,motion,zoom,tabKey,edges});
    }
    if (!context.baseline) {
      for (const motion of ['normal','system','manual']) {
        await page.setViewportSize({width:880,height:860});
        await page.emulateMedia({reducedMotion: motion==='system'?'reduce':'no-preference'});
        await page.goto(context.origin+'/?theme=arknights&dangerContrast='+motion+'#button-actions');
        if(motion==='manual')await page.getByRole('radio',{name:'减少动态',exact:true}).check();
        const button=page.locator('#button-actions').getByRole('button',{name:'删除记录',exact:true}).first();
        await button.hover();
        const settle=()=>button.evaluate(node=>Promise.all(node.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{}))));
        await settle();
        const rect=await button.boundingBox();
        const clip={x:Math.round(rect.x+rect.width/2)-2,y:Math.round(rect.y)+6,width:4,height:4};
        const readContrast=async()=>{
          const png=(await page.screenshot({clip,scale:'css'})).toString('base64');
          return button.evaluate(async (node,png)=>{
            // Sample the real composited face above the label, not just its CSS base color.
            const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
            const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
            const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
            const background=[...ctx.getImageData(1,1,1,1).data].slice(0,3);
            ctx.fillStyle=getComputedStyle(node).color;ctx.fillRect(0,0,1,1);
            const foreground=[...ctx.getImageData(0,0,1,1).data].slice(0,3);
            const luminance=rgb=>rgb.map(channel=>channel/255).reduce((sum,s,index)=>sum+[.2126,.7152,.0722][index]*(s<=.04045?s/12.92:((s+.055)/1.055)**2.4),0);
            const levels=[luminance(foreground),luminance(background)];
            return {background,foreground,ratio:(Math.max(...levels)+.05)/(Math.min(...levels)+.05)};
          },png);
        };
        const hover=await readContrast();
        await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
        let held;
        try {await settle();held=await readContrast();}
        finally {await page.mouse.move(rect.x-24,rect.y-24);await page.mouse.up();}
        if (hover.ratio<4.5 || held.ratio<4.5 || hover.background.join()===held.background.join()) {
          failures.push('arknights danger '+motion+': expected visible press feedback and 4.5:1 in both states, got '+hover.ratio.toFixed(2)+' / '+held.ratio.toFixed(2));
        }
        dangerContrast.push({motion,hover,held});
      }
    }
  } finally {page.off('pageerror', onError);}
  const result = {pass: !failures.length && !errors.length, cases:results.length, samples:results.length*5, failures, errors, results, dangerContrast};
  await page.locator('body').evaluate((body,value)=>{body.dataset.pressVerification=JSON.stringify(value);}, result);
}
