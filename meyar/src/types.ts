export type DocCategory = 'law' | 'regulation' | 'organization' | 'guide';

export interface RefDocument {
  id: string;
  title: string;
  category: DocCategory;
  issuer: string;
  version: string;
  currency: 'unverified' | 'verified';
  currency_note: string;
  extraction: string;
  official_url: string | null;
  file: string;
  sha256: string;
  reviewed_on: string;
  articles: number;
  segments: number;
  pages: number;
}

export interface Segment {
  id: string;
  doc: string;
  article: number | null;
  label: string;
  title: string;
  chapter: string;
  page_start: number;
  page_end: number;
  printed_start?: number;
  printed_end?: number;
  text: string;
  lead: string;
  part: [number, number] | null;
  refs: string[];
  citable: boolean;
  note?: string;
}

export interface Corpus {
  schema: number;
  reviewed_on: string;
  documents: RefDocument[];
  excluded: { file: string; sha256: string | null; category: string; reason: string }[];
  segments: Segment[];
}

export type Task = 'check' | 'question';

export interface UserContext {
  venue: string;
  ad: string;
  license: string;
}

export interface Retrieved {
  segment: Segment;
  reason: 'match' | 'baseline' | 'reference' | 'definitions';
  score: number;
}

export interface Retrieval {
  items: Retrieved[];
  weak: boolean;
  topScore: number;
  matched: number;
}

export type Classification =
  | 'no_conflict_found'
  | 'conflict_indicators'
  | 'needs_more_info'
  | 'insufficient_references';

export interface Citation {
  segment_id: string;
  quote: string;
}

export interface Finding {
  user_excerpt: string | null;
  issue: string;
  citations: Citation[];
  interpretation: string;
  suggested_rewrite: string | null;
}

export interface ModelResult {
  classification: Classification;
  summary: string;
  direct_answer: string | null;
  findings: Finding[];
  conditions_and_exceptions: { text: string; citations: Citation[] }[];
  unresolved: string[];
  missing_information: string[];
  limitations: string;
}

export interface VerifiedCitation {
  segment: Segment;
  quote: string; // exact original text from the corpus
}

export interface VerifiedFinding extends Omit<Finding, 'citations'> {
  citations: VerifiedCitation[];
  invalid_citations: Citation[];
  excerpt_found: boolean;
}

export interface VerifiedResult {
  raw: ModelResult;
  findings: VerifiedFinding[];
  conditions: { text: string; citations: VerifiedCitation[]; invalid_citations: Citation[] }[];
  invalidCount: number;
  classificationSupported: boolean;
}

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
}
