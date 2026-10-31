import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {VIDEO} from '../theme';
import {EASE, lerp} from '../lib/anim';
import {Glow, Layer, Shot, handheld} from '../fx';
import {RoomBack} from '../art/room';
import {Asleep, Back, Face, Profile, Seated} from '../art/nawaf';
import {PhoneShot} from '../art/phone';
import {Clock, Exterior, FloorGap} from '../art/places';
import {line, word} from '../timeline';

/** absolute time (s) */
const useT = () => useCurrentFrame() / VIDEO.fps;
const k = (t: number, a: number, b: number, e = EASE.inOut) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const breath = (t: number, rate = 0.28, phase = 0) => Math.sin((t * rate + phase) * Math.PI * 2);
/** natural blinks every few seconds */
const blink = (t: number, seed = 0) => {
  const period = 3.4 + (seed % 3) * 0.7;
  const p = ((t + seed) % period) / period;
  return p > 0.965 ? Math.abs(Math.sin(((p - 0.965) / 0.035) * Math.PI)) : 0;
};
/** cut between sub-shots inside a scene */
const pick = <T,>(t: number, cuts: [number, T][]): T => {
  let v = cuts[0][1];
  for (const [at, x] of cuts) if (t >= at) v = x;
  return v;
};

/* 01 — THE IMPOSSIBLE VOICE: the door, a shadow behind it; the phone; his eyes */
export const S01: React.FC = () => {
  const t = useT();
  const cutPhone = line('L02').start - 0.05;
  const cutEyes = word('L02', 5);
  const shot = pick(t, [[0, 'door'], [cutPhone, 'phone'], [cutEyes, 'eyes']] as [number, string][]);
  if (shot === 'door') {
    const push = k(t, 0, cutPhone, EASE.soft);
    return (
      <Shot cam={{x: 120, y: 360 + push * 30, s: 2.15 + push * 0.18, r: 0}}>
        <Layer d={1}>
          <RoomBack gap={0.9} gapShadow={k(t, 0.2, 1.1)} />
        </Layer>
      </Shot>
    );
  }
  if (shot === 'phone') {
    const tt = t - cutPhone;
    return (
      <AbsoluteFill style={{background: '#020305'}}>
        <PhoneShot screen={{kind: 'call', name: 'أمي', status: 'مكالمة جارية · 00:0' + Math.min(9, Math.floor(tt + 2))}} glow={1} tilt={-6 + tt * 0.6} />
      </AbsoluteFill>
    );
  }
  const tt = t - cutEyes;
  return (
    <Shot cam={{x: 0, y: -120 - tt * 10, s: 1.9 + tt * 0.12}}>
      <Layer d={1}>
        <AbsoluteFill style={{background: '#04070c'}} />
        <Face open={1 - blink(t, 1)} fear={0.75} look={[0.5, -0.1]} phone={0.85} breathe={breath(t, 0.5)} />
      </Layer>
    </Shot>
  );
};

/* 02 — THE NEW APARTMENT: Riyadh at night → his window → inside, asleep */
export const S02: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT();
  const inside = k(t, end - 2.1, end - 1.3);
  const push = k(t, start, end - 1.3, EASE.soft);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: 1 - inside}}>
        <Shot cam={{x: lerp(0, 235, push), y: lerp(0, -100, push), s: lerp(1, 2.4, push)}}>
          <Exterior />
        </Shot>
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: inside}}>
        <Shot cam={{x: 0, y: -40, s: 1.15 - 0.05 * k(t, end - 2.1, end)}}>
          <Layer d={0.6}>
            <AbsoluteFill style={{background: 'linear-gradient(180deg, #070b12, #0c121b)'}} />
            <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
              <rect x={640} y={520} width={300} height={360} fill="#22385a" opacity={0.7} />
              <line x1={790} y1={520} x2={790} y2={880} stroke="#070b12" strokeWidth={10} />
            </svg>
            <Glow x={760} y={700} r={420} color="rgba(95,127,166,0.25)" />
          </Layer>
          <Layer d={1}>
            <Asleep breathe={breath(t, 0.22)} />
          </Layer>
        </Shot>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 03 — 03:17 AM: the clock; three heavy knocks; his eyes open; he turns toward the door */
