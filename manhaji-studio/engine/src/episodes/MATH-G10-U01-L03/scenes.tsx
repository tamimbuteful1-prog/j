import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useScene} from '../../timeline/context';
import {StudioBackdrop, Spotlight} from '../../kit/Backdrop';
import {Eyebrow, KineticLine} from '../../kit/Type';
import {Outro} from '../../kit/Outro';
import {COLORS, FONTS} from '../../kit/theme';
import {EASE, clamp01, kf, mix, pop, ramp, shake, wobble} from '../../kit/anim';
import {Coupon, NumberLine, OfferPoster, POS} from '../../worlds/checkout';
import {ConditionStage, Nota, P_COLOR, Q_COLOR} from './stage';

const FPS = 30;

/** Fade a scene in over the 0.3 s overlap with the previous one (non-stage scenes). */
const FadeIn: React.FC<{children: React.ReactNode; d?: number}> = ({children, d = 0.3}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: ramp(frame, 0, d, EASE.inOut)}}>{children}</AbsoluteFill>;
};

/** Store wall: warm light + soft shelf silhouettes (depth without clutter). */
const StoreWall: React.FC<{frame: number}> = ({frame}) => (
  // shelves drift very slightly — the wall feels alive without stealing focus
  <AbsoluteFill>
    <StudioBackdrop tint={COLORS.aish} tintAmount={0.35} floorY={1460} />
    {[260, 520, 780, 1040, 1300].map((y, i) => (
      <div key={y} style={{position: 'absolute', left: (i % 2 ? -40 : 0) + wobble(frame, i, 0.01, 6), right: i % 2 ? 0 : -40, top: y, height: 18, background: 'rgba(255,255,255,0.05)', filter: 'blur(1px)'}} />
    ))}
    {Array.from({length: 26}).map((_, i) => {
      const row = i % 5;
      const x = ((i * 137) % 1100) - 20;
      const h = 70 + ((i * 53) % 90);
      return <div key={i} style={{position: 'absolute', left: x, top: 260 + row * 260 - h, width: 60 + ((i * 31) % 50), height: h, borderRadius: 8, background: 'rgba(255,255,255,0.045)', filter: 'blur(2.5px)'}} />;
    })}
  </AbsoluteFill>
);

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
        <StoreWall frame={frame} />
        <Spotlight x={540} y={820} r={560} color="rgba(255,225,170,0.25)" opacity={ap} />
        <OfferPoster x={540} y={840} appear={clamp01(ap)} ifGlow={g('ifWord')} thenGlow={g('thenWord')} dealGlow={g('discountWord')} rotate={Math.sin(frame / 22) * 0.8} />
      </AbsoluteFill>
    </FadeIn>
  );
};

