async page => {
  // Same WCAG sRGB formula as check-button-actions / check-chat-layout; extend
  // their opaque pairs with real ancestor backgrounds, not a token-only fixture.
  page.setDefaultTimeout(5000);
  const base = await page.evaluate(() => location.origin);
  const probe = await page.evaluate(() => new URLSearchParams(location.search).get('roleProbe'));
  const quick = await page.evaluate(() => new URLSearchParams(location.search).has('roleQuick'));
  const compoundOnly = await page.evaluate(() => new URLSearchParams(location.search).has('roleCompound'));
  const samples = [], failures = [], errors = [], scenarios = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  const check = (ok, context) => { if (!ok) failures.push(context); };
  let context;
  const settle = () => page.waitForTimeout(400);
  const measure = async (locator, role, kind = 'text', pseudo = null) => {
    await locator.scrollIntoViewIfNeeded();
    const probeControlOpacity = probe === 'opacity' && ['Button/focus','TextField/boundary'].includes(role);
    if (probeControlOpacity) await locator.evaluate(e=>e.style.opacity='0.1');
    const value = await locator.evaluate((el, { kind, pseudo }) => {
      const css = getComputedStyle(el, pseudo), chain = [];
      const rgba = value => {
        // Browser resolves CSS Color 4 too; no hand-parsed color(srgb) fallback.
        const rgb = value.match(/^rgba?\(([^)]+)\)$/);
        if (rgb) { const parts = rgb[1].split(/[,\s/]+/).map(Number); return [...parts.slice(0,3), parts[3] ?? 1]; }
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1);
        const p = [...ctx.getImageData(0, 0, 1, 1).data]; return [...p.slice(0, 3), p[3] / 255];
      };
      const over = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3])).concat(1);
      const lum = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
      // Compositing is affine in each alpha, so endpoint combinations bound
      // each RGB channel. Luminance is monotone in each channel, but need not
      // be monotone along a mixed-channel color path (e.g. red over green).
      const luminanceRange = colors => [
        lum([0,1,2].map(i=>Math.min(...colors.map(c=>c[i])))),
        lum([0,1,2].map(i=>Math.max(...colors.map(c=>c[i])))),
      ];
      const contrastLowerBound = (foregrounds, backgrounds) => {
        const [fMin,fMax] = luminanceRange(foregrounds), [bMin,bMax] = luminanceRange(backgrounds);
        return fMax < bMin ? (bMin+.05)/(fMax+.05) : bMax < fMin ? (fMin+.05)/(bMax+.05) : 1;
      };
      const shadowColor = css.boxShadow.match(/rgba?\([^)]+\)/)?.[0];
      const shadowGeometry = css.boxShadow.replace(/rgba?\([^)]+\)/, '').trim();
      const insetFocus = kind === 'focus' && css.outlineStyle === 'none' && !!shadowColor && /^0px 0px 0px [1-9][\d.]*px inset$/.test(shadowGeometry);
      let node = kind === 'boundary' || (kind === 'focus' && !insetFocus) ? el.parentElement : el;
      while (node) { const s = getComputedStyle(node); chain.unshift({ tag: node.tagName, color: s.backgroundColor, image: s.backgroundImage, opacity: s.opacity }); node = node.parentElement; }
      let backgrounds = [[255, 255, 255, 1]], unsupported = [], opacityIssues = [];
      for (const layer of chain) {
        const color = rgba(layer.color);
        if (color[3] === 1) { unsupported = []; backgrounds = [color]; }
        else backgrounds = backgrounds.map(bg => over(color, bg));
        if (layer.image !== 'none') {
          // Only the existing single-color sweep, grid and dot shapes. Compose
          // CSS image layers back-to-front, including every grid intersection.
          const images = layer.image.match(/(?:linear|radial)-gradient\((?:[^()]|\([^()]*\))*\)/g) || [];
          const known = images.join(', ') === layer.image && images.every(image => {
            const shape = image.replace(/rgba?\([^)]+\)/g,'C');
            const stops = image.match(/rgba?\([^)]+\)/g)?.map(rgba) || [];
            const painted = stops.filter(c=>c[3]>0);
            return /^(?:linear-gradient\(105deg, C 30%, C 50%, C 70%\)|linear-gradient\((?:90deg, )?C 1px, C 1px\)|radial-gradient\(circle, C 0?\.8px, C 0?\.9px\))$/.test(shape) && painted.length > 0 && painted.every(c=>c.slice(0,3).join()===painted[0].slice(0,3).join());
          });
          if (known) for (const image of images.reverse()) {
            const stops = image.match(/rgba?\([^)]+\)/g).map(rgba);
            backgrounds = backgrounds.flatMap(bg=>stops.map(stop=>over(stop,bg)));
          }
          else unsupported.push('background-image: ' + layer.image);
        }
        if (Number(layer.opacity) !== 1) opacityIssues.push('ancestor opacity: ' + layer.opacity);
      }
      if (Number(css.opacity) !== 1) opacityIssues.push('measured opacity: ' + css.opacity);
      unsupported.push(...opacityIssues);
      const disabled = el.matches(':disabled,[aria-disabled=true]');
      const raw = kind === 'boundary' ? css.borderTopColor : kind === 'focus' ? (insetFocus ? shadowColor : css.outlineColor) : kind === 'indicator' ? css.backgroundColor : css.color;
      const foregrounds = backgrounds.map(bg => {
        let fg = over(rgba(raw), bg);
        if (disabled && Number(css.opacity) !== 1) fg = over([...fg.slice(0,3), Number(css.opacity)], bg);
        return fg;
      });
      const bg = backgrounds[0], fg = foregrounds[0];
      // Channel envelopes include interior luminance extrema. Overlapping
      // foreground/background intervals cannot certify contrast.
      let ratio = contrastLowerBound(foregrounds, backgrounds);
      const boundaryFillRatio = kind === 'boundary' ? contrastLowerBound(backgrounds.map(bg=>over(rgba(css.backgroundColor),bg)),backgrounds) : null;
      if (boundaryFillRatio !== null) ratio = Math.max(ratio,boundaryFillRatio);
      const large = parseFloat(css.fontSize) >= 24 || (parseFloat(css.fontSize) >= 56 / 3 && parseFloat(css.fontWeight) >= 700);
      const threshold = kind === 'text' ? (large ? 3 : 4.5) : 3;
      const visible = !!el.getClientRects().length && css.visibility === 'visible' && css.display !== 'none';
      const drawn = kind === 'focus' ? (insetFocus || (css.outlineStyle !== 'none' && parseFloat(css.outlineWidth) > 0)) && el.matches(':focus-visible') : kind === 'indicator' ? css.content !== 'none' && css.transform !== 'matrix(0, 0, 0, 1, 0, 0)' : kind === 'boundary' ? boundaryFillRatio >= 3 || (css.borderTopStyle !== 'none' && parseFloat(css.borderTopWidth) > 0) : true;
      return { measuredOpacity: css.opacity, measuredDisplay: css.display, raw, foreground: fg, background: bg, ratio, boundaryFillRatio, ratioBound: backgrounds.length > 1, backgroundLuminanceRange: luminanceRange(backgrounds), foregroundLuminanceRange: luminanceRange(foregrounds), backgrounds, insetFocus, threshold, disabled, visible, drawn, unsupported, chain, fontSize: css.fontSize, fontWeight: css.fontWeight, text: (el.value || el.textContent || '').trim().slice(0, 90) };
    }, { kind, pseudo });
    if (probeControlOpacity) await locator.evaluate(e=>e.style.removeProperty('opacity'));
    const sample = { ...context, role, kind, pseudo, ...value, status: value.disabled ? 'EXEMPT' : value.unsupported.length ? 'UNMEASURED' : value.visible && value.drawn && value.ratio >= value.threshold ? 'PASS' : 'FAIL' };
    samples.push(sample);
    check(sample.status === 'PASS' || sample.status === 'EXEMPT', { ...context, role, kind, status: sample.status, ratio: value.ratio, threshold: value.threshold, unsupported: value.unsupported });
    return sample;
  };
  const compoundFocus = async locator => {
    await locator.blur(); await page.keyboard.press('Shift'); await locator.focus(); await settle();
  };
  const keyboardFocus = async (locator, role) => {
    await locator.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await settle();
    // WebKit on macOS can skip links and push buttons in the default Tab policy.
    // This color check still requires visible focus on the exact target.
    if (!await locator.evaluate(e=>e===document.activeElement && e.matches(':focus-visible'))) await compoundFocus(locator);
    await measure(locator, role, 'focus');
  };
  const themeFilter = await page.evaluate(() => new URLSearchParams(location.search).get('roleTheme'));
  const allThemes = ['rhine', 'arknights', 'neo-brutalism', 'neutral', 'graphite'];
  const themes = allThemes.includes(themeFilter) ? [themeFilter] : probe || quick ? ['rhine'] : allThemes;
  const cases = probe || quick ? [{width:880,zoom:1,motion:'normal'}] : [400,520,880].flatMap(width => [1,2].map(zoom => ({width,zoom,motion:'normal'}))).concat(['system','manual'].map(motion => ({width:880,zoom:1,motion})));
  const compoundCases = [{width:880,zoom:1,motion:'normal'}, {width:400,zoom:1,motion:'system'}, {width:520,zoom:2,motion:'manual'}];
  for (const theme of themes) for (const scenario of compoundOnly ? (quick ? compoundCases.slice(0,1) : compoundCases) : cases) {
    context = {theme,...scenario}; const {width,zoom,motion} = scenario;
    await page.setViewportSize({width,height:1000});
    await page.emulateMedia({reducedMotion:motion === 'system' ? 'reduce' : 'no-preference'});
    const goto = async (route) => {
      await page.goto(`${base}/?theme=${theme}&zoom=${zoom}&motion=${motion}${route}`);
      await page.evaluate(({zoom,motion}) => { document.documentElement.style.zoom = String(zoom); if(motion === 'manual') document.querySelector('.rhine-theme').setAttribute('data-rhine-motion','reduced'); }, {zoom,motion});
      await page.mouse.move(0,0); await settle();
    };
    try {
      if (compoundOnly) {
        await goto('#selection');
        const card = page.locator('.rhine-selection');
        const checkbox = card.getByRole('checkbox');
        const bg = () => card.evaluate(e=>getComputedStyle(e).backgroundColor);
        await card.hover(); await settle();
        const unselectedHover = await bg();
        check(!await checkbox.isChecked(), {...context,role:'SelectionCard/hover does not select'});
        await checkbox.press('Space'); await page.mouse.move(0,0); await settle();
        const selected = await bg();
        await card.hover(); await settle();
        const selectedHover = await bg();
        check(await checkbox.isChecked() && selectedHover===selected, {...context,role:'SelectionCard/selected fill survives hover',selected,selectedHover,unselectedHover});
        await measure(card.locator('strong'),'SelectionCard/selected hover title');
        await measure(card.locator('.ds-caption'),'SelectionCard/selected hover description');
        await measure(card.getByText('已选择',{exact:true}),'SelectionCard/selected hover badge');

        await goto('#forms');
        const field = page.getByRole('textbox',{name:'校验失败示例',exact:true});
        await field.fill('需要保留的草稿');
        const border = () => field.evaluate(e=>getComputedStyle(e).borderTopColor);
        await field.blur();await settle();const invalidBorder=await border();
        await compoundFocus(field); await measure(field,'Textarea/invalid keyboard focus','focus');
        check(await field.getAttribute('aria-invalid')==='true' && await field.inputValue()==='需要保留的草稿' && await border()===invalidBorder,{...context,role:'Textarea/focus preserves error cue and draft',invalidBorder,focusedBorder:await border()});
        await measure(field,'Textarea/invalid focused value');
        await measure(field,'Textarea/invalid focused boundary','boundary');
        await measure(page.getByText('请填写说明后继续。',{exact:true}),'Textarea/invalid focused explanation');

        await goto('#overlays');
        const trigger=page.getByRole('button',{name:'查看详情',exact:true});
        await trigger.focus();await trigger.press('Enter');
        const pop=page.getByRole('dialog',{name:'工作区详情',exact:true});await pop.waitFor();
        const belongs = locator=>locator.evaluate((el,theme)=>el.closest('.rhine-theme')?.dataset.rhineTheme===theme,theme);
        check(await belongs(pop),{...context,role:'Popover/compound portal theme'});
        const link = pop.getByRole('link');
        await link.hover();await settle();
        await measure(link,'Popover/hovered link');
        check(await link.evaluate(e=>getComputedStyle(e).textDecorationLine.includes('underline')),{...context,role:'Popover/link retains non-color cue'});
        await compoundFocus(link); await measure(link,'Popover/link keyboard focus','focus');
        await measure(pop.getByText('气泡用于补充内容，不阻断页面。',{exact:true}),'Popover/body hint');
        await page.keyboard.press('Escape');await pop.waitFor({state:'detached'});
        await page.waitForFunction(()=>document.activeElement?.textContent?.trim()==='查看详情');
        const tipTrigger=page.getByRole('button',{name:'额度说明',exact:true});
        await tipTrigger.hover();const tip=page.locator('.rhine-tooltip');await tip.waitFor();
        check(await belongs(tip),{...context,role:'Tooltip/hover portal theme'});
        await measure(tip,'Tooltip/hovered hint');
        await page.keyboard.press('Escape');await tip.waitFor({state:'detached'});
        await page.mouse.move(0,0);await compoundFocus(tipTrigger);await tip.waitFor();
        check(await belongs(tip)&&await tipTrigger.evaluate(e=>document.activeElement===e&&e.matches(':focus-visible')),{...context,role:'Tooltip/keyboard trigger and theme'});
        await measure(tip,'Tooltip/keyboard hint');
        await page.keyboard.press('Escape');await tip.waitFor({state:'detached'});
        check(await tipTrigger.evaluate(e=>document.activeElement===e),{...context,role:'Tooltip/Escape retains trigger focus'});
        scenarios.push({...context,status:'COMPLETED'});
        continue;
      }
      await goto('&fixture=neutral');
      const field = page.getByRole('textbox',{name:'记录名称',exact:true});
      await field.fill('颜色验收 · 保留的合成草稿');
      const save = page.getByRole('button',{name:'保存示例',exact:true});
      if(probe === 'text') await save.evaluate(e=>e.style.color=getComputedStyle(e).backgroundColor);
      await measure(save,'Button/primary');
      await save.hover(); await settle(); await measure(save,'Button/primary:hover');
      await page.mouse.move(0,0); await settle();
      if(probe === 'focus') await page.addStyleTag({content:'.rhine-theme button:focus-visible {outline-color:transparent!important}'});
      await keyboardFocus(save,'Button/focus');
      await measure(page.getByRole('button',{name:'暂不可用',exact:true}),'Button/disabled');
      await measure(page.getByRole('button',{name:'等待示例',exact:true}),'Button/busy');
      await measure(field,'TextField/value'); await measure(field,'TextField/boundary','boundary');
      await keyboardFocus(field,'TextField/focus');
      await save.click(); await settle();
      check(await field.getAttribute('aria-invalid') === 'true' && await field.inputValue() === '颜色验收 · 保留的合成草稿',{...context,role:'error draft retention'});
      await measure(page.locator('.rhine-field__error'),'TextField/error'); await measure(field,'TextField/error boundary','boundary');
      await keyboardFocus(field,'TextField/error focus');
      const edit = page.getByRole('tab',{name:'编辑',exact:true});
      if (probe === 'opacity' || probe === 'display') await page.addStyleTag({content:'.rhine-tabs__list button::after {'+(probe === 'opacity'?'opacity:0':'display:none')+'!important}'});
      await measure(edit,'Tabs/selected'); await measure(edit,'Tabs/selected indicator','indicator','::after');
      const details = page.getByRole('tab',{name:'详情',exact:true});
      await details.hover(); await settle(); await measure(details,'Tabs/hover');
      await edit.focus(); await page.keyboard.press('ArrowRight'); await settle();
      check(await details.getAttribute('aria-selected') === 'true',{...context,role:'Tabs/keyboard selection'});
      await measure(details,'Tabs/new selected indicator','indicator','::after');
      await edit.click(); await settle();
      check(await field.inputValue() === '颜色验收 · 保留的合成草稿',{...context,role:'Tabs/draft retention'});
      const trigger = page.getByRole('button',{name:'打开外观设置',exact:true});
      await measure(trigger,'Button/secondary'); await trigger.press('Enter'); await settle();
      const dialog = page.getByRole('dialog');
      check(await dialog.evaluate((e,theme)=>e.closest('.rhine-theme')?.dataset.rhineTheme===theme,theme),{...context,role:'Dialog/portal theme'});
      await measure(dialog.getByRole('heading',{name:'外观设置'}),'Dialog/title');
      await measure(dialog.locator('.rhine-dialog__main > .rhine-text--muted'),'Dialog/description');
      await measure(dialog.getByRole('textbox'),'Dialog/input');
      const link = dialog.getByRole('link');
      if(probe === 'alpha') await link.evaluate(e=>e.style.color='rgba(66, 92, 75, 0.08)');
      await measure(link,'Link/overlay');
      // The Dialog entered via Enter. Sample keyboard focus before pointer hover
      // so WebKit does not carry its pointer modality into the focus sample.
      await link.focus();
      if (!await link.evaluate(e=>e===document.activeElement&&e.matches(':focus-visible'))) {
        // WebKit's full keyboard navigation option includes anchors on Option+Tab.
        await dialog.getByRole('button').last().focus(); await page.keyboard.press('Alt+Tab');
      }
      await settle(); await measure(link,'Link/focus','focus');
      await link.hover(); await settle(); await measure(link,'Link/hover');
      await page.keyboard.press('Escape'); await dialog.waitFor({state:'detached'}); await settle();
      check(await trigger.evaluate(e=>document.activeElement===e),{...context,role:'Dialog/return focus'});
      await goto('#actions');
      const empty = page.getByRole('textbox',{name:'显示名称',exact:true});
      await measure(empty,'TextField/placeholder','text','::placeholder');
      await goto('#button-actions');
      const danger = page.getByRole('button',{name:'删除记录',exact:true}).first();
      await measure(danger,'Button/danger'); await danger.hover(); await settle(); await measure(danger,'Button/danger hover');
      await keyboardFocus(danger,'Button/danger focus');
      await goto('#selection');
      const card = page.locator('.rhine-selection');
      await card.hover(); await settle();
      await measure(card.locator('strong'),'SelectionCard/hover title');
      await measure(card.locator('.ds-caption'),'SelectionCard/hover description');
      if (await card.getAttribute('data-selected') !== 'true') await card.click(); await settle();
      check(await card.getByRole('checkbox').isChecked(),{...context,role:'SelectionCard/selected semantics'});
      await measure(card.locator('strong'),'SelectionCard/selected title');
      await measure(card.locator('.ds-caption'),'SelectionCard/selected description');
      await goto('#forms');
      await measure(page.getByRole('textbox',{name:'备注',exact:true}),'Textarea/boundary','boundary');
      await measure(page.getByRole('textbox',{name:'校验失败示例',exact:true}),'Textarea/error boundary','boundary');
      await goto('#feedback');
      await measure(page.locator('.rhine-notice.rhine-tone-warning strong'),'Notice/warning title');
      await measure(page.locator('.rhine-notice.rhine-tone-warning .rhine-notice__body'),'Notice/warning body');
      await page.getByRole('button',{name:'切换提示',exact:true}).click(); await settle();
      await measure(page.locator('.rhine-notice.rhine-tone-success strong'),'Notice/success title');
      await measure(page.locator('.rhine-notice.rhine-tone-success .rhine-notice__body'),'Notice/success body');
      await goto('#data');
      await measure(page.locator('table th').first(),'DataTable/header'); await measure(page.locator('table td').first(),'DataTable/value');
      await page.locator('table tbody tr').first().hover(); await settle(); await measure(page.locator('table td').first(),'DataTable/hover');
      await page.getByLabel('表格状态').selectOption('error'); await settle();
      await measure(page.locator('.rhine-data .rhine-notice__body'),'DataTable/error');
      await goto('#overlays');
      const popTrigger=page.getByRole('button',{name:'查看详情',exact:true}); await popTrigger.click(); await settle();
      const pop = page.locator('.rhine-popover');
      check(await pop.evaluate((e,theme)=>e.closest('.rhine-theme')?.dataset.rhineTheme===theme,theme),{...context,role:'Popover/portal theme'});
      await measure(pop.locator('.rhine-dialog__head strong'),'Popover/title'); await measure(pop.getByRole('link'),'Popover/link');
      await page.keyboard.press('Escape'); await pop.waitFor({state:'detached'});
      await goto('#backgrounds');
      // Both real defaults (grid/dots included) and the supported plain mode.
      for (const decoration of ['auto','none']) {
        await page.getByLabel('纹理策略').selectOption(decoration); await settle();
        if (probe === 'texture' && decoration === 'auto') await page.locator('.ds-background-scenes .rhine-background[data-tone=canvas]').evaluate(e=>{
          e.style.backgroundColor='rgb(0,0,0)'; e.style.color='rgb(255,255,255)';
          e.style.backgroundImage='linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)';
          for(const text of e.querySelectorAll('.rhine-text'))text.style.color='rgb(255,255,255)';
        });
        if (probe === 'luminance' && decoration === 'auto') await page.locator('.ds-background-scenes .rhine-background[data-tone=canvas]').evaluate(e=>{
          e.style.backgroundColor='rgb(0,255,0)';
          e.style.backgroundImage='linear-gradient(105deg, rgba(255,0,0,0) 30%, rgb(255,0,0) 50%, rgba(255,0,0,0) 70%)';
          for(const text of e.querySelectorAll('.rhine-text'))text.style.color='rgb(0,0,0)';
        });
        for(const role of ['canvas','content','sidebar','surface','overlay','media']) {
          const scene=page.locator(`.ds-background-scenes .rhine-background[data-tone=${role}]`);
          await measure(scene.locator('.rhine-text').last(),`Background/${role}/${decoration}`);
        }
        if(probe === 'texture' || probe === 'luminance') await page.locator('.ds-background-scenes .rhine-background[data-tone=canvas]').evaluate(e=>{e.removeAttribute('style');for(const text of e.querySelectorAll('.rhine-text'))text.removeAttribute('style');});
      }
      scenarios.push({...context,status:'COMPLETED'});
    } catch(error) { failures.push({...context,role:'scenario',error:String(error)}); scenarios.push({...context,status:'INCOMPLETE'}); }
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  page.off('pageerror',onError);
  return {pass:!failures.length&&!errors.length,probe:probe||null,compound:compoundOnly,scenarios,failures,errors,samples,limits:['Representative components, not whole-library WCAG certification','Known default grid/dot/sweep bounds include all alpha intersections; other images/gradients unmeasured, not pixel certification','CSS zoom 2 is not native browser zoom','Disabled contrast is observed without a normative threshold; no new product readability target','Decorative separators, button outlines not needed for identification, modal backdrop contrast: N/A','No APCA substitution; no services, consumer package, or UIKit claims']};
}
