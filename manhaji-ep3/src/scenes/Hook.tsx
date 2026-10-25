import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {F} from '../theme';
import {clamp, drift, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutExpo, HOOK, kf, prog, spr} from '../time';
import {Button, P} from '../components/Props';

const SRC_W = 2880;
const SRC_H = 1620;
const LAST = 110; // last composition frame with picture (3.709 s @ 30 fps)
export const FACE = {u: 0.53, v: 0.42};
const PANEL = {x: 0, y: 230, w: 1080, h: 1440};

/** the frozen hook frame becomes a card that flips over into the motion world */
export const card = (t: number) => {
  const shrink = prog(t, HOOK.transition, 0.32, easeInOutQuint);
  const flip = prog(t, HOOK.transition + 0.26, 0.42, easeInOutCubic);
  const grow = prog(t, HOOK.transition + 0.62, 0.36, easeInOutQuint);
  const s = 1 - 0.4 * shrink + 0.4 * grow;
  return {s, angle: flip * 180, radius: 54 * shrink * (1 - grow), tilt: -4 * shrink * (1 - grow), border: 16 * shrink * (1 - grow), front: flip < 0.5, active: shrink > 0};
};

const hookCam = (t: number) => {
  const why = HOOK.why;
  const z = kf(t, [
    [0, 1.22],
    [0.4, 1.0, easeOutExpo],
    [HOOK.notPressed - 0.05, 1.06],
    [HOOK.notPressed + 0.12, 1.14, easeOutExpo],
    [why - 0.05, 1.16],
    [why + 0.14, 1.38, easeOutExpo],
    [HOOK.transition, 1.4],
  ]);
  const fy = kf(t, [
    [0, 0.4],
    [0.4, 0.5, easeOutExpo],
    [why - 0.05, 0.48],
    [why + 0.14, 0.43, easeOutExpo],
  ]);
  const st = t - why;
  const sh = st > 0 ? Math.exp(-st * 11) * Math.sin(st * 75) : 0;
  return {z, fx: FACE.u - 0.03 + drift(t, 1) * 0.002 + sh * 0.004, fy: fy + drift(t, 2) * 0.002 + sh * 0.003, rot: drift(t, 3) * 0.1 + sh * 0.4};
};

const Line: React.FC<{k: number; children: React.ReactNode; size?: number; color?: string; bg?: string}> = ({k, children, size = 74, color = P.ink, bg = '#FFFFFF'}) =>
  k > 0.001 ? (
    <div
      style={{
        fontFamily: F.kufi,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.25,
        color,
        background: bg,
        padding: `${size * 0.06}px ${size * 0.5}px ${size * 0.22}px`,
        borderRadius: size * 0.36,
        direction: 'rtl',
        whiteSpace: 'nowrap',
        boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        transform: `scale(${0.5 + 0.5 * easeOutBack(clamp(k), 2)}) rotate(${(1 - clamp(k)) * -6}deg)`,
        opacity: clamp(k * 3),
      }}
    >
      {children}
    </div>
  ) : null;

export const Hook: React.FC<{t: number}> = ({t}) => {
  const frame = useCurrentFrame();
  const W = 1080;
  const H = 1920;
  const cam = hookCam(Math.min(t, HOOK.transition));
  const c = Math.max(PANEL.w / SRC_W, PANEL.h / SRC_H) * cam.z;
  const vw = SRC_W * c;
  const vh = SRC_H * c;
  const ox = clamp(PANEL.w / 2 - cam.fx * vw, PANEL.w - vw, 0);
  const oy = clamp(PANEL.h / 2 - cam.fy * vh, PANEL.h - vh, 0);
  const cd = card(t);
  const fr = Math.min(frame, t >= HOOK.transition ? Math.round(HOOK.transition * 30) : LAST);

  const l1 = spr(t, HOOK.bell + 0.05, 1.6) * (1 - prog(t, HOOK.but - 0.1, 0.2));
  const l2 = spr(t, HOOK.but, 1.6) * (1 - prog(t, HOOK.why - 0.1, 0.2));
  const why = spr(t, HOOK.why - 0.02, 1.6);
  const press = clamp((t - HOOK.notPressed) * 3);
  const flash = t > HOOK.why ? Math.exp(-(t - HOOK.why) * 9) : 0;

  if (!cd.front) return null;
  return (
    <AbsoluteFill
      style={{
        transform: `perspective(2200px) scale(${cd.s}) rotateZ(${cd.tilt}deg) rotateY(${cd.angle}deg)`,
        borderRadius: cd.radius,
        overflow: 'hidden',
        background: '#0B0E12',
        boxShadow: cd.active ? `0 40px 90px rgba(40,30,10,0.35), 0 0 0 ${cd.border}px #FFFFFF` : undefined,
      }}
    >
      {/* blurred plate of the same shot fills the 9:16 frame */}
      <div style={{position: 'absolute', left: -200, top: -120, width: W + 400, height: H + 240, filter: 'blur(42px) brightness(0.5) saturate(1.2)'}}>
        <Freeze frame={fr}>
          <OffthreadVideo src={staticFile('media/hook.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </Freeze>
      </div>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          overflow: 'hidden',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 70px, #000 calc(100% - 90px), transparent 100%)',
        }}
      >
        <div style={{position: 'absolute', left: ox, top: oy, width: vw, height: vh, transform: `rotate(${cam.rot}deg)`, transformOrigin: `${PANEL.w / 2 - ox}px ${PANEL.h / 2 - oy}px`}}>
          <Freeze frame={fr}>
            <OffthreadVideo src={staticFile('media/hook.mp4')} muted style={{width: vw, height: vh}} />
          </Freeze>
        </div>
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(5,10,16,0.45) 100%)'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 22%, rgba(255,200,69,${0.35 * flash}), transparent 55%)`, mixBlendMode: 'screen'}} />

      {/* captions from the script */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1470, display: 'flex', justifyContent: 'center'}}>
        <Line k={l1}>الجرس دق…</Line>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1440, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20}}>
        {l2 > 0.001 && (
          <div style={{display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${Math.min(1.08, l2)})`, opacity: clamp(l2 * 3), direction: 'rtl'}}>
            <div style={{position: 'relative', width: 120, height: 120}}>
              <Button size={120} press={0} off={press} />
              <svg width={120} height={120} viewBox="0 0 120 120" style={{position: 'absolute', inset: 0}}>
                <path d={`M 22 98 L ${22 + 76 * press} ${98 - 76 * press}`} stroke={P.red} strokeWidth={12} strokeLinecap="round" />
              </svg>
            </div>
            <Line k={1} size={64}>
              بس ما انضغط الزر!
            </Line>
          </div>
        )}
      </div>
      {why > 0.001 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              fontFamily: F.kufi,
              fontWeight: 900,
              fontSize: 220,
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
