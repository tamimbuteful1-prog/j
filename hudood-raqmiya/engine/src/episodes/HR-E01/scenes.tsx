import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, F, VIDEO} from '../../theme';
import {EASE, lerp, life, ramp, sp} from '../../lib/anim';
import {Glass, SeriesMark, layoutAt} from '../../components/base';
import {LINES, TOTAL, line, wordAt} from './timeline';
import MAP from '../../lib/saudi-map.json';

const useT = () => {
  const frame = useCurrentFrame();
  return {frame, t: frame / VIDEO.fps};
};

/* ───────────────────────── shared pieces ───────────────────────── */

/** a title in the free top-left area beside the PiP card */
const SideTitle: React.FC<{a: number; b: number; kicker?: string; title: string; color?: string}> = ({a, b, kicker, title, color}) => {
  const {frame} = useT();
  const p = life(frame, a, b);
  return (
    <div style={{position: 'absolute', left: 56, top: 170, width: 600, direction: 'rtl', textAlign: 'right', opacity: p, transform: `translateX(${(1 - p) * -30}px)`}}>
      {kicker && <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.dim, marginBottom: 12}}>{kicker}</div>}
      <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 64, lineHeight: 1.15, color: color ?? C.text}}>{title}</div>
      <div style={{marginTop: 22, height: 6, width: 160 * ramp(frame, a + 0.2, a + 0.9), background: color ?? C.green, borderRadius: 3, marginRight: 0, marginLeft: 'auto', boxShadow: `0 0 18px ${color ?? C.green}`}} />
    </div>
  );
};

/** lock-on reticle */
const Reticle: React.FC<{cx: number; cy: number; a: number; b: number; label: string}> = ({cx, cy, a, b, label}) => {
  const {frame, t} = useT();
  const show = life(frame, a, b, 0.25, 0.3);
  const lock = sp(frame, a + 0.15, {damping: 18, stiffness: 120});
  const gap = lerp(330, 175, lock);
  const rot = (t - a) * 40;
  const blink = Math.sin(t * 18) > 0 ? 1 : 0.55;
  const L = 70;
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: show}}>
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={gap * 0.92} fill="none" stroke={C.red} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 14" transform={`rotate(${rot})`} />
        {[0, 90, 180, 270].map((r) => (
          <g key={r} transform={`rotate(${r})`}>
            <path d={`M ${-gap} ${-gap + L} V ${-gap} H ${-gap + L}`} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" style={{filter: `drop-shadow(0 0 10px ${C.red})`}} />
          </g>
        ))}
        <line x1={-gap - 60} y1={0} x2={-gap + 30} y2={0} stroke={C.red} strokeWidth={3} opacity={0.8} />
        <line x1={gap - 30} y1={0} x2={gap + 60} y2={0} stroke={C.red} strokeWidth={3} opacity={0.8} />
        <circle r={9} fill={C.red} opacity={blink * lock} style={{filter: `drop-shadow(0 0 12px ${C.red})`}} />
      </g>
      <g transform={`translate(${cx + gap - 10} ${cy - gap - 30})`} opacity={ramp(frame, a + 0.45, a + 0.75)}>
        <rect x={-210} y={-44} width={210} height={64} rx={12} fill={C.red} />
        <text x={-105} y={0} textAnchor="middle" fontFamily={F.head} fontWeight={800} fontSize={34} fill="#fff" direction="rtl">
          {label}
        </text>
      </g>
    </svg>
  );
};

/** a social post card (no real platform branding) */
const Post: React.FC<{w: number; seed: string; tag?: string; tagColor?: string; flag?: 'ok' | 'bad' | null}> = ({w, seed, tag, tagColor, flag}) => {
  const lines = 2 + Math.floor(random(seed) * 2);
  return (
    <Glass style={{width: w, padding: 22, borderRadius: 22, direction: 'rtl'}} tint={flag === 'ok' ? C.green : flag === 'bad' ? C.red : undefined}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 46, height: 46, borderRadius: 23, background: `hsl(${200 + random(seed + 'h') * 60} 25% ${30 + random(seed + 'l') * 20}%)`}} />
        <div style={{flex: 1}}>
          <div style={{height: 13, width: '42%', background: 'rgba(255,255,255,0.55)', borderRadius: 7}} />
          <div style={{height: 10, width: '26%', background: 'rgba(255,255,255,0.22)', borderRadius: 5, marginTop: 8}} />
        </div>
        {tag && (
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 22, color: '#fff', background: tagColor ?? C.green, padding: '6px 14px', borderRadius: 10}}>{tag}</div>
        )}
        {flag && (
          <div style={{width: 40, height: 40, borderRadius: 20, background: flag === 'ok' ? C.green : C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 26, fontFamily: F.head}}>
            {flag === 'ok' ? '✓' : '!'}
          </div>
        )}
      </div>
      {Array.from({length: lines}).map((_, i) => (
        <div key={i} style={{height: 12, width: `${92 - i * 14 - random(seed + i) * 18}%`, background: 'rgba(255,255,255,0.3)', borderRadius: 6, marginTop: 14}} />
      ))}
    </Glass>
  );
};

/* ───────────────────────── hook & intro ───────────────────────── */

