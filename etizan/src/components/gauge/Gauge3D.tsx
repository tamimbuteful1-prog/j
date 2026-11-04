'use client';
/**
 * العداد المعدني — بطل اتزان.
 * إطار فولاذي مصقول بحلقات تفريش، مجرى غرافيت، حلقة تقدّم برتقالية مؤكسدة،
 * مؤشر كروم يتحرك على المحيط، وقبة زجاج مدخّن في الوسط تُعرض فوقها القراءة.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Stage, { Tilt } from '../three/Stage';
import { METAL } from '../three/materials';

export interface GaugeVisual {
  progress: number; // 0..1
  colorA: string;
  colorB: string;
  pulseKey: number;
}

const R = 1.62;
const TILT = -0.4;

function Bezel() {
  const geom = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // مقطع إطار: قاعدة → حافة خارجية مستديرة → شفة → وجه مقعر
    pts.push(new THREE.Vector2(0, -0.2));
    pts.push(new THREE.Vector2(2.1, -0.2));
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      pts.push(new THREE.Vector2(2.1 + Math.cos(a) * 0.2, Math.sin(a) * 0.2));
    }
    pts.push(new THREE.Vector2(2.18, 0.22));
    pts.push(new THREE.Vector2(2.02, 0.24));
    pts.push(new THREE.Vector2(1.98, 0.1));
    pts.push(new THREE.Vector2(0.8, 0.07));
    pts.push(new THREE.Vector2(0, 0.07));
    const g = new THREE.LatheGeometry(pts, 160);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const steel = useMemo(() => METAL.steel('rings'), []);
  return <mesh geometry={geom} material={steel} position={[0, 0, -0.05]} />;
}

function Ticks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 60;
  const mat = useMemo(() => METAL.chrome(), []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const major = i % 5 === 0;
      o.position.set(Math.sin(a) * 1.95, Math.cos(a) * 1.95, 0.08);
      o.rotation.set(0, 0, -a);
      o.scale.set(major ? 1.4 : 1, major ? 1.9 : 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, mat, COUNT]}>
      <boxGeometry args={[0.025, 0.08, 0.03]} />
    </instancedMesh>
  );
}

function useProgressMaterial(uniforms: { uProgress: { value: number }; uA: { value: THREE.Color }; uB: { value: THREE.Color } }) {
  return useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ metalness: 0.7, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.06 });
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
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += gCol * (0.05 + 0.25 * gT);');
    };
    return m;
  }, [uniforms]);
}

function Gauge({ visual }: { visual: GaugeVisual }) {
  const index = useRef<THREE.Group>(null);
  const glow = useRef<THREE.PointLight>(null);
  const cap = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const dome = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uA: { value: new THREE.Color(visual.colorA) }, uB: { value: new THREE.Color(visual.colorB) } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const progMat = useProgressMaterial(uniforms);
  const mats = useMemo(() => ({ chrome: METAL.chrome(), graphite: METAL.graphite('rings'), smoked: METAL.smoked(), orange: METAL.orange() }), []);
  const tA = useMemo(() => new THREE.Color(), []);
  const tB = useMemo(() => new THREE.Color(), []);
  const st = useRef({ p: 0, v: 0, ripple: 1, bounce: 0, key: visual.pulseKey });

  useEffect(() => {
    if (visual.pulseKey !== st.current.key) {
      st.current.key = visual.pulseKey;
      st.current.ripple = 0;
      st.current.bounce = 1;
    }
  }, [visual.pulseKey]);

  useFrame((three, dt) => {
    const s = st.current;
    const t = three.clock.elapsedTime;
    // حركة ميكانيكية: نابض مخمَّد (تجاوز بسيط ثم استقرار)
    const target = Math.max(0, Math.min(1, visual.progress));
    const acc = (target - s.p) * 38 - s.v * 9;
    s.v += acc * Math.min(dt, 0.05);
    s.p += s.v * Math.min(dt, 0.05);
    const shown = Math.max(0.0001, Math.min(1, s.p));
    uniforms.uProgress.value = shown;

    const k = 1 - Math.exp(-dt * 3);
    tA.set(visual.colorA);
    tB.set(visual.colorB);
    uniforms.uA.value.lerp(tA, k);
    uniforms.uB.value.lerp(tB, k);

    const a = shown * Math.PI * 2;
    if (index.current) index.current.rotation.z = -a;
    if (glow.current) {
      glow.current.position.set(Math.sin(a) * R, Math.cos(a) * R, 0.6);
      glow.current.color.copy(uniforms.uB.value);
      glow.current.intensity = 2.2 + Math.sin(t * 2.4) * 0.4;
    }
    if (cap.current) cap.current.visible = s.p > 0.004;

    s.bounce *= Math.exp(-dt * 3);
    if (dome.current) dome.current.position.z = 0.22 + s.bounce * 0.06;

    if (ripple.current) {
      s.ripple = Math.min(1, s.ripple + dt * 0.8);
      const e = 1 - Math.pow(1 - s.ripple, 3);
      ripple.current.scale.setScalar(1 + e * 0.25);
      const m = ripple.current.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - e) * 0.5;
      m.color.copy(uniforms.uB.value);
      ripple.current.visible = s.ripple < 1;
    }
  });

  return (
    <Tilt base={[TILT, 0, 0]}>
      <group position={[0, -0.1, 0]}>
        <Bezel />
        <Ticks />
        {/* مجرى غرافيت */}
        <mesh position={[0, 0, 0.14]} material={mats.graphite}>
          <torusGeometry args={[R, 0.13, 32, 200]} />
        </mesh>
        {/* حلقة التقدم: من الأعلى مع عقارب الساعة */}
        <mesh position={[0, 0, 0.18]} rotation={[0, Math.PI, Math.PI / 2]} material={progMat}>
          <torusGeometry args={[R, 0.142, 40, 260]} />
        </mesh>
        <mesh ref={cap} position={[0, R, 0.18]} material={mats.orange}>
          <sphereGeometry args={[0.143, 32, 32]} />
        </mesh>
        {/* المؤشر: ذراع كروم بخرزة */}
        <group ref={index} position={[0, 0, 0.18]}>
          <mesh position={[0, R, 0]} material={mats.chrome}>
            <sphereGeometry args={[0.2, 48, 48]} />
          </mesh>
          <mesh position={[0, R + 0.36, 0.02]} material={mats.chrome}>
            <coneGeometry args={[0.07, 0.22, 24]} />
          </mesh>
        </group>
        <pointLight ref={glow} distance={2.6} decay={2} />
        <mesh ref={ripple} position={[0, 0, 0.16]} visible={false}>
          <torusGeometry args={[R, 0.03, 12, 160]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
        {/* قبة زجاج مدخّن بحلقة كروم */}
        <mesh position={[0, 0, 0.1]} material={mats.chrome}>
          <torusGeometry args={[1.16, 0.05, 24, 160]} />
        </mesh>
        <mesh ref={dome} position={[0, 0, 0.22]} scale={[1, 1, 0.42]} material={mats.smoked}>
          <sphereGeometry args={[1.13, 96, 64]} />
        </mesh>
      </group>
    </Tilt>
  );
}

export default function Gauge3D({ visual, onReady }: { visual: GaugeVisual; onReady?: () => void }) {
  return (
    <Stage className="h-full w-full" camera={{ position: [0, 0, 8.9], fov: 32 }} onReady={onReady}>
      <Gauge visual={visual} />
    </Stage>
  );
}
