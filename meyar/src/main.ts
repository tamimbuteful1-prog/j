import './styles.css';
import { SearchIndex, sourceLabel } from './search';
import { buildManualPackage, buildPayload } from './prompt';
import {
  callModel,
  clearKey,
  ERROR_MESSAGES,
  hasKey,
  INTEGRATION_STATUS,
  KEY_PAGES,
  ProviderError,
  resolveModel,
  forgetModels,
  setKey,
  type ProviderCfg,
  type ProviderId,
} from './providers';
import { extractJson, InvalidOutputError, parseResult, verifyResult } from './verify';
import type { Classification, Corpus, Retrieval, Task, UserContext, VerifiedCitation, VerifiedResult } from './types';

// ------------------------------------------------------------------ helpers
type Child = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of children) if (c) el.append(c instanceof Node ? c : document.createTextNode(c)); // text only, never HTML
  return el;
}
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

async function copyText(text: string, btn: HTMLButtonElement) {
  const label = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h('textarea', {}, text);
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  btn.textContent = 'تم النسخ';
  setTimeout(() => (btn.textContent = label), 1800);
}

function copyButton(text: () => string, label: string): HTMLButtonElement {
  const b = h('button', { type: 'button', class: 'btn secondary small' }, label);
  b.addEventListener('click', () => copyText(text(), b));
  return b;
}

export const CLASS_LABELS: Record<Classification, string> = {
  no_conflict_found: 'لم يظهر تعارض في حدود المراجع المفحوصة',
  conflict_indicators: 'توجد مؤشرات تعارض',
  needs_more_info: 'يتطلب معلومات إضافية',
  insufficient_references: 'لا تكفي المراجع المتاحة للتقييم',
};

const CATEGORY_LABELS: Record<string, string> = {
  law: 'نظام',
  regulation: 'لائحة تنفيذية',
  organization: 'تنظيم واختصاصات جهة',
  guide: 'دليل أو معيار رسمي (تحتاج طبيعته الإلزامية تحديدًا)',
  report: 'تقرير قطاعي',
  lecture: 'محاضرة أو مادة تعليمية',
};

// ------------------------------------------------------------------ state
interface ModelsConfig {
  /** false = API path hidden; only the copy-to-assistant path is offered. */
  api_enabled?: boolean;
  anthropic: ProviderCfg;
  openai: ProviderCfg;
  limits: { max_input_chars: number; max_reference_chars: number; max_references: number };
}

const state = {
  provider: 'anthropic' as ProviderId,
  task: 'check' as Task,
  busy: false,
  controller: null as AbortController | null,
};

let corpus: Corpus;
let index: SearchIndex;
let cfg: ModelsConfig;

// ------------------------------------------------------------------ init
async function init() {
  const out = $('output');
  try {
    const [c, m] = await Promise.all([
      fetch('./data/corpus.json', { cache: 'no-cache' }).then((r) => r.json()),
      fetch('./config/models.json', { cache: 'no-cache' }).then((r) => r.json()),
    ]);
    corpus = c;
    cfg = m;
    index = new SearchIndex(corpus);
  } catch {
    out.replaceChildren(h('p', { class: 'alert bad' }, 'تعذّر تحميل ملفات المراجع أو الإعدادات. أعد تحميل الصفحة.'));
    return;
  }
  $<HTMLTextAreaElement>('user-text').maxLength = cfg.limits.max_input_chars;
  bindRadio('provider-group', 'provider', (v) => {
    state.provider = v as ProviderId;
    refresh();
  });
  bindRadio('task-group', 'task', (v) => {
    state.task = v as Task;
    refresh();
  });

  const keyInput = $<HTMLInputElement>('api-key');
  // The key is copied into module memory on input; nothing is sent until the user clicks run.
  keyInput.addEventListener('input', () => setKey(keyInput.value));
  $('toggle-key').addEventListener('click', (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    const show = keyInput.type === 'password';
    keyInput.type = show ? 'text' : 'password';
    b.textContent = show ? 'إخفاء' : 'إظهار';
    b.setAttribute('aria-pressed', String(show));
  });
  $('clear-key').addEventListener('click', () => {
    keyInput.value = '';
    clearKey();
    keyInput.type = 'password';
    $('toggle-key').textContent = 'إظهار';
    forgetModels();
    refresh();
    keyInput.focus();
  });
  // Belt and braces: wipe the field when the page is hidden for unload/bfcache.
  window.addEventListener('pagehide', () => {
    keyInput.value = '';
    clearKey();
  });

  const ta = $<HTMLTextAreaElement>('user-text');
  ta.addEventListener('input', updateCounter);
  $('run').addEventListener('click', onRun);
  $('cancel').addEventListener('click', () => state.controller?.abort());
  renderCoverage();
  refresh();
  updateCounter();
}

