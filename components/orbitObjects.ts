type Kind = 'paper' | 'technical';
type Point = { x: number; y: number; depth: number };

/** A lightweight object illustration remains available without WebGL. */
export function drawOrbitObject(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, kind: Kind) {
  const lab = kind === 'paper', scale = Math.min(width * .28, Math.max(1, height - 76) * .3);
  const angle = time * (lab ? .13 : .11) - .32, roll = lab ? -.17 : .08;
  const point = (x: number, y: number, z = 0): Point => {
    const xx = x * Math.cos(angle) + z * Math.sin(angle), zz = -x * Math.sin(angle) + z * Math.cos(angle);
    const yy = y * Math.cos(.13) - zz * Math.sin(.13), depth = y * Math.sin(.13) + zz * Math.cos(.13);
    const p = 6 / (6 - depth);
    return { x: width * .54 + (xx * Math.cos(roll) - yy * Math.sin(roll)) * scale * p, y: height / 2 - 18 - (xx * Math.sin(roll) + yy * Math.cos(roll)) * scale * p, depth };
  };
  const path = (points: Point[], fill: string | null, stroke: string | null, lineWidth = 1) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  };
  const dot = (p: Point, radius: number, fill: string) => { ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  const ring = (radius: number, y: number) => Array.from({ length: 49 }, (_, i) => point(Math.cos(i / 48 * Math.PI * 2) * radius, y, Math.sin(i / 48 * Math.PI * 2) * radius));
  ctx.clearRect(0, 0, width, height); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.setLineDash([]);
  ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineDashOffset = 0;
  if (lab) {
    const wall = [...ring(.68, 1.05).slice(0, 25), ...ring(.68, -1.05).slice(0, 25).reverse()];
    path(wall, 'rgba(142,188,155,.13)', '#83a48c');
    for (const phase of [0, Math.PI]) {
      const strand = Array.from({ length: 81 }, (_, i) => { const a = i / 80 * Math.PI * 4 + phase - time * .24; return point(Math.cos(a) * .27, -.86 + i / 80 * 1.72, Math.sin(a) * .27); });
      path(strand, null, phase ? '#b89957' : '#567f50', Math.max(1, scale * .028));
    }
    for (let i = 0; i < 28; i++) {
      const a = i / 27 * Math.PI * 4 - time * .24, y = -.86 + i / 27 * 1.72;
      const p = point(Math.cos(a) * .27, y, Math.sin(a) * .27), q = point(-Math.cos(a) * .27, y, -Math.sin(a) * .27);
      path([p, q], null, '#a2b58c', 1); dot(p, Math.max(1.2, scale * .035), '#7b9c64');
    }
    for (let i = 0; i < 32; i++) {
      const a = i * 2.399 + time * .07, y = -1 + ((i * .618 + time * (.07 + i % 3 * .02)) % 1) * 2;
      dot(point(Math.cos(a) * .48, y, Math.sin(a) * .48), 1 + i % 3, 'rgba(210,241,211,.8)');
    }
    for (const y of [-1.17, 1.17]) {
      path([...ring(.74, y + .08), ...ring(.74, y - .08).reverse()], '#3c5c4c', '#b28b49');
      path(ring(.74, y + .08), null, '#b99b62', 2); path(ring(.74, y - .08), null, '#b99b62', 2);
    }
    for (const a of [.25, 2.35, 4.45]) path([point(Math.cos(a) * .7, -1.05, Math.sin(a) * .7), point(Math.cos(a) * .7, 1.05, Math.sin(a) * .7)], null, '#b19b6c', 1.4);
  } else {
    const shards = [{ x: 0, y: .04, z: 0, s: .88 }, { x: -.48, y: -.38, z: .12, s: .56 }, { x: .47, y: -.35, z: .13, s: .64 }, { x: -.18, y: -.58, z: -.42, s: .48 }, { x: .18, y: -.65, z: .48, s: .42 }];
    const faces: { points: Point[]; shade: string; depth: number }[] = [];
    shards.forEach((shard, n) => {
      const p = (a: number, y: number, r: number) => point(shard.x + Math.cos(a) * r * shard.s, shard.y + y * shard.s, shard.z + Math.sin(a) * r * shard.s);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6 + n * .13) * Math.PI * 2, b = a + Math.PI / 3;
        const base = [p(a, -.8, .27), p(a, .65, .37), p(b, .65, .37), p(b, -.8, .27)];
        const tip = [p(a, .65, .37), p(0, 1.5, 0), p(b, .65, .37)];
        for (const points of [base, tip]) faces.push({ points, shade: ['#223532', '#344a43', '#1d292a'][i % 3], depth: points.reduce((sum, v) => sum + v.depth, 0) / points.length });
      }
    });
    faces.sort((a, b) => a.depth - b.depth).forEach(face => path([...face.points, face.points[0]], face.shade, '#9b804f', .8));
    for (let i = 0; i < 9; i++) {
      const x = (i % 3 - 1) * .22, y = -.85 + Math.floor(i / 3) * .5;
      path([point(x, y, .38), point(x + .06, y + .22, .38), point(x + .02, y + .32, .38)], null, '#edb355', 1.5);
    }
  }
  for (let i = 0; i < 84; i++) {
    const a = i * 2.399 + time * .04, radius = .9 + i % 11 * .1;
    dot(point(Math.cos(a) * radius, Math.sin(a * 1.7) * 1.4, Math.sin(a) * .7), .5 + i % 4 * .35, lab ? '#b8a07180' : '#e9b258a0');
  }
}
