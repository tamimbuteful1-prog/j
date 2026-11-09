// «لوحة التحقيق» — the cinematic evidence-board backdrop.
// Purely decorative (aria-hidden, pointer-events: none), painted behind every
// interface element and behind the WebGL gauge. It never moves or resizes UI.
// Papers are placed only in the empty spaces around the interface; a blurred
// far layer and a near layer add depth with gentle parallax.

const IMG = {
  ball: new URL('./board/photo-ball.webp', import.meta.url).href,
  chart: new URL('./board/photo-chart.webp', import.meta.url).href,
  mic: new URL('./board/photo-mic.webp', import.meta.url).href,
  notes: new URL('./board/photo-notes.webp', import.meta.url).href,
  print: new URL('./board/photo-print.webp', import.meta.url).href,
};

const REFS = [
  'نظام المطبوعات والنشر',
  'اللائحة التنفيذية لنظام المطبوعات والنشر',
  'نظام الإعلام المرئي والمسموع',
  'اللائحة التنفيذية لنظام الإعلام المرئي والمسموع',
  'تنظيم الهيئة العامة لتنظيم الإعلام',
  'التصنيف العمري',
];
const CLIPS: [string, string, keyof typeof IMG][] = [
  ['إعلام', 'نقاش حول تنظيم المحتوى الرقمي', 'mic'],
  ['ثقافة', 'أمسية شعرية تجمع أصواتًا جديدة', 'notes'],
  ['رياضة', 'الفريق يحسم التأهل بركلات الترجيح', 'ball'],
  ['اقتصاد', 'تقرير يرصد حركة الأسواق', 'chart'],
  ['منصات', 'منشور متداول بلا مصدر واضح', 'mic'],
  ['تحقق', 'صورة قديمة تعود بسياق جديد', 'notes'],
];
const NOTES = ['سجل الإشعارات', 'من يقف خلف الحساب؟', 'تحقق قبل المشاركة', 'ارجع للمصدر', 'السياق؟', 'شارك بوعي', 'اقرأ قبل النشر', 'المادة؟'];
const TAGS: [string, string][] = [
  ['حرز رقمي', 'قضية ٣٤'],
  ['جندي رقمي', 'التحقق قبل المشاركة'],
  ['ملف الحلقة', 'المنشور الأصلي'],
  ['مصدر مجهول', 'قيد التحقق'],
];
const SCRAPS = ['عاجل', 'السياق', 'تقرير', 'متداول', 'النشر', 'السباق', 'مجهولة المصدر'];

type Kind = 'doc' | 'clip' | 'note' | 'polaroid' | 'tag' | 'print' | 'card' | 'scrap';
interface Item {
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  pin?: { x: number; y: number }; // document coords of the pin head
  el: HTMLElement;
}
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const SIZE: Record<Kind, [number, number]> = {
  doc: [250, 330],
  clip: [310, 118],
  note: [150, 140],
  polaroid: [176, 168],
  tag: [176, 96],
  print: [150, 166],
  card: [268, 150],
  scrap: [150, 44],
};

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function h(tag: string, cls: string, html = ''): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** jagged left/right edges, like paper torn from a newspaper */
function torn(r: () => number, depth = 6): string {
  const pts: string[] = [];
  const n = 12;
  for (let i = 0; i <= n; i++) pts.push(`${(r() * depth).toFixed(1)}px ${((i / n) * 100).toFixed(1)}%`);
  for (let i = n; i >= 0; i--) pts.push(`calc(100% - ${(r() * depth).toFixed(1)}px) ${((i / n) * 100).toFixed(1)}%`);
  return `polygon(${pts.join(',')})`;
}

