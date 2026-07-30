// בדיקת-אמת CLOUD2 — ארגון test-demo מול הפרויקט החי (maor-system).
// מתעדת צעד-צעד מה נצפה: מסך כניסה/הרשמה → ניסיון הרשמה → התוצאה.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = '/home/user/maor-system/dist';
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

if (body1.includes('הרשמה')) {
  log('שלב 2: מעבר ללשונית הרשמה ומילוי הטופס');
  await page.locator('button', { hasText: 'הרשמה' }).first().click();
  await page.waitForTimeout(300);
  await page.locator('input').nth(0).fill('עמותת בדיקה');
  await page.locator('input[type="email"]').fill('maor.test.demo.cloud2@gmail.com');
  const passwords = page.locator('input[type="password"]');
  await passwords.nth(0).fill('test123456');
  await passwords.nth(1).fill('test123456');
  log('שלב 3: שליחת ההרשמה מול הפרויקט החי');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(25000);
  const body2 = (await page.locator('body').textContent().catch(() => '')) ?? '';
  if (body2.includes('הבקשה נקלטה')) log('תוצאה: ✅ ההרשמה עברה — מסך ההמתנה מוצג ("הבקשה נקלטה")');
  else if (body2.includes('ההרשמה סגורה')) log('תוצאה: ⛔ auth/operation-not-allowed — ההרשמה כבויה ב-Auth (צעד הבעלים)');
  else if (body2.includes('כבר רשום')) {
    log('תוצאה: המייל כבר רשום (המשתמש נוצר בבדיקה קודמת) — עוברים לכניסה');
    await page.locator('button', { hasText: 'כניסה' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('input[type="email"]').fill('maor.test.demo.cloud2@gmail.com');
    await page.locator('input[type="password"]').first().fill('test123456');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(10000);
    const body3 = (await page.locator('body').textContent().catch(() => '')) ?? '';
    if (body3.includes('הבקשה נקלטה')) log('כניסה: ✅ שער-החברות עבד — משתמש-ללא-חברות רואה את מסך ההמתנה, לא את האפליקציה');
    else log('כניסה: ' + body3.slice(0, 200));
  } else log('תוצאה: ' + body2.slice(0, 250));
}

await browser.close();
server.close();
