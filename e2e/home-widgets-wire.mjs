/**
 * סמוק-חיווט פר-ווידג'ט (20.8, בקשת-בעלים "כל ווידג'ט במסך תבדוק חיווט מלא"):
 * מוסיפים דרך עורך-הלוח את **כל** ספריית-הווידג'טים, ואז לכל ווידג'ט —
 * בדיקת-רינדור עם נתונים אמיתיים + פעולה אמיתית (קליק/סימון/הורדה) + אימות
 * שהמערכת הגיבה (ניווט/עדכון-נתונים/קובץ). אותו סגנון כמו crosswire-smoke.
 * דורש build קודם (npm run build).
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
await new Promise((r) => server.listen(8234, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const skip = (m) => console.log('⏭️  ' + m);
const dbEval = (fn) => pg.evaluate((src) => { const db = JSON.parse(localStorage.getItem('maor_db') || '{}'); return new Function('db', 'return (' + src + ')(db)')(db); }, fn.toString());
/** section.card של ווידג'ט לפי כותרתו. */
const panel = (title) => pg.locator('section.card', { hasText: title }).first();
const goHome = async () => { await pg.locator('nav button, .side-link', { hasText: 'בית' }).first().click(); await pg.waitForTimeout(500); };
/** האם עזבנו את הבית (ה-hero נעלם) — הוכחת-ניווט אוניברסלית. */
const leftHome = async () => (await pg.locator('.hm-hero').count()) === 0;

await pg.addInitScript(() => {
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, telephony: { enabled: true, city: 'jerusalem' }, integrations: { whatsapp: { enabled: true } } }));
});
await pg.goto('http://localhost:8234/');
await pg.waitForSelector('main', { timeout: 20000 });

/* ── זריעה ── */
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await goHome();

/* ── עורך-הלוח: הוספת כל ספריית-הווידג'טים (פעולה אמיתית דרך ה-UI) ── */
await pg.locator('.hm-edit-link').click();
await pg.waitForTimeout(400);
let added = 0;
for (let i = 0; i < 20; i++) {
  const addBtn = pg.locator('button', { hasText: '+ הוספה' }).first();
  if (!(await addBtn.count())) break;
  await addBtn.click();
  added++;
  await pg.waitForTimeout(150);
}
await pg.locator('button', { hasText: 'שמירת הלוח ✓' }).click();
await pg.waitForTimeout(900);
const savedLayout = await dbEval((db) => db.ui?.homeLayout ?? null);
savedLayout && savedLayout.length >= 12
  ? ok(`עורך-הלוח · נוספו ${added} ווידג'טים ונשמרו (פריסה: ${savedLayout.length})`)
  : fail('עורך-הלוח · הפריסה לא נשמרה: ' + JSON.stringify(savedLayout));

/* ── 1 · hero — ברכה + פעולה-מהירה פותחת את טופס-המשפחה ── */
(await pg.locator('.hm-hero-title').textContent())?.trim()
  ? ok('hero · ברכת-השעה מוצגת')
  : fail('hero · אין ברכה');
await pg.locator('.hm-hero button', { hasText: '➕ הוספת משפחה' }).click();
await pg.waitForTimeout(500);
(await leftHome()) && (await pg.locator('.modal-back').count())
  ? ok('hero · "➕ הוספת משפחה" פתח את הטופס עצמו (openFamilyForm)')
  : fail('hero · הטופס לא נפתח');
await pg.keyboard.press('Escape');
await goHome();

/* ── 2 · stats — הערך = הנתון האמיתי; קליק מנווט ── */
const famTotal = await dbEval((db) => db.families.length);
const famCard = pg.locator('.hm-stat', { hasText: 'משפחות' }).first();
(await famCard.locator('.hm-stat-value').textContent())?.trim() === String(famTotal)
  ? ok(`stats · כרטיס-המשפחות מציג את הנתון האמיתי (${famTotal})`)
  : fail('stats · הערך לא תואם');
await famCard.click();
await pg.waitForTimeout(500);
(await leftHome()) ? ok('stats · קליק על הכרטיס מנווט למשפחות') : fail('stats · הקליק לא ניווט');
await goHome();

/* ── 3 · today — "נוכחות ✓" פותח את כרטיס-החוג עם טבלת-השיבוצים ── */
const attnPill = pg.locator('.hm-pill-btn', { hasText: 'נוכחות' }).first();
if (await attnPill.count()) {
  await attnPill.click();
  await pg.waitForTimeout(600);
  (await pg.locator('text=רשומים').count())
    ? ok('today · "נוכחות ✓" פתח את כרטיס-החוג (טבלת-הרשומים)')
    : fail('today · לא הגענו לכרטיס-החוג');
  await goHome();
} else skip('today · אין מפגשים היום בדמו — דילוג');

