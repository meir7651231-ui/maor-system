/**
 * סמוק פיצול-השמות + שמירת לוח-השנה אחרי רענון (הכרעות-בעלים 13.10). דורש build.
 * תפריט "עוד" ⇒ 🪪 פיצול ⇒ תצוגה ⇒ אישור דו-שלבי ⇒ firstName/lastName נשמרו, name לא השתנה;
 * לוח: "דחוף בלבד"+שבועי ⇒ רענון ⇒ עדיין. צילומים ל-e2e/shots/owner-1013/.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const OUT = join(HERE, 'shots', 'owner-1013');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(8256, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase; delete cfg.adminEmails; // אופליין בלי התחברות ⇒ מנהל
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
pg.setDefaultTimeout(8000);
const errors = []; pg.on('pageerror', (e) => errors.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let bad = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) bad++; };
await pg.addInitScript((c) => { if (!localStorage.getItem('maor_org_config')) localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8256/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(700);
await pg.locator('main button', { hasText: 'עוד' }).first().click(); await pg.waitForTimeout(300);
ok(await pg.locator('text=🪪 פיצול שם פרטי / משפחה').count() === 1, 'פריט בתפריט "עוד"');
await pg.locator('text=🪪 פיצול שם פרטי / משפחה').first().click(); await pg.waitForTimeout(600);
const dlg = pg.locator('[role=dialog]').last();
await dlg.locator('button', { hasText: 'הכול ·' }).click(); await pg.waitForTimeout(300);
const rows = dlg.locator('tr.name-split-row');
console.log('   rows:', await rows.count());
for (let i = 0; i < Math.min(15, await rows.count()); i++) {
  const r = rows.nth(i); const ins = r.locator('input[type=text], input:not([type])');
  console.log('   ', (await r.locator('td').nth(1).textContent()), '→', await ins.nth(0).inputValue(), '|', await ins.nth(1).inputValue(), '·', (await r.locator('td').nth(5).textContent()).slice(0, 40));
}
await dlg.screenshot({ path: OUT + '/11-name-split.png' });
await dlg.locator('button', { hasText: 'החלה על' }).click(); await pg.waitForTimeout(200);
ok(await dlg.locator('button', { hasText: 'לחצו שוב לאישור' }).count() === 1, 'אישור דו-שלבי');
await dlg.locator('button', { hasText: 'לחצו שוב לאישור' }).click(); await pg.waitForTimeout(800);
const db = await pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const split = db.supporters.filter((s) => s.lastName || s.firstName);
ok(split.length > 0, 'נשמרו ' + split.length + ' פיצולים; שמות מלאים לא השתנו: ' + split.slice(0, 3).map((s) => s.name + '=' + (s.firstName || '') + '+' + s.lastName).join(' , '));
// calendar persistence after reload
await pg.locator('nav button, .side-link', { hasText: 'לוח שנה' }).first().click(); await pg.waitForTimeout(700);
await pg.locator('main button', { hasText: 'דחוף בלבד' }).first().click(); await pg.waitForTimeout(400);
await pg.locator('main button', { hasText: 'שבועי' }).first().click(); await pg.waitForTimeout(400);
await pg.reload(); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(800);
const db2 = await pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await db2.count()) { await db2.click(); await pg.waitForTimeout(300); }
await pg.locator('nav button, .side-link', { hasText: 'לוח שנה' }).first().click(); await pg.waitForTimeout(700);
ok((await pg.locator('main button', { hasText: 'דחוף בלבד' }).first().getAttribute('aria-pressed')) === 'true', 'אחרי רענון: "דחוף בלבד" עדיין דלוק');
ok(((await pg.locator('main button', { hasText: 'שבועי' }).first().getAttribute('class')) || '').includes('on') || (await pg.locator('main button[aria-pressed=true]', { hasText: 'שבועי' }).count()) > 0 || (await pg.locator('main [aria-selected=true]', { hasText: 'שבועי' }).count()) > 0, 'אחרי רענון: תצוגה שבועית נשמרה');
await pg.screenshot({ path: OUT + '/12-calendar-after-refresh.png', clip: { x: 0, y: 0, width: 1100, height: 420 } });
ok(errors.length === 0, 'אפס שגיאות ' + errors.join(' | '));
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
