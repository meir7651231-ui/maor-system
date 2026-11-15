/**
 * W1-S6 · בדיקת-מוכנות הדמו במובייל (6.11.2026) — לפני שיחות-מכירה.
 * iPhone 13 · CPU מואט ×4 · ?org=demo · קריאה בלבד (לא כותב לענן; הדמו בלי firebase).
 *   node e2e/demo-mobile.mjs                    ← build מקומי (dist/, דורש npm run build)
 *   BASE=https://orbit-il.com/ node e2e/demo-mobile.mjs   ← האתר החי (קריאה בלבד)
 * מודד: זמן עד שנתוני-הדמו נראים (כרטיס "60 משפחות" בבית; יעד ≤5ש׳) · שגיאות-קונסולה (יעד 0)
 * · מעבר על 6 המסכים (בית/משפחות/חוגים/לוח/תורמים/הגדרות) עם צילום לכל מסך.
 */
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const THROTTLE = Number(process.env.THROTTLE ?? 4);
let server = null;
let BASE = process.env.BASE;
if (!BASE) {
  server = createServer((req, res) => {
    let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
    try {
      if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' }[extname(p)] ?? 'application/octet-stream';
      res.setHeader('content-type', mime);
      res.end(readFileSync(p));
    } catch { res.statusCode = 404; res.end('nf'); }
  });
  await new Promise((r) => server.listen(4196, r));
  BASE = 'http://localhost:4196/';
}
const LABEL = BASE.includes('localhost') ? 'local' : 'live';
const SHOTS = join(HERE, 'shots', 'demo-mobile-' + LABEL);
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'he-IL' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));

const results = [];
const T = (name, ok, extra = '') => { results.push({ name, ok, extra }); console.log((ok ? '  ✅ ' : '  ❌ ') + name + (extra ? ' — ' + extra : '')); };

const t0 = Date.now();
await page.goto(BASE + '?org=demo', { waitUntil: 'commit' });
let tData = null;
try {
  await page.locator('button:visible', { hasText: 'משפחות' }).filter({ hasText: '60' }).first().waitFor({ state: 'visible', timeout: 20000 });
  tData = Date.now() - t0;
} catch { /* tData נשאר null */ }
T('נתוני-הדמו נראים בבית (≤5ש׳)', tData !== null && tData <= 5000, tData === null ? 'לא נראו תוך 20ש׳' : tData + 'ms');
T('סרט "מצב הדגמה"', await page.getByText('מצב הדגמה').first().isVisible().catch(() => false));
await page.waitForTimeout(800);
// 🐛 W1-S6: זריעת-הדמו הציגה "הנתונים שוחזרו מהגיבוי" — מבלבל מול פרוספקט
T('אין טוסט "שוחזרו מהגיבוי" בנחיתה בדמו', (await page.getByText('שוחזרו מהגיבוי').count()) === 0);
await page.screenshot({ path: join(SHOTS, '1-home.png') });

const bottom = page.locator('nav:visible').last();
async function viaMore(label) {
  await bottom.getByText('עוד').first().click();
  await page.waitForTimeout(400);
  await page.locator('.modal-back, [role=dialog]').getByText(label, { exact: false }).first().click();
}
const screens = [
  { n: '2-families', label: 'משפחות', go: () => bottom.getByText('משפחות').first().click(), expect: 'כהן' },
  { n: '3-courses', label: 'חוגים', go: () => bottom.getByText('חוגים').first().click(), expect: 'אנגלית' },
  { n: '4-calendar', label: 'לוח', go: () => bottom.getByText('לוח').first().click(), expect: null },
  { n: '5-supporters', label: 'תורמים', go: () => viaMore('תורמים'), expect: 'גרינוולד' },
  { n: '6-settings', label: 'הגדרות', go: () => viaMore('הגדרות'), expect: null },
];
for (const s of screens) {
  const ts = Date.now();
  let ok = true, why = '';
  try {
    await s.go();
    if (s.expect) await page.getByText(s.expect).first().waitFor({ state: 'visible', timeout: 8000 });
    else await page.waitForTimeout(1200);
  } catch (e) { ok = false; why = String(e).split('\n')[0].slice(0, 120); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, s.n + '.png') });
  T('מסך ' + s.label + (s.expect ? ' (מאוכלס)' : ''), ok, ok ? Date.now() - ts + 'ms' : why);
  if (await page.locator('.modal-back').count()) { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(300); }
}
// אין גלילה-אופקית בעמוד (16px gutter / מובייל)
const hScroll = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
T('אין גלילה אופקית במובייל', hScroll <= 1, 'עודף ' + hScroll + 'px');
T('אפס שגיאות-קונסולה', errors.length === 0, errors.slice(0, 5).join(' | '));

const failed = results.filter((r) => !r.ok).length;
console.log('📊 demo-mobile ' + JSON.stringify({ target: LABEL, base: BASE, throttle: THROTTLE, tDataMs: tData, consoleErrors: errors.length, passed: results.length - failed, failed, shots: SHOTS }));
await browser.close();
server?.close();
process.exit(failed ? 1 : 0);
