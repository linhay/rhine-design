import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, InstancedMesh, Material, Texture, type Mesh, type PerspectiveCamera, type Points, type Scene, type ShaderMaterial } from 'three';
import { createOrbitObject, type OrbitObjectKind } from '../components/orbitObjectsThree';

const gpu = vi.hoisted(() => ({ renderers: [] as Array<{
  scene?: Scene; camera?: PerspectiveCamera; dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn>;
}> }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    ratio = 1; scene?: Scene; camera?: PerspectiveCamera;
    dispose = vi.fn(); forceContextLoss = vi.fn();
    constructor(private options: { canvas: HTMLCanvasElement }) { gpu.renderers.push(this); }
    setClearColor() {} setPixelRatio(value: number) { this.ratio = value; }
    setSize(width: number, height: number) { this.options.canvas.width = Math.round(width * this.ratio); this.options.canvas.height = Math.round(height * this.ratio); }
    render(scene: Scene, camera: PerspectiveCamera) { this.scene = scene; this.camera = camera; scene.updateMatrixWorld(); camera.updateMatrixWorld(); }
  } };
});

describe.each<OrbitObjectKind>(['paper', 'technical'])('Three.js %s object', kind => {
  beforeEach(() => {
    gpu.renderers = []; vi.stubGlobal('requestAnimationFrame', vi.fn()); vi.stubGlobal('devicePixelRatio', 3);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, fillText() {} } as unknown as CanvasRenderingContext2D);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('animates the object and particles deterministically from the host clock, including after resize', () => {
    const art = createOrbitObject(kind, vi.fn());
    expect(art.draw(0, 620, 1)).toBe(false);
    art.draw(400, 620, 1);
    expect(art.canvas.width).toBe(600); expect(art.canvas.height).toBe(930);
    const scene = gpu.renderers[0].scene!, lab = kind === 'paper';
    expect(scene.name).toBe(lab ? 'glass-culture-chamber' : 'originium-cluster');
    const particles = scene.getObjectByName(lab ? 'culture-bubbles' : 'floating-fragments') as InstancedMesh;
    const dust = scene.getObjectByName(lab ? 'culture-motes' : 'crystal-embers') as Points<BufferGeometry, ShaderMaterial>;
    const capture = () => ({ object: scene.getObjectByName('theme-object')!.matrixWorld.toArray(), particles: [...particles.instanceMatrix.array], time: dust.material.uniforms.time.value });
    const frozen = capture(); art.draw(400, 620, 1); expect(capture()).toEqual(frozen);
    art.draw(880, 526, 1); expect(capture()).toEqual(frozen);
    art.draw(880, 526, 2); expect(capture().object).not.toEqual(frozen.object); expect(capture().particles).not.toEqual(frozen.particles);
    expect(capture().time).toBe(2);
    if (lab) {
      const wall = scene.getObjectByName('glass-wall') as Mesh;
      expect((wall.material as Material).transparent).toBe(true);
      expect((scene.getObjectByName('culture-cells') as InstancedMesh).count).toBeGreaterThan(40);
      expect(scene.getObjectByName('chamber-graduations')).toBeDefined();
    } else {
      for (let i = 0; i < 5; i++) expect(scene.getObjectByName(`originium-facet-${i}`)).toBeDefined();
      expect(scene.getObjectByName('containment-ring')).toBeDefined();
    }
    expect(requestAnimationFrame).not.toHaveBeenCalled(); art.dispose();
  });

  it('recovers a frozen context and releases every owned resource exactly once', () => {
    const geometrySpy = vi.spyOn(BufferGeometry.prototype, 'dispose'), materialSpy = vi.spyOn(Material.prototype, 'dispose');
    const instanceSpy = vi.spyOn(InstancedMesh.prototype, 'dispose'), textureSpy = vi.spyOn(Texture.prototype, 'dispose'), invalidate = vi.fn();
    const art = createOrbitObject(kind, invalidate); document.body.append(art.canvas); art.draw(880, 526, 3);
    const renderer = gpu.renderers[0], geometries = new Set(), materials = new Set(), instances = new Set();
    renderer.scene!.traverse(node => {
      const mesh = node as Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m);
      if (node instanceof InstancedMesh) instances.add(node);
    });
    const lost = new Event('webglcontextlost', { cancelable: true }); art.canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true); expect(art.draw(880, 526, 8)).toBe(false);
    art.canvas.dispatchEvent(new Event('webglcontextrestored')); expect(invalidate).toHaveBeenCalledTimes(2);
    expect(art.draw(880, 526, 3)).toBe(true);
    art.dispose(); art.dispose();
    // Allocated but unused shared materials must also be released.
    expect(new Set(geometrySpy.mock.contexts)).toEqual(geometries);
    expect(geometrySpy).toHaveBeenCalledTimes(geometries.size);
    expect(materialSpy.mock.contexts).toEqual(expect.arrayContaining([...materials]));
    expect(new Set(materialSpy.mock.contexts).size).toBe(materialSpy.mock.calls.length);
    expect(new Set(instanceSpy.mock.contexts)).toEqual(instances); expect(instanceSpy).toHaveBeenCalledTimes(instances.size);
    expect(textureSpy).toHaveBeenCalledTimes(kind === 'paper' ? 3 : 1);
    expect(new Set(textureSpy.mock.contexts).size).toBe(textureSpy.mock.calls.length);
    expect(renderer.dispose).toHaveBeenCalledOnce(); expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(art.canvas.isConnected).toBe(false); expect(art.draw(400, 620, 4)).toBe(false);
    art.canvas.dispatchEvent(new Event('webglcontextrestored')); expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('releases partial allocations if object construction fails', () => {
    const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose');
    vi.spyOn(InstancedMesh.prototype, 'setMatrixAt').mockImplementationOnce(() => { throw new Error('Synthetic setup failure'); });
    if (kind === 'technical') {
      // Technical instances receive their first matrices at draw time; fail earlier instead.
      vi.spyOn(BufferGeometry.prototype, 'setAttribute').mockImplementationOnce(() => { throw new Error('Synthetic setup failure'); });
    }
    expect(() => createOrbitObject(kind, vi.fn())).toThrow('Synthetic setup failure');
    if (kind === 'paper') expect(disposeGeometry).toHaveBeenCalled();
    expect(gpu.renderers[0].dispose).toHaveBeenCalledOnce(); expect(gpu.renderers[0].forceContextLoss).toHaveBeenCalledOnce();
  });
});
