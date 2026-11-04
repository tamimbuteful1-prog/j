'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/categories';
import { dayLabel, num, timeAgo } from '@/lib/format';
import type { DailyTransaction, ExpenseCategory, UberEntry } from '@/lib/types';
import { CategoryIcon } from './icons';
import Sheet from './Sheet';
import AmountField from './AmountField';

export type Op = { kind: 'uber'; e: UberEntry } | { kind: 'tx'; e: DailyTransaction };

export function useOps(filter?: (op: Op) => boolean) {
  const data = useStore((s) => s.data);
  return useMemo(() => {
    const ops: Op[] = [
      ...data.uberEntries.map((e) => ({ kind: 'uber' as const, e })),
      ...data.dailyTransactions.map((e) => ({ kind: 'tx' as const, e })),
    ];
    return ops.filter((o) => !filter || filter(o)).sort((a, b) => b.e.date.localeCompare(a.e.date) || b.e.createdAt - a.e.createdAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
}

export function opTitle(op: Op) {
  if (op.kind === 'uber') return 'دخل أوبر';
  return op.e.category === 'other' && op.e.note ? op.e.note : CATEGORY_LABEL[op.e.category];
}

export default function TxList({ ops, limit, grouped, empty = 'ما فيه عمليات بعد' }: { ops: Op[]; limit?: number; grouped?: boolean; empty?: string }) {
  const [edit, setEdit] = useState<Op | null>(null);
  const list = limit ? ops.slice(0, limit) : ops;
  if (!list.length) return <div className="card px-5 py-8 text-center text-[16px] text-muted">{empty}</div>;

  const groups: [string, Op[]][] = [];
  for (const op of list) {
    const key = grouped ? op.e.date : '';
    const g = groups.find((x) => x[0] === key);
    if (g) g[1].push(op);
    else groups.push([key, [op]]);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {groups.map(([day, items]) => (
          <div key={day || 'all'}>
            {grouped && (
              <div className="mb-2 flex items-center justify-between px-1 text-[14px] text-muted">
                <span className="font-medium">{dayLabel(day)}</span>
                <span className="tnum">
                  {num(items.reduce((a, o) => a + (o.kind === 'uber' ? o.e.amount : -o.e.amount), 0))}
                </span>
              </div>
            )}
            <ul className="card divide-y divide-line/70 overflow-hidden">
              <AnimatePresence initial={false}>
                {items.map((op) => (
                  <motion.li key={op.e.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <button onClick={() => setEdit(op)} className="flex w-full items-center gap-3 px-4 py-3.5 text-start active:bg-cream-2/60">
                      <CategoryIcon c={op.kind === 'uber' ? 'uber' : op.e.category} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[17px] font-medium">{opTitle(op)}</div>
                        <div className="text-[13px] text-muted">{grouped ? timeAgo(op.e.createdAt) : `${dayLabel(op.e.date)} · ${timeAgo(op.e.createdAt)}`}</div>
                      </div>
                      <div className={`tnum text-[20px] font-bold ${op.kind === 'uber' ? 'text-mint-deep' : 'text-ink'}`}>
                        {op.kind === 'uber' ? '+' : '−'}
                        {num(op.e.amount)}
                      </div>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>
      <EditSheet op={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function EditSheet({ op, onClose }: { op: Op | null; onClose: () => void }) {
  return (
    <Sheet open={!!op} onClose={onClose} title={op ? `تعديل: ${opTitle(op)}` : ''}>
      {op && <EditForm key={op.e.id} op={op} onClose={onClose} />}
    </Sheet>
  );
}

function EditForm({ op, onClose }: { op: Op; onClose: () => void }) {
  const { updateUber, updateTx, removeUber, removeTx } = useStore();
  const [amount, setAmount] = useState(String(op.e.amount));
  const [cat, setCat] = useState<ExpenseCategory | null>(op.kind === 'tx' ? op.e.category : null);
  const save = () => {
    const v = Number(amount);
    if (!v) return;
    if (op.kind === 'uber') updateUber(op.e.id, { amount: v });
    else updateTx(op.e.id, { amount: v, category: cat ?? op.e.category });
    onClose();
  };
  return (
    <div className="flex flex-col gap-5 pt-2">
      <AmountField value={amount} onChange={setAmount} />
      {op.kind === 'tx' && (
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY_ORDER.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-2xl border py-3 text-[16px] font-medium ${cat === c ? 'border-transparent bg-ink text-white' : 'border-line bg-white text-ink-2'}`}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={save} className="h-14 flex-1 rounded-2xl bg-gradient-to-l from-mint-deep to-sky-deep text-[18px] font-semibold text-white shadow-lift">
          حفظ
        </button>
        <button
          onClick={() => {
            if (op.kind === 'uber') removeUber(op.e.id);
            else removeTx(op.e.id);
            onClose();
          }}
          aria-label="حذف"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-soft text-rose"
        >
          <Trash2 size={22} />
        </button>
      </div>
    </div>
  );
}
