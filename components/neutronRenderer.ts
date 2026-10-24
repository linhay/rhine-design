import {
  AdditiveBlending, NormalBlending, BufferGeometry, Color, DoubleSide, Group, Line,
  LineBasicMaterial, Mesh, PerspectiveCamera, PlaneGeometry,
  Scene, ShaderMaterial, SphereGeometry, Vector3, WebGLRenderer, Points, Float32BufferAttribute, Material,
} from 'three';

export type NeutronState = 'loading' | 'playing' | 'paused' | 'reduced' | 'hidden' | 'offscreen' | 'empty' | 'unavailable';
type Appearance = 'theme' | 'original';
interface NeutronOptions { paused?: boolean; reducedMotion?: boolean; appearance?: Appearance }
export interface NeutronRenderer {
  setPaused(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setAppearance(value: Appearance): void;
  dispose(): void;
}

/** The scene advances only by elapsed visible frames; no timer encodes business state. */
export function mountNeutron(host: HTMLDivElement, onState: (state: NeutronState) => void, options: NeutronOptions = {}): NeutronRenderer {
  const cleanups: Array<() => void> = [];
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
  const geometry = <T extends BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const material = <T extends Material>(value: T): T => { materials.add(value); return value; };
  let renderer: WebGLRenderer | undefined;
  let released = false;
  function release() {
    if (released) return;
    released = true;
    geometries.forEach(value => value.dispose());
    materials.forEach(value => value.dispose());
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
    host.removeAttribute('data-rhine-neutron-rendered');
  }
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    const gl = renderer;
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, 1, .1, 40);
    camera.position.set(0, .5, 7.8);
    camera.lookAt(0, 0, 0);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    host.appendChild(renderer.domElement);
    renderer.domElement.className = 'rhine-neutron-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const star = new Group();
    star.position.set(.85, .65, 0);
    star.scale.setScalar(1.5);
    star.rotation.z = -.48;
    scene.add(star);
    const time = { value: 0 };
    const core = new Mesh(geometry(new SphereGeometry(.34, 64, 40)), material(new ShaderMaterial({
      uniforms: { time, cool: { value: new Color().setRGB(.12,.38,.8) }, hot: { value: new Color().setRGB(.86,.97,1) }, edge: { value: new Color().setRGB(.16,.47,.94) } },
      vertexShader: `varying vec3 surface; varying vec3 normalView; varying vec3 viewDirection;
        void main(){ surface=position; vec4 mv=modelViewMatrix*vec4(position,1.);
          normalView=normalize(normalMatrix*normal); viewDirection=normalize(-mv.xyz);
          gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float time; uniform vec3 cool; uniform vec3 hot; uniform vec3 edge; varying vec3 surface; varying vec3 normalView; varying vec3 viewDirection;
        void main(){vec3 p=normalize(surface); float flow=sin(p.x*28.+sin(p.y*19.+time*.5)*2.+p.z*14.-time*.7);
          float grain=sin(p.y*47.+sin(p.z*31.-time*.3))*sin(p.x*39.+time*.2);
          float facing=max(dot(normalize(normalView),normalize(viewDirection)),0.);
          float heat=smoothstep(-.35,.9,flow+grain*.35);
          vec3 color=mix(cool,hot,heat);
          color=mix(edge,color,pow(facing,.45));
          gl_FragColor=vec4(color,1.); }`,
    })));
    star.add(core);