// ── S02 — 50.00 exactly, no discount ───────────────────────────────
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  const count = kf(frame, [beat('countStart'), beat('fifty')], [0, 50], EASE.out);
  const exact = ramp(frame, beat('exact'), beat('exact') + 0.3) * (1 - ramp(frame, beat('exact') + 0.6, beat('exact') + 1));
  const denied = ramp(frame, beat('denied'), beat('denied') + 0.25);
  const why = pop(frame, beat('why'), {damping: 9, stiffness: 180});
  const appear = pop(frame, 0.05, {damping: 16, stiffness: 120});
  return (
    <FadeIn>
      <StudioBackdrop tint={COLORS.or} tintAmount={0.25} floorY={1400} />
      <Spotlight x={540} y={860} r={520} opacity={0.8} />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.05 * exact})`, transformOrigin: '540px 860px'}}>
        <POS x={540} y={900} amount={count} discount={denied > 0 ? 'denied' : 'idle'} discountP={denied} shakeX={shake(frame, beat('denied'), 16)} appear={clamp01(appear)} />
      </div>
      {why > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', transform: `scale(${why}) rotate(${(1 - why) * -8}deg)`}}>
          <span dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 170, color: COLORS.paper, textShadow: `0 0 50px ${COLORS.falseGlow}`}}>
            ليش!!
          </span>
        </div>
      )}
    </FadeIn>
  );
};

/** Shared background + stage for S03–S09 (identical rendering → seamless overlaps). */
const Lesson: React.FC<{children?: React.ReactNode; stageScale?: number; tint?: string}> = ({children, stageScale = 1, tint = COLORS.or}) => {
  const frame = useCurrentFrame();
  const {start, beats} = useScene();
  const t = start + frame / FPS;
  return (
    <AbsoluteFill>
      <StudioBackdrop tint={tint} tintAmount={0.28} floorY={1460} />
      <ConditionStage t={t} B={beats} scale={stageScale} />
      {children}
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
      <div style={{position: 'absolute', left: 0, right: 0, top: mix(titleUp, 620, 300), transform: `scale(${mix(titleUp, 1, 0.7)})`}}>
        <Eyebrow latin color={COLORS.muted} style={{opacity: ramp(frame, beat('title') + 0.2, beat('title') + 0.6) * (1 - titleUp), marginBottom: 10}}>
          CONDITIONAL STATEMENT
        </Eyebrow>
        <KineticLine at={beat('title')} size={130} weight={900} stagger={0.12} words={[{t: 'العبارة'}, {t: 'الشرطية', color: '#FFD27A'}]} outAt={beat('template') + 2.6} />
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
          <div dir="rtl" style={{margin: '0 auto', width: 860, padding: '22px 30px', borderRadius: 26, background: '#FFF7E6', color: '#2B2118', fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, textAlign: 'center', boxShadow: `0 0 0 6px ${COLORS.samoli}, 0 30px 60px rgba(0,0,0,0.5)`}}>
            <span style={{color: P_COLOR, opacity: 1 - ramp(frame, beat('fillP'), beat('fillP') + 0.3)}}>إذا اشتريت بأكثر من 50 ريال،</span>{' '}
            <span style={{color: '#C88A10', opacity: 1 - ramp(frame, beat('fillQ'), beat('fillQ') + 0.3)}}>فإنك ستحصل على خصم</span>
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
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1372, textAlign: 'center', opacity: v * nl, fontFamily: FONTS.display, fontWeight: 800, fontSize: 46, color: COLORS.paper}}>
        <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.text}}>50</span> مو أكثر من <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.text}}>50</span>
      </div>
    </Lesson>
  );
};

// ── S06 — converse (swap) ─────────────────────────────────────────
export const S06: React.FC = () => <Lesson tint={Q_COLOR} />;

// ── S07 — counterexample: coupon ──────────────────────────────────
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat, duration} = useScene();
  const scale = useStageScale();
  const posIn = pop(frame, beat('coupon') - 0.4, {damping: 15, stiffness: 120});
  const out = ramp(frame, duration - 0.5, duration);
  const fly = ramp(frame, beat('coupon'), beat('coupon') + 0.6, EASE.inOut);
  const amount = kf(frame, [beat('coupon') - 0.4, beat('under50')], [0, 30], EASE.out);
  const ok = ramp(frame, beat('discountOK'), beat('discountOK') + 0.25);
  const label = ramp(frame, beat('counterName'), beat('counterName') + 0.4) * (1 - out);
  return (
    <Lesson stageScale={scale}>
      <div style={{opacity: 1 - out}}>
        <POS x={540} y={1140} scale={0.6} amount={amount} discount={ok > 0 ? 'applied' : 'idle'} discountP={ok} coupon={fly > 0.9} appear={clamp01(posIn)} />
        {fly < 0.98 && <Coupon x={mix(fly, 900, 600)} y={mix(fly, 1420, 1080)} rotate={mix(fly, 25, -8)} scale={mix(fly, 1, 0.55)} opacity={ramp(frame, beat('coupon') - 0.3, beat('coupon'))} />}
      </div>
      {label > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center', opacity: label}}>
          <div dir="rtl" style={{padding: '10px 30px', borderRadius: 999, background: `${COLORS.false}22`, border: `3px solid ${COLORS.false}`, fontFamily: FONTS.display, fontWeight: 900, fontSize: 48, color: COLORS.paper}}>
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
    <Lesson tint={COLORS.and}>
      {eq > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: eq, transform: `translateY(${(1 - eq) * 30}px)`}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 26, padding: '18px 34px', borderRadius: 30, background: 'rgba(255,255,255,0.06)', border: '2px solid #FFD27A', boxShadow: '0 0 40px rgba(255,210,122,0.35)'}}>
            <span style={{fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, color: COLORS.paper}}>الأصلية</span>
            <Nota size={40}>p → q</Nota>
            <span dir="ltr" style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 56, color: '#FFD27A'}}>≡</span>
            <Nota size={40}>~q → ~p</Nota>
          </div>
          <div dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 800, fontSize: 42, color: '#FFD27A'}}>نفس قيمة الصواب</div>
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
      <StudioBackdrop tint="#7A7CFF" tintAmount={0.3} floorY={1700} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 300}}>
        <KineticLine at={beat('grid')} size={84} weight={900} words={[{t: 'الصيغ'}, {t: 'الأربع', color: '#FFD27A'}]} />
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
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              border: `3px solid ${hot ? '#FFD27A' : 'rgba(255,255,255,0.14)'}`,
              boxShadow: hot ? `0 0 ${50 * link}px rgba(255,210,122,0.45)` : '0 30px 70px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              transform: `scale(${clamp01(p)})`,
              opacity: (f.key === 'c' || f.key === 'i') ? 1 - 0.45 * link : 1,
            }}
          >
            <div dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: f.ar.length > 10 ? 44 : 52, color: COLORS.paper}}>{f.ar}</div>
            <Nota size={50}>{f.nota}</Nota>
          </div>
        );
      })}
      {link > 0.01 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1342, display: 'flex', justifyContent: 'center', opacity: link}}>
          <div dir="rtl" style={{padding: '12px 30px', borderRadius: 999, background: 'rgba(255,210,122,0.14)', border: '2px solid #FFD27A', fontFamily: FONTS.display, fontWeight: 800, fontSize: 40, color: '#FFD27A'}}>
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
          <div style={{position: 'absolute', left: 640, top: 1290, padding: '14px 24px', borderRadius: 22, border: `3px solid ${P_COLOR}`, color: COLORS.paper, fontFamily: FONTS.text, fontWeight: 700, fontSize: 40}}>
            <Nota size={40}>p → q</Nota>
          </div>
        </div>
      </Outro>
    </FadeIn>
  );
};
