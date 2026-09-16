/**
 * סמוק 16.9: (א) ⬇ רשימת-המורות (CSV) — הקובץ יורד עם כותרת נכונה; (ב) 🔎 אבחון-דגלים בהגדרות
 * מציג segula ON; (ג) קונפיג עם supporters.segula=false ⇒ בכרטיס-התורם הודעה גלויה במקום הכפתור.
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
await new Promise((r) => server.listen(8265, r));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const go = async (pg, t) => { await pg.evaluate((t) => { const b=[...document.querySelectorAll('nav button, .side-link, .bottom-nav button')].find(x=>x.textContent.trim().includes(t)); b && b.click(); }, t); await pg.waitForTimeout(900); };
const boot = async (cfg) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  const pg = await ctx.newPage();
  const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), cfg);
  await pg.goto('http://localhost:8265/'); await pg.waitForSelector('main', { timeout: 20000 });
  await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
  const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
  return { ctx, pg, errors };
};

/* (א)+(ב) — קונפיג רגיל */
{
  const { ctx, pg, errors } = await boot({ slug: 'default', orgName: 'x', theme: 'or-rishon', modules: {} });
  await go(pg, 'הגדרות');
  const orgTab = pg.locator('button', { hasText: '🏷 הארגון שלי' }).first(); if (await orgTab.count()) { await orgTab.click(); await pg.waitForTimeout(300); }
  const chip = pg.locator('button', { hasText: 'מור' }).filter({ hasNotText: 'CSV' }).first(); if (await chip.count()) { await chip.click(); await pg.waitForTimeout(500); }
  const dl = pg.locator('button', { hasText: 'רשימת ה' }).filter({ hasText: 'CSV' }).first();
  (await dl.count()) === 1 ? ok('כפתור "⬇ רשימת המורות (CSV)" בסעיף-המורות') : fail('כפתור-הייצוא חסר');
  const [download] = await Promise.all([pg.waitForEvent('download', { timeout: 10000 }).catch(() => null), dl.click()]);
  if (download) {
    const path = await download.path();
    const txt = readFileSync(path, 'utf8');
    const first = txt.split('\n')[0];
    first.includes('שם המור') && first.includes('טלפון') && first.includes('פעילים') ? ok('CSV ירד: ' + download.suggestedFilename() + ' · כותרת: ' + first.slice(0, 60)) : fail('כותרת שגויה: ' + first);
    txt.trim().split('\n').length === 9 ? ok('9 שורות = כותרת + 8 מורות-הדמו') : fail('מספר-שורות: ' + txt.trim().split('\n').length);
  } else fail('לא ירד קובץ');
  // אבחון
  const orgChip = pg.locator('button', { hasText: 'ארגון' }).first(); if (await orgChip.count()) { await orgChip.click(); await pg.waitForTimeout(400); }
  const diagBtn = pg.locator('button', { hasText: '🔎 אבחון דגלים' }).first();
  (await diagBtn.count()) === 1 ? ok('כפתור "🔎 אבחון דגלים" ליד גרסת-האתר') : fail('כפתור-האבחון חסר');
  await diagBtn.click(); await pg.waitForTimeout(300);
  const pre = (await pg.locator('main pre').first().textContent()) || '';
  pre.includes('supporters.segula (40 ימים): ON') && pre.includes('org: default (root)') ? ok('אבחון: segula ON · org default (root)') : fail('אבחון: ' + pre.slice(0, 200));
  errors.length === 0 ? ok('(א+ב) אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

/* (ג) — הדגל כבוי ⇒ הודעה גלויה בכרטיס */
{
  const { ctx, pg, errors } = await boot({ slug: 'default', orgName: 'x', theme: 'or-rishon', modules: {}, features: { 'supporters.segula': false } });
  await go(pg, 'תורמים');
  await pg.locator('main table tbody tr, main .card[role="button"]').first().click(); await pg.waitForTimeout(800);
  (await pg.locator('button', { hasText: '40 ימים' }).count()) === 0 ? ok('דגל כבוי: אין כפתור 40 ימים') : fail('הכפתור מוצג למרות דגל כבוי');
  (await pg.locator('text="40 ימים" כבוי בהגדרות-הארגון').count()) === 1 ? ok('דגל כבוי: הודעה גלויה עם שם-הדגל במקום העלמה שקטה') : fail('אין הודעת-דגל-כבוי');
  await go(pg, 'הגדרות');
  const diagBtn = pg.locator('button', { hasText: '🔎 אבחון דגלים' }).first(); if (await diagBtn.count()) { await diagBtn.click(); await pg.waitForTimeout(300); }
  const pre = (await pg.locator('main pre').first().textContent()) || '';
  pre.includes('supporters.segula (40 ימים): OFF · raw=false') && pre.includes('features off (1): supporters.segula') ? ok('אבחון: segula OFF · raw=false · ברשימת-הכבויים') : fail('אבחון (כבוי): ' + pre.slice(0, 220));
  errors.length === 0 ? ok('(ג) אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
  await ctx.close();
}
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
