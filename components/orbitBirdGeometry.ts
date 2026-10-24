type Vertex = [number, number, number];
export type PaperFold = { name: string; points: Vertex[]; faces: number[][]; wing: -1 | 0 | 1 };

/** Authored folds are shared by the WebGL sculpture and the Canvas fallback. */
export function paperBirdFolds(): PaperFold[] {
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
  foldedVolume('folded-body', [
    { center:[0,.035,.44], width:.065, height:.075 },
    { center:[0,.015,.21], width:.245, height:.19 },
    { center:[0,.025,-.13], width:.215, height:.18 },
    { center:[0,.065,-.46], width:.07, height:.085 },
  ]);
  foldedVolume('folded-neck-and-beak', [
    { center:[0,.06,.32], width:.085, height:.075 },
    { center:[0,.29,.43], width:.062, height:.052 },
    { center:[0,.62,.56], width:.042, height:.047 },
    { center:[0,.88,.69], width:.045, height:.055 },
    { center:[0,.93,.79], width:.052, height:.044 },
    { center:[0,.77,1.07], width:.002, height:.002 },
  ]);

  for (const direction of [-1,1] as const) {
    const wing = part('pleated-wing', direction), root: Vertex = [.13,.025,-.02];
    const contour: Vertex[] = [[.32,.08,.4],[.8,.23,.31],[1.38,.5,.07],[1.77,.76,-.19],[1.59,.67,-.41],[1.34,.5,-.58],[1.02,.34,-.68],[.61,.17,-.68],[.18,.035,-.52]];
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
    tail.faces=[[0,2,4],[2,1,4],[0,3,2],[2,3,1],[0,4,3],[3,4,1]];
  }
  for(const p of parts) if(p.wing) p.points=p.points.map(([x,y,z])=>[x*p.wing,y,z]);
  return parts;
}
