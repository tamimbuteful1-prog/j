import React from 'react';
import {interpolate} from 'remotion';
import {COLORS, FONTS} from '../../kit/theme';
import {usePalette} from '../../kit/ThemeContext';

/**
 * CHECKOUT world — the supermarket counter: offer poster, POS terminal,
 * coupon, and a number line for thresholds ("more than 50").
 * Pure presentational components; all timing comes from props.
 */

const PAPER = '#FFF7E6';

/** Offer poster pinned on the shop wall. `words` light up as they are spoken. */
export const OfferPoster: React.FC<{
  x: number;
  y: number;
  scale?: number;
  appear: number; // 0..1
  ifGlow?: number;
  thenGlow?: number;
  dealGlow?: number;
  rotate?: number;
}> = ({x, y, scale = 1, appear, ifGlow = 0, thenGlow = 0, dealGlow = 0, rotate = 0}) => {
  const W = 820;
  const H = 520;
  const word = (t: string, c: string, g: number) => (
    <span style={{color: g > 0.05 ? c : '#2B2118', textShadow: g > 0.05 ? `0 0 ${24 * g}px ${c}` : undefined, display: 'inline-block', transform: `scale(${1 + 0.12 * g})`}}>{t}</span>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: x - W / 2,
        top: y - H / 2,
        width: W,
        height: H,
        transform: `translateY(${(1 - appear) * -120}px) rotate(${rotate + (1 - appear) * -6}deg) scale(${scale})`,
        opacity: Math.min(1, appear * 1.6),
        transformOrigin: '50% 0%',
      }}
    >
      {/* hanging strings */}
      <div style={{position: 'absolute', left: 120, top: -200, width: 3, height: 210, background: 'rgba(255,255,255,0.25)'}} />
      <div style={{position: 'absolute', right: 120, top: -200, width: 3, height: 210, background: 'rgba(255,255,255,0.25)'}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 34,
          background: `linear-gradient(180deg, ${PAPER}, #F3E3C0)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 0 10px ${COLORS.samoli}, 0 0 ${60 * dealGlow}px ${COLORS.samoli}`,
        }}
      />
      <div style={{position: 'absolute', top: -34, left: W / 2 - 150, width: 300, height: 74, borderRadius: 20, background: COLORS.samoli, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.display, fontWeight: 900, fontSize: 46, color: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.35)'}}>
        عرض خاص
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 92, left: 40, right: 40, textAlign: 'center', fontFamily: FONTS.display, fontWeight: 800, fontSize: 56, lineHeight: 1.5, color: '#2B2118'}}>
        {word('إذا', COLORS.or, ifGlow)} اشتريت بأكثر من{' '}
        <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.display, fontWeight: 900}}>50</span> ريال،
        <br />
        {word('فإنك', '#E0A21A', thenGlow)} ستحصل على {word('خصم', COLORS.samoli, dealGlow)}
      </div>
      <div style={{position: 'absolute', bottom: 34, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{padding: '8px 30px', borderRadius: 999, border: `3px dashed ${COLORS.samoli}`, fontFamily: FONTS.text, fontWeight: 700, fontSize: 32, color: COLORS.samoli}}>٪ خصم</div>
      </div>
    </div>
  );
};

/** POS terminal with a total counter and a discount row. */
export const POS: React.FC<{
  x: number;
  y: number;
  scale?: number;
  amount: number;
  discount: 'idle' | 'denied' | 'applied';
  discountP?: number; // 0..1 reveal of the discount row state
  coupon?: boolean;
  shakeX?: number;
  appear?: number;
}> = ({x, y, scale = 1, amount, discount, discountP = 1, coupon, shakeX = 0, appear = 1}) => {
  const W = 700;
  const H = 560;
  const c = discount === 'applied' ? COLORS.true : discount === 'denied' ? COLORS.muted : 'rgba(255,255,255,0.3)';
  const label = discount === 'applied' ? 'تم تطبيق الخصم ✓' : discount === 'denied' ? 'لا يوجد خصم' : '—';
  return (
    <div style={{position: 'absolute', left: x - W / 2, top: y - H / 2, width: W, height: H, transform: `translateX(${shakeX}px) scale(${scale}) translateY(${(1 - appear) * 300}px)`, opacity: Math.min(1, appear * 2), transformOrigin: '50% 50%'}}>
      {/* body */}
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 0, height: 150, borderRadius: '30px 30px 40px 40px', background: 'linear-gradient(180deg, #2A3352, #161C30)', boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}}>
        {Array.from({length: 12}).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 70 + (i % 6) * 85, top: 30 + Math.floor(i / 6) * 50, width: 64, height: 34, borderRadius: 9, background: '#39456B', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.35)'}} />
        ))}
      </div>
      {/* screen */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 400, borderRadius: 34, background: '#0B1222', border: '6px solid #2E3858', boxShadow: `0 30px 70px rgba(0,0,0,0.5), inset 0 0 60px rgba(95,160,255,0.12)`}}>
        <div dir="rtl" style={{position: 'absolute', top: 30, left: 44, right: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONTS.text, fontWeight: 600, fontSize: 34, color: COLORS.paperDim}}>
          <span>المجموع</span>
          <span style={{fontSize: 26, color: COLORS.muted}}>{coupon ? 'كوبون مضاف' : 'فاتورة'}</span>
        </div>
        <div dir="ltr" style={{position: 'absolute', top: 90, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.text, fontWeight: 700, fontSize: 132, color: '#E8F1FF', letterSpacing: '0.02em', textShadow: '0 0 30px rgba(95,160,255,0.45)'}}>
          {amount.toFixed(2)}
          <span style={{fontSize: 44, marginLeft: 14, color: COLORS.paperDim}}>SAR</span>
        </div>
        <div
          dir="rtl"
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            bottom: 34,
            height: 86,
            borderRadius: 22,
            border: `3px solid ${c}`,
            background: discount === 'applied' ? `${COLORS.true}22` : 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px',
            fontFamily: FONTS.text,
            fontWeight: 700,
            fontSize: 38,
            color: c,
            opacity: 0.4 + 0.6 * discountP,
          }}
        >
          <span>الخصم</span>
          <span style={{opacity: discountP}}>{label}</span>
        </div>
      </div>
    </div>
  );
};

