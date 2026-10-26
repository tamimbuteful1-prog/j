/**
 * MANHAJI — visual identity tokens.
 * One place for every colour / spacing decision so the whole film stays coherent.
 */
export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Vertical-video safe areas (Reels / TikTok / Shorts UI overlays). */
export const SAFE = {
  top: 230,
  bottom: 380,
  side: 90,
  /** Band reserved for spoken captions — nothing important lives here. */
  captionTop: 1500,
  captionBottom: 1720,
} as const;

export const COLORS = {
  ink: '#090D18',
  ink2: '#0F1526',
  ink3: '#18203A',
  paper: '#F4F1EA',
  paperDim: '#C9CCD8',
  muted: '#7D869E',

  // Story / products
  aish: '#F2B53A', // عيش — golden label
  aishDeep: '#B9781A',
  samoli: '#FF7550', // صامولي — coral label
  samoliDeep: '#C4452A',
  crust: '#D99A4E',
  crustDark: '#A9652A',
  crumb: '#F7DDA9',

  // Logic
  or: '#5FA0FF', // عبارة الفصل
  orGlow: 'rgba(95,160,255,0.55)',
  and: '#A77BFF', // عبارة الوصل
  andGlow: 'rgba(167,123,255,0.55)',
  true: '#34E08D',
  trueGlow: 'rgba(52,224,141,0.5)',
  false: '#FF4A5E',
  falseGlow: 'rgba(255,74,94,0.5)',

  basket: '#2F6BFF',
  basketDeep: '#1B3FB0',
} as const;

export const FONTS = {
  /** Display / kinetic headlines */
  display: 'Tajawal',
  /** UI, captions, tables, Latin */
  text: 'IBM Plex Sans Arabic',
} as const;
