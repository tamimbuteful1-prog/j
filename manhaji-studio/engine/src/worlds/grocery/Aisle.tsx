import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, FONTS} from '../../kit/theme';

/** World constants for the stylised mini-market. Units = CSS px. */
export const AISLE = {
  length: 5200,
  halfW: 470,
  floorY: 520,
  ceilY: -780,
  perspective: 1100,
  originX: 540,
  originY: 860,
  /** depth of the bakery end-cap where the two hero products wait */
  heroZ: 4300,
} as const;

export type Cam = {z: number; x?: number; y?: number};

/** Manual perspective projection — keeps screen-space heroes glued to the 3D world. */
export const project = (X: number, Y: number, Z: number, cam: Cam) => {
  const zRel = -Z + cam.z; // world z is negative into the screen
  const s = AISLE.perspective / (AISLE.perspective - zRel);
  return {
    x: AISLE.originX + (X - (cam.x ?? 0)) * s,
    y: AISLE.originY + (Y - (cam.y ?? 0)) * s,
    scale: s,
  };
};

const WALL_H = AISLE.floorY - AISLE.ceilY;

const PALETTE = ['#2C3D63', '#3E5C8A', '#5B6E9A', '#C9A15B', '#B85C4B', '#3F7F75', '#6E5A8F', '#D5D0C4', '#8C9BB5', '#A77A3E', '#2F6F8F', '#E0C9A0'];

const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/** One long shelving wall rendered as a single SVG (cheap to transform in 3D). */
const ShelfWall: React.FC<{seed: number}> = ({seed}) => {
  const items = useMemo(() => {
    const r = rng(seed);
    const out: React.ReactNode[] = [];
    const shelves = [300, 560, 820, 1080];
    shelves.forEach((sy, si) => {
      let x = 20;
      while (x < AISLE.length - 40) {
        const kind = Math.floor(r() * 4);
        const w = 46 + r() * 70;
        const h = 90 + r() * 120;
        const c = PALETTE[Math.floor(r() * PALETTE.length)];
        const k = `${si}-${x.toFixed(0)}`;
        if (kind === 0) {
          out.push(
            <g key={k}>
              <rect x={x} y={sy - h} width={w} height={h} rx={5} fill={c} />
              <rect x={x} y={sy - h * 0.62} width={w} height={h * 0.26} fill="rgba(255,255,255,0.18)" />
              <rect x={x} y={sy - h} width={w * 0.18} height={h} fill="rgba(255,255,255,0.10)" />
            </g>,
          );
        } else if (kind === 1) {
          const nh = h * 0.28;
          out.push(
            <g key={k}>
              <rect x={x + w * 0.34} y={sy - h} width={w * 0.32} height={nh + 8} rx={4} fill={c} />
              <rect x={x} y={sy - h + nh} width={w} height={h - nh} rx={w * 0.25} fill={c} />
              <rect x={x + 4} y={sy - h * 0.5} width={w - 8} height={h * 0.2} rx={4} fill="rgba(255,255,255,0.25)" />
            </g>,
          );
        } else if (kind === 2) {
          out.push(
            <g key={k}>
              <rect x={x} y={sy - h * 0.7} width={w} height={h * 0.7} rx={w * 0.18} fill={c} />
              <rect x={x - 2} y={sy - h * 0.78} width={w + 4} height={h * 0.12} rx={5} fill="#E8E2D2" />
            </g>,
          );
        } else {
          const ch = h * 0.55;
          out.push(
            <g key={k}>
              <rect x={x} y={sy - ch} width={w} height={ch} fill={c} />
              <ellipse cx={x + w / 2} cy={sy - ch} rx={w / 2} ry={7} fill="#D8DCE6" />
              <rect x={x} y={sy - ch * 0.62} width={w} height={ch * 0.3} fill="rgba(255,255,255,0.2)" />
            </g>,
          );
        }
        x += w + 6 + r() * 14;
      }
      // shelf board + price rail
      out.push(<rect key={`b${si}`} x={0} y={sy} width={AISLE.length} height={24} fill="#C8CCD8" />);
      out.push(<rect key={`r${si}`} x={0} y={sy + 24} width={AISLE.length} height={18} fill="#8B93A8" />);
      for (let t = 60; t < AISLE.length; t += 230 + (si * 37) % 90) {
        out.push(<rect key={`t${si}-${t}`} x={t} y={sy + 26} width={46} height={14} rx={2} fill="#F5D46B" />);
      }
    });
    for (let u = 0; u < AISLE.length; u += 640) {
      out.push(<rect key={`u${u}`} x={u} y={140} width={26} height={WALL_H - 140} fill="#5E667D" />);
    }
    return out;
  }, [seed]);
  return (
    <svg width={AISLE.length} height={WALL_H} viewBox={`0 0 ${AISLE.length} ${WALL_H}`}>
      <rect width={AISLE.length} height={WALL_H} fill="#1A2238" />
      <rect y={120} width={AISLE.length} height={WALL_H - 120} fill="#232C46" />
      {items}
      <rect y={1120} width={AISLE.length} height={WALL_H - 1120} fill="#121828" />
    </svg>
  );
};

