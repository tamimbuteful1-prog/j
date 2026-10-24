import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../theme';
import {clamp, cue, easeInCubic, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutCubic, prog, spr, TOTAL} from '../time';
import {Bell, P, World} from '../components/Props';
import {Draw, LogoMark} from '../components/Kit';
import {Formula} from './LogicScene';

const CELLS = [
  {name: 'الشرطية', a: 'p', b: 'q', col: P.ink, x: 1, y: 0},
  {name: 'العكس', a: 'q', b: 'p', col: P.orange, x: 0, y: 0},
  {name: 'المعكوس', a: '~p', b: '~q', col: P.red, x: 1, y: 1},
  {name: 'المعاكس الإيجابي', a: '~q', b: '~p', col: P.tealDeep, x: 0, y: 1},
];
const CW = 440;
const CH = 300;
const GX = 70;
const GY = 120;

export const Summary: React.FC<{t: number}> = ({t}) => {
  const k = {s: cue('summary'), end: cue('lessonEnd'), subj: cue('subject'), grade: cue('grade'), salam: cue('salam')};
  const enter = prog(t, k.s - 0.15, 0.4);
  const toTitle = prog(t, k.end - 0.15, 0.7, easeInOutQuint);
  const toLogo = prog(t, k.salam - 0.2, 0.6, easeInOutQuint);
  const fin = prog(t, TOTAL - 0.4, 0.4, easeInCubic);
  const gridTop = 560 - toTitle * 230;
  const gridS = 1 - toTitle * 0.3;
  const x0 = 540 - CW - GX / 2;
  const cellPos = (c: (typeof CELLS)[number]) => ({x: x0 + c.x * (CW + GX), y: c.y * (CH + GY)});
  const arrows = prog(t, k.s + 1.0, 0.7, easeInOutCubic);
  const title = spr(t, k.end, 1.3);
  const subj = spr(t, k.subj, 1.6);
  const grade = spr(t, k.grade, 1.6);
  const logo = spr(t, k.salam, 1.2);

  return (
    <AbsoluteFill style={{opacity: enter}}>
      <World t={t} cam={{x: 0, y: -toTitle * 200, s: 1 + toTitle * 0.1}} />
      <AbsoluteFill style={{opacity: 1 - toLogo, transform: `scale(${1 - toLogo * 0.2})`, filter: toLogo > 0 ? `blur(${toLogo * 12}px)` : undefined}}>
        <div style={{position: 'absolute', left: 0, top: gridTop, width: 1080, height: 2 * CH + GY, transform: `scale(${gridS})`, transformOrigin: '50% 0'}}>
          <svg width={1080} height={2 * CH + GY} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            {/* swap: horizontal */}
            <Draw d={`M ${x0 + CW + 10} ${CH / 2} L ${x0 + CW + GX - 10} ${CH / 2}`} k={arrows} color={P.orange} w={10} len={100} />
            <Draw d={`M ${x0 + CW + 10} ${CH + GY + CH / 2} L ${x0 + CW + GX - 10} ${CH + GY + CH / 2}`} k={arrows} color={P.orange} w={10} len={100} />
            {/* negate: vertical */}
            <Draw d={`M ${x0 + CW + GX + CW / 2} ${CH + 10} L ${x0 + CW + GX + CW / 2} ${CH + GY - 10}`} k={arrows} color={P.red} w={10} len={100} />
            <Draw d={`M ${x0 + CW / 2} ${CH + 10} L ${x0 + CW / 2} ${CH + GY - 10}`} k={arrows} color={P.red} w={10} len={100} />
          </svg>
          {/* arrow captions */}
          <div style={{position: 'absolute', left: 540 - 60, top: CH / 2 - 92, width: 120, textAlign: 'center', fontFamily: F.kufi, fontWeight: 800, fontSize: 30, color: P.orange, opacity: arrows}}>تبديل</div>
          <div style={{position: 'absolute', left: x0 + CW + GX + CW / 2 + 20, top: CH + GY / 2 - 26, fontFamily: F.kufi, fontWeight: 800, fontSize: 30, color: P.red, opacity: arrows}}>نفي</div>
          {CELLS.map((c, i) => {
            const s = spr(t, k.s + 0.25 + i * 0.18, 1.5);
            const p = cellPos(c);
            return (
              <div
                key={c.name}
                style={{
                  position: 'absolute',
                  left: p.x,
                  top: p.y,
                  width: CW,
                  height: CH,
                  borderRadius: 40,
                  background: '#FFFFFF',
                  boxShadow: `0 26px 60px rgba(60,45,20,0.18), inset 0 -10px 0 ${c.col}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 18,
                  transform: `scale(${0.4 + 0.6 * Math.min(1.06, s)}) rotate(${(1 - clamp(s)) * (c.x ? 8 : -8)}deg)`,
                  opacity: clamp(s * 3),
                }}
              >
                <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: c.name.length > 10 ? 44 : 58, color: c.col, direction: 'rtl', whiteSpace: 'nowrap'}}>{c.name}</div>
                <Formula a={c.a} b={c.b} size={54} k={clamp(s)} />
              </div>
            );
          })}
        </div>
        {/* lesson title + subject */}
        {title > 0.001 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
            <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 110, color: P.ink, direction: 'rtl', transform: `scale(${0.6 + 0.4 * easeOutBack(clamp(title), 1.5)})`, opacity: clamp(title * 3), whiteSpace: 'nowrap'}}>
              العبارات <span style={{color: P.teal}}>الشرطية</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, direction: 'rtl'}}>
              <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 52, color: '#FFFFFF', background: P.teal, borderRadius: 999, padding: '2px 40px 12px', transform: `scale(${Math.min(1.08, subj)})`, opacity: clamp(subj * 3)}}>رياضيات</div>
              <div style={{width: 5, height: 60, borderRadius: 3, background: P.inkSoft, transform: `scaleY(${clamp(grade)})`}} />
              <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 52, color: P.ink, border: `4px solid ${P.ink}`, borderRadius: 999, padding: '0 40px 8px', transform: `scale(${Math.min(1.08, grade)})`, opacity: clamp(grade * 3)}}>أول ثانوي</div>
            </div>
          </div>
        )}
      </AbsoluteFill>
      {/* sign-off */}
      {logo > 0.001 && (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: 1 - fin}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, transform: `scale(${0.6 + 0.4 * Math.min(1.04, logo)})`, opacity: clamp(logo * 3)}}>
            <div style={{position: 'relative', width: 260, height: 300}}>
              <Bell size={260} t={t} ring={clamp((t - k.salam - 0.25) * 4) * (1 - clamp((t - k.salam - 1.1) * 2))} led={1} />
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 24, direction: 'rtl'}}>
              <LogoMark size={120} k={clamp((t - k.salam) * 1.4)} />
              <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 130, color: P.ink, lineHeight: 1.3}}>منهجي</span>
            </div>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: P.paper, opacity: fin}} />
    </AbsoluteFill>
  );
};

void easeOutCubic;
