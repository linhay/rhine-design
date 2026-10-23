type Point = { x: number; y: number; depth: number; perspective: number };
type Edge = { a: number; sweep: number; phase: number; waist: number; lift: number; color: number; speed: number };
type Layer =
  | { kind: 'void'; points: Point[] }
  | { kind: 'line'; p: Point; q: Point; color: number }
  | { kind: 'particle'; p: Point; color: number }
  | { kind: 'spike'; p: Point; q: Point; i: number; pulse: number };
type CanvasScene = { el: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };
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
  const TAU = Math.PI * 2, colors = ["#51b7f6", "#e5b94d", "#2ec7a1", "#bdcbe1"];
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
  let time = 0, orbit = 0, projected: Point[] = [], last: number | null = null, frame = 0;
  const yaw = -0.72, tilt = 0.22;
  let paused = false, manualReduced = false, disposed = false, visible = true;
  let previousState: OrbitState | undefined;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Keep layout state explicit so production tree shaking retains the renderer.
    const c = canvases.network;
    const r = c.el.getBoundingClientRect();
    c.w = r.width;
    c.h = r.height;
    c.el.width = Math.round(r.width * dpr);
    c.el.height = Math.round(r.height * dpr);
    c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function line(ctx2: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string | CanvasGradient, width = 1) {
    ctx2.strokeStyle = color;
    ctx2.lineWidth = width;
    ctx2.beginPath();
    ctx2.moveTo(x1, y1);
    ctx2.lineTo(x2, y2);
    ctx2.stroke();
  }
  function dot(ctx2: CanvasRenderingContext2D, x: number, y: number, r: number, color: string | CanvasGradient) {
    ctx2.fillStyle = color;
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, TAU);
    ctx2.fill();
  }
  function clear(c: CanvasScene) {
    c.ctx.clearRect(0, 0, c.w, c.h);
  }
  function project(a: number, r = 1, z = 0) {
    const c = canvases.network, scale = Math.min(c.w * 0.66, c.h * 0.39), x = Math.cos(a) * r, y = Math.sin(a) * r;
    const yy = y * Math.cos(tilt) - z * Math.sin(tilt), zz = y * Math.sin(tilt) + z * Math.cos(tilt);
    const xx = x * Math.cos(yaw) + zz * Math.sin(yaw), depth = -x * Math.sin(yaw) + zz * Math.cos(yaw);
    const spin = 0.34, px = xx * Math.cos(spin) - yy * Math.sin(spin), py = xx * Math.sin(spin) + yy * Math.cos(spin), perspective = 3.6 / (3.6 - depth);
    return { x: c.w * 0.62 + px * scale * perspective, y: c.h * 0.57 + py * scale * perspective * 1.08, depth, perspective };
  }
  function network() {
    const c = canvases.network, { ctx: ctx2 } = c;
    clear(c);
    const buckets: Layer[][] = Array.from({ length: 80 }, () => []), offset = orbit;
    function add(item: Layer, depth: number) {
      buckets[Math.max(0, Math.min(79, Math.floor((depth + 1.5) / 3 * 80)))].push(item);
    }
    const horizon = Array.from({ length: 101 }, (_, i) => project(i / 100 * TAU, 0.46, -0.06));
    add({ kind: "void", points: horizon }, -0.04);
    edges.forEach((e, index) => {
      const pts = paths[index].map((p) => project(p.a + offset, p.r, p.z));
      for (let i = 1; i < pts.length; i++) add({ kind: "line", p: pts[i - 1], q: pts[i], color: e.color }, (pts[i - 1].depth + pts[i].depth) / 2 + 7e-3);
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
    const palette = ["104,178,244", "223,187,92", "72,182,179"];
    for (const bucket of buckets) for (const item of bucket) {
      if (item.kind === "void") {
        ctx2.beginPath();
        item.points.forEach((p2, i) => i ? ctx2.lineTo(p2.x, p2.y) : ctx2.moveTo(p2.x, p2.y));
        ctx2.closePath();
        ctx2.fillStyle = "#010205";
        ctx2.fill();
        continue;
      }
      const p = item.p, near = Math.max(0, Math.min(1, (p.depth + 1) / 2));
      if (item.kind === "line") {
        ctx2.strokeStyle = "rgba(" + palette[item.color] + "," + (0.07 + near * near * 0.57) + ")";
        ctx2.lineWidth = 0.35 + near * 0.65;
        ctx2.beginPath();
        ctx2.moveTo(p.x, p.y);
        ctx2.lineTo(item.q.x, item.q.y);
        ctx2.stroke();
      } else if (item.kind === "spike") {
        const q = item.q, bright = near > 0.48, rgb = bright ? "173,218,255" : "225,161,71", dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        line(ctx2, p.x, p.y, q.x, q.y, bright ? "rgba(213,224,241," + (0.16 + near * 0.35) + ")" : "rgba(181,118,53," + (0.12 + near * 0.3) + ")", 0.4 + near * 0.4);
        const t = item.pulse, fade = Math.sin(Math.PI * t), alpha = fade * (0.25 + near * 0.75), x = p.x + dx * t, y = p.y + dy * t, tail = Math.max(0, t - 0.38), tx = p.x + dx * tail, ty = p.y + dy * tail;
        const trail = ctx2.createLinearGradient(tx, ty, x + 1e-3, y + 1e-3);
        trail.addColorStop(0, "rgba(" + rgb + ",0)");
        trail.addColorStop(1, "rgba(" + rgb + "," + alpha + ")");
        line(ctx2, tx, ty, x, y, trail, 0.7 + near * 0.9);
        const size = (1.6 + near * 1.5) * q.perspective;
        ctx2.strokeStyle = "rgba(" + rgb + "," + alpha + ")";
        ctx2.lineWidth = 0.65 + near * 0.5;
        ctx2.beginPath();
        ctx2.moveTo(x - ux * size - uy * size * 0.55, y - uy * size + ux * size * 0.55);
        ctx2.lineTo(x, y);
        ctx2.lineTo(x - ux * size + uy * size * 0.55, y - uy * size - ux * size * 0.55);
        ctx2.stroke();
        if (item.i % 3 === 0) {
          const radius = (4 + near * 4) * q.perspective, glow = ctx2.createRadialGradient(x, y, 0, x, y, radius);
          glow.addColorStop(0, "rgba(" + rgb + "," + alpha * 0.45 + ")");
          glow.addColorStop(1, "rgba(" + rgb + ",0)");
          dot(ctx2, x, y, radius, glow);
          dot(ctx2, x, y, 0.65 + near * 0.45, "rgba(242,247,255," + alpha + ")");
        }
        const flash = Math.pow(Math.max(0, 1 - Math.abs(t - 0.88) / 0.12), 2);
        dot(ctx2, q.x, q.y, (0.55 + flash * 1.1) * q.perspective, "rgba(" + rgb + "," + (0.18 + near * 0.25 + flash * 0.35) + ")");
      } else {
        ctx2.shadowBlur = 5;
        ctx2.shadowColor = colors[item.color];
        dot(ctx2, p.x, p.y, 1.1 * p.perspective, colors[item.color]);
        ctx2.shadowBlur = 0;
      }
    }
    for (let i = 0; i < 8; i++) {
      const e = edges[i * 19], v = edgePoint(e, 0.4), p = project(v.a + offset, v.r, v.z);
      if (p.depth < -0.1) continue;
      ctx2.shadowColor = "#f25380";
      ctx2.shadowBlur = 10;
      dot(ctx2, p.x, p.y, 2.2 * p.perspective, "#ff658c");
      ctx2.shadowBlur = 0;
    }
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia?.('(max-width: 760px)');
  function draw() {
    if (canvases.network.w && canvases.network.h) network();
  }
  function state(): OrbitState {
    if (manualReduced || reduced?.matches || canvas.closest('[data-rhine-motion="reduced"]')) return 'reduced';
    if (compact?.matches) return 'compact';
    if (document.hidden) return 'hidden';
    if (!visible) return 'offscreen';
    if (canvases.network.w <= 0 || canvases.network.h <= 0) return 'empty';
    return paused ? 'paused' : 'playing';
  }
  function animate(now: number) {
    frame = 0;
    if (disposed || state() !== 'playing') return;
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
  const motion = new MutationObserver(sync);
  // Observe ancestors only: canvas sizing and React state writes must not retrigger drawing.
  for (let ancestor = canvas.parentElement; ancestor; ancestor = ancestor.parentElement) {
    motion.observe(ancestor, { attributes: true, attributeFilter: ['data-rhine-motion'] });
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
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      motion.disconnect();
      reduced?.removeEventListener?.('change', sync);
      compact?.removeEventListener?.('change', sync);
      window.removeEventListener('resize', sync);
      document.removeEventListener("visibilitychange", sync);
    }
  };
}