const plane = (w: number, h: number, transform: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  left: -w / 2,
  top: -h / 2,
  width: w,
  height: h,
  transform,
  backfaceVisibility: 'hidden',
  ...extra,
});

/**
 * The CSS-3D aisle. Walls, floor, ceiling and the bakery end-cap are real planes;
 * the camera dollies through them. Heavy lifting stays on the GPU compositor.
 */
export const Aisle: React.FC<{cam: Cam; yaw?: number; roll?: number; blur?: number; dim?: number}> = ({cam, yaw = 0, roll = 0, blur = 0, dim = 0}) => {
  const L = AISLE.length;
  const W = AISLE.halfW * 2;
  const midY = (AISLE.floorY + AISLE.ceilY) / 2;
  const fogR = 'linear-gradient(90deg, rgba(9,13,24,0) 0%, rgba(9,13,24,0.55) 70%, rgba(9,13,24,0.85) 100%)';
  const fogL = 'linear-gradient(270deg, rgba(9,13,24,0) 0%, rgba(9,13,24,0.55) 70%, rgba(9,13,24,0.85) 100%)';
  return (
    <AbsoluteFill style={{filter: `blur(${blur}px) brightness(${1 - dim * 0.7}) saturate(${1 - dim * 0.4})`}}>
      <AbsoluteFill
        style={{
          perspective: AISLE.perspective,
          perspectiveOrigin: `${AISLE.originX}px ${AISLE.originY}px`,
          overflow: 'hidden',
          background: `radial-gradient(600px 500px at ${AISLE.originX}px ${AISLE.originY - 120}px, #3A2E22, ${COLORS.ink} 80%)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: AISLE.originX,
            top: AISLE.originY,
            transformStyle: 'preserve-3d',
            transform: `rotateZ(${roll}deg) rotateY(${yaw}deg) translate3d(${-(cam.x ?? 0)}px, ${-(cam.y ?? 0)}px, ${cam.z}px)`,
          }}
        >
          {/* floor */}
          <div
            style={plane(W, L, `translate3d(0px, ${AISLE.floorY}px, ${-L / 2}px) rotateX(90deg)`, {
              background:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 160px), linear-gradient(0deg, #2A3046, #141A2B)',
            })}
          >
            <div style={{position: 'absolute', left: '42%', width: '16%', top: 0, bottom: 0, background: 'linear-gradient(0deg, rgba(255,240,210,0.16), rgba(255,240,210,0.02))', filter: 'blur(14px)'}} />
          </div>
          {/* ceiling with light strips */}
          <div
            style={plane(W, L, `translate3d(0px, ${AISLE.ceilY}px, ${-L / 2}px) rotateX(-90deg)`, {
              background: '#0E1322',
            })}
          >
            {Array.from({length: 8}).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '38%',
                  width: '24%',
                  top: i * (L / 8) + 120,
                  height: L / 8 - 260,
                  borderRadius: 12,
                  background: '#FFF4E0',
                  boxShadow: '0 0 60px 20px rgba(255,236,200,0.45)',
                }}
              />
            ))}
          </div>
          {/* left wall (faces +x) */}
          <div style={plane(L, WALL_H, `translate3d(${-AISLE.halfW}px, ${midY}px, ${-L / 2}px) rotateY(90deg)`)}>
            <ShelfWall seed={11} />
            <div style={{position: 'absolute', inset: 0, background: fogR}} />
          </div>
          {/* right wall (faces -x) */}
          <div style={plane(L, WALL_H, `translate3d(${AISLE.halfW}px, ${midY}px, ${-L / 2}px) rotateY(-90deg)`)}>
            <ShelfWall seed={29} />
            <div style={{position: 'absolute', inset: 0, background: fogL}} />
          </div>
          {/* bakery end-cap */}
          <div
            style={plane(W, WALL_H, `translate3d(0px, ${midY}px, ${-L}px)`, {
              background: 'linear-gradient(180deg, #2A2030 0%, #3B2A22 55%, #1A1410 100%)',
              display: 'flex',
              justifyContent: 'center',
            })}
          >
            <div
              dir="rtl"
              style={{
                marginTop: 240,
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: 150,
                color: '#FFD9A0',
                textShadow: '0 0 40px rgba(255,190,110,0.8), 0 0 120px rgba(255,160,80,0.5)',
              }}
            >
              المخبز
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