/** the hook: «ربحي» is struck out and becomes «مفتوح لكل سعودي», then the border sweeps in */
const Decision: React.FC = () => {
  const {frame} = useT();
  const l = line('L01');
  const show = life(frame, l.start, l.end + 0.25, 0.3, 0.3);
  const profit = sp(frame, wordAt('L01', 'ربحي') - 0.12, {damping: 16, stiffness: 170});
  const strikeAt = wordAt('L01', 'لكن') - 0.05;
  const strike = ramp(frame, strikeAt, strikeAt + 0.35, EASE.inOut);
  const sink = ramp(frame, wordAt('L01', 'قررت'), wordAt('L01', 'قررت') + 0.5, EASE.in);
  const openAt = wordAt('L01', 'مفتوح') - 0.1;
  const open = sp(frame, openAt, {damping: 15, stiffness: 150});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, height: 470, opacity: show, direction: 'rtl'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 30, display: 'flex', justifyContent: 'center', opacity: Math.min(1, profit) * (1 - sink), transform: `translateY(${sink * 60}px) scale(${lerp(1.25, 1, Math.min(profit, 1))})`}}>
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{width: 110, height: 110, borderRadius: 55, border: `6px solid ${C.amber}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 900, fontSize: 44, color: C.amber, boxShadow: `0 0 26px ${C.amber}55`}}>ر.س</div>
          <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 150, color: C.amber, textShadow: `0 0 34px ${C.amber}55`}}>ربحي</div>
          <div style={{position: 'absolute', right: -20, left: -20, top: '50%', height: 14, borderRadius: 7, background: C.red, boxShadow: `0 0 22px ${C.red}`, transform: `scaleX(${strike}) rotate(-7deg)`, transformOrigin: 'right center'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, open), transform: `scale(${lerp(0.8, 1, Math.min(open, 1))})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{fontFamily: 'monospace', fontWeight: 700, fontSize: 64, color: '#04160c', background: C.green, padding: '8px 22px', borderRadius: 18, boxShadow: `0 0 30px ${C.greenGlow}`}}>{'</>'}</div>
          <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 140, color: C.green, textShadow: `0 0 36px ${C.greenGlow}`}}>مفتوح</div>
        </div>
        <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 70, color: C.text, marginTop: 6}}>لكل سعودي</div>
      </div>
    </div>
  );
};

const Hook: React.FC = () => {
  const {frame} = useT();
  const l1 = line('L01');
  const sweep = ramp(frame, l1.end - 0.15, l1.end + 0.55, EASE.inOut);
  const markIn = sp(frame, l1.end + 0.1, {damping: 20, stiffness: 110});
  const markOut = ramp(frame, line('L03').end - 0.2, line('L03').end + 0.4, EASE.inOut);
  const big = 1 - markOut;
  return (
    <>
      <Decision />
      {/* the border sweeps across the frame and becomes the series mark */}
      <div
        style={{
          position: 'absolute',
          top: 1180,
          right: 0,
          height: 6,
          width: `${100 * sweep}%`,
          background: `linear-gradient(270deg, transparent, ${C.green} 30%, ${C.green})`,
          boxShadow: `0 0 26px ${C.green}`,
          opacity: 1 - ramp(frame, l1.end + 0.6, l1.end + 1.1),
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: lerp(220, 64, markOut),
          right: lerp(540 - 300, 56, markOut),
          opacity: Math.min(markIn, 1) * (1 - 0.15 * markOut) * (1 - ramp(frame, line('L03').end + 0.35, line('L03').end + 0.45)),
          transform: `scale(${lerp(0.8, 1, Math.min(markIn, 1)) * lerp(1.2, 0.62, markOut)})`,
          transformOrigin: 'right top',
        }}
      >
        <SeriesMark scale={1} glow={big} />
      </div>
    </>
  );
};

const NameCard: React.FC = () => {
  const {frame} = useT();
  const l = line('L02');
  const p = life(frame, l.start, l.end + 0.8);
  const bar = ramp(frame, l.start, l.start + 0.5);
  const reveal = ramp(frame, l.start + 0.15, l.start + 0.9);
  return (
    <div style={{position: 'absolute', right: 56, top: 1150, opacity: p, transform: `translateX(${(1 - p) * 40}px)`, direction: 'rtl'}}>
      <Glass style={{padding: '26px 40px 26px 56px', display: 'flex', gap: 26, alignItems: 'center', borderRadius: 24}}>
        <div style={{width: 8, height: 120 * bar, background: C.green, borderRadius: 4, boxShadow: `0 0 18px ${C.green}`}} />
        <div style={{clipPath: `inset(0 0 0 ${100 - reveal * 100}%)`}}>
          <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 64, color: C.text}}>تميم الحارثي</div>
          <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.dim, marginTop: 6}}>زمالة الإعلام الرقمي السعودي</div>
        </div>
      </Glass>
    </div>
  );
};

