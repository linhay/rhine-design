import { paperEase } from './orbitBirdFlight';

type Vertex = [number, number, number];
export type PaperFold = { name: string; points: Vertex[]; faces: number[][]; wing: -1 | 0 | 1 };

/** Authored folds are shared by the WebGL sculpture and the Canvas fallback. */
export function paperBirdFolds(form: 'bird' | 'butterfly' = 'bird'): PaperFold[] {
  const butterfly = form === 'butterfly';
  const parts: PaperFold[] = [];
  const part = (name: string, wing: -1 | 0 | 1 = 0): PaperFold => {
    const value = { name, points: [] as Vertex[], faces: [] as number[][], wing };
    parts.push(value); return value;
  };
  const mix = (a: Vertex, b: Vertex, t: number): Vertex => a.map((v, i) => v + (b[i] - v) * t) as Vertex;
  function foldedVolume(name: string, rings: Array<{ center: Vertex; width: number; height: number }>) {
    const p = part(name), sides = 8;
    for (const ring of rings) for (let j = 0; j < sides; j++) {
      const a = j / sides * Math.PI * 2;
      p.points.push([ring.center[0] + Math.cos(a) * ring.width, ring.center[1] + Math.sin(a) * ring.height, ring.center[2]]);
    }
    for (let r = 0; r < rings.length - 1; r++) for (let j = 0; j < sides; j++) {
      const a = r * sides + j, b = r * sides + (j + 1) % sides, c = b + sides, d = a + sides;
      const center = mix(mix(p.points[a], p.points[c], .5), mix(p.points[b], p.points[d], .5), .5);
      // A shallow raised diamond gives each panel a real mountain fold.
      const angle = (j + .5) / sides * Math.PI * 2;
      center[0] += Math.cos(angle) * .009; center[1] += Math.sin(angle) * .009;
      const m = p.points.push(center) - 1;
      p.faces.push([a,b,m],[b,c,m],[c,d,m],[d,a,m]);
    }
    for (const end of [0, rings.length - 1]) {
      const m = p.points.push(rings[end].center) - 1, start = end * sides;
      for (let j = 0; j < sides; j++) p.faces.push([m,start+j,start+(j+1)%sides]);
    }
  }
  foldedVolume('folded-body', butterfly ? [
    { center:[0,.035,.44], width:.065, height:.065 },
    { center:[0,.015,.21], width:.09, height:.09 },
    { center:[0,.025,-.13], width:.07, height:.07 },
    { center:[0,.065,-.63], width:.018, height:.025 },
  ] : [
    { center:[0,.035,.44], width:.065, height:.075 },
    { center:[0,.015,.21], width:.245, height:.19 },
    { center:[0,.025,-.13], width:.215, height:.18 },
    { center:[0,.065,-.46], width:.07, height:.085 },
  ]);
  foldedVolume('folded-neck-and-beak', butterfly ? [
    { center:[0,.06,.32], width:.065, height:.065 },
    { center:[0,.07,.4], width:.075, height:.07 },
    { center:[0,.08,.47], width:.085, height:.075 },
    { center:[0,.075,.53], width:.065, height:.06 },
    { center:[0,.06,.57], width:.04, height:.04 },
    { center:[0,.055,.59], width:.015, height:.015 },
  ] : [
    { center:[0,.06,.32], width:.085, height:.075 },
    { center:[0,.29,.43], width:.062, height:.052 },
    { center:[0,.62,.56], width:.042, height:.047 },
    { center:[0,.88,.69], width:.045, height:.055 },
    { center:[0,.93,.79], width:.052, height:.044 },
    { center:[0,.77,1.07], width:.002, height:.002 },
  ]);

  for (const direction of [-1,1] as const) {
    const wing = part('pleated-wing', direction), root: Vertex = [.13,.025,-.02];
    const contour: Vertex[] = butterfly
      ? [[.28,.08,.48],[.83,.18,1.03],[1.48,.26,.86],[1.4,.19,.22],[.52,.07,-.07],[1.21,.18,-.47],[1.03,.14,-1.02],[.55,.08,-1.08],[.15,.035,-.48]]
      : [[.32,.08,.4],[.8,.23,.31],[1.38,.5,.07],[1.77,.76,-.19],[1.59,.67,-.41],[1.34,.5,-.58],[1.02,.34,-.68],[.61,.17,-.68],[.18,.035,-.52]];
    for (let i = 0; i < contour.length - 1; i++) {
      const start = wing.points.length; wing.points.push(root);
      for (const t of [.28,.62,1]) {
        const left = mix(root, contour[i], t), right = mix(root, contour[i+1], t), ridge = mix(left, right, .5);
        ridge[1] += Math.sin(t * Math.PI * .8) * (.034 + i * .003);
        wing.points.push(left,ridge,right);
      }
      wing.faces.push([start,start+1,start+2],[start,start+2,start+3]);
      for (let row = 0; row < 2; row++) {
        const a=start+1+row*3,b=a+3;
        wing.faces.push([a,b,b+1],[a,b+1,a+1],[a+1,b+1,b+2],[a+1,b+2,a+2]);
      }
    }
    // Separate folded vanes overlap the fan along its trailing edge.
    for (let i = 3; i < contour.length - 1; i++) {
      const vane = part('layered-wing-fold', direction);
      const a: Vertex = [.23+i*.014,.005,-.16-i*.022];
      const tip = contour[i].map((v,j) => v + (j===1 ? -.035 : j===2 ? -.025 : .025)) as Vertex;
      const b = mix(a,tip,.4), c = mix(a,tip,.72);
      const width=.045+(7-i)*.005;
      vane.points=[a,[b[0],b[1]-.013,b[2]+width],[b[0],b[1]+.019,b[2]],[b[0],b[1]-.013,b[2]-width],
        [c[0],c[1]-.009,c[2]+width*.65],[c[0],c[1]+.024,c[2]],[c[0],c[1]-.009,c[2]-width*.65],tip];
      vane.faces=[[0,1,2],[0,2,3],[1,4,5],[1,5,2],[2,5,6],[2,6,3],[4,7,5],[5,7,6]];
    }
    const edge = part('folded-wing-edge',direction);
    contour.forEach(v=>edge.points.push(v,[v[0],v[1]-.014,v[2]+.008]));
    for(let i=0;i<contour.length-1;i++)edge.faces.push([i*2,i*2+2,i*2+3],[i*2,i*2+3,i*2+1]);
  }
  for (const offset of [-1,0,1]) {
    const tail = part('pointed-paper-tail');
    const tip:Vertex=[offset*.14,offset===0?.72:.54,offset===0?-1.15:-.98];
    tail.points=[[-.09,.055,-.3],[.09,.055,-.3],[offset*.04,.2,-.58],[offset*.05,.11,-.6],tip];
    if (butterfly) {
      const x = offset * .045, z = offset ? .53 : -.35;
      tail.points=[[x-.009,.06,z],[x+.009,.06,z],
        [offset*.15,.12,offset ? .82 : -.58],[offset*.15,.1,offset ? .82 : -.58],
        [offset*.28,offset ? .16 : .065,offset ? 1.04 : -.78]];
    }
    tail.faces=[[0,2,4],[2,1,4],[0,3,2],[2,3,1],[0,4,3],[3,4,1]];
  }
  for(const p of parts) if(p.wing) p.points=p.points.map(([x,y,z])=>[x*p.wing,y,z]);
  return parts;
}

