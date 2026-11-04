'use client';
import { confirmAction } from '@/lib/nav';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Check, Plus, StickyNote } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Sheet from '@/components/Sheet';
import AmountField from '@/components/AmountField';
import { Ring, C } from '@/components/charts';
import { useStore, useSummary } from '@/lib/store';
import { isActive, remainingMonthsAt } from '@/lib/finance/engine';
import { KIND_LABEL } from '@/lib/categories';
import { localizeDigits, monthsLabel, num, pct } from '@/lib/format';
import { uid } from '@/lib/assistant/actions';
import { monthKey } from '@/lib/dates';
import type { FixedObligation, ObligationKind } from '@/lib/types';

const KIND_TONE: Record<ObligationKind, string> = {
  mortgage: '#5b6b8c',
  rent: '#2a78b8',
  loan: '#7a5cc2',
  service: '#11916f',
  temporary: '#e08a2a',
};

export default function ObligationsPage() {
  const s = useSummary();
  const data = useStore((st) => st.data);
  const togglePaid = useStore((st) => st.togglePaid);
  const [edit, setEdit] = useState<FixedObligation | null>(null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const m = s.month;
  const paid = data.obligationPayments[m] ?? [];
  const list = [...data.fixedObligations].sort((a, b) => Number(isActive(b, m)) - Number(isActive(a, m)) || b.amount - a.amount);
  const elec = data.variableExpenses.find((v) => v.reserve);

  return (
    <div>
      <PageHeader
        title="الالتزامات"
        subtitle={`${localizeDigits(String(list.filter((o) => isActive(o, m)).length))} التزام نشط`}
        action={
          <button
            aria-label="إضافة التزام"
            onClick={() => setEdit({ id: uid('o'), name: '', kind: 'loan', amount: 0, remainingMonths: 12, totalMonths: 12, asOf: m, dueDay: 27 })}
            className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white shadow-lift"
          >
            <Plus size={22} />
          </button>
        }
      />

      <section className="card mb-4 flex items-center gap-4 p-5">
        <Ring value={s.coverage} size={104} color={s.coverage >= 1 ? C.mint : C.sky}>
          <div>
            <div className="tnum text-[22px] font-bold">{pct(s.coverage)}</div>
            <div className="text-[11px] text-muted">تغطية</div>
          </div>
        </Ring>
        <div className="flex flex-1 flex-col gap-2 text-[15px]">
          <Row label="الالتزامات الثابتة" value={s.fixedObligations} />
          <Row label="الدخل الثابت" value={s.fixedIncome} onClick={() => setIncomeOpen(true)} />
          <Row label={s.fixedGap < 0 ? 'العجز الثابت' : 'الفائض الثابت'} value={Math.abs(s.fixedGap)} strong tone={s.fixedGap < 0 ? 'text-[#b5651d]' : 'text-mint-deep'} />
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-[14px] text-ink-2">المحجوز للالتزامات</div>
          <div className="tnum mt-1 text-[24px] font-bold">{num(s.reserved)}</div>
          <div className="text-[13px] text-muted">من {num(s.obligationsTotal)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[14px] text-ink-2">باقي يُغطّى من أوبر</div>
          <div className="tnum mt-1 text-[24px] font-bold">{num(s.deficitLeft)}</div>
          <div className="text-[13px] text-muted">من عجز {num(s.monthlyDeficit)}</div>
        </div>
      </section>

      <h2 className="mb-2 px-1 text-[19px] font-semibold">الثابتة</h2>
      <div className="flex flex-col gap-3">
        {list.map((o, i) => {
          const active = isActive(o, m);
          const rem = remainingMonthsAt(o, m);
          const isPaid = paid.includes(o.id);
          const progress = o.totalMonths && rem != null ? 1 - rem / o.totalMonths : null;
          return (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`card p-4 ${active ? '' : 'opacity-50'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => setEdit(o)} className="min-w-0 flex-1 text-start">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND_TONE[o.kind] }} />
                    <span className="truncate text-[17px] font-semibold">{o.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-muted">
                    <span>{KIND_LABEL[o.kind]}</span>
                    <span>{rem == null ? 'شهري مستمر' : active ? `باقي ${monthsLabel(rem)}` : 'انتهى'}</span>
                    <span>يوم {localizeDigits(String(o.dueDay))}</span>
                  </div>
                </button>
                <div className="text-end">
                  <div className="tnum text-[22px] font-bold leading-tight">{num(o.amount)}</div>
                  <div className="text-[12px] text-muted">ريال/شهر</div>
                </div>
              </div>
              {progress !== null && active && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-cream-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(2, progress * 100)}%`, background: KIND_TONE[o.kind] }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[12px] text-muted">
                    <span>المتبقي تقريبًا {num((rem ?? 0) * o.amount)} ريال</span>
                    <span>{pct(progress)} مسدد</span>
                  </div>
                </div>
              )}
              {o.note && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-soft px-3 py-2 text-[13px] text-ink-2">
                  <StickyNote size={15} className="text-amber" /> {o.note}
                </div>
              )}
              {active && (
                <button
                  onClick={() => togglePaid(o.id)}
                  className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium transition ${isPaid ? 'bg-mint-soft text-mint-deep' : 'border border-line bg-white text-ink-2'}`}
                >
                  {isPaid ? (
                    <>
                      <Check size={18} /> انسدد هالشهر
                    </>
                  ) : (
                    'تعليم كمسدد هالشهر'
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <h2 className="mb-2 mt-6 px-1 text-[19px] font-semibold">غير الثابتة</h2>
      <div className="flex flex-col gap-3">
        {elec && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-semibold">{elec.name}</span>
              <span className="tnum text-[20px] font-bold">
                {num(elec.min)}–{num(elec.max)}
              </span>
            </div>
            <div className="mt-1 text-[13px] text-muted">
              {s.billsPaid > 0 ? `سجلت هالشهر ${num(s.billsPaid)} ريال` : `محجوز تقديريًا ${num(s.billsReserve)} ريال ضمن العجز`}
            </div>
          </div>
        )}
        {data.variableExpenses
          .filter((v) => !v.reserve)
          .map((v) => {
            const spent = data.dailyTransactions
              .filter((t) => monthKey(t.date) === m && (v.category === 'groceries' ? ['groceries', 'home'].includes(t.category) : t.category === v.category))
              .reduce((a, t) => a + t.amount, 0);
            return (
              <div key={v.id} className="card flex items-center justify-between p-4">
                <div>
                  <div className="text-[17px] font-semibold">{v.name}</div>
                  <div className="text-[13px] text-muted">من المتاح للصرف</div>
                </div>
                <div className="text-end">
                  <div className="tnum text-[20px] font-bold">{num(spent)}</div>
                  <div className="text-[12px] text-muted">هالشهر</div>
                </div>
              </div>
            );
          })}
      </div>

      <ObligationSheet o={edit} onClose={() => setEdit(null)} />
      <IncomeSheet open={incomeOpen} onClose={() => setIncomeOpen(false)} />
    </div>
  );
}

function Row({ label, value, strong, tone, onClick }: { label: string; value: number; strong?: boolean; tone?: string; onClick?: () => void }) {
  const C2 = onClick ? 'button' : 'div';
  return (
    <C2 onClick={onClick} className="flex items-baseline justify-between text-start">
      <span className={`text-muted ${onClick ? 'underline decoration-dotted underline-offset-4' : ''}`}>{label}</span>
      <span className={`tnum ${strong ? 'text-[20px] font-bold' : 'font-semibold'} ${tone ?? ''}`}>{num(value)}</span>
    </C2>
  );
}

function ObligationSheet({ o, onClose }: { o: FixedObligation | null; onClose: () => void }) {
  return (
    <Sheet open={!!o} onClose={onClose} title={o?.name || 'التزام جديد'}>
      {o && <ObligationForm key={o.id} o={o} onClose={onClose} />}
    </Sheet>
  );
}

function ObligationForm({ o, onClose }: { o: FixedObligation; onClose: () => void }) {
  const { upsertObligation, removeObligation } = useStore();
  const exists = useStore((s) => s.data.fixedObligations.some((x) => x.id === o.id));
  const m = monthKey(new Date());
  const [name, setName] = useState(o.name);
  const [amount, setAmount] = useState(o.amount ? String(o.amount) : '');
  const [kind, setKind] = useState<ObligationKind>(o.kind);
  const [rem, setRem] = useState(o.remainingMonths == null ? '' : String(remainingMonthsAt(o, m)));
  const [due, setDue] = useState(String(o.dueDay));
  const [note, setNote] = useState(o.note ?? '');

  const save = () => {
    const a = Number(amount);
    if (!a || !name.trim()) return;
    const r = rem.trim() === '' ? null : Math.max(0, Math.round(Number(rem)));
    upsertObligation({
      ...o,
      name: name.trim(),
      amount: a,
      kind,
      remainingMonths: r,
      totalMonths: r == null ? null : Math.max(o.totalMonths ?? 0, r),
      asOf: m,
      dueDay: Math.min(31, Math.max(1, Number(due) || 1)),
      note: note.trim() || undefined,
    });
    onClose();
  };
  const input = 'card h-14 w-full px-4 text-[18px] outline-none';
  return (
    <div className="flex flex-col gap-4 pt-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className={input} aria-label="الاسم" />
      <AmountField value={amount} onChange={setAmount} label="المبلغ الشهري" />
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(KIND_LABEL) as ObligationKind[]).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`rounded-2xl border py-3 text-[14px] font-medium ${kind === k ? 'border-transparent bg-ink text-white' : 'border-line bg-white'}`}>
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[14px] text-ink-2">
          الأشهر المتبقية (فاضي = مستمر)
          <input inputMode="numeric" value={rem} onChange={(e) => setRem(e.target.value.replace(/\D/g, ''))} className={input + ' mt-1 tnum'} />
        </label>
        <label className="text-[14px] text-ink-2">
          يوم الاستحقاق
          <input inputMode="numeric" value={due} onChange={(e) => setDue(e.target.value.replace(/\D/g, ''))} className={input + ' mt-1 tnum'} />
        </label>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة (اختياري)" className={input} aria-label="ملاحظة" />
      <div className="flex gap-3">
        <button onClick={save} className="h-14 flex-1 rounded-2xl bg-gradient-to-l from-mint-deep to-sky-deep text-[18px] font-semibold text-white shadow-lift">
          حفظ
        </button>
        {exists && (
          <button
            onClick={() => {
              if (confirmAction('حذف هذا الالتزام؟')) {
                removeObligation(o.id);
                onClose();
              }
            }}
            className="h-14 rounded-2xl bg-rose-soft px-5 text-[16px] font-medium text-rose"
          >
            حذف
          </button>
        )}
      </div>
    </div>
  );
}

function IncomeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sources = useStore((s) => s.data.incomeSources);
  const updateIncome = useStore((s) => s.updateIncome);
  return (
    <Sheet open={open} onClose={onClose} title="الدخل الثابت">
      <div className="flex flex-col gap-3 pt-2">
        {sources.map((src) => (
          <label key={src.id} className="card flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[17px] font-medium">{src.name}</span>
            <input
              inputMode="numeric"
              defaultValue={src.amount}
              onBlur={(e) => {
                const v = Number(e.target.value.replace(/\D/g, ''));
                if (v >= 0 && v !== src.amount) updateIncome(src.id, v);
              }}
              className="tnum w-28 rounded-xl bg-cream-2 px-3 py-2 text-end text-[20px] font-bold outline-none"
            />
          </label>
        ))}
        <div className="flex justify-between px-1 pt-1 text-[16px] font-semibold">
          <span>المجموع</span>
          <span className="tnum">{num(sources.reduce((a, s) => a + s.amount, 0))} ريال</span>
        </div>
      </div>
    </Sheet>
  );
}
