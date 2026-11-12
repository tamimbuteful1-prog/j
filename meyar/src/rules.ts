// Local safety net for unambiguous verbal abuse.
// When the text plainly insults or curses a person and the model did not flag
// it, معيار adds the finding itself, citing the exact provision text from the
// corpus (so it passes the same verification as any model citation).
import { normalizeArabic } from './text';
import type { Segment, VerifiedFinding, VerifiedResult } from './types';

// Words that are insults when addressed to a person ("يا …") or in "ابن …".
const ADDRESS_INSULTS = [
  'كلب', 'كلبه', 'حمار', 'حماره', 'حيوان', 'حيوانه', 'خنزير', 'بهيم', 'ثور', 'قرد', 'جحش',
  'حقير', 'حقيره', 'وسخ', 'وسخه', 'قذر', 'قذره', 'نذل', 'سافل', 'سافله', 'واطي', 'تافه', 'تافهه',
  'غبي', 'غبيه', 'احمق', 'معفن', 'زباله', 'جزمه', 'كذاب', 'كذابه', 'منافق', 'خاين', 'خاينه', 'خاين',
  'ملعون', 'ملعونه', 'فاسق', 'فاجر', 'ساقط', 'ساقطه', 'متخلف', 'متخلفه', 'عاهر', 'عاهره',
].map(normalizeArabic);
// Curses that are abusive wherever they appear.
const CURSES = ['ملعون', 'ملعونه', 'يلعن', 'يلعنك', 'يلعنه', 'يلعنها', 'يلعنكم', 'لعنه', 'لعنك', 'سافل', 'حقير', 'عاهر', 'عاهره'].map(normalizeArabic);

export interface AbuseHit {
  excerpt: string; // as written by the user
  direct: boolean; // addressed to someone ("يا …", "ابن …")
}

/** Find abusive words; returns excerpts copied from the user's original text. */
export function detectAbuse(text: string): AbuseHit[] {
  const words = [...text.matchAll(/[^\s،,.!?؟:;"«»()]+/g)].map((m) => ({ raw: m[0], i: m.index ?? 0 }));
  const norm = words.map((w) => normalizeArabic(w.raw).replace(/^و(?=يا)/, ''));
  const hits: AbuseHit[] = [];
  const used = new Set<number>();
  const span = (a: number, b: number) => text.slice(words[a].i, words[b].i + words[b].raw.length);
  for (let k = 0; k < words.length; k++) {
    if (used.has(k)) continue;
    const w = norm[k];
    // "يا كلب" / "ياكلب"
    const glued = w.startsWith('يا') && ADDRESS_INSULTS.includes(w.slice(2));
    if (glued) {
      hits.push({ excerpt: words[k].raw, direct: true });
      used.add(k);
      continue;
    }
    if (w === 'يا' && k + 1 < words.length && ADDRESS_INSULTS.includes(norm[k + 1])) {
      hits.push({ excerpt: span(k, k + 1), direct: true });
      used.add(k).add(k + 1);
      continue;
    }
    if ((w === 'ابن' || w === 'بنت' || w === 'يابن' || w === 'يابنت') && k + 1 < words.length && ADDRESS_INSULTS.includes(norm[k + 1])) {
      hits.push({ excerpt: span(k, k + 1), direct: true });
      used.add(k).add(k + 1);
      continue;
    }
    if (CURSES.includes(w)) {
      hits.push({ excerpt: words[k].raw, direct: false });
      used.add(k);
    }
  }
  return hits;
}

const DIGNITY_ID = 'av-media-exec-reg:4#2';
const DIGNITY_LINE = 'عدم المساس بكرامة الأشخاص';
const VULGAR_ID = 'av-media-law:5#1';
const VULGAR_LINE = 'يستخدم لغة مبتذلة';

function exactLine(seg: Segment | undefined, needle: string): string | null {
  if (!seg) return null;
  const line = seg.text.split('\n').find((l) => l.includes(needle));
  return line ? line.replace(/^\s*\d+\s*[-)]\s*/, '').trim() : null;
}

/**
 * Adds a verified local finding for abuse the model missed, and lifts the
 * verdict to "conflict indicators". Returns the (possibly) updated result.
 */
export function applyAbuseRule(v: VerifiedResult, userText: string, getSeg: (id: string) => Segment | undefined): VerifiedResult {
  const hits = detectAbuse(userText);
  if (!hits.length) return v;
  const norm = (s: string) => normalizeArabic(s).replace(/\s+/g, ' ').trim();
  const flagged = v.findings
    .filter((f) => f.citations.length && f.user_excerpt)
    .map((f) => norm(f.user_excerpt as string));
  const missed = hits.filter((h) => !flagged.some((x) => x.includes(norm(h.excerpt)) || norm(h.excerpt).includes(x)));
  if (!missed.length && v.classificationSupported && v.raw.classification === 'conflict_indicators') return v;

  const dignity = getSeg(DIGNITY_ID);
  const vulgar = getSeg(VULGAR_ID);
  const q1 = exactLine(dignity, DIGNITY_LINE);
  const q2 = exactLine(vulgar, VULGAR_LINE);
  const cites = [
    ...(dignity && q1 ? [{ segment: dignity, quote: q1 }] : []),
    ...(vulgar && q2 ? [{ segment: vulgar, quote: q2 }] : []),
  ];
  if (!cites.length) return v;

  const direct = missed.some((h) => h.direct);
  const added: VerifiedFinding[] = [
    {
      user_excerpt: missed.map((h) => h.excerpt).join('، '),
      issue: direct ? 'إساءة لفظية مباشرة لشخص (سبّ أو شتم).' : 'ألفاظ لعن أو سبّ مسيئة.',
      violation_type: direct ? 'إساءة وسبّ لشخص' : 'ألفاظ مسيئة ولغة مبتذلة',
      severity: direct ? 100 : 90,
      citations: cites,
      invalid_citations: [],
      excerpt_found: true,
      interpretation:
        (missed.length > 1 ? 'العبارات تتضمن' : 'العبارة تتضمن') +
        ' سبًّا صريحًا يمسّ كرامة الشخص ويقلّل من قدره، وتُعد لغة مبتذلة. الضوابط تمنع نشر أي محتوى يسيء إلى الأشخاص أو يمس كرامتهم مهما كان السياق أو المنصة.',
      suggested_rewrite: 'احذف الألفاظ المسيئة، وعبّر عن موقفك دون إساءة، مثل: «أختلف معك تمامًا في هذا التصرف.»',
    },
  ];
  const findings = [...added, ...v.findings];
  const top = Math.max(...added.map((f) => f.severity ?? 0), 0);
  return {
    ...v,
    findings,
    classificationSupported: true,
    raw: {
      ...v.raw,
      classification: 'conflict_indicators',
      risk_percent: Math.max(v.raw.risk_percent ?? 0, top),
      summary:
        v.raw.classification === 'conflict_indicators' && v.classificationSupported
          ? v.raw.summary
          : 'النص يتضمن إساءة لفظية صريحة، وهي مخالفة مباشرة لضوابط المحتوى الإعلامي التي تمنع المساس بكرامة الأشخاص واستخدام اللغة المبتذلة.',
    },
  };
}