export const Coupon: React.FC<{x: number; y: number; rotate?: number; scale?: number; opacity?: number}> = ({x, y, rotate = 0, scale = 1, opacity = 1}) => (
  <div style={{position: 'absolute', left: x - 170, top: y - 85, width: 340, height: 170, transform: `rotate(${rotate}deg) scale(${scale})`, opacity}}>
    <svg width={340} height={170} viewBox="0 0 340 170" style={{overflow: 'visible', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.45))'}}>
      <path d="M20 0 H320 A20 20 0 0 0 340 20 V65 A20 20 0 0 0 340 105 V150 A20 20 0 0 0 320 170 H20 A20 20 0 0 0 0 150 V105 A20 20 0 0 0 0 65 V20 A20 20 0 0 0 20 0 Z" fill={COLORS.aish} />
      <line x1={250} y1={14} x2={250} y2={156} stroke="#7A4E10" strokeWidth={4} strokeDasharray="10 9" />
      <text x={130} y={72} textAnchor="middle" direction="rtl" fontFamily={FONTS.display} fontWeight={900} fontSize={46} fill="#3A2408">كوبون</text>
      <text x={130} y={124} textAnchor="middle" direction="rtl" fontFamily={FONTS.display} fontWeight={800} fontSize={34} fill="#3A2408">خصم</text>
      <text x={295} y={100} textAnchor="middle" fontFamily={FONTS.text} fontWeight={700} fontSize={44} fill="#3A2408">%</text>
    </svg>
  </div>
);

/**
 * Number line with a STRICT threshold (open circle) — "more than T" excludes T.
 * `marker` value with `markerP` (0..1) arrival; region > T is lit.
 */
export const NumberLine: React.FC<{
  y: number;
  from: number;
  to: number;
  threshold: number;
  appear: number;
  marker: number;
  markerP: number;
  verdict?: number; // 0..1 shows "outside" emphasis
}> = ({y, from, to, threshold, appear, marker, markerP, verdict = 0}) => {
  const pal = usePalette();
  const ink = pal.mode === 'light' ? 'rgba(26,31,51,0.55)' : 'rgba(255,255,255,0.55)';
  const L = 140;
  const R = 940;
  const X = (v: number) => interpolate(v, [from, to], [L, R]);
  // RTL readers still read number lines left→right; keep math convention.
  const ticks: number[] = [];
  for (let v = from; v <= to; v += 5) ticks.push(v);
  const tx = X(threshold);
  return (
    <div style={{position: 'absolute', left: 0, top: y - 110, width: 1080, height: 220, opacity: appear, transform: `translateY(${(1 - appear) * 40}px)`}}>
      <svg width={1080} height={220} style={{overflow: 'visible'}}>
        <line x1={L - 30} y1={110} x2={R + 30} y2={110} stroke={ink} strokeWidth={6} strokeLinecap="round" />
        {/* region > threshold */}
        <line x1={tx} y1={110} x2={R + 30} y2={110} stroke={pal.p} strokeWidth={14} strokeLinecap="round" style={{filter: `drop-shadow(0 0 14px ${pal.p}88)`}} />
        <path d={`M${R + 30} 96 L${R + 52} 110 L${R + 30} 124 Z`} fill={pal.p} />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={X(v)} y1={96} x2={X(v)} y2={124} stroke={ink} strokeWidth={4} />
            <text x={X(v)} y={168} textAnchor="middle" fontFamily={FONTS.text} fontWeight={700} fontSize={34} fill={v === threshold ? pal.text : ink}>
              {v}
            </text>
          </g>
        ))}
        {/* open circle: threshold NOT included */}
        <circle cx={tx} cy={110} r={20} fill={pal.mode === 'light' ? '#FFFFFF' : '#0B1222'} stroke={pal.p} strokeWidth={7} />
        {/* marker */}
        <g transform={`translate(${X(marker)} ${interpolate(markerP, [0, 1], [-30, 52])})`} opacity={Math.min(1, markerP * 3)}>
          <path d="M0 0 L-20 -34 H20 Z" fill={COLORS.aish} />
          <rect x={-56} y={-96} width={112} height={60} rx={16} fill={COLORS.aish} />
          <text x={0} y={-54} textAnchor="middle" fontFamily={FONTS.text} fontWeight={700} fontSize={36} fill="#2B1A04">
            {marker}
          </text>
        </g>
        {verdict > 0 && <circle cx={tx} cy={110} r={20 + 30 * verdict} fill="none" stroke={COLORS.false} strokeWidth={5} opacity={1 - verdict * 0.6} />}
      </svg>
    </div>
  );
};
