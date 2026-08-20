/**
 * סמוק-חיווט-צולב (20.8, בקשת-בעלים "תבדוק חיווט אחד שהכל מתעדכן"):
 * פעולה אחת — תרומת ₪1,000 שנרשמת בחייגן — ומאמתים שהיא מתעדכנת בכל המשטחים:
 * ‏(1) שורת-ההקשר בחייגן (סה"כ) ‏(2) טבלת-התורמים (סה"כ ₪ ברשימה)
 * ‏(3) כרטיס-התומך (שורת-התרומה עם D-) ‏(4) כרטיס-התרומות במסך-הבית ("לכולל").
 * וגם: שם-לטיפול שנרשם בחייגן מופיע בכרטיס-התומך (מעקב-הטיפול) — מקור-אמת אחד.
 * דורש build קודם (npm run build). מוסכמות serve/chrome — כמו demo-link.mjs.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8233, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
/** המספר מתוך '₪705,000' וכד'. */
const shekels = (t) => Number((t.match(/₪\s*([\d,]+)/)?.[1] ?? '').replace(/,/g, ''));

await pg.addInitScript(() => {
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, telephony: { enabled: true, city: 'jerusalem' } }));
});
await pg.goto('http://localhost:8233/');
await pg.waitForSelector('main', { timeout: 20000 });

/* ── זריעה + מדידת-בסיס במסך-הבית ── */
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('button', { hasText: 'בית' }).first().click();
await pg.waitForTimeout(600);
const homeVals = await pg.locator('.hm-stat-value').allTextContents();
const homeBefore = shekels(homeVals.find((t) => t.includes('₪')) ?? '');
Number.isFinite(homeBefore) && homeBefore > 0
  ? ok('בית · כרטיס-התרומות לפני: ₪' + homeBefore.toLocaleString('en-US'))
  : fail('לא נמצא כרטיס-תרומות בבית: ' + JSON.stringify(homeVals));

/* ── הפעולה האחת: תרומת ₪1,000 בחייגן + שם-לטיפול ── */
await pg.locator('button', { hasText: 'תורמים' }).first().click();
await pg.waitForTimeout(500);
await pg.locator('button', { hasText: 'חייגן' }).first().click();
await pg.waitForTimeout(600);
const spInfo = await pg.evaluate(() => {
  const db = JSON.parse(localStorage.getItem('maor_db'));
  const id = db.ui?.dialer?.queue?.[0] ?? '';
  const sp = db.supporters.find((s) => s.id === id);
  return { id, name: sp?.name ?? '' };
});
spInfo.name ? ok('המתקשר הנוכחי: ' + spInfo.name) : fail('אין מתקשר בחייגן');
// סה"כ בשורת-ההקשר של החייגן — לפני
const ctxBefore = shekels((await pg.locator('text=/סה"כ:/').first().textContent()) ?? '');
// שם-לטיפול תוך-שיחה
await pg.locator('button', { hasText: '🕯' }).first().click();
await pg.waitForTimeout(300);
await pg.locator('input[placeholder="שם לטיפול…"]').first().fill('חיווט בן בדיקה');
await pg.getByRole('button', { name: '➕', exact: true }).click();
await pg.waitForTimeout(400);
// תרומה ₪1,000 דרך תרם/ה
await pg.locator('button', { hasText: '💰 תרם/ה' }).click();
await pg.waitForTimeout(500);
await pg.getByLabel(/סכום/).first().fill('1000');
await pg.locator('button', { hasText: 'רישום' }).first().click();
await pg.waitForTimeout(900);
ok('נרשמה תרומת ₪1,000 + שם-לטיפול — עכשיו בודקים שהכל התעדכן');

/* ── משטח 1: החייגן חזר עם המתקשר הבא; ↩ מחזיר ורואים סה"כ מעודכן ── */
await pg.locator('button', { hasText: '↩ ביטול אחרון' }).click(); // מחזיר את התורם לחזית — לבדיקת שורת-ההקשר
await pg.waitForTimeout(500);
const ctxAfter = shekels((await pg.locator('text=/סה"כ:/').first().textContent()) ?? '');
ctxAfter === ctxBefore + 1000
  ? ok(`חייגן · שורת-ההקשר התעדכנה (₪${ctxBefore.toLocaleString('en-US')} → ₪${ctxAfter.toLocaleString('en-US')})`)
  : fail(`חייגן · סה"כ לא התעדכן: ${ctxBefore} → ${ctxAfter}`);
// סוגרים את החייגן (מזעור) — הקמפיין נשאר
await pg.locator('button', { hasText: 'מזעור' }).click();
await pg.waitForTimeout(400);

/* ── משטח 2: טבלת-התורמים — סה"כ ₪ של השורה ── */
await pg.locator('input[placeholder*="חיפוש"]').first().fill(spInfo.name);
await pg.waitForTimeout(500);
const rowTxt = (await pg.locator('table tbody tr', { hasText: spInfo.name }).first().textContent().catch(() => '')) ?? '';
const expectedTotal = await pg.evaluate((id) => {
  const db = JSON.parse(localStorage.getItem('maor_db'));
  const sp = db.supporters.find((s) => s.id === id);
  const hist = (sp.hist ?? []).reduce((a, h) => a + (h.c === '$' ? 0 : h.a), 0);
  return Math.round((sp.ils || 0) + hist);
}, spInfo.id);
rowTxt.replace(/,/g, '').includes(String(expectedTotal))
  ? ok(`רשימת-התורמים · השורה מציגה את הסה"כ המעודכן (₪${expectedTotal.toLocaleString('en-US')} — כולל היסטוריה)`)
  : fail(`רשימת-התורמים · הסה"כ לא התעדכן (מצופה ${expectedTotal}): ` + rowTxt.slice(0, 120));

/* ── משטח 3: כרטיס-התומך — שורת-התרומה + שם-הטיפול ── */
await pg.locator('table tbody tr', { hasText: spInfo.name }).first().click();
await pg.waitForTimeout(600);
const cardTxt = (await pg.locator('main').textContent()) ?? '';
cardTxt.includes('1,000') || cardTxt.includes('1000')
  ? ok('כרטיס-התומך · התרומה ₪1,000 מופיעה')
  : fail('כרטיס-התומך · התרומה לא מופיעה');
cardTxt.includes('חיווט בן בדיקה')
  ? ok('כרטיס-התומך · השם-לטיפול שנרשם בחייגן מופיע במעקב')
  : fail('כרטיס-התומך · השם-לטיפול לא מופיע');

/* ── משטח 4: מסך-הבית — כרטיס-התרומות עלה בדיוק ב-₪1,000 ── */
await pg.locator('button', { hasText: 'בית' }).first().click();
await pg.waitForTimeout(700);
const homeVals2 = await pg.locator('.hm-stat-value').allTextContents();
const homeAfter = shekels(homeVals2.find((t) => t.includes('₪')) ?? '');
homeAfter === homeBefore + 1000
  ? ok(`בית · כרטיס-התרומות התעדכן (₪${homeBefore.toLocaleString('en-US')} → ₪${homeAfter.toLocaleString('en-US')})`)
  : fail(`בית · כרטיס-התרומות לא התעדכן: ${homeBefore} → ${homeAfter}`);

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS בכל המסלול');

console.log(`\n── סיכום חיווט-צולב ──\n${passed}/${passed + failed} עברו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
