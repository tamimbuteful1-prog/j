import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource-variable/alexandria/wght.css';
import '@fontsource/aref-ruqaa/arabic-400.css';
import './styles.css';
import { SearchIndex, sourceLabel } from './search';
import { mountBoard } from './board';
import { initVideos } from './videos';
import { buildPayload, SYSTEM_PROMPT } from './prompt';
import { buildAssistantPrompt } from './assistantPrompt';
import {
  callModel,
  clearKey,
  ERROR_MESSAGES,
  hasKey,
  KEY_PAGES,
  ProviderError,
  resolveModel,
  forgetModels,
  setKey,
  type ProviderCfg,
  type ProviderId,
} from './providers';
import { estimateCost, formatSar, formatTokens, type EstimateCfg, type PricedModel } from './cost';
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
const SVG_NS = 'http://www.w3.org/2000/svg';
function s(tag: string, attrs: Record<string, string | number> = {}, ...children: Node[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...children);
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
  btn.textContent = 'تم النسخ ✓';
  setTimeout(() => (btn.textContent = label), 1800);
}

function copyButton(text: () => string, label: string, cls = 'btn btn-quiet small'): HTMLButtonElement {
  const b = h('button', { type: 'button', class: cls }, label);
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

const PROVIDER_NAMES: Record<ProviderId, string> = { anthropic: 'Anthropic (Claude)', openai: 'OpenAI' };

// ------------------------------------------------------------------ state
interface ModelsConfig {
  checked_on: string;
  anthropic: ProviderCfg;
  openai: ProviderCfg;
  limits: { max_input_chars: number; max_reference_chars: number; max_references: number };
  currency: { usd_to_sar: number; note: string };
  estimate: EstimateCfg;
}

const state = {
  provider: 'anthropic' as ProviderId,
  task: 'check' as Task,
  busy: false,
  controller: null as AbortController | null,
  /** model the latest on-screen estimate was computed for */
  estimatedModel: null as string | null,
};

let corpus: Corpus;
let index: SearchIndex;
let cfg: ModelsConfig;
let resolveReady: () => void;
const ready = new Promise<void>((r) => (resolveReady = r));
/** Models chosen this session (shown in the estimate after the first run). */
const chosenModel: Partial<Record<ProviderId, string>> = {};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ------------------------------------------------------------------ page chrome (no data needed)
function initChrome() {
  const root = document.documentElement;
  root.classList.add('js');
  if (reduced) root.classList.add('reduced');

  // nav: solid after the hero, inverted over the dark stage
  const nav = $('nav');
  const stage = $('anatomy');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    nav.classList.toggle('scrolled', window.scrollY > 40);
    const r = stage.getBoundingClientRect();
    nav.classList.toggle('on-dark', r.top < 60 && r.bottom > 60 + window.innerHeight * 0.15);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  // reveal on scroll (content is visible without JS and with reduced motion)
  const items = [...document.querySelectorAll<HTMLElement>('.reveal')];
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    items.forEach((el) => {
      // stagger siblings slightly
      const sib = [...(el.parentElement?.children || [])].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--d', `${Math.min(sib.indexOf(el), 4) * 0.08}s`);
      io.observe(el);
    });
  }

  // in-page links: move focus to the target section for keyboard and screen-reader users
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', () => {
      const t = document.getElementById(a.hash.slice(1));
      if (t && t.tabIndex === -1) setTimeout(() => t.focus({ preventScroll: true }), reduced ? 0 : 450);
    }),
  );

  // portrait: if the photo is missing, show the monogram instead of a broken image
  const photo = $<HTMLImageElement>('tamim-photo');
  if (photo) {
    const fig = photo.closest('figure')!;
    const fail = () => fig.classList.add('no-photo');
    photo.addEventListener('error', fail);
    if (photo.complete && photo.naturalWidth === 0) fail();
  }
}