const Award: React.FC = () => {
  const {frame} = useT();
  const l = line('L03');
  const p = life(frame, l.start - 0.1, l.end + 0.6);
  const flip = sp(frame, l.start, {damping: 16, stiffness: 90});
  const stampAt = wordAt('L03', 'المتميز') - 0.05;
  const stamp = sp(frame, stampAt, {damping: 13, stiffness: 260});
  const shake = Math.max(0, 1 - (frame / VIDEO.fps - stampAt) * 5) * (frame / VIDEO.fps > stampAt ? 1 : 0);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1060, height: 380, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: p, perspective: 1200}}>
      <div style={{transform: `rotateY(${(1 - flip) * 85}deg) translateX(${Math.sin(frame) * 6 * shake}px)`, display: 'flex', alignItems: 'center', gap: 34, direction: 'rtl'}}>
        <svg width={230} height={230} viewBox="0 0 230 230">
          <defs>
            <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffe08a" />
              <stop offset="0.5" stopColor="#d9a43a" />
              <stop offset="1" stopColor="#8a5a14" />
            </linearGradient>
          </defs>
          <circle cx={115} cy={115} r={96} fill="url(#gold)" />
          <circle cx={115} cy={115} r={78} fill="none" stroke="#fff6" strokeWidth={3} />
          {Array.from({length: 18}).map((_, i) => (
            <ellipse key={i} cx={115} cy={30} rx={7} ry={16} fill="#fff8" transform={`rotate(${i * 20 - 80} 115 115)`} opacity={i % 9 === 0 ? 0 : 0.6} />
          ))}
          <path d="M115 72 l13 27 30 4 -22 21 6 30 -27 -15 -27 15 6 -30 -22 -21 30 -4z" fill="#fff" opacity={0.92} />
        </svg>
        <div
          style={{
            transform: `scale(${lerp(1.8, 1, Math.min(stamp, 1.2))}) rotate(-6deg)`,
            opacity: Math.min(1, stamp * 1.4),
            border: `5px solid ${C.amber}`,
            color: C.amber,
            padding: '14px 26px',
            borderRadius: 16,
            fontFamily: F.head,
            fontWeight: 900,
            fontSize: 54,
            textShadow: `0 0 20px ${C.amber}88`,
            boxShadow: `0 0 30px ${C.amber}44, inset 0 0 20px ${C.amber}33`,
          }}
        >
          المشروع المتميز
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── the project & the decision ───────────────────────── */

