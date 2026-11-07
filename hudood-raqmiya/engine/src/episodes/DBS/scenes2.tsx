import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {EASE, ramp} from '../../lib/anim';
import {VIDEO} from '../../theme';
import mapData from '../../lib/saudi-map.json';
import {Beam, Blinds, Cam, Dust, Glow, K} from './look';
import {Block, Book, Bubble, Download, Emblem, EyeOff, Flag, Flame, Plug, Scale, Verify, Zip} from './icons';
import {Desk} from './scenes1';

const useT = () => useCurrentFrame() / VIDEO.fps;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** S4 — four ways people react, laid on the desk like evidence; only the fourth holds up */
export const S4Reactions: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const slots: [number, number][] = [[760, 640], [320, 640], [760, 1250], [320, 1250]];
  const lands = [0.3, 1.4, 2.5, 3.6];
  const verdict = ramp(f, 4.6, 5.4, EASE.inOut);
  const push = interpolate(t, [0, 4.6], [1, 1.06], cl) * (1 + verdict * 0.7);
  const tgt = slots[3];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cam s={push} ox={tgt[0] * verdict + 540 * (1 - verdict)} oy={tgt[1] * verdict + 960 * (1 - verdict)}>
        <Desk tone="#101722" />
        <Glow x={540} y={940} r={760} c="rgba(255,195,135,0.2)" />
        {slots.map(([x, y], i) => {
          const k = ramp(f, lands[i] - 0.45, lands[i], EASE.out);
          const after = ramp(f, lands[i] + 0.2, lands[i] + 0.9);
          const dim = i < 3 ? verdict * 0.75 : 0;
          const glow = i === 3 ? after : 0;
          const flick = Math.sin(t * 23) * 0.5 + Math.sin(t * 37) * 0.5;
          return (
            <div key={i} style={{position: 'absolute', left: x - 200, top: y - 260, width: 400, height: 520, opacity: k * (1 - dim), transform: `translateX(${(1 - k) * -900}px) rotate(${(1 - k) * -25 + (i % 2 ? 3 : -3)}deg)`, borderRadius: 16, background: i === 3 ? '#e4f3ec' : '#d3dbe4', boxShadow: `0 40px 80px rgba(0,0,0,0.65), 0 0 ${90 * glow}px rgba(116,227,176,${0.55 * glow})`, filter: i === 0 ? `grayscale(${after})` : undefined}}>
              <svg viewBox="-200 -260 400 520" style={{width: '100%', height: '100%'}}>
                <rect x={-170} y={-230} width={340} height={340} rx={10} fill="#0e1824" />
                <g transform="translate(0 -40) scale(1.3)">
                  {i === 0 && (
                    <g opacity={1 - 0.5 * after}>
                      <Bubble c="#8796a8" />
                      <Zip c="#8796a8" />
                    </g>
                  )}
                  {i === 1 && (
                    <>
                      <Bubble c={K.amber} />
                      <g transform="scale(0.62) translate(0 -18)">
                        <Scale k={after} />
                      </g>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <Bubble c={K.red} />
                      <g transform="scale(0.55) translate(0 -10)">
                        <Flame flick={flick} />
                      </g>
                      {/* the flame catching on to neighbours */}
                      {[[-120, 70], [120, 60], [-100, -120], [110, -130]].map(([bx, by], j) => {
                        const c = ramp(f, lands[2] + 0.3 + j * 0.15, lands[2] + 0.6 + j * 0.15);
                        return (
                          <g key={j} transform={`translate(${bx} ${by}) scale(${0.28 * c})`} opacity={c}>
                            <Bubble c={K.red} w={10} />
                            <g transform="scale(0.6)">
                              <Flame flick={-flick} />
                            </g>
                          </g>
                        );
                      })}
                    </>
                  )}
                  {i === 3 && (
                    <>
                      <Bubble c={K.green} />
                      <g transform="scale(0.7) translate(0 -14)">
                        <Verify />
                      </g>
                    </>
                  )}
                </g>
                {/* blank evidence lines */}
                {[150, 185, 220].map((yy, j) => (
                  <rect key={yy} x={-150} y={yy} width={300 - j * 70} height={14} rx={7} fill="#9aa8b8" opacity={0.6} />
                ))}
                {/* the fourth gets the investigator's green check */}
                {i === 3 && (
                  <path d="M 90 170 L 120 200 L 170 140" fill="none" stroke="#1a9a64" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={140} strokeDashoffset={140 * (1 - after)} />
                )}
                {i < 3 && (
                  <g stroke="#b2324a" strokeWidth={12} strokeLinecap="round" opacity={verdict}>
                    <line x1={110} y1={140} x2={170} y2={200} />
                    <line x1={170} y1={140} x2={110} y2={200} />
                  </g>
                )}
              </svg>
            </div>
          );
        })}
        <Blinds a={0.35} angle={-18} speed={10} />
      </Cam>
      <Dust n={36} a={0.5} />
    </AbsoluteFill>
  );
};

