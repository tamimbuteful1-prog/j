// Structural validation of the model output and programmatic citation checks.
// These checks prove that each citation points to a segment that was actually
// sent and that each quote exists verbatim in that segment. They do NOT prove
// that the model's interpretation is correct.
import { findInSource, normalizeArabic } from './text';
import type {
  Citation,
  Classification,
  ModelResult,
  Segment,
  VerifiedCitation,
  VerifiedResult,
} from './types';

const CLASSES: Classification[] = ['no_conflict_found', 'conflict_indicators', 'needs_more_info', 'insufficient_references'];

export class InvalidOutputError extends Error {}

function isStr(x: unknown): x is string {
  return typeof x === 'string';
}
function strOrNull(x: unknown): string | null {
  if (x === null || x === undefined) return null;
  if (!isStr(x)) throw new InvalidOutputError('field type');
  return x;
}
function strArr(x: unknown): string[] {
  if (!Array.isArray(x) || !x.every(isStr)) throw new InvalidOutputError('string array');
  return x;
}
function citations(x: unknown): Citation[] {
  if (!Array.isArray(x)) throw new InvalidOutputError('citations');
  return x.map((c) => {
    if (!c || typeof c !== 'object') throw new InvalidOutputError('citation');
    const o = c as Record<string, unknown>;
    if (!isStr(o.segment_id) || !isStr(o.quote)) throw new InvalidOutputError('citation fields');
    return { segment_id: o.segment_id, quote: o.quote };
  });
}

/** Extract the first top-level JSON object from a model reply. */
export function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) throw new InvalidOutputError('no json');
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    throw new InvalidOutputError('json parse');
  }
}

export function parseResult(obj: unknown): ModelResult {
  if (!obj || typeof obj !== 'object') throw new InvalidOutputError('not object');
  const o = obj as Record<string, unknown>;
  if (!isStr(o.classification) || !CLASSES.includes(o.classification as Classification))
    throw new InvalidOutputError('classification');
  if (!isStr(o.summary) || !isStr(o.limitations)) throw new InvalidOutputError('summary');
  if (!Array.isArray(o.findings) || !Array.isArray(o.conditions_and_exceptions)) throw new InvalidOutputError('arrays');
  return {
    classification: o.classification as Classification,
    summary: o.summary,
    direct_answer: strOrNull(o.direct_answer),
    findings: o.findings.map((f) => {
      if (!f || typeof f !== 'object') throw new InvalidOutputError('finding');
      const r = f as Record<string, unknown>;
      if (!isStr(r.issue) || !isStr(r.interpretation)) throw new InvalidOutputError('finding fields');
      return {
        user_excerpt: strOrNull(r.user_excerpt),
        issue: r.issue,
        citations: citations(r.citations),
        interpretation: r.interpretation,
        suggested_rewrite: strOrNull(r.suggested_rewrite),
      };
    }),
    conditions_and_exceptions: o.conditions_and_exceptions.map((c) => {
      if (!c || typeof c !== 'object') throw new InvalidOutputError('condition');
      const r = c as Record<string, unknown>;
      if (!isStr(r.text)) throw new InvalidOutputError('condition text');
      return { text: r.text, citations: citations(r.citations) };
    }),
    unresolved: strArr(o.unresolved ?? []),
    missing_information: strArr(o.missing_information ?? []),
    limitations: o.limitations,
  };
}

function checkCitations(cs: Citation[], sent: Map<string, Segment>) {
  const ok: VerifiedCitation[] = [];
  const bad: Citation[] = [];
  for (const c of cs) {
    const seg = sent.get(c.segment_id);
    const exact = seg ? findInSource(seg.text, c.quote) ?? (seg.lead ? findInSource(seg.lead, c.quote) : null) : null;
    if (seg && exact) ok.push({ segment: seg, quote: exact });
    else bad.push(c);
  }
  return { ok, bad };
}

export function verifyResult(res: ModelResult, sentSegments: Segment[], userText: string): VerifiedResult {
  const sent = new Map(sentSegments.map((s) => [s.id, s]));
  const normUser = normalizeArabic(userText).replace(/\s+/g, ' ');
  let invalid = 0;
  const findings = res.findings.map((f) => {
    const { ok, bad } = checkCitations(f.citations, sent);
    invalid += bad.length;
    const ex = f.user_excerpt ? normalizeArabic(f.user_excerpt).replace(/\s+/g, ' ').trim() : '';
    return {
      ...f,
      citations: ok,
      invalid_citations: bad,
      excerpt_found: !f.user_excerpt || (ex.length > 0 && normUser.includes(ex)),
    };
  });
  const conditions = res.conditions_and_exceptions.map((c) => {
    const { ok, bad } = checkCitations(c.citations, sent);
    invalid += bad.length;
    return { text: c.text, citations: ok, invalid_citations: bad };
  });
  // "conflict indicators" must be supported by at least one valid citation
  const classificationSupported =
    res.classification !== 'conflict_indicators' || findings.some((f) => f.citations.length > 0);
  return { raw: res, findings, conditions, invalidCount: invalid, classificationSupported };
}
