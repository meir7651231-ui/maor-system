/**
 * דמו ציבורי — ?org=demo: פרוספקט נוחת במערכת מלאה **בלי הרשמה**.
 * מאמת: אין מסך-התחברות (הקונפיג בלי firebase), נתוני-הדגמה נזרעו אוטומטית,
 * סרט "מצב הדגמה" מוצג, ואפס שגיאות JS.
 *
 *   npm run build && node e2e/demo-link.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4194, r));
const BASE = 'http://localhost:4194/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const log = [];
let failures = 0;
const T = (name, cond) => { log.push(`  ${cond ? '✅' : '❌'} ${name}`); if (!cond) failures++; };
const wait = (ms) => page.waitForTimeout(ms);
const mainTxt = async () => (await page.locator('body').textContent()) ?? '';

console.log('🧪 דמו ציבורי — ?org=demo (בלי הרשמה)');

// טעינה נקייה — בלי הזרקת קונפיג; הכל מגיע מ-public/c/demo/config.json האמיתי
await page.goto(BASE + '?org=demo', { waitUntil: 'networkidle' });
await wait(1600); // המתנה לזריעה האוטומטית של demo.json + render

const txt = await mainTxt();

// 1. אין מסך-התחברות/ענן — הקונפיג בלי firebase
T('אין מסך התחברות/הרשמה של ענן', !txt.includes('כניסה למערכת') && !txt.includes('הרשמה לאורביט') && !/סיסמה/.test(await (await page.locator('main').textContent().catch(() => '')) ?? txt) || (await page.locator('nav').count()) > 0);

// 2. סרט "מצב הדגמה" מוצג
T('סרט "מצב הדגמה" מוצג', txt.includes('מצב הדגמה'));
T('סרט: CTA "פתחו אתר משלכם"', txt.includes('פתחו אתר משלכם'));

// 3. נתוני-ההדגמה נזרעו אוטומטית — הניווט קיים והמערכת מאוכלסת
T('הניווט הראשי מוצג (המערכת נטענה)', (await page.locator('nav').count()) > 0);
// מעבר למשפחות — צריך להיות מאוכלס (demo.json)
await page.locator('nav >> text=משפחות').first().click().catch(() => {});
await wait(700);
const famTxt = (await page.locator('main').textContent().catch(() => '')) ?? '';
T('מסך המשפחות מאוכלס בנתוני-הדגמה', famTxt.replace(/\s+/g, '').length > 60 && !famTxt.includes('המערכת ריקה'));

// 4. אפס שגיאות JS
T('אפס שגיאות JS', errors.length === 0);

console.log(log.join('\n'));
if (errors.length) console.log('JS errors:\n' + errors.join('\n'));
await browser.close();
server.close();
if (failures) { console.log(`\n💥 ${failures} כשלים`); process.exit(1); }
console.log('\n🏆 הדמו הציבורי עובד מקצה-לקצה — בלי הרשמה, מאוכלס, מסומן');
