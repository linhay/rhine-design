import {
  ACESFilmicToneMapping, AdditiveBlending, BoxGeometry, BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, DirectionalLight,
  DoubleSide, EdgesGeometry, Float32BufferAttribute, Group, HemisphereLight, InstancedMesh,
  LineBasicMaterial, LineSegments, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, NormalBlending, Object3D, OctahedronGeometry, PerspectiveCamera, PlaneGeometry,
  Points, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Texture, TorusGeometry, TubeGeometry,
  Vector3, WebGLRenderer,
} from 'three';
import { chamberInscription, mineralMaterial, studioEnvironment } from './orbitObjectMaterials';

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
    const lab = kind === 'paper', scene = new Scene(), camera = new PerspectiveCamera(35, 1, .1, 40);
    scene.environment = texture(studioEnvironment());
    scene.name = lab ? 'glass-culture-chamber' : 'originium-cluster';
    scene.add(new HemisphereLight(lab ? '#f5fff1' : '#d8e4dc', lab ? '#42654d' : '#151c24', lab ? .9 : .65));
    const key = new DirectionalLight('#fff5da', 2.4); key.position.set(-3, 5, 4); scene.add(key);
    const rim = new DirectionalLight(lab ? '#b6e0c8' : '#ffa634', 2.8); rim.position.set(3, 1, -2); scene.add(rim);
    const fill = new DirectionalLight('#d4eeee', .7); fill.position.set(2, -2, 3); scene.add(fill);
    const frame = new Group(); frame.rotation.set(.13, -.32, lab ? -.17 : .08); scene.add(frame);
    const object = new Group(); object.name = 'theme-object'; frame.add(object);
    const dummy = new Object3D(), up = new Vector3(0, 1, 0);
    const updates: Array<(time: number) => void> = [];
    let seed = lab ? 70231 : 39017;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const mesh = (g: BufferGeometry, m: Material, parent = object) => { const value = new Mesh(g, m); parent.add(value); return value; };
    const instanced = (g: BufferGeometry, m: Material, count: number, name: string, parent = object) => {
      const value = new InstancedMesh(g, m, count); value.name = name; instances.add(value); parent.add(value); return value;
    };
    const brass = material(new MeshStandardMaterial({ color: lab ? '#9b9578' : '#8c6e43', metalness: .85, roughness: .27 }));
    const dark = material(new MeshStandardMaterial({ color: lab ? '#233d35' : '#172b2b', metalness: .64, roughness: .3 }));
    const luminous = material(new MeshStandardMaterial({ color: lab ? '#93bf88' : '#ffae37', emissive: lab ? '#467553' : '#f06a10', emissiveIntensity: lab ? .18 : 1.2, roughness: .24, metalness: .3 }));

    if (lab) {
      const glass = material(new MeshPhysicalMaterial({ color: '#c7dfd4', transparent: true, opacity: .19, metalness: .16, roughness: .08, clearcoat: 1, envMapIntensity: 1.8, side: DoubleSide, depthWrite: false }));
      const chamber = mesh(geometry(new CylinderGeometry(.68, .68, 2.12, 64, 1, true)), glass); chamber.name = 'glass-wall';
      const fluid = mesh(geometry(new CylinderGeometry(.601, .601, 1.2, 64)), material(new MeshPhysicalMaterial({ color: '#8dbb91', transparent: true, opacity: .12, roughness: .2, side: DoubleSide, depthWrite: false })));
      fluid.name = 'culture-fluid'; fluid.position.y = -.4;
      const capGeometry = geometry(new CylinderGeometry(.74, .74, .18, 64));
      const rimGeometry = geometry(new TorusGeometry(.735, .028, 8, 80));
      const gasketGeometry = geometry(new TorusGeometry(.68, .024, 8, 80));
      const black = material(new MeshStandardMaterial({ color: '#172622', metalness: .25, roughness: .6 }));
      const porcelain = material(new MeshPhysicalMaterial({ color: '#d5dcc7', metalness: .32, roughness: .28, clearcoat: .5 }));
      for (const direction of [-1, 1]) {
        const cap = mesh(capGeometry, dark); cap.position.y = direction * 1.15;
        const crown = mesh(geometry(new CylinderGeometry(.58, .7, .08, 64)), brass); crown.position.y = direction * 1.28;
        for (const y of [1.065, 1.235]) { const ring = mesh(rimGeometry, brass); ring.rotation.x = Math.PI / 2; ring.position.y = y * direction; }
        const seal = mesh(gasketGeometry, luminous); seal.rotation.x = Math.PI / 2; seal.position.y = direction * 1.025;
        for (const [radius, y, thickness, finish] of [[.69, 1.3, .045, black], [.59, 1.34, .045, porcelain], [.49, 1.37, .018, brass], [.17, 1.4, .05, dark]] as const) {
          const layer = mesh(geometry(new CylinderGeometry(radius, radius, thickness, 72)), finish); layer.position.y = direction * y;
        }
        for (const radius of [.23, .35, .46]) {
          const groove = mesh(geometry(new TorusGeometry(radius, .004, 5, 64)), dark); groove.rotation.x = Math.PI / 2; groove.position.y = direction * 1.37;
        }
      }
      const knurl = instanced(geometry(new BoxGeometry(.012, .065, .018)), brass, 192, 'machined-cap-grooves');
      for (let i = 0; i < knurl.count; i++) {
        const a = i % 96 / 96 * Math.PI * 2;
        dummy.position.set(Math.cos(a) * .74, i < 96 ? -1.15 : 1.15, Math.sin(a) * .74);
        dummy.rotation.set(0, -a, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); knurl.setMatrixAt(i, dummy.matrix);
      }
      const screws = instanced(geometry(new CylinderGeometry(.024, .024, .036, 6)), brass, 32, 'cap-fasteners');
      for (let i = 0; i < screws.count; i++) {
        const angle = i % 16 / 16 * Math.PI * 2;
        dummy.position.set(Math.cos(angle) * .63, i < 16 ? -1.25 : 1.25, Math.sin(angle) * .63);
        dummy.rotation.set(0, angle, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); screws.setMatrixAt(i, dummy.matrix);
      }
      const railGeometry = geometry(new CylinderGeometry(.018, .018, 2.02, 8));
      for (const a of [.25, 2.35, 4.45]) { const rail = mesh(railGeometry, brass); rail.position.set(Math.cos(a) * .7, 0, Math.sin(a) * .7); }
      for (const a of [.25, 2.35, 4.45]) for (const y of [-.97, .97]) {
        const collar = mesh(geometry(new CylinderGeometry(.036, .036, .13, 12)), dark); collar.position.set(Math.cos(a) * .7, y, Math.sin(a) * .7);
      }
      const printing = texture(chamberInscription()), graduation = texture(chamberInscription(true));
      const printMaterial = material(new MeshBasicMaterial({ map: printing, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
      const capPrint = mesh(geometry(new CylinderGeometry(.744, .744, .165, 96, 1, true)), printMaterial); capPrint.position.y = -1.15;
      const etching = mesh(geometry(new CylinderGeometry(.688, .688, 1.86, 96, 1, true)), material(new MeshBasicMaterial({ map: graduation, transparent: true, opacity: .72, depthWrite: false, side: DoubleSide })));
      etching.name = 'etched-measurements';
      const conduit = new CatmullRomCurve3([new Vector3(-.54, .98, -.4), new Vector3(-.81, .78, -.45), new Vector3(-.86, -.55, -.45), new Vector3(-.55, -.98, -.4)]);
      mesh(geometry(new TubeGeometry(conduit, 64, .035, 10, false)), black);
      mesh(geometry(new TubeGeometry(conduit, 64, .014, 8, false)), brass).position.x = -.025;
      const specimen = new Group(); specimen.name = 'suspended-culture'; object.add(specimen);
      for (const phase of [0, Math.PI]) {
        const points = Array.from({ length: 81 }, (_, i) => {
          const a = i / 80 * Math.PI * 4 + phase; return new Vector3(Math.cos(a) * .27, -.86 + i / 80 * 1.72, Math.sin(a) * .27);
        });
        mesh(geometry(new TubeGeometry(new CatmullRomCurve3(points), 100, .027, 8, false)), phase ? brass : luminous, specimen);
      }
      const rungs = instanced(geometry(new CylinderGeometry(.013, .013, 1, 8)), material(new MeshStandardMaterial({ color: '#e5eed0', metalness: .12, roughness: .3 })), 28, 'culture-rungs', specimen);
      const cells = instanced(geometry(new SphereGeometry(.052, 12, 8)), luminous, 56, 'culture-cells', specimen);
      for (let i = 0; i < 28; i++) {
        const a = i / 27 * Math.PI * 4, y = -.86 + i / 27 * 1.72, v = new Vector3(Math.cos(a), 0, Math.sin(a));
        dummy.position.set(0, y, 0); dummy.quaternion.setFromUnitVectors(up, v); dummy.scale.set(1, .54, 1); dummy.updateMatrix(); rungs.setMatrixAt(i, dummy.matrix);
        for (const side of [-1, 1]) { dummy.position.copy(v).multiplyScalar(.27 * side); dummy.position.y = y; dummy.scale.setScalar(1); dummy.updateMatrix(); cells.setMatrixAt(i * 2 + (side === 1 ? 1 : 0), dummy.matrix); }
      }
      const ticks = instanced(geometry(new CylinderGeometry(.008, .008, 1, 4)), brass, 23, 'chamber-graduations');
      for (let i = 0; i < ticks.count; i++) {
        dummy.position.set(.49, -.88 + i * .08, .49); dummy.rotation.set(0, 0, Math.PI / 2); dummy.scale.set(1, i % 5 ? .065 : .13, 1); dummy.updateMatrix(); ticks.setMatrixAt(i, dummy.matrix);
      }
      const bubbles = instanced(geometry(new SphereGeometry(.026, 12, 8)), material(new MeshPhysicalMaterial({ color: '#d6f8d9', transparent: true, opacity: .65, roughness: .09, clearcoat: 1, depthWrite: false })), 72, 'culture-bubbles');
      bubbles.frustumCulled = false;
      const bubbleSeeds = Array.from({ length: bubbles.count }, () => ({ a: random() * Math.PI * 2, r: .34 + random() * .23, phase: random(), speed: .06 + random() * .07, size: .45 + random() * 1.1 }));
      updates.push(time => {
        specimen.rotation.y = -time * .24;
        bubbleSeeds.forEach((p, i) => {
          const a = p.a + time * .07;
          dummy.position.set(Math.cos(a) * p.r, -1 + ((p.phase + time * p.speed) % 1) * 2, Math.sin(a) * p.r);
          dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(p.size); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
        }); bubbles.instanceMatrix.needsUpdate = true;
      });
      // Narrow specular strips keep the transparent wall readable on the paper background.
      const reflectionMaterial = material(new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .32, side: DoubleSide, depthWrite: false }));
      const reflection = mesh(geometry(new CylinderGeometry(.686, .686, 1.9, 12, 1, true, -.6, .035)), reflectionMaterial);
      reflection.name = 'glass-reflection';
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
        luminous.emissiveIntensity = 1.05 + Math.sin(time * .9) * .2;
      });
      const orbital = new Group(); orbital.name = 'containment-ring'; orbital.rotation.set(1.12, .35, -.2); scene.add(orbital);
      const line = material(new MeshBasicMaterial({ color: '#d9a151', transparent: true, opacity: .26 }));
      for (let i = 0; i < 8; i++) {
        const ring = mesh(geometry(new TorusGeometry(1.46, .003, 4, 32, .43)), line, orbital); ring.rotation.z = i / 8 * Math.PI * 2;
      }
      updates.push(time => { orbital.rotation.z = -.2 + time * .055; });
    }

    const particleCount = lab ? 180 : 420, positions: number[] = [], phases: number[] = [], sizes: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const a = random() * Math.PI * 2, r = .85 + random() * 1.25;
      positions.push(Math.cos(a) * r, random() * 2.9 - 1.45, Math.sin(a) * r * .55); phases.push(random() * Math.PI * 2); sizes.push(.8 + random() * 2.2);
    }
    const particleGeometry = geometry(new BufferGeometry()); particleGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('phase', new Float32BufferAttribute(phases, 1)); particleGeometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    particleGeometry.computeBoundingSphere(); particleGeometry.boundingSphere!.radius += .3;
    const particleMaterial = material(new ShaderMaterial({
      transparent: true, depthWrite: false, blending: lab ? NormalBlending : AdditiveBlending,
      uniforms: { time: { value: 0 }, pixelRatio: { value: 1 }, tint: { value: new Color(lab ? '#ad935d' : '#ffab39') } },
      vertexShader: `attribute float phase; attribute float size; uniform float time; uniform float pixelRatio; varying float alpha;
        void main(){vec3 p=position; p.x+=sin(time*.2+phase)*.08; p.y+=sin(time*.3+phase)*.14;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=size*pixelRatio*6./-mv.z;
          alpha=.35+.3*sin(time*.8+phase);}`,
      fragmentShader: `uniform vec3 tint; varying float alpha; void main(){float r=length(gl_PointCoord-.5)*2.;
        gl_FragColor=vec4(tint,(1.-smoothstep(.05,1.,r))*alpha);}`,
    }));
    const dust = new Points(particleGeometry, particleMaterial); dust.name = lab ? 'culture-motes' : 'crystal-embers'; scene.add(dust);
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
          const scale = Math.min(width * .28, Math.max(1, height - 76) * .3);
          camera.aspect = width / height; camera.position.set(0, 0, 6); camera.lookAt(0, 0, 0);
          camera.fov = 2 * Math.atan(height / (2 * scale * 6)) * 180 / Math.PI; camera.updateProjectionMatrix();
          camera.projectionMatrix.elements[8] = -.08; camera.projectionMatrix.elements[9] = -36 / height;
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
          particleMaterial.uniforms.pixelRatio.value = ratio; lastWidth = width; lastHeight = height; lastRatio = ratio;
        }
        object.rotation.y = time * (lab ? .13 : .11);
        updates.forEach(update => update(time)); particleMaterial.uniforms.time.value = time;
        renderer!.render(scene, camera); return true;
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
