import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, InstancedMesh, Material, Texture, Vector3, type Mesh, type PerspectiveCamera, type Scene } from 'three';
import { createDonutArtwork } from '../components/orbitDonutThree';
import { projectOrbitPoint, rotateOrbitPoint } from '../components/orbitProjection';

const gpu = vi.hoisted(() => ({ renderers: [] as Array<{
  scene?: Scene; camera?: PerspectiveCamera; draws: number; dispose: ReturnType<typeof vi.fn>; forceContextLoss: ReturnType<typeof vi.fn>;
}> }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    ratio = 1; draws = 0; scene?: Scene; camera?: PerspectiveCamera;
    dispose = vi.fn(); forceContextLoss = vi.fn();
    constructor(private options: { canvas: HTMLCanvasElement }) { gpu.renderers.push(this); }
    setClearColor() {} setPixelRatio(value: number) { this.ratio = value; }
    setSize(width: number, height: number) { this.options.canvas.width = Math.round(width * this.ratio); this.options.canvas.height = Math.round(height * this.ratio); }
    render(scene: Scene, camera: PerspectiveCamera) { this.scene = scene; this.camera = camera; this.draws++; scene.updateMatrixWorld(); camera.updateMatrixWorld(); }
  } };
});

describe('Three.js strawberry artwork', () => {
  beforeEach(() => {
    gpu.renderers = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, beginPath() {}, ellipse() {}, fill() {},
    } as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('requestAnimationFrame', vi.fn());
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('renders detailed geometry and deterministic particles using only the supplied clock', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const art = createDonutArtwork(vi.fn()); art.draw(400, 620, 1);
    const renderer = gpu.renderers[0], scene = renderer.scene!;
    expect(art.canvas.width).toBe(600); expect(art.canvas.height).toBe(930);
    expect((scene.getObjectByName('icing-sprinkles') as InstancedMesh).count).toBe(280);
    expect((scene.getObjectByName('sugar-pearls') as InstancedMesh).count).toBe(110);
    const icing = (scene.getObjectByName('strawberry-icing') as Mesh).geometry.getAttribute('position');
    const radii = Array.from({ length: icing.count }, (_, i) => Math.hypot(icing.getX(i), icing.getY(i)));
    // The ring should occupy the original artwork's envelope, even with real tube thickness.
    expect(Math.max(...radii)).toBeGreaterThan(1.19); expect(Math.max(...radii)).toBeLessThan(1.22);
    expect(Math.min(...radii)).toBeGreaterThan(.46); expect(Math.min(...radii)).toBeLessThan(.49);
    const confetti = scene.getObjectByName('floating-confetti') as InstancedMesh;
    expect(confetti.count).toBe(100);
    const capture = () => ({ ring: scene.getObjectByName('strawberry-donut')!.matrixWorld.toArray(), particles: [...confetti.instanceMatrix.array] });
    const frozen = capture(); art.draw(400, 620, 1); expect(capture()).toEqual(frozen);
    art.draw(400, 620, 2); expect(capture().ring).not.toEqual(frozen.ring); expect(capture().particles).not.toEqual(frozen.particles);
    expect(requestAnimationFrame).not.toHaveBeenCalled(); art.dispose();
  });

  it.each([[400, 620], [520, 360], [880, 526]])('matches the original scale, center and tilt at %s × %s over time', (width, height) => {
    const art = createDonutArtwork(vi.fn());
    for (const time of [0, 1, 4, 10]) {
      art.draw(width, height, time);
      const renderer = gpu.renderers[0], donut = renderer.scene!.getObjectByName('strawberry-donut')!;
      for (const p of [new Vector3(0, 0, 0), new Vector3(1.2, 0, .2), new Vector3(0, 1.1, -.1), new Vector3(-.8, -.3, .4)]) {
        const spin = time * .28 - .35;
        const rotated = rotateOrbitPoint({ x: p.x * Math.cos(spin) - p.y * Math.sin(spin), y: p.x * Math.sin(spin) + p.y * Math.cos(spin), z: p.z });
        const expected = projectOrbitPoint(rotated, Math.min(width * .66, height * .39), width * .62, height * .57);
        const projected = p.clone().applyMatrix4(donut.matrixWorld).project(renderer.camera!);
        expect((projected.x + 1) * width / 2).toBeCloseTo(expected.x, 6);
        expect((1 - projected.y) * height / 2).toBeCloseTo(expected.y, 6);
      }
    }
    art.dispose();
  });

  it('falls back during context loss and releases geometry, textures and instance resources once', () => {
    const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose'), disposeMaterial = vi.spyOn(Material.prototype, 'dispose');
    const disposeTexture = vi.spyOn(Texture.prototype, 'dispose'), disposeInstance = vi.spyOn(InstancedMesh.prototype, 'dispose');
    const invalidate = vi.fn(), art = createDonutArtwork(invalidate); art.draw(880, 526, 3);
    const renderer = gpu.renderers[0], lost = new Event('webglcontextlost', { cancelable: true }); art.canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true); expect(art.draw(880, 526, 8)).toBe(false);
    art.canvas.dispatchEvent(new Event('webglcontextrestored')); expect(invalidate).toHaveBeenCalledTimes(2);
    expect(art.draw(880, 526, 3)).toBe(true);
    art.dispose(); art.dispose();
    expect(disposeGeometry).toHaveBeenCalledTimes(8); expect(disposeMaterial).toHaveBeenCalledTimes(9);
    expect(disposeTexture).toHaveBeenCalledOnce(); expect(disposeInstance).toHaveBeenCalledTimes(4);
    expect(renderer.dispose).toHaveBeenCalledOnce(); expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    art.canvas.dispatchEvent(new Event('webglcontextrestored')); expect(invalidate).toHaveBeenCalledTimes(2);
    expect(art.draw(880, 526, 9)).toBe(false);
  });

  it('cleans allocations if initialization fails before the first frame', () => {
    const disposeGeometry = vi.spyOn(BufferGeometry.prototype, 'dispose'), disposeTexture = vi.spyOn(Texture.prototype, 'dispose');
    vi.spyOn(InstancedMesh.prototype, 'setMatrixAt').mockImplementationOnce(() => { throw new Error('Synthetic GPU setup failure'); });
    expect(() => createDonutArtwork(vi.fn())).toThrow('Synthetic GPU setup failure');
    expect(disposeGeometry).toHaveBeenCalled(); expect(disposeTexture).toHaveBeenCalledOnce();
    expect(gpu.renderers[0].dispose).toHaveBeenCalledOnce(); expect(gpu.renderers[0].forceContextLoss).toHaveBeenCalledOnce();
  });
});
