import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIST = new URL('../dist/', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    let f = normalize(join(DIST, p));
    if (!f.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (!existsSync(f)) f = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }).end(await readFile(f));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
// root config (has firebase) ⇒ LoginScreen. no override.
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/signup-landing.png' });
console.log('landing shot');

// try to open the signup wizard (tab "הרשמה")
async function clickText(txt) {
  const el = await page.$(`text=${txt}`);
  if (el) { await el.click().catch(() => {}); await page.waitForTimeout(700); return true; }
  return false;
}
await clickText('הרשמה');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/signup-step1.png' });
console.log('step1 shot');

// pick a domain card if present, advance
const card = await page.$('button:has-text("עמותת חסד"), button:has-text("קליניקה"), [role=button]:has-text("חסד")');
if (card) { await card.click().catch(() => {}); await page.waitForTimeout(500); }
await clickText('הבא');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/signup-step2.png' });
console.log('step2 shot');

// mobile view of landing
const m = await browser.newPage({ viewport: { width: 402, height: 860 }, deviceScaleFactor: 2 });
await m.goto(base, { waitUntil: 'networkidle' });
await m.waitForTimeout(2500);
await m.screenshot({ path: '/tmp/signup-mobile.png' });
console.log('mobile shot · console errors:', errs.length ? errs.slice(0, 4) : 'none');
await browser.close();
server.close();
