'use client';
/**
 * لوحة أرقام ميكانيكية (split-flap) — قسم «النتائج».
 * كل خانة نصفان؛ عند تغيّر الرقم يسقط النصف العلوي بتسارع ثم يستقر بارتداد خفيف.
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Stage, { Tilt } from './Stage';
import { METAL, roundedBox } from './materials';

export const FLIP_CELLS = 6;
const CW = 0.62;
const CH = 0.92;
const GAP = 0.08;
const CHARS = ' 0123456789-';

function useCharTextures() {
  return useMemo(() => {
    const map = new Map<string, THREE.CanvasTexture>();
    for (const ch of CHARS) {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 380;
      const g = c.getContext('2d')!;
      const bg = g.createLinearGradient(0, 0, 0, c.height);
      bg.addColorStop(0, '#24282c');
      bg.addColorStop(0.5, '#1a1d20');
      bg.addColorStop(0.5, '#141619');
      bg.addColorStop(1, '#1c1f22');
      g.fillStyle = bg;
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#f2efe9';
      g.font = '700 300px Helvetica, Arial, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(ch, c.width / 2, c.height / 2 + 12);
      g.fillStyle = '#07080a';
      g.fillRect(0, c.height / 2 - 3, c.width, 6);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      map.set(ch, t);
    }
    return map;
  }, []);
}

function halfGeo(top: boolean) {
  const g = new THREE.PlaneGeometry(CW, CH / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, top ? 0.5 + uv.getY(i) * 0.5 : uv.getY(i) * 0.5);
  uv.needsUpdate = true;
  return g;
}

function Cell({ ch, x, delay, tex }: { ch: string; x: number; delay: number; tex: Map<string, THREE.CanvasTexture> }) {
  const geos = useMemo(() => ({ top: halfGeo(true), bottom: halfGeo(false) }), []);
  const mk = () => new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, map: tex.get(' ')! });
  /* eslint-disable react-hooks/exhaustive-deps */
  const mTop = useMemo(mk, []);
  const mBottom = useMemo(mk, []);
  const mFlapF = useMemo(mk, []);
  const mFlapB = useMemo(mk, []);
  /* eslint-enable react-hooks/exhaustive-deps */
  const flap = useRef<THREE.Group>(null);
  const st = useRef({ from: ' ', to: ' ', t: 1, wait: 0 });

  useEffect(() => {
    const s = st.current;
    if (ch === s.to) return;
    s.from = s.t >= 1 ? s.to : s.from;
    s.to = ch;
    s.t = 0;
    s.wait = delay;
    mTop.map = tex.get(s.to)!;
    mFlapF.map = tex.get(s.from)!;
    mFlapB.map = tex.get(s.to)!;
    mBottom.map = tex.get(s.from)!;
    [mTop, mFlapF, mFlapB, mBottom].forEach((m) => (m.needsUpdate = true));
  }, [ch, delay, tex, mTop, mFlapF, mFlapB, mBottom]);

  useFrame((_, dt) => {
    const s = st.current;
    if (!flap.current) return;
    if (s.t >= 1) {
      flap.current.visible = false;
      return;
    }
    if (s.wait > 0) {
      s.wait -= dt;
      flap.current.visible = false;
      return;
    }
    s.t = Math.min(1, s.t + dt / 0.42);
    // سقوط بتسارع + ارتداد صغير عند النهاية
    const e = s.t < 0.82 ? Math.pow(s.t / 0.82, 2) : 1 + Math.sin(((s.t - 0.82) / 0.18) * Math.PI) * -0.04;
    flap.current.visible = true;
    flap.current.rotation.x = Math.min(1.04, e) * Math.PI;
    if (s.t >= 1) {
      mBottom.map = tex.get(s.to)!;
      mBottom.needsUpdate = true;
      flap.current.visible = false;
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geos.top} material={mTop} position={[0, CH / 4 + 0.004, 0]} />
      <mesh geometry={geos.bottom} material={mBottom} position={[0, -CH / 4 - 0.004, 0]} />
      <group ref={flap} position={[0, 0, 0.004]}>
        <mesh geometry={geos.top} material={mFlapF} position={[0, CH / 4 + 0.004, 0]} />
        <mesh geometry={geos.bottom} material={mFlapB} position={[0, CH / 4 + 0.004, 0]} rotation={[Math.PI, 0, 0]} />
      </group>
    </group>
  );
}

function Board({ text }: { text: string }) {
  const { camera } = useThree();
  useEffect(() => camera.lookAt(0, 0, 0), [camera]);
  const tex = useCharTextures();
  const total = FLIP_CELLS * CW + (FLIP_CELLS - 1) * GAP;
  const mats = useMemo(() => ({ graphite: METAL.graphite(), steel: METAL.steel(), chrome: METAL.chrome(), orange: METAL.orange() }), []);
  const geo = useMemo(
    () => ({ housing: roundedBox(total + 0.5, CH + 0.6, 0.55, 0.18, 0.06), bezel: roundedBox(total + 0.22, CH + 0.26, 0.1, 0.08, 0.02) }),
    [total],
  );
  const chars = text.padStart(FLIP_CELLS, ' ').slice(-FLIP_CELLS).split('');
  return (
    <Tilt base={[-0.06, 0, 0]} amount={[0.08, 0.16]}>
      <mesh geometry={geo.housing} material={mats.steel} position={[0, 0, -0.3]} />
      <mesh geometry={geo.bezel} material={mats.graphite} position={[0, 0, -0.04]} />
      <group position={[0, 0, 0.05]}>
        {chars.map((c, i) => (
          <Cell key={i} ch={c} x={-total / 2 + CW / 2 + i * (CW + GAP)} delay={(FLIP_CELLS - 1 - i) * 0.07} tex={tex} />
        ))}
      </group>
      {/* محور المفصلات */}
      <mesh position={[0, 0, 0.06]} rotation={[0, 0, Math.PI / 2]} material={mats.graphite}>
        <cylinderGeometry args={[0.012, 0.012, total + 0.1, 12]} />
      </mesh>
      {/* مسامير الزوايا */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh key={`${sx}${sy}`} position={[sx * (total / 2 + 0.14), sy * (CH / 2 + 0.2), 0.03]} rotation={[Math.PI / 2, 0, 0]} material={sx < 0 && sy > 0 ? mats.orange : mats.chrome}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 20]} />
          </mesh>
        )),
      )}
    </Tilt>
  );
}

export default function FlipBoard3D({ text }: { text: string }) {
  return (
    <Stage className="h-full w-full" camera={{ position: [0, 0.3, 7.2], fov: 30 }}>
      <Board text={text} />
    </Stage>
  );
}
