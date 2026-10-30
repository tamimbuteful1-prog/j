# محرك «الحدود الرقمية» (Remotion)

موشن جرافيك فوق فيديو تميم وهو يتكلم. اللقطة الكاملة: الجرافيك في المساحات الفاضية. اللحظات المهمة: الفيديو يصغر لبطاقة في الزاوية والجرافيك ياخذ الشاشة.

- `src/episodes/HR-E01/timeline.ts` — سطور الحلقة وتوقيتها (تقديري قبل التصوير؛ بعد التصوير تُملأ `measured` من توقيت الكلام الحقيقي).
- `src/episodes/HR-E01/scenes.tsx` — كل الجرافيك، مربوط بالسطور والكلمات.
- `src/episodes/HR-E01/Sound.tsx` — المؤثرات والموسيقى مربوطة بالكلام.
- `src/episodes/HR-E01/Episode.tsx` — `MEDIA.footage = 'footage/HR-E01.mp4'` بعد ما يوصل الفيديو.
- `public/sfx`, `public/music` — أصوات **مؤقتة** مولّدة (`npm run sfx`). أي ملف بنفس الاسم من مكتبة حقيقية يستبدلها.
- `npm run map` يعيد بناء خريطة السعودية من بيانات Natural Earth.

تشغيل: `npm install` ثم `npx remotion studio` أو `npx remotion render HR-E01 out/HR-E01.mp4`.
