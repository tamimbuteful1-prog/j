import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, FONT_HEAD, FPS, H, W} from '../theme';
import {HOOK} from '../timeline';
import {E, clamp, keys, p} from '../lib/anim';

// The real filmed hook, reframed 16:9 → 9:16 without touching the student:
//  - a virtual camera (cx, cy, cw in source pixels) follows him and keeps hands/gestures in frame
//  - the area the source can't cover is filled by a soft extension of the same shot
//  - at the end the camera pushes into his temple (he points at his head) and dives into the idea

const SRC_W = 1920;
const SRC_H = 1078;
const ANCHOR_Y = 760; // screen y where the source point (cx, cy) lands

const LO = HOOK.lightsOut;

/** framing in source pixels */
export const hookFraming = (t: number) => {
  const cw = keys(t, [
    [0, 1060],
    [1.5, 1060],
    [3.2, 880, E.inOut],
    [LO - 0.001, 850, E.soft],
    [LO, 720, E.linear], // punch-in on the exact frame the lights die
    [5.3, 780, E.out],
    [7.6, 800, E.soft],
    [HOOK.diveStart + 0.25, 600, E.inOut],
    [8.5, 260, E.expoIn],
    [8.92, 26, E.expoIn],
  ]);
  const cx = keys(t, [
    [0, 990],
    [1.5, 985],
    [3.2, 965, E.inOut],
    [7.6, 955, E.soft],
    [HOOK.diveStart + 0.25, 905, E.inOut],
    [8.5, 862, E.inOut],
    [8.92, 846, E.soft],
  ]);
  const cy = keys(t, [
    [0, 430],
    [7.6, 420],
    [8.5, 372, E.inOut],
    [8.92, 360, E.soft],
  ]);
  return {cw, cx, cy};
};

/** where the source frame sits on screen: anchored to the bottom edge (his body is cut at the waist),
 *  then re-centred on his temple while the camera dives in */
export const placement = (t: number) => {
  const {cw, cx, cy} = hookFraming(t);
  const s = W / cw;
  const bottomTop = H - SRC_H * s + 6;
  const centredTop = ANCHOR_Y - cy * s;
  const k = p(t, HOOK.diveStart, 0.55, E.inOut);
  return {s, left: W / 2 - cx * s, top: bottomTop + (centredTop - bottomTop) * k};
};

const Frame: React.FC<{t: number; scaleMul?: number; opacity?: number; freeze: boolean}> = ({t, scaleMul = 1, opacity = 1, freeze}) => {
  const {s: s0, left: l0, top: t0} = placement(t);
  // extra zoom (for the zoom-blur ghosts) is applied around the dive point
  const s = s0 * scaleMul;
  const left = W / 2 - (W / 2 - l0) * scaleMul;
  const top = ANCHOR_Y - (ANCHOR_Y - t0) * scaleMul;
  const style: React.CSSProperties = {position: 'absolute', left, top, width: SRC_W * s, height: SRC_H * s, opacity};
  return freeze ? <Img src={staticFile('hook_last.png')} style={style} /> : <OffthreadVideo src={staticFile('hook.mp4')} muted style={style} />;
};

/** Clean extension of the studio wall above the real frame: the top rows of the shot, stretched and softened. */
const WallExtension: React.FC<{t: number; freeze: boolean}> = ({t, freeze}) => {
  const {s, left, top} = placement(t);
  if (top <= 0) return null;
  const rows = 46; // uniform wall strip at the top of the source
  const k = (top + 60) / (rows * s); // vertical stretch done by the compositor (no giant textures)
  const style: React.CSSProperties = {position: 'absolute', left, top: 0, width: SRC_W * s, height: SRC_H * s};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: top + 60, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: rows * s, overflow: 'hidden', transform: `scaleY(${k})`, transformOrigin: '0 0', filter: 'blur(10px) saturate(1.1)'}}>
        {freeze ? <Img src={staticFile('hook_last.png')} style={style} /> : <OffthreadVideo src={staticFile('hook.mp4')} muted style={style} />}
      </div>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(2,6,12,0.6), rgba(2,6,12,0.05))'}} />
    </div>
  );
};