const FeedToMiyar: React.FC = () => {
  const {frame} = useT();
  const l = line('L04');
  const p = life(frame, l.start - 0.1, l.end + 0.5);
  const order = ramp(frame, wordAt('L04', 'ضبط') - 0.1, wordAt('L04', 'ضبط') + 0.9, EASE.inOut);
  const N = 6;
  return (
    <>
      <SideTitle a={l.start} b={l.end + 0.5} kicker="مشروع التخرج" title="ضبط المحتوى الرقمي السعودي" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, height: 820, opacity: p}}>
        <div
          style={{
            position: 'absolute',
            left: 150,
            right: 150,
            top: 0,
            bottom: 0,
            borderRadius: 34,
            border: `3px solid ${C.green}`,
            opacity: order,
            boxShadow: `0 0 40px ${C.greenGlow}, inset 0 0 40px ${C.green}22`,
          }}
        />
        <div style={{position: 'absolute', top: -34, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: order}}>
          <div style={{background: C.green, color: '#04160c', fontFamily: F.head, fontWeight: 900, fontSize: 44, padding: '6px 34px', borderRadius: 14}}>معيار</div>
        </div>
        {Array.from({length: N}).map((_, i) => {
          const chaos = {x: (random(`cx${i}`) - 0.5) * 520, y: (random(`cy${i}`) - 0.5) * 700, r: (random(`cr${i}`) - 0.5) * 34};
          const neat = {x: 0, y: -330 + i * 128, r: 0};
          const k = interpolate(order, [i * 0.06, i * 0.06 + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
          const inP = sp(frame, l.start + i * 0.07, {damping: 20, stiffness: 120});
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${lerp(chaos.x, neat.x, k)}px, ${lerp(chaos.y, neat.y, k)}px) rotate(${lerp(chaos.r, neat.r, k)}deg) scale(${lerp(0.6, 1, Math.min(inP, 1)) * lerp(1, 0.9, k)})`,
                opacity: Math.min(1, inP),
              }}
            >
              <Post w={640} seed={`f${i}`} flag={k > 0.85 ? (i === 2 || i === 4 ? 'bad' : 'ok') : null} />
            </div>
          );
        })}
      </div>
    </>
  );
};

const PLANS = [
  {name: 'أساسي', price: '29'},
  {name: 'احترافي', price: '79'},
  {name: 'مؤسسات', price: '299'},
];

const PricingToOpen: React.FC = () => {
  const {frame} = useT();
  const l5 = line('L05');
  const l6 = line('L06');
  const p = life(frame, l5.start - 0.1, l6.start + 1.2);
  const strike = ramp(frame, l6.start + 0.05, l6.start + 0.6, EASE.inOut);
  const fall = ramp(frame, l6.start + 0.6, l6.start + 1.2, EASE.in);
  const unlockAt = wordAt('L06', 'مفتوح') - 0.05;
  const lockShow = life(frame, l6.start + 0.6, line('L07').start + 0.2);
  const open = sp(frame, unlockAt, {damping: 14, stiffness: 160});
  const open2 = ramp(frame, unlockAt + 0.2, unlockAt + 0.8);
  return (
    <>
      <SideTitle a={l5.start} b={l6.start + 0.4} kicker="الفكرة الأولى" title="منصة مقابل رسوم" color={C.amber} />
      <SideTitle a={l6.start + 0.4} b={line('L07').start + 0.2} kicker="القرار" title="مفتوح المصدر لكل سعودي" color={C.green} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', gap: 26, direction: 'rtl', opacity: p}}>
        {PLANS.map((pl, i) => {
          const inP = sp(frame, l5.start + 0.1 + i * 0.12, {damping: 18, stiffness: 140});
          const f = Math.max(0, fall - i * 0.08);
          return (
            <Glass key={pl.name} style={{width: 290, padding: '30px 22px', textAlign: 'center', transform: `translateY(${(1 - Math.min(inP, 1)) * 80 + f * 900}px) rotate(${f * (i - 1) * 18}deg)`, opacity: Math.min(1, inP) * (1 - f), filter: `blur(${f * 6}px)`}} tint={C.amber}>
              <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.dim}}>{pl.name}</div>
              <div style={{position: 'relative', display: 'inline-block', marginTop: 10}}>
                <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 84, color: C.text}}>{pl.price}</div>
                <div style={{position: 'absolute', left: -10, right: -10, top: '52%', height: 9, background: C.red, transform: `scaleX(${strike}) rotate(-8deg)`, transformOrigin: 'right center', borderRadius: 5, boxShadow: `0 0 14px ${C.red}`}} />
              </div>
              <div style={{fontFamily: F.body, fontSize: 26, color: C.dim}}>ر.س / شهريًا</div>
            </Glass>
          );
        })}
      </div>
      {/* the padlock opens */}
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: lockShow}}>
        <g transform="translate(540 1010)">
          <circle r={210} fill={C.green} opacity={0.08 * open2 + 0.04} />
          <circle r={210 + open2 * 120} fill="none" stroke={C.green} strokeWidth={3} opacity={(1 - open2) * 0.8} />
          <path
            d="M -70 -40 V -110 A 70 70 0 0 1 70 -110 V -40"
            fill="none"
            stroke={C.text}
            strokeWidth={26}
            strokeLinecap="round"
            transform={`translate(${70 * Math.min(open, 1)} ${-36 * Math.min(open, 1)}) rotate(${-28 * Math.min(open, 1)} 70 -40)`}
          />
          <rect x={-115} y={-40} width={230} height={190} rx={34} fill={open2 > 0.5 ? C.green : C.steel} style={{filter: `drop-shadow(0 0 ${30 * open2}px ${C.green})`}} />
          <text y={78} textAnchor="middle" fontFamily="monospace" fontWeight={700} fontSize={78} fill={open2 > 0.5 ? '#04160c' : C.ink}>
            {'</>'}
          </text>
        </g>
      </svg>
    </>
  );
};

/* ───────────────────────── the map & the people ───────────────────────── */

const [mx0, my0, mx1, my1] = MAP.bounds as [number, number, number, number];
const MW = mx1 - mx0;
const MH = my1 - my0;

const SaudiMap: React.FC = () => {
  const {frame, t} = useT();
  const l7 = line('L07');
  const l8 = line('L08');
  const show = life(frame, l7.start - 0.2, l8.end + 0.4, 0.4, 0.5);
  const draw = ramp(frame, l7.start - 0.1, l7.start + 1.4, EASE.inOut);
  const fill = ramp(frame, l7.start + 0.9, l7.start + 1.8);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  const scale = 900 / MW;
  const ox = 540 - (mx0 + MW / 2) * scale;
  const oy = 1030 - (my0 + MH / 2) * scale;
  const dots = 260;
  return (
    <>
      <SideTitle a={l7.start} b={l7.end + 0.3} kicker="مساهمة" title="لحماية وطننا الغالي" />
      <SideTitle a={l8.start} b={l8.end + 0.3} kicker="السلسلة تستهدف" title="كل مواطن عنده حساب" />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: show}}>
        <defs>
          <clipPath id="ksa">
            <path d={MAP.d} transform={`translate(${ox} ${oy}) scale(${scale})`} />
          </clipPath>
          <linearGradient id="ksaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.green} stopOpacity={0.32} />
            <stop offset="1" stopColor={C.green} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <path
          d={MAP.d}
          transform={`translate(${ox} ${oy}) scale(${scale})`}
          fill="url(#ksaFill)"
          fillOpacity={fill}
          stroke={C.green}
          strokeWidth={4 / scale}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={{filter: `drop-shadow(0 0 ${10 + 14 * pulse * fill}px ${C.green})`}}
        />
        {/* accounts light up across the country */}
        <g clipPath="url(#ksa)">
          {Array.from({length: dots}).map((_, i) => {
            const x = ox + (mx0 + random(`dx${i}`) * MW) * scale;
            const y = oy + (my0 + random(`dy${i}`) * MH) * scale;
            const at = l8.start + random(`dt${i}`) * (l8.end - l8.start) * 0.85;
            const on = ramp(frame, at, at + 0.35);
            const tw = 0.6 + 0.4 * Math.sin(t * 4 + i);
            return <circle key={i} cx={x} cy={y} r={4 + 3 * on} fill={C.text} opacity={on * tw * 0.85} />;
          })}
        </g>
        {[MAP.riyadh, MAP.jeddah, MAP.dammam].map((c, i) => {
          const x = ox + (c as number[])[0] * scale;
          const y = oy + (c as number[])[1] * scale;
          const on = ramp(frame, l8.start + 0.2 + i * 0.25, l8.start + 0.6 + i * 0.25);
          const ring = ((t * 0.8 + i * 0.33) % 1) * on;
          return (
            <g key={i} opacity={on}>
              <circle cx={x} cy={y} r={10} fill={C.green} />
              <circle cx={x} cy={y} r={10 + ring * 70} fill="none" stroke={C.green} strokeWidth={3} opacity={1 - ring} />
            </g>
          );
        })}
      </svg>
    </>
  );
};

const ShareRipple: React.FC = () => {
  const {frame, t} = useT();
  const l = line('L09');
  const show = life(frame, l.start - 0.1, l.end + 0.4);
  return (
    <>
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: show}}>
        {Array.from({length: 4}).map((_, i) => {
          const k = (((t - l.start) * 0.7 + i * 0.25) % 1 + 1) % 1;
          return <circle key={i} cx={540} cy={820} r={160 + k * 700} fill="none" stroke={C.green} strokeWidth={4 * (1 - k)} opacity={(1 - k) * 0.7} />;
        })}
        {Array.from({length: 10}).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2 + 0.3;
          const k = ramp(frame, l.start + 0.1 + i * 0.05, l.start + 1.3 + i * 0.05, EASE.out);
          const r = 230 + k * 520;
          const x = 540 + Math.cos(ang) * r;
          const y = 820 + Math.sin(ang) * r * 1.15;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`} opacity={k * (1 - ramp(frame, l.end - 0.2, l.end + 0.3))}>
              <path d="M -22 -12 L 14 0 L -22 12 L -12 0 Z" fill={C.green} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', top: 210, left: 60, right: 60, textAlign: 'center', direction: 'rtl', opacity: show}}>
        <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 60, color: C.text}}>
          ساعدوني <span style={{color: C.green}}>يوصل لكل سعودي</span>
        </div>
      </div>
    </>
  );
};

