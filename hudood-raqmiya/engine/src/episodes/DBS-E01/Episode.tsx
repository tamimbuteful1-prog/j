import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import '../../lib/fonts';
import {EASE} from '../../lib/anim';
import {VIDEO} from '../../theme';
import {L, LINES, TOTAL, beat} from './timeline';
import {BasicLaw, BusinessCard, DefensePlan, DogTag, EvidenceBag, Folder, IndexCard, MiyarTablet, Obj, Paper, PhotoPrint, Pin, PostPrint, StickyNote, YouPolaroid} from './props';

export {TOTAL as DBS_E01_TOTAL};
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const k = (t: number, a: number, b: number, e = EASE.out) => interpolate(t, [a, b], [0, 1], {...cl, easing: e});

// ───────────────────────── camera
type Shot = {t: number; x: number; y: number; z: number; tilt: number; rz: number};
const camAt = (shots: Shot[], t: number) => {
  if (t <= shots[0].t) return shots[0];
  for (let i = 1; i < shots.length; i++) {
    if (t <= shots[i].t) {
      const a = shots[i - 1], b = shots[i];
      const u = EASE.inOut(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))));
      return {t, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, tilt: a.tilt + (b.tilt - a.tilt) * u, rz: a.rz + (b.rz - a.rz) * u};
    }
  }
  return shots[shots.length - 1];
};
/** a plane (desk or wall) seen through a physical camera: perspective, tilt, dolly, roll + hand-held drift */
const Stage: React.FC<{cam: Shot; w: number; h: number; bg: string; bgSize: string; children: React.ReactNode}> = ({cam, w, h, bg, bgSize, children}) => {
  const t = useCurrentFrame() / VIDEO.fps;
  const hx = Math.sin(t * 0.8) * 5 + Math.sin(t * 2.1) * 2;
  const hy = Math.cos(t * 0.6) * 4 + Math.sin(t * 1.7) * 2;
  return (
    <AbsoluteFill style={{perspective: 1500, perspectiveOrigin: '50% 45%', overflow: 'hidden', background: '#000'}}>
      <div style={{position: 'absolute', left: 540, top: 900, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateZ(${cam.z}px) rotateX(${cam.tilt}deg) rotateZ(${cam.rz + Math.sin(t * 0.5) * 0.3}deg) translate(${-cam.x + hx}px, ${-cam.y + hy}px)`}}>
        <div style={{position: 'absolute', left: -2500, top: -2500, width: w + 5000, height: h + 5000, backgroundImage: `url(${staticFile(bg)})`, backgroundSize: bgSize, backgroundPosition: '2500px 2500px'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h}}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

/** one practical light: warm lamp pool, falloff to black, faint flicker; plus tilt-shift depth of field */
const Light: React.FC<{x?: number; y?: number; cool?: number}> = ({x = 58, y = 40, cool = 0}) => {
  const t = useCurrentFrame() / VIDEO.fps;
  const fl = 1 - 0.035 * (Math.sin(t * 17) * Math.sin(t * 5.3) > 0.6 ? 1 : 0);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(70% 48% at ${x}% ${y}%, rgba(255,214,160,${0.18 * fl}), transparent 70%)`, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: `radial-gradient(85% 60% at ${x}% ${y}%, transparent 30%, rgba(0,0,0,${0.62 / fl}) 92%)`}} />
      {cool > 0 && <AbsoluteFill style={{background: `rgba(40,90,150,${0.12 * cool})`, mixBlendMode: 'soft-light'}} />}
      <AbsoluteFill style={{backdropFilter: 'blur(5px)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 22%, transparent 76%, #000 100%)', maskImage: 'linear-gradient(180deg, #000 0%, transparent 22%, transparent 76%, #000 100%)'}} />
    </>
  );
};

