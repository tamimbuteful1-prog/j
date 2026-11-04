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

const MINT: [string, string] = ['#62d9b5', '#0b9470'];
const SKY: [string, string] = ['#86c6f2', '#1f6fb8'];
const AMBER: [string, string] = ['#f5c36e', '#d9761c'];
const TEAL: [string, string] = ['#7fdfd0', '#16889a'];

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
          background: '#fbfaf6',
          boxShadow: '0 30px 60px -25px rgba(20,60,45,.35), inset 0 -8px 20px rgba(0,0,0,.05), inset 0 6px 14px #fff',
        }}
      >
        <div
          className="absolute inset-[18px] rounded-full transition-all duration-700"
          style={{
            background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]} ${p}deg, #e7ebe8 ${p}deg)`,
            WebkitMask: 'radial-gradient(circle, transparent 58%, #000 59%, #000 70%, transparent 71%)',
            mask: 'radial-gradient(circle, transparent 58%, #000 59%, #000 70%, transparent 71%)',
          }}
        />
        <div
          className="absolute inset-[52px] rounded-full"
          style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #f1f4f2 60%, #e2e9e5)', boxShadow: '0 14px 30px -12px rgba(0,0,0,.25)' }}
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
        {!ready && gl !== false && <div className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full skeleton" />}

        {/* القراءة فوق اللؤلؤة */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex w-[170px] flex-col items-center text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode + view.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[14px] font-medium text-ink-2"
              >
                {view.label}
              </motion.div>
            </AnimatePresence>
            <div className={`tnum font-bold leading-none tracking-tight text-ink ${num(view.value).length > 4 ? 'text-[44px]' : 'text-[54px]'} mt-1`}>
              {view.done && view.value === 0 ? <span className="text-mint-deep">✓</span> : <AnimatedNumber value={view.value} isPct={view.isPct} />}
            </div>
            {!view.isPct && !(view.done && view.value === 0) && <div className="text-[13px] font-medium text-muted -mt-0.5">ريال</div>}
            <div className="mt-1 text-[13px] text-muted">{view.sub}</div>
          </div>
        </div>
      </div>

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
                  style={{ background: 'linear-gradient(135deg, #1aa985, #2a86c9)', boxShadow: '0 8px 20px -8px rgba(26,140,120,.6)' }}
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
