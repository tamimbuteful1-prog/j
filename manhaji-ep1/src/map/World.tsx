import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F} from '../theme';
import {box, Cam, depthOf, Face, P3, poly, project, roof, shade} from './engine';
import {clamp, rand, spr} from '../time';

// ---------------------------------------------------------------- static city
const ROAD = 64;
const STEP = 400;
export const HOUSE = {x: 1400, y: -125};
export const SCHOOL = {x: -1400, y: -575};

const rawRoute: [number, number][] = [
  [1400, -62],
  [1400, 0],
  [-400, 0],
  [-400, -400],
  [-1400, -400],
  [-1400, -505],
];

/** route sampled with rounded corners */
const ROUTE: {x: number; y: number; s: number}[] = (() => {
  const pts: [number, number][] = [];
  const R = 70;
  pts.push(rawRoute[0]);
  for (let i = 1; i < rawRoute.length - 1; i++) {
    const [ax, ay] = rawRoute[i - 1];
    const [bx, by] = rawRoute[i];
    const [cx, cy] = rawRoute[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay);
    const l2 = Math.hypot(cx - bx, cy - by);
    const r = Math.min(R, l1 / 2, l2 / 2);
    const p1: [number, number] = [bx - ((bx - ax) / l1) * r, by - ((by - ay) / l1) * r];
    const p2: [number, number] = [bx + ((cx - bx) / l2) * r, by + ((cy - by) / l2) * r];
    for (let k = 0; k <= 8; k++) {
      const u = k / 8;
      // quadratic bezier through the corner
      const x = (1 - u) * (1 - u) * p1[0] + 2 * (1 - u) * u * bx + u * u * p2[0];
      const y = (1 - u) * (1 - u) * p1[1] + 2 * (1 - u) * u * by + u * u * p2[1];
      pts.push([x, y]);
    }
  }
  pts.push(rawRoute[rawRoute.length - 1]);
  let s = 0;
  return pts.map(([x, y], i) => {
    if (i > 0) s += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
    return {x, y, s};
  });
})();
export const ROUTE_LEN = ROUTE[ROUTE.length - 1].s;

export const along = (d: number) => {
  const s = clamp(d, 0, ROUTE_LEN);
  for (let i = 1; i < ROUTE.length; i++) {
    if (ROUTE[i].s >= s) {
      const a = ROUTE[i - 1];
      const b = ROUTE[i];
      const u = (s - a.s) / (b.s - a.s || 1);
      return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, heading: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI};
    }
  }
  const b = ROUTE[ROUTE.length - 1];
  return {x: b.x, y: b.y, heading: -90};
};

/** distance along the route of the first point with x <= X on the main street (y=0) */
export const distAtX = (X: number) => 62 + (1400 - X);

type Bld = {x: number; y: number; w: number; l: number; h: number; col: string};
const isPark = (bx: number, by: number) =>
  (bx === 1200 && by === -1200) || (bx === -1600 && by === -1200) || (bx === 400 && by === -800) || (bx === -800 && by === 400) || (bx === 1600 && by === 400) || (bx === -2000 && by === -400);

const BUILDINGS: Bld[] = (() => {
  const out: Bld[] = [];
  let id = 0;
  for (let bx = -3600; bx < 3600; bx += STEP) {
    for (let by = -2600; by < 2600; by += STEP) {
      const cx = bx + STEP / 2;
      const cy = by + STEP / 2;
      id++;
      if (Math.abs(cx - HOUSE.x) < 10 && Math.abs(cy - -200) < 10) continue;
      if (Math.abs(cx - SCHOOL.x) < 10 && Math.abs(cy - -600) < 10) continue;
      if (isPark(bx, by)) continue;
      const lowRow = cy === 200 || cy === -200 || cy === 600; // keep the view of the route clear
      const n = 1 + Math.floor(rand(id) * 3);
      const inner = STEP - ROAD - 40;
      for (let k = 0; k < n; k++) {
        const r1 = rand(id * 7 + k);
        const r2 = rand(id * 13 + k * 3);
        const r3 = rand(id * 17 + k * 5);
        const w = 70 + r1 * 90;
        const l = 70 + r2 * 90;
        const x = cx + (n === 1 ? 0 : (k - (n - 1) / 2) * (inner / n));
        const y = cy + (r3 - 0.5) * (inner - l) * 0.6;
        const tall = lowRow ? 12 + r3 * 16 : 22 + Math.pow(r1 * r2, 0.8) * 110;
        const cols = ['#EEF1F2', '#E2E7EA', '#F3ECE1', '#DCE5E6', '#E9E3D7'];
        out.push({x, y, w: Math.min(w, inner / n), l, h: tall, col: cols[(id + k) % 5]});
      }
    }
  }
  return out;
})();