// ───────────────────────── the desk
const DESK = {w: 2800, h: 4400};
const deskShots = (): Shot[] => [
  {t: 0, x: 800, y: 700, z: -380, tilt: 30, rz: -8},
  {t: L('L01').end - 0.2, x: 800, y: 720, z: 120, tilt: 20, rz: -3},
  {t: L('L02').start + 0.6, x: 1720, y: 760, z: -120, tilt: 22, rz: 3},
  {t: L('L03').end, x: 1700, y: 1020, z: 180, tilt: 12, rz: 4},
  // (wall L04–L05)
  {t: L('L06').start - 0.1, x: 1750, y: 2150, z: -40, tilt: 28, rz: -6},
  {t: L('L06').end, x: 1720, y: 2140, z: 260, tilt: 18, rz: -2},
  {t: L('L07').start + 0.7, x: 950, y: 2140, z: -60, tilt: 24, rz: -2},
  {t: L('L07').end + 0.2, x: 950, y: 2140, z: 40, tilt: 14, rz: -1},
  // (wall L08–L09)
  {t: L('L10').start - 0.05, x: 1000, y: 3260, z: -260, tilt: 30, rz: 5},
  {t: L('L11').start + 0.5, x: 1000, y: 3240, z: 60, tilt: 14, rz: 2},
  {t: L('L12').end, x: 900, y: 3220, z: 180, tilt: 10, rz: 0},
  {t: L('L13').start + 0.7, x: 2000, y: 3300, z: -60, tilt: 20, rz: -3},
  {t: L('L13').end, x: 2050, y: 3420, z: 60, tilt: 14, rz: -4},
  {t: L('L14').start + 0.5, x: 1480, y: 2880, z: 120, tilt: 16, rz: 3},
  {t: L('L15').start + 0.5, x: 900, y: 3960, z: 160, tilt: 14, rz: -3},
  {t: L('L16').start + 0.6, x: 980, y: 2300, z: -200, tilt: 24, rz: -1},
  {t: TOTAL, x: 1300, y: 2300, z: -1500, tilt: 34, rz: -4},
];

const Desk: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  const cam = camAt(deskShots(), t);
  const drop = (at: number) => 1 - k(t, at, at + 0.45, EASE.in); // object falling onto the desk (z → 0)
  const slide = (at: number) => k(t, at, at + 0.6);
  return (
    <AbsoluteFill>
      <Stage cam={cam} w={DESK.w} h={DESK.h} bg="tex/wood.jpg" bgSize="1400px 2200px">
        {/* clutter that makes it a real desk */}
        <Obj x={300} y={1500} w={420} h={600} r={-12} shadow={0.6}>
          <Paper>
            <div style={{position: 'absolute', inset: 50}}>
              {Array.from({length: 14}).map((_, i) => (
                <div key={i} style={{height: 10, borderRadius: 5, background: '#888', marginBottom: 26, width: `${60 + random(`cp${i}`) * 40}%`, filter: 'blur(1.5px)'}} />
              ))}
            </div>
          </Paper>
        </Obj>
        <div style={{position: 'absolute', left: 2250, top: 1500, width: 260, height: 260, borderRadius: 130, border: '14px solid rgba(60,35,15,0.55)', filter: 'blur(2px)'}} />
        <Obj x={2380} y={2700} w={34} h={560} r={24} radius={17} style={{background: 'linear-gradient(90deg, #1b1d22, #50555e, #1b1d22)'}} />
        <Obj x={360} y={2900} w={360} h={360} r={8} radius={10} style={{background: '#20242b'}}>
          <div style={{position: 'absolute', inset: 30, borderRadius: 6, background: '#d9d4c5', filter: 'blur(1px)'}} />
        </Obj>

        {/* L01 — phone in an evidence bag */}
        <Obj x={800} y={720} w={560} h={1100} r={-7} z={drop(0.15) * 220} o={k(t, 0.1, 0.4)}>
          <EvidenceBag screen={k(t, L('L01').start + 0.2, L('L01').start + 0.5)} border={k(t, L('L01').start + 0.9, L('L01').end, EASE.inOut)} />
        </Obj>
        {/* L02–L03 — Basic Law, Article 34 */}
        <Obj x={1720} y={980} w={860} h={1216} r={4} z={(1 - slide(L('L02').start - 0.5)) * 120} o={slide(L('L02').start - 0.5)}>
          <BasicLaw hl={k(t, L('L03').start + 0.1, L('L03').end - 0.2, EASE.inOut)} />
        </Obj>
        {/* L06 — the dog tag lands */}
        <Obj x={1720} y={2150} w={600} h={330} r={-14} z={drop(L('L06').start + 1.0) * 600} o={k(t, L('L06').start + 0.9, L('L06').start + 1.0)} radius={70} shadow={0.9}>
          <DogTag />
        </Obj>
        {/* L07 — the initiative's case file opens, gets stamped */}
        <Obj x={950} y={2150} w={900} h={1200} r={-3} radius={10}>
          <Folder open={k(t, L('L07').start + 0.3, L('L07').start + 1.4, EASE.inOut)} stamp={k(t, L('L07').end - 0.9, L('L07').end - 0.75)} />
        </Obj>
        {/* L11–L12 — «معيار» on a tablet */}
        <Obj x={950} y={3250} w={1180} h={800} r={2} radius={48} z={(1 - slide(L('L10').start - 0.4)) * 200} o={slide(L('L10').start - 0.4)}>
          <MiyarTablet on={k(t, L('L10').start + 0.2, L('L10').start + 0.5)} scan={k(t, L('L11').start + 1.0, L('L11').end, EASE.inOut)} refs={k(t, L('L12').start, L('L12').start + 0.6)} fix={k(t, L('L12').end - 1.0, L('L12').end - 0.6)} />
        </Obj>
        {/* L14 — note on the tablet's corner */}
        <Obj x={1480} y={2860} w={380} h={380} r={6} z={(1 - k(t, L('L14').start - 0.3, L('L14').start + 0.1, EASE.in)) * 300} o={k(t, L('L14').start - 0.3, L('L14').start - 0.2)} radius={0} shadow={0.7}>
          <StickyNote text={'رابط المنصة\nفي الوصف'} />
        </Obj>
        {/* L13 — the real certificate and the real award card */}
        <Obj x={2020} y={3230} w={840} h={628} r={-5} z={(1 - slide(L('L13').start)) * 160} o={slide(L('L13').start)}>
          <PhotoPrint src="assets/fellowship_certificate.jpg" />
        </Obj>
        <Obj x={2060} y={3760} w={560} h={700} r={7} z={(1 - slide(L('L13').start + 0.9)) * 160} o={slide(L('L13').start + 0.9)}>
          <PhotoPrint src="assets/miyar_award.jpg" />
        </Obj>
        {/* L15 — Tamim's card */}
        <Obj x={900} y={3990} w={760} h={430} r={-4} z={(1 - slide(L('L15').start - 0.4)) * 140} o={slide(L('L15').start - 0.4)} radius={6}>
          <BusinessCard />
        </Obj>
      </Stage>
      <Light x={56} y={38} />
    </AbsoluteFill>
  );
};

