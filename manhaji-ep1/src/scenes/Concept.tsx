import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutExpo, lerp, prog, spr} from '../time';
import {ArrowL, CarIcon, Clock, Draw, HouseIcon, Pill, SchoolIcon} from '../components/Kit';
import {Stage} from '../components/Background';
import {DAYS, DayCard} from './Days';

/** analog clock face; minutes since midnight */
const Analog: React.FC<{minutes: number; size: number; accent: string}> = ({minutes, size, accent}) => {
  const hA = ((minutes / 60) % 12) * 30;
  const mA = (minutes % 60) * 6;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200">
      <circle r={92} fill="#141920" stroke={accent} strokeWidth={8} />
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r0 = i % 3 === 0 ? 66 : 74;
        return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * 82} y2={-Math.cos(a) * 82} stroke={i % 3 === 0 ? C.text : C.muted} strokeWidth={i % 3 === 0 ? 7 : 4} strokeLinecap="round" />;
      })}
      <line x1={0} y1={0} x2={Math.sin((hA * Math.PI) / 180) * 44} y2={-Math.cos((hA * Math.PI) / 180) * 44} stroke={C.text} strokeWidth={11} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin((mA * Math.PI) / 180) * 68} y2={-Math.cos((mA * Math.PI) / 180) * 68} stroke={accent} strokeWidth={7} strokeLinecap="round" />
      <circle r={9} fill={C.text} />
    </svg>
  );
};

const Node: React.FC<{k: number; minutes: number; accent: string; label: string; icon: React.ReactNode; size: number}> = ({k, minutes, accent, label, icon, size}) => {
  const s = Math.min(1.08, k);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `scale(${0.5 + 0.5 * s}) translateY(${(1 - clamp(k)) * 60}px)`, opacity: clamp(k * 3), direction: 'rtl'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        {icon}
        <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 40 * size, color: accent}}>{label}</div>
      </div>
      <Analog minutes={minutes} size={220 * size} accent={accent} />
      <Clock minutes={minutes} size={84 * size} />
    </div>
  );
};

