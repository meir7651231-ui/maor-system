/**
 * סמוק סינון "🕐 תרומה אחרונה" (בקשת-בעלים 6.9 "נעלם הסינון של תרומה אחרונה"):
 * הבורר גלוי בלי בחירת-תקופה ⇒ בחירת-דלי מסננת + גלולה ⇒ "נקה הכל" מאפס ⇒ בגריד יש
 * בורר-מיון עם "תרומה אחרונה". קונפיג-השורש בלי firebase. דורש build קודם.
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
await new Promise((r) => server.listen(8255, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 1366 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
await pg.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), cfg);
await pg.goto('http://localhost:8255/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(800);

const lastSel = pg.locator('select[aria-label="תרומה אחרונה"]');
(await lastSel.count()) === 1 && (await lastSel.first().isVisible()) ? ok('בורר "🕐 תרומה אחרונה" גלוי בלי בחירת שנה/חודש') : fail('בורר תרומה-אחרונה חסר');
(await pg.locator('select[aria-label="מצב תקופה"]').count()) === 0 ? ok('בורר-התקופה הישן עדיין מגודר-בתקופה (לא נמחק)') : fail('בורר-התקופה מוצג בלי תקופה');
const rowsAll = await pg.locator('main table tbody tr').count();
await lastSel.selectOption('m12'); await pg.waitForTimeout(600);
const rows12 = await pg.locator('main table tbody tr').count();
const pill = await pg.locator('.active-filters .filter-pill').allTextContents();
pill.some((t) => t.includes('תרומה אחרונה ב-12 החודשים')) ? ok('גלולת-סינון: ' + pill.find((t) => t.includes('תרומה אחרונה'))) : fail('גלולה חסרה: ' + JSON.stringify(pill));
rows12 <= rowsAll ? ok(`סינון 12 חודשים: ${rows12} מתוך ${rowsAll}`) : fail('הסינון הגדיל את הרשימה');
await lastSel.selectOption('never'); await pg.waitForTimeout(600);
const rowsNever = await pg.locator('main table tbody tr').count();
const emptyState = await pg.locator('main').textContent();
rowsNever + rows12 <= rowsAll ? ok(`"ללא תרומה": ${rowsNever} שורות (זר ל-12 חודשים)`) : fail('חפיפה בין הדליים');
void emptyState;
await pg.locator('.filter-clear-all').first().click(); await pg.waitForTimeout(500);
(await lastSel.inputValue()) === 'all' && (await pg.locator('main table tbody tr').count()) === rowsAll ? ok('"נקה הכל" מאפס את הבורר והרשימה חוזרת למלואה') : fail('נקה-הכל לא איפס');
// גריד ⇒ בורר-מיון
const gridBtn = pg.locator('button', { hasText: '▦ גריד' }).first();
if (await gridBtn.count()) {
  await gridBtn.click(); await pg.waitForTimeout(600);
  const sortSel = pg.locator('select[aria-label="מיון"]');
  (await sortSel.count()) === 1 ? ok('בגריד: בורר "↕ מיון" מוצג') : fail('בורר-מיון חסר בגריד');
  if (await sortSel.count()) {
    const opts = await sortSel.first().locator('option').allTextContents();
    opts.some((o) => o.includes('תרומה אחרונה')) ? ok('בורר-המיון כולל "תרומה אחרונה"') : fail('אין מיון לפי תרומה אחרונה: ' + JSON.stringify(opts));
    await sortSel.selectOption('last:desc'); await pg.waitForTimeout(500);
    const cards = await pg.locator('main .card[role="button"]').count();
    cards > 0 ? ok('מיון לפי תרומה אחרונה (יורד) — ' + cards + ' כרטיסים') : fail('אין כרטיסים אחרי מיון');
  }
  await pg.locator('button', { hasText: '☰ רשימה' }).first().click(); await pg.waitForTimeout(400);
  (await pg.locator('select[aria-label="מיון"]').count()) === 0 ? ok('חזרה לרשימה: בורר-המיון נעלם (הכותרות ממיינות)') : fail('בורר-מיון נשאר ברשימה');
} else fail('כפתור גריד לא נמצא');
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
