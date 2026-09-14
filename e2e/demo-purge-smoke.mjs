/**
 * סמוק 🧹 הסרת נתוני-הדמו (14.9): דמו נטען ⇒ מוסיפים משפחה אמיתית ⇒ הגדרות ← איפוס ← בדיקה
 * ⇒ "נמצאו N" ⇒ שתי לחיצות ⇒ רק המשפחה האמיתית נשארת, מצבות למזהי-הדמו. דורש build קודם.
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
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(8264, r));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const dbRead = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
// המאגר נזרע לפני הטעינה הראשונה (IndexedDB ריק ⇒ localStorage הוא המקור): דמו + משפחה "אמיתית"
// שמזהה שלה אינו בקובץ-הדמו — בדיוק המצב של "דמו שהתערבב בנתונים אמיתיים".
const demo = JSON.parse(readFileSync(join(HERE, '..', 'public', 'demo.json'), 'utf8'));
demo.families.push({ ...demo.families[0], id: 'f-real-9', name: 'משפחה אמיתית' });
await pg.addInitScript((dbJson) => { localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'x', theme: 'or-rishon', modules: {} })); localStorage.setItem('maor_db', dbJson); }, JSON.stringify(demo));
await pg.goto('http://localhost:8264/'); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(1200);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
const before = await dbRead();
before.families.length === 61 && before.supporters.length === 15 ? ok(`לפני: ${before.families.length} משפחות (60 דמו + 1 אמיתית), ${before.supporters.length} תורמים`) : fail('מצב-פתיחה שגוי: ' + before.families?.length);
await pg.evaluate(() => { const b=[...document.querySelectorAll('nav button, .side-link, .bottom-nav button')].find(x=>x.textContent.trim().includes('הגדרות')); b && b.click(); });
await pg.waitForTimeout(900);
// לשונית "🧪 מתקדם" ⇒ צ׳יפ "איפוס"
const advTab = pg.locator('button', { hasText: '🧪 מתקדם' }).first(); if (await advTab.count()) { await advTab.click(); await pg.waitForTimeout(400); }
const chip = pg.locator('button', { hasText: 'איפוס' }).first(); if (await chip.count()) { await chip.click(); await pg.waitForTimeout(500); }
const block = pg.locator('text=🧹 הסרת נתוני-הדמו בלבד');
(await block.count()) === 1 ? ok('בלוק "🧹 הסרת נתוני-הדמו בלבד" בסעיף-האיפוס') : fail('הבלוק חסר');
await pg.locator('button', { hasText: 'בדיקה — כמה רשומות-דמו' }).first().click(); await pg.waitForTimeout(1200);
const found = (await pg.locator('main').textContent()) || '';
const m = found.match(/נמצאו (\d+) רשומות-דמו/);
m && +m[1] >= 60 + 15 + 150 ? ok('בדיקה: ' + m[0] + ' (כולל משפחות/תורמים/שיבוצים…)') : fail('הבדיקה לא מצאה: ' + found.slice(found.indexOf('🧹'), found.indexOf('🧹') + 160));
const purge = pg.locator('button', { hasText: 'רשומות-הדמו' }).filter({ hasText: '🧹 הסרת' }).first();
await purge.click(); await pg.waitForTimeout(300);
(await pg.locator('button', { hasText: 'לחצו שוב לאישור ההסרה' }).count()) === 1 ? ok('לחיצה ראשונה חומשת — אין מחיקה') : fail('אין חימוש');
(await dbRead()).families.length === 61 ? ok('לחיצה ראשונה לא מחקה') : fail('נמחק בלחיצה אחת!');
await pg.locator('button', { hasText: 'לחצו שוב לאישור ההסרה' }).first().click(); await pg.waitForTimeout(1200);
const after = await dbRead();
after.families.length === 1 && after.families[0].id === 'f-real-9' ? ok('אחרי: נשארה רק המשפחה האמיתית') : fail('משפחות אחרי: ' + after.families.length);
after.supporters.length === 0 && after.enrollments.length === 0 && after.courses.length === 0 ? ok('תורמים/שיבוצים/חוגים של הדמו הוסרו') : fail('שאריות דמו: ' + [after.supporters.length, after.enrollments.length, after.courses.length]);
(after.delLog || []).some((x) => x.id === 'f128') && (after.delLog || []).some((x) => x.id === 'sp639') ? ok('מצבות-מחיקה למזהי-הדמו (הענן לא יחזיר אותם)') : fail('אין מצבות');
(after.receiptSeq ?? 0) === (before.receiptSeq ?? 0) ? ok('מוני-הקבלות לא נגעו') : fail('מונים השתנו');
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