export const Concept: React.FC<{t: number}> = ({t}) => {
  const {W, H, isV, p} = useLayout();
  const k = {
    s6: cue('s6_start'),
    me: cue('s6_tawaqqu'),
    c630: cue('s6_c630'),
    c650: cue('s6_c650'),
    conj: cue('s6_takhmeen'),
    s7: cue('s7_start'),
    days: cue('s7_days'),
    arrows: cue('s7_arrows'),
    conj2: cue('s7_conj'),
    title: cue('s7_title'),
    s8: cue('s8_start'),
  };
  const hdr = prog(t, k.me - 0.05, 0.45, easeOutExpo);
  const n1 = spr(t, k.me + 0.45, 1.4);
  const arrowK = prog(t, k.c650 - 0.45, 0.6, easeInOutCubic);
  const n2 = spr(t, k.c650 + 0.05, 1.4);
  // hands sweep in from 05:30 and land exactly on 06:30 as it is spoken
  const sweep630 = 330 + 60 * prog(t, k.me + 0.45, k.c630 - (k.me + 0.45), (x) => 1 - Math.pow(1 - x, 2.4));
  const set630 = t > k.c630 ? Math.exp(-(t - k.c630) * 6) : 0;
  const sweep650 = 390 + 20 * prog(t, k.c650 - 0.3, 0.55, easeInOutCubic);
  // conjecture card
  const frame = prog(t, k.conj - 0.15, 0.55, easeInOutCubic);
  const tag = spr(t, k.conj, 1.5);
  // scene 7 layout move
  const to7 = prog(t, k.s7 - 0.05, 0.6, easeInOutQuint);
  const conjPulse = t > k.conj2 ? Math.exp(-(t - k.conj2) * 3) : 0;
  const toTitle = prog(t, k.title - 0.15, 0.55, easeInOutQuint);
  const title = spr(t, k.title, 1.3);
  const exit = prog(t, k.s8 - 0.3, 0.45, easeInOutCubic);

  // conjecture card geometry (centre & scale) for scene 6 -> 7 -> title
  const card = {
    x: lerp(W / 2, p(W * 0.27, W / 2), to7),
    y: lerp(p(H / 2 + 40, H / 2), p(H / 2 + 20, 1430), to7),
    s: lerp(1, p(0.62, 0.62), to7),
  };
  const cardW = p(1180, 940);
  const cardH = p(620, 1080);

  // day examples (scene 7)
  const dayW = p(560, 300);
  const dayH = p(232, 330);
  const dayPos = (i: number) =>
    isV ? {x: W / 2 + (1 - i) * (dayW + 30) - dayW / 2, y: 470} : {x: W * 0.66 - dayW / 2 + 40, y: 230 + i * (dayH + 34)};

  const diagram = toTitle;
  const groupS = 1 - diagram * p(0.45, 0.45);
  const groupY = -diagram * p(200, 380);

  return (
    <AbsoluteFill>
      <Stage t={t} accent={C.yellow} />
      <AbsoluteFill style={{opacity: 1 - exit, transform: `scale(${1 + exit * 0.15})`, filter: exit > 0 ? `blur(${exit * 12}px)` : undefined}}>
        <AbsoluteFill style={{transform: `translateY(${groupY}px) scale(${groupS})`}}>
          {/* header «توقعي» */}
          <div style={{position: 'absolute', top: p(110, 260), left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: hdr * (1 - frame), transform: `translateY(${(1 - hdr) * -30 - frame * 40}px) scale(${1 + 0.4 * (1 - hdr)})`}}>
            <Pill size={46} bg="rgba(255,255,255,0.1)" color={C.text}>
              توقّعي
            </Pill>
          </div>

          {/* conjecture card */}
          <div
            style={{
              position: 'absolute',
              left: card.x - cardW / 2,
              top: card.y - cardH / 2,
              width: cardW,
              height: cardH,
              transform: `scale(${card.s * (1 - frame * 0.06) * (1 + conjPulse * 0.05)})`,
            }}
          >
            {/* dashed frame = a statement we believe, not yet proven */}
            <svg width={cardW} height={cardH} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <rect
                x={4}
                y={4}
                width={cardW - 8}
                height={cardH - 8}
                rx={48}
                fill={`rgba(255,200,69,${0.06 * frame + 0.1 * conjPulse})`}
                stroke={C.yellow}
                strokeWidth={6}
                strokeDasharray="26 18"
                strokeDashoffset={-t * 40}
                opacity={frame}
                style={{filter: conjPulse > 0 ? `drop-shadow(0 0 ${40 * conjPulse}px ${C.yellow})` : undefined}}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: isV ? 'column' : 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: p(30, 20),
                direction: 'ltr',
              }}
            >
              <Node k={n1} minutes={sweep630} accent={C.orange} label="الخروج" icon={<HouseIcon size={46} />} size={1 + 0.08 * set630} />
              <div style={{position: 'relative', width: p(300, 60), height: p(80, 200), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {isV ? (
                  <svg width={60} height={200} viewBox="0 0 60 200">
                    <Draw d="M 30 10 L 30 180" k={arrowK} color={C.text} w={8} len={100} />
                    <Draw d="M 10 160 L 30 185 L 50 160" k={clamp((arrowK - 0.8) * 5)} color={C.text} w={8} len={100} />
                  </svg>
                ) : (
                  <>
                    <ArrowL w={300} k={arrowK} color={C.text} thick={8} />
                    <div style={{position: 'absolute', top: -46, right: 20 + 220 * arrowK, opacity: arrowK > 0 && arrowK < 1 ? 1 : 0, transform: 'scaleX(-1)'}}>
                      <CarIcon size={56} />
                    </div>
                  </>
                )}
              </div>
              <Node k={n2} minutes={sweep650} accent={C.teal} label="الوصول" icon={<SchoolIcon size={46} />} size={1} />
            </div>
            {/* «تخمين» tab */}
            {tag > 0.001 && (
              <div
                style={{
                  position: 'absolute',
                  top: -70,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  transform: `scale(${(2 - Math.min(1.06, tag)) * (1 + conjPulse * 0.1)})`,
                  opacity: clamp(tag * 4),
                }}
              >
                <div
                  style={{
                    fontFamily: F.kufi,
                    fontWeight: 900,
                    fontSize: 92,
                    color: '#0B0E12',
                    background: C.yellow,
                    padding: '0 56px 14px',
                    borderRadius: 34,
                    boxShadow: '0 20px 60px rgba(255,200,69,0.35)',
                    direction: 'rtl',
                  }}
                >
                  تخمين
                </div>
              </div>
            )}
          </div>

          {/* scene 7: specific examples -> conjecture */}
          {to7 > 0 && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: isV ? 0 : dayPos(0).x,
                  width: isV ? W : dayW,
                  top: isV ? 370 : 140,
                  textAlign: 'center',
                  fontFamily: F.kufi,
                  fontWeight: 800,
                  fontSize: 48,
                  color: C.teal,
                  direction: 'rtl',
                  opacity: prog(t, k.days - 0.1, 0.4),
                  transform: `translateY(${(1 - prog(t, k.days - 0.1, 0.5, easeOutExpo)) * 20}px)`,
                }}
              >
                أمثلة محددة
              </div>
              <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
                <defs>
                  <marker id="ah" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 z" fill={C.teal} />
                  </marker>
                </defs>
                {DAYS.map((_, i) => {
                  const a = dayPos(i);
                  const ak = prog(t, k.arrows + i * 0.15, 0.55, easeInOutCubic);
                  const sx = isV ? a.x + dayW / 2 : a.x - 12;
                  const sy = isV ? a.y + dayH + 12 : a.y + dayH / 2;
                  const ex = isV ? card.x + (1 - i) * 160 : card.x + (cardW * card.s) / 2 + 20;
                  const ey = isV ? card.y - (cardH * card.s) / 2 - 90 : card.y + (i - 1) * 110;
                  const mx = (sx + ex) / 2;
                  const my = (sy + ey) / 2;
                  const P = isV
                    ? [sx, sy, sx, my, ex, my, ex, ey]
                    : [sx, sy, mx, sy, mx, ey, ex, ey];
                  const d = `M ${P[0]} ${P[1]} C ${P[2]} ${P[3]} ${P[4]} ${P[5]} ${P[6]} ${P[7]}`;
                  const bez = (u: number) => {
                    const v = 1 - u;
                    return {
                      x: v * v * v * P[0] + 3 * v * v * u * P[2] + 3 * v * u * u * P[4] + u * u * u * P[6],
                      y: v * v * v * P[1] + 3 * v * v * u * P[3] + 3 * v * u * u * P[5] + u * u * u * P[7],
                    };
                  };
                  return (
                    <g key={i}>
                      <path d={d} fill="none" stroke={C.teal} strokeWidth={20} opacity={0.15 * ak} />
                      <path d={d} fill="none" stroke={C.teal} strokeWidth={7} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - ak)} markerEnd={ak > 0.95 ? 'url(#ah)' : undefined} />
                      {/* particles travelling to the conjecture */}
                      {ak >= 1 &&
                        [0, 1, 2].map((j) => {
                          const u = (t * 1.1 + j / 3 + i * 0.17) % 1;
                          const q = bez(u);
                          return <circle key={j} cx={q.x} cy={q.y} r={7} fill={C.yellow} opacity={Math.sin(u * Math.PI)} />;
                        })}
                    </g>
                  );
                })}
              </svg>
              {DAYS.map((name, i) => {
                const s = spr(t, k.days + i * 0.14, 1.5);
                const a = dayPos(i);
                return (
                  <div
                    key={name}
                    style={{
                      position: 'absolute',
                      left: a.x,
                      top: a.y,
                      transform: `translateX(${(1 - Math.min(1, s)) * p(300, 0)}px) translateY(${(1 - Math.min(1, s)) * p(0, -200)}px) scale(${0.6 + 0.4 * Math.min(1.05, s)})`,
                      opacity: clamp(s * 3),
                    }}
                  >
                    <MiniDay name={name} w={dayW} h={dayH} vert={isV} t={t - k.days - i * 0.14} />
                  </div>
                );
              })}
            </>
          )}
        </AbsoluteFill>

        {/* title + geometry */}
        {title > 0.001 && <InductiveTitle t={t - k.title} k={title} W={W} H={H} isV={isV} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const MiniDay: React.FC<{name: string; w: number; h: number; vert: boolean; t: number}> = ({name, w, h, vert, t}) =>
  vert ? (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 30,
        background: 'linear-gradient(165deg, #222A35 0%, #161B23 100%)',
        border: `2px solid rgba(34,211,197,0.6)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        direction: 'rtl',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 52, color: C.text}}>{name}</div>
      <Clock minutes={390} size={40} color={C.orange} />
      <Clock minutes={410} size={40} color={C.teal} />
      <svg width={56} height={56} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={29} fill={C.teal} />
        <Draw d="M18 33 L28 43 L47 22" k={clamp(t * 2.5)} color="#0B0E12" w={7} len={100} />
      </svg>
    </div>
  ) : (
    <DayCard name={name} t={t + 1.2} w={w} h={h} compact />
  );

const InductiveTitle: React.FC<{t: number; k: number; W: number; H: number; isV: boolean}> = ({t, k, W, H, isV}) => {
  const g = (d: number, dur = 0.7) => prog(t, d, dur, easeInOutCubic);
  const cy = isV ? 1460 : 870;
  return (
    <AbsoluteFill>
      {/* geometric construction lines (compass arcs, triangle, ticks) */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${W / 2} ${cy})`} opacity={0.9}>
          <Draw d="M -620 0 L 620 0" k={g(0, 0.5)} color="rgba(255,255,255,0.25)" w={3} len={100} />
          <Draw d={`M ${-480} 90 A 480 480 0 0 1 480 90`} k={g(0.1, 0.8)} color={C.teal} w={4} len={100} opacity={0.55} />
          <Draw d="M -360 110 L 0 -180 L 360 110 Z" k={g(0.2, 0.8)} color={C.yellow} w={4} len={100} opacity={0.5} />
          <Draw d={`M -170 110 A 170 170 0 0 1 170 110`} k={g(0.3, 0.7)} color={C.orange} w={4} len={100} opacity={0.55} />
          {Array.from({length: 13}).map((_, i) => (
            <line key={i} x1={-600 + i * 100} y1={-12} x2={-600 + i * 100} y2={12} stroke="rgba(255,255,255,0.35)" strokeWidth={3} opacity={g(0.05 + i * 0.03, 0.2)} />
          ))}
          <circle cx={0} cy={-180} r={10 * g(0.9, 0.3)} fill={C.yellow} />
          <circle cx={-360} cy={110} r={8 * g(0.95, 0.3)} fill={C.teal} />
          <circle cx={360} cy={110} r={8 * g(1.0, 0.3)} fill={C.teal} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy - (isV ? 170 : 120),
          display: 'flex',
          justifyContent: 'center',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            fontFamily: F.kufi,
            fontWeight: 900,
            fontSize: isV ? 120 : 136,
            lineHeight: 1.35,
            color: C.text,
            textAlign: 'center',
            transform: `scale(${0.55 + 0.45 * Math.min(1.04, easeOutBack(clamp(k), 1.4))})`,
            opacity: clamp(k * 3),
            filter: `blur(${(1 - clamp(k * 1.5)) * 10}px)`,
            textShadow: '0 12px 50px rgba(0,0,0,0.7)',
            whiteSpace: isV ? 'normal' : 'nowrap',
            width: isV ? 900 : undefined,
          }}
        >
          التبرير <span style={{color: C.teal}}>الاستقرائي</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
