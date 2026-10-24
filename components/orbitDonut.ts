import { orbitCameraDistance, orbitFraming, projectOrbitPoint, rotateOrbitPoint, type OrbitVector as Vec3 } from './orbitProjection';

type Vertex = { position: Vec3; normal: Vec3 };
type Face = { points: Vertex[]; icing: boolean };
type Stroke = { points: Vertex[]; color?: string; width: number };

const TAU = Math.PI * 2;
// Match the original ring's ~1.2 outer envelope and ~.46 opening in scene units.
export const orbitDonutShape = { ringRadius: .84, tubeRadius: .34, icingThickness: .022 };
const { ringRadius, tubeRadius, icingThickness } = orbitDonutShape;
const sugarColors = ['#fff8e8', '#ffd44b', '#36735c', '#e54c77'];
const glazeShades = [[210, 75, 116], [242, 126, 165], [255, 181, 208]];
const doughShades = [[177, 96, 48], [224, 154, 83], [249, 197, 128]];

function shade(light: number, icing: boolean) {
  const ramp = icing ? glazeShades : doughShades, t = Math.max(0, Math.min(1.99, (light + .2) * 1.65));
  const index = Math.floor(t), blend = t - index;
  return `rgb(${ramp[index].map((channel, i) => Math.round(channel + (ramp[index + 1][i] - channel) * blend)).join(',')})`;
}

function surface(a: number, b: number, icing = false): Vertex {
  const radius = tubeRadius + (icing ? icingThickness : 0);
  return {
    position: { x: (ringRadius + radius * Math.cos(b)) * Math.cos(a), y: (ringRadius + radius * Math.cos(b)) * Math.sin(a), z: radius * Math.sin(b) },
    normal: { x: Math.cos(b) * Math.cos(a), y: Math.cos(b) * Math.sin(a), z: Math.sin(b) },
  };
}

function icingEdge(a: number, inner = false) {
  const drip = Math.pow((1 + Math.sin(a * (inner ? 7 : 11) + .8 * Math.sin(a * 3))) / 2, 5);
  return inner ? Math.PI - .12 + drip * .4 : .18 - drip * .65;
}

