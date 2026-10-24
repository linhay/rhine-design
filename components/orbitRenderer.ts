import { createOrbitDonut } from './orbitDonut';
import type { DonutArtwork } from './orbitDonutThree';
import { drawOrbitObject } from './orbitObjects';
import { orbitFraming, projectOrbitPoint, rotateOrbitPoint } from './orbitProjection';

type OrbitLinework = 'original' | 'paper' | 'technical' | 'donut';
type Point = { x: number; y: number; depth: number; perspective: number };
type Edge = { a: number; sweep: number; phase: number; waist: number; lift: number; color: number; speed: number };
type Layer =
  | { kind: 'void'; points: Point[] }
  | { kind: 'line'; p: Point; q: Point; color: number; distance: number }
  | { kind: 'particle'; p: Point; color: number }
  | { kind: 'spike'; p: Point; q: Point; i: number; pulse: number };
type CanvasScene = { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };
const originalPalette = {
  'line-primary': '#68b2f4', 'line-secondary': '#dfbb5c', 'line-tertiary': '#48b6b3',
  'particle-primary': '#51b7f6', 'particle-secondary': '#e5b94d', 'particle-tertiary': '#2ec7a1',
  'spike-near': '#d5e0f1', 'spike-far': '#b57635', 'trail-near': '#addaff', 'trail-far': '#e1a147',
  spark: '#f2f7ff', void: '#010205', highlight: '#ff658c', 'highlight-glow': '#f25380',
};
function transparentColor(color: string) {
  // Canvas serializes sRGB as hex/rgb and other color spaces as functions.
  // Keep the RGB components at alpha zero: Canvas gradients do not premultiply interpolation.
  if (color.startsWith('#')) return `${color.slice(0, 7)}00`;
  if (color.startsWith('rgb')) {
    const channels = color.slice(color.indexOf('(') + 1, -1).trim().split(/[\s,/]+/).slice(0, 3);
    return `rgba(${channels.join(',')},0)`;
  }
  return color.replace(/(?:\s*\/[^()]*)?\)$/, ' / 0)');
}
export type OrbitState = 'playing' | 'paused' | 'reduced' | 'compact' | 'hidden' | 'offscreen' | 'empty' | 'unavailable';
export interface OrbitRenderer { setPaused(value: boolean): void; setReducedMotion(value: boolean): void; dispose(): void }

