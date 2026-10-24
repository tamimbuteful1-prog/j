import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutCubic, easeOutExpo, kf, lerp, prog, spr} from '../time';
import {Bell, Button, Hand, P, Waves, Wire, World, shake} from '../components/Props';
import {LogoMark} from '../components/Kit';

const BELL = {x: 540, y: 600, size: 620};
const BTN = {x: 540, y: 1420, size: 380};
const WIRE = 'M 540 930 C 540 1060 730 1080 730 1160 C 730 1230 590 1220 548 1262';

export const Chip: React.FC<{k: number; children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties}> = ({k, children, color = P.ink, bg = '#FFFFFF', size = 46, style}) =>
  k > 0.001 ? (
    <div
      style={{
        fontFamily: F.kufi,
        fontWeight: 800,
        fontSize: size,
        color,
        background: bg,
        padding: `${size * 0.1}px ${size * 0.6}px ${size * 0.24}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        direction: 'rtl',
        boxShadow: '0 18px 40px rgba(60,45,20,0.18)',
        transform: `scale(${Math.min(1.08, k)})`,
        opacity: clamp(k * 3),
        ...style,
      }}
    >
      {children}
    </div>
  ) : null;

const ClockIcon: React.FC<{size: number; color?: string; t?: number}> = ({size, color = P.ink, t = 0}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={42} fill="#FFFFFF" stroke={color} strokeWidth={8} />
    <line x1={50} y1={50} x2={50} y2={24} stroke={color} strokeWidth={8} strokeLinecap="round" transform={`rotate(${t * 360} 50 50)`} />
    <line x1={50} y1={50} x2={68} y2={50} stroke={color} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

export const BellScene: React.FC<{t: number}> = ({t}) => {
  const k = {
    smart: cue('smartBell'),
    ifPress: cue('ifPress'),
    press: cue('press'),
    rings: cue('rings'),
    but: cue('but'),
    prog: cue('programmed'),
    auto: cue('auto'),
    time: cue('time'),
    yani: cue('yani'),
    ifRang: cue('ifRang'),
    sure: cue('sure'),
    btnQ: cue('btnQ'),
    no: cue('no'),
    lesson: cue('lesson'),
    title: cue('title'),
    say: cue('say'),
  };
  const autoRing = k.time + 0.4; // scheduled ring

  // camera --------------------------------------------------------------
  const cx = kf(t, [
    [3.4, BELL.x],
    [k.ifPress - 0.3, 540, easeInOutCubic],
    [k.press, 560],
    [k.rings - 0.2, 540],
    [k.but + 0.4, 540],
    [k.prog + 0.2, BELL.x],
    [autoRing - 0.15, BELL.x],
    [autoRing + 0.5, 540, easeInOutQuint],
  ]);
  const cy = kf(t, [
    [3.4, 620],
    [k.ifPress - 0.3, 930, easeInOutCubic],
    [k.press, 1080, easeInOutCubic],
    [k.rings - 0.25, 820, easeInOutCubic],
    [k.but + 0.2, 820],
    [k.prog + 0.2, 812, easeInOutQuint],
    [autoRing - 0.15, 812],
    [autoRing + 0.5, 930, easeInOutQuint],
  ]);
  const cs = kf(t, [
    [3.4, 1.25],
    [k.ifPress - 0.3, 1.0, easeInOutCubic],
    [k.press, 1.1, easeInOutCubic],
    [k.rings - 0.25, 1.08],
    [k.but + 0.2, 1.08],
    [k.prog + 0.2, 1.95, easeInOutQuint],
    [autoRing - 0.15, 2.02],
    [autoRing + 0.5, 1.0, easeInOutQuint],
    [k.ifRang + 0.6, 0.96],
  ]);
  const sh = shake(t, k.rings, 7) + shake(t, autoRing, 6) + shake(t, k.no, 14, 9);
  const world = {transform: `translate(${540 - cx * cs + sh}px, ${960 - cy * cs}px) scale(${cs})`, transformOrigin: '0 0'};

  // button press + pulse + ring ------------------------------------------
  const handIn = prog(t, k.ifPress - 0.25, 0.45, easeOutCubic) * (1 - prog(t, k.press + 0.35, 0.4, easeInOutCubic));
  const pressK = clamp((t - (k.press - 0.06)) / 0.08) * (1 - clamp((t - (k.press + 0.25)) / 0.12));
  const pulse = prog(t, k.press + 0.04, k.rings - 0.12 - k.press, (x) => x);
  const ringA = clamp((t - (k.rings - 0.12)) / 0.05) * (1 - clamp((t - (k.rings + 0.9)) / 0.4));
  const ringB = clamp((t - autoRing) / 0.05) * (1 - clamp((t - (autoRing + 1.4)) / 0.5));
  const ringQ = clamp((t - (k.ifRang - 0.1)) / 0.1) * (1 - clamp((t - (k.ifRang + 1.1)) / 0.4));
  const ring = Math.max(ringA, ringB, ringQ);
  const led = Math.max(ring, pulse > 0.85 ? 1 : 0, clamp((t - k.smart) / 0.4) * 0.5);

  // bell display: schedule -> countdown
  const sec = Math.floor(clamp((t - (autoRing - 3)) / 3) * 3);
  const showClock = t > k.but;
  const screen = showClock ? (
    <div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: t >= autoRing ? P.yellow : '#7CF4E8', letterSpacing: 1}}>
      {t >= autoRing ? '07:00:00' : `06:59:5${7 + sec}`}
    </div>
  ) : (
    <div style={{fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: '#7CF4E8'}}>READY</div>
  );

  // question + Venn --------------------------------------------------------
  const qArrow = prog(t, k.ifRang + 0.1, 0.9, easeInOutCubic);
  const qMark = spr(t, k.sure - 0.05, 1.5);
  const toVenn = prog(t, k.btnQ + 0.25, 0.6, easeInOutQuint);
  const vBig = spr(t, k.btnQ + 0.3, 1.3);
  const vSmall = spr(t, k.btnQ + 0.5, 1.4);
  const vDot = spr(t, k.no - 0.15, 1.6);
  const no = spr(t, k.no, 1.7);
  const noOut = prog(t, k.lesson - 0.1, 0.35);
  const toTitle = prog(t, k.lesson - 0.05, 0.6, easeInOutQuint);
  const title = spr(t, k.title - 0.05, 1.2);
  const titleOut = prog(t, k.say - 0.35, 0.4, easeInOutCubic);

  const scene1 = 1 - toVenn;
  return (
    <AbsoluteFill>
      <World t={t} cam={{x: cx * cs - 540, y: cy * cs - 960, s: cs}} />
      {scene1 > 0.001 && (
        <AbsoluteFill style={{opacity: scene1, filter: toVenn > 0 ? `blur(${toVenn * 10}px)` : undefined}}>
          <div style={{position: 'absolute', inset: 0, ...world}}>
            <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <Wire d={WIRE} pulse={pulse} draw={prog(t, 3.6, 0.8)} />
              {/* question arrow: bell -> button */}
              {qArrow > 0 && (
                <path
                  d="M 270 880 C 40 1040 40 1320 330 1420"
                  fill="none"
                  stroke={P.orange}
                  strokeWidth={14}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 * (1 - qArrow)}
                />
              )}
            </svg>
            <div style={{position: 'absolute', left: BELL.x - BELL.size / 2, top: BELL.y - BELL.size * 0.575}}>
              <div style={{position: 'absolute', left: BELL.size / 2, top: BELL.size * 0.3}}>
                <Waves t={t} k={ring} r0={220} />
              </div>
              <Bell size={BELL.size} ring={ring} t={t} led={led} screen={screen} />
            </div>
            <div style={{position: 'absolute', left: BTN.x - BTN.size / 2, top: BTN.y - BTN.size / 2}}>
              <Button size={BTN.size} press={pressK} glow={pressK} off={t > k.but && t < k.ifRang ? clamp((t - k.auto) * 2) * 0.8 : 0} />
            </div>
            {handIn > 0.001 && (
              <div style={{position: 'absolute', left: BTN.x - 10 + (1 - handIn) * 520 + pressK * -6, top: BTN.y - 60 + pressK * 10}}>
                <Hand size={460} />
              </div>
            )}
            {/* labels */}
            <div style={{position: 'absolute', left: 800, top: 300}}>
              <Chip k={spr(t, k.smart - 0.05, 1.5) * (1 - prog(t, k.prog - 0.2, 0.3))}>جرس ذكي</Chip>
            </div>
            <div style={{position: 'absolute', left: 60, top: 1390}}>
              <Chip k={spr(t, k.ifPress, 1.5) * (1 - prog(t, k.but - 0.1, 0.3))} bg={P.teal} color="#FFFFFF">
                ضغط الزر
              </Chip>
            </div>
            <div style={{position: 'absolute', left: 70, top: 420}}>
              <Chip k={spr(t, k.rings - 0.05, 1.6) * (1 - prog(t, k.but - 0.1, 0.3))} bg={P.orange} color="#FFFFFF">
                يرن!
              </Chip>
            </div>
            {/* programmed: chips around the bell display */}
            <div style={{position: 'absolute', left: 392, top: 690, transform: 'scale(0.5)', transformOrigin: '0 0'}}>
              <Chip k={spr(t, k.prog - 0.05, 1.5) * (1 - prog(t, autoRing + 0.2, 0.3))} bg={P.ink} color="#FFFFFF">
                مبرمج
              </Chip>
            </div>
            <div style={{position: 'absolute', left: 575, top: 690, transform: 'scale(0.5)', transformOrigin: '0 0'}}>
              <Chip k={spr(t, k.auto - 0.05, 1.5) * (1 - prog(t, autoRing + 0.2, 0.3))} bg={P.yellow}>
                تلقائيًا
              </Chip>
            </div>
            <div style={{position: 'absolute', left: 452, top: 892, transform: 'scale(0.5)', transformOrigin: '0 0'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: clamp((t - k.time) * 4) * (1 - prog(t, autoRing + 0.2, 0.3))}}>
                <ClockIcon size={70} t={t * 0.5} />
                <span style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 46, color: P.ink}}>وقت محدد</span>
              </div>
            </div>
            {/* nobody pressed */}
            <div style={{position: 'absolute', left: 60, top: 1390}}>
              <Chip k={spr(t, autoRing + 0.25, 1.5) * (1 - prog(t, k.ifRang - 0.1, 0.3))} bg="#FFFFFF" color={P.inkSoft}>
                بدون ضغط
              </Chip>
            </div>
            {/* the question */}
            {qMark > 0.001 && (
              <div style={{position: 'absolute', left: 20, top: 1060, transform: `scale(${Math.min(1.12, qMark)}) rotate(${Math.sin(t * 3) * 6}deg)`, opacity: clamp(qMark * 3)}}>
                <div style={{width: 170, height: 170, borderRadius: 85, background: P.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(255,122,47,0.45)'}}>
                  <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 130, color: '#FFFFFF', lineHeight: 1}}>؟</span>
                </div>
              </div>
            )}
          </div>
          {/* spoken question as keywords */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', gap: 18, direction: 'rtl'}}>
            <Chip k={spr(t, k.ifRang, 1.5)} bg={P.orange} color="#FFFFFF" size={54}>
              رن الجرس
            </Chip>
            <Chip k={spr(t, k.sure, 1.5)} bg="#FFFFFF" size={54}>
              أكيد ضُغط الزر؟
            </Chip>
          </div>
        </AbsoluteFill>
      )}

      {/* Venn: «الزر ضُغط» sits inside «الجرس رن», but the bell also rings on its own */}
      {toVenn > 0 && toTitle < 1 && (
        <AbsoluteFill style={{opacity: 1 - toTitle, transform: `scale(${1 - toTitle * 0.4}) translateY(${-toTitle * 300}px)`, filter: toTitle > 0 ? `blur(${toTitle * 12}px)` : undefined}}>
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <circle cx={540} cy={980} r={380 * Math.min(1.05, vBig)} fill="rgba(255,122,47,0.12)" stroke={P.orange} strokeWidth={10} />
            <circle cx={630} cy={1080} r={170 * Math.min(1.06, vSmall)} fill="rgba(20,184,172,0.2)" stroke={P.teal} strokeWidth={10} />
            {vDot > 0 && (
              <g transform={`translate(360 860) scale(${Math.min(1.15, vDot)})`}>
                <circle r={70 + 30 * (no > 0 ? Math.abs(Math.sin(t * 4)) : 0)} fill={P.yellow} opacity={0.35} />
                <circle r={58} fill="#FFFFFF" stroke={P.ink} strokeWidth={8} />
                <line x1={0} y1={0} x2={0} y2={-30} stroke={P.ink} strokeWidth={8} strokeLinecap="round" />
                <line x1={0} y1={0} x2={22} y2={0} stroke={P.ink} strokeWidth={8} strokeLinecap="round" />
              </g>
            )}
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, top: 545, display: 'flex', justifyContent: 'center'}}>
            <Chip k={vBig} bg={P.orange} color="#FFFFFF" size={50}>
              الجرس رن
            </Chip>
          </div>
          <div style={{position: 'absolute', left: 520, top: 1050}}>
            <Chip k={vSmall} bg={P.teal} color="#FFFFFF" size={40}>
              الزر ضُغط
            </Chip>
          </div>
          <div style={{position: 'absolute', left: 230, top: 950}}>
            <Chip k={vDot} bg="#FFFFFF" size={34}>
              رن بدون ضغط
            </Chip>
          </div>
          {no > 0.001 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', opacity: 1 - noOut}}>
              <div
                style={{
                  fontFamily: F.kufi,
                  fontWeight: 900,
                  fontSize: 260,
                  lineHeight: 1.1,
                  color: P.red,
                  transform: `scale(${2.2 - 1.2 * Math.min(1.05, no)}) rotate(-6deg)`,
                  opacity: clamp(no * 4),
                  WebkitTextStroke: '8px #FFFFFF',
                  paintOrder: 'stroke fill',
                  textShadow: '0 20px 50px rgba(229,72,77,0.4)',
                }}
              >
                لا!
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* lesson title */}
      {toTitle > 0 && titleOut < 1 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - titleOut, transform: `scale(${1 + titleOut * 0.25})`, filter: titleOut > 0 ? `blur(${titleOut * 10}px)` : undefined}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, direction: 'rtl'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: prog(t, k.lesson, 0.4), transform: `translateY(${(1 - prog(t, k.lesson, 0.5, easeOutExpo)) * -30}px)`}}>
              <LogoMark size={70} k={clamp((t - k.lesson) * 1.5)} />
              <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 48, color: P.ink}}>منهجي</span>
              <span style={{fontFamily: F.kufi, fontWeight: 700, fontSize: 32, color: P.inkSoft, background: '#FFFFFF', borderRadius: 999, padding: '2px 22px 8px'}}>الحلقة 2</span>
            </div>
            <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 150, lineHeight: 1.25, color: P.ink, textAlign: 'center', transform: `scale(${0.6 + 0.4 * easeOutBack(clamp(title), 1.6)})`, opacity: clamp(title * 3), filter: `blur(${(1 - clamp(title * 1.4)) * 10}px)`}}>
              العبارات
              <br />
              <span style={{color: P.teal}}>الشرطية</span>
            </div>
            <div style={{display: 'flex', gap: 22, alignItems: 'center', direction: 'rtl', opacity: prog(t, k.title + 0.35, 0.4), transform: `translateY(${(1 - prog(t, k.title + 0.35, 0.5, easeOutCubic)) * 30}px)`}}>
              <span style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 56, color: '#FFFFFF', background: P.teal, borderRadius: 24, padding: '0 30px 10px'}}>إذا …</span>
              <svg width={90} height={40} viewBox="0 0 90 40">
                <path d="M 85 20 L 8 20 M 26 4 L 8 20 L 26 36" stroke={P.ink} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 56, color: '#FFFFFF', background: P.orange, borderRadius: 24, padding: '0 30px 10px'}}>فإن …</span>
            </div>
          </div>
        </AbsoluteFill>
      )}
      {/* the bell world also hosts the flip card's back during the hook transition */}
      <AbsoluteFill style={{pointerEvents: 'none', background: `rgba(255,255,255,${0.6 * Math.exp(-Math.max(0, t - k.no) * 10) * (t > k.no ? 1 : 0)})`}} />
    </AbsoluteFill>
  );
};

void easeOutExpo;
void lerp;
