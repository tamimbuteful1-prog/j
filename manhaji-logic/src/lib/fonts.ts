import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * Self-hosted Arabic fonts (public/fonts) — renders work offline and are
 * byte-identical on every machine. Arabic + Latin subsets per weight.
 */
const ARABIC_RANGE =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const FAMILIES: {family: string; file: string; weights: number[]}[] = [
  {family: 'Tajawal', file: 'tajawal', weights: [500, 700, 800, 900]},
  {family: 'IBM Plex Sans Arabic', file: 'ibm-plex-sans-arabic', weights: [400, 500, 600, 700]},
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading Arabic fonts');
  const loads: Promise<unknown>[] = [];
  for (const {family, file, weights} of FAMILIES) {
    for (const w of weights) {
      for (const [subset, range] of [
        ['arabic', ARABIC_RANGE],
        ['latin', LATIN_RANGE],
      ] as const) {
        const face = new FontFace(family, `url(${staticFile(`fonts/${file}-${subset}-${w}-normal.woff2`)}) format('woff2')`, {
          weight: String(w),
          style: 'normal',
          unicodeRange: range,
        });
        (document.fonts as unknown as Set<FontFace>).add(face);
        loads.push(face.load());
      }
    }
  }
  Promise.all(loads)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error('Font loading failed', err);
      continueRender(handle);
    });
}

export const fontsLoaded = true;