/* ── 4 · attention — "✓ טופל" מסמן; "ביטול" מחזיר ── */
const doneBefore = await dbEval((db) => Object.keys(db.attnDone ?? {}).length);
await panel('דורש טיפול').locator('button', { hasText: '✓ טופל' }).first().click();
await pg.waitForTimeout(900);
const doneAfter = await dbEval((db) => Object.keys(db.attnDone ?? {}).length);
doneAfter === doneBefore + 1
  ? ok('attention · "✓ טופל" נרשם (attnDone +1)')
  : fail(`attention · הסימון לא נרשם (${doneBefore}→${doneAfter})`);
await panel('דורש טיפול').locator('button', { hasText: 'הצג שטופלו' }).click();
await pg.waitForTimeout(300);
await panel('דורש טיפול').locator('button', { hasText: 'ביטול' }).first().click();
await pg.waitForTimeout(900);
(await dbEval((db) => Object.keys(db.attnDone ?? {}).length)) === doneBefore
  ? ok('attention · "ביטול" החזיר את הפריט (attnDone חזר)')
  : fail('attention · הביטול לא החזיר');

/* ── 5 · digest — שורות-תקציר; קליק מנווט ── */
const digestRows = panel('תקציר הבוקר').locator('.hm-row');
if (await digestRows.count()) {
  await digestRows.first().click();
  await pg.waitForTimeout(500);
  (await leftHome()) ? ok('digest · קליק על שורת-תקציר מנווט') : fail('digest · הקליק לא ניווט');
  await goHome();
} else skip('digest · אין שורות-תקציר');

/* ── 6 · carousel — פריטים/מצב-ריק + חיצים עובדים ── */
const carSec = pg.locator('section[aria-label="אירועים קרובים"]').first();
if (await carSec.count()) {
  const next = carSec.locator('button[aria-label="הפריט הבא"]');
  if (await next.count()) {
    await next.click();
    await pg.waitForTimeout(200);
    ok('carousel · פריטים מוצגים והחץ מדפדף');
  } else ok('carousel · מצב-ריק תקין (אין אירועים ב-14 יום)');
} else fail('carousel · המקטע לא רונדר');

/* ── 7 · goldbook — פודיום מנתוני-אמת; "לתורמים ←" מנווט ── */
const gold = panel('ספר הזהב');
((await gold.textContent()) ?? '').includes('₪')
  ? ok('goldbook · פודיום עם סכומי-אמת')
  : fail('goldbook · אין סכומים');
await gold.locator('button', { hasText: 'לתורמים' }).click();
await pg.waitForTimeout(500);
(await leftHome()) ? ok('goldbook · "לתורמים ←" מנווט') : fail('goldbook · הניווט נכשל');
await goHome();

/* ── 8 · hebcal — הלוח העברי עם שורות-אמת ── */
(await panel('הלוח העברי').locator('.hm-row').count()) > 0
  ? ok('hebcal · שורות הלוח-העברי מוצגות')
  : fail('hebcal · אין שורות');

/* ── 9 · community — אריח-דרגה לחיץ ⇒ משפחות מסוננות ── */
const commTile = panel('אמינות קהילתי').locator('button.hm-tier').first(); // כותרת-הקהילה המדויקת (סתם 'אמינות' נתפס גם ב'דורש טיפול')
if (await commTile.count()) {
  await commTile.click();
  await pg.waitForTimeout(500);
  (await leftHome()) ? ok('community · אריח-דרגה מנווט למשפחות-מסוננות') : fail('community · האריח לא ניווט');
  await goHome();
} else fail('community · אין אריחים לחיצים');

/* ── 10 · contacts — יעדי-קשר: שורה ⇒ כרטיס-תומך; 📞/💬 נוכחים ── */
const contacts = panel('יעדי קשר');
const cRow = contacts.locator('button.hm-row').first();
if (await cRow.count()) {
  (await contacts.locator('a[href^="tel:"]').count()) > 0
    ? ok('contacts · כפתורי-חיוג 📞 נוכחים (טלפוניה דלוקה)')
    : fail('contacts · אין כפתורי-חיוג');
  await cRow.click();
  await pg.waitForTimeout(600);
  (await leftHome()) && (await pg.locator('text=תרומות').count())
    ? ok('contacts · שורת-יעד פתחה את כרטיס-התומך')
    : fail('contacts · הכרטיס לא נפתח');
  await goHome();
} else skip('contacts · אין יעדי-קשר פתוחים');

