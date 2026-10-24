import React from 'react';
import {AbsoluteFill, random, staticFile} from 'remotion';
import {C, FONT_BODY, FONT_HEAD, H, W} from '../theme';
import {CUES as Q, HOOK, OUTRO, SEGMENTS} from '../timeline';
import {BigWord, Chip} from '../components/kit';
import {E, clamp, p, pop} from '../lib/anim';

/** Light-speed streaks + circuit rings + flash: the camera passes through his head into the board. */
export const DiveFX: React.FC<{t: number}> = ({t}) => {
  if (t < 8.3 || t > 9.4) return null;
  const k = clamp((t - 8.3) / 0.65);
  const flash = Math.max(0, 1 - Math.abs(t - HOOK.flash) / (t < HOOK.flash ? 0.22 : 0.42));
  const cy = 760;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 64}).map((_, i) => {
          const a = (i / 64) * Math.PI * 2 + random(`sa${i}`) * 0.08;
          const sp = 0.6 + random(`sp${i}`) * 0.8;
          const r0 = 40 + Math.pow(k, 2.2) * 1400 * sp;
          const r1 = r0 + 40 + Math.pow(k, 1.6) * 520 * sp;
          const o = clamp(k * 3) * (1 - clamp((t - 9.0) / 0.35));
          return (
            <line key={i} x1={W / 2 + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={W / 2 + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={i % 3 ? C.cyan : C.warm} strokeWidth={2 + random(`sw${i}`) * 4} strokeLinecap="round" opacity={o * (0.4 + random(`so${i}`) * 0.6)} />
          );
        })}
        {[0, 1, 2, 3].map((i) => {
          const q = clamp((t - 8.35 - i * 0.09) / 0.55);
          if (q <= 0 || q >= 1) return null;
          const s = Math.pow(q, 2.4) * 2600 + 30;
          return <rect key={i} x={W / 2 - s / 2} y={cy - s / 2} width={s} height={s} rx={s * 0.18} fill="none" stroke={C.cyan} strokeWidth={3 + 10 * q} strokeDasharray={`${s * 0.4} ${s * 0.12}`} opacity={(1 - q) * 0.9} />;
        })}
      </svg>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% ${cy}px, #FFFFFF 0%, ${C.cyan} 35%, rgba(34,211,238,0.0) 85%)`, opacity: flash}} />
    </AbsoluteFill>
  );
};

/** Small, accurate subtitles (hook + narration). Split long lines into readable chunks. */
const HOOK_CAPS = [
  {start: 0.6, end: 2.4, text: 'السلام عليكم ورحمة الله'},
];

const chunked = (() => {
  const out: {start: number; end: number; text: string}[] = [...HOOK_CAPS];
  for (const s of SEGMENTS) {
    const parts = s.text
      .split(/(?<=[،…؟.:])\s+/)
      .flatMap((x) => (x.length > 34 ? splitWords(x, 30) : [x]))
      .filter(Boolean);
    const total = parts.reduce((a, b) => a + b.length, 0);
    let c = s.start;
    for (const part of parts) {
      const d = ((s.end - s.start) * part.length) / total;
      out.push({start: c, end: c + d, text: part});
      c += d;
    }
  }
  return out;
})();

function splitWords(x: string, max: number) {
  const words = x.split(' ');
  const res: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      res.push(cur.trim());
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) res.push(cur);
  return res;
}

export const Captions: React.FC<{t: number}> = ({t}) => {
  const c = chunked.find((x) => t >= x.start - 0.05 && t < x.end + 0.12);
  if (!c || t > OUTRO.pullBack + 0.2) return null;
  const k = p(t, c.start - 0.05, 0.15);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1515, display: 'flex', justifyContent: 'center'}}>
      <div
        dir="rtl"
        style={{
          maxWidth: 860,
          padding: '10px 28px',
          borderRadius: 18,
          background: 'rgba(2, 8, 16, 0.62)',
          color: C.warm,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: 40,
          lineHeight: 1.45,
          textAlign: 'center',
          opacity: k,
          transform: `translateY(${(1 - k) * 8}px)`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        {c.text}
      </div>
    </div>
  );
};

