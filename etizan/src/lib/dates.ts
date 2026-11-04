import type { ISODate, MonthKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // منتصف النهار لتفادي مشاكل التوقيت الصيفي
}

export function monthKey(s: ISODate | Date): MonthKey {
  const iso = typeof s === 'string' ? s : toISODate(s);
  return iso.slice(0, 7);
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthDiff(from: MonthKey, to: MonthKey): number {
  const [y1, m1] = from.split('-').map(Number);
  const [y2, m2] = to.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function weekday(s: ISODate): number {
  return parseISODate(s).getDay();
}

/** بداية الأسبوع (الأحد) */
export function weekStart(s: ISODate): ISODate {
  return addDays(s, -weekday(s));
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
