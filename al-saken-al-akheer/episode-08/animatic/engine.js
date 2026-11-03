/* ==========================================================================
   The Last Resident — shared episode engine (episodes 8+)
   - camera with parallax layers (L0 far · L1 · C characters · L2 foreground)
   - Nawaf drawn with his ORIGINAL episode 1–5 art (face + body), driven by the
     same pose() call as the rig characters (father, Abu Saleh)
   - phone UI (chat / voice message / file / report), captions, grain, question card
   - lip sync: real narration loudness when voice_env.js exists, otherwise a
     procedural mouth so the episode can be previewed before the recording arrives
   Requires: timeline.js (SEG), rig.js, templates #tFace #tBody in the page.
   ========================================================================== */
(function () {
  const E = {};
  const $ = (s) => document.querySelector(s), $$ = (s) => document.querySelectorAll(s);
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  const T = (e, v) => e && e.setAttribute('transform', v);
  Object.assign(E, { $, $$, clamp, ramp, ease, eo, lerp, T });
  E.A = (i) => SEG[i].a; E.B = (i) => SEG[i].b;
  E.CUR = 0;
  E.flick = (t, seed = 1) => { const v = Math.sin(t * 37 * seed) * Math.sin(t * 11.3 + seed) * Math.sin(t * 3.1); return v > .55 ? .75 : (v > .4 ? .3 : 0); };

  // ---------------------------------------------------------------- lip sync
  E.venv = (t) => {
    if (window.VENV) return VENV[Math.floor(t * 30)] || 0;
    return clamp(.35 + .45 * Math.sin(t * 17.3) * Math.sin(t * 5.1 + 1) + .2 * Math.sin(t * 29), 0, 1); // procedural until the recording exists
  };
  E.inSeg = (t, list) => list.some(([a, b]) => t >= E.A(a) - .02 && t <= E.B(b) + .02);
  E.talk = (t, list) => (E.inSeg(t, list) ? E.venv(t) : 0);

  // ---------------------------------------------------------------- camera (parallax)
  E.cam = (sc, { x = 0, y = 0, s = 1, r = 0, shake = 0 } = {}) => {
    const root = $(`#${sc} .cam`); T(root, `translate(360 640) rotate(${r}) scale(${s}) translate(-360 -640)`);
    const sx = shake ? Math.sin(E.CUR * 47) * shake : 0, sy = shake ? Math.cos(E.CUR * 53) * shake : 0;
    [['L0', .55], ['L1', .8], ['C', 1], ['L2', 1.25]].forEach(([k, f]) => { const g = $(`#${sc} .${k}`); if (g) T(g, `translate(${-x * f + sx} ${-y * f + sy})`); });
  };
  E.focusOn = (sc, el, s = 1.3, dx = 0, dy = 0) => { E.cam(sc, { s: 1 }); const r = el.getBoundingClientRect(); E.cam(sc, { x: r.left + r.width / 2 - 360 + dx, y: r.top + r.height / 2 - 640 + dy, s }); };

  // ---------------------------------------------------------------- characters
  const SVGNS = 'http://www.w3.org/2000/svg'; let OID = 0;
  const txt = (id) => document.getElementById(id).textContent;
  E.fill = (sc, layer, html) => $(`#${sc} .${layer}`).insertAdjacentHTML('beforeend', html);
  E.mk = (sc, look, layer = 'C') => RIG.mount(RIG.make(look), $(`#${sc} .${layer}`));
  E.oldBody = (parent, { young = false } = {}) => {
    const g = document.createElementNS(SVGNS, 'g'); const id = 'onb' + (OID++); g.id = id; g.innerHTML = txt('tBody'); parent.appendChild(g);
    g.querySelector('.bface').insertAdjacentHTML('beforeend', '<path class="bsmile" d="M-14 -510 Q0 -500 14 -510" stroke="#2b1a14" stroke-width="3" fill="none" opacity="0"/>');
    return { old: true, young, id, g, el: { [id]: g } };
  };
  E.oldFace = (parent, { young = false } = {}) => {
    const g = document.createElementNS(SVGNS, 'g'); const id = 'onf' + (OID++); g.id = id; g.innerHTML = txt('tFace'); parent.appendChild(g);
    return { oldFace: true, young, id, g, el: { [id]: g } };
  };
  E.mkOldBody = (sc, layer = 'C', o) => E.oldBody($(`#${sc} .${layer}`), o);
  E.mkOldFace = (sc, layer = 'C', o) => E.oldFace($(`#${sc} .${layer}`), o);
  const BROW_V = { neutral: 0, fear: .7, shock: 1.1, doubt: .3, anger: -.15, sad: .45, tense: .2 };
  function oldFaceRig(root, { open = 1, lookX = 0, lookY = 0, brow = 0, mouth = 0, turn = 0, smile = 0 }) {
    root.querySelectorAll('.lidL,.lidR').forEach((l) => l.setAttribute('height', (1 - open) * 50));
    root.querySelectorAll('.irisL,.irisR').forEach((g) => T(g, `translate(${lookX * 12} ${lookY * 7})`));
    root.querySelectorAll('.browL,.browR').forEach((g) => T(g, `translate(0 ${-brow * 10})`));
    root.querySelector('.mouth').setAttribute('ry', mouth * 10);
    root.querySelector('.mline').setAttribute('d', `M${328 - smile * 10} ${716 - smile * 10} Q362 ${709 + smile * 18} ${396 + smile * 10} ${716 - smile * 10}`);
    root.querySelector('.phoneLight').setAttribute('opacity', 0);
    T(root.querySelector('.head'), `translate(${turn * 14} 0) rotate(${turn * 2} 362 600)`);
  }
  function poseOldFace(c, p) {
    const g = c.g; g.setAttribute('opacity', p.op ?? 1);
    const s = p.s || 4, hx = p.x ?? 360, hy = (p.y ?? 0) - 395 * s, k = s / 2.35;
    const H = Object.assign({ tilt: 0, turn: 0, nod: 0, shake: 0 }, p.head);
    // the 15-year-old: same construction, rounder & slightly smaller features
    const yk = c.young ? ' scale(.93 .9)' : '';
    T(g, `translate(${hx + H.shake} ${hy + H.nod * 8}) rotate(${H.tilt}) scale(${k})${yk} translate(-362 -590)`);
    const Ey = Object.assign({ x: 0, y: 0, wide: 0, blink: 0, squint: 0, tremble: 0 }, p.eyes);
    const M = typeof p.mouth === 'string' ? p.mouth : ''; const mo = typeof p.mouth === 'object' ? p.mouth : {};
    const shockOpen = M === 'shock' ? .45 : M === 'slight' ? .2 : M === 'wide' ? .7 : (mo.open || 0);
    const smile = M === 'creepy' ? .9 : M === 'smile' ? .6 : M === 'frown' ? -.4 : (mo.smile || 0);
    const b = typeof p.brows === 'string' ? (BROW_V[p.brows] ?? 0) : 0;
    oldFaceRig(g, { open: clamp(1 - Ey.blink - Ey.squint * .25, 0, 1), lookX: Ey.x + (Ey.tremble ? Math.sin(E.CUR * 90) * Ey.tremble * .08 : 0), lookY: Ey.y, brow: b + Ey.wide * .2, mouth: Math.max(shockOpen, (p.talk || 0) * .75), turn: H.turn, smile });
    g.querySelectorAll('.blueAmb').forEach((e) => e.setAttribute('opacity', p.amb ?? .24));
    if (p.phone !== undefined) g.querySelector('.phoneLight').setAttribute('opacity', p.phone);
  }
  function poseOldBody(c, p) {
    const g = c.g; g.setAttribute('opacity', p.op ?? 1);
    const s = p.s || .5, k = s * 1.45 * (c.young ? .86 : 1); const feetY = (p.y ?? 0) + 470 * s;
    T(g, `translate(${p.x ?? 0} ${feetY}) scale(${k * (p.flip ? -1 : 1)} ${k})`);
    const back = p.view === 'back' ? 1 : 0; g.querySelector('.bback').setAttribute('opacity', back); g.querySelector('.bface').setAttribute('opacity', 1 - back); g.querySelector('.hoodTie').setAttribute('opacity', 1 - back);
    const LL = p.legL || {}, LR = p.legR || {}; T(g.querySelector('.legL'), `rotate(${(LL.hip || 0) * .9} -25 -250)`); T(g.querySelector('.legR'), `rotate(${(LR.hip || 0) * .9} 25 -250)`);
    const AL = p.armL || {}, AR = p.armR || {}; T(g.querySelector('.armL'), `rotate(${clamp(AL.sh ?? 0, -170, 170)} -64 -440)`); T(g.querySelector('.armR'), `rotate(${clamp(AR.sh ?? 0, -170, 170)} 64 -440)`);
    const Ey = p.eyes || {}; g.querySelectorAll('.bi').forEach((e) => T(e, `translate(${(Ey.x || 0) * 3} ${(Ey.y || 0) * 2})`));
    const H = p.head || {}; T(g.querySelector('.bhead'), `translate(0 ${(H.nod || 0) * 2}) rotate(${(H.turn || 0) * 8 + (H.tilt || 0)} 0 -500)`);
    const mo = typeof p.mouth === 'object' ? p.mouth : {}; const sm = p.mouth === 'creepy' ? 1 : (mo.smile || 0); g.querySelector('.bsmile').setAttribute('opacity', clamp(sm, 0, 1));
    if (p.dark !== undefined) g.style.filter = p.dark ? `brightness(${1 - p.dark})` : '';
  }
  E.pose = (c, p) => { if (c.oldFace) return poseOldFace(c, p); if (c.old) return poseOldBody(c, p); c.el[c.id].setAttribute('opacity', p.op ?? 1); RIG.pose(c, Object.assign({ t: E.CUR }, p)); };
  E.hide = (...cs) => cs.forEach((c) => c.el[c.id].setAttribute('opacity', 0));
  E.show = (...cs) => cs.forEach((c) => c.el[c.id].setAttribute('opacity', 1));
  E.closeUp = (s, cx = 360, cy = 600) => ({ x: cx, y: cy + 395 * s, s });
  E.blink = (t, seed) => RIG.blink(t, seed);
  E.idle = (t, seed = 0) => ({ head: { tilt: Math.sin(t * .7 + seed) * 1.2, nod: Math.sin(t * .9 + seed) * .3 }, eyes: { blink: E.blink(t, seed) }, armL: { sh: 6 + Math.sin(t * .8 + seed) * 1.5, el: -10, hand: 'relaxed' }, armR: { sh: -6 - Math.sin(t * .8 + seed) * 1.5, el: 10, hand: 'relaxed' } });
  E.merge = (...o) => { const r = {}; o.forEach((x) => { for (const k in x) r[k] = (typeof x[k] === 'object' && !Array.isArray(x[k]) && r[k] && typeof r[k] === 'object') ? Object.assign({}, r[k], x[k]) : x[k]; }); return r; };
  E.walkPose = (t, { run = 0, period = 1.0 } = {}) => { const w = RIG.walk(t, { run, period }); return { view: 'side', legL: w.legL, legR: w.legR, armL: w.armL, armR: w.armR, lean: w.lean, _bob: w.bob, _dist: w.dist }; };

  // ---------------------------------------------------------------- backgrounds
  E.BG = {
    groom: () => {
      let s = `<rect x="-400" y="-300" width="1520" height="1900" fill="#171a17"/><rect x="-400" y="900" width="1520" height="700" fill="#100f0d"/><rect x="-120" y="250" width="560" height="420" fill="#0b0d0c"/>`;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const x = -100 + c * 180, y = 270 + r * 200; s += `<rect x="${x}" y="${y}" width="164" height="180" rx="14" fill="#24282a"/><rect class="mini" x="${x + 12}" y="${y + 12}" width="140" height="120" rx="16" fill="#1b2a22"/><rect x="${x + 12}" y="${y + 12}" width="140" height="120" rx="16" fill="url(#pScan)"/>`; }
      s += `<g class="shelves">`; for (let r = 0; r < 4; r++) { s += `<rect x="480" y="${220 + r * 150}" width="300" height="12" fill="#3a2b1b"/>`; for (let k = 0; k < 11; k++) s += `<rect x="${486 + k * 26}" y="${r * 150 + 150}" width="22" height="70" fill="${['#1b1b1b', '#262222', '#1e1e24'][k % 3]}"/><rect x="${489 + k * 26}" y="${r * 150 + 165}" width="16" height="20" fill="#d9d2c4" opacity=".8"/>`; } s += `</g>`;
      s += `<rect x="-160" y="740" width="640" height="30" fill="#3a2b1b"/><rect x="-140" y="770" width="20" height="140" fill="#2a1f14"/><rect x="430" y="770" width="20" height="140" fill="#2a1f14"/><g class="vcr"><rect x="60" y="690" width="230" height="50" rx="4" fill="#202224"/><rect x="80" y="704" width="110" height="10" fill="#050505"/></g><rect x="320" y="640" width="100" height="100" rx="8" fill="#2b2d2e"/>`;
      s += `<ellipse class="bulbG" cx="200" cy="120" rx="260" ry="140" fill="url(#gBulb)" opacity=".45"/><rect x="190" y="60" width="20" height="40" fill="#333"/><circle class="bulb" cx="200" cy="110" r="14" fill="#ffd58a"/>`;
      return s;
    },
    gdoorIn: () => `<rect x="-300" y="-300" width="1320" height="1900" fill="#151816"/><rect x="-300" y="1000" width="1320" height="600" fill="#0f0e0c"/>
      <rect x="110" y="120" width="500" height="880" fill="#000"/><g class="leaf"><rect x="110" y="120" width="500" height="880" fill="#2f3a3a" stroke="#0a0c0c" stroke-width="10"/><rect x="160" y="170" width="400" height="260" fill="#263030"/><rect x="160" y="480" width="400" height="460" fill="#263030"/><rect x="560" y="560" width="28" height="90" rx="8" fill="#9aa0a5"/><circle cx="574" cy="604" r="18" fill="#b8bec2"/><rect x="540" y="690" width="50" height="22" rx="4" fill="#8a9196"/></g>
      <rect x="110" y="994" width="500" height="8" fill="#e7b25e" opacity=".45" class="gap"/>`,
    stairs: () => {
      // emergency stairwell: concrete, a landing below, flights going down into darkness
      let s = `<rect x="-400" y="-400" width="1520" height="2200" fill="#1a1e1c"/>
        <rect x="-400" y="-400" width="1520" height="2200" fill="url(#gStairFade)"/>`;
      for (let i = 0; i < 12; i++) { const y = 560 + i * 62, x0 = 120 + i * 22; s += `<rect x="${x0}" y="${y}" width="${560 - i * 10}" height="62" fill="${i % 2 ? '#2a302d' : '#262c29'}"/><rect x="${x0}" y="${y}" width="${560 - i * 10}" height="8" fill="#3a423e"/>`; }
      s += `<rect class="landing" x="300" y="1300" width="560" height="140" fill="#1f2422"/>`;
      s += `<path d="M110 300 L 110 560 L 360 1300" stroke="#4f5a54" stroke-width="10" fill="none"/><g stroke="#3f4843" stroke-width="5">`;
      for (let i = 0; i < 9; i++) s += `<line x1="${140 + i * 26}" y1="${590 + i * 80}" x2="${140 + i * 26}" y2="${650 + i * 80}"/>`;
      s += `</g><rect x="560" y="80" width="150" height="60" rx="6" fill="#0d3a22"/><text x="635" y="122" text-anchor="middle" font-family="Tajawal" font-weight="800" font-size="30" fill="#9ff0bd">طوارئ</text>
        <ellipse class="emG" cx="635" cy="110" rx="220" ry="140" fill="#5fd38c" opacity=".14" filter="url(#fBlur14)"/>
        <rect class="topDoor" x="-120" y="140" width="260" height="440" fill="#3c4a44" stroke="#1d2420" stroke-width="6"/><rect x="-100" y="360" width="200" height="18" rx="6" fill="#9aa39e"/>
        <rect x="-400" y="580" width="560" height="40" fill="#2f3532"/>`;
      return s;
    },
  };

  // ---------------------------------------------------------------- phone (HTML overlay inside a scene)
  // messages: [{who:'in'|'out', text, at, file, voice}] — shown when t >= at
  E.phoneHTML = (id) => `<div class="pcam" style="position:absolute;inset:0;transform-origin:360px 640px">
    <svg viewBox="0 0 720 1280" style="position:absolute;inset:0;width:720px;height:1280px"><rect width="720" height="1280" fill="#06070a"/><ellipse class="pglow" cx="360" cy="620" rx="380" ry="460" fill="#9cc2e2" opacity=".08" filter="url(#fBlur14)"/>
      <path d="M180 1400 C 190 1200 200 1080 230 1010 L 520 1010 C 560 1080 560 1200 560 1400 Z" fill="#3b2a20"/></svg>
    <div class="ph" style="left:190px;top:250px"><div class="scr" id="${id}-scr">
      <div class="psb"><span class="pclock">3:52</span><span>9% ▮▯ ·ıl</span></div>
      <div class="hd"><div class="av">؟</div><div><div class="nm">رقم غير معروف</div><div class="sub" id="${id}-sub">متصل الآن</div></div></div>
      <div class="ms" id="${id}-ms"></div>
      <div class="doc" id="${id}-doc" style="opacity:0"></div>
    </div></div>
    <svg viewBox="0 0 720 1280" style="position:absolute;inset:0;width:720px;height:1280px;pointer-events:none">
      <path d="M192 770 C 164 780 156 830 172 860 C 182 878 196 876 202 860 Z" fill="#5a4031"/><path d="M192 850 C 162 862 156 910 172 940 C 182 958 196 956 202 940 Z" fill="#53392c"/>
      <path d="M532 810 C 564 822 570 880 552 910 C 540 926 526 922 522 906 Z" fill="#4a3428"/></svg></div>`;
  E.renderChat = (id, msgs, t) => {
    const box = document.getElementById(`${id}-ms`); let h = '';
    msgs.forEach((m, i) => {
      if (t < m.at) return; const k = eo(ramp(t, m.at, m.at + .3));
      const st = `opacity:${k};transform:translateY(${(1 - k) * 12}px)`;
      if (m.voice) {
        const prog = clamp((t - (m.playFrom ?? 1e9)) / (m.dur || 4)); let bars = '';
        for (let b = 0; b < 26; b++) { const hgt = 6 + Math.abs(Math.sin(b * 1.7) * Math.sin(b * .6 + 1)) * 22; const on = b / 26 < prog; bars += `<i style="height:${on ? hgt * (.6 + .4 * E.venv(t + b * .03)) : hgt * .6}px;background:${on ? '#e8f0f2' : '#6d7a80'}"></i>`; }
        h += `<div class="bb vm" style="${st}"><span class="pl">${prog > 0 && prog < 1 ? '❚❚' : '▶'}</span><span class="wv">${bars}</span><span class="tm">0:${String(Math.round(m.dur || 4)).padStart(2, '0')}</span></div>`;
      } else if (m.file) {
        h += `<div class="bb fl" style="${st}"><span class="fi">PDF</span><span>${m.file}</span><span class="tm">${m.time || '3:55 ص'}</span></div>`;
      } else {
        h += `<div class="bb ${m.who === 'out' ? 'out' : ''}" style="${st}">${m.text}<span class="tm">${m.time || '3:52 ص'}</span></div>`;
      }
      if (m.typing && t < m.at) h += `<div class="ty">يكتب الآن…</div>`;
    });
    const nxt = msgs.find((m) => m.who !== 'out' && t >= m.at - 1.0 && t < m.at && !m.voice);
    if (nxt) h += `<div class="ty">يكتب الآن…</div>`;
    if (box.dataset.h !== h) { box.innerHTML = h; box.dataset.h = h; }
  };
  E.pcam = (sc, s, x = 0, y = 0, vib = 0) => { $(`#${sc} .pcam`).style.transform = `translate(${x + vib}px,${y}px) scale(${s})`; };
  E.vib = (t, a, d = .8) => (t > a && t < a + d && Math.floor(t * 6) % 2 === 0) ? Math.sin(t * 140) * 4 : 0;

  // ---------------------------------------------------------------- captions
  E.buildCaps = (HL, POP) => {
    const CAPS = [];
    SEG.forEach((s, i) => {
      const words = s.text.split(' '); const cls = HL[i] || '';
      const wrap = (x) => cls ? `<span class="${cls}">${x}</span>` : (x.startsWith('«') || x.endsWith('»') ? `<span class="q">${x}</span>` : x);
      const nextA = i + 1 < SEG.length ? SEG[i + 1].a : s.b + 1.2; const end = Math.min(nextA - .05, s.b + .55);
      if (words.length > 6) { let cut = words.findIndex((w) => /[،…:!؟]$/.test(w)) + 1; if (cut <= 0 || cut >= words.length) cut = Math.ceil(words.length / 2);
        const p1 = words.slice(0, cut).join(' '), p2 = words.slice(cut).join(' '); const mid = s.a + (s.b - s.a) * (p1.length / (p1.length + p2.length));
        CAPS.push([s.a, mid, wrap(p1), i]); CAPS.push([mid, end, wrap(p2), i]);
      } else CAPS.push([s.a, end, wrap(s.text), i]);
    });
    let last = -1;
    return (t) => { let k = -1; for (let j = 0; j < CAPS.length; j++) if (t >= CAPS[j][0] && t < CAPS[j][1]) k = j;
      const el = $('#caps'); if (k !== last) { el.innerHTML = k >= 0 ? CAPS[k][2] : ''; last = k; }
      if (k >= 0) { const e = eo(ramp(t, CAPS[k][0], CAPS[k][0] + .22)); const pop = POP.has(CAPS[k][3]); el.style.opacity = e; el.style.transform = `scale(${pop ? lerp(1.25, 1.08, e) : (.92 + .08 * e)})`; } else el.style.opacity = 0; };
  };

  // ---------------------------------------------------------------- grain
  E.grain = (() => { let NF = null, gc = null;
    return (t) => { if (!NF) { gc = $('#grain').getContext('2d'); NF = []; let s = 71; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        for (let f = 0; f < 6; f++) { const im = gc.createImageData(420, 700); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } NF.push(im); }
        $('#grain').style.width = '840px'; $('#grain').style.height = '1400px'; }
      const f = Math.floor(t * 30) % 6; gc.putImageData(NF[f], 0, 0); $('#grain').style.transform = `translate(${(f * 37) % 60}px,${(f * 53) % 60}px)`; }; })();

  // ---------------------------------------------------------------- run loop
  E.run = ({ TL, caps, question, title, END }) => {
    const VO_END = E.B(SEG.length - 1); const ASK_END = VO_END + 5.0; const DURATION = ASK_END + 4.4;
    window.DURATION = DURATION;
    window.seek = (t) => { E.CUR = t;
      let active = null; for (const s of TL) if (t >= s.a && t < s.b) active = s;
      $$('.scene').forEach((e) => (e.style.opacity = 0));
      if (active) { document.getElementById(active.id).style.opacity = 1; active.fn(t - active.a, t); }
      const q = $('#ask'), fade = 1 - ramp(t, ASK_END - .4, ASK_END);
      q.querySelector('.qq').style.opacity = ramp(t, question.at, question.at + .7) * fade;
      q.querySelector('.op.a').style.opacity = ramp(t, question.a, question.a + .5) * fade; q.querySelector('.op.a').style.transform = `translateY(${(1 - eo(ramp(t, question.a, question.a + .5))) * 16}px)`;
      q.querySelector('.op.b').style.opacity = ramp(t, question.b, question.b + .5) * fade; q.querySelector('.op.b').style.transform = `translateY(${(1 - eo(ramp(t, question.b, question.b + .5))) * 16}px)`;
      q.querySelector('.cm').style.opacity = ramp(t, VO_END + .6, VO_END + 1.2) * fade;
      const blk = t >= ASK_END; $('#black').style.opacity = blk ? 1 : 0;
      $('#title .a').style.opacity = Math.min(ramp(t, ASK_END + .5, ASK_END + 1.1), 1 - ramp(t, DURATION - .5, DURATION - .05));
      $('#title .b').style.opacity = Math.min(ramp(t, ASK_END + 1.4, ASK_END + 2.0), 1 - ramp(t, DURATION - .5, DURATION - .05));
      caps(t); $('#caps').style.visibility = (blk || t >= question.at) ? 'hidden' : 'visible';
      if (window.ESTIMATED) $('#est').style.display = 'block';
      E.grain(t);
    };
    if (!location.search.includes('render')) { let t0 = null; const loop = (ts) => { if (t0 === null) t0 = ts; window.seek(((ts - t0) / 1000) % DURATION); requestAnimationFrame(loop); }; document.fonts.ready.then(() => requestAnimationFrame(loop)); }
    else window.seek(0);
    return { VO_END, ASK_END, DURATION };
  };
  window.E = E;
})();
