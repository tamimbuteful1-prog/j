import { MONTHS_AR, WEEKDAYS_AR, parseISODate, todayISO, addDays } from './dates';
import type { ISODate } from './types';

let digits: 'latin' | 'arabic' = 'latin';
export function setDigits(d: 'latin' | 'arabic') {
  digits = d;
}

const ARABIC = '٠١٢٣٤٥٦٧٨٩';
export function localizeDigits(s: string): string {
  return digits === 'arabic' ? s.replace(/\d/g, (c) => ARABIC[Number(c)]) : s;
}

/** رقم بفواصل آلاف وبدون كسور */
export function num(n: number): string {
  const v = Math.round(n);
  return (v < 0 ? '-' : '') + localizeDigits(Math.abs(v).toLocaleString('en-US'));
}

export function riyal(n: number): string {
  return `${num(n)} ريال`;
}

export function pct(r: number): string {
  return localizeDigits(`${Math.round(r * 100)}`) + '٪';
}

export function dayLabel(d: ISODate): string {
  const t = todayISO();
  if (d === t) return 'اليوم';
  if (d === addDays(t, -1)) return 'أمس';
  const date = parseISODate(d);
  return `${WEEKDAYS_AR[date.getDay()]} ${localizeDigits(String(date.getDate()))} ${MONTHS_AR[date.getMonth()]}`;
}

export function longDate(d: ISODate): string {
  const date = parseISODate(d);
  return `${WEEKDAYS_AR[date.getDay()]}، ${localizeDigits(String(date.getDate()))} ${MONTHS_AR[date.getMonth()]}`;
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'الآن';
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? 'قبل دقيقة' : m === 2 ? 'قبل دقيقتين' : `قبل ${localizeDigits(String(m))} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : `قبل ${localizeDigits(String(h))} ساعات`;
  const d = Math.round(h / 24);
  return d === 1 ? 'أمس' : `قبل ${localizeDigits(String(d))} أيام`;
}

/** مدة بالأشهر → نص مختصر */
export function monthsLabel(m: number): string {
  if (m <= 0) return 'انتهى';
  const y = Math.floor(m / 12);
  const r = m % 12;
  const ys = y === 0 ? '' : y === 1 ? 'سنة' : y === 2 ? 'سنتين' : `${localizeDigits(String(y))} ${y <= 10 ? 'سنوات' : 'سنة'}`;
  const ms = r === 0 ? '' : r === 1 ? 'شهر' : r === 2 ? 'شهرين' : `${localizeDigits(String(r))} ${r <= 10 ? 'شهور' : 'شهر'}`;
  return [ys, ms].filter(Boolean).join(' و');
}
