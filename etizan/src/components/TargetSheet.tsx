'use client';
/**
 * التحكم اليدوي: هدف اليوم (أو هدف يومي ثابت) + «دخلت حتى الآن».
 * المعاينة تُحسب بنفس المحرك قبل الحفظ، وبعد الحفظ تتحرك العدادات والمجسمات تلقائيًا.
 */
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import Sheet from './Sheet';
import AmountField from './AmountField';
import { useUI } from './ui-store';
import { useStore, useToday } from '@/lib/store';
import { computeMonth } from '@/lib/finance/engine';
import { uberTotalOn, withDailyTarget, withFixedDailyTarget, withUberTotal } from '@/lib/finance/manual';
import { uid } from '@/lib/assistant/actions';
import { num } from '@/lib/format';

type Scope = 'auto' | 'today' | 'daily';

export default function TargetSheet() {
  const { targetsOpen, setTargets, showToast } = useUI();
  return (
    <Sheet open={targetsOpen} onClose={() => setTargets(false)} title="أهداف اليوم">
      {targetsOpen && <Form onDone={(msg) => { setTargets(false); showToast(msg); }} />}
    </Sheet>
  );
}

function Form({ onDone }: { onDone: (msg: string) => void }) {
  const data = useStore((s) => s.data);
  const replaceData = useStore((s) => s.replaceData);
  const today = useToday();
  const now = useMemo(() => computeMonth(data, today), [data, today]);

  const initialScope: Scope = data.dailyTargets?.[today] !== undefined ? 'today' : data.settings.fixedDailyTarget ? 'daily' : 'auto';
  const [scope, setScope] = useState<Scope>(initialScope);
  const [target, setTarget] = useState(String(initialScope === 'auto' ? now.autoTarget : now.todayTarget));
  const [total, setTotal] = useState(String(uberTotalOn(data, today)));

  useEffect(() => {
    if (scope === 'auto') setTarget(String(now.autoTarget));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const draft = useMemo(() => {
    let d = data;
    const t = Number(target);
    // تنظيف ثم تطبيق الاختيار
    d = withDailyTarget(d, today, null);
    if (scope === 'today') d = withDailyTarget(d, today, Number.isFinite(t) ? t : 0);
    if (scope === 'daily') d = withFixedDailyTarget(d, t > 0 ? t : null);
    else if (data.settings.fixedDailyTarget && scope === 'auto') d = withFixedDailyTarget(d, null);
    const u = Number(total);
    if (Number.isFinite(u) && total !== '') d = withUberTotal(d, today, u, () => uid('u'));
    return d;
  }, [data, target, total, scope, today]);
  const preview = useMemo(() => computeMonth(draft, today), [draft, today]);
  const p = preview.todayTarget ? Math.min(1, preview.todayUber / preview.todayTarget) : 1;

  const scopes: { id: Scope; label: string }[] = [
    { id: 'auto', label: 'تلقائي' },
    { id: 'today', label: 'لليوم فقط' },
    { id: 'daily', label: 'كل يوم' },
  ];

  return (
    <div className="flex flex-col gap-6 pt-2">
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-cream-2 p-1" role="tablist" aria-label="نوع الهدف">
          {scopes.map((x) => (
            <button key={x.id} role="tab" aria-selected={scope === x.id} onClick={() => setScope(x.id)} className={`rounded-xl py-2.5 text-[15px] font-medium transition ${scope === x.id ? 'bg-white text-ink shadow-soft' : 'text-muted'}`}>
              {x.label}
            </button>
          ))}
        </div>
        {scope === 'auto' ? (
          <div className="card px-5 py-4">
            <div className="text-[14px] text-muted">الهدف المحسوب من عجز الشهر</div>
            <div className="tnum text-[36px] font-bold">
              {num(now.autoTarget)} <span className="text-[16px] font-medium text-muted">ريال</span>
            </div>
          </div>
        ) : (
          <AmountField label={scope === 'today' ? 'كم تحتاج تقفل اليوم؟' : 'الهدف اليومي لكل أيام العمل'} value={target} onChange={setTarget} quick={[100, 150, 200]} />
        )}
        {scope !== 'auto' && <p className="px-1 text-[13px] text-muted">التلقائي لليوم {num(now.autoTarget)} ريال. الفرق يتوزع على باقي أيام الشهر.</p>}
      </section>

      <AmountField label="كم دخلت من أوبر حتى الآن؟" value={total} onChange={setTotal} />

      {/* معاينة فورية بنفس المحرك */}
      <div className="rounded-[20px] bg-[#1b1f22] p-4 text-white">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] text-white/60">بعد الحفظ</span>
          <span className="tnum text-[14px] text-white/60">
            {num(preview.todayUber)} / {num(preview.todayTarget)}
          </span>
        </div>
        <div className="mt-1 text-[22px] font-bold">
          {preview.todayTarget === 0 ? 'ما عليك تقفيل اليوم' : preview.todayRemaining > 0 ? `باقي ${num(preview.todayRemaining)} ريال وتقفل` : 'تقفل اليوم ✓'}
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-l from-[#ff6a00] to-[#ffb36b]" animate={{ width: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        </div>
        <div className="mt-2 text-[13px] text-white/60">المتاح للصرف بعدها {num(preview.available)} ريال</div>
      </div>

      <button
        onClick={() => {
          replaceData(draft);
          onDone(preview.todayRemaining > 0 ? `باقي ${num(preview.todayRemaining)} وتقفل` : 'تم ✓');
        }}
        className="h-16 rounded-2xl bg-ink text-[19px] font-semibold text-white shadow-lift"
      >
        حفظ
      </button>
    </div>
  );
}
