'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useHydrated, useStore } from '@/lib/store';
import BottomNav from './BottomNav';
import { AssistantSheet } from './Assistant';
import SettingsSheet from './SettingsSheet';
import { useUI } from './ui-store';
import { createDemo } from '@/lib/demo';
import { todayISO } from '@/lib/dates';

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

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __loadDemo: () => void }).__loadDemo = () => useStore.getState().replaceData(createDemo(todayISO()));
    }
  }, []);

  return (
    <>
      <main className="mx-auto min-h-dvh w-full max-w-[560px] px-4 pb-[calc(120px+var(--safe-bottom))]">
        {hydrated ? children : <Loading />}
      </main>
      <BottomNav />
      <AssistantSheet />
      <SettingsSheet />
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
