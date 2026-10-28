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
  durationSec: 9.9,
  overlapSec: 0.5,
  voice: {src: 'voice/03-truth-value.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.85, text: 'في درس المنطق،'},
    {from: 1.85, to: 4.45, text: 'عندنا شيء اسمه قيمة الصواب،', highlight: [{word: 'قيمة', color: 'accent'}, {word: 'الصواب،', color: 'accent'}]},
    {from: 5.1, to: 7.2, text: 'يعني هل نتيجة العبارة'},
    {from: 7.2, to: 8.7, text: 'True أو False؟', highlight: [{word: 'True', color: 'true'}, {word: 'False؟', color: 'false'}]},
  ],
  beats: {title: 3.26, system: 5.15, trueCase: 7.2, falseCase: 7.86},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.6},
    {at: 3.26, name: 'impact', volume: 0.35},
    {at: 5.15, name: 'swish', volume: 0.4},
    {at: 6.75, name: 'drop', volume: 0.7},
    {at: 7.2, name: 'true_chime', volume: 0.55},
    {at: 7.56, name: 'swish', volume: 0.35},
    {at: 7.86, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE C — عبارة الفصل OR ──────────────────────────────────
export const SCENE_C = scene({
  id: 'C',
  title: 'عبارة الفصل',
  durationSec: 22.5,
  overlapSec: 0.5,
  voice: {src: 'voice/04-disjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.9, text: 'خلونا نفترض إن أبوي قال:'},
    {from: 2.9, to: 5.3, text: '«جيب عيش أو صامولي»', highlight: [{word: 'أو', color: 'or'}]},
    {from: 5.45, to: 7.6, text: 'هذه الجملة هي عبارة فصل؛', highlight: [{word: 'فصل؛', color: 'or'}, {word: 'عبارة', color: 'or'}]},
    {from: 7.6, to: 10.9, text: 'لأننا ربطنا العبارتين بكلمة «أو»', highlight: [{word: '«أو»', color: 'or'}]},
    {from: 11.2, to: 13.0, text: 'وعبارة الفصل يكفي يكون'},
    {from: 13.0, to: 15.7, text: 'جزء واحد من العبارة صحيح', highlight: [{word: 'واحد', color: 'or'}, {word: 'صحيح', color: 'true'}]},
    {from: 15.75, to: 17.8, text: 'يعني سواء أخذت عيش', highlight: [{word: 'عيش', color: 'aish'}]},
    {from: 17.8, to: 18.9, text: 'أو صامولي', highlight: [{word: 'أو', color: 'or'}, {word: 'صامولي', color: 'samoli'}]},
    {from: 18.9, to: 20.6, text: 'راح أنجز المهمة', highlight: [{word: 'أنجز', color: 'true'}]},
  ],
  beats: {
    card: 2.95,
    orGrow: 4.1,
    orSymbol: 5.2,
    split: 7.62,
    merge: 9.7,
    atLeastOne: 13.05,
    case1: 16.9, // عيش فقط
    case2: 18.0, // صامولي فقط
    case3: 18.9, // الاثنين
    case4: 20.2, // لا شيء
    settle: 21.5,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 2.95, name: 'swish', volume: 0.4},
    {at: 4.1, name: 'glitch', volume: 0.35},
    {at: 5.2, name: 'impact', volume: 0.4},
    {at: 7.62, name: 'whoosh_long', volume: 0.55},
    {at: 9.7, name: 'lock', volume: 0.5},
    {at: 13.45, name: 'drop', volume: 0.7},
    {at: 13.7, name: 'true_chime', volume: 0.55},
    {at: 17.15, name: 'drop', volume: 0.6},
    {at: 17.35, name: 'tick', volume: 0.5},
    {at: 18.25, name: 'drop', volume: 0.6},
    {at: 18.45, name: 'tick', volume: 0.5},
    {at: 19.15, name: 'drop', volume: 0.6},
    {at: 19.35, name: 'tick', volume: 0.5},
    {at: 20.2, name: 'swish', volume: 0.35},
    {at: 20.55, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE D — من «أو» إلى «و» ────────────────────────────────
export const SCENE_D = scene({
  id: 'D',
  title: 'من الفصل إلى الوصل',
  durationSec: 9.6,
  overlapSec: 0.4,
  voice: {src: 'voice/05a-conjunction-intro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.05, text: 'لكن لو أبوي قال:'},
    {from: 2.05, to: 4.5, text: '«جيب عيش وصامولي»', highlight: [{word: 'وصامولي»', color: 'and'}]},
    {from: 4.5, to: 6.0, text: 'هذه عبارة وصل', highlight: [{word: 'وصل', color: 'and'}]},
    {from: 6.0, to: 9.2, text: 'لأننا ربطنا العبارتين بحرف الواو', highlight: [{word: 'الواو', color: 'and'}]},
  ],
  beats: {flip: 0.15, card: 1.9, waGrow: 3.34, term: 4.54, bond: 6.04},
  sfx: [
    {at: 0.0, name: 'riser', volume: 0.35},
    {at: 0.55, name: 'impact', volume: 0.7},
    {at: 0.6, name: 'whoosh_long', volume: 0.5},
    {at: 3.34, name: 'glitch', volume: 0.3},
    {at: 4.54, name: 'swish', volume: 0.35},
    {at: 6.04, name: 'lock', volume: 0.6},
  ],
});

// ── SCENE E — عبارة الوصل AND ────────────────────────────────
export const SCENE_E = scene({
  id: 'E',
  title: 'عبارة الوصل',
  durationSec: 19.8,
  overlapSec: 0.4,
  voice: {src: 'voice/05b-conjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 3.15, text: 'وعبارة الوصل تكون صحيحة فقط', highlight: [{word: 'فقط', color: 'and'}]},
    {from: 3.15, to: 6.0, text: 'إذا كانت كلا العبارتين صحيحتين', highlight: [{word: 'كلا', color: 'and'}]},
    {from: 6.35, to: 7.84, text: 'يعني في هذه الحالة'},
    {from: 7.84, to: 10.5, text: 'لازم آخذ صامولي وعيش', highlight: [{word: 'صامولي', color: 'samoli'}, {word: 'وعيش', color: 'aish'}]},
    {from: 10.9, to: 13.08, text: 'طيب لو نسيت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 13.08, to: 14.2, text: 'النتيجة: False', highlight: [{word: 'False', color: 'false'}]},
    {from: 14.2, to: 16.0, text: 'ولو نسيت الصامولي', highlight: [{word: 'الصامولي', color: 'samoli'}]},
    {from: 16.0, to: 16.96, text: 'وجبت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 16.96, to: 18.8, text: 'أيضًا النتيجة False', highlight: [{word: 'False', color: 'false'}]},
  ],
  beats: {
    slots: 0.9,
    bothRule: 3.2,
    samoliIn: 9.04,
    aishIn: 9.8,
    bothTrue: 10.34,
    removeAish: 11.75,
    false1: 13.68,
    recompose: 14.45,
    false2: 18.02,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.45},
    {at: 0.9, name: 'tick', volume: 0.5},
    {at: 9.19, name: 'drop', volume: 0.7},
    {at: 9.39, name: 'lock', volume: 0.4},
    {at: 9.95, name: 'drop', volume: 0.7},
    {at: 10.15, name: 'lock', volume: 0.4},
    {at: 10.34, name: 'true_chime', volume: 0.6},
    {at: 11.75, name: 'swish', volume: 0.5},
    {at: 13.68, name: 'false_hit', volume: 0.6},
    {at: 14.45, name: 'whoosh_long', volume: 0.5},
    {at: 16.3, name: 'drop', volume: 0.6},
    {at: 18.02, name: 'false_hit', volume: 0.6},
  ],
});

// ── SCENE F — الملخص (بدون تعليق صوتي) ───────────────────────
export const SCENE_F = scene({
  id: 'F',
  title: 'الملخص',
  durationSec: 3.9,
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
  durationSec: 6.3,
  overlapSec: 0.5,
  voice: {src: 'voice/06-outro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.95, text: 'وهذا درس المنطق،', highlight: [{word: 'المنطق،', color: 'accent'}]},
    {from: 1.95, to: 5.3, text: 'من مادة الرياضيات للصف الأول ثانوي'},
  ],
  beats: {logo: 0.25, subject: 1.9},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.5},
    {at: 0.3, name: 'shimmer', volume: 0.45},
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
