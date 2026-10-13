/**
 * סמוק שומר-מסך במעקב-טיפול (17.9): מסך-השמות ← סינון-שלב + גלילת-טבלה ← לחיצה על שורה ⇒ כרטיס ⇒
 * "→ כל התומכים" ⇒ מסך-השמות פתוח מאליו, אותו סינון, אותה גלילה. וגם: הלוח פתוח + מסנן ⇒ כרטיס ⇒ חזרה
 * ⇒ הלוח עדיין פתוח עם המסנן. דורש build.
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
await new Promise((r) => server.listen(8268, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 700 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
// המאגר נזרע לפני הטעינה הראשונה (IndexedDB ריק ⇒ localStorage הוא המקור): דמו + 6 תיקי-מעקב עם 5 שמות כל אחד.
const demo = JSON.parse(readFileSync(join(HERE, '..', 'public', 'demo.json'), 'utf8'));
demo.supporters.slice(0, 6).forEach((sp, i) => { sp.ayin = { stage: i % 2 ? 'lead' : 'eyes', names: Array.from({ length: 5 }, (_, j) => ({ id: 'n' + i + j, name: 'שם ' + i + '-' + j, eyes: '', done: false })), log: [], answers: [], paid: false, lastTouch: '', answerPushed: false }; });
await pg.addInitScript(({ c, dbJson }) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); localStorage.setItem('maor_db', dbJson); }, { c: cfg, dbJson: JSON.stringify(demo) });
await pg.goto('http://localhost:8268/'); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(1200);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(800);

/* (א) הלוח: פתיחה + מסנן ⇒ כרטיס ⇒ חזרה */
await pg.locator('button', { hasText: '▼ הצגה' }).first().click(); await pg.waitForTimeout(500);
const regionSel = pg.locator('select[aria-label="אזור טלפון"], select[aria-label="אזור"]').last();
const boardSelects = await pg.locator('main .card select').count();
ok('הלוח נפתח (' + boardSelects + ' בוררים)');
const stageChips = pg.locator('button.chip', { hasText: /בהכנה|רישום/ }).first();
if (await stageChips.count()) { await stageChips.click(); await pg.waitForTimeout(300); }
const rowsBefore = await pg.locator('.ayin-row[role="button"]').count();
await pg.locator('.ayin-row[role="button"]').first().click(); await pg.waitForTimeout(800);
(await pg.locator('button', { hasText: '→ כל ' }).count()) === 1 ? ok('לוח ⇒ כרטיס נפתח') : fail('הכרטיס לא נפתח מהלוח');
await pg.locator('button', { hasText: '→ כל ' }).first().click(); await pg.waitForTimeout(800);
(await pg.locator('button', { hasText: '▲ הסתרה' }).count()) === 1 ? ok('חזרה: הלוח עדיין פתוח (לא התקפל)') : fail('הלוח התקפל בחזרה');
(await pg.locator('.ayin-row[role="button"]').count()) === rowsBefore ? ok('חזרה: אותו סינון בלוח (' + rowsBefore + ' שורות)') : fail('סינון-הלוח אופס: ' + (await pg.locator('.ayin-row[role="button"]').count()) + ' ≠ ' + rowsBefore);

/* (ב) מסך-השמות: סינון + גלילה ⇒ כרטיס ⇒ חזרה */
await pg.locator('button', { hasText: '📋 כל ה' }).first().click(); await pg.waitForTimeout(700);
const modal = pg.locator('[role="dialog"], .modal').last();
const search = modal.locator('input').first();
await search.fill('שם'); await pg.waitForTimeout(400);
const tableBox = modal.locator('div[style*="overflow-y: auto"], div[style*="overflowY"]').first();
const wrap = modal.locator('table').first().locator('xpath=..');
await wrap.evaluate((el) => { el.scrollTop = 150; }); await pg.waitForTimeout(400);
const scrolled = await wrap.evaluate((el) => el.scrollTop);
scrolled > 0 ? ok('מסך-השמות: גלילת-הטבלה ' + scrolled + 'px') : fail('הטבלה לא גלילה (' + scrolled + ')');
const rowsNames = await modal.locator('tbody tr').count();
await modal.locator('tbody tr').first().click(); await pg.waitForTimeout(800);
(await pg.locator('[role="dialog"], .modal').count()) === 0 && (await pg.locator('button', { hasText: '→ כל ' }).count()) === 1 ? ok('שורה ⇒ הכרטיס נפתח והמסך מכוסה') : fail('הכרטיס לא נפתח ממסך-השמות');
await pg.locator('button', { hasText: '→ כל ' }).first().click(); await pg.waitForTimeout(900);
const modal2 = pg.locator('[role="dialog"], .modal').last();
(await modal2.count()) === 1 && (await modal2.textContent() || '').includes('הרשימה המלאה') ? ok('חזרה: מסך-השמות נפתח מאליו') : fail('מסך-השמות לא חזר');
(await modal2.locator('input').first().inputValue()) === 'שם' ? ok('חזרה: טקסט-החיפוש נשמר') : fail('החיפוש אופס');
(await modal2.locator('tbody tr').count()) === rowsNames ? ok('חזרה: אותן ' + rowsNames + ' שורות') : fail('שורות שונות');
const wrap2 = modal2.locator('table').first().locator('xpath=..');
const restored = await wrap2.evaluate((el) => el.scrollTop);
Math.abs(restored - scrolled) <= 2 ? ok('חזרה: גלילת-הטבלה שוחזרה (' + restored + 'px)') : fail('גלילה לא שוחזרה: ' + restored + ' ≠ ' + scrolled);
await modal2.locator('button', { hasText: 'סגירה' }).first().click(); await pg.waitForTimeout(300);
(await pg.locator('[role="dialog"], .modal').count()) === 0 ? ok('"סגירה" סוגרת (ולא חוזר לבד)') : fail('המודאל לא נסגר');
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
