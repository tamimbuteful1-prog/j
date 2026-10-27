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
  durationSec: 8.3,
  overlapSec: 0.5,
  voice: {src: 'voice/03-truth-value.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.25, to: 1.36, text: 'في درس المنطق،'},
    {from: 1.36, to: 3.82, text: 'عندنا شيء اسمه قيمة الصواب،', highlight: [{word: 'قيمة', color: 'accent'}, {word: 'الصواب،', color: 'accent'}]},
    {from: 3.82, to: 5.5, text: 'يعني هل نتيجة العبارة'},
    {from: 5.5, to: 7.4, text: 'True أو False؟', highlight: [{word: 'True', color: 'true'}, {word: 'False؟', color: 'false'}]},
  ],
  beats: {title: 2.65, system: 3.8, trueCase: 5.5, falseCase: 6.25},
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.6},
    {at: 2.65, name: 'impact', volume: 0.35},
    {at: 3.8, name: 'swish', volume: 0.4},
    {at: 5.05, name: 'drop', volume: 0.7},
    {at: 5.5, name: 'true_chime', volume: 0.55},
    {at: 5.95, name: 'swish', volume: 0.35},
    {at: 6.25, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE C — عبارة الفصل OR ──────────────────────────────────
export const SCENE_C = scene({
  id: 'C',
  title: 'عبارة الفصل',
  durationSec: 20.9,
  overlapSec: 0.5,
  voice: {src: 'voice/04-disjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 2.35, text: 'خلونا نفترض إن أبوي قال:'},
    {from: 2.35, to: 4.4, text: '«جيب عيش أو صامولي»', highlight: [{word: 'أو', color: 'or'}]},
    {from: 4.45, to: 6.5, text: 'هذه الجملة هي عبارة فصل؛', highlight: [{word: 'فصل؛', color: 'or'}, {word: 'عبارة', color: 'or'}]},
    {from: 6.5, to: 9.6, text: 'لأننا ربطنا العبارتين بكلمة «أو»', highlight: [{word: '«أو»', color: 'or'}]},
    {from: 9.85, to: 11.9, text: 'وعبارة الفصل يكفي يكون'},
    {from: 11.9, to: 14.3, text: 'جزء واحد من العبارة صحيح', highlight: [{word: 'واحد', color: 'or'}, {word: 'صحيح', color: 'true'}]},
    {from: 14.4, to: 16.3, text: 'يعني سواء أخذت عيش', highlight: [{word: 'عيش', color: 'aish'}]},
    {from: 16.3, to: 17.25, text: 'أو صامولي', highlight: [{word: 'أو', color: 'or'}, {word: 'صامولي', color: 'samoli'}]},
    {from: 17.25, to: 18.9, text: 'راح أنجز المهمة', highlight: [{word: 'أنجز', color: 'true'}]},
  ],
  beats: {
    card: 2.2,
    orGrow: 3.1,
    orSymbol: 4.3,
    split: 6.6,
    merge: 8.7,
    atLeastOne: 11.95,
    case1: 15.5, // عيش فقط
    case2: 16.4, // صامولي فقط
    case3: 17.3, // الاثنين
    case4: 18.6, // لا شيء
    settle: 19.9,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.5},
    {at: 2.2, name: 'swish', volume: 0.4},
    {at: 3.1, name: 'glitch', volume: 0.35},
    {at: 4.3, name: 'impact', volume: 0.4},
    {at: 6.6, name: 'whoosh_long', volume: 0.55},
    {at: 8.7, name: 'lock', volume: 0.5},
    {at: 12.35, name: 'drop', volume: 0.7},
    {at: 12.6, name: 'true_chime', volume: 0.55},
    {at: 15.75, name: 'drop', volume: 0.6},
    {at: 15.95, name: 'tick', volume: 0.5},
    {at: 16.65, name: 'drop', volume: 0.6},
    {at: 16.85, name: 'tick', volume: 0.5},
    {at: 17.55, name: 'drop', volume: 0.6},
    {at: 17.75, name: 'tick', volume: 0.5},
    {at: 18.6, name: 'swish', volume: 0.35},
    {at: 18.95, name: 'false_hit', volume: 0.5},
  ],
});

