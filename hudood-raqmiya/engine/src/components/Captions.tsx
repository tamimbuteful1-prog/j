import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F, VIDEO} from '../theme';
import {EASE, ramp} from '../lib/anim';
import type {Line} from '../episodes/HR-E01/timeline';
import {layoutAt} from './base';
import {useVariant} from '../lib/variant';

/** words shown in colour wherever they appear */
const TINT: Record<string, string> = {
  الهدف: C.red,
  يستهدفك: C.red,
  أنت: C.red,
  شر: C.red,
  الخير: C.green,
  معيار: C.green,
  '«معيار»،': C.green,
  مفتوح: C.green,
  المصدر: C.green,
  وطننا: C.green,
  السعودي: C.green,
  سعودي: C.green,
  المتميز: C.amber,
  ربحي: C.amber,
  مشروعي: C.text,
};

/** blend two #rrggbb colours */
const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
};

const strip = (w: string) => w.replace(/[«»"…،؛,.!?؟:]/g, '');

type Chunk = {start: number; end: number; words: string[]};

const chunks = (lines: Line[]): Chunk[] => {
  const out: Chunk[] = [];
  for (const l of lines) {
    const ws = l.text.split(/\s+/).filter(Boolean);
    const groups: string[][] = [];
    for (let i = 0; i < ws.length; i += 4) groups.push(ws.slice(i, i + 4));
    if (groups.length > 1 && groups[groups.length - 1].length === 1) groups[groups.length - 2].push(...groups.pop()!);
    const total = l.text.length || 1;
    let cur = l.start;
    for (const g of groups) {
      const d = (l.end - l.start) * ((g.join(' ').length + 1) / (total + 1));
      out.push({start: cur, end: cur + d, words: g});
      cur += d;
    }
  }
  return out;
};

/** bold kinetic subtitles: each chunk rises in, the word being spoken lights up */
export const Captions: React.FC<{lines: Line[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const variant = useVariant();
  const list = React.useMemo(() => chunks(lines), [lines]);
  const c = list.find((x) => t >= x.start - 0.05 && t < x.end + 0.05);
  if (!c) return null;
  const v = variant === 'vo' ? 1 : Math.min(1, layoutAt(lines, t));
  const y = 1490 + 90 * v;
  const total = c.words.join(' ').length;
  let acc = 0;
  const out = 1 - ramp(frame, c.end - 0.05, c.end + 0.12, EASE.in);
  return (
    <div style={{position: 'absolute', top: y, left: 50, right: 50, display: 'flex', justifyContent: 'center', opacity: out}}>
      <div style={{direction: 'rtl', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 18px'}}>
        {c.words.map((w, i) => {
          const at = c.start + ((c.end - c.start) * acc) / (total || 1);
          acc += w.length + 1;
          // hidden until spoken; appears with a soft pop, lit in colour, then settles
          const on = ramp(frame, at - 0.06, at + 0.16, EASE.out);
          const lit = 1 - ramp(frame, at + 0.25, at + 0.7, EASE.soft);
          const tint = TINT[strip(w)] ?? TINT[w];
          const hot = tint ?? C.green;
          const col = tint ?? (lit > 0.05 ? mix(C.green, C.text, 1 - lit) : C.text);
          return (
            <span
              key={i}
              style={{
                fontFamily: F.head,
                fontWeight: 800,
                fontSize: 60,
                lineHeight: 1.25,
                color: col,
                opacity: on,
                filter: `blur(${(1 - on) * 8}px)`,
                transform: `translateY(${(1 - on) * 16}px) scale(${0.86 + 0.14 * on + 0.06 * lit * on})`,
                textShadow: `0 3px 14px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9), 0 0 ${18 + 22 * lit}px ${hot}${lit > 0.05 || tint ? '99' : '00'}`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
