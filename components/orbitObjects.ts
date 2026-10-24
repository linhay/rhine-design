import { paperBirdFolds } from './orbitBirdGeometry';

const birdFolds = paperBirdFolds();
type Kind = 'paper' | 'technical';
type Point = { x: number; y: number; depth: number };

/** A lightweight object illustration remains available without WebGL. */
export function drawOrbitObject(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, kind: Kind) {
  const bird = kind === 'paper', scale = Math.min(width * (bird ? .215 : .28), Math.max(1, height - 76) * (bird ? .36 : .3));
  const angle = bird ? Math.sin(time * .23) * .18 - .65 : time * .11 - .32, roll = bird ? -.12 : .08, tilt = bird ? .53 : .13;
  const point = (x: number, y: number, z = 0): Point => {
    const xx = x * Math.cos(angle) + z * Math.sin(angle), zz = -x * Math.sin(angle) + z * Math.cos(angle);
    const yy = y * Math.cos(tilt) - zz * Math.sin(tilt), depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
    const p = 6 / (6 - depth);
    return { x: width * .54 + (xx * Math.cos(roll) - yy * Math.sin(roll)) * scale * p, y: height / 2 - 18 - (xx * Math.sin(roll) + yy * Math.cos(roll)) * scale * p, depth };
  };
  const path = (points: Point[], fill: string | null, stroke: string | null, lineWidth = 1) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  };
  const dot = (p: Point, radius: number, fill: string) => { ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
  ctx.clearRect(0, 0, width, height); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.setLineDash([]);
  ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineDashOffset = 0;
  if (bird) {
    const faces: {points:Point[];shade:string;depth:number}[]=[];
    const folded = (vertices:number[][], triangles:number[][]) => triangles.forEach((indices,i)=>{
      const points=indices.map(j=>point(vertices[j][0],vertices[j][1]-.16+Math.sin(time*.55)*.07,vertices[j][2]));
      faces.push({points,shade:['#f5f2e4','#d8e0d0','#fdfaf0','#bcccb9'][i%4],depth:points.reduce((n,p)=>n+p.depth,0)/points.length});
    });
    for (const fold of birdFolds) {
      const a = fold.wing * (.025 + Math.sin(time * .75) * .075);
      folded(fold.points.map(([x,y,z]) => [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z]),fold.faces);
    }
    faces.sort((a,b)=>a.depth-b.depth).forEach(face=>path([...face.points,face.points[0]],face.shade,'#8a9b8138',.55));
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
    dot(point(Math.cos(a) * radius, Math.sin(a * 1.7) * 1.4, Math.sin(a) * .7), .5 + i % 4 * .35, bird ? '#b8a07180' : '#e9b258a0');
  }
}
