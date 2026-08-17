/**
 * 🧠 סצנת הכדור-מוח של אורביט (SIGNUP מיתוג 1) — חולצה נאמנה מהמוקאפ
 * `knowledge/orbit-design/orbit-signup.dc.html`. Three.js **נארז ב-bundle**
 * (import סטטי) — אפס CDN. הפונקציה mount נקייה: מחזירה controller עם
 * dispose שמשחרר renderer/geometries/materials ומסיר את מאזיני החלון.
 *
 * הכדור כבד יחסית (bloom + ~430 nodes); מגודר דגל signup.hero3d בקומפוננטה,
 * ובכל מקרה נופל בשקט לרקע הסטטי אם WebGL לא זמין (mount מחזיר null).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface BrainSceneOptions {
  palette?: 'Aurora' | 'Ember' | 'Ice';
  pulse?: number;
  bloom?: number;
}

export interface BrainSceneHandle {
  dispose: () => void;
}

const PAL = {
  Aurora: { n1: 0x7fd4ff, n2: 0xb98bff, e: 0x4a7ad0, ring: 0x5aa2ff, comet: 0xdcefff, trail: 0x7ab6ff, dust: 0x9ec6ff, star: 0xbfd0ff },
  Ember: { n1: 0xffcf8a, n2: 0xff6a72, e: 0xc8663c, ring: 0xf5b45f, comet: 0xfff1da, trail: 0xffb877, dust: 0xffcfa0, star: 0xffd9b0 },
  Ice: { n1: 0xdff0ff, n2: 0x8fbfff, e: 0x5a86c0, ring: 0x8fbfff, comet: 0xeaf4ff, trail: 0xa9ccff, dust: 0xcfe0ff, star: 0xdfeaff },
};

/**
 * מרכיב את הסצנה על ה-canvas. מחזיר null כאשר WebGL לא נתמך (ניפול לרקע
 * הסטטי). ה-controller.dispose חובה ב-cleanup של הרכיב.
 */
