/**
 * סמוק-חייגן (20.8) — הזרימה המלאה של החייגן-המונחה המשודרג על נתוני-הדמו:
 * קמפיין (חסרי-טלפון מושמטים) ⇒ 💰 תרם/ה פותח את מודאל-התרומה ⇒ שמירה ⇒
 * הקמפיין מתקדם והתרומה בכרטיס ⇒ ↩ ביטול-אחרון מחזיר ⇒ ⬇ CSV ⇒ אפס שגיאות JS.
 * דורש build קודם (npm run build). מוסכמות serve/chrome — כמו demo-link.mjs.
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
await new Promise((r) => server.listen(8232, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage();
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };
const dbEval = (fn) => pg.evaluate((src) => { const db = JSON.parse(localStorage.getItem('maor_db') || '{}'); return new Function('db', 'return (' + src + ')(db)')(db); }, fn.toString());

await pg.addInitScript(() => {
  // telephony (עיר-עוגן) ⇒ הכפתור "📞 חייגן" מוצג; בלי firebase ⇒ אין מסך-התחברות
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, telephony: { enabled: true, city: 'jerusalem' }, integrations: { payments: { enabled: true, payUrl: 'https://pay.example.org/donate' }, whatsapp: { enabled: true } } }));
});
await pg.goto('http://localhost:8232/');
await pg.waitForSelector('main', { timeout: 20000 });

/* ── זריעה: נתוני-הדמו (כמו launch-readiness מסע 3) ── */
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
// שער-היום (DayGate) נפתח על מסד ראשון — פותחים יום-עבודה
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
const seed = await dbEval((db) => ({
  sup: db.supporters?.length ?? 0,
  withPhone: db.supporters?.filter((s) => (s.phone || '').trim()).length ?? 0,
}));
seed.sup > 0 ? ok(`דמו נטען — ${seed.sup} תומכים (${seed.withPhone} עם טלפון)`) : fail('הדמו לא נטען');

/* ── קמפיין — חסרי-טלפון מושמטים ── */
await pg.locator('button', { hasText: 'תורמים' }).first().click();
await pg.waitForTimeout(500);
await pg.locator('button', { hasText: 'חייגן' }).first().click();
await pg.waitForTimeout(600);
(await pg.locator('text=📞 חייגן').count()) ? ok('מודאל-החייגן נפתח') : fail('מודאל-החייגן לא נפתח');
const q0 = await dbEval((db) => db.ui?.dialer?.queue?.length ?? -1);
q0 === seed.withPhone
  ? ok(`התור = בעלי-טלפון בלבד (${q0})`)
  : fail(`התור לא סונן: ${q0} מול ${seed.withPhone} עם-טלפון`);
const firstId = await dbEval((db) => db.ui?.dialer?.queue?.[0] ?? '');

/* ── 💰 תרם/ה ⇒ מודאל-התרומה ⇒ שמירה ⇒ התקדמות + רישום-בכרטיס ── */
const hadDon = await dbEval((db) => db.supporters.find((s) => s.id === (db.ui?.dialer?.queue?.[0] ?? ''))?.donations.length ?? -1);
await pg.locator('button', { hasText: '💰 תרם/ה' }).click();
await pg.waitForTimeout(500);
const amount = pg.getByLabel(/סכום/).first();
if (await amount.count()) {
  ok('מודאל-התרומה נפתח מ"תרם/ה"');
  await amount.fill('180');
  await pg.locator('button', { hasText: 'רישום' }).first().click();
  await pg.waitForTimeout(900);
} else fail('מודאל-התרומה לא נפתח');
const after = await dbEval((db) => ({ q: db.ui?.dialer?.queue?.length ?? -1 }));
const donNow = await pg.evaluate((id) => JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id)?.donations.length ?? -1, firstId);
donNow === hadDon + 1 ? ok('התרומה נרשמה בכרטיס (D- רציף)') : fail(`התרומה לא נרשמה (${hadDon}→${donNow})`);
after.q === q0 - 1 ? ok('הקמפיין התקדם (המתקשר נסגר)') : fail(`התור לא התקדם: ${q0}→${after.q}`);
const outcome0 = await dbEval((db) => db.ui?.dialer?.log?.[0]?.outcome ?? '');
outcome0 === 'donated' ? ok('היומן רשם "תרם/ה"') : fail('היומן לא רשם donated: ' + outcome0);

/* ── ↩ ביטול-אחרון ⇒ המתקשר חוזר לחזית ── */
await pg.locator('button', { hasText: '↩ ביטול אחרון' }).click();
await pg.waitForTimeout(900); // התמדת localStorage ב-debounce 500ms
const undone = await dbEval((db) => ({ q: db.ui?.dialer?.queue?.length ?? -1, head: db.ui?.dialer?.queue?.[0] ?? '' }));
undone.q === q0 && undone.head === firstId ? ok('↩ ביטול-אחרון החזיר לחזית-התור') : fail('ביטול-אחרון לא החזיר');
(await pg.locator('button', { hasText: 'CSV' }).count()) === 0
  ? ok('אין כפתור-CSV כשאין יומן (אחרי הביטול)')
  : fail('כפתור-CSV מוצג בלי יומן');

