/**
 * ─────────────────────────────────────────────────────────────
 *  MASTER TIMELINE — every animation is keyed to these beats.
 * ─────────────────────────────────────────────────────────────
 *  All times are in SECONDS, relative to the start of their scene.
 *  When the real voice-over arrives:
 *    1) drop the file in public/voice/, set `voice.enabled = true`
 *    2) nudge `captions` + `beats` to the real speech — visuals follow automatically.
 */
import {HOOK} from './media';
import {VIDEO} from './theme';

export type SfxName =
  | 'whoosh_long'
  | 'whoosh_short'
  | 'swish'
  | 'riser'
  | 'pop'
  | 'drop'
  | 'true_chime'
  | 'false_hit'
  | 'tick'
  | 'tape_stop'
  | 'impact'
  | 'lock'
  | 'shimmer'
  | 'glitch';

export type Caption = {
  from: number;
  to: number;
  text: string;
  /** Words inside `text` to tint. */
  highlight?: {word: string; color: 'or' | 'and' | 'true' | 'false' | 'aish' | 'samoli' | 'accent'}[];
};

export type SfxCue = {at: number; name: SfxName; volume?: number};

export type SceneDef<B extends string = string> = {
  id: string;
  title: string;
  durationSec: number;
  /** How much this scene overlaps the previous one (for connected transitions). */
  overlapSec: number;
  voice?: {src: string; enabled: boolean; offsetSec: number; volume?: number};
  captions: Caption[];
  beats: Record<B, number>;
  sfx: SfxCue[];
};

const scene = <B extends string>(s: SceneDef<B>) => s;

// ── SCENE A — رحت البقالة ─────────────────────────────────────
export const SCENE_A = scene({
  id: 'A',
  title: 'البقالة',
  durationSec: 6.6,
  overlapSec: 0.9,
  voice: {src: 'voice/02-story.wav', enabled: false, offsetSec: 0.2},
  captions: [
    {from: 0.3, to: 1.6, text: 'رحت البقالة،', highlight: [{word: 'البقالة،', color: 'accent'}]},
    {from: 1.6, to: 2.8, text: 'وأول ما وصلت'},
    {from: 2.8, to: 5.8, text: 'نسيت وش أبوي طلب مني بالضبط!', highlight: [{word: 'نسيت', color: 'accent'}]},
  ],
  beats: {arrive: 2.6, isolate: 2.9, question: 3.2},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.8},
    {at: 2.45, name: 'swish', volume: 0.5},
    {at: 3.2, name: 'pop', volume: 0.6},
    {at: 3.4, name: 'riser', volume: 0.25},
  ],
});

