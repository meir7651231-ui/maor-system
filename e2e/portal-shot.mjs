/**
 * צילום שער-ההצטרפות בעמוד-השיווק (פאזה 1) — מזריק קונפיג עם shell.portal + site.contact,
 * נכנס ל-?site, ומצלם: כפתור-צף → מרכז-כניסה → טופס-הורה רב-ערוצי.
 *   npm run build && node e2e/portal-shot.mjs   → e2e/shots-wave5/
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-wave5');
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.png': 'image/png' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4199, r));
const BASE = 'http://localhost:4199/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
let step = 90;
const shot = async (n) => { step++; await page.screenshot({ path: join(SHOTS, `${step}-${n}.png`) }); console.log('📸', n); };
const wait = (ms) => page.waitForTimeout(ms);

const CFG = JSON.stringify({
  slug: 'default', orgName: 'עמותת אור הדגמה', theme: 'or-rishon',
  features: { 'shell.portal': true },
  site: {
    enabled: true,
    hero: { title: { he: 'עמותת אור הדגמה' }, subtitle: { he: 'נותנים אור, יחד' } },
    contact: { whatsapp: '0501234567', phones: ['02-5556677'], email: 'info@or-demo.org.il' },
  },
});
await ctx.addInitScript((cfg) => { try { localStorage.setItem('maor_org_config', cfg); } catch { /* */ } }, CFG);

await page.goto(BASE + '?site', { waitUntil: 'networkidle' });
await wait(1200);
await shot('portal-button');

await page.locator('button', { hasText: 'הצטרפות' }).first().click().catch(() => {});
await wait(500);
await shot('portal-hub');

await page.locator('button', { hasText: 'הרשמת ילד' }).first().click().catch(() => {});
await wait(400);
// מילוי לפי סדר-השדות (ילד·הורה·טלפון·חוג·הערה) — טלפון+שם חובה כדי לחשוף את הערוצים
const vals = ['דנה כהן', 'רות כהן', '050-1234567', 'ציור ורישום', ''];
const inputs = page.locator('[role="dialog"] input');
for (let i = 0; i < vals.length; i++) { if (vals[i]) await inputs.nth(i).fill(vals[i]).catch(() => {}); }
await wait(600);
await shot('portal-form');

console.log('✅ done');
await browser.close();
server.close();