// ───────────────────────── the evidence wall
const WALL = {w: 2400, h: 3400};
const POSTS: [number, number, number, string, number][] = [
  [560, 560, -6, 'سياسي', 210],
  [1800, 520, 5, 'ثقافي', 30],
  [520, 1560, 4, 'رياضي', 120],
  [1840, 1600, -5, 'اقتصادي', 260],
];
const YOU = {x: 1200, y: 1080};
const TACTICS: [number, number, number, string][] = [
  [470, 2280, -4, 'الحلقة ١'], [1930, 2260, 5, 'الحلقة ٢'], [440, 2760, 3, 'الحلقة ٣'], [1960, 2780, -3, 'الحلقة ٤'], [520, 3200, -2, 'الحلقة ٥'], [1880, 3220, 4, 'الحلقة ٦'],
];
const PLAN = {x: 1200, y: 2760};
const wallShots = (): Shot[] => [
  {t: L('L04').start - 0.4, x: 1200, y: 1000, z: -900, tilt: 0, rz: 3},
  ...POSTS.map(([x, y], i): Shot => ({t: beat('L04', i + 1.2, 5.4), x: x * 0.6 + YOU.x * 0.4, y: y * 0.6 + YOU.y * 0.4, z: -150, tilt: 0, rz: i % 2 ? 2 : -2})),
  {t: L('L05').start + 0.15, x: YOU.x, y: YOU.y, z: -80, tilt: 0, rz: 0},
  {t: L('L05').end + 0.25, x: YOU.x, y: YOU.y + 10, z: 330, tilt: 0, rz: -1},
  {t: L('L08').start - 0.4, x: 1200, y: 2600, z: -700, tilt: 0, rz: -2},
  {t: L('L08').end, x: 1200, y: 2720, z: -380, tilt: 0, rz: 1},
  {t: L('L09').start + 0.5, x: PLAN.x, y: PLAN.y, z: 0, tilt: 0, rz: 0},
  {t: L('L09').end + 0.3, x: PLAN.x, y: PLAN.y + 40, z: 180, tilt: 0, rz: 1},
];