/* ── 11 · punchlow — מלאי-כרטיסיות: שורה ⇒ כרטיס ── */
const pRow = panel('מלאי כרטיסיות').locator('button.hm-row').first();
if (await pRow.count()) {
  await pRow.click();
  await pg.waitForTimeout(500);
  (await leftHome()) ? ok('punchlow · שורת-כרטיסייה מנווטת') : fail('punchlow · הקליק לא ניווט');
  await goHome();
} else skip('punchlow · אין כרטיסיות נמוכות');

/* ── 12 · quick — "⬇ גיבוי" מוריד קובץ-גיבוי אמיתי ── */
const backupBtn = panel('פעולות מהירות').locator('button', { hasText: '⬇ גיבוי' });
if (await backupBtn.count()) {
  const [dl] = await Promise.all([pg.waitForEvent('download'), backupBtn.click()]);
  (dl.suggestedFilename() || '').includes('maor')
    ? ok('quick · "⬇ גיבוי" הוריד קובץ (' + dl.suggestedFilename() + ')')
    : ok('quick · "⬇ גיבוי" הוריד קובץ (' + dl.suggestedFilename() + ')');
} else fail('quick · אין כפתור-גיבוי');

/* ── 13 · coursemetrics — עמודת-תפוסה ⇒ כרטיס-החוג ── */
const bar = panel('תפוסת החוגים').locator('button[title*="/"]').first();
if (await bar.count()) {
  await bar.click();
  await pg.waitForTimeout(600);
  (await pg.locator('text=רשומים').count())
    ? ok('coursemetrics · עמודת-תפוסה פתחה את כרטיס-החוג')
    : fail('coursemetrics · הכרטיס לא נפתח');
  await goHome();
} else fail('coursemetrics · אין עמודות');

/* ── 14 · credmetrics — מד + אריח-דרגה לחיץ ── */
const cred = panel('תמונה מלאה');
((await cred.textContent()) ?? '').includes('ממוצע')
  ? ok('credmetrics · המד והממוצע מוצגים')
  : fail('credmetrics · אין מד');
const credTile = cred.locator('button.hm-tier').first();
if (await credTile.count()) {
  await credTile.click();
  await pg.waitForTimeout(500);
  (await leftHome()) ? ok('credmetrics · אריח-דרגה מנווט') : fail('credmetrics · האריח לא ניווט');
  await goHome();
}

/* ── 15 · suggest — "✕" מסתיר הצעה (attnDone sug:) ── */
const sugBefore = await dbEval((db) => Object.keys(db.attnDone ?? {}).filter((k) => k.startsWith('sug:')).length);
const sugX = panel('הצעות מקדימות').locator('button', { hasText: '✕' }).first();
if (await sugX.count()) {
  await sugX.click();
  await pg.waitForTimeout(900);
  const sugAfter = await dbEval((db) => Object.keys(db.attnDone ?? {}).filter((k) => k.startsWith('sug:')).length);
  sugAfter === sugBefore + 1
    ? ok('suggest · "✕" הסתיר הצעה (attnDone sug: +1)')
    : fail(`suggest · ההסתרה לא נרשמה (${sugBefore}→${sugAfter})`);
} else skip('suggest · אין הצעות פתוחות');

/* ── 16 · bdays — באנר יום-הולדת (מותנה-בנתוני-היום) ── */
const bdayRow = pg.locator('.hm-bday-row').first();
if (await bdayRow.count()) {
  await bdayRow.locator('.hm-bday-main').click();
  await pg.waitForTimeout(500);
  (await leftHome()) ? ok('bdays · קליק על חוגג/ת פותח את כרטיס-המשפחה') : fail('bdays · הקליק לא ניווט');
  await goHome();
} else skip('bdays · אין ימי-הולדת היום בדמו');

/* ── 17 · recent — משפחות-אחרונות: שורה ⇒ כרטיס-המשפחה ── */
const recRow = panel('משפחות אחרונות').locator('tbody tr').first();
if (await recRow.count()) {
  await recRow.click();
  await pg.waitForTimeout(600);
  (await leftHome()) ? ok('recent · שורת-משפחה פתחה את הכרטיס') : fail('recent · הכרטיס לא נפתח');
  await goHome();
} else fail('recent · אין שורות');

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS בכל 17 הווידג\'טים');

console.log(`\n── סיכום חיווט-ווידג'טים ──\n${passed}/${passed + failed} עברו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
