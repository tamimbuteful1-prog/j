'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createWebSpeechInput, ERROR_TEXT, type SpeechInput } from '@/lib/speech/recognizer';

export function useVoice(onFinal: (text: string) => void) {
  const input = useRef<SpeechInput | null>(null);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const cb = useRef(onFinal);
  cb.current = onFinal;

  useEffect(() => {
    input.current = createWebSpeechInput('ar-SA');
    setSupported(input.current.supported);
  }, []);

  const start = useCallback(() => {
    const i = input.current;
    if (!i) return;
    setError(null);
    setPartial('');
    if (!i.supported) {
      setError(ERROR_TEXT.unsupported);
      return;
    }
    setListening(true);
    i.start({
      onPartial: setPartial,
      onFinal: (t) => cb.current(t),
      onError: (c) => c !== 'aborted' && setError(ERROR_TEXT[c] ?? 'صار خطأ في التسجيل، جرّب مرة ثانية'),
      onEnd: () => {
        setListening(false);
        setPartial('');
      },
    });
  }, []);

  const stop = useCallback(() => input.current?.stop(), []);
  return { listening, partial, error, supported, start, stop, toggle: () => (listening ? stop() : start()) };
}