function bindRadio(groupId: string, attr: string, onChange: (v: string) => void) {
  const group = $(groupId);
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('button[role=radio]')];
  const select = (b: HTMLButtonElement) => {
    buttons.forEach((x) => {
      x.setAttribute('aria-checked', String(x === b));
      x.tabIndex = x === b ? 0 : -1;
    });
    onChange(b.dataset[attr]!);
  };
  buttons.forEach((b, i) => {
    b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (e) => {
      const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL
      if (!dir) return;
      e.preventDefault();
      const n = buttons[(i + dir + buttons.length) % buttons.length];
      n.focus();
      select(n);
    });
  });
}

const apiEnabled = () => cfg.api_enabled !== false;

function refresh() {
  const api = apiEnabled();
  $('api-card').hidden = !api;
  $('consent-box').hidden = !api;
  $('manual-intro').hidden = api;
  $('task-step').textContent = api ? '2' : '1';
  $('integration-status').textContent = INTEGRATION_STATUS[state.provider];
  const link = $<HTMLAnchorElement>('key-link');
  link.href = KEY_PAGES[state.provider];
  link.textContent = state.provider === 'openai' ? 'إنشاء مفتاح API لدى OpenAI' : 'إنشاء مفتاح API لدى Anthropic (Claude)';
  $('input-label').textContent =
    state.task === 'check' ? 'الصق النص الذي تنوي نشره' : 'اكتب سؤالك عن النشر أو المحتوى الإعلامي';
  $('run').textContent = !api ? 'جهّز الطلب والمراجع' : state.task === 'check' ? 'افحص النص' : 'أجب عن السؤال';
}

function updateCounter() {
  const ta = $<HTMLTextAreaElement>('user-text');
  const n = ta.value.length;
  const max = cfg?.limits.max_input_chars ?? 6000;
  const c = $('counter');
  c.textContent = `${n.toLocaleString('ar-SA')} / ${max.toLocaleString('ar-SA')} حرف`;
  c.classList.toggle('over', n > max);
}

function readContext(): UserContext {
  return {
    venue: $<HTMLSelectElement>('ctx-venue').value,
    ad: $<HTMLSelectElement>('ctx-ad').value,
    license: $<HTMLSelectElement>('ctx-license').value,
  };
}

function setBusy(b: boolean) {
  state.busy = b;
  const run = $<HTMLButtonElement>('run');
  run.disabled = b;
  run.setAttribute('aria-busy', String(b));
  $('cancel').hidden = !b;
  $('cancel-note').hidden = !b;
}

// ------------------------------------------------------------------ actions
function errorBox(e: unknown): HTMLElement {
  if (e instanceof ProviderError) {
    const extra = e.status ? ` (رمز الاستجابة ${e.status}${e.providerType ? '، النوع ' + e.providerType : ''})` : '';
    return h('div', { class: 'alert bad', role: 'alert' }, h('p', {}, ERROR_MESSAGES[e.kind] + extra));
  }
  if (e instanceof InvalidOutputError) return h('div', { class: 'alert bad', role: 'alert' }, ERROR_MESSAGES.unreadable);
  return h('div', { class: 'alert bad', role: 'alert' }, 'حدث خطأ غير متوقع.');
}

async function onRun() {
  if (state.busy) return; // no duplicate submissions while waiting
  const out = $('output');
  const text = $<HTMLTextAreaElement>('user-text').value.trim();
  const max = cfg.limits.max_input_chars;
  if (!text) {
    out.replaceChildren(h('p', { class: 'alert warn', role: 'alert' }, state.task === 'check' ? 'الصق النص أولًا.' : 'اكتب سؤالك أولًا.'));
    return;
  }
  if (text.length > max) {
    out.replaceChildren(h('p', { class: 'alert bad', role: 'alert' }, `تجاوز النص الحد المسموح (${max} حرف). اختصره ثم أعد المحاولة.`));
    return;
  }
  const ctx = readContext();
  const r = index.retrieve(state.task, text, ctx, cfg.limits.max_references, cfg.limits.max_reference_chars);

  if (!apiEnabled()) {
    renderManual(text, ctx, r);
    return;
  }
  if (!hasKey()) {
    out.replaceChildren(h('p', { class: 'alert warn', role: 'alert' }, 'أدخل مفتاح API أولًا.'));
    $('api-key').focus();
    return;
  }
  if (!$<HTMLInputElement>('consent').checked) {
    out.replaceChildren(h('p', { class: 'alert warn', role: 'alert' }, 'اقرأ تنبيه الإرسال وأكّد الموافقة قبل الإرسال.'));
    $('consent').focus();
    return;
  }
  if (r.matched === 0 && state.task === 'question') {
    // Nothing relevant in the references: do not spend a paid request by default.
    renderNoCoverage(text, ctx, r);
    return;
  }
  await sendToModel(text, ctx, r);
}

