import React from 'react';
import {CUES as Q} from '../timeline';
import {C, FONT_HEAD} from '../theme';
import {Battery, Chip, Glow, Lamp, PowerSource, Wire} from '../components/kit';
import {E, clamp, p, pop} from '../lib/anim';

// Scene 1 — "I was filming and suddenly the power went out… every lamp died except one,
// because it runs on electricity OR the backup battery."

const LAMPS_X = [200, 420, 640, 860];
const RAIL_Y = 430;
const CORD = 200;
const SURVIVOR = 2;

/** dying-bulb flicker that ends at 0 */
const flickerOff = (t: number, t0: number) => {
  if (t < t0) return 1;
  const pattern = [0.15, 0.9, 0.05, 0.7, 0.0, 0.45, 0.0, 0.0];
  const i = Math.floor((t - t0) / 0.055);
  return i < pattern.length ? pattern[i] : 0;
};
const flickerOn = (t: number, t0: number) => {
  if (t < t0) return 0;
  const pattern = [0.5, 0.0, 0.8, 0.2, 1, 0.7, 1];
  const i = Math.floor((t - t0) / 0.05);
  return i < pattern.length ? pattern[i] : 1;
};

export const S1Blackout: React.FC<{t: number}> = ({t}) => {
  const cut = Q.wCut + 0.04;
  const gridAlive = t < cut ? 1 : 0;
  const survivorOn = Math.max(t < Q.wExceptOne ? flickerOff(t, cut) : 0, flickerOn(t, Q.wExceptOne));
  const ambient = t < cut ? 1 : 0.18 + 0.25 * clamp(survivorOn);
  const battLive = flickerOn(t, Q.wExceptOne);

  const revealSources = p(t, Q.wRuns - 0.2, 0.8, E.out);
  const sparkK = clamp((t - cut) / 0.45);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* room light */}
      <Glow x={540} y={770} r={760} color="#1E6FA0" o={0.55 * ambient} />
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 1310,
          width: 960,
          height: 240,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,205,140,${0.16 * ambient}), transparent 70%)`,
        }}
      />

      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* grid feed: from the wall source up into the ceiling rail that powers every lamp */}
        <Wire d={`M 150 1130 V ${RAIL_Y} H 930`} t={t} live={gridAlive} color={C.sky} width={9} />
        {/* backup battery feeds only the third lamp */}
        <Wire d={`M 800 1140 V 560 H ${LAMPS_X[SURVIVOR] + 4}`} t={t} live={battLive} color={C.turq} width={8} draw={1} dim={0.8} />
        {/* rail caps */}
        <rect x={140} y={RAIL_Y - 12} width={800} height={24} rx={12} fill="#10243A" stroke={gridAlive ? C.sky : '#24425F'} strokeWidth={2} opacity={0.9} />
        {/* blackout sparks at the wall source */}
        {t > cut && sparkK < 1
          ? Array.from({length: 12}).map((_, i) => {
              const a = (i / 12) * Math.PI * 2 + i;
              const r0 = 30 + sparkK * 60;
              const r1 = r0 + 40 * (1 - sparkK);
              return (
                <line
                  key={i}
                  x1={150 + Math.cos(a) * r0}
                  y1={1210 + Math.sin(a) * r0}
                  x2={150 + Math.cos(a) * r1}
                  y2={1210 + Math.sin(a) * r1}
                  stroke={i % 2 ? C.warm : C.sky}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={1 - sparkK}
                />
              );
            })
          : null}
      </svg>

      {LAMPS_X.map((x, i) => (
        <Lamp key={i} id={`s1-${i}`} x={x} y={RAIL_Y + CORD} cord={CORD} on={i === SURVIVOR ? survivorOn : flickerOff(t, cut + i * 0.03)} />
      ))}

      <PowerSource x={150} y={1210} alive={gridAlive} dead={p(t, Q.wElec1, 0.4, E.back)} />
      <Battery x={800} y={1220} level={0.75} active={Math.max(0.15, battLive)} />

      {/* REC indicator — "I was filming" */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 200,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 34,
          color: C.warm,
          opacity: 0.85,
          letterSpacing: 2,
        }}
      >
        <div style={{width: 22, height: 22, borderRadius: 11, background: C.coral, opacity: Math.floor(t * 1.6) % 2 ? 1 : 0.25, boxShadow: `0 0 18px ${C.coral}`}} />
        REC
        <span style={{fontWeight: 600, opacity: 0.7}}>{String(Math.floor((t - 2) / 60)).padStart(2, '0')}:{String(Math.floor(t - 2) % 60).padStart(2, '0')}</span>
      </div>

      {/* the key structure: electricity OR backup battery */}
      <Chip x={170} y={1360} text="الكهرباء" color={t > cut ? C.dim : C.sky} size={40} o={revealSources} s={0.8 + 0.2 * pop(t, Q.wElec1 - 0.1)} glow={p(t, Q.wElec1, 0.3) * (1 - p(t, Q.wElec1 + 0.6, 0.6))} />
      <Chip x={790} y={1390} text="البطارية الاحتياطية" color={C.turq} size={40} o={p(t, Q.wBatt1 - 0.1, 0.3)} s={0.8 + 0.2 * pop(t, Q.wBatt1 - 0.1)} glow={0.6} />
      <Chip x={470} y={1375} text="أو" color={C.cyan} size={78} pad={[6, 40]} o={p(t, Q.wOr1 - 0.05, 0.2)} s={0.4 + 0.6 * pop(t, Q.wOr1 - 0.05, 0.5)} glow={1} />
    </div>
  );
};
