import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {COLORS, FONTS} from '../../kit/theme';
import {ProductArt} from '../grocery/Product';

/**
 * GROCERY-APP world — the 9:16 frame IS a phone screen of a (fictional) grocery
 * delivery app «بقالتي», dark mode. Status bar, headers, promo banner, product grid,
 * cart, checkout summary, coupon field, toasts, progress-to-offer bar.
 * Presentational only — timing comes from props.
 */
export const APP = {
  bg: '#0D111B',
  surface: '#161C2A',
  surface2: '#1E2638',
  line: 'rgba(255,255,255,0.08)',
  accent: '#FF7550', // app brand
  accentSoft: 'rgba(255,117,80,0.14)',
  text: '#F4F1EA',
  sub: '#8C95AD',
};

const T = (size: number, weight = 700, color: string = APP.text, font: string = FONTS.text): React.CSSProperties => ({fontFamily: font, fontWeight: weight, fontSize: size, color});

const Riyal: React.FC<{v: number; size?: number; color?: string}> = ({v, size = 34, color = APP.text}) => (
  <span dir="ltr" style={{unicodeBidi: 'isolate', ...T(size, 700, color)}}>
    {v.toFixed(2)} <span style={{fontSize: size * 0.6, color: APP.sub}}>ر.س</span>
  </span>
);

