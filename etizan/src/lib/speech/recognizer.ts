/**
 * طبقة إدخال الصوت. الآن: Web Speech API (ar-SA) في المتصفح.
 * لاحقًا: يمكن تنفيذ نفس الواجهة SpeechInput بتسجيل MediaRecorder وإرساله لخادم تفريغ صوتي.
 */
export interface SpeechInput {
  supported: boolean;
  start(handlers: {
    onPartial?: (text: string) => void;
    onFinal: (text: string) => void;
    onError?: (code: string) => void;
    onEnd?: () => void;
  }): void;
  stop(): void;
}

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => Rec) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function createWebSpeechInput(lang = 'ar-SA'): SpeechInput {
  let rec: Rec | null = null;
  return {
    get supported() {
      return !!ctor();
    },
    start({ onPartial, onFinal, onError, onEnd }) {
      const C = ctor();
      if (!C) {
        onError?.('unsupported');
        onEnd?.();
        return;
      }
      rec = new C();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let finalText = '';
      let sent = false;
      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        onPartial?.((finalText + ' ' + interim).trim());
      };
      rec.onerror = (e: any) => onError?.(e?.error ?? 'error');
      rec.onend = () => {
        if (!sent && finalText.trim()) {
          sent = true;
          onFinal(finalText.trim());
        }
        onEnd?.();
        rec = null;
      };
      try {
        rec.start();
      } catch {
        onError?.('start-failed');
        onEnd?.();
      }
    },
    stop() {
      rec?.stop();
    },
  };
}

export const ERROR_TEXT: Record<string, string> = {
  unsupported: 'المتصفح ما يدعم التسجيل الصوتي، اكتب أو استخدم مايك الكيبورد',
  'not-allowed': 'اسمح للتطبيق باستخدام المايكروفون من الإعدادات',
  'no-speech': 'ما سمعت شيء، جرّب مرة ثانية',
  network: 'التحويل الصوتي يحتاج إنترنت',
  'audio-capture': 'ما لقيت مايكروفون',
};
