import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, useLayout} from '../theme';
import {Cam, project} from '../map/engine';
import {along, avatarAtHouse, distAtX, JAM_STOP_X, ROUTE_LEN, World, WorldState} from '../map/World';
import {
  clamp,
  cue,
  easeInCubic,
  easeInOutCubic,
  easeInOutQuint,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
  INTRO,
  kf,
  lerp,
  prog,
  spr,
} from '../time';
import {TimeCard} from '../components/Kit';

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

const FREEZE_X = 760;
export const MAP_A_END = () => cue('s3_start') + 0.7;
export const MAP_B_START = () => cue('s4_drive') - 0.35;

/** distance of the hero car along the route */
const carDist = (t: number) => {
  const k = T();
  if (t < k.s3 + 1) {
    if (t < k.driveA) return 0;
    return ROUTE_LEN * prog(t, k.driveA, k.arriveA - k.driveA, easeInOutCubic);
  }
  // second run: accelerate out of the driveway, frozen at FREEZE_X, then crawl into the jam
  const dF = distAtX(FREEZE_X);
  if (t < k.freeze) return dF * easeInCubic(clamp((t - k.drive2) / (k.freeze - k.drive2))) ** 0.8;
  if (t < k.release) return dF;
  const dS = distAtX(JAM_STOP_X);
  return lerp(dF, dS, prog(t, k.release + 0.05, k.stop - k.release + 0.3, easeOutCubic));
};

export const mapCam = (t: number, W: number, H: number, isV: boolean): Cam => {
  const k = T();
  const yawOff = isV ? -90 : 0;
  const dm = isV ? 1.3 : 1;
  type K = [number, number, number, number, number, number, ((x: number) => number)?]; // t x y dist tilt yaw
  const keys: K[] = [
    [INTRO.transition, 1400, -140, 760, 54, -12],
    [k.house + 0.1, 1260, -150, 1150, 50, -6, easeInOutCubic],
    [k.school + 0.55, 0, -210, 2900, 40, 0, easeInOutQuint],
    [k.twentyEnd + 0.4, -60, -190, 2720, 42, 3],
    [k.leave + 0.6, 1150, -70, 1350, 50, -5, easeInOutQuint],
    [k.driveA, 1060, -60, 1420, 50, -3],
    [k.arriveA + 0.25, -1300, -430, 1450, 48, 4, easeInOutCubic],
    [k.s3, -1260, -450, 1600, 46, 6],
    [k.s3 + 0.7, -900, -350, 4200, 8, 12, easeInOutQuint],
    // scene 4 (map comes back)
    [MAP_B_START(), 1300, -60, 1500, 44, -14],
    [k.drive2 + 0.2, 1200, -40, 1300, 50, -6, easeOutCubic],
    [k.freeze, 900, -20, 1250, 50, -4, easeInOutCubic],
    [k.release, 860, -20, 1150, 51, -3],
    [k.jam + 0.6, 330, 0, 1300, 52, -1, easeInOutQuint],
    [k.question, 430, 0, 1050, 55, 3],
    [k.s5 + 0.2, 470, 0, 900, 56, 5],
  ];
  const ch = (i: number) => kf(t, keys.map((r) => [r[0], r[i], r[6]] as [number, number, ((x: number) => number)?]));
  let x = ch(1);
  let y = ch(2);
  // follow the car while it drives (scene 2)
  const follow = clamp((t - k.driveA) / 0.25) * (1 - clamp((t - k.arriveA) / 0.35));
  if (follow > 0) {
    const p = along(carDist(t - 0.08));
    x = lerp(x, p.x, follow * 0.85);
    y = lerp(y, p.y, follow * 0.85);
  }
  return {x, y, dist: ch(3) * dm, tilt: ch(4), yaw: ch(5) + yawOff, W, H, fov: 1.0};
};

