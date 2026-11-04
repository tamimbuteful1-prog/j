/**
 * نموذج بيانات اتزان.
 * كل الحقول قابلة للتخزين كما هي (JSON) — في المتصفح الآن، وفي قاعدة بيانات لاحقًا.
 * التواريخ بصيغة محلية: يوم 'YYYY-MM-DD' وشهر 'YYYY-MM'.
 */

export type ISODate = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM

/** مصدر دخل ثابت شهري */
export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
}

export type ObligationKind = 'mortgage' | 'rent' | 'loan' | 'service' | 'temporary';

/** التزام ثابت شهري */
export interface FixedObligation {
  id: string;
  name: string;
  kind: ObligationKind;
  amount: number; // شهريًا
  /** عدد الأشهر المتبقية كما في شهر asOf. null = مفتوح (شهري بلا نهاية) */
  remainingMonths: number | null;
  /** المدة الكاملة بالأشهر (للعرض فقط) */
  totalMonths: number | null;
  asOf: MonthKey;
  /** يوم الاستحقاق في الشهر (تقديري قابل للتعديل) */
  dueDay: number;
  note?: string;
}

export type ExpenseCategory = 'fuel' | 'groceries' | 'electricity' | 'maintenance' | 'home' | 'other';

/** التزام/مصروف غير ثابت له تقدير شهري */
export interface VariableExpense {
  id: string;
  name: string;
  category: ExpenseCategory;
  min: number;
  max: number;
  /** فاتورة (تُحجز من العجز الشهري) أم مصروف معيشة (يُصرف من المتاح) */
  reserve: boolean;
}

/** إدخال دخل من أوبر */
export interface UberEntry {
  id: string;
  date: ISODate;
  amount: number;
  note?: string;
  createdAt: number;
}

/** مصروف يومي */
export interface DailyTransaction {
  id: string;
  date: ISODate;
  amount: number;
  category: ExpenseCategory;
  note?: string;
  createdAt: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  via?: 'voice' | 'text';
  /** اقتراحات أوامر جاهزة (للتوضيح) */
  suggestions?: string[];
  /** هل يمكن التراجع عن العملية الناتجة */
  undoable?: boolean;
}

export interface Settings {
  name: string; // أبو تميم
  /** أيام العمل في أوبر: 0=الأحد ... 6=السبت */
  workDays: number[];
  /** متوسط دخل أوبر اليومي الافتراضي قبل وجود سجل */
  defaultUberDaily: number;
  digits: 'latin' | 'arabic';
  speakReplies: boolean;
}

export interface AppData {
  version: 1;
  settings: Settings;
  incomeSources: IncomeSource[];
  fixedObligations: FixedObligation[];
  variableExpenses: VariableExpense[];
  uberEntries: UberEntry[];
  dailyTransactions: DailyTransaction[];
  assistantMessages: AssistantMessage[];
  /** الالتزامات المعلَّمة كمدفوعة لكل شهر */
  obligationPayments: Record<MonthKey, string[]>;
}

/** يوم محسوب ضمن إعادة تشغيل الشهر */
export interface DayPlan {
  date: ISODate;
  isWorkDay: boolean;
  uber: number;
  spend: number; // مصاريف معيشة
  bills: number; // فواتير محجوزة (كهرباء)
  target: number; // المطلوب تقفيله في ذلك اليوم
  toNeed: number; // ما ذهب من دخل اليوم للتقفيل
  walletEnd: number; // المتاح بنهاية اليوم (قد يكون سالبًا = تجاوز)
  closedEnd: number; // المغطّى من عجز الشهر بنهاية اليوم
}

/** ملخص الشهر — يُشتق دائمًا من البيانات */
export interface MonthlySummary {
  month: MonthKey;
  today: ISODate;
  daysInMonth: number;
  dayOfMonth: number;

  fixedIncome: number;
  fixedObligations: number;
  fixedGap: number; // الدخل الثابت - الالتزامات الثابتة (سالب = عجز)
  billsReserve: number; // الفواتير غير الثابتة المحجوزة (الكهرباء)
  billsPaid: number;
  monthlyDeficit: number; // المطلوب تغطيته من الدخل غير الثابت (0 إن وُجد فائض)
  monthlySurplus: number; // فائض الدخل الثابت إن وجد

  workDaysTotal: number;
  workDaysLeft: number; // تشمل اليوم
  avgUberDaily: number;
  dailyGoalPlan: number; // الهدف اليومي التقريبي = العجز / أيام العمل في الشهر

  // اليوم
  todayTarget: number; // المطلوب تقفيله اليوم
  todayUber: number;
  todayRemaining: number; // المتبقي من هدف اليوم
  todaySpend: number; // المصروف الفعلي اليوم (معيشة + فواتير)
  available: number; // المتاح للصرف الآن (>= 0)
  overspent: number; // مقدار التجاوز إن وجد
  isTodayWorkDay: boolean;

  // الشهر
  uberMonth: number;
  uberWeek: number;
  spendMonth: number; // معيشة
  spendWeek: number;
  closed: number; // المغطى من العجز
  deficitLeft: number; // المتبقي من عجز الشهر
  reserved: number; // المحجوز للالتزامات = الدخل الثابت + المغطى
  obligationsTotal: number; // الالتزامات الثابتة + الفواتير
  coverage: number; // 0..1
  forecast: number; // توقع نهاية الشهر (+ فائض / - عجز)

  days: DayPlan[];
}
