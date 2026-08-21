// בדיקת-אמת CLOUD2 — ארגון test-demo מול הפרויקט החי (maor-system).
// מתעדת צעד-צעד מה נצפה: מסך כניסה/הרשמה → ניסיון הרשמה → התוצאה.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// נתיב יחסי לריפו (כמו e2e/signup.mjs) — לא נתיב-מכונה קשיח
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const f = join(DIST, p);
  if (existsSync(f)) {
    res.writeHead(200, { 'content-type': MIME[extname(f)] ?? 'application/octet-stream' });
    res.end(readFileSync(f));
  } else {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(4183, r));

// בסביבת הרצה מרוחקת התעבורה יוצאת דרך proxy — מעבירים אותו ל-Chromium
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', ...(proxy ? ['--proxy-server=' + proxy] : [])],
});
const page = await browser.newPage();
const log = (s) => console.log('▶ ' + s);
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error] ' + m.text().slice(0, 200)); });
page.on('request', (r) => { if (r.url().includes('googleapis')) console.log('  [req] ' + r.url().slice(0, 100)); });
page.on('response', (r) => { if (r.url().includes('googleapis')) console.log('  [res ' + r.status() + '] ' + r.url().slice(0, 100)); });
page.on('requestfailed', (r) => { if (!r.url().includes('localhost')) console.log('  [net-fail] ' + r.url().slice(0, 90) + ' ← ' + (r.failure()?.errorText ?? '')); });

log('שלב 1: פתיחת ?org=test-demo (אין קובץ סטטי — צפוי fallback לקונפיג-השורש עם firebase)');
await page.goto('http://localhost:4183/?org=test-demo', { waitUntil: 'networkidle', timeout: 45000 }).catch((e) => log('goto: ' + e.message.slice(0, 120)));
await page.waitForTimeout(4000);
const body1 = (await page.locator('body').textContent().catch(() => '')) ?? '';
log('מסך התחלתי: ' + (body1.includes('כניסה') ? 'מסך כניסה מוצג ✓' : body1.slice(0, 120)));
log('לשונית הרשמה: ' + (body1.includes('הרשמה') ? 'קיימת ✓' : 'לא נמצאה ✗'));

// SIGNUP3: לשונית "הרשמה" מרנדרת את אשף 5-השלבים (SignupWizard) — לא טופס
// סיסמה-כפולה עם submit (הסלקטורים הישנים מתים). כאן בדיקת-אמת רזה של משטח-
// CLOUD2 בלבד: האשף עולה בשלב 1; המעבר המלא נבדק ב-e2e/signup.mjs.
if (body1.includes('הרשמה')) {
  log('שלב 2: מעבר ללשונית הרשמה — צפוי אשף 5-שלבים (SIGNUP3), שלב 1');
  await page.locator('button', { hasText: 'הרשמה' }).first().click();
  await page.waitForTimeout(400);
  const wz = (await page.locator('.orbit-card').textContent().catch(() => '')) ?? '';
  if (wz.includes('שלב 1 מתוך 5') && wz.includes('תחום העסק')) {
    log('תוצאה: ✅ אשף-ההרשמה עלה בשלב 1 (תחום) — משטח-ההרשמה של CLOUD2 חי');
  } else {
    log('תוצאה: ✗ אשף-ההרשמה לא עלה בשלב 1 — נצפה: ' + wz.slice(0, 200));
  }
}

await browser.close();
server.close();
