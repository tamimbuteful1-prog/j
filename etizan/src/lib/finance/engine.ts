/**
 * المحرك المالي لاتزان — دوال نقية بلا حالة.
 *
 * الفكرة:
 *  1) العجز الشهري = الالتزامات الثابتة النشطة + الفواتير غير الثابتة (الكهرباء) − الدخل الثابت.
 *  2) هذا العجز يُغطّى من دخل أوبر. نوزّعه على أيام العمل المتبقية → «المطلوب تقفيله اليوم».
 *  3) دخل أوبر في أي يوم يذهب أولًا لهدف ذلك اليوم، والزائد عن الهدف يصير «متاحًا للصرف».
 *  4) مصاريف المعيشة (بنزين، مقاضي، صيانة...) تُخصم من المتاح. إن تجاوزته، يُضاف التجاوز
 *     إلى المطلوب تقفيله (فيرتفع الهدف).
 *  5) يُعاد تشغيل الشهر يومًا بيوم من البيانات، فتبقى كل الأرقام متسقة بعد أي تعديل أو حذف.
 */
import { BILL_CATEGORIES } from '../categories';
import { addDays, daysInMonth, monthDiff, monthKey, weekStart, weekday } from '../dates';
import type { AppData, DayPlan, FixedObligation, ISODate, MonthKey, MonthlySummary } from '../types';

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** الأشهر المتبقية لالتزام في شهر معيّن (null = مفتوح) */
export function remainingMonthsAt(o: FixedObligation, month: MonthKey): number | null {
  if (o.remainingMonths == null) return null;
  return Math.max(0, o.remainingMonths - monthDiff(o.asOf, month));
}

export function isActive(o: FixedObligation, month: MonthKey): boolean {
  const r = remainingMonthsAt(o, month);
  return r == null || r > 0;
}

/** المبلغ المتبقي الكلي لالتزام (بما فيه الشهر الحالي) */
export function remainingBalance(o: FixedObligation, month: MonthKey): number | null {
  const r = remainingMonthsAt(o, month);
  return r == null ? null : r * o.amount;
}

export function activeObligations(data: AppData, month: MonthKey) {
  return data.fixedObligations.filter((o) => isActive(o, month));
}

export function fixedIncomeTotal(data: AppData) {
  return sum(data.incomeSources.map((s) => s.amount));
}

export function fixedObligationsTotal(data: AppData, month: MonthKey) {
  return sum(activeObligations(data, month).map((o) => o.amount));
}

/** تقدير الفواتير غير الثابتة: المدفوع فعلًا إن سُجل، وإلا متوسط النطاق */
export function billsReserve(data: AppData, month: MonthKey) {
  let total = 0;
  let paid = 0;
  for (const v of data.variableExpenses.filter((v) => v.reserve)) {
    const p = sum(
      data.dailyTransactions.filter((t) => t.category === v.category && monthKey(t.date) === month).map((t) => t.amount),
    );
    paid += p;
    total += p > 0 ? p : Math.round((v.min + v.max) / 2);
  }
  return { total, paid };
}

export function isScheduledWorkDay(data: AppData, d: ISODate) {
  return data.settings.workDays.includes(weekday(d));
}

/** متوسط دخل أوبر اليومي في آخر 30 يومًا (للأيام التي فيها دخل) */
export function avgUberDaily(data: AppData, today: ISODate) {
  const from = addDays(today, -30);
  const byDay = new Map<string, number>();
  for (const e of data.uberEntries) {
    if (e.date > from && e.date <= today) byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
  }
  if (byDay.size === 0) return data.settings.defaultUberDaily;
  return sum([...byDay.values()]) / byDay.size;
}

