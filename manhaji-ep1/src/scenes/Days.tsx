import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, easeOutExpo, prog, spr} from '../time';
import {ArrowL, CarIcon, CheckBadge, Clock, HouseIcon, SchoolIcon} from '../components/Kit';
import {Stage} from '../components/Background';
import {MAP_B_START} from './MapScene';

export const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء'];
const WEEK = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

/** one day example: route + departure/arrival; used again (small) in scene 7 */
export const DayCard: React.FC<{
  name: string;
  t: number; // seconds since the card started its run
  w: number;
  h: number;
  vert?: boolean;
  pulseOut?: number;
  pulseIn?: number;
  compact?: boolean;
}> = ({name, t, w, h, vert = false, pulseOut = 0, pulseIn = 0, compact = false}) => {
  const run = prog(t, 0.12, 0.5, easeInOutCubic);
  const check = clamp((t - 0.62) / 0.5);
  const sz = compact ? 0.62 : 1;
  const times = (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 * sz, direction: 'rtl'}}>
      <div style={{textAlign: 'center', transform: `scale(${1 + 0.12 * pulseOut})`}}>
        <div style={{fontFamily: F.kufi, fontWeight: 700, fontSize: 28 * sz, color: C.orange}}>الخروج</div>
        <Clock minutes={390} size={60 * sz} color={pulseOut > 0.05 ? C.orange : C.text} />
      </div>
      <div style={{marginTop: 30 * sz}}>
        <ArrowL w={64 * sz} k={clamp(run * 1.3)} color={C.muted} thick={6 * sz} />
      </div>
      <div style={{textAlign: 'center', transform: `scale(${1 + 0.12 * pulseIn})`}}>
        <div style={{fontFamily: F.kufi, fontWeight: 700, fontSize: 28 * sz, color: C.teal}}>الوصول</div>
        <Clock minutes={390 + 20 * run} size={60 * sz} color={pulseIn > 0.05 ? C.teal : C.text} />
      </div>
    </div>
  );
  const route = (
    <div style={{position: 'relative', height: 80 * sz, width: '100%', direction: 'ltr'}}>
      <div style={{position: 'absolute', left: 0, top: 6 * sz}}>
        <SchoolIcon size={64 * sz} />
      </div>
      <div style={{position: 'absolute', right: 0, top: 6 * sz}}>
        <HouseIcon size={64 * sz} />
      </div>
      <svg style={{position: 'absolute', left: 70 * sz, right: 70 * sz, top: 40 * sz, width: `calc(100% - ${140 * sz}px)`, height: 8}} preserveAspectRatio="none" viewBox="0 0 100 8">
        <line x1={0} y1={4} x2={100} y2={4} stroke="#2E3744" strokeWidth={4} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <line x1={100} y1={4} x2={100 - 100 * run} y2={4} stroke={C.teal} strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', top: 16 * sz, right: `calc(${70 * sz}px + (100% - ${140 * sz + 50 * sz}px) * ${run})`, transform: 'scaleX(-1)'}}>
        <CarIcon size={50 * sz} />
      </div>
    </div>
  );
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 34 * sz,
        background: 'linear-gradient(165deg, #222A35 0%, #161B23 100%)',
        border: `2px solid ${check > 0 ? `rgba(34,211,197,${0.35 + 0.4 * check})` : '#2A323D'}`,
        boxShadow: `0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
        padding: vert ? '26px 40px' : `${34 * sz}px ${30 * sz}px`,
        display: 'flex',
        flexDirection: vert ? 'row-reverse' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: vert ? 34 : 10 * sz,
        position: 'relative',
        direction: 'rtl',
      }}
    >
      <div style={{position: 'absolute', top: -22 * sz, left: -22 * sz}}>
        <CheckBadge k={check} size={68 * sz} />
      </div>
      <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: (vert ? 70 : 66) * sz, color: C.text, lineHeight: 1.3, minWidth: vert ? 250 : undefined, textAlign: 'center'}}>{name}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26 * sz, width: vert ? 520 : '100%'}}>
        {route}
        {times}
      </div>
    </div>
  );
};

export const Days: React.FC<{t: number}> = ({t}) => {
  const {W, H, isV, p} = useLayout();
  const start = cue('s3_start');
  const at = [cue('s3_ahad'), cue('s3_ithnain'), cue('s3_thulatha')];
  const pat = cue('s3_pattern');
  const outT = MAP_B_START() - 0.3;
  const stageIn = prog(t, start + 0.15, 0.5, easeInOutCubic);
  const exit = prog(t, outT, 0.45, easeInOutQuint);

  const cw = p(480, 900);
  const ch = p(430, 380);
  const gap = p(56, 46);
  // landscape: right -> left (reading order); vertical: top -> bottom
  const x0 = (W + 3 * cw + 2 * gap) / 2;
  const slots = [0, 1, 2].map((i) => (isV ? {x: (W - cw) / 2, y: 400 + i * (ch + gap)} : {x: x0 - (i + 1) * cw - i * gap, y: (H - ch) / 2 + 70}));

  // slow camera push + drift toward the newest card
  const push = 1 + 0.035 * prog(t, start, outT - start, (x) => x);
  // the row re-centres itself as each new card arrives
  const shiftK = [1, 2].reduce((acc, i) => acc + prog(t, at[i] - 0.1, 0.6, easeInOutCubic), 0);
  const sx = isV ? 0 : -(1 - shiftK / 2) * 340;
  const sy = isV ? (1 - shiftK / 2) * 260 : 0;

  // the repeating pattern
  const pk = prog(t, pat, 0.5, easeOutExpo);
  const outPulse = (i: number) => Math.max(0, 1 - Math.abs(t - (cue('s3_out') + i * 0.14)) * 4);
  const inPulse = (i: number) => Math.max(0, 1 - Math.abs(t - (cue('s3_in') + i * 0.14)) * 4);

  return (
    <AbsoluteFill style={{opacity: stageIn}}>
      <Stage t={t} />
      {/* title tag */}
      <div
        style={{
          position: 'absolute',
          top: p(110, 170),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: F.kufi,
          fontWeight: 800,
          fontSize: p(44, 50),
          color: C.muted,
          direction: 'rtl',
          opacity: prog(t, start + 0.3, 0.4) * (1 - exit),
          transform: `translateY(${(1 - prog(t, start + 0.3, 0.5, easeOutExpo)) * 30}px)`,
        }}
      >
        تجربة <span style={{color: C.yellow}}>الأيام</span>
      </div>
      {/* the school week; each day lights up when it is spoken */}
      <div style={{position: 'absolute', top: p(190, 255), left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: p(18, 12), direction: 'rtl', opacity: 1 - exit}}>
        {WEEK.map((d, i) => {
          const s = spr(t, start + 0.25 + i * 0.07, 1.6);
          const on = i < 3 ? prog(t, at[i] - 0.05, 0.25, easeOutExpo) : 0;
          return (
            <div
              key={d}
              style={{
                fontFamily: F.kufi,
                fontWeight: 800,
                fontSize: p(36, 36),
                padding: p('4px 30px 12px', '4px 20px 10px'),
                borderRadius: 999,
                color: on > 0.5 ? '#0B0E12' : C.muted,
                background: on > 0 ? `rgba(34,211,197,${on})` : 'rgba(255,255,255,0.05)',
                border: `2px solid ${on > 0 ? C.teal : '#2A323D'}`,
                transform: `translateY(${(1 - Math.min(1, s)) * -40}px) scale(${1 + 0.15 * Math.exp(-Math.max(0, t - at[Math.min(i, 2)]) * 6) * (i < 3 && t > at[i] ? 1 : 0)})`,
                opacity: clamp(s * 3) * (i < 3 ? 1 : 0.6),
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
      <AbsoluteFill style={{transform: `scale(${push}) translate(${sx}px, ${sy}px)`}}>
        {/* connecting timeline through the cards */}
        <svg width={W} height={H} style={{position: 'absolute'}}>
          {[0, 1].map((i) => {
            const a = slots[i];
            const b = slots[i + 1];
            const k = prog(t, at[i + 1] - 0.15, 0.4, easeInOutCubic);
            const x1 = isV ? W / 2 : a.x;
            const y1 = isV ? a.y + ch : a.y + ch / 2;
            const x2 = isV ? W / 2 : b.x + cw;
            const y2 = isV ? b.y : b.y + ch / 2;
            return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * k} y2={y1 + (y2 - y1) * k} stroke={C.teal} strokeWidth={5} strokeDasharray="10 10" opacity={0.7 * (1 - exit)} />;
          })}
        </svg>
        {DAYS.map((name, i) => {
          const s = spr(t, at[i] - 0.08, 1.45);
          if (s <= 0.001) return null;
          const ex = prog(t, outT + i * 0.06, 0.4, easeInOutCubic);
          const fromX = isV ? 0 : -160;
          const fromY = isV ? 160 : 120;
          return (
            <div
              key={name}
              style={{
                position: 'absolute',
                left: slots[i].x,
                top: slots[i].y,
                perspective: 1200,
                opacity: clamp(s * 3) * (1 - ex),
                transform: `translate(${(1 - Math.min(1, s)) * fromX}px, ${(1 - Math.min(1, s)) * fromY - ex * 500}px) scale(${0.7 + 0.3 * Math.min(1.05, s)})`,
                filter: `blur(${Math.max(0, (1 - clamp(s * 1.4)) * 10 + ex * 8)}px)`,
              }}
            >
              <div style={{transform: `rotateX(${(1 - Math.min(1, s)) * 50}deg) rotateY(${(1 - Math.min(1, s)) * -30}deg)`}}>
                <DayCard name={name} t={t - at[i]} w={cw} h={ch} vert={isV} pulseOut={outPulse(i)} pulseIn={inPulse(i)} />
              </div>
            </div>
          );
        })}
        {/* pattern bracket */}
        {pk > 0 && (
          <div
            style={{
              position: 'absolute',
              left: isV ? 0 : slots[2].x,
              width: isV ? W : 3 * cw + 2 * gap,
              top: isV ? slots[2].y + ch + 34 : slots[0].y + ch + 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: pk * (1 - exit),
            }}
          >
            {!isV && (
              <svg width={3 * cw + 2 * gap} height={40} viewBox={`0 0 ${3 * cw + 2 * gap} 40`}>
                <path
                  d={`M 10 4 Q 10 22 40 22 L ${(3 * cw + 2 * gap) / 2 - 30} 22 Q ${(3 * cw + 2 * gap) / 2} 22 ${(3 * cw + 2 * gap) / 2} 38 Q ${(3 * cw + 2 * gap) / 2} 22 ${(3 * cw + 2 * gap) / 2 + 30} 22 L ${3 * cw + 2 * gap - 40} 22 Q ${3 * cw + 2 * gap - 10} 22 ${3 * cw + 2 * gap - 10} 4`}
                  fill="none"
                  stroke={C.yellow}
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 * (1 - pk)}
                />
              </svg>
            )}
            <div style={{display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl', marginTop: 8, transform: `scale(${0.8 + 0.2 * pk})`}}>
              <svg width={48} height={48} viewBox="0 0 48 48" style={{transform: `rotate(${t * 220}deg)`}}>
                <path d="M 40 24 A 16 16 0 1 1 33 10.5" fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" />
                <path d="M 26 8 L 34 10 L 32 18" fill="none" stroke={C.yellow} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 44, color: C.yellow}}>نمط يتكرر</div>
            </div>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
