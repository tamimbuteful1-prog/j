'use client';
import { AppLink as Link } from '@/lib/nav';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { BarChart3, CarFront, ChevronLeft, Landmark, Settings2, Wallet } from 'lucide-react';
import GaugeHero, { type GaugeMode } from '@/components/gauge/GaugeHero';
import { AssistantPanel } from '@/components/Assistant';
import TxList, { useOps } from '@/components/TxList';
import { useUI } from '@/components/ui-store';
import { useStore, useSummary, useToday } from '@/lib/store';
import { upcomingObligations } from '@/lib/finance/engine';
import { dayLabel, localizeDigits, longDate, num } from '@/lib/format';
import type { MonthlySummary } from '@/lib/types';

const CountingMachine3D = dynamic(() => import('@/components/three/CountingMachine3D'), { ssr: false });
const VaultLock3D = dynamic(() => import('@/components/three/VaultLock3D'), { ssr: false });
const FlipBoard3D = dynamic(() => import('@/components/three/FlipBoard3D'), { ssr: false });

function statusLine(s: MonthlySummary): { text: string; tone: 'ok' | 'warn' | 'info' } {
  if (s.overspent > 0) return { text: `تجاوزت المتاح بـ ${num(s.overspent)} ريال، خفّف الصرف اليوم`, tone: 'warn' };
  if (s.todayTarget > 0 && s.todayRemaining > 0)
    return s.todayUber > 0
      ? { text: `باقي ${num(s.todayRemaining)} ريال وتقفل اليوم`, tone: 'info' }
      : { text: `هدفك اليوم ${num(s.todayTarget)} ريال من أوبر`, tone: 'info' };
  if (s.todayTarget > 0) return { text: `قفلت اليوم ✓ والمتاح لك ${num(s.available)} ريال`, tone: 'ok' };
  return { text: s.isTodayWorkDay ? 'عجز الشهر مغطى ✓' : 'اليوم راحة، ما عليك تقفيل', tone: 'ok' };
}

