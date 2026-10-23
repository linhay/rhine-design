import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OrbitBackdrop } from '../components';
import { mountOrbit } from '../components/orbitRenderer';
import { OrbitGallery } from '../preview/OrbitGallery';

class Media extends EventTarget {
  matches = false;
  set(value: boolean) { this.matches = value; this.dispatchEvent(new Event('change')); }
}

describe('OrbitBackdrop artwork and lifecycle', () => {
  let reduced: Media, compact: Media, hidden: boolean, bounds: { width: number; height: number };
  let frameId: number, frames: Map<number, FrameRequestCallback>;
  let resize: () => void, intersect: (value: boolean) => void;
  let resizeDisconnect: () => void, intersectionDisconnect: () => void;
  let draws: number, lines: number, trails: number, glows: number, firstPoint: number[], firstRadius: number, zoom: number;
  let hasPoint: boolean;
  let context: CanvasRenderingContext2D;

  beforeEach(() => {
    reduced = new Media(); compact = new Media(); hidden = false;
    bounds = { width: 600, height: 680 }; frameId = 0; frames = new Map();
    draws = lines = trails = glows = firstRadius = 0; firstPoint = []; hasPoint = false; zoom = 1;
    resizeDisconnect = vi.fn(); intersectionDisconnect = vi.fn();
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.spyOn(HTMLCanvasElement.prototype, 'clientWidth', 'get').mockImplementation(() => bounds.width);
    vi.spyOn(HTMLCanvasElement.prototype, 'clientHeight', 'get').mockImplementation(() => bounds.height);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: bounds.width * zoom, height: bounds.height * zoom, x: 0, y: 0, top: 0, left: 0, right: bounds.width * zoom, bottom: bounds.height * zoom, toJSON() {} }));
    vi.stubGlobal('matchMedia', (query: string) => query.includes('prefers-reduced') ? reduced : compact);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { const id = ++frameId; frames.set(id, callback); return id; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('ResizeObserver', class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() { resizeDisconnect(); } });
    vi.stubGlobal('IntersectionObserver', class {
      constructor(private callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {}
      observe(target: Element) { intersect = value => this.callback([{ target, isIntersecting: value }]); }
      disconnect() { intersectionDisconnect(); }
    });
    const gradient = { addColorStop() {} };
    context = {
      setTransform() {}, clearRect() { draws++; lines = trails = glows = firstRadius = 0; hasPoint = false; },
      beginPath() {}, closePath() {}, stroke() {}, fill() {}, arc(_x: number, _y: number, radius: number) { if (!firstRadius) firstRadius = radius; },
      moveTo(x: number, y: number) { if (!hasPoint) { hasPoint = true; firstPoint = [x, y]; } },
      lineTo() { lines++; },
      createLinearGradient() { trails++; return gradient; },
      createRadialGradient() { glows++; return gradient; },
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });
  afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-rhine-motion'); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function advance(now: number) {
    act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); });
  }

  it('retains the complete seeded artwork, caps pixel density and pauses without catching up', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const canvas = document.createElement('canvas'); document.body.append(canvas);
    const scene = mountOrbit(canvas, () => {});
    expect(canvas.width).toBe(1200); expect(canvas.height).toBe(1360);
    expect(trails).toBe(420); expect(glows).toBe(140); expect(lines).toBeGreaterThan(185 * 80);
    advance(100); const initial = [...firstPoint]; advance(200); const moving = [...firstPoint];
    expect(moving).not.toEqual(initial);
    scene.setPaused(true); const stoppedDraws = draws;
    expect(frames.size).toBe(0); advance(9000); expect(draws).toBe(stoppedDraws);
    scene.setPaused(false); advance(10000); expect(firstPoint).toEqual(moving);
    advance(10100); expect(firstPoint).not.toEqual(moving);
    scene.dispose(); canvas.remove();
  });

  it('keeps children and keyboard-capable pause control while preserving the current canvas', () => {
    const { container } = render(<OrbitBackdrop><input aria-label="草稿" defaultValue="保留内容" /></OrbitBackdrop>);
    const canvas = container.querySelector('canvas'); expect(canvas).toHaveAttribute('aria-hidden', 'true');
    const input = screen.getByLabelText('草稿'); fireEvent.change(input, { target: { value: '已经输入' } });
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    expect(frames.size).toBe(0); expect(screen.getByRole('button', { name: '继续动效' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    expect(frames.size).toBe(1); expect(container.querySelector('canvas')).toBe(canvas); expect(input).toHaveValue('已经输入');
  });

  it('keeps geometry and stroke proportions stable when CSS zoom changes before a pause or resize', () => {
    const { container } = render(<OrbitBackdrop />);
    const canvas = container.querySelector('canvas')!;
    const snapshot = () => ({ width: canvas.width, height: canvas.height, point: [...firstPoint], lineWidth: context.lineWidth, radius: firstRadius });
    const before = snapshot();
    // CSS zoom changes the visual rectangle without changing layout dimensions or issuing RO.
    zoom = 2;
    expect(canvas.getBoundingClientRect().width).toBe(canvas.clientWidth * 2);
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    expect(snapshot()).toEqual(before); expect(frames.size).toBe(0);
    act(() => resize()); expect(snapshot()).toEqual(before);
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    advance(100); expect(snapshot()).toEqual(before); expect(frames.size).toBe(1);
  });

  it('honors system and explicit reduction, and never lets false bypass the system', () => {
    reduced.matches = true;
    const { rerender } = render(<OrbitBackdrop reducedMotion={false} />);
    expect(frames.size).toBe(0); expect(screen.getByRole('button', { name: '已减少动态' })).toBeDisabled();
    act(() => reduced.set(false)); expect(frames.size).toBe(1);
    rerender(<OrbitBackdrop reducedMotion />); expect(frames.size).toBe(0);
    rerender(<OrbitBackdrop reducedMotion={false} />); expect(frames.size).toBe(1);
    act(() => reduced.set(true)); expect(frames.size).toBe(0);
  });

  it('observes ancestor motion changes even through a local system preference', async () => {
    render(<div data-rhine-motion="system"><OrbitBackdrop /></div>);
    expect(frames.size).toBe(1);
    await act(async () => { document.documentElement.setAttribute('data-rhine-motion', 'reduced'); });
    expect(frames.size).toBe(0);
    await act(async () => { document.documentElement.removeAttribute('data-rhine-motion'); });
    expect(frames.size).toBe(1);
  });

  it('stops while hidden, offscreen, compact or empty and redraws a paused resize', () => {
    const { container } = render(<OrbitBackdrop />);
    act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); }); expect(frames.size).toBe(0);
    act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); }); expect(frames.size).toBe(1);
    act(() => intersect(false)); expect(frames.size).toBe(0);
    act(() => intersect(true)); expect(frames.size).toBe(1);
    act(() => compact.set(true)); expect(frames.size).toBe(0); expect(screen.getByRole('button', { name: '窄屏静态画面' })).toBeDisabled();
    act(() => compact.set(false)); expect(frames.size).toBe(1);
    act(() => { bounds.width = 0; resize(); }); expect(frames.size).toBe(0);
    act(() => { bounds.width = 400; resize(); }); expect(frames.size).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' })); const beforeResize = draws;
    act(() => { bounds.height = 500; resize(); }); expect(draws).toBeGreaterThan(beforeResize); expect(frames.size).toBe(0);
    expect(container.querySelector('canvas')).toHaveAttribute('height', '500');
  });

  it('cleans up all scheduling and observers, including Strict Mode mount replay', async () => {
    const visibilitySpy = vi.spyOn(document, 'removeEventListener');
    const resizeSpy = vi.spyOn(window, 'removeEventListener');
    const reducedSpy = vi.spyOn(reduced, 'removeEventListener');
    const compactSpy = vi.spyOn(compact, 'removeEventListener');
    const { unmount } = render(<StrictMode><OrbitBackdrop /></StrictMode>);
    expect(frames.size).toBe(1); unmount(); const finalDraws = draws;
    expect(frames.size).toBe(0); expect(resizeDisconnect).toHaveBeenCalledTimes(2); expect(intersectionDisconnect).toHaveBeenCalledTimes(2);
    expect(visibilitySpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(resizeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(reducedSpy).toHaveBeenCalledWith('change', expect.any(Function)); expect(compactSpy).toHaveBeenCalledWith('change', expect.any(Function));
    await act(async () => { document.documentElement.setAttribute('data-rhine-motion', 'reduced'); reduced.set(true); resize(); intersect(true); });
    expect(draws).toBe(finalDraws); expect(frames.size).toBe(0);
  });

  it.each(['null', 'throw'])('keeps content usable when the canvas context is %s', mode => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(() => { if (mode === 'throw') throw new Error('Canvas unavailable'); return null; });
    const { container } = render(<OrbitBackdrop><button>继续工作</button></OrbitBackdrop>);
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'unavailable');
    expect(screen.getByRole('button', { name: '继续工作' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '静态画面' })).toBeDisabled(); expect(frames.size).toBe(0);
  });

  it('replays only the gallery artwork and preserves the external replay focus', () => {
    const { container } = render(<OrbitGallery />); const canvas = container.querySelector('canvas');
    const replay = screen.getByRole('button', { name: '重播轨道' }); replay.focus(); fireEvent.click(replay);
    expect(container.querySelector('canvas')).not.toBe(canvas); expect(replay).toHaveFocus(); expect(frames.size).toBe(1);
    fireEvent.click(screen.getByRole('switch', { name: '减少轨道动态' })); expect(frames.size).toBe(0);
  });
});
