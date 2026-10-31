// Arabic text normalization. Used ONLY for searching and for comparing quotes;
// text displayed as a quotation always comes from the original corpus text.

const TASHKEEL = /[ً-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const INDIC_DIGITS = /[٠-٩۰-۹]/g;

export function stripMarks(s: string): string {
  return s.replace(TASHKEEL, '').replace(TATWEEL, '');
}

export function normalizeArabic(s: string): string {
  return stripMarks(s)
    .replace(INDIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10))
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[یٸ]/g, 'ي')
    .replace(/ک/g, 'ك')
    .toLowerCase();
}

const STOP = new Set(
  'في من على الى عن او ان ما لا هذا هذه ذلك التي الذي الذين كل اي اذا ثم قد مع بين كان لم لن هو هي هم نحن انا انت به بها له لها فيه فيها عند حتى غير بعد قبل كما او اما ايضا وفق وفقا اللذين هل كيف كم ماذا لماذا متى اين يجوز يمكن ممكن بدون دون اريد ابي ابغى عندي لدي لو هناك يوجد ما هي ما هو اذا كان شي شيء'
    .split(' ')
    .map(normalizeArabic),
);

const PREFIXES = ['وبال', 'وكال', 'وال', 'بال', 'كال', 'فال', 'لل', 'ال'];
// 'ان' is deliberately not stripped: it would damage إعلان، بيان، مكان.
const SUFFIXES = ['اتها', 'تها', 'هما', 'كما', 'يات', 'ات', 'ون', 'ين', 'ها', 'هم', 'هن', 'يه', 'يا', 'ه', 'ي'];

/** Very light Arabic stemmer: strips one common prefix and one common suffix. */
export function stem(tok: string): string {
  let t = tok;
  if (t.length > 4 && (t[0] === 'و' || t[0] === 'ف') && !t.startsWith('وال') && !t.startsWith('فال')) {
    // conjunction prefix (keep words that genuinely start with و like وزير by length guard)
    if (t.length > 5) t = t.slice(1);
  }
  for (const p of PREFIXES) {
    if (t.startsWith(p) && t.length - p.length >= 3) {
      t = t.slice(p.length);
      break;
    }
  }
  for (const s of SUFFIXES) {
    if (t.endsWith(s) && t.length - s.length >= 3) {
      t = t.slice(0, -s.length);
      break;
    }
  }
  return t;
}

export function tokenize(s: string): string[] {
  const out: string[] = [];
  for (const raw of normalizeArabic(s).split(/[^\p{L}\p{N}]+/u)) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    out.push(stem(raw));
  }
  return out;
}

/**
 * Locate `needle` inside `hay` ignoring diacritics, tatweel, hamza/ya/ta-marbuta
 * variants, punctuation spacing and whitespace differences. Returns the exact
 * original substring of `hay`, or null when the quote is not in the source.
 */
export function findInSource(hay: string, needle: string): string | null {
  const map: number[] = [];
  let norm = '';
  for (let i = 0; i < hay.length; i++) {
    const c = normalizeArabic(hay[i]);
    if (!c) continue; // removed mark
    if (/\s/.test(c)) {
      if (norm.endsWith(' ') || norm === '') continue;
      norm += ' ';
      map.push(i);
      continue;
    }
    for (const ch of c) {
      norm += ch;
      map.push(i);
    }
  }
  const n = normalizeArabic(needle).replace(/\s+/g, ' ').trim()
    .replace(/^[«"'“”(.…\s]+|[»"'“”).…\s]+$/g, '');
  if (n.length < 8) return null;
  const at = norm.indexOf(n);
  if (at < 0) return null;
  const start = map[at];
  const end = map[at + n.length - 1] + 1;
  // extend over trailing diacritics of the last letter
  let e = end;
  while (e < hay.length && /[ً-ٰٟـ]/.test(hay[e])) e++;
  return hay.slice(start, e);
}
