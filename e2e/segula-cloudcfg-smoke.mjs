/**
 * סמוק 5.10.2026 — "🕯 40 יום לא נשמר דלוק ולא עובד" (הדיווח הרביעי של הבעלים). שלושה תרחישים
 * על בייטי-ה-build, בלי ענן (אין מסך-התחברות):
 * (א) ארגון-פלטפורמה (?org=acme) שקיבל מהענן קונפיג עם `core.taxreceipt:false` **תקוע** (מה ש-merge:true
 *     השאיר) ⇒ הכפתור מוסתר והאבחון אומר זאת (OFF · raw core.taxreceipt=false); אותו ארגון עם
 *     `supporters.segula:false` בלבד ⇒ הכפתור מוצג (#501).
 * (ב) לחיצה ⇒ 5 אירועי-סגולה ב-db.events ⇒ **רענון-דף** ⇒ האירועים שרדו (localStorage/IndexedDB) והפאנל פעיל.
 * (ג) בורר-החזרה (16.9) הוא מצב-מסך בלבד — אחרי רענון חוזר ל-"40 יום" (לא "נשמר"; זה צפוי ומתועד).
 * דורש build קודם.
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
await new Promise((r) => server.listen(8271, r));
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const SLUG = 'acme';
const URL_ORG = 'http://localhost:8271/?org=' + SLUG;
const go = async (pg, t) => { await pg.evaluate((t) => { const b=[...document.querySelectorAll('nav button, .side-link, .bottom-nav button')].find(x=>x.textContent.trim().includes(t)); b && b.click(); }, t); await pg.waitForTimeout(900); };
const baseCfg = (features) => ({ slug: SLUG, orgName: 'אקמי', theme: 'or-rishon', modules: {}, features });
/** מדמה את מה שהלקוח מחזיק אחרי onSnapshot: מטמון-הקונפיג-מהענן (maor_cloudcfg:<slug>) — נטען לפני כל דבר. */
const boot = async (features, { fresh = true } = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const pg = await ctx.newPage();
  const errors = []; pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await pg.addInitScript(({ c, k }) => localStorage.setItem(k, JSON.stringify(c)), { c: baseCfg(features), k: 'maor_cloudcfg:' + SLUG });
  await pg.goto(URL_ORG); await pg.waitForSelector('main', { timeout: 20000 });
  if (fresh) {
    await pg.locator('text=📊 טעינת נתוני דמו').first().click(); await pg.waitForTimeout(1500);
    const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
  }
  return { ctx, pg, errors };
};
const openFirstSupporter = async (pg) => { await go(pg, 'תורמים'); await pg.locator('main table tbody tr').first().click(); await pg.waitForTimeout(800); };
const dbRead = (pg) => pg.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), 'maor_db:' + SLUG);
const segulaEvs = async (pg) => ((await dbRead(pg)).events || []).filter((e) => (e.notes || '').startsWith('סגולת '));
const readDiag = async (pg) => {
  await go(pg, 'הגדרות');
  const orgTab = pg.locator('button', { hasText: '🏷 הארגון שלי' }).first(); if (await orgTab.count()) { await orgTab.click(); await pg.waitForTimeout(300); }
  const orgChip = pg.locator('button', { hasText: 'ארגון' }).first(); if (await orgChip.count()) { await orgChip.click(); await pg.waitForTimeout(400); }
  const diagBtn = pg.locator('button', { hasText: '🔎 אבחון דגלים' }).first();
  if (!(await diagBtn.count())) return '';
  await diagBtn.click(); await pg.waitForTimeout(300);
  return (await pg.locator('main pre').first().textContent()) || '';
};

