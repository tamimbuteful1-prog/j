import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, drift, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutExpo, INTRO, kf, prog, spr} from '../time';
import {LogoMark, Pill} from '../components/Kit';

const SRC_W = 1920;
const SRC_H = 1080;
const LAST_FRAME = 110; // last composition frame that still has a video frame (3.708s @30fps)

export type Panel = {x: number; y: number; w: number; h: number};

/** digital camera on the footage: zoom + focus point in source-normalised coords */
export const introCam = (t: number, isV: boolean) => {
  const I = INTRO;
  const snap = I.illaAlyoum;
  // landscape keeps the hands in frame; vertical uses softer zooms (the panel is already a crop)
  const zMul = isV ? 0.55 : 1;
  const z = kf(t, [
    [0, 1.38],
    [0.38, 1.1, easeOutExpo],
    [1.2, 1.15],
    [snap - 0.02, 1.2],
    [snap + 0.16, 1.32, easeOutExpo],
    [I.transition, 1.37],
    [3.2, 1.5, easeInOutCubic],
  ]);
  const fx = kf(t, [
    [0, 0.5],
    [snap - 0.02, 0.5],
    [snap + 0.16, isV ? 0.5 : 0.41, easeOutExpo],
    [I.transition, isV ? 0.5 : 0.415],
    [3.2, 0.5],
  ]);
  const fy = kf(t, [
    [0, 0.36],
    [0.38, 0.47, easeOutExpo],
    [1.2, 0.46],
    [snap - 0.02, 0.45],
    [snap + 0.16, 0.44, easeOutExpo],
    [I.transition, 0.42],
    [3.2, 0.34],
  ]);
  // natural handheld drift + a short decaying shake on the punch-in
  const st = t - snap;
  const shake = st > 0 ? Math.exp(-st * 11) * Math.sin(st * 75) : 0;
  return {
    z: 1 + (z - 1) * zMul,
    fx: fx + drift(t, 1) * 0.0025 + shake * 0.004,
    fy: fy + drift(t, 2) * 0.0025 + shake * 0.003,
    rot: drift(t, 3) * 0.12 + shake * 0.35,
  };
};

/** where a source-normalised point lands on screen */
export const videoLayout = (panel: Panel, cam: {z: number; fx: number; fy: number}) => {
  const c = Math.max(panel.w / SRC_W, panel.h / SRC_H) * cam.z;
  const vw = SRC_W * c;
  const vh = SRC_H * c;
  let ox = panel.w / 2 - cam.fx * vw;
  let oy = panel.h / 2 - cam.fy * vh;
  ox = clamp(ox, panel.w - vw, 0);
  oy = clamp(oy, panel.h - vh, 0);
  return {vw, vh, ox, oy, at: (u: number, v: number) => ({x: panel.x + ox + u * vw, y: panel.y + oy + v * vh})};
};

export const FACE = {u: 0.5, v: 0.33};

