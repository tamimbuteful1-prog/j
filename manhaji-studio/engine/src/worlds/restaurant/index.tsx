import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONTS} from '../../kit/theme';
import {wobble} from '../../kit/anim';

/**
 * RESTAURANT world (light theme): a bright fast-casual restaurant — cream wall,
 * subway tiles, hanging pendant lamps, an offer board, and a printed receipt.
 * Fictional brand «مطعم السفرة». Presentational only; timing comes from props.
 */
export const R = {
  wall: '#FBF4E9',
  tile: '#F3E8D6',
  wood: '#C98F5A',
  red: '#E5484D',
  ink: '#1A1F33',
  sub: '#6A7089',
  paper: '#FFFFFF',
};

const T = (size: number, weight = 700, color: string = R.ink, font: string = FONTS.text): React.CSSProperties => ({fontFamily: font, fontWeight: weight, fontSize: size, color});

export const Burger: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M12 46 Q50 6 88 46 Z" fill="#E7A23B" />
    {[22, 34, 50, 62, 74].map((x, i) => <ellipse key={i} cx={x} cy={30 + (i % 2) * 6} rx={2.2} ry={1.3} fill="#FFF3D6" />)}
    <rect x={10} y={46} width={80} height={8} rx={4} fill="#6FBF4A" />
    <rect x={12} y={54} width={76} height={12} rx={6} fill="#7A3E1D" />
    <rect x={10} y={66} width={80} height={6} rx={3} fill="#F2C94C" />
    <path d="M12 72 H88 Q86 90 50 90 Q14 90 12 72 Z" fill="#E09A36" />
  </svg>
);

/** Restaurant wall with tiles, a wooden shelf and swinging pendant lamps. */
export const RestaurantWall: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${R.wall} 0%, #F7EBD9 100%)`}}>
    {/* subway tiles (lower wall) */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1180,
        bottom: 0,
        backgroundColor: R.tile,
        backgroundImage:
          'linear-gradient(rgba(26,31,51,0.08) 2px, transparent 2px), linear-gradient(90deg, rgba(26,31,51,0.08) 2px, transparent 2px)',
        backgroundSize: '120px 60px',
      }}
    />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1170, height: 22, background: R.wood, boxShadow: '0 8px 20px rgba(120,70,20,0.25)'}} />
    {/* pendant lamps */}
    {[200, 540, 880].map((x, i) => {
      const sw = wobble(frame, i + 3, 0.05, 2.2);
      return (
        <div key={x} style={{position: 'absolute', left: x - 60, top: -10, width: 120, height: 330, transformOrigin: '60px 0', transform: `rotate(${sw}deg)`}}>
          <div style={{position: 'absolute', left: 58, top: 0, width: 4, height: 200, background: '#3A3A44'}} />
          <div style={{position: 'absolute', left: 0, top: 196, width: 120, height: 70, borderRadius: '60px 60px 12px 12px', background: '#2C3140'}} />
          <div style={{position: 'absolute', left: 30, top: 252, width: 60, height: 30, borderRadius: '0 0 30px 30px', background: '#FFE7A6', boxShadow: '0 30px 120px 50px rgba(255,214,130,0.55)'}} />
        </div>
      );
    })}
    {/* plants on the shelf */}
    {[120, 960].map((x) => (
      <div key={x} style={{position: 'absolute', left: x - 50, top: 1050, width: 100, height: 120}}>
        <div style={{position: 'absolute', left: 20, bottom: 0, width: 60, height: 54, borderRadius: '8px 8px 18px 18px', background: '#E8DCC8'}} />
        {[-28, 0, 28].map((r, i) => <div key={i} style={{position: 'absolute', left: 38, bottom: 46, width: 24, height: 74, borderRadius: '50%', background: '#6FAE5B', transformOrigin: '50% 100%', transform: `rotate(${r + wobble(frame, i, 0.03, 3)}deg)`}} />)}
      </div>
    ))}
  </AbsoluteFill>
);

