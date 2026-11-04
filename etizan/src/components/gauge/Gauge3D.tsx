'use client';
/**
 * العداد الثلاثي الأبعاد — قلب اتزان.
 * قاعدة خزفية + مجرى + حلقة تقدّم بتدرّج لوني + خرزة طرفية مضيئة + لؤلؤة مركزية عائمة.
 * كل القيم تتحرك بتخميد ناعم، ويتفاعل مع حركة الإصبع/الماوس.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface GaugeVisual {
  progress: number; // 0..1
  colorA: string;
  colorB: string;
  pulseKey: number; // يتغير عند تحديث البيانات → نبضة
}

const R = 1.62; // نصف قطر الحلقة
const TILT = -0.42;

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** قاعدة دائرية ناعمة الحواف (Lathe) */
function Plinth() {
  const geom = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const rOut = 2.28;
    const h = 0.34;
    const bevel = 0.16;
    pts.push(new THREE.Vector2(0, -h / 2));
    pts.push(new THREE.Vector2(rOut - bevel, -h / 2));
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI;
      pts.push(new THREE.Vector2(rOut - bevel + Math.cos(a) * bevel, Math.sin(a) * (h / 2)));
    }
    // حافة داخلية خفيفة ثم سطح مقعر قليلًا
    pts.push(new THREE.Vector2(rOut - bevel - 0.1, h / 2 - 0.01));
    pts.push(new THREE.Vector2(2.0, h / 2 - 0.05));
    pts.push(new THREE.Vector2(1.2, h / 2 - 0.08));
    pts.push(new THREE.Vector2(0, h / 2 - 0.09));
    const g = new THREE.LatheGeometry(pts, 128);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <mesh geometry={geom} position={[0, 0, -0.05]}>
      <meshPhysicalMaterial color="#fbfaf6" roughness={0.42} clearcoat={0.7} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#eef6f2" />
    </mesh>
  );
}

function Ticks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 72;
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const major = i % 6 === 0;
      const r = 1.98;
      o.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.14);
      o.rotation.set(0, 0, -a);
      o.scale.set(1, major ? 1.6 : 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[0.022, 0.09, 0.02]} />
      <meshStandardMaterial color="#cdd5d0" roughness={0.6} />
    </instancedMesh>
  );
}

function useProgressMaterial(uniforms: { uProgress: { value: number }; uA: { value: THREE.Color }; uB: { value: THREE.Color } }) {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ roughness: 0.16, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.06 });
    m.defines = { ...(m.defines ?? {}), USE_UV: '' };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uProgress = uniforms.uProgress;
      sh.uniforms.uA = uniforms.uA;
      sh.uniforms.uB = uniforms.uB;
      sh.fragmentShader =
        'uniform float uProgress;\nuniform vec3 uA;\nuniform vec3 uB;\n' +
        sh.fragmentShader
          .replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            `if (vUv.x > uProgress) discard;
             float gT = smoothstep(0.0, max(uProgress, 0.0001), vUv.x);
             vec3 gCol = mix(uA, uB, gT);
             vec4 diffuseColor = vec4( gCol, opacity );`,
          )
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += gCol * (0.04 + 0.16 * gT);');
    };
    return m;
  }, [uniforms]);
}