/** Keep every vertex and face attached while the paper folds into its second form. */
export function morphPaperPoint(from: Vertex, to: Vertex, amount: number, wing: number, name: string): Vertex {
  if (amount <= 0) return [...from];
  if (amount >= 1) return [...to];
  // Shared coordinates determine the delay, so duplicated seam vertices never separate.
  const reach = Math.min(1, Math.abs(from[0]) / 1.8);
  const opening = wing ? paperEase(.18 + reach * .14, .32 + reach * .14, amount) : paperEase(.16, .43, amount);
  const closing = wing ? paperEase(.58 + reach * .12, .73 + reach * .12, amount) : paperEase(.58, .87, amount);
  const flat = opening * (1 - closing);
  const delay = wing ? reach * .1 : name === 'folded-neck-and-beak' ? -.07 : .035;
  const shape = .5 * paperEase(.13 + delay, .4 + delay, amount) + .5 * paperEase(.60 + delay, .86 + delay, amount);
  const p = from.map((v, i) => v + (to[i] - v) * shape) as Vertex;

  if (wing) {
    p[1] = p[1] * (1 - flat * .95) + .025 * flat * .95;
    // Release each hinge in turn; retain the outer fold until the inner paper has opened.
    const tuck = paperEase(0, .16, amount);
    const rootTuck = tuck * (1 - paperEase(.18, .31, amount));
    const innerTuck = tuck * (1 - paperEase(.24, .39, amount));
    const tipTuck = tuck * (1 - paperEase(.31, .46, amount));
    const rootFold = paperEase(.58, .70, amount) * (1 - paperEase(.82, .94, amount));
    const innerFold = paperEase(.64, .77, amount) * (1 - paperEase(.86, .98, amount));
    const tipFold = paperEase(.71, .84, amount) * (1 - paperEase(.90, 1, amount));
    let x = p[0] * wing, y = p[1];
    const hinge = (pivot: number, angle: number) => {
      if (x <= pivot) return;
      angle *= paperEase(pivot, pivot + .12, x);
      const dx = x - pivot, dy = y - .025;
      x = pivot + dx * Math.cos(angle) - dy * Math.sin(angle);
      y = .025 + dx * Math.sin(angle) + dy * Math.cos(angle);
    };
    hinge(1.02, -.95 * tipTuck - .75 * tipFold);
    hinge(.46, .4 * innerTuck + .55 * innerFold);
    const rootAngle = .35 * rootTuck + .38 * rootFold;
    const dx = x - .13, dy = y - .025;
    return [wing * (.13 + dx * Math.cos(rootAngle) - dy * Math.sin(rootAngle)),
      .025 + dx * Math.sin(rootAngle) + dy * Math.cos(rootAngle), p[2]];
  }

  // Let the neck and tail open around their roots instead of shrinking in place.
  const rootZ = name === 'folded-neck-and-beak' ? .32 : -.3;
  const foldAngle = (name === 'folded-neck-and-beak' ? -.85 : name === 'pointed-paper-tail' ? .65 : 0) * flat;
  const dy = p[1] - .035, dz = p[2] - rootZ;
  p[1] = .035 + (dy * Math.cos(foldAngle) - dz * Math.sin(foldAngle)) * (1 - flat * .8);
  p[2] = rootZ + dy * Math.sin(foldAngle) + dz * Math.cos(foldAngle);
  if (name === 'folded-body') p[0] *= 1 + flat * .7;
  return p;
}
