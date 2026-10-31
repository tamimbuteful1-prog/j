import { defineConfig, type Plugin } from 'vite';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PDF_DIR = resolve(__dirname, 'sources/pdf');

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
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.anthropic.com https://api.openai.com",
  "frame-src 'self'",
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
  plugins: [csp(), referencePdfs()],
  build: { outDir: 'dist', sourcemap: false, target: 'es2020' },
});
