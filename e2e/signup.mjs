/**
 * e2e — מסך ההרשמה של אורביט (SIGNUP מיתוג 4).
 *
 * מזריק config **עם** firebase (ענן דלוק) ⇒ מסך ההרשמה עולה עם הקופי הנעול
 * (הכדור עולה בדסקטופ, או נפילה סטטית). בודק שהכפתורים המשניים פותחים את
 * המתאים (חנות / נחזור-אליכם), ושהלשוניות עובדות. סקריפט **נפרד** —
 * toggle-matrix/demo/launch מזריקים בלי firebase ולכן לא רואים את המסך הזה
 * ונשארים ירוקים ללא שינוי.
 *
 *   npm run build && node e2e/signup.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch {
    res.statusCode = 404;
    res.end('nf');
  }
});
await new Promise((r) => server.listen(4191, r));
const BASE = 'http://localhost:4191/';

let fails = 0;
const t = (name, ok, extra = '') => {
  console.log((ok ? '  ✅ ' : '  ❌ ') + name + (ok ? '' : '  ← ' + extra));
  if (!ok) fails++;
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

console.log('\n🪐 מסך ההרשמה של אורביט (ענן דלוק)');
await page.goto(BASE, { waitUntil: 'networkidle' });
// config עם firebase (dummy — לא מתחברים בפועל; onAuthStateChanged יורה null אופליין)
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem(
    'maor_org_config',
    JSON.stringify({
      slug: 'default',
      orgName: 'עמותת מבחן',
      theme: 'or-rishon',
      modules: {},
      firebase: { apiKey: 'demo-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: '1:1:web:1' },
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500); // המתנה ל-watchAuth (null) ⇒ מסך ההרשמה

const body = (await page.locator('body').textContent().catch(() => '')) ?? '';
t('מסך ההרשמה עלה עם הכותרת החדשה (22.10)', body.includes('מערכת אחת.') && body.includes('שליטה מלאה.'));
t('תת-הכותרת הנעולה מופיעה', body.includes('שמחברת את כל הפעילות שלכם למקום אחד'));
t('מיתוג נגזר-ארגון (שם-הארגון בכותרת) — בלי "אורביט"/ORBIT קשיח', body.includes('עמותת מבחן') && !body.includes('© 2026 ORBIT') && !body.includes('אורביט היא מערכת'));
t('ההרשמה = אשף 5-שלבים, שלב 1 (תחום)', body.includes('שלב 1 מתוך 5') && body.includes('תחום העסק'));
t('הבאדג׳ האמיתי (בלי WebAuthn) — "הצפנה במנוחה"', body.includes('הצפנה במנוחה') && !body.includes('WebAuthn'));

// אשף 5-השלבים (SIGNUP3) — מעבר מלא: תחום→גודל→צרכים→קשר
await page.locator('.orbit-card button', { hasText: 'קליניקה' }).first().click();
await page.waitForTimeout(150);
await page.locator('.orbit-card button', { hasText: 'הבא' }).first().click();
await page.waitForTimeout(250);
let wz = (await page.locator('.orbit-card').textContent().catch(() => '')) ?? '';
t('אשף — שלב 2 (גודל)', wz.includes('שלב 2 מתוך 5') && wz.includes('גודל הארגון'));
await page.locator('.orbit-card button', { hasText: 'בינוני' }).first().click();
await page.waitForTimeout(150);
await page.locator('.orbit-card button', { hasText: 'הבא' }).first().click();
await page.waitForTimeout(250);
wz = (await page.locator('.orbit-card').textContent().catch(() => '')) ?? '';
t('אשף — שלב 3 (צרכים, אופציונלי)', wz.includes('שלב 3 מתוך 5') && wz.includes('חשוב לכם'));
await page.locator('.orbit-card button', { hasText: 'הבא' }).first().click(); // דלגו על צרכים
await page.waitForTimeout(250);
wz = (await page.locator('.orbit-card').textContent().catch(() => '')) ?? '';
t('אשף — שלב 4 (פרטי קשר)', wz.includes('שלב 4 מתוך 5') && wz.includes('שם הארגון') && wz.includes('שם איש קשר'));
// חזרה ללשונית ההרשמה מאותחלת לבדיקות ההמשך (הכפתורים המשניים)
await page.locator('.orbit-card button', { hasText: '→ הקודם' }).first().click();
await page.waitForTimeout(200);

// 🛒 החנות (22.10, במקום עיתון+סרטון) — נפתחת ב-iframe, ו"פתיחת המערכת" שבתוכה
// מחזירה להרשמה עם התחום מסומן (postMessage מאותו origin)
t('רצועת-המסכים מוצגת מתחת', (await page.locator('.orbit-reel-item').count()) >= 13);
await page.locator('button', { hasText: '🛒 החנות שלנו' }).click();
await page.waitForTimeout(800);
t('כפתור החנות פותח את החנות (iframe)', (await page.locator('.orbit-store iframe').count()) > 0);
const sf = page.frameLocator('.orbit-store iframe');
await sf.locator('[data-ed]').first().waitFor({ timeout: 10000 });
const edId = await sf.locator('[data-ed]').first().getAttribute('data-ed');
await sf.locator('[data-ed]').first().click();
await sf.locator('[data-signup]').first().click();
await sf.locator('[data-start]').first().click();
await page.waitForTimeout(500);
t('"פתיחת המערכת" בחנות סוגרת אותה וחוזרת לאשף', (await page.locator('.orbit-store').count()) === 0 && ((await page.locator('.orbit-card').textContent()) ?? '').includes('שלב 1 מתוך 5'));
t('התחום מהחנות מסומן באשף', !edId || (await page.locator('.orbit-choice.on').count()) === 1);
await page.locator('button', { hasText: '🛒 החנות שלנו' }).click();
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
t('Escape סוגר את החנות', (await page.locator('.orbit-store').count()) === 0);

// נחזור אליכם
await page.locator('button', { hasText: '📞 חזרו אליי' }).click();
await page.waitForTimeout(400);
t('כפתור "חזרו אליי" פותח את מודאל החזרה', ((await page.locator('.orbit-overlay').textContent().catch(() => '')) ?? '').includes('נחזור אליכם בשיחה'));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// לשונית כניסה — אימייל+סיסמה בלבד
await page.locator('button.orbit-tab', { hasText: 'כניסה' }).click();
await page.waitForTimeout(300);
const loginBody = (await page.locator('.orbit-card').textContent().catch(() => '')) ?? '';
t('לשונית הכניסה — שכחתי סיסמה, בלי שדות הרשמה', loginBody.includes('שכחתי סיסמה') && !loginBody.includes('שם הארגון'));

t('אפס שגיאות JS לא-מטופלות', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
server.close();
console.log(fails === 0 ? '\n🏆 מסך ההרשמה מחווט מקצה-לקצה' : `\n💥 ${fails} כשלים`);
process.exit(fails === 0 ? 0 : 1);
