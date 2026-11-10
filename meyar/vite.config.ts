import { defineConfig, type Plugin } from 'vite';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { buildAssistantPrompt, buildZipReadme, zipPdfName } from './src/assistantPrompt';
import type { Corpus } from './src/types';

const PDF_DIR = resolve(__dirname, 'sources/pdf');
const CORPUS = resolve(__dirname, 'public/data/corpus.json');
const ZIP_NAME = 'miyaar-references.zip';

const loadDocs = () => (JSON.parse(readFileSync(CORPUS, 'utf8')) as Corpus).documents;

/** prompt.txt and the references ZIP are generated from the corpus metadata and
 *  the original PDFs, so they never drift from what the site itself cites. */
function buildDownloads(): { prompt: string; zip: Uint8Array } {
  const docs = loadDocs();
  const prompt = buildAssistantPrompt(docs);
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {
    'miyaar-references/prompt.txt': strToU8(prompt + '\n'),
    'miyaar-references/README.txt': strToU8(buildZipReadme(docs) + '\n'),
  };
  docs.forEach((d, i) => {
    const src = join(PDF_DIR, `${d.id}.pdf`);
    // PDFs are already compressed; store them as-is (level 0) to keep the build fast.
    files[`miyaar-references/${zipPdfName(d, i)}`] = [new Uint8Array(readFileSync(src)), { level: 0 }];
  });
  // Fixed timestamp keeps the ZIP byte-identical between builds.
  const zip = zipSync(files, { mtime: new Date('2026-11-01T00:00:00Z') });
  return { prompt, zip };
}

const downloads = (): Plugin => {
  let cache: { prompt: string; zip: Uint8Array } | null = null;
  const get = () => (cache ??= buildDownloads());
  return {
    name: 'meyar-downloads',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/prompt.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end(get().prompt);
        }
        if (url === '/' + ZIP_NAME) {
          res.setHeader('Content-Type', 'application/zip');
          return res.end(Buffer.from(get().zip));
        }
        next();
      });
    },
    closeBundle() {
      const { prompt, zip } = get();
      writeFileSync(resolve(__dirname, 'dist/prompt.txt'), prompt + '\n');
      writeFileSync(resolve(__dirname, 'dist', ZIP_NAME), zip);
    },
  };
};

// Original reference PDFs live in sources/pdf (single copy in the repo). They
// are served at /sources/<file>.pdf in dev and copied into dist/sources on build.
const referencePdfs = (): Plugin => ({
  name: 'meyar-reference-pdfs',
  configureServer(server) {
    server.middlewares.use('/sources', (req, res, next) => {
      const name = decodeURIComponent((req.url || '').replace(/^\//, '').split('?')[0]);
      if (!/^[a-z0-9-]+\.pdf$/.test(name) || !existsSync(join(PDF_DIR, name))) return next();
      res.setHeader('Content-Type', 'application/pdf');
      createReadStream(join(PDF_DIR, name)).pipe(res);
    });
  },
  closeBundle() {
    const out = resolve(__dirname, 'dist/sources');
    mkdirSync(out, { recursive: true });
    for (const f of readdirSync(PDF_DIR)) if (f.endsWith('.pdf')) copyFileSync(join(PDF_DIR, f), join(out, f));
  },
});

// Content-Security-Policy is injected only in the production build (the dev
// server needs inline scripts and a websocket for hot reload).
export const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.anthropic.com https://api.openai.com",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const csp = (): Plugin => ({
  name: 'meyar-csp',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
  },
});

export default defineConfig({
  base: './',
  plugins: [csp(), referencePdfs(), downloads()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    assetsInlineLimit: 0, // CSP: font-src 'self' (no data: URIs)
  },
});
