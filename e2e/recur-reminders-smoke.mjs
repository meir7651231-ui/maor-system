/**
 * סמוק מסלולי-תזכורת + רצועת-התזכורות (בקשת-בעלים 13.10): בכרטיס — בורר תאריך-התחלה, מסלול,
 * מתג עברי/לועזי, תצוגה-מקדימה; זריעה שבועית מלפני שבועיים ⇒ הראשונה = התאריך שנבחר; ברשימה —
 * מונה ⏰ על כותרת הלוח ⇒ רצועה בראש הלוח ⇒ לחיצה נכנסת לכרטיס. דורש build קודם. SHOT=<dir> לצילומים.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOT = process.env.SHOT;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => { let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream'); res.end(readFileSync(p)); });
await new Promise((r) => server.listen(8254, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 1366 } });
const errors = []; pg.on('pageerror', (e) => errors.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let bad = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) bad++; };
await pg.addInitScript((c) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8254/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(700);
await pg.locator('main table tbody tr').first().click(); await pg.waitForTimeout(800);
const dateIn = pg.locator('input[aria-label="תאריך התחלה"]');
ok(await dateIn.count() === 1, 'בורר תאריך-התחלה בכרטיס');
const d = new Date(); d.setDate(d.getDate() - 14); const past = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); // מקומי, לא UTC
await dateIn.fill(past); await pg.waitForTimeout(200);
await pg.locator('button.chip', { hasText: 'שבועי' }).first().click(); await pg.waitForTimeout(200);
ok((await pg.locator('text=התאריכים:').count()) === 1, 'תצוגה מקדימה של התאריכים');
const seed = pg.locator('button', { hasText: 'תזכורת שבועית' }).first();
console.log('   כפתור:', await seed.textContent());
await pg.locator('button.chip', { hasText: 'חודשי' }).first().click(); await pg.waitForTimeout(200);
ok((await pg.getByRole('group', { name: 'לוח שנה' }).count()) === 1, 'מתג עברי/לועזי בחודשי');
await pg.getByRole('group', { name: 'לוח שנה' }).getByRole('button', { name: 'עברי', exact: true }).click(); await pg.waitForTimeout(200);
console.log('   ', await pg.locator('text=התאריכים:').first().textContent());
await pg.locator('button.chip', { hasText: 'ראש חודש' }).first().click(); await pg.waitForTimeout(200);
console.log('   ', await pg.locator('text=התאריכים:').first().textContent());
if (SHOT) await pg.screenshot({ path: SHOT + '/card.png', clip: { x: 0, y: 0, width: 1024, height: 900 } });
await pg.locator('button.chip', { hasText: 'שבועי' }).first().click(); await pg.waitForTimeout(200);
await pg.locator('button', { hasText: 'תזכורת שבועית' }).first().click(); await pg.waitForTimeout(800);
const db = await pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const evs = (db.events || []).filter((e) => (e.notes || '').startsWith('חזרה שבועית')).map((e) => e.date).sort();
ok(evs[0] === past, 'הראשונה = התאריך שנבחר (' + evs[0] + ')');
// back to list
await pg.locator('button', { hasText: /חזרה|→/ }).first().click().catch(() => {}); await pg.waitForTimeout(400);
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(700);
const badge = pg.locator('button', { hasText: '⏰' });
ok(await badge.count() >= 1, 'מונה ⏰ על כותרת הלוח: ' + (await badge.first().textContent().catch(() => '')));
const openBtn = pg.locator('button', { hasText: '▼ הצגה' }); if (await openBtn.count()) { await badge.first().click(); await pg.waitForTimeout(500); } else { await badge.first().click(); await pg.waitForTimeout(500); }
ok(await pg.locator('text=⏰ תזכורות שהגיע זמנן').count() === 1, 'רצועת-התזכורות בראש הלוח');
const row = pg.locator('.ayin-reminder-row').first();
console.log('   שורה:', (await row.textContent()).replace(/\s+/g, ' '));
if (SHOT) await row.screenshot({ path: SHOT + '/strip-row.png' });
if (SHOT) await pg.locator('.ayin-reminders').screenshot({ path: SHOT + '/strip.png' });
await row.click(); await pg.waitForTimeout(700);
ok(await pg.locator('input[aria-label="תאריך התחלה"]').count() === 1, 'לחיצה על התזכורת ⇒ נכנס לכרטיס');
ok(errors.length === 0, 'אפס שגיאות קונסולה ' + errors.join(' | '));
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
