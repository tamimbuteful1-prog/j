/**
 * محلل الأوامر العربية (rule-based): نص → Intent منظّم.
 * نفس شكل Intent هو ما سيُطلب من أي LLM لاحقًا (انظر llm.ts)، فيبقى التنفيذ واحدًا.
 */
import type { ExpenseCategory } from '../types';
import { normalizeArabic } from './normalize';
import { extractNumbers } from './numbers';

export type Period = 'today' | 'week' | 'month';
export type QueryTopic =
  | 'close'
  | 'available'
  | 'uber'
  | 'expenses'
  | 'loan'
  | 'upcoming'
  | 'summary'
  | 'forecast'
  | 'coverage'
  | 'electricity'
  | 'month'
  | 'help';

export type EditTarget = ExpenseCategory | 'uber';

export type Intent =
  | { type: 'add_expense'; items: { amount: number; category: ExpenseCategory; note?: string }[] }
  | { type: 'add_uber'; amount: number }
  | { type: 'correct_last'; amount: number }
  | { type: 'edit_target'; target: EditTarget; amount: number }
  | { type: 'delete_last' }
  | { type: 'delete_target'; target: EditTarget }
  | { type: 'undo' }
  | { type: 'query'; topic: QueryTopic; period?: Period; category?: ExpenseCategory; loan?: 'mortgage' | 'personal' | 'all' }
  | { type: 'clarify'; amount: number }
  | { type: 'unknown' };

const CATEGORY_WORDS: [ExpenseCategory, string[]][] = [
  ['electricity', ['كهرباء', 'كهربا', 'كهربه', 'الكهرب']],
  ['fuel', ['بنزين', 'وقود', 'بترول', 'عبيت', 'عبيته', 'تعبيه', 'محطه', 'ديزل', 'بنزينه']],
  ['maintenance', ['صيانه', 'ورشه', 'زيت', 'كفرات', 'كفر', 'بنشر', 'غيار', 'بطاريه', 'فحص', 'سياره', 'السيكل', 'مكانيكي', 'ميكانيكي']],
  ['groceries', ['مقاضي', 'مقضي', 'بقاله', 'سوبرماركت', 'خضار', 'خضره', 'اكل', 'اكله', 'غدا', 'عشا', 'فطور', 'مطعم', 'لحم', 'خبز', 'مويه', 'ماء', 'شرب', 'قهوه', 'شاهي', 'طلبات', 'فواكه', 'دجاج', 'تموينات', 'حليب']],
  ['home', ['ملابس', 'لبس', 'ثياب', 'ثوب', 'اثاث', 'سباك', 'منزل', 'بيت', 'منظفات', 'غاز', 'ادوات', 'مكيف']],
];

const PREFIXES = ['وبال', 'وال', 'بال', 'لل', 'فال', 'ال', 'و', 'ب', 'ل', 'ف'];

function stems(token: string): string[] {
  const out = [token];
  for (const p of PREFIXES) if (token.startsWith(p) && token.length - p.length >= 2) out.push(token.slice(p.length));
  return out;
}

function tokenMatches(token: string, word: string) {
  return stems(token).some((s) => s === word || (word.length >= 4 && s.startsWith(word)));
}

function hasAny(tokens: string[], words: string[]) {
  return tokens.some((t) => words.some((w) => tokenMatches(t, w)));
}

function categoryOf(tokens: string[]): ExpenseCategory | null {
  for (const [cat, words] of CATEGORY_WORDS) if (hasAny(tokens, words)) return cat;
  return null;
}

const UBER_WORDS = ['اوبر', 'uber', 'اوبير', 'كريم', 'careem', 'مشاوير', 'مشوار', 'توصيل', 'جاهز', 'بولت'];
const INCOME_VERBS = ['دخلت', 'دخلنا', 'جاني', 'جاتني', 'جاني', 'حصلت', 'حصلنا', 'كسبت', 'ربحت', 'سويت', 'اشتغلت', 'طلعت', 'دخل', 'دخلي', 'قبضت'];
const EXPENSE_VERBS = ['دفعت', 'صرفت', 'اشتريت', 'شريت', 'سددت', 'حطيت', 'عطيت', 'دفعنا', 'صرفنا', 'جبت', 'خذيت', 'اخذت', 'راحت', 'سدد', 'دفع', 'مصروف'];
const QUESTION_WORDS = ['كم', 'وش', 'ايش', 'شو', 'هل', 'كيف', 'متي', 'وين', 'ماذا', 'طمني', 'قولي', 'عطني', 'ابي اعرف', 'ابغي اعرف', 'ابغى اعرف', 'خبرني'];
const DELETE_WORDS = ['احذف', 'امسح', 'شيل', 'الغ', 'الغي', 'حذف', 'امسحها', 'احذفها', 'شيلها'];
const EDIT_WORDS = ['عدل', 'غير', 'خل', 'خلي', 'صحح', 'خليها', 'عدلها', 'غيرها', 'خله', 'خليه'];

function periodOf(t: string): Period | undefined {
  if (/(^| )(هالاسبوع|الاسبوع|اسبوع)( |$)/.test(t)) return 'week';
  if (/(^| )(هالشهر|الشهر|شهر)( |$)/.test(t)) return 'month';
  if (/(^| )(اليوم|هاليوم)( |$)/.test(t)) return 'today';
  return undefined;
}

