const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs');
const srv = http.createServer((q, r) => { r.writeHead(200, {'content-type':'text/html'}); r.end(fs.readFileSync(require('path').join(__dirname, 'blank.html'))); }).listen(5199);
(async () => {
  // Real requests with a deliberately invalid key: proves CORS behaviour without spending money.
  const b = await chromium.launch(process.env.HTTPS_PROXY ? { args: ['--proxy-server=' + process.env.HTTPS_PROXY] } : {});
  const ctx = await b.newContext({ ignoreHTTPSErrors: true });
  const p = await ctx.newPage(); await p.goto('http://localhost:5199/');
  const run = (url, opts) => p.evaluate(async ([url, opts]) => {
    try { const r = await fetch(url, opts); const t = await r.text(); return { status: r.status, body: t.slice(0, 300), reqId: r.headers.get('request-id') }; }
    catch (e) { return { error: String(e) }; }
  }, [url, opts]);
  const body = JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] });
  const base = { 'content-type': 'application/json', 'x-api-key': 'sk-ant-invalid-test-key', 'anthropic-version': '2023-06-01' };
  console.log('anthropic WITHOUT browser header:', JSON.stringify(await run('https://api.anthropic.com/v1/messages', { method: 'POST', headers: base, body })));
  console.log('anthropic WITH browser header   :', JSON.stringify(await run('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { ...base, 'anthropic-dangerous-direct-browser-access': 'true' }, body })));
  console.log('openai                          :', JSON.stringify(await run('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer sk-invalid' }, body: '{}' })));
  await b.close(); srv.close();
})();
