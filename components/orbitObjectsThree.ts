import {
  ACESFilmicToneMapping, AdditiveBlending, BufferGeometry, Color, DirectionalLight,
  DoubleSide, EdgesGeometry, Float32BufferAttribute, Group, HemisphereLight, InstancedMesh,
  LineBasicMaterial, LineSegments, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, NormalBlending, Object3D, OctahedronGeometry, PerspectiveCamera, PlaneGeometry,
  Points, Scene, ShaderMaterial, SRGBColorSpace, Texture, TorusGeometry, WebGLRenderer,
} from 'three';
import { paperTexture, mineralMaterial, studioEnvironment } from './orbitObjectMaterials';
import { morphPaperPoint, paperBirdFolds, type PaperFold } from './orbitBirdGeometry';
import { paperBirdFlight, paperMorphAmount } from './orbitBirdFlight';

export type OrbitObjectKind = 'paper' | 'technical';
export interface OrbitObjectArtwork {
  canvas: HTMLCanvasElement;
  draw(width: number, height: number, time: number): boolean;
  dispose(): void;
}

/** The host supplies elapsed visible time; a theme object never schedules its own frames. */
export function createOrbitObject(kind: OrbitObjectKind, invalidate: () => void): OrbitObjectArtwork {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), instances = new Set<InstancedMesh>(), textures = new Set<Texture>();
  const geometry = <T extends BufferGeometry>(value: T) => { geometries.add(value); return value; };
  const material = <T extends Material>(value: T) => { materials.add(value); return value; };
  const texture = <T extends Texture>(value: T) => { textures.add(value); return value; };
  const canvas = document.createElement('canvas');
  canvas.className = `rhine-orbit-canvas rhine-orbit-object-webgl rhine-orbit-${kind}-webgl`;
  canvas.setAttribute('aria-hidden', 'true'); canvas.dataset.orbitArtwork = kind;
  let renderer: WebGLRenderer | undefined, disposed = false, lost = false;
  function contextLost(event: Event) { event.preventDefault(); lost = true; invalidate(); }
  function contextRestored() { lost = false; invalidate(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
    instances.forEach(value => value.dispose()); geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
    renderer?.dispose(); renderer?.forceContextLoss(); canvas.remove();
  }
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    const bird = kind === 'paper', scene = new Scene(), camera = new PerspectiveCamera(35, 1, .1, 40);
    scene.environment = texture(studioEnvironment());
    scene.name = bird ? 'origami-paper-bird' : 'originium-cluster';
    scene.add(new HemisphereLight(bird ? '#f5fff1' : '#d8e4dc', bird ? '#42654d' : '#151c24', bird ? .9 : .65));
    const key = new DirectionalLight('#fff5da', 2.4); key.position.set(-3, 5, 4); scene.add(key);
    const rim = new DirectionalLight(bird ? '#b6e0c8' : '#ffa634', 2.8); rim.position.set(3, 1, -2); scene.add(rim);
    const fill = new DirectionalLight('#d4eeee', .7); fill.position.set(2, -2, 3); scene.add(fill);
    const frame = new Group(); frame.rotation.set(bird ? .53 : .13, bird ? -.65 : -.32, bird ? -.12 : .08); scene.add(frame);
    const object = new Group(); object.name = 'theme-object'; frame.add(object);
    const dummy = new Object3D();
    const updates: Array<(time: number) => void> = [];
    let seed = bird ? 70231 : 39017;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const mesh = (g: BufferGeometry, m: Material, parent = object) => { const value = new Mesh(g, m); parent.add(value); return value; };
    const instanced = (g: BufferGeometry, m: Material, count: number, name: string, parent = object) => {
      const value = new InstancedMesh(g, m, count); value.name = name; instances.add(value); parent.add(value); return value;
    };

    if (bird) {
      const grain = texture(paperTexture());
      const paper = material(new MeshPhysicalMaterial({ color: '#fffdf0', map: grain, bumpMap: grain, bumpScale: .008, roughness: .87, metalness: 0, side: DoubleSide }));
      const shadedPaper = material(new MeshStandardMaterial({ color: '#dce4d5', map: grain, bumpMap: grain, bumpScale: .006, roughness: .92, side: DoubleSide }));
      const innerPaper = material(new MeshStandardMaterial({ color: '#a7b9a7', map: grain, roughness: .93, side: DoubleSide }));
      const crease = material(new LineBasicMaterial({ color: '#6f8572', transparent: true, opacity: .13 }));
      function foldedSheet(fold: PaperFold, target: PaperFold, parent: Group) {
        const { points, faces, name } = fold;
        const positions: number[] = [], uvs: number[] = [];
        for (const face of faces) for (const i of face) { positions.push(...points[i]); uvs.push(points[i][0] * .5 + .5, points[i][2] * .5 + .5); }
        const g = geometry(new BufferGeometry()); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); g.computeVertexNormals();
        faces.forEach((_, i) => g.addGroup(i * 3, 3, i % 10 === 4 ? 2 : i % 4 === 2 ? 1 : 0));
        const sheet = new Mesh(g, [paper, shadedPaper, innerPaper]); sheet.name = name; parent.add(sheet);
        const edges = geometry(new EdgesGeometry(g, 8)), edgePositions = edges.getAttribute('position');
        const edgeIndices = Array.from({ length: edgePositions.count }, (_, i) => points.findIndex(p =>
          Math.abs(p[0] - edgePositions.getX(i)) < 1e-6 && Math.abs(p[1] - edgePositions.getY(i)) < 1e-6 && Math.abs(p[2] - edgePositions.getZ(i)) < 1e-6));
        const lines = new LineSegments(edges, crease); parent.add(lines);
        // Reuse the same buffers, materials and crease endpoints for the entire transformation.
        let previousAmount = -1;
        updates.push(time => {
          const amount = paperMorphAmount(time);
          if (amount === previousAmount) return;
          const vertices = points.map((p, i) => morphPaperPoint(p, target.points[i], amount, fold.wing, fold.name));
          const positions = g.getAttribute('position');
          faces.forEach((face, f) => face.forEach((index, v) => positions.setXYZ(f * 3 + v, ...vertices[index])));
          edgeIndices.forEach((index, i) => edgePositions.setXYZ(i, ...vertices[index]));
          positions.needsUpdate = true; edgePositions.needsUpdate = true;
          g.computeVertexNormals(); g.computeBoundingSphere(); edges.computeBoundingSphere();
          previousAmount = amount;
        });
        return sheet;
      }
      const wings = new Map<number, Group>();
      for (const direction of [-1, 1]) {
        const wing = new Group(); wing.name = direction < 0 ? 'paper-wing-left' : 'paper-wing-right'; object.add(wing); wings.set(direction, wing);
        updates.push(time => { wing.rotation.z = direction * paperBirdFlight(time).wing; });
      }
      const targets = paperBirdFolds('butterfly');
      paperBirdFolds().forEach((fold, i) => foldedSheet(fold, targets[i], fold.wing ? wings.get(fold.wing)! : object));
      const scraps = instanced(geometry(new PlaneGeometry(.035,.018)), shadedPaper, 42, 'floating-paper-flecks', frame);
      scraps.frustumCulled = false;
      const seeds = Array.from({length:scraps.count},()=>({a:random()*Math.PI*2,r:1.15+random()*.7,y:random()*2.1-1.05,s:.4+random()*.9}));
      updates.push(time=>{
        const flight = paperBirdFlight(time);
        object.position.set(flight.x, flight.y, flight.z);
        object.rotation.set(flight.pitch, flight.yaw, flight.bank);
        seeds.forEach((p,i)=>{const a=p.a+time*.06, wake=paperBirdFlight(time-i*.06);dummy.position.set(wake.x+Math.cos(a)*p.r*.65,wake.y+p.y*.7, wake.z- .25-i*.017+Math.sin(a)*p.r*.25);dummy.rotation.set(p.a+time*.16,a,time*.1+p.a);dummy.scale.setScalar(p.s);dummy.updateMatrix();scraps.setMatrixAt(i,dummy.matrix);});
        scraps.instanceMatrix.needsUpdate=true;
      });
    } else {
      function crystalGeometry() {
        const positions: number[] = [];
        const rings = [{ y: -1.03, r: .24 }, { y: -.78, r: .72 }, { y: .57, r: 1 }, { y: .72, r: .92 }, { y: 1.46, r: .06 }];
        const vertex = (i: number, level: number) => {
          const a = Math.floor(i / 2) * Math.PI / 3 + (i % 2 ? .055 : -.055);
          return [Math.cos(a) * rings[level].r, rings[level].y, Math.sin(a) * rings[level].r];
        };
        const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
        for (let i = 0; i < 12; i++) {
          const j = (i + 1) % 12;
          for (let level = 0; level < rings.length - 1; level++) {
            const p = vertex(i, level), q = vertex(j, level), r = vertex(i, level + 1), t = vertex(j, level + 1);
            triangle(p, r, q); triangle(q, r, t);
          }
          triangle(vertex(j, 0), [0, -1.1, 0], vertex(i, 0));
          triangle(vertex(i, 4), [0, 1.51, 0], vertex(j, 4));
        }
        const g = geometry(new BufferGeometry()); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.computeVertexNormals(); return g;
      }
      const crystal = crystalGeometry();
      const facetMaterial = material(mineralMaterial());
      const edgeMaterial = material(new LineBasicMaterial({ color: '#9e885b', transparent: true, opacity: .16 }));
      const edges = geometry(new EdgesGeometry(crystal, 25));
      const shards = [
        { x: 0, y: .04, z: 0, s: .88, rx: .04, rz: -.08 },
        { x: -.48, y: -.38, z: .12, s: .56, rx: .12, rz: .45 },
        { x: .47, y: -.35, z: .13, s: .64, rx: -.14, rz: -.4 },
        { x: -.18, y: -.58, z: -.42, s: .48, rx: -.4, rz: .15 },
        { x: .18, y: -.65, z: .48, s: .42, rx: .38, rz: -.1 },
      ];
      shards.forEach((p, i) => {
        const shard = new Group(); shard.name = `originium-facet-${i}`; shard.position.set(p.x, p.y, p.z); shard.rotation.set(p.rx, i * .8, p.rz); shard.scale.set(.37 * p.s, p.s, .37 * p.s); object.add(shard);
        mesh(crystal, facetMaterial, shard); shard.add(new LineSegments(edges, edgeMaterial));
      });
      const fragments = instanced(geometry(new OctahedronGeometry(.038, 0)), facetMaterial, 48, 'floating-fragments');
      // The shader and instanced particles move beyond their initial CPU coordinates.
      fragments.frustumCulled = false;
      const fragmentSeeds = Array.from({ length: fragments.count }, () => ({ phase: random() * Math.PI * 2, r: 1.02 + random() * .58, y: random() * 2.35 - 1.1, size: .28 + random() * 1.15, speed: .08 + random() * .08 }));
      updates.push(time => {
        fragmentSeeds.forEach((p, i) => {
          const a = p.phase + time * p.speed;
          dummy.position.set(Math.cos(a) * p.r, p.y + Math.sin(time * .4 + p.phase) * .12, Math.sin(a) * p.r * .5);
          dummy.rotation.set(a * .5, a, p.phase + time * .12); dummy.scale.set(.65 * p.size, 1.5 * p.size, p.size); dummy.updateMatrix(); fragments.setMatrixAt(i, dummy.matrix);
        }); fragments.instanceMatrix.needsUpdate = true;
      });
      const orbital = new Group(); orbital.name = 'containment-ring'; orbital.rotation.set(1.12, .35, -.2); scene.add(orbital);
      const line = material(new MeshBasicMaterial({ color: '#d9a151', transparent: true, opacity: .26 }));
      for (let i = 0; i < 8; i++) {
        const ring = mesh(geometry(new TorusGeometry(1.46, .003, 4, 32, .43)), line, orbital); ring.rotation.z = i / 8 * Math.PI * 2;
      }
      updates.push(time => { orbital.rotation.z = -.2 + time * .055; });
    }

    const particleCount = bird ? 120 : 420, positions: number[] = [], phases: number[] = [], sizes: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const a = random() * Math.PI * 2, r = .85 + random() * 1.25;
      positions.push(Math.cos(a) * r, random() * 2.9 - 1.45, Math.sin(a) * r * .55); phases.push(random() * Math.PI * 2); sizes.push(.8 + random() * 2.2);
    }
    const particleGeometry = geometry(new BufferGeometry()); particleGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('phase', new Float32BufferAttribute(phases, 1)); particleGeometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    particleGeometry.computeBoundingSphere(); particleGeometry.boundingSphere!.radius += .3;
    const particleMaterial = material(new ShaderMaterial({
      transparent: true, depthWrite: false, blending: bird ? NormalBlending : AdditiveBlending,
      uniforms: { time: { value: 0 }, pixelRatio: { value: 1 }, tint: { value: new Color(bird ? '#ad935d' : '#ffab39') } },
      vertexShader: `attribute float phase; attribute float size; uniform float time; uniform float pixelRatio; varying float alpha;
        void main(){vec3 p=position; p.x+=sin(time*.2+phase)*.08; p.y+=sin(time*.3+phase)*.14;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=size*pixelRatio*6./-mv.z;
          alpha=.35+.3*sin(time*.8+phase);}`,
      fragmentShader: `uniform vec3 tint; varying float alpha; void main(){float r=length(gl_PointCoord-.5)*2.;
        gl_FragColor=vec4(tint,(1.-smoothstep(.05,1.,r))*alpha);}`,
    }));
    const dust = new Points(particleGeometry, particleMaterial); dust.name = bird ? 'paper-motes' : 'crystal-embers'; scene.add(dust);
    const shadow = new Mesh(geometry(new PlaneGeometry(3.4, .65)), material(new ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv;void main(){float a=(1.-smoothstep(.05,1.,length((vUv-.5)*2.)))*.17;gl_FragColor=vec4(.15,.23,.19,a);}',
    }))); scene.add(shadow); shadow.position.set(.08, -1.52, -1);
    let lastWidth = 0, lastHeight = 0, lastRatio = 0;
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
    return {
      canvas,
      draw(width, height, time) {
        if (disposed || lost || width <= 0 || height <= 0) return false;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        if (width !== lastWidth || height !== lastHeight || ratio !== lastRatio) {
          renderer!.setPixelRatio(ratio); renderer!.setSize(width, height, false);
          const scale = Math.min(width * (bird ? .175 : .28), Math.max(1, height - 76) * (bird ? .285 : .3));
          camera.aspect = width / height; camera.position.set(0, 0, 6); camera.lookAt(0, 0, 0);
          camera.fov = 2 * Math.atan(height / (2 * scale * 6)) * 180 / Math.PI; camera.updateProjectionMatrix();
          camera.projectionMatrix.elements[8] = -.08; camera.projectionMatrix.elements[9] = -36 / height;
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
          particleMaterial.uniforms.pixelRatio.value = ratio; lastWidth = width; lastHeight = height; lastRatio = ratio;
        }
        if (!bird) object.rotation.y = time * .11;
        else {
          const flight = paperBirdFlight(time);
          shadow.position.x = .08 + flight.x * .7;
          shadow.scale.setScalar(1 - (flight.y + .3) * .18);
        }
        updates.forEach(update => update(time)); particleMaterial.uniforms.time.value = time;
        renderer!.render(scene, camera); return true;
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
