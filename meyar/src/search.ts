// Local BM25 retrieval over the reference corpus. Runs entirely in the browser.
import { normalizeArabic, stem, tokenize } from './text';
import type { Corpus, Retrieval, Retrieved, Segment, Task, UserContext } from './types';

// Near-synonym groups (applied to queries only). Words are normalized+stemmed at load.
const SYNONYMS: string[][] = [
  ['اعلان', 'اعلانات', 'دعايه', 'ترويج', 'تسويق', 'اعلاني', 'معلن', 'سناب', 'مشهور', 'مؤثر'],
  ['تبغ', 'سجائر', 'دخان', 'تدخين', 'شيشه', 'معسل'],
  ['كحول', 'خمر', 'خمور', 'مسكر', 'مشروبات كحوليه'],
  ['مخدرات', 'حشيش', 'مؤثرات عقليه'],
  ['دواء', 'ادويه', 'دوائيه', 'علاج', 'مكملات', 'غذائيه', 'تخسيس', 'منتج صحي'],
  ['ترخيص', 'رخصه', 'تصريح', 'اذن', 'فسح', 'اجازه', 'موافقه'],
  ['خصوصيه', 'الحياه الخاصه', 'اسرار', 'صور', 'تصوير'],
  ['كرامه', 'اساءه', 'تشهير', 'قذف', 'سب', 'شتم', 'سمعه', 'ابتزاز', 'تجريح'],
  ['كاذبه', 'شائعات', 'شائعه', 'خاطئه', 'مضلله', 'تضليل', 'ادعاءات', 'زائفه'],
  ['طفل', 'اطفال', 'قاصر', 'صغار', 'شباب'],
  ['عمري', 'تصنيف', 'فيلم', 'افلام', 'العاب', 'لعبه'],
  ['دين', 'الشريعه', 'الاسلاميه', 'الذات الالهيه', 'القران', 'الانبياء', 'الصحابه'],
  ['نعرات', 'فرقه', 'كراهيه', 'عنصريه', 'طائفيه', 'قبليه', 'قبائل'],
  ['ارهاب', 'عنف', 'تحريض', 'جرائم', 'اجرام'],
  ['عري', 'محتشم', 'اباحي', 'فاحشه', 'الاداب', 'خادش', 'مبتذله', 'غرائز'],
  ['صحيفه', 'صحف', 'جريده', 'مجله', 'صحافه', 'صحفي'],
  ['قناه', 'تلفزيون', 'اذاعه', 'بث', 'بودكاست', 'راديو'],
  ['منصه', 'تواصل', 'رقمي', 'انترنت', 'موقع', 'تيك', 'يوتيوب', 'تويتر', 'انستقرام'],
  ['عقوبه', 'غرامه', 'جزاء', 'مخالفه', 'عقوبات', 'غرامات'],
  ['تصحيح', 'رد', 'نفي', 'تعويض'],
  ['عمله', 'اقتصادي', 'سوق المال', 'اسهم', 'افلاس'],
  ['تحقيقات', 'محاكمات', 'قضيه', 'قضايا'],
  ['مذيعه', 'مذيعات', 'زي', 'لباس', 'حجاب'],
  ['ملكيه فكريه', 'حقوق', 'نسخ', 'مؤلف', 'اقتباس'],
  ['سحر', 'شعوذه', 'دجل'],
  ['ملك', 'ولي العهد', 'نظام الحكم', 'الدوله'],
];

/** Segments always considered when checking a text: the general content-control
 *  articles. They are listed explicitly so the user can see they were included. */
export const BASELINE_FOR_CHECK = [
  'av-media-law:5#1',
  'av-media-law:5#2',
  'av-media-exec-reg:4#1',
  'av-media-exec-reg:4#2',
  'press-law:9',
  'press-law-exec-reg:73',
];

const DEFINITION_ARTICLES = new Set([
  'press-law:1',
  'press-law-exec-reg:1',
  'av-media-law:1',
  'av-media-exec-reg:1',
  'gmedia-org:1',
]);

const K1 = 1.4;
const B = 0.75;

interface Doc {
  seg: Segment;
  tf: Map<string, number>;
  len: number;
  items: { tf: Map<string, number>; len: number }[]; // paragraphs / numbered items
}

