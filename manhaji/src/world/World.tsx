import React from 'react';
import {random} from 'remotion';
import {C, FONT_HEAD, H, W} from '../theme';
import {OUTRO, POS, SceneKey} from '../timeline';
import {E, clamp, p} from '../lib/anim';
import {Cam, cameraAt} from './camera';
import {S1Blackout} from '../scenes/S1Blackout';
import {S2Question} from '../scenes/S2Question';
import {S3Logic} from '../scenes/S3Logic';
import {S4Truth} from '../scenes/S4Truth';
import {S5Compound} from '../scenes/S5Compound';
import {S6Venn} from '../scenes/S6Venn';

const SCENES: {key: SceneKey; C: React.FC<{t: number}>; tag: string; from: number}[] = [
  {key: 's1', C: S1Blackout, tag: '٠١ · الموقف', from: 0},
  {key: 's2', C: S2Question, tag: '٠٢ · السؤال', from: 17},
  {key: 's3', C: S3Logic, tag: '٠٣ · العبارة', from: 22.5},
  {key: 's4', C: S4Truth, tag: '٠٤ · True / False', from: 30.5},
  {key: 's5', C: S5Compound, tag: '٠٥ · فصل ووصل', from: 42.3},
  {key: 's6', C: S6Venn, tag: '٠٦ · أشكال فن', from: 57.8},
];

// the board traces that connect module to module (the camera "rides the current" along them)
const LINKS: {d: string; t0: number; t1: number}[] = [
  {d: `M 540 0 H 1060`, t0: 17.45, t1: 18.25},
  {d: `M 1600 960 V 1440`, t0: 22.95, t1: 24.0},
  {d: `M 1060 2400 H 540`, t0: 30.95, t1: 31.75},
  {d: `M 0 3360 V 3840`, t0: 42.65, t1: 43.55},
  {d: `M 540 4800 H 1060`, t0: 58.2, t1: 59.1},
];

