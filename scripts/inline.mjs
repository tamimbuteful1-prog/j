/* Bundle the built site into one self-contained HTML file.
   Usage: node scripts/inline.mjs [fragmentOutPath]

   - burhan-presentation.html : a complete document, openable offline and
     small enough to email or hand over on a USB stick.
   - fragmentOutPath (optional) : the same page without the
     <!doctype>/<html>/<head>/<body> wrapper, for hosts that supply their
     own document shell. It sets dir/lang from script, since it does not
     own the <html> element. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = readdirSync(join(root, "assets"));

const css = readFileSync(join(root, "assets", assets.find((f) => f.endsWith(".css"))), "utf8");
const js = readFileSync(join(root, "assets", assets.find((f) => f.endsWith(".js"))), "utf8");

const FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">';

const standalone = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#05070F">
<title>بُرهان · التوأم الرقابي</title>
${FONTS}
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${js}</script>
</body>
</html>
`;

writeFileSync(join(root, "burhan-presentation.html"), standalone);

const fragmentOut = process.argv[2];
if (fragmentOut) {
  writeFileSync(
    fragmentOut,
    `<title>بُرهان · التوأم الرقابي</title>
${FONTS}
<style>${css}</style>
<div id="root"></div>
<script>
  /* This page does not own the <html> element, so claim the document
     direction here: the layout and several selectors depend on it. */
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
</script>
<script type="module">${js}</script>
`
  );
}