// ------------------------------------------------------------------ 3D gauge (lazy, optional)
function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function initGauge() {
  const params = new URLSearchParams(location.search);
  if (params.has('no3d') || !webglAvailable()) return; // posters stay; the site works the same
  const canvas = $<HTMLCanvasElement>('gauge-canvas');
  const lite = matchMedia('(max-width: 760px), (pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  try {
    const [{ createGauge }, { startMotion }] = await Promise.all([import('./gauge/scene'), import('./gauge/motion')]);
    const gauge = await createGauge(canvas, { lite });
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      document.documentElement.classList.remove('gl-ready', 'has-motion');
    });
    if (!reduced) document.documentElement.classList.add('has-motion');
    startMotion(gauge, canvas, { reduced, lite });
    requestAnimationFrame(() => document.documentElement.classList.add('gl-ready'));
    // used by scripts/make-poster.cjs to export the fallback image from the real model
    (window as unknown as { __meyarSnapshot?: (n: number) => string }).__meyarSnapshot = (n) => gauge.snapshot(n);
  } catch {
    document.documentElement.classList.remove('gl-ready', 'has-motion');
  }
}

// ------------------------------------------------------------------ data
async function init() {
  initChrome();
  mountBoard(reduced);
  initVideos();
  bindStaticTools();
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as Window).requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 300);
  idle(() => void initGauge());

  try {
    const [c, m] = await Promise.all([
      fetch('./data/corpus.json', { cache: 'no-cache' }).then((r) => r.json()),
      fetch('./config/models.json', { cache: 'no-cache' }).then((r) => r.json()),
    ]);
    corpus = c;
    cfg = m;
    index = new SearchIndex(corpus);
  } catch {
    $('output').replaceChildren(notice('bad', 'تعذّر تحميل ملفات المراجع أو الإعدادات. أعد تحميل الصفحة.'));
    $('coverage').replaceChildren(h('p', { class: 'hint' }, 'تعذّر تحميل بيانات المراجع.'));
    return;
  }
  $<HTMLTextAreaElement>('user-text').maxLength = cfg.limits.max_input_chars;
  $('prompt-text').textContent = buildAssistantPrompt(corpus.documents);
  resolveReady();
  renderCoverage();
  refresh();
  updateCounter();
  scheduleEstimate();
}

/** Controls that must respond immediately, before any data or 3D has loaded. */
function bindStaticTools() {
  bindRadio('provider-group', 'provider', (v) => {
    state.provider = v as ProviderId;
    refresh();
    scheduleEstimate();
  });
  bindRadio('task-group', 'task', (v) => {
    state.task = v as Task;
    refresh();
    scheduleEstimate();
  });

  const keyInput = $<HTMLInputElement>('api-key');
  const toggle = $<HTMLButtonElement>('toggle-key');
  // The key is copied into module memory on input; nothing is sent until the user clicks run.
  keyInput.addEventListener('input', () => setKey(keyInput.value));
  toggle.addEventListener('click', () => {
    const show = keyInput.type === 'password';
    keyInput.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? 'إخفاء المفتاح' : 'إظهار المفتاح');
    toggle.title = show ? 'إخفاء المفتاح' : 'إظهار المفتاح';
  });
  $('clear-key').addEventListener('click', () => {
    keyInput.value = '';
    clearKey();
    keyInput.type = 'password';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'إظهار المفتاح');
    forgetModels();
    delete chosenModel.anthropic;
    delete chosenModel.openai;
    scheduleEstimate();
    keyInput.focus();
  });
  // Belt and braces: wipe the field when the page is hidden for unload/bfcache.
  window.addEventListener('pagehide', () => {
    keyInput.value = '';
    clearKey();
  });

  const ta = $<HTMLTextAreaElement>('user-text');
  ta.addEventListener('input', () => {
    updateCounter();
    scheduleEstimate();
  });
  for (const id of ['ctx-venue', 'ctx-ad', 'ctx-license']) $(id).addEventListener('change', scheduleEstimate);
  $('run').addEventListener('click', onRun);
  $('cancel').addEventListener('click', () => state.controller?.abort());

  const copyPrompt = $<HTMLButtonElement>('copy-prompt');
  copyPrompt.addEventListener('click', async () => {
    let text = $('prompt-text').textContent || '';
    if (!text) {
      // data still loading: use the generated file shipped with the site
      try {
        text = await fetch('./prompt.txt', { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : ''));
      } catch {
        text = '';
      }
    }
    if (text) copyText(text.trim(), copyPrompt);
  });
  // show the ZIP size (same-origin HEAD request; free)
  fetch('./miyaar-references.zip', { method: 'HEAD', cache: 'no-cache' })
    .then((r) => {
      const n = Number(r.headers.get('content-length'));
      if (r.ok && n > 0)
        $('zip-meta').textContent = `ستة ملفات PDF والبرومبت في ملف واحد (${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n / 1048576)} م.ب تقريبًا).`;
    })
    .catch(() => undefined);
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