const TREES: {x: number; y: number; r: number}[] = (() => {
  const t: {x: number; y: number; r: number}[] = [];
  const add = (x: number, y: number, r = 22) => t.push({x, y, r});
  // house garden
  add(1300, -230, 26); add(1505, -250, 22); add(1290, -90, 18); add(1520, -95, 20);
  // school yard
  add(-1530, -690, 24); add(-1260, -700, 26); add(-1560, -480, 18); add(-1230, -470, 18);
  // morning neighbourhood: trees on free spots of every block, never where they would hide the route
  const hidesRoute = (x: number, y: number) =>
    (x > -440 && x < 1440 && y > 0 && y < 110) || // just south of the main street (landscape camera)
    (x > -1440 && x < -360 && y > -400 && y < -290) || // just south of the school street
    (x > -400 && x < -290 && y > -440 && y < 40); // just east of the side street (vertical camera)
  let id = 0;
  for (let bx = -3600; bx < 3600; bx += STEP)
    for (let by = -2600; by < 2600; by += STEP) {
      const park = isPark(bx, by);
      for (let gx = 0; gx < 4; gx++)
        for (let gy = 0; gy < 4; gy++) {
          id++;
          const x = bx + ROAD / 2 + 34 + gx * ((STEP - ROAD - 68) / 3) + (rand(id * 3) - 0.5) * 30;
          const y = by + ROAD / 2 + 34 + gy * ((STEP - ROAD - 68) / 3) + (rand(id * 5) - 0.5) * 30;
          if (!park && rand(id * 11) > 0.42) continue;
          if (hidesRoute(x, y)) continue;
          if (Math.hypot(x - HOUSE.x, y - HOUSE.y) < 130 || Math.hypot(x - SCHOOL.x, y - SCHOOL.y) < 200) continue;
          const r = park ? 20 + rand(id) * 12 : 15 + rand(id) * 9;
          if (!park && BUILDINGS.some((b) => Math.abs(x - b.x) < b.w / 2 + r && Math.abs(y - b.y) < b.l / 2 + r)) continue;
          add(x, y, r);
        }
    }
  return t;
})();

const TRAFFIC = [
  {x: 455, c: '#7A8492'},
  {x: 345, c: '#C9CED6'},
  {x: 235, c: '#4A5361'},
  {x: 125, c: '#8A6F5A'},
];
export const JAM_STOP_X = 575;

// ---------------------------------------------------------------- render
export type WorldState = {
  routeDraw: number; // 0..1 route reveal
  routeAlpha: number;
  carD: number; // distance along route
  carOn: number; // 0..1 visibility
  carGhost: number; // motion-trail strength
  carPrevD: number;
  jam: number; // 0..1 traffic + red route
  jamT: number; // seconds since jam started
  accident: number; // seconds since accident (-1 none)
  brake: number;
  houseIn: number; // 0..1 pop
  schoolIn: number;
  houseFocus: number; // label emphasis
  schoolFocus: number;
  avatar: number; // 0..1 avatar bubble visibility
  avatarOnCar: number; // 0 at house, 1 on car
  labels: number;
};

const car = (c: Cam, key: string, x: number, y: number, heading: number, color: string, z0 = 0, brake = 0): Face[] => {
  const faces: Face[] = [];
  const body = box(c, key + 'b', x, y, 92, 46, 20, color, {z0: z0 + 7, rot: heading});
  const r = (heading * Math.PI) / 180;
  const back = -9;
  const cab = box(c, key + 'c', x + Math.cos(r) * back, y + Math.sin(r) * back, 48, 40, 17, shade(color, 0.85), {
    z0: z0 + 27,
    rot: heading,
    top: '#2A3542',
  });
  faces.push(...body.faces, ...cab.faces);
  if (brake > 0) {
    // brake lights: small red boxes at the rear
    for (const side of [-1, 1]) {
      const bx = x - Math.cos(r) * 46 - Math.sin(r) * side * 16;
      const by = y - Math.sin(r) * 46 + Math.cos(r) * side * 16;
      faces.push(...box(c, `${key}bl${side}`, bx, by, 4, 10, 7, '#FF3344', {z0: z0 + 16, rot: heading, top: '#FF6677'}).faces);
    }
  }
  return faces;
};

