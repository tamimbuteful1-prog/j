import React from 'react';
import {Img, staticFile} from 'remotion';
import mapData from '../../lib/saudi-map.json';
import {Emblem} from '../DBS/icons';

/** Realistic investigation props. Everything sits on a 3D plane (desk or wall); sizes are in plane px. */
export const NASKH = "'Noto Naskh Arabic', serif";
export const RUQAA = "'Aref Ruqaa', 'Noto Naskh Arabic', serif";
export const SANS = "'IBM Plex Sans Arabic', sans-serif";
export const INK = '#1c1d22';
export const RED_INK = '#b3121f';
const MAP = mapData as unknown as {d: string};

type Box = {x: number; y: number; w: number; h: number; r?: number; z?: number; o?: number; children?: React.ReactNode; style?: React.CSSProperties};

/** a physical object on the plane: rotation, lift (z) with a cast shadow that grows/blurs with height */
export const Obj: React.FC<Box & {shadow?: number; radius?: number}> = ({x, y, w, h, r = 0, z = 0, o = 1, shadow = 1, radius = 2, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      opacity: o,
      transform: `translate(${-z * 0.35}px, ${-z * 0.6}px) rotate(${r}deg) scale(${1 + z / 1400})`,
      borderRadius: radius,
      boxShadow: shadow
        ? `${4 + z * 0.35}px ${6 + z * 0.6}px ${6 + z * 0.5}px rgba(0,0,0,${0.55 * shadow}), ${18 + z * 0.4}px ${28 + z * 0.7}px ${50 + z}px rgba(0,0,0,${0.45 * shadow})`
        : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

/** a sheet of paper with real fibre texture and soft edge darkening */
export const Paper: React.FC<{children?: React.ReactNode; tint?: string; style?: React.CSSProperties}> = ({children, tint, style}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', backgroundImage: `url(${staticFile('tex/paper.jpg')})`, backgroundSize: 'cover', ...style}}>
    {tint && <div style={{position: 'absolute', inset: 0, background: tint, mixBlendMode: 'multiply'}} />}
    {children}
    {/* subtle fold + light falloff across the sheet */}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(0,0,0,0.05), transparent 30%, transparent 70%, rgba(0,0,0,0.07)), linear-gradient(180deg, transparent 49.6%, rgba(0,0,0,0.05) 50%, rgba(255,255,255,0.06) 50.4%, transparent 51%)', pointerEvents: 'none'}} />
  </div>
);

/** printed ink: slightly soft, slightly uneven */
export const ink = (size: number, weight = 400, color = INK, family = NASKH): React.CSSProperties => ({fontFamily: family, fontSize: size, fontWeight: weight, color, lineHeight: 1.75, direction: 'rtl', textShadow: `0 0 0.6px ${color}`});

export const Bars: React.FC<{n: number; w?: number; gap?: number; h?: number; color?: string; blur?: number; widths?: number[]}> = ({n, w = 100, gap = 30, h = 10, color = '#9a9a9a', blur = 0.8, widths}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: gap - h, alignItems: 'flex-end', filter: `blur(${blur}px)`}}>
    {Array.from({length: n}).map((_, i) => (
      <div key={i} style={{width: `${widths ? widths[i % widths.length] : i % 4 === 3 ? w * 0.6 : w}%`, height: h, borderRadius: h / 2, background: color}} />
    ))}
  </div>
);

/** push pin */
export const Pin: React.FC<{x: number; y: number; c?: string}> = ({x, y, c = '#c8202d'}) => (
  <div style={{position: 'absolute', left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: 16, background: `radial-gradient(circle at 35% 30%, #ff8a8a, ${c} 45%, #5a070d)`, boxShadow: '6px 10px 8px rgba(0,0,0,0.55)'}} />
);

