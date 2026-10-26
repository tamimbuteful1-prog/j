# Voice-over slots (Tamim's real voice — never replaced by TTS)

| File | Scene | Line |
|---|---|---|
| `02-story.wav` | A | رحت البقالة، وأول ما وصلت نسيت وش أبوي طلب مني بالضبط! |
| `03-truth-value.wav` | B | في درس المنطق، عندنا شيء اسمه قيمة الصواب… |
| `04-disjunction.wav` | C | خلونا نفترض إن أبوي قال: «جيب عيش أو صامولي»… |
| `05a-conjunction-intro.wav` | D | لكن لو أبوي قال: «جيب عيش وصامولي»… |
| `05b-conjunction.wav` | E | وعبارة الوصل تكون صحيحة فقط… أيضًا False. |
| `06-outro.wav` | Outro | وهذا درس المنطق، من مادة الرياضيات للصف الأول الثانوي. |

After dropping a file: set `voice.enabled = true` for that scene in `src/config/timeline.ts`,
then nudge that scene's `captions` and `beats` to the real speech (visuals follow the beats).