function refresh() {
  const link = $<HTMLAnchorElement>('key-link');
  link.href = KEY_PAGES[state.provider];
  link.textContent = state.provider === 'openai' ? 'أنشئ مفتاحًا لدى OpenAI' : 'أنشئ مفتاحًا لدى Anthropic';
  $('input-label').textContent =
    state.task === 'check' ? 'الصق النص الذي تنوي نشره' : 'اكتب سؤالك عن النشر أو المحتوى الإعلامي';
  $<HTMLTextAreaElement>('user-text').placeholder =
    state.task === 'check' ? 'اكتب أو الصق النص هنا…' : 'مثال: هل أحتاج إلى ترخيص لنشر بودكاست؟';
  $('run').textContent = state.task === 'check' ? 'افحص النص' : 'اسأل معيار';
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

// ------------------------------------------------------------------ cost estimate
function modelInfo(provider: ProviderId, id: string | null): PricedModel | null {
  if (!id) return null;
  return cfg[provider].models.find((m) => m.id === id) ?? { id, label: id, structured_output: false };
}

let estTimer = 0;
function scheduleEstimate() {
  clearTimeout(estTimer);
  estTimer = window.setTimeout(renderEstimate, 220);
}

/** The exact request text that would be sent (system prompt + data payload). */
function fullRequest(text: string, ctx: UserContext, r: Retrieval) {
  return SYSTEM_PROMPT + buildPayload(corpus, state.task, text, ctx, r);
}

function estimateBlock(provider: ProviderId, modelId: string | null, full: string, title = 'التكلفة التقديرية'): HTMLElement {
  const pc = cfg[provider];
  const model = modelInfo(provider, modelId);
  const e = estimateCost(full, model, pc.max_output_tokens, cfg.estimate, cfg.currency.usd_to_sar);
  const value = e.sar
    ? `${formatSar(e.sar[0])} – ${formatSar(e.sar[1])} ريال`
    : 'لا يتوفر سعر موثق لهذا النموذج';
  const priced = !!model?.price_usd_per_mtok;
  const p = model?.price_usd_per_mtok;
  return h(
    'div',
    {},
    h('div', { class: 'est-line' }, h('span', { class: 'est-label' }, title + ':'), h('span', { class: 'est-value' }, value)),
    h(
      'details',
      { class: 'more' },
      h('summary', {}, 'كيف حُسب التقدير؟'),
      h(
        'div',
        { class: 'more-body' },
        h(
          'dl',
          {},
          h('dt', {}, 'النموذج'),
          h('dd', { dir: 'ltr', class: 'ltr-r' }, model ? model.id : provider === 'openai' ? 'يُحدَّد من حسابك عند الإرسال' : '—'),
          h('dt', {}, 'حجم الطلب'),
          h('dd', {}, `${formatTokens(e.inputTokens[0])} – ${formatTokens(e.inputTokens[1])} توكن تقريبًا (التعليمات والنص والمراجع المختارة)`),
          h('dt', {}, 'المخرجات'),
          h('dd', {}, `${formatTokens(e.outputTokens[0])} – ${formatTokens(e.outputTokens[1])} توكن (الحد الأقصى المسموح، ويشمل التفكير)`),
          priced && p ? h('dt', {}, 'السعر') : null,
          priced && p ? h('dd', {}, `${p.input} دولار لكل مليون توكن إدخال، و${p.output} لكل مليون توكن إخراج`) : null,
          h('dt', {}, 'تاريخ الأسعار'),
          h('dd', {}, pc.pricing?.checked_on ? `${pc.pricing.checked_on} من صفحة الأسعار الرسمية` : 'لم تُوثّق بعد'),
        ),
        h(
          'p',
          { class: 'hint' },
          `تقدير وليس فاتورة: عدد التوكنز الفعلي يحدده المزود، وتكلفة الفشل أو الإلغاء قد تُحتسب. التحويل بسعر ${cfg.currency.usd_to_sar} ريال للدولار.`,
          !priced && pc.pricing ? ' ' + pc.pricing.note : '',
        ),
        pc.pricing ? h('a', { href: pc.pricing.source, target: '_blank', rel: 'noopener noreferrer', class: 'text-link' }, 'صفحة الأسعار لدى المزود') : null,
      ),
    ),
  );
}

function renderEstimate() {
  const box = $('estimate');
  if (!cfg) return;
  const text = $<HTMLTextAreaElement>('user-text').value.trim();
  if (!text) {
    state.estimatedModel = null;
    box.replaceChildren(h('span', { class: 'hint' }, 'يظهر تقدير التكلفة بالريال بعد كتابة النص.'));
    return;
  }
  const ctx = readContext();
  const r = index.retrieve(state.task, text, ctx, cfg.limits.max_references, cfg.limits.max_reference_chars);
  const modelId = chosenModel[state.provider] ?? cfg[state.provider].default;
  state.estimatedModel = modelId;
  if (state.task === 'question' && r.matched === 0) {
    box.replaceChildren(
      h('span', { class: 'hint' }, 'لم يجد البحث المحلي مراجع مطابقة؛ لن يُرسل طلب مدفوع إلا إذا اخترت ذلك صراحة.'),
    );
    return;
  }
  box.replaceChildren(estimateBlock(state.provider, modelId, fullRequest(text, ctx, r)));
}

// ------------------------------------------------------------------ actions
function notice(kind: 'bad' | 'warn' | 'info', ...children: Child[]): HTMLElement {
  return h('div', { class: `notice ${kind}`, role: kind === 'info' ? 'status' : 'alert' }, ...children.map((c) => (typeof c === 'string' ? h('p', {}, c) : c)));
}

function setBusy(b: boolean) {
  state.busy = b;
  const run = $<HTMLButtonElement>('run');
  run.disabled = b;
  run.setAttribute('aria-busy', String(b));
  $('cancel').hidden = !b;
  $('cancel-note').hidden = !b;
}

function errorBox(e: unknown): HTMLElement {
  if (e instanceof ProviderError) {
    const extra = e.status ? ` (رمز الاستجابة ${e.status}${e.providerType ? '، النوع ' + e.providerType : ''})` : '';
    return notice('bad', ERROR_MESSAGES[e.kind] + extra);
  }
  if (e instanceof InvalidOutputError) return notice('bad', ERROR_MESSAGES.unreadable);
  return notice('bad', 'حدث خطأ غير متوقع.');
}

async function onRun() {
  if (state.busy) return; // no duplicate submissions while waiting
  await ready;
  const out = $('output');
  const text = $<HTMLTextAreaElement>('user-text').value.trim();
  const max = cfg.limits.max_input_chars;
  if (!text) {
    out.replaceChildren(notice('warn', state.task === 'check' ? 'الصق النص أولًا.' : 'اكتب سؤالك أولًا.'));
    $('user-text').focus();
    return;
  }
  if (text.length > max) {
    out.replaceChildren(notice('bad', `تجاوز النص الحد المسموح (${max.toLocaleString('ar-SA')} حرف). اختصره ثم أعد المحاولة.`));
    return;
  }
  if (!hasKey()) {
    out.replaceChildren(notice('warn', 'أدخل مفتاح API أولًا.'));
    $('api-key').focus();
    return;
  }
  if (!$<HTMLInputElement>('consent').checked) {
    out.replaceChildren(notice('warn', 'أكّد الموافقة على الإرسال أولًا.'));
    $('consent').focus();
    return;
  }
  const ctx = readContext();
  const r = index.retrieve(state.task, text, ctx, cfg.limits.max_references, cfg.limits.max_reference_chars);
  if (r.matched === 0 && state.task === 'question') {
    // Nothing relevant in the references: do not spend a paid request by default.
    renderNoCoverage(text, ctx, r);
    return;
  }
  await sendToModel(text, ctx, r, state.estimatedModel);
}

function loadingBox(msg: string): HTMLElement {
  const spinner = s('svg', { class: 'spinner', viewBox: '0 0 40 40', 'aria-hidden': 'true' }, s('circle', { cx: 20, cy: 20, r: 16 }), s('path', { d: 'M20 4a16 16 0 0 1 16 16' }));
  return h('div', { class: 'notice info loading', role: 'status' }, spinner as unknown as Node, h('p', {}, msg));
}

/**
 * One explicit click = at most one paid request. The free model listing runs
 * first; if it picks a different model than the one the estimate was shown
 * for, the user sees a fresh estimate and must confirm before anything is paid.
 */
async function sendToModel(text: string, ctx: UserContext, r: Retrieval, approvedModel: string | null) {
  if (state.busy) return;
  const out = $('output');
  const provider = state.provider;
  const pc = cfg[provider];
  const payload = buildPayload(corpus, state.task, text, ctx, r);
  const task = state.task;
  setBusy(true);
  out.replaceChildren(loadingBox('يتحقق من النموذج المتاح لحسابك… (طلب مجاني لقائمة النماذج)'));
  state.controller = new AbortController();
  try {
    const { model, structured } = await resolveModel(provider, pc, state.controller.signal);
    chosenModel[provider] = model;
    if (model !== approvedModel) {
      // Different (or unknown) model than the estimate: stop and ask.
      const go = h('button', { type: 'button', class: 'btn btn-primary small' }, 'تابع الإرسال');
      go.addEventListener('click', () => sendToModel(text, ctx, r, model));
      out.replaceChildren(
        notice(
          'warn',
          h('p', {}, `اختار معيار النموذج ${model} من النماذج المتاحة لحسابك. راجع التقدير المحدّث قبل الإرسال:`),
          estimateBlock(provider, model, SYSTEM_PROMPT + payload, 'التقدير المحدّث'),
          h('div', { class: 'actions' }, go),
        ),
      );
      scheduleEstimate();
      return;
    }
    out.replaceChildren(loadingBox('أُرسل طلب التحليل، وننتظر النتيجة… (طلب تحليل واحد)'));
    const res = await callModel(provider, model, payload, pc.max_output_tokens, structured, state.controller.signal, pc.effort);
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
function pdfLink(segDoc: string, page: number, label = 'فتح الصفحة في الملف الأصلي') {
  const d = corpus.documents.find((x) => x.id === segDoc)!;
  return h('a', { href: `./${d.file}#page=${page}`, target: '_blank', rel: 'noopener' }, label);
}

function citationBlock(c: VerifiedCitation): HTMLElement {
  const s2 = c.segment;
  return h(
    'div',
    { class: 'citation' },
    h('div', { class: 'cite-meta' }, sourceLabel(s2, docTitle(s2.doc)), ' · ', pdfLink(s2.doc, s2.page_start)),
    h('blockquote', { class: 'source' }, c.quote),
  );
}

function referencesBlock(r: Retrieval, title = 'المراجع التي أُرسلت مع الطلب'): HTMLElement {
  const reasons: Record<string, string> = {
    match: 'مطابقة بحثية',
    baseline: 'ضوابط عامة',
    reference: 'مادة محال إليها',
    definitions: 'تعريفات',
  };
  return h(
    'details',
    { class: 'more reflist' },
    h('summary', {}, `${title} (${r.items.length.toLocaleString('ar-SA')})`),
    h(
      'div',
      { class: 'more-body' },
      h('p', { class: 'hint' }, 'اختيرت بالبحث المحلي داخل المراجع، وقد لا يسترجع البحث كل مادة ذات صلة.'),
      ...r.items.map((it) => {
        const sg = it.segment;
        return h(
          'details',
          {},
          h('summary', {}, sourceLabel(sg, docTitle(sg.doc)), h('span', { class: 'tag' }, reasons[it.reason])),
          sg.chapter ? h('p', { class: 'hint' }, sg.chapter) : null,
          sg.lead ? h('p', { class: 'reftext' }, 'مطلع المادة: ' + sg.lead) : null,
          h('p', { class: 'reftext' }, sg.text),
          h('p', {}, pdfLink(sg.doc, sg.page_start)),
        );
      }),
    ),
  );
}

/** Small 2D gauge for a verdict. It reflects the verified classification only. */
function verdictGauge(cls: Classification): SVGElement {
  const P = (a: number, r: number) => [50 + Math.cos((a * Math.PI) / 180) * r, 54 - Math.sin((a * Math.PI) / 180) * r];
  const arc = (a0: number, a1: number, color: string) => {
    const [x0, y0] = P(a0, 38);
    const [x1, y1] = P(a1, 38);
    return s('path', { d: `M${x0} ${y0} A38 38 0 0 0 ${x1} ${y1}`, stroke: color, 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' });
  };
  const angle = { no_conflict_found: 9, needs_more_info: 90, insufficient_references: 90, conflict_indicators: 171 }[cls];
  const [nx, ny] = P(angle, 30);
  const dim = cls === 'insufficient_references';
  return s(
    'svg',
    { viewBox: '0 0 100 100', 'aria-hidden': 'true' },
    s('circle', { cx: 50, cy: 54, r: 46, fill: '#221f1c' }),
    arc(-24, 44, dim ? '#5b554d' : '#2f9e62'),
    arc(56, 124, dim ? '#5b554d' : '#c8b48e'),
    arc(136, 204, dim ? '#5b554d' : '#d4483a'),
    s('line', { x1: 50, y1: 54, x2: nx, y2: ny, stroke: '#ec6a2e', 'stroke-width': 3.5, 'stroke-linecap': 'round' }),
    s('circle', { cx: 50, cy: 54, r: 5, fill: '#efe9df' }),
  );
}

function renderNoCoverage(text: string, ctx: UserContext, r: Retrieval) {
  const out = $('output');
  const send = h('button', { type: 'button', class: 'btn btn-quiet small' }, 'أرسل إلى المزود رغم ذلك');
  send.addEventListener('click', () => sendToModel(text, ctx, r, null));
  out.replaceChildren(
    h(
      'div',
      { class: 'result' },
      h(
        'div',
        { class: 'verdict insufficient_references' },
        verdictGauge('insufficient_references') as unknown as Node,
        h('div', {}, h('h2', {}, CLASS_LABELS.insufficient_references), h('p', { class: 'sub' }, 'نتيجة البحث المحلي في معيار، وليست تحليلًا من نموذج.')),
      ),
      h('p', {}, 'لم يعثر البحث المحلي على مقاطع ذات صلة كافية في المراجع المتاحة، لذلك لم يُرسل أي طلب مدفوع.'),
      h('p', { class: 'hint' }, 'عدم العثور على نص لا يعني أن التصرف مسموح أو متوافق؛ قد يكون الموضوع خارج نطاق المراجع الست، أو يحتاج صياغة مختلفة للسؤال.'),
      h('div', { class: 'result-actions' }, send),
    ),
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

function block(title: string, ...children: Child[]) {
  return h('div', { class: 'block' }, h('h3', {}, title), ...children);
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
  const parts: Child[] = [];
  parts.push(
    h(
      'div',
      { class: `verdict ${cls}` },
      verdictGauge(cls) as unknown as Node,
      h('div', {}, h('h2', { tabindex: '-1', id: 'result-h' }, CLASS_LABELS[cls]), h('p', { class: 'sub' }, `${PROVIDER_NAMES[state.provider]} · ${model}`)),
    ),
  );
  if (!v.classificationSupported)
    parts.push(notice('bad', 'أعاد النموذج تصنيف «توجد مؤشرات تعارض» دون أي استشهاد صالح من المراجع المرسلة، فلا يُعرض بوصفه مستندًا إلى مرجع.'));
  if (v.invalidCount)
    parts.push(
      notice('warn', `استُبعد ${v.invalidCount.toLocaleString('ar-SA')} استشهادًا غير صالح (معرّف غير موجود في المقاطع المرسلة أو مقتطف لا يطابق نص المصدر).`),
    );
  parts.push(block('الخلاصة', h('p', {}, res.summary)));
  if (task === 'question' && res.direct_answer) parts.push(block('الإجابة المباشرة', h('p', {}, res.direct_answer)));

  if (v.findings.length) {
    const list = h('div', {});
    v.findings.forEach((f, i) => {
      const supported = f.citations.length > 0;
      list.append(
        h(
          'details',
          { class: 'finding' + (supported ? '' : ' unsupported'), ...(i < 3 ? { open: '' } : {}) },
          h(
            'summary',
            {},
            h('span', { class: 'fnum' }, (i + 1).toLocaleString('ar-SA')),
            h('span', {}, f.issue, supported ? null : h('span', { class: 'tag bad' }, 'دون استشهاد صالح')),
          ),
          h(
            'div',
            { class: 'fbody' },
            f.user_excerpt
              ? h(
                  'div',
                  { class: 'kv' },
                  h('b', {}, 'العبارة محل الملاحظة'),
                  h('span', { class: 'excerpt' }, f.user_excerpt),
                  f.excerpt_found ? null : h('span', { class: 'tag bad' }, 'لم تُعثر عليها حرفيًا في نصك'),
                )
              : null,
            supported ? h('div', { class: 'kv' }, h('b', {}, 'المصدر والاقتباس الأصلي'), ...f.citations.map(citationBlock)) : null,
            h('div', { class: 'kv' }, h('b', {}, supported ? 'تفسير العلاقة (تفسير النموذج)' : 'رأي النموذج (دون سند صالح)'), h('p', {}, f.interpretation)),
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
        ),
      );
    });
    parts.push(block(task === 'check' ? 'الملاحظات' : 'الأدلة', list));
  }
  if (v.conditions.length)
    parts.push(
      block(
        'الشروط والاستثناءات',
        ...v.conditions.map((c) =>
          h(
            'div',
            { class: 'finding' + (c.citations.length ? '' : ' unsupported') },
            h('p', {}, c.text, c.citations.length ? null : h('span', { class: 'tag bad' }, 'دون استشهاد صالح')),
            ...c.citations.map(citationBlock),
          ),
        ),
      ),
    );
  if (res.unresolved.length) parts.push(block('ما لم يمكن حسمه', h('ul', {}, ...res.unresolved.map((x) => h('li', {}, x)))));
  if (res.missing_information.length) parts.push(block('معلومات ناقصة', h('ul', {}, ...res.missing_information.map((x) => h('li', {}, x)))));
  parts.push(block('حدود التقييم', h('p', {}, res.limitations)));
  parts.push(
    h(
      'p',
      { class: 'hint' },
      'تحقق معيار آليًا من أن كل استشهاد يشير إلى مقطع أُرسل فعلًا، وأن الاقتباس موجود حرفيًا فيه، وأن رقم المادة والصفحة مأخوذان من قاعدة المراجع. هذا لا يثبت صحة تفسير النموذج.',
    ),
  );
  if (r.weak) parts.push(notice('warn', 'تطابق البحث المحلي مع المراجع كان ضعيفًا لهذا المدخل؛ قد تكون المراجع المرسلة غير كافية.'));
  const u: string[] = [];
  if (usage.input_tokens !== undefined) u.push(`إدخال ${usage.input_tokens.toLocaleString('ar-SA')}`);
  if (usage.output_tokens !== undefined) u.push(`إخراج ${usage.output_tokens.toLocaleString('ar-SA')}`);
  if (u.length) parts.push(h('p', { class: 'usage' }, `التوكنز كما أعادها المزود: ${u.join('، ')}.`));
  const rewrites = v.findings.map((f) => f.suggested_rewrite).filter(Boolean) as string[];
  parts.push(
    h(
      'div',
      { class: 'result-actions' },
      copyButton(() => reportText(task, userText, v, model), 'نسخ التقرير', 'btn btn-primary small'),
      rewrites.length ? copyButton(() => rewrites.join('\n\n'), rewrites.length > 1 ? 'نسخ الصياغات البديلة' : 'نسخ الصياغة البديلة') : null,
    ),
  );
  out.replaceChildren(h('article', { class: 'result' }, ...parts), referencesBlock(r));
  $('result-h').focus({ preventScroll: true });
  out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

function renderCoverage() {
  const box = $('coverage');
  if (!box) return;
  const docs = corpus.documents.map((d) =>
    h(
      'details',
      { class: 'doc' },
      h(
        'summary',
        {},
        h('span', { class: 'doc-title' }, d.title, h('span', { class: 'doc-type' }, CATEGORY_LABELS[d.category] || d.category)),
        h('span', { class: 'badge' + (d.currency === 'verified' ? ' ok' : '') }, d.currency === 'verified' ? 'متحقق من الحداثة' : 'لم تتحقق حداثتها'),
      ),
      h(
        'div',
        { class: 'doc-body' },
        h(
          'dl',
          {},
          h('dt', {}, 'المصدر'),
          h('dd', {}, d.issuer),
          h('dt', {}, 'الإصدار'),
          h('dd', {}, d.version),
          h('dt', {}, 'التغطية'),
          h('dd', {}, `${d.articles ? d.articles.toLocaleString('ar-SA') + ' مادة' : 'بلا ترقيم مواد'} · ${d.segments.toLocaleString('ar-SA')} مقطعًا · ${d.pages.toLocaleString('ar-SA')} صفحة`),
          h('dt', {}, 'حالة المراجعة'),
          h('dd', {}, `${d.currency_note} آخر مراجعة: ${d.reviewed_on}.`),
          h('dt', {}, 'الاستخراج'),
          h('dd', {}, d.extraction),
        ),
        h('p', {}, pdfLink(d.id, 1, 'فتح الملف الأصلي (PDF)')),
        h('p', { class: 'hint ltr-r', dir: 'ltr' }, 'SHA-256: ' + d.sha256),
      ),
    ),
  );
  box.replaceChildren(
    ...docs,
    h(
      'details',
      { class: 'more excluded' },
      h('summary', {}, 'ملفات استُبعدت من الاستشهاد النظامي'),
      h('ul', { class: 'more-body' }, ...corpus.excluded.map((x) => h('li', {}, `${x.file} — ${CATEGORY_LABELS[x.category] || x.category}: ${x.reason}`))),
    ),
  );
}

init();