/** S5 — the soldier in the doorway; his phone becomes the digital border, and he holds it */
export const S5Border: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const door = 1 - ramp(f, 2.0, 2.8, EASE.inOut);
  const wall = ramp(f, 2.2, 3.0, EASE.out);
  const BY = 1060;
  const hits = [
    {at: 3.25, x: 300, icon: Block},
    {at: 3.95, x: 760, icon: Flag},
    {at: 4.65, x: 520, icon: EyeOff},
  ];
  const lift = interpolate(t, [0, 2.4], [1.18, 1.0], {...cl, easing: EASE.soft});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {/* the doorway */}
      <AbsoluteFill style={{opacity: door}}>
        <Cam s={lift} oy={1300}>
          <AbsoluteFill style={{background: '#04070b'}} />
          <div style={{position: 'absolute', left: 300, top: 360, width: 480, height: 1080, background: 'linear-gradient(180deg, #cfe6ff, #7fb8ea 60%, #2a5d8a)', boxShadow: '0 0 160px rgba(120,196,252,0.6)'}} />
          {/* floor light spill + long shadow toward the camera */}
          <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <defs>
              <linearGradient id="spill5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#9fd0fb" stopOpacity={0.55} />
                <stop offset="1" stopColor="#9fd0fb" stopOpacity={0} />
              </linearGradient>
              <filter id="b5">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <polygon points="300,1440 780,1440 1080,1920 0,1920" fill="url(#spill5)" />
            <path d="M 510 1440 L 570 1440 L 640 1920 L 440 1920 Z" fill="#000" opacity={0.85} filter="url(#b5)" />
            {/* the soldier, backlit: steady stance, phone held at chest, glowing */}
            <g fill="#020305">
              <circle cx={540} cy={760} r={56} />
              <path d="M 450 830 C 460 820, 620 820, 630 830 L 660 1100 L 620 1110 L 610 1440 L 560 1440 L 545 1160 L 535 1160 L 520 1440 L 470 1440 L 460 1110 L 420 1100 Z" />
            </g>
          </svg>
          <Glow x={540} y={960} r={90} c="rgba(120,196,252,0.95)" a={0.6 + 0.4 * Math.sin(t * 3) ** 2} />
          <Beam x={540} y={420} tx={540} ty={1800} w0={220} w1={620} c="rgba(170,215,255,0.16)" />
          <Dust n={60} a={0.8} box={[260, 300, 560, 1500]} />
        </Cam>
      </AbsoluteFill>
      {/* the digital border */}
      <AbsoluteFill style={{opacity: wall}}>
        <Cam s={interpolate(t, [2.2, 6.6], [1.12, 1], cl)} shake={1.4}>
          <AbsoluteFill style={{background: `linear-gradient(180deg, #12060a 0%, #0a0d16 ${(BY / 1920) * 100}%, #06140f 100%)`}} />
          <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <defs>
              <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse">
                <path d="M15 0 L45 0 L60 26 L45 52 L15 52 L0 26 Z" fill="none" stroke="rgba(120,196,252,0.4)" strokeWidth={2} />
              </pattern>
              <linearGradient id="shieldfade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity={0} />
                <stop offset="1" stopColor="#fff" stopOpacity={1} />
              </linearGradient>
              <mask id="sm">
                <rect x={0} y={BY - 520} width={1080} height={520} fill="url(#shieldfade)" />
              </mask>
            </defs>
            <rect x={0} y={BY - 520} width={1080} height={520} fill="url(#hex)" mask="url(#sm)" />
            {/* home side: warm green city points below the line */}
            {Array.from({length: 70}).map((_, i) => (
              <circle key={i} cx={random(`hx${i}`) * 1080} cy={BY + 120 + random(`hy${i}`) * 760} r={2 + random(`hr${i}`) * 4} fill={K.green} opacity={0.25 + 0.5 * random(`ho${i}`) * (0.6 + 0.4 * Math.sin(t * 2 + i))} />
            ))}
            {/* incoming attacks from the outside world */}
            {Array.from({length: 22}).map((_, i) => {
              const a0 = 2.4 + i * 0.18;
              const k = interpolate(t, [a0, a0 + 0.8], [0, 1], cl);
              if (k <= 0 || k >= 1) return null;
              const x = 120 + random(`ax${i}`) * 840;
              const y = -100 + k * (BY + 100);
              return (
                <g key={i}>
                  <line x1={x} y1={y - 240} x2={x} y2={y} stroke={K.red} strokeWidth={5} strokeLinecap="round" opacity={0.75} />
                  <circle cx={x} cy={y} r={12} fill={K.red} />
                </g>
              );
            })}
            {/* the three moves: block, report, hide — each a ripple that kills an attack */}
            {hits.map(({at, x, icon: Icon}, i) => {
              const r = ramp(f, at, at + 0.7);
              const show = ramp(f, at - 0.05, at + 0.15) * (1 - ramp(f, at + 0.9, at + 1.3));
              return (
                <g key={i}>
                  <ellipse cx={x} cy={BY} rx={40 + r * 360} ry={10 + r * 70} fill="none" stroke={K.blue} strokeWidth={6 * (1 - r)} opacity={1 - r} />
                  {Array.from({length: 16}).map((_, j) => {
                    const a = (j / 16) * Math.PI * 2;
                    return <circle key={j} cx={x + Math.cos(a) * r * 160} cy={BY - 60 + Math.sin(a) * r * 120 - r * 80} r={5 * (1 - r)} fill={K.red} opacity={1 - r} />;
                  })}
                  <g transform={`translate(${x} ${BY - 200}) scale(${0.8 + 0.4 * show})`} opacity={show}>
                    <circle r={96} fill="#0b1a2a" stroke={K.blue} strokeWidth={4} />
                    <Icon />
                  </g>
                </g>
              );
            })}
            {/* the line itself */}
            <rect x={0} y={BY - 5} width={1080} height={10} fill={K.blue} />
          </svg>
          <Glow x={540} y={BY} r={620} c="rgba(120,196,252,0.5)" sy={0.18} />
          {/* trusted voices pass upward through the border (supported, spread) */}
          {Array.from({length: 8}).map((_, i) => {
            const a0 = 5.0 + i * 0.12;
            const k = interpolate(t, [a0, a0 + 1.2], [0, 1], {...cl, easing: EASE.soft});
            if (k <= 0 || k >= 1) return null;
            const x = 160 + i * 110;
            return <Glow key={i} x={x} y={BY + 300 - k * 900} r={36} c="rgba(116,227,176,0.95)" a={Math.sin(Math.PI * k)} />;
          })}
        </Cam>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** S6 — «معيار»: a reply goes under the scanner before it is posted; then the two ways to use it */