/* ───────────────────────── «you are the target» ───────────────────────── */

const CATS = ['سياسي', 'اجتماعي', 'رياضي', 'تعليمي', 'تاريخي', 'قصص', 'منتجات'];

const ContentTarget: React.FC = () => {
  const {frame, t} = useT();
  const l10 = line('L10');
  const l11 = line('L11');
  const l12 = line('L12');
  const l13 = line('L13');
  const show = life(frame, l10.start - 0.1, l13.end + 0.3);
  const collapse = ramp(frame, l13.start + 0.1, wordAt('L13', 'يستهدفك'), EASE.in);
  const postIn = sp(frame, l10.start, {damping: 20, stiffness: 130});
  const dim = 1 - 0.85 * ramp(frame, l12.start - 0.1, l12.start + 0.4) * (1 - ramp(frame, l12.end - 0.1, l12.end + 0.3));
  const cx = 540;
  const cy = 1010;
  return (
    <AbsoluteFill style={{opacity: show}}>
      <SideTitle a={l10.start} b={l11.end} kicker="أي محتوى" title="يتكلم عن السعودية" />
      <SideTitle a={l12.start} b={l12.end + 0.1} kicker="مهما كان" title="مصدره" />
      {/* the post */}
      <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${lerp(0.7, 1, Math.min(postIn, 1)) * (1 - collapse * 0.6)})`, opacity: Math.min(1, postIn) * (1 - collapse) * dim}}>
        <Post w={560} seed="main" tag="عن السعودية" />
      </div>
      {/* categories burst around it, each on its spoken word */}
      {CATS.map((c, i) => {
        const at = wordAt('L11', c) - 0.08;
        const k = sp(frame, at, {damping: 17, stiffness: 170});
        const ang = (-90 + (i - 3) * 30) * (Math.PI / 180) + (i % 2 ? 0.5 : -0.5) * Math.PI;
        const R = 330 + (i % 2) * 70;
        const x = cx + Math.cos(ang) * R * Math.min(k, 1.05);
        const y = cy + Math.sin(ang) * R * 0.9 * Math.min(k, 1.05);
        const tx = lerp(x, cx, collapse);
        const ty = lerp(y, cy, collapse);
        return (
          <div key={c} style={{position: 'absolute', left: tx, top: ty, transform: `translate(-50%, -50%) scale(${Math.min(k, 1.1) * (1 - collapse * 0.7)})`, opacity: Math.min(1, k) * (1 - collapse) * dim}}>
            <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 38, color: C.text, background: 'rgba(14,22,36,0.85)', border: `2px solid ${C.line}`, padding: '12px 26px', borderRadius: 40, display: 'flex', gap: 12, alignItems: 'center'}}>
              <span style={{width: 12, height: 12, borderRadius: 6, background: C.green, boxShadow: `0 0 10px ${C.green}`}} />
              {c}
            </div>
          </div>
        );
      })}
      {/* source toggles */}
      {[
        ['سعودي', 'غير سعودي'],
        ['رسمية', 'غير رسمية'],
        ['موثوقة', 'لا'],
      ].map(([a, b], i) => {
        const rowIn = sp(frame, l12.start + 0.1 + i * 0.35, {damping: 20, stiffness: 140});
        const flipAt = wordAt('L12', b === 'لا' ? 'أو لا' : b) - 0.05;
        const f = ramp(frame, flipAt, flipAt + 0.3, EASE.inOut);
        const out = ramp(frame, l12.end - 0.1, l12.end + 0.35, EASE.in);
        return (
          <div key={a} style={{position: 'absolute', left: 120, right: 120, top: 860 + i * 130, opacity: Math.min(1, rowIn) * (1 - out) * ramp(frame, l12.start, l12.start + 0.3), transform: `translateY(${(1 - Math.min(rowIn, 1)) * 30}px)`}}>
            <Glass style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 36px', direction: 'rtl', borderRadius: 60}}>
              <span style={{fontFamily: F.head, fontWeight: 800, fontSize: 40, color: f < 0.5 ? C.green : C.dim}}>{a}</span>
              <div style={{width: 130, height: 62, borderRadius: 31, background: f < 0.5 ? `${C.green}55` : `${C.red}55`, position: 'relative'}}>
                <div style={{position: 'absolute', top: 7, right: 7 + f * 68, width: 48, height: 48, borderRadius: 24, background: f < 0.5 ? C.green : C.red, boxShadow: `0 0 16px ${f < 0.5 ? C.green : C.red}`}} />
              </div>
              <span style={{fontFamily: F.head, fontWeight: 800, fontSize: 40, color: f >= 0.5 ? C.red : C.dim}}>{b}</span>
            </Glass>
          </div>
        );
      })}
      {/* everything turns into arrows aimed at the viewer */}
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: ramp(frame, l13.start + 0.2, l13.start + 0.5) * (1 - ramp(frame, l13.end + 0.05, l13.end + 0.35))}}>
        {Array.from({length: 16}).map((_, i) => {
          const ang = (i / 16) * Math.PI * 2;
          const k = ramp(frame, l13.start + 0.2 + random(`a${i}`) * 0.3, wordAt('L13', 'أنت') + 0.1, EASE.in);
          const r = lerp(900, 120, k);
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI + 180})`} opacity={0.9}>
              <line x1={-120} y1={0} x2={-10} y2={0} stroke={C.red} strokeWidth={5} opacity={0.5} />
              <path d="M -10 -16 L 18 0 L -10 16 Z" fill={C.red} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={60 + 30 * Math.sin(t * 10)} fill={C.red} opacity={0.25 * ramp(frame, wordAt('L13', 'أنت') - 0.1, wordAt('L13', 'أنت') + 0.2)} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy - 70, textAlign: 'center', fontFamily: F.head, fontWeight: 900, fontSize: 110, color: C.red, textShadow: `0 0 40px ${C.red}`, opacity: life(frame, wordAt('L13', 'يستهدفك') - 0.05, l13.end + 0.3, 0.2, 0.25), transform: `scale(${lerp(1.3, 1, ramp(frame, wordAt('L13', 'يستهدفك') - 0.05, wordAt('L13', 'يستهدفك') + 0.3))})`}}>
        يستهدفك أنت
      </div>
    </AbsoluteFill>
  );
};