/** hook headline living in the extended wall space */
const Headline: React.FC<{t: number}> = ({t}) => {
  const {top} = placement(t);
  const y = Math.max(190, Math.min(380, top / 2 + 30));
  const out = 1 - p(t, HOOK.diveStart, 0.25);
  const l1 = p(t, 5.45, 0.35, E.out);
  const l2 = p(t, 6.5, 0.35, E.out);
  const how = p(t, 8.2, 0.3, E.back);
  const howOut = 1 - p(t, 8.55, 0.2);
  const line: React.CSSProperties = {fontFamily: FONT_HEAD, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', textAlign: 'center'};
  return (
    <>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: y - 95, opacity: out}}>
        <div style={{...line, fontSize: 74, color: C.warm, opacity: l1, transform: `translateY(${(1 - l1) * 24}px)`, textShadow: '0 6px 24px rgba(0,0,0,0.7)'}}>انقطعت الكهرباء…</div>
        <div style={{...line, fontSize: 84, color: C.amber, opacity: l2, transform: `scale(${0.8 + 0.2 * l2})`, textShadow: `0 0 34px ${C.amber}88, 0 6px 24px rgba(0,0,0,0.7)`}}>واللمبة شغّالة!</div>
      </div>
      <div dir="rtl" style={{...line, position: 'absolute', left: 0, right: 0, top: y - 80, fontSize: 150, color: C.cyan, opacity: how * howOut, transform: `scale(${0.6 + 0.4 * how + (1 - howOut) * 0.6})`, textShadow: `0 0 50px ${C.cyan}AA, 0 8px 0 rgba(4,30,52,0.9)`}}>
        كيف؟
      </div>
    </>
  );
};

export const HookLayer: React.FC<{t: number}> = ({t}) => {
  const lastFrame = Math.floor(HOOK.end * FPS) - 1;
  const freeze = t * FPS >= lastFrame;
  const {top} = placement(t);
  const diveK = p(t, 8.35, 0.6, E.expoIn);
  const mask = `linear-gradient(to bottom, transparent ${top}px, black ${top + 120}px)`;

  return (
    <AbsoluteFill style={{background: C.bg0, overflow: 'hidden'}}>
      <Sequence durationInFrames={lastFrame} layout="none">
        <WallExtension t={t} freeze={false} />
      </Sequence>
      {freeze ? <WallExtension t={t} freeze /> : null}

      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask, filter: `contrast(1.04) saturate(1.06) brightness(${1 + diveK * 0.9})`}}>
        <Sequence durationInFrames={lastFrame} layout="none">
          <Frame t={t} freeze={false} />
        </Sequence>
        {freeze ? <Frame t={t} freeze /> : null}
        {/* zoom-blur ghosts while diving into the idea */}
        {diveK > 0.02 && !freeze
          ? [1.06, 1.14, 1.25].map((m, i) => (
              <Sequence key={i} durationInFrames={lastFrame} layout="none">
                <Frame t={t} scaleMul={1 + (m - 1) * diveK * 2} opacity={0.32 * diveK} freeze={false} />
              </Sequence>
            ))
          : null}
        {diveK > 0.02 && freeze ? [1.06, 1.14, 1.25].map((m, i) => <Frame key={i} t={t} scaleMul={1 + (m - 1) * diveK * 2} opacity={0.32 * diveK} freeze />) : null}
      </AbsoluteFill>

      {/* blackout mood: the room grows heavier after the lights die */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, transparent 40%, rgba(0,0,0,0.55) 100%)', opacity: 0.3 + 0.45 * p(t, LO, 0.3)}} />
      <Headline t={t} />
      {/* cyan grade creeping in as we enter his head */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% ${ANCHOR_Y}px, ${C.cyan}, transparent 70%)`, opacity: clamp(diveK * 1.1) * 0.85}} />
    </AbsoluteFill>
  );
};