async function sendToModel(text: string, ctx: UserContext, r: Retrieval) {
  if (state.busy) return;
  const out = $('output');
  const pc = cfg[state.provider];
  const payload = buildPayload(corpus, state.task, text, ctx, r);
  setBusy(true);
  out.replaceChildren(h('p', { class: 'alert info' }, 'جارٍ إرسال الطلب إلى المزود وانتظار النتيجة… (طلب تحليل واحد)'));
  state.controller = new AbortController();
  const task = state.task;
  try {
    // The model is chosen automatically (see resolveModel); no user selection needed.
    const { model, structured } = await resolveModel(state.provider, pc, state.controller.signal);
    const res = await callModel(state.provider, model, payload, pc.max_output_tokens, structured, state.controller.signal);
    if (res.truncated) throw new ProviderError('unreadable');
    const parsed = parseResult(extractJson(res.text));
    const verified = verifyResult(parsed, r.items.map((i) => i.segment), text);
    renderResult(task, text, verified, r, res.usage, model);
  } catch (e) {
    out.replaceChildren(errorBox(e), referencesBlock(r, 'المراجع التي جُهّزت لهذا الطلب'));
  } finally {
    state.controller = null;
    setBusy(false);
  }
}

// ------------------------------------------------------------------ rendering
function docTitle(id: string) {
  return corpus.documents.find((d) => d.id === id)?.title || id;
}
function pdfLink(segDoc: string, page: number, label = 'فتح الصفحة في الوثيقة الأصلية') {
  const d = corpus.documents.find((x) => x.id === segDoc)!;
  return h('a', { href: `./${d.file}#page=${page}`, target: '_blank', rel: 'noopener' }, label);
}

function citationBlock(c: VerifiedCitation): HTMLElement {
  const s = c.segment;
  return h(
    'div',
    { class: 'citation' },
    h('div', { class: 'cite-meta' }, sourceLabel(s, docTitle(s.doc)), ' — ', pdfLink(s.doc, s.page_start)),
    h('blockquote', { class: 'source' }, c.quote),
  );
}

function referencesBlock(r: Retrieval, title = 'المراجع التي أُرسلت مع الطلب'): HTMLElement {
  const reasons: Record<string, string> = {
    match: 'مطابقة بحثية',
    baseline: 'ضوابط المحتوى العامة (تُضمَّن دائمًا في فحص النص)',
    reference: 'مادة محال إليها',
    definitions: 'تعريفات',
  };
  return h(
    'div',
    { class: 'card reflist' },
    h('h3', {}, `${title} (${r.items.length})`),
    h('p', { class: 'hint' }, 'اختيرت هذه المقاطع بالبحث المحلي داخل المراجع، وقد لا يسترجع البحث كل مادة ذات صلة.'),
    ...r.items.map((it) => {
      const s = it.segment;
      return h(
        'details',
        {},
        h('summary', {}, sourceLabel(s, docTitle(s.doc)), h('span', { class: 'tag' }, reasons[it.reason])),
        s.chapter ? h('p', { class: 'hint' }, s.chapter) : null,
        s.lead ? h('p', { class: 'reftext' }, 'مطلع المادة: ' + s.lead) : null,
        h('p', { class: 'reftext' }, s.text),
        h('p', {}, pdfLink(s.doc, s.page_start)),
      );
    }),
  );
}

