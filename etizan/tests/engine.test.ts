import { describe, expect, it } from 'vitest';
import { createSeed } from '@/lib/seed';
import { computeMonth } from '@/lib/finance/engine';
import type { AppData } from '@/lib/types';

const base = () => createSeed('2026-11');
const withUber = (d: AppData, date: string, amount: number): AppData => ({
  ...d, uberEntries: [...d.uberEntries, { id: date + amount, date, amount, createdAt: 1 }],
});
const withTx = (d: AppData, date: string, amount: number, category: any = 'fuel'): AppData => ({
  ...d, dailyTransactions: [...d.dailyTransactions, { id: date + amount + category, date, amount, category, createdAt: 2 }],
});

describe('engine', () => {
  it('totals match the seed', () => {
    const s = computeMonth(base(), '2026-11-01');
    expect(s.fixedIncome).toBe(15466);
    expect(s.fixedObligations).toBe(16391);
    expect(s.fixedGap).toBe(-925);
    expect(s.billsReserve).toBe(500);
    expect(s.monthlyDeficit).toBe(1425);
    expect(s.workDaysTotal).toBe(22); // نوفمبر 2026: الأحد→الخميس
    expect(s.todayTarget).toBe(Math.ceil(1425 / 22));
    expect(s.available).toBe(0);
    expect(s.coverage).toBeCloseTo(15466 / 16891);
  });

  it('uber fills the target first, excess becomes spendable', () => {
    const d = withUber(base(), '2026-11-01', 150);
    const s = computeMonth(d, '2026-11-01');
    expect(s.todayRemaining).toBe(0);
    expect(s.closed).toBe(65);
    expect(s.available).toBe(150 - 65);
  });

  it('spending reduces available; overspend raises the target', () => {
    let d = withUber(base(), '2026-11-01', 150);
    d = withTx(d, '2026-11-01', 50);
    let s = computeMonth(d, '2026-11-01');
    expect(s.available).toBe(35);
    d = withTx(d, '2026-11-02', 100);
    s = computeMonth(d, '2026-11-02');
    expect(s.overspent).toBe(65);
    const plain = computeMonth(withUber(base(), '2026-11-01', 150), '2026-11-02');
    expect(s.todayTarget).toBeGreaterThan(plain.todayTarget);
  });

  it('electricity counts as a bill, not living spending', () => {
    const d = withTx(base(), '2026-11-03', 600, 'electricity');
    const s = computeMonth(d, '2026-11-03');
    expect(s.billsReserve).toBe(600);
    expect(s.monthlyDeficit).toBe(1525);
    expect(s.spendMonth).toBe(0);
  });

  it('temporary obligations expire', () => {
    const s = computeMonth(base(), '2027-05-02'); // بعد 6 شهور: انتهى المؤقت ١ (5 شهور)
    expect(s.fixedObligations).toBe(16391 - 1000);
  });

  it('missed days roll into later targets', () => {
    const s1 = computeMonth(base(), '2026-11-02');
    const s2 = computeMonth(base(), '2026-11-10');
    expect(s2.todayTarget).toBeGreaterThan(s1.todayTarget);
  });
});