const reveal = {
  initial: { opacity: 0.001, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

/** قسم واحد = فكرة واحدة + مجسم واحد */
function Scene({
  eyebrow,
  title,
  object,
  stats,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  object: React.ReactNode;
  stats: { label: string; value: string; accent?: boolean }[];
  action?: React.ReactNode;
}) {
  return (
    <motion.section {...reveal} className="flex flex-col">
      <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-orange" />
        {eyebrow}
      </div>
      <h2 className="mt-1.5 text-[26px] font-bold leading-snug text-balance">{title}</h2>
      <div className="relative -mx-4 mt-2 h-[270px]">
        <div aria-hidden className="absolute bottom-6 left-1/2 h-10 w-[60%] -translate-x-1/2 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(20,24,28,.22), transparent)', filter: 'blur(6px)' }} />
        {object}
      </div>
      <dl className="grid grid-cols-3 border-y border-line">
        {stats.map((x, i) => (
          <div key={x.label} className={`py-3.5 ${i ? 'border-s border-line ps-3' : 'pe-3'}`}>
            <dt className="text-[13px] text-muted">{x.label}</dt>
            <dd className={`tnum mt-0.5 text-[22px] font-bold leading-tight ${x.accent ? 'text-orange-deep' : ''}`}>{x.value}</dd>
          </div>
        ))}
      </dl>
      {action && <div className="mt-4">{action}</div>}
    </motion.section>
  );
}

const METRICS = (s: MonthlySummary) => [
  { label: 'غطيت من عجز الشهر', value: s.closed, sub: `من ${num(s.monthlyDeficit)}` },
  { label: 'دخل أوبر هالشهر', value: s.uberMonth, sub: `المعدل ${num(s.avgUberDaily)} يوميًا` },
  { label: s.forecast >= 0 ? 'فائض متوقع آخر الشهر' : 'عجز متوقع آخر الشهر', value: Math.abs(s.forecast), sub: 'بالمعدل الحالي' },
];

export default function Home() {
  const s = useSummary();
  const today = useToday();
  const data = useStore((st) => st.data);
  const [mode, setMode] = useState<GaugeMode>('spend');
  const setSettings = useUI((u) => u.setSettings);
  const ops = useOps();
  const up = upcomingObligations(data, today, 14).slice(0, 3);
  const st = statusLine(s);
  const metrics = METRICS(s);
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMi((i) => (i + 1) % 3), 5200);
    return () => clearInterval(id);
  }, []);
  const m = metrics[mi];
  const closeProgress = s.todayTarget ? s.todayUber / s.todayTarget : 1;

  return (
    <div className="flex flex-col gap-14">
      {/* البطل */}
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between pt-[calc(16px+env(safe-area-inset-top))]">
          <div>
            <h1 className="text-[28px] font-bold leading-tight">هلا {data.settings.name}</h1>
            <p className="text-[15px] text-muted">{longDate(today)}</p>
          </div>
          <button onClick={() => setSettings(true)} aria-label="الإعدادات" className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-soft">
            <Settings2 size={22} />
          </button>
        </header>
        <GaugeHero summary={s} mode={mode} onMode={setMode} />
        <div
          role="status"
          className={`flex items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-center text-[17px] font-semibold ${
            st.tone === 'warn' ? 'bg-orange-soft text-orange-deep' : 'bg-white/80 text-ink border border-line'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${st.tone === 'ok' ? 'bg-mint' : 'bg-orange'}`} />
          {st.text}
        </div>
        <AssistantPanel />
      </div>

      {/* دخل اليوم */}
      <Scene
        eyebrow="دخل اليوم"
        title={s.todayUber > 0 ? <>دخلت اليوم <span className="tnum">{num(s.todayUber)}</span> ريال</> : 'ما سجّلت دخل اليوم بعد'}
        object={<CountingMachine3D amount={s.todayUber} />}
        stats={[
          { label: 'دخل اليوم', value: num(s.todayUber) },
          { label: 'هدف اليوم', value: num(s.todayTarget) },
          { label: 'المتبقي', value: num(s.todayRemaining), accent: s.todayRemaining > 0 },
        ]}
        action={
          <Link href="/uber/" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-[17px] font-semibold text-white shadow-lift">
            <CarFront size={20} /> سجّل دخل أوبر
          </Link>
        }
      />

      {/* إقفال اليوم */}
      <Scene
        eyebrow="إقفال اليوم"
        title={
          s.todayTarget === 0 ? (
            s.isTodayWorkDay ? 'ما عليك تقفيل اليوم' : 'اليوم راحة'
          ) : s.todayRemaining > 0 ? (
            <>باقي <span className="tnum text-orange-deep">{num(s.todayRemaining)}</span> ريال وتقفل اليوم</>
          ) : (
            'قفلت اليوم ✓'
          )
        }
        object={<VaultLock3D progress={closeProgress} />}
        stats={[
          { label: 'المطلوب', value: num(s.todayTarget) },
          { label: 'أُقفل', value: `${localizeDigits(String(Math.round(Math.min(1, closeProgress) * 100)))}٪` },
          { label: 'أيام عمل باقية', value: localizeDigits(String(s.workDaysLeft)) },
        ]}
      />

      {/* النتائج */}
      <Scene
        eyebrow="نتائج الشهر"
        title={
          <AnimatePresence mode="wait">
            <motion.span key={m.label} className="block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              {m.label}
              <span className="block text-[15px] font-medium text-muted">{m.sub}</span>
            </motion.span>
          </AnimatePresence>
        }
        object={<FlipBoard3D text={String(Math.round(m.value))} />}
        stats={metrics.map((x, i) => ({ label: ['المغطّى', 'أوبر الشهر', s.forecast >= 0 ? 'فائض متوقع' : 'عجز متوقع'][i], value: num(x.value), accent: i === mi }))}
        action={
          <Link href="/analysis/" className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-[17px] font-semibold">
            <BarChart3 size={20} /> التحليل الكامل
          </Link>
        }
      />

      {/* الالتزامات القادمة */}
      <motion.section {...reveal}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[19px] font-semibold">الالتزامات القادمة</h2>
          <Link href="/obligations/" className="flex items-center text-[15px] font-medium text-ink-2">
            الكل <ChevronLeft size={18} />
          </Link>
        </div>
        <ul className="card divide-y divide-line/70">
          {up.length === 0 && <li className="px-5 py-5 text-[16px] text-muted">ما عليك التزامات خلال أسبوعين ✓</li>}
          {up.map((u) => (
            <li key={u.id + u.date} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-[17px] font-medium">{u.name}</div>
                <div className="text-[13px] text-muted">{u.inDays === 0 ? 'اليوم' : u.inDays === 1 ? 'بكرة' : dayLabel(u.date)}</div>
              </div>
              <div className="tnum text-[20px] font-bold">{num(u.amount)}</div>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* آخر العمليات */}
      <motion.section {...reveal}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[19px] font-semibold">آخر العمليات</h2>
          <Link href="/expenses/" className="flex items-center text-[15px] font-medium text-ink-2">
            الكل <ChevronLeft size={18} />
          </Link>
        </div>
        <TxList ops={ops} limit={3} empty="سجّل أول عملية بالمايك أو بالكتابة" />
      </motion.section>

      <section className="grid grid-cols-4 gap-2" aria-label="وصول سريع">
        {[
          { href: '/obligations/', label: 'الالتزامات', Icon: Landmark },
          { href: '/expenses/', label: 'المصاريف', Icon: Wallet },
          { href: '/uber/', label: 'أوبر', Icon: CarFront },
          { href: '/analysis/', label: 'التحليل', Icon: BarChart3 },
        ].map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="card flex flex-col items-center gap-2 px-1 py-4 transition active:scale-95">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-[#3a4046] to-[#1c2024] text-white shadow-soft">
              <Icon size={22} />
            </span>
            <span className="text-[14px] font-medium">{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
