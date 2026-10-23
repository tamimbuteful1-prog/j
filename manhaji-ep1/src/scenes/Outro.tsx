import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, cue, easeInCubic, easeInOutCubic, easeOutExpo, prog, rand, spr, TOTAL} from '../time';
import {LogoMark} from '../components/Kit';
import {Stage} from '../components/Background';

const GLYPHS = ['tri', 'circ', 'sq', 'plus', 'times', 'eq', 'tri', 'circ', 'sq', 'plus', 'pi', 'sqrt', 'tri', 'circ'];

const Glyph: React.FC<{kind: string; s: number; color: string}> = ({kind, s, color}) => {
  const st = {fill: 'none', stroke: color, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={s} height={s} viewBox="-30 -30 60 60" style={{overflow: 'visible'}}>
      {kind === 'tri' && <polygon points="0,-24 24,20 -24,20" {...st} />}
      {kind === 'circ' && <circle r={22} {...st} />}
      {kind === 'sq' && <rect x={-20} y={-20} width={40} height={40} rx={4} {...st} />}
      {kind === 'plus' && <path d="M0 -20 V20 M-20 0 H20" {...st} />}
      {kind === 'times' && <path d="M-16 -16 L16 16 M16 -16 L-16 16" {...st} />}
      {kind === 'eq' && <path d="M-20 -8 H20 M-20 8 H20" {...st} />}
      {kind === 'pi' && <path d="M-22 -14 H22 M-10 -14 V20 M10 -14 Q8 10 18 20" {...st} />}
      {kind === 'sqrt' && <path d="M-24 4 L-14 0 L-4 20 L8 -20 H26" {...st} />}
    </svg>
  );
};

export const Outro: React.FC<{t: number}> = ({t}) => {
  const {W, H, isV, p} = useLayout();
  const k = {
    start: cue('s8_start'),
    logo: cue('s8_logo'),
    title: cue('s8_title'),
    title2: cue('s8_title2'),
    subj: cue('s8_subject'),
    grade: cue('s8_grade'),
  };
  const fadeIn = prog(t, k.start - 0.3, 0.35);
  const lk = clamp((t - k.logo) / 0.7);
  const word = prog(t, k.logo + 0.12, 0.5, easeOutExpo);
  const ring = t > k.logo ? clamp((t - k.logo) / 0.8) : 0;
  const t1 = spr(t, k.title, 1.4);
  const t2 = spr(t, k.title2, 1.4);
  const s1 = spr(t, k.subj, 1.6);
  const s2 = spr(t, k.grade, 1.6);
  const sheen = prog(t, k.grade + 0.6, 0.8, easeInOutCubic);
  const end = prog(t, TOTAL - 0.45, 0.45, easeInCubic);
  const logoY = p(H / 2 - 190, H / 2 - 330);
  const settle = prog(t, k.title - 0.1, 0.6, easeInOutCubic);

  return (
    <AbsoluteFill style={{opacity: fadeIn}}>
      <Stage t={t} accent={C.teal} />
      {/* math glyphs converge and become the logo */}
      {GLYPHS.map((g, i) => {
        const a = rand(i * 9 + 2) * Math.PI * 2;
        const r = 700 + rand(i * 4) * 500;
        const st = k.start - 0.25 + rand(i) * 0.12;
        const u = prog(t, st, k.logo - st, (x) => x * x * (3 - 2 * x));
        const x = W / 2 + Math.cos(a) * r * (1 - u);
        const y = logoY + Math.sin(a) * r * 0.7 * (1 - u);
        const sc = (1 - easeInCubic(u)) * (0.9 + rand(i * 3) * 0.8);
        if (u >= 1 || t < st) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${(1 - u) * 400 * (i % 2 ? 1 : -1)}deg) scale(${sc})`}}>
            <Glyph kind={g} s={70} color={[C.teal, C.yellow, C.orange, C.text][i % 4]} />
          </div>
        );
      })}

      <AbsoluteFill style={{opacity: 1 - end}}>
        {/* logo lockup */}
        <div style={{position: 'absolute', left: 0, right: 0, top: logoY - 90 - settle * p(30, 20), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, direction: 'rtl'}}>
          <div style={{position: 'relative'}}>
            <svg width={300} height={300} viewBox="-150 -150 300 300" style={{position: 'absolute', left: -60, top: -60}}>
              <circle r={70 + ring * 90} fill="none" stroke={C.teal} strokeWidth={8 * (1 - ring)} opacity={1 - ring} />
            </svg>
            <LogoMark size={180} k={lk} />
          </div>
          <div style={{overflow: 'hidden', clipPath: `inset(0 0 0 ${(1 - word) * 100}%)`}}>
            <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 150, color: C.text, lineHeight: 1.3, position: 'relative', transform: `translateX(${(1 - word) * 80}px)`}}>
              منهجي
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(105deg, transparent ${sheen * 140 - 40}%, rgba(255,255,255,0.55) ${sheen * 140 - 25}%, transparent ${sheen * 140 - 10}%)`,
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  opacity: sheen > 0 && sheen < 1 ? 1 : 0,
                }}
              >
                منهجي
              </div>
            </div>
          </div>
        </div>

        {/* lesson title */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: logoY + p(170, 210),
            display: 'flex',
            flexDirection: isV ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: p(26, 0),
            direction: 'rtl',
            fontFamily: F.kufi,
            fontWeight: 900,
            fontSize: p(86, 92),
            lineHeight: 1.4,
          }}
        >
          <div style={{color: C.text, opacity: clamp(t1 * 3), transform: `translateY(${(1 - Math.min(1, t1)) * 60}px)`, filter: `blur(${(1 - clamp(t1 * 1.4)) * 10}px)`}}>
            التبرير الاستقرائي
          </div>
          <div style={{color: C.yellow, opacity: clamp(t2 * 3), transform: `translateY(${(1 - Math.min(1, t2)) * 60}px)`, filter: `blur(${(1 - clamp(t2 * 1.4)) * 10}px)`}}>
            والتخمين
          </div>
        </div>

        {/* subject | grade */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: logoY + p(330, 560),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 26,
            direction: 'rtl',
            fontFamily: F.kufi,
            fontWeight: 800,
            fontSize: p(54, 60),
          }}
        >
          <div style={{color: '#0B0E12', background: C.teal, padding: '2px 40px 12px', borderRadius: 999, transform: `scale(${Math.min(1.08, s1)})`, opacity: clamp(s1 * 3)}}>رياضيات</div>
          <div style={{width: 5, height: 64, borderRadius: 3, background: C.muted, transform: `scaleY(${clamp(s2)})`}} />
          <div style={{color: C.text, border: `3px solid ${C.text}`, padding: '0 40px 10px', borderRadius: 999, transform: `scale(${Math.min(1.08, s2)})`, opacity: clamp(s2 * 3)}}>أول ثانوي</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: end}} />
    </AbsoluteFill>
  );
};