function renderNoCoverage(text: string, ctx: UserContext, r: Retrieval) {
  const out = $('output');
  const send = h('button', { type: 'button', class: 'btn secondary' }, 'أرسل إلى المزود رغم ذلك');
  send.addEventListener('click', () => sendToModel(text, ctx, r));
  out.replaceChildren(
    h(
      'div',
      { class: 'card' },
      h('span', { class: 'verdict insufficient_references' }, CLASS_LABELS.insufficient_references),
      h('p', {}, 'لم يعثر البحث المحلي على مقاطع ذات صلة كافية في المراجع المتاحة، لذلك لم يُرسل أي طلب مدفوع.'),
      h('p', { class: 'hint' }, 'هذه النتيجة صادرة عن البحث المحلي في معيار وليست تحليلًا من نموذج ذكاء اصطناعي. عدم العثور على نص لا يعني أن التصرف مسموح أو متوافق؛ قد يكون الموضوع خارج نطاق المراجع الستة، أو يحتاج صياغة مختلفة للسؤال، أو مراجعة أوسع.'),
      h('div', { class: 'actions' }, send),
    ),
  );
}

function renderManual(text: string, ctx: UserContext, r: Retrieval) {
  const out = $('output');
  const pkg = buildManualPackage(corpus, state.task, text, ctx, r);
  out.replaceChildren(
    h(
      'div',
      { class: 'card' },
      h('h3', {}, 'الطلب جاهز للنسخ'),
      r.matched === 0
        ? h('p', { class: 'alert warn' }, 'تنبيه: لم يعثر البحث المحلي على مقاطع مطابقة كافية. قد يكون الموضوع خارج نطاق المراجع المتاحة.')
        : r.weak
          ? h('p', { class: 'alert warn' }, 'تنبيه: تطابق البحث مع المراجع ضعيف؛ قد تكون المراجع غير كافية.')
          : null,
      h('p', {}, 'الصق الطلب داخل مساعدك. ستظهر الإجابة هناك، ويخضع الاستخدام لحدود حسابك وخطتك.'),
      h('p', { class: 'hint' }, 'لا يرتبط معيار بحسابك لدى أي مساعد، ولا ينقل الملفات ولا يعيد الإجابة إلى هذه الصفحة. لا يُضاف نصك إلى أي رابط.'),
      h(
        'div',
        { class: 'actions' },
        copyButton(() => pkg, 'نسخ الطلب والمراجع'),
        h('a', { class: 'btn secondary', href: 'https://chatgpt.com/', target: '_blank', rel: 'noopener noreferrer' }, 'فتح ChatGPT'),
        h('a', { class: 'btn secondary', href: 'https://claude.ai/new', target: '_blank', rel: 'noopener noreferrer' }, 'فتح Claude'),
      ),
      h('details', {}, h('summary', {}, 'مراجعة نص الطلب قبل النسخ'), h('pre', { class: 'package' }, pkg)),
    ),
    referencesBlock(r, 'المراجع المضمّنة في الطلب'),
  );
}

function reportText(task: Task, userText: string, v: VerifiedResult, model: string): string {
  const L: string[] = [];
  const cls = v.classificationSupported ? v.raw.classification : 'needs_more_info';
  L.push('تقرير معيار — تقييم مساعد وفق المراجع المعروضة، وليس حكمًا قانونيًا نهائيًا');
  L.push(`النموذج: ${model}`);
  L.push(`النتيجة: ${CLASS_LABELS[cls]}`);
  L.push('');
  L.push(task === 'check' ? 'النص المفحوص:' : 'السؤال:');
  L.push(userText);
  L.push('');
  L.push('الخلاصة: ' + v.raw.summary);
  if (task === 'question' && v.raw.direct_answer) L.push('الإجابة: ' + v.raw.direct_answer);
  const cite = (c: VerifiedCitation) => `  - ${sourceLabel(c.segment, docTitle(c.segment.doc))}\n    «${c.quote}»`;
  v.findings.forEach((f, i) => {
    L.push('');
    L.push(`ملاحظة ${i + 1}${f.citations.length ? '' : ' (غير مستندة إلى استشهاد صالح)'}`);
    if (f.user_excerpt) L.push('العبارة: ' + f.user_excerpt);
    L.push('السبب: ' + f.issue);
    f.citations.forEach((c) => L.push(cite(c)));
    L.push('تفسير الارتباط: ' + f.interpretation);
    if (f.suggested_rewrite) L.push('صياغة بديلة مقترحة: ' + f.suggested_rewrite);
  });
  if (v.conditions.length) {
    L.push('');
    L.push('الشروط والاستثناءات:');
    v.conditions.forEach((c) => {
      L.push('- ' + c.text);
      c.citations.forEach((x) => L.push(cite(x)));
    });
  }
  if (v.raw.unresolved.length) L.push('', 'ما لم يمكن حسمه:', ...v.raw.unresolved.map((x) => '- ' + x));
  if (v.raw.missing_information.length) L.push('', 'معلومات ناقصة:', ...v.raw.missing_information.map((x) => '- ' + x));
  L.push('', 'حدود التقييم: ' + v.raw.limitations);
  L.push('المراجع: نسخ لم تتحقق حداثتها؛ البحث قد لا يسترجع كل مادة ذات صلة.');
  return L.join('\n');
}

