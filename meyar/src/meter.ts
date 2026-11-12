// Result meter: a green → yellow → red gauge with 0–100 % graduations.
// The number always agrees with the verified classification: the model's
// risk_percent is clamped into that classification's band, and a fallback is
// derived when the model gives none.
import type { Classification, VerifiedResult } from './types';

const SVG = 'http://www.w3.org/2000/svg';
const BANDS: Record<Classification, [number, number]> = {
  no_conflict_found: [0, 30],
  needs_more_info: [31, 60],
  insufficient_references: [31, 60],
  conflict_indicators: [61, 100],
};

export function riskPercent(cls: Classification, v: VerifiedResult | null): number {
  const [lo, hi] = BANDS[cls];
  const raw = v?.raw.risk_percent;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.round(Math.min(hi, Math.max(lo, raw)));
  const supported = v ? v.findings.filter((f) => f.citations.length > 0).length : 0;
  if (cls === 'conflict_indicators') return Math.min(95, 66 + supported * 7);
  if (cls === 'no_conflict_found') return 12;
  return 45;
}

export const VERDICT: Record<Classification, { title: string; tone: string }> = {
  no_conflict_found: { title: 'مطابق للأنظمة', tone: 'ok' },
  needs_more_info: { title: 'يحتاج مراجعة', tone: 'mid' },
  insufficient_references: { title: 'لا تكفي المراجع للحكم', tone: 'none' },
  conflict_indicators: { title: 'غير مطابق للأنظمة', tone: 'bad' },
};

function el(tag: string, attrs: Record<string, string | number>, ...kids: (SVGElement | string)[]) {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  for (const k of kids) e.append(k);
  return e;
}

/** 0 % sits at the left end of a 240° dial, 100 % at the right end. */
const A0 = 210;
const SWEEP = 240;
const CX = 150;
const CY = 150;
const ang = (p: number) => ((A0 - (SWEEP * p) / 100) * Math.PI) / 180;
const pt = (p: number, r: number) => [CX + Math.cos(ang(p)) * r, CY - Math.sin(ang(p)) * r];

export function meter(percent: number | null, opts: { reduced: boolean; dim?: boolean }): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'meter' + (opts.dim ? ' is-dim' : '');
  const uid = 'm' + Math.random().toString(36).slice(2, 8);
  const svg = el('svg', { viewBox: '10 10 280 280', role: 'img', 'aria-label': percent === null ? 'المؤشر غير متاح' : `مؤشر المخالفة ${percent}%` });

  // colour track: many short segments interpolating green → yellow → red
  const defs = el('defs', {});
  const glow = el('filter', { id: `${uid}g`, x: '-20%', y: '-20%', width: '140%', height: '140%' });
  glow.append(el('feGaussianBlur', { stdDeviation: 2.4 }));
  defs.append(glow);
  svg.append(defs);
  svg.append(el('circle', { cx: CX, cy: CY, r: 132, class: 'm-face' }));
  svg.append(el('circle', { cx: CX, cy: CY, r: 132, class: 'm-rim' }));
  const R = 104;
  const color = (p: number) => {
    // 0 green (#2f9e62) → 50 yellow (#e8c547) → 100 red (#d23b33)
    const lerp = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
    const g = [47, 158, 98];
    const y = [232, 197, 71];
    const r = [210, 59, 51];
    const c = p <= 50 ? lerp(g, y, p / 50) : lerp(y, r, (p - 50) / 50);
    return `rgb(${c.join(',')})`;
  };
  const track = el('g', { class: 'm-track' });
  for (let p = 0; p < 100; p += 2) {
    const [x0, y0] = pt(p, R);
    const [x1, y1] = pt(p + 2.05, R);
    track.append(el('path', { d: `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`, stroke: opts.dim ? '#5b5f66' : color(p + 1) }));
  }
  svg.append(track);

  // graduations every 2 %, long ticks + numbers every 10 %
  const ticks = el('g', { class: 'm-ticks' });
  for (let p = 0; p <= 100; p += 2) {
    const major = p % 10 === 0;
    const [x0, y0] = pt(p, major ? 84 : 89);
    const [x1, y1] = pt(p, 94);
    ticks.append(el('line', { x1: x0.toFixed(2), y1: y0.toFixed(2), x2: x1.toFixed(2), y2: y1.toFixed(2), class: major ? 'major' : 'minor' }));
    if (major) {
      const [tx, ty] = pt(p, 70);
      ticks.append(el('text', { x: tx.toFixed(1), y: (ty + 4).toFixed(1), class: 'm-num' }, String(p)));
    }
  }
  svg.append(ticks);

  // needle
  const needle = el('g', { class: 'm-needle' });
  needle.append(el('path', { d: `M${CX - 5} ${CY} L${CX} ${CY - 96} L${CX + 5} ${CY} Z`, class: 'm-needle-body' }));
  needle.append(el('circle', { cx: CX, cy: CY, r: 11, class: 'm-hub' }));
  needle.append(el('circle', { cx: CX, cy: CY, r: 4, class: 'm-hub-dot' }));
  svg.append(needle);

  // readout
  const readout = el('text', { x: CX, y: CY + 52, class: 'm-value' }, percent === null ? '—' : '0%');
  svg.append(readout);
  svg.append(el('text', { x: CX, y: CY + 74, class: 'm-caption' }, 'مؤشر المخالفة'));
  wrap.append(svg);

  const setNeedle = (p: number) => {
    const deg = -(SWEEP / 2) + (SWEEP * p) / 100; // 0 % → -120°, 100 % → +120°
    needle.setAttribute('transform', `rotate(${deg.toFixed(2)} ${CX} ${CY})`);
    readout.textContent = `${Math.round(p)}%`;
  };
  if (percent === null) {
    needle.setAttribute('transform', `rotate(0 ${CX} ${CY})`);
    return wrap;
  }
  if (opts.reduced) {
    setNeedle(percent);
    return wrap;
  }
  setNeedle(0);
  const start = performance.now() + 250;
  const D = 1600;
  let done = false;
  const step = (now: number) => {
    if (done) return;
    const t = Math.min(1, Math.max(0, (now - start) / D));
    // ease-out with a small overshoot, like a real instrument settling
    const e = t < 1 ? 1 - Math.pow(1 - t, 3) + Math.sin(t * Math.PI) * 0.04 : 1;
    setNeedle(Math.min(100, percent * e));
    if (t < 1) requestAnimationFrame(step);
    else {
      done = true;
      setNeedle(percent);
    }
  };
  requestAnimationFrame(step);
  // if frames are paused (background tab), still show the final reading
  window.setTimeout(() => {
    if (!done) {
      done = true;
      setNeedle(percent);
    }
  }, D + 900);
  return wrap;
}
