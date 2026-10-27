# Storyboard مرتبط بالسطور

## المرتكزات (anchors)
| الصيغة | المعنى |
|---|---|
| `{"line":"L06"}` | بداية السطر |
| `{"line":"L06","at":"end"}` | نهاية السطر |
| `{"line":"L06","at":0.5}` | منتصف مدة السطر |
| `{"line":"L06","word":"أو"}` | لحظة الكلمة (تُقدَّر من موقعها في السطر؛ تُضبط بدقة إن توفر توقيت الكلمات) |
| `{"line":"L06","word":"أو","occurrence":2}` | الظهور الثاني للكلمة |
| `{"scene":"S03","at":"end"}` | نهاية المشهد (للحركات الصامتة/الملخص) |
`offset` بالثواني (موجب/سالب) يُضاف بعد الحل.

## المشهد
```json
{
  "id": "S04",
  "section": "explanation",
  "lines": ["L07","L08"],
  "goal": "يرى الطالب أن تحقق جزء واحد يكفي لصحة عبارة الفصل",
  "background": "استوديو داكن بلون OR خفيف",
  "elements": [{"id":"aish","desc":"منتج العيش","position":"يمين، x=725 y=1220","size":"0.6"}],
  "on_screen_text": [{"text":"يكفي واحد على الأقل","beat":"atLeastOne","style":"kinetic-headline"}],
  "motion": [{"beat":"atLeastOne","what":"العيش يسقط في السلة","before":"العيش معلّق فوق مساره","why":"تحقق جزء واحد","result":"مؤشر البوابة يضيء أخضر فورًا","holds":"الصامولي ثابت في مساره"}],
  "beats": [{"name":"atLeastOne","anchor":{"line":"L08","word":"واحد"},"offset":-0.1}],
  "sfx": [{"beat":"atLeastOne","name":"drop","offset":0.35,"volume":0.7}],
  "transition_out": {"type":"match-cut","desc":"السلة تبقى في مكانها وتتحول الخلفية"},
  "silent_tail_sec": 0
}
```
- مشهد بلا كلام (ملخص بصري) = `lines: []` + `silent_duration_sec`.
- `silent_tail_sec`: وقفة استيعاب بعد آخر سطر في المشهد.