/** A small painted torus; the Orbit lifecycle owns its clock, pause and cleanup. */
export function createOrbitDonut() {
  const faces: Face[] = [], details: Stroke[] = [];
  const rings = 128;
  for (const icing of [false, true]) {
    const slices = icing ? 20 : 24;
    const point = (i: number, j: number) => {
      const a = i / rings * TAU;
      const b = icing ? icingEdge(a) + (icingEdge(a, true) - icingEdge(a)) * j / slices : j / slices * TAU;
      return surface(a, b, icing);
    };
    for (let i = 0; i < rings; i++) for (let j = 0; j < slices; j++) {
      faces.push({ icing, points: [point(i, j), point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)] });
    }
  }
  for (const inner of [false, true]) for (let i = 0; i < rings; i++) {
    const a = i / rings * TAU, next = (i + 1) / rings * TAU;
    details.push({ points: [surface(a, icingEdge(a, inner), true), surface(next, icingEdge(next, inner), true)], width: 2.2 });
  }
  let seed = 57;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Decorations are attached to the icing, so they rotate with the dough rather than over it.
  for (let i = 0; i < 72; i++) {
    const a = (i + random() * .65) / 72 * TAU, b = .35 + random() * 2.35, angle = random() * TAU;
    const da = Math.cos(angle) * .045, db = Math.sin(angle) * .12;
    details.push({ points: [surface(a - da, b - db, true), surface(a + da, b + db, true)], color: sugarColors[i % sugarColors.length], width: 3.3 });
  }
  // Short, uneven glaze highlights give the pink surface a soft, hand-painted finish.
  for (const start of [.1, 2.4, 4.2]) {
    details.push({ points: Array.from({ length: 15 }, (_, i) => surface(start + i * .025, .95, true)), color: '#ffe0eb', width: 3.6 });
  }

  return (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, ink: string) => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.shadowBlur = 0; ctx.setLineDash([]); ctx.lineDashOffset = 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const { scale, centerX: cx, centerY: cy } = orbitFraming(width, height);
    // Match the original orbit's camera: only the donut's local ring rotation advances.
    const spin = time * .28 - .35, cos = Math.cos(spin), sin = Math.sin(spin);
    const rotate = (p: Vec3) => rotateOrbitPoint({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos, z: p.z });
    const project = (p: Vec3) => projectOrbitPoint(p, scale, cx, cy);
    const facing = (p: Vec3, n: Vec3) => n.z * (orbitCameraDistance - p.z) - n.x * p.x - n.y * p.y;
    const path = (points: Vec3[]) => {
      ctx.beginPath();
      points.forEach((p, i) => { const v = project(p); if (i) ctx.lineTo(v.x, v.y); else ctx.moveTo(v.x, v.y); });
    };
    // A crisp offset shadow belongs to the same chunky illustration language as the host.
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * TAU, x = cx + Math.cos(a) * scale * 1.03 + 9, y = cy + scale * 1.45 + Math.sin(a) * scale * .12;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.fillStyle = '#e5c8b9'; ctx.fill();

    type Layer = { points: Vec3[]; depth: number; order: number; color: string; width?: number; outline?: boolean };
    const layers: Layer[] = [];
    for (const face of faces) {
      const normals = face.points.map(p => rotate(p.normal));
      const normal = normals.reduce((sum, n) => ({ x: sum.x + n.x / 4, y: sum.y + n.y / 4, z: sum.z + n.z / 4 }), { x: 0, y: 0, z: 0 });
      const points = face.points.map(p => rotate(p.position));
      const center = points.reduce((sum, p) => ({ x: sum.x + p.x / 4, y: sum.y + p.y / 4, z: sum.z + p.z / 4 }), { x: 0, y: 0, z: 0 });
      if (facing(center, normal) <= 0) continue;
      const light = -normal.x * .35 - normal.y * .45 + normal.z * .82;
      layers.push({ points, depth: points.reduce((sum, p) => sum + p.z / 4, 0), order: face.icing ? 1 : 0, color: shade(light, face.icing) });
    }
    for (const detail of details) {
      if (detail.points.some(p => facing(rotate(p.position), rotate(p.normal)) < .08)) continue;
      const points = detail.points.map(p => rotate(p.position));
      layers.push({ points, depth: points.reduce((sum, p) => sum + p.z / points.length, 0), order: 2,
        color: detail.color ?? ink, width: detail.width, outline: !!detail.color && detail.color !== '#ffe0eb' });
    }
    // The visible tube contours include the inner hole; draw only their silhouette, not a mesh.
    for (const inner of [false, true]) for (let i = 0; i < rings; i++) {
      const contour = (a: number) => {
        const radial = rotate({ x: Math.cos(a), y: Math.sin(a), z: 0 }), axis = rotate({ x: 0, y: 0, z: 1 });
        const towardRing = orbitCameraDistance * radial.z - ringRadius, towardAxis = orbitCameraDistance * axis.z;
        const phase = Math.atan2(towardRing, towardAxis), tangent = Math.asin(tubeRadius / Math.hypot(towardRing, towardAxis));
        const b = (inner ? Math.PI - tangent : tangent) - phase;
        const icing = b >= icingEdge(a) && b <= icingEdge(a, true);
        return rotate(surface(a, b, icing).position);
      };
      const points = [contour(i / rings * TAU), contour((i + 1) / rings * TAU)];
      layers.push({ points, depth: (points[0].z + points[1].z) / 2, order: 2, color: ink, width: 3 });
    }
    // The glaze is a coating, not intersecting geometry: paint its visible shell over the dough.
    layers.sort((a, b) => a.order - b.order || a.depth - b.depth);
    const strokeScale = Math.max(.7, Math.min(1.4, scale / 130));
    for (const layer of layers) {
      path(layer.points);
      if (layer.width) {
        if (layer.outline) { ctx.strokeStyle = ink; ctx.lineWidth = (layer.width + 1.7) * strokeScale; ctx.stroke(); }
        ctx.strokeStyle = layer.color; ctx.lineWidth = layer.width * strokeScale; ctx.stroke();
      } else {
        ctx.closePath(); ctx.fillStyle = layer.color; ctx.fill();
        ctx.strokeStyle = layer.color; ctx.lineWidth = .65; ctx.stroke();
      }
    }
    ctx.restore();
  };
}