    // A camera-facing halo avoids an expensive full-screen bloom pass.
    const halo = new Mesh(geometry(new PlaneGeometry(2.3, 2.3)), material(new ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { tint: { value: new Color('#4c9aff') } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; uniform vec3 tint; void main(){float d=length(vUv-.5)*2.;float a=exp(-d*d*7.)*.65*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(tint,a);}',
    })));
    halo.quaternion.copy(camera.quaternion);
    halo.position.copy(star.position);
    halo.scale.setScalar(1.5);
    scene.add(halo);
    const corona = new Mesh(geometry(new SphereGeometry(.39, 48, 32)), material(new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { time, tint: { value: new Color().setRGB(.25,.6,1) } },
      vertexShader: `varying vec3 n; varying vec3 eye; void main(){vec4 mv=modelViewMatrix*vec4(position,1.);
        n=normalize(normalMatrix*normal); eye=normalize(-mv.xyz); gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float time; uniform vec3 tint; varying vec3 n; varying vec3 eye; void main(){
        float rim=pow(1.-max(dot(normalize(n),normalize(eye)),0.),2.5);
        gl_FragColor=vec4(tint,rim*(.45+.05*sin(time*.8)));}`,
    })));
    star.add(corona);
    for (let i = 0; i < 28; i++) {
      const azimuth = (i % 14) * Math.PI * 2 / 14 + Math.floor(i / 14) * .15;
      const extent = i < 14 ? 1.1 : 1.65;
      const points = [];
      for (let j = 0; j <= 100; j++) {
        const theta = .24 + (Math.PI - .48) * j / 100;
        const radius = extent * Math.sin(theta) ** 2;
        points.push(new Vector3(radius * Math.sin(theta) * Math.cos(azimuth), radius * Math.cos(theta), radius * Math.sin(theta) * Math.sin(azimuth)));
      }
      star.add(new Line(geometry(new BufferGeometry().setFromPoints(points)), material(new LineBasicMaterial({ color: i < 14 ? 0x6bdafa : 0x8976ed, transparent: true, opacity: i < 14 ? .34 : .16 }))));
    }
    const beamMaterial = material(new ShaderMaterial({
      transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
      uniforms: { time, cool: { value: new Color().setRGB(.24,.48,1) }, hot: { value: new Color().setRGB(.65,.93,1) } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float time; uniform vec3 cool; uniform vec3 hot; varying vec2 vUv; void main(){float width=mix(.07,.45,vUv.y);
        float spine=exp(-pow((vUv.x-.5)/.035,2.)*3.);
        float cloud=exp(-pow((vUv.x-.5)/width,2.)*4.);
        float wave=.8+.2*sin(vUv.y*42.-time*2.);
        float a=(cloud*wave+spine*.45)*pow(1.-vUv.y,1.7);
        gl_FragColor=vec4(mix(cool,hot,spine),a*.65);}`,
    }));
    for (const sign of [-1, 1]) {
      for (const angle of [0, Math.PI / 2]) {
        const beam = new Mesh(geometry(new PlaneGeometry(.75, 1.7)), beamMaterial);
        beam.position.y = sign * 1.03;
        beam.rotation.y = angle;
        if (sign < 0) beam.rotation.z = Math.PI;
        star.add(beam);
      }
    }
    // Stream points follow the same dipole curves as the magnetic field lines.
    const streamsGeometry = geometry(new BufferGeometry());
    const seeds = [];
    for (let i = 0; i < 560; i++) seeds.push((i % 14) / 14, (i % 40) / 40, i < 280 ? 1.1 : 1.65);
    streamsGeometry.setAttribute('position', new Float32BufferAttribute(seeds, 3));
    const streams = new Points(streamsGeometry, material(new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { time, pixelRatio: { value: renderer.getPixelRatio() }, tint: { value: new Color().setRGB(.42,.8,1) } },
      vertexShader: `uniform float time; uniform float pixelRatio; varying float alpha;
        void main(){float progress=fract(position.y+time*.065); float theta=.24+progress*2.66159;
          float azimuth=position.x*6.28318; float r=position.z*sin(theta)*sin(theta);
          vec3 p=vec3(r*sin(theta)*cos(azimuth),r*cos(theta),r*sin(theta)*sin(azimuth));
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
          gl_PointSize=pixelRatio*2.8*(6./-mv.z); alpha=sin(progress*3.14159)*.7; }`,
      fragmentShader: `uniform vec3 tint; varying float alpha; void main(){float d=length(gl_PointCoord-.5)*2.;
        gl_FragColor=vec4(tint,(1.-smoothstep(.1,1.,d))*alpha);}`,
    })));
    star.add(streams);
    const particleGeometry = geometry(new BufferGeometry());
    const positions = [];
    const sizes = [];
    const phases = [];
    for (let i = 0; i < 700; i++) {
      const angle = i * 2.399963;
      const radius = .65 + Math.sqrt((i % 421) / 421) * 2.6;
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius * .48, Math.sin(i * 1.71) * 1.2);
      sizes.push(1.2 + (i % 7) * .3);
      phases.push(i * .73);
    }
    particleGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('phase', new Float32BufferAttribute(phases, 1));
    const particleMaterial = material(new ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { time, pixelRatio: { value: renderer.getPixelRatio() }, tint: { value: new Color().setRGB(.18,.46,.78) } },
      vertexShader: `attribute float size; attribute float phase; uniform float time; uniform float pixelRatio; varying float opacity;
        void main(){ vec3 p=position; float a=time*.065; p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;
          p.y+=sin(time*.4+phase)*.08; vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv; gl_PointSize=size*pixelRatio*(6./-mv.z); opacity=.35+.25*sin(phase+time*.6); }`,
      fragmentShader: `uniform vec3 tint; varying float opacity; void main(){float d=length(gl_PointCoord-.5)*2.;
        gl_FragColor=vec4(tint,(1.-smoothstep(.2,1.,d))*opacity);}`,
    }));
    const particles = new Points(particleGeometry, particleMaterial);
    particles.position.copy(star.position);
    particles.rotation.z = -.28;
    scene.add(particles);
    const orbit = new Group();
    scene.add(orbit);
    orbit.add(star, halo, particles);
    const updateOrbit = () => {
      const phase = time.value * Math.PI * 2 / 28;
      // Translate the whole system in depth; perspective supplies the size change.
      orbit.position.set(.75 * Math.sin(phase), .2 * Math.sin(phase + .6), 1.35 * Math.cos(phase));
    };
    updateOrbit();
    let frame = 0, last: number | null = null, width = 0, height = 0;
    let bitmapWidth = 0, bitmapHeight = 0, pixelRatio = 0;
    let paused = options.paused ?? false, manualReduced = options.reducedMotion ?? false;
    let appearance = options.appearance ?? 'theme';
    let disposed = false, failed = false, lost = false, visible = true;
    let previousState: NeutronState | undefined;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    function announce(next: NeutronState) {
      if (next !== previousState) { previousState = next; onState(next); }
    }
    function state(): NeutronState {
      if (failed || lost) return 'unavailable';
      if (manualReduced || motion?.matches || host.closest('[data-rhine-motion="reduced"]')) return 'reduced';
      if (document.hidden) return 'hidden';
      if (!visible) return 'offscreen';
      if (width <= 0 || height <= 0) return 'empty';
      return paused ? 'paused' : 'playing';
    }
    function stop() { cancelAnimationFrame(frame); frame = 0; last = null; }
    function render() {
      if (failed || lost || !width || !height) return;
      try {
        gl.render(scene, camera);
        host.setAttribute('data-rhine-neutron-rendered', 'true');
      } catch {
        failed = true; stop();
        cleanups.splice(0).forEach(cleanup => cleanup());
        release(); announce('unavailable');
      }
    }
    function palette() {
      const css = getComputedStyle(host);
      const read = (token: string, fallback: string) => new Color(css.getPropertyValue(token).trim() || fallback);
      const original = appearance === 'original';
      const primary = read('--rhine-green', '#425c4b'), secondary = read('--rhine-signal', '#c65c34');
      const bright = primary.clone().lerp(new Color('#ffffff'), .7);
      core.material.uniforms.cool.value.copy(original ? new Color().setRGB(.12,.38,.8) : primary);
      core.material.uniforms.hot.value.copy(original ? new Color().setRGB(.86,.97,1) : bright);
      core.material.uniforms.edge.value.copy(original ? new Color().setRGB(.16,.47,.94) : secondary);
      halo.material.uniforms.tint.value.copy(original ? new Color('#4c9aff') : primary);
      corona.material.uniforms.tint.value.copy(original ? new Color().setRGB(.25,.6,1) : primary);
      beamMaterial.uniforms.cool.value.copy(original ? new Color().setRGB(.24,.48,1) : secondary);
      beamMaterial.uniforms.hot.value.copy(original ? new Color().setRGB(.65,.93,1) : bright);
      streams.material.uniforms.tint.value.copy(original ? new Color().setRGB(.42,.8,1) : primary);
      particleMaterial.uniforms.tint.value.copy(original ? new Color().setRGB(.18,.46,.78) : read('--rhine-ink', '#242b28'));
      let line = 0;
      for (const child of star.children) if (child instanceof Line) {
        const inner = line++ < 14;
        child.material.color.copy(original ? new Color(inner ? 0x6bdafa : 0x8976ed) : inner ? primary : secondary);
        child.material.opacity = original ? inner ? .34 : .16 : inner ? .5 : .3;
      }
      for (const value of [corona.material, beamMaterial, streams.material]) {
        value.blending = original ? AdditiveBlending : NormalBlending;
      }
    }
    function resize() {
      // Layout pixels exclude CSS zoom; the bitmap and camera must not grow twice.
      width = host.clientWidth; height = host.clientHeight;
      if (!width || !height || failed || lost) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      if (width !== bitmapWidth || height !== bitmapHeight || ratio !== pixelRatio) {
        if (ratio !== pixelRatio) gl.setPixelRatio(ratio);
        streams.material.uniforms.pixelRatio.value = particleMaterial.uniforms.pixelRatio.value = ratio;
        camera.aspect = width / height;
        // A tall page must not crop the core's orbit: fit the camera, not the artwork geometry.
        camera.position.x = .85 * Math.min(1, Math.max(0, (1.2 - camera.aspect) / .3));
        camera.lookAt(camera.position.x, 0, 0);
        camera.zoom = Math.min(1, camera.aspect / .95);
        camera.updateProjectionMatrix();
        halo.quaternion.copy(camera.quaternion);
        gl.setSize(width, height, false);
        bitmapWidth = width; bitmapHeight = height; pixelRatio = ratio;
      }
    }
    function tick(now: number) {
      frame = 0;
      if (disposed || failed) return;
      // Media preferences can change before their corresponding event is dispatched.
      if (state() !== 'playing') { sync(); return; }
      if (last === null) last = now;
      if (now - last >= 1000 / 30) {
        const delta = Math.min((now - last) / 1000, .05);
        last = now;
        time.value += delta;
        star.rotation.y += delta * .45;
        updateOrbit();
        render();
      }
      if (!failed) frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (disposed || failed) return;
      stop(); resize(); render();
      const next = state(); announce(next);
      if (next === 'playing') frame = requestAnimationFrame(tick);
    }
    function refreshTheme() { if (!disposed && !failed) { palette(); sync(); } }
    function contextLost(event: Event) {
      event.preventDefault(); lost = true;
      host.removeAttribute('data-rhine-neutron-rendered'); sync();
    }
    function contextRestored() {
      if (!disposed && !failed) { lost = false; bitmapWidth = bitmapHeight = pixelRatio = 0; refreshTheme(); }
    }
    gl.domElement.addEventListener('webglcontextlost', contextLost);
    gl.domElement.addEventListener('webglcontextrestored', contextRestored);
    cleanups.push(() => {
      gl.domElement.removeEventListener('webglcontextlost', contextLost);
      gl.domElement.removeEventListener('webglcontextrestored', contextRestored);
    });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    if (observer) { cleanups.push(() => observer.disconnect()); observer.observe(host); }
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      const entry = entries.find(value => value.target === host);
      if (entry) { visible = entry.isIntersecting; sync(); }
    });
    if (intersection) { cleanups.push(() => intersection.disconnect()); intersection.observe(host); }
    const preferences = new MutationObserver(refreshTheme);
    cleanups.push(() => preferences.disconnect());
    // Watch ancestors, not canvas attributes or our own state notifications.
    for (let ancestor = host.parentElement; ancestor; ancestor = ancestor.parentElement) {
      preferences.observe(ancestor, { attributes: true, attributeFilter: ['data-rhine-theme', 'data-rhine-motion', 'class', 'style'] });
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', sync);
    motion?.addEventListener?.('change', sync);
    cleanups.push(() => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', sync);
      motion?.removeEventListener?.('change', sync);
    });
    palette(); sync();
    return {
      setPaused(value) { if (paused !== value) { paused = value; sync(); } },
      setReducedMotion(value) { if (manualReduced !== value) { manualReduced = value; sync(); } },
      setAppearance(value) { if (appearance !== value) { appearance = value; refreshTheme(); } },
      dispose() {
        if (disposed) return;
        disposed = true; stop();
        cleanups.splice(0).forEach(cleanup => cleanup());
        release();
      },
    };
  } catch {
    cleanups.splice(0).forEach(cleanup => cleanup());
    release(); onState('unavailable');
    return { setPaused() {}, setReducedMotion() {}, setAppearance() {}, dispose() {} };
  }
}
