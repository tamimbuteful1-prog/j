import type { AppData, MonthKey } from './types';

/** البيانات الأولية لأبو تميم */
export function createSeed(asOf: MonthKey): AppData {
  return {
    version: 1,
    settings: {
      name: 'أبو تميم',
      workDays: [0, 1, 2, 3, 4], // الأحد → الخميس (قابل للتعديل)
      defaultUberDaily: 150,
      digits: 'latin',
      speakReplies: true,
    },
    incomeSources: [
      { id: 'salary', name: 'الراتب', amount: 8400 },
      { id: 'iaana', name: 'إعانة', amount: 1666 },
      { id: 'housing', name: 'دعم سكني', amount: 1500 },
      { id: 'daman', name: 'الضمان', amount: 1900 },
      { id: 'citizen', name: 'حساب المواطن', amount: 2000 },
    ],
    fixedObligations: [
      { id: 'mortgage', name: 'القرض العقاري', kind: 'mortgage', amount: 3990, remainingMonths: 240, totalMonths: 240, asOf, dueDay: 27 },
      { id: 'rent', name: 'الإيجار', kind: 'rent', amount: 3500, remainingMonths: null, totalMonths: null, asOf, dueDay: 1, note: 'شهرين = 21,000' },
      { id: 'loan1', name: 'قرض شخصي ١', kind: 'loan', amount: 2800, remainingMonths: 60, totalMonths: 60, asOf, dueDay: 27 },
      { id: 'loan2', name: 'قرض شخصي ٢', kind: 'loan', amount: 2770, remainingMonths: 60, totalMonths: 60, asOf, dueDay: 27 },
      { id: 'loan3', name: 'قرض شخصي ٣', kind: 'loan', amount: 577, remainingMonths: 48, totalMonths: 48, asOf, dueDay: 27 },
      { id: 'loan4', name: 'قرض شخصي ٤', kind: 'loan', amount: 370, remainingMonths: 60, totalMonths: 60, asOf, dueDay: 27 },
      { id: 'net-home', name: 'إنترنت المنزل', kind: 'service', amount: 299, remainingMonths: null, totalMonths: null, asOf, dueDay: 15 },
      { id: 'net-mobile', name: 'إنترنت الجوال (أوبر)', kind: 'service', amount: 85, remainingMonths: null, totalMonths: null, asOf, dueDay: 15 },
      { id: 'temp1', name: 'التزام مؤقت ١', kind: 'temporary', amount: 1000, remainingMonths: 5, totalMonths: 5, asOf, dueDay: 1 },
      { id: 'temp2', name: 'التزام مؤقت ٢', kind: 'temporary', amount: 1000, remainingMonths: 7, totalMonths: 7, asOf, dueDay: 1 },
    ],
    variableExpenses: [
      { id: 'electricity', name: 'فاتورة الكهرباء', category: 'electricity', min: 400, max: 600, reserve: true },
      { id: 'home', name: 'طلبات المنزل', category: 'groceries', min: 0, max: 0, reserve: false },
      { id: 'car', name: 'صيانة السيارة', category: 'maintenance', min: 0, max: 0, reserve: false },
    ],
    uberEntries: [],
    dailyTransactions: [],
    assistantMessages: [],
    obligationPayments: {},
  };
}
