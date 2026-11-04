'use client';
import dynamic from 'next/dynamic';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MonthlySummary } from '@/lib/types';
import { localizeDigits, num, pct } from '@/lib/format';
import type { GaugeVisual } from './Gauge3D';
import { useStore } from '@/lib/store';

const Gauge3D = dynamic(() => import('./Gauge3D'), { ssr: false, loading: () => null });

export type GaugeMode = 'close' | 'spend' | 'uber' | 'coverage' | 'month';

export const MODES: { id: GaugeMode; label: string }[] = [
  { id: 'close', label: 'تقفيل اليوم' },
  { id: 'spend', label: 'المتاح' },
  { id: 'uber', label: 'أوبر اليوم' },
  { id: 'coverage', label: 'التغطية' },
  { id: 'month', label: 'الشهر' },
];

const MINT: [string, string] = ['#ffb36b', '#ff6a00']; // برتقالي مؤكسد
const SKY: [string, string] = ['#f4dcae', '#cf9440']; // شمباني
const AMBER: [string, string] = ['#ff9a7a', '#d23a1e']; // تجاوز
const TEAL: [string, string] = ['#ffc994', '#d9702a']; // نحاسي

interface ModeView {
  label: string;
  value: number;
  isPct?: boolean;
  unit?: string;
  sub: string;
  progress: number;
  colors: [string, string];
  done?: boolean;
}

export function modeView(mode: GaugeMode, s: MonthlySummary): ModeView {
  switch (mode) {
    case 'close': {
      if (s.todayTarget === 0)
        return { label: 'تقفيل اليوم', value: 0, sub: s.isTodayWorkDay ? 'العجز مغطى' : 'اليوم راحة', progress: 1, colors: MINT, done: true };
      const done = s.todayRemaining === 0;
      return {
        label: done ? 'قفلت اليوم' : 'باقي تقفيله اليوم',
        value: s.todayRemaining,
        sub: `من ${num(s.todayTarget)} ريال`,
        progress: s.todayUber / s.todayTarget,
        colors: s.overspent > 0 ? AMBER : MINT,
        done,
      };
    }
    case 'spend':
      return s.overspent > 0
        ? { label: 'متجاوز', value: s.overspent, sub: 'ما عندك متاح الآن', progress: 0.04, colors: AMBER }
        : {
            label: 'المتاح للصرف',
            value: s.available,
            sub: s.todaySpend ? `صرفت اليوم ${num(s.todaySpend)}` : 'ما صرفت شيء اليوم',
            progress: s.available + s.todaySpend > 0 ? s.available / (s.available + s.todaySpend) : 0,
            colors: SKY,
          };
    case 'uber': {
      const ref = s.todayTarget || s.avgUberDaily || 1;
      return {
        label: 'دخل أوبر اليوم',
        value: s.todayUber,
        sub: s.todayTarget ? `الهدف ${num(s.todayTarget)}` : `المعدل ${num(s.avgUberDaily)}`,
        progress: s.todayUber / ref,
        colors: TEAL,
      };
    }
    case 'coverage':
      return {
        label: 'تغطية الالتزامات',
        value: Math.round(s.coverage * 100),
        isPct: true,
        sub: `${num(s.reserved)} من ${num(s.obligationsTotal)}`,
        progress: s.coverage,
        colors: s.coverage >= 1 ? MINT : SKY,
      };
    case 'month':
      return {
        label: 'غطيت من عجز الشهر',
        value: s.closed,
        sub: s.monthlyDeficit ? `من ${num(s.monthlyDeficit)} · يوم ${localizeDigits(String(s.dayOfMonth))}/${localizeDigits(String(s.daysInMonth))}` : 'ما فيه عجز',
        progress: s.monthlyDeficit ? s.closed / s.monthlyDeficit : 1,
        colors: MINT,
      };
  }
}

