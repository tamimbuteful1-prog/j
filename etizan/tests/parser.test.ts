import { describe, expect, it } from 'vitest';
import { parse } from '@/lib/assistant/parser';
import { runIntent } from '@/lib/assistant/actions';
import { createSeed } from '@/lib/seed';

describe('parser', () => {
  const cases: [string, any][] = [
    ['دفعت 120 ريال بنزين', { type: 'add_expense', items: [{ amount: 120, category: 'fuel' }] }],
    ['دفعت ٦٥ ريال مقاضي', { type: 'add_expense', items: [{ amount: 65, category: 'groceries' }] }],
    ['دفعت فاتورة الكهرباء 500', { type: 'add_expense', items: [{ amount: 500, category: 'electricity' }] }],
    ['دفعت 50 بنزين و 30 مقاضي', { type: 'add_expense', items: [{ amount: 50, category: 'fuel' }, { amount: 30, category: 'groceries' }] }],
    ['دخلت اليوم 180 من أوبر', { type: 'add_uber', amount: 180 }],
    ['جاني 150 من أوبر', { type: 'add_uber', amount: 150 }],
    ['جاني مية وخمسين من اوبر', { type: 'add_uber', amount: 150 }],
    ['كم باقي علي اليوم؟', { type: 'query', topic: 'close' }],
    ['كم المتاح لي أصرف؟', { type: 'query', topic: 'available' }],
    ['كم دخلت من أوبر؟', { type: 'query', topic: 'uber', period: 'today' }],
    ['كم دخلت من أوبر هالأسبوع', { type: 'query', topic: 'uber', period: 'week' }],
    ['كم باقي على القرض العقاري؟', { type: 'query', topic: 'loan', loan: 'mortgage' }],
    ['وش وضعي اليوم؟', { type: 'query', topic: 'summary' }],
    ['كم احتاج أقفل؟', { type: 'query', topic: 'close' }],
    ['لا مو 120، كانت 110', { type: 'correct_last', amount: 110 }],
    ['احذف آخر عملية', { type: 'delete_last' }],
    ['عدل البنزين إلى 90', { type: 'edit_target', target: 'fuel', amount: 90 }],
    ['التزاماتي القادمة', { type: 'query', topic: 'upcoming' }],
    ['180', { type: 'clarify', amount: 180 }],
  ];
  for (const [text, expected] of cases) {
    it(text, () => expect(parse(text)).toMatchObject(expected));
  }
});

describe('actions', () => {
  it('records and replies briefly', () => {
    let d = createSeed('2026-11');
    let r = runIntent(parse('دخلت 150 من أوبر'), d, '2026-11-04', 1);
    expect(r.reply).toMatch(/^هلا أبو تميم، سجلت 150 ريال من أوبر/);
    d = r.data;
    r = runIntent(parse('دفعت 120 بنزين'), d, '2026-11-04', 2);
    d = r.data;
    r = runIntent(parse('لا مو 120، كانت 110'), d, '2026-11-04', 3);
    expect(r.data.dailyTransactions[0].amount).toBe(110);
    r = runIntent(parse('احذف آخر عملية'), r.data, '2026-11-04', 4);
    expect(r.data.dailyTransactions).toHaveLength(0);
    expect(r.data.uberEntries).toHaveLength(1);
  });
});