function build(kind: Kind, r: () => number, k: number): HTMLElement {
  const pick = <T>(a: T[]) => a[(k + Math.floor(r() * a.length)) % a.length];
  const el = h('div', `bi bi-${kind}`);
  let face: HTMLElement;
  switch (kind) {
    case 'doc': {
      const title = pick(REFS);
      face = h(
        'div',
        'face paper',
        `<small>وثيقة مرجعية</small><b>${title}</b><span class="sub">مرجع نظامي</span>` +
          `<span class="hl">انشر بوعي.. والقرار لك</span><span class="rule"></span>` +
          (r() > 0.45 ? `<img alt="" src="${IMG[pick(['notes', 'mic', 'chart'] as const)]}" loading="lazy">` : ''),
      );
      el.append(h('span', 'under u1'), h('span', 'under u2'));
      break;
    }
    case 'clip': {
      const [cat, head, img] = pick(CLIPS);
      face = h('div', 'face paper', `<img alt="" src="${IMG[img]}" loading="lazy"><span class="tx"><small>${cat}</small><b>${head}</b></span>`);
      face.style.clipPath = torn(r);
      break;
    }
    case 'note':
      face = h('div', 'face note', `<span>${pick(NOTES)}</span>`);
      break;
    case 'polaroid':
      face = h('div', 'face polaroid', `<img alt="" src="${IMG[pick(['ball', 'chart', 'mic', 'notes'] as const)]}" loading="lazy"><span>${pick(['دليل', 'لقطة', 'مرفق', 'صورة متداولة'])}</span>`);
      break;
    case 'tag': {
      const [a, b] = pick(TAGS);
      face = h('div', 'face paper', `<b>${a}</b><span>${b}</span><i class="stamp">ملف ${pick(['٣٤', '١٢', '٠٧', '٢١'])}</i>`);
      break;
    }
    case 'print':
      face = h('div', 'face paper', `<img alt="" src="${IMG.print}" loading="lazy">`);
      break;
    case 'card':
      face = h('div', 'face paper', `<small>ملف تعريف</small><b>${pick(['جندي على الحدود الرقمية', 'قراءة هادئة قبل النشر', 'معيار'])}</b><span>${pick(['التحقق قبل المشاركة', 'وفق مراجع محددة ومعروضة'])}</span>`);
      break;
    default:
      face = h('div', 'face paper', `<b>${pick(SCRAPS)}</b>`);
      face.style.clipPath = torn(r, 4);
  }
  el.append(face);
  if (kind === 'polaroid' || kind === 'scrap' || (kind === 'note' && r() > 0.5)) {
    const t = h('i', 'tape');
    t.style.setProperty('--tr', `${(r() * 14 - 7).toFixed(1)}deg`);
    el.append(t);
  }
  return el;
}

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** areas the backdrop must keep clear so every word stays readable */
function keepOut(): Rect[] {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const out: Rect[] = [];
  const add = (el: Element | null, pad = 18) => {
    if (!el) return;
    const b = el.getBoundingClientRect();
    if (b.width && b.height) out.push({ x: b.left + sx - pad, y: b.top + sy - pad, w: b.width + pad * 2, h: b.height + pad * 2 });
  };
  document
    .querySelectorAll(
      '.tamim-masthead > *, .tamim-copy > *, .tamim-portrait, .tamim-bottom > *, .nav .brand, .nav nav, .hero-copy > *, .caption, .section-head > *, .bench .setup > *, .bench .sheet, .output > *, .files .step > *, .prompt-view, .coverage .doc, .excluded, .portrait, .about-copy > *, .fame > *, .foot',
    )
    .forEach((e) => add(e));
  // the pinned stage: its copy stays on screen for the whole section
  const stage = document.getElementById('anatomy');
  const copy = document.querySelector('.stage-copy');
  if (stage && copy) {
    const s = stage.getBoundingClientRect();
    const c = copy.getBoundingClientRect();
    out.push({ x: c.left + sx - 30, y: s.top + sy, w: c.width + 60, h: s.height });
  }
  return out;
}

let root: HTMLElement | null = null;
let far: HTMLElement;
let near: HTMLElement;
let lastW = 0;
let lastH = 0;

