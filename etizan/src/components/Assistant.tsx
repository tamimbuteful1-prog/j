'use client';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Mic, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { speak } from '@/lib/speech/tts';
import { timeAgo } from '@/lib/format';
import { useUI } from './ui-store';
import { useVoice } from './useVoice';
import Sheet from './Sheet';

const SUGGESTIONS = ['كم باقي علي اليوم؟', 'كم المتاح لي؟', 'وش وضعي؟', 'التزاماتي القادمة'];

/** إرسال نص للمساعد + قراءة الرد صوتيًا عند الحاجة */
export function useAsk() {
  const ask = useStore((s) => s.ask);
  const speakOn = useStore((s) => s.data.settings.speakReplies);
  const [busy, setBusy] = useState(false);
  return {
    busy,
    send: async (text: string, via: 'voice' | 'text' = 'text') => {
      const t = text.trim();
      if (!t) return;
      setBusy(true);
      try {
        const msg = await ask(t, via);
        if (via === 'voice' && speakOn) speak(msg.text);
        return msg;
      } finally {
        setBusy(false);
      }
    },
  };
}

/** زر المايك الدائري الكبير */
export function MicOrb({ listening, onClick, size = 72 }: { listening: boolean; onClick: () => void; size?: number }) {
  return (
    <button
      onClick={onClick}
      aria-label={listening ? 'إيقاف التسجيل' : 'تكلم مع المساعد'}
      className="relative grid place-items-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: listening ? 'linear-gradient(145deg,#ff9a4d,#e2560a)' : 'radial-gradient(circle at 35% 25%,#5a6168 0%,#2a2f34 45%,#111416 100%)',
        boxShadow: listening
          ? '0 14px 30px -10px rgba(226,86,10,.65), inset 0 2px 6px rgba(255,255,255,.4)'
          : '0 14px 30px -10px rgba(10,12,14,.65), 0 0 0 3px rgba(242,112,30,.9), inset 0 2px 4px rgba(255,255,255,.25), inset 0 -6px 12px rgba(0,0,0,.4)',
      }}
    >
      {listening && (
        <>
          <span className="pulse-ring absolute inset-0 rounded-full bg-orange/40" />
          <span className="pulse-ring absolute inset-0 rounded-full bg-orange/30 [animation-delay:.5s]" />
        </>
      )}
      <span className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/25 to-transparent" />
      {listening ? <Square size={size * 0.34} fill="currentColor" className="relative" /> : <Mic size={size * 0.42} strokeWidth={2.2} className="relative" />}
    </button>
  );
}