// ── chrome ────────────────────────────────────────────────────────
const StatusBar: React.FC = () => (
  <div dir="ltr" style={{position: 'absolute', top: 0, left: 0, right: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', ...T(28, 700)}}>
    <span>9:41</span>
    <span style={{display: 'flex', gap: 10, alignItems: 'center'}}>
      <span style={{width: 34, height: 18, borderRadius: 4, border: `2px solid ${APP.text}`, position: 'relative'}}>
        <span style={{position: 'absolute', inset: 2, right: 8, background: APP.text, borderRadius: 2}} />
      </span>
    </span>
  </div>
);

const TabBar: React.FC<{active: 'home' | 'offers' | 'cart' | 'account'; cartCount?: number}> = ({active, cartCount = 0}) => {
  const tabs: {k: typeof active; label: string; icon: string}[] = [
    {k: 'home', label: 'الرئيسية', icon: 'M8 22 L24 8 L40 22 V40 H8 Z'},
    {k: 'offers', label: 'العروض', icon: 'M10 10 H30 L40 24 L30 38 H10 Z'},
    {k: 'cart', label: 'السلة', icon: 'M6 10 H12 L16 32 H36 L40 16 H14'},
    {k: 'account', label: 'حسابي', icon: 'M24 24 A8 8 0 1 0 24 8 A8 8 0 1 0 24 24 M8 42 C8 30 40 30 40 42'},
  ];
  return (
    <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: 'rgba(13,17,27,0.96)', borderTop: `1px solid ${APP.line}`, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: 22}}>
      {tabs.map((t) => {
        const on = t.k === active;
        const c = on ? APP.accent : APP.sub;
        return (
          <div key={t.k} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative'}}>
            <svg width={48} height={48} viewBox="0 0 48 48">
              <path d={t.icon} fill="none" stroke={c} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span style={T(24, on ? 700 : 500, c)}>{t.label}</span>
            {t.k === 'cart' && cartCount > 0 && (
              <span style={{position: 'absolute', top: -6, left: -8, minWidth: 30, height: 30, borderRadius: 15, background: APP.accent, ...T(20, 700, '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{cartCount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const HomeHeader: React.FC = () => (
  <div dir="rtl" style={{position: 'absolute', top: 70, left: 44, right: 44}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 64, height: 64, borderRadius: 20, background: APP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(30, 900, '#fff', FONTS.display)}}>ب</div>
        <div>
          <div style={T(34, 900, APP.text, FONTS.display)}>بقالتي</div>
          <div style={T(22, 500, APP.sub)}>التوصيل إلى: البيت ▾</div>
        </div>
      </div>
      <div style={{width: 60, height: 60, borderRadius: 30, background: APP.surface2, border: `1px solid ${APP.line}`}} />
    </div>
    <div style={{marginTop: 22, height: 74, borderRadius: 22, background: APP.surface, border: `1px solid ${APP.line}`, display: 'flex', alignItems: 'center', padding: '0 26px', gap: 14, ...T(28, 500, APP.sub)}}>
      <svg width={30} height={30} viewBox="0 0 30 30"><circle cx={13} cy={13} r={9} fill="none" stroke={APP.sub} strokeWidth={3} /><path d="M20 20 L27 27" stroke={APP.sub} strokeWidth={3} strokeLinecap="round" /></svg>
      ابحث عن منتجات…
    </div>
  </div>
);

const NavHeader: React.FC<{title: string; subtitle?: string}> = ({title, subtitle}) => (
  <div dir="rtl" style={{position: 'absolute', top: 76, left: 44, right: 44, height: 110, display: 'flex', alignItems: 'center', gap: 22}}>
    <div style={{width: 64, height: 64, borderRadius: 20, background: APP.surface, border: `1px solid ${APP.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg width={28} height={28} viewBox="0 0 28 28"><path d="M10 5 L19 14 L10 23" fill="none" stroke={APP.text} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
    <div>
      <div style={T(40, 900, APP.text, FONTS.display)}>{title}</div>
      {subtitle && <div style={T(22, 500, APP.sub)}>{subtitle}</div>}
    </div>
  </div>
);

/** The phone-screen frame of the app. Children are positioned on the 1080×1920 canvas. */
export const AppFrame: React.FC<{
  header: {kind: 'home'} | {kind: 'nav'; title: string; subtitle?: string};
  tab: 'home' | 'offers' | 'cart' | 'account';
  cartCount?: number;
  children?: React.ReactNode;
  glow?: string;
}> = ({header, tab, cartCount, children, glow = APP.accent}) => (
  <AbsoluteFill style={{background: APP.bg}}>
    <AbsoluteFill style={{background: `radial-gradient(900px 700px at 50% 30%, ${glow}14, transparent 70%)`}} />
    <StatusBar />
    {header.kind === 'home' ? <HomeHeader /> : <NavHeader title={header.title} subtitle={header.subtitle} />}
    {children}
    <TabBar active={tab} cartCount={cartCount} />
  </AbsoluteFill>
);

// ── home ──────────────────────────────────────────────────────────
export const CategoryChips: React.FC<{y: number; active?: number}> = ({y, active = 1}) => (
  <div dir="rtl" style={{position: 'absolute', top: y, left: 44, right: 0, display: 'flex', gap: 16, overflow: 'hidden'}}>
    {['الكل', 'مخبوزات', 'ألبان', 'خضار', 'مشروبات', 'سناكات'].map((c, i) => (
      <div key={c} style={{padding: '14px 28px', borderRadius: 999, whiteSpace: 'nowrap', background: i === active ? APP.accent : APP.surface, border: `1px solid ${i === active ? APP.accent : APP.line}`, ...T(26, 700, i === active ? '#fff' : APP.sub)}}>
        {c}
      </div>
    ))}
  </div>
);

/** Promo banner — the conditional offer, as an app carousel card. */
export const PromoBanner: React.FC<{y: number; appear: number; ifGlow?: number; thenGlow?: number; dealGlow?: number; tap?: number}> = ({y, appear, ifGlow = 0, thenGlow = 0, dealGlow = 0, tap = 0}) => {
  const w = (t: string, c: string, g: number) => (
    <span style={{color: g > 0.05 ? c : '#fff', textShadow: g > 0.05 ? `0 0 ${22 * g}px ${c}` : undefined, display: 'inline-block', transform: `scale(${1 + 0.1 * g})`}}>{t}</span>
  );
  return (
    <div style={{position: 'absolute', left: 44, right: 44, top: y, height: 380, transform: `translateX(${(1 - appear) * -1100}px) scale(${1 - 0.03 * Math.sin(Math.PI * tap)})`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 40, overflow: 'hidden', background: 'linear-gradient(135deg, #FF7550 0%, #E2483C 55%, #A3243A 100%)', boxShadow: `0 30px 70px rgba(255,117,80,${0.25 + 0.3 * dealGlow})`}}>
        <div style={{position: 'absolute', right: -60, top: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.10)'}} />
        <div style={{position: 'absolute', left: -40, bottom: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(0,0,0,0.10)'}} />
        <div dir="rtl" style={{position: 'absolute', top: 30, right: 40, padding: '8px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.22)', ...T(24, 700, '#fff')}}>عرض خاص</div>
        <div dir="rtl" style={{position: 'absolute', top: 96, right: 40, left: 300, ...T(48, 900, '#fff', FONTS.display), lineHeight: 1.45}}>
          {w('إذا', '#BFE0FF', ifGlow)} اشتريت بأكثر من <span dir="ltr" style={{unicodeBidi: 'isolate'}}>50</span> ريال،{' '}
          {w('فإنك', '#FFE08A', thenGlow)} ستحصل على {w('خصم', '#FFF', dealGlow)}
        </div>
        <div style={{position: 'absolute', left: 50, top: 70, width: 230, height: 230, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(-8deg) scale(${1 + 0.08 * dealGlow})`}}>
          <span style={T(84, 900, '#E2483C', FONTS.display)}>٪</span>
        </div>
        <div style={{position: 'absolute', bottom: 26, right: 0, left: 0, display: 'flex', justifyContent: 'center', gap: 10}}>
          {[0, 1, 2].map((i) => <span key={i} style={{width: i === 0 ? 34 : 12, height: 12, borderRadius: 6, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)'}} />)}
        </div>
      </div>
      {tap > 0 && tap < 1 && (
        <div style={{position: 'absolute', left: '50%', top: '55%', width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: '50%', border: '6px solid rgba(255,255,255,0.8)', transform: `scale(${0.3 + tap * 1.6})`, opacity: 1 - tap}} />
      )}
    </div>
  );
};

export type Item = {name: string; price: number; kind?: 'aish' | 'samoli'; color?: string};

const ItemThumb: React.FC<{it: Item; size: number}> = ({it, size}) => (
  <div style={{width: size, height: size, borderRadius: 22, background: APP.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0}}>
    {it.kind ? (
      <ProductArt kind={it.kind} style={{width: size * 0.62, height: size * 0.74}} />
    ) : (
      <div style={{width: size * 0.42, height: size * 0.62, borderRadius: size * 0.1, background: it.color ?? '#5B6E9A', boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.18)'}} />
    )}
  </div>
);

export const ProductGrid: React.FC<{y: number; items: Item[]; appear: number}> = ({y, items, appear}) => (
  <div dir="rtl" style={{position: 'absolute', top: y, left: 44, right: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
    {items.map((it, i) => {
      const a = interpolate(appear, [i * 0.12, i * 0.12 + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      return (
        <div key={it.name} style={{height: 300, borderRadius: 30, background: APP.surface, border: `1px solid ${APP.line}`, padding: 20, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, position: 'relative'}}>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <ItemThumb it={it} size={150} />
          </div>
          <div style={{marginTop: 14, ...T(28, 700)}}>{it.name}</div>
          <div style={{marginTop: 4}}>
            <Riyal v={it.price} size={28} />
          </div>
          <div style={{position: 'absolute', left: 18, bottom: 18, width: 58, height: 58, borderRadius: 18, background: APP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(40, 700, '#fff')}}>+</div>
        </div>
      );
    })}
  </div>
);

// ── cart / checkout ──────────────────────────────────────────────
/** Cart line items; `shown` = how many items are in (fractional for the arriving one). */
export const CartList: React.FC<{y: number; items: Item[]; shown: number}> = ({y, items, shown}) => (
  <div dir="rtl" style={{position: 'absolute', top: y, left: 44, right: 44, display: 'flex', flexDirection: 'column', gap: 16}}>
    {items.map((it, i) => {
      const a = Math.max(0, Math.min(1, shown - i));
      return (
        <div key={it.name} style={{height: 118, borderRadius: 26, background: APP.surface, border: `1px solid ${APP.line}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px', opacity: a, transform: `translateX(${(1 - a) * 300}px)`}}>
          <ItemThumb it={it} size={84} />
          <div style={{flex: 1, ...T(30, 700)}}>{it.name}</div>
          <Riyal v={it.price} size={30} />
        </div>
      );
    })}
  </div>
);

export const OrderSummary: React.FC<{
  y: number;
  total: number;
  discount: 'none' | 'denied' | 'applied';
  discountP?: number;
  coupon?: {text: string; typed: number; applied: number};
  pulse?: number;
  shakeX?: number;
}> = ({y, total, discount, discountP = 1, coupon, pulse = 0, shakeX = 0}) => {
  const dc = discount === 'applied' ? COLORS.true : discount === 'denied' ? COLORS.false : APP.sub;
  const dl = discount === 'applied' ? 'تم تطبيق الخصم ✓' : discount === 'denied' ? 'غير مؤهل' : '—';
  return (
    <div dir="rtl" style={{position: 'absolute', top: y, left: 44, right: 44, borderRadius: 32, background: APP.surface, border: `1px solid ${APP.line}`, padding: '26px 30px', transform: `translateX(${shakeX}px)`, boxShadow: '0 30px 70px rgba(0,0,0,0.4)'}}>
      {coupon && (
        <div style={{display: 'flex', gap: 14, marginBottom: 22}}>
          <div style={{flex: 1, height: 76, borderRadius: 20, border: `2px dashed ${coupon.applied > 0.5 ? COLORS.true : APP.sub}`, display: 'flex', alignItems: 'center', padding: '0 22px', ...T(30, 700, coupon.typed > 0 ? APP.text : APP.sub)}}>
            {coupon.typed > 0 ? coupon.text.slice(0, Math.ceil(coupon.text.length * coupon.typed)) : 'أدخل كود الخصم'}
          </div>
          <div style={{width: 150, height: 76, borderRadius: 20, background: coupon.applied > 0.5 ? COLORS.true : APP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(28, 700, coupon.applied > 0.5 ? COLORS.ink : '#fff')}}>
            {coupon.applied > 0.5 ? 'تم ✓' : 'تطبيق'}
          </div>
        </div>
      )}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...T(30, 600, APP.sub)}}>
        <span>المجموع</span>
        <span style={{transform: `scale(${1 + 0.12 * pulse})`, display: 'inline-block'}}>
          <Riyal v={total} size={46} />
        </span>
      </div>
      <div style={{height: 1, background: APP.line, margin: '20px 0'}} />
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...T(30, 600, APP.sub)}}>
        <span>الخصم</span>
        <span style={{...T(30, 700, dc), opacity: 0.35 + 0.65 * discountP}}>{dl}</span>
      </div>
      <div style={{marginTop: 24, height: 92, borderRadius: 26, background: APP.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T(34, 800, '#fff', FONTS.display)}}>إتمام الطلب</div>
    </div>
  );
};

export const Toast: React.FC<{y: number; p: number; text: string; color: string}> = ({y, p, text, color}) =>
  p > 0.01 ? (
    <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * -60}px)`, opacity: p}}>
      <div dir="rtl" style={{padding: '20px 34px', borderRadius: 26, background: APP.surface2, border: `2px solid ${color}`, boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 30px ${color}44`, ...T(32, 700, APP.text), display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{width: 18, height: 18, borderRadius: 9, background: color}} />
        {text}
      </div>
    </div>
  ) : null;

/**
 * "Progress to offer" bar (like real apps' "add X more for …") with a STRICT threshold:
 * the offer needs MORE than `threshold`, so reaching it exactly is not enough.
 */
export const OfferProgress: React.FC<{y: number; appear: number; value: number; threshold: number; max: number; verdict: number}> = ({y, appear, value, threshold, max, verdict}) => {
  const W = 880;
  const x = (v: number) => (v / max) * W;
  return (
    <div dir="rtl" style={{position: 'absolute', top: y, left: 100, width: W, opacity: appear, transform: `translateY(${(1 - appear) * 40}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', ...T(30, 700, APP.text), marginBottom: 18}}>
        <span>تقدّمك نحو العرض</span>
        <Riyal v={value} size={32} color={verdict > 0.5 ? COLORS.false : APP.text} />
      </div>
      <div dir="ltr" style={{position: 'relative', height: 30, borderRadius: 15, background: APP.surface2}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: x(value), borderRadius: 15, background: `linear-gradient(90deg, ${APP.accent}, #FFB36B)`}} />
        {/* threshold notch: open = not included */}
        <div style={{position: 'absolute', left: x(threshold) - 22, top: -7, width: 44, height: 44, borderRadius: 22, background: APP.bg, border: `6px solid ${verdict > 0.5 ? COLORS.false : COLORS.or}`, boxShadow: verdict > 0.5 ? `0 0 ${20 + 20 * verdict}px ${COLORS.falseGlow}` : undefined}} />
        <div style={{position: 'absolute', left: x(threshold) + 26, top: 0, bottom: 0, right: 0, borderRadius: 15, border: `3px dashed ${COLORS.or}`, opacity: 0.7}} />
      </div>
      <div dir="ltr" style={{position: 'relative', height: 50, marginTop: 10}}>
        {[0, 25, threshold].map((v) => (
          <span key={v} style={{position: 'absolute', left: x(v) - 30, width: 60, textAlign: 'center', ...T(26, 700, v === threshold ? APP.text : APP.sub)}}>{v}</span>
        ))}
        <span dir="rtl" style={{position: 'absolute', right: 0, top: 40, whiteSpace: 'nowrap', ...T(26, 700, COLORS.or)}}>منطقة العرض: أكثر من 50</span>
      </div>
    </div>
  );
};