export function mountBrainScene(canvas: HTMLCanvasElement, opts: BrainSceneOptions = {}): BrainSceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null; // אין WebGL — הקומפוננטה מציגה את הרקע הסטטי
  }
  const pal = PAL[opts.palette ?? 'Aurora'];
  const pulseAmt = opts.pulse ?? 1;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const CAMZ = 5.7;
  camera.position.set(0, 0, CAMZ);

  const group = new THREE.Group();
  group.position.x = 0.55;
  scene.add(group);

  // ---------- neural brain (two lobes of firing nodes + synapse web) ----------
  const R = 1.34;
  const SEED = 430;
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < SEED; i++) {
    const y = 1 - (i / (SEED - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963229;
    const x = Math.cos(th) * rad;
    const z = Math.sin(th) * rad;
    const rr = R * (1 + 0.12 * Math.sin(x * 4.3 + y * 3.1) * Math.cos(z * 3.6 + y * 2.2));
    const vx = x * rr;
    const vy = y * rr * 0.92;
    const vz = z * rr;
    if (Math.abs(vx) < 0.17) continue; // central fissure → two lobes
    nodes.push(new THREE.Vector3(vx, vy, vz));
  }
  const M = nodes.length;
  const npos = new Float32Array(M * 3);
  const nph = new Float32Array(M);
  for (let i = 0; i < M; i++) {
    npos[i * 3] = nodes[i].x;
    npos[i * 3 + 1] = nodes[i].y;
    npos[i * 3 + 2] = nodes[i].z;
    nph[i] = Math.random();
  }
  const ng = new THREE.BufferGeometry();
  ng.setAttribute('position', new THREE.BufferAttribute(npos, 3));
  ng.setAttribute('aPhase', new THREE.BufferAttribute(nph, 1));
  const nodeU = {
    uTime: { value: 0 },
    uPulse: { value: 0 },
    uColor: { value: new THREE.Color(pal.n1) },
    uColor2: { value: new THREE.Color(pal.n2) },
  };
  const nodeMat = new THREE.ShaderMaterial({
    uniforms: nodeU,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aPhase; uniform float uTime,uPulse; varying float vB;
      void main(){ float fire=pow(0.5+0.5*sin(uTime*2.4-aPhase*6.2831),7.0);
        vB=0.28+fire*1.05+uPulse*0.45;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_PointSize=(46.0+fire*66.0)/(-mv.z);
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor,uColor2; varying float vB;
      void main(){ vec2 uv=gl_PointCoord*2.0-1.0; float d=dot(uv,uv); if(d>1.0) discard;
        float a=smoothstep(1.0,0.0,d); vec3 c=mix(uColor,uColor2,clamp(vB*0.5,0.0,1.0));
        gl_FragColor=vec4(c*vB, a*clamp(vB,0.0,1.0)); }`,
  });
  const nodePoints = new THREE.Points(ng, nodeMat);
  group.add(nodePoints);

  // synapse web — nearest neighbours within same lobe
  const ep: number[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < M; i++) {
    const a = nodes[i];
    const cand: [number, number][] = [];
    for (let j = 0; j < M; j++) {
      if (i === j || Math.sign(nodes[j].x) !== Math.sign(a.x)) continue;
      cand.push([a.distanceToSquared(nodes[j]), j]);
    }
    cand.sort((p, q) => p[0] - q[0]);
    for (let n = 0; n < Math.min(3, cand.length); n++) {
      const j = cand[n][1];
      const key = Math.min(i, j) + '_' + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      ep.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
    }
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ep), 3));
  const edgeMat = new THREE.LineBasicMaterial({
    color: pal.e,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  group.add(new THREE.LineSegments(eg, edgeMat));

  // ---------- orbital ring + comet ----------
  const RING = 2.12;
  const ringGeo = new THREE.TorusGeometry(RING, 0.02, 20, 200);
  const ringMat = new THREE.MeshBasicMaterial({ color: pal.ring, transparent: true, opacity: 0.5 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.set(1.15, 0.15, 0);
  group.add(ring);
  const pivot = new THREE.Group();
  pivot.rotation.set(1.15, 0.15, 0);
  group.add(pivot);
  const cnodeGeo = new THREE.SphereGeometry(0.1, 24, 24);
  const cnode = new THREE.Mesh(cnodeGeo, new THREE.MeshBasicMaterial({ color: pal.comet }));
  cnode.position.set(RING, 0, 0);
  pivot.add(cnode);
  for (let i = 1; i <= 10; i++) {
    const a = -i * 0.07;
    const s = Math.max(0.02, 0.088 - i * 0.007);
    const tt = new THREE.Mesh(
      new THREE.SphereGeometry(s, 12, 12),
      new THREE.MeshBasicMaterial({ color: pal.trail, transparent: true, opacity: Math.max(0.05, 0.5 - i * 0.045) }),
    );
    tt.position.set(RING * Math.cos(a), RING * Math.sin(a), 0);
    pivot.add(tt);
  }

  // ambient particles + stars
  const PN = 90;
  const pa = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) {
    const r = 2.6 + Math.random() * 3.5;
    const th = Math.random() * 6.283;
    const ph = Math.acos(2 * Math.random() - 1);
    pa[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pa[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pa[i * 3 + 2] = r * Math.cos(ph);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  const parts = new THREE.Points(
    pg,
    new THREE.PointsMaterial({ color: pal.dust, size: 0.035, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  group.add(parts);
  const SN = 300;
  const sa = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    const r = 9 + Math.random() * 13;
    const th = Math.random() * 6.283;
    const ph = Math.acos(2 * Math.random() - 1);
    sa[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sa[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    sa[i * 3 + 2] = r * Math.cos(ph) - 6;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sa, 3));
  const stars = new THREE.Points(
    sg,
    new THREE.PointsMaterial({ color: pal.star, size: 0.03, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  scene.add(stars);

  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), opts.bloom ?? 0.5, 0.5, 0.62);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  } catch {
    composer = null;
  }

  let wideF = 0;
  const setBloom = () => {
    if (bloom) bloom.strength = (opts.bloom ?? 0.5) * (1 - wideF * 0.3);
  };
  const fit = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (composer) composer.setSize(w, h);
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAMZ * camera.aspect;
    wideF = THREE.MathUtils.clamp((camera.aspect - 0.78) / (1.6 - 0.78), 0, 1);
    group.scale.setScalar(Math.min(1, half / 2.7) * (1 - wideF * 0.4));
    group.position.x = 0.15 + wideF * 0.85;
    setBloom();
  };
  window.addEventListener('resize', fit);
  fit();

  const mo = { x: 0, y: 0 };
  const tg = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    mo.x = (e.clientX / window.innerWidth) * 2 - 1;
    mo.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove);

  const beat = (x: number) => Math.exp(-x * x * 62) + 0.5 * Math.exp(-(x - 0.26) * (x - 0.26) * 62);
  const clock = new THREE.Clock();
  let raf = 0;
  let dead = false;
  const loop = () => {
    if (dead) return;
    const t = clock.getElapsedTime();
    const ph = (t % 1.5) / 1.5;
    const pulse = Math.min(1, beat(ph)) * pulseAmt;
    nodeU.uTime.value = t;
    nodeU.uPulse.value = pulse;
    edgeMat.opacity = 0.17 + pulse * 0.18;
    tg.x += (mo.x - tg.x) * 0.05;
    tg.y += (mo.y - tg.y) * 0.05;
    group.rotation.y = t * 0.14 + tg.x * 0.6;
    group.rotation.x = Math.sin(t * 0.2) * 0.07 + tg.y * 0.28;
    pivot.rotation.z = -t * 0.9;
    parts.rotation.y = t * 0.05;
    stars.rotation.y = t * 0.012;
    if (composer) composer.render();
    else renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      window.removeEventListener('pointermove', onMove);
      // שחרור זיכרון GPU — geometries/materials/renderer
      scene.traverse((obj) => {
        const anyObj = obj as unknown as { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] };
        anyObj.geometry?.dispose?.();
        const mat = anyObj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      composer?.dispose?.();
      renderer.dispose();
    },
  };
}
