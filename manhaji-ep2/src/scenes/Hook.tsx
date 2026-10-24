import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {F} from '../theme';
import {clamp, drift, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutExpo, HOOK, kf, prog, spr} from '../time';
import {Button, P} from '../components/Props';

const SRC_W = 3840;
const SRC_H = 2160;
const LAST = 105; // last frame of the clip (3.55 s @ 30 fps)
export const FACE = {u: 0.504, v: 0.42};

/** card the frozen hook frame turns into before it flips over */
export const card = (t: number) => {
  const shrink = prog(t, HOOK.transition, 0.32, easeInOutQuint);
  const flip = prog(t, HOOK.transition + 0.26, 0.42, easeInOutCubic); // 0..1 -> 0..180deg
  const grow = prog(t, HOOK.transition + 0.62, 0.36, easeInOutQuint);
  const s = 1 - 0.4 * shrink + 0.4 * grow;
  return {s, angle: flip * 180, radius: 54 * shrink * (1 - grow), tilt: -4 * shrink * (1 - grow), border: 16 * shrink * (1 - grow), front: flip < 0.5, active: shrink > 0};
};

const hookCam = (t: number) => {
  const why = HOOK.why;
  const z = kf(t, [
    [0, 1.3],
    [0.45, 1.06, easeOutExpo],
    [why - 0.05, 1.14],
    [why + 0.14, 1.42, easeOutExpo],
    [HOOK.transition, 1.46],
  ]);
  const fy = kf(t, [
    [0, 0.4],
    [0.45, 0.5, easeOutExpo],
    [why - 0.05, 0.48],
    [why + 0.14, 0.43, easeOutExpo],
  ]);
  const st = t - why;
  const sh = st > 0 ? Math.exp(-st * 11) * Math.sin(st * 75) : 0;
  return {z, fx: FACE.u + drift(t, 1) * 0.002 + sh * 0.004, fy: fy + drift(t, 2) * 0.002 + sh * 0.003, rot: drift(t, 3) * 0.12 + sh * 0.4};
};

export const Hook: React.FC<{t: number}> = ({t}) => {
  const frame = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const cam = hookCam(Math.min(t, HOOK.transition));
  const c = Math.max(W / SRC_W, H / SRC_H) * cam.z;
  const vw = SRC_W * c;
  const vh = SRC_H * c;
  const ox = clamp(W / 2 - cam.fx * vw, W - vw, 0);
  const oy = clamp(H / 2 - cam.fy * vh, H - vh, 0);
  const cd = card(t);

  // «ليش؟» + the button cue
  const why = spr(t, HOOK.why - 0.02, 1.6);
  const btn = spr(t, HOOK.button - 0.08, 1.7);
  const btnOut = prog(t, HOOK.why - 0.1, 0.2);
  const flash = t > HOOK.why ? Math.exp(-(t - HOOK.why) * 9) : 0;
  const ring = t < 0.9 ? clamp(1 - t / 0.9) : 0;

  if (!cd.front) return null;
  return (
    <AbsoluteFill
      style={{
        transform: `perspective(2200px) scale(${cd.s}) rotateZ(${cd.tilt}deg) rotateY(${cd.angle}deg)`,
        borderRadius: cd.radius,
        overflow: 'hidden',
        boxShadow: cd.active ? `0 40px 90px rgba(40,30,10,0.35), 0 0 0 ${cd.border}px #FFFFFF` : undefined,
      }}
    >
      <div style={{position: 'absolute', left: ox, top: oy, width: vw, height: vh, transform: `rotate(${cam.rot}deg)`, transformOrigin: `${W / 2 - ox}px ${H / 2 - oy}px`}}>
        <Freeze frame={Math.min(frame, t >= HOOK.transition ? Math.round(HOOK.transition * 30) : LAST)}>
          <OffthreadVideo src={staticFile('media/hook_4k.mp4')} muted style={{width: vw, height: vh}} />
        </Freeze>
      </div>
      {/* grade: gentle teal/warm split + vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, transparent 50%, rgba(5,10,16,0.5) 100%)'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 18%, rgba(255,200,69,${0.35 * flash}), transparent 55%)`, mixBlendMode: 'screen'}} />
      {/* the bell rings as the clip opens */}
      {ring > 0 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].map((i) => {
            const ph = clamp(t / 0.9 + i * 0.18) % 1;
            return <circle key={i} cx={W / 2} cy={330} r={60 + ph * 520} fill="none" stroke={P.yellow} strokeWidth={8} opacity={(1 - ph) * ring * 0.7} />;
          })}
        </svg>
      )}
      {btn > 0.001 && btnOut < 1 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center', opacity: clamp(btn * 3) * (1 - btnOut), transform: `scale(${Math.min(1.1, btn)})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '10px 34px 10px 14px', direction: 'rtl', boxShadow: '0 20px 50px rgba(0,0,0,0.35)'}}>
            <Button size={96} press={clamp((t - HOOK.button) * 4) * (1 - clamp((t - HOOK.button - 0.3) * 4))} />
            <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 64, color: P.ink}}>الزر</div>
          </div>
        </div>
      )}
      {why > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: F.kufi,
              fontWeight: 900,
              fontSize: 230,
              lineHeight: 1.2,
              color: P.yellow,
              transform: `scale(${0.3 + 0.7 * easeOutBack(clamp(why), 2.4)}) rotate(${(1 - clamp(why)) * -10}deg)`,
              opacity: clamp(why * 3),
              WebkitTextStroke: '8px #0B0E12',
              paintOrder: 'stroke fill',
              textShadow: '0 16px 0 #0B0E12, 0 30px 60px rgba(0,0,0,0.5)',
              direction: 'rtl',
            }}
          >
            ليش؟
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