// ── SCENE B — قيمة الصواب ─────────────────────────────────────
// Times follow the presenter's recording (voice/03-truth-value.wav, offset 0.2s).
export const SCENE_B = scene({
  id: 'B',
  title: 'قيمة الصواب',
  durationSec: 7.88,
  overlapSec: 0.5,
  voice: {src: 'voice/03-truth-value.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.57, text: 'في درس المنطق،'},
    {from: 1.57, to: 3.84, text: 'عندنا شيء اسمه قيمة الصواب،', highlight: [{word: 'قيمة', color: 'accent'}, {word: 'الصواب،', color: 'accent'}]},
    {from: 4.12, to: 5.92, text: 'يعني هل نتيجة العبارة'},
    {from: 5.92, to: 7.28, text: 'True أو False؟', highlight: [{word: 'True', color: 'true'}, {word: 'False؟', color: 'false'}]},
  ],
  beats: {title: 3.0, system: 4.17, trueCase: 5.92, falseCase: 6.66},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.6},
    {at: 3.0, name: 'impact', volume: 0.35},
    {at: 4.17, name: 'swish', volume: 0.4},
    {at: 5.54, name: 'drop', volume: 0.7},
    {at: 5.92, name: 'true_chime', volume: 0.55},
    {at: 6.28, name: 'swish', volume: 0.35},
    {at: 6.66, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE C — عبارة الفصل OR ──────────────────────────────────
export const SCENE_C = scene({
  id: 'C',
  title: 'عبارة الفصل',
  durationSec: 19.66,
  overlapSec: 0.5,
  voice: {src: 'voice/04-disjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.78, text: 'خلونا نفترض إن أبوي قال:'},
    {from: 2.78, to: 4.97, text: '«جيب عيش أو صامولي»', highlight: [{word: 'أو', color: 'or'}]},
    {from: 5.08, to: 6.94, text: 'هذه الجملة هي عبارة فصل؛', highlight: [{word: 'فصل؛', color: 'or'}, {word: 'عبارة', color: 'or'}]},
    {from: 6.94, to: 10.12, text: 'لأننا ربطنا العبارتين بكلمة «أو»', highlight: [{word: '«أو»', color: 'or'}]},
    {from: 10.33, to: 12.13, text: 'وعبارة الفصل يكفي يكون'},
    {from: 12.13, to: 14.38, text: 'جزء واحد من العبارة صحيح', highlight: [{word: 'واحد', color: 'or'}, {word: 'صحيح', color: 'true'}]},
    {from: 14.42, to: 16.36, text: 'يعني سواء أخذت عيش', highlight: [{word: 'عيش', color: 'aish'}]},
    {from: 16.36, to: 17.18, text: 'أو صامولي', highlight: [{word: 'أو', color: 'or'}, {word: 'صامولي', color: 'samoli'}]},
    {from: 17.18, to: 18.71, text: 'راح أنجز المهمة', highlight: [{word: 'أنجز', color: 'true'}]},
  ],
  beats: {
    card: 2.81,
    orGrow: 3.64,
    orSymbol: 4.9,
    split: 6.96,
    merge: 9.14,
    atLeastOne: 12.19,
    case1: 15.47, // عيش فقط
    case2: 16.51, // صامولي فقط
    case3: 17.18, // الاثنين
    case4: 18.42, // لا شيء
    settle: 19.16,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 2.81, name: 'swish', volume: 0.4},
    {at: 3.64, name: 'glitch', volume: 0.35},
    {at: 4.9, name: 'impact', volume: 0.4},
    {at: 6.96, name: 'whoosh_long', volume: 0.55},
    {at: 9.14, name: 'lock', volume: 0.5},
    {at: 12.55, name: 'drop', volume: 0.7},
    {at: 12.85, name: 'true_chime', volume: 0.55},
    {at: 15.74, name: 'drop', volume: 0.6},
    {at: 15.95, name: 'tick', volume: 0.5},
    {at: 16.69, name: 'drop', volume: 0.6},
    {at: 16.84, name: 'tick', volume: 0.5},
    {at: 17.43, name: 'drop', volume: 0.6},
    {at: 17.62, name: 'tick', volume: 0.5},
    {at: 18.42, name: 'swish', volume: 0.35},
    {at: 18.68, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE D — من «أو» إلى «و» ────────────────────────────────
export const SCENE_D = scene({
  id: 'D',
  title: 'من الفصل إلى الوصل',
  durationSec: 9.27,
  overlapSec: 0.4,
  voice: {src: 'voice/05a-conjunction-intro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 3.05, text: 'لكن المشكلة لو أبوي قال:'},
    {from: 3.05, to: 4.75, text: '«جيب عيش وصامولي»', highlight: [{word: 'وصامولي»', color: 'and'}]},
    {from: 4.75, to: 6.18, text: 'هذه عبارة وصل', highlight: [{word: 'وصل', color: 'and'}]},
    {from: 6.18, to: 9.07, text: 'لأننا ربطنا العبارتين بحرف الواو', highlight: [{word: 'الواو', color: 'and'}]},
  ],
  beats: {flip: 0.15, card: 2.9, waGrow: 3.95, term: 4.78, bond: 6.22},
  sfx: [
    {at: 0.0, name: 'riser', volume: 0.35},
    {at: 1.08, name: 'impact', volume: 0.7},
    {at: 1.2, name: 'whoosh_long', volume: 0.5},
    {at: 3.95, name: 'glitch', volume: 0.3},
    {at: 4.78, name: 'swish', volume: 0.35},
    {at: 6.22, name: 'lock', volume: 0.6},
  ],
});

// ── SCENE E — عبارة الوصل AND ────────────────────────────────
export const SCENE_E = scene({
  id: 'E',
  title: 'عبارة الوصل',
  durationSec: 18.77,
  overlapSec: 0.4,
  voice: {src: 'voice/05b-conjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 3.35, text: 'وعبارة الوصل تكون صحيحة فقط', highlight: [{word: 'فقط', color: 'and'}]},
    {from: 3.35, to: 6.17, text: 'إذا كانت كل العبارات صحيحة', highlight: [{word: 'كل', color: 'and'}]},
    {from: 6.54, to: 7.9, text: 'يعني الغالي هنا، في هذه الحالة'},
    {from: 7.9, to: 10.31, text: 'لازم تاخذ صامولي وعيش', highlight: [{word: 'صامولي', color: 'samoli'}, {word: 'وعيش', color: 'aish'}]},
    {from: 10.8, to: 12.88, text: 'طيب لو نسيت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 12.88, to: 13.94, text: 'النتيجة: False', highlight: [{word: 'False', color: 'false'}]},
    {from: 13.94, to: 15.6, text: 'ولو نسيت الصامولي', highlight: [{word: 'الصامولي', color: 'samoli'}]},
    {from: 15.6, to: 16.62, text: 'وجبت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 16.62, to: 18.27, text: 'أيضًا النتيجة False', highlight: [{word: 'False', color: 'false'}]},
  ],
  beats: {
    slots: 1.05,
    bothRule: 3.39,
    samoliIn: 9.04,
    aishIn: 9.64,
    bothTrue: 10.12,
    removeAish: 11.79,
    false1: 13.46,
    recompose: 14.17,
    false2: 17.7,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.45},
    {at: 1.05, name: 'tick', volume: 0.5},
    {at: 9.16, name: 'drop', volume: 0.7},
    {at: 9.32, name: 'lock', volume: 0.4},
    {at: 9.77, name: 'drop', volume: 0.7},
    {at: 9.95, name: 'lock', volume: 0.4},
    {at: 10.12, name: 'true_chime', volume: 0.6},
    {at: 11.79, name: 'swish', volume: 0.5},
    {at: 13.46, name: 'false_hit', volume: 0.6},
    {at: 14.17, name: 'whoosh_long', volume: 0.5},
    {at: 15.88, name: 'drop', volume: 0.6},
    {at: 17.7, name: 'false_hit', volume: 0.6},
  ],
});

// ── SCENE F — الملخص (بدون تعليق صوتي) ───────────────────────
export const SCENE_F = scene({
  id: 'F',
  title: 'الملخص',
  durationSec: 2.4,
  overlapSec: 0.4,
  captions: [],
  beats: {or: 0.2, and: 0.9, hold: 2.0},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 0.35, name: 'tick', volume: 0.5},
    {at: 1.05, name: 'tick', volume: 0.5},
    {at: 1.2, name: 'true_chime', volume: 0.3},
  ],
});

// ── OUTRO — منهجي ────────────────────────────────────────────
export const SCENE_OUTRO = scene({
  id: 'OUTRO',
  title: 'منهجي',
  durationSec: 6.0,
  overlapSec: 0.5,
  voice: {src: 'voice/06-outro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.49, text: 'وبكذا تعلمنا درس المنطق،', highlight: [{word: 'المنطق،', color: 'accent'}]},
    {from: 2.49, to: 5.5, text: 'من مادة الرياضيات للصف الأول ثانوي'},
  ],
  beats: {logo: 0.28, subject: 2.44},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.5},
    {at: 0.36, name: 'shimmer', volume: 0.45},
  ],
});

/** Hook captions — relative to the hook clip. Only drawn on the placeholder. */
export const HOOK_LINE = 'أبوي قال لي أجيب عيش وصامولي… ولا قال عيش أو صامولي؟!';

// Scene A («نسيت وش أبوي طلب») removed at the presenter's request: the hook leads straight into B.
// Scene F (summary cards) removed at the presenter's request: E leads straight into the outro.
export const SCENES = [SCENE_B, SCENE_C, SCENE_D, SCENE_E, SCENE_OUTRO] as const;

export const sec = (s: number) => Math.round(s * VIDEO.fps);

export type PlacedScene = {
  def: SceneDef;
  from: number; // absolute frame
  durationInFrames: number;
};

export type Timeline = {
  hookFrames: number; // includes the «أو» hold + tail hold
  scenes: PlacedScene[];
  total: number;
};

/** Lays the scenes end-to-end (minus overlaps) after the hook. */
export const buildTimeline = (hookClipSec: number): Timeline => {
  const hookFrames = sec(hookClipSec) + (HOOK.freezeFrames ?? 0) + sec(HOOK.tailHoldSec);
  let cursor = hookFrames;
  const scenes: PlacedScene[] = SCENES.map((def) => {
    const from = cursor - sec(def.overlapSec);
    const durationInFrames = sec(def.durationSec);
    cursor = from + durationInFrames;
    return {def: def as SceneDef, from, durationInFrames};
  });
  return {hookFrames, scenes, total: cursor};
};

/** Hook captions — seconds inside the ORIGINAL clip (the «أو» hold is added automatically). */
export const HOOK_CAPTIONS: Caption[] = [
  {from: 0.4, to: 3.45, text: 'أبوي قال لي أجيب عيش وصامولي…', highlight: [{word: 'وصامولي…', color: 'and'}]},
  {from: 3.6, to: 5.9, text: 'ولا قال عيش أو صامولي؟!', highlight: [{word: 'أو', color: 'or'}]},
];