const YouAreTarget: React.FC = () => {
  const {frame} = useT();
  const l = line('L14');
  const show = life(frame, l.start, l.end + 0.2);
  return (
    <>
      <Reticle cx={540} cy={800} a={l.start} b={l.end + 0.1} label="الهدف الرئيسي" />
      <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center', opacity: show}}>
        <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 130, color: C.text, letterSpacing: -1}}>
          إيه… <span style={{color: C.red, textShadow: `0 0 40px ${C.red}`}}>أنت</span>
        </div>
      </div>
    </>
  );
};

const WhoMadeIt: React.FC = () => {
  const {frame, t} = useT();
  const l = line('L15');
  const show = life(frame, l.start, l.end + 0.2);
  const glitch = Math.sin(t * 47) > 0.86 ? (random(`g${frame}`) - 0.5) * 18 : 0;
  const q = sp(frame, wordAt('L15', 'وش') - 0.1, {damping: 12, stiffness: 180});
  return (
    <div style={{position: 'absolute', top: 230, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: show}}>
      <Glass style={{width: 760, padding: '28px 34px', display: 'flex', alignItems: 'center', gap: 28, direction: 'rtl', transform: `translateX(${glitch}px)`}} tint={C.red}>
        <svg width={130} height={130} viewBox="0 0 130 130">
          <circle cx={65} cy={65} r={62} fill="#141c28" stroke={C.line} strokeWidth={2} />
          <circle cx={65} cy={50} r={22} fill="#2b3a4e" />
          <path d="M22 112 C 28 82, 102 82, 108 112 Z" fill="#2b3a4e" />
          <text x={65} y={86} textAnchor="middle" fontFamily={F.head} fontWeight={900} fontSize={70} fill={C.red} opacity={Math.min(1, q)} style={{filter: `drop-shadow(0 0 12px ${C.red})`}}>
            ؟
          </text>
        </svg>
        <div style={{flex: 1}}>
          <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 44, color: C.text}}>مين صنع المحتوى؟</div>
          <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 56, color: C.red, marginTop: 8, transform: `scale(${lerp(1.25, 1, Math.min(q, 1))})`, transformOrigin: 'right center', opacity: Math.min(1, q)}}>وش يبي منك؟</div>
        </div>
      </Glass>
    </div>
  );
};