const Wall: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  const cam = camAt(wallShots(), t);
  const pin = (at: number) => k(t, at, at + 0.35);
  const strings = POSTS.map((_, i) => k(t, beat('L04', i + 1.2, 5.4) + 0.1, beat('L04', i + 1.2, 5.4) + 0.7, EASE.inOut));
  return (
    <AbsoluteFill>
      <Stage cam={cam} w={WALL.w} h={WALL.h} bg="tex/cork.jpg" bgSize="1400px 1800px">
        {/* red yarn */}
        <svg viewBox={`0 0 ${WALL.w} ${WALL.h}`} style={{position: 'absolute', inset: 0, width: WALL.w, height: WALL.h, overflow: 'visible', filter: 'drop-shadow(5px 9px 4px rgba(0,0,0,0.5))'}}>
          {POSTS.map(([x, y], i) => (
            <line key={i} x1={x} y1={y - 300} x2={x + (YOU.x - x) * strings[i]} y2={y - 300 + (YOU.y - 330 - (y - 300)) * strings[i]} stroke="#b3121f" strokeWidth={7} strokeLinecap="round" />
          ))}
          {TACTICS.map(([x, y], i) => {
            const s = k(t, beat('L08', i + 0.6, 7) + 0.15, beat('L08', i + 0.6, 7) + 0.7, EASE.inOut);
            return <line key={`t${i}`} x1={x} y1={y - 150} x2={x + (PLAN.x - x) * s} y2={y - 150 + (PLAN.y - 420 - (y - 150)) * s} stroke="#b3121f" strokeWidth={6} strokeLinecap="round" />;
          })}
        </svg>
        {POSTS.map(([x, y, r, note, hue], i) => {
          const a = beat('L04', i + 1.2, 5.4) - 0.35;
          return (
            <React.Fragment key={i}>
              <Obj x={x} y={y} w={640} h={760} r={r} z={(1 - pin(a)) * 160} o={pin(a)} shadow={0.8}>
                <PostPrint note={note} hue={hue} />
              </Obj>
              <Pin x={x} y={y - 300} />
            </React.Fragment>
          );
        })}
        <Obj x={YOU.x} y={YOU.y} w={560} h={660} r={-2} shadow={0.9}>
          <YouPolaroid circle={k(t, L('L05').start + 0.1, L('L05').end, EASE.inOut)} word={k(t, L('L05').start + 0.6, L('L05').start + 0.9)} />
        </Obj>
        <Pin x={YOU.x} y={YOU.y - 300} />
        {TACTICS.map(([x, y, r, title], i) => {
          const a = beat('L08', i + 0.6, 7) - 0.3;
          return (
            <React.Fragment key={i}>
              <Obj x={x} y={y} w={720} h={430} r={r} z={(1 - pin(a)) * 160} o={pin(a)} shadow={0.8}>
                <IndexCard title={title} />
              </Obj>
              <Pin x={x} y={y - 150} c="#1d4fd8" />
            </React.Fragment>
          );
        })}
        <Obj x={PLAN.x} y={PLAN.y} w={760} h={1000} r={1} shadow={0.9}>
          <DefensePlan checks={[k(t, L('L08').end - 1.2, L('L08').end - 0.4, EASE.inOut), 0, k(t, L('L09').start + 0.2, L('L09').start + 1.2, EASE.inOut), k(t, L('L09').end - 0.6, L('L09').end - 0.2)]} />
        </Obj>
        <Pin x={PLAN.x} y={PLAN.y - 470} />
      </Stage>
      <Light x={50} y={30} cool={0.6} />
    </AbsoluteFill>
  );
};