export const S03: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const l7 = line('L07');
  const knocks = l7.words.map((w) => w[0]);
  const jolt = knocks.reduce((a, kt) => a + (t >= kt && t < kt + 0.25 ? (1 - (t - kt) / 0.25) * 6 : 0), 0);
  const cutKnockDoor = l7.start - 0.05;
  const cutEyes = l7.end + 0.15;
  const shot = pick(t, [[start, 'clock'], [cutKnockDoor, 'door'], [cutEyes, 'face']] as [number, string][]);
  if (shot === 'clock') {
    return (
      <Shot cam={{x: 0, y: 0, s: 1.05 + k(t, start, cutKnockDoor, EASE.soft) * 0.12}}>
        <Layer d={1}>
          <Clock time="03:17" jolt={jolt} />
        </Layer>
      </Shot>
    );
  }
  if (shot === 'door') {
    return (
      <Shot cam={{x: 120, y: 330, s: 1.8, ...{r: 0}}}>
        <Layer d={1}>
          <RoomBack gap={0.8} knock={jolt} />
        </Layer>
      </Shot>
    );
  }
  const tt = t - cutEyes;
  const open = k(tt, 0.1, 1.4, EASE.soft) * (1 - blink(t, 2));
  const turn = k(tt, 1.2, 2.2);
  return (
    <Shot cam={{x: 0, y: -60, s: 1.55 + tt * 0.03}}>
      <Layer d={1}>
        <AbsoluteFill style={{background: '#04070c'}} />
        <AbsoluteFill style={{transform: 'rotate(-78deg) translate(-60px, -40px)', transformOrigin: '50% 45%'}}>
          <Face open={open * 0.85} look={[lerp(0, 0.9, turn), lerp(0.2, -0.3, turn)]} fear={0.15} breathe={breath(t, 0.3)} turn={turn * 0.4} warm={0.25} />
        </AbsoluteFill>
      </Layer>
    </Shot>
  );
};

/* 04 — MOTHER'S VOICE: over the shoulder, the door deep in frame; he starts to rise; the phone buzzes */
export const S04: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const rise = k(t, line('L10').start, line('L10').end + 0.2, EASE.soft);
  const buzz = line('L11').words[3][0] - 0.1;
  const v = t > buzz ? Math.sin(t * 90) * 4 * (1 - k(t, buzz + 0.6, buzz + 1)) : 0;
  const phone = k(t, buzz, buzz + 0.25);
  const hh = handheld(t, 0.5);
  return (
    <Shot cam={{x: 40 + hh.x, y: 40 + hh.y - rise * 30, s: 1.12 + k(t, start, start + 6, EASE.soft) * 0.06, r: hh.r}}>
      <Layer d={1}>
        <RoomBack gap={1} phone={phone} />
      </Layer>
      <Layer d={1.5}>
        <Back breathe={breath(t, 0.32)} warm={0.45} phone={phone} y={-rise * 70} x={v} />
      </Layer>
    </Shot>
  );
};

/* 05 — THE MESSAGE: close on the phone; push toward his eyes; the music drops out */
export const S05: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const msgAt = line('L13').start - 0.2;
  const cutFace = line('L14').start - 0.1;
  if (t < cutFace) {
    return (
      <AbsoluteFill style={{background: '#020305'}}>
        <Shot cam={{x: 0, y: k(t, start, cutFace) * -40, s: 1 + k(t, start, cutFace, EASE.soft) * 0.12}}>
          <Layer d={1}>
            <PhoneShot screen={{kind: 'chat', from: 'أمي', avatar: 'أ', now: t, msgs: [{text: 'أنا وأبوك في المستشفى، بنرجع الصباح، لا تنسى تقفل الباب.', at: msgAt}]}} />
          </Layer>
        </Shot>
      </AbsoluteFill>
    );
  }
  const tt = t - cutFace;
  const fear = k(tt, 0.2, 1.6);
  return (
    <Shot cam={{x: 0, y: -150 - tt * 18, s: 1.6 + tt * 0.16}}>
      <Layer d={1}>
        <AbsoluteFill style={{background: '#04070c'}} />
        <Face open={lerp(0.6, 1, fear) * (1 - blink(t, 3) * (1 - fear))} fear={fear} look={[0, 0.35]} phone={1} breathe={breath(t, 0.2) * (1 - fear)} />
      </Layer>
    </Shot>
  );
};

/* 06 — THE SECOND KNOCK: locked-off on the door; the light under it dims as something moves behind */
export const S06: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT();
  const dim = k(t, line('L16').start, line('L16').end + 0.4);
  return (
    <Shot cam={{x: 120, y: 300 - k(t, start, end, EASE.soft) * 40, s: 1.55 + k(t, start, end, EASE.soft) * 0.22}}>
      <Layer d={1}>
        <RoomBack gap={1 - 0.55 * dim} gapShadow={0.35 * dim} />
      </Layer>
    </Shot>
  );
};

