/**
 * סמוק 6.10.2026 — «🕯 40 יום» מלוח מעקב-הטיפול (בקשת-בעלים «תכניס את הכפתור בלוח מעקב טיפול»):
 * דמו + תיקי-מעקב ⇒ תורמים ⇒ פתיחת-הלוח ⇒ לכל שורה כפתור «🕯 40 יום» ⇒ לחיצה על הראשון ⇒ 5 אירועי-סגולה
 * ב-db.events (type call · spId של אותה שורה · הערה «סגולת 40 יום») + קשר-הבא ⇒ הכפתור בשורה הוחלף בצ'יפ
 * «🕯 יום 0/40» (לא זורעים פעמיים) ⇒ הלחיצה לא פתחה כרטיס ⇒ פתיחת הכרטיס מהשורה ⇒ פאנל «סגולה פעילה».
 * וגם: supporters.segula=false ⇒ אין כפתור בלוח. דורש build.
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
await new Promise((r) => server.listen(8274, r));
const cfg0 = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8')); delete cfg0.firebase;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const demo = JSON.parse(readFileSync(join(HERE, '..', 'public', 'demo.json'), 'utf8'));
demo.supporters.slice(0, 4).forEach((sp, i) => { sp.ayin = { stage: i % 2 ? 'lead' : 'eyes', names: [{ id: 'n' + i, name: 'שם ' + i, eyes: '', done: false }], log: [], answers: [], paid: false, lastTouch: '', answerPushed: false }; });
const boot = async (features) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ctx.newPage();
  const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.addInitScript(({ c, dbJson }) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); localStorage.setItem('maor_db', dbJson); }, { c: { ...cfg0, features: { ...(cfg0.features || {}), ...features } }, dbJson: JSON.stringify(demo) });
  await pg.goto('http://localhost:8274/'); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(1200);
  const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
  await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click(); await pg.waitForTimeout(800);
  await pg.locator('button', { hasText: '▼ הצגה' }).first().click(); await pg.waitForTimeout(500);
  return { ctx, pg, errors };
};
const dbRead = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const segulaEvs = async (pg) => ((await dbRead(pg)).events || []).filter((e) => (e.notes || '').startsWith('סגולת '));

/* (א) ברירת-מחדל: כפתור בכל שורה ⇒ לחיצה ⇒ זריעה ⇒ צ'יפ ⇒ כרטיס */
{
  const { ctx, pg, errors } = await boot({});
  const rows = pg.locator('.ayin-row[role="button"]');
  const nRows = await rows.count();
  nRows >= 4 ? ok('(א) הלוח פתוח עם ' + nRows + ' שורות') : fail('(א) הלוח ריק: ' + nRows);
  const btns = pg.locator('.ayin-row[role="button"] button', { hasText: '🕯 40 יום' });
  (await btns.count()) === nRows ? ok('(א) כפתור «🕯 40 יום» בכל שורה (' + nRows + ')') : fail('(א) כפתורים: ' + (await btns.count()) + ' ≠ ' + nRows);
  (await segulaEvs(pg)).length === 0 ? ok('(א) לפני הלחיצה: 0 אירועי-סגולה') : fail('(א) אירועים לפני הלחיצה');
  const firstName = (await rows.first().locator('div').first().textContent() || '').trim();
  await btns.first().click(); await pg.waitForTimeout(900);
  const evs = await segulaEvs(pg);
  evs.length === 5 ? ok('(א) לחיצה בלוח ⇒ 5 אירועי-סגולה') : fail('(א) צפוי 5, יש ' + evs.length);
  const sp = ((await dbRead(pg)).supporters || []).find((s) => s.id === evs[0]?.spId);
  sp && sp.name === firstName ? ok('(א) האירועים שייכים לשורה שנלחצה: ' + firstName) : fail('(א) spId לא תואם: ' + (sp && sp.name) + ' ≠ ' + firstName);
  evs.every((e) => e.type === 'call' && e.spId === sp?.id) ? ok('(א) type=call · spId') : fail('(א) מבנה-אירוע שגוי');
  sp?.nextDate && (sp.nextNote || '').includes('סגולת 40 יום') ? ok('(א) קשר-הבא עודכן (' + sp.nextDate + ')') : fail('(א) קשר-הבא לא עודכן');
  (await pg.locator('button', { hasText: '→ כל ' }).count()) === 0 ? ok('(א) הלחיצה לא פתחה כרטיס (stopPropagation)') : fail('(א) נפתח כרטיס');
  (await btns.count()) === nRows - 1 ? ok('(א) בשורה הזו הכפתור הוחלף — נשארו ' + (nRows - 1) + ' כפתורים') : fail('(א) כפתורים אחרי: ' + (await btns.count()));
  const chip = rows.first().locator('span', { hasText: '🕯 יום 0/40' });
  (await chip.count()) === 1 ? ok('(א) צ\'יפ-מצב «🕯 יום 0/40» בשורה') : fail('(א) צ\'יפ-המצב חסר');
  await pg.screenshot({ path: join(HERE, 'shots', 'segula-board.png'), fullPage: false }).catch(() => {});
  await rows.first().click(); await pg.waitForTimeout(900);
  (await pg.locator('text=🕯 40 ימים — סגולה פעילה').count()) === 1 ? ok('(א) פתיחת הכרטיס מהשורה ⇒ פאנל «סגולה פעילה» (אותו מנגנון)') : fail('(א) הכרטיס בלי פאנל-סגולה');
  errors.length === 0 ? ok('(א) אפס שגיאות-קונסולה') : fail('(א) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

/* (ב) supporters.segula=false ⇒ אין כפתור בלוח (אותו דגל כמו בכרטיס) */
{
  const { ctx, pg, errors } = await boot({ 'supporters.segula': false });
  const nRows = await pg.locator('.ayin-row[role="button"]').count();
  (await pg.locator('.ayin-row[role="button"] button', { hasText: '🕯 40 יום' }).count()) === 0 && nRows >= 4 ? ok('(ב) דגל false ⇒ אין כפתור 40 יום בלוח (' + nRows + ' שורות)') : fail('(ב) כפתור מוצג למרות הדגל');
  errors.length === 0 ? ok('(ב) אפס שגיאות-קונסולה') : fail('(ב) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
