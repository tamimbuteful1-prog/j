# منهجي — المنطق | MANHAJI — LOGIC

Cinematic motion-graphics lesson (Remotion · React · TypeScript) — **1080×1920 · 9:16 · 30 fps · H.264 MP4**.

العيش والصامولي والسلة هم أدوات الشرح نفسها: كل حركة تخدم فكرة «أو» / «و».

## Quick start

```bash
npm install
npm run dev            # Remotion Studio (full film + each scene in the "Scenes" folder)
npm run render         # final: out/manhaji-logic.mp4 (H.264, CRF 16, 320k audio)
npm run render:draft   # fast half-res preview
npm run sfx            # regenerate the temporary sound kit
```

> In a sandbox without Chrome, add `--browser-executable=<path to chrome-headless-shell>`.

## Drop-in media (the only things you need to touch)

| What | Where | Then |
|---|---|---|
| Hook clip (graded in Higgsfield) | `public/footage/hook.mp4` | `HOOK.enabled = true` in `src/config/media.ts`, set `HOOK.orWordSec` |
| Voice-over per scene | `public/voice/*.wav` (names in `public/voice/README.md`) | `voice.enabled = true` in `src/config/timeline.ts` |
| Music | `public/music/bed.wav` | same name replaces the temp bed |
| SFX | `public/sfx/*.wav` | same names replace the temp sounds |

The music and SFX that ship with the project are **procedurally generated placeholders**
(`scripts/generate-sfx.mjs`) so the timing works now. Replace them with licensed library sounds
of the same names for the final mix.

## Retiming to the real voice

Everything is keyed to `src/config/timeline.ts`:
- `captions` — on-screen subtitle windows (also auto-duck the music)
- `beats` — named moments every animation reads (`orGrow`, `flip`, `removeAish`, …)
- `sfx` — sound cues on the same clock

Move a beat → the visual and its sound move together. The hook length is detected automatically
and all scenes re-flow after it.

## Film structure

| # | Scene | Visual idea |
|---|---|---|
| 1 | Hook (real footage) | slow push-in · hold-frame on «أو» with a 3D «و ؟ أو» beat · footage becomes a card in 3D space and the camera flies past it |
| A | البقالة | one continuous CSS-3D dolly down an aisle to the bakery end-cap · depth-of-field isolation · solid 3D «؟» · headline whose connector flips «و ↔ أو» with the indecision |
| B | قيمة الصواب | aisle dissolves to studio, products stay (match cut) · bread lands in basket → TRUE, pulled out → FALSE |
| C | عبارة الفصل OR | order card → «أو» grows → becomes ∨ → two lanes → merge into ONE basket · "one is enough" · 4 cases fill a truth table (incl. both → TRUE) |
| D | OR → AND | ∨ flips 180° and lands as ∧ (same shape, upside down) · world re-tints blue → violet · products slam together and get bonded |
| E | عبارة الوصل AND | two-key lock on the basket (opens only at 2/2) · both → TRUE · bread pulled → FALSE · new camera angle + rhythm, samoli gone → FALSE |
| F | الملخص | one split design, no new voice-over |
| — | منهجي | logo end card, final line |

## Typography rules (Arabic first)

- Self-hosted **Tajawal** (display) + **IBM Plex Sans Arabic** (text/captions) in `public/fonts` — no network at render time.
- Kinetic text animates **per word, never per letter**, so Arabic letters always stay joined.
  The only split allowed inside a word is «و» (+«صامولي»): waw never connects to the next letter, so the shaping is identical.
- Mixed Arabic/English words are isolated (`unicode-bidi: isolate`) inside RTL containers.
- ∨ / ∧ are drawn as geometry (`LogicSymbol`) instead of relying on font glyphs.
- Safe areas for vertical platforms live in `src/config/theme.ts` (`SAFE`); captions have their own reserved band.
  Toggle `SHOW_SAFE_GUIDES` in `media.ts` to check.

## Project map

```
src/
  config/   theme.ts (identity) · timeline.ts (beats/captions/sfx) · media.ts (asset slots & mix)
  components/  Aisle (3D market) · Product · Basket · Type (kinetic RTL) · ResultBadge · TruthTable · Extruded · LogicSymbol · Captions · Backdrop
  scenes/   HookScene · SceneA…SceneF · Outro
  audio/    SoundDesign (SFX, VO slots, auto-ducked music)
scripts/    generate-sfx.mjs · stills.mjs (QA contact sheets)
```
