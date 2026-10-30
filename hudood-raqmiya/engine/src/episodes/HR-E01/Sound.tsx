import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {sec} from '../../lib/anim';
import {LINES, TOTAL, line, wordAt} from './timeline';

type Cue = {at: number; name: string; vol?: number};

/** every sound is tied to a spoken line or word, so it re-syncs with the real footage */
const cues = (): Cue[] => {
  const L = (id: string) => line(id);
  return [
    {at: L('L01').start, name: 'sub_hit', vol: 0.6},
    {at: wordAt('L01', 'ربحي') - 0.12, name: 'stamp', vol: 0.45},
    {at: wordAt('L01', 'لكن') - 0.05, name: 'glitch', vol: 0.35},
    {at: wordAt('L01', 'قررت'), name: 'whoosh_fast', vol: 0.35},
    {at: wordAt('L01', 'مفتوح') - 0.1, name: 'unlock', vol: 0.65},
    {at: wordAt('L01', 'مفتوح'), name: 'warm_swell', vol: 0.35},
    {at: L('L01').end - 0.15, name: 'whoosh_air', vol: 0.5},
    {at: L('L01').end + 0.1, name: 'boom_soft', vol: 0.45},
    {at: L('L02').start, name: 'whoosh_fast', vol: 0.3},
    {at: L('L02').start + 0.2, name: 'tick', vol: 0.35},
    {at: wordAt('L03', 'المتميز') - 0.05, name: 'stamp', vol: 0.75},
    {at: L('L04').start - 0.3, name: 'whoosh_air', vol: 0.4},
    {at: L('L04').start + 0.05, name: 'card_slide', vol: 0.45},
    {at: wordAt('L04', 'ضبط'), name: 'card_slide', vol: 0.5},
    {at: wordAt('L04', 'ضبط') + 0.8, name: 'lock_on', vol: 0.3},
    {at: L('L05').start + 0.1, name: 'card_slide', vol: 0.4},
    {at: L('L06').start + 0.05, name: 'glitch', vol: 0.3},
    {at: L('L06').start + 0.6, name: 'whoosh_fast', vol: 0.35},
    {at: wordAt('L06', 'مفتوح') - 0.05, name: 'unlock', vol: 0.7},
    {at: wordAt('L06', 'مفتوح') + 0.1, name: 'warm_swell', vol: 0.4},
    {at: L('L07').start - 0.2, name: 'riser', vol: 0.3},
    {at: L('L07').start + 1.2, name: 'boom_soft', vol: 0.35},
    {at: L('L08').start + 0.2, name: 'notif', vol: 0.25},
    {at: L('L08').start + 0.8, name: 'notif', vol: 0.2},
    {at: L('L08').start + 1.5, name: 'notif', vol: 0.18},
    {at: L('L09').start, name: 'whoosh_air', vol: 0.4},
    {at: L('L10').start - 0.2, name: 'whoosh_fast', vol: 0.35},
    ...['سياسي', 'اجتماعي', 'رياضي', 'تعليمي', 'تاريخي', 'قصص', 'منتجات'].map((w) => ({at: wordAt('L11', w) - 0.08, name: 'tick', vol: 0.4})),
    ...['غير سعودي', 'غير رسمية', 'أو لا'].map((w) => ({at: wordAt('L12', w) - 0.05, name: 'flip', vol: 0.45})),
    {at: L('L13').start, name: 'riser', vol: 0.35},
    {at: wordAt('L13', 'يستهدفك') - 0.05, name: 'tape_stop', vol: 0.35},
    {at: wordAt('L13', 'يستهدفك'), name: 'sub_hit', vol: 0.75},
    {at: L('L14').start + 0.15, name: 'lock_on', vol: 0.55},
    {at: L('L15').start, name: 'dark_drone', vol: 0.35},
    {at: wordAt('L15', 'وش') - 0.1, name: 'glitch', vol: 0.35},
    {at: L('L16').start, name: 'whoosh_air', vol: 0.35},
    {at: wordAt('L16', 'الخير') - 0.1, name: 'warm_swell', vol: 0.35},
    {at: wordAt('L16', 'شر') - 0.1, name: 'dark_drone', vol: 0.4},
    ...[0, 1, 2, 3, 4].map((i) => ({at: L('L17').start + 0.2 + ((L('L18').end - L('L17').start) * 0.8 * i) / 5, name: 'tick', vol: 0.35})),
    {at: wordAt('L19', 'معيار') - 0.15, name: 'boom_soft', vol: 0.4},
    {at: wordAt('L19', 'مفتوح') - 0.05, name: 'unlock', vol: 0.5},
    {at: L('L20').start + 0.5, name: 'notif', vol: 0.25},
    {at: L('L20').end + 0.2, name: 'end_hit', vol: 0.6},
  ];
};

/** music sits under the voice: steady while Tamim talks, lifts only at the very end */
export const Sound: React.FC<{voice?: string}> = ({voice}) => {
  const first = LINES[0].start;
  const last = LINES[LINES.length - 1].end;
  const total = sec(TOTAL);
  return (
    <>
      {voice && <Audio src={staticFile(voice)} />}
      {cues().map((c, i) => (
        <Sequence key={i} from={Math.max(0, sec(c.at))} durationInFrames={sec(5)} layout="none">
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.vol ?? 0.5} />
        </Sequence>
      ))}
      <Audio
        src={staticFile('music/pulse.wav')}
        volume={(f) => {
          const t = f / 30;
          const fadeIn = interpolate(t, [first, first + 1.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const lift = interpolate(t, [last + 0.2, last + 1.0], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const out = interpolate(f, [total - 45, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (0.11 + 0.14 * lift) * fadeIn * out;
        }}
      />
    </>
  );
};
