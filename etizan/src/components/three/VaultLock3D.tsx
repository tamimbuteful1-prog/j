'use client';
/**
 * قفل الخزنة — قسم «إقفال اليوم».
 * 12 مزلاجًا كرومًا حول وجه فولاذي؛ كل جزء من هدف اليوم يُدخل مزلاجًا للداخل وتضيء رأسه بالبرتقالي.
 * عجلة الخزنة في الوسط تدور بخطوات ميكانيكية بطيئة، وعند الإقفال تدور دورة كاملة.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import Stage, { Tilt } from './Stage';
import { METAL } from './materials';

const BOLTS = 12;
const OUT = 1.78;
const IN = 1.36;

function easeInOut(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function Lock({ progress }: { progress: number }) {
  const mats = useMemo(
    () => ({ steel: METAL.steel('rings'), graphite: METAL.graphite(), chrome: METAL.chrome(), smoked: METAL.smoked(), orange: METAL.orange() }),
    [],
  );
  const face = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0.05),
      new THREE.Vector2(1.9, 0.05),
      new THREE.Vector2(2.06, 0.0),
      new THREE.Vector2(2.18, -0.12),
      new THREE.Vector2(2.2, -0.3),
      new THREE.Vector2(0, -0.3),
    ];
    const g = new THREE.LatheGeometry(pts, 128);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const bolts = useRef<(THREE.Group | null)[]>([]);
  const tips = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const wheel = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshPhysicalMaterial>(null);
  const st = useRef({ p: 0, eng: new Array(BOLTS).fill(0) as number[], spin: 0, doneSpin: 0, wasDone: false });

  useFrame((three, dt) => {
    const s = st.current;
    const t = three.clock.elapsedTime;
    s.p += (Math.max(0, Math.min(1, progress)) - s.p) * (1 - Math.exp(-dt * 2));
    const done = progress >= 1;

    for (let i = 0; i < BOLTS; i++) {
      const target = Math.max(0, Math.min(1, s.p * BOLTS - i));
      // كل مزلاج يتحرك بنابض قصير
      s.eng[i] += (target - s.eng[i]) * (1 - Math.exp(-dt * 6));
      const g = bolts.current[i];
      if (g) {
        const r = OUT + (IN - OUT) * easeInOut(s.eng[i]);
        const a = (i / BOLTS) * Math.PI * 2;
        g.position.set(Math.sin(a) * r, Math.cos(a) * r, 0.16);
      }
      const m = tips.current[i];
      if (m) {
        m.emissiveIntensity = 0.05 + s.eng[i] * 0.9;
        m.color.setRGB(0.25 + s.eng[i] * 0.75, 0.27 + s.eng[i] * 0.21, 0.3 - s.eng[i] * 0.22);
      }
    }

    // دوران خطوي: 30° كل ثانيتين مع تسارع وتباطؤ
    const step = 2.0;
    const k = Math.floor(t / step);
    const f = easeInOut(Math.min(1, (t % step) / 0.7));
    s.spin = (k + f) * (Math.PI / 6);
    if (done && !s.wasDone) s.doneSpin = 0;
    s.wasDone = done;
    if (done) s.doneSpin = Math.min(1, s.doneSpin + dt * 0.5);
    if (wheel.current) wheel.current.rotation.z = -s.spin - easeInOut(s.doneSpin) * Math.PI * 2;
    if (core.current) core.current.emissiveIntensity = done ? 0.6 + Math.sin(t * 2) * 0.15 : 0.05 + s.p * 0.25;
  });

  return (
    <Tilt base={[-0.32, 0, 0]} amount={[0.08, 0.14]}>
      <mesh geometry={face} material={mats.steel} />
      <mesh position={[0, 0, 0.02]} material={mats.graphite}>
        <torusGeometry args={[2.08, 0.08, 24, 160]} />
      </mesh>
      {/* مجاري المزاليج */}
      {Array.from({ length: BOLTS }, (_, i) => {
        const a = (i / BOLTS) * Math.PI * 2;
        return (
          <mesh key={'h' + i} position={[Math.sin(a) * 1.72, Math.cos(a) * 1.72, 0.08]} rotation={[0, 0, -a]} material={mats.graphite}>
            <boxGeometry args={[0.26, 0.62, 0.08]} />
          </mesh>
        );
      })}
      {/* المزاليج */}
      {Array.from({ length: BOLTS }, (_, i) => {
        const a = (i / BOLTS) * Math.PI * 2;
        return (
          <group key={'b' + i} ref={(g) => void (bolts.current[i] = g)} rotation={[0, 0, -a]}>
            <mesh material={mats.chrome}>
              <cylinderGeometry args={[0.085, 0.085, 0.5, 24]} />
            </mesh>
            <mesh position={[0, -0.27, 0]}>
              <sphereGeometry args={[0.09, 24, 16]} />
              <meshPhysicalMaterial ref={(m) => void (tips.current[i] = m)} metalness={0.8} roughness={0.25} clearcoat={1} emissive="#ff5a00" />
            </mesh>
          </group>
        );
      })}
      {/* عجلة الخزنة */}
      <group ref={wheel} position={[0, 0, 0.2]}>
        <mesh material={mats.chrome} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.56, 0.22, 64]} />
        </mesh>
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2;
          return (
            <group key={k} rotation={[0, 0, -a]}>
              <mesh position={[0, 0.82, 0.02]} material={mats.graphite}>
                <cylinderGeometry args={[0.055, 0.07, 0.72, 20]} />
              </mesh>
              <mesh position={[0, 1.2, 0.02]} material={mats.chrome}>
                <sphereGeometry args={[0.11, 32, 24]} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 0, 0.12]} material={mats.smoked} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.36, 48, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <torusGeometry args={[0.38, 0.03, 16, 96]} />
          <meshPhysicalMaterial ref={core} color="#ff7a1f" metalness={0.7} roughness={0.25} emissive="#ff5a00" />
        </mesh>
      </group>
    </Tilt>
  );
}

export default function VaultLock3D({ progress }: { progress: number }) {
  return (
    <Stage className="h-full w-full" camera={{ position: [0, 0, 8.4], fov: 32 }}>
      <Lock progress={progress} />
    </Stage>
  );
}