function AnimatedNumber({ value, isPct }: { value: number; isPct?: boolean }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => (isPct ? pct(v / 100) : num(v)));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** بديل CSS عند غياب WebGL */
function FallbackGauge({ progress, colors }: { progress: number; colors: [string, string] }) {
  const p = Math.max(0, Math.min(1, progress)) * 360;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div
        className="relative h-[250px] w-[250px] rounded-full"
        style={{
          background: 'linear-gradient(160deg,#e9ecee,#aeb4b9)',
          boxShadow: '0 30px 60px -25px rgba(20,60,45,.35), inset 0 -8px 20px rgba(0,0,0,.05), inset 0 6px 14px #fff',
        }}
      >
        <div
          className="absolute inset-[18px] rounded-full transition-all duration-700"
          style={{
            background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]} ${p}deg, #3a3f45 ${p}deg)`,
            WebkitMask: 'radial-gradient(circle, transparent 58%, #000 59%, #000 70%, transparent 71%)',
            mask: 'radial-gradient(circle, transparent 58%, #000 59%, #000 70%, transparent 71%)',
          }}
        />
        <div
          className="absolute inset-[52px] rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 30%, #4a5157, #1b1f22 60%, #0f1113)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.45)' }}
        />
      </div>
    </div>
  );
}

export default function GaugeHero({ summary, mode, onMode }: { summary: MonthlySummary; mode: GaugeMode; onMode: (m: GaugeMode) => void }) {
  const view = useMemo(() => modeView(mode, summary), [mode, summary]);
  const lastChangeAt = useStore((s) => s.lastChangeAt);
  const [gl, setGl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setGl(webglOK()), []);

  const visual: GaugeVisual = { progress: view.progress, colorA: view.colors[0], colorB: view.colors[1], pulseKey: lastChangeAt };
  const chips = useRef<HTMLDivElement>(null);

  return (
    <section aria-label="العداد" className="relative">
      <div className="relative mx-auto h-[330px] w-full max-w-[440px] select-none">
        {/* ظل أرضي ناعم */}
        <div
          aria-hidden
          className="absolute bottom-[14px] left-1/2 h-[46px] w-[72%] -translate-x-1/2 rounded-[50%]"
          style={{ background: 'radial-gradient(closest-side, rgba(25,70,55,.22), transparent)', filter: 'blur(6px)' }}
        />
        {/* هالة لونية */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{ background: `radial-gradient(closest-side, ${view.colors[0]}55, transparent)` }}
          transition={{ duration: 0.8 }}
        />
        {gl === false ? (
          <FallbackGauge progress={view.progress} colors={view.colors} />
        ) : gl ? (
          <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.94 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <Gauge3D visual={visual} onReady={() => setReady(true)} />
          </motion.div>
        ) : null}
        {!ready && gl !== false && <div className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#1b1f22]" />}

        {/* القراءة فوق اللؤلؤة */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="-mt-4 flex w-[150px] flex-col items-center text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode + view.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[13px] font-medium tracking-wide text-white/70"
              >
                {view.label}
              </motion.div>
            </AnimatePresence>
            <div className={`tnum mt-1 flex items-baseline gap-1 font-bold leading-none tracking-tight text-white ${num(view.value).length > 4 ? 'text-[38px]' : 'text-[48px]'}`}>
              {view.done && view.value === 0 ? <span className="text-[#ff8a3d]">✓</span> : <AnimatedNumber value={view.value} isPct={view.isPct} />}
              {!view.isPct && !(view.done && view.value === 0) && <span className="text-[13px] font-medium text-white/55">ريال</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-3 mb-3 text-center text-[14px] font-medium text-muted">{view.sub}</div>
      {/* أوضاع العداد */}
      <div ref={chips} role="tablist" aria-label="وضع العداد" className="no-scrollbar -mx-4 mt-1 flex gap-2 overflow-x-auto px-4 pb-1">
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={active}
              onClick={() => onMode(m.id)}
              className={`relative shrink-0 rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors ${active ? 'text-white' : 'bg-white/70 text-ink-2 border border-line'}`}
            >
              {active && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'linear-gradient(145deg, #30363b, #15181b)', boxShadow: '0 8px 20px -8px rgba(20,24,28,.7), inset 0 1px 0 rgba(255,255,255,.12)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{m.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
