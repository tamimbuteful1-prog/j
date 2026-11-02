/* ==========================================================================
   The Last Resident — modular 2D cutout character rig (from episode 06 on)

   Every character is built from independent parts on their own pivots:
     root(pelvis) → torso → neck → head
       head: back hair · ears · face · face shadow · eyes (white / iris / pupil /
             highlight, clipped by the eye shape) · upper & lower lids · brows
             (independent) · nose · mouth (procedural shapes) · beard · front
             fringe (secondary motion)
       arms: shoulder → upper arm → elbow → forearm → wrist → hand (5 fingers,
             each with its own curl → poses)
       legs: hip → thigh → knee → shin → ankle → foot
   Views: 'front' (3/4 via head turn), 'side' (profile; used for walking), 'back'.
   Coordinates: root at pelvis (0,0); ~1000 units tall; y grows downward.
   ========================================================================== */
(function () {
  const RIG = {};
  let UID = 0;
  const D2R = Math.PI / 180;

  // ---------------------------------------------------------------- styles
  const LOOKS = {
    nawaf: { skin: '#b97a55', skinDark: '#8a5537', hair: '#140e0c', hairStyle: 'messy', grey: 0, beard: 'none', rim: '#e08a3a',
             cloth: 'hoodie', top: '#1e191c', topDark: '#120e10', pants: '#2a1e19', shoe: '#d6cec8', cargo: true, lips: '#a55a47', age: 'young', ref: true },
    father: { skin: '#7d5b45', skinDark: '#56402f', hair: '#16130f', hairStyle: 'short', grey: .8, beard: 'full',
              cloth: 'thobe', top: '#e8e3d8', topDark: '#c9c2b4', pants: '#d8d2c6', shoe: '#2a2520', age: 'adult' },
    guard: { skin: '#7a5a44', skinDark: '#523c2d', hair: '#8f8a84', hairStyle: 'bald', grey: 1, beard: 'grey',
             cloth: 'thobe', top: '#7f7a72', topDark: '#5f5b55', pants: '#6e6a63', shoe: '#1d1a17', age: 'old', keys: true },
    fireman: { skin: '#7d5b45', skinDark: '#56402f', hair: '#111', hairStyle: 'helmet', grey: 0, beard: 'none',
               cloth: 'coat', top: '#3a3426', topDark: '#28241a', pants: '#2c281e', shoe: '#111', age: 'adult' },
  };
  RIG.LOOKS = LOOKS;

  // ---------------------------------------------------------------- hand
  // Hand drawn in wrist-local coords, fingers pointing down (+y). Each finger is
  // two segments with its own curl so poses never add or lose fingers.
  const HAND_POSES = {
    open:     { f: [0, 0, 0, 0], th: 0, spread: 1 },
    fist:     { f: [1, 1, 1, 1], th: .9, spread: 0 },
    point:    { f: [0, 1, 1, 1], th: .8, spread: 0 },
    phone:    { f: [.65, .65, .7, .75], th: .5, spread: 0, prop: 'phone' },
    handle:   { f: [.75, .75, .8, .8], th: .6, spread: 0 },
    nervous:  { f: [.35, .5, .55, .6], th: .4, spread: .3 },
    reach:    { f: [.1, .05, .1, .15], th: .1, spread: .8 },
    shoulder: { f: [.25, .2, .25, .3], th: .2, spread: .5 },
    tape:     { f: [.6, .6, .65, .7], th: .55, spread: 0, prop: 'tape' },
    press:    { f: [0, .9, .95, 1], th: .7, spread: 0 },
    relaxed:  { f: [.3, .35, .4, .45], th: .3, spread: .2 },
  };
  RIG.HAND_POSES = HAND_POSES;
  function handSVG(id, skin, dark) {
    let s = `<g id="${id}-prop"></g><ellipse id="${id}-palm" cx="0" cy="22" rx="17" ry="21" fill="${skin}" stroke="${dark}" stroke-width="1.5"/>`;
    for (let i = 0; i < 4; i++) {
      s += `<g id="${id}-f${i}"><rect x="-4.6" y="0" width="9.2" height="17" rx="4.6" fill="${skin}" stroke="${dark}" stroke-width="1.2"/>` +
           `<g id="${id}-f${i}b"><rect x="-4.2" y="0" width="8.4" height="14" rx="4.2" fill="${skin}" stroke="${dark}" stroke-width="1.2"/></g></g>`;
    }
    s += `<g id="${id}-th"><rect x="-5" y="0" width="10" height="20" rx="5" fill="${skin}" stroke="${dark}" stroke-width="1.2"/></g>`;
    return s;
  }
  function poseHand(c, side, name, k = 1) {
    const p = HAND_POSES[name] || HAND_POSES.relaxed;
    const id = `${c.id}-h${side}`;
    const mir = side === 'L' ? -1 : 1;
    const xs = [-11, -3.5, 4, 11.5];
    for (let i = 0; i < 4; i++) {
      const curl = p.f[i];
      const spread = (i - 1.5) * 6 * p.spread;
      c.el[`${id}-f${i}`].setAttribute('transform', `translate(${xs[i] * mir} 38) rotate(${spread * mir}) scale(1 ${1 - curl * .45})`);
      c.el[`${id}-f${i}b`].setAttribute('transform', `translate(0 15) rotate(${curl * 95 * mir}) scale(1 ${1 - curl * .3})`);
    }
    c.el[`${id}-th`].setAttribute('transform', `translate(${15 * mir} 18) rotate(${(-35 + p.th * 55) * mir})`);
    const prop = c.el[`${id}-prop`];
    const want = p.prop || '';
    if (prop.dataset.p !== want) {
      prop.dataset.p = want;
      prop.innerHTML = want === 'phone' ? `<rect x="-14" y="18" width="28" height="56" rx="6" fill="#0b0d0f" stroke="#2a3036" stroke-width="2"/><rect x="-11" y="22" width="22" height="46" rx="3" fill="#9cc2e2" opacity=".35"/>`
        : want === 'tape' ? `<rect x="-34" y="26" width="68" height="40" rx="3" fill="#1b1b1b" stroke="#444" stroke-width="2"/><rect x="-24" y="34" width="48" height="16" rx="2" fill="#d9d2c4"/><circle cx="-12" cy="56" r="5" fill="#555"/><circle cx="12" cy="56" r="5" fill="#555"/>`
        : '';
    }
  }

  // ---------------------------------------------------------------- mouth
  // Continuous mouth: open 0..1, width -1..1, smile -1..1 (frown < 0), tense 0..1
  function mouthPath({ open = 0, width = 0, smile = 0, tense = 0 }) {
    const w = 17 + width * 6 - tense * 3;
    const cy = -smile * 5;
    const top = -1.5 - open * 2.5 + tense * 1;
    const bot = 1.5 + open * 15 - tense * 1;
    if (open < .06) {
      const mid = smile * 4 + tense * -1;
      return { outer: `M${-w} ${cy} Q0 ${mid + 2} ${w} ${cy}`, inner: '', closed: true };
    }
    const outer = `M${-w} ${cy} Q${-w * .5} ${top - 2} 0 ${top} Q${w * .5} ${top - 2} ${w} ${cy} Q${w * .55} ${bot + 2} 0 ${bot} Q${-w * .55} ${bot + 2} ${-w} ${cy}Z`;
    return { outer, inner: outer, closed: false };
  }

  // ---------------------------------------------------------------- build
  RIG.make = function (lookName, opts = {}) {
    const L = Object.assign({}, LOOKS[lookName], opts);
    const id = `rg${UID++}`;
    const sk = L.skin, sd = L.skinDark;
    const isThobe = L.cloth === 'thobe';
    const limb = (pid, w, h, fill, stroke) => `<rect id="${pid}" x="${-w / 2}" y="-8" width="${w}" height="${h + 16}" rx="${w / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    const pocket = L.cargo ? `<rect x="-30" y="80" width="26" height="54" rx="4" fill="#20160f" stroke="#120c08" stroke-width="2"/><rect x="-32" y="76" width="30" height="12" rx="3" fill="#2f2219"/>` : '';
    const leg = (s) => `<g id="${id}-hip${s}">${limb(`${id}-th${s}`, 50, 230, L.pants, '#0a0a0a')}<g transform="scale(${s === 'L' ? 1 : -1} 1)">${pocket}</g>
        <g id="${id}-knee${s}" transform="translate(0 230)">${limb(`${id}-sh${s}`, 44, 222, L.pants, '#0a0a0a')}
          <g id="${id}-ank${s}" transform="translate(0 222)"><path d="M-20 -6 C -22 14 -14 22 0 22 L 46 22 C 58 22 58 6 44 2 L 20 -8 Z" fill="${L.shoe}" stroke="#4a4440" stroke-width="2"/><rect x="-22" y="18" width="80" height="6" rx="3" fill="${L.cargo ? '#bdb5ae' : L.shoe}"/></g></g></g>`;
    const arm = (s) => `<g id="${id}-shl${s}">${limb(`${id}-ua${s}`, 44, 165, L.top, L.topDark)}
        <g id="${id}-elb${s}" transform="translate(0 165)">${limb(`${id}-fa${s}`, 40, 140, L.top, L.topDark)}
          <rect x="-21" y="128" width="42" height="14" rx="6" fill="${L.topDark}"/>
          <g id="${id}-wr${s}" transform="translate(0 145)">${handSVG(`${id}-h${s}`, sk, sd)}</g></g></g>`;

    // head (front)
    const eye = (s) => `<g id="${id}-eye${s}">
        <clipPath id="${id}-ec${s}"><path d="M-15 0 Q0 -10.5 15 0 Q0 8.5 -15 0Z"/></clipPath>
        <path d="M-15 0 Q0 -10.5 15 0 Q0 8.5 -15 0Z" fill="#ece3de"/><path d="M-15 0 Q-12 -2 -9 -1 M15 0 Q12 -2 9 -1" stroke="#c46a64" stroke-width="1" opacity=".6"/>
        <g clip-path="url(#${id}-ec${s})">
          <g id="${id}-iris${s}"><circle r="8" fill="#5a2a17"/><circle r="5.6" fill="#7a3a1f" opacity=".7"/><circle r="8" fill="none" stroke="#2a120a" stroke-width="1.6"/><circle id="${id}-pup${s}" r="3.4" fill="#050302"/><ellipse cx="3" cy="-3.4" rx="2" ry="1.3" fill="#f2d9cc" opacity=".9"/><circle cx="4.6" cy="-1.3" r=".8" fill="#f2d9cc" opacity=".8"/></g>
          <rect id="${id}-ulid${s}" x="-18" y="-14" width="36" height="4" fill="${sk}"/>
          <rect id="${id}-llid${s}" x="-18" y="9" width="36" height="0" fill="${sk}"/>
        </g>
        <path id="${id}-lline${s}" d="M-15 0 Q0 -10.5 15 0" stroke="#140c08" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M-12 5 Q0 9 12 5" stroke="${sd}" stroke-width="1" fill="none" opacity=".6"/></g>`;
    let hairBack = '', hairFront = '', extra = '';
    if (L.hairStyle === 'messy') {
      hairBack = `<path d="M-74 10 C -84 -40 -70 -96 -20 -108 C 30 -118 78 -92 80 -40 C 84 -10 78 14 70 26 C 66 0 62 -30 50 -46 C 20 -60 -24 -60 -52 -44 C -64 -30 -68 -6 -74 10Z" fill="${L.hair}"/>`;
      hairFront = `<g transform="translate(0 -13) scale(1 .96)"><path d="M-72 -20 C -78 -70 -50 -108 -6 -112 C 30 -116 70 -98 78 -54 C 82 -36 74 -18 66 -8 C 64 -26 58 -40 48 -46 C 50 -30 44 -16 36 -10 C 34 -26 26 -40 14 -46 C 14 -30 6 -20 -4 -14 C -6 -30 -14 -40 -24 -44 C -26 -28 -34 -18 -46 -14 C -46 -28 -50 -38 -56 -40 C -62 -34 -66 -26 -72 -20Z" fill="${L.hair}"/>
        <path d="M-60 -70 C -40 -96 0 -104 30 -96 M-40 -86 C -20 -96 20 -96 46 -84 M40 -74 C 58 -70 70 -58 74 -44" stroke="${L.rim}" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"/>
        <path d="M-72 -20 C -76 -40 -76 -60 -66 -80" stroke="${L.rim}" stroke-width="3" fill="none" opacity=".55"/></g>`;
    } else if (L.hairStyle === 'short') {
      hairBack = `<path d="M-68 -2 C -74 -70 -40 -98 2 -98 C 46 -98 76 -70 68 -2 C 60 -40 40 -58 0 -58 C -40 -58 -60 -40 -68 -2Z" fill="${L.hair}"/>`;
      hairFront = `<path d="M-66 -24 C -70 -86 -32 -104 4 -102 C 42 -100 72 -84 66 -24 C 54 -54 32 -62 10 -60 C -14 -62 -44 -54 -66 -24Z" fill="${L.hair}"/><path d="M-30 -66 C -10 -74 18 -74 36 -64" stroke="#2a2724" stroke-width="3" fill="none" opacity=".6"/>`;
      if (L.grey) extra += `<path d="M-64 -4 C -66 -26 -62 -42 -56 -50 C -57 -34 -58 -18 -58 -4Z" fill="#8f8a84" opacity="${L.grey}"/><path d="M64 -4 C 66 -26 62 -42 56 -50 C 57 -34 58 -18 58 -4Z" fill="#8f8a84" opacity="${L.grey}"/>`;
    } else if (L.hairStyle === 'bald') {
      hairBack = `<path d="M-64 0 C -66 -24 -62 -40 -56 -48 C -58 -30 -60 -12 -60 0Z M64 0 C 66 -24 62 -40 56 -48 C 58 -30 60 -12 60 0Z" fill="#9a958e"/>`;
      extra += `<path d="M-30 -60 Q0 -66 30 -60 M-24 -50 Q0 -55 24 -50" stroke="${sd}" stroke-width="2" fill="none" opacity=".6"/>`;
    } else if (L.hairStyle === 'helmet') {
      hairFront = `<path d="M-74 -10 C -76 -84 -40 -108 0 -108 C 40 -108 76 -84 74 -10 L 86 -6 L -86 -6Z" fill="#c9a23a" stroke="#6a5418" stroke-width="3"/><rect x="-12" y="-104" width="24" height="60" fill="#b08a2a"/>`;
    }
    if (L.beard === 'full' || L.beard === 'grey') {
      const bc = L.beard === 'grey' ? '#cfcac2' : '#211b17';
      extra += `<path d="M-60 6 C -60 54 -30 86 0 88 C 30 86 60 54 60 6 C 52 40 32 58 18 62 Q0 66 -18 62 C -32 58 -52 40 -60 6Z" fill="${bc}"/>`;
      extra += `<path id="${id}-must" d="M-20 38 Q0 30 20 38 Q0 44 -20 38Z" fill="${bc}"/>`;
    }
    if (L.age === 'old' || L.age === 'adult') extra += `<path d="M-14 22 Q-24 30 -26 40 M14 22 Q24 30 26 40" stroke="${sd}" stroke-width="1.6" fill="none" opacity=".55"/>`;

    const head = `<g id="${id}-head">
        <g id="${id}-hairB">${hairBack}</g>
        <g id="${id}-earL"><ellipse cx="-62" cy="4" rx="10" ry="18" fill="${sd}"/><path d="M-62 -6 C -68 -2 -68 10 -62 14" stroke="#5a301c" stroke-width="2" fill="none" opacity=".7"/></g><g id="${id}-earR"><ellipse cx="62" cy="4" rx="10" ry="18" fill="${sk}"/><path d="M62 -6 C 68 -2 68 10 62 14" stroke="#5a301c" stroke-width="2" fill="none" opacity=".7"/></g>
        <path id="${id}-face" d="M-62 -10 C -62 -70 -34 -88 0 -88 C 34 -88 62 -70 62 -10 C 62 42 40 78 0 84 C -40 78 -62 42 -62 -10Z" fill="${sk}"/>
        <path id="${id}-fshade" d="M0 -88 C -34 -88 -62 -70 -62 -10 C -62 42 -40 78 0 84 C -24 70 -36 40 -36 -6 C -36 -50 -22 -80 0 -88Z" fill="#000" fill-opacity=".16"/>
        <g id="${id}-feat">
          ${extra}
          <g id="${id}-eyesG"><g id="${id}-eL" transform="translate(-26 -4)">${eye('L')}</g><g id="${id}-eR" transform="translate(26 -4)">${eye('R')}</g></g>
          <path id="${id}-brL" d="M-16 4 C -8 -6 6 -6 15 -3 L 16 1 C 8 -1 -6 -1 -16 4Z" fill="#120c09"/>
          <path id="${id}-brR" d="M16 4 C 8 -6 -6 -6 -15 -3 L -16 1 C -8 -1 6 -1 16 4Z" fill="#120c09"/>
          ${L.ref ? `<g id="${id}-nose"><g transform="translate(0 4) scale(.82)"><path d="M-4 0 L 4 0 C 6 12 10 22 13 28 C 15 34 10 38 4 37 Q0 40 -4 37 C -10 38 -15 34 -13 28 C -10 22 -6 12 -4 0Z" fill="${sk}" stroke="${sd}" stroke-width="1.4"/><path d="M-3 4 C -5 16 -8 24 -10 30" stroke="${sd}" stroke-width="2" fill="none" opacity=".6"/><ellipse cx="-6" cy="33" rx="3.2" ry="1.8" fill="#3a1d12"/><ellipse cx="6" cy="33" rx="3.2" ry="1.8" fill="#3a1d12"/></g></g>`
          : `<path id="${id}-nose" d="M3 4 C 1 20 -3 28 -9 32 C -3 36 7 36 11 32" stroke="${sd}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`}
          <g id="${id}-mouthG" transform="translate(0 52)"><path id="${id}-mIn" d="" fill="#1a0c08"/><rect id="${id}-teeth" x="-10" y="-3" width="20" height="5" rx="2" fill="#e9e4da" opacity="0"/><path id="${id}-lips" d="" fill="${L.lips || 'none'}" opacity="${L.lips ? .9 : 0}"/><path id="${id}-mOut" d="" fill="none" stroke="#3a1e14" stroke-width="3" stroke-linecap="round"/></g>
        </g>
        <g id="${id}-fringe">${hairFront}</g>
        <g id="${id}-sideHead" opacity="0">
          <path d="M-58 -20 C -58 -78 -14 -92 20 -88 C 52 -84 66 -56 64 -20 C 70 -10 76 6 70 12 L 64 18 C 66 30 62 44 52 52 C 46 70 30 84 6 84 C -30 82 -58 50 -58 -20Z" fill="${sk}"/>
          <path d="M-62 -6 C -70 -70 -30 -100 14 -96 C 50 -92 70 -66 62 -34 C 50 -52 30 -60 6 -58 C -18 -56 -34 -40 -36 -10 C -46 -12 -56 -10 -62 -6Z" fill="${L.hairStyle === 'bald' ? '#9a958e' : L.hair}" opacity="${L.hairStyle === 'bald' ? .0 : 1}"/>
          <ellipse cx="-14" cy="4" rx="10" ry="17" fill="${sd}"/>
          <path d="M24 -8 Q36 -15 48 -8 Q36 -3 24 -8Z" fill="#e2ddd4"/><circle id="${id}-sIris" cx="40" cy="-8" r="4.2" fill="#2a1a10"/>
          <path d="M22 -22 Q36 -28 50 -20" stroke="#110c08" stroke-width="4.5" fill="none" stroke-linecap="round"/>
          <path id="${id}-sMouth" d="M42 48 Q50 50 58 46" stroke="#3a1e14" stroke-width="3" fill="none" stroke-linecap="round"/>
          ${L.beard !== 'none' ? `<path d="M-10 40 C 0 76 30 86 52 70 C 60 60 62 50 60 44 C 48 56 24 58 6 44Z" fill="${L.beard === 'grey' ? '#cfcac2' : '#211b17'}"/>` : ''}
        </g>
        <g id="${id}-backHead" opacity="0"><path d="M-64 -4 C -68 -78 -30 -100 2 -98 C 40 -96 70 -74 64 -4 C 60 40 40 72 0 76 C -40 72 -60 40 -64 -4Z" fill="${L.hairStyle === 'bald' ? sk : L.hair}"/></g>
      </g>`;

    // torso / clothing
    let torso, skirt = '';
    if (isThobe) {
      torso = `<path d="M-84 -296 C -96 -200 -88 -90 -70 14 L 70 14 C 88 -90 96 -200 84 -296 C 50 -318 -50 -318 -84 -296Z" fill="${L.top}" stroke="${L.topDark}" stroke-width="2"/>
               <path d="M-22 -308 C -10 -282 10 -282 22 -308" stroke="${L.topDark}" stroke-width="5" fill="none"/><line x1="0" y1="-290" x2="0" y2="-200" stroke="${L.topDark}" stroke-width="3"/>`;
      skirt = `<path id="${id}-skirt" d="" fill="${L.top}" stroke="${L.topDark}" stroke-width="2"/>`;
    } else if (L.cloth === 'coat') {
      torso = `<path d="M-90 -300 C -100 -200 -94 -80 -80 40 L 80 40 C 94 -80 100 -200 90 -300 C 50 -320 -50 -320 -90 -300Z" fill="${L.top}" stroke="#111" stroke-width="2"/><rect x="-90" y="-60" width="180" height="16" fill="#cfd23a" opacity=".85"/><rect x="-90" y="-160" width="180" height="16" fill="#cfd23a" opacity=".85"/>`;
    } else {
      torso = `<path d="M-86 -296 C -96 -210 -90 -110 -74 10 L 74 10 C 90 -110 96 -210 86 -296 C 50 -318 -50 -318 -86 -296Z" fill="${L.top}" stroke="${L.topDark}" stroke-width="2"/>
               <path d="M-40 -306 C -26 -270 26 -270 40 -306" stroke="${L.topDark}" stroke-width="7" fill="none"/>
               <path d="M-14 -282 L -18 -232 M14 -282 L 18 -232" stroke="#cfd6db" stroke-width="2.5" opacity=".6"/>
               <path d="M-60 -60 L 60 -60 L 54 -10 L -54 -10Z" fill="${L.topDark}" opacity=".6"/>
               ${L.rim ? `<path d="M-86 -296 C -96 -210 -90 -110 -74 10" stroke="${L.rim}" stroke-width="4" fill="none" opacity=".55"/><circle cx="-14" cy="-282" r="4" fill="none" stroke="#bbb" stroke-width="2"/><circle cx="14" cy="-282" r="4" fill="none" stroke="#bbb" stroke-width="2"/><rect x="-20" y="-236" width="4" height="10" fill="#bbb"/><rect x="16" y="-236" width="4" height="10" fill="#bbb"/>` : ''}`;
      if (L.rim) torso = `<path d="M-60 -300 C -70 -350 -40 -372 0 -372 C 40 -372 70 -350 60 -300 Z" fill="${L.topDark}"/>` + torso;
    }
    const keys = L.keys ? `<g id="${id}-keys"><circle cx="40" cy="0" r="12" fill="none" stroke="#9aa0a5" stroke-width="3"/><rect x="34" y="8" width="5" height="22" fill="#b6a46a"/><rect x="42" y="10" width="5" height="18" fill="#9aa0a5"/></g>` : '';

    const svg = `<g id="${id}" class="rig">
      <ellipse id="${id}-shadow" cx="0" cy="470" rx="110" ry="18" fill="#000" opacity=".35"/>
      <g id="${id}-armBackSlot"></g>
      <g id="${id}-legs">${leg('L')}${leg('R')}</g>
      ${skirt}
      <g id="${id}-torso">${torso}${keys}</g>
      <g id="${id}-neck" transform="translate(0 -300)"><rect x="-18" y="-40" width="36" height="52" fill="${sd}"/>
        <g id="${id}-headPivot" transform="translate(0 -95)">${head}</g></g>
      <g id="${id}-armL" transform="translate(-80 -280)">${arm('L')}</g>
      <g id="${id}-armR" transform="translate(80 -280)">${arm('R')}</g>
    </g>`;
    return { id, look: L, svg, el: null, isThobe };
  };

  RIG.mount = function (c, parent) {
    parent.insertAdjacentHTML('beforeend', c.svg);
    c.el = {};
    parent.querySelectorAll(`[id^="${c.id}"]`).forEach((e) => { c.el[e.id] = e; });
    c.$ = (k) => c.el[`${c.id}-${k}`];
    return c;
  };

  // ---------------------------------------------------------------- pose
  // p: {x,y,s,flip,rot, view:'front'|'side'|'back', lean,
  //     head:{tilt,turn,nod,shake}, eyes:{x,y,wide,blink,blinkL,blinkR,squint,tremble},
  //     brows:{L:{y,rot,in},R:{...}} or brows:'neutral'|'fear'|'shock'|'doubt'|'anger'|'sad',
  //     mouth:{open,width,smile,tense} or mouth:'closed'|..., talk:0..1,
  //     armL:{sh,el,wr,hand}, armR:{...}, legL:{hip,knee,ank}, legR:{...}, fringe}
  const BROWS = {
    neutral: { L: { y: 0, rot: 0, in: 0 }, R: { y: 0, rot: 0, in: 0 } },
    fear:    { L: { y: -6, rot: -12, in: 2 }, R: { y: -6, rot: 12, in: 2 } },
    shock:   { L: { y: -11, rot: -4, in: 0 }, R: { y: -11, rot: 4, in: 0 } },
    doubt:   { L: { y: 2, rot: 8, in: 3 }, R: { y: -6, rot: -4, in: 0 } },
    anger:   { L: { y: 4, rot: 16, in: 4 }, R: { y: 4, rot: -16, in: 4 } },
    sad:     { L: { y: -2, rot: -16, in: 2 }, R: { y: -2, rot: 16, in: 2 } },
    tense:   { L: { y: 2, rot: 10, in: 3 }, R: { y: 2, rot: -10, in: 3 } },
  };
  const MOUTHS = {
    closed: { open: 0, width: 0, smile: 0, tense: 0 }, slight: { open: .25 }, wide: { open: .9, width: .4 },
    smile: { smile: .8, width: .3 }, frown: { smile: -.7 }, shock: { open: .6, width: -.3 },
    tense: { tense: 1, smile: -.2 }, creepy: { smile: 1, width: .6, tense: .4 },
  };
  RIG.BROWS = BROWS; RIG.MOUTHS = MOUTHS;
  const T = (e, v) => e && e.setAttribute('transform', v);
  const lerp = (a, b, k) => a + (b - a) * k;

  RIG.pose = function (c, p = {}) {
    const $ = c.$;
    const view = p.view || 'front';
    const s = p.s ?? 1;
    T(c.el[c.id], `translate(${p.x ?? 0} ${p.y ?? 0}) scale(${s * (p.flip ? -1 : 1)} ${s}) rotate(${p.rot || 0})`);
    // body lean
    T($('torso'), `rotate(${p.lean || 0} 0 0)`);
    // legs
    const LL = Object.assign({ hip: 0, knee: 0, ank: 0 }, p.legL), LR = Object.assign({ hip: 0, knee: 0, ank: 0 }, p.legR);
    const legX = view === 'side' ? [0, 0] : [-34, 34];
    T($('hipL'), `translate(${legX[0]} 0) rotate(${LL.hip})`); T($('kneeL'), `translate(0 230) rotate(${LL.knee})`); T($('ankL'), `translate(0 222) rotate(${LL.ank})`);
    T($('hipR'), `translate(${legX[1]} 0) rotate(${LR.hip})`); T($('kneeR'), `translate(0 230) rotate(${LR.knee})`); T($('ankR'), `translate(0 222) rotate(${LR.ank})`);
    // feet: in front/back view point outward, in side view point forward
    const footFlip = view === 'side' ? 1 : 0;
    $('ankL').firstElementChild.setAttribute('transform', footFlip ? '' : 'translate(4 0) scale(-.55 1)');
    $('ankR').firstElementChild.setAttribute('transform', footFlip ? '' : 'translate(-4 0) scale(.55 1)');
    // thobe skirt follows the legs (hem from both feet positions)
    if (c.isThobe) {
      const fk = (h, k, x0) => { const a = h * D2R, b = (h + k) * D2R; return [x0 - Math.sin(a) * 230 - Math.sin(b) * 222, Math.cos(a) * 230 + Math.cos(b) * 222]; };
      const fl = fk(LL.hip, LL.knee, legX[0]), fr = fk(LR.hip, LR.knee, legX[1]);
      const hemY = Math.min(fl[1], fr[1]) - 12;
      const xl = Math.max(-118, Math.min(fl[0], fr[0]) * .7 - 40), xr = Math.min(118, Math.max(fl[0], fr[0]) * .7 + 40);
      $('skirt').setAttribute('d', `M-72 0 L 72 0 C 78 140 ${xr} ${hemY - 160} ${xr} ${hemY} L ${xl} ${hemY} C ${xl} ${hemY - 160} -78 140 -72 0Z`);
    }
    // arms
    const arm = (side, a) => {
      const A = Object.assign({ sh: side === 'L' ? 8 : -8, el: side === 'L' ? -8 : 8, wr: 0, hand: 'relaxed' }, a);
      T($(`shl${side}`), `rotate(${A.sh})`); T($(`elb${side}`), `translate(0 165) rotate(${A.el})`); T($(`wr${side}`), `translate(0 145) rotate(${A.wr})`);
      poseHand(c, side, A.hand);
    };
    arm('L', p.armL); arm('R', p.armR);
    T($('armL'), view === 'side' ? 'translate(0 -280)' : 'translate(-80 -280)');
    T($('armR'), view === 'side' ? 'translate(4 -280)' : 'translate(80 -280)');
    // side view: back arm goes behind the torso
    const back = $('armBackSlot');
    if (view === 'side' && $('armL').parentNode !== back) back.appendChild($('armL'));
    if (view !== 'side' && $('armL').parentNode === back) c.el[c.id].appendChild($('armL'));
    // torso width per view
    T($('torso').firstElementChild, view === 'side' ? 'scale(.62 1)' : '');
    // head
    const H = Object.assign({ tilt: 0, turn: 0, nod: 0, shake: 0 }, p.head);
    T($('headPivot'), `translate(${H.shake} ${-95 + H.nod * 6}) rotate(${H.tilt})`);
    const turn = Math.max(-1, Math.min(1, H.turn));
    $('sideHead').setAttribute('opacity', view === 'side' ? 1 : 0);
    $('backHead').setAttribute('opacity', view === 'back' ? 1 : 0);
    const frontOn = view === 'front' ? 1 : 0;
    ['face', 'fshade', 'feat', 'fringe', 'earL', 'earR', 'hairB'].forEach((k) => $(k).setAttribute('opacity', frontOn));
    if (view === 'back') $('hairB').setAttribute('opacity', 1);
    // pseudo 3/4: features slide with turn; far side compresses; ears swap
    T($('feat'), `translate(${turn * 16} ${H.nod * 4}) scale(${1 - Math.abs(turn) * .08} 1)`);
    T($('eL'), `translate(${-26 + turn * 3} -4) scale(${1 - Math.max(0, turn) * .25} 1)`);
    T($('eR'), `translate(${26 + turn * 3} -4) scale(${1 - Math.max(0, -turn) * .25} 1)`);
    T($('nose'), `translate(${turn * 6} 0)`);
    T($('earL'), `translate(${turn * 8} 0)`); T($('earR'), `translate(${turn * 8} 0)`);
    $('earL').setAttribute('opacity', frontOn * (turn > .6 ? 0 : 1)); $('earR').setAttribute('opacity', frontOn * (turn < -.6 ? 0 : 1));
    T($('fshade'), `translate(${turn * 10} 0) scale(${1 + Math.max(0, -turn) * .4} 1)`);
    // fringe secondary motion
    T($('fringe'), `translate(${turn * 6} 0) rotate(${p.fringe || 0} 0 -80)`);
    // eyes
    const E = Object.assign({ x: 0, y: 0, wide: 0, blink: 0, squint: 0, tremble: 0 }, p.eyes);
    const tr = E.tremble ? (Math.sin((p.t || 0) * 90) * E.tremble) : 0;
    ['L', 'R'].forEach((sd) => {
      const bl = Math.max(E.blink, sd === 'L' ? (E.blinkL || 0) : (E.blinkR || 0));
      T($(`iris${sd}`), `translate(${E.x * 7 + tr} ${E.y * 3.6})`);
      $(`pup${sd}`).setAttribute('r', 3.4 * (1 - E.wide * .25));
      const up = -14 + (4 - E.wide * 3) + bl * 16 + E.squint * 3;
      $(`ulid${sd}`).setAttribute('height', Math.max(0, up + 14));
      const lowH = E.squint * 6 + bl * 2;
      $(`llid${sd}`).setAttribute('y', 9 - lowH); $(`llid${sd}`).setAttribute('height', lowH);
      const ly = -10.5 + (bl * 16 + E.squint * 3 - E.wide * 3) * .8;
      $(`lline${sd}`).setAttribute('d', `M-15 0 Q0 ${Math.min(6, ly)} 15 0`);
      T($(`eye${sd}`), `scale(${1 + E.wide * .12})`);
    });
    if ($('sIris')) $('sIris').setAttribute('cx', 40 + E.x * 3);
    // brows (independent)
    let B = typeof p.brows === 'string' ? BROWS[p.brows] : (p.brows || BROWS.neutral);
    if (p.browMix) { const b2 = BROWS[p.browMix[0]], k = p.browMix[1]; B = { L: mixB(B.L, b2.L, k), R: mixB(B.R, b2.R, k) }; }
    T($('brL'), `translate(${-26 + B.L.in} ${-24 + B.L.y}) rotate(${B.L.rot})`);
    T($('brR'), `translate(${26 - B.R.in} ${-24 + B.R.y}) rotate(${B.R.rot})`);
    // mouth
    let M = typeof p.mouth === 'string' ? Object.assign({}, MOUTHS.closed, MOUTHS[p.mouth]) : Object.assign({}, MOUTHS.closed, p.mouth);
    if (p.talk) { M.open = Math.max(M.open, p.talk * .75); M.width = (M.width || 0) - p.talk * .2; }
    const mp = mouthPath(M);
    $('mOut').setAttribute('d', mp.outer); $('mIn').setAttribute('d', mp.inner);
    if (c.look.lips) { const w = 17 + (M.width || 0) * 6, cy = -(M.smile || 0) * 5, ob = 1.5 + M.open * 15;
      $('lips').setAttribute('d', `M${-w} ${cy} Q${-w * .5} -7 -3 -5 Q0 -3.5 3 -5 Q${w * .5} -7 ${w} ${cy} Q${w * .5} ${ob + 7} 0 ${ob + 8} Q${-w * .5} ${ob + 7} ${-w} ${cy}Z`); }
    $('teeth').setAttribute('opacity', M.open > .45 ? .9 : 0); $('teeth').setAttribute('y', -2.5 - M.open * 2);
    if ($('must')) T($('must'), `translate(0 ${-M.open * 2})`);
    if ($('sMouth')) $('sMouth').setAttribute('d', `M42 48 Q50 ${50 + M.open * 10 - M.smile * 3} 58 46`);
    // ground shadow follows feet roughly
    $('shadow').setAttribute('cy', 470);
  };
  function mixB(a, b, k) { return { y: lerp(a.y, b.y, k), rot: lerp(a.rot, b.rot, k), in: lerp(a.in, b.in, k) }; }

  // ---------------------------------------------------------------- locomotion
  // Walk / run cycle (side view). Returns leg/arm angles + vertical bob and the
  // forward distance covered at time t so planted feet don't slide.
  RIG.walk = function (t, { period = 1.1, amp = 24, run = 0 } = {}) {
    const P = period * (run ? .62 : 1), A = amp * (run ? 1.45 : 1);
    const ph = (t / P) * Math.PI * 2;
    const leg = (o) => {
      const s = Math.sin(ph + o), cphase = Math.cos(ph + o);
      const hip = A * s;
      const knee = (cphase > 0 ? Math.pow(cphase, 1.3) * (run ? 85 : 48) : 4);
      const ank = cphase > 0 ? -knee * .35 : (s < -.5 ? 12 : 0);
      return { hip, knee: -knee, ank };
    };
    const legL = leg(0), legR = leg(Math.PI);
    const armSw = A * (run ? 1.2 : .8);
    const armL = { sh: -armSw * Math.sin(ph + Math.PI) * -1, el: run ? -70 : -14, hand: run ? 'fist' : 'relaxed' };
    const armR = { sh: -armSw * Math.sin(ph) * -1, el: run ? -70 : -14, hand: run ? 'fist' : 'relaxed' };
    const bob = -Math.abs(Math.cos(ph)) * (run ? 18 : 9);
    const legLen = 452;
    const speed = (4 * legLen * Math.sin(A * D2R)) / (P * 2) * .9; // units / second
    return { legL, legR, armL, armR, bob, dist: speed * t, speed, lean: run ? 8 : 2, headBob: Math.sin(ph * 2) * 1.5 };
  };

  // natural blink pattern
  RIG.blink = function (t, seed = 0) {
    const period = 3.2 + (seed % 3) * .7;
    const ph = (t + seed * 1.37) % period;
    return ph < .16 ? Math.sin((ph / .16) * Math.PI) : 0;
  };

  window.RIG = RIG;
})();
