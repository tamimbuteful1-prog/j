// Direct browser calls to the two supported providers.
// - Endpoints are hard-coded constants; there is no way to enter an arbitrary URL.
// - The API key lives only in this module's memory (never in storage, URLs,
//   logs, error messages or the prompt). It disappears on reload.
import { SYSTEM_PROMPT, RESULT_SCHEMA } from './prompt';
import type { Usage } from './types';

export type ProviderId = 'anthropic' | 'openai';

export const ENDPOINTS = {
  anthropic: { messages: 'https://api.anthropic.com/v1/messages', models: 'https://api.anthropic.com/v1/models' },
  openai: { responses: 'https://api.openai.com/v1/responses', models: 'https://api.openai.com/v1/models' },
} as const;

export const KEY_PAGES: Record<ProviderId, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://platform.claude.com/settings/keys',
};

/** Status of each integration, shown to the user (see README for details). */
export const INTEGRATION_STATUS: Record<ProviderId, string> = {
  anthropic:
    'تم التحقق من إمكانية الاتصال المباشر من المتصفح بطلب حقيقي إلى خادم Anthropic (بمفتاح غير صالح عمدًا، فأعاد خطأ مصادقة مقروءًا). لم يُختبر تحليل كامل بمفتاح صالح.',
  openai:
    'التكامل مكتوب لكنه لم يُختبر: تعذّر الوصول إلى api.openai.com من بيئة الإعداد، فلم نتحقق من دعم الاتصال المباشر من المتصفح ولا من شكل الطلب. إن فشل الاتصال فاستخدم مسار النسخ اليدوي.',
};

// ------------------------------------------------------------- key (memory only)
let apiKey = '';
export function setKey(k: string) {
  apiKey = k.trim();
}
export function clearKey() {
  apiKey = '';
}
export function hasKey() {
  return apiKey.length > 0;
}

// ------------------------------------------------------------- errors
export type ErrorKind =
  | 'invalid_key'
  | 'permission'
  | 'billing'
  | 'rate_limit'
  | 'network'
  | 'cors'
  | 'model_unavailable'
  | 'too_long'
  | 'overloaded'
  | 'unreadable'
  | 'aborted'
  | 'server'
  | 'bad_request';

export const ERROR_MESSAGES: Record<ErrorKind, string> = {
  invalid_key: 'المفتاح غير صالح أو أُلغي. تأكد من نسخه كاملًا من صفحة المفاتيح لدى المزود.',
  permission: 'المفتاح لا يملك صلاحية لهذا الطلب أو لهذا النموذج. راجع إعدادات المشروع أو مساحة العمل لدى المزود.',
  billing: 'يبدو أن الحساب لا يملك رصيدًا كافيًا أو توجد مشكلة في الفوترة. فعّل الفوترة أو أضف رصيدًا لدى المزود.',
  rate_limit: 'تم تجاوز حدود الاستخدام أو سقف الإنفاق مؤقتًا. انتظر قليلًا ثم أعد المحاولة يدويًا.',
  network: 'تعذّر الاتصال بالشبكة. تحقق من اتصالك بالإنترنت ثم أعد المحاولة.',
  cors: 'تعذّر الاتصال المباشر بالمزود من المتصفح (قد يكون السبب حجب الاتصال المباشر من المتصفح، أو شبكة تمنع النطاق). استخدم مسار «بدون مفتاح» لنسخ الطلب يدويًا.',
  model_unavailable: 'النموذج المختار غير متاح لحسابك أو اسمه غير صحيح. اختر نموذجًا آخر.',
  too_long: 'الطلب أطول من الحد المسموح. اختصر النص أو قلّل المراجع.',
  overloaded: 'خدمة المزود مزدحمة حاليًا. أعد المحاولة لاحقًا.',
  unreadable: 'وصلت استجابة غير قابلة للقراءة أو لا تطابق البنية المطلوبة، فلم تُعرض. يمكنك إعادة المحاولة يدويًا (قد يُحتسب الطلب ضمن التكلفة).',
  aborted: 'أُلغي الطلب. قد يكون المزود عالج جزءًا منه بالفعل، والإلغاء لا يضمن إلغاء تكلفته.',
  server: 'حدث خطأ لدى المزود. أعد المحاولة لاحقًا.',
  bad_request: 'رفض المزود الطلب لأن صيغته غير مقبولة (قد يكون النموذج لا يدعم أحد الخيارات).',
};

export class ProviderError extends Error {
  constructor(public kind: ErrorKind, public status?: number, public providerType?: string) {
    super(kind);
  }
}

