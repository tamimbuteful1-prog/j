/**
 * Tiny 2.5D engine: a perspective camera orbiting a ground plane.
 * World: x = east, y = south (ground), z = up. Units ~ px at zoom 1.
 */
export type Cam = {
  x: number; // target on the ground
  y: number;
  dist: number; // camera distance from target
  tilt: number; // degrees, 0 = top-down
  yaw: number; // degrees
  W: number;
  H: number;
  fov: number; // focal length multiplier
};

export type P3 = [number, number, number];
export type P2 = {x: number; y: number; d: number; s: number};

const rad = (d: number) => (d * Math.PI) / 180;

export const project = (c: Cam, [px, py, pz]: P3): P2 => {
  const dx = px - c.x;
  const dy = py - c.y;
  const cy = Math.cos(rad(-c.yaw));
  const sy = Math.sin(rad(-c.yaw));
  const rx = dx * cy - dy * sy;
  const ry = dx * sy + dy * cy;
  const ct = Math.cos(rad(c.tilt));
  const st = Math.sin(rad(c.tilt));
  const Y = ry * ct - pz * st;
  const depth = Math.max(40, c.dist - ry * st - pz * ct);
  const f = (c.fov * c.H) / depth;
  return {x: c.W / 2 + rx * f, y: c.H / 2 + Y * f, d: depth, s: f};
};

export const camPos = (c: Cam): P3 => {
  const ct = Math.cos(rad(c.tilt));
  const st = Math.sin(rad(c.tilt));
  const ox = 0;
  const oy = c.dist * st;
  const cy = Math.cos(rad(c.yaw));
  const sy = Math.sin(rad(c.yaw));
  return [c.x + ox * cy - oy * sy, c.y + ox * sy + oy * cy, c.dist * ct];
};

export type Face = {pts: P3[]; fill: string; stroke?: string; sw?: number; opacity?: number; key: string};

export const poly = (c: Cam, pts: P3[]) =>
  pts
    .map((p) => {
      const q = project(c, p);
      return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
    })
    .join(' ');

export const depthOf = (c: Cam, pts: P3[]) => {
  let d = 0;
  for (const p of pts) d += project(c, p).d;
  return d / pts.length;
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * k));
  const b = Math.min(255, Math.round((n & 255) * k));
  return `rgb(${r},${g},${b})`;
};

/** faces of an (optionally rotated) box with backface culling; returns faces + a sort depth */
export const box = (
  c: Cam,
  key: string,
  cx: number,
  cy: number,
  w: number,
  l: number,
  h: number,
  color: string,
  opt: {z0?: number; rot?: number; top?: string; stroke?: string; sw?: number} = {},
): {faces: Face[]; depth: number} => {
  const z0 = opt.z0 ?? 0;
  const r = rad(opt.rot ?? 0);
  const cr = Math.cos(r);
  const sr = Math.sin(r);
  const corner = (u: number, v: number, z: number): P3 => [cx + u * cr - v * sr, cy + u * sr + v * cr, z];
  const hw = w / 2;
  const hl = l / 2;
  const b = [corner(-hw, -hl, z0), corner(hw, -hl, z0), corner(hw, hl, z0), corner(-hw, hl, z0)];
  const t = b.map(([x, y]) => [x, y, z0 + h] as P3);
  const cp = camPos(c);
  const faces: Face[] = [];
  // side faces: (i, i+1); outward normal
  const sides: [number, number, number][] = [
    [0, 1, 0.62], // north
    [1, 2, 0.78], // east
    [2, 3, 0.9], // south
    [3, 0, 0.7], // west
  ];
  for (const [i, j, k] of sides) {
    const mx = (b[i][0] + b[j][0]) / 2;
    const my = (b[i][1] + b[j][1]) / 2;
    const nx = (b[j][1] - b[i][1]);
    const ny = -(b[j][0] - b[i][0]);
    // normal points away from the centre
    const ox = mx - cx;
    const oy = my - cy;
    const sgn = nx * ox + ny * oy > 0 ? 1 : -1;
    const vis = (cp[0] - mx) * nx * sgn + (cp[1] - my) * ny * sgn > 0;
    if (vis && h > 0.5)
      faces.push({key: `${key}s${i}`, pts: [b[i], b[j], t[j], t[i]], fill: shade(color, k), stroke: opt.stroke, sw: opt.sw});
  }
  faces.push({key: `${key}t`, pts: t, fill: opt.top ?? shade(color, 1.12), stroke: opt.stroke, sw: opt.sw});
  return {faces, depth: depthOf(c, [[cx, cy, z0 + h / 2]])};
};

/** gabled roof prism on top of a box (ridge along x when rot=0) */
export const roof = (
  c: Cam,
  key: string,
  cx: number,
  cy: number,
  w: number,
  l: number,
  z0: number,
  h: number,
  color: string,
  over = 8,
): Face[] => {
  const hw = w / 2 + over;
  const hl = l / 2 + over;
  const A: P3 = [cx - hw, cy - hl, z0];
  const B: P3 = [cx + hw, cy - hl, z0];
  const Cc: P3 = [cx + hw, cy + hl, z0];
  const D: P3 = [cx - hw, cy + hl, z0];
  const R1: P3 = [cx - hw, cy, z0 + h];
  const R2: P3 = [cx + hw, cy, z0 + h];
  const cp = camPos(c);
  const out: Face[] = [];
  // the slope facing the camera is painted last
  const north: Face = {key: `${key}rn`, pts: [A, B, R2, R1], fill: shade(color, 0.72)};
  const south: Face = {key: `${key}rs`, pts: [D, Cc, R2, R1], fill: shade(color, 1.0)};
  out.push(...(cp[1] >= cy ? [north, south] : [south, north]));
  // gables
  const gw: Face = {key: `${key}gw`, pts: [A, D, R1], fill: shade(color, 0.55)};
  const ge: Face = {key: `${key}ge`, pts: [B, Cc, R2], fill: shade(color, 0.62)};
  if (cp[0] < cx) out.unshift(ge), out.push(gw);
  else out.unshift(gw), out.push(ge);
  return out;
};

export {shade};
