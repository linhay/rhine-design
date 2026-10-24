import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, Material, ShaderMaterial, Vector3, type Scene, type PerspectiveCamera, type Object3D, type Mesh, type Points, type Line } from 'three';
import { NeutronStarBackdrop } from '../components/NeutronStarBackdrop';
import { mountNeutron } from '../components/neutronRenderer';

const gpu = vi.hoisted(() => ({ instances: [] as Array<{
  domElement: HTMLCanvasElement; scene?: Scene; camera?: PerspectiveCamera; draws: number; time: number;
  dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn>;
}>, constructorFails: false, renderFails: false, materialFailsAt: 0, materialCount: 0 }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    ShaderMaterial: class extends actual.ShaderMaterial {
      constructor(parameters: ConstructorParameters<typeof actual.ShaderMaterial>[0]) {
        super(parameters);
        if (++gpu.materialCount === gpu.materialFailsAt) throw new Error('Shader initialization failed');
      }
    },
    WebGLRenderer: class {
      domElement = document.createElement('canvas');
      ratio = 1; draws = 0; time = 0;
      scene?: Scene; camera?: PerspectiveCamera;
      dispose = vi.fn(); forceContextLoss = vi.fn();
      constructor() { if (gpu.constructorFails) throw new Error('WebGL unavailable'); gpu.instances.push(this); }
      setClearColor() {}
      setPixelRatio(value: number) { this.ratio = value; }
      getPixelRatio() { return this.ratio; }
      setSize(width: number, height: number) { this.domElement.width = Math.round(width * this.ratio); this.domElement.height = Math.round(height * this.ratio); }
      render(scene: Scene, camera: PerspectiveCamera) {
        if (gpu.renderFails) throw new Error('GPU lost');
        this.scene = scene; this.camera = camera; this.draws++;
        scene.updateMatrixWorld(); camera.updateMatrixWorld();
        scene.traverse(object => { const value = (object as Mesh).material as ShaderMaterial; if (value?.uniforms?.time) this.time = value.uniforms.time.value; });
      }
    },
  };
});

class Media extends EventTarget {
  matches = false;
  set(value: boolean) { this.matches = value; this.dispatchEvent(new Event('change')); }
}

