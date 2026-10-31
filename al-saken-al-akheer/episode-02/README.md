# الساكن الأخير | الحلقة 02 — اللي بالكاميرا مو أنا

النسخة الأولية المتحركة (Animatic) للحلقة الثانية، مركّبة على تسجيل الراوي من ElevenLabs.

| البند | التفاصيل |
|---|---|
| المدة | ≈ 143 ثانية (السرد 135.6 ث + النهاية والعنوان) |
| الأبعاد | 1080×1920 — 30fps — ستيريو |
| الصوت | -14 LUFS، والقمة تحت -1 dBTP |

## الإيقاع
التسجيل الأصلي مصدّر بسرعة 1.1، فكان الكلام سريع:
- أبطأته لـ 0.94 بدون ما تتغير طبقة الصوت.
- طوّلت الوقفات عند اللحظات المخيفة.
- ما انحذفت أي جملة. التوقيت الناتج محفوظ في `animatic/timeline.js`.

## النص المسجّل (63 مقطع)
مستخرج من التسجيل بتفريغ صوتي، ومحفوظ مع طول الوقفة بعد كل جملة في `animatic/ep2_script.json`.

## الملفات
- `episode-02.src.html` + `build_html.py` — المشاهد، وتستخدم نفس غرفة وشخصية الحلقة الأولى (`_shared_*.svg`).
- `retime_vo.py` — يبطّئ السرد ويوزّع الوقفات.
- `make_audio_ep2.py` — الموسيقى (لحن صندوق موسيقى هادي ومخيف، مؤلف خصيصًا) والمؤثرات وصوت النسخة.
- `render.js` — يصدّر الفيديو MP4.

```bash
ffmpeg -i narration.mp3 -af silencedetect=noise=-38dB:d=0.22 -f null - 2> sil.txt
python3 retime_vo.py narration.mp3 sil.txt .
python3 build_html.py
python3 make_audio_ep2.py vo_paced.wav timeline.js mix.wav
node render.js mix.wav ep02.mp4 episode-02.html 30
```
