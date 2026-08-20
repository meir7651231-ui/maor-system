/**
 * סמוק מסך-השמות המלא (20.8, בקשת-בעלים "מה עם המסך טיפול"):
 * מוסיפים שם-לטיפול בכרטיס-תומכ/ת ← פותחים "📋 כל השמות" ← מאמתים שהשם
 * מופיע בטבלה החיה עם הסטטוס והשלב ← מסננים ← לוחצים על השורה ← חוזרים
 * לאותו כרטיס-תומכ/ת. דורש build קודם (npm run build).
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
await new Promise((r) => server.listen(8237, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };

await pg.addInitScript(() => {
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
});
await pg.goto('http://localhost:8237/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }

/* ── 1 · תורמים: פתיחת כרטיס והוספת שם-לטיפול ── */
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click();
await pg.waitForTimeout(700);
const firstRow = pg.locator('main table tbody tr').first();
// שם-התא כולל צ'יפים — לוקחים רק את שתי המילים הראשונות להשוואות בהמשך
const rawName = ((await firstRow.locator('td').first().textContent()) ?? '').trim();
const donorName = rawName.split(/\s+/).slice(0, 2).join(' ');
await firstRow.click();
await pg.waitForTimeout(700);
const nameIn = pg.locator('input[placeholder="שם לטיפול"]').first();
if (await nameIn.count()) {
  await nameIn.fill('בדיקת מסך השמות');
  await pg.locator('input[placeholder="כמות"]').first().fill('7');
  await pg.locator('button', { hasText: '+ הוספה' }).first().click();
  await pg.waitForTimeout(500);
  ok(`נוסף שם-לטיפול "בדיקת מסך השמות" (כמות 7) בכרטיס ${donorName}`);
} else fail('לא נמצא שדה שם-לטיפול בכרטיס');
await pg.locator('button', { hasText: '→ כל ' }).first().click();
await pg.waitForTimeout(500);

/* ── 2 · "📋 כל השמות" — הטבלה החיה מציגה את השם ── */
const namesBtn = pg.locator('button', { hasText: '📋 כל השמות' }).first();
if (!(await namesBtn.count())) fail('כפתור "📋 כל השמות" לא נמצא ליד לוח-הטיפול');
else {
  await namesBtn.click();
  await pg.waitForTimeout(600);
  const modal = pg.locator('[role="dialog"], .modal').first();
  const mTxt = (await modal.textContent().catch(() => '')) ?? '';
  mTxt.includes('הרשימה המלאה') ? ok('מסך-השמות נפתח') : fail('מסך-השמות לא נפתח');
  mTxt.includes('בדיקת מסך השמות') && mTxt.includes('ממתין')
    ? ok('השם שנוסף בכרטיס מופיע בטבלה החיה עם סטטוס "ממתין"')
    : fail('השם לא מופיע בטבלה: ' + mTxt.slice(0, 120));

  /* ── 3 · חיפוש מסנן: מחרוזת-זרה ⇒ ריק; המחרוזת הנכונה ⇒ השם חוזר ── */
  await modal.locator('input[type="search"]').fill('מחרוזת שלא קיימת');
  await pg.waitForTimeout(300);
  const emptyQ = (await modal.textContent()) ?? '';
  await modal.locator('input[type="search"]').fill('בדיקת מסך');
  await pg.waitForTimeout(300);
  const afterQ = (await modal.textContent()) ?? '';
  emptyQ.includes('אין תוצאות') && afterQ.includes('בדיקת מסך השמות')
    ? ok('החיפוש מסנן — מחרוזת-זרה מרוקנת, המחרוזת הנכונה מחזירה את השם')
    : fail('החיפוש לא סינן כמצופה');

  /* ── 4 · לחיצה על שורה ⇒ כרטיס-התומכ/ת ── */
  await modal.locator('tbody tr').first().click();
  await pg.waitForTimeout(700);
  const card = (await pg.locator('main').textContent()) ?? '';
  card.includes(donorName) && card.includes('בדיקת מסך השמות')
    ? ok(`השורה קפצה לכרטיס ${donorName} — שם עורכים`)
    : fail('הלחיצה לא הגיעה לכרטיס-התומכ/ת');
}

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS');

console.log(`\n── סיכום מסך-השמות ──\n${passed}/${passed + failed} עברו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