/** clear plastic evidence bag with a phone inside and a printed chain-of-custody label */
export const EvidenceBag: React.FC<{screen: number; border: number}> = ({screen, border}) => (
  <div style={{position: 'absolute', inset: 0}}>
    {/* phone */}
    <div style={{position: 'absolute', left: 90, top: 260, width: 380, height: 780, borderRadius: 58, background: 'linear-gradient(135deg, #2b2f36, #0b0c0f 60%)', boxShadow: '10px 16px 24px rgba(0,0,0,0.6), inset 0 0 0 3px #3a3f48'}}>
      <div style={{position: 'absolute', inset: 14, borderRadius: 46, overflow: 'hidden', background: '#020304'}}>
        <div style={{position: 'absolute', inset: 0, opacity: screen, background: 'radial-gradient(120% 80% at 50% 30%, #13283f, #050a12)'}}>
          <div style={{...ink(84, 300, '#e8f0f8', SANS), position: 'absolute', top: 70, width: '100%', textAlign: 'center', letterSpacing: 2, direction: 'ltr', lineHeight: 1}}>9:41</div>
          <svg viewBox="0 0 1000 1000" style={{position: 'absolute', left: 30, top: 210, width: 292, height: 292}}>
            <path d={MAP.d} fill="rgba(116,227,176,0.08)" stroke="#74e3b0" strokeWidth={9} strokeDasharray={5200} strokeDashoffset={5200 * (1 - border)} style={{filter: 'drop-shadow(0 0 14px #74e3b0)'}} />
          </svg>
          <div style={{position: 'absolute', left: 120, right: 120, bottom: 22, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.6)'}} />
        </div>
      </div>
    </div>
    {/* plastic: haze, creases, specular streaks */}
    <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(115deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.16) 47%, rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.08) 80%)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18), inset 0 0 40px rgba(255,255,255,0.06)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 46, background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))', borderBottom: '6px solid #b3121f'}} />
    {/* custody label */}
    <div style={{position: 'absolute', left: 30, right: 30, top: 66, height: 170, background: '#f3f1ea', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', padding: '10px 22px'}}>
      <div style={{...ink(30, 700), display: 'flex', justifyContent: 'space-between'}}>
        <span>حِرز رقمي</span>
        <span style={{color: RED_INK}}>قضية ٣٤</span>
      </div>
      <div style={{...ink(20), lineHeight: 1.65, borderTop: `2px solid ${INK}`, paddingTop: 4}}>
        نوع الدليل: جهاز جوال
        <br />
        الموقع: الحدود الرقمية للوطن
      </div>
    </div>
  </div>
);

/** النظام الأساسي للحكم — page with Article 34 (the sharp line); neighbours fall out of focus */
export const BasicLaw: React.FC<{hl: number}> = ({hl}) => (
  <Paper>
    <div style={{position: 'absolute', inset: '70px 80px', direction: 'rtl'}}>
      <div style={{...ink(26), textAlign: 'center', opacity: 0.85}}>المملكة العربية السعودية</div>
      <div style={{...ink(52, 700), textAlign: 'center', lineHeight: 1.4}}>النظام الأساسي للحكم</div>
      <div style={{...ink(20), textAlign: 'center', opacity: 0.7}}>الصادر بالأمر الملكي رقم (أ/٩٠) وتاريخ ٢٧/٨/١٤١٢هـ</div>
      <div style={{height: 2, background: INK, opacity: 0.6, margin: '22px 0'}} />
      <div style={{...ink(34, 700), textAlign: 'center'}}>الباب الخامس: الحقوق والواجبات</div>
      <div style={{marginTop: 30}}>
        <Bars n={4} h={14} gap={44} color="#6d6b66" blur={2.2} />
      </div>
      <div style={{position: 'relative', marginTop: 40}}>
        <div style={{...ink(38, 700)}}>المادة الرابعة والثلاثون</div>
        <div style={{position: 'relative', ...ink(38), lineHeight: 1.9}}>
          {/* highlighter swipe (multiply, slightly uneven) */}
          <div style={{position: 'absolute', right: -8, top: 8, height: 62, width: `${Math.min(1, hl * 2) * 103}%`, background: 'rgba(255,224,60,0.7)', mixBlendMode: 'multiply', borderRadius: 6, filter: 'blur(0.6px)'}} />
          <div style={{position: 'absolute', right: -8, top: 80, height: 62, width: `${Math.max(0, hl * 2 - 1) * 70}%`, background: 'rgba(255,224,60,0.7)', mixBlendMode: 'multiply', borderRadius: 6, filter: 'blur(0.6px)'}} />
          <span style={{position: 'relative'}}>الدفاع عن العقيدة الإسلامية، والمجتمع، والوطن واجب على كل مواطن. ويبين النظام أحكام الخدمة العسكرية.</span>
        </div>
      </div>
      <div style={{marginTop: 40}}>
        <Bars n={7} h={14} gap={44} color="#6d6b66" blur={3} />
      </div>
    </div>
  </Paper>
);

/** a printed screenshot of a social post, pinned as evidence, with a marker note */
export const PostPrint: React.FC<{note: string; hue: number}> = ({note, hue}) => (
  <Paper>
    <div style={{position: 'absolute', inset: 26, background: '#fbfbfa', border: '1px solid #ddd'}}>
      <div style={{position: 'absolute', right: 20, top: 20, width: 64, height: 64, borderRadius: 32, background: '#8b8f96', filter: 'blur(3px)'}} />
      <div style={{position: 'absolute', right: 100, top: 26, width: 220}}>
        <Bars n={2} h={14} gap={30} color="#55595f" blur={1.6} widths={[100, 60]} />
      </div>
      <div style={{position: 'absolute', left: 22, right: 22, top: 110}}>
        <Bars n={3} h={12} gap={28} color="#777" blur={2} />
      </div>
      <div style={{position: 'absolute', left: 22, right: 22, top: 210, bottom: 70, borderRadius: 10, background: `linear-gradient(135deg, hsl(${hue} 30% 40%), hsl(${hue + 30} 25% 22%))`, filter: 'blur(2px) saturate(0.7)'}} />
      <div style={{position: 'absolute', left: 22, right: 22, bottom: 24, display: 'flex', justifyContent: 'space-around', filter: 'blur(1.4px)'}}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{width: 40, height: 12, borderRadius: 6, background: '#999'}} />
        ))}
      </div>
    </div>
    <div style={{...ink(64, 700, RED_INK, RUQAA), position: 'absolute', left: 30, top: -6, transform: 'rotate(-6deg)'}}>{note}</div>
  </Paper>
);

