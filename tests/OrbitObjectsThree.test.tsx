import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, InstancedMesh, Material, Texture, Vector3, type Mesh, type PerspectiveCamera, type Points, type Scene, type ShaderMaterial } from 'three';
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
    const scene = gpu.renderers[0].scene!, bird = kind === 'paper';
    expect(scene.name).toBe(bird ? 'origami-paper-bird' : 'originium-cluster');
    const particles = scene.getObjectByName(bird ? 'floating-paper-flecks' : 'floating-fragments') as InstancedMesh;
    const dust = scene.getObjectByName(bird ? 'paper-motes' : 'crystal-embers') as Points<BufferGeometry, ShaderMaterial>;
    const capture = () => ({ wings: bird ? ['paper-wing-left', 'paper-wing-right'].map(name => scene.getObjectByName(name)!.rotation.z) : [], object: scene.getObjectByName('theme-object')!.matrixWorld.toArray(), particles: [...particles.instanceMatrix.array], time: dust.material.uniforms.time.value });
    const frozen = capture(); art.draw(400, 620, 1); expect(capture()).toEqual(frozen);
    art.draw(880, 526, 1); expect(capture()).toEqual(frozen);
    art.draw(880, 526, 2); expect(capture().object).not.toEqual(frozen.object); expect(capture().particles).not.toEqual(frozen.particles);
    expect(capture().time).toBe(2);
    if (bird) {
      expect(capture().wings).not.toEqual(frozen.wings);
      const body = scene.getObjectByName('folded-body') as Mesh;
      expect(body.geometry.getAttribute('position').count).toBeGreaterThan(20);
      expect(scene.getObjectByName('paper-wing-left')).toBeDefined();
      expect(scene.getObjectByName('paper-wing-right')).toBeDefined();
      expect(scene.getObjectByName('folded-neck-and-beak')).toBeDefined();
    } else {
      for (let i = 0; i < 5; i++) expect(scene.getObjectByName(`originium-facet-${i}`)).toBeDefined();
      expect(scene.getObjectByName('containment-ring')).toBeDefined();
    }
    expect(requestAnimationFrame).not.toHaveBeenCalled(); art.dispose();
  });

  if (kind === 'paper') it('continuously reshapes the existing paper buffers and creases, freezes mid-fold and reverses', () => {
    const art = createOrbitObject(kind, vi.fn());
    art.draw(880, 526, 0);
    const object = gpu.renderers[0].scene!.getObjectByName('theme-object')!;
    const meshes: Mesh[] = [];
    object.traverse(node => { if ((node as Mesh).geometry) meshes.push(node as Mesh); });
    const identities = meshes.map(mesh => [mesh.uuid, mesh.geometry.uuid, mesh.geometry.getAttribute('position')]);
    const capture = () => meshes.map(mesh => [...mesh.geometry.getAttribute('position').array]);
    const bird = capture();
    art.draw(880, 526, 11); const halfway = capture();
    expect(halfway).not.toEqual(bird);
    art.draw(520, 460, 11); expect(capture()).toEqual(halfway);
    art.draw(880, 526, 11.0001);
    const adjacent = capture();
    expect(Math.max(...adjacent.flatMap((points, i) => points.map((v, j) => Math.abs(v - halfway[i][j]))))).toBeLessThan(.001);
    art.draw(880, 526, 21); const butterfly = capture();
    expect(butterfly).not.toEqual(bird); expect(butterfly).not.toEqual(halfway);
    expect(butterfly.every(points => points.every(Number.isFinite))).toBe(true);
    art.draw(880, 526, 31); expect(capture()).toEqual(halfway);
    art.draw(880, 526, 42); expect(capture()).toEqual(bird);
    expect(meshes.map(mesh => [mesh.uuid, mesh.geometry.uuid, mesh.geometry.getAttribute('position')])).toEqual(identities);
    expect(object.children.every(child => child.visible)).toBe(true);
    art.dispose();
  });

  if (kind === 'paper') it('opens a nearly flat sheet between two folding gestures and suspends flapping', () => {
    const art = createOrbitObject(kind, vi.fn());
    const heightAt = (time: number) => {
      art.draw(880, 526, time);
      const wing = gpu.renderers[0].scene!.getObjectByName('paper-wing-left')!;
      expect(Math.abs(wing.rotation.z)).toBe(0);
      let height = 0;
      wing.traverse(node => {
        const positions = (node as Mesh).geometry?.getAttribute('position');
        if (positions) for (let i = 0; i < positions.count; i++) height = Math.max(height, Math.abs(positions.getY(i)));
      });
      return height;
    };
    const gathered = heightAt(6.2), opened = heightAt(11), refolded = heightAt(14.4);
    expect(opened).toBeLessThan(.08);
    expect(gathered).toBeGreaterThan(opened * 4);
    expect(refolded).toBeGreaterThan(opened * 4);
    art.dispose();
  });

  if (kind === 'paper') it('flies, banks and beats its wings without leaving desktop or narrow frames', () => {
    const art = createOrbitObject(kind, vi.fn()), vertex = new Vector3();
    const motion: number[][] = [];
    let maxX = 0, maxY = 0, extreme = '';
    for (const [width, height] of [[400,360],[520,460],[880,526]]) for (let time = 0; time <= 84; time += .5) {
      art.draw(width, height, time);
      const { scene, camera } = gpu.renderers[0];
      const bird = scene!.getObjectByName('theme-object')!;
      motion.push([bird.position.x, bird.position.y, bird.position.z, bird.rotation.z, scene!.getObjectByName('paper-wing-left')!.rotation.z]);
      scene!.getObjectByName('theme-object')!.traverse(node => {
        const positions = (node as Mesh).geometry?.getAttribute('position');
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i).applyMatrix4(node.matrixWorld).project(camera!);
          maxX = Math.max(maxX, Math.abs(vertex.x));
          if (Math.abs(vertex.y) > maxY) { maxY = Math.abs(vertex.y); extreme = `${width}x${height} t=${time} ${node.name}`; }
        }
      });
    }
    expect(maxX).toBeLessThan(.96);
    expect(maxY, extreme).toBeLessThan(.94);
    for (const [axis, minimumSpan] of [ .7, .3, .38, .22, .5 ].entries()) {
      const values = motion.map(pose => pose[axis]);
      expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(minimumSpan);
    }
    art.dispose();
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
    expect(textureSpy).toHaveBeenCalledTimes(kind === 'paper' ? 2 : 1);
    expect(new Set(textureSpy.mock.contexts).size).toBe(textureSpy.mock.calls.length);
    expect(renderer.dispose).toHaveBeenCalledOnce(); expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(art.canvas.isConnected).toBe(false); expect(art.draw(400, 620, 4)).toBe(false);
    art.canvas.dispatchEvent(new Event('webglcontextrestored')); expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('releases partial allocations if object construction fails', () => {
    const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose');
    vi.spyOn(BufferGeometry.prototype, 'setAttribute').mockImplementationOnce(() => { throw new Error('Synthetic setup failure'); });
    expect(() => createOrbitObject(kind, vi.fn())).toThrow('Synthetic setup failure');
    expect(disposeGeometry).toHaveBeenCalled();
    expect(gpu.renderers[0].dispose).toHaveBeenCalledOnce(); expect(gpu.renderers[0].forceContextLoss).toHaveBeenCalledOnce();
  });
});
