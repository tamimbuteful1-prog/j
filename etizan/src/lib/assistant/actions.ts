/**
 * تنفيذ Intent على البيانات وإنتاج رد قصير.
 * دالة نقية: (intent, data, today) → بيانات جديدة + رد.
 */
import { CATEGORY_LABEL } from '../categories';
import { computeMonth, remainingMonthsAt, upcomingObligations } from '../finance/engine';
import { weekStart } from '../dates';
import { dayLabel, monthsLabel, num, pct } from '../format';
import type { AppData, DailyTransaction, ISODate, MonthlySummary, UberEntry } from '../types';
import type { EditTarget, Intent } from './parser';

export interface ActionResult {
  data: AppData;
  reply: string;
  changed: boolean;
  suggestions?: string[];
}

let counter = 0;
export function uid(prefix = 'x') {
  counter = (counter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const R = (n: number) => `${num(n)} ريال`;

type Op = { kind: 'uber'; e: UberEntry } | { kind: 'tx'; e: DailyTransaction };

function lastOp(data: AppData, target?: EditTarget): Op | null {
  const ops: Op[] = [
    ...(target === undefined || target === 'uber' ? data.uberEntries.map((e) => ({ kind: 'uber' as const, e })) : []),
    ...data.dailyTransactions.filter((t) => target === undefined || t.category === target).map((e) => ({ kind: 'tx' as const, e })),
  ];
  ops.sort((a, b) => b.e.createdAt - a.e.createdAt);
  return ops[0] ?? null;
}

function opLabel(op: Op) {
  return op.kind === 'uber' ? `${R(op.e.amount)} أوبر` : `${R(op.e.amount)} ${CATEGORY_LABEL[op.e.category]}`;
}

function setAmount(data: AppData, op: Op, amount: number): AppData {
  if (op.kind === 'uber') return { ...data, uberEntries: data.uberEntries.map((e) => (e.id === op.e.id ? { ...e, amount } : e)) };
  return { ...data, dailyTransactions: data.dailyTransactions.map((e) => (e.id === op.e.id ? { ...e, amount } : e)) };
}

function removeOp(data: AppData, op: Op): AppData {
  if (op.kind === 'uber') return { ...data, uberEntries: data.uberEntries.filter((e) => e.id !== op.e.id) };
  return { ...data, dailyTransactions: data.dailyTransactions.filter((e) => e.id !== op.e.id) };
}

/** جملة الحالة بعد أي تغيير */
function afterLine(s: MonthlySummary): string {
  if (s.overspent > 0) return `تجاوزت المتاح بـ ${R(s.overspent)}، وصار المطلوب تقفيله اليوم ${R(s.todayTarget)}`;
  if (s.todayTarget > 0 && s.todayRemaining > 0) return `باقي ${R(s.todayRemaining)} وتقفل اليوم، والمتاح لك ${R(s.available)}`;
  if (s.todayTarget > 0) return `قفلت هدف اليوم ✓ والمتاح لك ${R(s.available)}`;
  return `المتاح لك الآن ${R(s.available)}`;
}

export function runIntent(intent: Intent, data: AppData, today: ISODate, now = Date.now()): ActionResult {
  const hi = `هلا ${data.settings.name}، `;
  const done = (d: AppData, msg: (s: MonthlySummary) => string): ActionResult => {
    const s = computeMonth(d, today);
    return { data: d, reply: hi + msg(s), changed: true };
  };
  const say = (msg: string, suggestions?: string[]): ActionResult => ({ data, reply: hi + msg, changed: false, suggestions });
  const s = computeMonth(data, today);

  switch (intent.type) {
    case 'add_uber': {
      const e: UberEntry = { id: uid('u'), date: today, amount: intent.amount, createdAt: now };
      return done({ ...data, uberEntries: [...data.uberEntries, e] }, (n) => `سجلت ${R(intent.amount)} من أوبر. ${afterLine(n)}`);
    }
    case 'add_expense': {
      const txs: DailyTransaction[] = intent.items.map((i, k) => ({
        id: uid('t'),
        date: today,
        amount: i.amount,
        category: i.category,
        note: i.note,
        createdAt: now + k,
      }));
      const what = intent.items.map((i) => `${R(i.amount)} ${i.category === 'other' && i.note ? i.note : CATEGORY_LABEL[i.category]}`).join(' و');
      const bill = intent.items.every((i) => i.category === 'electricity');
      return done({ ...data, dailyTransactions: [...data.dailyTransactions, ...txs] }, (n) =>
        bill ? `سجلت ${what}، وحسبتها من الالتزامات. المطلوب تقفيله اليوم ${R(n.todayTarget)}` : `سجلت ${what}. ${afterLine(n)}`,
      );
    }
    case 'correct_last': {
      const op = lastOp(data);
      if (!op) return say('ما فيه عملية أعدلها');
      return done(setAmount(data, op, intent.amount), (n) => `عدلتها إلى ${R(intent.amount)}. ${afterLine(n)}`);
    }
    case 'edit_target': {
      const op = lastOp(data, intent.target);
      const name = intent.target === 'uber' ? 'أوبر' : CATEGORY_LABEL[intent.target];
      if (!op) return say(`ما لقيت عملية ${name} أعدلها`);
      return done(setAmount(data, op, intent.amount), (n) => `عدلت ${name} إلى ${R(intent.amount)}. ${afterLine(n)}`);
    }
    case 'delete_last':
    case 'delete_target': {
      const op = lastOp(data, intent.type === 'delete_target' ? intent.target : undefined);
      if (!op) return say('ما فيه عملية أحذفها');
      return done(removeOp(data, op), (n) => `حذفت ${opLabel(op)}. ${afterLine(n)}`);
    }
    case 'undo':
      return say('تمام'); // يُنفَّذ في المخزن (سجل الحالات)
    case 'clarify':
      return say(`${R(intent.amount)} مصروف ولا دخل أوبر؟`, [`دخلت ${intent.amount} من أوبر`, `دفعت ${intent.amount} مقاضي`, `دفعت ${intent.amount} بنزين`]);
    case 'unknown':
      return say('ما فهمت عليك. قل مثلًا: دفعت 50 بنزين، أو كم باقي علي اليوم؟', ['كم باقي علي اليوم؟', 'كم المتاح لي؟', 'وش وضعي؟']);
    case 'query':
      return say(answer(intent, data, s, today));
  }
}

function answer(q: Extract<Intent, { type: 'query' }>, data: AppData, s: MonthlySummary, today: ISODate): string {
  const per = { today: 'اليوم', week: 'هالأسبوع', month: 'هالشهر' } as const;
  switch (q.topic) {
    case 'close':
      if (s.todayTarget === 0 && !s.isTodayWorkDay) return `اليوم راحة، ما عليك تقفيل. باقي على عجز الشهر ${R(s.deficitLeft)}`;
      if (s.todayTarget === 0) return `ما عليك تقفيل اليوم، عجز الشهر مغطى ✓`;
      if (s.todayRemaining === 0) return `قفلت هدف اليوم ✓ دخلت ${R(s.todayUber)} من ${R(s.todayTarget)}`;
      return s.todayUber > 0
        ? `باقي لك اليوم ${R(s.todayRemaining)} وتقفل الهدف (دخلت ${num(s.todayUber)} من ${num(s.todayTarget)})`
        : `تحتاج تقفل اليوم ${R(s.todayTarget)}`;
    case 'available':
      if (s.overspent > 0) return `ما عندك متاح الآن، متجاوز بـ ${R(s.overspent)}`;
      return `المتاح للصرف الآن ${R(s.available)}`;
    case 'uber': {
      const p = q.period ?? 'today';
      const v = p === 'today' ? s.todayUber : p === 'week' ? s.uberWeek : s.uberMonth;
      return `دخل أوبر ${per[p]} ${R(v)}`;
    }
    case 'expenses': {
      const p = q.period ?? 'today';
      const from = p === 'today' ? today : p === 'week' ? weekStart(today) : `${s.month}-01`;
      const txs = data.dailyTransactions.filter((t) => t.date >= from && t.date <= today && (!q.category || t.category === q.category));
      const total = txs.reduce((a, t) => a + t.amount, 0);
      const what = q.category ? ` على ${CATEGORY_LABEL[q.category]}` : '';
      return `صرفت${what} ${per[p]} ${R(total)}`;
    }
    case 'loan': {
      const m = s.month;
      const loans = data.fixedObligations.filter((o) => (q.loan === 'mortgage' ? o.kind === 'mortgage' : q.loan === 'personal' ? o.kind === 'loan' : o.kind === 'mortgage' || o.kind === 'loan'));
      if (!loans.length) return 'ما عندك قروض مسجلة';
      if (loans.length === 1) {
        const o = loans[0];
        const r = remainingMonthsAt(o, m) ?? 0;
        return `باقي على ${o.name} ${monthsLabel(r)} — تقريبًا ${R(r * o.amount)}`;
      }
      const total = loans.reduce((a, o) => a + (remainingMonthsAt(o, m) ?? 0) * o.amount, 0);
      const soonest = [...loans].filter((o) => (remainingMonthsAt(o, m) ?? 0) > 0).sort((a, b) => (remainingMonthsAt(a, m) ?? 0) - (remainingMonthsAt(b, m) ?? 0))[0];
      return `باقي على القروض ${R(total)}. أقربها ينتهي ${soonest.name} بعد ${monthsLabel(remainingMonthsAt(soonest, m) ?? 0)}`;
    }
    case 'upcoming': {
      const up = upcomingObligations(data, today, 7);
      if (!up.length) return 'ما عليك التزامات خلال الأسبوع ✓';
      const list = up.slice(0, 4).map((u) => `${u.name} ${num(u.amount)} ${u.inDays === 0 ? 'اليوم' : u.inDays === 1 ? 'بكرة' : dayLabel(u.date)}`);
      const total = up.reduce((a, u) => a + u.amount, 0);
      return `التزاماتك هالأسبوع ${R(total)}: ${list.join('، ')}${up.length > 4 ? '…' : ''}`;
    }
    case 'summary': {
      const month = `الشهر: غطيت ${num(s.closed)} من عجز ${num(s.monthlyDeficit)}`;
      if (s.overspent > 0) return `متجاوز المتاح بـ ${R(s.overspent)}، تحتاج ${R(s.todayRemaining)} وتقفل اليوم. ${month}`;
      const day = s.todayTarget > 0 ? (s.todayRemaining > 0 ? `باقي ${R(s.todayRemaining)} وتقفل` : 'قفلت هدف اليوم ✓') : 'ما عليك تقفيل اليوم';
      return `اليوم ${day}، والمتاح ${R(s.available)}. ${month}`;
    }
    case 'forecast':
      return s.forecast >= 0
        ? `بالمعدل الحالي، تختم الشهر بفائض تقريبًا ${R(s.forecast)}`
        : `بالمعدل الحالي، نهاية الشهر عجز تقريبًا ${R(-s.forecast)}`;
    case 'coverage':
      return `التزاماتك مغطاة ${pct(s.coverage)} هالشهر`;
    case 'electricity':
      return s.billsPaid > 0 ? `سجلت كهرباء هالشهر ${R(s.billsPaid)}` : `الكهرباء ما انسجلت هالشهر، محجوز لها تقديريًا ${R(s.billsReserve)}`;
    case 'month':
      if (s.monthlyDeficit === 0) return 'ما عندك عجز هالشهر ✓';
      return `عجز الشهر ${R(s.monthlyDeficit)}، غطيت ${num(s.closed)} وباقي ${R(s.deficitLeft)}`;
    case 'help':
      return 'قل: دفعت 50 بنزين، دخلت 150 من أوبر، كم باقي علي؟، كم المتاح؟، احذف آخر عملية';
  }
}
