import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { OrbitBackdrop } from '../components';
import { mountOrbit } from '../components/orbitRenderer';
import { projectOrbitPoint, rotateOrbitPoint } from '../components/orbitProjection';
import { OrbitGallery } from '../preview/OrbitGallery';

class Media extends EventTarget {
  matches = false;
  set(value: boolean) { this.matches = value; this.dispatchEvent(new Event('change')); }
}
type PathCommand = [kind: 'move' | 'line' | 'arc' | 'rect' | 'close', ...coordinates: number[]];
type Paint = {
  kind: 'stroke' | 'fill'; path: PathCommand[]; color: string | CanvasGradient | CanvasPattern;
  width: number; dash: number[]; dashOffset: number; cap: CanvasLineCap; join: CanvasLineJoin;
};

describe('OrbitBackdrop artwork and lifecycle', () => {
  let reduced: Media, compact: Media, hidden: boolean, bounds: { width: number; height: number };
  let frameId: number, frames: Map<number, FrameRequestCallback>;
  let resize: () => void, intersect: (value: boolean) => void;
  let resizeDisconnect: () => void, intersectionDisconnect: () => void;
  let draws: number, lines: number, trails: number, glows: number, firstPoint: number[], firstRadius: number, zoom: number;
  let hasPoint: boolean;
  let context: CanvasRenderingContext2D;
  let paletteStyles: HTMLStyleElement;
  let gradientColors: Set<string>;
  let recordPaint: boolean, painted: Paint[], dashes: number[];

  beforeEach(() => {
    reduced = new Media(); compact = new Media(); hidden = false;
    bounds = { width: 600, height: 680 }; frameId = 0; frames = new Map();
    draws = lines = trails = glows = firstRadius = 0; firstPoint = []; hasPoint = false; zoom = 1;
    gradientColors = new Set();
    recordPaint = false; painted = []; dashes = [];
    paletteStyles = document.createElement('style');
    paletteStyles.textContent = `
      .orbit-palette-fixture { --rhine-orbit-highlight: #165f49; }
      .orbit-palette-fixture[data-rhine-theme="arknights"] { --rhine-orbit-highlight: #d9b477; }
      .orbit-palette-fixture.alternate-palette { --rhine-orbit-highlight: #ed7020; }
      .orbit-palette-fixture [data-rhine-orbit-appearance="original"] { --rhine-orbit-highlight: #ff658c; }
      .orbit-linework-fixture { --rhine-orbit-linework: paper; }
      .orbit-linework-fixture[data-rhine-theme="arknights"] { --rhine-orbit-linework: technical; }
      .orbit-linework-fixture[data-rhine-theme="neo-brutalism"] { --rhine-orbit-linework: donut; }
      .orbit-linework-fixture [data-rhine-orbit-appearance="original"] { --rhine-orbit-linework: original; }
    `;
    document.head.append(paletteStyles);
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
    const gradient = { addColorStop(_offset: number, color: string) { gradientColors.add(color); } };
    const states: Partial<CanvasRenderingContext2D>[] = [], savedDashes: number[][] = [];
    let path: PathCommand[] = [];
    const record = (command: PathCommand) => { if (recordPaint) path.push(command); };
    const paint = (kind: Paint['kind'], commands = path) => {
      if (recordPaint) painted.push({ kind, path: [...commands], color: kind === 'stroke' ? context.strokeStyle : context.fillStyle,
        width: context.lineWidth, dash: [...dashes], dashOffset: context.lineDashOffset, cap: context.lineCap, join: context.lineJoin });
    };
    context = {
      lineWidth: 1, globalAlpha: 1, shadowOffsetX: 0, shadowOffsetY: 0, shadowBlur: 0, lineDashOffset: 0, lineCap: 'butt', lineJoin: 'miter',
      save() {
        states.push({ lineWidth: context.lineWidth, globalAlpha: context.globalAlpha, strokeStyle: context.strokeStyle, fillStyle: context.fillStyle,
          lineCap: context.lineCap, lineJoin: context.lineJoin, lineDashOffset: context.lineDashOffset, shadowBlur: context.shadowBlur, shadowColor: context.shadowColor, shadowOffsetX: context.shadowOffsetX, shadowOffsetY: context.shadowOffsetY });
        savedDashes.push([...dashes]);
      },
      restore() { Object.assign(context, states.pop()); dashes = savedDashes.pop() ?? []; },
      setTransform() {},
      clearRect() {
        draws++; lines = trails = glows = firstRadius = 0; hasPoint = false;
        painted = []; path = [];
      },
      beginPath() { path = []; }, closePath() { record(['close']); },
      stroke() { paint('stroke'); }, fill() { paint('fill'); },
      arc(x: number, y: number, radius: number, start: number, end: number) { if (!firstRadius) firstRadius = radius; record(['arc', x, y, radius, start, end]); },
      rect(x: number, y: number, width: number, height: number) { record(['rect', x, y, width, height]); },
      fillRect(x: number, y: number, width: number, height: number) { paint('fill', [['rect', x, y, width, height]]); },
      strokeRect(x: number, y: number, width: number, height: number) { paint('stroke', [['rect', x, y, width, height]]); },
      moveTo(x: number, y: number) { if (!hasPoint) { hasPoint = true; firstPoint = [x, y]; } record(['move', x, y]); },
      lineTo(x: number, y: number) { lines++; record(['line', x, y]); },
      setLineDash(segments: number[]) { dashes = [...segments]; }, getLineDash() { return [...dashes]; },
      createLinearGradient() { trails++; return gradient; },
      createRadialGradient() { glows++; return gradient; },
    } as unknown as CanvasRenderingContext2D;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  });
  afterEach(() => { cleanup(); paletteStyles.remove(); document.documentElement.removeAttribute('data-rhine-motion'); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  function advance(now: number) {
    act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); });
  }

  it('keeps the shared camera aligned with the original orbit reference axes', () => {
    const references = [
      { point: { x: 1, y: 0, z: 0 }, x: 86.76980178489757, y: 33.1491730947802, depth: .6593846719714731 },
      { point: { x: 0, y: 1, z: 0 }, x: -48.312703948795914, y: 98.67789420213471, depth: .16406628090045566 },
      { point: { x: 0, y: 0, z: 1 }, x: -67.05339595630653, y: -57.01591387412629, depth: .7336852934607355 },
    ];
    for (const reference of references) {
      const actual = projectOrbitPoint(rotateOrbitPoint(reference.point), 100, 0, 0);
      expect(actual.x).toBeCloseTo(reference.x, 10); expect(actual.y).toBeCloseTo(reference.y, 10);
      expect(actual.depth).toBeCloseTo(reference.depth, 10);
    }
  });

  it('retains the complete seeded artwork, caps pixel density and pauses without catching up', () => {
    vi.stubGlobal('devicePixelRatio', 3);
    const canvas = document.createElement('canvas'); document.body.append(canvas);
    const scene = mountOrbit(canvas, () => {});
    expect(canvas.width).toBe(1200); expect(canvas.height).toBe(1360);
    expect(trails).toBe(420); expect(glows).toBe(140); expect(lines).toBeGreaterThan(185 * 80);
    expect(gradientColors).toEqual(new Set(['#addaff', '#addaff00', '#e1a147', '#e1a14700']));
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
    expect(frames.size).toBe(0); expect(screen.getByRole('button', { name: '继续动效' })).not.toHaveAttribute('aria-pressed');
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'paused');
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    expect(frames.size).toBe(1); expect(container.querySelector('canvas')).toBe(canvas); expect(input).toHaveValue('已经输入');
    expect(screen.getByRole('button', { name: '暂停动效' })).not.toHaveAttribute('aria-pressed');
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'playing');
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

  it('omits local controls without replacing the canvas, losing drafts or bypassing reduced motion', () => {
    const view = (controls: boolean, composition: 'full' | 'corner', framed: boolean) => <OrbitBackdrop controls={controls} composition={composition} framed={framed}>
      <input aria-label="背景草稿" defaultValue="起点" />
    </OrbitBackdrop>;
    const { container, rerender } = render(view(true, 'full', true));
    const canvas = container.querySelector('canvas');
    fireEvent.change(screen.getByLabelText('背景草稿'), { target: { value: '继续保留' } });
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    rerender(view(false, 'corner', false));
    expect(container.querySelector('.rhine-orbit-controls')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(screen.getByLabelText('背景草稿')).toHaveValue('继续保留');
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-composition', 'corner');
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-framed', 'false');
    expect(frames.size).toBe(0);
    rerender(view(true, 'corner', false));
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    rerender(view(false, 'corner', false));
    expect(frames.size).toBe(1);
    act(() => reduced.set(true));
    expect(frames.size).toBe(0);
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'reduced');
    act(() => reduced.set(false));
    expect(frames.size).toBe(1);
  });

  it('recolors a paused frame when its theme or appearance changes without remounting or losing content', async () => {
    const view = (theme: string, appearance: 'theme' | 'original' = 'theme') => <div className="orbit-palette-fixture" data-rhine-theme={theme}>
      <OrbitBackdrop appearance={appearance}><input aria-label="轨道草稿" defaultValue="起点" /></OrbitBackdrop>
    </div>;
    const { container, rerender } = render(view('default'));
    const canvas = container.querySelector('canvas');
    expect(context.fillStyle).toBe('#165f49');
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-appearance', 'theme');
    advance(100); advance(200);
    fireEvent.change(screen.getByLabelText('轨道草稿'), { target: { value: '保留草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    const frozen = [...firstPoint], before = draws;
    await act(async () => { rerender(view('arknights')); });
    expect(draws).toBeGreaterThan(before); expect(context.fillStyle).toBe('#d9b477');
    expect(firstPoint).toEqual(frozen); expect(frames.size).toBe(0);
    await act(async () => { rerender(view('arknights', 'original')); });
    expect(context.fillStyle).toBe('#ff658c'); expect(firstPoint).toEqual(frozen); expect(frames.size).toBe(0);
    await act(async () => { rerender(view('default', 'original')); });
    expect(context.fillStyle).toBe('#ff658c');
    await act(async () => { rerender(view('default')); });
    expect(context.fillStyle).toBe('#165f49'); expect(firstPoint).toEqual(frozen);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('轨道草稿')).toHaveValue('保留草稿');
    expect(screen.getByRole('button', { name: '继续动效' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    advance(10000); expect(firstPoint).toEqual(frozen);
    advance(10100); expect(firstPoint).not.toEqual(frozen); expect(frames.size).toBe(1);
  });

  it('responds to CSS-only root classes and token overrides, without reading styles on every frame', async () => {
    const styleReads = vi.spyOn(window, 'getComputedStyle');
    const { container, unmount } = render(<div className="orbit-palette-fixture"><OrbitBackdrop /></div>);
    const root = container.firstElementChild as HTMLElement;
    expect(context.fillStyle).toBe('#165f49');
    const readCount = styleReads.mock.calls.length;
    advance(100); advance(200);
    expect(styleReads.mock.calls.length).toBe(readCount);
    const frozen = [...firstPoint];
    await act(async () => { root.classList.add('alternate-palette'); });
    expect(context.fillStyle).toBe('#ed7020'); expect(firstPoint).toEqual(frozen); expect(frames.size).toBe(1);
    advance(10000); expect(firstPoint).toEqual(frozen);
    advance(10100); expect(firstPoint).not.toEqual(frozen);
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    const pausedPoint = [...firstPoint];
    await act(async () => { root.style.setProperty('--rhine-orbit-highlight', 'rgb(32, 114, 153)'); });
    expect(context.fillStyle).toBe('rgb(32, 114, 153)'); expect(firstPoint).toEqual(pausedPoint); expect(frames.size).toBe(0);
    unmount(); const finalDraws = draws;
    await act(async () => { root.style.setProperty('--rhine-orbit-highlight', '#abcdef'); });
    expect(draws).toBe(finalDraws); expect(frames.size).toBe(0);
  });

  it('preserves color channels in transparent gradient stops for normalized RGB and wide-gamut colors', async () => {
    const { container } = render(<OrbitBackdrop reducedMotion />);
    const root = container.firstElementChild as HTMLElement;
    gradientColors.clear();
    await act(async () => {
      root.style.setProperty('--rhine-orbit-trail-near', 'rgb(32, 114, 153)');
      root.style.setProperty('--rhine-orbit-trail-far', 'color(display-p3 0.7 0.3 0.1 / 0.8)');
    });
    expect(gradientColors).toEqual(new Set(['rgb(32, 114, 153)', 'rgba(32,114,153,0)', 'color(display-p3 0.7 0.3 0.1 / 0.8)', 'color(display-p3 0.7 0.3 0.1 / 0)']));
    expect(frames.size).toBe(0);
  });

  it('preserves the original geometry across host themes while object themes keep the same frozen clock and content', async () => {
    recordPaint = true;
    const view = (theme: string, appearance: 'theme' | 'original' = 'theme') => <div className="orbit-linework-fixture" data-rhine-theme={theme}>
      <OrbitBackdrop appearance={appearance}><input aria-label="主题草稿" defaultValue="保留内容" /></OrbitBackdrop>
    </div>;
    const { container, rerender } = render(view('default', 'original'));
    const canvas = container.querySelector('canvas');
    advance(100); advance(200);
    fireEvent.change(screen.getByLabelText('主题草稿'), { target: { value: '保留我的输入' } });
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    const original = painted;
    expect(trails).toBe(420); expect(glows).toBe(140);
    for (const theme of ['arknights', 'neo-brutalism', 'default']) {
      await act(async () => { rerender(view(theme, 'original')); });
      expect(painted).toEqual(original); expect(frames.size).toBe(0);
    }
    const paintings: Paint[][] = [];
    for (const theme of ['default', 'arknights']) {
      await act(async () => { rerender(view(theme)); });
      const frozen = painted; paintings.push(frozen);
      expect(trails).toBe(0); expect(glows).toBe(0); expect(frozen.length).toBeGreaterThan(100);
      advance(5000); expect(painted).toEqual(frozen);
      await act(async () => { rerender(view(theme, 'original')); });
      expect(painted).toEqual(original);
      await act(async () => { rerender(view(theme)); });
      expect(painted).toEqual(frozen); expect(frames.size).toBe(0);
    }
    expect(paintings[0]).not.toEqual(paintings[1]);
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    advance(10000); expect(painted).toEqual(paintings[1]);
    advance(10100); expect(painted).not.toEqual(paintings[1]);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(screen.getByLabelText('主题草稿')).toHaveValue('保留我的输入');
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

  it('synchronizes a media change observed by a frame before the change event arrives', () => {
    const { container } = render(<OrbitBackdrop />);
    advance(100); advance(200); const frozen = [...firstPoint];
    reduced.matches = true;
    advance(300);
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'reduced');
    expect(screen.getByRole('button', { name: '已减少动态' })).toBeDisabled();
    expect(frames.size).toBe(0); expect(firstPoint).toEqual(frozen);
    const stoppedDraws = draws; advance(9000); expect(draws).toBe(stoppedDraws);
    act(() => reduced.set(false));
    expect(container.querySelector('.rhine-orbit')).toHaveAttribute('data-rhine-orbit-state', 'playing');
    expect(screen.getByRole('button', { name: '暂停动效' })).toBeEnabled();
    advance(10000); expect(firstPoint).toEqual(frozen);
    advance(10100); expect(firstPoint).not.toEqual(frozen);
  });

  it('observes ancestor motion changes even through a local system preference', async () => {
    render(<div data-rhine-motion="system"><OrbitBackdrop /></div>);
    expect(frames.size).toBe(1);
    await act(async () => { document.documentElement.setAttribute('data-rhine-motion', 'reduced'); });
    expect(frames.size).toBe(0);
    await act(async () => { document.documentElement.removeAttribute('data-rhine-motion'); });
    expect(frames.size).toBe(1);
  });

  it('rotates a strawberry donut on compact Neo screens and preserves its frozen frame across appearance changes', async () => {
    recordPaint = true; compact.matches = true;
    const view = (appearance: 'theme' | 'original' = 'theme', theme = 'neo-brutalism') => <div className="orbit-linework-fixture" data-rhine-theme={theme}>
      <OrbitBackdrop appearance={appearance}><input aria-label="甜甜圈草稿" defaultValue="保留" /></OrbitBackdrop>
    </div>;
    const { container, rerender } = render(view());
    const canvas = container.querySelector('canvas');
    expect(screen.getByRole('button', { name: '暂停动效' })).toBeEnabled();
    const pinkFaces = painted.filter(paint => {
      if (paint.kind !== 'fill') return false;
      const rgb = String(paint.color).match(/^rgb\((\d+),(\d+),(\d+)\)$/);
      return rgb && Number(rgb[1]) > Number(rgb[3]) && Number(rgb[3]) > Number(rgb[2]);
    });
    expect(pinkFaces.length).toBeGreaterThan(100);
    expect(trails).toBe(0); expect(glows).toBe(0);
    advance(100); const firstFrame = painted;
    advance(200); expect(painted).not.toEqual(firstFrame);
    fireEvent.change(screen.getByLabelText('甜甜圈草稿'), { target: { value: '保留我的输入' } });
    fireEvent.click(screen.getByRole('button', { name: '暂停动效' }));
    const frozen = painted;
    expect(frames.size).toBe(0);
    advance(5000); expect(painted).toEqual(frozen);
    await act(async () => { rerender(view('original')); });
    expect(screen.getByRole('button', { name: '窄屏静态画面' })).toBeDisabled();
    expect(trails).toBe(420); expect(glows).toBe(140);
    await act(async () => { rerender(view('theme', 'arknights')); });
    expect(screen.getByRole('button', { name: '继续动效' })).toBeEnabled();
    await act(async () => { rerender(view()); });
    expect(screen.getByRole('button', { name: '继续动效' })).toBeEnabled();
    expect(painted).toEqual(frozen); expect(frames.size).toBe(0);
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(screen.getByLabelText('甜甜圈草稿')).toHaveValue('保留我的输入');
    fireEvent.click(screen.getByRole('button', { name: '继续动效' }));
    advance(10000); expect(painted).toEqual(frozen);
    advance(10100); expect(painted).not.toEqual(frozen);
  });

  it.each(['default', 'arknights', 'neo-brutalism'])('stops the %s object for every motion preference, visibility change and disposal', async theme => {
    const view = (explicit = false) => <div className="orbit-linework-fixture" data-rhine-theme={theme}>
      <OrbitBackdrop reducedMotion={explicit} />
    </div>;
    compact.matches = true;
    const { rerender, unmount } = render(view());
    expect(frames.size).toBe(1);
    act(() => reduced.set(true)); expect(frames.size).toBe(0);
    rerender(view(false)); expect(frames.size).toBe(0);
    expect(screen.getByRole('button', { name: '已减少动态' })).toBeDisabled();
    act(() => reduced.set(false)); expect(frames.size).toBe(1);
    rerender(view(true)); expect(frames.size).toBe(0);
    rerender(view(false)); expect(frames.size).toBe(1);
    await act(async () => { document.documentElement.setAttribute('data-rhine-motion', 'reduced'); });
    expect(frames.size).toBe(0);
    await act(async () => { document.documentElement.removeAttribute('data-rhine-motion'); });
    expect(frames.size).toBe(1);
    act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); }); expect(frames.size).toBe(0);
    act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); }); expect(frames.size).toBe(1);
    act(() => intersect(false)); expect(frames.size).toBe(0);
    act(() => intersect(true)); expect(frames.size).toBe(1);
    unmount(); const finalDraws = draws;
    expect(frames.size).toBe(0);
    await act(async () => { resize(); intersect(true); reduced.set(true); });
    expect(draws).toBe(finalDraws);
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

  it('keeps the gallery artwork clear and preserves paused state and drafts across appearance changes and replay', async () => {
    const { container } = render(<OrbitGallery />); const canvas = container.querySelector('canvas');
    const main = screen.getByRole('region', { name: '轨道背景预览' });
    expect(within(main).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(main).getAllByRole('button')).toHaveLength(1);
    const disclosure = screen.getByText('查看组合控件示例');
    expect(disclosure.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(disclosure);
    fireEvent.change(screen.getByRole('textbox', { name: '直接叠加的输入框' }), { target: { value: '新的轨道名称' } });
    fireEvent.change(screen.getByRole('textbox', { name: '工作空间名称' }), { target: { value: '新的工作空间' } });
    fireEvent.click(within(main).getByRole('button', { name: '暂停动效' }));
    await act(async () => { fireEvent.click(screen.getByRole('radio', { name: '原始深色' })); });
    expect(container.querySelector('canvas')).toBe(canvas);
    expect(main).toHaveAttribute('data-rhine-orbit-appearance', 'original');
    expect(within(main).getByRole('button', { name: '继续动效' })).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByRole('radio', { name: '跟随主题' })); });
    expect(within(main).getByRole('button', { name: '继续动效' })).toBeEnabled();
    const replay = screen.getByRole('button', { name: '重播轨道' }); replay.focus(); fireEvent.click(replay);
    expect(container.querySelector('canvas')).not.toBe(canvas); expect(replay).toHaveFocus(); expect(frames.size).toBe(4);
    expect(screen.getByRole('textbox', { name: '直接叠加的输入框' })).toHaveValue('新的轨道名称');
    expect(screen.getByRole('textbox', { name: '工作空间名称' })).toHaveValue('新的工作空间');
    fireEvent.click(screen.getByRole('switch', { name: '减少轨道动态' })); expect(frames.size).toBe(0);
  });
});