export const S6Miyar: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const inK = ramp(f, 0.1, 0.8);
  const scan = interpolate(t, [0.9, 2.5], [0, 1], {...cl, easing: EASE.inOut});
  const book = ramp(f, 1.6, 2.2);
  const fix = ramp(f, 2.5, 3.0);
  const report = ramp(f, 3.0, 3.9, EASE.out);
  const split = ramp(f, 4.1, 4.8, EASE.inOut);
  const rails = ramp(f, 4.6, 5.6, EASE.inOut);
  const lines = [0, 1, 2, 3, 4];
  const bad = [1, 3];
  const card = {x: 140, y: 520, w: 800, h: 560};
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: 1 - split}}>
        <Cam s={interpolate(t, [0, 4.2], [1.08, 1], cl)}>
          <Desk tone="#0c1724" />
          <Glow x={540} y={820} r={760} c="rgba(120,196,252,0.18)" />
          {/* the reply under examination */}
          <div style={{position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: 30, background: K.panel, border: `2px solid ${fix > 0.5 ? K.green : K.line}`, transform: `translateY(${(1 - inK) * 300}px)`, opacity: inK, boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${80 * fix}px rgba(116,227,176,${0.4 * fix})`}}>
            <div style={{position: 'absolute', right: 40, top: 40, width: 86, height: 86, borderRadius: 43, background: '#2a4058'}} />
            {lines.map((i) => {
              const isBad = bad.includes(i);
              const lit = isBad ? interpolate(scan, [i / 5, i / 5 + 0.08], [0, 1], cl) : 0;
              const col = isBad ? (fix > 0 ? `rgba(116,227,176,${0.4 + 0.6 * fix})` : `rgba(255,195,135,${0.25 + 0.75 * lit})`) : '#2a3d52';
              return <div key={i} style={{position: 'absolute', right: 40, top: 170 + i * 70, width: 720 - (i % 2) * 140 - (isBad ? 0 : 60), height: 26, borderRadius: 13, background: col, boxShadow: isBad && lit > 0 ? `0 0 24px ${fix > 0 ? K.green : K.amber}` : 'none'}} />;
            })}
          </div>
          {/* scanner bar */}
          <div style={{position: 'absolute', left: 100, width: 880, top: card.y + 40 + scan * (card.h - 60), height: 6, background: K.blue, opacity: scan > 0 && scan < 1 ? 1 : 0, boxShadow: `0 0 40px 12px rgba(120,196,252,0.55)`}} />
          {/* reference book (the Saudi media regulations) linked to the flagged lines */}
          <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            {bad.map((i) => (
              <path key={i} d={`M ${card.x + 40} ${card.y + 183 + i * 70} C 80 ${card.y + 400}, 120 1280, 260 1330`} fill="none" stroke={K.amber} strokeWidth={3} strokeDasharray="10 10" opacity={book * (1 - fix * 0.6)} />
            ))}
            <g transform={`translate(330 1360) scale(${0.9 + book * 0.3})`} opacity={book}>
              <Book k={book} />
            </g>
          </svg>
          {/* the report prints out */}
          <div style={{position: 'absolute', left: 560, top: 1180 + (1 - report) * 600, width: 360, height: 460, borderRadius: 10, background: '#e6edf3', opacity: report, transform: 'rotate(4deg)', boxShadow: '0 30px 70px rgba(0,0,0,0.6)'}}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{position: 'absolute', right: 30, top: 40 + i * 50, width: 250 - (i % 3) * 50, height: 14, borderRadius: 7, background: i === 2 || i === 4 ? '#7fd8ae' : '#9aa8b8'}} />
            ))}
            <svg viewBox="0 0 100 100" style={{position: 'absolute', left: 26, bottom: 26, width: 110, height: 110}}>
              <circle cx={50} cy={50} r={44} fill="none" stroke="#1a9a64" strokeWidth={6} />
              <path d="M 30 52 L 45 66 L 72 36" fill="none" stroke="#1a9a64" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Cam>
      </AbsoluteFill>
      {/* two ways to use معيار: connect by API, or download the files + prompt */}
      <AbsoluteFill style={{opacity: split, background: `radial-gradient(70% 50% at 50% 40%, #10243a, ${K.bg})`}}>
        <Cam s={interpolate(t, [4.1, 6.8], [1.15, 1], {...cl, easing: EASE.soft})}>
          <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <path d="M 540 860 C 540 1100, 260 1100, 260 1340" fill="none" stroke={K.blue} strokeWidth={8} strokeDasharray={700} strokeDashoffset={700 * (1 - rails)} />
            <path d="M 540 860 C 540 1100, 820 1100, 820 1340" fill="none" stroke={K.green} strokeWidth={8} strokeDasharray={700} strokeDashoffset={700 * (1 - rails)} />
            {[0, 1, 2].map((i) => {
              const k = ((t - 5.0) * 0.9 + i / 3) % 1;
              if (t < 5.0) return null;
              const bez = (a: number, b: number, c: number, d: number, u: number) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d;
              return (
                <g key={i}>
                  <circle cx={bez(540, 540, 260, 260, k)} cy={bez(860, 1100, 1100, 1340, k)} r={12} fill={K.blue} />
                  <circle cx={bez(540, 540, 820, 820, k)} cy={bez(860, 1100, 1100, 1340, k)} r={12} fill={K.green} />
                </g>
              );
            })}
            <g transform="translate(540 600)">
              <Emblem draw={1} s={0.95} />
            </g>
            <g transform={`translate(260 1480) scale(${1.4 * rails})`} opacity={rails}>
              <circle r={110} fill="#0b1a2a" stroke={K.blue} strokeWidth={4} />
              <Plug />
            </g>
            <g transform={`translate(820 1480) scale(${1.4 * rails})`} opacity={rails}>
              <circle r={110} fill="#0b1f19" stroke={K.green} strokeWidth={4} />
              <Download />
            </g>
          </svg>
          <Glow x={540} y={600} r={420} c="rgba(120,196,252,0.3)" />
          <Glow x={260} y={1480} r={260} c="rgba(120,196,252,0.25)" a={rails} />
          <Glow x={820} y={1480} r={260} c="rgba(116,227,176,0.25)" a={rails} />
        </Cam>
      </AbsoluteFill>
      <Dust n={40} a={0.45} c="#bfe3ff" />
    </AbsoluteFill>
  );
};

// ── Saudi map helpers (outline from Natural Earth, built by scripts/build-map.mjs)
const MAP = mapData as unknown as {d: string; bounds: [number, number, number, number]; riyadh: [number, number]; jeddah: [number, number]; dammam: [number, number]};
const ring = (() => {
  const parts = MAP.d.split('M').filter(Boolean).map((p) => p.replace(/Z/g, '').split('L').map((q) => q.split(',').map(Number) as [number, number]));
  return parts.sort((a, b) => b.length - a.length)[0];
})();
const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const NODES = (() => {
  const out: [number, number][] = [];
  const [x0, y0, x1, y1] = MAP.bounds;
  for (let i = 0; out.length < 70 && i < 4000; i++) {
    const x = x0 + random(`mx${i}`) * (x1 - x0), y = y0 + random(`my${i}`) * (y1 - y0);
    if (inside(x, y)) out.push([x, y]);
  }
  return out;
})();

/** S7 — the whole country: trusted voices light up from the centre and connect; the border glows */
export const S7Map: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const draw = ramp(f, 0.1, 1.6, EASE.inOut);
  const [rx, ry] = MAP.riyadh;
  const wave = interpolate(t, [0.8, 4.0], [0, 700], cl);
  const tilt = interpolate(t, [0, 5.4], [32, 18], cl);
  return (
    <AbsoluteFill style={{background: `radial-gradient(70% 50% at 50% 50%, #0d2030, ${K.bg})`, perspective: 1600}}>
      <Cam s={interpolate(t, [0, 5.4], [1.0, 1.12], cl)}>
        <AbsoluteFill style={{transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 60%'}}>
          <svg viewBox="-40 -40 1080 1080" style={{position: 'absolute', left: 0, top: 420, width: 1080, height: 1080}}>
            <defs>
              <filter id="mglow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* hostile points outside the border, fading as the border lights */}
            {Array.from({length: 26}).map((_, i) => {
              const a = random(`oa${i}`) * Math.PI * 2;
              const x = 500 + Math.cos(a) * (560 + random(`od${i}`) * 160), y = 500 + Math.sin(a) * (560 + random(`oe${i}`) * 160);
              return <circle key={i} cx={x} cy={y} r={7} fill={K.red} opacity={0.7 * (1 - ramp(f, 1.6 + i * 0.05, 2.6 + i * 0.05))} />;
            })}
            <path d={MAP.d} fill="rgba(116,227,176,0.06)" stroke={K.green} strokeWidth={5} strokeDasharray={5200} strokeDashoffset={5200 * (1 - draw)} filter="url(#mglow)" />
            {/* links between neighbouring trusted nodes */}
            {NODES.map(([x, y], i) => {
              const [nx, ny] = NODES[(i * 7 + 3) % NODES.length];
              const d = Math.hypot(x - rx, y - ry);
              const k = interpolate(wave, [d, d + 120], [0, 1], cl);
              return <line key={`l${i}`} x1={x} y1={y} x2={x + (nx - x) * k} y2={y + (ny - y) * k} stroke={K.green} strokeOpacity={0.28} strokeWidth={2} />;
            })}
            {NODES.map(([x, y], i) => {
              const d = Math.hypot(x - rx, y - ry);
              const k = interpolate(wave, [d - 40, d + 40], [0, 1], cl);
              return <circle key={i} cx={x} cy={y} r={4 + 5 * k + 2 * Math.sin(t * 3 + i) * k} fill={K.green} opacity={0.15 + 0.85 * k} />;
            })}
            {[MAP.riyadh, MAP.jeddah, MAP.dammam].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={14} fill={K.blue} />
                <circle cx={x} cy={y} r={14 + ((t * 40 + i * 30) % 80)} fill="none" stroke={K.blue} strokeWidth={3} opacity={1 - ((t * 40 + i * 30) % 80) / 80} />
              </g>
            ))}
          </svg>
        </AbsoluteFill>
        <Glow x={540} y={980} r={700} c="rgba(116,227,176,0.16)" />
      </Cam>
      <Dust n={50} a={0.4} c="#c8ffe6" />
    </AbsoluteFill>
  );
};

