/**
 * סמוק 📡 «שידור חי» (בקשת-בעלים 3.11.2026 — «בפעם הראשונה שליטה מלאה על המספרים»). דורש build קודם.
 * קונפיג מאור בלי firebase/adminEmails ⇒ דמו ⇒ אשף ← «האתר הציבורי» ← «📡 שידור חי»:
 * מילוי-מהמערכת (המספר תואם לנתונים) ⇒ הדלקה ⇒ עריכת-מספר ⇒ הסתרת-כרטיס ⇒ הצגת «גויסו השנה»
 * ⇒ ‎?site=1‎: החלק מוצג עם המספר שנערך, בלי הכרטיס המוסתר, עם הסכום; צרפתית; מובייל. OUT=<dir> לצילומים.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.OUT;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8264, r));
const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'c', 'maor-hachesed', 'config.json'), 'utf8'));
delete cfg.firebase;
delete cfg.adminEmails; // האשף נעול למנהל-מערכת כשיש adminEmails — בבדיקה מקומית פתוח
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const lsLive = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_org_config') || '{}').site?.live);

await pg.addInitScript((c) => { if (!localStorage.getItem('maor_org_config')) localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8264/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
const activeFams = await pg.evaluate(() => { for (const k of Object.keys(localStorage)) { if (!k.startsWith('maor_db')) continue; try { const d = JSON.parse(localStorage.getItem(k) || '{}'); if (d.families?.length) return d.families.filter((f) => f.status === 'active').length; } catch { /* */ } } return -1; });
await pg.evaluate(() => { location.hash = '#builder'; });
await pg.waitForTimeout(1500);
await pg.locator('#wz-site').scrollIntoViewIfNeeded();
await pg.locator('#wz-site').getByText('האתר הציבורי').first().click();
await pg.waitForTimeout(800);
(await pg.locator('text=📡 שידור חי').count()) === 1 ? ok('חלק «📡 שידור חי» באשף') : fail('אין חלק שידור-חי באשף');

await pg.getByRole('button', { name: /מילוי המספרים מהמערכת/ }).click();
await pg.waitForTimeout(500);
let live = await lsLive();
live?.cards?.[0]?.value === String(activeFams) ? ok(`מילוי מהמערכת: משפחות = ${activeFams} (תואם לנתונים)`) : fail('ערך-משפחות ' + live?.cards?.[0]?.value + ' ≠ ' + activeFams);
!live?.enabled ? ok('אחרי המילוי עדיין כבוי — לא עולה לאתר בלי החלטת-המנהל') : fail('המילוי הדליק לבד');
!live?.raised?.show ? ok('«גויסו השנה» מוסתר כברירת-מחדל') : fail('הסכום מוצג בלי החלטה');

await pg.getByText('כבוי — לא מוצג באתר').click();
await pg.locator('input[placeholder="למשל 1,234"]').nth(0).fill('600+');
await pg.getByText('👁 מוצג באתר').nth(2).click();
await pg.getByText('🙈 מוסתר').first().click();
await pg.waitForTimeout(300);
live = await lsLive();
live?.enabled && live.cards[0].value === '600+' && live.cards[2].hidden && live.raised?.show ? ok('שליטה: הדלקה · מספר נערך ל-600+ · כרטיס הוסתר · סכום מוצג') : fail('שליטה: ' + JSON.stringify({ e: live?.enabled, v: live?.cards?.[0]?.value, h: live?.cards?.[2]?.hidden, r: live?.raised }));

if (OUT) {
  await pg.setViewportSize({ width: 1280, height: 1400 });
  await pg.locator('text=📡 שידור חי').first().scrollIntoViewIfNeeded();
  const hb = await pg.locator('text=📡 שידור חי').first().boundingBox();
  await pg.screenshot({ path: `${OUT}/site-live-editor.png`, clip: { x: 0, y: Math.max(0, hb.y - 10), width: 560, height: 1100 } });
}
for (const [name, w, h] of [['desktop', 1280, 900], ['mobile', 400, 860]]) {
  const sp = await ctx.newPage();
  await sp.setViewportSize({ width: w, height: h });
  sp.on('pageerror', (e) => errs.push(name + ': ' + e.message));
  await sp.goto('http://localhost:8264/?site=1');
  await sp.waitForTimeout(2500);
  const sec = sp.locator('#live');
  if (!(await sec.count())) { fail(name + ': החלק לא מוצג באתר'); await sp.close(); continue; }
  await sec.scrollIntoViewIfNeeded();
  await sp.waitForTimeout(1000);
  const txt = await sec.innerText();
  txt.includes('600+') ? ok(name + ': המספר שנערך מוצג (600+)') : fail(name + ': 600+ חסר');
  !txt.includes('מפגשי חסד שהתקיימו') ? ok(name + ': הכרטיס המוסתר לא מוצג') : fail(name + ': כרטיס מוסתר מוצג');
  txt.includes('גויסו השנה') ? ok(name + ': «גויסו השנה» מוצג') : fail(name + ': הסכום חסר');
  if (OUT) await sec.screenshot({ path: `${OUT}/site-live-${name}.png` });
  if (name === 'desktop') {
    await sp.getByRole('button', { name: 'FR', exact: true }).first().click();
    await sp.waitForTimeout(600);
    (await sec.innerText()).includes('Ce qui se passe au foyer') ? ok('צרפתית: הכותרת מתורגמת') : fail('צרפתית חסרה');
  }
  await sp.close();
}
errs.length === 0 ? ok('אפס שגיאות-דף') : fail('שגיאות: ' + errs.join(' | '));
console.log(`\n${passed} עברו · ${failed} נכשלו`);
await b.close();
server.close();
process.exit(failed ? 1 : 0);
