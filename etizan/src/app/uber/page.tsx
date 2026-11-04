'use client';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Sheet from '@/components/Sheet';
import AmountField from '@/components/AmountField';
import TxList, { useOps } from '@/components/TxList';
import { DailyBars } from '@/components/charts';
import { useUI } from '@/components/ui-store';
import { useStore, useSummary, useToday } from '@/lib/store';
import { addDays, parseISODate } from '@/lib/dates';
import { localizeDigits, num } from '@/lib/format';

export default function UberPage() {
  const s = useSummary();
  const today = useToday();
  const entries = useStore((st) => st.data.uberEntries);
  const addUber = useStore((st) => st.addUber);
  const showToast = useUI((u) => u.showToast);
  const ops = useOps((o) => o.kind === 'uber');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const last14 = useMemo(() => {
    const by = new Map<string, number>();
    for (const e of entries) by.set(e.date, (by.get(e.date) ?? 0) + e.amount);
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, -13 + i);
      return { key: d, label: localizeDigits(String(parseISODate(d).getDate())), value: by.get(d) ?? 0 };
    });
  }, [entries, today]);

  const progress = s.todayTarget ? Math.min(1, s.todayUber / s.todayTarget) : 1;

  return (
    <div>
      <PageHeader title="أوبر" subtitle={s.isTodayWorkDay ? 'اليوم يوم عمل' : 'اليوم راحة'} />

      <section className="card relative overflow-hidden p-5">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-mint/15 blur-2xl" aria-hidden />
        <div className="text-[15px] text-ink-2">دخل اليوم</div>
        <div className="tnum mt-1 text-[52px] font-bold leading-none">
          {num(s.todayUber)} <span className="text-[18px] font-medium text-muted">ريال</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream-2">
          <div className="h-full rounded-full bg-gradient-to-l from-mint-deep to-mint transition-all duration-700" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[14px]">
          <span className="text-muted">الهدف {num(s.todayTarget)}</span>
          <span className="font-semibold text-mint-deep">{s.todayTarget ? (s.todayRemaining ? `باقي ${num(s.todayRemaining)}` : 'قفلت ✓') : '—'}</span>
        </div>
        <button onClick={() => setOpen(true)} className="mt-5 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-mint-deep to-sky-deep text-[19px] font-semibold text-white shadow-lift active:scale-[.98] transition">
          <Plus size={24} /> سجّل دخل أوبر
        </button>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-3">
        {[
          { l: 'هالأسبوع', v: s.uberWeek },
          { l: 'هالشهر', v: s.uberMonth },
          { l: 'المعدل اليومي', v: s.avgUberDaily },
        ].map((x) => (
          <div key={x.l} className="card p-3.5">
            <div className="text-[13px] text-muted">{x.l}</div>
            <div className="tnum mt-1 text-[22px] font-bold">{num(x.v)}</div>
          </div>
        ))}
      </section>

      <section className="card mt-3 p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[17px] font-semibold">آخر ١٤ يوم</h2>
          <span className="text-[13px] text-muted">الهدف التقريبي {num(s.dailyGoalPlan)} يوميًا</span>
        </div>
        <DailyBars data={last14} target={s.dailyGoalPlan} />
      </section>

      <section className="card mt-3 grid grid-cols-2 gap-3 p-4 text-[15px]">
        <div>
          <div className="text-muted">أيام عمل باقية</div>
          <div className="tnum text-[22px] font-bold">{localizeDigits(String(s.workDaysLeft))}</div>
        </div>
        <div>
          <div className="text-muted">باقي من عجز الشهر</div>
          <div className="tnum text-[22px] font-bold">{num(s.deficitLeft)}</div>
        </div>
      </section>

      <h2 className="mb-2 mt-6 px-1 text-[19px] font-semibold">السجل</h2>
      <TxList ops={ops} grouped empty="ما فيه دخل مسجل بعد" />

      <Sheet open={open} onClose={() => setOpen(false)} title="دخل أوبر">
        <div className="flex flex-col gap-5 pt-2">
          <AmountField value={amount} onChange={setAmount} quick={[100, 150, 200]} autoFocus />
          <button
            onClick={() => {
              const v = Number(amount);
              if (!v) return;
              addUber(v);
              setAmount('');
              setOpen(false);
              showToast(`تم تسجيل ${num(v)} ريال ✓`);
            }}
            className="h-16 rounded-2xl bg-gradient-to-l from-mint-deep to-sky-deep text-[19px] font-semibold text-white shadow-lift"
          >
            تسجيل
          </button>
        </div>
      </Sheet>
    </div>
  );
}