/* 07 — THE PHONE CALL: profile with the phone; the two voices at once; the camera stops */
export const S07: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const doorCut = line('L23').start - 0.05;
  const backCut = line('L25').start - 0.12;
  const faceCut = line('L26').start - 0.05;
  const shot = pick(t, [[start, 'profile'], [doorCut, 'door'], [backCut, 'profile2'], [faceCut, 'face']] as [number, string][]);
  if (shot === 'profile' || shot === 'profile2') {
    const frozen = shot === 'profile2';
    const fear = frozen ? 1 : k(t, line('L20').start, line('L22').end, EASE.soft) * 0.6;
    const hh = handheld(t, frozen ? 0 : 0.4);
    return (
      <Shot cam={{x: hh.x, y: hh.y, s: frozen ? 1.18 : 1.05 + k(t, start, doorCut, EASE.soft) * 0.1, r: hh.r}}>
        <Layer d={0.6}>
          <AbsoluteFill style={{background: 'linear-gradient(90deg, #04070c 40%, #0a0f18)'}} />
          <Glow x={1010} y={1000} r={230} color={`rgba(240,192,106,${frozen ? 0.32 : 0.2})`} sx={0.5} />
        </Layer>
        <Layer d={1}>
          <Profile fear={fear} breathe={breath(t, frozen ? 0.6 : 0.3)} phone={1} warm={0.35} open={1 - blink(t, 4) * (frozen ? 0 : 1)} />
        </Layer>
      </Shot>
    );
  }
  if (shot === 'door') {
    return (
      <Shot cam={{x: 120, y: 320, s: 1.7 + k(t, doorCut, backCut, EASE.soft) * 0.12}}>
        <Layer d={1}>
          <RoomBack gap={0.75} gapShadow={0.35} />
        </Layer>
      </Shot>
    );
  }
  return (
    <Shot cam={{x: 0, y: -140, s: 1.7}}>
      <Layer d={1}>
        <AbsoluteFill style={{background: '#04070c'}} />
        <Face open={1} fear={1} look={[0.9, -0.2]} phone={0.9} warm={0.2} breathe={breath(t, 0.7) * 0.6} />
      </Layer>
    </Shot>
  );
};

/* 08 — THE SILENCE: high, wide; he is small in the dark room; nothing happens; the phone lights up */
export const S08: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT();
  const lit = k(t, end - 0.5, end - 0.3);
  return (
    <Shot cam={{x: -60, y: -140, s: 0.82 + k(t, start, end) * 0.02}} tilt={14}>
      <Layer d={1}>
        <RoomBack gap={0.7} gapShadow={0.3} phone={lit} />
        <Seated x={330} y={1640} s={0.9} breathe={breath(t, 0.55)} phone={lit} />
      </Layer>
    </Shot>
  );
};

/* 09 — UNKNOWN NUMBER: the message; zoom on «ما يعرف شكلك»; he lifts his eyes to the door */
export const S09: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const msgAt = line('L31').start - 0.15;
  const focusAt = word('L31', 5) - 0.1;
  const eyesCut = line('L31').end + 0.1;
  if (t < eyesCut) {
    const z = k(t, focusAt, focusAt + 0.9, EASE.inOut);
    return (
      <AbsoluteFill style={{background: '#020305'}}>
        <Shot cam={{x: lerp(0, 60, z), y: lerp(0, -240, z), s: lerp(1.02, 1.75, z)}}>
          <Layer d={1}>
            <PhoneShot
              screen={{kind: 'chat', from: 'رقم مجهول', now: t, msgs: [{text: 'لا تفتح الباب… هو للحين ما يعرف شكلك.', at: msgAt}], focus: 'ما يعرف شكلك', focusK: z}}
              jitter={t < start + 0.6 ? [Math.sin(t * 80) * 3, 0] : [0, 0]}
            />
          </Layer>
        </Shot>
      </AbsoluteFill>
    );
  }
  const tt = t - eyesCut;
  return (
    <Shot cam={{x: 0, y: -150, s: 1.75 + tt * 0.05}}>
      <Layer d={1}>
        <AbsoluteFill style={{background: '#04070c'}} />
        <Face open={1} fear={0.85} look={[lerp(0, 0.7, k(tt, 0, 0.8)), lerp(0.4, -0.35, k(tt, 0, 0.8))]} phone={0.9} breathe={breath(t, 0.6) * 0.5} />
      </Layer>
    </Shot>
  );
};