/** pseudo-random Manhattan traces scattered over the board */
const makeTraces = (seed: string, n: number, spread: [number, number, number, number]) =>
  Array.from({length: n}).map((_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    let x = spread[0] + r('x') * (spread[2] - spread[0]);
    let y = spread[1] + r('y') * (spread[3] - spread[1]);
    let d = `M ${x.toFixed(0)} ${y.toFixed(0)}`;
    const steps = 2 + Math.floor(r('n') * 3);
    for (let s = 0; s < steps; s++) {
      const len = 80 + r(`l${s}`) * 360;
      if ((s + Math.floor(r('o') * 2)) % 2) x += (r(`dx${s}`) > 0.5 ? 1 : -1) * len;
      else y += (r(`dy${s}`) > 0.5 ? 1 : -1) * len;
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    return {d, end: {x, y}, w: r('w')};
  });

const FAR_TRACES = makeTraces('far', 70, [-2400, -2600, 4000, 7600]);
const NEAR_TRACES = makeTraces('near', 90, [-900, -1300, 2500, 6100]);
const DUST = Array.from({length: 60}).map((_, i) => ({
  x: random(`dx${i}`) * 5200 - 1800,
  y: random(`dy${i}`) * 9000 - 1600,
  r: 2 + random(`dr${i}`) * 5,
  ph: random(`dp${i}`) * 6.28,
}));
const BOKEH = Array.from({length: 14}).map((_, i) => ({
  x: random(`bx${i}`) * 4600 - 1500,
  y: random(`by${i}`) * 8400 - 1400,
  r: 40 + random(`br${i}`) * 90,
  c: i % 3 === 0 ? C.turq : C.sky,
}));

/** transform for a layer at a given parallax depth (1 = the board itself) */
const layerTransform = (cam: Cam, depth: number) => {
  const z = Math.pow(cam.z, depth);
  return `translate(${W / 2}px, ${H / 2}px) rotate(${cam.r * depth}deg) scale(${z}) translate(${-cam.x * depth}px, ${-cam.y * depth}px)`;
};

const visible = (cam: Cam, x: number, y: number) => {
  const mx = W / 2 / cam.z + 900;
  const my = H / 2 / cam.z + 1200;
  return Math.abs(cam.x - x) < mx && Math.abs(cam.y - y) < my;
};

export const World: React.FC<{t: number; opacity?: number}> = ({t, opacity = 1}) => {
  const cam = cameraAt(t);
  const prev = cameraAt(t - 1 / 30);
  // screen-space velocity → directional motion blur
  const vx = (cam.x - prev.x) * cam.z;
  const vy = (cam.y - prev.y) * cam.z;
  const vz = Math.abs(Math.log(cam.z / prev.z)) * 700;
  const bx = Math.min(26, Math.abs(vx) * 0.45 + vz * 0.5);
  const by = Math.min(26, Math.abs(vy) * 0.45 + vz * 0.5);
  const blur = bx > 0.6 || by > 0.6;
  const tilted = cam.tilt > 0.05;
  const overview = p(t, OUTRO.pullBack + 0.6, 1.2, E.inOut);

  return (
    <div style={{position: 'absolute', inset: 0, opacity, overflow: 'hidden', background: `radial-gradient(ellipse at 50% 42%, ${C.bg2} 0%, ${C.bg1} 45%, ${C.bg0} 100%)`}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="mblur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
        </filter>
      </svg>

      <div style={{position: 'absolute', inset: 0, filter: blur ? 'url(#mblur)' : undefined}}>
        {/* far blueprint grid */}
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: layerTransform(cam, 0.35)}}>
          <div
            style={{
              position: 'absolute',
              left: -6000,
              top: -6000,
              width: 14000,
              height: 20000,
              backgroundImage: `linear-gradient(${C.lineSoft} 2px, transparent 2px), linear-gradient(90deg, ${C.lineSoft} 2px, transparent 2px)`,
              backgroundSize: '320px 320px',
              opacity: 0.7,
            }}
          />
          <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
            {FAR_TRACES.map((tr, i) => (
              <g key={i} opacity={0.18 + tr.w * 0.18}>
                <path d={tr.d} fill="none" stroke={C.sky} strokeWidth={4} />
                <circle cx={tr.end.x} cy={tr.end.y} r={9} fill="none" stroke={C.sky} strokeWidth={3} />
              </g>
            ))}
          </svg>
        </div>

        {/* mid dust */}
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: layerTransform(cam, 0.7)}}>
          {DUST.map((d, i) => (
            <div key={i} style={{position: 'absolute', left: d.x, top: d.y + Math.sin(t * 0.6 + d.ph) * 30, width: d.r * 2, height: d.r * 2, borderRadius: '50%', background: C.sky, opacity: 0.25 + 0.2 * Math.sin(t + d.ph)}} />
          ))}
        </div>

        {/* the board itself (with a 3D tilt during travel) */}
        <div style={{position: 'absolute', inset: 0, perspective: tilted ? 1900 : undefined, perspectiveOrigin: '50% 50%'}}>
          <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px)${tilted ? ` rotateX(${cam.tilt}deg)` : ''} rotate(${cam.r}deg) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`}}>
            <div
              style={{
                position: 'absolute',
                left: -3000,
                top: -3000,
                width: 8000,
                height: 14000,
                backgroundImage: `linear-gradient(rgba(56,189,248,0.045) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(56,189,248,0.045) 1.5px, transparent 1.5px)`,
                backgroundSize: '60px 60px',
              }}
            />
            <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
              {NEAR_TRACES.map((tr, i) => (
                <g key={i} opacity={0.22 + tr.w * 0.15}>
                  <path d={tr.d} fill="none" stroke="#1F4566" strokeWidth={5} strokeLinejoin="round" />
                  <circle cx={tr.end.x} cy={tr.end.y} r={8} fill="#1F4566" />
                </g>
              ))}
              {/* module-to-module traces with a current pulse during camera travel */}
              {LINKS.map((l, i) => {
                const k = clamp((t - l.t0) / (l.t1 - l.t0));
                const lit = Math.max(p(t, l.t0, 0.4), overview);
                const pulse = Math.max(0, Math.sin(clamp((t - OUTRO.pullBack - 1 - i * 0.2) / 0.8) * Math.PI));
                return (
                  <g key={i}>
                    <path d={l.d} stroke="#1B3A57" strokeWidth={22} strokeLinecap="round" fill="none" />
                    <path d={l.d} stroke={C.cyan} strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.25 + 0.5 * lit + pulse * 0.25} />
                    <path d={l.d} stroke="#E9FDFF" strokeWidth={10} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="0.18 1.2" strokeDashoffset={0.18 - k * 1.2} opacity={k > 0 && k < 1 ? 1 : 0} />
                  </g>
                );
              })}
            </svg>

            {SCENES.map(({key, C: Scene, tag, from}) => {
              const [x, y] = POS[key];
              const show = visible(cam, x, y) || overview > 0;
              return (
                <div key={key} style={{position: 'absolute', left: x - W / 2, top: y - H / 2, width: W, height: H}}>
                  {/* module frame */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 30,
                      top: 60,
                      right: 30,
                      bottom: 60,
                      borderRadius: 56,
                      border: `2px solid rgba(56,189,248,${0.16 + 0.3 * overview})`,
                      background: 'linear-gradient(170deg, rgba(14,38,62,0.35), rgba(4,12,22,0.25))',
                      boxShadow: overview > 0 ? `0 0 ${80 * overview}px rgba(34,211,238,${0.25 * overview})` : undefined,
                    }}
                  />
                  <div dir="rtl" style={{position: 'absolute', right: 90, top: 86, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 30, color: C.sky, opacity: 0.35 + 0.65 * overview, transform: `scale(${1 + overview * 1.8})`, transformOrigin: '100% 0'}}>
                    {tag}
                  </div>
                  {show && t >= from ? <Scene t={t} /> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* foreground bokeh (closer than the board → moves faster) */}
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: layerTransform(cam, 1.45)}}>
          {BOKEH.map((b, i) => (
            <div key={i} style={{position: 'absolute', left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}55, transparent 70%)`, filter: 'blur(6px)', opacity: 0.55}} />
          ))}
        </div>
      </div>
    </div>
  );
};