/** screen position of the avatar bubble (house roof) — used to land the intro iris */
export const avatarScreen = (t: number, W: number, H: number, isV: boolean) => {
  const a = avatarAtHouse(mapCam(t, W, H, isV));
  return {x: a.x, y: a.y - 46};
};

// ---------------------------------------------------------------- scene
export const MapScene: React.FC<{t: number}> = ({t}) => {
  const {W, H, isV, p} = useLayout();
  const k = T();
  const c = mapCam(t, W, H, isV);
  const second = t > k.s3 + 1;
  const d = carDist(t);
  const dPrev = carDist(t - 1 / 15);
  const speed = Math.abs(d - dPrev);
  const frozen = second && t >= k.freeze && t < k.release;

  const s: WorldState = {
    routeDraw: second ? 1 : prog(t, k.route, k.school + 0.4 - k.route, easeInOutCubic),
    routeAlpha: 1,
    carD: d,
    carOn: second ? 1 : spr(t, k.leave, 1.4),
    carGhost: frozen ? 0 : clamp(speed / 120),
    carPrevD: dPrev,
    jam: second ? clamp((t - k.jam) / 0.3) : 0,
    jamT: t - k.jam,
    accident: second && t >= k.accident ? t - k.accident : -1,
    brake: second && t > k.release ? clamp((t - k.release) / 0.2) : 0,
    houseIn: 1,
    schoolIn: second ? 1 : Math.min(1.12, spr(t, k.school - 0.08, 1.3)),
    houseFocus: second ? 0 : Math.exp(-Math.max(0, t - k.house) * 3) * (t > k.house ? 1 : 0),
    schoolFocus: second ? 0 : Math.exp(-Math.max(0, t - k.school) * 3) * (t > k.school ? 1 : 0),
    avatar: t > INTRO.transition + 0.68 ? 1 : 0,
    avatarOnCar: second ? 1 : prog(t, k.leave + 0.1, 0.45, easeInOutCubic),
    labels: 1,
  };

  // HUD -------------------------------------------------------------------
  const timerIn = second ? 0 : spr(t, k.twenty - 0.12, 1.5);
  const count = prog(t, k.twenty, k.twentyEnd - k.twenty, (x) => x);
  const dock = second ? 1 : prog(t, k.leave - 0.1, 0.45, easeInOutQuint);
  const midP = project(c, [-400, -200, 0]);
  const timerPos = {
    x: lerp(midP.x, p(150, 140), dock),
    y: lerp(midP.y - 40, p(150, 330), dock),
    s: lerp(1, 0.62, dock),
  };

  const depIn = second ? spr(t, MAP_B_START() + 0.15, 1.4) : spr(t, k.c630 - 0.05, 1.5);
  const depRoll = second ? 1 : prog(t, k.c630 - 0.05, 0.38, easeOutExpo);
  const arrIn = second ? spr(t, k.drive2 - 0.05, 1.4) : spr(t, k.driveA - 0.1, 1.5);
  const tripK = d / ROUTE_LEN;
  let arrMin = 390 + 20 * tripK;
  let arrColor: string = C.text;
  let arrAccent: string = C.teal;
  let glitch = 0;
  if (second && t >= k.release) {
    // stuck in traffic: the clock keeps running past 06:50
    const late = Math.max(0, t - k.release);
    arrMin = 390 + 20 * (distAtX(FREEZE_X) / ROUTE_LEN) + late * 9 + Math.max(0, t - k.late) * 4;
    arrColor = arrMin > 410 ? C.red : C.orange;
    arrAccent = arrMin > 410 ? C.red : C.orange;
    glitch = t > k.late && t < k.late + 0.35 ? (t - k.late) * 3 : 0;
  }
  const arrived = !second && t >= k.arriveA;
  const arrGlow = arrived ? Math.exp(-(t - k.arriveA) * 2.5) : 0;
  const arrPop = arrived ? 1 + 0.12 * Math.exp(-(t - k.arriveA) * 6) * Math.cos((t - k.arriveA) * 20) : 1;

  const cardsOut = second ? 0 : prog(t, k.s3 - 0.05, 0.4, easeInOutCubic);

  // freeze + «بس لحظة!» -----------------------------------------------------
  const fz = second ? clamp((t - k.freeze) / 0.06) * (1 - clamp((t - k.release) / 0.18)) : 0;
  const fzAge = t - k.freeze;
  const punch = second && fzAge > 0 ? 1 + 0.06 * easeOutExpo(clamp(fzAge / 0.2)) * (1 - prog(t, k.release, 0.4)) : 1;
  const warm = second ? clamp((t - k.release) / 0.4) : 0;
  const wait = second ? spr(t, k.text, 1.6) : 0;
  const waitOut = second ? prog(t, k.release + 0.15, 0.35, easeInOutCubic) : 0;
  // question mark
  const q = second ? clamp((t - k.question) / 0.45) : 0;
  const qPop = second ? spr(t, k.question + 0.3, 1.6) : 0;
  const qGrow = second ? prog(t, k.s5 - 0.22, 0.3, easeInCubic) : 0;

  return (
    <AbsoluteFill style={{background: '#EAF3F4', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `scale(${punch})`,
          filter: fz > 0 ? `grayscale(${0.85 * fz}) contrast(${1 + 0.15 * fz}) brightness(${1 - 0.12 * fz})` : warm > 0 ? `sepia(${0.12 * warm}) saturate(${1 + 0.1 * warm})` : undefined,
        }}
      >
        <World c={c} t={frozen ? k.freeze : t} s={s} />
      </AbsoluteFill>

      {/* morning light: warm sun glow from the east + soft sky haze */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${p(95, 80)}% ${p(-5, 0)}%, rgba(255,214,150,0.45), transparent 55%)`, mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(255,240,215,0.18), transparent 35%)'}} />
      {/* warm alarm tint during the accident */}
      {warm > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(255,77,94,${0.22 * warm}) 100%)`}} />}

      {/* freeze overlay: cold flash, ripple, frame lines */}
      {fz > 0 && (
        <AbsoluteFill>
          <AbsoluteFill style={{background: `rgba(180,240,236,${0.5 * Math.exp(-fzAge * 14)})`}} />
          <AbsoluteFill style={{background: 'rgba(16,40,44,0.25)', opacity: fz}} />
          <svg width={W} height={H} style={{position: 'absolute'}}>
            {[0, 1].map((i) => {
              const r = easeOutExpo(clamp((fzAge - i * 0.08) / 0.6)) * Math.hypot(W, H) * 0.6;
              return <circle key={i} cx={W / 2} cy={H / 2} r={r} fill="none" stroke="#BFF7F1" strokeWidth={6 - i * 2} opacity={(1 - clamp((fzAge - i * 0.08) / 0.6)) * fz} />;
            })}
            {/* viewfinder corners */}
            {[
              [60, 60, 1, 1],
              [W - 60, 60, -1, 1],
              [60, H - 60, 1, -1],
              [W - 60, H - 60, -1, -1],
            ].map(([x, y, sx, sy], i) => (
              <path key={i} d={`M ${x} ${y + sy * 70} V ${y} H ${x + sx * 70}`} fill="none" stroke="#E6FFFC" strokeWidth={6} opacity={fz * 0.9} />
            ))}
            {/* pause glyph */}
            <g transform={`translate(${p(W - 150, W - 140)} ${p(H - 150, H - 230)})`} opacity={fz}>
              <rect x={0} y={0} width={18} height={60} rx={5} fill="#E6FFFC" />
              <rect x={34} y={0} width={18} height={60} rx={5} fill="#E6FFFC" />
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* journey timer */}
      {timerIn > 0.001 && t < k.s3 + 0.6 && (
        <div
          style={{
            position: 'absolute',
            left: timerPos.x,
            top: timerPos.y,
            transform: `translate(-50%,-100%) scale(${timerPos.s * Math.min(1.1, timerIn) * (1 - cardsOut)})`,
            transformOrigin: '50% 100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              direction: 'rtl',
              background: 'rgba(14,18,24,0.92)',
              border: `2px solid ${C.yellow}`,
              borderRadius: 999,
              padding: '12px 30px 12px 16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <svg width={84} height={84} viewBox="0 0 84 84">
              <circle cx={42} cy={42} r={34} fill="none" stroke="#2A323D" strokeWidth={9} />
              <circle
                cx={42}
                cy={42}
                r={34}
                fill="none"
                stroke={C.yellow}
                strokeWidth={9}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 * (1 - count)}
                transform="rotate(-90 42 42)"
              />
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

      {/* departure / arrival cards */}
      {(depIn > 0.001 || arrIn > 0.001) && (second ? t < k.s5 + 0.5 : t < k.s3 + 0.6) && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: p(H - 300, H - 420),
            display: 'flex',
            justifyContent: 'center',
            gap: p(380, 60),
            direction: 'rtl',
            opacity: 1 - cardsOut,
            transform: `translateY(${cardsOut * -60}px) scale(${1 - cardsOut * 0.15})`,
          }}
        >
          <div style={{transform: `translateY(${(1 - Math.min(1, depIn)) * 120}px) scale(${0.6 + 0.4 * Math.min(1.08, depIn)})`, opacity: clamp(depIn * 2)}}>
            <TimeCard label="الخروج" minutes={360 + 30 * depRoll} accent={C.orange} size={p(84, 74)} />
          </div>
          <div style={{transform: `translateY(${(1 - Math.min(1, arrIn)) * 120}px) scale(${(0.6 + 0.4 * Math.min(1.08, arrIn)) * arrPop})`, opacity: clamp(arrIn * 2)}}>
            <TimeCard
              label={second && t > k.release ? 'الوصول؟' : 'الوصول'}
              minutes={arrMin}
              accent={arrAccent}
              size={p(84, 74)}
              glow={arrGlow}
              color={arrColor}
              glitch={glitch}
            />
          </div>
        </div>
      )}

      {/* «بس لحظة!» */}
      {wait > 0.001 && waitOut < 1 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              transform: `translateY(${p(-60, -260) - waitOut * p(330, 560)}px) scale(${(2.1 - 1.1 * Math.min(1.06, wait)) * (1 - waitOut * 0.55)}) rotate(${(1 - clamp(wait)) * 6 - 2}deg)`,
              opacity: clamp(wait * 4) * (1 - waitOut),
              fontFamily: F.kufi,
              fontWeight: 900,
              fontSize: p(190, 170),
              color: C.yellow,
              direction: 'rtl',
              whiteSpace: 'nowrap',
              textShadow: '0 0 0 #000, 0 14px 0 #0B0E12, 0 24px 60px rgba(0,0,0,0.7)',
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
          <div style={{transform: `translate(${p(-430, 250)}px, ${p(-40, -120)}px) scale(${1 + qGrow * 26})`, transformOrigin: '50% 55%'}}>
            <svg width={300} height={380} viewBox="0 0 300 380" style={{overflow: 'visible'}}>
              <circle cx={150} cy={170} r={150 + 40 * easeOutCubic(q)} fill={C.yellow} opacity={0.12 * (1 - qGrow)} />
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
              />
              <circle cx={150} cy={330 - (1 - Math.min(1, qPop)) * 80} r={28 * Math.min(1.15, easeOutBack(clamp(qPop)))} fill={C.yellow} />
            </svg>
          </div>
        </AbsoluteFill>
      )}
      {qGrow > 0 && <AbsoluteFill style={{background: C.yellow, opacity: clamp((qGrow - 0.6) / 0.4)}} />}
    </AbsoluteFill>
  );
};