function termFreq(toks: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

export class SearchIndex {
  private docs: Doc[] = [];
  private df = new Map<string, number>();
  private avgLen = 1;
  private avgItemLen = 1;
  private syn = new Map<string, Set<string>>();
  private byId = new Map<string, Segment>();
  private defTerms = new Map<string, Set<string>>(); // definitions segment id -> stemmed terms

  constructor(private corpus: Corpus) {
    for (const s of corpus.segments) this.byId.set(s.id, s);
    for (const seg of corpus.segments) {
      if (!seg.citable) continue;
      // title/label weighted by repetition
      const toks = tokenize(`${seg.title} ${seg.title} ${seg.chapter} ${seg.lead} ${seg.text}`);
      const tf = termFreq(toks);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
      const head = `${seg.title} ${seg.chapter}`;
      const items = seg.text
        .split('\n')
        .filter((p) => p.trim())
        .map((p) => {
          const it = tokenize(`${head} ${p}`);
          return { tf: termFreq(it), len: it.length };
        });
      this.docs.push({ seg, tf, len: toks.length, items });
    }
    this.avgLen = this.docs.reduce((a, d) => a + d.len, 0) / Math.max(1, this.docs.length);
    const allItems = this.docs.flatMap((d) => d.items);
    this.avgItemLen = allItems.reduce((a, d) => a + d.len, 0) / Math.max(1, allItems.length);
    for (const group of SYNONYMS) {
      const stems = group.flatMap((w) => tokenize(w));
      for (const s of stems) {
        const set = this.syn.get(s) || new Set<string>();
        stems.forEach((x) => x !== s && set.add(x));
        this.syn.set(s, set);
      }
    }
    for (const id of DEFINITION_ARTICLES) {
      const s = this.byId.get(id);
      if (!s) continue;
      const terms = new Set<string>();
      for (const line of s.text.split('\n')) {
        const m = line.match(/^\s*(?:\d+\s*[-)]\s*)?([^:]{2,40}):/);
        if (m) tokenize(m[1]).forEach((t) => terms.add(t));
      }
      this.defTerms.set(id, terms);
    }
  }

  get(id: string): Segment | undefined {
    return this.byId.get(id);
  }

  private idf(t: string): number {
    const n = this.docs.length;
    const df = this.df.get(t) || 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  score(query: string): { seg: Segment; score: number }[] {
    const q = new Map<string, number>();
    for (const t of tokenize(query)) {
      q.set(t, Math.max(q.get(t) || 0, 1));
      for (const s of this.syn.get(t) || []) q.set(s, Math.max(q.get(s) || 0, 0.7));
    }
    const bm25 = (tf: Map<string, number>, len: number, avg: number) => {
      let s = 0;
      for (const [t, w] of q) {
        const f = tf.get(t);
        if (!f) continue;
        s += w * this.idf(t) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * len) / avg)));
      }
      return s;
    };
    const out: { seg: Segment; score: number }[] = [];
    for (const d of this.docs) {
      // best single item (a specific numbered rule) dominates; whole segment adds context
      const best = Math.max(0, ...d.items.map((it) => bm25(it.tf, it.len, this.avgItemLen)));
      const s = best + 0.35 * bm25(d.tf, d.len, this.avgLen);
      if (s > 0) out.push({ seg: d.seg, score: s });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  retrieve(task: Task, text: string, ctx: UserContext, maxRefs: number, maxChars: number): Retrieval {
    const ctxWords = [ctx.venue, ctx.ad === 'yes' ? 'إعلان تجاري دعاية' : '', ctx.license === 'yes' ? 'ترخيص' : '']
      .filter(Boolean)
      .join(' ');
    const ranked = this.score(`${text} ${ctxWords}`);
    const top = ranked[0]?.score || 0;
    // A match must carry a meaningful share of the best score and an absolute floor.
    const FLOOR = 8;
    const matches = ranked.filter((r) => r.score >= Math.max(FLOOR, top * 0.25));

    const chosen: Retrieved[] = [];
    const seen = new Set<string>();
    let chars = 0;
    const add = (seg: Segment | undefined, reason: Retrieved['reason'], score: number) => {
      if (!seg || !seg.citable || seen.has(seg.id) || chosen.length >= maxRefs) return false;
      const size = seg.text.length + seg.lead.length;
      if (chars + size > maxChars) return false;
      seen.add(seg.id);
      chars += size;
      chosen.push({ segment: seg, reason, score });
      return true;
    };

    const matchBudget = task === 'check' ? Math.max(3, maxRefs - BASELINE_FOR_CHECK.length) : maxRefs;
    for (const r of matches.slice(0, matchBudget)) add(r.seg, 'match', r.score);
    if (task === 'check') for (const id of BASELINE_FOR_CHECK) add(this.byId.get(id), 'baseline', 0);

    // one level of cross-references (e.g. "مع مراعاة ما ورد في المادة ...") from the strongest matches
    for (const r of chosen.filter((c) => c.reason === 'match').slice(0, 4)) {
      for (const ref of r.segment.refs) {
        const parts = this.corpus.segments.filter((s) => s.id === ref || s.id.startsWith(ref + '#'));
        for (const p of parts.slice(0, 2)) add(p, 'reference', 0);
      }
    }

    // definitions articles whose defined terms appear in the query or in chosen texts
    const qTokens = new Set(tokenize(text));
    const docsUsed = new Set(chosen.map((c) => c.segment.doc));
    for (const [id, terms] of this.defTerms) {
      const seg = this.byId.get(id);
      if (!seg || !docsUsed.has(seg.doc)) continue;
      const hit = [...terms].some((t) => qTokens.has(t));
      if (hit) add(seg, 'definitions', 0);
    }

    const matched = chosen.filter((c) => c.reason === 'match').length;
    return {
      items: chosen,
      weak: matched < 2 || top < 12,
      topScore: top,
      matched,
    };
  }
}

export function sourceLabel(seg: Segment, docTitle: string): string {
  const pages =
    seg.page_start === seg.page_end ? `صفحة PDF ${seg.page_start}` : `صفحات PDF ${seg.page_start}–${seg.page_end}`;
  const printed =
    seg.printed_start !== undefined
      ? seg.printed_start === seg.printed_end
        ? ` (الصفحة المطبوعة ${seg.printed_start})`
        : ` (الصفحات المطبوعة ${seg.printed_start}–${seg.printed_end})`
      : '';
  const part = seg.part ? ` — الجزء ${seg.part[0]} من ${seg.part[1]}` : '';
  const title = seg.title && seg.article !== null ? `: ${seg.title}` : seg.article === null ? `: ${seg.title}` : '';
  return `${docTitle} — ${seg.article !== null ? seg.label : 'قسم'}${title}${part} — ${pages}${printed}`;
}

export { normalizeArabic, stem };