/* 10 — THE SECOND WARNING: «ولا تطالع تحت الباب»; music stops; he looks down; camera to the floor */
export const S10: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const msgAt = line('L33').start - 0.15;
  const lookCut = line('L34').start - 0.1;
  const floorCut = line('L35').start - 0.05;
  if (t < lookCut) {
    return (
      <AbsoluteFill style={{background: '#020305'}}>
        <PhoneShot screen={{kind: 'chat', from: 'رقم مجهول', now: t, msgs: [{text: 'لا تفتح الباب… هو للحين ما يعرف شكلك.', at: start - 10}, {text: 'ولا تطالع تحت الباب.', at: msgAt}]}} jitter={t > msgAt - 0.3 && t < msgAt + 0.3 ? [Math.sin(t * 80) * 3, 0] : [0, 0]} />
      </AbsoluteFill>
    );
  }
  if (t < floorCut) {
    const down = k(t, lookCut, floorCut, EASE.soft);
    return (
      <Shot cam={{x: 0, y: -150, s: 1.75}}>
        <Layer d={1}>
          <AbsoluteFill style={{background: '#04070c'}} />
          <Face open={lerp(1, 0.7, down)} fear={0.9} look={[0.2, lerp(-0.2, 1, down)]} phone={0.6} breathe={breath(t, 0.5) * 0.4} />
        </Layer>
      </Shot>
    );
  }
  const tt = t - floorCut;
  return (
    <Shot cam={{x: 0, y: 40 - tt * 12, s: 1.05 + tt * 0.02}}>
      <Layer d={1}>
        <FloorGap gap={1} feet={k(tt, 0.5, 1.6, EASE.soft)} />
      </Layer>
    </Shot>
  );
};

/* 11 — THE SHADOW: floor level; a person's feet at the door … then the shadow's direction is revealed */
export const S11: React.FC<{start: number}> = ({start}) => {
  const t = useT();
  const reveal = k(t, line('L38').start, line('L39').end, EASE.inOut);
  const pull = k(t, line('L38').start, line('L39').end, EASE.soft);
  return (
    <Shot cam={{x: 0, y: lerp(30, -60, pull), s: lerp(1.18, 0.98, pull)}}>
      <Layer d={1}>
        <FloorGap gap={1} feet={1 - reveal * 0.6} inside={reveal} reveal={reveal} sway={Math.sin(t * 0.9) * reveal} />
      </Layer>
      <AbsoluteFill style={{background: '#000', opacity: 0.12 * k(t, start, start + 2)}} />
    </Shot>
  );
};

/* 12 — THE REALIZATION: his eyes: shadow → light source → shadow; the camera drifts round him */
export const S12: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT();
  const span = end - start;
  const a = k(t, start, start + span * 0.3);
  const b = k(t, start + span * 0.35, start + span * 0.6);
  const c = k(t, start + span * 0.65, start + span * 0.9);
  const lookY = lerp(lerp(lerp(0.2, 1, a), -0.5, b), 1, c);
  const lookX = lerp(lerp(lerp(0, 0.2, a), 0.8, b), 0.2, c);
  const orbit = k(t, start, end, EASE.soft);
  return (
    <Shot cam={{x: lerp(-40, 70, orbit), y: -150, s: 1.6 + orbit * 0.08}}>
      <Layer d={0.4}>
        <AbsoluteFill style={{background: '#020305'}} />
        <Glow x={lerp(200, 120, orbit)} y={700} r={500} color="rgba(30,45,70,0.35)" />
      </Layer>
      <Layer d={1}>
        <Face open={1} fear={lerp(0.85, 1, c)} look={[lookX, lookY]} phone={0.45} warm={0.25} breathe={breath(t, 0.7) * 0.5} turn={lerp(0, -0.4, orbit)} />
      </Layer>
    </Shot>
  );
};

/* 13 — THE FINAL REVEAL: wide; the long shadow from inside the room to the door, cast by nothing;
   breathing behind his head; he doesn't turn; push into the dark behind him; cut to black */
export const S13: React.FC<{start: number; end: number}> = ({start, end}) => {
  const t = useT();
  const push = k(t, start + 0.4, end, EASE.in);
  const sway = Math.sin(t * 0.8) * 0.8 + Math.sin(t * 2.3) * 0.3;
  return (
    <Shot cam={{x: lerp(-80, -260, push), y: lerp(60, 120, push), s: lerp(1.0, 1.6, push)}}>
      <Layer d={1}>
        <RoomBack gap={0.8} inside={1} sway={sway} />
      </Layer>
      <Layer d={1.2}>
        <Seated x={330} y={1660} s={1.15} breathe={breath(t, 0.7) * 0.4} head={0} />
      </Layer>
      <AbsoluteFill style={{background: 'radial-gradient(60% 40% at 15% 75%, rgba(0,0,0,0.85), transparent 70%)', opacity: push}} />
    </Shot>
  );
};