/* ── סבב ב׳: שמות-לטיפול · קידום-שלב · עריכת-פרטים · קישור-תשלום ── */
await pg.locator('button', { hasText: '🕯' }).first().click();
await pg.waitForTimeout(300);
const nameInput = pg.locator('input[placeholder="שם לטיפול…"]').first();
await nameInput.fill('רפאל בן שרה');
await pg.locator('input[inputmode="numeric"]').first().fill('3');
await pg.locator('input[placeholder="הערה חופשית…"]').fill('לרפואה שלמה');
await pg.getByRole('button', { name: '➕', exact: true }).click(); // ה-➕ של פאנל-השמות (לא '➕ הוספת' שברקע)
await pg.waitForTimeout(900); // התמדת localStorage
const care = await pg.evaluate((id) => {
  const sp = JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id);
  const last = sp?.ayin?.names?.at(-1);
  return { n: sp?.ayin?.names?.length ?? 0, name: last?.name ?? '', eyes: last?.eyes ?? '', note: last?.note ?? '' };
}, firstId);
care.name === 'רפאל בן שרה' && care.eyes === 3
  ? ok('🕯 שם-לטיפול נרשם תוך-שיחה (שם+כמות)')
  : fail('שם-לטיפול לא נרשם: ' + JSON.stringify(care));
care.note === 'לרפואה שלמה'
  ? ok('📝 ההערה-החופשית נשמרה על השם')
  : fail('ההערה לא נשמרה: ' + JSON.stringify(care));
// עריכת ההערה בשורה הקיימת (חיווט ayinSetNameNote)
await pg.locator('input[placeholder="הערה"]').first().fill('לרפואה שלמה ולהצלחה');
await pg.waitForTimeout(900);
const edited = await pg.evaluate((id) => JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id)?.ayin?.names?.at(-1)?.note ?? '', firstId);
edited === 'לרפואה שלמה ולהצלחה' ? ok('📝 עריכת-הערה בשורה קיימת נשמרת') : fail('עריכת-הערה לא נשמרה: ' + edited);
// קידום-שלב — הכפתור-החכם מופיע ומקדם
const advBtn = pg.locator('button', { hasText: '←' }).last();
if (await advBtn.count()) {
  await advBtn.click();
  await pg.waitForTimeout(900);
  const stg = await pg.evaluate((id) => JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id)?.ayin?.stage ?? '', firstId);
  stg !== 'new' ? ok('שלב-הטיפול קודם (' + stg + ')') : fail('קידום-שלב לא עבד');
} else fail('כפתור קידום-שלב לא נמצא');
// ⬇ 🕯 ייצוא-שמות ממוקד-קמפיין — הקובץ יורד ומכיל את השם שנרשם
const namesBtn = pg.locator('button', { hasText: '⬇ 🕯' }).first();
if (await namesBtn.count()) {
  const [dl] = await Promise.all([pg.waitForEvent('download'), namesBtn.click()]);
  const fname = dl.suggestedFilename();
  const body = readFileSync(await dl.path(), 'utf8');
  fname.startsWith('dialer-names-') ? ok('⬇ 🕯 קובץ-השמות ירד (' + fname + ')') : fail('שם-קובץ שגוי: ' + fname);
  body.includes('רפאל בן שרה') && body.includes('לרפואה שלמה ולהצלחה')
    ? ok('ה-CSV מכיל את השם וההערה של הקמפיין')
    : fail('ה-CSV חסר את השם/ההערה');
} else fail('כפתור ⬇ 🕯 לא מוצג למרות שם-רשום');
// קישור-תשלום — צ'יפ 💳 עם ה-URL של הארגון
const payChip = pg.locator('a', { hasText: '💳' }).first();
if (await payChip.count()) {
  const href = await payChip.getAttribute('href');
  href?.startsWith('https://pay.example.org') ? ok('💳 קישור-תשלום עם ה-URL של הארגון') : fail('href שגוי: ' + href);
} else fail('צ׳יפ קישור-תשלום לא מוצג');
// עריכת-פרטים — SupporterForm מחליף את החייגן וחוזר
await pg.locator('button', { hasText: '✎ עריכת פרטים' }).click();
await pg.waitForTimeout(400);
if (await pg.getByLabel('שם מלא *').count()) {
  ok('✎ עריכת-פרטים פתחה את טופס-התומך');
  await pg.getByRole('textbox', { name: 'עיר' }).fill('ירושלים');
  await pg.locator('button', { hasText: 'שמירה' }).first().click();
  await pg.waitForTimeout(900);
  const city = await pg.evaluate((id) => JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id)?.address ?? JSON.parse(localStorage.getItem('maor_db')).supporters.find((s) => s.id === id)?.city ?? '', firstId);
  (await pg.locator('text=📞 חייגן').count()) ? ok('חזרנו לחייגן אחרי העריכה') : fail('לא חזרנו לחייגן אחרי עריכה');
} else fail('טופס-העריכה לא נפתח');

/* ── 📵 לא-ענה במקלדת (מקש 2) ⇒ requeue ── */
await pg.keyboard.press('2');
await pg.waitForTimeout(900); // התמדת localStorage ב-debounce 500ms
const requeued = await dbEval((db) => ({ q: db.ui?.dialer?.queue?.length ?? -1, last: db.ui?.dialer?.queue?.at(-1) ?? '' }));
requeued.q === q0 && requeued.last === firstId ? ok('⌨️ מקש 2 = לא-ענה — חזר לסוף-התור') : fail('מקש 2 לא עבד');
(await pg.locator('button', { hasText: 'CSV' }).count()) ? ok('⬇ CSV זמין כשיש יומן') : fail('אין CSV עם יומן');

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS בכל הזרימה');

console.log(`\n── סיכום סמוק-חייגן ──\n${passed}/${passed + failed} עברו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
