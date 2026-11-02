// «مقياس معيار» — the 3D gauge. Loaded lazily (dynamic import) so the page,
// its buttons and tools work before (and without) WebGL.
// The motion is purely illustrative: it never represents an analysis result.
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RingGeometry,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  BoxGeometry,
  Vector2,
  WebGLRenderer,
  type Material,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { drawDial, ZONES, ZONE_ANGLE } from './dial';

export interface Pose {
  x: number; // world units
  y: number;
  scale: number;
  rotX: number;
  rotY: number;
  explode: number; // 0..1
  needle: number; // math angle in degrees (0 = right, 90 = up)
}

export interface Gauge {
  setPose(p: Pose): void;
  render(): void;
  resize(w: number, h: number, dpr: number): void;
  /** World height visible at the gauge plane, for mapping DOM pixels to world units. */
  visibleHeight(): number;
  snapshot(size: number, mime?: string): string;
  dispose(): void;
}

const DEG = Math.PI / 180;
const FOV = 24;
const CAM_Z = 12;

const lathe = (pts: [number, number][], seg: number) => {
  const g = new LatheGeometry(
    pts.map(([r, z]) => new Vector2(r, z)),
    seg,
  );
  g.rotateX(Math.PI / 2); // lathe axis Y -> Z (facing the camera)
  return g;
};