// ───────────────────────── edit: desk ↔ wall with whip pans
const WINDOWS: [number, number, 'wall' | 'desk'][] = [
  [L('L04').start - 0.35, L('L06').start - 0.35, 'wall'],
  [L('L08').start - 0.35, L('L10').start - 0.3, 'wall'],
];
const onWall = (t: number) => WINDOWS.some(([a, b]) => t >= a && t < b);
const Whip: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  let w = 0;
  for (const [a, b] of WINDOWS) for (const c of [a, b]) w = Math.max(w, interpolate(Math.abs(t - c), [0, 0.18], [1, 0], cl));
  return w > 0 ? <AbsoluteFill style={{backdropFilter: `blur(${w * 28}px)`, background: `rgba(255,230,200,${w * 0.08})`}} /> : null;
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
        <filter id="g01">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 16} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#g01)" />
      </svg>
      {/* film grade: lifted blacks toward teal, warm highlights */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,30,45,0.18), rgba(30,20,10,0.12))', mixBlendMode: 'lighten', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(80% 65% at 50% 46%, transparent 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
    </>
  );
};

// ───────────────────────── sound (tied to lines; no music, investigation ambience)
type Cue = [number, string, number];
const cues = (): Cue[] => [
  [0, 'room_tone', 0.45], [0, 'drone', 0.3],
  [0.15, 'card_slide', 0.35], [0.55, 'footstep', 0.3],
  [L('L01').start + 0.2, 'beep', 0.25], [L('L01').start + 0.9, 'map_draw', 0.35],
  [L('L02').start - 0.6, 'whoosh_air', 0.3], [L('L02').start - 0.45, 'card_slide', 0.5],
  [L('L03').start + 0.1, 'marker', 0.55], [L('L03').start + 1.6, 'marker', 0.45],
  [L('L04').start - 0.4, 'whoosh_fast', 0.45],
  ...POSTS.map((_, i): Cue => [beat('L04', i + 1.2, 5.4) - 0.3, 'pin', 0.55]),
  [L('L05').start, 'sub_hit', 0.55], [L('L05').start + 0.1, 'marker', 0.6],
  [L('L06').start - 0.4, 'whoosh_fast', 0.45], [L('L06').start + 1.4, 'tag', 0.7],
  [L('L07').start + 0.3, 'folder', 0.6], [L('L07').end - 0.9, 'stamp', 0.75], [L('L07').end - 0.8, 'boom_soft', 0.35],
  [L('L08').start - 0.4, 'whoosh_fast', 0.45],
  ...TACTICS.map((_, i): Cue => [beat('L08', i + 0.6, 7) - 0.25, 'pin', 0.45]),
  [L('L08').end - 1.2, 'marker', 0.4], [L('L09').start + 0.2, 'marker', 0.45], [L('L09').end - 0.6, 'stamp', 0.45],
  [L('L10').start - 0.35, 'whoosh_fast', 0.45], [L('L10').start - 0.1, 'card_slide', 0.45], [L('L10').start + 0.2, 'unlock', 0.4],
  [L('L11').start + 1.0, 'scanner', 0.5], [L('L11').start + 1.6, 'beep', 0.3], [L('L11').start + 2.6, 'beep', 0.3],
  [L('L12').start, 'page_turn', 0.35], [L('L12').end - 1.0, 'warm_swell', 0.4], [L('L12').end - 0.95, 'lock_on', 0.3],
  [L('L13').start - 0.1, 'card_slide', 0.5], [L('L13').start + 0.8, 'card_slide', 0.45], [L('L13').start + 1.6, 'warm_swell', 0.35],
  [L('L14').start - 0.1, 'stamp', 0.25],
  [L('L15').start - 0.4, 'card_slide', 0.45],
  [L('L16').start + 0.5, 'whoosh_air', 0.4], [L('L16').end - 0.3, 'end_hit', 0.6],
];

export const DBSE01: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  const total = Math.round(TOTAL * VIDEO.fps);
  const fadeOut = interpolate(t, [TOTAL - 1.0, TOTAL], [0, 1], cl);
  const fadeIn = 1 - interpolate(t, [0, 0.5], [0, 1], cl);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {onWall(t) ? <Wall /> : <Desk />}
      <Whip />
      <Grain />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
      {cues().map(([at, name, vol], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(at * VIDEO.fps))} layout="none">
          <Audio src={staticFile(`sfx/dbs/${name}.wav`)} volume={(fr) => vol * (name === 'room_tone' || name === 'drone' ? interpolate(fr, [0, 20, total - 40, total], [0, 1, 1, 0], cl) : 1)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
export const DBS_E01_LINES = LINES;
