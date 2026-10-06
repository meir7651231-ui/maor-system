/**
 * סמוק 6.10.2026 — «🕯 40 יום» מלוח מעקב-הטיפול (בקשת-בעלים «תכניס את הכפתור בלוח מעקב טיפול»):
 * דמו + תיקי-מעקב ⇒ תורמים ⇒ פתיחת-הלוח ⇒ לכל שורה כפתור «🕯 40 יום» ⇒ לחיצה על הראשון ⇒ 5 אירועי-סגולה
 * ב-db.events (type call · spId של אותה שורה · הערה «סגולת 40 יום») + קשר-הבא ⇒ הכפתור בשורה הוחלף בצ'יפ
 * «🕯 יום 0/40» (לא זורעים פעמיים) ⇒ הלחיצה לא פתחה כרטיס ⇒ פתיחת הכרטיס מהשורה ⇒ פאנל «סגולה פעילה».
 * (ב) תפריט ▾ ⇒ «שבועי ×12» על השורה השנייה ⇒ 12 אירועי «חזרה שבועית» + צ'יפ «📆 1/12».
 * (ג) «הגיע הזמן» (6.10): תומך/ת **בלי תיק-טיפול** עם סגולה שתזכורתה הראשונה אתמול ⇒ עולה ללוח (צבוע, «🕯 הגיע הזמן»)
 *     עם «✓ בוצע» ⇒ לחיצה ⇒ האירוע done, השורה יורדת (אין תיק ואין תזכורת נוספת שהגיע יומה).
 * (ד) supporters.segula=false ⇒ אין כפתור בלוח. דורש build.
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
// (ג) תומך/ת #5 — בלי תיק-טיפול — עם סגולה שהתחילה שלשום: התזכורת הראשונה (יום 1) = אתמול ⇒ «הגיע הזמן»
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - 2);
const dueSp = demo.supporters[5]; delete dueSp.ayin;
demo.events = demo.events || [];
[1, 7, 21, 35, 40].forEach((n, i) => { const d = new Date(start); d.setDate(d.getDate() + n); demo.events.push({ id: 'segdue' + i, title: '🕯 סגולה — ' + dueSp.name + ' · יום ' + n + '/40 · זיווג', date: iso(d), time: '', type: 'call', customType: '', notes: 'סגולת 40 יום · זיווג · ' + (dueSp.phone || ''), price: 0, roomId: '', famId: '', spId: dueSp.id, priority: n === 40 ? 'orange' : 'green', done: false }); });
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
  nRows === 5 ? ok('(א) הלוח פתוח עם 5 שורות (4 תיקים + 1 «הגיע הזמן» בלי תיק)') : fail('(א) שורות: ' + nRows);
  const btns = pg.locator('.ayin-row[role="button"] button', { hasText: '🕯 40 יום ▾' });
  (await btns.count()) === 4 ? ok('(א) כפתור «🕯 40 יום ▾» בכל שורה בלי סדרה (4)') : fail('(א) כפתורים: ' + (await btns.count()) + ' ≠ 4');
  (await segulaEvs(pg)).filter((e) => e.spId !== dueSp.id).length === 0 ? ok('(א) לפני הלחיצה: 0 אירועי-סגולה (חוץ מהזרועים ל-ג)') : fail('(א) אירועים לפני הלחיצה');
  // השורה הראשונה עם כפתור (השורה הראשונה בלוח היא «הגיע הזמן» — בלי כפתור-זריעה)
  const firstRow = rows.filter({ has: pg.locator('button', { hasText: '🕯 40 יום ▾' }) }).first();
  const firstName = (await firstRow.locator('div').first().textContent() || '').trim();
  await btns.first().click(); await pg.waitForTimeout(300);
  const menu = firstRow.locator('.ayin-recur-menu');
  (await menu.count()) === 1 && (await menu.locator('button').count()) === 4 ? ok('(א) ▾ ⇒ תפריט 4 מצבים: 40 יום · יומי · שבועי · חודשי') : fail('(א) התפריט חסר/לא 4');
  (await pg.locator('button', { hasText: '→ כל ' }).count()) === 0 ? ok('(א) פתיחת התפריט לא פתחה כרטיס') : fail('(א) נפתח כרטיס מהתפריט');
  await menu.locator('button', { hasText: '40 יום' }).first().click(); await pg.waitForTimeout(900);
  const evs = (await segulaEvs(pg)).filter((e) => e.spId !== dueSp.id);
  evs.length === 5 ? ok('(א) «40 יום» מהתפריט ⇒ 5 אירועי-סגולה') : fail('(א) צפוי 5, יש ' + evs.length);
  const sp = ((await dbRead(pg)).supporters || []).find((s) => s.id === evs[0]?.spId);
  sp && sp.name === firstName ? ok('(א) האירועים שייכים לשורה שנלחצה: ' + firstName) : fail('(א) spId לא תואם: ' + (sp && sp.name) + ' ≠ ' + firstName);
  evs.every((e) => e.type === 'call' && e.spId === sp?.id) ? ok('(א) type=call · spId') : fail('(א) מבנה-אירוע שגוי');
  sp?.nextDate && (sp.nextNote || '').includes('סגולת 40 יום') ? ok('(א) קשר-הבא עודכן (' + sp.nextDate + ')') : fail('(א) קשר-הבא לא עודכן');
  (await pg.locator('button', { hasText: '→ כל ' }).count()) === 0 ? ok('(א) הלחיצה לא פתחה כרטיס (stopPropagation)') : fail('(א) נפתח כרטיס');
  (await btns.count()) === 3 ? ok('(א) בשורה הזו הכפתור הוחלף — נשארו 3 כפתורים') : fail('(א) כפתורים אחרי: ' + (await btns.count()));
  const chip = pg.locator('.ayin-row[role="button"] span', { hasText: '🕯 יום 0/40' });
  (await chip.count()) === 1 ? ok('(א) צ\'יפ-מצב «🕯 יום 0/40» בשורה') : fail('(א) צ\'יפ-המצב חסר');
  /* (ב) שבועי מהתפריט על שורה אחרת */
  await btns.first().click(); await pg.waitForTimeout(300);
  await pg.locator('.ayin-recur-menu button', { hasText: 'שבועי' }).first().click(); await pg.waitForTimeout(900);
  const weekly = ((await dbRead(pg)).events || []).filter((e) => (e.notes || '').startsWith('חזרה שבועית'));
  weekly.length === 12 && weekly.every((e) => e.type === 'call' && e.spId && e.spId !== sp.id) ? ok('(ב) «שבועי ×12» מהתפריט ⇒ 12 אירועי «חזרה שבועית» לשורה השנייה') : fail('(ב) שבועי: ' + weekly.length);
  (await pg.locator('.ayin-row[role="button"] span', { hasText: '📆 1/12' }).count()) === 1 ? ok('(ב) צ\'יפ «📆 1/12» בשורה השבועית (התזכורת הבאה = 1 מתוך 12)') : fail('(ב) צ\'יפ-השבועי חסר');
  /* (ג) «הגיע הזמן» — התומך/ת בלי תיק */
  const dueRow = rows.filter({ hasText: dueSp.name }).first();
  (await dueRow.count()) === 1 ? ok('(ג) התומך/ת בלי תיק-טיפול עלה ללוח בגלל תזכורת שהגיע יומה: ' + dueSp.name) : fail('(ג) השורה חסרה');
  (await dueRow.locator('text=הגיע הזמן').count()) >= 1 && (await dueRow.locator('text=אין תיק טיפול').count()) === 1 ? ok('(ג) השורה: «🕯 הגיע הזמן» + «אין תיק טיפול» (בלי כפתור-חכם)') : fail('(ג) סימוני-השורה חסרים');
  const doneBtn = dueRow.locator('button', { hasText: '✓ בוצע' });
  (await doneBtn.count()) === 1 ? ok('(ג) כפתור «✓ בוצע · 🕯 1/40»') : fail('(ג) כפתור-בוצע חסר');
  await doneBtn.click(); await pg.waitForTimeout(800);
  const ev0 = ((await dbRead(pg)).events || []).find((e) => e.id === 'segdue0');
  ev0?.done === true ? ok('(ג) ✓ בוצע ⇒ האירוע סומן done (toggleEventDone)') : fail('(ג) האירוע לא סומן');
  (await rows.filter({ hasText: dueSp.name }).count()) === 0 ? ok('(ג) אחרי ✓ השורה ירדה מהלוח (אין תיק, אין תזכורת נוספת שהגיע יומה)') : fail('(ג) השורה נשארה');
  (await pg.locator('button', { hasText: '→ כל ' }).count()) === 0 ? ok('(ג) ✓ בוצע לא פתח כרטיס') : fail('(ג) נפתח כרטיס');
  await pg.screenshot({ path: join(HERE, 'shots', 'segula-board.png'), fullPage: false }).catch(() => {});
  await rows.first().click(); await pg.waitForTimeout(900);
  (await pg.locator('text=🕯 40 ימים — סגולה פעילה').count()) === 1 ? ok('(א) פתיחת הכרטיס מהשורה ⇒ פאנל «סגולה פעילה» (אותו מנגנון)') : fail('(א) הכרטיס בלי פאנל-סגולה');
  errors.length === 0 ? ok('(א) אפס שגיאות-קונסולה') : fail('(א) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}

/* (ד) supporters.segula=false ⇒ אין כפתור בלוח ואין קפיצה (אותו דגל כמו בכרטיס) */
{
  const { ctx, pg, errors } = await boot({ 'supporters.segula': false });
  const nRows = await pg.locator('.ayin-row[role="button"]').count();
  (await pg.locator('.ayin-row[role="button"] button', { hasText: '🕯 40 יום' }).count()) === 0 && nRows === 4 ? ok('(ד) דגל false ⇒ אין כפתור 40 יום בלוח, ואין קפיצת-תזכורת (4 שורות)') : fail('(ד) כפתור/שורה למרות הדגל: ' + nRows);
  errors.length === 0 ? ok('(ד) אפס שגיאות-קונסולה') : fail('(ד) שגיאות: ' + errors.join(' | '));
  await ctx.close();
}
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