function layout() {
  if (!root) return;
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.scrollHeight;
  const vh = window.innerHeight;
  lastW = W;
  lastH = H;
  const mobile = W < 760;
  const S = mobile ? 0.6 : W < 1100 ? 0.8 : Math.min(1.15, W / 1440);
  const r = mulberry(34 + Math.round(W / 50));
  const kinds: Kind[] = ['doc', 'clip', 'note', 'polaroid', 'tag', 'clip', 'print', 'card', 'scrap', 'note', 'clip', 'polaroid'];

  root.style.height = `${H}px`;
  const mid = root.querySelector<HTMLElement>('.b-mid')!;
  const svg = root.querySelector<SVGSVGElement>('svg.b-strings')!;
  for (const layer of [far, mid, near]) layer.replaceChildren();
  svg.replaceChildren();
  mid.append(svg);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', String(W));
  svg.setAttribute('height', String(H));

  const place = (layer: HTMLElement, it: Omit<Item, 'el'>, el: HTMLElement) => {
    // papers are laid out at their natural size and scaled as a whole, so text scales with them
    const [bw, bh] = SIZE[it.kind];
    const sc = it.w / bw;
    el.style.cssText += `left:${(it.x + (it.w - bw) / 2).toFixed(0)}px;top:${(it.y + (it.h - bh) / 2).toFixed(0)}px;width:${bw}px;height:${bh}px;transform:rotate(${it.rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
    layer.append(el);
  };
  const withPin = (it: Omit<Item, 'el'>, el: HTMLElement) => {
    // pin near the top edge, in the paper's own coordinates; then rotate/scale to the page
    const [bw, bh] = SIZE[it.kind];
    const sc = it.w / bw;
    const px = bw * (0.3 + r() * 0.4);
    const py = Math.min(16, bh * 0.16);
    const p = h('i', 'pin');
    p.style.left = `${px - 7}px`;
    p.style.top = `${py - 7}px`;
    el.append(p);
    const a = (it.rot * Math.PI) / 180;
    const dx = (px - bw / 2) * sc;
    const dy = (py - bh / 2) * sc;
    return { x: it.x + it.w / 2 + dx * Math.cos(a) - dy * Math.sin(a), y: it.y + it.h / 2 + dx * Math.sin(a) + dy * Math.cos(a) };
  };

  // -------------------------------------------------------------- mid layer (sharp, avoids the interface)
  const blocks = keepOut();
  const placed: Item[] = [];
  const step = (mobile ? 0.24 : 0.17) * vh;
  let k = 0;
  for (let y = 70; y < H - 60; y += step * (0.7 + r() * 0.6)) {
    for (let attempt = 0; attempt < 48; attempt++) {
      const kind = kinds[(k + attempt) % kinds.length];
      const [bw, bh] = SIZE[kind];
      const w = bw * S;
      const hh = bh * S;
      // allow papers to slide off the page edges, like a board larger than the frame
      const x = -w * 0.45 + r() * (W - w * 0.1);
      const yy = y + (r() - 0.5) * step * 0.8;
      if (yy < 64 || yy + hh > H) continue;
      const box = { x: x + 6, y: yy + 6, w: w - 12, h: hh - 12 };
      const vis = Math.max(0, Math.min(W, x + w) - Math.max(0, x)) / w;
      if (vis < 0.35) continue;
      const hit = blocks.reduce((s, b) => s + overlap(box, b), 0) / (box.w * box.h);
      if (hit > (mobile ? 0.04 : 0.02)) continue;
      const crowd = placed.reduce((s, p) => s + overlap(box, p), 0) / (box.w * box.h);
      if (crowd > 0.18) continue;
      const it = { kind, x, y: yy, w, h: hh, rot: (r() - 0.5) * (kind === 'doc' ? 9 : 16) };
      const el = build(kind, r, k);
      const pin = kind === 'scrap' ? undefined : withPin(it, el);
      place(mid, it, el);
      placed.push({ ...it, el, pin });
      k++;
      break;
    }
  }

  // -------------------------------------------------------------- red investigation strings
  const NS = 'http://www.w3.org/2000/svg';
  const pinned = placed.filter((p) => p.pin);
  const links = new Set<string>();
  const maxD = Math.max(vh * 0.95, 520);
  pinned.forEach((a, i) => {
    const cands = pinned
      .slice(i + 1)
      .map((b) => ({ b, d: Math.hypot(b.pin!.x - a.pin!.x, b.pin!.y - a.pin!.y) }))
      .filter((c) => c.d < maxD && c.d > 120)
      .sort((p, q) => p.d - q.d)
      .slice(0, r() > 0.55 ? 2 : 1);
    for (const { b, d } of cands) {
      const key = `${i}-${pinned.indexOf(b)}`;
      if (links.has(key)) continue;
      links.add(key);
      const [x1, y1, x2, y2] = [a.pin!.x, a.pin!.y, b.pin!.x, b.pin!.y];
      const sag = Math.min(60, d * 0.07) * (0.6 + r() * 0.8);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 + sag;
      const dpath = `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      const g = document.createElementNS(NS, 'g');
      for (const cls of ['s-shadow', 's-thread', 's-sheen']) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', dpath);
        p.setAttribute('class', cls);
        g.append(p);
      }
      svg.append(g);
    }
  });
  // a few strings running off the board edges
  pinned
    .filter(() => r() > 0.72)
    .forEach((a) => {
      const toLeft = a.pin!.x < W / 2;
      const ex = toLeft ? -20 : W + 20;
      const ey = a.pin!.y + (r() - 0.3) * vh * 0.5;
      const dpath = `M${a.pin!.x.toFixed(1)} ${a.pin!.y.toFixed(1)} Q${((a.pin!.x + ex) / 2).toFixed(1)} ${((a.pin!.y + ey) / 2 + 30).toFixed(1)} ${ex} ${ey.toFixed(1)}`;
      const g = document.createElementNS(NS, 'g');
      for (const cls of ['s-shadow', 's-thread', 's-sheen']) {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', dpath);
        p.setAttribute('class', cls);
        g.append(p);
      }
      svg.append(g);
    });

  // -------------------------------------------------------------- far layer (out of focus, slower)
  const travel = Math.max(0, H - vh) * FAR;
  const farKinds: Kind[] = ['doc', 'clip', 'card', 'doc', 'tag', 'clip'];
  for (let y = -travel; y < H; y += vh * (mobile ? 0.42 : 0.34) * (0.7 + r() * 0.6)) {
    const kind = farKinds[Math.floor(r() * farKinds.length)];
    const [bw, bh] = SIZE[kind];
    const s = S * (1.15 + r() * 0.5);
    const it = { kind, x: -bw * s * 0.3 + r() * (W - bw * s * 0.4), y, w: bw * s, h: bh * s, rot: (r() - 0.5) * 22 };
    const el = build(kind, r, k++);
    el.classList.add('is-far');
    place(far, it, el);
  }

  // -------------------------------------------------------------- near layer (foreground blur at the edges, faster)
  const nTravel = Math.max(0, H - vh) * NEAR;
  for (let y = vh * 0.5; y < H + nTravel; y += vh * (1.1 + r() * 0.9)) {
    const kind: Kind = r() > 0.5 ? 'doc' : 'scrap';
    const [bw, bh] = SIZE[kind];
    const s = S * (kind === 'doc' ? 1.5 : 2.4);
    const left = r() > 0.5;
    const w = bw * s;
    const it = { kind, x: left ? -w * 0.72 : W - w * 0.28, y, w, h: bh * s, rot: (r() - 0.5) * 30 };
    const el = build(kind, r, k++);
    el.classList.add('is-near');
    place(near, it, el);
  }
  onScroll();
}

