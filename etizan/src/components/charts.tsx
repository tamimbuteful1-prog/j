'use client';
/** رسوم SVG خفيفة: أعمدة يومية بخط هدف، وخط اتجاه، وأشرطة مقارنة */
import { motion } from 'motion/react';
import { useState } from 'react';
import { num } from '@/lib/format';

export const C = { mint: '#11916f', sky: '#2a78b8', amber: '#e08a2a', grid: '#ebe6dc', muted: '#77817c' };

export function DailyBars({
  data,
  target,
  color = C.mint,
  height = 170,
}: {
  data: { label: string; value: number; key: string }[];
  target?: number;
  color?: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = height;
  const pad = { t: 22, b: 22 };
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value)) * 1.1;
  const bw = W / data.length;
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  // RTL: الأحدث على اليسار (نهاية السطر)
  const x = (i: number) => W - (i + 1) * bw;
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: "ltr" }} role="img" aria-label="رسم أعمدة يومي">
        <line x1={0} x2={W} y1={H - pad.b} y2={H - pad.b} stroke={C.grid} />
        {data.map((d, i) => {
          const bh = Math.max(0, H - pad.b - y(d.value));
          return (
            <g key={d.key} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <rect x={x(i)} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
              <motion.rect
                x={x(i) + bw * 0.2}
                width={bw * 0.6}
                rx={4}
                initial={{ y: H - pad.b, height: 0 }}
                animate={{ y: H - pad.b - bh, height: bh }}
                transition={{ duration: 0.6, delay: i * 0.02 }}
                fill={color}
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
              {(i === 0 || i === data.length - 1 || i % 7 === 0) && (
                <text x={x(i) + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill={C.muted}>
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        {target !== undefined && target > 0 && (
          <>
            <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="#16211d" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.55} />
            <text x={4} y={y(target) - 5} fontSize="11" fill="#3a4641" textAnchor="start">
              الهدف {num(target)}
            </text>
          </>
        )}
      </svg>
      {h && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-xl bg-ink px-3 py-1.5 text-[13px] text-white shadow-lift">
          {h.label}: <span className="tnum font-semibold">{num(h.value)}</span> ريال
        </div>
      )}
    </div>
  );
}

export function TrendLine({ points, color = C.sky, height = 150 }: { points: { label: string; value: number }[]; color?: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = height;
  const pad = { t: 16, b: 20, x: 6 };
  if (points.length < 2) return <div className="py-8 text-center text-[15px] text-muted">يحتاج يومين على الأقل</div>;
  const vals = points.map((p) => p.value);
  const min = Math.min(0, ...vals);
  const max = Math.max(1, ...vals);
  const x = (i: number) => W - pad.x - (i / (points.length - 1)) * (W - pad.x * 2);
  const y = (v: number) => H - pad.b - ((v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
  const h = hover !== null ? points[hover] : null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none" style={{ direction: "ltr" }}
        role="img"
        aria-label="خط الاتجاه"
        onPointerMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((W - pad.x - px) / (W - pad.x * 2)) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {min < 0 && <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke={C.grid} />}
        <path d={area} fill="url(#trendFill)" />
        <motion.path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke={C.muted} strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(points[hover].value)} r={5} fill={color} stroke="#fff" strokeWidth={2} />
          </>
        )}
        <circle cx={x(points.length - 1)} cy={y(vals[vals.length - 1])} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />
        <text x={x(0)} y={H - 4} fontSize="10" fill={C.muted} textAnchor="end">
          {points[0].label}
        </text>
        <text x={x(points.length - 1)} y={H - 4} fontSize="10" fill={C.muted} textAnchor="start">
          {points[points.length - 1].label}
        </text>
      </svg>
      {h && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-xl bg-ink px-3 py-1.5 text-[13px] text-white">
          {h.label}: <span className="tnum font-semibold">{num(h.value)}</span>
        </div>
      )}
    </div>
  );
}

/** أشرطة أفقية مع تسميات مباشرة */
export function HBars({ rows }: { rows: { label: string; value: number; color: string; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-[15px]">
            <span className="flex items-center gap-2 font-medium text-ink-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="tnum font-semibold">
              {num(r.value)} {r.note && <span className="text-[12px] font-normal text-muted">{r.note}</span>}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-cream-2">
            <motion.div className="h-full rounded-full" style={{ background: r.color }} initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** حلقة صغيرة للنسب */
export function Ring({ value, size = 92, color = C.mint, children }: { value: number; size?: number; color?: string; children?: React.ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ebe6dc" strokeWidth={9} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ duration: 1 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
