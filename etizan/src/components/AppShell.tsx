'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useHydrated, useStore } from '@/lib/store';
import BottomNav from './BottomNav';
import { AssistantSheet } from './Assistant';
import SettingsSheet from './SettingsSheet';
import TargetSheet from './TargetSheet';
import { useUI } from './ui-store';
import { createDemo } from '@/lib/demo';
import { todayISO } from '@/lib/dates';
import { SPA, useAppPath } from '@/lib/nav';
import Home from '@/app/page';
import UberPage from '@/app/uber/page';
import ExpensesPage from '@/app/expenses/page';
import ObligationsPage from '@/app/obligations/page';
import AnalysisPage from '@/app/analysis/page';

const SPA_PAGES: Record<string, () => React.ReactNode> = {
  '/': Home,
  '/uber/': UberPage,
  '/expenses/': ExpensesPage,
  '/obligations/': ObligationsPage,
  '/analysis/': AnalysisPage,
};

function Toast() {
  const toast = useUI((s) => s.toast);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => useUI.setState({ toast: null }), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(12px+env(safe-area-inset-top))] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="rounded-full bg-ink px-5 py-3 text-[16px] font-medium text-white shadow-lift">
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const path = useAppPath();
  const Page = SPA_PAGES[path] ?? Home;
  const [demo, setDemo] = useState(false);

  // نسخة المعاينة: أول فتح يبدأ ببيانات تجريبية واضحة
  useEffect(() => {
    if (!SPA || !hydrated) return;
    try {
      const flag = localStorage.getItem('etizan:demo');
      const empty = !useStore.getState().data.uberEntries.length && !useStore.getState().data.dailyTransactions.length;
      if (flag === null && empty) {
        useStore.getState().replaceData(createDemo(todayISO()));
        localStorage.setItem('etizan:demo', '1');
        setDemo(true);
      } else setDemo(flag === '1');
    } catch {}
  }, [hydrated]);

  useEffect(() => {
    if (!SPA && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __loadDemo: () => void }).__loadDemo = () => useStore.getState().replaceData(createDemo(todayISO()));
    }
  }, []);

  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-[560px] px-4 pb-[calc(120px+var(--safe-bottom))]">
        {demo && (
          <div className="mt-[calc(10px+env(safe-area-inset-top))] flex items-center gap-3 rounded-2xl bg-amber-soft px-4 py-2.5 text-[14px] text-ink-2">
            <span className="flex-1">هذه بيانات تجريبية للعرض</span>
            <button
              onClick={() => {
                useStore.getState().reset();
                try { localStorage.setItem('etizan:demo', '0'); } catch {}
                setDemo(false);
              }}
              className="rounded-full bg-white px-3 py-1.5 font-medium"
            >
              ابدأ ببياناتي
            </button>
          </div>
        )}
        {hydrated ? SPA ? <Page key={path} /> : children : <Loading />}
      </main>
      <BottomNav />
      <AssistantSheet />
      <SettingsSheet />
      <TargetSheet />
      <Toast />
    </>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-4 pt-16">
      <div className="mx-auto h-[220px] w-[220px] rounded-full skeleton" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] rounded-[24px] skeleton" />
        ))}
      </div>
    </div>
  );
}
