'use client';
import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Sheet from '@/components/Sheet';
import AmountField from '@/components/AmountField';
import TxList, { useOps } from '@/components/TxList';
import { HBars } from '@/components/charts';
import { CategoryIcon } from '@/components/icons';
import { useUI } from '@/components/ui-store';
import { useStore, useSummary, useToday } from '@/lib/store';
import { CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_TONE } from '@/lib/categories';
import { weekStart } from '@/lib/dates';
import { num } from '@/lib/format';
import type { ExpenseCategory } from '@/lib/types';

type P = 'today' | 'week' | 'month';
const P_LABEL: Record<P, string> = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر' };

export default function ExpensesPage() {
  const s = useSummary();
  const today = useToday();
  const txs = useStore((st) => st.data.dailyTransactions);
  const addExpense = useStore((st) => st.addExpense);
  const showToast = useUI((u) => u.showToast);
  const [period, setPeriod] = useState<P>('today');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('fuel');
  const [note, setNote] = useState('');

  const from = period === 'today' ? today : period === 'week' ? weekStart(today) : `${s.month}-01`;
  const inP = useMemo(() => txs.filter((t) => t.date >= from && t.date <= today), [txs, from, today]);
  const total = inP.reduce((a, t) => a + t.amount, 0);
  const byCat = CATEGORY_ORDER.map((c) => ({ c, v: inP.filter((t) => t.category === c).reduce((a, t) => a + t.amount, 0) })).filter((x) => x.v > 0);
  const ops = useOps((o) => o.kind === 'tx');

  return (
    <div>
      <PageHeader title="المصاريف" />

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-cream-2 p-1" role="tablist">
        {(Object.keys(P_LABEL) as P[]).map((p) => (
          <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)} className={`rounded-xl py-2.5 text-[16px] font-medium transition ${period === p ? 'bg-white text-ink shadow-soft' : 'text-muted'}`}>
            {P_LABEL[p]}
          </button>
        ))}
      </div>

      <section className="card p-5">
        <div className="text-[15px] text-ink-2">مصاريف {P_LABEL[period]}</div>
        <div className="tnum mt-1 text-[52px] font-bold leading-none">
          {num(total)} <span className="text-[18px] font-medium text-muted">ريال</span>
        </div>
        <div className="mt-3 flex gap-4 text-[14px]">
          <span className="text-muted">
            المتاح الآن <b className={`tnum ${s.overspent ? 'text-[#b5651d]' : 'text-sky-deep'}`}>{s.overspent ? `متجاوز ${num(s.overspent)}` : num(s.available)}</b>
          </span>
        </div>
        <button onClick={() => setOpen(true)} className="mt-5 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[19px] font-semibold text-white shadow-lift active:scale-[.98] transition">
          <Plus size={24} /> سجّل مصروف
        </button>
      </section>

      {byCat.length > 0 && (
        <section className="card mt-3 p-4">
          <h2 className="mb-3 text-[17px] font-semibold">حسب التصنيف</h2>
          <HBars rows={byCat.map((x) => ({ label: CATEGORY_LABEL[x.c], value: x.v, color: CATEGORY_TONE[x.c], note: x.c === 'electricity' ? 'من الالتزامات' : undefined }))} />
        </section>
      )}

      <h2 className="mb-2 mt-6 px-1 text-[19px] font-semibold">السجل</h2>
      <TxList ops={ops} grouped empty="ما فيه مصاريف مسجلة" />

      <Sheet open={open} onClose={() => setOpen(false)} title="مصروف جديد">
        <div className="flex flex-col gap-5 pt-2">
          <AmountField value={amount} onChange={setAmount} autoFocus />
          <div className="grid grid-cols-3 gap-2">
            {CATEGORY_ORDER.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition ${cat === c ? 'border-ink bg-white shadow-soft' : 'border-line bg-white/60'}`}>
                <CategoryIcon c={c} />
                <span className="text-[15px] font-medium">{CATEGORY_LABEL[c]}</span>
              </button>
            ))}
          </div>
          {cat === 'other' && <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="وش هو؟ (اختياري)" className="card h-14 px-4 text-[17px] outline-none" />}
          <button
            onClick={() => {
              const v = Number(amount);
              if (!v) return;
              addExpense(v, cat, cat === 'other' ? note.trim() || undefined : undefined);
              setAmount('');
              setNote('');
              setOpen(false);
              showToast(`سجلت ${num(v)} ${CATEGORY_LABEL[cat]} ✓`);
            }}
            className="h-16 rounded-2xl bg-ink text-[19px] font-semibold text-white shadow-lift"
          >
            تسجيل
          </button>
        </div>
      </Sheet>
    </div>
  );
}