/* (א1) — הקונפיג-מהענן נושא core.taxreceipt:false תקוע ⇒ הכפתור מוסתר, האבחון מצביע על הדגל-הגולמי */
{
  const { ctx, pg, errors } = await boot({ 'core.taxreceipt': false, 'supporters.segula': false });
  await openFirstSupporter(pg);
  const btn = pg.locator('button', { hasText: '🕯 40 ימים' });
  (await btn.count()) === 0 ? ok('(א1) core.taxreceipt=false מהענן ⇒ כפתור 40 יום מוסתר — זה מה שהלקוח ראה') : fail('(א1) הכפתור מוצג למרות core.taxreceipt=false');
  const pre = await readDiag(pg);
  pre.includes('40 יום נראה: OFF') && pre.includes('raw core.taxreceipt=false') && pre.includes('org: ' + SLUG + ' (platform)') ? ok('(א1) אבחון: "40 יום נראה: OFF · raw core.taxreceipt=false" — הסיבה גלויה על המסך') : fail('(א1) אבחון: ' + pre.slice(0, 260));
  errors.length === 0 ? ok('(א1) אפס שגיאות-קונסולה') : fail('(א1) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

/* (א2) — רק supporters.segula:false (המקרה של #501) ⇒ הכפתור מוצג */
{
  const { ctx, pg, errors } = await boot({ 'supporters.segula': false });
  await openFirstSupporter(pg);
  const btn = pg.locator('button', { hasText: '🕯 40 ימים' });
  (await btn.count()) === 1 && (await btn.first().isVisible()) ? ok('(א2) supporters.segula=false בלבד ⇒ הכפתור מוצג (ברירת-מחדל לעמותה, #501)') : fail('(א2) הכפתור חסר עם supporters.segula=false');
  const pre = await readDiag(pg);
  pre.includes('40 יום נראה: ON') && pre.includes('raw supporters.segula=false') && pre.includes('raw core.taxreceipt=undefined') ? ok('(א2) אבחון: ON · raw segula=false · raw taxreceipt=undefined') : fail('(א2) אבחון: ' + pre.slice(0, 260));
  errors.length === 0 ? ok('(א2) אפס שגיאות-קונסולה') : fail('(א2) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

/* (ב)+(ג) — לחיצה ⇒ 5 אירועים ⇒ רענון ⇒ שרדו + פאנל פעיל; בורר-החזרה חוזר לברירת-המחדל */
{
  const { ctx, pg, errors } = await boot({});
  await openFirstSupporter(pg);
  const btn = pg.locator('button', { hasText: '🕯 40 ימים' });
  (await btn.count()) === 1 ? ok('(ב) קונפיג-ענן נקי ⇒ הכפתור מוצג') : fail('(ב) הכפתור חסר');
  // (ג) בורר-החזרה: מעבר ל-"יומי" מסתיר את כפתור-הסגולה (מצב-מסך) — ואחרי רענון חוזר ל-40 יום
  const dailyChip = pg.locator('button.chip', { hasText: 'יומי' }).first();
  if (await dailyChip.count()) {
    await dailyChip.click(); await pg.waitForTimeout(200);
    (await btn.count()) === 0 ? ok('(ג) בורר-חזרה "יומי" ⇒ כפתור-הסגולה מתחלף בכפתור-הסדרה (מצב-מסך)') : fail('(ג) הבורר לא השפיע');
    await pg.locator('button.chip', { hasText: '40 יום' }).first().click(); await pg.waitForTimeout(200);
  }
  await btn.first().click(); await pg.waitForTimeout(1000);
  const evs1 = await segulaEvs(pg);
  evs1.length === 5 ? ok('(ב) לחיצה ⇒ 5 אירועי-סגולה ב-maor_db:' + SLUG) : fail('(ב) צפוי 5, יש ' + evs1.length);
  const spId = evs1[0]?.spId;
  evs1.every((e) => e.type === 'call' && e.spId === spId && (e.notes || '').startsWith('סגולת 40 יום')) ? ok('(ב) כל האירועים: type=call · spId · הערה "סגולת 40 יום" (מה ש-segulaStatus מזהה)') : fail('(ב) מבנה-אירוע שגוי: ' + JSON.stringify(evs1[0]));
  (await pg.locator('text=🕯 40 ימים — סגולה פעילה').count()) === 1 ? ok('(ב) הפאנל "סגולה פעילה" מוצג') : fail('(ב) הפאנל חסר אחרי הלחיצה');
  // רענון-דף אמיתי (אותו context ⇒ אותו localStorage/IndexedDB); בלי זריעת-דמו מחדש
  await pg.reload(); await pg.waitForSelector('main', { timeout: 20000 }); await pg.waitForTimeout(800);
  const d = pg.locator('button', { hasText: 'פתיחת יום' }).first(); if (await d.count()) { await d.click(); await pg.waitForTimeout(300); }
  const evs2 = await segulaEvs(pg);
  evs2.length === 5 && evs2.every((e) => evs1.some((o) => o.id === e.id)) ? ok('(ב) אחרי רענון: אותם 5 אירועים שרדו בהתמדה') : fail('(ב) אחרי רענון: ' + evs2.length + ' אירועים');
  await openFirstSupporter(pg);
  (await pg.locator('text=🕯 40 ימים — סגולה פעילה').count()) === 1 && (await btn.count()) === 0 ? ok('(ב) אחרי רענון: הכרטיס נפתח עם הפאנל הפעיל (לא הכפתור) — "נשמר דלוק"') : fail('(ב) אחרי רענון הפאנל לא פעיל');
  const segChip = pg.locator('button.chip', { hasText: '40 יום' }).first();
  (await segChip.count()) === 0 || (await segChip.getAttribute('aria-pressed')) === 'true' ? ok('(ג) בורר-החזרה חזר ל-"40 יום" (מצב-מסך, לא נתון) — צפוי') : fail('(ג) בורר-החזרה במצב אחר אחרי רענון');
  await pg.screenshot({ path: join(HERE, 'shots', 'segula-cloudcfg-after-reload.png'), fullPage: true }).catch(() => {});
  errors.length === 0 ? ok('(ב+ג) אפס שגיאות-קונסולה') : fail('(ב+ג) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
