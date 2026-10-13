/**
 * סמוק 🔁 בחירת-חזרה (16.9): בורר 40 יום/יומי/שבועי/חודשי בראש כרטיס-התורם ⇒ שבועי ×4 ⇒ 4 אירועים
 * + פאנל-סדרה ⇒ ✓ תזכורת ⇒ ביטול (דו-לחיצתי) ⇒ הכפתור חוזר; הסגולה נפרדת ועדיין זמינה. דורש build.
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
await new Promise((r) => server.listen(8266, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 1366 } });
const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const dbRead = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const weekly = async () => ((await dbRead()).events || []).filter((e) => (e.notes || '').startsWith('חזרה שבועית'));
await pg.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), cfg);
await pg.goto('http://localhost:8266/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(700);
await pg.locator('main table tbody tr').first().click(); await pg.waitForTimeout(800);

const chips = pg.locator('button.chip').filter({ hasText: /40 יום|יומי|שבועי|חודשי/ });
(await chips.count()) === 4 ? ok('בורר-חזרה: 4 צ׳יפים (40 יום · יומי · שבועי · חודשי)') : fail('צ׳יפים: ' + (await chips.count()));
(await pg.locator('button', { hasText: '🕯 40 ימים — התחלת סגולה' }).count()) === 1 ? ok('ברירת-מחדל 40 יום: כפתור-הסגולה מוצג') : fail('כפתור-הסגולה חסר');
await pg.locator('button.chip', { hasText: 'שבועי' }).first().click(); await pg.waitForTimeout(300);
(await pg.locator('button', { hasText: '🕯 40 ימים — התחלת סגולה' }).count()) === 0 ? ok('בחירת שבועי ⇒ כפתור-הסגולה מתחלף') : fail('כפתור-הסגולה עדיין מוצג');
const cnt = pg.locator('input[aria-label="כמות תזכורות"]');
(await cnt.inputValue()) === '12' ? ok('כמות ברירת-מחדל לשבועי = 12') : fail('כמות: ' + (await cnt.inputValue()));
await cnt.fill('4'); await pg.waitForTimeout(200);
const seed = pg.locator('button', { hasText: 'תזכורת שבועית ×4 — מהיום' }).first();
(await seed.count()) === 1 ? ok('כפתור-זריעה: "📆 תזכורת שבועית ×4 — מהיום"') : fail('כפתור-הזריעה חסר');
await seed.click(); await pg.waitForTimeout(900);
const w1 = await weekly();
w1.length === 4 ? ok('4 אירועי "חזרה שבועית" ביומן') : fail('אירועים: ' + w1.length);
const sp = ((await dbRead()).supporters || []).find((s) => s.id === w1[0]?.spId);
(sp?.nextNote || '').includes('חזרה שבועית ×4') ? ok('קשר-הבא: שורת-הסדרה + יעד ' + sp.nextDate) : fail('קשר-הבא לא עודכן');
(await pg.locator('text=תזכורת שבועית פעילה').count()) >= 1 ? ok('פאנל-סדרה: "תזכורת שבועית פעילה · תזכורת 1 מתוך 4"') : fail('פאנל-סדרה חסר');
(await pg.locator('button', { hasText: 'תזכורת שבועית ×4 — מהיום' }).count()) === 0 ? ok('כפתור-הזריעה נעלם בזמן שהסדרה פעילה') : fail('כפתור-הזריעה עדיין מוצג');
// הסגולה עדיין זמינה במקביל
await pg.locator('button.chip', { hasText: '40 יום' }).first().click(); await pg.waitForTimeout(300);
(await pg.locator('button', { hasText: '🕯 40 ימים — התחלת סגולה' }).count()) === 1 ? ok('חזרה ל-40 יום: כפתור-הסגולה זמין במקביל לסדרה השבועית') : fail('הסגולה נעלמה');
// ✓ תזכורת ראשונה בסדרה השבועית
const firstChip = pg.locator('button.chip').filter({ hasText: /☐ 1 · / }).first();
await firstChip.click(); await pg.waitForTimeout(500);
(await weekly()).filter((e) => e.done).length === 1 ? ok('✓ תזכורת 1 סומנה כבוצעה') : fail('סימון-בוצע לא נרשם');
// ביטול דו-לחיצתי
const cancel = pg.locator('button', { hasText: '✖ ביטול תזכורת שבועית' }).first();
await cancel.click(); await pg.waitForTimeout(200);
(await weekly()).length === 4 ? ok('לחיצה ראשונה חומשת בלבד') : fail('נמחק בלחיצה אחת');
await pg.locator('button', { hasText: 'לחצו שוב לאישור' }).first().click(); await pg.waitForTimeout(800);
(await weekly()).length === 0 ? ok('ביטול ⇒ 0 אירועי "חזרה שבועית"') : fail('אירועים נשארו');
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
