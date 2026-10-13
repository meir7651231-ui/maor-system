/**
 * סמוק זיכרון-סינון (בקשת-בעלים 10.9): מסננים בתורמים ⇒ מעבר ללוח-השנה ⇒ חזרה ⇒ הסינון
 * והגלולות עדיין שם; אותו דבר בחוגים (יום) ובמשפחות (חיפוש). דורש build קודם.
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
await new Promise((r) => server.listen(8263, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const go = async (t) => { await pg.evaluate((t) => { const b=[...document.querySelectorAll('nav button, .side-link')].find(x=>x.textContent.trim().includes(t)); b && b.click(); }, t); await pg.waitForTimeout(900); };
await pg.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), cfg);
await pg.goto('http://localhost:8263/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }

/* תורמים: קטגוריה + תרומה-אחרונה + חיפוש ⇒ לוח ⇒ חזרה */
await go('תורמים');
const catSel = pg.locator('select[aria-label="קטגוריה"]').first();
const catVal = await catSel.locator('option').nth(1).getAttribute('value');
await catSel.selectOption(catVal); await pg.locator('select[aria-label="תרומה אחרונה"]').selectOption('m12'); await pg.waitForTimeout(400);
const search = pg.locator('main input[type="search"], main input[placeholder*="חיפוש"]').first();
await search.fill('הרב'); await pg.waitForTimeout(600);
const before = await pg.locator('main table tbody tr, main .card[role="button"]').count();
await go('לוח שנה'); (await pg.locator('select[aria-label="קטגוריה"]').count()) === 0 ? ok('עברנו ללוח-השנה (מסך-התורמים ירד)') : fail('לא עברנו מסך');
await go('תורמים');
(await pg.locator('select[aria-label="קטגוריה"]').inputValue()) === catVal ? ok('תורמים: הקטגוריה נשמרה אחרי חזרה (' + catVal + ')') : fail('קטגוריה אופסה');
(await pg.locator('select[aria-label="תרומה אחרונה"]').inputValue()) === 'm12' ? ok('תורמים: "תרומה אחרונה" נשמר') : fail('תרומה-אחרונה אופס');
(await pg.locator('main input[type="search"], main input[placeholder*="חיפוש"]').first().inputValue()) === 'הרב' ? ok('תורמים: טקסט-החיפוש נשמר') : fail('חיפוש אופס');
(await pg.locator('main table tbody tr, main .card[role="button"]').count()) === before ? ok(`תורמים: אותה רשימה מסוננת (${before})`) : fail('הרשימה השתנתה');
(await pg.locator('.active-filters .filter-pill').count()) >= 1 ? ok('תורמים: גלולות-הסינון מוצגות') : fail('אין גלולות');
await pg.locator('.filter-clear-all').first().click(); await pg.waitForTimeout(400);
await go('לוח שנה'); await go('תורמים');
(await pg.locator('select[aria-label="קטגוריה"]').inputValue()) === 'all' ? ok('תורמים: "נקה הכל" נזכר גם הוא (לא חוזר לסינון ישן)') : fail('נקה-הכל לא נזכר');

/* חוגים: יום ⇒ בית ⇒ חזרה */
await go('חוגים');
await pg.locator('select[aria-label="יום"]').selectOption('2'); await pg.waitForTimeout(400);
const crsN = await pg.locator('main .card[role="button"], main table tbody tr').count();
await go('בית'); await go('חוגים');
(await pg.locator('select[aria-label="יום"]').inputValue()) === '2' && (await pg.locator('main .card[role="button"], main table tbody tr').count()) === crsN ? ok('חוגים: סינון-היום נשמר (' + crsN + ')') : fail('חוגים: סינון-היום אופס');
await pg.locator('select[aria-label="יום"]').selectOption('all');

/* משפחות: חיפוש ⇒ לוח ⇒ חזרה */
await go('משפחות');
const famSearch = pg.locator('main input[type="search"], main input[placeholder*="חיפוש"]').first();
await famSearch.fill('כהן'); await pg.waitForTimeout(600);
await go('לוח שנה'); await go('משפחות');
(await pg.locator('main input[type="search"], main input[placeholder*="חיפוש"]').first().inputValue()) === 'כהן' ? ok('משפחות: טקסט-החיפוש נשמר') : fail('משפחות: חיפוש אופס');

errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
