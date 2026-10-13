/**
 * סמוק חוגים 9.9 (חבילה ב׳): סינון-יום · סינון-מורה · עמודת מצב-משפחתי בכרטיס-החוג ·
 * ניהול-שיבוץ עם כפתור-שמירה אחד. דמו (14 חוגים, ימים 0–5, 3 מורות). דורש build קודם.
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
await new Promise((r) => server.listen(8257, r));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
await pg.addInitScript(() => localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} })));
await pg.goto('http://localhost:8257/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'חוגים' }).first().click(); await pg.waitForTimeout(1200);
const demo = await pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
// מסך-החוגים = גריד-כרטיסים (crsView='grid') — סופרים כרטיסים, ובנפילה שורות-טבלה.
const rows = async () => (await pg.locator('main .card[role="button"]').count()) || (await pg.locator('main table tbody tr').count());
const firstItem = () => pg.locator('main .card[role="button"], main table tbody tr').first();
const all = await rows();

/* (3) יום */
const daySel = pg.locator('select[aria-label="יום"]');
(await daySel.count()) === 1 ? ok('בורר "יום" מוצג במסך-החוגים') : fail('בורר יום חסר');
await daySel.selectOption('2'); await pg.waitForTimeout(500);
const expTue = demo.courses.filter((c) => c.sessions.some((s) => s.day === 2)).length;
const gotTue = await rows();
gotTue === expTue ? ok(`יום שלישי ⇒ ${gotTue} חוגים (תואם לדמו)`) : fail(`יום שלישי: ${gotTue} ≠ ${expTue}`);
await daySel.selectOption('all'); await pg.waitForTimeout(300);
(await rows()) === all ? ok('"כל הימים" מחזיר את כולם') : fail('איפוס יום לא החזיר');

/* (5) מורה */
const tSel = pg.locator('select[aria-label="מורה"]');
(await tSel.count()) === 1 ? ok('בורר "מורה" מוצג') : fail('בורר מורה חסר');
const tid = demo.teachers[0].id;
await tSel.selectOption(tid); await pg.waitForTimeout(500);
const expT = demo.courses.filter((c) => c.teacherId === tid).length;
const gotT = await rows();
gotT === expT ? ok(`מורה ${demo.teachers[0].name} ⇒ ${gotT} חוגים`) : fail(`מורה: ${gotT} ≠ ${expT}`);
// שילוב יום+מורה
await daySel.selectOption('0'); await pg.waitForTimeout(400);
const expBoth = demo.courses.filter((c) => c.teacherId === tid && c.sessions.some((s) => s.day === 0)).length;
(await rows()) === expBoth ? ok(`יום+מורה משולבים ⇒ ${expBoth}`) : fail('שילוב יום+מורה שגוי: ' + (await rows()));
await tSel.selectOption('all'); await daySel.selectOption('all'); await pg.waitForTimeout(300);

/* (6) מצב-משפחתי בכרטיס-החוג */
await firstItem().click(); await pg.waitForTimeout(800);
const heads = await pg.locator('main table thead th').allTextContents();
heads.includes('מצב משפחתי') ? ok('עמודת "מצב משפחתי" בטבלת-המשובצים') : fail('עמודה חסרה: ' + JSON.stringify(heads));
const idx = heads.indexOf('מצב משפחתי');
const cells = await pg.locator('main table tbody tr').evaluateAll((trs, i) => trs.map((tr) => (tr.children[i]?.textContent || '').trim()), idx);
cells.length > 0 && cells.every((c) => c.length > 0) ? ok(`כל ${cells.length} השורות עם ערך (ריק ⇒ "אין"): ${[...new Set(cells)].join(' · ')}`) : fail('תאים ריקים: ' + JSON.stringify(cells));

/* (7) ניהול-שיבוץ — כפתור אחד */
const manage = pg.locator('main table tbody tr').first().locator('button', { hasText: '⚙' }).first();
if (await manage.count()) {
  await manage.click(); await pg.waitForTimeout(600);
  const modal = pg.locator('[role="dialog"], .modal').last();
  const btns = await modal.locator('button').allTextContents();
  const saves = btns.filter((b) => b.includes('שמירה'));
  saves.length === 1 && saves[0].includes('שמירה וסגירה') ? ok('בניהול-שיבוץ כפתור-שמירה אחד: ' + saves[0]) : fail('כפתורי-שמירה: ' + JSON.stringify(saves));
  const noteIn = modal.locator('input[placeholder^="לדוגמה: רגישות"]');
  if (await noteIn.count()) {
    await noteIn.fill('הערת-בדיקה 9.9'); await modal.locator('button', { hasText: 'שמירה וסגירה' }).click(); await pg.waitForTimeout(600);
    const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}').enrollments.some((e) => e.note === 'הערת-בדיקה 9.9'));
    saved ? ok('ההערה נשמרה דרך הכפתור האחד ונסגר') : fail('ההערה לא נשמרה');
  } else fail('שדה-הערה חסר במודאל');
} else fail('כפתור ⚙ ניהול-שיבוץ לא נמצא בשורה');

errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
