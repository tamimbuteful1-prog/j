# منهجي — الحلقة 1: التبرير الاستقرائي والتخمين

مشروع Remotion قابل للتعديل بالكامل لمونتاج الحلقة الأولى.

## الملفات النهائية
- `out/manhaji-ep1-1920x1080.mp4` — النسخة الرئيسية الأفقية 16:9 (H.264، 30fps، AAC 48kHz، ‎-14 LUFS).
- `out/manhaji-ep1-1080x1920.mp4` — نسخة Shorts/Reels العمودية مع إعادة تأطير اللقطة المصورة والرسومات.

## البنية
| الملف | الدور |
|---|---|
| `src/timeline.json` | **مصدر التوقيت الوحيد**: مقاطع الصوت المحتفظ بها (بعد حذف الصمت) + توقيت كل حركة بالثواني من التسجيل الأصلي |
| `scripts/mix.py` | مونتاج الصوت: قص الصمت بدون تغيير السرعة، تنظيف الصوت، موسيقى ومؤثرات مولّدة برمجيًا (أصلية بلا حقوق)، Ducking، ‏Mastering |
| `src/scenes/Intro.tsx` | المشهد 1: الزوم الرقمي، «إلا اليوم!»، انتقال الـIris إلى الخريطة |
| `src/map/*` | محرك 2.5D صغير (كاميرا منظور + مدينة Vector مجسمة) |
| `src/scenes/MapScene.tsx` | المشهدان 2 و4: المشوار، الساعات، التجميد «بس لحظة!»، الزحام والحادث وعلامة الاستفهام |
| `src/scenes/Days.tsx` | المشهد 3: الأيام الثلاثة |
| `src/scenes/Counter.tsx` | المشهد 5: المثال المضاد |
| `src/scenes/Concept.tsx` | المشهدان 6 و7: التخمين ← التبرير الاستقرائي |
| `src/scenes/Outro.tsx` | المشهد 8: الخاتمة |

## التشغيل
```bash
npm install
python3 scripts/mix.py           # يعيد بناء public/audio/mix.wav عند تغيير timeline.json
npm run studio                   # معاينة وتعديل
npm run render:landscape
npm run render:vertical
```
لضبط توقيت أي حركة: عدّل الرقم في `src/timeline.json` (بالثواني من التسجيل الأصلي) ثم أعد تشغيل `mix.py` والرندر.

الخطوط: Noto Kufi Arabic وIBM Plex Sans Arabic وJetBrains Mono (رخصة OFL). جميع الرسومات والموسيقى والمؤثرات مصنوعة داخل المشروع.