function renderResult(
  task: Task,
  userText: string,
  v: VerifiedResult,
  r: Retrieval,
  usage: { input_tokens?: number; output_tokens?: number },
  model: string,
) {
  const out = $('output');
  const res = v.raw;
  const cls: Classification = v.classificationSupported ? res.classification : 'needs_more_info';
  const blocks: Child[] = [];
  blocks.push(h('span', { class: `verdict ${cls}` }, CLASS_LABELS[cls]));
  if (!v.classificationSupported)
    blocks.push(
      h('p', { class: 'alert bad' }, 'أعاد النموذج تصنيف «توجد مؤشرات تعارض» دون أي استشهاد صالح من المراجع المرسلة، فلا يُعرض بوصفه مستندًا إلى مرجع.'),
    );
  if (v.invalidCount)
    blocks.push(
      h('p', { class: 'alert warn' }, `استُبعد ${v.invalidCount} استشهادًا غير صالح (معرّف غير موجود في المقاطع المرسلة أو مقتطف لا يطابق نص المصدر).`),
    );
  blocks.push(h('div', { class: 'kv' }, h('b', {}, 'الخلاصة'), res.summary));
  if (task === 'question' && res.direct_answer) blocks.push(h('div', { class: 'kv' }, h('b', {}, 'الإجابة المباشرة'), res.direct_answer));

  if (v.findings.length) {
    blocks.push(h('h3', {}, task === 'check' ? 'الملاحظات' : 'الأدلة'));
    v.findings.forEach((f, i) => {
      const supported = f.citations.length > 0;
      blocks.push(
        h(
          'div',
          { class: 'finding' + (supported ? '' : ' unsupported') },
          h('b', {}, `ملاحظة ${i + 1}`),
          supported ? null : h('span', { class: 'tag bad' }, 'غير مستندة إلى استشهاد صالح'),
          f.user_excerpt
            ? h(
                'div',
                { class: 'kv' },
                h('b', {}, 'العبارة محل الملاحظة'),
                h('span', { class: 'excerpt' }, f.user_excerpt),
                f.excerpt_found ? null : h('span', { class: 'tag bad' }, 'لم تُعثر على العبارة حرفيًا في نصك'),
              )
            : null,
          h('div', { class: 'kv' }, h('b', {}, 'سبب الملاحظة'), f.issue),
          supported ? h('div', { class: 'kv' }, h('b', {}, 'المصدر والمقتطف الأصلي'), ...f.citations.map(citationBlock)) : null,
          h('div', { class: 'kv' }, h('b', {}, supported ? 'تفسير ارتباطه بالنص (تفسير النموذج)' : 'رأي النموذج (دون سند صالح)'), f.interpretation),
          f.suggested_rewrite
            ? h(
                'div',
                { class: 'kv' },
                h('b', {}, 'صياغة بديلة مقترحة'),
                h('div', { class: 'rewrite' }, f.suggested_rewrite),
                copyButton(() => f.suggested_rewrite || '', 'نسخ الصياغة البديلة'),
              )
            : null,
        ),
      );
    });
  }
  if (v.conditions.length) {
    blocks.push(h('h3', {}, 'الشروط والاستثناءات ذات الصلة'));
    for (const c of v.conditions)
      blocks.push(
        h(
          'div',
          { class: 'finding' + (c.citations.length ? '' : ' unsupported') },
          h('p', {}, c.text),
          c.citations.length ? null : h('span', { class: 'tag bad' }, 'غير مستند إلى استشهاد صالح'),
          ...c.citations.map(citationBlock),
        ),
      );
  }
  if (res.unresolved.length) blocks.push(h('h3', {}, 'ما لم يمكن حسمه'), h('ul', {}, ...res.unresolved.map((x) => h('li', {}, x))));
  if (res.missing_information.length)
    blocks.push(h('h3', {}, 'معلومات ناقصة'), h('ul', {}, ...res.missing_information.map((x) => h('li', {}, x))));
  blocks.push(h('h3', {}, 'حدود التقييم'), h('p', {}, res.limitations));
  blocks.push(
    h(
      'p',
      { class: 'hint' },
      'فحص معيار يتحقق آليًا من أن كل استشهاد يشير إلى مقطع أُرسل فعلًا وأن المقتطف موجود حرفيًا فيه، وأن رقم المادة والصفحة مأخوذان من قاعدة المراجع. هذا لا يثبت صحة تفسير النموذج.',
    ),
  );
  if (r.weak) blocks.push(h('p', { class: 'alert warn' }, 'تطابق البحث المحلي مع المراجع كان ضعيفًا لهذا المدخل؛ قد تكون المراجع المرسلة غير كافية.'));
  const u: string[] = [];
  if (usage.input_tokens !== undefined) u.push(`توكنز الإدخال: ${usage.input_tokens.toLocaleString('ar-SA')}`);
  if (usage.output_tokens !== undefined) u.push(`توكنز الإخراج: ${usage.output_tokens.toLocaleString('ar-SA')}`);
  if (u.length) blocks.push(h('p', { class: 'usage' }, `الاستهلاك كما أعاده المزود — ${u.join(' — ')}. لا يعرض معيار تكلفة نقدية لعدم توفر بيانات تسعير محدثة.`));
  blocks.push(h('div', { class: 'actions' }, copyButton(() => reportText(task, userText, v, model), 'نسخ التقرير')));
  out.replaceChildren(h('div', { class: 'card' }, h('h2', {}, 'النتيجة'), ...blocks), referencesBlock(r));
  out.querySelector('h2')?.setAttribute('tabindex', '-1');
  (out.querySelector('h2') as HTMLElement | null)?.focus();
}

