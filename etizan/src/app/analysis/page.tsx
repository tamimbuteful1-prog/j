'use client';
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { C, HBars, Ring, TrendLine } from '@/components/charts';
import { useStore, useSummary } from '@/lib/store';
import { localizeDigits, num, pct } from '@/lib/format';
import { CATEGORY_LABEL } from '@/lib/categories';
import type { AppData, MonthlySummary } from '@/lib/types';
import { monthKey } from '@/lib/dates';

function tips(s: MonthlySummary, data: AppData): string[] {
  const out: string[] = [];
  if (s.overspent > 0) out.push(`تجاوزت المتاح بـ ${num(s.overspent)} — خفف المصاريف يومين وترجع على الخطة.`);
  if (s.avgUberDaily < s.dailyGoalPlan) out.push(`معدل أوبر ${num(s.avgUberDaily)} أقل من الهدف ${num(s.dailyGoalPlan)} — يوم عمل إضافي بالأسبوع يسد الفرق.`);
  else out.push(`معدل أوبر ${num(s.avgUberDaily)} يغطي الهدف اليومي ${num(s.dailyGoalPlan)} ✓`);
  const fuel = data.dailyTransactions.filter((t) => t.category === 'fuel' && monthKey(t.date) === s.month).reduce((a, t) => a + t.amount, 0);
  if (s.uberMonth > 0 && fuel / s.uberMonth > 0.3) out.push(`البنزين ${pct(fuel / s.uberMonth)} من دخل أوبر — راقب المشاوير البعيدة.`);
  const temp = data.fixedObligations.filter((o) => o.kind === 'temporary' && (o.remainingMonths ?? 0) > 0);
  if (temp.length) out.push(`بعد انتهاء الالتزامات المؤقتة يخف عليك ${num(temp.reduce((a, o) => a + o.amount, 0))} ريال شهريًا.`);
  return out.slice(0, 3);
}

export default function AnalysisPage() {
  const s = useSummary();
  const data = useStore((st) => st.data);
  const totalIn = s.fixedIncome + s.uberMonth;
  const totalOut = s.obligationsTotal + s.spendMonth;
  const trend = s.days.map((d) => ({ label: localizeDigits(String(Number(d.date.slice(8)))), value: Math.round(d.walletEnd) }));
  const closedTrend = s.days.map((d) => ({ label: localizeDigits(String(Number(d.date.slice(8)))), value: Math.round(d.closedEnd) }));
  const byCat = Object.entries(
    data.dailyTransactions.filter((t) => monthKey(t.date) === s.month).reduce<Record<string, number>>((a, t) => ((a[t.category] = (a[t.category] ?? 0) + t.amount), a), {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="التحليل" subtitle={`حتى يوم ${localizeDigits(String(s.dayOfMonth))} من الشهر`} />

      <section className={`card flex items-center gap-4 p-5`}>
        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${s.forecast >= 0 ? 'bg-mint-soft text-mint-deep' : 'bg-amber-soft text-amber'}`}>
          {s.forecast >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
        </span>
        <div>
          <div className="text-[14px] text-muted">توقع نهاية الشهر بالمعدل الحالي</div>
          <div className="tnum text-[30px] font-bold leading-tight">
            {s.forecast >= 0 ? 'فائض' : 'عجز'} {num(Math.abs(s.forecast))} <span className="text-[15px] font-medium text-muted">ريال</span>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-[17px] font-semibold">الدخل مقابل المصروف — هالشهر</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-mint-soft p-3">
            <div className="text-[13px] text-ink-2">الدخل</div>
            <div className="tnum text-[24px] font-bold text-mint-deep">{num(totalIn)}</div>
          </div>
          <div className="rounded-2xl bg-sky-soft p-3">
            <div className="text-[13px] text-ink-2">الخارج</div>
            <div className="tnum text-[24px] font-bold text-sky-deep">{num(totalOut)}</div>
          </div>
        </div>
        <HBars
          rows={[
            { label: 'الدخل الثابت', value: s.fixedIncome, color: C.mint },
            { label: 'أوبر', value: s.uberMonth, color: '#46b892' },
            { label: 'الالتزامات والفواتير', value: s.obligationsTotal, color: C.sky },
            { label: 'المعيشة', value: s.spendMonth, color: C.amber },
          ]}
        />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card flex flex-col items-center gap-2 p-4">
          <Ring value={s.coverage} color={s.coverage >= 1 ? C.mint : C.sky}>
            <span className="tnum text-[20px] font-bold">{pct(s.coverage)}</span>
          </Ring>
          <div className="text-[14px] text-ink-2">تغطية الالتزامات</div>
        </div>
        <div className="card flex flex-col justify-center gap-1 p-4">
          <div className="text-[14px] text-muted">متوسط أوبر اليومي</div>
          <div className="tnum text-[30px] font-bold">{num(s.avgUberDaily)}</div>
          <div className="text-[13px] text-muted">الهدف {num(s.dailyGoalPlan)}</div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-[17px] font-semibold">المغطّى من عجز الشهر</h2>
        <p className="mb-2 text-[13px] text-muted">
          {num(s.closed)} من {num(s.monthlyDeficit)} ريال
        </p>
        <TrendLine points={closedTrend} color={C.mint} />
      </section>

      <section className="card p-4">
        <h2 className="text-[17px] font-semibold">اتجاه المتاح للصرف</h2>
        <p className="mb-2 text-[13px] text-muted">رصيد المتاح بنهاية كل يوم</p>
        <TrendLine points={trend} color={C.sky} />
      </section>

      {byCat.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-[17px] font-semibold">أكثر المصاريف</h2>
          <ul className="divide-y divide-line">
            {byCat.slice(0, 5).map(([c, v]) => (
              <li key={c} className="flex justify-between py-2.5 text-[16px]">
                <span>{CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL]}</span>
                <span className="tnum font-semibold">{num(v)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold">
          <Lightbulb size={19} className="text-amber" /> توصيات
        </h2>
        <ul className="flex flex-col gap-2.5">
          {tips(s, data).map((t) => (
            <li key={t} className="rounded-2xl bg-cream-2/70 px-4 py-3 text-[15px] leading-relaxed">
              {t}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
