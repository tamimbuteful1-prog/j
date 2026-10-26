import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {HOOK} from '../config/media';
import {COLORS, FONTS} from '../config/theme';
import {EASE, clamp01, f, pop} from '../lib/anim';
import {Extruded} from '../components/Extruded';

/**
 * SCENE 1 — the real hook footage.
 * • starts instantly (no logo), slow push-in
 * • a calculated hold-frame on «أو» (picture + sound pause) with a split «و | أو» beat
 * • exit: the footage becomes a physical card in 3D space and the camera flies past it
 *   into the mini-market (Scene A is already rendering underneath).
 */
export const HookScene: React.FC<{hookFrames: number; clipFrames: number; exitFrames: number}> = ({hookFrames, clipFrames, exitFrames}) => {
  const frame = useCurrentFrame();
  const orF = f(HOOK.orWordSec);
  const hold = HOOK.freezeFrames;
  const inHold = frame >= orF && frame < orF + hold;
  const holdP = hold > 0 ? clamp01((frame - orF) / hold) : 0;

  // slow push-in across the clip + a small punch on «أو»
  const push = interpolate(frame, [0, hookFrames], [1, HOOK.pushIn], {extrapolateRight: 'clamp'});
  const punch = frame >= orF ? interpolate(frame, [orF, orF + 4, orF + hold + 10], [0, 1, 0.45], {extrapolateRight: 'clamp'}) * HOOK.orPunch : 0;

  // exit transition
  const exitStart = hookFrames - exitFrames;
  const e = clamp01((frame - exitStart) / exitFrames);
  const e1 = EASE.inOut(clamp01(e / 0.55));
  const e2 = EASE.in(clamp01((e - 0.42) / 0.58));
  const cardScale = interpolate(e1, [0, 1], [1, 0.56]) * (1 + e2 * 0.9);
  const radius = e1 * 64;
  const rotY = -24 * e1 - 40 * e2;
  const tx = 60 * e1 + 980 * e2;
  const exitBlur = e2 * 16;

  return (
    <AbsoluteFill style={{perspective: 1600, background: e > 0 ? 'transparent' : COLORS.ink}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${tx}px) rotateY(${rotY}deg) scale(${cardScale})`,
          borderRadius: radius,
          overflow: 'hidden',
          boxShadow: e > 0 ? `0 60px 140px rgba(0,0,0,${0.6 * e1}), 0 0 0 ${3 * e1}px rgba(255,255,255,0.25)` : undefined,
          filter: exitBlur > 0.3 ? `blur(${exitBlur}px)` : undefined,
          opacity: 1 - clamp01((e - 0.85) / 0.15),
        }}
      >
        <AbsoluteFill
          style={{
            transform: `scale(${push + punch})`,
            filter: inHold ? `saturate(${1 - 0.6 * Math.sin(holdP * Math.PI)}) contrast(1.08)` : undefined,
          }}
        >
          {HOOK.enabled ? <HookFootage orF={orF} hold={hold} clipFrames={clipFrames} /> : <HookPlaceholder />}
        </AbsoluteFill>
        <OrBeat frame={frame} orF={orF} hold={hold} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * The clip as timed segments: play → hold on «أو» (silent) → play → hold last frame (silent).
 * Rendered twice in 'fit' mode: a blurred ambient fill + the untouched full shot.
 */
const ClipTimeline: React.FC<{orF: number; hold: number; clipFrames: number; style: React.CSSProperties; muted?: boolean}> = ({
  orF,
  hold,
  clipFrames,
  style,
  muted,
}) => {
  const src = staticFile(HOOK.src);
  const vol = muted ? 0 : HOOK.volume;
  const last = clipFrames - 1;
  const afterOr = hold > 0 ? orF : clipFrames;
  return (
    <>
      <Sequence durationInFrames={afterOr} layout="none">
        <OffthreadVideo src={src} style={style} volume={vol} />
      </Sequence>
      {hold > 0 && (
        <>
          <Sequence from={orF} durationInFrames={hold} layout="none">
            <Freeze frame={orF}>
              <OffthreadVideo src={src} style={style} muted />
            </Freeze>
          </Sequence>
          <Sequence from={orF + hold} durationInFrames={clipFrames - orF} layout="none">
            <OffthreadVideo src={src} style={style} volume={vol} trimBefore={orF} />
          </Sequence>
        </>
      )}
      <Sequence from={clipFrames + hold} layout="none">
        <Freeze frame={last}>
          <OffthreadVideo src={src} style={style} muted />
        </Freeze>
      </Sequence>
    </>
  );
};

const HookFootage: React.FC<{orF: number; hold: number; clipFrames: number}> = (p) => {
  if (HOOK.framing === 'fill') {
    return <ClipTimeline {...p} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  }
  // 'fit': the full landscape shot — no crop, no zoom — on a soft ambient fill of itself
  const h = Math.round((1080 * 9) / 16);
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <AbsoluteFill style={{filter: 'blur(46px) brightness(0.42) saturate(1.15)', transform: 'scale(1.15)'}}>
        <ClipTimeline {...p} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: HOOK.fitTop,
          width: 1080,
          height: h,
          overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
        }}
      >
        <ClipTimeline {...p} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};

/** The «و | أو» split that lands on the hold frame — confusion made visual. */
const OrBeat: React.FC<{frame: number; orF: number; hold: number}> = ({frame, orF, hold}) => {
  if (frame < orF - 2) return null;
  const inP = pop(frame, (orF - 1) / 30, {damping: 13, stiffness: 220});
  const outP = interpolate(frame, [orF + hold + 14, orF + hold + 26], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const swing = Math.sin((frame - orF) / 4) * 6;
  const o = inP * outP;
  if (o <= 0.001) return null;
  const glyph = (t: string, c: string, dx: number) => (
    <div
      style={{
        position: 'absolute',
        top: HOOK.framing === 'fit' ? HOOK.fitTop + 640 : 1170,
        left: 540 + dx - 120,
        width: 240,
        display: 'flex',
        justifyContent: 'center',
        opacity: o,
        transform: `translateY(${(1 - inP) * 60 + (dx > 0 ? swing : -swing)}px) scale(${0.7 + 0.3 * inP})`,
      }}
    >
      <Extruded glyph={t} size={180} color={c} side="rgba(10,12,30,0.9)" depth={34} layers={8} rotateY={dx > 0 ? -18 + swing : 18 - swing} glow={c} />
    </div>
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(9,13,24,0) 35%, rgba(9,13,24,${0.6 * o}) 75%)`}} />
      {glyph('و', COLORS.and, 250)}
      {glyph('أو', COLORS.or, -250)}
      <div
        style={{
          position: 'absolute',
          top: HOOK.framing === 'fit' ? HOOK.fitTop + 730 : 1260,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 120,
          color: COLORS.paper,
          opacity: o * 0.9,
        }}
      >
        ؟
      </div>
    </AbsoluteFill>
  );
};

/** Stand-in until the graded hook clip is dropped into public/footage/hook.mp4. */
const HookPlaceholder: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(900px 1200px at 50% 40%, #3B3330, #15110F 80%)'}}>
      {/* silhouette of the presenter */}
      <div style={{position: 'absolute', left: 540 - 150, top: 520 + Math.sin(frame / 20) * 4, width: 300, height: 340, borderRadius: '50%', background: '#2A2321', filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: 540 - 380, top: 860, width: 760, height: 1200, borderRadius: '380px 380px 0 0', background: '#221C1A'}} />
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONTS.text,
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        <div dir="ltr" style={{fontWeight: 700, fontSize: 30, letterSpacing: '0.4em'}}>
          HOOK · LIVE ACTION
        </div>
        <div dir="rtl" style={{fontWeight: 500, fontSize: 30}}>
          ضع اللقطة هنا: <span dir="ltr" style={{unicodeBidi: 'isolate'}}>public/footage/hook.mp4</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