/** The seeded artwork is stable across mounts; only elapsed visible time advances it. */
export function mountOrbit(canvas: HTMLCanvasElement, onState: (state: OrbitState) => void): OrbitRenderer {
  let ctx: CanvasRenderingContext2D | null = null;
  try { ctx = canvas.getContext('2d'); } catch { /* Canvas may be disabled by the host. */ }
  if (!ctx) {
    onState('unavailable');
    return { setPaused() {}, setReducedMotion() {}, dispose() {} };
  }
  const TAU = Math.PI * 2;
  let linework: OrbitLinework = 'original';
  let drawDonut: ReturnType<typeof createOrbitDonut> | undefined;
  type ObjectStyle = Exclude<OrbitLinework, 'original'>;
  const artworks = new Map<ObjectStyle, DonutArtwork>();
  const loading = new Set<ObjectStyle>(), failed = new Set<ObjectStyle>();
  const palette = { ...originalPalette }, fadeColors = { near: '', far: '' };
  function readPalette() {
    const style = getComputedStyle(canvas), previousFill = ctx!.fillStyle;
    const recipe = style.getPropertyValue('--rhine-orbit-linework').trim();
    linework = recipe === 'paper' || recipe === 'technical' || recipe === 'donut' ? recipe : 'original';
    for (const key of Object.keys(originalPalette) as (keyof typeof originalPalette)[]) {
      // Let Canvas resolve CSS colors, including color-mix() and non-RGB host tokens.
      // An invalid value leaves fillStyle unchanged, so each entry starts at its fallback.
      ctx!.fillStyle = originalPalette[key];
      ctx!.fillStyle = style.getPropertyValue(`--rhine-orbit-${key}`).trim() || originalPalette[key];
      palette[key] = ctx!.fillStyle as string;
    }
    fadeColors.near = transparentColor(palette['trail-near']);
    fadeColors.far = transparentColor(palette['trail-far']);
    ctx!.fillStyle = previousFill;
  }
  let seed = 1823;
  function rand() {
    seed = seed * 1664525 + 1013904223 >>> 0;
    return seed / 4294967296;
  }
  const nodes = Array.from({ length: 420 }, (_, i) => ({ a: i / 420 * TAU, r: 1.025 + rand() * 0.07, z: (rand() - 0.5) * 0.34, length: 0.035 + rand() * 0.19, color: i % 7 === 0 ? 1 : i % 11 === 0 ? 2 : 3 }));
  const emissions = nodes.map(() => ({ phase: rand(), rate: 0.28 + rand() * 0.3 }));
  const edges = Array.from({ length: 185 }, () => ({ a: rand() * TAU, sweep: 2.1 + rand() * 3.8, phase: rand() * TAU, waist: 0.5 + rand() * 0.32, lift: (rand() - 0.3) * 0.6, color: rand() < 0.32 ? 1 : rand() < 0.1 ? 2 : 0, speed: 0.026 + rand() * 0.024 }));
  function edgePoint(e: Edge, t: number) {
    const a = e.a + t * e.sweep, envelope = Math.sin(Math.PI * t);
    return { a, r: 1.035 - (1.035 - e.waist) * Math.pow(envelope, 0.72), z: e.lift * envelope + 0.06 * Math.sin(e.phase + t * TAU) * envelope };
  }
  const paths = edges.map((e) => Array.from({ length: 81 }, (_, i) => edgePoint(e, i / 80)));
  const canvases = { network: { el: canvas, ctx, w: 0, h: 0 } };
  let framing = orbitFraming(0, 0);
  let time = 0, orbit = 0, projected: Point[] = [], last: number | null = null, frame = 0;
  let paused = false, manualReduced = false, disposed = false, visible = true;
  let previousState: OrbitState | undefined;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Layout CSS pixels exclude CSS zoom; visual scaling must not change stroke proportions.
    const c = canvases.network;
    c.w = c.el.clientWidth;
    c.h = c.el.clientHeight;
    framing = orbitFraming(c.w, c.h);
    c.el.width = Math.round(c.w * dpr);
    c.el.height = Math.round(c.h * dpr);
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function line(ctx2: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string | CanvasGradient, width = 1, alpha = 1) {
    ctx2.globalAlpha = alpha;
    ctx2.strokeStyle = color;
    ctx2.lineWidth = width;
    ctx2.beginPath();
    ctx2.moveTo(x1, y1);
    ctx2.lineTo(x2, y2);
    ctx2.stroke();
    ctx2.globalAlpha = 1;
  }
  function dot(ctx2: CanvasRenderingContext2D, x: number, y: number, r: number, color: string | CanvasGradient, alpha = 1) {
    ctx2.globalAlpha = alpha;
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, TAU);
    ctx2.fill();
    ctx2.globalAlpha = 1;
  }
  function marker(x: number, y: number, radius: number, color: string, alpha = 1) {
    if (linework === 'original') { dot(ctx!, x, y, radius, color, alpha); return; }
    ctx!.globalAlpha = alpha;
    if (linework === 'technical') {
      ctx!.fillStyle = color;
      ctx!.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
      ctx!.beginPath(); ctx!.arc(x, y, radius, 0, TAU);
      ctx!.fillStyle = palette.void;
      ctx!.fill();
      ctx!.strokeStyle = color;
      ctx!.lineWidth = .8;
      ctx!.stroke();
    }
    ctx!.globalAlpha = 1;
  }
  function clear(c: CanvasScene) {
    c.ctx.clearRect(0, 0, c.w, c.h);
  }
  function project(a: number, r = 1, z = 0) {
    const { scale, centerX, centerY } = framing;
    return projectOrbitPoint(rotateOrbitPoint({ x: Math.cos(a) * r, y: Math.sin(a) * r, z }), scale, centerX, centerY);
  }
  function network() {
    const c = canvases.network, { ctx: ctx2 } = c;
    clear(c);
    const original = linework === 'original', paper = linework === 'paper', technical = linework === 'technical';
    ctx2.lineCap = original || technical ? 'butt' : 'round';
    ctx2.lineJoin = original || technical ? 'miter' : 'round';
    ctx2.setLineDash([]);
    ctx2.lineDashOffset = 0;
    const buckets: Layer[][] = Array.from({ length: 80 }, () => []), offset = orbit;
    function add(item: Layer, depth: number) {
      buckets[Math.max(0, Math.min(79, Math.floor((depth + 1.5) / 3 * 80)))].push(item);
    }
    const horizon = Array.from({ length: 101 }, (_, i) => project(i / 100 * TAU, 0.46, -0.06));
    add({ kind: "void", points: horizon }, -0.04);
    edges.forEach((e, index) => {
      const pts = paths[index].map((p) => project(p.a + offset, p.r, p.z));
      let distance = 0;
      for (let i = 1; i < pts.length; i++) {
        add({ kind: "line", p: pts[i - 1], q: pts[i], color: e.color, distance }, (pts[i - 1].depth + pts[i].depth) / 2 + 7e-3);
        distance += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      }
      if (index % 3 === 0) {
        const t = (time * e.speed + e.phase / TAU) % 1, p3 = edgePoint(e, t), p = project(p3.a + offset, p3.r, p3.z);
        add({ kind: "particle", p, color: e.color }, p.depth + 0.012);
      }
    });
    projected = nodes.map((n) => project(n.a + offset, n.r, n.z));
    nodes.forEach((n, i) => {
      const emission = emissions[i], pulse = (time * emission.rate + emission.phase) % 1, breath = 1 + 0.18 * Math.sin(time * 1.7 + n.a * 5), p = projected[i], q = project(n.a + offset, n.r + n.length * breath, n.z * 1.1);
      add({ kind: "spike", p, q, i, pulse }, (p.depth + q.depth) / 2);
    });
    const lineColors = [palette['line-primary'], palette['line-secondary'], palette['line-tertiary']];
    const particleColors = [palette['particle-primary'], palette['particle-secondary'], palette['particle-tertiary']];
    for (const bucket of buckets) for (const item of bucket) {
      if (item.kind === "void") {
        ctx2.beginPath();
        item.points.forEach((p2, i) => i ? ctx2.lineTo(p2.x, p2.y) : ctx2.moveTo(p2.x, p2.y));
        ctx2.closePath();
        ctx2.fillStyle = palette.void;
        ctx2.fill();
        continue;
      }
      const p = item.p, near = Math.max(0, Math.min(1, (p.depth + 1) / 2));
      if (item.kind === "line") {
        // Keep the same projected segments and depth order; dash phase follows the whole curve.
        if (technical && item.color !== 1) {
          ctx2.setLineDash([4, 5]); ctx2.lineDashOffset = -item.distance;
        }
        const width = original ? .35 + near * .65 : paper ? .45 + near * .65 : .55 + near * .95;
        const alpha = original ? .07 + near * near * .57 : paper ? .05 + near * near * .48 : .08 + near * near * .55;
        line(ctx2, p.x, p.y, item.q.x, item.q.y, lineColors[item.color], width, alpha);
        if (technical) { ctx2.setLineDash([]); ctx2.lineDashOffset = 0; }
      } else if (item.kind === "spike") {
        const q = item.q, bright = near > 0.48, color = palette[bright ? 'trail-near' : 'trail-far'], dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        if (technical) ctx2.setLineDash([2, 3]);
        line(ctx2, p.x, p.y, q.x, q.y, palette[bright ? 'spike-near' : 'spike-far'], original ? .4 + near * .4 : paper ? .5 : .7, bright ? .16 + near * .35 : .12 + near * .3);
        if (technical) ctx2.setLineDash([]);
        const t = item.pulse, fade = Math.sin(Math.PI * t), alpha = fade * (0.25 + near * 0.75), x = p.x + dx * t, y = p.y + dy * t, tail = Math.max(0, t - 0.38), tx = p.x + dx * tail, ty = p.y + dy * tail;
        if (original) {
          const trail = ctx2.createLinearGradient(tx, ty, x + 1e-3, y + 1e-3);
          trail.addColorStop(0, fadeColors[bright ? 'near' : 'far']);
          trail.addColorStop(1, color);
          line(ctx2, tx, ty, x, y, trail, .7 + near * .9, alpha);
        } else {
          if (technical) ctx2.setLineDash([2, 2]);
          line(ctx2, tx, ty, x, y, color, paper ? .65 + near * .65 : 1 + near * .8, alpha);
          if (technical) ctx2.setLineDash([]);
        }
        const size = (1.6 + near * 1.5) * q.perspective;
        ctx2.globalAlpha = alpha;
        ctx2.strokeStyle = color;
        ctx2.lineWidth = original ? .65 + near * .5 : paper ? .8 : 1.1;
        ctx2.beginPath();
        ctx2.moveTo(x - ux * size - uy * size * 0.55, y - uy * size + ux * size * 0.55);
        ctx2.lineTo(x, y);
        ctx2.lineTo(x - ux * size + uy * size * 0.55, y - uy * size - ux * size * 0.55);
        ctx2.stroke();
        ctx2.globalAlpha = 1;
        if (item.i % 3 === 0) {
          if (original) {
            const radius = (4 + near * 4) * q.perspective, glow = ctx2.createRadialGradient(x, y, 0, x, y, radius);
            glow.addColorStop(0, color);
            glow.addColorStop(1, fadeColors[bright ? 'near' : 'far']);
            dot(ctx2, x, y, radius, glow, alpha * .45);
          }
          dot(ctx2, x, y, 0.65 + near * 0.45, palette.spark, alpha);
        }
        const flash = Math.pow(Math.max(0, 1 - Math.abs(t - 0.88) / 0.12), 2);
        dot(ctx2, q.x, q.y, (0.55 + flash * 1.1) * q.perspective, color, 0.18 + near * 0.25 + flash * 0.35);
      } else {
        ctx2.shadowBlur = original ? 5 : 0;
        ctx2.shadowColor = particleColors[item.color];
        marker(p.x, p.y, 1.1 * p.perspective, particleColors[item.color]);
        ctx2.shadowBlur = 0;
      }
    }
    for (let i = 0; i < 8; i++) {
      const e = edges[i * 19], v = edgePoint(e, 0.4), p = project(v.a + offset, v.r, v.z);
      if (p.depth < -0.1) continue;
      ctx2.shadowColor = palette['highlight-glow'];
      ctx2.shadowBlur = original ? 10 : 0;
      marker(p.x, p.y, 2.2 * p.perspective, palette.highlight);
      ctx2.shadowBlur = 0;
    }
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia?.('(max-width: 760px)');
  function draw() {
    const { w, h } = canvases.network;
    if (!w || !h) return;
    let rendered = false;
    if (linework !== 'original') {
      const kind = linework;
      if (!artworks.has(kind) && !loading.has(kind) && !failed.has(kind) && window.WebGL2RenderingContext) {
        loading.add(kind);
        const load = kind === 'donut'
          ? import('./orbitDonutThree').then(module => () => module.createDonutArtwork(sync))
          : import('./orbitObjectsThree').then(module => () => module.createOrbitObject(kind, sync));
        load.then(create => {
          loading.delete(kind);
          if (disposed || linework !== kind) return;
          const artwork = create();
          artworks.set(kind, artwork);
          canvas.after(artwork.canvas);
          sync();
        }).catch(() => { loading.delete(kind); failed.add(kind); });
      }
      try { rendered = artworks.get(kind)?.draw(w, h, time) ?? false; }
      catch { artworks.get(kind)?.dispose(); artworks.delete(kind); failed.add(kind); }
      if (!rendered) {
        if (kind === 'donut') (drawDonut ??= createOrbitDonut())(ctx!, w, h, time, palette['line-primary']);
        else drawOrbitObject(ctx!, w, h, time, kind);
      }
    } else network();
    // Keep the measured 2D canvas in layout while the optional WebGL painter covers it.
    canvas.toggleAttribute('data-orbit-covered', rendered);
    for (const [kind, artwork] of artworks) artwork.canvas.hidden = kind !== linework || !rendered;
  }
  function state(): OrbitState {
    if (manualReduced || reduced?.matches || canvas.closest('[data-rhine-motion="reduced"]')) return 'reduced';
    if (compact?.matches && linework === 'original') return 'compact';
    if (document.hidden) return 'hidden';
    if (!visible) return 'offscreen';
    if (canvases.network.w <= 0 || canvases.network.h <= 0) return 'empty';
    return paused ? 'paused' : 'playing';
  }
  function animate(now: number) {
    frame = 0;
    if (disposed) return;
    // A frame can observe a media change before its change event is delivered.
    if (state() !== 'playing') { sync(); return; }
    const dt = last === null ? 0 : Math.min((now - last) / 1e3, 0.1);
    last = now;
    time += dt;
    orbit += dt * 0.028;
    draw();
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    last = null;
    readPalette();
    resize();
    const next = state();
    if (next !== previousState) { previousState = next; onState(next); }
    if (next === 'playing') frame = requestAnimationFrame(animate);
  }
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
  observer?.observe(canvas);
  const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.target === canvas && entry.isIntersecting);
    sync();
  });
  intersection?.observe(canvas);
  const appearance = new MutationObserver(sync);
  // CSS-only roots can switch classes or custom properties without a ThemeProvider.
  // Excluding canvas sizing and React state attributes prevents redraw loops.
  for (let ancestor: HTMLElement | null = canvas; ancestor; ancestor = ancestor.parentElement) {
    appearance.observe(ancestor, { attributes: true, attributeFilter: ['data-rhine-motion', 'data-rhine-theme', 'data-rhine-orbit-appearance', 'class', 'style'] });
  }
  reduced?.addEventListener?.('change', sync);
  compact?.addEventListener?.('change', sync);
  window.addEventListener('resize', sync);
  document.addEventListener("visibilitychange", sync);
  sync();
  return {
    setPaused(value) {
      if (paused === value) return;
      paused = value;
      sync();
    },
    setReducedMotion(value) {
      if (manualReduced === value) return;
      manualReduced = value;
      sync();
    },
    dispose() {
      disposed = true;
      for (const artwork of artworks.values()) artwork.dispose();
      artworks.clear(); canvas.removeAttribute('data-orbit-covered');
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      appearance.disconnect();
      reduced?.removeEventListener?.('change', sync);
      compact?.removeEventListener?.('change', sync);
      window.removeEventListener('resize', sync);
      document.removeEventListener("visibilitychange", sync);
    }
  };
}
