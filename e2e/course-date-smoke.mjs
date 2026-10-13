/**
 * סמוק סינון-חוגים לפי תאריך מסוים (בקשת-בעלים 13.10). דורש build. צילום ל-e2e/shots/owner-1013/.
 * יום-חול ⇒ רק החוגים של אותו יום-בשבוע + שורת-מצב; שבת ⇒ אזהרה; ✕ מנקה.
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
await new Promise((r) => server.listen(8257, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg.firebase;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
pg.setDefaultTimeout(8000);
const errors = []; pg.on('pageerror', (e) => errors.push(e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let bad = 0; const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) bad++; };
await pg.addInitScript((c) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8257/'); await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'חוגים' }).first().click(); await pg.waitForTimeout(800);
const cards = () => pg.locator('main .card[role=button]').count();
const all = await cards();
const db = await pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
// a weekday in range of the first course
const c0 = db.courses.find((c) => c.start && c.end) || db.courses[0];
const sess = (c) => (c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday }]);
let d = new Date(); let iso = '';
for (let i = 0; i < 14; i++) { const x = new Date(d); x.setDate(d.getDate() + i); const s = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); if (sess(c0).some((q) => q.day === x.getDay()) && (!c0.start || s >= c0.start) && (!c0.end || s <= c0.end)) { iso = s; break; } }
const expected = db.courses.filter((c) => (!c.start || iso >= c.start) && (!c.end || iso <= c.end) && sess(c).some((q) => q.day === new Date(iso + 'T12:00:00').getDay())).length;
await pg.getByLabel('סינון לפי תאריך').fill(iso); await pg.waitForTimeout(500);
const n = await cards();
ok(n === expected && n < all, 'תאריך ' + iso + ' ⇒ ' + n + ' חוגים (צפוי ' + expected + ', מתוך ' + all + ')');
const status = await pg.locator('.crs-date-status').textContent();
console.log('   שורת-מצב:', status);
ok(status.includes(String(n)), 'שורת-המצב מציגה את המספר');
await pg.screenshot({ path: OUT + '/13-courses-date.png' });
// saturday
let sat = new Date(iso + 'T12:00:00'); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
const satIso = sat.getFullYear() + '-' + String(sat.getMonth() + 1).padStart(2, '0') + '-' + String(sat.getDate()).padStart(2, '0');
await pg.getByLabel('סינון לפי תאריך').fill(satIso); await pg.waitForTimeout(400);
ok((await pg.locator('.crs-date-status').textContent()).includes('שבת'), 'שבת ⇒ אזהרה: ' + (await pg.locator('.crs-date-status').textContent()));
await pg.getByLabel('ניקוי תאריך').click(); await pg.waitForTimeout(400);
ok((await cards()) === all && (await pg.locator('.crs-date-status').count()) === 0, '✕ מנקה ⇒ כל ' + all + ' החוגים');
ok(errors.length === 0, 'אפס שגיאות ' + errors.join(' | '));
await browser.close(); server.close(); process.exit(bad ? 1 : 0);
