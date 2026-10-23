import {continueRender, delayRender, staticFile} from 'remotion';

const AR =
  'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';
const LAT =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2212, U+2215, U+FEFF, U+FFFD';

const faces: [string, string, number, string][] = [
  ['Kufi', 'noto-kufi-arabic-arabic-400-normal.woff2', 400, AR],
  ['Kufi', 'noto-kufi-arabic-arabic-700-normal.woff2', 700, AR],
  ['Kufi', 'noto-kufi-arabic-arabic-800-normal.woff2', 800, AR],
  ['Kufi', 'noto-kufi-arabic-arabic-900-normal.woff2', 900, AR],
  ['Kufi', 'noto-kufi-arabic-latin-700-normal.woff2', 700, LAT],
  ['Kufi', 'noto-kufi-arabic-latin-900-normal.woff2', 900, LAT],
  ['Plex', 'ibm-plex-sans-arabic-arabic-400-normal.woff2', 400, AR],
  ['Plex', 'ibm-plex-sans-arabic-arabic-500-normal.woff2', 500, AR],
  ['Plex', 'ibm-plex-sans-arabic-arabic-600-normal.woff2', 600, AR],
  ['Plex', 'ibm-plex-sans-arabic-arabic-700-normal.woff2', 700, AR],
  ['Plex', 'ibm-plex-sans-arabic-latin-500-normal.woff2', 500, LAT],
  ['Plex', 'ibm-plex-sans-arabic-latin-700-normal.woff2', 700, LAT],
  ['Mono', 'jetbrains-mono-latin-500-normal.woff2', 500, LAT],
  ['Mono', 'jetbrains-mono-latin-700-normal.woff2', 700, LAT],
  ['Mono', 'jetbrains-mono-latin-800-normal.woff2', 800, LAT],
];

// Load once per page; never hold a frame for more than 10 s if a font request stalls.
const w = window as unknown as {__manhajiFonts?: boolean};
if (!w.__manhajiFonts) {
  w.__manhajiFonts = true;
  const handle = delayRender('fonts', {timeoutInMilliseconds: 60000});
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      continueRender(handle);
    }
  };
  setTimeout(finish, 10000);
  Promise.all(
    faces.map(([family, file, weight, range]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {
        weight: String(weight),
        unicodeRange: range,
      })
        .load()
        .then((f) => document.fonts.add(f)),
    ),
  )
    .then(finish)
    .catch((e) => {
      console.error(e);
      finish();
    });
}