/** S8 — case closed: the file shuts on the evidence, the lamp clicks off, the emblem stays lit */
export const S8Close: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const shut = ramp(f, 0.4, 1.3, EASE.inOut);
  const lampOff = ramp(f, 1.55, 1.62);
  const emb = ramp(f, 1.7, 2.9, EASE.inOut);
  const out = ramp(f, 3.7, 4.2, EASE.in);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cam s={interpolate(t, [0, 1.6], [1.15, 1], {...cl, easing: EASE.soft}) * (1 + emb * 0.12)}>
        <Desk tone={lampOff > 0.5 ? '#05080c' : '#101722'} />
        {/* the case folder (blank, emblem embossed) */}
        <div style={{position: 'absolute', left: 170, top: 520, width: 740, height: 940, borderRadius: 18, background: '#16222f', boxShadow: '0 60px 120px rgba(0,0,0,0.7)'}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', left: 60 + i * 40, top: 80 + i * 30, width: 300, height: 360, background: '#c9d2dc', transform: `rotate(${i * 5 - 6}deg) translateY(${shut * 140}px)`, opacity: 1 - shut * 0.6}} />
          ))}
        </div>
        <div style={{position: 'absolute', left: 170, top: 520, width: 740, height: 940, perspective: 1600}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(135deg, #1d2e40, #121c28)', transformOrigin: '0% 50%', transform: `rotateY(${(1 - shut) * -150}deg)`, backfaceVisibility: 'hidden', border: `2px solid ${K.line}`}}>
            <svg viewBox="-370 -470 740 940" style={{width: '100%', height: '100%'}}>
              <g opacity={0.35 + 0.65 * emb}>
                <Emblem draw={Math.max(0.0001, shut)} glow={0.3 + emb} s={1.05} />
              </g>
            </svg>
          </div>
        </div>
        <Glow x={540} y={980} r={760} c="rgba(255,195,135,0.22)" a={1 - lampOff} />
        <Glow x={540} y={940} r={460} c="rgba(120,196,252,0.35)" a={emb} />
        <Blinds a={0.4 * (1 - lampOff) + 0.25 * lampOff} angle={-22} speed={14} />
      </Cam>
      <AbsoluteFill style={{background: '#000', opacity: out}} />
    </AbsoluteFill>
  );
};
