/**
 * التحكم اليدوي بالأهداف والأرقام — دوال نقية تُرجع AppData جديدة.
 */
import type { AppData, ISODate, UberEntry } from '../types';

/** هدف يدوي ليوم محدد. null = رجوع للتلقائي */
export function withDailyTarget(data: AppData, date: ISODate, amount: number | null): AppData {
  const next = { ...(data.dailyTargets ?? {}) };
  if (amount == null) delete next[date];
  else next[date] = Math.max(0, Math.round(amount));
  return { ...data, dailyTargets: next };
}

/** هدف يومي ثابت لكل أيام العمل. null = تلقائي */
export function withFixedDailyTarget(data: AppData, amount: number | null): AppData {
  return { ...data, settings: { ...data.settings, fixedDailyTarget: amount == null || amount <= 0 ? null : Math.round(amount) } };
}

/**
 * «دخلت حتى الآن X»: يضبط مجموع دخل أوبر لليوم على X.
 * الزيادة تُسجَّل كإدخال جديد، والنقص يُخصم من أحدث الإدخالات.
 */
export function withUberTotal(data: AppData, date: ISODate, total: number, newId: () => string, now = Date.now()): AppData {
  const target = Math.max(0, Math.round(total));
  const day = data.uberEntries.filter((e) => e.date === date);
  const current = day.reduce((a, e) => a + e.amount, 0);
  const diff = target - current;
  if (diff === 0) return data;
  if (diff > 0) {
    const e: UberEntry = { id: newId(), date, amount: diff, createdAt: now, note: 'تحديث المجموع' };
    return { ...data, uberEntries: [...data.uberEntries, e] };
  }
  let cut = -diff;
  const newest = [...day].sort((a, b) => b.createdAt - a.createdAt);
  const changes = new Map<string, number>();
  for (const e of newest) {
    if (cut <= 0) break;
    const take = Math.min(e.amount, cut);
    changes.set(e.id, e.amount - take);
    cut -= take;
  }
  return {
    ...data,
    uberEntries: data.uberEntries.flatMap((e) => {
      if (!changes.has(e.id)) return [e];
      const a = changes.get(e.id)!;
      return a > 0 ? [{ ...e, amount: a }] : [];
    }),
  };
}

export function uberTotalOn(data: AppData, date: ISODate) {
  return data.uberEntries.filter((e) => e.date === date).reduce((a, e) => a + e.amount, 0);
}