/** Offer board hung on the wall. Words light up as they are spoken. */
export const OfferBoard: React.FC<{x: number; y: number; appear: number; ifGlow?: number; thenGlow?: number; dealGlow?: number; p: string; q: string; rotate?: number}> = ({x, y, appear, ifGlow = 0, thenGlow = 0, dealGlow = 0, p, q, rotate = 0}) => {
  const W = 860;
  const H = 560;
  const w = (t: string, c: string, g: number) => (
    <span style={{color: g > 0.05 ? c : R.ink, display: 'inline-block', transform: `scale(${1 + 0.12 * g})`, textShadow: g > 0.05 ? `0 0 ${18 * g}px ${c}66` : undefined}}>{t}</span>
  );
  return (
    <div style={{position: 'absolute', left: x - W / 2, top: y - H / 2, width: W, height: H, transform: `translateY(${(1 - appear) * -140}px) rotate(${rotate + (1 - appear) * -5}deg)`, opacity: Math.min(1, appear * 1.6), transformOrigin: '50% 0%'}}>
      <div style={{position: 'absolute', left: 140, top: -220, width: 3, height: 230, background: 'rgba(26,31,51,0.3)'}} />
      <div style={{position: 'absolute', right: 140, top: -220, width: 3, height: 230, background: 'rgba(26,31,51,0.3)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: R.paper, boxShadow: `0 40px 80px rgba(120,70,20,0.22), 0 0 0 10px ${R.red}, 0 0 ${60 * dealGlow}px ${R.red}88`}} />
      <div style={{position: 'absolute', top: -38, left: W / 2 - 180, width: 360, height: 80, borderRadius: 22, background: R.red, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(46, 900, '#fff', FONTS.display), boxShadow: '0 12px 30px rgba(229,72,77,0.35)'}}>
        عرض المطعم
      </div>
      <div style={{position: 'absolute', left: 36, top: 150}}>
        <Burger size={150} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 150, right: 40, left: 200, textAlign: 'right', ...T(52, 800, R.ink, FONTS.display), lineHeight: 1.7, whiteSpace: 'nowrap'}}>
        {w('إذا', p, ifGlow)} اشتريت بأكثر من <span dir="ltr" style={{unicodeBidi: 'isolate', fontWeight: 900}}>50</span> ريال،
        <br />
        {w('فإنك', q, thenGlow)} ستحصل على {w('خصم', R.red, dealGlow)}
      </div>
      <div dir="rtl" style={{position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center', ...T(28, 600, R.sub)}}>مطعم السفرة · العرض على الطلبات داخل المطعم والتوصيل</div>
    </div>
  );
};

export type ReceiptLine = {name: string; price: number};

/**
 * Printed receipt. `printed` 0..1 reveals it top-down like a thermal printer;
 * `discount` controls the discount row; `coupon` adds a coupon line.
 */
export const Receipt: React.FC<{
  x: number;
  y: number;
  scale?: number;
  items: ReceiptLine[];
  printed: number;
  total: number;
  discount: 'none' | 'denied' | 'applied';
  discountP?: number;
  coupon?: boolean;
  shakeX?: number;
  pulse?: number;
  trueC: string;
  falseC: string;
}> = ({x, y, scale = 1, items, printed, total, discount, discountP = 1, coupon, shakeX = 0, pulse = 0, trueC, falseC}) => {
  const W = 640;
  const rowH = 64;
  const H = 230 + items.length * rowH + (coupon ? rowH : 0) + 210;
  const shown = Math.max(0, Math.min(1, printed));
  const dc = discount === 'applied' ? trueC : discount === 'denied' ? falseC : R.sub;
  const dl = discount === 'applied' ? 'تم تطبيق الخصم ✓' : discount === 'denied' ? 'لا يوجد خصم' : '—';
  const Row: React.FC<{a: string; b: React.ReactNode; color?: string; bold?: boolean}> = ({a, b, color = R.ink, bold}) => (
    <div dir="rtl" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: rowH, ...T(34, bold ? 800 : 600, color)}}>
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
  const money = (v: number) => <span dir="ltr" style={{unicodeBidi: 'isolate'}}>{v.toFixed(2)}</span>;
  return (
    <div style={{position: 'absolute', left: x - W / 2, top: y, width: W, height: H, transform: `translateX(${shakeX}px) scale(${scale})`, transformOrigin: '50% 0%'}}>
      {/* printer slot */}
      <div style={{position: 'absolute', left: -30, right: -30, top: -34, height: 46, borderRadius: 18, background: '#2C3140', boxShadow: '0 10px 24px rgba(0,0,0,0.25)'}} />
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: `inset(0 0 ${(1 - shown) * 100}% 0)`}}>
        <div style={{position: 'absolute', inset: 0, background: R.paper, boxShadow: '0 30px 60px rgba(120,70,20,0.18)', padding: '34px 44px', maskImage: 'linear-gradient(180deg, #000 96%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, #000 96%, transparent)'}}>
          <div dir="rtl" style={{textAlign: 'center', ...T(40, 900, R.ink, FONTS.display)}}>مطعم السفرة</div>
          <div dir="rtl" style={{textAlign: 'center', ...T(24, 500, R.sub), marginBottom: 18}}>فاتورة الطلب</div>
          <div style={{borderTop: '3px dashed rgba(26,31,51,0.25)', marginBottom: 8}} />
          {items.map((it) => (
            <Row key={it.name} a={it.name} b={money(it.price)} />
          ))}
          {coupon && <Row a="كوبون" b="✓" color={trueC} />}
          <div style={{borderTop: '3px dashed rgba(26,31,51,0.25)', margin: '8px 0'}} />
          <div style={{transform: `scale(${1 + 0.08 * pulse})`, transformOrigin: '50% 50%'}}>
            <Row a="المجموع" b={<span style={{fontSize: 46}}>{money(total)} ر.س</span>} bold />
          </div>
          <Row a="الخصم" b={<span style={{opacity: 0.4 + 0.6 * discountP}}>{dl}</span>} color={dc} bold />
        </div>
      </div>
    </div>
  );
};
