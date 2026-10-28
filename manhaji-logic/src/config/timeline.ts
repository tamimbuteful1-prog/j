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
  durationSec: 8.88,
  overlapSec: 0.5,
  voice: {src: 'voice/03-truth-value.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.17, text: 'في درس المنطق،'},
    {from: 2.17, to: 4.42, text: 'عندنا شيء اسمه قيمة الصواب،', highlight: [{word: 'قيمة', color: 'accent'}, {word: 'الصواب،', color: 'accent'}]},
    {from: 4.76, to: 6.9, text: 'يعني هل نتيجة العبارة'},
    {from: 6.9, to: 8.28, text: 'True أو False؟', highlight: [{word: 'True', color: 'true'}, {word: 'False؟', color: 'false'}]},
  ],
  beats: {title: 3.6, system: 4.82, trueCase: 6.9, falseCase: 7.58},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.6},
    {at: 3.6, name: 'impact', volume: 0.35},
    {at: 4.82, name: 'swish', volume: 0.4},
    {at: 6.45, name: 'drop', volume: 0.7},
    {at: 6.9, name: 'true_chime', volume: 0.55},
    {at: 7.25, name: 'swish', volume: 0.35},
    {at: 7.58, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE C — عبارة الفصل OR ──────────────────────────────────
export const SCENE_C = scene({
  id: 'C',
  title: 'عبارة الفصل',
  durationSec: 20.26,
  overlapSec: 0.5,
  voice: {src: 'voice/04-disjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.55, text: 'خلونا نفترض إن أبوي قال:'},
    {from: 2.55, to: 4.71, text: '«جيب عيش أو صامولي»', highlight: [{word: 'أو', color: 'or'}]},
    {from: 4.8, to: 6.84, text: 'هذه الجملة هي عبارة فصل؛', highlight: [{word: 'فصل؛', color: 'or'}, {word: 'عبارة', color: 'or'}]},
    {from: 6.84, to: 10.12, text: 'لأننا ربطنا العبارتين بكلمة «أو»', highlight: [{word: '«أو»', color: 'or'}]},
    {from: 10.38, to: 12.08, text: 'وعبارة الفصل يكفي يكون'},
    {from: 12.08, to: 14.5, text: 'جزء واحد من العبارة صحيح', highlight: [{word: 'واحد', color: 'or'}, {word: 'صحيح', color: 'true'}]},
    {from: 14.55, to: 16.6, text: 'يعني سواء أخذت عيش', highlight: [{word: 'عيش', color: 'aish'}]},
    {from: 16.6, to: 17.72, text: 'أو صامولي', highlight: [{word: 'أو', color: 'or'}, {word: 'صامولي', color: 'samoli'}]},
    {from: 17.72, to: 19.31, text: 'راح أنجز المهمة', highlight: [{word: 'أنجز', color: 'true'}]},
  ],
  beats: {
    card: 2.58,
    orGrow: 3.48,
    orSymbol: 4.65,
    split: 6.86,
    merge: 8.94,
    atLeastOne: 12.13,
    case1: 15.68, // عيش فقط
    case2: 16.77, // صامولي فقط
    case3: 17.72, // الاثنين
    case4: 18.98, // لا شيء
    settle: 19.76,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 2.58, name: 'swish', volume: 0.4},
    {at: 3.48, name: 'glitch', volume: 0.35},
    {at: 4.65, name: 'impact', volume: 0.4},
    {at: 6.86, name: 'whoosh_long', volume: 0.55},
    {at: 8.94, name: 'lock', volume: 0.5},
    {at: 12.55, name: 'drop', volume: 0.7},
    {at: 12.8, name: 'true_chime', volume: 0.55},
    {at: 15.95, name: 'drop', volume: 0.6},
    {at: 16.17, name: 'tick', volume: 0.5},
    {at: 17.02, name: 'drop', volume: 0.6},
    {at: 17.24, name: 'tick', volume: 0.5},
    {at: 17.97, name: 'drop', volume: 0.6},
    {at: 18.17, name: 'tick', volume: 0.5},
    {at: 18.98, name: 'swish', volume: 0.35},
    {at: 19.29, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE D — من «أو» إلى «و» ────────────────────────────────
export const SCENE_D = scene({
  id: 'D',
  title: 'من الفصل إلى الوصل',
  durationSec: 9.69,
  overlapSec: 0.4,
  voice: {src: 'voice/05a-conjunction-intro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.35, text: 'لكن لو أبوي قال:'},
    {from: 2.35, to: 4.82, text: '«جيب عيش وصامولي»', highlight: [{word: 'وصامولي»', color: 'and'}]},
    {from: 4.82, to: 6.3, text: 'هذه عبارة وصل', highlight: [{word: 'وصل', color: 'and'}]},
    {from: 6.3, to: 9.49, text: 'لأننا ربطنا العبارتين بحرف الواو', highlight: [{word: 'الواو', color: 'and'}]},
  ],
  beats: {flip: 0.15, card: 2.2, waGrow: 3.62, term: 4.86, bond: 6.34},
  sfx: [
    {at: 0.0, name: 'riser', volume: 0.35},
    {at: 0.7, name: 'impact', volume: 0.7},
    {at: 0.78, name: 'whoosh_long', volume: 0.5},
    {at: 3.62, name: 'glitch', volume: 0.3},
    {at: 4.86, name: 'swish', volume: 0.35},
    {at: 6.34, name: 'lock', volume: 0.6},
  ],
});

// ── SCENE E — عبارة الوصل AND ────────────────────────────────
export const SCENE_E = scene({
  id: 'E',
  title: 'عبارة الوصل',
  durationSec: 18.45,
  overlapSec: 0.4,
  voice: {src: 'voice/05b-conjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.81, text: 'وعبارة الوصل تكون صحيحة فقط', highlight: [{word: 'فقط', color: 'and'}]},
    {from: 2.81, to: 5.6, text: 'إذا كانت كلتا العبارتين صحيحتين', highlight: [{word: 'كلتا', color: 'and'}]},
    {from: 6.0, to: 7.56, text: 'يعني في هذه الحالة'},
    {from: 7.56, to: 10.15, text: 'لازم آخذ صامولي وعيش', highlight: [{word: 'صامولي', color: 'samoli'}, {word: 'وعيش', color: 'aish'}]},
    {from: 10.46, to: 12.32, text: 'طيب لو نسيت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 12.32, to: 13.47, text: 'النتيجة: False', highlight: [{word: 'False', color: 'false'}]},
    {from: 13.47, to: 15.32, text: 'ولو نسيت الصامولي', highlight: [{word: 'الصامولي', color: 'samoli'}]},
    {from: 15.32, to: 16.26, text: 'وجبت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 16.26, to: 17.95, text: 'أيضًا النتيجة False', highlight: [{word: 'False', color: 'false'}]},
  ],
  beats: {
    slots: 0.84,
    bothRule: 2.85,
    samoliIn: 8.74,
    aishIn: 9.5,
    bothTrue: 10.02,
    removeAish: 11.13,
    false1: 12.94,
    recompose: 13.73,
    false2: 17.34,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.45},
    {at: 0.84, name: 'tick', volume: 0.5},
    {at: 8.89, name: 'drop', volume: 0.7},
    {at: 9.09, name: 'lock', volume: 0.4},
    {at: 9.64, name: 'drop', volume: 0.7},
    {at: 9.84, name: 'lock', volume: 0.4},
    {at: 10.02, name: 'true_chime', volume: 0.6},
    {at: 11.13, name: 'swish', volume: 0.5},
    {at: 12.94, name: 'false_hit', volume: 0.6},
    {at: 13.73, name: 'whoosh_long', volume: 0.5},
    {at: 15.62, name: 'drop', volume: 0.6},
    {at: 17.34, name: 'false_hit', volume: 0.6},
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
  durationSec: 5.28,
  overlapSec: 0.5,
  voice: {src: 'voice/06-outro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.65, text: 'وهذا درس المنطق،', highlight: [{word: 'المنطق،', color: 'accent'}]},
    {from: 1.65, to: 4.78, text: 'من مادة الرياضيات للصف الأول ثانوي'},
  ],
  beats: {logo: 0.23, subject: 1.6},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.5},
    {at: 0.26, name: 'shimmer', volume: 0.45},
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
