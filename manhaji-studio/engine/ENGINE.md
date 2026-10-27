# MANHAJI engine — API for the Motion Agent

One Remotion project for every episode. Your episode lives in `engine/src/episodes/<EPISODE_ID>/`.
The orchestrator owns `timeline.preview.json`, `registry.ts`, rendering and media — you own the scenes.

## Files you write
```
engine/src/episodes/<ID>/
  index.ts          ← exports `episode: EpisodeModule`
  S01.tsx … Snn.tsx ← one component per storyboard scene
  (optional) parts/ ← episode-specific components
```
`index.ts` template:
```ts
import type {EpisodeModule} from '../../kit/Episode';
import type {Timeline} from '../../timeline/resolve';
import previewTimeline from './timeline.preview.json';
import {S01} from './S01';
import {S02} from './S02';

export const episode: EpisodeModule = {
  id: '<ID>',
  meta: {subject_ar: 'الرياضيات', grade_ar: 'أول ثانوي', lesson_ar: 'المنطق'},
  scenes: {S01, S02},
  previewTimeline: previewTimeline as unknown as Timeline,
  // HookOverlay: optional card under the hook footage (gets {frame, clipT, inHold, out, top})
};
```
Run `npm run studio -- resolve <ID> preview` first — it writes `timeline.preview.json` and registers the episode.

## Timing — never hard-code spoken moments
Inside a scene, frame 0 = scene start. Use:
```tsx
const frame = useCurrentFrame();
const {beat, line, duration} = useScene();          // seconds, scene-relative
const p = ramp(frame, beat('orGrow'), beat('orGrow') + 0.6, EASE.out);
const l = line('L07');                                // {start, end, text}
```
Beats come from `storyboard.json`. Change timing by moving the anchor/offset there, not in code.
Free (non-spoken) motion may use literal seconds relative to a beat (e.g. `beat('drop') + 0.35`).

## Kit (`engine/src/kit/`)
| Module | Use |
|---|---|
| `theme.ts` | `COLORS` (semantic: true/false/or/and/aish…), `FONTS`, `SAFE` areas, `VIDEO` |
| `anim.ts` | `ramp`, `kf` (multi-keyframe), `pop`/`settle` (springs), `drop`, `shake`, `wobble`, `mix`, `EASE` |
| `Type.tsx` | `KineticLine` (per-word, RTL-safe, `glue` for «و»), `Eyebrow`, `Chip` (∨/∧ badge) |
| `ResultBadge.tsx` | TRUE ✓ / FALSE ✕ badge with draw-on + flash |
| `TruthTable.tsx` | progressive RTL truth table |
| `LogicSymbol.tsx` | ∨ / ∧ as geometry |
| `Extruded.tsx` | solid 3D glyph/shape (layers) — `render={(c)=>…}` for SVG content |
| `Backdrop.tsx` | `StudioBackdrop` (ink studio, tint, floor grid), `Spotlight`, `Finish` (applied globally) |
| `Outro.tsx` | unified «منهجي» end card — use it in the conclusion scene |
| `HookFrame.tsx` | the real hook (handled by the episode runner); `ManhajiMark` logo |
| `Captions`, `SoundDesign` | global — do not add them in scenes |

## Worlds (`engine/src/worlds/`)
Reusable environments + props. `grocery/` = `Aisle` (CSS-3D aisle + `project()`), `Product` (عيش/صامولي), `Basket`.
A new episode in a new setting builds a new world here (e.g. `worlds/street/`) — reuse only when it is truly the best metaphor.

## SFX names (`public/sfx`)
`whoosh_long whoosh_short swish riser pop drop true_chime false_hit tick tape_stop impact lock shimmer glitch` — declare in storyboard `sfx[]` against a beat.

## Rules
- 1080×1920, 30fps. Keep important content inside `SAFE`; never in the caption band (y 1500–1720).
- Arabic: animate per word; isolate Latin/numbers; draw symbols as shapes.
- Deterministic only: no `Math.random()`, no `Date.now()` — use `wobble(frame, seed)`.
- `npx tsc --noEmit` (in engine/) must pass. Then `npm run stills -- <ID> <sec…>` and LOOK.