export const Intro: React.FC<{t: number; irisTo: {x: number; y: number}}> = ({t, irisTo}) => {
  const frame = useCurrentFrame();
  const {W, H, isV, p} = useLayout();
  const I = INTRO;
  const panel: Panel = isV ? {x: 0, y: 170, w: W, h: 1440} : {x: 0, y: 0, w: W, h: H};
  const cam = introCam(t, isV);
  const L = videoLayout(panel, cam);

  // iris: cover -> ring around the face -> fly into the avatar bubble on the map
  const face = L.at(FACE.u, FACE.v);
  const cover = Math.hypot(W, H);
  const k1 = prog(t, I.transition, 0.3, easeInOutCubic);
  const k2 = prog(t, I.transition + 0.26, 0.44, easeInOutQuint);
  const r = k2 > 0 ? 260 + (42 - 260) * k2 : cover + (260 - cover) * k1;
  const cx = face.x + (irisTo.x - face.x) * k2;
  const cy = face.y + (irisTo.y - face.y) * k2;
  const irisOn = t >= I.transition;

  const vid = (
    <Freeze frame={Math.min(frame, LAST_FRAME)}>
      <OffthreadVideo src={staticFile('media/intro_1080.mp4')} muted style={{width: L.vw, height: L.vh}} />
    </Freeze>
  );

  // «إلا اليوم!» kinetic type
  const s1 = spr(t, I.illaAlyoum, 1.5);
  const s2 = spr(t, I.illaAlyoum + 0.2, 1.4);
  const out = prog(t, I.transition - 0.06, 0.22, easeInOutCubic);
  const bar = prog(t, I.illaAlyoum + 0.16, 0.22, easeOutExpo);
  const burst = prog(t, I.illaAlyoum + 0.18, 0.5, easeOutExpo);
  const textBox = p({x: 70, y: 330, w: 640}, {x: 0, y: 1290, w: W});

  const flash0 = 1 - prog(t, 0, 0.28, easeOutExpo);
  const flash1 = t > I.illaAlyoum ? Math.exp(-(t - I.illaAlyoum) * 9) : 0;

  const tagIn = spr(t, 0.25, 1.3);
  const tagOut = prog(t, I.illaAlyoum - 0.25, 0.25);

  return (
    <>
    <AbsoluteFill style={{clipPath: irisOn ? `circle(${r}px at ${cx}px ${cy}px)` : undefined}}>
      {isV && (
        <AbsoluteFill style={{overflow: 'hidden'}}>
          {/* blurred plate behind the vertical crop */}
          <div style={{position: 'absolute', left: -200, top: -100, width: W + 400, height: H + 200, filter: 'blur(40px) brightness(0.45) saturate(1.2)'}}>
            <Freeze frame={Math.min(frame, LAST_FRAME)}>
              <OffthreadVideo src={staticFile('media/intro_1080.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </Freeze>
          </div>
        </AbsoluteFill>
      )}
      <div
        style={{
          position: 'absolute',
          left: panel.x,
          top: panel.y,
          width: panel.w,
          height: panel.h,
          overflow: 'hidden',
          WebkitMaskImage: isV ? 'linear-gradient(to bottom, transparent 0, #000 90px, #000 calc(100% - 90px), transparent 100%)' : undefined,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `translate(${cx - face.x}px, ${cy - face.y}px) scale(${k2 > 0 ? r / 260 : 1})`, transformOrigin: `${face.x - panel.x}px ${face.y - panel.y}px`}}>
          <div style={{position: 'absolute', left: L.ox, top: L.oy, transform: `rotate(${cam.rot}deg)`, transformOrigin: `${-L.ox + panel.w / 2}px ${-L.oy + panel.h / 2}px`}}>{vid}</div>
        </div>
      </div>

      {/* subtle grade + vignette */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(5,8,12,0.55) 100%)'}} />

      {/* light leaks */}
      <AbsoluteFill style={{background: `radial-gradient(circle at 85% 10%, rgba(34,211,197,${0.55 * flash0}), transparent 55%)`, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: `rgba(255,255,255,${0.85 * flash0 * flash0})`}} />
      <AbsoluteFill
        style={{background: `radial-gradient(circle at ${p(25, 50)}% ${p(50, 75)}%, rgba(255,200,69,${0.45 * flash1}), transparent 60%)`, mixBlendMode: 'screen'}}
      />

      {/* episode tag */}
      <div
        style={{
          position: 'absolute',
          top: p(56, 70),
          right: p(64, undefined),
          left: p(undefined, 0),
          width: p(undefined, W),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          direction: 'rtl',
          opacity: clamp(tagIn) * (1 - tagOut),
          transform: `translateY(${(1 - clamp(tagIn)) * -40 - tagOut * 30}px)`,
        }}
      >
        <LogoMark size={64} k={clamp((t - 0.25) * 1.6)} />
        <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 40, color: C.text, textShadow: '0 4px 20px rgba(0,0,0,0.6)'}}>منهجي</div>
        <Pill size={26} bg="rgba(255,255,255,0.14)" color={C.text} style={{backdropFilter: 'blur(6px)'}}>
          الحلقة 1
        </Pill>
      </div>

      {/* «إلا اليوم!» */}
      {t >= I.illaAlyoum - 0.02 && (
        <div
          style={{
            position: 'absolute',
            left: textBox.x,
            top: textBox.y,
            width: textBox.w,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            direction: 'rtl',
            opacity: 1 - out,
            transform: `scale(${1 - out * 0.3}) translateY(${out * -40}px)`,
          }}
        >
          <div
            style={{
              fontFamily: F.kufi,
              fontWeight: 900,
              fontSize: p(96, 92),
              color: C.text,
              lineHeight: 1.1,
              transform: `scale(${0.4 + 0.6 * s1}) rotate(${(1 - clamp(s1)) * -8}deg)`,
              textShadow: '0 8px 30px rgba(0,0,0,0.6)',
              opacity: clamp(s1 * 3),
            }}
          >
            إلا
          </div>
          <div style={{position: 'relative', marginTop: 6}}>
            {/* burst lines */}
            <svg width={560} height={300} viewBox="-280 -150 560 300" style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible'}}>
              {Array.from({length: 12}).map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const r0 = 150 + burst * 60;
                const r1 = r0 + 50 * (1 - burst);
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * r0 * 1.2}
                    y1={Math.sin(a) * r0 * 0.6}
                    x2={Math.cos(a) * r1 * 1.2}
                    y2={Math.sin(a) * r1 * 0.6}
                    stroke={i % 2 ? C.yellow : C.teal}
                    strokeWidth={7}
                    strokeLinecap="round"
                    opacity={burst > 0 && burst < 1 ? 1 - burst : 0}
                  />
                );
              })}
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: '6% -6% 2%',
                background: C.yellow,
                borderRadius: 26,
                transform: `scaleX(${bar}) rotate(-2deg)`,
                transformOrigin: 'right center',
                boxShadow: `0 20px 60px rgba(255,200,69,0.35)`,
              }}
            />
            <div
              style={{
                position: 'relative',
                fontFamily: F.kufi,
                fontWeight: 900,
                fontSize: p(150, 150),
                color: bar > 0.5 ? '#0B0E12' : C.text,
                lineHeight: 1.25,
                padding: '0 30px 10px',
                transform: `scale(${(0.3 + 0.7 * easeOutBack(clamp(s2), 2.2)) || 0})`,
                opacity: clamp(s2 * 3),
                whiteSpace: 'nowrap',
              }}
            >
              اليوم!
            </div>
          </div>
        </div>
      )}

    </AbsoluteFill>
    {/* ring that hugs the iris */}
    {irisOn && (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={C.yellow} strokeWidth={8} opacity={clamp(k1 * 3) * (1 - clamp((k2 - 0.9) * 10))} />
      </svg>
    )}
    </>
  );
};
