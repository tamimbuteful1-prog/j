import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, F, VIDEO} from '../theme';
import {EASE, ramp} from '../lib/anim';
import type {Line} from '../episodes/HR-E01/timeline';
import {layoutAt} from './base';

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
  const list = React.useMemo(() => chunks(lines), [lines]);
  const c = list.find((x) => t >= x.start - 0.05 && t < x.end + 0.05);
  if (!c) return null;
  const v = Math.min(1, layoutAt(lines, t));
  const y = 1490 + 90 * v;
  const p = ramp(frame, c.start - 0.05, c.start + 0.22);
  const total = c.words.join(' ').length;
  let acc = 0;
  return (
    <div style={{position: 'absolute', top: y, left: 60, right: 60, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
      <div
        style={{
          direction: 'rtl',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px 16px',
          padding: '18px 30px',
          borderRadius: 22,
          background: 'rgba(5, 8, 13, 0.62)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        }}
      >
        {c.words.map((w, i) => {
          const at = c.start + ((c.end - c.start) * acc) / (total || 1);
          acc += w.length + 1;
          const on = ramp(frame, at - 0.04, at + 0.12, EASE.out);
          const tint = TINT[strip(w)] ?? TINT[w];
          return (
            <span
              key={i}
              style={{
                fontFamily: F.head,
                fontWeight: 800,
                fontSize: 56,
                lineHeight: 1.25,
                color: tint ?? C.text,
                opacity: 0.45 + 0.55 * on,
                transform: `scale(${0.96 + 0.04 * on})`,
                textShadow: tint ? `0 0 22px ${tint}66` : '0 2px 12px rgba(0,0,0,0.5)',
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
