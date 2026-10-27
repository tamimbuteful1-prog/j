import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useScene, useTimeline} from '../../timeline/context';
import {StudioBackdrop, Spotlight} from '../../kit/Backdrop';
import {Eyebrow, KineticLine} from '../../kit/Type';
import {Outro} from '../../kit/Outro';
import {COLORS, FONTS} from '../../kit/theme';
import {EASE, clamp01, kf, mix, pop, ramp, shake, wobble} from '../../kit/anim';
import {Coupon, NumberLine} from '../../worlds/checkout';
import {OfferBoard, Receipt, RestaurantWall, type ReceiptLine} from '../../worlds/restaurant';
import {LIGHT} from '../../kit/theme';
import {ConditionStage, Nota} from './stage';

/** This episode is light-themed (index.ts → theme: 'light'). */
const PAL = LIGHT;
const AND_C = '#7C5CE0';

const FPS = 30;

/** Fade a scene in over the 0.3 s overlap with the previous one (non-stage scenes). */
const FadeIn: React.FC<{children: React.ReactNode; d?: number}> = ({children, d = 0.3}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: ramp(frame, 0, d, EASE.inOut)}}>{children}</AbsoluteFill>;
};

// ── S01 — the offer on the wall ─────────────────────────────────────
export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat, duration} = useScene();
  const push = 1 + 0.06 * ramp(frame, 0, duration, EASE.inOut);
  const ap = pop(frame, beat('poster'), {damping: 13, stiffness: 120});
  const g = (k: string) => ramp(frame, beat(k), beat(k) + 0.35) * (1 - 0.4 * ramp(frame, beat(k) + 1.2, beat(k) + 2));
  return (
    <FadeIn>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 45%'}}>
        <RestaurantWall frame={frame} />
        <OfferBoard x={540} y={800} appear={clamp01(ap)} ifGlow={g('ifWord')} thenGlow={g('thenWord')} dealGlow={g('discountWord')} p={PAL.p} q={PAL.q} rotate={Math.sin(frame / 22) * 0.8} />
      </AbsoluteFill>
    </FadeIn>
  );
};

const ORDER: ReceiptLine[] = [
  {name: 'برجر', price: 22},
  {name: 'بطاطس', price: 10},
  {name: 'مشروب', price: 8},
  {name: 'صوص', price: 4},
  {name: 'آيس كريم', price: 6},
];

