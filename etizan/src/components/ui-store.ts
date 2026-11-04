'use client';
import { create } from 'zustand';

interface UI {
  assistantOpen: boolean;
  autoListen: boolean;
  settingsOpen: boolean;
  targetsOpen: boolean;
  setTargets(open: boolean): void;
  openAssistant(listen?: boolean): void;
  closeAssistant(): void;
  consumeAutoListen(): boolean;
  setSettings(open: boolean): void;
  toast: { id: number; text: string } | null;
  showToast(text: string): void;
}

export const useUI = create<UI>((set, get) => ({
  assistantOpen: false,
  autoListen: false,
  settingsOpen: false,
  targetsOpen: false,
  setTargets: (open) => set({ targetsOpen: open }),
  openAssistant: (listen = false) => set({ assistantOpen: true, autoListen: listen }),
  closeAssistant: () => set({ assistantOpen: false, autoListen: false }),
  consumeAutoListen: () => {
    const v = get().autoListen;
    if (v) set({ autoListen: false });
    return v;
  },
  setSettings: (open) => set({ settingsOpen: open }),
  toast: null,
  showToast: (text) => set({ toast: { id: Date.now(), text } }),
}));
