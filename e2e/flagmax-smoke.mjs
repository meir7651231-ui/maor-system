/**
 * flagmax-smoke — שער-האימות של פירוק-היכולות (flag-max 2, 20.8):
 * "כל כיבוי מכבה — ושום כיבוי לא שובר".
 *
 * פרופיל א׳ (ברירת-מחדל): קונפיג ריק — מעבר על כל המסכים, אפס שגיאות-דף,
 *   ואלמנטים-מייצגים נוכחים (חסר=פעיל — החוזה).
 * פרופיל ב׳ (הכול-כבוי): כל דגלי-flag-max-2 (נקראים חיים מ-features.ts) על
 *   false בבת-אחת — מעבר על כל המסכים, אפס שגיאות-דף, והאלמנטים המייצגים נעלמו.
 * פרופיל ג׳ (כיבוי-בודד): דגימות של דגל-אחד-כבוי — רק הוא נעלם, השכן נשאר.
 */
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 8891;
const CHROME = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* דגלי-flag-max-2 — נקראים חיים מהמקור: כל key מהבלוק שאחרי סמן-הפירוק. */
const featSrc = fs.readFileSync(path.join(ROOT, 'src/types/features.ts'), 'utf8');
const start = featSrc.indexOf('פירוק-יכולות 20.8');
if (start < 0) throw new Error('סמן flag-max 2 לא נמצא ב-features.ts');
const region = featSrc.slice(start, featSrc.indexOf('\n];', start));
const NEW_FLAGS = [...region.matchAll(/key: '([a-z0-9.]+)'/g)].map((m) => m[1]);
if (NEW_FLAGS.length < 80) throw new Error('נמצאו רק ' + NEW_FLAGS.length + ' דגלי-flag-max — צפוי 90+');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] ?? 'application/octet-stream' });
    res.end(fs.readFileSync(f));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(DIST, 'index.html')));
  }
});
await new Promise((r) => srv.listen(PORT, r));

const browser = await chromium.launch({ executablePath: CHROME });
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('✅', m); };
const bad = (m) => { fail++; console.log('❌', m); };

