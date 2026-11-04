import { addDays, monthKey } from './dates';
import { createSeed } from './seed';
import type { AppData, ExpenseCategory, ISODate } from './types';

/** بيانات تجريبية للعرض فقط — من بداية الشهر حتى اليوم */
export function createDemo(today: ISODate): AppData {
  const d = createSeed(monthKey(today));
  const start = `${monthKey(today)}-01`;
  let rnd = 7;
  const r = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  let t = start;
  while (t <= today) {
    const wd = new Date(t + 'T12:00:00').getDay();
    if (d.settings.workDays.includes(wd) && t !== today) {
      d.uberEntries.push({ id: 'du' + t, date: t, amount: 100 + Math.round(r() * 10) * 10, createdAt: new Date(t + 'T21:00:00').getTime() });
    }
    const cats: ExpenseCategory[] = ['fuel', 'groceries', 'home', 'fuel', 'groceries'];
    if (t !== today && r() > 0.45) {
      const c = cats[Math.floor(r() * cats.length)];
      d.dailyTransactions.push({ id: 'dt' + t, date: t, amount: c === 'fuel' ? 60 + Math.round(r() * 4) * 10 : 30 + Math.round(r() * 6) * 10, category: c, createdAt: new Date(t + 'T14:00:00').getTime() });
    }
    t = addDays(t, 1);
  }
  d.uberEntries.push({ id: 'du-today', date: today, amount: 90, createdAt: Date.now() - 3600e3 });
  d.dailyTransactions.push({ id: 'dt-today', date: today, amount: 45, category: 'fuel', createdAt: Date.now() - 1800e3 });
  return d;
}
