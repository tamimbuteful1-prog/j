# منهجي — الحلقة 2: العبارات الشرطية (Short 1080×1920)

- `out/manhaji-ep2-1080x1920.mp4` — الفيديو النهائي (H.264، 30fps، ‎-14 LUFS).
- `TRANSCRIPT.md` — النص المفرّغ + قائمة القصّات.
- `src/timeline.json` — مقاطع الصوت المحتفظ بها وتوقيت كل حركة (بثواني التسجيل الأصلي).
- `scripts/mix.py` — قص الصوت وتنظيفه + موسيقى ومؤثرات مولّدة برمجيًا (أصلية) + Mastering.
- `src/scenes/` — Hook (الفيديو + انتقال البطاقة المقلوبة)، BellScene (الجرس، السؤال، فن، العنوان)، LogicScene (الشرطية/العكس/المعكوس/المعاكس الإيجابي)، Summary (المصفوفة والخاتمة).

```bash
python3 scripts/mix.py     # بعد تعديل timeline.json
npm run studio
npm run render
```
`node_modules` رابط إلى مشروع الحلقة 1 (`../manhaji-ep1/node_modules`)؛ أو شغّل `npm install`.
