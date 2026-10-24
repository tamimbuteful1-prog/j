# منهجي — Cinematic Educational Short (Remotion)

YouTube Shorts / TikTok / Reels · 1080×1920 · 30 fps · H.264 · 75 s
Final render: `out/manhaji_short.mp4`

## Pipeline

```bash
npm install
python3 scripts/build_voice.py      # cuts the raw narration (source/voice_raw.flac) using scripts/edl.json
python3 scripts/build_audio.py 75   # synthesises all SFX + the original score, ducked under the voice
python3 scripts/mix_audio.py        # final soundtrack (mirrors src/audio/SoundTrack.tsx)
npm run studio                      # live preview / edit
scripts/render_chunks.sh                 # resumable render (450-frame chunks) + audio mix + final encode
node scripts/stills.mjs 9.6 25 54.4 # quick preview stills (seconds)
```

Python needs: `numpy soundfile scipy` (+ `sherpa-onnx` only if you want to re-transcribe).

## Narration — transcript & edit

The raw recording had several retakes. `scripts/edl.json` keeps only the clean take of each line, and no wording was changed:

| Video time | Narration (kept take) |
|---|---|
| 9.00 – 17.52 | كنت أصوّر وفجأة انقطعت الكهرباء… كل اللمبات طفت إلا واحدة، لأنها تشتغل بالكهرباء أو البطارية الاحتياطية |
| 18.07 – 23.07 | طيب وش الفرق لو قلت: اللمبة تشتغل بالكهرباء والبطارية الاحتياطية؟ |
| 23.72 – 30.87 | هنا يدخل درس المنطق. في المنطق، الجملة اللي نقدر نحكم عليها بصح أو خطأ نسمّيها عبارة |
| 31.42 – 42.43 | مثلًا في الموقف اللي قبل شوي: الكهرباء شغّالة؟ لا → False · البطارية الاحتياطية شغّالة؟ نعم → True |
| 43.18 – 48.30 | لما أقول: الكهرباء شغّالة أو البطارية شغّالة… هذه عبارة فصل |
| 48.80 – 58.12 | لكن لو قلت: الكهرباء شغّالة والبطارية شغّالة… فهنا كلامي خطأ، هذه عبارة وصل لتواجد حرف الواو |
| 59.02 – 63.00 | ونقدر نوضّح الفرق بشكل أبسط من خلال أشكال فن |
| 66.40 – 72.55 | باقي التفاصيل في درس المنطق، من مادة الرياضيات للصف الأول ثانوي · السلام عليكم |

Removed: false starts of «طيب وش الفرق…» (×4), the first take where electricity was answered «نعم → True» (corrected by the narrator himself to «لا → False»), «نحطها في اسم أو مصطلح», and the duplicate takes of «ونقدر نوضح…» / «باقي التفاصيل…».

## Scene plan

| Time | Scene | Visual idea |
|---|---|---|
| 0 – 8.7 | **Real hook** | Original footage, sound and lights-out moment untouched. Virtual camera reframes 16:9 → 9:16 (bottom-anchored, follows gestures, punch-in on the exact blackout frame 3.958 s), clean wall extension above, headline «انقطعت الكهرباء… واللمبة شغّالة!» → «كيف؟» |
| 8.05 – 9.4 | **Dive into the idea** | He points at his temple → camera pushes into his head, zoom-blur, light-speed streaks, circuit rings, flash → lands on the circuit-board world as the narration starts |
| 9 – 17.5 | ٠١ الموقف | Four studio lamps on a powered rail; blackout with sparks and shake; one lamp re-lights from the backup battery; «الكهرباء · أو · البطارية الاحتياطية» |
| 18 – 23 | ٠٢ السؤال | Split screen: «…بالكهرباء **أو** البطارية» (lamp on) vs the new sentence built word-by-word with «**و**» and a pulsing «؟» |
| 23.7 – 31 | ٠٣ العبارة | «المنطق» title slam; a «جملة» card rides into a judging gate (صح / خطأ) and comes out stamped «عبارة» |
| 31.4 – 42.5 | ٠٤ True / False | Memory of the scene; each statement card asks «؟», gets «لا»/«نعم», and flies into the False / True tray |
| 43 – 58 | ٠٥ فصل ووصل | Same two statements, two wirings: OR = parallel sources → lamp lights → `F أو T = T` «عبارة فصل»; AND = series → current dies at the dead grid → `F و T = F` (punch-in) «عبارة وصل», then dive onto the letter «و» |
| 59 – 66.4 | ٠٦ أشكال فن | Two circles drawn live with drifting elements; split into OR (union lit → «موقفنا» inside → T) and AND (intersection lit → «موقفنا» outside → F) |
| 66.4 – 75 | Outro | Pull back to reveal the whole lesson as one circuit, «درس المنطق · مادة الرياضيات · الصف الأول ثانوي», then the «منهجي» wordmark |

## Structure

- `src/timeline.generated.ts` — segment and word-cue times (generated; every animation keys off these)
- `src/world/camera.ts` — the camera script (pushes, travels with 3D tilt, shakes, pull-back)
- `src/world/World.tsx` — the board: parallax layers, module frames, connecting traces, velocity-based motion blur
- `src/scenes/S1…S6` — one module per idea
- `src/hook/Hook.tsx` — 9:16 reframing of the real footage + the dive
- `src/overlay/Overlays.tsx` — dive FX, subtitles, outro/logo, grain/vignette
- `src/audio/SoundTrack.tsx` — hook sound, narration, score and every SFX cue
- `scripts/` — voice edit, sound design/music synthesis, preview stills
- `source/` — the original uploaded files

All music and sound effects are original, synthesised in `scripts/build_audio.py` (no third-party samples).

> Render with `--gl=angle`: the `swangle` backend produced white-tile artifacts on some scenes.