/** End card: where to find the full lesson + Manhaji identity */
export const Outro: React.FC<{t: number}> = ({t}) => {
  if (t < OUTRO.pullBack + 0.8) return null;
  const panel = p(t, OUTRO.pullBack + 1.0, 0.6) * (1 - p(t, OUTRO.logo - 0.1, 0.4));
  const logo = p(t, OUTRO.logo, 0.9, E.expo);
  const ring = clamp((t - OUTRO.logo) / 1.2);
  const under = p(t, OUTRO.logo + 0.35, 0.9, E.inOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(2,8,16,0.92) 0%, rgba(2,8,16,0.6) 55%, rgba(2,8,16,0.2) 85%)', opacity: panel}} />
      <div style={{opacity: panel}}>
        <Chip x={540} y={700} text="باقي التفاصيل في" color={C.sky} size={40} weight={700} o={p(t, Q.wDetails + 0.2, 0.4)} />
        <BigWord x={540} y={850} text="درس المنطق" size={124} o={p(t, Q.wLesson, 0.35)} s={0.85 + 0.15 * pop(t, Q.wLesson, 0.5)} />
        <Chip x={540} y={1010} text="مادة الرياضيات" color={C.turq} size={50} o={p(t, Q.wSubject, 0.3)} s={0.8 + 0.2 * pop(t, Q.wSubject)} glow={0.4} />
        <Chip x={540} y={1130} text="الصف الأول ثانوي" color={C.cyan} size={50} o={p(t, Q.wGrade, 0.3)} s={0.8 + 0.2 * pop(t, Q.wGrade)} glow={0.4} />
      </div>
      {logo > 0 ? (
        <AbsoluteFill style={{background: `rgba(2,6,12,${0.75 * logo})`}}>
          <div style={{position: 'absolute', left: 540 - 330, top: 900 - 330, width: 660, height: 660, borderRadius: '50%', background: `radial-gradient(circle, ${C.cyan}44, transparent 65%)`, opacity: logo}} />
          {ring > 0 && ring < 1 ? <div style={{position: 'absolute', left: 540 - 120 - 380 * ring, top: 900 - 120 - 380 * ring, width: (120 + 380 * ring) * 2, height: (120 + 380 * ring) * 2, borderRadius: '50%', border: `${3 + 6 * (1 - ring)}px solid ${C.cyan}`, opacity: 1 - ring}} /> : null}
          <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 900 - 130, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 210, lineHeight: 1.2, color: C.warm, opacity: logo, transform: `scale(${0.82 + 0.18 * logo})`, letterSpacing: 2, textShadow: `0 0 50px ${C.cyan}88, 0 12px 0 rgba(4,30,52,0.9), 0 24px 40px rgba(0,0,0,0.6)`}}>
            منهجي
          </div>
          <svg width={W} height={200} style={{position: 'absolute', left: 0, top: 1060}}>
            <path d="M 240 60 H 470 L 510 100 H 840" fill="none" stroke={C.cyan} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - under} />
            <circle cx={840} cy={100} r={14} fill={C.cyan} opacity={under > 0.98 ? 1 : 0} />
            <circle cx={240} cy={60} r={14} fill="none" stroke={C.cyan} strokeWidth={6} opacity={under} />
          </svg>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/** Film finish: vignette + animated grain */
export const Finish: React.FC<{t: number; frame: number}> = ({frame}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
    <div
      style={{
        position: 'absolute',
        inset: -200,
        backgroundImage: `url(${staticFile('grain.png')})`,
        backgroundSize: '512px 512px',
        backgroundPosition: `${Math.floor(random(`gx${frame}`) * 512)}px ${Math.floor(random(`gy${frame}`) * 512)}px`,
        opacity: 0.06,
        mixBlendMode: 'overlay',
      }}
    />
  </AbsoluteFill>
);