// ── S02 — 50.00 exactly, no discount ───────────────────────────────
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  // printing has a fixed length (1.6 s) so it always matches the printer sound
  const printed = kf(frame, [beat('printStart'), beat('printStart') + 1.6], [0.12, 1], EASE.inOut);
  let count = 0;
  ORDER.forEach((it, i) => (count += it.price * clamp01(printed * (ORDER.length + 2.6) - 1.6 - i)));
  const exact = ramp(frame, beat('exact'), beat('exact') + 0.3) * (1 - ramp(frame, beat('exact') + 0.6, beat('exact') + 1));
  const denied = ramp(frame, beat('denied'), beat('denied') + 0.25);
  const why = pop(frame, beat('why'), {damping: 9, stiffness: 180});
  const appear = pop(frame, 0.05, {damping: 16, stiffness: 120});
  const cam = useCameraLife(useScene().start + frame / FPS);
  return (
    <FadeIn>
      <AbsoluteFill style={{transform: `translateY(${cam.y}px) scale(${cam.scale})`}}>
      <StudioBackdrop tint={PAL.p} tintAmount={0.15} floorY={1500} />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.05 * exact})`, transformOrigin: '540px 860px'}}>
        <div style={{opacity: clamp01(appear)}}>
          <Receipt x={540} y={300} scale={1.3} items={ORDER} printed={printed} total={Math.round(count * 100) / 100} discount={denied > 0 ? 'denied' : 'none'} discountP={denied} pulse={exact} shakeX={shake(frame, beat('denied'), 16)} trueC={PAL.true} falseC={PAL.false} />
        </div>
      </div>
      {why > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center', transform: `scale(${why}) rotate(${(1 - why) * -8}deg)`}}>
          <span dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 170, color: PAL.false, textShadow: '0 20px 40px rgba(224,56,75,0.25)', WebkitTextStroke: '6px #fff', paintOrder: 'stroke fill'}}>
            ليش!!
          </span>
        </div>
      )}
      </AbsoluteFill>
    </FadeIn>
  );
};

/**
 * Which slot is being read aloud: inside a spoken «إذا … فإن …» sentence the «إذا» slot
 * glows for the first clause and the «فإن» slot for the second — the stage moves with the voice.
 */
const useReading = (t: number): [number, number] => {
  const tl = useTimeline();
  const l = tl.lines.find((x) => t >= x.start - 0.05 && t <= x.end + 0.1);
  if (!l) return [0, 0];
  const iIf = l.text.indexOf('إذا');
  const iThen = l.text.search(/فإن/);
  if (iIf < 0 && iThen < 0) return [0, 0];
  const at = (i: number) => l.start + (l.end - l.start) * (i / l.text.length);
  const env = (a: number, b: number) => clamp01(Math.min((t - a) / 0.15, (b - t) / 0.2));
  const a0 = iIf >= 0 ? at(iIf) - 0.1 : -1;
  const b0 = iThen >= 0 ? at(iThen) - 0.05 : l.end;
  const g0 = iIf >= 0 ? env(a0, b0) : 0;
  const g1 = iThen >= 0 ? env(at(iThen) - 0.05, l.end + 0.1) : 0;
  return [g0, g1];
};

/** Beat-synced camera kick + slow drift — the frame is never still. */
const useCameraLife = (t: number) => {
  const tl = useTimeline();
  let kick = 0;
  for (const b of Object.values(tl.beats)) if (t >= b && t - b < 0.7) kick = Math.max(kick, Math.exp(-(t - b) * 7));
  return {scale: 1 + 0.022 * kick + 0.012 * Math.sin(t * 0.5), rotate: Math.sin(t * 0.37) * 0.35, y: Math.sin(t * 0.6) * 6};
};

/** Shared background + stage for S03–S09 (identical rendering → seamless overlaps). */
const Lesson: React.FC<{children?: React.ReactNode; stageScale?: number; tint?: string}> = ({children, stageScale = 1, tint = PAL.p}) => {
  const frame = useCurrentFrame();
  const {start, beats} = useScene();
  const t = start + frame / FPS;
  const read = useReading(t);
  const cam = useCameraLife(t);
  return (
    <AbsoluteFill>
      <StudioBackdrop tint={tint} tintAmount={0.28} floorY={1460} />
      <AbsoluteFill style={{transform: `translateY(${cam.y}px) rotate(${cam.rotate}deg) scale(${cam.scale})`, transformOrigin: '50% 45%'}}>
        <ConditionStage t={t} B={beats} scale={stageScale} read={read} />
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** stage zoom-out during the counterexample, absolute-time based so S06/S07/S08 agree */
const useStageScale = () => {
  const frame = useCurrentFrame();
  const {start, beats: B} = useScene();
  const t = (start + frame / FPS) * FPS;
  const shrink = ramp(t, B.coupon - 0.5, B.coupon + 0.1, EASE.inOut);
  const grow = ramp(t, B.swapBack - 0.45, B.swapBack + 0.05, EASE.inOut);
  return 1 - 0.3 * clamp01(shrink - grow);
};

// ── S03 — "العبارة الشرطية" + empty template ──────────────────────
export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  const titleUp = ramp(frame, beat('template') - 0.4, beat('template') + 0.2, EASE.inOut);
  return (
    <FadeIn>
      <Lesson />
      <div style={{position: 'absolute', left: 0, right: 0, top: 760}}>
        <KineticLine at={beat('bridge') + 0.05} size={110} weight={900} words={[{t: 'خلونا'}, {t: 'نفهم', color: PAL.p}]} outAt={beat('title') - 0.25} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: mix(titleUp, 620, 300), transform: `scale(${mix(titleUp, 1, 0.7)})`}}>
        <Eyebrow latin color={PAL.sub} style={{opacity: ramp(frame, beat('title') + 0.2, beat('title') + 0.6) * (1 - titleUp), marginBottom: 10}}>
          CONDITIONAL STATEMENT
        </Eyebrow>
        <KineticLine at={beat('title')} size={130} weight={900} stagger={0.12} words={[{t: 'العبارة'}, {t: 'الشرطية', color: PAL.accent}]} outAt={beat('template') + 2.6} />
      </div>
    </FadeIn>
  );
};

// ── S04 — fill: الفرض / النتيجة ───────────────────────────────────
export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  // the poster text returns as a mini sign, then pours into the slots
  const mini = ramp(frame, beat('posterBack'), beat('posterBack') + 0.5) * (1 - ramp(frame, beat('fillQ') + 0.2, beat('fillQ') + 0.7));
  return (
    <Lesson>
      {mini > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1140, opacity: mini, transform: `translateY(${(1 - mini) * 40}px)`}}>
          <div dir="rtl" style={{margin: '0 auto', width: 860, padding: '22px 30px', borderRadius: 26, background: '#FFFFFF', color: PAL.text, fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, textAlign: 'center', boxShadow: '0 0 0 6px #E5484D, 0 30px 60px rgba(120,70,20,0.18)'}}>
            <span style={{color: PAL.p, opacity: 1 - ramp(frame, beat('fillP'), beat('fillP') + 0.3)}}>إذا اشتريت بأكثر من 50 ريال،</span>{' '}
            <span style={{color: PAL.q, opacity: 1 - ramp(frame, beat('fillQ'), beat('fillQ') + 0.3)}}>فإنك ستحصل على خصم</span>
          </div>
        </div>
      )}
    </Lesson>
  );
};

// ── S05 — 50 is not "more than 50" ─────────────────────────────────
export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat, duration} = useScene();
  const nl = ramp(frame, beat('numberLine'), beat('numberLine') + 0.5) * (1 - ramp(frame, duration - 0.35, duration));
  const m = ramp(frame, beat('marker50') - 0.35, beat('marker50'), EASE.in);
  const v = ramp(frame, beat('notMore'), beat('notMore') + 0.6);
  const sweep = kf(frame, [beat('numberLine'), beat('marker50') - 0.35, beat('marker50')], [58, 58, 50], EASE.inOut);
  return (
    <Lesson>
      <NumberLine y={1270} from={40} to={60} threshold={50} appear={nl} marker={Math.round(sweep)} markerP={m} verdict={v} />
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1372, textAlign: 'center', opacity: v * nl, fontFamily: FONTS.display, fontWeight: 800, fontSize: 46, color: PAL.text}}>
        <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.text}}>50</span> مو أكثر من <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.text}}>50</span>
      </div>
    </Lesson>
  );
};

// ── S06 — converse (swap) ─────────────────────────────────────────
export const S06: React.FC = () => <Lesson tint={PAL.q} />;

const COUPON_ORDER: ReceiptLine[] = [
  {name: 'برجر', price: 22},
  {name: 'مشروب', price: 8},
];

// ── S07 — counterexample: coupon ──────────────────────────────────
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat, duration} = useScene();
  const scale = useStageScale();
  const posIn = pop(frame, beat('coupon') - 0.4, {damping: 15, stiffness: 120});
  const out = ramp(frame, beat('falseStamp') + 0.5, beat('falseStamp') + 0.9);
  const fly = ramp(frame, beat('coupon'), beat('coupon') + 0.6, EASE.inOut);
  const amount = kf(frame, [beat('coupon') + 0.6, beat('coupon') + 1.2], [0, 30], EASE.out);
  // discount lands right after the receipt finishes printing (matches the ka-ching)
  const ok = ramp(frame, beat('coupon') + 1.25, beat('coupon') + 1.45);
  const label = ramp(frame, beat('counterName'), beat('counterName') + 0.4) * (1 - out);
  return (
    <Lesson stageScale={scale}>
      <div style={{opacity: 1 - out}}>
        <div style={{opacity: clamp01(posIn)}}>
          <Receipt x={540} y={850} scale={0.62} items={COUPON_ORDER} coupon={fly > 0.9} printed={ramp(frame, beat('coupon') + 0.1, beat('coupon') + 1.2, EASE.inOut)} total={Math.round(amount * 100) / 100} discount={ok > 0 ? 'applied' : 'none'} discountP={ok} trueC={PAL.true} falseC={PAL.false} />
        </div>
        {fly < 0.98 && <Coupon x={mix(fly, 900, 600)} y={mix(fly, 1420, 1080)} rotate={mix(fly, 25, -8)} scale={mix(fly, 1, 0.55)} opacity={ramp(frame, beat('coupon') - 0.3, beat('coupon'))} />}
      </div>
      {label > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center', opacity: label}}>
          <div dir="rtl" style={{padding: '10px 30px', borderRadius: 999, background: '#FFFFFF', border: `3px solid ${PAL.false}`, fontFamily: FONTS.display, fontWeight: 900, fontSize: 48, color: PAL.false, boxShadow: '0 12px 30px rgba(224,56,75,0.18)'}}>
            مثال مضاد
          </div>
        </div>
      )}
    </Lesson>
  );
};

// ── S08 — inverse (negate both) ───────────────────────────────────
export const S08: React.FC = () => <Lesson stageScale={useStageScale()} tint="#FF7550" />;

// ── S09 — contrapositive ≡ original ───────────────────────────────
export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  const eq = ramp(frame, beat('sameValue'), beat('sameValue') + 0.5);
  return (
    <Lesson tint={AND_C}>
      {eq > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: eq, transform: `translateY(${(1 - eq) * 30}px)`}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 26, padding: '18px 34px', borderRadius: 30, background: '#FFFFFF', border: `2px solid ${PAL.accent}`, boxShadow: '0 16px 40px rgba(199,120,0,0.18)'}}>
            <span style={{fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, color: PAL.text}}>الأصلية</span>
            <Nota size={40}>p → q</Nota>
            <span dir="ltr" style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 56, color: PAL.accent}}>≡</span>
            <Nota size={40}>~q → ~p</Nota>
          </div>
          <div dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 800, fontSize: 42, color: PAL.accent}}>نفس قيمة الصواب</div>
        </div>
      )}
    </Lesson>
  );
};

// ── S10 — summary grid (no voice-over) ────────────────────────────
const FORMS = [
  {ar: 'العبارة الشرطية', nota: 'p → q', key: 'o'},
  {ar: 'العكس', nota: 'q → p', key: 'c'},
  {ar: 'المعكوس', nota: '~p → ~q', key: 'i'},
  {ar: 'المعاكس الإيجابي', nota: '~q → ~p', key: 'x'},
];
export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  const link = ramp(frame, beat('link'), beat('link') + 0.6);
  return (
    <FadeIn>
      <StudioBackdrop tint={AND_C} tintAmount={0.15} floorY={1700} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 300}}>
        <KineticLine at={beat('grid')} size={84} weight={900} words={[{t: 'الصيغ'}, {t: 'الأربع', color: PAL.accent}]} />
      </div>
      {FORMS.map((f, i) => {
        const col = i % 2; // RTL: 0 = right column
        const row = Math.floor(i / 2);
        const p = pop(frame, beat('grid') + 0.15 + i * 0.12, {damping: 15, stiffness: 140});
        const hot = (f.key === 'o' || f.key === 'x') && link > 0;
        return (
          <div
            key={f.key}
            style={{
              position: 'absolute',
              left: col === 0 ? 560 : 90,
              top: 520 + row * 420,
              width: 430,
              height: 330,
              borderRadius: 34,
              background: '#FFFFFF',
              border: `3px solid ${hot ? PAL.accent : PAL.line}`,
              boxShadow: hot ? `0 0 ${50 * link}px rgba(199,120,0,0.30)` : '0 24px 50px rgba(26,31,51,0.10)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              transform: `scale(${clamp01(p)})`,
              opacity: (f.key === 'c' || f.key === 'i') ? 1 - 0.45 * link : 1,
            }}
          >
            <div dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: f.ar.length > 10 ? 44 : 52, color: PAL.text}}>{f.ar}</div>
            <Nota size={50}>{f.nota}</Nota>
          </div>
        );
      })}
      {link > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1342, display: 'flex', justifyContent: 'center', opacity: link}}>
          <div dir="rtl" style={{padding: '12px 30px', borderRadius: 999, background: '#FFFFFF', border: `2px solid ${PAL.accent}`, fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, color: PAL.accent}}>
            الأصلية <span dir="ltr" style={{fontFamily: FONTS.text}}>≡</span> المعاكس الإيجابي
          </div>
        </div>
      )}
    </FadeIn>
  );
};

// ── S11 — Manhaji outro ───────────────────────────────────────────
export const S11: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  const pr = ramp(frame, beat('logo') + 1.2, beat('logo') + 1.9);
  return (
    <FadeIn>
      <Outro lesson_ar="العبارات الشرطية" subject_ar="الرياضيات" grade_ar="أول ثانوي" at={beat('logo')} subjectAt={beat('logo') + 1.4}>
        <div style={{opacity: pr, transform: `translateY(${(1 - pr) * 40}px)`}}>
          <Coupon x={300} y={1340} rotate={-10} scale={0.6} />
          <div style={{position: 'absolute', left: 640, top: 1290, padding: '14px 24px', borderRadius: 22, border: `3px solid ${PAL.p}`, color: PAL.text, background: '#fff', fontFamily: FONTS.text, fontWeight: 700, fontSize: 40}}>
            <Nota size={40}>p → q</Nota>
          </div>
        </div>
      </Outro>
    </FadeIn>
  );
};
