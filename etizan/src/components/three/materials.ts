/**
 * خامات معدنية مشتركة لكل مجسمات اتزان.
 * خرائط الخشونة «المصقولة» تُولَّد على Canvas بدون أي ملفات خارجية.
 */
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

/** خطوط تفريش: 'linear' لأسطح مستقيمة، 'rings' تعطي حلقات متحدة المركز على Lathe/Circle */
export function brushedTexture(kind: 'linear' | 'rings' = 'linear', size = 512): THREE.Texture {
  const key = kind + size;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7a7a7a';
  g.fillRect(0, 0, size, size);
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < size * 3; i++) {
    const y = rnd() * size;
    const v = 90 + rnd() * 90;
    g.strokeStyle = `rgba(${v},${v},${v},${0.18 + rnd() * 0.25})`;
    g.lineWidth = 0.5 + rnd() * 1.2;
    g.beginPath();
    // خط أفقي كامل: على Lathe يتحول إلى حلقة حول المحور
    g.moveTo(0, y);
    g.lineTo(size, y + (rnd() - 0.5) * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  // ملاحظة: على LatheGeometry الخطوط الأفقية تصبح حلقات متحدة المركز تلقائيًا
  t.anisotropy = 8;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

export const METAL = {
  steel: (kind: 'linear' | 'rings' = 'linear') =>
    new THREE.MeshPhysicalMaterial({
      color: '#c9cdd1',
      metalness: 1,
      roughness: 0.34,
      roughnessMap: brushedTexture(kind),
      clearcoat: 0.25,
      clearcoatRoughness: 0.2,
    }),
  chrome: () => new THREE.MeshPhysicalMaterial({ color: '#f2f4f6', metalness: 1, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }),
  graphite: (kind: 'linear' | 'rings' = 'linear') =>
    new THREE.MeshPhysicalMaterial({
      color: '#3a3f45',
      metalness: 0.9,
      roughness: 0.42,
      roughnessMap: brushedTexture(kind),
      clearcoat: 0.5,
      clearcoatRoughness: 0.25,
    }),
  smoked: () => new THREE.MeshPhysicalMaterial({ color: '#16191c', metalness: 0.3, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }),
  orange: () =>
    new THREE.MeshPhysicalMaterial({ color: '#ff7a1f', metalness: 0.75, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08, emissive: '#ff5a00', emissiveIntensity: 0.12 }),
};

/** صندوق بحواف مستديرة (ExtrudeGeometry) */
export function roundedBox(w: number, h: number, d: number, r: number, bevel = 0.03): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - bevel * 2, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 10 });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}