const groundQuad = (x0: number, y0: number, x1: number, y1: number, z = 0): P3[] => [
  [x0, y0, z],
  [x1, y0, z],
  [x1, y1, z],
  [x0, y1, z],
];

/** morning sun low in the east: shadows fall west / slightly north */
const SUN = {x: -0.85, y: -0.38};
const shadowOf = (c: Cam, x: number, y: number, w: number, l: number, h: number) => {
  const dx = SUN.x * h * 0.9;
  const dy = SUN.y * h * 0.9;
  const pts: [number, number][] = [];
  for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    pts.push([x + (u * w) / 2, y + (v * l) / 2]);
    pts.push([x + (u * w) / 2 + dx, y + (v * l) / 2 + dy]);
  }
  // convex hull (monotone chain)
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const p of pts) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: [number, number][] = [];
  for (const p of [...pts].reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return poly(c, [...lo.slice(0, -1), ...up.slice(0, -1)].map(([a, b]) => [a, b, 0.3] as P3));
};

/** bottom-centre of the avatar bubble while it sits by the house (beside the label pin) */
export const avatarAtHouse = (c: Cam) => {
  const p = project(c, [HOUSE.x + 150, HOUSE.y, 120]);
  return {x: p.x, y: p.y};
};

export const World: React.FC<{c: Cam; t: number; s: WorldState}> = ({c, t, s}) => {
  const items: {d: number; faces?: Face[]; el?: React.ReactNode}[] = [];
  const shadows: React.ReactNode[] = [];
  const onScreen = (x: number, y: number, m = 500) => {
    const p = project(c, [x, y, 0]);
    return p.x > -m && p.x < c.W + m && p.y > -m * 1.3 && p.y < c.H + m;
  };

  // buildings
  for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    if (!onScreen(b.x, b.y)) continue;
    const accent = 'rgba(40,50,60,0.10)';
    const r = box(c, `B${i}`, b.x, b.y, b.w, b.l, b.h, b.col, {stroke: accent, sw: 1, top: i % 9 === 0 ? '#9FE3DA' : i % 7 === 0 ? '#FFC9A3' : undefined});
    items.push({d: r.depth, faces: r.faces});
    shadows.push(<polygon key={`sh${i}`} points={shadowOf(c, b.x, b.y, b.w, b.l, b.h)} fill="rgba(40,60,70,0.16)" />);
  }

  // house
  {
    const pop = spr(0, 0) + 0;
    const k = clamp(s.houseIn);
    if (k > 0.001) {
      const h = 74 * k;
      const hb = box(c, 'H', HOUSE.x, HOUSE.y, 176, 130, h, '#EDE6D8', {stroke: 'rgba(0,0,0,0.15)', sw: 1});
      const rf = roof(c, 'HR', HOUSE.x, HOUSE.y, 176, 130, h, 58 * k, C.orange);
      const door = box(c, 'HD', HOUSE.x, HOUSE.y + 65.5, 30, 2, 42 * k, '#7A4A2A');
      const win1 = box(c, 'HW1', HOUSE.x - 52, HOUSE.y + 65.5, 30, 2, 24 * k, C.yellow, {z0: 30 * k});
      const win2 = box(c, 'HW2', HOUSE.x + 52, HOUSE.y + 65.5, 30, 2, 24 * k, C.yellow, {z0: 30 * k});
      items.push({d: hb.depth, faces: [...hb.faces, ...door.faces, ...win1.faces, ...win2.faces, ...rf]});
      void pop;
    }
  }
  // school
  {
    const k = clamp(s.schoolIn);
    if (k > 0.001) {
      const h = 104 * k;
      const sb = box(c, 'S', SCHOOL.x, SCHOOL.y, 330, 140, h, '#DDE3E8', {stroke: 'rgba(0,0,0,0.15)', sw: 1});
      const tower = box(c, 'ST', SCHOOL.x, SCHOOL.y + 10, 80, 80, h + 56 * k, '#E9EEF1', {top: C.teal});
      const faces = [...sb.faces];
      for (let f = 0; f < 2; f++)
        for (let w = 0; w < 6; w++) {
          const wx = SCHOOL.x - 140 + w * 56;
          if (Math.abs(wx - SCHOOL.x) < 40) continue;
          faces.push(...box(c, `SW${f}${w}`, wx, SCHOOL.y + 70.5, 28, 2, 18 * k, f ? '#9FE8E1' : C.yellow, {z0: (18 + f * 38) * k}).faces);
        }
      faces.push(...tower.faces);
      faces.push(...box(c, 'SD', SCHOOL.x, SCHOOL.y + 70.5, 40, 2, 40 * k, '#2B3440').faces);
      // flag pole
      faces.push(...box(c, 'SF', SCHOOL.x + 190, SCHOOL.y + 80, 5, 5, 170 * k, '#AAB4BF').faces);
      faces.push(...box(c, 'SFf', SCHOOL.x + 214, SCHOOL.y + 80, 44, 2, 28 * k, C.teal, {z0: 138 * k}).faces);
      items.push({d: sb.depth, faces});
    }
  }

  // trees (billboards)
  TREES.forEach((tr, i) => {
    if (!onScreen(tr.x, tr.y, 200)) return;
    const base = project(c, [tr.x, tr.y, 0]);
    const top = project(c, [tr.x, tr.y, tr.r * 2.4]);
    const rr = tr.r * base.s;
    const near = i < 8 ? (i < 4 ? clamp(s.houseIn * 1.3) : clamp(s.schoolIn * 1.3)) : 1;
    if (near <= 0.01) return;
    items.push({
      d: base.d,
      el: (
        <g key={`T${i}`} transform={`translate(${base.x} ${base.y}) scale(${near}) translate(${-base.x} ${-base.y})`}>
          <ellipse cx={base.x - rr * 0.9} cy={base.y - rr * 0.15} rx={rr * 1.5} ry={rr * 0.5} fill="rgba(40,70,60,0.22)" />
          <line x1={base.x} y1={base.y} x2={top.x} y2={top.y} stroke="#7A5A40" strokeWidth={Math.max(1.5, rr * 0.22)} />
          <circle cx={top.x} cy={top.y} r={rr} fill={i % 3 ? '#4FA36C' : '#3E9462'} />
          <circle cx={top.x + rr * 0.25} cy={top.y - rr * 0.3} r={rr * 0.55} fill="#7CC891" />
        </g>
      ),
    });
  });

  // traffic & accident
  if (s.jam > 0) {
    TRAFFIC.forEach((tc, i) => {
      const k = spr(s.jamT, i * 0.09, 1.6);
      if (k <= 0.001) return;
      const z = (1 - Math.min(1, k)) * 120;
      const f = car(c, `J${i}`, tc.x, 16, 180, tc.c, z, s.brake);
      items.push({d: depthOf(c, [[tc.x, 16, 10]]), faces: f});
    });
    if (s.accident >= 0) {
      const a = s.accident;
      const k = Math.min(1, spr(a, 0, 2.2));
      const jx = -10;
      const f1 = car(c, 'A1', jx + 10, 10, 180 - 28 * k, '#9AA3AE');
      const f2 = car(c, 'A2', jx - 52, 20 - 14 * k, 180 + 40 * k, '#B06A4E');
      items.push({d: depthOf(c, [[jx, 14, 10]]), faces: [...f1, ...f2]});
      // cones
      [[jx + 70, 40], [jx + 70, -30]].forEach(([x, y], i) => {
        const ck = clamp(spr(a, 0.25 + i * 0.08, 2));
        items.push({d: depthOf(c, [[x, y, 5]]), faces: box(c, `CN${i}`, x, y, 10 * ck, 10 * ck, 18 * ck, C.orange, {top: '#FFE0C4'}).faces});
      });
    }
  }

  // hero car (+ motion trail)
  const hero: Face[] = [];
  if (s.carOn > 0.001) {
    const p = along(s.carD);
    const zIn = (1 - clamp(s.carOn)) * 60;
    if (s.carGhost > 0.01) {
      for (let g = 3; g >= 1; g--) {
        const q = along(s.carD + (s.carPrevD - s.carD) * (g / 3));
        car(c, `G${g}`, q.x, q.y, q.heading, C.yellow, zIn).forEach((fc) =>
          hero.push({...fc, key: fc.key, opacity: s.carGhost * (0.28 - g * 0.06)}),
        );
      }
    }
    hero.push(...car(c, 'CAR', p.x, p.y, p.heading, C.yellow, zIn, s.brake));
    items.push({d: depthOf(c, [[p.x, p.y, 10]]) - 2, faces: hero});
  }

  items.sort((a, b) => b.d - a.d);

  // ground
  const ground = poly(c, groundQuad(-4200, -3200, 4200, 3200));
  const blocks: React.ReactNode[] = [];
  let bi = 0;
  for (let bx = -3600; bx < 3600; bx += STEP)
    for (let by = -2600; by < 2600; by += STEP) {
      const x0 = bx + ROAD / 2;
      const y0 = by + ROAD / 2;
      const x1 = bx + STEP - ROAD / 2;
      const y1 = by + STEP - ROAD / 2;
      bi++;
      if (!onScreen((x0 + x1) / 2, (y0 + y1) / 2, 700)) continue;
      const park = isPark(bx, by);
      blocks.push(
        <polygon key={`K${bi}`} points={poly(c, groundQuad(x0, y0, x1, y1, 0))} fill={park ? '#A9D5A0' : '#DCE2DE'} stroke="#C5CDC9" strokeWidth={1} />,
      );
    }

  // lane dashes on main streets
  const dashes: React.ReactNode[] = [];
  for (let x = -2600; x <= 2600; x += 80) {
    if (!onScreen(x, 0, 300)) continue;
    for (const Y of [0, -400, 400, -800]) dashes.push(<polygon key={`d${x}_${Y}`} points={poly(c, groundQuad(x, Y - 2, x + 36, Y + 2, 0.5))} fill="#F2F4F2" />);
  }

  // route
  const total = ROUTE_LEN * clamp(s.routeDraw);
  const routePts: P3[] = [];
  for (const r of ROUTE) {
    if (r.s > total) {
      const q = along(total);
      routePts.push([q.x, q.y, 1]);
      break;
    }
    routePts.push([r.x, r.y, 1]);
  }
  const rp = routePts.map((p) => project(c, p));
  const routeStr = rp.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const sc = project(c, [c.x, c.y, 0]).s;
  // red congestion piece from car to accident
  let redStr = '';
  if (s.jam > 0) {
    const d0 = distAtX(JAM_STOP_X + 40);
    const d1 = distAtX(-30);
    const pts: string[] = [];
    const k = clamp(s.jamT / 0.6);
    for (let d = d0; d <= d0 + (d1 - d0) * k; d += 20) {
      const q = project(c, [along(d).x, along(d).y, 2]);
      pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
    }
    redStr = pts.join(' ');
  }

  // overlays (HTML) — labels and avatar
  const houseTop = project(c, [HOUSE.x, HOUSE.y, 175]);
  const schoolTop = project(c, [SCHOOL.x, SCHOOL.y, 240]);
  const cp = along(s.carD);
  const carTop = project(c, [cp.x, cp.y, 80]);
  const avH = avatarAtHouse(c);
  const av = {
    x: avH.x + (carTop.x - avH.x) * s.avatarOnCar,
    y: avH.y + (carTop.y - avH.y) * s.avatarOnCar,
  };
  const accP = project(c, [-10, 14, 70]);

  return (
    <>
      <svg width={c.W} height={c.H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={8} />
          </filter>
          <radialGradient id="fog" cx="50%" cy="45%" r="75%">
            <stop offset="50%" stopColor="#EAF3F4" stopOpacity={0} />
            <stop offset="100%" stopColor="#EAF3F4" stopOpacity={0.9} />
          </radialGradient>
        </defs>
        <polygon points={ground} fill="#7D878E" />
        {blocks}
        {dashes}
        {shadows}
        {s.routeAlpha > 0 && rp.length > 1 && (
          <g opacity={s.routeAlpha}>
            <polyline points={routeStr} fill="none" stroke={C.teal} strokeWidth={26 * sc} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} filter="url(#glow)" />
            <polyline points={routeStr} fill="none" stroke="#0B7F77" strokeWidth={17 * sc} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={routeStr} fill="none" stroke={C.teal} strokeWidth={12 * sc} strokeLinecap="round" strokeLinejoin="round" />
            <polyline
              points={routeStr}
              fill="none"
              stroke="#E8FFFC"
              strokeWidth={3 * sc}
              strokeDasharray={`${14 * sc} ${22 * sc}`}
              strokeDashoffset={-t * 120 * sc}
              strokeLinecap="round"
              opacity={0.8}
            />
          </g>
        )}
        {redStr && (
          <g opacity={clamp(s.jam)}>
            <polyline points={redStr} fill="none" stroke={C.red} strokeWidth={28 * sc} strokeLinecap="round" opacity={0.4} filter="url(#glow)" />
            <polyline points={redStr} fill="none" stroke={C.red} strokeWidth={13 * sc} strokeLinecap="round" />
          </g>
        )}
        {s.accident >= 0 && (
          <g>
            {[0, 1, 2].map((i) => {
              const ph = ((s.accident * 1.4 + i / 3) % 1);
              const g = project(c, [-10, 14, 0]);
              return (
                <ellipse key={i} cx={g.x} cy={g.y} rx={(40 + ph * 160) * g.s} ry={(40 + ph * 160) * g.s * Math.cos((c.tilt * Math.PI) / 180)} fill="none" stroke={C.orange} strokeWidth={4} opacity={(1 - ph) * 0.8 * clamp(s.accident * 3)} />
              );
            })}
          </g>
        )}
        {items.map((it, i) =>
          it.el ? (
            <React.Fragment key={`i${i}`}>{it.el}</React.Fragment>
          ) : (
            <g key={`i${i}`}>
              {it.faces!.map((f) => (
                <polygon key={f.key} points={poly(c, f.pts)} fill={f.fill} stroke={f.stroke} strokeWidth={f.sw} opacity={f.opacity} strokeLinejoin="round" />
              ))}
            </g>
          ),
        )}
        <rect width={c.W} height={c.H} fill="url(#fog)" />
      </svg>

      {/* accident warning sign */}
      {s.accident >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: accP.x,
            top: accP.y,
            transform: `translate(-50%,-100%) scale(${Math.min(1.15, spr(s.accident, 0.05, 1.6)) * clamp(accP.s * 1.6, 0.6, 1.6)})`,
            transformOrigin: '50% 100%',
          }}
        >
          <svg width={120} height={108} viewBox="0 0 120 108">
            <path d="M60 6 L114 100 L6 100 Z" fill={C.orange} stroke="#1A1206" strokeWidth={6} strokeLinejoin="round" />
            <rect x={54} y={36} width={12} height={36} rx={6} fill="#1A1206" />
            <circle cx={60} cy={84} r={7} fill="#1A1206" />
          </svg>
        </div>
      )}

      {/* place labels */}
      {s.labels > 0 && (
        <>
          <Pin x={houseTop.x} y={houseTop.y} k={s.houseIn} focus={s.houseFocus} label="البيت" color={C.orange} a={s.labels} />
          <Pin x={schoolTop.x} y={schoolTop.y} k={s.schoolIn} focus={s.schoolFocus} label="المدرسة" color={C.teal} a={s.labels} />
        </>
      )}

      {s.avatar > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: av.x,
            top: av.y,
            width: 92,
            height: 92,
            transform: `translate(-50%,-100%) scale(${s.avatar})`,
            transformOrigin: '50% 100%',
          }}
        >
          <div style={{width: 92, height: 92, borderRadius: 46, overflow: 'hidden', border: `4px solid ${C.yellow}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile('media/avatar.png')} style={{width: '100%', height: '100%'}} />
          </div>
          <div style={{position: 'absolute', left: 38, bottom: -14, width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `14px solid ${C.yellow}`}} />
        </div>
      )}
    </>
  );
};

const Pin: React.FC<{x: number; y: number; k: number; focus: number; label: string; color: string; a: number}> = ({x, y, k, focus, label, color, a}) => {
  const sc = clamp(k * 1.05, 0, 1.2);
  if (sc <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-100%) scale(${sc * (1 + 0.12 * focus)})`,
        transformOrigin: '50% 100%',
        opacity: a,
      }}
    >
      <div
        style={{
          fontFamily: F.kufi,
          fontWeight: 800,
          fontSize: 34,
          color: '#0B0E12',
          background: color,
          padding: '6px 22px 10px',
          borderRadius: 16,
          whiteSpace: 'nowrap',
          boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 ${30 * focus}px ${color}`,
          direction: 'rtl',
        }}
      >
        {label}
      </div>
      <div style={{margin: '0 auto', width: 4, height: 34, background: color, borderRadius: 2}} />
    </div>
  );
};