function renderCoverage() {
  const box = $('coverage');
  const rows = corpus.documents.map((d) =>
    h(
      'tr',
      {},
      h('td', {}, h('b', {}, d.title), h('div', { class: 'hint' }, d.issuer)),
      h('td', {}, CATEGORY_LABELS[d.category] || d.category),
      h('td', {}, d.version),
      h(
        'td',
        {},
        h('span', { class: 'badge' }, d.currency === 'verified' ? 'متحقق من الحداثة' : 'لم تتحقق حداثة هذه النسخة'),
        h('div', { class: 'hint' }, d.currency_note),
        h('div', { class: 'hint' }, `آخر مراجعة: ${d.reviewed_on}`),
      ),
      h(
        'td',
        {},
        `${d.articles ? d.articles + ' مادة' : 'بلا ترقيم مواد'} — ${d.segments} مقطعًا`,
        h('div', {}, pdfLink(d.id, 1, 'الملف الأصلي (PDF)')),
        h('details', {}, h('summary', {}, 'ملاحظات الاستخراج'), h('p', { class: 'hint' }, d.extraction), h('p', { class: 'hint', dir: 'ltr' }, 'SHA-256: ' + d.sha256)),
      ),
    ),
  );
  box.replaceChildren(
    h(
      'p',
      {},
      'نطاق التقييم في معيار هو هذه المراجع فقط، وليس جميع الأنظمة السعودية. لم نتمكن من مقارنة أي نسخة بمصدر رسمي حديث، لذلك لا تُوصف أي منها بأنها أحدث نسخة نافذة.',
    ),
    h('ul', {}, ...corpus.documents.map((d) => h('li', {}, `${d.title} — ${CATEGORY_LABELS[d.category] || d.category} — `, h('span', { class: 'badge' }, 'لم تتحقق حداثة هذه النسخة')))),
    h('details', { class: 'explain' }, h('summary', {}, 'تفاصيل الوثائق وحالة مراجعتها والملفات المستبعدة'),
    h(
      'table',
      { class: 'docs' },
      h('thead', {}, h('tr', {}, h('th', {}, 'الوثيقة'), h('th', {}, 'النوع'), h('th', {}, 'الإصدار'), h('th', {}, 'حالة الحداثة'), h('th', {}, 'التغطية'))),
      h('tbody', {}, ...rows),
    ),
    h('h3', {}, 'ملفات مستبعدة من الاستشهاد النظامي'),
    h(
      'ul',
      {},
      ...corpus.excluded.map((x) => h('li', {}, `${x.file} — ${CATEGORY_LABELS[x.category] || x.category}: ${x.reason}`)),
    )),
  );
}

init();
