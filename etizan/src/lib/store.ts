'use client';
/**
 * مخزن الحالة. التخزين الآن في localStorage عبر persist.
 * للربط بقاعدة بيانات لاحقًا: استبدل `storage` بمحوّل يقرأ/يكتب AppData من API —
 * كل الإجراءات أدناه تنتج AppData كاملة جديدة، فالمزامنة سهلة.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useMemo, useState } from 'react';
import { createSeed } from './seed';
import { monthKey, todayISO } from './dates';
import { computeMonth } from './finance/engine';
import { runIntent, uid } from './assistant/actions';
import { ruleBasedBrain, type AssistantBrain } from './assistant/brain';
import type { AppData, AssistantMessage, DailyTransaction, ExpenseCategory, FixedObligation, MonthlySummary, Settings, UberEntry } from './types';
import { setDigits } from './format';

let brain: AssistantBrain = ruleBasedBrain;
export const setBrain = (b: AssistantBrain) => (brain = b);

interface Store {
  data: AppData;
  history: AppData[]; // للتراجع
  lastChangeAt: number;

  addUber(amount: number, date?: string): void;
  addExpense(amount: number, category: ExpenseCategory, note?: string, date?: string): void;
  updateUber(id: string, patch: Partial<UberEntry>): void;
  updateTx(id: string, patch: Partial<DailyTransaction>): void;
  removeUber(id: string): void;
  removeTx(id: string): void;
  undo(): boolean;
  togglePaid(obligationId: string): void;
  upsertObligation(o: FixedObligation): void;
  removeObligation(id: string): void;
  updateIncome(id: string, amount: number): void;
  updateSettings(patch: Partial<Settings>): void;
  ask(text: string, via?: 'voice' | 'text'): Promise<AssistantMessage>;
  clearChat(): void;
  reset(): void;
  replaceData(d: AppData): void;
}

const MAX_HISTORY = 15;

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const commit = (next: AppData) =>
        set((s) => ({ data: next, history: [...s.history, s.data].slice(-MAX_HISTORY), lastChangeAt: Date.now() }));
      const d = () => get().data;
      return {
        data: createSeed(monthKey(new Date())),
        history: [],
        lastChangeAt: 0,

        addUber: (amount, date = todayISO()) =>
          commit({ ...d(), uberEntries: [...d().uberEntries, { id: uid('u'), date, amount, createdAt: Date.now() }] }),
        addExpense: (amount, category, note, date = todayISO()) =>
          commit({ ...d(), dailyTransactions: [...d().dailyTransactions, { id: uid('t'), date, amount, category, note, createdAt: Date.now() }] }),
        updateUber: (id, patch) => commit({ ...d(), uberEntries: d().uberEntries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
        updateTx: (id, patch) => commit({ ...d(), dailyTransactions: d().dailyTransactions.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),
        removeUber: (id) => commit({ ...d(), uberEntries: d().uberEntries.filter((e) => e.id !== id) }),
        removeTx: (id) => commit({ ...d(), dailyTransactions: d().dailyTransactions.filter((e) => e.id !== id) }),
        undo: () => {
          const h = get().history;
          if (!h.length) return false;
          const prev = h[h.length - 1];
          // نحافظ على المحادثة كما هي
          set({ data: { ...prev, assistantMessages: d().assistantMessages }, history: h.slice(0, -1), lastChangeAt: Date.now() });
          return true;
        },
        togglePaid: (oid) => {
          const m = monthKey(new Date());
          const cur = d().obligationPayments[m] ?? [];
          const next = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
          commit({ ...d(), obligationPayments: { ...d().obligationPayments, [m]: next } });
        },
        upsertObligation: (o) => {
          const exists = d().fixedObligations.some((x) => x.id === o.id);
          commit({ ...d(), fixedObligations: exists ? d().fixedObligations.map((x) => (x.id === o.id ? o : x)) : [...d().fixedObligations, o] });
        },
        removeObligation: (id) => commit({ ...d(), fixedObligations: d().fixedObligations.filter((x) => x.id !== id) }),
        updateIncome: (id, amount) => commit({ ...d(), incomeSources: d().incomeSources.map((x) => (x.id === id ? { ...x, amount } : x)) }),
        updateSettings: (patch) => {
          if (patch.digits) setDigits(patch.digits);
          set((s) => ({ data: { ...s.data, settings: { ...s.data.settings, ...patch } } }));
        },

        ask: async (text, via = 'text') => {
          const now = Date.now();
          const userMsg: AssistantMessage = { id: uid('m'), role: 'user', text, createdAt: now, via };
          set((s) => ({ data: { ...s.data, assistantMessages: [...s.data.assistantMessages, userMsg].slice(-80) } }));
          const today = todayISO();
          const intent = await brain.understand(text, { data: d(), today });
          let replyText: string;
          let undoable = false;
          let suggestions: string[] | undefined;
          if (intent.type === 'undo') {
            const ok = get().undo();
            const s = computeMonth(d(), today);
            replyText = ok
              ? `هلا ${d().settings.name}، رجعت آخر عملية. المتاح الآن ${Math.round(s.available)} ريال`
              : `هلا ${d().settings.name}، ما فيه شيء أتراجع عنه`;
          } else {
            const r = runIntent(intent, d(), today, now);
            replyText = r.reply;
            suggestions = r.suggestions;
            if (r.changed) {
              commit(r.data);
              undoable = true;
            }
          }
          const msg: AssistantMessage = { id: uid('m'), role: 'assistant', text: replyText, createdAt: Date.now(), undoable, suggestions };
          set((s) => ({ data: { ...s.data, assistantMessages: [...s.data.assistantMessages, msg].slice(-80) } }));
          return msg;
        },
        clearChat: () => set((s) => ({ data: { ...s.data, assistantMessages: [] } })),
        reset: () => set({ data: createSeed(monthKey(new Date())), history: [], lastChangeAt: Date.now() }),
        replaceData: (next) => commit(next),
      };
    },
    {
      name: 'etizan:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data }),
      onRehydrateStorage: () => (state) => {
        if (state) setDigits(state.data.settings.digits);
      },
    },
  ),
);

/** هل اكتمل تحميل البيانات من التخزين المحلي */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    return useStore.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}

/** «اليوم» يتجدد كل دقيقة حتى يتحول الحساب تلقائيًا بعد منتصف الليل */
export function useToday() {
  const [t, setT] = useState(todayISO);
  useEffect(() => {
    const id = setInterval(() => setT(todayISO()), 60_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function useSummary(): MonthlySummary {
  const data = useStore((s) => s.data);
  const today = useToday();
  return useMemo(() => computeMonth(data, today), [data, today]);
}