export function parse(raw: string): Intent {
  const t = normalizeArabic(raw);
  if (!t) return { type: 'unknown' };
  const tokens = t.split(' ');
  const nums = extractNumbers(t);
  const isQuestion = /[?؟]/.test(raw) || QUESTION_WORDS.some((q) => (q.includes(' ') ? t.includes(q) : tokens.includes(q)));
  const cat = categoryOf(tokens);
  const uberish = hasAny(tokens, UBER_WORDS);

  // تراجع
  if (/^(تراجع|رجعها|رجع اخر|الغ اخر امر)/.test(t) || tokens.includes('تراجع')) return { type: 'undo' };

  // حذف
  if (hasAny(tokens.slice(0, 2), DELETE_WORDS)) {
    if (uberish) return { type: 'delete_target', target: 'uber' };
    if (cat) return { type: 'delete_target', target: cat };
    return { type: 'delete_last' };
  }

  // تعديل صريح: عدل البنزين إلى 90
  if (nums.length && hasAny(tokens.slice(0, 2), EDIT_WORDS)) {
    const amount = nums[nums.length - 1].value;
    if (uberish) return { type: 'edit_target', target: 'uber', amount };
    if (cat) return { type: 'edit_target', target: cat, amount };
    return { type: 'correct_last', amount };
  }

  // تصحيح: لا مو 120، كانت 110
  if (
    nums.length &&
    (/^(لا|لاء|لاا|غلط|خطا|خطأ|اقصد|قصدي)( |$)/.test(t) || /(^| )(مو|مب|مهب|موب|الصح|الصحيح|قصدي)( |$)/.test(t))
  ) {
    return { type: 'correct_last', amount: nums[nums.length - 1].value };
  }

  if (isQuestion || !nums.length) return query(t, tokens, cat, uberish);

  // دخل أوبر
  const expenseVerb = hasAny(tokens, EXPENSE_VERBS);
  if (uberish || (hasAny(tokens, INCOME_VERBS) && !cat && !expenseVerb)) {
    const big = nums.filter((n) => n.value >= 10);
    return { type: 'add_uber', amount: (big.length ? big : nums).reduce((a, n) => a + n.value, 0) };
  }

  // مصروف (واحد أو أكثر): «دفعت 50 بنزين و 30 مقاضي»
  if (expenseVerb || cat) {
    if (nums.length > 1) {
      const items = nums.map((n, k) => {
        const end = k + 1 < nums.length ? nums[k + 1].index : tokens.length;
        const start = k === 0 ? 0 : n.index;
        const seg = tokens.slice(start, end);
        return { amount: n.value, category: categoryOf(seg) };
      });
      if (items.every((i) => i.category)) {
        return { type: 'add_expense', items: items.map((i) => ({ amount: i.amount, category: i.category! })) };
      }
    }
    return { type: 'add_expense', items: [{ amount: nums[0].value, category: cat ?? 'other', note: cat ? undefined : noteFrom(tokens) }] };
  }

  return { type: 'clarify', amount: nums[0].value };
}

function noteFrom(tokens: string[]): string | undefined {
  const rest = tokens.filter((w) => !/\d/.test(w) && !['ريال', 'ريالات', 'دفعت', 'صرفت', 'اشتريت', 'شريت', 'علي', 'على', 'في', 'اليوم', 'سددت'].includes(w));
  const s = rest.join(' ').trim();
  return s ? s.slice(0, 40) : undefined;
}

function query(t: string, tokens: string[], cat: ExpenseCategory | null, uberish: boolean): Intent {
  const period = periodOf(t);
  const has = (re: RegExp) => re.test(t);

  if (has(/(ساعدني|مساعده|وش تقدر|ايش تقدر|كيف استخدم|وش اقول)/)) return { type: 'query', topic: 'help' };
  if (has(/قرض|قروض|العقاري|التمويل/)) {
    const loan = has(/عقار|سكن|بيت/) ? 'mortgage' : has(/شخصي|شخصيه/) ? 'personal' : 'all';
    return { type: 'query', topic: 'loan', loan };
  }
  if (has(/كهرب/)) return { type: 'query', topic: 'electricity' };
  if (has(/(التزام|التزامات|القادم|القريب|مستحق|فواتير|الاقساط|اقساط|الايجار)/)) return { type: 'query', topic: 'upcoming' };
  if (has(/(نهايه الشهر|اخر الشهر|توقع|اخر الشهر)/)) return { type: 'query', topic: 'forecast' };
  if (has(/(تغطيه|نسبه|مغطي)/)) return { type: 'query', topic: 'coverage' };
  if (has(/(اصرف|المتاح|متاح|يسمح|اقدر اشتري|مصروفي|في جيبي|الجيب)/)) return { type: 'query', topic: 'available' };
  if (has(/(اقفل|تقفيل|اسكر|تسكير|اقفله|الهدف|ناقص|المطلوب|باقي علي|باقي لي|كم باقي)/)) {
    if (has(/الشهر/) && !has(/اليوم/)) return { type: 'query', topic: 'month' };
    return { type: 'query', topic: 'close' };
  }
  if (has(/عجز/)) return { type: 'query', topic: 'month' };
  if (uberish || has(/(دخلت|دخلي|كسبت|حصلت|الدخل)/)) return { type: 'query', topic: 'uber', period: period ?? 'today' };
  if (cat || has(/(صرفت|مصاريف|مصروفات|المصروف|صرفنا)/))
    return { type: 'query', topic: 'expenses', period: period ?? 'today', category: cat ?? undefined };
  if (has(/(وضعي|الوضع|ملخص|كيف حالي|كيف الحال|طمني|وش عندي|يومي)/)) return { type: 'query', topic: 'summary' };
  if (tokens.length <= 3 && has(/(هلا|السلام|مرحبا|هاي|صباح|مساء)/)) return { type: 'query', topic: 'summary' };
  return { type: 'unknown' };
}