const GoodOrBad: React.FC = () => {
  const {frame, t} = useT();
  const l = line('L16');
  const show = life(frame, l.start - 0.1, l.end + 0.3);
  const good = sp(frame, wordAt('L16', 'الخير') - 0.1, {damping: 18, stiffness: 140});
  const bad = sp(frame, wordAt('L16', 'شر') - 0.1, {damping: 18, stiffness: 140});
  const split = ramp(frame, l.start, l.start + 0.7, EASE.inOut);
  return (
    <AbsoluteFill style={{opacity: show}}>
      <SideTitle a={l.start} b={l.end + 0.3} kicker="يبون منك" title="أشياء كثيرة" />
      <div style={{position: 'absolute', top: 640, bottom: 470, right: 56, width: (1080 - 112) / 2 - 10, borderRadius: 30, background: `linear-gradient(180deg, ${C.green}33, ${C.green}0d)`, border: `2px solid ${C.green}88`, opacity: split * Math.min(1, good + 0.25), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={{transform: `scale(${Math.min(good, 1.1)})`}}>
          <circle cx={75} cy={75} r={66} fill={C.green} opacity={0.18} />
          <path d="M42 78 L66 100 L110 52" fill="none" stroke={C.green} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" style={{filter: `drop-shadow(0 0 12px ${C.green})`}} />
        </svg>
        <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 66, color: C.green, opacity: Math.min(1, good)}}>خير لك</div>
      </div>
      <div style={{position: 'absolute', top: 640, bottom: 470, left: 56, width: (1080 - 112) / 2 - 10, borderRadius: 30, background: `linear-gradient(180deg, ${C.red}33, ${C.red}0d)`, border: `2px solid ${C.red}88`, opacity: split * Math.min(1, bad + 0.25), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={{transform: `scale(${Math.min(bad, 1.1)}) translateX(${bad > 0.9 ? Math.sin(t * 40) * 2 : 0}px)`}}>
          <path d="M75 16 L140 128 H10 Z" fill={C.red} opacity={0.2} stroke={C.red} strokeWidth={8} strokeLinejoin="round" />
          <rect x={69} y={58} width={12} height={40} rx={6} fill={C.red} />
          <circle cx={75} cy={112} r={7} fill={C.red} />
        </svg>
        <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 66, color: C.red, opacity: Math.min(1, bad)}}>شر عليك</div>
      </div>
      {/* the digital border between them */}
      <div style={{position: 'absolute', top: 610 + (1 - split) * 420, bottom: 440 + (1 - split) * 420, left: 537, width: 6, borderRadius: 3, background: C.text, boxShadow: `0 0 24px ${C.text}`}} />
    </AbsoluteFill>
  );
};

const PHASES = ['قواعد الحدود الرقمية', 'فهم رسائلهم', 'صناعة رسائلنا', 'الإعلام وقت الأزمات', 'الوعي والأنظمة'];

