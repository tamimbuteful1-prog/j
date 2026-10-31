import React from 'react';
import {useCurrentFrame} from 'remotion';
import {F, P, VIDEO} from './theme';
import {EASE, ramp} from './lib/anim';
import {LINES, type Line} from './timeline';

/** words worth a colour: dark red for dread, pale yellow for the mother's voice */
const RED = ['غرفتي!', 'غرفتي', 'داخل', 'شكلك', 'شكلك.', 'مجهول.', 'تحت', 'نفس', 'بنفس', 'الظل', 'يبدأ'];
const strip = (w: string) => w.replace(/[«»"…،؛,.!?؟:]/g, '');

type Chunk = {start: number; end: number; words: {w: string; at: number}[]; mother: boolean; quote: boolean};

const build = (lines: Line[]): Chunk[] => {
  const out: Chunk[] = [];
  lines.forEach((l, li) => {
    if (l.speaker === 'MSG') return; // messages are read on the phone screen
    const ws = l.text.split(/\s+/).filter(Boolean);
    const times = ws.map((_, i) => l.words[Math.min(l.words.length - 1, Math.round((i * (l.words.length - 1)) / Math.max(1, ws.length - 1)))][0]);
    const size = ws.length <= 6 ? ws.length : Math.ceil(ws.length / Math.ceil(ws.length / 5));
    for (let i = 0; i < ws.length; i += size) {
      const g = ws.slice(i, i + size).map((w, j) => ({w, at: Math.max(l.start, times[i + j])}));
      const nextStart = i + size < ws.length ? times[i + size] : lines[li + 1]?.start ?? l.end + 0.6;
      out.push({start: g[0].at - 0.05, end: Math.min(nextStart, l.end + 0.45), words: g, mother: ['MD', 'MP', 'MB'].includes(l.speaker), quote: ['MD', 'MP', 'MB', 'NW'].includes(l.speaker)});
    }
  });
  return out;
};
const CHUNKS = build(LINES);

/** clean white subtitles in the safe area; each word eases in when it is spoken */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const c = CHUNKS.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const out = 1 - ramp(frame, c.end - 0.12, c.end, EASE.in);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1520, display: 'flex', justifyContent: 'center', opacity: out}}>
      <div style={{direction: 'rtl', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', maxWidth: 900}}>
        {c.words.map(({w, at}, i) => {
          const on = ramp(frame, at - 0.08, at + 0.18, EASE.out);
          const red = RED.includes(w) || RED.includes(strip(w));
          const col = c.mother ? P.pale : red ? P.redHi : P.text;
          return (
            <span
              key={i}
              style={{
                fontFamily: F.head,
                fontWeight: 800,
                fontSize: 58,
                lineHeight: 1.3,
                color: col,
                opacity: on,
                transform: `scale(${0.94 + 0.06 * on})`,
                textShadow: `0 2px 10px rgba(0,0,0,0.9), 0 0 2px #000${red ? `, 0 0 22px ${P.red}` : ''}`,
                fontStyle: c.quote ? 'normal' : 'normal',
              }}
            >
              {i === 0 && c.quote ? '«' : ''}
              {w}
              {i === c.words.length - 1 && c.quote ? '»' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