/** the target: a polaroid of "you", lit by your own phone */
export const YouPolaroid: React.FC<{circle: number; word: number}> = ({circle, word}) => (
  <div style={{position: 'absolute', inset: 0, background: '#f4f2ec'}}>
    <div style={{position: 'absolute', left: 26, right: 26, top: 26, height: '74%', overflow: 'hidden', background: 'radial-gradient(60% 50% at 50% 62%, #2b4562, #070a10 75%)'}}>
      <svg viewBox="0 0 300 300" style={{width: '100%', height: '100%', filter: 'blur(2.5px)'}}>
        <circle cx={150} cy={118} r={46} fill="#0c1118" />
        <path d="M 66 300 C 70 210, 110 180, 150 180 C 190 180, 230 210, 234 300 Z" fill="#0c1118" />
        <ellipse cx={150} cy={140} rx={36} ry={30} fill="#6fa6d8" opacity={0.35} />
        <rect x={134} y={198} width={32} height={50} rx={5} fill="#cfe6ff" />
      </svg>
    </div>
    <div style={{...ink(78, 700, RED_INK, RUQAA), position: 'absolute', bottom: 6, width: '100%', textAlign: 'center', opacity: word}}>أنت</div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', left: -60, top: -50, width: 'calc(100% + 120px)', height: 'calc(100% + 100px)', overflow: 'visible'}}>
      <path d="M 52 3 C 90 4, 99 30, 97 55 C 95 85, 70 98, 45 97 C 15 96, 2 75, 3 48 C 4 20, 25 5, 58 6" fill="none" stroke={RED_INK} strokeWidth={1.3} strokeLinecap="round" strokeDasharray={300} strokeDashoffset={300 * (1 - circle)} vectorEffect="non-scaling-stroke" style={{strokeWidth: 9}} />
    </svg>
  </div>
);

