function person({x,y,s=1,skin='#7a5a44',hair='',beard='',cloth='#d9d2c4',cloth2='#bfb7a8',extra=''}){
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-62 260 C -60 120 -40 92 0 90 C 40 92 60 120 62 260Z" fill="${cloth}"/>
    <path d="M-20 92 L 0 140 L 20 92" fill="${cloth2}"/>
    <rect x="-12" y="58" width="24" height="36" fill="${skin}" opacity=".9"/>
    <ellipse cx="0" cy="20" rx="34" ry="44" fill="${skin}"/>${hair}
    <ellipse cx="-12" cy="16" rx="4.5" ry="3" fill="#1a1410"/><ellipse cx="12" cy="16" rx="4.5" ry="3" fill="#1a1410"/>
    <path d="M-17 6 Q-12 3 -7 6 M7 6 Q12 3 17 6" stroke="#1a1410" stroke-width="2.4" fill="none"/>
    <path d="M1 22 L -3 34 L 4 34" stroke="#3a281e" stroke-width="2" fill="none"/>
    <path d="M-9 46 Q0 49 9 46" stroke="#3a2418" stroke-width="2.6" fill="none"/>${beard}${extra}</g>`;
}
const HAIR_SHORT=`<path d="M-36 10 C -38 -34 -12 -48 2 -47 C 24 -46 38 -30 36 10 C 30 -14 18 -20 0 -20 C -18 -20 -30 -14 -36 10Z" fill="#141210"/>`;
const HAIR_BALD=`<path d="M-35 14 C -36 -6 -32 -18 -26 -22 C -30 -6 -32 6 -35 14Z M35 14 C 36 -6 32 -18 26 -22 C 30 -6 32 6 35 14Z" fill="#9a9a9a"/>`;
const HAIR_FATHER=`<path d="M-36 8 C -38 -34 -12 -48 2 -47 C 24 -46 38 -30 36 8 C 30 -14 18 -22 0 -22 C -18 -22 -30 -14 -36 8Z" fill="#1d1a17"/><path d="M-36 8 C -36 -4 -34 -10 -31 -14 L -29 4Z M36 8 C 36 -4 34 -10 31 -14 L 29 4Z" fill="#8f8a84"/>`;
const BEARD_GREY=`<path d="M-30 30 C -26 70 26 70 30 30 C 18 50 -18 50 -30 30Z" fill="#cfcac2"/><path d="M-12 40 Q0 37 12 40" stroke="#cfcac2" stroke-width="5" fill="none"/>`;
const BEARD_FATHER=`<path d="M-30 30 C -26 66 26 66 30 30 C 18 48 -18 48 -30 30Z" fill="#221c18"/><path d="M-13 39 Q0 35 13 39" stroke="#221c18" stroke-width="5" fill="none"/>`;

(function buildPhoto(){
  // the building behind them (same facade as episode 1 exterior)
  let b=`<rect width="600" height="420" fill="#c9c2b2"/><rect x="0" y="0" width="600" height="220" fill="#ded7c6"/>
   <rect x="90" y="20" width="420" height="300" fill="#8d877a"/>`;
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)b+=`<rect x="${130+c*135}" y="${40+r*85}" width="62" height="56" fill="#3f3b35"/>`;
  b+=`<rect x="260" y="270" width="80" height="60" fill="#2c2924"/><rect x="0" y="320" width="600" height="100" fill="#a49d8d"/>`;
  b+=person({x:110,y:170,s:1,skin:'#7a5a44',hair:HAIR_BALD,beard:BEARD_GREY,cloth:'#9c968c',cloth2:'#86817a'});          // Abu Saleh
  b+=person({x:225,y:165,s:1,skin:'#8a6a52',hair:HAIR_SHORT,cloth:'#3b3f44',cloth2:'#2c3035'});                       // unknown young man
  // young Nawaf (15) — derived from Nawaf's own face design
  b+=`<g class="kid" transform="translate(470 196) scale(.205) translate(-362 -580) scale(1 .97)">${document.getElementById('tFace').textContent}</g>`;
  $('#gpBase').innerHTML=b;
  // the father (only in one version) + his hand on Nawaf's shoulder
  $('#gpFather').innerHTML=person({x:360,y:150,s:1.06,skin:'#7a5844',hair:HAIR_FATHER,beard:BEARD_FATHER,cloth:'#ece7dc',cloth2:'#d6d0c3'})+
    `<path d="M396 260 C 420 262 440 268 452 276 L 448 290 C 432 284 414 280 394 280Z" fill="#ece7dc"/><ellipse cx="458" cy="284" rx="14" ry="9" fill="#6b4b38"/>`;
})();