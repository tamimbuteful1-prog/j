import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SCENE_C} from '../config/timeline';
import {COLORS, FONTS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor} from '../components/Product';
import {BasketBack, BasketFront, BasketPlacement, basketSlot} from '../components/Basket';
import {ResultBadge} from '../components/ResultBadge';
import {Chip, Eyebrow, KineticLine} from '../components/Type';
import {Extruded} from '../components/Extruded';
import {LogicSymbol} from '../components/LogicSymbol';
import {TruthTable} from '../components/TruthTable';
import {EASE, clamp01, kf, mix, pop, ramp, shake} from '../lib/anim';

const B = SCENE_C.beats;

/** the four cases of «أو»: [عيش, صامولي] */
const CASES: [number, boolean, boolean][] = [
  [B.case1, true, false],
  [B.case2, false, true],
  [B.case3, true, true],
  [B.case4, false, false],
];

/**
 * SCENE C — عبارة الفصل (OR)
 * order card → «أو» grows and becomes ∨ → the screen splits into two lanes →
 * the lanes merge into ONE basket: one item is enough → the four cases fill a truth table.
 */
export const SceneC_Or: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const exit = ramp(frame, 20.15, 20.6, EASE.in);

  // ── phase 1/2: the order card and the growing «أو»
  const grow = ramp(frame, B.orGrow, B.orGrow + 0.7, EASE.inOut);
  const toSymbol = ramp(frame, B.orSymbol - 0.15, B.orSymbol + 0.35, EASE.inOut);
  const cardIn = ramp(frame, B.card - 0.3, B.card + 0.3);
  const cardOut = ramp(frame, B.orGrow, B.orGrow + 0.5);

  // ── phase 3: ∨ hero symbol, then it docks into the header chip
  const dock = ramp(frame, B.split - 0.2, B.split + 0.6, EASE.inOut);
  const symScale = pop(frame, B.orSymbol - 0.1, {damping: 11, stiffness: 140});
  const symY = mix(dock, 820, 300);
  const symS = mix(dock, 1, 0.25);
  const chip = ramp(frame, B.split + 0.3, B.split + 0.8);

  // ── phase 4: lanes split, then merge into the basket
  const lanes = ramp(frame, B.split, B.split + 0.7, EASE.out) * (1 - ramp(frame, 12.4, 13.0, EASE.inOut));
  const merge = ramp(frame, B.merge - 0.2, B.merge + 0.9, EASE.inOut);
  const pathsOut = ramp(frame, 12.4, 13.0);

  // ── basket: appears at merge, re-frames for the case run
  const bIn = pop(frame, B.merge, {damping: 15, stiffness: 120});
  const caseMode = ramp(frame, 12.5, 13.2, EASE.inOut);
  const basket: BasketPlacement = {
    x: 540,
    y: mix(bIn, 2500, mix(caseMode, 1440, 1440)),
    w: mix(caseMode, 440, 430),
    rotate: shake(frame, B.case4 + 0.35, 2.5, 0.5),
  };

  // ── at least one: the bread rides its lane into the basket
  const ride = ramp(frame, B.atLeastOne - 0.1, B.atLeastOne + 0.45, EASE.in);
  const ruleTrue = ramp(frame, B.atLeastOne + 0.6, B.atLeastOne + 1.0);

  // ── case run
  const caseIdx = CASES.reduce((acc, [at], i) => (t >= at ? i : acc), -1);
  /** 0..1 "in the basket" for aish (1) / samoli (2), eased between case states */
  const inside = (which: 1 | 2) => {
    if (t < 12.5) return which === 1 ? ride : 0;
    const segs = [{at: 12.5, v: 0}, ...CASES.map(([at, a, s]) => ({at: at - 0.05, v: (which === 1 ? a : s) ? 1 : 0}))];
    let prevV = which === 1 ? 1 : 0;
    let cur = segs[0];
    for (let i = 1; i < segs.length; i++) {
      if (t >= segs[i].at) {
        prevV = cur.v;
        cur = segs[i];
      }
    }
    const p = ramp(frame, cur.at, cur.at + 0.32, cur.v > prevV ? EASE.in : EASE.out);
    return mix(p, prevV, cur.v);
  };

  const aIn = inside(1);
  const sIn = inside(2);

  // product positions
  const slotA = basketSlot(basket, 1);
  const slotS = basketSlot(basket, -1);
  const laneY = 1000;
  const standbyA = {x: kf(frame, [0, 1.2, B.split, B.split + 0.6, 12.6, 13.2], [880, 860, 860, 760, 760, 860]), y: kf(frame, [0, 1.2, B.split + 0.6, 12.6, 13.2], [1500, 1380, laneY, laneY, 1140])};
  const standbyS = {x: kf(frame, [0, 1.2, B.split, B.split + 0.6, 12.6, 13.2], [200, 220, 220, 320, 320, 220]), y: kf(frame, [0, 1.2, B.split + 0.6, 12.6, 13.2], [1500, 1380, laneY, laneY, 1140])};
  const sScale0 = kf(frame, [0, 1.2, B.split + 0.6, 12.6, 13.2], [0.5, 0.55, 0.6, 0.6, 0.5]);

  const aX = mix(aIn, standbyA.x, slotA.x);
  const aY = mix(aIn, standbyA.y, slotA.y) - Math.sin(aIn * Math.PI) * 120;
  const sX = mix(sIn, standbyS.x, slotS.x);
  const sY = mix(sIn, standbyS.y, slotS.y) - Math.sin(sIn * Math.PI) * 120;

  // table & results
  const table = ramp(frame, 12.8, 13.4);
  const rows = CASES.map(([at, a, s]) => ({aish: a, samoli: s, result: a || s, progress: ramp(frame, at + 0.3, at + 0.6), active: t >= at && t < at + 1.45 ? 1 : 0}));
  const settle = ramp(frame, B.settle, B.settle + 0.5);
  const curCase = caseIdx >= 0 ? CASES[caseIdx] : null;
  const curResult = curCase ? curCase[1] || curCase[2] : true;
  const caseBadge = curCase ? ramp(frame, curCase[0] + 0.3, curCase[0] + 0.7) * (1 - ramp(frame, curCase[0] + 1.3, curCase[0] + 1.5)) : 0;
  const lastBadge = caseIdx === 3 ? ramp(frame, B.case4 + 0.3, B.case4 + 0.7) : caseBadge;

  // camera variation per case
  const camShift = kf(frame, [B.case1, B.case1 + 0.5, B.case2, B.case2 + 0.5, B.case3, B.case3 + 0.5, B.case4, B.case4 + 0.5], [0, -14, -14, 14, 14, 0, 0, 0]);
  const camZoom = 1 + 0.035 * Math.sin(clamp01((t - B.case3) / 1.2) * Math.PI) + 0.03 * ramp(frame, B.settle, B.settle + 0.6);

  return (
    <AbsoluteFill>
      <StudioBackdrop tint={COLORS.or} tintAmount={0.3 + 0.2 * lanes} floorY={1460} />
      {caseIdx === 3 && <AbsoluteFill style={{background: COLORS.false, opacity: (1 - ramp(frame, B.case4 + 0.35, B.case4 + 0.9)) * ramp(frame, B.case4 + 0.3, B.case4 + 0.35) * 0.15}} />}

      <AbsoluteFill style={{opacity: 1 - exit, transform: `translateX(${camShift}px) scale(${camZoom})`, transformOrigin: '50% 60%'}}>
        {/* ── order card */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 470, height: 250, opacity: cardIn * (1 - ramp(frame, B.orSymbol, B.orSymbol + 0.4))}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 40,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
              border: '1.5px solid rgba(255,255,255,0.14)',
              boxShadow: '0 40px 90px rgba(0,0,0,0.45)',
              opacity: 1 - cardOut,
              transform: `scale(${1 + cardOut * 0.06})`,
            }}
          />
          <Eyebrow color={COLORS.paperDim} style={{position: 'absolute', top: 30, left: 0, right: 0, fontSize: 32, opacity: 1 - cardOut}}>
            طلب الأب
          </Eyebrow>
          <div style={{position: 'absolute', top: 92, left: 0, right: 0}}>
            <KineticLine
              at={B.card}
              size={84}
              weight={800}
              words={[
                {t: 'جيب', opacity: 1 - grow * 0.85},
                {t: 'عيش', color: COLORS.aish, opacity: 1 - grow * 0.85},
                {
                  t: 'أو',
                  color: COLORS.or,
                  scale: 1 + grow * 1.9,
                  y: grow * 290,
                  x: grow * -20,
                  opacity: 1 - toSymbol,
                  glow: grow > 0.1 ? COLORS.orGlow : undefined,
                },
                {t: 'صامولي', color: COLORS.samoli, opacity: 1 - grow * 0.85},
              ]}
            />
          </div>
        </div>

        {/* ── ∨ hero */}
        {toSymbol > 0 && dock < 1 && (
          <div
            style={{
              position: 'absolute',
              left: 540 - 180,
              top: symY - 200,
              width: 360,
              display: 'flex',
              justifyContent: 'center',
              opacity: toSymbol * (1 - ramp(frame, B.split + 0.45, B.split + 0.6)),
              transform: `scale(${symScale * symS})`,
            }}
          >
            <Extruded
              size={300}
              color={COLORS.or}
              side="#1B2F66"
              depth={50}
              layers={12}
              rotateY={Math.sin(t * 1.6) * 24}
              rotateX={8}
              glow={COLORS.orGlow}
              render={(c) => <LogicSymbol op="or" size={260} color={c} stroke={16} />}
            />
          </div>
        )}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1080, opacity: (1 - dock) * ramp(frame, B.orSymbol + 0.2, B.orSymbol + 0.6)}}>
          <Eyebrow latin color={COLORS.or} style={{marginBottom: 8, fontSize: 34}}>
            OR · DISJUNCTION
          </Eyebrow>
          <KineticLine at={B.orSymbol + 0.35} size={110} weight={900} words={[{t: 'عبارة'}, {t: 'فصل', color: COLORS.or, glow: COLORS.orGlow}]} />
        </div>

        {/* ── header chip */}
        <div style={{position: 'absolute', left: 0, right: 0, top: mix(table, 250, 236), display: 'flex', justifyContent: 'center', opacity: chip, transform: `scale(${mix(table, 1, 0.85)})`}}>
          <Chip color={COLORS.or} op="or" latin="OR" arabic="عبارة فصل" />
        </div>

        {/* ── two lanes */}
        {lanes > 0.001 && (
          <>
            {([
              [1, COLORS.aish, 'عيش'],
              [-1, COLORS.samoli, 'صامولي'],
            ] as const).map(([side, c, label]) => {
              const cx = 540 + side * 220 * lanes;
              return (
                <div
                  key={label}
                  style={{
                    position: 'absolute',
                    left: cx - 190,
                    width: 380,
                    top: mix(merge, 420, 640),
                    height: mix(merge, 760, 540),
                    borderRadius: 40,
                    background: `linear-gradient(180deg, ${c}26, ${c}05)`,
                    border: `2px solid ${c}55`,
                    opacity: lanes * (1 - merge * 0.55),
                    transform: `translateY(${(1 - lanes) * 60}px)`,
                  }}
                >
                  <div dir="rtl" style={{opacity: 1 - merge, textAlign: 'center', marginTop: 36, fontFamily: FONTS.display, fontWeight: 800, fontSize: 58, color: c}}>
                    {label}
                  </div>
                </div>
              );
            })}
            {/* the dividing «أو» */}
            <div style={{position: 'absolute', left: 539, width: 2, top: 440, height: 700 * lanes * (1 - merge), background: `linear-gradient(180deg, transparent, ${COLORS.or}, transparent)`, boxShadow: `0 0 20px ${COLORS.or}`}} />
            <div
              style={{
                position: 'absolute',
                left: 540 - 70,
                width: 140,
                top: 700,
                textAlign: 'center',
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 70,
                color: COLORS.or,
                background: COLORS.ink,
                borderRadius: 999,
                border: `2px solid ${COLORS.or}`,
                opacity: lanes * (1 - merge),
                lineHeight: 1.5,
              }}
            >
              أو
            </div>
          </>
        )}

        {/* ── merging paths into ONE basket */}
        {merge > 0 && pathsOut < 1 && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - pathsOut}}>
            {[
              ['M760 1060 C760 1180, 620 1150, 600 1240', COLORS.aish],
              ['M320 1060 C320 1180, 460 1150, 480 1240', COLORS.samoli],
            ].map(([d, c], i) => (
              <g key={i}>
                <path d={d} stroke={c} strokeOpacity={0.25} strokeWidth={26} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - merge} />
                <path d={d} stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="0.08 0.12" strokeDashoffset={-t * 0.6} opacity={merge} />
              </g>
            ))}
          </svg>
        )}

        {/* «at least one» rule */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 470, opacity: ramp(frame, B.atLeastOne - 0.2, B.atLeastOne + 0.2) * (1 - ramp(frame, 12.3, 12.7))}}>
          <KineticLine
            at={B.atLeastOne - 0.1}
            size={84}
            weight={800}
            words={[{t: 'يكفي'}, {t: 'واحد', color: COLORS.or, glow: COLORS.orGlow}, {t: 'على'}, {t: 'الأقل', color: COLORS.or}]}
          />
        </div>
        <ResultBadge value progress={ruleTrue * (1 - ramp(frame, 12.3, 12.6))} x={540} y={650} flash={ruleTrue} />

        {/* ── truth table */}
        <TruthTable x={540} y={330} rows={rows} op="or" appear={table} width={760} highlightResult={settle} />

        {/* ── basket + products */}
        <BasketBack {...basket} />
        <ProductActor kind="samoli" x={sX} y={sY} scale={mix(sIn, sScale0, slotS.scale)} rotateY={10} dim={caseIdx === 3 ? 0.5 : 0} shadow={sIn < 0.5} />
        <ProductActor kind="aish" x={aX} y={aY} scale={mix(aIn, sScale0, slotA.scale)} rotateY={-10} dim={caseIdx === 3 ? 0.5 : 0} shadow={aIn < 0.5} />
        <BasketFront
          {...basket}
          glow={t > B.atLeastOne + 0.4 && (t < 12.5 || curResult) ? COLORS.true : t > B.case4 + 0.3 ? COLORS.false : undefined}
          glowAmount={t > B.atLeastOne + 0.4 ? 1 : 0}
        />
        {curCase && (
          <ResultBadge
            value={curResult}
            progress={lastBadge}
            x={540}
            y={890}
            scale={0.72}
            flash={ramp(frame, curCase[0] + 0.3, curCase[0] + 0.9)}
            shakeX={caseIdx === 3 ? shake(frame, B.case4 + 0.35, 14) : 0}
            showArabic={false}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
