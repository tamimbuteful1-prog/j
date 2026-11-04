/** قراءة الرد بصوت عربي إن توفر */
export function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const clean = text.replace(/[✓•…]/g, '');
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'ar-SA';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ar'));
  if (voice) u.voice = voice;
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