describe('NeutronStarBackdrop artwork and WebGL lifecycle', () => {
  let motion: Media, hidden: boolean, bounds: { width: number; height: number }, zoom: number;
  let frameId: number, frames: Map<number, FrameRequestCallback>;
  let resize: () => void, intersect: (visible: boolean) => void;
  let resizeDisconnect: () => void, intersectionDisconnect: () => void;
  let disposedGeometry: BufferGeometry[], disposedMaterial: Material[];
  beforeEach(() => {
    gpu.instances = []; gpu.constructorFails = gpu.renderFails = false; gpu.materialCount = gpu.materialFailsAt = 0;
    motion = new Media(); hidden = false; zoom = 1; bounds = { width: 880, height: 620 }; frames = new Map(); frameId = 0;
    disposedGeometry = []; disposedMaterial = [];
    resizeDisconnect = vi.fn(); intersectionDisconnect = vi.fn();
    vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(function (this: BufferGeometry) { disposedGeometry.push(this); });
    vi.spyOn(Material.prototype, 'dispose').mockImplementation(function (this: Material) { disposedMaterial.push(this); });
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.spyOn(HTMLDivElement.prototype, 'clientWidth', 'get').mockImplementation(() => bounds.width);
    vi.spyOn(HTMLDivElement.prototype, 'clientHeight', 'get').mockImplementation(() => bounds.height);
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: bounds.width * zoom, height: bounds.height * zoom, x: 0, y: 0, top: 0, left: 0, right: bounds.width * zoom, bottom: bounds.height * zoom, toJSON() {} }));
    vi.stubGlobal('WebGL2RenderingContext', function () {});
    vi.stubGlobal('matchMedia', () => motion);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++frameId; frames.set(id, callback); return id; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() { resizeDisconnect(); } });
    vi.stubGlobal('IntersectionObserver', class {
      constructor(private callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {}
      observe(target: Element) { intersect = value => this.callback([{ target, isIntersecting: value }]); }
      disconnect() { intersectionDisconnect(); }
    });
  });
  afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-rhine-motion'); document.documentElement.removeAttribute('data-rhine-theme'); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  function advance(now: number) {
    act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); });
  }
  function mount(options: Parameters<typeof mountNeutron>[2] = {}) {
    const host = document.createElement('div'); document.body.append(host);
    const state = vi.fn(); const scene = mountNeutron(host, state, options);
    return { scene, host, state, remove() { scene.dispose(); host.remove(); } };
  }
  async function ready() { await waitFor(() => expect(gpu.instances.length).toBe(1)); }

  it('renders static server markup without browser globals or constructing a renderer', () => {
    vi.stubGlobal('window', undefined);
    const html = renderToString(<NeutronStarBackdrop><p>Readable immediately</p></NeutronStarBackdrop>);
    expect(html).toContain('rhine-neutron-fallback'); expect(html).toContain('Readable immediately');
    expect(gpu.instances).toHaveLength(0);
  });

  it('retains the star, 28 field lines, 560 streams, 700 dust points and the 28-second orbit', () => {
    const view = mount({ appearance: 'original' }); const instance = gpu.instances[0];
    const objects: Object3D[] = []; instance.scene!.traverse(value => objects.push(value));
    expect(objects.filter(object => object.type === 'Line')).toHaveLength(28);
    expect(objects.filter(object => object.type === 'Points').map(object => (object as Points).geometry.attributes.position.count)).toEqual([560, 700]);
    expect(objects.filter(object => object.type === 'Mesh')).toHaveLength(7);
    const orbit = instance.scene!.children[0]; const initial = orbit.position.toArray();
    advance(0); for (let ms = 50; ms <= 14000; ms += 50) advance(ms);
    expect(instance.time).toBeCloseTo(14, 6); expect(orbit.position.z).toBeCloseTo(-1.35, 6);
    for (let ms = 14050; ms <= 28000; ms += 50) advance(ms);
    expect(instance.time).toBeCloseTo(28, 6);
    expect(orbit.position.x).toBeCloseTo(initial[0], 6); expect(orbit.position.z).toBeCloseTo(initial[2], 6);
    view.remove();
  });

  it('keeps inner and outer stream particles on their corresponding magnetic field lines', () => {
    const view = mount();
    const objects: Object3D[] = []; gpu.instances[0].scene!.traverse(value => objects.push(value));
    const lines = objects.filter(object => object.type === 'Line') as Line[];
    const streams = objects.find(object => object.type === 'Points' && (object as Points).geometry.attributes.position.count === 560) as Points;
    const seeds = streams.geometry.attributes.position;
    const errors = [0, 2, 14, 280, 282, 294].map(index => {
      // At time zero, these seeds coincide with sampled vertices on the dipole curves.
      const theta = .24 + seeds.getY(index) * 2.66159;
      const azimuth = seeds.getX(index) * 6.28318;
      const radius = seeds.getZ(index) * Math.sin(theta) ** 2;
      const particle = new Vector3(radius * Math.sin(theta) * Math.cos(azimuth), radius * Math.cos(theta), radius * Math.sin(theta) * Math.sin(azimuth));
      const line = lines[index % 14 + (index < 280 ? 0 : 14)].geometry.attributes.position;
      const fieldPoint = new Vector3().fromBufferAttribute(line, Math.round(seeds.getY(index) * 100));
      return particle.distanceTo(fieldPoint);
    });
    view.remove();
    errors.forEach(error => expect(error).toBeLessThan(.00001));
  });

  it('does not cull shader-generated streams with bounds that exclude their field lines', () => {
    const view = mount();
    const objects: Object3D[] = []; gpu.instances[0].scene!.traverse(value => objects.push(value));
    const streams = objects.find(object => object.type === 'Points' && (object as Points).geometry.attributes.position.count === 560) as Points;
    streams.geometry.computeBoundingSphere();
    const bound = streams.geometry.boundingSphere!;
    const coversField = objects.filter(object => object.type === 'Line').every(object => {
      const positions = (object as Line).geometry.attributes.position;
      return Array.from({ length: positions.count }, (_, index) => new Vector3().fromBufferAttribute(positions, index))
        .every(point => bound.containsPoint(point));
    });
    const safelyVisible = !streams.frustumCulled || coversField;
    view.remove();
    expect(safelyVisible).toBe(true);
  });

  it('uses layout pixels at 200% CSS zoom, caps DPR, and redraws a paused resize without advancing time', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const view = mount(); const instance = gpu.instances[0];
    expect(instance.domElement.width).toBe(1320); expect(instance.domElement.height).toBe(930);
    advance(100); advance(200); view.scene.setPaused(true);
    const frozen = instance.time; zoom = 2; resize();
    expect(instance.domElement.width).toBe(1320); expect(instance.camera!.aspect).toBeCloseTo(880 / 620);
    bounds.width = 400; resize(); expect(instance.domElement.width).toBe(600); expect(instance.time).toBe(frozen); expect(frames.size).toBe(0);
    view.remove();
  });

  it.each([[400, 1008], [400, 620], [160, 620], [880, 740]])('keeps the complete core in view throughout its orbit at %s × %s', (width, height) => {
    bounds = { width, height };
    const view = mount({ appearance: 'original' }); const instance = gpu.instances[0];
    let core!: Mesh;
    instance.scene!.traverse(object => { if ((object as Mesh).geometry?.type === 'SphereGeometry') core ??= object as Mesh; });
    function checkCore() {
      const points = core.geometry.attributes.position, point = new Vector3();
      for (let i = 0; i < points.count; i++) {
        point.fromBufferAttribute(points, i).applyMatrix4(core.matrixWorld).project(instance.camera!);
        expect(Math.abs(point.x)).toBeLessThan(.95); expect(Math.abs(point.y)).toBeLessThan(.95);
      }
    }
    advance(0); checkCore();
    for (let ms = 50; ms <= 28000; ms += 50) { advance(ms); if (ms % 3500 === 0) checkCore(); }
    expect(instance.time).toBeCloseTo(28, 6); view.remove();
  });

  it('pauses and resumes the same scene without catching up or replacing entered content', async () => {
    const { container } = render(<NeutronStarBackdrop><input aria-label="草稿" defaultValue="保留" /></NeutronStarBackdrop>); await ready();
    const instance = gpu.instances[0], canvas = container.querySelector('canvas');
    fireEvent.change(screen.getByLabelText('草稿'), { target: { value: '已修改' } });
    advance(100); advance(200); const frozen = instance.time;
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' })); expect(frames.size).toBe(0);
    expect(container.firstChild).toHaveAttribute('data-rhine-neutron-state', 'paused');
    advance(9000); expect(instance.time).toBe(frozen);
    fireEvent.click(screen.getByRole('button', { name: '继续动效' })); advance(10000); expect(instance.time).toBe(frozen);
    advance(10100); expect(instance.time).toBeGreaterThan(frozen);
    expect(container.querySelector('canvas')).toBe(canvas); expect(screen.getByLabelText('草稿')).toHaveValue('已修改');
  });

  it('honors initial and changing system, explicit and ancestor reduced motion', async () => {
    motion.matches = true;
    const { container, rerender } = render(<div data-rhine-motion="system"><NeutronStarBackdrop reducedMotion={false} /></div>); await ready();
    expect(frames.size).toBe(0); expect(screen.getByRole('button', { name: '已减少动态' })).toBeDisabled();
    act(() => motion.set(false)); expect(frames.size).toBe(1);
    rerender(<div data-rhine-motion="system"><NeutronStarBackdrop reducedMotion /></div>); expect(frames.size).toBe(0);
    rerender(<div data-rhine-motion="system"><NeutronStarBackdrop reducedMotion={false} /></div>); expect(frames.size).toBe(1);
    await act(async () => { document.documentElement.setAttribute('data-rhine-motion', 'reduced'); }); expect(frames.size).toBe(0);
    await act(async () => { document.documentElement.removeAttribute('data-rhine-motion'); }); expect(frames.size).toBe(1);
    advance(100); advance(200); const frozen = gpu.instances[0].time;
    motion.matches = true; advance(300);
    expect(container.querySelector('.rhine-neutron')).toHaveAttribute('data-rhine-neutron-state', 'reduced');
    expect(frames.size).toBe(0); expect(gpu.instances[0].time).toBe(frozen);
    act(() => motion.set(false)); advance(9000); expect(gpu.instances[0].time).toBe(frozen);
  });

  it('stops when hidden, offscreen or zero sized, including delayed callbacks after disposal', () => {
    const view = mount(); const instance = gpu.instances[0];
    hidden = true; document.dispatchEvent(new Event('visibilitychange')); expect(frames.size).toBe(0); expect(view.state).toHaveBeenLastCalledWith('hidden');
    hidden = false; document.dispatchEvent(new Event('visibilitychange')); expect(frames.size).toBe(1);
    intersect(false); expect(frames.size).toBe(0); expect(view.state).toHaveBeenLastCalledWith('offscreen');
    intersect(true); expect(frames.size).toBe(1);
    bounds.width = 0; resize(); expect(frames.size).toBe(0); expect(view.state).toHaveBeenLastCalledWith('empty');
    bounds.width = 400; resize(); expect(frames.size).toBe(1);
    view.remove(); const finalDraws = instance.draws; resize(); intersect(true); advance(10000);
    expect(instance.draws).toBe(finalDraws); expect(frames.size).toBe(0);
  });

  it('updates theme and original uniforms in place, preserving frozen time and pause', async () => {
    const view = mount(); const instance = gpu.instances[0]; advance(100); advance(200); view.scene.setPaused(true);
    let core!: Mesh<BufferGeometry, ShaderMaterial>;
    instance.scene!.traverse(object => { if ((object as Mesh).material instanceof ShaderMaterial && ((object as Mesh).material as ShaderMaterial).uniforms.cool) core ??= object as Mesh<BufferGeometry, ShaderMaterial>; });
    const time = instance.time, initial = core.material.uniforms.cool.value.clone();
    view.scene.setAppearance('original'); expect(instance.time).toBe(time); expect(frames.size).toBe(0);
    expect(core.material.uniforms.cool.value.toArray()).toEqual([.12, .38, .8]);
    view.scene.setAppearance('theme'); expect(core.material.uniforms.cool.value).toEqual(initial);
    const actualComputed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
      const css = actualComputed(element); const get = css.getPropertyValue.bind(css);
      css.getPropertyValue = token => token === '--rhine-green' ? '#ff8811' : get(token); return css;
    });
    await act(async () => { document.documentElement.setAttribute('data-rhine-theme', 'neo-brutalism'); });
    expect(core.material.uniforms.cool.value).not.toEqual(initial); expect(instance.time).toBe(time);
    expect(gpu.instances).toHaveLength(1); expect(view.state).toHaveBeenLastCalledWith('paused');
    view.remove();
  });

  it('uses the static fallback on context loss and restores the same frozen scene', () => {
    const view = mount(); const instance = gpu.instances[0]; advance(100); advance(200); const frozen = instance.time;
    const lost = new Event('webglcontextlost', { cancelable: true }); instance.domElement.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true); expect(frames.size).toBe(0); expect(view.state).toHaveBeenLastCalledWith('unavailable');
    expect(view.host).not.toHaveAttribute('data-rhine-neutron-rendered');
    instance.domElement.dispatchEvent(new Event('webglcontextrestored'));
    expect(view.state).toHaveBeenLastCalledWith('playing'); expect(view.host).toHaveAttribute('data-rhine-neutron-rendered', 'true');
    advance(9000); expect(instance.time).toBe(frozen); advance(9100); expect(instance.time).toBeGreaterThan(frozen);
    expect(gpu.instances).toHaveLength(1); view.remove();
  });

  it('disposes every unique geometry, shared material, renderer, observer and listener exactly once', () => {
    const removeDocument = vi.spyOn(document, 'removeEventListener'), removeWindow = vi.spyOn(window, 'removeEventListener');
    const removeMedia = vi.spyOn(motion, 'removeEventListener');
    const mutationDisconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const view = mount(); const instance = gpu.instances[0]; const removeCanvas = vi.spyOn(instance.domElement, 'removeEventListener');
    view.remove(); view.scene.dispose();
    expect(disposedGeometry).toHaveLength(37); expect(new Set(disposedGeometry).size).toBe(37);
    expect(disposedMaterial).toHaveLength(34); expect(new Set(disposedMaterial).size).toBe(34);
    expect(instance.dispose).toHaveBeenCalledTimes(1); expect(instance.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(resizeDisconnect).toHaveBeenCalledTimes(1); expect(intersectionDisconnect).toHaveBeenCalledTimes(1);
    expect(mutationDisconnect).toHaveBeenCalledOnce();
    expect(removeDocument).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWindow).toHaveBeenCalledWith('resize', expect.any(Function)); expect(removeMedia).toHaveBeenCalledWith('change', expect.any(Function));
    expect(removeCanvas).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
    expect(removeCanvas).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
    expect(instance.domElement.isConnected).toBe(false); expect(frames.size).toBe(0);
  });

  it('cleans partial initialization allocations and falls back after a renderer error', () => {
    gpu.materialFailsAt = 3; const partial = mount();
    expect(partial.state).toHaveBeenLastCalledWith('unavailable'); expect(disposedGeometry).toHaveLength(3); expect(disposedMaterial).toHaveLength(2);
    expect(gpu.instances[0].dispose).toHaveBeenCalledOnce(); expect(partial.host.querySelector('canvas')).toBeNull(); partial.remove();
    gpu.materialFailsAt = 0; const view = mount(); gpu.renderFails = true; advance(100); advance(200);
    expect(view.state).toHaveBeenLastCalledWith('unavailable'); expect(view.host.querySelector('canvas')).toBeNull(); expect(frames.size).toBe(0);
    expect(resizeDisconnect).toHaveBeenCalledOnce(); view.remove();
  });

  it('keeps content usable when WebGL is unsupported or context construction fails', async () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const first = render(<NeutronStarBackdrop><button>继续工作</button></NeutronStarBackdrop>);
    expect(first.container.firstChild).toHaveAttribute('data-rhine-neutron-state', 'unavailable'); expect(screen.getByRole('button', { name: '继续工作' })).toBeEnabled();
    expect(gpu.instances).toHaveLength(0); first.unmount();
    vi.stubGlobal('WebGL2RenderingContext', function () {}); gpu.constructorFails = true;
    const second = render(<NeutronStarBackdrop><button>继续工作</button></NeutronStarBackdrop>);
    await waitFor(() => expect(second.container.firstChild).toHaveAttribute('data-rhine-neutron-state', 'unavailable'));
    expect(screen.getByRole('button', { name: '静态画面' })).toBeDisabled(); expect(frames.size).toBe(0);
  });

  it('does not mount a late import after unmount, including Strict Mode effect replay', async () => {
    const first = render(<NeutronStarBackdrop />); first.unmount();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); expect(gpu.instances).toHaveLength(0);
    const second = render(<StrictMode><NeutronStarBackdrop /></StrictMode>); await ready();
    expect(frames.size).toBe(1); second.unmount(); expect(frames.size).toBe(0); expect(gpu.instances[0].dispose).toHaveBeenCalledOnce();
  });
});
