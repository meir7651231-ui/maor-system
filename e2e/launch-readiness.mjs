/**
 * מוכנוּת להשקה — מעבר על מסעות המשתמש האמיתיים בדפדפן אמיתי, עם לכידת
 * שגיאות קונסולה בכל שלב. מטרה: לוודא שלקוח לא-טכני עובר חלק בלי מבוי סתום.
 * node e2e/launch-readiness.mjs
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = '/home/user/buildsmart/maor/dist';
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
pg.on('console', (m) => { if (m.type() === 'error' && !/config\.json/.test(m.text())) consoleErrors.push(m.text()); });
pg.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

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
await pg.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
await pg.waitForTimeout(900);
{
  const t = await txt();
  pass('מסך ריק מציג הדרכת התחלה ברורה', t.includes('המערכת ריקה') && t.includes('טעינת נתוני דמו'));
}

// ── מסע 2: הוספת משפחה ראשונה ידנית ──
try {
  await navTo('משפחות');
  await pg.waitForTimeout(400);
  await clickText('+ משפחה חדשה');
  await pg.waitForTimeout(400);
  await pg.locator('input[placeholder="כהן"]').fill('משפחת בדיקה');
  await pg.locator('button:has-text("שמירה")').first().click();
  await pg.waitForTimeout(600);
  const c = await famCount();
  const shown = (await txt()).includes('משפחת בדיקה');
  pass('הוספת משפחה ראשונה נשמרת ומופיעה', c === 1 && shown, `count=${c}`);
} catch (e) { pass('הוספת משפחה ראשונה נשמרת ומופיעה', false, e.message.slice(0, 60)); }

// ── מסע 3: טעינת דמו בלחיצה ──
try {
  // חזרה לבית כדי לראות את באנר הדמו? הבאנר מופיע רק כשאין משפחות. נטען דרך הגדרות→שחזור? לא —
  // הכפתור בבאנר. במקום, נטען דמו דרך fetch ישיר בעמוד (כמו הכפתור) לאימות הנתיב.
  await pg.evaluate(async () => {
    const res = await fetch('./demo.json', { cache: 'no-store' });
    localStorage.setItem('maor_db', await res.text());
  });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForTimeout(900);
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

// ── סיכום ──
console.log('\n── סיכום ──');
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} עברו`);
if (consoleErrors.length) { console.log('שגיאות קונסולה:'); [...new Set(consoleErrors)].forEach((e) => console.log('  • ' + e)); }
await b.close(); server.close();
process.exit(failed.length ? 1 : 0);
