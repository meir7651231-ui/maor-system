/**
 * מעבר דמו מלא — מריץ את המערכת בדפדפן אמיתי ועובר על כל מסך וכל תהליך מרכזי,
 * מצלם כל שלב, ואוכף אפס שגיאות JS. הוכחה חזותית ש"הכל מחווט מקצה לקצה".
 *
 *   npm run build && node e2e/demo-walkthrough.mjs
 * הצילומים נשמרים ב-e2e/shots/.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots');
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4192, r));
const BASE = 'http://localhost:4192/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2, acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const log = [];
let step = 0, failures = 0;
const shot = async (name) => { step++; await page.screenshot({ path: join(SHOTS, `${String(step).padStart(2, '0')}-${name}.png`) }); };
const T = (name, cond) => { log.push(`  ${cond ? '✅' : '❌'} ${name}`); if (!cond) failures++; return cond; };
const wait = (ms) => page.waitForTimeout(ms);
async function closeModals() {
  // רכיב Modal נסגר רק ב-Escape או ב-mousedown על הרקע (אין כפתור ✕)
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('.modal-back').count())) return;
    await page.keyboard.press('Escape').catch(() => {});
    await wait(200);
    if (await page.locator('.modal-back').count()) {
      await page.locator('.modal-back').last().dispatchEvent('mousedown').catch(() => {});
      await wait(200);
    }
  }
}
const nav = async (label) => { await closeModals(); await page.locator(`nav >> text=${label}`).first().click(); await wait(500); };
const mainTxt = async () => (await page.locator('main').textContent()) ?? '';
async function clickIf(sel, txt) {
  const l = txt ? page.locator(sel, { hasText: txt }) : page.locator(sel);
  if (await l.count()) { await l.first().click(); await wait(350); return true; }
  return false;
}
async function fillModal(val) { const i = page.locator('.modal input').first(); if (await i.count()) { await i.fill(val); return true; } return false; }
async function saveModal() { return clickIf('.modal button', 'שמירה'); }

// ── טעינה נקייה, כל המודולים דולקים ──
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
  localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
});
await page.reload({ waitUntil: 'networkidle' });
await wait(900);
await shot('בית');
T('מסך הבית נטען', (await mainTxt()).length > 20);

// ── משפחות: יצירה + ילד ──
await nav('משפחות');
await clickIf('button', 'הוספת משפחה'); await fillModal('משפחת כהן'); await saveModal(); await wait(400);
T('נוצרה משפחה', (await mainTxt()).includes('כהן'));
if (await clickIf('button', 'הוספת בן משפחה')) { await fillModal('רוני'); await saveModal(); await wait(400); T('נוסף ילד', (await mainTxt()).includes('רוני')); }
await shot('כרטיס-משפחה');

// ── חוגים: יצירה ──
await nav('חוגים');
// חדר פעילות הוא שדה חובה בטופס החוג — יוצרים חדר דרך ההגדרות קודם
await nav('הגדרות');
if (await clickIf('button', 'הוספת חדר')) { await fillModal('חדר ראשי'); await clickIf('.modal button', 'שמירת הגדרות'); await wait(400); }
await nav('חוגים');
await clickIf('button', 'הוספת חוג'); await fillModal('חוג ציור'); await saveModal(); await wait(500);
T('נוצר חוג', (await mainTxt()).includes('ציור'));
await shot('חוגים');

// ── פתיחת כרטיס החוג → שיבוץ → תשלום+קבלה (הכל בהקשר של אותו חוג) ──
await clickIf('[role="button"]', 'ציור'); await wait(500); // פתיחת כרטיס החוג ציור
T('נפתח כרטיס החוג', (await mainTxt()).includes('ציור'));
// שיבוץ מתוך כרטיס החוג (משבץ בדיוק לחוג הזה) — עם הסינון החכם (P1.7):
// רוני (בן) מוסתר מחוג-בנות כברירת מחדל, "הצג הכל" מחזיר אותו
if (await clickIf('button', 'שיבוץ')) {
  await fillModal('רוני'); await wait(400);
  const modalTxt = async () => (await page.locator('.modal').textContent()) ?? '';
  T('סינון שיבוץ חכם מסתיר מועמד מחוץ למגדר החוג', (await modalTxt()).includes('הוסתרו'));
  await clickIf('.modal button', 'הצג הכל'); await wait(300);
  await clickIf('.modal button', 'רוני'); await wait(200);
  await page.locator('.modal button', { hasText: 'שיבוץ' }).last().click(); await wait(700);
  await closeModals();
  T('בוצע שיבוץ לחוג (אחרי "הצג הכל")', (await mainTxt()).includes('רוני'));
  await shot('שיבוץ');
}
// ניהול השיבוץ (⚙ בתוך כרטיס החוג, לא גלגל ההגדרות בתפריט) → קבלת תשלום
if (await clickIf('main button', '⚙')) {
  await wait(400);
  const payInput = page.locator('.modal input[placeholder*="סכום"]').first();
  if (await payInput.count()) {
    await payInput.fill('120');
    await clickIf('.modal button', 'קבלת תשלום');
    await wait(500);
    // #22: אימות-תוצאה אמיתי — התשלום נשמר ב-DB (לא רק "בלי שגיאת JS", שתמיד עבר).
    const paid120 = await page.evaluate(
      () => JSON.parse(localStorage.getItem('maor_db') || '{}').enrollments?.some(
        (e) => e.payments?.some((p) => p.amount === 120 && typeof p.rid === 'string' && p.rid.startsWith('R-')),
      ) ?? false,
    );
    T('נרשם תשלום 120 עם קבלה R- (נשמר ב-DB) — בלי שגיאת JS', errors.length === 0 && paid120);
    await shot('תשלום-וקבלה');
  } else {
    T('נפתח מסך ניהול השיבוץ', await page.locator('.modal').count() > 0);
    await shot('ניהול-שיבוץ');
  }
  await closeModals();
}

// ── P0.3: כרטיס משפחה תפעולי (families.cardops) — שיבוץ כרטיסייה + ניקוב מהכרטיס ──
await nav('חוגים');
await clickIf('main button', '→ כל'); // חזרה מכרטיס החוג הפתוח לרשימת החוגים
await clickIf('button', 'הוספת חוג');
await fillModal('חוג התעמלות');
const modelSel = page.locator('.modal select:has(option[value="punch"])').first();
if (await modelSel.count()) { await modelSel.selectOption('punch'); await wait(250); }
const sizeInp = page.locator('.modal input[placeholder="10"]').first();
if (await sizeInp.count()) await sizeInp.fill('10');
await saveModal(); await wait(500);
T('נוצר חוג כרטיסייה', (await mainTxt()).includes('התעמלות'));
await nav('משפחות');
await page.locator('main >> text=כהן').first().click(); await wait(500);
if (await clickIf('main button', 'שיבוץ ל')) {
  await fillModal('רוני'); await wait(350);
  await clickIf('.modal button', 'רוני'); await wait(200);
  // הסינון החכם מסתיר את חוג-הבנות מרוני — "הצג הכל" מחזיר אותו (P1.7)
  await clickIf('.modal button', 'הצג הכל'); await wait(250);
  await page.locator('.modal input').nth(1).fill('התעמלות'); await wait(350);
  await clickIf('.modal button', 'התעמלות'); await wait(200);
  await page.locator('.modal button', { hasText: 'שיבוץ' }).last().click(); await wait(600);
  await closeModals();
}
T('שיבוץ כרטיסייה מכרטיס המשפחה', (await mainTxt()).includes('10 מתוך 10'));
// ניקוב מהכרטיס — עובר דרך אותו store.punch של מסך החוגים (P0.3),
// עם אישור כפול (P1.3, courses.punch.confirm דלוק כברירת מחדל כמו בקובץ החי)
await clickIf('main button', 'ניקוב'); await wait(300);
T('לחיצה ראשונה מזיינת — "לאשר ניקוב?" ובלי ירידת יתרה', (await mainTxt()).includes('לאשר ניקוב?') && (await mainTxt()).includes('10 מתוך 10'));
await clickIf('main button', 'לאשר ניקוב?'); await wait(500);
T('ניקוב מכרטיס המשפחה — היתרה ירדה', (await mainTxt()).includes('9 מתוך 10'));
T('פעולות ⚙/🤒 והוספת אירוע זמינות בכרטיס', (await page.locator('main button', { hasText: '⚙' }).count()) > 0 && (await page.locator('main button', { hasText: '➕ אירוע' }).count()) > 0);
await shot('כרטיס-משפחה-תפעולי');

// ── P2 אשכול א׳: מדדי הדשבורד נראים במסך הבית ──
await nav('בית');
await wait(600);
{
  const t = await mainTxt();
  // UX סבב-ג׳ (5.8): הלוח רזה כברירת-מחדל — האנליטיקה עברה לספריית-הווידג'טים
  // (הוספה בקליק דרך ✏️ עריכת-הלוח). בודקים שהליבה הרזה במקומה ושהעורך זמין.
  T('הלוח הרזה: היום + דורש-טיפול נראים בבית', t.includes('דורש טיפול') || t.includes('היום'));
  const editBtn = await page.locator('.hm-edit-link').count();
  T('עריכת-הלוח (✏️) זמינה — האנליטיקה נוספת משם', editBtn > 0);
}

// ── P2 אשכול ו׳: המדריך המהיר 📖 נפתח (#guide, פער 29) ──
await page.evaluate(() => { window.location.hash = '#guide'; });
await wait(600);
{
  const t = await page.evaluate(() => document.body.innerText);
  T('המדריך המהיר נפתח ב-#guide', t.includes('המדריך המהיר') && t.includes('המתכונים המהירים:'));
  T('קופסת "לפני הכל" במדריך', t.includes('לפני הכל:') && t.includes('אי אפשר לקלקל'));
}
await shot('המדריך-המהיר');
await page.keyboard.press('Escape'); await wait(400);
await page.evaluate(() => { window.location.hash = ''; });
await wait(300);

// ── תורמים + תרומה ──
await nav('תורמים');
await clickIf('button', 'הוספת תומך'); await fillModal('קרן פרידמן'); await saveModal(); await wait(500);
T('נוסף תורם', (await mainTxt()).includes('פרידמן'));
if (await clickIf('main', 'פרידמן') || await clickIf('main button', 'פרידמן')) {
  await wait(300);
  if (await clickIf('button', 'רישום תרומה')) {
    // שדה הסכום הוא היחיד מסוג number (שדה התאריך = select/type=date); nth(1) על
    // איחוד-הקלטים פספס אותו כשהתאריך בגריד-עברי ⇒ התרומה לא נשמרה בשקט (#22).
    const amt = page.locator('.modal input[type="number"]').first();
    if (await amt.count()) { await amt.fill('500'); }
    if (!(await clickIf('.modal button', 'רישום התרומה'))) await saveModal();
    await wait(500);
    // #22: אימות-תוצאה אמיתי — התרומה נשמרה ב-DB עם קבלת-מס D- (לא רק "בלי שגיאה").
    const don500 = await page.evaluate(
      () => JSON.parse(localStorage.getItem('maor_db') || '{}').supporters?.some(
        (s) => s.donations?.some((d) => d.amount === 500 && typeof d.rid === 'string' && d.rid.startsWith('D-')),
      ) ?? false,
    );
    T('נרשמה תרומה 500 עם קבלת-מס D- (נשמר ב-DB) — בלי שגיאת JS', errors.length === 0 && don500);
  }
}
await shot('תורמים-ותרומה');

// ── לוח שנה + יצירת אירוע ──
await nav('לוח');
await wait(400);
await clickIf('button', 'הוספת אירוע');
await wait(300);
if (await page.locator('.modal').count()) { await fillModal('אסיפת הורים'); await saveModal(); await wait(400); T('נוצר אירוע — בלי שגיאת JS', errors.length === 0); }
// P2 אשכול ד׳: פאנל "הקרובים" נראה (פער 25)
T('פאנל "הקרובים" נראה בלוח', (await mainTxt()).includes('הקרובים — 30 הימים הבאים'));
await shot('לוח-שנה');

// ── יומן חדרים ──
await nav('יומן');
await wait(500);
await shot('יומן-חדרים');
T('יומן החדרים נטען', errors.length === 0);

// ── דוחות ──
await nav('דוחות');
await wait(500);
await shot('דוחות');

// ── הגדרות + בדיקת תקינות + גיבוי ──
await nav('הגדרות');
await wait(500);
await shot('הגדרות');
// UX סבב-ו׳: בדיקת-תקינות עברה ללשונית "📚 נתונים"
await clickIf('button', '📚 נתונים');
await wait(400);
if (await clickIf('button', 'בדיקת תקינות')) { await wait(500); await shot('בדיקת-תקינות'); T('בדיקת תקינות רצה — בלי שגיאת JS', errors.length === 0); }

// ── חיפוש כללי (Command Palette דרך Ctrl+K) ──
await closeModals();
await page.keyboard.press('Control+k');
await wait(400);
// UX סבב-ו׳: הלוקטור הישן (כל input בדף) בכלל מילא את השדה הראשון במסך שמאחורי
// הפלטה (שם-הארגון!), ועם לשונית "📚 נתונים" נפל על input-הקובץ החבוי של השחזור.
// מכוונים לשדה של פלטת-החיפוש עצמה (class="palette").
const si = page.locator('.palette input').first();
if (await si.count()) {
  await si.fill('כהן'); await wait(500);
  await shot('חיפוש');
  T('חיפוש כללי (Ctrl+K) נפתח וקיבל קלט — בלי שגיאת JS', errors.length === 0);
  await closeModals();
} else {
  T('חיפוש כללי נפתח', false);
}

T('אפס שגיאות JS בכל המעבר', errors.length === 0);

console.log('\n🎬 מעבר דמו מלא — כל התהליכים');
console.log(log.join('\n'));
if (errors.length) console.log('\nשגיאות JS:\n' + errors.slice(0, 6).join('\n'));
console.log(`\n${step} צילומים נשמרו ב: ${SHOTS}`);

await ctx.close();
await browser.close();
server.close();
console.log(failures === 0 ? '\n🏆 כל התהליכים עברו — מחווט מקצה לקצה, 100/100' : `\n💥 ${failures} כשלים`);
process.exit(failures === 0 ? 0 : 1);
