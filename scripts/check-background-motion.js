async page => {
  await page.addInitScript(() => {
  if (window.__donutProof) return;
  const proof = window.__donutProof = { contexts: [], pending: new Set(), rafScheduled: 0, rafFired: 0, rafCancelled: 0, listeners: new Map(), observerCreates: {}, observerDisconnects: {}, orbitObservers: {}, orbitDisconnects: {} };
  let targetID = 0, listenerID = 0;
  const targets = new WeakMap(), listeners = new WeakMap();
  const targetName = target => {
    if (!targets.has(target)) targets.set(target, ++targetID);
    const kind = target === window ? 'window' : target === document ? 'document' : target instanceof HTMLCanvasElement ? 'canvas' : target instanceof MediaQueryList ? 'media' : '';
    return kind ? `${kind}:${targets.get(target)}` : '';
  };
  const nativeAdd = EventTarget.prototype.addEventListener;
  const nativeRemove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    const target = targetName(this);
    if (target && listener && (typeof listener === 'object' || typeof listener === 'function')) {
      if (!listeners.has(listener)) listeners.set(listener, ++listenerID);
      const key = `${target}:${type}:${listeners.get(listener)}:${Boolean(typeof options === 'boolean' ? options : options?.capture)}`;
      proof.listeners.set(key, { target, type });
    }
    return nativeAdd.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const target = targetName(this);
    if (target && listener) proof.listeners.delete(`${target}:${type}:${listeners.get(listener)}:${Boolean(typeof options === 'boolean' ? options : options?.capture)}`);
    return nativeRemove.call(this, type, listener, options);
  };
  const nativeRequest = requestAnimationFrame, nativeCancel = cancelAnimationFrame;
  window.requestAnimationFrame = callback => {
    proof.rafScheduled++;
    const id = nativeRequest(time => { proof.pending.delete(id); proof.rafFired++; callback(time); });
    proof.pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = id => { proof.pending.delete(id); proof.rafCancelled++; nativeCancel(id); };
  for (const name of ['ResizeObserver', 'IntersectionObserver', 'MutationObserver']) {
    const Native = window[name];
    window[name] = class extends Native {
      constructor(callback) { super(callback); proof.observerCreates[name] = (proof.observerCreates[name] || 0) + 1; }
      observe(target, ...args) { if (target instanceof HTMLCanvasElement && target.classList.contains('rhine-orbit-canvas') && !this.orbit) { this.orbit = true; proof.orbitObservers[name] = (proof.orbitObservers[name] || 0) + 1; } return super.observe(target, ...args); }
      disconnect() { if(this.orbit) proof.orbitDisconnects[name] = (proof.orbitDisconnects[name] || 0) + 1; proof.observerDisconnects[name] = (proof.observerDisconnects[name] || 0) + 1; return super.disconnect(); }
    };
  }
  const locations = new WeakMap(), contexts = new WeakMap();
  const record = gl => {
    if (!contexts.has(gl)) {
      const entry = { canvas: gl.canvas, draws: 0, frames: 0, samples: [], time: null, matrices: [], resources: {}, lost: 0, restored: 0, queued: false };
      contexts.set(gl, entry); proof.contexts.push(entry);
      nativeAdd.call(gl.canvas, 'webglcontextlost', () => entry.lost++);
      nativeAdd.call(gl.canvas, 'webglcontextrestored', () => entry.restored++);
    }
    return contexts.get(gl);
  };
  const scheduleSample = gl => {
    const entry = record(gl);
    if (entry.queued) return;
    entry.queued = true;
    queueMicrotask(() => {
      entry.queued = false; entry.frames++;
      const now = performance.now();
      const retainSample = !entry.samples.length || now - entry.samples.at(-1).at >= 180;
      try {
        const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 72;
        const context = canvas.getContext('2d'); context.drawImage(gl.canvas, 0, 0, 100, 72);
        const pixels = context.getImageData(0, 0, 100, 72).data;
        let hash = 2166136261, painted = 0, bright = 0, min = 255, max = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          for (let j = 0; j < 4; j++) hash = Math.imul(hash ^ pixels[i + j], 16777619);
          if (pixels[i + 3]) painted++;
          const luminance = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          if (luminance > 100) bright++;
          min = Math.min(min, luminance); max = Math.max(max, luminance);
        }
        entry.latest = { at: now, time: entry.time, hash: hash >>> 0, painted, bright, min, max, matrices: entry.matrices.slice(0, 40) };
        if (retainSample) entry.samples.push(entry.latest);
        if (entry.samples.length > 700) entry.samples.shift();
      } catch (error) { entry.sampleError = String(error); }
      entry.matrices = [];
    });
  };
  for (const Proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) {
    for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const native = Proto[name]; if (!native || native.__donutProof) continue;
      const wrapped = function (...args) { const result = native.apply(this, args); record(this).draws++; scheduleSample(this); return result; };
      wrapped.__donutProof = true; Proto[name] = wrapped;
    }
    const nativeLocation = Proto.getUniformLocation;
    if (!nativeLocation.__donutProof) {
      const wrapped = function (program, name) { const value = nativeLocation.call(this, program, name); if (value) locations.set(value, name); return value; };
      wrapped.__donutProof = true; Proto.getUniformLocation = wrapped;
    }
    for (const name of ['uniform1f', 'uniformMatrix4fv']) {
      const native = Proto[name]; if (native.__donutProof) continue;
      const wrapped = function (...args) {
        const result = native.apply(this, args), uniform = locations.get(args[0]);
        if (name === 'uniform1f' && /^(time|uTime)$/.test(uniform)) record(this).time = args[1];
        if (name === 'uniformMatrix4fv' && uniform === 'modelViewMatrix') record(this).matrices.push(Array.from(args[2], value => Number(value.toFixed(5))));
        return result;
      };
      wrapped.__donutProof = true; Proto[name] = wrapped;
    }
    for (const kind of ['Buffer', 'Texture', 'Program', 'Shader', 'Framebuffer', 'Renderbuffer', 'VertexArray']) {
      for (const action of ['create', 'delete']) {
        const name = action + kind, native = Proto[name]; if (!native || native.__donutProof) continue;
        const wrapped = function (...args) { const result = native.apply(this, args); const entry = record(this); if (action === 'create' ? result : args[0]) entry.resources[name] = (entry.resources[name] || 0) + 1; return result; };
        wrapped.__donutProof = true; Proto[name] = wrapped;
      }
    }
  }
  window.__donutSnapshot = () => ({
    pendingRafs: proof.pending.size, rafScheduled: proof.rafScheduled, rafFired: proof.rafFired, rafCancelled: proof.rafCancelled,
    listeners: [...proof.listeners.values()], observerCreates: proof.observerCreates, observerDisconnects: proof.observerDisconnects, orbitObservers: proof.orbitObservers, orbitDisconnects: proof.orbitDisconnects,
    contexts: proof.contexts.filter(entry => entry.canvas.classList.contains('rhine-orbit-canvas')).map(entry => ({
      example: entry.canvas.closest('.rhine-orbit')?.getAttribute('aria-label') || null,
      kind: entry.canvas.dataset.orbitArtwork || 'donut', active: !entry.canvas.hidden, canvasConnected: entry.canvas.isConnected, draws: entry.draws, frames: entry.frames, time: entry.time, samples: entry.samples, latest: entry.latest,
      resources: entry.resources, lost: entry.lost, restored: entry.restored, sampleError: entry.sampleError, width: entry.canvas.width, height: entry.canvas.height,
    })),
  });
}
);

  const results=[],errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const snap=()=>page.evaluate(()=>window.__donutSnapshot());
  for(const theme of ['rhine','arknights','neo-brutalism']) {
    await page.setViewportSize({width:1280,height:1000});
    await page.goto(`http://127.0.0.1:18484/?fixture=orbit-entry&theme=${theme}`);
    const root=page.locator('.rhine-orbit'), canvas=root.locator('canvas').first();
    await root.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>window.__donutSnapshot().contexts.some(c=>c.canvasConnected&&c.active&&c.latest?.painted>50));
    const active=s=>s.contexts.find(c=>c.canvasConnected&&c.active);
    const a=active(await snap()); await page.waitForTimeout(450); const b=active(await snap());
    const playing=a.latest.hash!==b.latest.hash&&b.draws>a.draws;
    await page.getByRole('checkbox',{name:'减少入口动态'}).check();
    await page.waitForTimeout(150);const c=active(await snap());await page.waitForTimeout(350); const d=active(await snap());
    const manual=c.draws===d.draws&&c.latest.hash===d.latest.hash;
    await page.getByRole('checkbox',{name:'减少入口动态'}).uncheck();
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);const e=active(await snap());await page.waitForTimeout(350);const f=active(await snap());
    const system=e.draws===f.draws;
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(350);const resumed=active(await snap()).draws>f.draws;
    await root.evaluate(e=>e.style.display='none');await page.waitForTimeout(150);const g=active(await snap());await page.waitForTimeout(350);const h=active(await snap());
    const empty=g.draws===h.draws;
    await root.evaluate(e=>e.style.display='');await page.waitForTimeout(200);
    await page.locator('.ds-orbit-entry-container').evaluate(e=>e.style.marginTop='2200px');await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);const j=active(await snap());await page.waitForTimeout(350);const k=active(await snap());
    const offscreen=j.draws===k.draws;
    await page.locator('.ds-orbit-entry-container').evaluate(e=>e.style.marginTop=''); await root.scrollIntoViewIfNeeded();await page.waitForTimeout(250);
    const other=await page.context().newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(250);
    const actualHidden=await page.evaluate(()=>document.hidden);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForTimeout(150);
    const hidden=await page.evaluate(()=>document.hidden);const l=active(await snap());await page.waitForTimeout(350);const m=active(await snap());
    const hiddenPause=hidden&&l.draws===m.draws;
    await other.close();await page.bringToFront();
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await page.getByRole('checkbox',{name:'挂载入口'}).uncheck();await page.waitForTimeout(150);const disposed=await snap();
    await page.waitForTimeout(350);const end=await snap();
    const cleanup=end.contexts.every(c=>!c.canvasConnected)&&end.pendingRafs===0&&JSON.stringify(end.contexts.map(c=>c.draws))===JSON.stringify(disposed.contexts.map(c=>c.draws))&&['ResizeObserver','IntersectionObserver','MutationObserver'].every(n=>end.orbitObservers[n]>0&&end.orbitObservers[n]===end.orbitDisconnects[n]);
    results.push({theme,playing,manual,system,resumed,empty,offscreen,actualHidden,hidden,hiddenPause,cleanup,pending:end.pendingRafs,observers:{created:end.observerCreates,disconnected:end.observerDisconnects,orbitCreated:end.orbitObservers,orbitDisconnected:end.orbitDisconnects},resources:end.contexts.map(c=>c.resources)});
  }
  const fallback=await page.context().newPage();
  await fallback.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=function(){return null;};});
  const fallbacks=[];
  for(const theme of ['rhine','arknights','neo-brutalism']) {
    await fallback.goto(`http://127.0.0.1:18484/?fixture=orbit-entry&theme=${theme}`);
    await fallback.waitForFunction(()=>document.querySelector('.rhine-orbit')?.dataset.rhineOrbitState==='unavailable');
    fallbacks.push(await fallback.locator('.rhine-orbit').evaluate(e=>{const c=getComputedStyle(e.querySelector('canvas')),p=getComputedStyle(e,'::after');return {theme:e.closest('[data-rhine-theme]').dataset.rhineTheme,pass:c.width===p.width&&c.height===p.height&&c.right===p.right&&c.bottom===p.bottom&&p.backgroundImage.includes('svg')};}));
  }
  await fallback.close();
  return {pass:results.every(r=>r.playing&&r.manual&&r.system&&r.resumed&&r.empty&&r.offscreen&&r.hiddenPause&&r.cleanup)&&fallbacks.every(r=>r.pass)&&!errors.length,results,fallbacks,errors};
}
