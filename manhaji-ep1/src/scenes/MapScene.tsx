import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, cue, easeInCubic, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutCubic, easeOutExpo, INTRO, lerp, prog, rand, spr} from '../time';
import {TimeCard} from '../components/Kit';
import {ASSET, CarFront, CarRear, CarSide, Cone, Lamp, School, SIZE, Sky, Tree, Warning} from '../street/Props';

// ---------------------------------------------------------------- timing
const T = () => ({
  house: cue('s2_house'),
  route: cue('s2_route'),
  school: cue('s2_school'),
  twenty: cue('s2_twenty'),
  twentyEnd: cue('s2_twentyEnd'),
  leave: cue('s2_leave'),
  c630: cue('s2_clock630'),
  driveA: cue('s2_arrive'),
  arriveA: cue('s2_clock650'),
  s3: cue('s3_start'),
  drive2: cue('s4_drive'),
  freeze: cue('s4_freeze'),
  text: cue('s4_text'),
  release: cue('s4_release'),
  jam: cue('s4_jam'),
  accident: cue('s4_accident'),
  stop: cue('s4_stop'),
  late: cue('s4_late'),
  question: cue('s4_question'),
  s5: cue('s5_start'),
});

export const MAP_A_END = () => cue('s3_start') + 0.7;
export const MAP_B_START = () => cue('s4_drive') - 0.35;

const S_DRIVE = 3000; // px the street scrolls between house and school
const S_FREEZE = 1600; // px scrolled when time stops (second run)
const CAR_W = 600;
const DW = 1920;
const DH = 1080;

type Frame = {s: number; ox: number; oy: number; at: (x: number, y: number) => {x: number; y: number}};
/** design frame (1920x1080) -> screen */
const frame = (W: number, H: number, s: number): Frame => {
  const ox = (W - DW * s) / 2;
  const oy = (H - DH * s) / 2;
  return {s, ox, oy, at: (x, y) => ({x: ox + x * s, y: oy + y * s})};
};

const shotScale = (isV: boolean) => ({house: isV ? 0.9 : 1, map: isV ? 0.55 : 1, drive: isV ? 1.15 : 1, jam: isV ? 1.05 : 1});
const HOUSE_A = {x: 1040, y: 905, w: 980};
const HOUSE_B = {x: 1735, y: 770, w: 330};
const ROAD_B = {x: 110, y: 290, w: 1500};
const SCHOOL_B = {x: 170, y: 430, w: 300};
// centre line of the street render, house end -> school end (image px)
const ROUTE_PTS: [number, number][] = [
  [1905, 585], [1785, 572], [1670, 557], [1560, 540], [1350, 520], [1250, 507], [1040, 470],
  [820, 458], [560, 432], [440, 418], [330, 392], [225, 345], [150, 275], [90, 175],
];

const pushA = (t: number) => 1 + 0.06 * prog(t, INTRO.transition, 4.6 - INTRO.transition, (x) => x);

const houseRectA = (t: number, W: number, H: number, isV: boolean) => {
  const f = frame(W, H, shotScale(isV).house);
  const p = pushA(t);
  const b = f.at(HOUSE_A.x, HOUSE_A.y);
  return {x: W / 2 + (b.x - W / 2) * p, y: H / 2 + (b.y - H / 2) * p, w: HOUSE_A.w * f.s * p};
};
const houseRectB = (W: number, H: number, isV: boolean) => {
  const f = frame(W, H, shotScale(isV).map);
  const b = f.at(HOUSE_B.x, HOUSE_B.y);
  return {x: b.x, y: b.y, w: HOUSE_B.w * f.s};
};
const avatarAt = (r: {x: number; y: number; w: number}) => ({x: r.x + r.w * 0.36, y: r.y - ((r.w * SIZE.house.h) / SIZE.house.w) * 0.82});

/** avatar bubble centre at the house — the intro iris lands here */
export const avatarScreen = (t: number, W: number, H: number, isV: boolean) => avatarAt(houseRectA(t, W, H, isV));

// ---------------------------------------------------------------- street pieces
const Ground: React.FC<{f: Frame; roadTop: number; roadBot: number; dash: number; blur?: number}> = ({f, roadTop, roadBot, dash, blur = 0}) => {
  const y = (v: number) => f.oy + v * f.s;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadTop - 90), height: 90 * f.s, background: 'linear-gradient(#EFE5D4, #E3D6C1)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadTop - 8), height: 8 * f.s, background: '#CDBFA8'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadTop), height: (roadBot - roadTop) * f.s, background: 'linear-gradient(#4A4E54, #3C4046)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadTop + 10), height: 6 * f.s, background: '#F2C230'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadBot - 16), height: 6 * f.s, background: '#F2C230'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y((roadTop + roadBot) / 2 - 4),
          height: 8 * f.s,
          backgroundImage: 'linear-gradient(90deg, #F4F4F0 0 60%, transparent 60% 100%)',
          backgroundSize: `${180 * f.s}px 100%`,
          backgroundPosition: `${dash * f.s}px 0`,
          filter: blur ? `blur(${blur * 0.4}px)` : undefined,
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadBot), height: 14 * f.s, background: '#CDBFA8'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y(roadBot + 14), bottom: 0, background: 'linear-gradient(#EADFCC, #DDCFB8 40%, #8DBB5E 40.5%, #78A84C)'}} />
    </>
  );
};

