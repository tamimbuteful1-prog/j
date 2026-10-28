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
  durationSec: 8.37,
  overlapSec: 0.5,
  voice: {src: 'voice/03-truth-value.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.7, text: 'في درس المنطق،'},
    {from: 1.7, to: 4.06, text: 'عندنا شيء اسمه قيمة الصواب،', highlight: [{word: 'قيمة', color: 'accent'}, {word: 'الصواب،', color: 'accent'}]},
    {from: 4.23, to: 6.14, text: 'يعني هل نتيجة العبارة'},
    {from: 6.14, to: 7.47, text: 'True أو False؟', highlight: [{word: 'True', color: 'true'}, {word: 'False؟', color: 'false'}]},
  ],
  beats: {title: 2.98, system: 4.28, trueCase: 6.14, falseCase: 6.74},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.6},
    {at: 2.98, name: 'impact', volume: 0.35},
    {at: 4.28, name: 'swish', volume: 0.4},
    {at: 5.73, name: 'drop', volume: 0.7},
    {at: 6.14, name: 'true_chime', volume: 0.55},
    {at: 6.47, name: 'swish', volume: 0.35},
    {at: 6.74, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE C — عبارة الفصل OR ──────────────────────────────────
export const SCENE_C = scene({
  id: 'C',
  title: 'عبارة الفصل',
  durationSec: 19.59,
  overlapSec: 0.5,
  voice: {src: 'voice/04-disjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.55, text: 'خلونا نفترض إن أبوي قال:'},
    {from: 2.55, to: 4.68, text: '«جيب عيش أو صامولي»', highlight: [{word: 'أو', color: 'or'}]},
    {from: 4.75, to: 6.7, text: 'هذه الجملة هي عبارة فصل؛', highlight: [{word: 'فصل؛', color: 'or'}, {word: 'عبارة', color: 'or'}]},
    {from: 6.7, to: 9.68, text: 'لأننا ربطنا العبارتين بكلمة «أو»', highlight: [{word: '«أو»', color: 'or'}]},
    {from: 9.75, to: 11.39, text: 'وعبارة الفصل يكفي يكون'},
    {from: 11.39, to: 13.73, text: 'جزء واحد من العبارة صحيح', highlight: [{word: 'واحد', color: 'or'}, {word: 'صحيح', color: 'true'}]},
    {from: 13.78, to: 15.64, text: 'يعني سواء أخذت عيش', highlight: [{word: 'عيش', color: 'aish'}]},
    {from: 15.64, to: 16.64, text: 'أو صامولي', highlight: [{word: 'أو', color: 'or'}, {word: 'صامولي', color: 'samoli'}]},
    {from: 16.64, to: 18.17, text: 'راح أنجز المهمة', highlight: [{word: 'أنجز', color: 'true'}]},
  ],
  beats: {
    card: 2.6,
    orGrow: 3.64,
    orSymbol: 4.64,
    split: 6.72,
    merge: 8.61,
    atLeastOne: 11.43,
    case1: 14.82, // عيش فقط
    case2: 15.82, // صامولي فقط
    case3: 16.64, // الاثنين
    case4: 17.82, // لا شيء
    settle: 18.84,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 2.6, name: 'swish', volume: 0.4},
    {at: 3.64, name: 'glitch', volume: 0.35},
    {at: 4.64, name: 'impact', volume: 0.4},
    {at: 6.72, name: 'whoosh_long', volume: 0.55},
    {at: 8.61, name: 'lock', volume: 0.5},
    {at: 11.8, name: 'drop', volume: 0.7},
    {at: 12.02, name: 'true_chime', volume: 0.55},
    {at: 15.05, name: 'drop', volume: 0.6},
    {at: 15.23, name: 'tick', volume: 0.5},
    {at: 16.05, name: 'drop', volume: 0.6},
    {at: 16.23, name: 'tick', volume: 0.5},
    {at: 16.87, name: 'drop', volume: 0.6},
    {at: 17.05, name: 'tick', volume: 0.5},
    {at: 17.82, name: 'swish', volume: 0.35},
    {at: 18.13, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE D — من «أو» إلى «و» ────────────────────────────────
export const SCENE_D = scene({
  id: 'D',
  title: 'من الفصل إلى الوصل',
  durationSec: 8.67,
  overlapSec: 0.4,
  voice: {src: 'voice/05a-conjunction-intro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.88, text: 'لكن لو أبوي قال:'},
    {from: 1.88, to: 4.11, text: '«جيب عيش وصامولي»', highlight: [{word: 'وصامولي»', color: 'and'}]},
    {from: 4.11, to: 5.47, text: 'هذه عبارة وصل', highlight: [{word: 'وصل', color: 'and'}]},
    {from: 5.47, to: 8.37, text: 'لأننا ربطنا العبارتين بحرف الواو', highlight: [{word: 'الواو', color: 'and'}]},
  ],
  beats: {flip: 0.15, card: 1.75, waGrow: 3.05, term: 4.15, bond: 5.51},
  sfx: [
    {at: 0.0, name: 'riser', volume: 0.35},
    {at: 0.52, name: 'impact', volume: 0.7},
    {at: 0.56, name: 'whoosh_long', volume: 0.5},
    {at: 3.05, name: 'glitch', volume: 0.3},
    {at: 4.15, name: 'swish', volume: 0.35},
    {at: 5.51, name: 'lock', volume: 0.6},
  ],
});

// ── SCENE E — عبارة الوصل AND ────────────────────────────────
export const SCENE_E = scene({
  id: 'E',
  title: 'عبارة الوصل',
  durationSec: 17.39,
  overlapSec: 0.4,
  voice: {src: 'voice/05b-conjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.88, text: 'وعبارة الوصل تكون صحيحة فقط', highlight: [{word: 'فقط', color: 'and'}]},
    {from: 2.88, to: 5.47, text: 'إذا كانت كلا العبارتين صحيحتين', highlight: [{word: 'كلا', color: 'and'}]},
    {from: 5.59, to: 6.94, text: 'يعني في هذه الحالة'},
    {from: 6.94, to: 9.36, text: 'لازم آخذ صامولي وعيش', highlight: [{word: 'صامولي', color: 'samoli'}, {word: 'وعيش', color: 'aish'}]},
    {from: 9.47, to: 11.46, text: 'طيب لو نسيت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 11.46, to: 12.47, text: 'النتيجة: False', highlight: [{word: 'False', color: 'false'}]},
    {from: 12.47, to: 14.11, text: 'ولو نسيت الصامولي', highlight: [{word: 'الصامولي', color: 'samoli'}]},
    {from: 14.11, to: 14.98, text: 'وجبت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 14.98, to: 16.64, text: 'أيضًا النتيجة False', highlight: [{word: 'False', color: 'false'}]},
  ],
  beats: {
    slots: 0.84,
    bothRule: 2.93,
    samoliIn: 8.03,
    aishIn: 8.72,
    bothTrue: 9.21,
    removeAish: 10.25,
    false1: 12.0,
    recompose: 12.7,
    false2: 15.95,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.45},
    {at: 0.84, name: 'tick', volume: 0.5},
    {at: 8.17, name: 'drop', volume: 0.7},
    {at: 8.35, name: 'lock', volume: 0.4},
    {at: 8.86, name: 'drop', volume: 0.7},
    {at: 9.04, name: 'lock', volume: 0.4},
    {at: 9.21, name: 'true_chime', volume: 0.6},
    {at: 10.25, name: 'swish', volume: 0.5},
    {at: 12.0, name: 'false_hit', volume: 0.6},
    {at: 12.7, name: 'whoosh_long', volume: 0.5},
    {at: 14.38, name: 'drop', volume: 0.6},
    {at: 15.95, name: 'false_hit', volume: 0.6},
  ],
});

// ── SCENE F — الملخص (بدون تعليق صوتي) ───────────────────────
export const SCENE_F = scene({
  id: 'F',
  title: 'الملخص',
  durationSec: 3.0,
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
  durationSec: 5.56,
  overlapSec: 0.5,
  voice: {src: 'voice/06-outro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.79, text: 'وهذا درس المنطق،', highlight: [{word: 'المنطق،', color: 'accent'}]},
    {from: 1.79, to: 4.81, text: 'من مادة الرياضيات للصف الأول ثانوي'},
  ],
  beats: {logo: 0.25, subject: 1.75},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.5},
    {at: 0.29, name: 'shimmer', volume: 0.45},
  ],
});

/** Hook captions — relative to the hook clip. Only drawn on the placeholder. */
export const HOOK_LINE = 'أبوي قال لي أجيب عيش وصامولي… ولا قال عيش أو صامولي؟!';

// Scene A («نسيت وش أبوي طلب») removed at the presenter's request: the hook leads straight into B.
export const SCENES = [SCENE_B, SCENE_C, SCENE_D, SCENE_E, SCENE_F, SCENE_OUTRO] as const;

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