function Bubble({ role, text, ts, undoable, onUndo, suggestions, onSuggest }: {
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  undoable?: boolean;
  onUndo?: () => void;
  suggestions?: string[];
  onSuggest?: (s: string) => void;
}) {
  const me = role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${me ? 'items-start' : 'items-end'}`}>
      <div
        className={`max-w-[88%] rounded-[22px] px-4 py-3 text-[17px] leading-relaxed ${
          me ? 'rounded-ss-md bg-white text-ink shadow-soft' : 'rounded-se-md bg-[#f0eee9] border-s-[3px] border-orange text-ink'
        }`}
      >
        {text}
      </div>
      <div className="mt-1 flex items-center gap-3 px-2 text-[12px] text-muted">
        <span>{timeAgo(ts)}</span>
        {undoable && onUndo && (
          <button onClick={onUndo} className="flex items-center gap-1 font-medium text-sky-deep">
            <RotateCcw size={13} /> تراجع
          </button>
        )}
      </div>
      {suggestions && onSuggest && (
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onSuggest(s)} className="rounded-full border border-line bg-white px-3 py-2 text-[14px] text-ink-2">
              {s}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** المحادثة الكاملة (Sheet) — تفتح من زر المايك في الشريط السفلي */
export function AssistantSheet() {
  const { assistantOpen, closeAssistant, consumeAutoListen } = useUI();
  const messages = useStore((s) => s.data.assistantMessages);
  const speakOn = useStore((s) => s.data.settings.speakReplies);
  const updateSettings = useStore((s) => s.updateSettings);
  const undo = useStore((s) => s.undo);
  const { send, busy } = useAsk();
  const voice = useVoice((t) => send(t, 'voice'));
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantOpen && consumeAutoListen()) voice.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantOpen]);
  useEffect(() => {
    const id = setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), assistantOpen ? 380 : 0);
    return () => clearTimeout(id);
  }, [messages.length, voice.partial, assistantOpen]);
  useEffect(() => {
    if (!assistantOpen) voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantOpen]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <Sheet open={assistantOpen} onClose={closeAssistant} title="المساعد" tall>
      <div className="flex h-full flex-col">
        <div className="flex justify-end">
          <button onClick={() => updateSettings({ speakReplies: !speakOn })} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] text-ink-2 shadow-soft">
            {speakOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            {speakOn ? 'الرد بالصوت' : 'الصوت مطفأ'}
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 py-3">
          {messages.length === 0 && (
            <div className="py-6 text-center text-[16px] text-muted">
              اضغط المايك وتكلم، مثل:
              <div className="mt-2 font-medium text-ink-2">«دفعت 120 بنزين» · «دخلت 150 من أوبر»</div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble
              key={m.id}
              role={m.role}
              text={m.text}
              ts={m.createdAt}
              undoable={m.undoable && m.id === lastAssistant?.id}
              onUndo={() => {
                undo();
                useStore.setState((s) => ({ data: { ...s.data, assistantMessages: s.data.assistantMessages.map((x) => (x.id === m.id ? { ...x, undoable: false, text: x.text + ' (تم التراجع)' } : x)) } }));
              }}
              suggestions={m.id === lastAssistant?.id ? m.suggestions : undefined}
              onSuggest={(s) => send(s)}
            />
          ))}
          {(voice.partial || busy) && (
            <div className="flex justify-start">
              <div className="rounded-[22px] bg-white/70 px-4 py-3 text-[17px] text-muted">{voice.partial || '…'}</div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-cream via-cream to-cream/0 px-5 pb-1 pt-4">
          {voice.error && <div className="mb-2 rounded-2xl bg-amber-soft px-4 py-2 text-[14px] text-ink-2">{voice.error}</div>}
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line bg-white px-3.5 py-2 text-[14px] text-ink-2">
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <form
              className="card flex flex-1 items-center gap-2 py-1.5 ps-4 pe-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
                setText('');
              }}
            >
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب هنا…" className="h-11 w-full bg-transparent text-[17px] outline-none" enterKeyHint="send" />
              <button type="submit" aria-label="إرسال" disabled={!text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white disabled:opacity-30">
                <ArrowUp size={22} />
              </button>
            </form>
            <MicOrb listening={voice.listening} onClick={voice.toggle} size={64} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** لوحة المساعد في الصفحة الرئيسية: كتابة سريعة + آخر رد */
export function AssistantPanel() {
  const messages = useStore((s) => s.data.assistantMessages);
  const openAssistant = useUI((s) => s.openAssistant);
  const { send, busy } = useAsk();
  const [text, setText] = useState('');
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');

  return (
    <section className="card overflow-hidden p-4" aria-label="المساعد">
      <AnimatePresence mode="wait">
        {last ? (
          <motion.button
            key={last.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => openAssistant(false)}
            className="mb-3 block w-full rounded-[20px] bg-[#f0eee9] border-s-[3px] border-orange px-4 py-3 text-start"
          >
            {lastUser && <div className="mb-1 truncate text-[13px] text-muted">«{lastUser.text}»</div>}
            <div className="text-[17px] font-medium leading-relaxed text-ink">{last.text}</div>
          </motion.button>
        ) : (
          <motion.div key="hint" className="mb-3 px-1 text-[15px] text-muted">
            قل أو اكتب: <span className="font-medium text-ink-2">«دفعت 120 بنزين»</span> أو <span className="font-medium text-ink-2">«كم باقي علي؟»</span>
          </motion.div>
        )}
      </AnimatePresence>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
          setText('');
        }}
      >
        <div className="flex flex-1 items-center rounded-full border border-line bg-cream/70 ps-4 pe-1.5">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب للمساعد…" className="h-12 w-full bg-transparent text-[17px] outline-none" enterKeyHint="send" aria-label="رسالة للمساعد" />
          <button type="submit" aria-label="إرسال" disabled={!text.trim() || busy} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition disabled:opacity-25">
            <ArrowUp size={20} />
          </button>
        </div>
      </form>
    </section>
  );
}