// ── SCENE D — من «أو» إلى «و» ────────────────────────────────
export const SCENE_D = scene({
  id: 'D',
  title: 'من الفصل إلى الوصل',
  durationSec: 8.3,
  overlapSec: 0.4,
  voice: {src: 'voice/05a-conjunction-intro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.75, text: 'لكن لو أبوي قال:'},
    {from: 1.75, to: 3.5, text: '«جيب عيش وصامولي»', highlight: [{word: 'وصامولي»', color: 'and'}]},
    {from: 3.55, to: 5.0, text: 'هذه عبارة وصل', highlight: [{word: 'وصل', color: 'and'}]},
    {from: 5.0, to: 7.95, text: 'لأننا ربطنا العبارتين بحرف الواو', highlight: [{word: 'الواو', color: 'and'}]},
  ],
  beats: {flip: 0.15, card: 1.6, waGrow: 2.55, term: 3.65, bond: 5.1},
  sfx: [
    {at: 0.0, name: 'riser', volume: 0.35},
    {at: 0.55, name: 'impact', volume: 0.7},
    {at: 0.6, name: 'whoosh_long', volume: 0.5},
    {at: 2.55, name: 'glitch', volume: 0.3},
    {at: 3.65, name: 'swish', volume: 0.35},
    {at: 5.1, name: 'lock', volume: 0.6},
  ],
});

// ── SCENE E — عبارة الوصل AND ────────────────────────────────
export const SCENE_E = scene({
  id: 'E',
  title: 'عبارة الوصل',
  durationSec: 18.8,
  overlapSec: 0.4,
  voice: {src: 'voice/05b-conjunction.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 3.0, text: 'وعبارة الوصل تكون صحيحة فقط', highlight: [{word: 'فقط', color: 'and'}]},
    {from: 3.0, to: 6.3, text: 'إذا كانت كلا العبارتين صحيحتين', highlight: [{word: 'كلا', color: 'and'}]},
    {from: 6.4, to: 7.85, text: 'يعني في هذه الحالة'},
    {from: 7.85, to: 10.3, text: 'لازم آخذ صامولي وعيش', highlight: [{word: 'صامولي', color: 'samoli'}, {word: 'وعيش', color: 'aish'}]},
    {from: 10.6, to: 12.6, text: 'طيب لو نسيت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 12.6, to: 14.2, text: 'النتيجة: False', highlight: [{word: 'False', color: 'false'}]},
    {from: 14.3, to: 15.5, text: 'ولو نسيت الصامولي', highlight: [{word: 'الصامولي', color: 'samoli'}]},
    {from: 15.5, to: 16.4, text: 'وجبت العيش؟', highlight: [{word: 'العيش؟', color: 'aish'}]},
    {from: 16.4, to: 17.9, text: 'أيضًا False', highlight: [{word: 'False', color: 'false'}]},
  ],
  beats: {
    slots: 0.9,
    bothRule: 3.2,
    samoliIn: 8.9,
    aishIn: 9.55,
    bothTrue: 10.05,
    removeAish: 11.5,
    false1: 13.25,
    recompose: 14.5,
    false2: 17.05,
  },
  sfx: [
    {at: 0.0, name: 'whoosh_short', volume: 0.45},
    {at: 0.9, name: 'tick', volume: 0.5},
    {at: 9.05, name: 'drop', volume: 0.7},
    {at: 9.25, name: 'lock', volume: 0.4},
    {at: 9.7, name: 'drop', volume: 0.7},
    {at: 9.9, name: 'lock', volume: 0.4},
    {at: 10.05, name: 'true_chime', volume: 0.6},
    {at: 11.5, name: 'swish', volume: 0.5},
    {at: 13.25, name: 'false_hit', volume: 0.6},
    {at: 14.5, name: 'whoosh_long', volume: 0.5},
    {at: 15.9, name: 'drop', volume: 0.6},
    {at: 17.05, name: 'false_hit', volume: 0.6},
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
  durationSec: 6.0,
  overlapSec: 0.5,
  voice: {src: 'voice/06-outro.wav', enabled: true, offsetSec: 0.2},
  captions: [
    {from: 0.2, to: 1.9, text: 'وهذا درس المنطق،', highlight: [{word: 'المنطق،', color: 'accent'}]},
    {from: 1.9, to: 5.0, text: 'من مادة الرياضيات للصف الأول ثانوي'},
  ],
  beats: {logo: 0.25, subject: 1.9},
  sfx: [
    {at: 0.0, name: 'whoosh_long', volume: 0.5},
    {at: 0.3, name: 'shimmer', volume: 0.45},
  ],
});

/** Hook captions — relative to the hook clip. Only drawn on the placeholder. */
export const HOOK_LINE = 'أبوي قال لي أجيب عيش وصامولي… ولا قال عيش أو صامولي؟!';

export const SCENES = [SCENE_A, SCENE_B, SCENE_C, SCENE_D, SCENE_E, SCENE_F, SCENE_OUTRO] as const;

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