function Gauge({ visual }: { visual: GaugeVisual }) {
  const group = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  const bead = useRef<THREE.Mesh>(null);
  const beadLight = useRef<THREE.PointLight>(null);
  const startCap = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const sat1 = useRef<THREE.Mesh>(null);
  const sat2 = useRef<THREE.Mesh>(null);
  const orbMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const beadMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const capMat = useRef<THREE.MeshPhysicalMaterial>(null);

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uA: { value: new THREE.Color(visual.colorA) }, uB: { value: new THREE.Color(visual.colorB) } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const progMat = useProgressMaterial(uniforms);
  const targetA = useMemo(() => new THREE.Color(), []);
  const targetB = useMemo(() => new THREE.Color(), []);
  const state = useRef({ p: 0, ripple: 1, bounce: 0, lastKey: visual.pulseKey });

  useEffect(() => {
    if (visual.pulseKey !== state.current.lastKey) {
      state.current.lastKey = visual.pulseKey;
      state.current.ripple = 0;
      state.current.bounce = 1;
    }
  }, [visual.pulseKey]);

  useFrame((three, dt) => {
    const s = state.current;
    const t = three.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 3.2);
    const target = Math.max(0, Math.min(1, visual.progress));
    s.p += (target - s.p) * k;
    // حد أدنى مرئي صغير حتى تظهر الخرزة دائمًا
    const shown = Math.max(0.0001, s.p);
    uniforms.uProgress.value = shown;

    targetA.set(visual.colorA);
    targetB.set(visual.colorB);
    uniforms.uA.value.lerp(targetA, k);
    uniforms.uB.value.lerp(targetB, k);

    // ميلان مع المؤشر + تنفّس خفيف
    if (group.current) {
      const px = three.pointer.x;
      const py = three.pointer.y;
      const rx = TILT + py * 0.1 + Math.sin(t * 0.6) * 0.015;
      const ry = -px * 0.16 + Math.sin(t * 0.4) * 0.03;
      group.current.rotation.x += (rx - group.current.rotation.x) * 0.06;
      group.current.rotation.y += (ry - group.current.rotation.y) * 0.06;
    }

    // الخرزة عند طرف التقدم (الحلقة تبدأ من الأعلى وتدور مع عقارب الساعة)
    const a = shown * Math.PI * 2;
    if (bead.current) {
      bead.current.position.set(Math.sin(a) * R, Math.cos(a) * R, 0.24);
      const sc = 1 + Math.sin(t * 3) * 0.04 + s.bounce * 0.35;
      bead.current.scale.setScalar(sc);
    }
    if (beadLight.current) {
      beadLight.current.position.set(Math.sin(a) * R, Math.cos(a) * R, 0.7);
      beadLight.current.color.copy(uniforms.uB.value);
    }
    if (beadMat.current) beadMat.current.emissive.copy(uniforms.uB.value);
    if (capMat.current) capMat.current.color.copy(uniforms.uA.value);
    if (startCap.current) startCap.current.visible = s.p > 0.004;

    // اللؤلؤة العائمة
    s.bounce *= Math.exp(-dt * 3);
    if (orb.current) {
      orb.current.position.z = 0.55 + Math.sin(t * 1.1) * 0.05 + s.bounce * 0.12;
      orb.current.rotation.y = t * 0.25;
      orb.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    if (orbMat.current) orbMat.current.sheenColor.copy(uniforms.uB.value);

    // نبضة عند التحديث
    if (ripple.current) {
      s.ripple = Math.min(1, s.ripple + dt * 0.9);
      const e = 1 - Math.pow(1 - s.ripple, 3);
      ripple.current.scale.setScalar(1 + e * 0.28);
      const m = ripple.current.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - e) * 0.45;
      m.color.copy(uniforms.uB.value);
      ripple.current.visible = s.ripple < 1;
    }

    // أقمار صغيرة تدور
    if (sat1.current) sat1.current.position.set(Math.sin(t * 0.5) * 2.42, Math.cos(t * 0.5) * 2.42, 0.1);
    if (sat2.current) sat2.current.position.set(Math.sin(-t * 0.33 + 2) * 2.5, Math.cos(-t * 0.33 + 2) * 2.5, 0.05);
  });

  return (
    <group ref={group} position={[0, -0.12, 0]} rotation={[TILT, 0, 0]}>
      <Plinth />
      <Ticks />
      {/* المجرى */}
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[R, 0.13, 32, 200]} />
        <meshPhysicalMaterial color="#dde4e0" roughness={0.6} clearcoat={0.2} />
      </mesh>
      {/* حلقة التقدم: تبدأ من الأعلى مع عقارب الساعة */}
      <mesh position={[0, 0, 0.24]} rotation={[0, Math.PI, Math.PI / 2]} material={progMat}>
        <torusGeometry args={[R, 0.145, 40, 260]} />
      </mesh>
      <mesh ref={startCap} position={[0.0, R, 0.24]}>
        <sphereGeometry args={[0.146, 32, 32]} />
        <meshPhysicalMaterial ref={capMat} roughness={0.16} clearcoat={1} />
      </mesh>
      <mesh ref={bead}>
        <sphereGeometry args={[0.2, 48, 48]} />
        <meshPhysicalMaterial ref={beadMat} color="#ffffff" emissiveIntensity={0.55} roughness={0.1} clearcoat={1} />
      </mesh>
      <pointLight ref={beadLight} intensity={1.6} distance={2.4} decay={2} />
      {/* نبضة */}
      <mesh ref={ripple} position={[0, 0, 0.22]} visible={false}>
        <torusGeometry args={[R, 0.03, 12, 160]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {/* اللؤلؤة */}
      <mesh ref={orb} position={[0, 0, 0.55]}>
        <sphereGeometry args={[1.12, 96, 96]} />
        <meshPhysicalMaterial
          ref={orbMat}
          color="#ffffff"
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.05}
          iridescence={0.45}
          iridescenceIOR={1.25}
          sheen={0.8}
          sheenRoughness={0.4}
        />
      </mesh>
      <mesh ref={sat1}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#3cc49d" emissive="#3cc49d" emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={sat2}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#6db5ea" emissive="#6db5ea" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

export default function Gauge3D({ visual, onReady }: { visual: GaugeVisual; onReady?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8.9], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
        onReady?.();
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <Environment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 4, 5]} intensity={1.1} color="#fff6ea" />
      <directionalLight position={[4, -2, 3]} intensity={0.45} color="#d8ecff" />
      <Gauge visual={visual} />
    </Canvas>
  );
}