const Roadmap: React.FC = () => {
  const {frame} = useT();
  const a = line('L17').start;
  const b = line('L18').end;
  const show = life(frame, a - 0.1, b + 0.35);
  const span = b - a;
  const drawn = ramp(frame, a + 0.1, a + span * 0.85, EASE.inOut);
  return (
    <AbsoluteFill style={{opacity: show}}>
      <SideTitle a={a} b={b + 0.35} kicker="السلسلة" title="خمس مراحل عملية" />
      <div style={{position: 'absolute', top: 660, right: 150, width: 6, height: 700 * drawn, background: `linear-gradient(180deg, ${C.green}, ${C.green}55)`, borderRadius: 3, boxShadow: `0 0 18px ${C.green}`}} />
      {PHASES.map((ph, i) => {
        const at = a + 0.2 + (span * 0.8 * i) / PHASES.length;
        const k = sp(frame, at, {damping: 18, stiffness: 150});
        return (
          <div key={ph} style={{position: 'absolute', top: 640 + i * 168, right: 112, display: 'flex', alignItems: 'center', gap: 30, direction: 'rtl', opacity: Math.min(1, k), transform: `translateX(${(1 - Math.min(k, 1)) * 60}px)`}}>
            <div style={{width: 82, height: 82, borderRadius: 41, background: C.ink, border: `4px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 900, fontSize: 40, color: C.green, boxShadow: `0 0 20px ${C.greenGlow}`}}>
              {i + 1}
            </div>
            <Glass style={{padding: '18px 30px', borderRadius: 20}}>
              <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 42, color: C.text}}>{ph}</div>
            </Glass>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Miyar: React.FC = () => {
  const {frame, t} = useT();
  const l = line('L19');
  const show = life(frame, l.start - 0.1, l.end + 0.4);
  const at = wordAt('L19', 'معيار') - 0.15;
  const k = sp(frame, at, {damping: 16, stiffness: 120});
  const needle = interpolate(ramp(frame, at + 0.3, at + 1.4, EASE.inOut), [0, 1], [-80, 55]);
  const open = ramp(frame, wordAt('L19', 'مفتوح') - 0.05, wordAt('L19', 'مفتوح') + 0.4);
  return (
    <AbsoluteFill style={{opacity: show}}>
      <SideTitle a={l.start} b={l.end + 0.4} kicker="مشروعي" title="مفتوح للجميع" />
      <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${lerp(0.85, 1, Math.min(k, 1))})`, opacity: Math.min(1, k)}}>
        <svg width={420} height={250} viewBox="0 0 420 250">
          <defs>
            <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={C.red} />
              <stop offset="0.5" stopColor={C.amber} />
              <stop offset="1" stopColor={C.green} />
            </linearGradient>
          </defs>
          <path d="M 40 220 A 170 170 0 0 1 380 220" fill="none" stroke="url(#gauge)" strokeWidth={26} strokeLinecap="round" />
          <g transform={`translate(210 220) rotate(${needle})`}>
            <path d="M -8 0 L 0 -150 L 8 0 Z" fill={C.text} />
          </g>
          <circle cx={210} cy={220} r={18} fill={C.text} />
        </svg>
        <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 150, color: C.text, marginTop: 6, textShadow: `0 0 40px ${C.greenGlow}`}}>معيار</div>
        <div style={{display: 'flex', gap: 22, marginTop: 20, opacity: open, transform: `translateY(${(1 - open) * 20}px)`, direction: 'rtl'}}>
          <div style={{fontFamily: 'monospace', fontWeight: 700, fontSize: 40, color: '#04160c', background: C.green, padding: '10px 22px', borderRadius: 14}}>{'</>'}</div>
          <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 42, color: C.green, border: `3px solid ${C.green}`, padding: '8px 26px', borderRadius: 14}}>مفتوح المصدر</div>
        </div>
        <div style={{display: 'flex', gap: 40, marginTop: 34, opacity: ramp(frame, wordAt('L19', 'يستخدمه') - 0.1, wordAt('L19', 'يستخدمه') + 0.4), direction: 'rtl'}}>
          {['يستخدمه', 'ويطوره'].map((w, i) => (
            <div key={w} style={{fontFamily: F.body, fontWeight: 700, fontSize: 38, color: C.text, display: 'flex', alignItems: 'center', gap: 12}}>
              <span style={{width: 40, height: 40, borderRadius: 20, border: `3px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green, fontWeight: 900, transform: `rotate(${(t * 60 + i * 45) % 360}deg)`}}>+</span>
              {w}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── end ───────────────────────── */

const EndCard: React.FC = () => {
  const {frame, t} = useT();
  const l = line('L20');
  const show = ramp(frame, l.start - 0.1, l.start + 0.5);
  const take = ramp(frame, l.end + 0.2, l.end + 0.9, EASE.inOut);
  const chip = sp(frame, l.start + 0.5, {damping: 18, stiffness: 140});
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(80% 50% at 50% 45%, ${C.night}, ${C.ink})`, opacity: take}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: lerp(190, 760, take), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: show}}>
        <div style={{transform: `scale(${lerp(1.1, 1.5, take)})`}}>
          <SeriesMark scale={1.2} glow={0.6 + 0.4 * Math.sin(t * 3)} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl', opacity: Math.min(1, chip), transform: `translateY(${(1 - Math.min(chip, 1)) * 30}px)`}}>
          <Glass style={{padding: '16px 30px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 14}} tint={C.green}>
            <span style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.dim}}>الحلقة القادمة</span>
            <span style={{fontFamily: F.head, fontWeight: 900, fontSize: 42, color: C.green}}>معيار</span>
          </Glass>
          <Glass style={{padding: '16px 26px', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 12}}>
            <svg width={34} height={34} viewBox="0 0 24 24" style={{transform: `rotate(${Math.sin(t * 9) * 14 * (1 - take)}deg)`}}>
              <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm0 18a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 21z" fill={C.text} />
            </svg>
            <span style={{fontFamily: F.head, fontWeight: 800, fontSize: 36, color: C.text}}>تابعوني</span>
          </Glass>
        </div>
      </div>
    </>
  );
};

/** all graphics layers of HR-E01, above the footage */
export const Graphics: React.FC = () => {
  const {t} = useT();
  const v = Math.min(1, layoutAt(LINES, t));
  const after = t > line('L03').end + 0.4 && t < TOTAL - 2;
  return (
    <AbsoluteFill>
      <Hook />
      <NameCard />
      <Award />
      <FeedToMiyar />
      <PricingToOpen />
      <SaudiMap />
      <ShareRipple />
      <ContentTarget />
      <YouAreTarget />
      <WhoMadeIt />
      <GoodOrBad />
      <Roadmap />
      <Miyar />
      <EndCard />
      {/* small series watermark on the full shot */}
      {after && (
        <div style={{position: 'absolute', top: 64, right: 56, opacity: 0.85 * (1 - v), transform: 'scale(0.62)', transformOrigin: 'right top'}}>
          <SeriesMark scale={1} glow={0.4} />
        </div>
      )}
    </AbsoluteFill>
  );
};