/** ruled index card: an episode's file, its tactic still redacted */
export const IndexCard: React.FC<{title: string}> = ({title}) => (
  <div style={{position: 'absolute', inset: 0, background: '#fbfaf5', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 46px, rgba(70,120,190,0.35) 46px 48px)', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.06)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 70, height: 3, background: 'rgba(200,40,50,0.55)'}} />
    <div style={{...ink(52, 700, '#13306b', RUQAA), position: 'absolute', top: 60, width: '100%', textAlign: 'center'}}>{title}</div>
    <div style={{position: 'absolute', right: 60, left: 60, top: 220, height: 56, background: '#111', transform: 'rotate(-1deg)'}} />
    <div style={{position: 'absolute', right: 60, left: 200, top: 310, height: 44, background: '#111', transform: 'rotate(0.6deg)'}} />
  </div>
);

/** handwritten scribble line (unreadable at this distance, like real handwriting out of focus) */
const Scribble: React.FC<{w: number; seed: number}> = ({w, seed}) => {
  let d = 'M 600 20';
  for (let x = 600; x > 600 - w * 6; x -= 9) {
    const r = Math.sin(x * 0.37 + seed) * 7 + Math.sin(x * 0.11 + seed * 2) * 5;
    d += ` L ${x} ${20 + r}`;
  }
  return (
    <svg viewBox="0 0 600 40" style={{width: '100%', height: 34, display: 'block', filter: 'blur(0.8px)'}}>
      <path d={d} fill="none" stroke="#1d3fa0" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** a case sheet per episode: the tactic, how it works, the right response — filled in by hand */
export const DefensePlan: React.FC<{checks: number[]}> = ({checks}) => {
  const f = (i: number) => checks[i] ?? 0;
  const Field: React.FC<{label: string; i: number; children: React.ReactNode}> = ({label, i, children}) => (
    <div style={{marginBottom: 34}}>
      <div style={ink(34, 700)}>{label}</div>
      <div style={{position: 'relative', minHeight: 70, borderBottom: `2px dashed ${INK}`, opacity: 0.95}}>
        <div style={{clipPath: `inset(0 0 0 ${(1 - f(i)) * 100}%)`}}>{children}</div>
      </div>
    </div>
  );
  return (
    <Paper>
      <div style={{position: 'absolute', inset: '60px 70px'}}>
        <div style={{...ink(56, 700), textAlign: 'center'}}>ملف الحلقة</div>
        <div style={{height: 3, background: INK, margin: '10px 0 34px'}} />
        <Field label="الأسلوب:" i={0}>
          <div style={{paddingTop: 18}}>
            <Scribble w={100} seed={1} />
            <Scribble w={68} seed={4} />
          </div>
        </Field>
        <Field label="التصرف الأنسب للدفاع:" i={2}>
          <div style={{paddingTop: 18}}>
            <Scribble w={94} seed={7} />
            <Scribble w={52} seed={9} />
          </div>
        </Field>
        <svg viewBox="0 0 120 120" style={{position: 'absolute', left: 0, bottom: 0, width: 150, height: 150}}>
          <circle cx={60} cy={60} r={50} fill="none" stroke={RED_INK} strokeWidth={6} strokeDasharray={320} strokeDashoffset={320 * (1 - f(3))} />
          <path d="M 36 62 L 54 80 L 86 40" fill="none" stroke={RED_INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={90} strokeDashoffset={90 * (1 - f(3))} />
        </svg>
      </div>
    </Paper>
  );
};

/** manila case folder; cover swings open (spine on the right, RTL) to reveal the initiative sheet */
export const Folder: React.FC<{open: number; stamp: number}> = ({open, stamp}) => (
  <div style={{position: 'absolute', inset: 0, perspective: 2200}}>
    <div style={{position: 'absolute', inset: 0, backgroundImage: `url(${staticFile('tex/manila.jpg')})`, backgroundSize: 'cover', borderRadius: 10, boxShadow: 'inset 0 0 40px rgba(80,50,10,0.25)'}} />
    {/* the sheet inside */}
    <div style={{position: 'absolute', left: 40, right: 40, top: 40, bottom: 40}}>
      <Paper>
        <div style={{position: 'absolute', inset: '70px 70px', textAlign: 'center'}}>
          <div style={{...ink(30), opacity: 0.75}}>مبادرة</div>
          <div style={{...ink(70, 700), lineHeight: 1.35}}>جندي على الحدود الرقمية</div>
          <div style={{height: 2, background: INK, opacity: 0.5, margin: '26px 60px'}} />
          <div style={{...ink(32), lineHeight: 1.8}}>مبادرة تمنح المواطن معرفة بأساليب الأعداء الهجومية، وتقترح خططًا دفاعية فعّالة.</div>
          <svg viewBox="-260 -260 520 520" style={{width: 300, height: 300, marginTop: 30}}>
            <Emblem draw={1} glow={0.05} />
          </svg>
        </div>
        {/* rubber stamp */}
        <div style={{position: 'absolute', left: 70, bottom: 70, width: 260, height: 260, opacity: stamp * 0.85, transform: `rotate(-14deg) scale(${1 + (1 - stamp) * 0.4})`, mixBlendMode: 'multiply'}}>
          <svg viewBox="-130 -130 260 260" style={{width: '100%', height: '100%'}}>
            <defs>
              <path id="stampArc" d="M -92 0 A 92 92 0 1 1 92 0 A 92 92 0 1 1 -92 0" />
            </defs>
            <circle r={120} fill="none" stroke={RED_INK} strokeWidth={8} />
            <circle r={70} fill="none" stroke={RED_INK} strokeWidth={4} />
            <text style={{fontFamily: NASKH, fontWeight: 700, fontSize: 30}} fill={RED_INK}>
              <textPath href="#stampArc" startOffset="0">جندي على الحدود الرقمية ✦ الوعي والأنظمة ✦</textPath>
            </text>
            <text y={14} textAnchor="middle" style={{fontFamily: NASKH, fontWeight: 700, fontSize: 40}} fill={RED_INK}>٣٤</text>
          </svg>
        </div>
      </Paper>
    </div>
    {/* cover */}
    <div style={{position: 'absolute', inset: 0, transformOrigin: '100% 50%', transform: `rotateY(${open * 165}deg)`, transformStyle: 'preserve-3d'}}>
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', backgroundImage: `url(${staticFile('tex/manila.jpg')})`, backgroundSize: 'cover', borderRadius: 10, boxShadow: '0 0 0 2px rgba(120,90,40,0.4)'}}>
        <div style={{position: 'absolute', left: 60, top: -46, width: 300, height: 60, borderRadius: '12px 12px 0 0', backgroundImage: `url(${staticFile('tex/manila.jpg')})`}} />
        <div style={{position: 'absolute', left: 90, top: 120, width: 420, height: 150, background: '#f3f0e6', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', padding: '18px 28px'}}>
          <div style={{...ink(28), opacity: 0.7}}>ملف المبادرة</div>
          <div style={{...ink(40, 700, INK, RUQAA)}}>الحدود الرقمية</div>
        </div>
      </div>
      <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', backgroundImage: `url(${staticFile('tex/manila.jpg')})`, backgroundSize: 'cover', filter: 'brightness(0.8)', borderRadius: 10}} />
    </div>
  </div>
);

/** stamped metal ID tag on a ball chain */
export const DogTag: React.FC = () => (
  <div style={{position: 'absolute', inset: 0}}>
    <svg viewBox="0 0 600 400" style={{position: 'absolute', left: -260, top: -140, width: 700, height: 470, overflow: 'visible'}}>
      {Array.from({length: 46}).map((_, i) => {
        const a = i / 46;
        const x = 300 + Math.cos(a * Math.PI * 1.6 + 2.2) * 260 - a * 60;
        const y = 150 + Math.sin(a * Math.PI * 1.6 + 2.2) * 120 + a * 40;
        return <circle key={i} cx={x} cy={y} r={7} fill="url(#ball)" />;
      })}
      <defs>
        <radialGradient id="ball" cx="35%" cy="30%">
          <stop offset="0" stopColor="#f4f6f8" />
          <stop offset="0.5" stopColor="#9aa0a8" />
          <stop offset="1" stopColor="#3c4048" />
        </radialGradient>
      </defs>
    </svg>
    <div style={{position: 'absolute', inset: 0, borderRadius: 70, backgroundImage: `url(${staticFile('tex/metal.jpg')})`, backgroundSize: 'cover', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.35), inset 0 0 0 10px rgba(0,0,0,0.25), inset 0 -20px 40px rgba(0,0,0,0.25)'}}>
      <div style={{position: 'absolute', right: 40, top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, background: '#0d0f12', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.5)'}} />
      <div style={{position: 'absolute', right: 120, left: 40, top: 60, textAlign: 'center'}}>
        {[['جندي على', 54], ['الحدود الرقمية', 54], ['الوعي · الأنظمة', 30]].map(([s, sz], i) => (
          <div key={i} style={{fontFamily: NASKH, fontWeight: 700, fontSize: sz as number, lineHeight: 1.45, color: '#5b6068', textShadow: '1px 1px 0 rgba(255,255,255,0.75), -1px -1px 0 rgba(0,0,0,0.45)'}}>{s}</div>
        ))}
      </div>
    </div>
  </div>
);

/** tablet running «معيار»: a draft is scanned, flagged lines tie to the regulations, fixes are suggested */
export const MiyarTablet: React.FC<{on: number; scan: number; refs: number; fix: number}> = ({on, scan, refs, fix}) => {
  const lines = [0, 1, 2, 3, 4, 5];
  const bad = [1, 4];
  return (
    <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: 'linear-gradient(135deg, #2a2d33, #0c0d10)', boxShadow: 'inset 0 0 0 3px #3b3f46'}}>
      <div style={{position: 'absolute', inset: 30, borderRadius: 22, overflow: 'hidden', background: '#020304'}}>
        <div style={{position: 'absolute', inset: 0, opacity: on, background: '#0b1522', direction: 'rtl', fontFamily: SANS}}>
          <div style={{height: 84, background: '#0f2033', display: 'flex', alignItems: 'center', gap: 16, padding: '0 30px', borderBottom: '1px solid #24435b'}}>
            <svg viewBox="-130 -240 260 480" style={{width: 36, height: 66}}>
              <Emblem draw={1} glow={0.05} />
            </svg>
            <div style={{color: '#e8f0f8', fontSize: 38, fontWeight: 700}}>معيار</div>
            <div style={{color: '#afc3d6', fontSize: 22}}>راجع منشورك قبل النشر</div>
            <div style={{marginRight: 'auto', border: '1px solid #74e3b0', color: '#74e3b0', fontSize: 18, padding: '2px 14px', borderRadius: 20}}>مفتوح المصدر</div>
          </div>
          <div style={{position: 'absolute', top: 110, right: 30, width: 560, bottom: 30, borderRadius: 16, background: '#0c1928', border: '1px solid #24435b', padding: 26}}>
            <div style={{color: '#afc3d6', fontSize: 20, marginBottom: 18}}>المسودة</div>
            {lines.map((i) => {
              const isBad = bad.includes(i);
              const lit = isBad ? Math.min(1, Math.max(0, (scan - i / 6) * 8)) : 0;
              const col = isBad ? (fix > 0.5 ? '#74e3b0' : `rgba(255,195,135,${0.35 + 0.65 * lit})`) : '#3a5068';
              return <div key={i} style={{height: 16, borderRadius: 8, marginBottom: 30, width: `${[96, 88, 92, 70, 94, 60][i]}%`, background: col, boxShadow: isBad && lit > 0 ? `0 0 16px ${fix > 0.5 ? '#74e3b0' : '#ffc387'}` : 'none'}} />;
            })}
            <div style={{position: 'absolute', left: 0, right: 0, top: 60 + scan * 280, height: 4, background: '#78c4fc', boxShadow: '0 0 24px 6px rgba(120,196,252,0.6)', opacity: scan > 0 && scan < 1 ? 1 : 0}} />
          </div>
          <div style={{position: 'absolute', top: 110, left: 30, right: 620, bottom: 30, display: 'flex', flexDirection: 'column', gap: 16}}>
            {[0, 1].map((k) => (
              <div key={k} style={{flex: 1, borderRadius: 16, background: '#0f2033', border: `1px solid ${fix > 0.5 ? '#74e3b0' : '#ffc387'}`, padding: 18, opacity: refs, transform: `translateX(${(1 - refs) * -40}px)`}}>
                <div style={{color: fix > 0.5 ? '#74e3b0' : '#ffc387', fontSize: 20, fontWeight: 700}}>{fix > 0.5 ? 'بديل مقترح' : 'ملاحظة'}</div>
                <div style={{color: '#afc3d6', fontSize: 16, margin: '6px 0 12px'}}>المرجع: الأنظمة الإعلامية السعودية</div>
                <div style={{height: 10, borderRadius: 5, background: '#2a4058', marginBottom: 10}} />
                <div style={{height: 10, borderRadius: 5, background: '#2a4058', width: '70%'}} />
              </div>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0.09), transparent 35%, transparent 70%, rgba(255,255,255,0.04))'}} />
      </div>
    </div>
  );
};

/** a glossy photo print of a real image */
export const PhotoPrint: React.FC<{src: string; border?: number}> = ({src, border = 18}) => (
  <div style={{position: 'absolute', inset: 0, background: '#f7f7f4', padding: border}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(125deg, rgba(255,255,255,0.18), transparent 30%, transparent 75%, rgba(255,255,255,0.08))'}} />
  </div>
);

export const StickyNote: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #ffe680, #f7d84a)', boxShadow: 'inset 0 -30px 40px rgba(160,120,0,0.18)'}}>
    <div style={{...ink(52, 700, '#1b2f6b', RUQAA), position: 'absolute', top: 40, width: '100%', textAlign: 'center', lineHeight: 1.35, whiteSpace: 'pre-line'}}>{text}</div>
    <svg viewBox="0 0 100 100" style={{position: 'absolute', left: '40%', bottom: 18, width: 70, height: 70}}>
      <path d="M 50 8 C 46 40, 54 60, 50 88 M 30 66 L 50 90 L 70 64" fill="none" stroke="#1b2f6b" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const BusinessCard: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: '#fbfbf8', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)'}}>
    <div style={{position: 'absolute', right: 50, top: 60}}>
      <div style={{...ink(64, 700), lineHeight: 1.3}}>تميم الحارثي</div>
      <div style={{...ink(28), opacity: 0.8}}>زمالة الإعلام الرقمي · مشروع «معيار» المتميّز</div>
      <div style={{height: 3, width: 120, background: '#1a9a64', margin: '22px 0 18px'}} />
      <div style={{...ink(30, 700)}}>مبادرة جندي على الحدود الرقمية</div>
    </div>
    <svg viewBox="-260 -260 520 520" style={{position: 'absolute', left: 40, top: 70, width: 220, height: 220}}>
      <Emblem draw={1} glow={0.05} />
    </svg>
  </div>
);
