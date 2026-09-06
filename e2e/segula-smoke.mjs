/**
 * סמוק סגולת 40 יום (בקשת-בעלים 6.9 "תבדוק מה קורה עם הכפתור של 40 יום"):
 * קונפיג-השורש (בלי firebase) ← דמו ← כרטיס-תורם ← "🕯 40 ימים" ⇒ 5 אירועי-לוח +
 * קשר-הבא + פאנל-סגולה (רשימת 5 תזכורות) ⇒ ✓ סימון תזכורת ⇒ 🔄 התחלה-מחדש (דו-לחיצתי)
 * ⇒ ✖ ביטול (דו-לחיצתי) ⇒ הכפתור חוזר, 0 אירועי-סגולה. דורש build קודם.
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
const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8253, r));

const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8'));
delete cfg.firebase; // ענן כבוי ⇒ אין מסך-התחברות; שאר קונפיג-השורש (דגלי opt-in) כמו בחי
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1024, height: 1366 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const dbRead = () => pg.evaluate(() => JSON.parse(localStorage.getItem('maor_db') || '{}'));
const segulaEvs = async () => ((await dbRead()).events || []).filter((e) => (e.notes || '').startsWith('סגולת '));

await pg.addInitScript((c) => { localStorage.setItem('maor_org_config', JSON.stringify(c)); }, cfg);
await pg.goto('http://localhost:8253/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'תורמים' }).first().click();
await pg.waitForTimeout(700);
await pg.locator('main table tbody tr').first().click();
await pg.waitForTimeout(800);

/* 1 · הכפתור קיים ונראה */
const btn = pg.locator('button', { hasText: '🕯 40 ימים' });
(await btn.count()) === 1 && (await btn.first().isVisible()) ? ok('כפתור "🕯 40 ימים" מוצג בכרטיס (קשר-הבא)') : fail('כפתור 40 ימים חסר/מוסתר');
(await segulaEvs()).length === 0 ? ok('לפני הלחיצה: 0 אירועי-סגולה') : fail('אירועי-סגולה קיימים לפני הלחיצה');

/* 2 · לחיצה ⇒ 5 אירועים + קשר-הבא + פאנל */
await btn.first().click();
await pg.waitForTimeout(900);
const evs1 = await segulaEvs();
evs1.length === 5 ? ok('לחיצה ⇒ 5 אירועי-סגולה (call, spId)') : fail('צפוי 5 אירועים, יש ' + evs1.length);
const sp1 = ((await dbRead()).supporters || []).find((s) => s.id === evs1[0]?.spId);
sp1?.nextDate && (sp1.nextNote || '').includes('סגולת 40 יום') ? ok('קשר-הבא: יעד=' + sp1.nextDate + ' + שורת-סגולה בהערה') : fail('קשר-הבא לא עודכן: ' + JSON.stringify({ d: sp1?.nextDate, n: sp1?.nextNote }));
(await btn.count()) === 0 ? ok('הכפתור הוחלף בפאנל-הסגולה') : fail('הכפתור עדיין מוצג אחרי הזריעה');
const chips = pg.locator('button.chip', { hasText: 'יום ' }).filter({ hasText: /☐|☑/ });
(await chips.count()) === 5 ? ok('פאנל: 5 תזכורות מוצגות (יום 1·7·21·35·40)') : fail('צפויות 5 תזכורות בפאנל, יש ' + (await chips.count()));
(await pg.locator('text=סגולה פעילה').count()) === 1 ? ok('שורת-מצב "סגולה פעילה"') : fail('שורת-המצב חסרה');

/* 3 · ✓ סימון תזכורת */
await chips.first().click();
await pg.waitForTimeout(500);
const doneNow = (await segulaEvs()).filter((e) => e.done).length;
doneNow === 1 ? ok('לחיצה על תזכורת ⇒ בוצע ✓ (1/5)') : fail('סימון-בוצע לא נרשם: ' + doneNow);
(await pg.locator('text=1/5 תזכורות בוצעו').count()) === 1 ? ok('המונה בפאנל 1/5') : fail('המונה לא התעדכן');

/* 4 · 🔄 התחלה-מחדש (דו-לחיצתי) */
const restart = pg.locator('button', { hasText: 'התחלה מחדש' }).first();
await restart.click();
await pg.waitForTimeout(200);
(await pg.locator('button', { hasText: 'לחצו שוב לאישור' }).count()) === 1 ? ok('לחיצה ראשונה חומשת ("לחצו שוב לאישור") — אין ביצוע') : fail('חימוש דו-לחיצתי לא הופיע');
(await segulaEvs()).length === 5 && (await segulaEvs()).filter((e) => e.done).length === 1 ? ok('לחיצה ראשונה לא שינתה כלום') : fail('לחיצה ראשונה ביצעה!');
await pg.locator('button', { hasText: 'לחצו שוב לאישור' }).first().click();
await pg.waitForTimeout(900);
const evs2 = await segulaEvs();
evs2.length === 5 && evs2.every((e) => !e.done) && !evs2.some((e) => evs1.some((o) => o.id === e.id)) ? ok('התחלה-מחדש ⇒ 5 אירועים חדשים, 0 בוצעו, הישנים הוסרו') : fail('התחלה-מחדש שגויה: ' + evs2.length + ' / done ' + evs2.filter((e) => e.done).length);

/* 5 · ✖ ביטול (דו-לחיצתי) */
const cancel = pg.locator('button', { hasText: 'ביטול הסגולה' }).first();
await cancel.click();
await pg.waitForTimeout(200);
await pg.locator('button', { hasText: 'לחצו שוב לאישור' }).first().click();
await pg.waitForTimeout(900);
(await segulaEvs()).length === 0 ? ok('ביטול ⇒ 0 אירועי-סגולה') : fail('אירועים נשארו אחרי ביטול');
const sp2 = ((await dbRead()).supporters || []).find((s) => s.id === sp1?.id);
!(sp2?.nextNote || '').includes('סגולת') && !sp2?.nextDate ? ok('ביטול ⇒ שורת-הסגולה ירדה מקשר-הבא והיעד נוקה') : fail('קשר-הבא לא נוקה: ' + JSON.stringify({ d: sp2?.nextDate, n: sp2?.nextNote }));
(await btn.count()) === 1 ? ok('הכפתור "🕯 40 ימים" חזר') : fail('הכפתור לא חזר אחרי ביטול');

await pg.screenshot({ path: join(HERE, 'shots', 'segula-panel.png'), fullPage: true }).catch(() => {});
errors.length === 0 ? ok('אפס שגיאות-קונסולה') : fail('שגיאות: ' + errors.join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