/** horizontally scrolling, wrapping row of elements (design coords) */
const Row: React.FC<{f: Frame; s: number; speed: number; period: number; n: number; render: (i: number) => React.ReactNode; y: number; blur?: number}> = ({f, s, speed, period, n, render, y, blur = 0}) => {
  const span = period * n;
  return (
    <div style={{position: 'absolute', inset: 0, filter: blur > 1 ? `url(#hblur${Math.min(9, Math.round(blur / 2))})` : undefined}}>
      {Array.from({length: n}).map((_, i) => {
        let x = (i * period + s * speed) % span;
        if (x < 0) x += span;
        x -= period;
        const q = f.at(x, y);
        return (
          <div key={i} style={{position: 'absolute', left: q.x, top: q.y, transform: `scale(${f.s})`, transformOrigin: '0 0'}}>
            {render(i)}
          </div>
        );
      })}
    </div>
  );
};

const BlurDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      {Array.from({length: 10}).map((_, i) => (
        <filter key={i} id={`hblur${i}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${i * 2} 0`} />
        </filter>
      ))}
    </defs>
  </svg>
);

const AVATAR = staticFile('media/avatar.png');
const Avatar: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) =>
  s > 0.01 ? (
    <div style={{position: 'absolute', left: x, top: y, width: 92, height: 92, transform: `translate(-50%,-50%) scale(${s})`}}>
      <div style={{width: 92, height: 92, borderRadius: 46, overflow: 'hidden', border: `4px solid ${C.yellow}`, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'}}>
        <Img src={AVATAR} style={{width: '100%', height: '100%'}} />
      </div>
    </div>
  ) : null;

const Pin: React.FC<{x: number; y: number; k: number; focus: number; label: string; color: string}> = ({x, y, k, focus, label, color}) => {
  const sc = Math.min(1.12, k);
  if (sc <= 0.01) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-100%) scale(${sc * (1 + 0.12 * focus)})`, transformOrigin: '50% 100%'}}>
      <div
        style={{
          fontFamily: F.kufi,
          fontWeight: 800,
          fontSize: 38,
          color: '#0B0E12',
          background: color,
          padding: '6px 24px 12px',
          borderRadius: 18,
          whiteSpace: 'nowrap',
          boxShadow: `0 10px 30px rgba(0,0,0,0.25), 0 0 ${30 * focus}px ${color}`,
          direction: 'rtl',
        }}
      >
        {label}
      </div>
      <div style={{margin: '0 auto', width: 5, height: 36, background: color, borderRadius: 3}} />
    </div>
  );
};

// ---------------------------------------------------------------- scene
export const MapScene: React.FC<{t: number}> = ({t: tIn}) => {
  const {W, H, isV, p} = useLayout();
  const k = T();
  const ss = shotScale(isV);
  const second = tIn > k.s3 + 1;
  const frozen = second && tIn >= k.freeze && tIn < k.release;
  const t = frozen ? k.freeze : tIn;

  // shot weights
  const mAB = second ? 1 : prog(t, k.house + 0.02, 0.4, easeInOutQuint); // house hero -> diorama
  const mBA = second ? 1 : prog(t, k.leave - 0.2, 0.42, easeInOutQuint); // diorama -> house street
  const whip = second ? 1 : prog(t, k.driveA - 0.12, 0.26, easeInOutCubic); // street -> driving
  const inA = !second && mAB < 1;
  const inB = !second && mAB > 0 && mBA < 1;
  const inC = !second && mBA > 0 && whip < 1;
  const inD = !second && whip > 0;
  const toJam = second ? prog(tIn, k.release - 0.02, 0.12, (x) => x) : 0;
  const toFront = second ? prog(tIn, k.late - 0.05, 0.16, easeInOutCubic) : 0;
  const inE = second && toJam < 1;
  const inF = second && toJam > 0 && toFront < 1;
  const inG = second && toFront > 0;

  // the villa image morphs between hero and diorama (screen space)
  const hA = houseRectA(t, W, H, isV);
  const hB = houseRectB(W, H, isV);
  const mHouse = mAB - mBA;
  const house = {x: lerp(hA.x, hB.x, mHouse), y: lerp(hA.y, hB.y, mHouse), w: lerp(hA.w, hB.w, mHouse)};
  const houseH = (house.w * SIZE.house.h) / SIZE.house.w;

  // driving
  const sAt = (tt: number) =>
    second
      ? S_FREEZE * Math.pow(clamp((tt - MAP_B_START()) / (k.freeze - MAP_B_START())), 1.6)
      : S_DRIVE * prog(tt, k.driveA, k.arriveA - k.driveA, easeInOutCubic);
  const sNow = sAt(t);
  const vel = frozen ? 0 : Math.abs(sNow - sAt(t - 1 / 30));
  const spin = -(sNow / (2 * Math.PI * 47)) * 360;

  // HUD
  const timerIn = second ? 0 : spr(t, k.twenty - 0.12, 1.5);
  const count = prog(t, k.twenty, k.twentyEnd - k.twenty, (x) => x);
  const dock = second ? 1 : prog(t, k.leave - 0.1, 0.45, easeInOutQuint);
  const timerPos = {x: lerp(W / 2, p(150, W / 2), dock), y: lerp(p(200, 560), p(150, 150), dock), s: lerp(1, 0.62, dock)};
  const depIn = second ? spr(t, MAP_B_START() + 0.15, 1.4) : spr(t, k.c630 - 0.05, 1.5);
  const depRoll = second ? 1 : prog(t, k.c630 - 0.05, 0.38, easeOutExpo);
  const arrIn = second ? spr(t, MAP_B_START() + 0.3, 1.4) : spr(t, k.driveA - 0.1, 1.5);
  let arrMin = 390 + 20 * (sNow / S_DRIVE);
  let arrColor: string = C.text;
  let arrAccent: string = C.teal;
  let glitch = 0;
  if (second && tIn >= k.release) {
    const late = Math.max(0, tIn - k.release);
    arrMin = 390 + 20 * (S_FREEZE / S_DRIVE) + late * 9 + Math.max(0, tIn - k.late) * 4;
    arrColor = arrMin > 410 ? C.red : C.orange;
    arrAccent = arrColor;
    glitch = tIn > k.late && tIn < k.late + 0.35 ? (tIn - k.late) * 3 : 0;
  }
  const arrived = !second && t >= k.arriveA;
  const arrGlow = arrived ? Math.exp(-(t - k.arriveA) * 2.5) : 0;
  const arrPop = arrived ? 1 + 0.12 * Math.exp(-(t - k.arriveA) * 6) * Math.cos((t - k.arriveA) * 20) : 1;
  const cardsOut = second ? 0 : prog(t, k.s3 - 0.05, 0.4, easeInOutCubic);

  // freeze + «بس لحظة!»
  const fz = second ? clamp((tIn - k.freeze) / 0.06) * (1 - clamp((tIn - k.release) / 0.18)) : 0;
  const fzAge = tIn - k.freeze;
  const punch = second && fzAge > 0 ? 1 + 0.06 * easeOutExpo(clamp(fzAge / 0.2)) * (1 - prog(tIn, k.release, 0.4)) : 1;
  const warm = second ? clamp((tIn - k.release) / 0.4) : 0;
  const wait = second ? spr(tIn, k.text, 1.6) : 0;
  const waitOut = second ? prog(tIn, k.release + 0.15, 0.35, easeInOutCubic) : 0;
  const q = second ? clamp((tIn - k.question) / 0.45) : 0;
  const qPop = second ? spr(tIn, k.question + 0.3, 1.6) : 0;
  const qGrow = second ? prog(tIn, k.s5 - 0.22, 0.3, easeInCubic) : 0;

  const fH = frame(W, H, ss.house);
  const fM = frame(W, H, ss.map);
  const fD = frame(W, H, ss.drive);
  const fJ = frame(W, H, ss.jam);

  // ---------------------------------------------------------------- A / C: house street
  const carC = spr(t, k.leave + 0.18, 0.9);
  const carCx = lerp(2400, 1180, Math.min(1, carC));
  const houseStreet = (alpha: number, scale: number, origin: {x: number; y: number}) => (
    <AbsoluteFill style={{opacity: alpha, transform: `scale(${scale})`, transformOrigin: `${origin.x}px ${origin.y}px`}}>
      <AbsoluteFill style={{transform: `scale(${pushA(t)})`}}>
        {[-1, 0, 1, 2, 3].map((i) => {
          const b = fH.at(-300 + i * 620, 760);
          const w = 520 * fH.s;
          return (
            <Img
              key={i}
              src={ASSET.house}
              style={{position: 'absolute', left: b.x, top: b.y - (w * SIZE.house.h) / SIZE.house.w, width: w, opacity: 0.55, filter: 'saturate(0.6) brightness(1.08) blur(1.5px)', transform: i % 2 ? 'scaleX(-1)' : undefined}}
            />
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: fH.at(0, 740).y, bottom: 0, background: 'linear-gradient(#E9DFCF, #E2D5C0)'}} />
        <Ground f={fH} roadTop={905} roadBot={1075} dash={0} />
        {[{x: 230, s: 420, d: 1}, {x: 1830, s: 360, d: 2}, {x: -60, s: 300, d: 3}].map((tr) => {
          const b = fH.at(tr.x, 905);
          return <Tree key={tr.d} size={tr.s * fH.s} seed={tr.d} style={{position: 'absolute', left: b.x - (tr.s * fH.s) / 2, top: b.y - tr.s * fH.s * 1.1}} />;
        })}
        {[520, 1560].map((x, i) => {
          const b = fH.at(x, 905);
          return <Lamp key={i} h={300 * fH.s} style={{position: 'absolute', left: b.x, top: b.y - 300 * fH.s}} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );

  // ---------------------------------------------------------------- B: diorama
  const routeK = prog(t, k.school - 0.15, 0.85, easeInOutCubic);
  const rs = (ROAD_B.w * fM.s) / SIZE.road.w;
  const road0 = fM.at(ROAD_B.x, ROAD_B.y);
  const rpts = ROUTE_PTS.map(([x, y]) => ({x: road0.x + x * rs, y: road0.y + y * rs}));
  const segs = rpts.slice(1).map((b, i) => Math.hypot(b.x - rpts[i].x, b.y - rpts[i].y));
  const want = segs.reduce((a, b) => a + b, 0) * routeK;
  const drawn: {x: number; y: number}[] = [rpts[0]];
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    if (acc + segs[i] <= want) {
      drawn.push(rpts[i + 1]);
      acc += segs[i];
    } else {
      const u = (want - acc) / segs[i];
      drawn.push({x: lerp(rpts[i].x, rpts[i + 1].x, u), y: lerp(rpts[i].y, rpts[i + 1].y, u)});
      break;
    }
  }
  const rStr = drawn.map((b) => `${b.x.toFixed(1)},${b.y.toFixed(1)}`).join(' ');
  const schoolB = fM.at(SCHOOL_B.x, SCHOOL_B.y);
  const schoolIn = Math.min(1.1, spr(t, k.school - 0.1, 1.3));
  const bAlpha = mAB * (1 - mBA);
  const bScale = lerp(1.5, 1, mAB) * lerp(1, 1.5, mBA);
  const diorama = (
    <AbsoluteFill style={{opacity: bAlpha, transform: `scale(${bScale})`, transformOrigin: `${hB.x}px ${hB.y - 40}px`}}>
      <Sky t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 62%, rgba(250,244,232,0.95) 30%, rgba(250,244,232,0) 75%)'}} />
      <Img src={ASSET.road} style={{position: 'absolute', left: road0.x, top: road0.y, width: ROAD_B.w * fM.s, filter: 'drop-shadow(0 30px 40px rgba(60,50,30,0.25))'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="rglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
        </defs>
        {routeK > 0 && (
          <g>
            <polyline points={rStr} fill="none" stroke={C.teal} strokeWidth={40 * fM.s} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} filter="url(#rglow)" />
            <polyline points={rStr} fill="none" stroke="#0B7F77" strokeWidth={20 * fM.s} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={rStr} fill="none" stroke={C.teal} strokeWidth={13 * fM.s} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={rStr} fill="none" stroke="#E8FFFC" strokeWidth={4 * fM.s} strokeDasharray={`${16 * fM.s} ${22 * fM.s}`} strokeDashoffset={-t * 140 * fM.s} strokeLinecap="round" />
          </g>
        )}
      </svg>
      {schoolIn > 0.001 && (
        <div style={{position: 'absolute', left: schoolB.x, top: schoolB.y, transform: `translate(-50%,-100%) scale(${schoolIn})`, transformOrigin: '50% 100%'}}>
          <School w={SCHOOL_B.w * fM.s} label={false} />
        </div>
      )}
      <Pin x={schoolB.x} y={schoolB.y - SCHOOL_B.w * fM.s * 0.74} k={schoolIn} focus={t > k.school ? Math.exp(-(t - k.school) * 3) : 0} label="المدرسة" color={C.teal} />
    </AbsoluteFill>
  );

  // ---------------------------------------------------------------- D / E: driving
  const drive = (s: number, school: boolean, alpha: number, shift: number) => {
    const blur = Math.min(18, vel * 0.25);
    const carP = fD.at(960, 985);
    const sp = fD.at(760 - 0.85 * S_DRIVE + s * 0.85, 812);
    return (
      <AbsoluteFill style={{opacity: alpha, transform: `translateX(${shift}px)`}}>
        <Sky t={t} />
        <Row f={fD} s={s} speed={0.12} period={700} n={5} y={560} render={(i) => <div style={{width: 600, height: 180, background: i % 2 ? '#E4DCCB' : '#DCD3C1', borderRadius: '6px 6px 0 0', opacity: 0.8, transform: `translateY(${rand(i) * 60}px)`}} />} />
        <div style={{position: 'absolute', left: 0, right: 0, top: fD.at(0, 700).y, bottom: 0, background: 'linear-gradient(#EADFCD, #E4D7C2)'}} />
        <Row f={fD} s={s} speed={0.45} period={640} n={5} y={420} blur={blur * 0.5} render={(i) => <Img src={ASSET.house} style={{width: 560, filter: 'saturate(0.85)', transform: i % 2 ? 'scaleX(-1)' : undefined}} />} />
        <Ground f={fD} roadTop={830} roadBot={1040} dash={s} blur={blur} />
        <Row f={fD} s={s} speed={0.85} period={420} n={7} y={472} blur={blur} render={(i) => <Tree size={340} seed={i + 10} />} />
        {school && (
          <div style={{position: 'absolute', left: sp.x, top: sp.y, transform: `translate(-50%,-100%) scale(${fD.s})`, transformOrigin: '50% 100%', filter: blur > 1 ? `url(#hblur${Math.min(9, Math.round(blur / 2))})` : undefined}}>
            <School w={560} />
          </div>
        )}
        <Row f={fD} s={s} speed={0.85} period={840} n={4} y={560} blur={blur} render={() => <div style={{marginLeft: 200}}><Lamp h={270} /></div>} />
        <CarSide
          x={carP.x}
          y={carP.y}
          w={CAR_W * fD.s}
          spin={spin}
          bob={vel > 1 ? Math.sin(t * 40) * 1.2 : 0}
          brake={second ? 0 : clamp((t - (k.arriveA - 0.25)) / 0.15) * (1 - clamp((t - k.arriveA - 0.6) / 0.3))}
        />
        <Row f={fD} s={s} speed={1.5} period={900} n={4} y={1030} blur={blur * 1.5} render={(i) => <div style={{width: 260, height: 90, borderRadius: '50% 50% 10px 10px', background: i % 2 ? '#5E9E3A' : '#4C8A30'}} />} />
      </AbsoluteFill>
    );
  };

  // ---------------------------------------------------------------- F: in the jam (behind our car)
  const C_STOP = 2.2;
  const cJ = second ? C_STOP * prog(tIn, k.release - 0.05, k.stop - k.release + 0.3, easeOutCubic) : 0;
  const accAge = second && tIn >= k.accident ? tIn - k.accident : -1;
  const jamShot = (alpha: number, blurPx = 0) => {
    const HZ = 520;
    const proj = (Z: number, L: number) => {
      const r = Math.max(0.35, Z - cJ);
      return {...fJ.at(960 + L / r, HZ + 560 / r), sc: fJ.s / r, r};
    };
    const objs: {r: number; el: React.ReactNode}[] = [];
    for (let i = 0; i < 16; i++) {
      const Z = 0.6 + i * 0.55;
      for (const side of [-1, 1]) {
        const pr = proj(Z, side * 1350);
        if (pr.r < 0.4 || pr.r > 9) continue;
        objs.push({r: pr.r, el: <Tree key={`t${i}${side}`} size={560 * pr.sc} seed={i * 2 + (side > 0 ? 1 : 0)} style={{position: 'absolute', left: pr.x - 280 * pr.sc, top: pr.y - 616 * pr.sc}} />});
        if (i % 2 === 0) {
          const pl = proj(Z + 0.27, side * 1050);
          if (pl.r > 0.4) objs.push({r: pl.r, el: <Lamp key={`l${i}${side}`} h={520 * pl.sc} style={{position: 'absolute', left: pl.x, top: pl.y - 520 * pl.sc, transform: side < 0 ? 'scaleX(-1)' : undefined}} />});
        }
      }
    }
    [
      {Z: C_STOP + 1.35, tint: '#6F7C8C', L: -170},
      {Z: C_STOP + 2.05, tint: '#2E3440', L: 150},
      {Z: C_STOP + 2.8, tint: '#B9C2CC', L: -90},
    ].forEach((c2, i) => {
      const pr = proj(c2.Z, c2.L);
      objs.push({r: pr.r, el: <CarRear key={`c${i}`} x={pr.x} y={pr.y} w={540 * pr.sc} tint={c2.tint} brake={0.85 + 0.15 * Math.sin(tIn * 6 + i)} />});
    });
    const accZ = C_STOP + 4.0;
    if (accAge >= 0) {
      const pa = proj(accZ, -60);
      const pb = proj(accZ + 0.2, 260);
      const ak = Math.min(1, spr(accAge, 0, 2.2));
      objs.push({
        r: pb.r,
        el: (
          <div key="acc1" style={{position: 'absolute', inset: 0, transform: `rotate(${-14 * ak}deg)`, transformOrigin: `${pb.x}px ${pb.y}px`}}>
            <CarSide x={pb.x} y={pb.y} w={540 * pb.sc} tint="#9AA4AE" />
          </div>
        ),
      });
      objs.push({r: pa.r, el: <CarRear key="acc2" x={pa.x} y={pa.y} w={540 * pa.sc} tint="#B0644A" rot={18 * ak} brake={0.6} />});
      [-420, 420].forEach((L, i) => {
        const pc = proj(accZ - 0.5, L);
        const ck = clamp(spr(accAge, 0.2 + i * 0.08, 2));
        objs.push({r: pc.r, el: <div key={`cn${i}`} style={{position: 'absolute', left: pc.x - 42 * pc.sc, top: pc.y - 120 * pc.sc, transform: `scale(${ck})`, transformOrigin: '50% 100%'}}><Cone h={120 * pc.sc} /></div>});
      });
    }
    objs.sort((a, b) => b.r - a.r);
    const poly = (pts: {x: number; y: number}[]) => pts.map((b) => `${b.x},${b.y}`).join(' ');
    const dashes: React.ReactNode[] = [];
    for (let i = 0; i < 40; i++) {
      const Z0 = i * 0.5;
      if (Z0 - cJ < 0.38 || Z0 - cJ > 20) continue;
      for (const L of [-560, 560]) {
        dashes.push(<polygon key={`d${i}${L}`} points={poly([proj(Z0, L - 10), proj(Z0, L + 10), proj(Z0 + 0.22, L + 10), proj(Z0 + 0.22, L - 10)])} fill="#F3F3EE" opacity={0.9} />);
      }
    }
    const hp = proj(accZ, 100);
    const our = fJ.at(960, 1062);
    const avTop = fJ.at(960, 1062 - 380);
    return (
      <AbsoluteFill style={{opacity: alpha, filter: blurPx ? `blur(${blurPx}px) brightness(0.9)` : undefined}}>
        <Sky t={tIn} sunX="70%" sunY="22%" />
        <div style={{position: 'absolute', left: 0, right: 0, top: fJ.at(0, HZ - 4).y, bottom: 0, background: '#E7DCC8'}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <polygon points={poly([proj(40, -80), proj(40, -40), proj(0.36, -1150), proj(0.36, -2600)])} fill="#E4D8C4" />
          <polygon points={poly([proj(40, 40), proj(40, 80), proj(0.36, 2600), proj(0.36, 1150)])} fill="#E4D8C4" />
          <polygon points={poly([proj(40, -40), proj(40, 40), proj(0.36, 1150), proj(0.36, -1150)])} fill="#474B51" />
          <polyline points={poly([proj(40, -36), proj(0.36, -1100)])} stroke="#F2C230" strokeWidth={8} fill="none" />
          <polyline points={poly([proj(40, 36), proj(0.36, 1100)])} stroke="#F2C230" strokeWidth={8} fill="none" />
          {dashes}
          {accAge >= 0 &&
            [0, 1, 2].map((i) => {
              const ph = (accAge * 1.3 + i / 3) % 1;
              return <ellipse key={i} cx={hp.x} cy={hp.y} rx={(120 + ph * 520) * hp.sc} ry={(40 + ph * 170) * hp.sc} fill="none" stroke={C.orange} strokeWidth={5} opacity={(1 - ph) * 0.8 * clamp(accAge * 3)} />;
            })}
        </svg>
        {objs.map((o, i) => (
          <React.Fragment key={i}>{o.el}</React.Fragment>
        ))}
        {accAge >= 0 && (
          <div style={{position: 'absolute', left: hp.x, top: hp.y - 300 * hp.sc, transform: `translate(-50%,-100%) scale(${Math.min(1.12, spr(accAge, 0.05, 1.6))})`, transformOrigin: '50% 100%'}}>
            <Warning size={Math.max(100, 260 * hp.sc)} />
          </div>
        )}
        <CarRear x={our.x} y={our.y} w={600 * fJ.s} brake={clamp((tIn - (k.stop - 0.35)) / 0.2)} />
        {!blurPx && <Avatar x={avTop.x} y={avTop.y} />}
      </AbsoluteFill>
    );
  };

  // ---------------------------------------------------------------- G: front close-up, hazards on
  const frontShot = (alpha: number) => {
    const blink = 0.5 + 0.5 * Math.sign(Math.sin(tIn * Math.PI * 4));
    const cp = fJ.at(p(760, 960), p(1010, 1180));
    return (
      <AbsoluteFill style={{opacity: alpha}}>
        {jamShot(1, 14)}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, rgba(255,240,220,0), rgba(60,40,30,0.35))'}} />
        <AbsoluteFill style={{transform: `scale(${1 + 0.04 * prog(tIn, k.late, 1.7, (x) => x)})`}}>
          <CarFront x={cp.x} y={cp.y} w={p(820, 860) * fJ.s} hazard={blink * 0.95} lights={0.5} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  };

  // avatar bubble path: house -> car
  const avHouse = avatarAt(house);
  const carStreet = fH.at(carCx, 1040 - 30 - 330);
  const carDriveTop = fD.at(960, 985 - 330);
  const avOnCar = prog(t, k.leave + 0.5, 0.45, easeInOutCubic);
  let av = avHouse;
  if (second || whip > 0) av = carDriveTop;
  else if (mBA > 0) av = {x: lerp(avHouse.x, carStreet.x, avOnCar), y: lerp(avHouse.y, carStreet.y, avOnCar)};

  return (
    <AbsoluteFill style={{background: '#EAF3F4', overflow: 'hidden'}}>
      <BlurDefs />
      <AbsoluteFill
        style={{
          transform: `scale(${punch})`,
          filter: fz > 0 ? `grayscale(${0.85 * fz}) contrast(${1 + 0.15 * fz}) brightness(${1 - 0.08 * fz})` : warm > 0 ? `sepia(${0.12 * warm}) saturate(${1 + 0.1 * warm})` : undefined,
        }}
      >
        {(inA || inC) && (
          <>
            <Sky t={t} />
            {houseStreet(Math.max(1 - mAB, mBA) * (1 - whip), lerp(1, 0.45, mHouse), {x: house.x, y: house.y})}
          </>
        )}
        {inB && diorama}
        {(inA || inB || inC) && whip < 1 && (
          <AbsoluteFill style={{opacity: 1 - whip}}>
            <Img src={ASSET.house} style={{position: 'absolute', left: house.x - house.w / 2, top: house.y - houseH, width: house.w, filter: 'drop-shadow(0 20px 30px rgba(60,40,20,0.25))'}} />
            {inC && carC > 0.001 && (
              <AbsoluteFill style={{transform: `scale(${pushA(t)})`}}>
                <CarSide x={fH.at(carCx, 1040).x} y={fH.at(0, 1040 - 30).y} w={CAR_W * fH.s} spin={-((2400 - carCx) / (2 * Math.PI * 47)) * 360} brake={carC > 0.95 ? 0.7 : 0} />
              </AbsoluteFill>
            )}
            <Pin x={house.x} y={house.y - houseH * 0.98} k={spr(t, k.house - 0.05, 1.4) * (1 - mBA)} focus={t > k.house ? Math.exp(-(t - k.house) * 3) : 0} label="البيت" color={C.orange} />
          </AbsoluteFill>
        )}
        {(inD || inE) && drive(sNow, inD, second ? clamp((tIn - (MAP_B_START() - 0.2)) / 0.3) : whip, second ? 0 : (1 - whip) * -400)}
        {inF && jamShot(1)}
        {inG && frontShot(toFront)}
        {!inF && !inG && t > INTRO.transition + 0.68 && <Avatar x={av.x} y={av.y} />}
        {second && tIn > k.release - 0.05 && tIn < k.release + 0.25 && <AbsoluteFill style={{background: `rgba(255,255,255,${0.7 * (1 - clamp((tIn - k.release) / 0.25))})`}} />}
      </AbsoluteFill>

      {warm > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(255,77,94,${0.2 * warm}) 100%)`}} />}

      {fz > 0 && (
        <AbsoluteFill>
          <AbsoluteFill style={{background: `rgba(180,240,236,${0.5 * Math.exp(-fzAge * 14)})`}} />
          <AbsoluteFill style={{background: 'rgba(16,40,44,0.18)', opacity: fz}} />
          <svg width={W} height={H} style={{position: 'absolute'}}>
            {[0, 1].map((i) => {
              const r = easeOutExpo(clamp((fzAge - i * 0.08) / 0.6)) * Math.hypot(W, H) * 0.6;
              return <circle key={i} cx={W / 2} cy={H / 2} r={r} fill="none" stroke="#BFF7F1" strokeWidth={6 - i * 2} opacity={(1 - clamp((fzAge - i * 0.08) / 0.6)) * fz} />;
            })}
            {[
              [60, 60, 1, 1],
              [W - 60, 60, -1, 1],
              [60, H - 60, 1, -1],
              [W - 60, H - 60, -1, -1],
            ].map(([x, y, sx, sy], i) => (
              <path key={i} d={`M ${x} ${y + sy * 70} V ${y} H ${x + sx * 70}`} fill="none" stroke="#E6FFFC" strokeWidth={6} opacity={fz * 0.9} />
            ))}
            <g transform={`translate(${p(W - 150, W - 140)} ${p(H - 150, H - 230)})`} opacity={fz}>
              <rect x={0} y={0} width={18} height={60} rx={5} fill="#E6FFFC" />
              <rect x={34} y={0} width={18} height={60} rx={5} fill="#E6FFFC" />
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* journey timer */}
      {timerIn > 0.001 && tIn < k.s3 + 0.6 && (
        <div style={{position: 'absolute', left: timerPos.x, top: timerPos.y, transform: `translate(-50%,-50%) scale(${timerPos.s * Math.min(1.1, timerIn) * (1 - cardsOut)})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, direction: 'rtl', background: 'rgba(14,18,24,0.92)', border: `2px solid ${C.yellow}`, borderRadius: 999, padding: '12px 30px 12px 16px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'}}>
            <svg width={84} height={84} viewBox="0 0 84 84">
              <circle cx={42} cy={42} r={34} fill="none" stroke="#2A323D" strokeWidth={9} />
              <circle cx={42} cy={42} r={34} fill="none" stroke={C.yellow} strokeWidth={9} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - count)} transform="rotate(-90 42 42)" />
              <line x1={42} y1={42} x2={42 + Math.sin(count * Math.PI * 2) * 22} y2={42 - Math.cos(count * Math.PI * 2) * 22} stroke={C.text} strokeWidth={5} strokeLinecap="round" />
              <circle cx={42} cy={42} r={5} fill={C.text} />
            </svg>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 12}}>
              <div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 72, color: C.yellow, minWidth: 90, textAlign: 'center'}}>{Math.round(20 * count)}</div>
              <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 44, color: C.text}}>دقيقة</div>
            </div>
          </div>
        </div>
      )}

      {/* departure / arrival cards (top of frame, clear of the car) */}
      {(depIn > 0.001 || arrIn > 0.001) && (second ? tIn < k.s5 + 0.5 : tIn < k.s3 + 0.6) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: p(110, 250),
            display: 'flex',
            justifyContent: 'center',
            gap: p(60, 40),
            direction: 'rtl',
            opacity: 1 - cardsOut,
            transform: `translateY(${cardsOut * -60}px) scale(${1 - cardsOut * 0.15})`,
          }}
        >
          <div style={{transform: `translateY(${(1 - Math.min(1, depIn)) * -120}px) scale(${0.6 + 0.4 * Math.min(1.08, depIn)})`, opacity: clamp(depIn * 2)}}>
            <TimeCard label="الخروج" minutes={360 + 30 * depRoll} accent={C.orange} size={p(76, 74)} />
          </div>
          <div style={{transform: `translateY(${(1 - Math.min(1, arrIn)) * -120}px) scale(${(0.6 + 0.4 * Math.min(1.08, arrIn)) * arrPop})`, opacity: clamp(arrIn * 2)}}>
            <TimeCard label={second && tIn > k.release ? 'الوصول؟' : 'الوصول'} minutes={arrMin} accent={arrAccent} size={p(76, 74)} glow={arrGlow} color={arrColor} glitch={glitch} />
          </div>
        </div>
      )}

      {/* «بس لحظة!» */}
      {wait > 0.001 && waitOut < 1 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              transform: `translateY(${p(-20, -200) - waitOut * p(330, 560)}px) scale(${(2.1 - 1.1 * Math.min(1.06, wait)) * (1 - waitOut * 0.55)}) rotate(${(1 - clamp(wait)) * 6 - 2}deg)`,
              opacity: clamp(wait * 4) * (1 - waitOut),
              fontFamily: F.kufi,
              fontWeight: 900,
              fontSize: p(190, 170),
              color: C.yellow,
              direction: 'rtl',
              whiteSpace: 'nowrap',
              textShadow: '0 14px 0 #0B0E12, 0 24px 60px rgba(0,0,0,0.5)',
              WebkitTextStroke: '6px #0B0E12',
              paintOrder: 'stroke fill',
            }}
          >
            بس لحظة!
          </div>
        </AbsoluteFill>
      )}

      {/* question mark */}
      {q > 0 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `translate(${p(560, 0)}px, ${p(40, -330)}px) scale(${1 + qGrow * 26})`, transformOrigin: '50% 55%'}}>
            <svg width={300} height={380} viewBox="0 0 300 380" style={{overflow: 'visible'}}>
              <circle cx={150} cy={170} r={150 + 40 * easeOutCubic(q)} fill={C.yellow} opacity={0.18 * (1 - qGrow)} />
              <path
                d="M 80 120 Q 80 40 150 40 Q 225 40 225 115 Q 225 165 175 190 Q 150 203 150 240 L 150 255"
                fill="none"
                stroke={C.yellow}
                strokeWidth={46}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 * (1 - easeInOutCubic(q))}
                style={{filter: 'drop-shadow(0 8px 0 #0B0E12)'}}
              />
              <circle cx={150} cy={330 - (1 - Math.min(1, qPop)) * 80} r={28 * Math.min(1.15, easeOutBack(clamp(qPop)))} fill={C.yellow} style={{filter: 'drop-shadow(0 8px 0 #0B0E12)'}} />
            </svg>
          </div>
        </AbsoluteFill>
      )}
      {qGrow > 0 && <AbsoluteFill style={{background: C.yellow, opacity: clamp((qGrow - 0.6) / 0.4)}} />}
    </AbsoluteFill>
  );
};
