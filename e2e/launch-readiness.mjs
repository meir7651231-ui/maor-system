/**
 * מוכנוּת להשקה — מעבר על מסעות המשתמש האמיתיים בדפדפן אמיתי, עם לכידת
 * שגיאות קונסולה בכל שלב. מטרה: לוודא שלקוח לא-טכני עובר חלק בלי מבוי סתום.
 * node e2e/launch-readiness.mjs
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/maor-system\/?/, '/');
    if (p === '/' || p === '') p = '/index.html';
    const fp = normalize(join(ROOT, p));
    const data = await readFile(fp);
    res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/maor-system/`;

const results = [];
const pass = (n, ok, note = '') => { results.push({ n, ok, note }); console.log(`${ok ? '✅' : '❌'} ${n}${note ? ' — ' + note : ''}`); };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1000, height: 850 }, acceptDownloads: true });
const pg = await ctx.newPage();
const consoleErrors = [];
let collectErrors = true; // מושבת רגעית בהקפצת ה-IDB-reset (דף demo.json מייצר 404 של favicon שאינו של האפליקציה)
pg.on('console', (m) => { if (collectErrors && m.type() === 'error' && !/config\.json/.test(m.text())) consoleErrors.push(m.text()); });
pg.on('pageerror', (e) => { if (collectErrors) consoleErrors.push('[pageerror] ' + e.message); });

const txt = () => pg.evaluate(() => document.body.innerText);
const famCount = () => pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('maor_db')).families.length; } catch { return -1; } });
const clickText = async (t) => pg.locator(`button:has-text(${JSON.stringify(t)}), a:has-text(${JSON.stringify(t)})`).first().click();
const navTo = async (label) => {
  await pg.evaluate((l) => {
    const els = [...document.querySelectorAll('button,a')];
    const el = els.find((e) => (e.getAttribute('aria-label') === l || (e.textContent || '').trim() === l) && e.closest('nav,header,aside'));
    (el || els.find((e) => (e.textContent || '').includes(l)))?.click();
  }, label);
  await pg.waitForTimeout(500);
};

// ── מסע 1: פתיחה ריקה — האם ההדרכה ברורה? ──
// config מוזרק בלי firebase ⇒ ענן כבוי ⇒ אין מסך התחברות שחוסם את המסעות
// (localStorage גובר על config.json — ראה src/lib/config.ts + CLAUDE.md).
await pg.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
await pg.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
  localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
});
await pg.reload({ waitUntil: 'networkidle' });
await pg.waitForTimeout(900);
{
  const t = await txt();
  pass('מסך ריק מציג הדרכת התחלה ברורה', t.includes('המערכת ריקה') && t.includes('טעינת נתוני דמו'));
}

// ── מסע 2: הוספת משפחה ראשונה ידנית ──
try {
  await navTo('משפחות');
  await pg.waitForTimeout(400);
  await clickText('הוספת משפחה');
  await pg.waitForTimeout(400);
  await pg.locator('input[placeholder="כהן"]').fill('משפחת בדיקה');
  await pg.locator('button:has-text("שמירה")').first().click();
  await pg.waitForTimeout(600);
  const c = await famCount();
  const shown = (await txt()).includes('משפחת בדיקה');
  pass('הוספת משפחה ראשונה נשמרת ומופיעה', c === 1 && shown, `count=${c}`);
} catch (e) { pass('הוספת משפחה ראשונה נשמרת ומופיעה', false, e.message.slice(0, 60)); }

// ── מסע 3: טעינת דמו בלחיצה — הזרימה האמיתית של המשתמש ──
try {
  // הבאנר מופיע רק כשאין משפחות, ו-IndexedDB גובר על localStorage — לכן איפוס
  // מלא של שתי השכבות (כמו לקוח טרי) ואז לחיצה על הכפתור האמיתי בבאנר.
  // מחיקת ה-IDB חייבת לקרות כשהאפליקציה לא רצה (חיבור פתוח חוסם deleteDatabase),
  // לכן עוברים רגע לדף באותו origin בלי האפליקציה (demo.json) ומוחקים משם.
  collectErrors = false;
  await pg.goto(base + 'demo.json', { waitUntil: 'load' });
  await pg.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
    await new Promise((resolve) => { const rq = indexedDB.deleteDatabase('maor'); rq.onsuccess = rq.onerror = rq.onblocked = resolve; });
  });
  await pg.goto(base, { waitUntil: 'networkidle' });
  collectErrors = true;
  await pg.waitForTimeout(700);
  await clickText('📊 טעינת נתוני דמו');
  await pg.waitForTimeout(1500);
  pass('טעינת דמו ממלאה 60 משפחות', (await famCount()) === 60);
} catch (e) { pass('טעינת דמו ממלאה 60 משפחות', false, e.message.slice(0, 60)); }

// ── מסע 4: מעבר על כל 8 המסכים ללא שגיאות + תוכן ──
const VIEWS = [
  ['בית', 'בוקר טוב|אור הדגמה|היום'],
  ['משפחות', 'משפח'],
  ['חוגים', 'חוג'],
  ['לוח שנה', 'ראשון|שני|היום|לוח'],
  ['יומן חדרים', 'חדר|יומן'],
  ['תורמים', 'תורם|תרומ'],
  ['דוחות', 'דוח|סיכום|סה"כ'],
];
for (const [label, expect] of VIEWS) {
  try {
    const before = consoleErrors.length;
    await navTo(label);
    await pg.waitForTimeout(500);
    const t = await txt();
    const ok = new RegExp(expect).test(t);
    const newErrs = consoleErrors.length - before;
    pass(`מסך "${label}" נטען עם תוכן, בלי שגיאות`, ok && newErrs === 0, newErrs ? `${newErrs} שגיאות` : (ok ? '' : 'תוכן חסר'));
  } catch (e) { pass(`מסך "${label}"`, false, e.message.slice(0, 60)); }
}

// ── מסע 5: הורדת גיבוי ──
try {
  const dl = pg.waitForEvent('download', { timeout: 5000 });
  await pg.keyboard.press('Control+k'); await pg.waitForTimeout(300);
  await pg.keyboard.type('גיבוי'); await pg.waitForTimeout(300);
  await pg.keyboard.press('Enter');
  const d = await dl;
  pass('הורדת גיבוי מלא עובדת', !!(await d.path()) || !!d.suggestedFilename());
} catch (e) { pass('הורדת גיבוי מלא עובדת', false, e.message.slice(0, 60)); }

// ── מסע 6: ייבוא גיבוי לגאסי (P0.1) — הקובץ החי → React בלי לאבד כלום ──
try {
  const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'legacy-backup.json');
  await navTo('הגדרות');
  await pg.waitForTimeout(600);
  // UX סבב-ו׳: ההגדרות מקובצות ללשוניות — גיבוי/שחזור/ייבוא בלשונית "📚 נתונים"
  await clickText('📚 נתונים');
  await pg.waitForTimeout(400);
  // UX סבב-ז׳: אישור-הדריסה עבר מ-window.confirm למודאל פנימי — מקליקים על הכפתור
  await pg.locator('label:has-text("⬆ שחזור מקובץ גיבוי") input[type=file]').setInputFiles(fixture);
  await pg.waitForTimeout(600);
  await clickText('אישור השחזור — דריסת הנתונים');
  await pg.waitForTimeout(1500); // debounce השמירה ל-localStorage הוא 500ms
  const db = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('maor_db')); } catch { return null; } });
  const counts = db && db.families.length === 3 && db.supporters.length === 2 && db.courses.length === 1 &&
    db.enrollments.length === 1 && db.teachers.length === 1 && db.rooms.length === 1;
  const idsKept = db && db.families.map((f) => f.id).join(',') === 'fr12,wd7,fb3' && db.supporters[0].id === 'spi105';
  const histKept = db && db.supporters[0].hist && db.supporters[0].hist.length === 2;
  // ספירות על המסך — מסך המשפחות מציג את שלוש המשפחות מהגיבוי
  await navTo('משפחות');
  await pg.waitForTimeout(600);
  const t1 = await txt();
  const onScreen = t1.includes('פרידמן') && t1.includes('וידר') && t1.includes('פישביין');
  pass('ייבוא גיבוי לגאסי — ספירות זהות, ids נשמרו, hist נשמר', !!(counts && idsKept && histKept && onScreen),
    db ? `fam=${db.families.length} sup=${db.supporters.length}` : 'db=null');
  // hist מוצג בכרטיס התומכת — 'מהקובץ ההיסטורי' (legacy supDonEvents)
  await navTo('תורמים');
  await pg.waitForTimeout(500);
  await pg.locator('text=גולדשטיין').first().click();
  await pg.waitForTimeout(600);
  const t2 = await txt();
  pass('כרטיס התומכת מציג תרומות "מהקובץ ההיסטורי"', t2.includes('מהקובץ ההיסטורי') && t2.includes('קבלה D-3'));
} catch (e) { pass('ייבוא גיבוי לגאסי', false, e.message.slice(0, 60)); }

// ── מסע 7: ייבוא תומכות מ-CSV (הדבקה → שלב 1 → החלה) — הבאג שנתפס בשטח 6.8:
// onClick={apply} העביר את אירוע-הקליק כ-p ודרס את plan ⇒ קריסה וכלום לא יובא.
// המסע מכסה את נתיב-האישור הדו-שלבי שאף בדיקה לא כיסתה מאז P2-33. ──
try {
  await navTo('הגדרות');
  await pg.waitForTimeout(500);
  await clickText('📚 נתונים');
  await pg.waitForTimeout(400);
  await clickText('תורמים (CSV)');
  await pg.waitForTimeout(300);
  await pg.locator('#sec-import textarea').first().fill('שם,טלפון\nתורם בדיקה,050-9998887\nתורמת שנייה,052-1112223');
  await pg.locator('#sec-import button:has-text("בדיקת הקובץ")').first().click();
  await pg.waitForTimeout(400);
  await pg.locator('#sec-import button:has-text("ייבוא 2")').first().click();
  await pg.waitForTimeout(1200);
  const db7 = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('maor_db')); } catch { return null; } });
  const names7 = (db7?.supporters ?? []).map((s) => s.name);
  pass('ייבוא תומכות CSV — שלב 1 + החלה נכנסים ל-db', names7.includes('תורם בדיקה') && names7.includes('תורמת שנייה'),
    'sup=' + names7.length);
} catch (e) { pass('ייבוא תומכות CSV', false, e.message.slice(0, 60)); }

// ── סיכום ──
console.log('\n── סיכום ──');
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} עברו`);
if (consoleErrors.length) { console.log('שגיאות קונסולה:'); [...new Set(consoleErrors)].forEach((e) => console.log('  • ' + e)); }
await b.close(); server.close();
process.exit(failed.length ? 1 : 0);