const FAR = 0.2;
const NEAR = 0.16;
let motion = true;
let raf = 0;
function onScroll() {
  if (!root || !motion) return;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const y = window.scrollY;
    far.style.transform = `translate3d(0, ${(y * FAR).toFixed(1)}px, 0)`;
    near.style.transform = `translate3d(0, ${(-y * NEAR).toFixed(1)}px, 0)`;
  });
}

export function mountBoard(reduced: boolean) {
  if (root) return;
  motion = !reduced;
  root = h('div', 'board');
  root.id = 'board';
  root.setAttribute('aria-hidden', 'true');
  far = h('div', 'b-layer b-far');
  const mid = h('div', 'b-layer b-mid');
  mid.innerHTML = '<svg class="b-strings" xmlns="http://www.w3.org/2000/svg"></svg>';
  near = h('div', 'b-layer b-near');
  root.append(far, mid, near, h('div', 'b-light'), h('div', 'b-grain'));
  document.body.prepend(root);

  let t = 0;
  const relayout = () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      const W = document.documentElement.clientWidth;
      const H = document.documentElement.scrollHeight;
      if (W !== lastW || Math.abs(H - lastH) > 40) layout();
    }, 220);
  };
  // wait for fonts so text boxes are final before measuring free space
  const start = () => {
    layout();
    new ResizeObserver(relayout).observe(document.body);
  };
  (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(start));
  window.addEventListener('scroll', onScroll, { passive: true });
}
