'use client';
import { normalizeArabic } from '@/lib/assistant/normalize';

/** حقل مبلغ كبير بأرقام واضحة + أزرار سريعة */
export default function AmountField({
  value,
  onChange,
  quick,
  autoFocus,
  label = 'المبلغ',
}: {
  value: string;
  onChange: (v: string) => void;
  quick?: number[];
  autoFocus?: boolean;
  label?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[15px] font-medium text-ink-2">{label}</label>
      <div className="card flex items-baseline gap-2 px-5 py-3">
        <input
          inputMode="decimal"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(normalizeArabic(e.target.value).replace(/[^\d.]/g, ''))}
          placeholder="0"
          className="tnum w-full bg-transparent text-[44px] font-bold leading-tight outline-none placeholder:text-line"
          aria-label={label}
        />
        <span className="text-[17px] text-muted">ريال</span>
      </div>
      {quick && (
        <div className="mt-3 flex gap-2">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => onChange(String(q))} className="tnum flex-1 rounded-2xl border border-line bg-white py-3 text-[18px] font-semibold text-ink-2 active:scale-95 transition">
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