/** פתיחת עמוד עם קונפיג מוזרק (בלי firebase ⇒ אין שער-ענן) + זריעת-דמו. */
async function openApp(features) {
  const pg = await browser.newPage({ viewport: { width: 1360, height: 940 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.addInitScript((feats) => {
    localStorage.setItem('maor_org_config', JSON.stringify({
      slug: 'default', orgName: 'בדיקת-דגלים', modules: {}, features: feats,
      telephony: { enabled: true, city: 'jerusalem' },
      integrations: { whatsapp: { enabled: true }, maps: { enabled: true } },
    }));
  }, features);
  await pg.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(700);
  // זריעת-דמו אם המערכת ריקה (DemoDrop עלול להיות כבוי בפרופיל-הכול-כבוי — מדלגים)
  const seed = pg.getByRole('button', { name: /טעינת נתוני דמו/ });
  if (await seed.count()) {
    await seed.first().click();
    await pg.waitForTimeout(1200);
  }
  const day = pg.getByRole('button', { name: /פתיחת יום/ });
  if (await day.count()) { await day.first().click().catch(() => {}); await pg.waitForTimeout(400); }
  return { pg, errs };
}

/** מעבר על כל מסכי-הניווט — הזרקת-view דרך ה-store החשוף אינה קיימת; ניווט בקליקים. */
const NAV = ['משפחות', 'חוגים', 'לוח שנה', 'יומן חדרים', 'תורמים', 'קופות צדקה', 'חנות', 'חלוקה', 'דוחות', 'הגדרות'];
async function walkScreens(pg) {
  for (const label of NAV) {
    // ניווט ראשי או תפריט-"עוד" — מנסים את שניהם בעדינות
    let btn = pg.locator('nav button, nav a, [class*=nav] button').filter({ hasText: label }).first();
    if (!(await btn.count())) {
      const more = pg.locator('button').filter({ hasText: 'עוד' }).first();
      if (await more.count()) { await more.click().catch(() => {}); await pg.waitForTimeout(200); }
      btn = pg.locator('button').filter({ hasText: label }).first();
    }
    if (await btn.count()) { await btn.click().catch(() => {}); await pg.waitForTimeout(350); }
  }
}

/* ── פרופיל א׳: ברירת-מחדל — הכול נוכח, אפס שגיאות ── */
{
  const { pg, errs } = await openApp({});
  await walkScreens(pg);
  errs.length === 0 ? ok('ברירת-מחדל · מעבר כל המסכים בלי שגיאת-דף') : bad('ברירת-מחדל · שגיאות: ' + errs.join(' | ').slice(0, 300));
  // אלמנטים-מייצגים נוכחים (חסר=פעיל)
  await pg.locator('button').filter({ hasText: 'תורמים' }).first().click().catch(() => {});
  await pg.waitForTimeout(400);
  const t = await pg.locator('body').innerText();
  for (const el of ['☑ בחירה', '🔎 סינון מתקדם']) {
    t.includes(el) ? ok('ברירת-מחדל · "' + el + '" נוכח') : bad('ברירת-מחדל · "' + el + '" חסר!');
  }
  await pg.close();
}

/* ── פרופיל ב׳: הכול-כבוי — אפס שגיאות + האלמנטים נעלמו ── */
{
  const allOff = Object.fromEntries(NEW_FLAGS.map((k) => [k, false]));
  const { pg, errs } = await openApp(allOff);
  await walkScreens(pg);
  errs.length === 0
    ? ok('הכול-כבוי (' + NEW_FLAGS.length + ' דגלים) · מעבר כל המסכים בלי שגיאת-דף')
    : bad('הכול-כבוי · שגיאות: ' + errs.join(' | ').slice(0, 400));
  // ייצוגים פר-דומיין שחייבים להיעלם
  const checks = [
    ['תורמים', ['☑ בחירה', '🔎 סינון מתקדם', '▦ גריד']],
    ['משפחות', ['⏷ סינון עמודות']],
    ['דוחות', ['🖨 הדפסת כל הדוחות', '🗓 טווח תאריכים']],
  ];
  for (const [screen, gone] of checks) {
    await pg.locator('button').filter({ hasText: screen }).first().click().catch(() => {});
    await pg.waitForTimeout(400);
    const txt = await pg.locator('body').innerText();
    for (const el of gone) {
      !txt.includes(el) ? ok('הכול-כבוי · "' + el + '" נעלם (' + screen + ')') : bad('הכול-כבוי · "' + el + '" עדיין מוצג (' + screen + ')');
    }
  }
  // הבית: המסך-המלא של הטיפול נעלם
  await pg.locator('button').filter({ hasText: 'בית' }).first().click().catch(() => {});
  await pg.waitForTimeout(400);
  const home = await pg.locator('body').innerText();
  !home.includes('המסך המלא ←') ? ok('הכול-כבוי · "המסך המלא ←" נעלם (בית)') : bad('הכול-כבוי · "המסך המלא ←" עדיין מוצג');
  await pg.close();
}

/* ── פרופיל ג׳: כיבוי-בודד — רק הדגל שכובה נעלם, השכן נשאר ── */
const SINGLES = [
  { flag: 'supporters.bulkselect', screen: 'תורמים', gone: '☑ בחירה', stays: '🔎 סינון מתקדם' },
  { flag: 'supporters.advfilter', screen: 'תורמים', gone: '🔎 סינון מתקדם', stays: '☑ בחירה' },
  { flag: 'reports.printall', screen: 'דוחות', gone: '🖨 הדפסת כל הדוחות', stays: '🗓 טווח תאריכים' },
  { flag: 'home.care.full', screen: 'בית', gone: 'המסך המלא ←', stays: 'דורש טיפול' },
];
for (const s of SINGLES) {
  const { pg, errs } = await openApp({ [s.flag]: false });
  await pg.locator('button').filter({ hasText: s.screen }).first().click().catch(() => {});
  await pg.waitForTimeout(450);
  const txt = await pg.locator('body').innerText();
  const goneOk = !txt.includes(s.gone);
  const staysOk = txt.includes(s.stays);
  goneOk && staysOk && errs.length === 0
    ? ok(`כיבוי-בודד · ${s.flag}: "${s.gone}" נעלם, "${s.stays}" נשאר`)
    : bad(`כיבוי-בודד · ${s.flag}: נעלם=${goneOk} נשאר=${staysOk} שגיאות=${errs.length}`);
  await pg.close();
}

console.log(`\nסה"כ: ${pass} ✅ · ${fail} ❌`);
await browser.close();
srv.close();
process.exit(fail ? 1 : 0);
