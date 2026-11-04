'use client';
/**
 * مسرح التصوير المشترك: إضاءة سينمائية + بيئة انعكاس «استوديو» مولّدة محليًا،
 * ميلان مع المؤشر، وإيقاف الرسم عندما يخرج المشهد من الشاشة.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/** بيئة استوديو: جدران داكنة + لوحات ضوء (softboxes) بيضاء وشريط دافئ خفيف */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const env = new THREE.Scene();
    const room = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {},
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader:
          'varying vec3 vP; void main(){ float h = vP.y*.5+.5; vec3 c = mix(vec3(.10,.11,.12), vec3(.55,.57,.6), smoothstep(.2,1.,h)); gl_FragColor = vec4(c,1.); }',
      }),
    );
    env.add(room);
    const panel = (w: number, h: number, color: string, intensity: number, pos: [number, number, number]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    panel(14, 3, '#ffffff', 3.2, [0, 9, 3]); // علوي رئيسي
    panel(3, 10, '#ffffff', 2.2, [-10, 2, 4]); // جانبي
    panel(2, 8, '#eaf2ff', 1.6, [9, 1, -4]); // حافة باردة
    panel(6, 1.2, '#ff8a3d', 1.4, [4, -3, 8]); // شريط دافئ (لمسة البرتقالي)
    panel(8, 2, '#ffffff', 1.2, [0, 1, 12]); // أمامي ناعم
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(env, 0.02).texture;
    scene.environment = tex;
    scene.environmentIntensity = 1;
    return () => {
      scene.environment = null;
      tex.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** مجموعة تميل مع المؤشر وتتنفس ببطء */
export function Tilt({ children, base = [0, 0, 0], amount = [0.1, 0.16] }: { children: React.ReactNode; base?: [number, number, number]; amount?: [number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    const rx = base[0] - s.pointer.y * amount[0] + Math.sin(t * 0.5) * 0.012;
    const ry = base[1] + s.pointer.x * amount[1] + Math.sin(t * 0.35) * 0.025;
    g.current.rotation.x += (rx - g.current.rotation.x) * 0.05;
    g.current.rotation.y += (ry - g.current.rotation.y) * 0.05;
    g.current.rotation.z = base[2];
  });
  return <group ref={g} rotation={base}>{children}</group>;
}

function useInView<T extends Element>(margin = '150px') {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, near, visible };
}

export default function Stage({
  children,
  camera = { position: [0, 0, 8], fov: 32 },
  className = '',
  onReady,
}: {
  children: React.ReactNode;
  camera?: { position: [number, number, number]; fov: number };
  className?: string;
  onReady?: () => void;
}) {
  const { ref, near, visible } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`relative ${className}`}>
      {near && (
        <Canvas
          dpr={[1, 1.75]}
          frameloop={visible ? 'always' : 'never'}
          camera={camera}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
            onReady?.();
          }}
          style={{ touchAction: 'pan-y' }}
        >
          <StudioEnvironment />
          <ambientLight intensity={0.15} />
          <directionalLight position={[-4, 6, 5]} intensity={1.6} color="#fff4e8" />
          <directionalLight position={[5, 1, -3]} intensity={1.2} color="#dbe8ff" />
          <spotLight position={[3, -2, 6]} angle={0.5} penumbra={1} intensity={8} color="#ffb070" distance={20} />
          {children}
        </Canvas>
      )}
    </div>
  );
}