/** Map an HTTP failure to an error kind. Never echoes the provider's message text,
 *  because some providers include a masked fragment of the key in it. */
function classify(provider: ProviderId, status: number, body: unknown): ProviderError {
  const err = (body as { error?: { type?: string; code?: string; message?: string } })?.error || {};
  const type = String(err.type || '');
  const code = String(err.code || '');
  const msg = String(err.message || '').toLowerCase();
  const safeType = (type || code).replace(/[^a-z_]/g, '').slice(0, 40);
  let kind: ErrorKind = 'server';
  if (status === 401) kind = 'invalid_key';
  else if (status === 402 || type === 'billing_error' || code === 'insufficient_quota' || msg.includes('credit balance')) kind = 'billing';
  else if (status === 403) kind = 'permission';
  else if (status === 404 || code === 'model_not_found') kind = 'model_unavailable';
  else if (status === 413 || code === 'context_length_exceeded' || msg.includes('too long') || msg.includes('maximum context')) kind = 'too_long';
  else if (status === 429) kind = 'rate_limit';
  else if (status === 529 || type === 'overloaded_error') kind = 'overloaded';
  else if (status === 400) kind = 'bad_request';
  void provider;
  return new ProviderError(kind, status, safeType);
}

async function send(provider: ProviderId, url: string, init: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new ProviderError('aborted');
    throw new ProviderError(navigator.onLine === false ? 'network' : 'cors');
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) throw classify(provider, res.status, null);
    throw new ProviderError('unreadable', res.status);
  }
  if (!res.ok) throw classify(provider, res.status, body);
  return body;
}

function anthropicHeaders(): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    // Required by Anthropic for requests made directly from a browser.
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

export interface CallResult {
  text: string;
  usage: Usage;
  truncated: boolean;
}

export async function callModel(
  provider: ProviderId,
  model: string,
  userMessage: string,
  maxTokens: number,
  structured: boolean,
  signal: AbortSignal,
): Promise<CallResult> {
  if (!apiKey) throw new ProviderError('invalid_key');
  if (!/^[A-Za-z0-9._:-]{2,80}$/.test(model)) throw new ProviderError('model_unavailable');
  if (provider === 'anthropic') {
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    };
    if (structured) body.output_config = { format: { type: 'json_schema', schema: RESULT_SCHEMA } };
    const data = (await send(provider, ENDPOINTS.anthropic.messages, {
      method: 'POST',
      headers: anthropicHeaders(),
      body: JSON.stringify(body),
      signal,
    })) as { content?: { type: string; text?: string }[]; usage?: Usage; stop_reason?: string };
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text || '').join('');
    return { text, usage: data.usage || {}, truncated: data.stop_reason === 'max_tokens' };
  }
  // OpenAI Responses API — written from documentation, NOT tested (see INTEGRATION_STATUS).
  const body = {
    model,
    instructions: SYSTEM_PROMPT,
    input: userMessage,
    max_output_tokens: maxTokens,
    store: false,
    text: { format: { type: 'json_schema', name: 'meyar_result', schema: RESULT_SCHEMA, strict: true } },
  };
  const data = (await send(provider, ENDPOINTS.openai.responses, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal,
  })) as {
    output_text?: string;
    output?: { type: string; content?: { type: string; text?: string }[] }[];
    usage?: Usage;
    status?: string;
  };
  const text =
    data.output_text ||
    (data.output || [])
      .filter((o) => o.type === 'message')
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text || '')
      .join('');
  return { text, usage: data.usage || {}, truncated: data.status === 'incomplete' };
}

/** Free request that lists the models the key can use (explicit user action only). */
export async function listModels(provider: ProviderId, signal: AbortSignal): Promise<string[]> {
  if (!apiKey) throw new ProviderError('invalid_key');
  if (provider === 'anthropic') {
    const data = (await send(provider, ENDPOINTS.anthropic.models + '?limit=100', {
      headers: anthropicHeaders(),
      signal,
    })) as { data?: { id: string }[] };
    return (data.data || []).map((m) => m.id).filter((id) => /^[A-Za-z0-9._:-]+$/.test(id));
  }
  const data = (await send(provider, ENDPOINTS.openai.models, {
    headers: { authorization: `Bearer ${apiKey}` },
    signal,
  })) as { data?: { id: string }[] };
  return (data.data || [])
    .map((m) => m.id)
    .filter((id) => /^[A-Za-z0-9._:-]+$/.test(id))
    .sort();
}
