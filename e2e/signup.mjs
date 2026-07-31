/**
 * e2e — מסך ההרשמה של אורביט (SIGNUP מיתוג 4).
 *
 * מזריק config **עם** firebase (ענן דלוק) ⇒ מסך ההרשמה עולה עם הקופי הנעול
 * (הכדור עולה בדסקטופ, או נפילה סטטית). בודק שהכפתורים המשניים פותחים את
 * המתאים (עיתון / נחזור-אליכם), ושהלשוניות עובדות. סקריפט **נפרד** —
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
t('מסך ההרשמה עלה עם הקופי הנעול', body.includes('הוא צריך') && body.includes('מוח'));
t('תת-הכותרת הנעולה מופיעה', body.includes('מערכת ההפעלה שמחברת את כל העסק למקום אחד'));
t('כרטיס-הזכוכית מציג את לשונית ההרשמה', body.includes('שם הארגון') && body.includes('שם איש קשר'));
t('הבאדג׳ האמיתי (בלי WebAuthn) — "הצפנה במנוחה"', body.includes('הצפנה במנוחה') && !body.includes('WebAuthn'));

// עיתון
await page.locator('button', { hasText: '📰 עיתון' }).click();
await page.waitForTimeout(500);
t('כפתור העיתון פותח את הקורא (iframe)', (await page.locator('.orbit-reader iframe').count()) > 0);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
t('Escape סוגר את העיתון', (await page.locator('.orbit-reader').count()) === 0);

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
