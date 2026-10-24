import {
  BackSide, DoubleSide, BufferGeometry, CapsuleGeometry, CanvasTexture, Color, DirectionalLight,
  Float32BufferAttribute, Group, HemisphereLight, InstancedMesh, Material, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera,
  PlaneGeometry, Points, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';

import { orbitCameraDistance, orbitFraming, rotateOrbitPoint } from './orbitProjection';
import { orbitDonutShape } from './orbitDonut';

export interface DonutArtwork {
  canvas: HTMLCanvasElement;
  draw(width: number, height: number, time: number): boolean;
  dispose(): void;
}

const TAU = Math.PI * 2;
const { ringRadius, tubeRadius, icingThickness } = orbitDonutShape;
const icingRadius = tubeRadius + icingThickness;
const sugarColors = ['#fff7de', '#ffd348', '#659f83', '#df3e76', '#bb9cdb'];
const ink = '#37212b';

/** This painter has no clock of its own: Orbit owns pause, visibility and reduced motion. */
export function createDonutArtwork(invalidate: () => void): DonutArtwork {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<CanvasTexture>(), instances = new Set<InstancedMesh>();
  const geometry = <T extends BufferGeometry>(value: T) => { geometries.add(value); return value; };
  const material = <T extends Material>(value: T) => { materials.add(value); return value; };
  let renderer: WebGLRenderer | undefined, disposed = false, lost = false;
  const canvas = document.createElement('canvas');
  canvas.className = 'rhine-orbit-canvas rhine-orbit-donut-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  function contextLost(event: Event) { event.preventDefault(); lost = true; invalidate(); }
  function contextRestored() { lost = false; invalidate(); }
  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    instances.forEach(value => value.dispose()); geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); textures.forEach(value => value.dispose());
    renderer?.dispose(); renderer?.forceContextLoss(); canvas.remove();
  }
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    const scene = new Scene();
    const camera = new PerspectiveCamera(36, 1, .1, 50);
    scene.add(new HemisphereLight('#fff5ec', '#9d5b77', 2.5));
    const key = new DirectionalLight('#fff8eb', 3.2); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new DirectionalLight('#ffd2e5', 2.1); rim.position.set(4, 1, -2); scene.add(rim);
    const fill = new DirectionalLight('#ffffff', .8); fill.position.set(0, -3, 4); scene.add(fill);
    const frame = new Group(); frame.name = 'orbit-camera-frame'; frame.matrixAutoUpdate = false;
    const basis = (x: number, y: number, z: number) => { const p = rotateOrbitPoint({ x, y, z }); return new Vector3(p.x, -p.y, p.z); };
    frame.matrix.makeBasis(basis(1, 0, 0), basis(0, 1, 0), basis(0, 0, 1)); scene.add(frame);
    const donut = new Group(); donut.name = 'strawberry-donut'; frame.add(donut);
    let seed = 57183;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const edge = (a: number, inner = false) => {
      const drip = Math.pow((1 + Math.sin(a * (inner ? 7 : 11) + .8 * Math.sin(a * 3))) / 2, 4);
      return inner ? Math.PI - .12 + drip * .35 : .16 - drip * .62;
    };
    const point = (a: number, b: number, radius: number) => {
      const handmade = .009 * Math.sin(a * 9 + b * 3) + .005 * Math.sin(a * 17 - b * 7);
      const tube = radius + handmade;
      return new Vector3((ringRadius + tube * Math.cos(b)) * Math.cos(a), (ringRadius + tube * Math.cos(b)) * Math.sin(a), tube * Math.sin(b));
    };
    function surface(icing: boolean) {
      const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
      const rings = 192, slices = icing ? 56 : 64;
      for (let i = 0; i <= rings; i++) for (let j = 0; j <= slices; j++) {
        const a = i / rings * TAU;
        const b = icing ? edge(a) + (edge(a, true) - edge(a)) * j / slices : j / slices * TAU;
        positions.push(...point(a, b, icing ? icingRadius : tubeRadius).toArray()); uvs.push(i / rings, b / TAU);
        if (i < rings && j < slices) {
          const k = i * (slices + 1) + j;
          indices.push(k, k + slices + 1, k + 1, k + 1, k + slices + 1, k + slices + 2);
        }
      }
      const value = geometry(new BufferGeometry());
      value.setAttribute('position', new Float32BufferAttribute(positions, 3));
      value.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); value.setIndex(indices); value.computeVertexNormals();
      return value;
    }
    // A baked grain map adds pores and a pale frying belt without downloading any texture.
    const grainCanvas = document.createElement('canvas'); grainCanvas.width = 512; grainCanvas.height = 256;
    const paint = grainCanvas.getContext('2d');
    if (!paint) throw new Error('Donut grain texture unavailable');
    const roast = paint.createLinearGradient(0, 0, 0, 256);
    roast.addColorStop(0, '#e6b777'); roast.addColorStop(.16, '#cd863f'); roast.addColorStop(.4, '#e2a35e');
    roast.addColorStop(.5, '#edbd80'); roast.addColorStop(.65, '#c47a37'); roast.addColorStop(1, '#e6b777');
    paint.fillStyle = roast; paint.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 6500; i++) {
      paint.fillStyle = i % 3 ? 'rgba(115,54,18,.13)' : 'rgba(255,235,181,.22)';
      paint.beginPath(); paint.ellipse(random() * 512, random() * 256, .2 + random(), .2 + random() * .7, random() * TAU, 0, TAU); paint.fill();
    }
    const grain = new CanvasTexture(grainCanvas); grain.colorSpace = SRGBColorSpace; textures.add(grain);
    const doughGeometry = surface(false), icingGeometry = surface(true);
    const outline = material(new MeshBasicMaterial({ color: ink, side: BackSide }));
    const doughOutline = new Mesh(doughGeometry, outline); doughOutline.scale.setScalar(1.018); donut.add(doughOutline);
    const dough = new Mesh(doughGeometry, material(new MeshStandardMaterial({ map: grain, bumpMap: grain, bumpScale: .018, roughness: .88 })));
    dough.name = 'baked-dough'; donut.add(dough);
    const glaze = new Mesh(icingGeometry, material(new MeshPhysicalMaterial({
      color: '#ee83ad', roughness: .28, metalness: 0, clearcoat: 1, clearcoatRoughness: .22,
      sheen: .55, sheenColor: new Color('#ffc2d8'), sheenRoughness: .55,
    })));
    glaze.name = 'strawberry-icing'; donut.add(glaze);
    // Give both uneven icing edges real thickness, including the inner hole.
    for (const inner of [false, true]) {
      const positions: number[] = [], indices: number[] = [];
      for (let i = 0; i <= 192; i++) {
        const a = i / 192 * TAU, b = edge(a, inner);
        positions.push(...point(a, b, icingRadius + .001).toArray(), ...point(a, b, tubeRadius + .004).toArray());
        if (i < 192) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const lip = geometry(new BufferGeometry()); lip.setAttribute('position', new Float32BufferAttribute(positions, 3)); lip.setIndex(indices); lip.computeVertexNormals();
      donut.add(new Mesh(lip, material(new MeshStandardMaterial({ color: '#c75282', roughness: .4, side: DoubleSide }))));
    }
    const capsule = geometry(new CapsuleGeometry(.018, .076, 4, 6));
    const sprinkleMaterial = material(new MeshPhysicalMaterial({ roughness: .38, clearcoat: .65 }));
    const sprinkles = new InstancedMesh(capsule, sprinkleMaterial, 280); sprinkles.name = 'icing-sprinkles';
    const sugarOutline = new InstancedMesh(capsule, outline, 280); instances.add(sprinkles); instances.add(sugarOutline);
    const dummy = new Object3D(), up = new Vector3(0, 1, 0), color = new Color();
    for (let i = 0; i < 280; i++) {
      const a = random() * TAU, b = .32 + random() * (Math.PI - .64), angle = random() * TAU;
      const tangent = new Vector3(-Math.sin(a), Math.cos(a), 0).multiplyScalar(Math.cos(angle))
        .add(new Vector3(-Math.sin(b) * Math.cos(a), -Math.sin(b) * Math.sin(a), Math.cos(b)).multiplyScalar(Math.sin(angle))).normalize();
      dummy.position.copy(point(a, b, icingRadius + .025)); dummy.quaternion.setFromUnitVectors(up, tangent);
      dummy.scale.set(1, .7 + random() * .7, 1); dummy.updateMatrix(); sprinkles.setMatrixAt(i, dummy.matrix);
      sprinkles.setColorAt(i, color.set(sugarColors[i % sugarColors.length]));
      dummy.scale.multiplyScalar(1.17); dummy.updateMatrix(); sugarOutline.setMatrixAt(i, dummy.matrix);
    }
    donut.add(sugarOutline, sprinkles);
    const pearls = new InstancedMesh(geometry(new SphereGeometry(.015, 8, 6)), material(new MeshStandardMaterial({ color: '#fff7dc', roughness: .28 })), 110);
    pearls.name = 'sugar-pearls'; instances.add(pearls);
    for (let i = 0; i < 110; i++) {
      dummy.position.copy(point(random() * TAU, .25 + random() * (Math.PI - .5), icingRadius + .018));
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(.7 + random() * .7); dummy.updateMatrix(); pearls.setMatrixAt(i, dummy.matrix);
    }
    donut.add(pearls);

    const floating = new InstancedMesh(capsule, sprinkleMaterial, 100); floating.name = 'floating-confetti'; floating.frustumCulled = false; instances.add(floating); scene.add(floating);
    const confetti = Array.from({ length: 100 }, (_, i) => {
      floating.setColorAt(i, color.set(sugarColors[i % sugarColors.length]));
      return { phase: i / 100 * TAU, radius: 1.68 + random() * .7, speed: .08 + random() * .09, depth: random() * 1.8 - .9, tilt: random() * TAU, scale: .5 + random() * .85 };
    });
    // Positions are real coordinates; include the shader's small wobble in the CPU bound.
    const dustPositions: number[] = [], dustColors: number[] = [], phases: number[] = [], sizes: number[] = [];
    for (let i = 0; i < 460; i++) {
      const a = random() * TAU, r = 1.55 + random() * 1.15;
      dustPositions.push(Math.cos(a) * r, Math.sin(a) * r * .72 + .1, random() * 2.4 - 1.2);
      dustColors.push(...color.set(sugarColors[i % sugarColors.length]).toArray()); phases.push(random() * TAU); sizes.push(i % 9 ? 1.2 + random() * 1.5 : 3.8);
    }
    const dustGeometry = geometry(new BufferGeometry());
    dustGeometry.setAttribute('position', new Float32BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new Float32BufferAttribute(dustColors, 3));
    dustGeometry.setAttribute('phase', new Float32BufferAttribute(phases, 1)); dustGeometry.setAttribute('size', new Float32BufferAttribute(sizes, 1));
    dustGeometry.computeBoundingSphere(); dustGeometry.boundingSphere!.radius += .3;
    const dustMaterial = material(new ShaderMaterial({
      transparent: true, depthWrite: false, vertexColors: true, uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
      vertexShader: `attribute float phase; attribute float size; uniform float time; uniform float pixelRatio; varying vec3 tint; varying float sparkle;
        void main(){vec3 p=position; p.x+=sin(time*.35+phase)*.09; p.y+=cos(time*.45+phase)*.12;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=size*pixelRatio*(3.6/-mv.z);
          tint=color; sparkle=.4+.35*sin(time*.7+phase);}`,
      fragmentShader: `varying vec3 tint; varying float sparkle; void main(){vec2 p=abs(gl_PointCoord-.5)*2.;
        float round=1.-smoothstep(.1,1.,length(p)); float cross=exp(-min(p.x,p.y)*12.)*(1.-max(p.x,p.y));
        gl_FragColor=vec4(tint,max(round*.4,cross)*sparkle);}`,
    }));
    const dust = new Points(dustGeometry, dustMaterial); dust.name = 'sugar-dust'; scene.add(dust);
    const shadow = new Mesh(geometry(new PlaneGeometry(3.8, .7)), material(new ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { opacity: { value: .2 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; uniform float opacity; void main(){float r=length((vUv-.5)*2.);gl_FragColor=vec4(.46,.24,.24,(1.-smoothstep(.1,1.,r))*opacity);}',
    })));
    shadow.position.set(.12, -1.45, -1.1); scene.add(shadow);
    let bitmapWidth = 0, bitmapHeight = 0, ratio = 0;
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
    return {
      canvas,
      draw(width, height, time) {
        if (disposed || lost || width <= 0 || height <= 0) return false;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        if (width !== bitmapWidth || height !== bitmapHeight || ratio !== dpr) {
          renderer!.setPixelRatio(dpr); renderer!.setSize(width, height, false);
          const { scale, centerX, centerY } = orbitFraming(width, height);
          camera.aspect = width / height; camera.position.set(0, 0, orbitCameraDistance); camera.lookAt(0, 0, 0);
          camera.fov = 2 * Math.atan(height / (2 * scale * orbitCameraDistance * 1.08)) * 180 / Math.PI;
          camera.updateProjectionMatrix();
          camera.projectionMatrix.elements[0] /= 1.08;
          camera.projectionMatrix.elements[8] = 1 - 2 * centerX / width;
          camera.projectionMatrix.elements[9] = 2 * centerY / height - 1;
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
          dustMaterial.uniforms.pixelRatio.value = dpr; bitmapWidth = width; bitmapHeight = height; ratio = dpr;
        }
        donut.rotation.set(0, 0, time * .28 - .35);
        for (let i = 0; i < confetti.length; i++) {
          const p = confetti[i], a = p.phase + time * p.speed;
          dummy.position.set(Math.cos(a) * p.radius, Math.sin(a) * p.radius * .68 + .12 + Math.sin(time * .6 + p.phase) * .08, p.depth + Math.sin(a) * .25);
          dummy.rotation.set(p.tilt + time * .3, a, p.tilt - time * .4); dummy.scale.setScalar(p.scale); dummy.updateMatrix(); floating.setMatrixAt(i, dummy.matrix);
        }
        floating.instanceMatrix.needsUpdate = true;
        dustMaterial.uniforms.time.value = time;
        renderer!.render(scene, camera);
        return true;
      },
      dispose,
    };
  } catch (error) { dispose(); throw error; }
}
