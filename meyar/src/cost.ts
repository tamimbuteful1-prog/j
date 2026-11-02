// Pre-send cost ESTIMATE in Saudi riyals. It is built from the full request the
// site would send (fixed instructions + user text + selected references), a
// character-to-token range, and the documented per-model prices in
// public/config/models.json. It is never presented as an exact cost.

export interface PricedModel {
  id: string;
  label: string;
  structured_output: boolean;
  price_usd_per_mtok?: { input: number; output: number };
}

export interface EstimateCfg {
  chars_per_token_arabic: [number, number];
  chars_per_token_other: [number, number];
  output_tokens_typical_min: number;
}

export interface CostEstimate {
  inputTokens: [number, number];
  outputTokens: [number, number];
  /** null when no documented price exists for the model. */
  sar: [number, number] | null;
  model: PricedModel | null;
}

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;

/** Character-based token range for a mixed Arabic / JSON / Latin request. */
export function tokenRange(text: string, e: EstimateCfg): [number, number] {
  const arabic = (text.match(ARABIC) || []).length;
  const other = text.length - arabic;
  // Fewer characters per token -> more tokens, so the upper bound uses the low ratio.
  const lo = arabic / e.chars_per_token_arabic[1] + other / e.chars_per_token_other[1];
  const hi = arabic / e.chars_per_token_arabic[0] + other / e.chars_per_token_other[0];
  return [Math.round(lo), Math.round(hi)];
}

export function estimateCost(
  fullRequestText: string,
  model: PricedModel | null,
  maxOutput: number,
  e: EstimateCfg,
  usdToSar: number,
): CostEstimate {
  const inputTokens = tokenRange(fullRequestText, e);
  const outputTokens: [number, number] = [Math.min(e.output_tokens_typical_min, maxOutput), maxOutput];
  const p = model?.price_usd_per_mtok;
  const sar: [number, number] | null = p
    ? [
        ((inputTokens[0] * p.input + outputTokens[0] * p.output) / 1e6) * usdToSar,
        ((inputTokens[1] * p.input + outputTokens[1] * p.output) / 1e6) * usdToSar,
      ]
    : null;
  return { inputTokens, outputTokens, sar, model };
}

const nf = (digits: number) =>
  new Intl.NumberFormat('ar-SA', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Readable riyal amount; tiny amounts are shown as "أقل من ٠٫٠١". */
export function formatSar(v: number): string {
  if (v < 0.01) return 'أقل من ' + nf(2).format(0.01);
  if (v < 1) return nf(2).format(v);
  return nf(2).format(v);
}

export function formatTokens(n: number): string {
  return new Intl.NumberFormat('ar-SA').format(Math.round(n / 10) * 10);
}