export function computeMonth(data: AppData, today: ISODate): MonthlySummary {
  const month = monthKey(today);
  const dim = daysInMonth(month);
  const dayOfMonth = Number(today.slice(8, 10));

  const fixedIncome = fixedIncomeTotal(data);
  const fixedObligations = fixedObligationsTotal(data, month);
  const bills = billsReserve(data, month);
  const fixedGap = fixedIncome - fixedObligations;
  const net = fixedObligations + bills.total - fixedIncome;
  const monthlyDeficit = Math.max(0, net);
  const monthlySurplus = Math.max(0, -net);
  const dailyAllowance = monthlySurplus / dim;

  const uberBy = new Map<string, number>();
  for (const e of data.uberEntries) if (monthKey(e.date) === month) uberBy.set(e.date, (uberBy.get(e.date) ?? 0) + e.amount);
  const spendBy = new Map<string, number>();
  const billsBy = new Map<string, number>();
  for (const t of data.dailyTransactions) {
    if (monthKey(t.date) !== month) continue;
    const m = BILL_CATEGORIES.includes(t.category) ? billsBy : spendBy;
    m.set(t.date, (m.get(t.date) ?? 0) + t.amount);
  }

  const dates: ISODate[] = Array.from({ length: dim }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const scheduled = dates.map((d) => isScheduledWorkDay(data, d));
  const workDaysTotal = scheduled.filter(Boolean).length;

  let wallet = 0;
  let closed = 0;
  const days: DayPlan[] = [];

  for (let i = 0; i < dayOfMonth; i++) {
    const d = dates[i];
    const uber = uberBy.get(d) ?? 0;
    const spend = spendBy.get(d) ?? 0;
    const dayOverride = data.dailyTargets?.[d];
    const fixed = data.settings.fixedDailyTarget;
    const isWorkDay = scheduled[i] || uber > 0 || dayOverride !== undefined;

    wallet += dailyAllowance;
    const ws = wallet;
    const need = Math.max(0, monthlyDeficit - closed) + Math.max(0, -ws);
    // أيام العمل المتبقية تشمل اليوم (حتى لو كان يوم راحة واشتغل فيه)
    const left = scheduled.slice(i + 1).filter(Boolean).length + (isWorkDay ? 1 : 0);
    const auto = isWorkDay && left > 0 ? Math.ceil(need / left) : 0;
    // الهدف اليدوي: هدف اليوم المحدد، ثم الهدف الثابت لأيام العمل، وإلا التلقائي
    const manual: DayPlan['manual'] = dayOverride !== undefined ? 'today' : fixed != null && fixed > 0 && isWorkDay ? 'fixed' : null;
    const base = manual === 'today' ? Math.max(0, dayOverride!) : manual === 'fixed' ? fixed! : auto;
    // مصروف اليوم الذي لا يغطيه المتاح يُضاف على مطلوب اليوم (في الهدف التلقائي فقط؛ اليدوي يبقى كما حدده)
    const target = manual ? base : base + Math.max(0, Math.ceil(spend - Math.max(0, ws)));

    const toNeed = Math.min(uber, base);
    const cover = Math.min(toNeed, Math.max(0, -ws));
    wallet += cover;
    closed += toNeed - cover;
    wallet += uber - toNeed - spend;

    days.push({ date: d, isWorkDay, uber, spend, bills: billsBy.get(d) ?? 0, target, auto, manual, toNeed, walletEnd: wallet, closedEnd: closed });
  }

  const t = days[days.length - 1];
  const todayUber = t.uber;
  const todayTarget = t.target;
  const isTodayWorkDay = scheduled[dayOfMonth - 1] || data.dailyTargets?.[today] !== undefined;
  const workDaysLeft = scheduled.slice(dayOfMonth - 1).filter(Boolean).length + (!isTodayWorkDay && todayUber > 0 ? 1 : 0);

  const uberMonth = sum([...uberBy.values()]);
  const ws = weekStart(today);
  const inWeek = (d: string) => d >= ws && d <= today;
  const uberWeek = sum(data.uberEntries.filter((e) => inWeek(e.date)).map((e) => e.amount));
  const spendMonth = sum([...spendBy.values()]);
  const spendWeek = sum(
    data.dailyTransactions.filter((x) => inWeek(x.date) && !BILL_CATEGORIES.includes(x.category)).map((x) => x.amount),
  );

  const avg = avgUberDaily(data, today);
  // توقع نهاية الشهر بالمعدل الحالي
  const futureWork = scheduled.slice(dayOfMonth).filter(Boolean).length;
  const todayExpected = isTodayWorkDay ? Math.max(0, avg - todayUber) : 0;
  const avgSpendPerDay = spendMonth / dayOfMonth;
  const forecast =
    fixedIncome + uberMonth + todayExpected + avg * futureWork - fixedObligations - bills.total - spendMonth - avgSpendPerDay * (dim - dayOfMonth);

  const obligationsTotal = fixedObligations + bills.total;
  const reserved = Math.min(obligationsTotal, fixedIncome + closed);

  return {
    month,
    today,
    daysInMonth: dim,
    dayOfMonth,
    fixedIncome,
    fixedObligations,
    fixedGap,
    billsReserve: bills.total,
    billsPaid: bills.paid,
    monthlyDeficit,
    monthlySurplus,
    workDaysTotal,
    workDaysLeft,
    avgUberDaily: avg,
    dailyGoalPlan: data.settings.fixedDailyTarget ? data.settings.fixedDailyTarget : workDaysTotal ? Math.ceil(monthlyDeficit / workDaysTotal) : 0,
    todayTarget,
    targetSource: t.manual ?? 'auto',
    autoTarget: t.auto,
    todayUber,
    todayRemaining: Math.max(0, todayTarget - todayUber),
    todaySpend: t.spend + t.bills,
    available: Math.max(0, Math.floor(t.walletEnd)),
    overspent: Math.max(0, Math.ceil(-t.walletEnd)),
    isTodayWorkDay,
    uberMonth,
    uberWeek,
    spendMonth,
    spendWeek,
    closed,
    deficitLeft: Math.max(0, monthlyDeficit - closed),
    reserved,
    obligationsTotal,
    coverage: obligationsTotal ? Math.min(1, (fixedIncome + closed) / obligationsTotal) : 1,
    forecast,
    days,
  };
}

export interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  date: ISODate;
  inDays: number;
  paid: boolean;
}

/** الالتزامات القادمة خلال `horizon` يومًا (غير المدفوعة أولًا) */
export function upcomingObligations(data: AppData, today: ISODate, horizon = 10): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (let i = 0; i <= horizon; i++) {
    const d = addDays(today, i);
    const m = monthKey(d);
    const dim = daysInMonth(m);
    const dom = Number(d.slice(8, 10));
    for (const o of data.fixedObligations) {
      if (!isActive(o, m)) continue;
      const due = Math.min(o.dueDay, dim);
      if (due !== dom) continue;
      const paid = (data.obligationPayments[m] ?? []).includes(o.id);
      items.push({ id: o.id, name: o.name, amount: o.amount, date: d, inDays: i, paid });
    }
  }
  return items.filter((x) => !x.paid);
}
