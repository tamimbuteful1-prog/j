'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BarChart3, CalendarClock, CarFront, ChevronLeft, Landmark, Settings2, Target, Wallet } from 'lucide-react';
import GaugeHero, { type GaugeMode } from '@/components/gauge/GaugeHero';
import { Stat } from '@/components/Stat';
import { AssistantPanel } from '@/components/Assistant';
import TxList, { opTitle, useOps } from '@/components/TxList';
import { useUI } from '@/components/ui-store';
import { useStore, useSummary, useToday } from '@/lib/store';
import { upcomingObligations } from '@/lib/finance/engine';
import { dayLabel, longDate, num, timeAgo } from '@/lib/format';
import type { MonthlySummary } from '@/lib/types';

function statusLine(s: MonthlySummary): { text: string; tone: 'mint' | 'amber' | 'sky' } {
  if (s.overspent > 0) return { text: `تجاوزت المتاح بـ ${num(s.overspent)} ريال، خفّف الصرف اليوم`, tone: 'amber' };
  if (s.todayTarget > 0 && s.todayRemaining > 0)
    return s.todayUber > 0
      ? { text: `باقي ${num(s.todayRemaining)} ريال وتقفل اليوم`, tone: 'sky' }
      : { text: `هدفك اليوم ${num(s.todayTarget)} ريال من أوبر`, tone: 'sky' };
  if (s.todayTarget > 0) return { text: `قفلت اليوم ✓ والمتاح لك ${num(s.available)} ريال`, tone: 'mint' };
  return { text: s.isTodayWorkDay ? 'عجز الشهر مغطى ✓' : 'اليوم راحة، ما عليك تقفيل', tone: 'mint' };
}

const fade = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } });

export default function Home() {
  const s = useSummary();
  const today = useToday();
  const data = useStore((st) => st.data);
  const [mode, setMode] = useState<GaugeMode>('close');
  const setSettings = useUI((u) => u.setSettings);
  const ops = useOps();
  const up = upcomingObligations(data, today, 14);
  const nextUp = up[0];
  const st = statusLine(s);
  const last = ops[0];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between pt-[calc(16px+env(safe-area-inset-top))]">
        <div>
          <motion.h1 {...fade(0)} className="text-[28px] font-bold leading-tight">
            هلا {data.settings.name}
          </motion.h1>
          <p className="text-[15px] text-muted">{longDate(today)}</p>
        </div>
        <button onClick={() => setSettings(true)} aria-label="الإعدادات" className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-soft">
          <Settings2 size={22} />
        </button>
      </header>

      <motion.div {...fade(1)}>
        <GaugeHero summary={s} mode={mode} onMode={setMode} />
      </motion.div>

      <motion.div
        {...fade(2)}
        className={`rounded-[20px] px-4 py-3 text-center text-[17px] font-semibold ${
          st.tone === 'amber' ? 'bg-amber-soft text-[#9a5b12]' : st.tone === 'mint' ? 'bg-mint-soft text-mint-deep' : 'bg-sky-soft text-sky-deep'
        }`}
        role="status"
      >
        {st.text}
      </motion.div>

      <motion.div {...fade(3)} className="grid grid-cols-2 gap-3">
        <Stat
          label="المطلوب تقفيله اليوم"
          value={s.todayTarget}
          hint={s.todayTarget ? (s.todayRemaining ? `باقي ${num(s.todayRemaining)}` : 'قفلت ✓') : 'ما عليك اليوم'}
          progress={s.todayTarget ? s.todayUber / s.todayTarget : 1}
          tone="mint"
          icon={<Target size={19} />}
          href="/uber/"
        />
        <Stat
          label="المتاح للصرف"
          value={s.overspent ? 0 : s.available}
          hint={s.overspent ? `متجاوز ${num(s.overspent)}` : s.todaySpend ? `صرفت اليوم ${num(s.todaySpend)}` : 'ما صرفت اليوم'}
          tone={s.overspent ? 'amber' : 'sky'}
          icon={<Wallet size={19} />}
          href="/expenses/"
        />
        <Stat label="دخل أوبر اليوم" value={s.todayUber} hint={`الأسبوع ${num(s.uberWeek)}`} tone="mint" icon={<CarFront size={19} />} href="/uber/" />
        <Stat
          label="الالتزامات القادمة"
          value={nextUp ? nextUp.amount : '—'}
          hint={nextUp ? `${nextUp.name} · ${nextUp.inDays === 0 ? 'اليوم' : nextUp.inDays === 1 ? 'بكرة' : dayLabel(nextUp.date)}` : 'لا شيء قريب'}
          tone="ink"
          icon={<CalendarClock size={19} />}
          href="/obligations/"
        />
      </motion.div>

      <motion.div {...fade(4)}>
        <AssistantPanel />
      </motion.div>

      {last && (
        <motion.p {...fade(5)} className="px-1 text-[14px] text-muted">
          آخر تحديث: {last.kind === 'uber' ? 'دخل' : 'صرف'} {num(last.e.amount)} {opTitle(last)} · {timeAgo(last.e.createdAt)}
        </motion.p>
      )}

      <motion.section {...fade(6)}>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[19px] font-semibold">آخر العمليات</h2>
          <Link href="/expenses/" className="flex items-center text-[15px] font-medium text-sky-deep">
            الكل <ChevronLeft size={18} />
          </Link>
        </div>
        <TxList ops={ops} limit={5} empty="سجّل أول عملية بالمايك أو بالكتابة" />
      </motion.section>

      <motion.section {...fade(7)} className="grid grid-cols-4 gap-2" aria-label="وصول سريع">
        {[
          { href: '/obligations/', label: 'الالتزامات', Icon: Landmark, c: '#5b6b8c' },
          { href: '/expenses/', label: 'المصاريف', Icon: Wallet, c: '#2a78b8' },
          { href: '/uber/', label: 'أوبر', Icon: CarFront, c: '#11916f' },
          { href: '/analysis/', label: 'التحليل', Icon: BarChart3, c: '#b07a2a' },
        ].map(({ href, label, Icon, c }) => (
          <Link key={href} href={href} className="card flex flex-col items-center gap-2 px-1 py-4 active:scale-95 transition">
            <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: c + '1a', color: c }}>
              <Icon size={24} />
            </span>
            <span className="text-[14px] font-medium">{label}</span>
          </Link>
        ))}
      </motion.section>
    </div>
  );
}
