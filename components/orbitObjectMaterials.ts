import { CanvasTexture, EquirectangularReflectionMapping, MeshPhysicalMaterial, SRGBColorSpace } from 'three';

function surface(width: number, height: number) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Object texture canvas unavailable');
  return { canvas, context };
}

/** Local studio lighting keeps paper folds and polished mineral faces legible. */
export function studioEnvironment() {
  const { canvas, context: c } = surface(1024, 512);
  const room = c.createLinearGradient(0, 0, 0, 512);
  room.addColorStop(0, '#aabcb4'); room.addColorStop(.45, '#263c38'); room.addColorStop(.52, '#111c1a'); room.addColorStop(1, '#697c70');
  c.fillStyle = room; c.fillRect(0, 0, 1024, 512);
  for (const [x, y, width, height, tint] of [[130, 65, 105, 300, '#f7fff8'], [670, 110, 35, 260, '#dcebee'], [830, 145, 80, 130, '#cdb68e']] as const) {
    c.shadowColor = tint; c.shadowBlur = 32; c.fillStyle = tint; c.fillRect(x, y, width, height);
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

export function paperTexture() {
  const { canvas, context: c } = surface(512, 512);
  c.fillStyle = '#f7f4e8'; c.fillRect(0, 0, 512, 512);
  let seed = 7619;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 24000; i++) {
    c.fillStyle = i % 3 ? 'rgba(97,111,85,.035)' : 'rgba(255,255,255,.22)';
    c.fillRect(random() * 512, random() * 512, .3 + random() * 1.5, .2 + random() * .5);
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Surface mineral grain, branching fissures and thin internal amber light share local coordinates. */
export function mineralMaterial() {
  const value = new MeshPhysicalMaterial({ color: '#263330', metalness: .62, roughness: .24, clearcoat: 1, clearcoatRoughness: .16, envMapIntensity: 1.3 });
  value.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vMineral;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvMineral = position;');
    shader.fragmentShader = `varying vec3 vMineral;
      float hashStone(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float grainStone(vec3 p) {
        vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(hashStone(i),hashStone(i+vec3(1,0,0)),f.x),mix(hashStone(i+vec3(0,1,0)),hashStone(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hashStone(i+vec3(0,0,1)),hashStone(i+vec3(1,0,1)),f.x),mix(hashStone(i+vec3(0,1,1)),hashStone(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float stoneEdge(vec2 p) {
        vec2 cell=floor(p),f=fract(p); float a=10.,b=10.;
        for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
          vec2 o=vec2(float(x),float(y));
          vec2 jitter=vec2(hashStone(vec3(cell+o,1.)),hashStone(vec3(cell+o,2.)));
          float d=length(o+jitter-f); if(d<a){b=a;a=d;}else if(d<b){b=d;}
        }
        return b-a;
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float mineralGrain=grainStone(vMineral*34.)*.55+grainStone(vMineral*110.)*.45;
      float mineralLayer=grainStone(vMineral*3.8);
      vec2 fissureUV=vec2(vMineral.x+vMineral.z*.71,vMineral.y*.76);
      float fissure=stoneEdge(fissureUV*5.5+mineralLayer*.35);
      float fissureMask=smoothstep(.36,.7,grainStone(vMineral*2.2+4.));
      float vein=(1.-smoothstep(.009,.032,fissure))*fissureMask;
      float veinHalo=(1.-smoothstep(.025,.15,fissure))*fissureMask;
      diffuseColor.rgb*=.58+mineralGrain*.54+mineralLayer*.22;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.15,.075,.025),veinHalo*.6);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(mineralGrain-.5)*.24,.12,.5);');
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.32,.055)*(vein*2.3+veinHalo*.12);');
  };
  value.customProgramCacheKey = () => 'rhine-mineral-v1';
  return value;
}