/** Soft radial texture used for the contact shadow and the glass glint. */
function radialTexture(stops: [number, string][], size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A long diagonal highlight that slides over the glass as the gauge turns. */
function glintTexture() {
  const w = 512;
  const c = document.createElement('canvas');
  c.width = c.height = w;
  const x = c.getContext('2d')!;
  x.translate(w / 2, w / 2);
  x.rotate(-0.62);
  const g = x.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0)');
  g.addColorStop(0.47, 'rgba(255,250,240,0.55)');
  g.addColorStop(0.5, 'rgba(255,250,240,0.18)');
  g.addColorStop(0.56, 'rgba(255,250,240,0.32)');
  g.addColorStop(0.6, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(-w, -w, 2 * w, 2 * w);
  // keep it inside the glass disc
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(w / 2, w / 2, w * 0.3, w / 2, w / 2, w / 2);
  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(0.92, 'rgba(0,0,0,1)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = m;
  x.fillRect(0, 0, w, w);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Fine brushed-metal roughness variation (concentric), drawn procedurally. */
function brushedTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d')!;
  x.fillStyle = '#8a8a8a';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const r = Math.random() * size * 0.72;
    const v = 110 + Math.floor(Math.random() * 60);
    x.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    x.lineWidth = Math.random() * 1.4;
    x.beginPath();
    const a0 = Math.random() * Math.PI * 2;
    x.arc(size / 2, size / 2, r, a0, a0 + Math.random() * 2.5);
    x.stroke();
  }
  return new CanvasTexture(c);
}

export async function createGauge(canvas: HTMLCanvasElement, opts: { lite: boolean }): Promise<Gauge> {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !opts.lite || window.devicePixelRatio < 2,
    powerPreference: opts.lite ? 'low-power' : 'high-performance',
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.95;
  scene.environmentRotation.set(0.25, -0.6, 0);
  pmrem.dispose();

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  // warm key + cool rim, on top of the image-based lighting
  const key = new DirectionalLight(new Color('#fff1dc'), 1.6);
  key.position.set(-4, 5, 7);
  const rim = new DirectionalLight(new Color('#ffd2b0'), 0.9);
  rim.position.set(5, -2, -3);
  scene.add(key, rim);

  const seg = opts.lite ? 96 : 192;
  const root = new Group(); // positioned/scaled by the page
  const body = new Group(); // rotated
  root.add(body);
  scene.add(root);

  // ---------------------------------------------------------------- materials
  const brushed = brushedTexture();
  const titanium = new MeshPhysicalMaterial({
    color: '#c9c0b2',
    metalness: 1,
    roughness: 0.36,
    roughnessMap: brushed,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });
  const champagne = new MeshPhysicalMaterial({
    color: '#e7d6b6',
    metalness: 1,
    roughness: 0.14,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08,
  });
  const gunmetal = new MeshPhysicalMaterial({ color: '#34302c', metalness: 0.85, roughness: 0.42, clearcoat: 0.2 });
  const steel = new MeshPhysicalMaterial({ color: '#efe9df', metalness: 1, roughness: 0.08 });
  const orange = new MeshPhysicalMaterial({
    color: '#ec6a2e',
    metalness: 0.25,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: new Color('#ec6a2e'),
    emissiveIntensity: 0.12,
  });

  const layers: { obj: Object3D; z: number; spread: number }[] = [];
  const addLayer = (obj: Object3D, z: number, spread: number) => {
    obj.position.z = z;
    body.add(obj);
    layers.push({ obj, z, spread });
  };

  // contact shadow (behind the housing, moves with it)
  const shadow = new Mesh(
    new PlaneGeometry(3.6, 3.6),
    new MeshBasicMaterial({
      map: radialTexture([
        [0, 'rgba(20,12,6,0.42)'],
        [0.45, 'rgba(20,12,6,0.18)'],
        [1, 'rgba(20,12,6,0)'],
      ]),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.position.set(0.12, -0.2, 0);
  addLayer(shadow, -0.42, -0.4);

  // 1. housing — satin titanium cup with a rounded shoulder
  addLayer(
    new Mesh(
      lathe(
        [
          [0, -0.3],
          [1.08, -0.3],
          [1.16, -0.285],
          [1.205, -0.25],
          [1.23, -0.18],
          [1.235, -0.06],
          [1.225, 0.0],
          [1.2, 0.03],
          [1.15, 0.035],
        ],
        seg,
      ),
      titanium,
    ),
    0,
    -0.45,
  );

  // 2. outer bezel — polished champagne, stepped profile
  addLayer(
    new Mesh(
      lathe(
        [
          [1.14, 0.0],
          [1.195, 0.025],
          [1.205, 0.085],
          [1.18, 0.135],
          [1.12, 0.16],
          [1.065, 0.152],
          [1.045, 0.12],
          [1.04, 0.07],
        ],
        seg,
      ),
      champagne,
    ),
    0,
    0.38,
  );

  // 3. chapter ring — dark gunmetal step with engraved ticks
  const chapter = new Group();
  chapter.add(
    new Mesh(
      lathe(
        [
          [1.04, 0.035],
          [1.04, 0.085],
          [1.02, 0.095],
          [0.965, 0.095],
          [0.955, 0.06],
        ],
        seg,
      ),
      gunmetal,
    ),
  );
  const TICKS = 72;
  const ticks = new InstancedMesh(new BoxGeometry(0.008, 0.045, 0.012), champagne, TICKS);
  const dummy = new Object3D();
  for (let i = 0; i < TICKS; i++) {
    const a = (i / TICKS) * Math.PI * 2;
    const major = i % 6 === 0;
    dummy.position.set(Math.cos(a) * 0.998, Math.sin(a) * 0.998, 0.098);
    dummy.rotation.set(0, 0, a - Math.PI / 2);
    dummy.scale.set(major ? 1.6 : 1, major ? 1.25 : 0.8, 1);
    dummy.updateMatrix();
    ticks.setMatrixAt(i, dummy.matrix);
  }
  chapter.add(ticks);
  addLayer(chapter, 0, -0.16);

  // 4. inner chamfer — bright polished steel
  addLayer(
    new Mesh(
      lathe(
        [
          [0.955, 0.02],
          [0.955, 0.05],
          [0.935, 0.06],
          [0.925, 0.035],
        ],
        seg,
      ),
      steel,
    ),
    0,
    0.19,
  );

  // 5. dial face — ceramic-like charcoal with printed scale and labels
  const dialCanvas = await drawDial(opts.lite ? 1024 : 2048);
  const dialTex = new CanvasTexture(dialCanvas);
  dialTex.colorSpace = SRGBColorSpace;
  dialTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const dial = new Mesh(
    new CircleGeometry(0.93, seg),
    new MeshPhysicalMaterial({ map: dialTex, roughness: 0.62, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.35 }),
  );
  addLayer(dial, 0.025, 0);

  // 6. zone arcs — raised, softly glowing enamel segments
  const arcs = new Group();
  for (const z of ZONES) {
    const m = new Mesh(
      new RingGeometry(0.735, 0.79, 48, 1, z.from * DEG, (z.to - z.from) * DEG),
      new MeshStandardMaterial({
        color: z.color,
        emissive: new Color(z.color),
        emissiveIntensity: 0.14,
        roughness: 0.4,
        envMapIntensity: 0.6,
        metalness: 0.1,
        side: DoubleSide,
      }),
    );
    arcs.add(m);
  }
  addLayer(arcs, 0.032, 0.1);

  // 7. needle + hub — orange lacquer with a polished cap
  const needle = new Group();
  const shape = new Shape();
  shape.moveTo(-0.034, -0.0);
  shape.lineTo(-0.006, 0.8);
  shape.quadraticCurveTo(0, 0.815, 0.006, 0.8);
  shape.lineTo(0.034, 0.0);
  shape.lineTo(0.022, -0.2);
  shape.quadraticCurveTo(0, -0.24, -0.022, -0.2);
  shape.closePath();
  const needleGeo = new ExtrudeGeometry(shape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.005,
    bevelSegments: 3,
    curveSegments: 12,
  });
  needle.add(new Mesh(needleGeo, orange));
  const hub = new Mesh(new CylinderGeometry(0.075, 0.082, 0.05, 48), steel);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.0;
  const cap = new Mesh(new CylinderGeometry(0.038, 0.042, 0.03, 32), orange);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.035;
  const needleRoot = new Group();
  needleRoot.add(needle, hub, cap);
  needle.position.z = 0.015;
  addLayer(needleRoot, 0.06, 0.27);

  // 8. glass — thin domed crystal with a sliding glint
  const capR = 1.045;
  const sag = 0.075;
  const R = (capR * capR + sag * sag) / (2 * sag);
  const glassGeo = new SphereGeometry(R, seg, 12, 0, Math.PI * 2, 0, Math.asin(capR / R));
  glassGeo.rotateX(Math.PI / 2);
  glassGeo.translate(0, 0, -R + sag);
  const glassMat = new MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0.02,
    transparent: true,
    opacity: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const glass = new Group();
  glass.add(new Mesh(glassGeo, glassMat));
  const glintMat = new MeshBasicMaterial({
    map: glintTexture(),
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    opacity: 0.42,
  });
  const glint = new Mesh(new CircleGeometry(1.03, 64), glintMat);
  glint.position.z = sag + 0.002;
  glass.add(glint);
  addLayer(glass, 0.115, 0.58);

  // ---------------------------------------------------------------- state
  const pose: Pose = { x: 0, y: 0, scale: 1, rotX: 0, rotY: 0, explode: 0, needle: 90 };
  const apply = () => {
    root.position.set(pose.x, pose.y, 0);
    root.scale.setScalar(pose.scale);
    body.rotation.set(pose.rotX, pose.rotY, 0);
    const e = pose.explode;
    for (const l of layers) l.obj.position.z = l.z + l.spread * e;
    needleRoot.rotation.z = (pose.needle - 90) * DEG;
    // the glint slides across the crystal as the gauge turns
    glintMat.map!.offset.set(pose.rotY * 0.35 - pose.rotX * 0.15, pose.rotX * 0.25);
    shadow.material.opacity = 1 - Math.min(1, e * 1.6);
  };

  const vh = () => 2 * Math.tan((FOV / 2) * DEG) * CAM_Z;

  return {
    setPose(p) {
      Object.assign(pose, p);
      apply();
    },
    render() {
      renderer.render(scene, camera);
    },
    resize(w, h, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    visibleHeight: vh,
    snapshot(size, mime = 'image/webp') {
      const prev = renderer.getSize(new Vector2());
      const prevDpr = renderer.getPixelRatio();
      const prevPose = { ...pose };
      renderer.setPixelRatio(1);
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      Object.assign(pose, { x: 0, y: 0, scale: (vh() * 0.92) / 2.5, rotX: 0.12, rotY: -0.36, explode: 0, needle: ZONE_ANGLE.neutral });
      apply();
      renderer.render(scene, camera);
      const url = canvas.toDataURL(mime, 0.92);
      Object.assign(pose, prevPose);
      apply();
      renderer.setPixelRatio(prevDpr);
      renderer.setSize(prev.x, prev.y, true);
      camera.aspect = prev.x / prev.y;
      camera.updateProjectionMatrix();
      return url;
    },
    dispose() {
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as Material | Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      envTex.dispose();
      renderer.dispose();
    },
  };
}
