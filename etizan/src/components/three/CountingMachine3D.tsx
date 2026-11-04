'use client';
/**
 * آلة عدّ النقود — قسم «دخل اليوم».
 * هيكل غرافيت وفولاذ، خزان أوراق في الأعلى، بكرات كروم تدور، وأوراق تخرج إلى الدرج الأمامي
 * بإيقاع هادئ. الشاشة البرتقالية تعدّ حتى دخل اليوم.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Stage, { Tilt } from './Stage';
import { METAL, roundedBox } from './materials';

const NOTE = { w: 1.25, d: 0.6, h: 0.014 };
const BATCH = 14;
const PERIOD = 0.55; // ثانية لكل ورقة

function useDisplay() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 176;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    let last = '';
    const draw = (value: number) => {
      const txt = Math.round(value).toLocaleString('en-US');
      if (txt === last) return;
      last = txt;
      const g = c.getContext('2d')!;
      const bg = g.createLinearGradient(0, 0, 0, c.height);
      bg.addColorStop(0, '#0d0f11');
      bg.addColorStop(1, '#16191c');
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      g.font = '600 26px Helvetica, Arial, sans-serif';
      g.fillStyle = 'rgba(255,138,61,.55)';
      g.textAlign = 'left';
      g.fillText('SAR', 28, 46);
      g.font = '700 108px "SF Mono", Menlo, Consolas, monospace';
      g.textAlign = 'right';
      g.shadowColor = '#ff6a00';
      g.shadowBlur = 22;
      g.fillStyle = '#ff9a4d';
      g.fillText(txt, c.width - 30, 140);
      g.shadowBlur = 0;
      tex.needsUpdate = true;
    };
    return { tex, draw };
  }, []);
}

function Machine({ amount }: { amount: number }) {
  const { camera } = useThree();
  useEffect(() => camera.lookAt(0, -0.1, 0), [camera]);

  const mats = useMemo(
    () => ({
      body: METAL.graphite(),
      steel: METAL.steel(),
      chrome: METAL.chrome(),
      smoked: METAL.smoked(),
      orange: METAL.orange(),
      noteA: new THREE.MeshStandardMaterial({ color: '#c9d4bd', roughness: 0.85 }),
      noteB: new THREE.MeshStandardMaterial({ color: '#bfcbb2', roughness: 0.85 }),
    }),
    [],
  );
  const geo = useMemo(
    () => ({
      body: roundedBox(2.7, 1.0, 1.9, 0.16, 0.05),
      top: roundedBox(2.6, 0.14, 1.8, 0.06, 0.03),
      panel: roundedBox(1.12, 0.46, 0.08, 0.06, 0.02),
      note: new THREE.BoxGeometry(NOTE.w, NOTE.h, NOTE.d),
      tray: roundedBox(1.55, 0.06, 0.9, 0.025, 0.01),
      guide: roundedBox(0.06, 0.5, 0.8, 0.02, 0.01),
    }),
    [],
  );
  const display = useDisplay();
  const rollers = useRef<THREE.Group>(null);
  const hopper = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);
  const flyers = useRef<(THREE.Mesh | null)[]>([]);
  const st = useRef({ shown: 0, t0: -1 });

  useFrame((three, dt) => {
    const t = three.clock.elapsedTime;
    const s = st.current;
    if (s.t0 < 0) s.t0 = t;
    // العدّاد: يبدأ من صفر ويتسارع ثم يتباطأ نحو المبلغ
    s.shown += (amount - s.shown) * (1 - Math.exp(-dt * 1.6));
    display.draw(Math.abs(amount - s.shown) < 0.5 ? amount : s.shown);

    const run = t - s.t0;
    const cycle = BATCH * PERIOD + 1.4; // دفعة ثم توقف قصير
    const ct = run % cycle;
    const fed = Math.min(BATCH, Math.floor(ct / PERIOD));
    const feeding = ct < BATCH * PERIOD;

    if (rollers.current) rollers.current.children.forEach((r, i) => (r.rotation.x += (feeding ? 14 : 1.2) * dt * (i % 2 ? -1 : 1)));

    // الخزان: الأوراق المتبقية
    if (hopper.current)
      hopper.current.children.forEach((n, i) => {
        const remain = BATCH - fed;
        n.visible = i < remain || !feeding;
        if (i === remain - 1 && feeding) n.position.y = i * NOTE.h * 1.6 + Math.sin(t * 40) * 0.004;
      });
    // الدرج الأمامي: الأوراق المعدودة
    if (stack.current) {
      const fadeOut = feeding ? 1 : Math.max(0, 1 - (ct - BATCH * PERIOD) / 1.2);
      stack.current.children.forEach((n, i) => {
        n.visible = i < fed && fadeOut > 0.02;
        n.position.y = i * NOTE.h * 1.5 - (1 - fadeOut) * 0.25;
      });
    }
    // الأوراق الطائرة من الفتحة إلى الدرج
    flyers.current.forEach((m, k) => {
      if (!m) return;
      if (!feeding) {
        m.visible = false;
        return;
      }
      const local = (ct - k * (PERIOD / 2)) % PERIOD;
      const p = Math.max(0, local / PERIOD);
      const e = 1 - Math.pow(1 - p, 2.2);
      m.visible = local >= 0 && fed < BATCH;
      m.position.set(-0.32, -0.12 - e * 0.36 + Math.sin(p * Math.PI) * 0.08, 0.86 + e * 0.5);
      m.rotation.x = Math.sin(p * Math.PI) * 0.35 - 0.05;
    });
  });

  return (
    <Tilt base={[0.08, -0.55, 0]} amount={[0.06, 0.14]}>
      <group position={[0, -0.05, 0]}>
        {/* الهيكل */}
        <mesh geometry={geo.body} material={mats.body} position={[0, -0.2, 0]} />
        <mesh geometry={geo.top} material={mats.steel} position={[0, 0.36, 0]} />
        {/* فتحة الخروج + بكرات */}
        <mesh position={[-0.32, -0.12, 0.93]} material={mats.smoked}>
          <boxGeometry args={[1.45, 0.16, 0.06]} />
        </mesh>
        <group ref={rollers} position={[-0.32, -0.12, 0.9]}>
          {[-0.045, 0.045].map((y, i) => (
            <mesh key={i} position={[0, y, 0.02]} rotation={[0, 0, Math.PI / 2]} material={mats.chrome}>
              <cylinderGeometry args={[0.042, 0.042, 1.36, 24]} />
            </mesh>
          ))}
        </group>
        {/* لوحة العرض البرتقالية */}
        <group position={[0.84, 0.47, 0.52]} rotation={[-0.62, 0, 0]}>
          <mesh geometry={geo.panel} material={mats.smoked} />
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.0, 0.34]} />
            <meshBasicMaterial map={display.tex} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.27, 0]} material={mats.chrome}>
            <boxGeometry args={[1.12, 0.03, 0.09]} />
          </mesh>
        </group>
        {/* أزرار */}
        {[0.42, 0.66].map((x) => (
          <mesh key={x} position={[x + 0.2, 0.45, 0.88]} rotation={[Math.PI / 2, 0, 0]} material={x === 0.42 ? mats.orange : mats.chrome}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 32]} />
          </mesh>
        ))}
        {/* الخزان العلوي */}
        <group position={[-0.32, 0.46, -0.32]} rotation={[0.28, 0, 0]}>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} geometry={geo.guide} material={mats.chrome} position={[x, 0.2, 0]} />
          ))}
          <mesh position={[0, 0.2, -0.42]} material={mats.steel}>
            <boxGeometry args={[1.46, 0.5, 0.04]} />
          </mesh>
          <group ref={hopper} position={[0, 0.03, 0]}>
            {Array.from({ length: BATCH }, (_, i) => (
              <mesh key={i} geometry={geo.note} material={i % 2 ? mats.noteA : mats.noteB} position={[(i % 3) * 0.006, i * NOTE.h * 1.6, (i % 2) * 0.008]} />
            ))}
          </group>
        </group>
        {/* الدرج الأمامي */}
        <mesh geometry={geo.tray} material={mats.steel} position={[-0.32, -0.66, 1.18]} />
        <group ref={stack} position={[-0.32, -0.6, 1.2]}>
          {Array.from({ length: BATCH }, (_, i) => (
            <mesh key={i} geometry={geo.note} material={i % 2 ? mats.noteA : mats.noteB} position={[((i * 7) % 5) * 0.004 - 0.008, i * NOTE.h * 1.5, ((i * 3) % 4) * 0.004]} visible={false} />
          ))}
        </group>
        {[0, 1].map((k) => (
          <mesh key={k} ref={(m) => void (flyers.current[k] = m)} geometry={geo.note} material={mats.noteA} visible={false} />
        ))}
      </group>
    </Tilt>
  );
}

export default function CountingMachine3D({ amount }: { amount: number }) {
  return (
    <Stage className="h-full w-full" camera={{ position: [0, 1.7, 6.6], fov: 30 }}>
      <Machine amount={amount} />
    </Stage>
  );
}
