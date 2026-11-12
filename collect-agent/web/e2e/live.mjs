// דמו מקצה לקצה בדפדפן: שרת גבי אמיתי (DEMO=1, dry-run) + הממשק המעוצב מ-/app/.
// דרישה: npm run build. הרצה: node e2e/live.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertPortFree, makeInject } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8141, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url'); // קוד גישה חד-פעמי לבדיקה (השרת דורש 32+ תווים)
const ROOT = new URL('../..', import.meta.url).pathname;
// שער 6: עובד דמו אמיתי (מייל+סיסמה+סוד TOTP בקובץ זמני) — כמו demo.sh --check, רק דרך הדפדפן
const STAFF = { email: 'dana@example.co.il', password: 'demo-pass-12345', secretFile: join(mkdtempSync(join(tmpdir(), 'gabi-e2e-')), 'totp') };
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', 'warning'],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN,
    DEMO_USER_EMAIL: STAFF.email, DEMO_USER_PASSWORD: STAFF.password, DEMO_USER_SECRET_FILE: STAFF.secretFile }, stdio: 'ignore' });
// קוד ה-TOTP נגזר משעון הדמו הקבוע (app/demo.py DEMO_NOW) ומאותו מימוש בשרת (app/totp.py)
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  STAFF.secretFile], { cwd: ROOT }).toString().trim();
process.on('exit', () => srv.kill());   // גם ביציאה על חריגה שלא נתפסה — לא משאירים שרת על הפורט
const ok = (c, m) => { if (!c) throw new Error(m); };
// כל שגיאה בתוך יירוט נרשמת כאן ומכשילה את הריצה בסוף (e2e/lib.mjs)
const routeErrors = [];
const inject = makeInject(routeErrors);
const H = { Authorization: `Bearer ${TOKEN}` };
const rawFetch = globalThis.fetch;
const fetch = (u, init = {}) => rawFetch(u, { ...init, headers: { ...H, ...init.headers } }); // fetch של הבדיקה = עם טוקן
const api = async p => (await fetch(base + p)).json();
for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); }

// צילום עמוד מלא נאמן: מגדילים את ה-viewport לגובה הדף (אחרת סרגל-צד sticky "צף" בצילום fullPage)
async function fullShot(pg, path) {
  const vp = pg.viewportSize();
  const h = await pg.evaluate(() => document.documentElement.scrollHeight);
  await pg.setViewportSize({ width: vp.width, height: Math.max(h, vp.height) });
  await pg.screenshot({ path });
  await pg.setViewportSize(vp);
}
async function noHScroll(pg, where) {
  const [sw, cw] = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw <= cw, `גלילה רוחבית ב-${where}: ${sw}>${cw}`);
}

// 409 מותר רק כשהבדיקה מצפה לו במפורש (בקשה + סיבה מאומתות). כל 409 אחר / כל שגיאה אחרת ⇒ כישלון.
let expect409 = null;         // { status?, method?, url: RegExp, reason: RegExp } — 409/422 צפוי אחד, מוכרז מראש
let failPhase = false, allowedFail = 0, consoleFail = 0; // הפעלה 141: כשל טעינה מכוון (503 / בקשה שבוטלה) — רק בשלב 12
let gatePhase = true;         // 401 מותר רק בשלב שער קוד הגישה (לפני כניסה), ורק מהשרת שלנו
const allowed401 = [];
const allowed429 = [];        // 429 מותר רק בבדיקת הנעילה של מסך הכניסה (שלב השער)
const allowed409 = [];        // תגובות 409 שאומתו
const errors = [];
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  // הפעלה 111: settings-live מופיע לפני ש-GET /settings חזר. עד אז הטופס מראה ברירת-מחדל, וקליק בחלון הזה
  // נדרס בטעינה ⇒ «שמירה» נשארת מושבתת (נכשל לסירוגין ב-live.mjs, גם לפני). מחכים ל-data-loaded=1.
  const settingsLoaded = () => p.locator('[data-testid="settings-live"][data-loaded="1"]').waitFor();
  await p.setViewportSize({ width: 1366, height: 900 });
  p.on('response', async r => {
    if (r.status() === 429) {
      if (gatePhase && r.url() === base + '/auth/login') allowed429.push(r.url()); else errors.push(`429 לא צפוי: ${r.url()}`);
      return;
    }
    if (r.status() === 401) {
      if (gatePhase && r.url().startsWith(base + '/')) allowed401.push(r.url()); else errors.push(`401 לא צפוי: ${r.url()}`);
      return;
    }
    if (failPhase && r.status() === 503 && r.url() === base + '/dashboard') { allowedFail++; return; }
    if (r.status() !== 409 && r.status() !== 422) { if (r.status() >= 400 && r.url().startsWith(base)) errors.push(`${r.status()} לא צפוי: ${r.url()}`); return; }
    const u = r.url(); let body = '';
    try { body = JSON.stringify(await r.json()); } catch { /* */ }
    const e = expect409;
    if (e && (e.status ?? 409) === r.status() && e.url.test(u) && r.request().method() === (e.method ?? 'POST') && e.reason.test(body)) { allowed409.push(`${r.status()} ${u}`); expect409 = null; }
    else errors.push(`${r.status()} לא צפוי: ${r.request().method()} ${u} ${body}`);
  });
  let console409 = 0, console401 = 0, console429 = 0;
  p.on('console', m => {
    if (m.type() !== 'error') return;
    if (/status of (409|422)/.test(m.text())) { console409++; return; } // מוצלב מול allowed409 בסוף
    if (/status of 401/.test(m.text())) { console401++; return; } // מוצלב מול allowed401 בסוף
    if (/status of 429/.test(m.text())) { console429++; return; } // מוצלב מול allowed429 בסוף
    if (failPhase && /status of 503|ERR_FAILED/.test(m.text())) { consoleFail++; return; }
    errors.push(m.text());
  });
  p.on('pageerror', e => errors.push(String(e)));

  // 1) שער קוד גישה (TokenGate): בלי קוד ⇒ שער, לא נפילה שקטה למוק; קוד שגוי נדחה; הקישור מ-demo.sh (#…?token=) נכנס ונמחק מהכתובת
  await p.goto(base + '/app/#/dashboard');
  await p.getByTestId('staff-login').waitFor(); // כניסת עובד היא ברירת המחדל; קוד משותף מאחורי «יש לי קוד גישה»
  ok(await p.getByTestId('mode').count() === 0, 'שרת נעול ⇒ מסך כניסה מלא, לא השלד עם נתונים');
  for (let i = 0; i < 40 && !existsSync(STAFF.secretFile); i++) await new Promise(r => setTimeout(r, 100));
  const loginForm = p.getByTestId('staff-login');
  const tryLogin = async (email, pw, code) => {
    await p.getByLabel('מייל').fill(email);
    await p.getByLabel('סיסמה', { exact: true }).fill(pw);
    await p.getByLabel('קוד אימות').fill(code);
    // מחכים לתשובת השרת (בזמן הבקשה הכפתור כבוי ⇒ לחיצה נוספת הייתה נבלעת)
    await Promise.all([p.waitForResponse(r => r.url() === base + '/auth/login'), loginForm.getByRole('button', { name: 'כניסה' }).click()]);
  };
  // 1א) סיסמה שגויה (עם קוד נכון) ⇒ הודעה כללית שלא מגלה מה שגוי
  await tryLogin(STAFF.email, 'wrong-password-1', totpCode());
  await p.getByTestId('login-error').filter({ hasText: 'הסיסמה או קוד האימות שגויים' }).waitFor();
  // 1ב) קוד שגוי (סיסמה נכונה) ⇒ אותה הודעה; השדה נוקה (קוד חד-פעמי)
  await tryLogin(STAFF.email, STAFF.password, '000000');
  await p.getByTestId('login-error').filter({ hasText: 'הסיסמה או קוד האימות שגויים' }).waitFor();
  ok(await p.getByLabel('קוד אימות').inputValue() === '', 'הקוד לא נוקה אחרי כשל');
  if (out) await p.screenshot({ path: `${out}/web-login-desktop.png` });
  // 1ג) מייל+סיסמה+קוד נכונים ⇒ חי, שם העובד מוצג, הכתובת המבוקשת נשמרה, אין טוקן בכתובת
  await tryLogin(STAFF.email, STAFF.password, totpCode());
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  ok((await p.getByTestId('whoami').textContent()).includes('עובד דמו'), 'שם העובד המחובר לא מוצג');
  ok(p.url().endsWith('#/dashboard') && !/token/.test(p.url()), 'כתובת אחרי כניסה: ' + p.url());
  const staffTok = await p.evaluate(() => sessionStorage.getItem('gabi_owner_token'));
  ok(staffTok && staffTok !== TOKEN, 'סשן העובד לא נשמר בלשונית');
  ok(await p.evaluate(() => localStorage.length) === 0, 'משהו נשמר ב-localStorage');
  const audit0 = await api('/audit');
  ok(audit0.some(a => a.action === 'login' && /^user:\d+$/.test(a.actor)), 'הכניסה לא נרשמה ב-audit על שם העובד');
  ok((await api('/access-log')).some(a => /^user:\d+$/.test(a.actor)), 'יומן הצפייה לא רשם את העובד');
  // 1ד) יציאה ⇒ מסך הכניסה, הסשן בוטל גם בשרת, נמחק מהלשונית
  await p.getByTestId('logout').click();
  await p.getByTestId('staff-login').waitFor();
  ok(await p.evaluate(() => sessionStorage.getItem('gabi_owner_token')) === null, 'הסשן נשאר בלשונית אחרי יציאה');
  ok((await rawFetch(base + '/auth/me', { headers: { Authorization: `Bearer ${staffTok}` } })).status === 401, 'הסשן תקף בשרת אחרי יציאה');
  ok((await api('/audit')).some(a => a.action === 'logout' && /^user:\d+$/.test(a.actor)), 'היציאה לא נרשמה ב-audit');
  // 1ה) נעילה: 5 כשלונות לאותו מייל מאותו IP ⇒ 429 «ננעלה זמנית» (גם למייל שאינו קיים — לא מגלה קיום חשבון)
  for (let i = 0; i < 5; i++) await tryLogin('ghost@example.co.il', 'wrong-password-1', '123456');
  await p.getByTestId('login-error').filter({ hasText: 'ננעלה זמנית' }).waitFor();
  ok(allowed429.length === 1, `ציפיתי ל-429 אחד, היו ${allowed429.length}`);
  console.log('  ✓ מסך כניסה: סיסמה/קוד שגויים, כניסה כעובד (audit+יומן צפייה), יציאה מבטלת בשרת, נעילה 429');
  await p.getByText('יש לי קוד גישה משותף').click();
  await p.getByLabel('קוד גישה').fill('x'.repeat(40));
  await p.getByTestId('token-gate').getByRole('button', { name: 'כניסה' }).click();
  await p.getByText('הקוד לא התקבל').waitFor();
  await p.goto(base + `/app/#/dashboard?token=${TOKEN}`);
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  ok(!p.url().includes('token='), 'הטוקן נשאר בשורת הכתובת');
  gatePhase = false;
  ok(allowed401.length >= 1, 'קוד שגוי לא הגיע לשרת כ-401');
  console.log(`  ✓ שער קוד גישה (401 צפויים בשלב השער: ${allowed401.length})`);

  const outbox0 = (await api('/outbox')).messages.length;
  const items = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) });
  ok(await items.count() === 3, `ציפיתי ל-3 בתור (יוסי, בלי פרטים, גל — סכום חריג), יש ${await items.count()}`);
  ok(await p.getByText('אין נייד או מייל תקין').count() >= 1, 'החסימה no_contact לא מוצגת');
  // הפעלה 135: תזכורת מאוחדת בתור = «3 חשבוניות · סה״כ», חשבונית יחידה בלי שינוי
  const galRow = await items.filter({ hasText: 'גל שרון' }).getByTestId('queue-merged').textContent();
  ok(/^3 חשבוניות · .*₪/.test(galRow.trim()), `שורת התור של גל: ${galRow}`);
  ok(await items.filter({ hasText: 'יוסי' }).getByTestId('queue-merged').count() === 0, 'חשבונית יחידה סומנה כמאוחדת');
  // v2: 8 KPI + גרף גבייה
  ok(await p.getByTestId('kpis').locator(':scope > *').count() === 8, 'ציפיתי ל-8 KPI');
  await p.getByTestId('collection-chart').waitFor();
  ok((await p.getByTestId('kpis').textContent()).includes('שיעור החזר'), 'חסר KPI שיעור החזר');
  await noHScroll(p, 'דשבורד דסקטופ');
  if (out) await fullShot(p, `${out}/live-01-dashboard.png`);

  // 2) חסום ⇒ אי אפשר לאשר
  await items.filter({ hasText: 'בלי פרטים' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.getByText('⛔ חסום').waitFor();
  ok(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled(), 'תזכורת חסומה ניתנת לאישור');
  await p.getByRole('button', { name: 'ביטול' }).click();

  // 2ב) הפעלה 125: סכום חריג בדמו (גל שרון, 2,490 במקום 24.90) ⇒ אישור רק אחרי «הסכום נכון — בדקתי»
  await items.filter({ hasText: 'גל שרון' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  const confirmAmt = p.getByTestId('confirm-amount');
  await confirmAmt.waitFor();
  // הפעלה 135: התזכורת של גל כוללת 3 חשבוניות ⇒ הכותרת מציגה את כולן ואת הסה״כ שב-SMS, לא את חשבונית העוגן
  const galPv = await api(`/reminders/${(await api('/reminders?status=pending_approval&view=summary')).find(r => r.invoice_count === 3).id}/preview`);
  const mpSub = await p.getByTestId('mp-sub').textContent();
  ok(mpSub.includes('3 חשבוניות') && galPv.numbers.every(n => mpSub.includes(n)) && mpSub.includes(galPv.total_text),
    `כותרת התצוגה המקדימה לא מציגה תזכורת מאוחדת: ${mpSub}`);
  ok(galPv.messages.find(m => m.channel === 'sms').body.includes(galPv.total_text), 'הסה״כ בכותרת שונה מהסה״כ ב-SMS');
  ok(/2009/.test(await confirmAmt.textContent()) && /2,490/.test(await confirmAmt.textContent()), 'תיבת הסכום החריג בלי החשבונית/הסכום');
  ok(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled(), 'סכום חריג ניתן לאישור בלי סימון');
  await confirmAmt.locator('input').check();
  ok(!(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled()), 'הסימון «הסכום נכון» לא שחרר את האישור');
  if (out) await p.screenshot({ path: `${out}/live-02b-amount-check.png` });
  await p.getByRole('button', { name: 'ביטול' }).click();   // נשארת ממתינה (לא שולחים בהדגמה)
  console.log('  ✓ סכום חריג: אישור נעול עד «הסכום נכון — בדקתי»');

  // 3א) critic סבב 56: האישור קשור לנוסח שהוצג (seen_hash). מדמים תצוגה מקדימה ישנה (התזכורת נבנתה מחדש
  //     בסכום אחר מאז שנפתחה) ⇒ השרת מסרב, ושום דבר לא יוצא.
  //     הפעלה 149: הממשק לא מציג «לא אושר… פתחו שוב». הוא טוען את התצוגה מחדש, מציג מה השתנה, ומנקה את האישור.
  let previews = 0, realTotal = null;
  await p.route('**/reminders/*/preview', async route => {
    const res = await route.fetch(); const j = await res.json(); realTotal = j.total_text;
    if (previews++ === 0) { j.body_hash = 'stale-' + j.body_hash; j.total_text = '1 ₪'; }   // רק הפתיחה הראשונה ישנה
    await route.fulfill({ response: res, json: j });
  });
  const seenSent = [];
  p.on('request', r => { if (/\/reminders\/\d+\/approve$/.test(r.url())) seenSent.push(JSON.parse(r.postData() || '{}').seen_hash ?? null); });
  const outboxS = (await api('/outbox')).messages.length;
  await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(await p.getByTestId('mp-stale').count() === 0, 'הסבר «הנוסח השתנה» מוצג לפני שקרה משהו');
  expect409 = { url: /\/reminders\/\d+\/approve$/, reason: /השתנו מאז שפתחתם/ };
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  const staleBox = p.getByTestId('mp-stale');
  await staleBox.waitFor();
  ok(expect409 === null, 'הסירוב לא הגיע כ-409 המצופה');
  ok(seenSent.length === 1 && typeof seenSent[0] === 'string' && seenSent[0].startsWith('stale-'), 'הממשק לא שלח seen_hash באישור: ' + seenSent);
  ok((await api('/outbox')).messages.length === outboxS, 'יצאה הודעה למרות נוסח שלא נראה');
  const staleTxt = await staleBox.textContent();
  ok(staleTxt.includes(`הסכום השתנה מ-1 ₪ ל-${realTotal}.`) && staleTxt.includes('שום דבר לא נשלח'), 'ההסבר לא מציג לפני/אחרי: ' + staleTxt);
  ok(await staleBox.getAttribute('role') === 'alert', 'ההסבר לא מוכרז לקורא מסך');
  ok(previews >= 2, 'התצוגה המקדימה לא נטענה מחדש אחרי הסירוב');
  ok((await p.getByTestId('mp-sub').textContent()).includes(realTotal), 'הכותרת לא מציגה את הסכום המעודכן: ' + await p.getByTestId('mp-sub').textContent());
  ok(await p.getByText(/לא אושר/).count() === 0, 'הוצג «לא אושר» למרות שהתצוגה נטענה מחדש');
  ok(await p.getByRole('dialog').count() === 1 && await p.getByRole('button', { name: /אשר ושלח/ }).isEnabled(), 'אחרי הטעינה מחדש אי אפשר לאשר');
  ok(await staleBox.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'ההסבר מחוץ למסך');
  if (out) await p.screenshot({ path: `${out}/live-02c-stale-preview.png` });
  await p.unroute('**/reminders/*/preview');
  await p.getByRole('button', { name: 'ביטול' }).click();
  ok((await api('/outbox')).messages.length === outboxS, 'יצאה הודעה אחרי הטעינה מחדש בלי אישור');
  console.log('  ✓ אישור מתצוגה ישנה ⇒ התצוגה נטענה מחדש עם «הסכום השתנה מ-… ל-…», לא יצא דבר (seen_hash)');
  // 3) יוסי ⇒ התצוגה המקדימה = הנוסח מהשרת (קישור קצר /p/, ≤2 חלקים); מייל עם קישור מלא
  await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  const body = await p.locator('textarea').inputValue();
  ok(body.startsWith('סטודיו דמו:') && /\/p\/\w{5,}/.test(body), 'נוסח ה-SMS לא מהשרת: ' + body); // בדמו: base מקומי; ברירת המחדל בשרת = https://gabi.example
  ok(/\b[12] מקטעי SMS/.test(await p.locator('text=מקטעי SMS').first().textContent()), 'SMS ארוך מ-2 חלקים');
  if (out) await p.screenshot({ path: `${out}/live-02-preview-sms.png` });
  await p.getByRole('tab', { name: /מייל/ }).click();
  await p.getByText('yossi@example.com').first().waitFor();
  ok(await p.getByText(/pay\.example\/gabi-demo/).count() > 0, 'במייל חסר קישור התשלום המלא');
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  const outbox1 = (await api('/outbox')).messages.length;
  ok(outbox1 === outbox0 + 2, `ביומן היוצאים ציפיתי ל-+2 (SMS+מייל), קיבלתי ${outbox0}→${outbox1}`);
  await p.waitForFunction(() => [...document.querySelectorAll('button')].filter(x => x.textContent === 'תצוגה ואישור').length === 2);
  console.log('  ✓ תצוגה מקדימה ⇒ אישור ⇒ יומן +2');

  // 4) דורש טיפול: דנה מושהית ("שילמתי") ⇒ חידוש בלחיצה כפולה ⇒ מאומת בשרת
  const needs = p.getByTestId('needs-you');
  const dana = needs.locator('li', { hasText: 'דנה לוי' });
  await dana.waitFor();
  await dana.getByRole('button').click();
  await needs.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
  await p.getByText('התזכורות לדנה לוי (דמו) חודשו').waitFor();
  ok((await api('/dashboard')).invoices.find(r => r.customer.startsWith('דנה')).paused_reason === null, 'השרת לא חידש את דנה');
  console.log('  ✓ חידוש לקוח מושהה');

  // 5) בקשת פריסה ⇒ הצעה ⇒ אישור ⇒ נשלחת, וטיוטת plan_request המקבילה נסגרת אטומית בשרת
  await p.getByLabel('לקוח').selectOption({ label: 'יוסי כהן (דמו)' });
  await p.getByRole('button', { name: 'אפשר ב-3 תשלומים?' }).click();
  await p.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
  const plan = needs.locator('li', { hasText: 'הצעת פריסה' });
  await plan.waitFor();
  const planDraftsBefore = (await api('/conversation/drafts')).filter(d => d.intent === 'plan_request' && d.customer.startsWith('יוסי'));
  ok(planDraftsBefore.length === 1, `ציפיתי לטיוטת plan_request אחת פתוחה, יש ${planDraftsBefore.length}`);
  const ob2 = (await api('/outbox')).messages.length;
  await plan.getByRole('button', { name: /אישור ההצעה/ }).click();
  await plan.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
  await p.getByText('ההצעה אושרה').waitFor();
  ok((await api('/plans')).some(x => x.status === 'approved'), 'ההצעה לא אושרה בשרת');
  ok((await api('/outbox')).messages.length === ob2 + 1, 'הצעת הפריסה לא נשלחה ללקוח');
  const stillOpen = (await api('/conversation/drafts')).filter(d => d.id === planDraftsBefore[0].id);
  ok(stillOpen.length === 0, 'טיוטת plan_request נשארה פתוחה אחרי אישור הפריסה ⇒ סכנת שליחה כפולה');
  if (out) await fullShot(p, `${out}/live-04-after.png`);
  console.log('  ✓ פריסה אושרה ⇒ נשלחה ⇒ הטיוטה המקבילה נסגרה בשרת');

  // 6) תשובות לקוחות: דנה שואלת איך משלמים ⇒ טיוטה ⇒ עריכה עם "מבצע" נחסמת (409 צפוי ומאומת) ⇒ נוסח נקי נשלח
  await p.getByLabel('לקוח').selectOption({ label: 'דנה לוי (דמו)' });
  await p.getByRole('button', { name: 'איך אפשר לשלם?' }).click();
  await p.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
  await p.getByTestId('reply-result').waitFor();
  await p.goto(base + '/app/#/inbox');
  const card = p.getByTestId('drafts').locator('li', { hasText: 'דנה' }).first();
  await card.waitFor();
  const box = card.locator('textarea');
  const original = await box.inputValue();
  ok(original.trim().length > 0, 'טיוטה ריקה');
  await box.fill('יש לנו מבצע מיוחד החודש! ' + original);
  const a409 = allowed409.length;
  expect409 = { url: /\/conversation\/drafts\/\d+\/approve$/, reason: /marketing/ };
  await card.getByRole('button', { name: 'אשר ושלח' }).click();
  await card.getByRole('alert').waitFor();
  ok(/תוכן שיווקי/.test(await card.getByRole('alert').textContent()), 'הסבר דחיית המסנן לא תורגם לבעל העסק');
  ok(allowed409.length === a409 + 1 && expect409 === null, 'הדחייה לא הגיעה כ-409 המצופה (בקשה+סיבה)');
  await noHScroll(p, 'תיבת תשובות דסקטופ');
  if (out) await fullShot(p, `${out}/live-06-inbox.png`);
  const ob4 = (await api('/outbox')).messages.length;
  await box.fill(original);
  await card.getByRole('button', { name: 'אשר ושלח' }).click();
  await p.getByText('המענה אושר ונשלח').waitFor();
  ok((await api('/outbox')).messages.length === ob4 + 1, 'המענה לא יצא ליומן');
  console.log('  ✓ תשובות לקוחות: שיווק נחסם (409 מאומת), נוסח נקי נשלח');

  // 7) הגדרות חיות מול /settings: שמירה אמיתית בשרת, דחיית שרת (422 צפוי) מוצגת בעברית, ייבוא CSV עם שגיאת שורה
  await p.goto(base + '/app/#/settings');
  await settingsLoaded();
  const before = await api('/settings');
  await p.getByLabel('שם לחתימה').waitFor();
  ok(await p.getByLabel('שם השולח ב-SMS').inputValue() === before.sms.sender, 'הטופס לא נטען מהשרת');
  ok(await p.getByTestId('settings-save').isDisabled(), 'שמירה זמינה בלי שינוי');
  // ולידציה בצד הלקוח: רווח בשם שולח ⇒ אין שליחה
  await p.getByLabel('שם השולח ב-SMS').fill('Studio Demo');
  ok(await p.getByTestId('settings-save').isDisabled(), 'שם שולח עם רווח לא נחסם לפני שליחה');
  await p.getByLabel('שם השולח ב-SMS').fill(before.sms.sender);
  // דומיין זר לקישור התשלום ⇒ השרת דוחה (422 צפוי ומאומת)
  await p.getByLabel('כתובת עמוד התשלום').fill('https://evil.example/pay');
  expect409 = { status: 422, method: 'PUT', url: /\/settings$/, reason: /קישור התשלום/ };
  await p.getByTestId('settings-save').click();
  await p.getByTestId('settings-error').waitFor();
  ok(/קישור התשלום/.test(await p.getByTestId('settings-error').textContent()) && expect409 === null, 'דחיית השרת לא הוצגה / לא אומתה');
  ok((await api('/settings')).pay.page_url === before.pay.page_url, 'השרת שמר קישור שנדחה');
  // שמירה תקינה: שם לחתימה + ע.מ. ⇒ נשמר בשרת
  await p.getByRole('button', { name: 'ביטול שינויים' }).click();
  await p.getByLabel('שם לחתימה').fill('נועה');
  await p.getByLabel('ע.מ. / ח.פ.').fill('123456782');
  await p.getByTestId('settings-save').click();
  await p.getByText('✓ נשמר בשרת').waitFor();
  const after = await api('/settings');
  ok(after.owner_name === 'נועה' && after.vat_id === '123456782', 'השמירה לא הגיעה לשרת: ' + JSON.stringify(after));
  ok(after.sms.sender === before.sms.sender && after.pay.page_url === before.pay.page_url, 'נשלחו שדות שלא שונו');
  // CSV: שורה תקינה + שורה שגויה
  const csvBody = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n9001,לקוח CSV (דמו),050-0000123,500,2026-10-01\n9002,,abc,xx,\n';
  await p.getByLabel('קובץ CSV').setInputFiles({ name: 'open.csv', mimeType: 'text/csv', buffer: Buffer.from(csvBody, 'utf8') });
  await p.getByTestId('csv-result').waitFor();
  const csvText = await p.getByTestId('csv-result').textContent();
  ok(/יובאו 1/.test(csvText) && /שורה 3/.test(csvText), 'תוצאת ה-CSV: ' + csvText);
  ok((await api('/dashboard')).invoices.some(r => r.number === '9001'), 'חשבונית ה-CSV לא נקלטה בשרת');
  await noHScroll(p, 'הגדרות דסקטופ');
  if (out) await fullShot(p, `${out}/live-07-settings.png`);
  console.log('  ✓ הגדרות חיות: שמירה בשרת, 422 מאומת, CSV עם שגיאת שורה');

  // 7ב) תזכורת לחשבונית CSV: אי אפשר לאשר בלי «הסכום עדיין פתוח"; עם הסימון — השרת מקבל confirm_open
  ok((await (await fetch(base + '/plan', { method: 'POST' })).json()).created.length >= 1, 'לא נוצרה תזכורת לחשבונית ה-CSV');
  await p.goto(base + '/app/#/dashboard');
  const csvItem = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) }).filter({ hasText: 'לקוח CSV' });
  await csvItem.waitFor();
  await csvItem.getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.getByTestId('confirm-open').waitFor();
  const approveBtn = p.getByRole('button', { name: /אשר ושלח/ });
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok(await approveBtn.isDisabled(), 'אישור CSV אפשרי בלי סימון «הסכום עדיין פתוח»');
  await p.getByTestId('confirm-open').locator('input').check();
  ok(!(await approveBtn.isDisabled()), 'הסימון לא שחרר את האישור');
  await approveBtn.click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  const auditRows = await api('/audit');
  ok(auditRows.some(a => a.action === 'approve' && /"confirm_open": true/.test(a.detail ?? '')), 'השרת לא קיבל confirm_open');
  console.log('  ✓ חשבונית CSV: אישור רק עם «הסכום עדיין פתוח» (confirm_open מאומת ב-audit)');
  // 7ג) אזהרת «CSV לא הופיעה בייבוא האחרון». בדמו השעון קפוא ⇒ השרת לא יכול לחשב פער בין ייבואים,
  //     ולכן זו בדיקת ממשק: מזריקים csv_unverified=1 לתשובת /dashboard האמיתית. (הלוגיקה בשרת נבדקת ב-pytest:
  //     test_dashboard_counts_csv_invoices_missing_from_last_import.)
  ok(!(await p.getByTestId('csv-unverified').count()), 'אזהרת CSV מוצגת לפני שיש סיבה');
  await inject(p, '**/dashboard', async route => {
    const res = await route.fetch(); const j = await res.json();
    j.totals.csv_unverified = 1;
    await route.fulfill({ response: res, json: j });
  });
  await p.goto(base + '/app/#/invoices'); await p.goto(base + '/app/#/dashboard');
  await p.getByTestId('csv-unverified').waitFor();
  ok((await p.getByTestId('csv-unverified').textContent()).includes('1 חשבונית'), 'נוסח האזהרה');
  await noHScroll(p, 'דשבורד עם אזהרת CSV');
  await p.unroute('**/dashboard');
  console.log('  ✓ אזהרת «CSV לא הופיעה בייבוא האחרון» (ממשק)');
  // 7ד) critic סבב 51: block_reason=csv_stale (השרת מחזיר לאישור אחרי 24 ש׳) הוצג «⛔ חסום: csv_stale» עם
  //     כפתור מושבת ⇒ תקוע. מזריקים לתשובת /reminders האמיתית ובודקים תווית «לאשר מחדש» ולא קוד גולמי.
  await inject(p, '**/reminders?status=pending_approval*', async route => {
    const res = await route.fetch(); const j = await res.json();
    if (j[0]) j[0].block_reason = 'csv_stale';
    await route.fulfill({ response: res, json: j });
  });
  await p.goto(base + '/app/#/invoices'); await p.goto(base + '/app/#/dashboard');
  await p.getByText(/עברו יותר מ-24 שעות/).first().waitFor();
  ok(!(await p.getByText('csv_stale').count()), 'קוד גולמי csv_stale בממשק');
  ok(!(await p.getByText(/⛔.*csv_stale/).count()), 'csv_stale מסווג כחסימה קשה');
  if (out) await fullShot(p, `${out}/live-07d-csv-stale.png`);
  await p.unroute('**/reminders?status=pending_approval*');
  console.log('  ✓ csv_stale מוצג «לאשר מחדש» (לא חסום, לא קוד גולמי)');
  await p.goto(base + '/app/#/invoices');
  await p.getByText('דנה לוי').first().waitFor();
  ok(await p.locator('tbody tr').count() === 9, 'ציפיתי ל-9 חשבוניות פתוחות (8 + אחת מ-CSV)');
  // הפעלה 136: שאר החשבוניות של תזכורת מאוחדת (לא העוגן) מסומנות «בתזכורת מאוחדת», והלחיצה פותחת את התזכורת כולה
  const pend136 = await api('/reminders?status=pending_approval&view=summary');
  const members136 = pend136.reduce((n, r) => n + r.invoice_ids.filter(x => x !== r.invoice_id).length, 0);
  ok(members136 >= 2, `ציפיתי לתזכורת מאוחדת ממתינה (גל שרון) בנתוני הדמו, נמצאו ${members136} חשבוניות נלוות`);
  const badges136 = p.getByTestId('in-merged');
  ok(await badges136.count() === members136, `«בתזכורת מאוחדת»: ${await badges136.count()} סימונים, ציפיתי ל-${members136}`);
  const galRows136 = p.locator('tbody tr', { hasText: 'גל שרון' });
  ok(await galRows136.getByRole('button', { name: 'תזכורת', exact: true }).count() === 1, 'כפתור «תזכורת» צריך להופיע רק בשורת העוגן של גל');
  ok(await galRows136.getByTestId('in-merged').count() === 2, 'שתי החשבוניות הנלוות של גל לא סומנו');
  ok(await p.locator('tbody tr', { hasText: 'יוסי' }).getByTestId('in-merged').count() === 0, 'חשבונית יחידה סומנה «בתזכורת מאוחדת»');
  await galRows136.getByTestId('in-merged').first().click();
  ok((await p.getByTestId('mp-sub').textContent()).includes('3 חשבוניות'), 'הלחיצה על «בתזכורת מאוחדת» לא פתחה את התזכורת המאוחדת');
  await p.getByRole('button', { name: 'ביטול' }).click();
  if (out) await fullShot(p, `${out}/live-07e-in-merged.png`);
  console.log('  ✓ עמוד החשבוניות: חשבוניות נלוות מסומנות «בתזכורת מאוחדת»');

  // הפעלה 137: עמודת «תזכורות» — המועד והערוץ של מה שיצא בפועל (last_sent), לא של הטיוטה שבתור
  const dash137 = await api('/dashboard');
  const sent137 = dash137.invoices.filter(r => r.status === 'open' && r.reminders_sent > 0);
  ok(await p.getByTestId('sent-cell').count() === sent137.length, `עמודת «תזכורות»: ${await p.getByTestId('sent-cell').count()} שורות עם שליחה, לפי ה-API ${sent137.length}`);
  for (const r of sent137) {
    const cell = (await p.locator('tbody tr', { hasText: r.number }).getByTestId('sent-cell').first().textContent()) ?? '';
    const [y, m, d] = (r.last_sent.sent_at ?? '').slice(0, 10).split('-').map(Number);
    ok(!r.last_sent.sent_at || cell.includes(`${d}.${m}`), `חשבונית ${r.number}: «${cell}» בלי מועד השליחה ${r.last_sent.sent_at}`);
    ok(cell.includes('📱') === r.last_sent.channels.includes('sms') && cell.includes('✉️') === r.last_sent.channels.includes('email'),
      `חשבונית ${r.number}: «${cell}» לא תואם לערוצים ${r.last_sent.channels}`);
  }
  console.log(`  ✓ עמוד החשבוניות: מועד וערוץ השליחה לפי last_sent (${sent137.length} שורות)`);
  // critic סבב 53: הניסיון האחרון נקטע (send_unknown) ⇒ «לא ידוע אם יצאה», לא מועד/📱 של תזכורת ישנה.
  //   מזריקים את הצורה שהשרת מחזיר עכשיו (unknown:true, sent_at:null) לתשובת /dashboard האמיתית.
  const unk = sent137[0];
  await inject(p, '**/dashboard', async route => {
    const res = await route.fetch(); const j = await res.json();
    for (const r of j.invoices) if (r.invoice_id === unk.invoice_id) r.last_sent = { sent_at: null, channels: [], unknown: true };
    await route.fulfill({ response: res, json: j });
  });
  await p.goto(base + '/app/#/invoices'); await p.reload();
  const unkCell = p.locator('tbody tr', { hasText: unk.number }).getByTestId('sent-cell').first();
  await unkCell.waitFor();
  const unkText = (await unkCell.textContent()) ?? '';
  ok(/לא ידוע אם יצאה/.test(unkText) && !unkText.includes('📱') && !/\d+\.\d+/.test(unkText.replace(/^\d+/, '')),
    `send_unknown הוצג כשליחה רגילה: «${unkText}»`);
  if (out) await fullShot(p, `${out}/live-07f-send-unknown.png`);
  await p.unroute('**/dashboard');
  console.log('  ✓ עמוד החשבוניות: ניסיון שנקטע מוצג «לא ידוע אם יצאה» (בלי מועד/ערוץ ישן)');

  // הפעלה 138 (נשאר מ-134): גבייה שאינה ב-₪ מוצגת ליד הגרף («$500, לא בגרף») ולא מחוברת לסה״כ ב-₪.
  //   הפעלה 139: בהדגמה הלקוח בחו״ל (חשבונית 2010) שילם $500 ⇒ השורה נבדקת מקצה לקצה, בלי הזרקה:
  //   מה שהשרת מחזיר (other_currency + other בשבוע) הוא מה שהדפדפן מציג, וה-$500 לא נכנס לסה״כ ב-₪.
  await p.goto(base + '/app/#/dashboard'); await p.getByTestId('chart-other').waitFor();
  const dash139 = await api('/dashboard');
  const usd139 = dash139.totals.other_currency.find(o => o.currency === 'USD');
  ok(usd139 && usd139.collected_agorot === 50000 && usd139.open_agorot === 0, 'ההדגמה: חסרה גבייה של $500 ב-other_currency');
  ok(dash139.series.filter(w => w.other).length === 1, 'ההדגמה: ציפיתי לשבוע אחד עם גבייה במטבע אחר');
  const real139 = (await p.getByTestId('chart-other').textContent()).trim();
  ok(real139 === '· ועוד $500, לא בגרף', `שורת «לא בגרף» בהדגמה: «${real139}»`);
  const chartTotal = await p.getByTestId('collection-chart').getAttribute('aria-label');
  const ils139 = dash139.series.reduce((n, w) => n + w.collected_agorot, 0);
  ok(ils139 === dash139.totals.collected_agorot && chartTotal.replace(/[^\d]/g, '') === String(ils139 / 100),
    `הסה״כ ב-₪ של הגרף («${chartTotal}») אינו ${ils139 / 100} ₪ — אולי הדולר חובר`);
  if (out) await fullShot(p, `${out}/live-01a-chart-other-demo.png`);
  // ועוד: כמה מטבעות בכמה שבועות מסוכמים לכל מטבע בנפרד (אין תרחיש כזה בהדגמה ⇒ מוזרק לתשובה האמיתית)
  await inject(p, '**/dashboard', async route => {
    const res = await route.fetch(); const j = await res.json();
    ok(Array.isArray(j.series) && j.series.length > 1, 'ל-/dashboard אין series');
    j.series.at(-1).other = [{ currency: 'USD', collected_agorot: 50000 }];
    j.series[0].other = [{ currency: 'EUR', collected_agorot: 12050 }, { currency: 'USD', collected_agorot: 25000 }];
    await route.fulfill({ response: res, json: j });
  });
  await p.reload(); await p.getByTestId('chart-other').waitFor();
  const other138 = await p.getByTestId('chart-other').textContent();
  ok(other138.includes('$750') && other138.includes('€120.50') && other138.includes('לא בגרף'), `שורת «לא בגרף»: «${other138}»`);
  ok(await p.getByTestId('collection-chart').getAttribute('aria-label') === chartTotal, 'גבייה במטבע אחר חוברה לסה״כ ב-₪ של הגרף');
  await noHScroll(p, 'דשבורד עם גבייה במטבע אחר');
  if (out) await fullShot(p, `${out}/live-01b-chart-other.png`);
  await p.unroute('**/dashboard');
  console.log('  ✓ גרף הגבייה: גבייה שאינה ב-₪ מוצגת בנפרד («לא בגרף»), הסה״כ ב-₪ לא משתנה');

  // v2 · דף נחיתה: כותרת + מחשבון שווי הזמן (בלי הבטחת תשואה — הכרעת מאיר 6.11)
  await p.goto(base + '/app/');
  ok((await p.getByTestId('hero-title').textContent()).includes('הכסף שלך חוזר'), 'כותרת v2 חסרה');
  const timeBefore = await p.getByTestId('time-result').textContent();
  await p.getByTestId('time-hours').fill('10');
  ok(timeBefore !== await p.getByTestId('time-result').textContent(), 'המחשבון לא מגיב');
  ok(!/×|חוזר מוקדם|יחזור אליכם/.test(await p.getByTestId('time-result').textContent()), 'הבטחת תשואה במחשבון');
  await noHScroll(p, 'נחיתה דסקטופ');
  if (out) await fullShot(p, `${out}/v2-landing.png`);
  // /landing ⇒ הפניה מקומית ל-/app/
  const lr = await rawFetch(base + '/landing', { redirect: 'manual' });
  ok([301, 302, 307, 308].includes(lr.status) && lr.headers.get('location') === '/app/', `/landing לא מפנה ל-/app/: ${lr.status} ${lr.headers.get('location')}`);

  // v2 · עמוד החייב (מובייל, בלי טוקן): Bit/Apple Pay/כרטיס + פריסה
  const smsOut = (await api('/outbox')).messages.find(x => x.channel === 'sms' && x.body.includes('/p/'));
  const code = smsOut.body.split('/p/')[1].split(/\s/)[0];
  const pctx = await b.newContext({ ...createRequire(import.meta.url)('playwright').devices['iPhone 13'] });
  const pm = await pctx.newPage();
  pm.on('pageerror', e => errors.push(String(e)));
  pm.on('console', x => x.type() === 'error' && errors.push('pay: ' + x.text()));
  await pm.goto(base + `/pay/${code}`);
  await pm.getByTestId('pay-amount').waitFor();
  ok(await pm.getByTestId('pay-page').count() === 1, 'חסר כפתור התשלום');   // review חור 4
  ok((await pm.getByTestId('pay-host').textContent()).includes('pay.example'), 'דומיין היעד לא מוצג');
  // ר-13: עמוד ה-web של החייב מציג «למה קיבלתם» + פרטיות (כמו /p ו-/u)
  ok((await pm.getByTestId('pay-legal').textContent()).includes('אינה הודעה פרסומית'), 'עמוד החייב בלי «למה קיבלתם»/פרטיות');
  await noHScroll(pm, 'עמוד החייב מובייל');
  const href = await pm.getByTestId('pay-page').getAttribute('href');
  const goPay = await rawFetch(new URL(href, base), { redirect: 'manual' });
  ok(goPay.status === 302 && goPay.headers.get('location').startsWith('https://pay.example/'), 'הכפתור לא מוביל לדף התשלום המאומת');
  if (out) await pm.screenshot({ path: `${out}/v2-pay-mobile.png`, fullPage: true });
  await pm.getByRole('radio', { name: '4' }).click();
  await pm.getByTestId('pay-plan').click();
  await pm.getByTestId('pay-done').waitFor();
  ok((await pm.getByTestId('pay-done').textContent()).includes('4 תשלומים'), 'אישור בקשת הפריסה חסר');
  await pctx.close();
  console.log('  ✓ נחיתה + /landing⇒/app/ + עמוד החייב');

  // 8) מובייל: אין גלילה רוחבית בשום מסך
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  m.on('pageerror', e => errors.push(String(e)));
  // sessionStorage הוא פר-לשונית ⇒ הלשונית החדשה מקבלת את הקוד כמו שבעל העסק היה מדביק אותו
  await m.addInitScript(t => { sessionStorage.setItem('gabi_owner_token', t); }, TOKEN);
  for (const r of ['dashboard', 'invoices', 'inbox', 'settings', '']) {
    await m.goto(base + '/app/#/' + r);
    if (r) await m.getByTestId('mode-mobile').filter({ hasText: 'מחובר לשרת גבי' }).waitFor(); else await m.getByTestId('hero-title').waitFor();
    await noHScroll(m, `${r} מובייל`);
  }
  await m.goto(base + '/app/#/dashboard'); await m.getByTestId('collection-chart').waitFor();
  if (out) await fullShot(m, `${out}/v2-dashboard-mobile.png`);
  console.log('  ✓ מובייל 390px: 5 מסכים בלי גלילה רוחבית');

  // 9) בורר מקור החשבוניות: iCount בהגדרות ⇒ השרת שומר source.system ⇒ סנכרון מול ה-mock של iCount
  //    (בתוך התהליך, בלי רשת) ⇒ שחזור לחשבונית ירוקה. רק הבחירה נשלחת — אף פעם לא מפתח.
  await p.goto(base + '/app/#/settings');
  await settingsLoaded();
  const srcBefore = (await api('/settings')).source;
  ok(srcBefore.system === 'greeninvoice' && srcBefore.api_connected === true, 'מקור התחלתי: ' + JSON.stringify(srcBefore));
  ok(await p.getByTestId('source-greeninvoice').getAttribute('aria-checked') === 'true', 'הבורר לא נטען מהשרת');
  const putBodies = [];
  const onReq = r => { if (r.method() === 'PUT' && r.url() === base + '/settings') putBodies.push(r.postData() ?? ''); };
  p.on('request', onReq);
  await p.getByTestId('source-icount').click();
  ok(await p.getByTestId('source-icount').getAttribute('aria-checked') === 'true', 'iCount לא נבחר');
  ok((await p.getByTestId('source-status').textContent()).includes('יתעדכן אחרי שמירה'), 'סטטוס לפני שמירה');
  await p.getByTestId('settings-save').click();
  await p.getByTestId('source-status').filter({ hasText: 'מחובר (סביבת בדיקה)' }).waitFor();
  const srcIc = (await api('/settings')).source;
  ok(srcIc.system === 'icount' && srcIc.api_connected === true && srcIc.system_label === 'iCount', 'השרת לא שמר iCount: ' + JSON.stringify(srcIc));
  ok(putBodies.length === 1 && JSON.parse(putBodies[0]).source?.system === 'icount', 'גוף השמירה: ' + putBodies.join(' | '));
  ok(!/token|secret|key/i.test(putBodies[0]), 'נשלח סוד בשמירת המקור');
  const openBefore = (await api('/dashboard')).invoices.filter(r => r.status === 'open').length;
  const icSync = await (await fetch(base + '/sync', { method: 'POST' })).json();
  ok(icSync.open === 2 && icSync.closed === 0, 'סנכרון iCount: ' + JSON.stringify(icSync));
  const dashIc = await api('/dashboard');
  ok(dashIc.invoices.some(r => r.number === '3001') && dashIc.invoices.some(r => r.number === '3002'), 'חשבוניות ה-iCount לא נקלטו');
  const openAfter = dashIc.invoices.filter(r => r.status === 'open').length;
  ok(openAfter === openBefore + 2, `סנכרון iCount סגר חשבוניות של מקור אחר: ${openBefore} ⇒ ${openAfter}`);
  await p.goto(base + '/app/#/invoices');
  await p.getByText('נועה ברק (דמו)').first().waitFor();
  ok((await api('/audit')).some(a => a.action === 'source_system_changed' && /icount/.test(a.detail ?? '')), 'אין audit להחלפת מקור');
  // שחזור
  await p.goto(base + '/app/#/settings');
  await settingsLoaded();
  await p.getByTestId('source-greeninvoice').click();
  await p.getByTestId('settings-save').click();
  await p.getByTestId('source-status').filter({ hasText: 'מחובר (סביבת בדיקה)' }).waitFor();
  p.off('request', onReq);
  ok((await api('/settings')).source.system === 'greeninvoice', 'השחזור לחשבונית ירוקה לא נשמר');
  const giSync = await (await fetch(base + '/sync', { method: 'POST' })).json();
  ok(giSync.open >= 5, 'סנכרון חשבונית ירוקה אחרי שחזור: ' + JSON.stringify(giSync));
  if (out) await fullShot(p, `${out}/live-09-source.png`);
  console.log('  ✓ בורר מקור: iCount נשמר בשרת, סנכרון מול ה-mock, שחזור לחשבונית ירוקה');

  // 10) הפעלה 140 (נשאר מ-135): תזכורת מאוחדת שבה חשבונית מ-CSV **אינה העוגן**. השרת דורש confirm_open כשיש
  //     חשבונית CSV בכל מקום בתזכורת; לפני 135 הממשק הציג את התיבה רק לפי העוגן ⇒ האישור נדחה בלי דרך לסמן.
  //     בהדגמה כל לקוחות ה-API מגיעים עם מזהה לקוח, ולכן חשבונית CSV לא מצטרפת אליהם ⇒ מייבאים שתי חשבוניות
  //     CSV ללקוח אחד (תזכורת מאוחדת אמיתית בשרת) ומזריקים לתשובת /dashboard רק את מקור העוגן ('api').
  //     כל השאר אמיתי: needs_confirm_open, הסה״כ, ה-409 בלי הסימון וה-confirm_open שנרשם ב-audit.
  const csv140 = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n9001,לקוח CSV (דמו),050-0000123,500,2026-10-01\n'
    + '9003,לקוח מאוחד CSV (דמו),050-0000124,300,2026-10-01\n9004,לקוח מאוחד CSV (דמו),050-0000124,500.50,2026-10-03\n';
  const imp140 = await (await fetch(base + '/settings/source/csv', { method: 'POST', body: csv140, headers: { 'Content-Type': 'text/csv; charset=utf-8' } })).json();
  ok(imp140.imported >= 2 && !imp140.rejected.length, 'ייבוא ה-CSV של התזכורת המאוחדת: ' + JSON.stringify(imp140));
  await fetch(base + '/plan', { method: 'POST' });
  const dash140 = await api('/dashboard');
  const inv140 = ['9003', '9004'].map(n => dash140.invoices.find(r => r.number === n));
  ok(inv140.every(r => r && r.source === 'csv'), 'חשבוניות 9003/9004 לא נקלטו כ-CSV');
  const rem140 = (await api('/reminders?status=pending_approval&view=summary')).find(r => r.invoice_ids.includes(inv140[1].invoice_id));
  ok(rem140 && rem140.invoice_count === 2 && rem140.invoice_id === inv140[0].invoice_id, 'ציפיתי לתזכורת מאוחדת אחת של 9003+9004 שהעוגן שלה 9003: ' + JSON.stringify(rem140));
  ok(rem140.total_text === '800.50 ₪', 'סה״כ התזכורת המאוחדת: ' + rem140.total_text);
  ok((await api(`/reminders/${rem140.id}/preview`)).needs_confirm_open === true, 'השרת לא מסמן needs_confirm_open');
  // בלי הסימון השרת דוחה (זה מה שבעל העסק היה פוגש אם התיבה לא הייתה מוצגת)
  const deny140 = await fetch(base + `/reminders/${rem140.id}/approve`, { method: 'POST' });
  ok([409, 422].includes(deny140.status), `אישור בלי confirm_open עבר בשרת: ${deny140.status}`);
  await inject(p, '**/dashboard', async route => {
    const res = await route.fetch(); const j = await res.json();
    for (const r of j.invoices) if (r.invoice_id === rem140.invoice_id) r.source = 'api';   // העוגן «מה-API»
    await route.fulfill({ response: res, json: j });
  });
  await p.goto(base + '/app/#/dashboard'); await p.reload();
  const item140 = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) }).filter({ hasText: 'לקוח מאוחד CSV' });
  await item140.waitFor();
  ok((await item140.getByTestId('queue-merged').textContent()).includes('800.50 ₪'), 'התור לא מציג את סה״כ התזכורת המאוחדת');
  await item140.getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''));
  ok((await p.getByTestId('mp-sub').textContent()).includes('2 חשבוניות'), 'התצוגה המקדימה לא מציגה תזכורת מאוחדת');
  ok(await p.getByTestId('confirm-open').count() === 1, 'תיבת «הסכום עדיין פתוח» לא מוצגת כשחשבונית ה-CSV אינה העוגן');
  ok((await p.getByTestId('confirm-open').textContent()).includes('800.50 ₪'), 'התיבה מציגה את סכום העוגן ולא את סה״כ התזכורת');
  const approve140 = p.getByRole('button', { name: /אשר ושלח/ });
  ok(await approve140.isDisabled(), 'אישור תזכורת מאוחדת עם CSV אפשרי בלי הסימון');
  if (out) await fullShot(p, `${out}/live-10-merged-csv-not-anchor.png`);
  await p.getByTestId('confirm-open').locator('input').check();
  await approve140.click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  const audit140 = (await api('/audit')).find(a => a.action === 'approve' && new RegExp(`"reminder": ${rem140.id}\\b`).test(a.detail ?? ''));
  ok(audit140 && /"confirm_open": true/.test(audit140.detail), 'האישור של התזכורת המאוחדת לא נרשם עם confirm_open');
  await p.unroute('**/dashboard');
  console.log('  ✓ תזכורת מאוחדת עם CSV שאינו העוגן: התיבה לפי השרת, הסה״כ של כל התזכורת, confirm_open ב-audit');

  // 11) הפעלה 140: בזמן הטעינה מהשרת לא מוצגים נתוני המוק (לקוחות וסכומים בדויים הופיעו לרגע לבעל עסק מחובר).
  //     מאטים את /health כדי לתפוס את חלון הטעינה: מצב ניטרלי, בלי אף שם לקוח מהמוק ובלי «$500» של המוק.
  await inject(p, '**/health', async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
  await p.goto(base + '/app/#/dashboard'); await p.reload();
  await p.getByTestId('app-loading').waitFor();
  // הפעלה 150: שלד טעינה במקום «טוען…». צורות בלבד (אין בו טקסט), מוסתר מקורא מסך, שמכריז «טוען נתונים…» פעם אחת
  const sk150 = p.getByTestId('app-skeleton');
  ok(await sk150.count() === 1 && await sk150.getAttribute('aria-hidden') === 'true' && (await sk150.textContent()).trim() === '', 'בזמן הטעינה אין שלד, או שהוא חשוף לקורא מסך או מכיל טקסט');
  ok((await p.getByTestId('app-loading').textContent()).trim() === 'טוען נתונים…' && await p.getByTestId('app-loading').getAttribute('role') === 'status', 'מצב הטעינה בלי הכרזת «טוען נתונים…»');
  ok(await sk150.locator('div.rounded-md').first().evaluate(e => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 8 && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'; }), 'צורות השלד לא נראות (בלי גודל או בלי צבע)');
  if (out) await p.screenshot({ path: `${out}/live-11-skeleton.png`, fullPage: true });
  ok(await p.getByText('קפה הגפן').count() === 0 && await p.getByTestId('kpis').count() === 0 && await p.getByTestId('chart-other').count() === 0,
    'נתוני המוק מוצגים בזמן הטעינה מהשרת');
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await p.getByTestId('kpis').waitFor();
  ok(await p.getByTestId('app-loading').count() === 0 && await p.getByText('קפה הגפן').count() === 0, 'אחרי הטעינה: מצב הטעינה נשאר או שנתוני המוק מוצגים');
  await p.unroute('**/health');
  console.log('  ✓ טעינה מהשרת: מצב ניטרלי, בלי הבזק של נתוני המוק');

  // 12) הפעלה 141: טעינה שנכשלת לא נופלת לנתוני המוק. עד עכשיו שרת שענה ל-/health ואז נכשל ב-/dashboard
  //     הציג לבעל עסק מחובר את «קפה הגפן» ו-124,870 ₪ כאילו הם שלו. עכשיו: מסך שגיאה ו«נסו שוב».
  failPhase = true;
  const noMock = async where => ok(await p.getByText('קפה הגפן').count() === 0 && await p.getByTestId('kpis').count() === 0
    && await p.locator('nav .bg-brand').count() === 0, `${where}: נתוני המוק (לקוח/KPI/תג התור) מוצגים`);
  // 12א) /health עונה, /dashboard מחזיר 503
  await inject(p, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await p.goto(base + '/app/#/dashboard'); await p.reload();
  await p.getByTestId('app-error').waitFor();
  await noMock('שרת שנכשל ב-/dashboard');
  ok((await p.getByTestId('mode').textContent()).includes('אין חיבור לשרת'), 'מצב החיבור לא מציג «אין חיבור לשרת»');
  ok(!(await p.getByTestId('mode').textContent()).includes('מוק') && (await p.getByTestId('whoami').textContent()).trim() === '…', 'בשגיאה מוצג מצב מוק או שם העסק של המוק');
  await p.goto(base + '/app/#/invoices'); await p.getByTestId('app-error').waitFor(); await noMock('עמוד החשבוניות בשגיאה');
  if (out) await fullShot(p, `${out}/live-12-load-error.png`);
  ok(allowedFail >= 1, 'ה-503 המוזרק לא הגיע לדף');
  // «נסו שוב» כשהשרת חזר ⇒ הנתונים האמיתיים, בלי רענון דף
  await p.unroute('**/dashboard');
  await p.getByTestId('app-retry').click();
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await p.getByText('גל שרון').first().waitFor();
  ok(await p.getByTestId('app-error').count() === 0, 'מסך השגיאה נשאר אחרי «נסו שוב» מוצלח');
  // 12ב) יש כניסה שמורה בלשונית והשרת לא עונה בכלל ⇒ שגיאה, לא מוק
  await inject(p, '**/health', route => route.abort());
  await p.goto(base + '/app/#/dashboard'); await p.reload();
  await p.getByTestId('app-error').waitFor();
  await noMock('שרת שלא עונה כשיש כניסה שמורה');
  // «נסו שוב» כשהשרת עדיין למטה ⇒ נשארים בשגיאה
  await p.getByTestId('app-retry').click();
  await p.getByTestId('app-retry').filter({ hasText: 'נסו שוב' }).waitFor();
  ok(await p.getByTestId('app-error').count() === 1, '«נסו שוב» כושל יצא ממסך השגיאה');
  await p.unroute('**/health');
  await p.getByTestId('app-retry').click();
  await p.getByTestId('kpis').waitFor();
  console.log('  ✓ טעינה שנכשלה: מסך שגיאה ו«נסו שוב», בלי נתוני המוק (503 אחרי /health, ושרת שלא עונה עם כניסה שמורה)');

  // 13) הפעלה 142: רענון שנכשל באמצע עבודה (מעבר מסך כשהשרת נפל) נבלע בשקט, והנתונים הישנים נשארו בלי סימן.
  //     עכשיו: פס «הנתונים לא עודכנו» עם «נסו שוב»; הנתונים האחרונים נשארים על המסך, לא מסך שגיאה ולא מוק.
  const failsBefore = allowedFail;
  await inject(p, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await p.goto(base + '/app/#/invoices');
  await p.getByTestId('stale-banner').waitFor();
  ok(allowedFail > failsBefore, 'ה-503 המוזרק (רענון) לא הגיע לדף');
  ok(await p.getByTestId('app-error').count() === 0, 'רענון שנכשל החליף את המסך במסך שגיאה (צריך פס בלבד)');
  ok(await p.getByText('גל שרון').count() > 0 && await p.getByText('קפה הגפן').count() === 0, 'רענון שנכשל: הנתונים האחרונים נעלמו או הוחלפו במוק');
  ok((await p.getByTestId('mode').textContent()).includes('הנתונים לא עודכנו'), 'מצב החיבור עדיין «מחובר» כשהרענון נכשל');
  if (out) await fullShot(p, `${out}/live-13-stale-banner.png`);
  // «נסו שוב» כשהשרת עדיין למטה ⇒ הפס נשאר
  await Promise.all([p.waitForResponse(r => r.url() === base + '/dashboard' && r.status() === 503), p.getByTestId('stale-retry').click()]);
  await p.getByTestId('stale-retry').filter({ hasText: 'נסו שוב' }).waitFor();
  ok(await p.getByTestId('stale-banner').count() === 1, '«נסו שוב» כושל הסתיר את הפס');
  // מובייל: הפס לא יוצר גלילה רוחבית, ומצב החיבור בכותרת מתעדכן
  await p.setViewportSize({ width: 390, height: 844 });
  await noHScroll(p, 'פס «הנתונים לא עודכנו» במובייל');
  ok((await p.getByTestId('mode-mobile').textContent()).includes('אין חיבור לשרת'), 'מובייל: מצב החיבור לא מציג את הכשל');
  if (out) await fullShot(p, `${out}/live-13-stale-banner-mobile.png`);
  await p.setViewportSize({ width: 1366, height: 900 });
  // הפעלה 144: השרת חזר ⇒ הפס נעלם **לבד** (רענון אוטומטי כשהדפדפן מדווח שהחיבור חזר), בלי ללחוץ «נסו שוב»
  await p.unroute('**/dashboard');
  await p.evaluate(() => window.dispatchEvent(new Event('online')));
  await p.getByTestId('stale-banner').waitFor({ state: 'detached' });
  ok((await p.getByTestId('mode').textContent()).includes('מחובר לשרת גבי'), 'אחרי רענון מוצלח מצב החיבור לא חזר ל«מחובר»');
  console.log('  ✓ רענון שנכשל באמצע עבודה: פס «הנתונים לא עודכנו», הנתונים האחרונים נשארים, והפס נעלם לבד כשהחיבור חוזר');

  // 14) הפעלה 142: קוד הגישה המשותף החזיר «הקוד לא התקבל» גם כשהשרת נכשל (5xx) והקוד בכלל לא נבדק.
  const g = await (await b.newContext()).newPage();
  g.on('pageerror', e => errors.push(String(e)));
  let gate503 = 0;
  g.on('response', r => { if (r.status() === 503 && r.url() === base + '/dashboard') gate503++; else if (r.status() >= 400) errors.push(`שער קוד: ${r.status()} ${r.url()}`); });
  await g.goto(base + '/app/#/dashboard');
  await g.getByTestId('staff-login').waitFor();
  await inject(g, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await g.getByText('יש לי קוד גישה משותף').click();
  await g.getByLabel('קוד גישה').fill(TOKEN);   // הקוד הנכון
  await g.getByTestId('token-gate').getByRole('button', { name: 'כניסה' }).click();
  await g.getByTestId('token-error').filter({ hasText: 'השרת לא זמין כרגע' }).waitFor();
  ok(!(await g.getByTestId('token-error').textContent()).includes('הקוד לא התקבל'), 'כשל שרת הוצג כ«קוד שגוי»');
  ok(gate503 === 1, `ציפינו ל-503 אחד בשער הקוד, היו ${gate503}`);
  ok(await g.evaluate(() => sessionStorage.getItem('gabi_owner_token')) === null, 'קוד שלא אומת נשאר בלשונית');
  // השרת חזר ⇒ אותו קוד (נשאר בשדה) נכנס
  await g.unroute('**/dashboard');
  await g.getByTestId('token-gate').getByRole('button', { name: 'כניסה' }).click();
  await g.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await g.context().close();
  console.log('  ✓ קוד גישה: כשל שרת ⇒ «השרת לא זמין», לא «הקוד לא התקבל»; אותו קוד נכנס כשהשרת חוזר');
  // 15) הפעלה 143: כניסת עובד שהצליחה כשהטעינה שאחריה נכשלה השאירה את המשתמש במסך הכניסה עם «נסו לרענן»
  //     (והקוד החד-פעמי כבר נוצל). עכשיו: מסך השגיאה עם «נסו שוב», והסשן השמור מתחבר כשהשרת חוזר.
  //     /auth/login מיורט (קוד ה-TOTP של שעון הדמו כבר נוצל בשלב 1) ומחזיר טוקן תקף של השרת.
  const h = await (await b.newContext()).newPage();
  await h.setViewportSize({ width: 1366, height: 900 });
  h.on('pageerror', e => errors.push('שלב 15/16: ' + String(e)));
  const hFail = [];
  h.on('response', r => { if (r.status() >= 400) hFail.push(`${r.status()} ${r.request().method()} ${r.url().replace(base, '')}`); });
  await h.goto(base + '/app/#/login');
  await h.getByTestId('staff-login').waitFor();
  await inject(h, '**/auth/login', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: TOKEN }) }));
  await inject(h, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await h.getByLabel('מייל').fill(STAFF.email);
  await h.getByLabel('סיסמה', { exact: true }).fill(STAFF.password);
  await h.getByLabel('קוד אימות').fill('123456');
  await h.getByTestId('staff-login').getByRole('button', { name: 'כניסה' }).click();
  await h.getByTestId('app-error').waitFor();
  ok(await h.getByTestId('staff-login').count() === 0, 'כניסה שהצליחה + טעינה שנכשלה: המשתמש נשאר במסך הכניסה');
  ok(h.url().endsWith('#/dashboard'), 'אחרי כניסה שהטעינה שלה נכשלה הכתובת נשארה: ' + h.url());
  ok(await h.evaluate(() => sessionStorage.getItem('gabi_owner_token')) === TOKEN, 'הסשן לא נשמר אחרי כניסה מוצלחת');
  ok(await h.getByText('קפה הגפן').count() === 0, 'מסך השגיאה אחרי כניסה מציג נתוני מוק');
  if (out) await h.screenshot({ path: `${out}/live-15-login-load-error.png` });
  await h.unroute('**/dashboard');
  await h.getByTestId('app-retry').click();
  await h.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  await h.getByTestId('kpis').waitFor();
  ok(hFail.join('|') === '503 GET /dashboard', 'שלב 15: כשלים לא צפויים: ' + hFail.join(' | '));
  console.log('  ✓ כניסה שהצליחה כשהטעינה נכשלה: מסך השגיאה עם «נסו שוב» (לא מסך הכניסה), והסשן השמור מתחבר');

  // 16) הפעלה 143: פעולה שנכשלת כשהשרת למטה מסבירה בעברית (היה «Failed to fetch» / קוד HTTP גולמי),
  //     ופעולה שהצליחה כשרק הרענון שאחריה נכשל לא מוצגת כ«לא נשמר».
  hFail.length = 0;
  await h.goto(base + '/app/#/settings');
  await h.locator('[data-testid="settings-live"][data-loaded="1"]').waitFor();
  const signBefore = (await api('/settings')).owner_name;
  const onPut = fn => route => route.request().method() === 'PUT' ? fn(route) : route.continue();
  await h.getByLabel('שם לחתימה').fill('נועה ב');
  await inject(h, '**/settings', onPut(route => route.abort()));
  await h.getByTestId('settings-save').click();
  await h.getByTestId('settings-error').filter({ hasText: 'אין חיבור לשרת גבי' }).waitFor();
  ok(!/fetch|TypeError/i.test(await h.getByTestId('settings-error').textContent()), 'כשל רשת מוצג באנגלית');
  await h.unroute('**/settings');
  await inject(h, '**/settings', onPut(route => route.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Bad Gateway</h1>' })));
  await h.getByTestId('settings-save').click();
  await h.getByTestId('settings-error').filter({ hasText: 'השרת לא זמין כרגע' }).waitFor();
  ok(!/502|Bad Gateway/.test(await h.getByTestId('settings-error').textContent()), 'קוד HTTP גולמי מוצג למשתמש');
  ok((await api('/settings')).owner_name === signBefore, 'שמירה שנכשלה שינתה את השרת');
  if (out) await h.screenshot({ path: `${out}/live-16-action-server-down.png` });
  await h.unroute('**/settings');
  // השמירה מצליחה, הרענון שאחריה נכשל ⇒ «✓ נשמר בשרת» + הפס «הנתונים לא עודכנו», בלי «לא נשמר»
  await inject(h, '**/dashboard', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"down"}' }));
  await h.getByTestId('settings-save').click();
  await h.getByText('✓ נשמר בשרת').waitFor();
  await h.getByTestId('stale-banner').waitFor();
  ok(await h.getByTestId('settings-error').count() === 0, 'שמירה שהצליחה הוצגה כ«לא נשמר» בגלל כשל ברענון');
  ok((await api('/settings')).owner_name === 'נועה ב', 'השמירה לא הגיעה לשרת');
  await h.unroute('**/dashboard');
  await h.getByLabel('שם לחתימה').fill(signBefore);
  await h.getByTestId('settings-save').click();
  await h.getByTestId('stale-banner').waitFor({ state: 'detached' });
  ok((await api('/settings')).owner_name === signBefore, 'שם החתימה לא שוחזר');
  // הפעלה 144: בזמן שהפס מוצג הממשק מנסה לרענן לבד ⇒ ייתכן יותר מ-503 אחד על /dashboard
  ok(/^502 PUT \/settings(\|503 GET \/dashboard)+$/.test(hFail.join('|')), 'שלב 16: כשלים לא צפויים: ' + hFail.join(' | '));
  console.log('  ✓ פעולה כשהשרת למטה: הסבר בעברית בלי קוד HTTP; שמירה שהצליחה + רענון שנכשל ⇒ «נשמר» + פס');

  // 17) הפעלה 144: כשל רשת באמצע פעולת כתיבה, כשהבקשה **כן** הגיעה לשרת ונרשמה (התשובה אבדה בדרך).
  //     עד עכשיו: «לא נשמר … נסו שוב» ⇒ ניסיון חוזר עיוור. עכשיו: «לא ידוע אם הפעולה נרשמה», והממשק מרענן לבד
  //     (בלי לחיצה) ומציג את המצב האמיתי: הערך כבר בשרת, אין מה לשמור, וההודעה נעלמת.
  hFail.length = 0;
  await h.getByLabel('שם לחתימה').fill('רות ק');
  await inject(h, '**/settings', onPut(async route => { await route.fetch(); await route.abort(); }));
  await h.getByTestId('settings-save').click();
  await h.getByTestId('settings-error').filter({ hasText: 'לא ידוע אם הפעולה נרשמה' }).waitFor();
  ok(!(await h.getByTestId('settings-error').textContent()).includes('לא נשמר'), 'תוצאה לא ידועה הוצגה כ«לא נשמר»');
  await h.getByTestId('stale-banner').waitFor();
  if (out) await h.screenshot({ path: `${out}/live-17-write-unknown.png` });
  await h.unroute('**/settings');
  await h.getByTestId('stale-banner').waitFor({ state: 'detached' });     // רענון אוטומטי, בלי «נסו שוב»
  await h.getByTestId('settings-error').waitFor({ state: 'detached' });   // הטופס התיישר מול השרת
  ok((await api('/settings')).owner_name === 'רות ק', 'הבקשה שהתשובה שלה אבדה לא נרשמה בשרת');
  ok(await h.getByLabel('שם לחתימה').inputValue() === 'רות ק', 'אחרי הרענון האוטומטי הטופס לא מציג את מה שבשרת');
  ok(await h.getByTestId('settings-save').isDisabled(), 'אחרי הרענון האוטומטי «שמירה» עדיין זמינה ⇒ מזמין שמירה כפולה');
  ok(hFail.length === 0, 'שלב 17: כשלים לא צפויים: ' + hFail.join(' | '));
  console.log('  ✓ כתיבה שהתשובה שלה אבדה: «לא ידוע אם נרשמה», רענון אוטומטי, והטופס מציג את מה שבשרת');

  // 18) הפעלה 144: ההגדרות השתנו בשרת ממקום אחר בזמן שהטופס פתוח. אחרי רענון (כאן: ייבוא CSV) שדה שלא נערך
  //     מקבל את הערך מהשרת, ושדה שהמשתמש כבר ערך לא נדרס. השמירה שולחת רק את מה שהמשתמש שינה.
  await h.getByLabel('מייל לתשובות לקוחות').fill('office@example.co.il');   // עריכה מקומית שעוד לא נשמרה
  ok((await fetch(base + '/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner_name: signBefore }) })).ok, 'שינוי ההגדרות מבחוץ נכשל');
  await h.getByLabel('קובץ CSV').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n9777,,abc,xx,\n', 'utf8') });
  await h.getByTestId('csv-result').waitFor();
  for (let i = 0; i < 100 && await h.getByLabel('שם לחתימה').inputValue() !== signBefore; i++) await h.waitForTimeout(100);
  ok(await h.getByLabel('שם לחתימה').inputValue() === signBefore, 'שדה שלא נערך לא התרענן מהשרת אחרי הרענון');
  ok(await h.getByLabel('מייל לתשובות לקוחות').inputValue() === 'office@example.co.il', 'רענון מהשרת דרס שדה שהמשתמש ערך');
  let putBody = null;
  h.on('request', r => { if (r.method() === 'PUT' && r.url() === base + '/settings') putBody = r.postDataJSON(); });
  await h.getByTestId('settings-save').click();
  await h.getByText('✓ נשמר בשרת').waitFor();
  // הפעלה 145: בהגדרות ה-toast לא מכסה את סרגל השמירה (שם מוצגת שורת השגיאה)
  //     הפעלה 148: וגם לא את ראש המסך (כותרת, מצב חיבור, יציאה) — הוא בתחתית, צמוד מעל הסרגל
  const tb = await h.getByTestId('toast').boundingBox(), sb = await h.getByTestId('settings-bar').boundingBox();
  ok(tb && sb && tb.y + tb.height <= sb.y && sb.y - (tb.y + tb.height) <= 24, 'ה-toast בהגדרות לא צמוד מעל סרגל השמירה: ' + JSON.stringify([tb, sb]));
  ok(JSON.stringify(putBody) === JSON.stringify({ reply_email: 'office@example.co.il' }), 'השמירה שלחה יותר ממה שהמשתמש שינה: ' + JSON.stringify(putBody));
  // הפעלה 148, מובייל: ה-toast לא מכסה את השורה העליונה (לוגו, מצב חיבור, יציאה), לא את הניווט ולא את סרגל השמירה
  //     וגם: הודעה חדשה לא נמחקת בטיימר של ההודעה שלפניה («נשמר» עדיין מוצגת כשהייבוא מסתיים)
  const vp148 = h.viewportSize();
  await h.setViewportSize({ width: 390, height: 844 });
  await h.waitForTimeout(2500);
  ok(await h.getByTestId('toast').count() === 1, 'הודעת «נשמר» נעלמה לפני הזמן');
  await h.getByLabel('קובץ CSV').setInputFiles({ name: 'bad2.csv', mimeType: 'text/csv', buffer: Buffer.from('מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n9778,,abc,xx,\n', 'utf8') });
  await h.getByTestId('toast').filter({ hasText: 'יובאו' }).waitFor();
  await h.waitForTimeout(2000);   // כאן הטיימר של «נשמר» כבר פקע; ההודעה החדשה חייבת להישאר
  ok(await h.getByTestId('toast').filter({ hasText: 'יובאו' }).count() === 1, 'הטיימר של ההודעה הקודמת מחק את ההודעה החדשה');
  const mt = await h.getByTestId('toast').boundingBox(), mb = await h.getByTestId('settings-bar').boundingBox();
  const hit = (a, c) => a && c && a.x < c.x + c.width && c.x < a.x + a.width && a.y < c.y + c.height && c.y < a.y + a.height;
  ok(mt && mb && !hit(mt, mb) && mt.y + mt.height <= mb.y, 'מובייל: ה-toast מכסה את סרגל השמירה: ' + JSON.stringify([mt, mb]));
  for (const sel of ['[data-testid="logout-mobile"]', '[data-testid="mode-mobile"]', 'nav[aria-label="ניווט ראשי"]'])
    ok(!hit(mt, await h.locator(sel).boundingBox()), `מובייל: ה-toast מכסה את ${sel}`);
  ok(mt.x >= 0 && mt.x + mt.width <= 390, 'מובייל: ה-toast חורג מרוחב המסך');
  if (out) await h.screenshot({ path: `${out}/live-18-toast-mobile.png` });
  await h.getByTestId('toast').waitFor({ state: 'detached' });
  await h.setViewportSize(vp148);
  const s18 = await api('/settings');
  ok(s18.owner_name === signBefore && s18.reply_email === 'office@example.co.il', 'מצב השרת אחרי שלב 18: ' + JSON.stringify(s18));
  ok(hFail.length === 0, 'שלב 18: כשלים לא צפויים: ' + hFail.join(' | '));
  console.log('  ✓ הגדרות שהשתנו בשרת בזמן עריכה: שדה שלא נערך מתרענן, שדה שנערך נשמר, ונשלח רק מה ששונה');

  // 19) הפעלה 144: 401 באמצע פעולה (הסשן פג / בוטל) הציג הודעה אבל השאיר את המשתמש ואת הנתונים על המסך עד
  //     הרענון הבא. עכשיו: מיד מסך הכניסה עם הסבר, הסשן נמחק מהלשונית, ואין נתוני לקוחות על המסך.
  await h.getByLabel('שם לחתימה').fill('אחרי שפג');
  await inject(h, '**/settings', onPut(route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"unauthorized"}' })));
  await h.getByTestId('settings-save').click();
  await h.getByTestId('staff-login').waitFor();
  ok((await h.locator('body').textContent()).includes('תוקף הכניסה פג'), 'מסך הכניסה אחרי 401 באמצע פעולה בלי הסבר');
  ok(await h.evaluate(() => sessionStorage.getItem('gabi_owner_token')) === null, '401 באמצע פעולה: הסשן נשאר בלשונית');
  ok(await h.getByTestId('settings-save').count() === 0 && await h.getByText('גל שרון').count() === 0, '401 באמצע פעולה: המסך הקודם נשאר מוצג');
  ok((await api('/settings')).owner_name === signBefore, 'שמירה שנדחתה ב-401 שינתה את השרת');
  ok(hFail.join('|') === '401 PUT /settings', 'שלב 19: כשלים לא צפויים: ' + hFail.join(' | '));
  if (out) await h.screenshot({ path: `${out}/live-19-auth-lost.png` });
  console.log('  ✓ 401 באמצע פעולה: מיד מסך הכניסה עם «תוקף הכניסה פג», הסשן נמחק, אין נתונים על המסך');

  // 20) הפעלה 145: אחרי 401 באמצע עריכת ההגדרות מה שהוקלד אבד. עכשיו: אחרי כניסה מחדש השדה שנערך חוזר לטופס
  //     (מזיכרון הלשונית בלבד, לא מ-storage), מסומן כלא שמור, והשמירה שולחת רק אותו.
  hFail.length = 0;
  await h.unroute('**/settings');
  ok(await h.evaluate(() => Object.keys(sessionStorage).length + Object.keys(localStorage).length) === 0, 'הטיוטה נשמרה ב-storage של הדפדפן');
  await h.unroute('**/auth/login');
  await inject(h, '**/auth/login', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: TOKEN }) }));
  await h.getByLabel('מייל').fill(STAFF.email);
  await h.getByLabel('סיסמה', { exact: true }).fill(STAFF.password);
  await h.getByLabel('קוד אימות').fill('123456');
  await h.getByTestId('staff-login').getByRole('button', { name: 'כניסה' }).click();
  if (!h.url().endsWith('#/settings')) { await h.getByTestId('staff-login').waitFor({ state: 'detached' }); await h.goto(base + '/app/#/settings'); }
  await h.getByTestId('settings-dirty').filter({ hasText: 'החזרנו את מה שהקלדתם' }).waitFor();
  ok(await h.getByLabel('שם לחתימה').inputValue() === 'אחרי שפג', 'אחרי כניסה מחדש מה שהוקלד בהגדרות לא חזר');
  ok(await h.getByLabel('מייל לתשובות לקוחות').inputValue() === 'office@example.co.il', 'שדה שלא נערך לא מציג את ערך השרת');
  ok(await h.getByTestId('settings-save').isEnabled(), 'אחרי השחזור «שמירה» כבויה');
  if (out) await h.screenshot({ path: `${out}/live-20-draft-restored.png` });
  putBody = null;
  await h.getByTestId('settings-save').click();
  await h.getByText('✓ נשמר בשרת').waitFor();
  ok(JSON.stringify(putBody) === JSON.stringify({ owner_name: 'אחרי שפג' }), 'שמירה אחרי שחזור שלחה: ' + JSON.stringify(putBody));
  ok((await api('/settings')).owner_name === 'אחרי שפג', 'השמירה אחרי השחזור לא נרשמה בשרת');
  // מעבר מסך רגיל (בלי סשן שפג) לא משחזר עריכה שננטשה
  await h.getByLabel('שם לחתימה').fill('ננטש');
  await h.goto(base + '/app/#/dashboard'); await h.goto(base + '/app/#/settings');
  await h.getByTestId('settings-save').waitFor();
  for (let i = 0; i < 50 && await h.getByLabel('שם לחתימה').inputValue() !== 'אחרי שפג'; i++) await h.waitForTimeout(100);
  ok(await h.getByLabel('שם לחתימה').inputValue() === 'אחרי שפג' && await h.getByTestId('settings-dirty').count() === 0, 'עריכה שננטשה במעבר מסך שוחזרה');
  ok((await fetch(base + '/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner_name: signBefore }) })).ok, 'החזרת ההגדרות למצב הקודם נכשלה');
  ok(hFail.length === 0, 'שלב 20: כשלים לא צפויים: ' + hFail.join(' | '));

  // 21) הפעלה 146: הטיוטה שייכת למי שהקליד אותה. הסשן פג באמצע עריכה, ועובד אחר נכנס באותה לשונית
  //     (‎/auth/me מחזיר זהות אחרת) ⇒ הוא רואה את ערכי השרת, בלי «החזרנו את מה שהקלדתם».
  await h.getByLabel('שם לחתימה').fill('טיוטה של עובד קודם');
  await inject(h, '**/settings', onPut(route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"unauthorized"}' })));
  await h.getByTestId('settings-save').click();
  await h.getByTestId('staff-login').waitFor();
  await h.unroute('**/settings');
  await inject(h, '**/auth/me', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ actor: 'user:99', kind: 'user', name: 'עובד אחר' }) }));
  await h.getByLabel('מייל').fill(STAFF.email);
  await h.getByLabel('סיסמה', { exact: true }).fill(STAFF.password);
  await h.getByLabel('קוד אימות').fill('123456');
  await h.getByTestId('staff-login').getByRole('button', { name: 'כניסה' }).click();
  if (!h.url().endsWith('#/settings')) { await h.getByTestId('staff-login').waitFor({ state: 'detached' }); await h.goto(base + '/app/#/settings'); }
  await h.locator('[data-testid="settings-live"][data-loaded="1"]').waitFor();
  ok((await h.getByTestId('whoami').textContent()).includes('עובד אחר'), 'שלב 21: הזהות האחרת לא נטענה (הבדיקה לא משחזרת עובד אחר)');
  ok(await h.getByLabel('שם לחתימה').inputValue() === signBefore, 'עובד אחר קיבל את הטיוטה של קודמו: ' + await h.getByLabel('שם לחתימה').inputValue());
  ok(await h.getByTestId('settings-dirty').count() === 0 && await h.getByTestId('settings-save').isDisabled(), 'עובד אחר רואה «שינויים שלא נשמרו» של קודמו');
  ok(hFail.join('|') === '401 PUT /settings', 'שלב 21: כשלים לא צפויים: ' + hFail.join(' | '));
  if (out) await h.screenshot({ path: `${out}/live-21-draft-other-user.png` });
  await h.unroute('**/auth/me');
  console.log('  ✓ טיוטת ההגדרות לא מוחזרת לעובד אחר שנכנס באותה לשונית');

  // 22) הפעלה 146: אישור שנרשם בשרת והתשובה שלו אבדה, ואז ניסיון חוזר ⇒ השרת עונה 409 «כבר אושרה» (X-Gabi-Already).
  //     הממשק מציג «כבר אושרה קודם» ולא «לא אושר», סוגר את החלון ומרענן. ביומן הביקורת אישור אחד בלבד.
  hFail.length = 0;
  await h.goto(base + '/app/#/dashboard');
  const items146 = h.locator('li', { has: h.getByRole('button', { name: 'תצוגה ואישור' }) });
  await items146.first().waitFor();
  const btn146 = h.getByRole('button', { name: /אשר ושלח/ });
  let opened146 = false;
  for (let i = 0; i < await items146.count() && !opened146; i++) {
    await items146.nth(i).getByRole('button', { name: 'תצוגה ואישור' }).click();
    await btn146.waitFor();
    await h.waitForFunction(() => /\/p\/\w+/.test(document.querySelector('textarea')?.value ?? ''), null, { timeout: 4000 }).catch(() => { /* חסומה: אין קישור */ });
    for (const t of ['confirm-open', 'confirm-amount']) if (await h.getByTestId(t).count()) await h.getByTestId(t).locator('input').check();
    if (await btn146.isEnabled()) opened146 = true; else await h.getByRole('button', { name: 'ביטול' }).click();
  }
  ok(opened146, 'שלב 22: אין בתור תזכורת שאפשר לאשר');
  let seen146 = null;
  await inject(h, '**/reminders/*/approve', async route => {
    const first = await route.fetch();                       // האישור נרשם בשרת; התשובה «אובדת»
    const second = await route.fetch();                      // הניסיון החוזר
    seen146 = { first: first.status(), status: second.status(), already: second.headers()['x-gabi-already'], rid: Number(route.request().url().match(/reminders\/(\d+)\/approve/)[1]) };
    await route.fulfill({ response: second });
  });
  await btn146.click();
  await h.getByText('כבר אושרה קודם').waitFor();
  ok(seen146 && seen146.first === 200 && seen146.status === 409 && seen146.already === 'approved', 'שלב 22: השרת לא ענה 409 «כבר אושרה»: ' + JSON.stringify(seen146));
  ok(!(await h.locator('body').textContent()).includes('לא אושר'), 'אישור שכבר נרשם מוצג כ«לא אושר»');
  ok(await btn146.count() === 0, 'אחרי «כבר אושרה» חלון התצוגה המקדימה נשאר פתוח');
  const aud146 = (await api('/audit')).filter(a => a.action === 'approve' && new RegExp(`"reminder": ${seen146.rid}\\b`).test(a.detail ?? ''));
  ok(aud146.length === 1, `שלב 22: ביומן הביקורת ${aud146.length} אישורים לתזכורת ${seen146.rid}`);
  ok(hFail.join('|') === `409 POST /reminders/${seen146.rid}/approve`, 'שלב 22: כשלים לא צפויים: ' + hFail.join(' | '));
  if (out) await h.screenshot({ path: `${out}/live-22-already-approved.png` });
  await h.unroute('**/reminders/*/approve');
  console.log('  ✓ אישור חוזר של תזכורת שכבר אושרה: 409 «כבר אושרה», מוצג כ«כבר אושרה קודם», אישור אחד ביומן');

  // 23) הפעלה 147: אותו כלל לטיוטת מענה. האישור נרשם, התשובה אבדה, ניסיון חוזר ⇒ 409 + X-Gabi-Already מהשרת האמיתי.
  //     הממשק מציג «כבר אושר קודם» (לא שגיאה בכרטיס), הכרטיס יורד מהתור, ביומן אישור אחד והודעה אחת יצאה.
  hFail.length = 0;
  await h.goto(base + '/app/#/dashboard');
  await h.getByLabel('לקוח').selectOption({ label: 'דנה לוי (דמו)' });
  await h.getByRole('button', { name: 'איך אפשר לשלם?' }).click();
  await h.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
  await h.getByTestId('reply-result').waitFor();
  await h.goto(base + '/app/#/inbox');
  const card147 = h.getByTestId('drafts').locator('li', { hasText: 'דנה' }).first();
  await card147.waitFor();
  const ob147 = (await api('/outbox')).messages.length;
  let seen147 = null;
  await inject(h, '**/conversation/drafts/*/approve', async route => {
    const first = await route.fetch();
    const second = await route.fetch();
    seen147 = { first: first.status(), status: second.status(), already: second.headers()['x-gabi-already'], did: Number(route.request().url().match(/drafts\/(\d+)\/approve/)[1]) };
    await route.fulfill({ response: second });
  });
  if (await card147.getByTestId('draft-confirm-amount').count()) await card147.getByTestId('draft-confirm-amount').locator('input').check();
  if (!(await card147.locator('textarea').inputValue()).trim()) await card147.locator('textarea').fill('תודה על הפנייה, נחזור אליך בהקדם.');
  await card147.getByRole('button', { name: 'אשר ושלח' }).click();
  await h.getByText('המענה הזה כבר אושר קודם').waitFor();
  ok(seen147 && seen147.first === 200 && seen147.status === 409 && seen147.already === 'approved', 'שלב 23: השרת לא ענה 409 «כבר אושרה»: ' + JSON.stringify(seen147));
  ok(await h.getByRole('alert').count() === 0, 'שלב 23: אישור שכבר נרשם מוצג כשגיאה בכרטיס');
  ok(!(await api('/conversation/drafts')).some(d => d.id === seen147.did), 'שלב 23: הטיוטה נשארה בתור');
  ok((await api('/outbox')).messages.length === ob147 + 1, 'שלב 23: לא יצאה בדיוק הודעה אחת');
  const aud147 = (await api('/audit')).filter(a => a.action === 'draft_approved' && new RegExp(`"draft": ${seen147.did}\\b`).test(a.detail ?? ''));
  ok(aud147.length === 1, `שלב 23: ביומן הביקורת ${aud147.length} אישורים לטיוטה ${seen147.did}`);
  ok(hFail.join('|') === `409 POST /conversation/drafts/${seen147.did}/approve`, 'שלב 23: כשלים לא צפויים: ' + hFail.join(' | '));
  if (out) await h.screenshot({ path: `${out}/live-23-already-draft.png` });
  await h.unroute('**/conversation/drafts/*/approve');
  console.log('  ✓ אישור חוזר של מענה שכבר אושר: 409 «כבר אושרה», מוצג כ«כבר אושר קודם», אישור אחד והודעה אחת');
  // 24) הפעלה 148: אותו כלל להצעת פריסה. האישור נרשם, התשובה אבדה, ניסיון חוזר ⇒ 409 + X-Gabi-Already מהשרת האמיתי.
  //     הממשק מציג «הצעת הפריסה הזו כבר אושרה קודם» (לא «לא בוצע»), ההצעה יורדת מהרשימה, אישור אחד ביומן והודעה אחת ללקוח.
  hFail.length = 0;
  await h.goto(base + '/app/#/dashboard');
  const before148 = new Set((await api('/plans')).map(x => x.id));
  // לקוח שעוד אין לו הצעה: מנסים את לקוחות הדמו לפי הסדר עד שנוצרת הצעת פריסה חדשה בשרת
  const names148 = await h.getByLabel('לקוח').locator('option').allTextContents();
  let pid148 = null;
  for (const label of names148) {
    if (!label.trim()) continue;
    await h.getByLabel('לקוח').selectOption({ label });
    await h.getByRole('button', { name: 'אפשר ב-3 תשלומים?' }).click();
    await h.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
    await h.getByTestId('reply-result').waitFor();
    const fresh = (await api('/plans')).find(x => x.status === 'proposed' && !before148.has(x.id));
    if (fresh) { pid148 = fresh.id; break; }
  }
  ok(pid148 !== null, 'שלב 24: לא נוצרה הצעת פריסה חדשה לאף לקוח דמו');
  await h.goto(base + '/app/#/dashboard');
  const plan148 = h.getByTestId('needs-you').locator('li', { hasText: 'הצעת פריסה' }).first();
  await plan148.waitFor();
  const ob148 = (await api('/outbox')).messages.length;
  let seen148 = null;
  await inject(h, '**/plans/*/approve', async route => {
    const first = await route.fetch();                       // האישור נרשם בשרת; התשובה «אובדת»
    const second = await route.fetch();                      // הניסיון החוזר
    seen148 = { first: first.status(), status: second.status(), already: second.headers()['x-gabi-already'], pid: Number(route.request().url().match(/plans\/(\d+)\/approve/)[1]) };
    await route.fulfill({ response: second });
  });
  if (await plan148.getByTestId('plan-confirm-amount').count()) await plan148.getByTestId('plan-confirm-amount').locator('input').check();
  await plan148.getByRole('button', { name: /אישור ההצעה/ }).click();
  await plan148.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
  await h.getByText('הצעת הפריסה הזו כבר אושרה קודם').waitFor();
  ok(seen148 && seen148.first === 200 && seen148.status === 409 && seen148.already === 'approved', 'שלב 24: השרת לא ענה 409 «כבר אושרה»: ' + JSON.stringify(seen148));
  ok(!(await h.locator('body').textContent()).includes('לא בוצע'), 'שלב 24: אישור שכבר נרשם מוצג כ«לא בוצע»');
  ok((await api('/plans')).find(x => x.id === seen148.pid)?.status === 'approved', 'שלב 24: ההצעה לא מאושרת בשרת');
  await h.waitForFunction(() => !document.querySelector('[data-testid="needs-you"]')?.textContent.includes('הצעת פריסה'));
  ok((await api('/outbox')).messages.length === ob148 + 1, `שלב 24: לא יצאה בדיוק הודעה אחת (${ob148}→${(await api('/outbox')).messages.length})`);
  const aud148 = (await api('/audit')).filter(a => new RegExp(`"plan": ${seen148.pid}\\b`).test(a.detail ?? '') && a.action === 'plan_approved');
  ok(aud148.length === 1, `שלב 24: ביומן הביקורת ${aud148.length} אישורים להצעה ${seen148.pid}`);
  ok(hFail.join('|') === `409 POST /plans/${seen148.pid}/approve`, 'שלב 24: כשלים לא צפויים: ' + hFail.join(' | '));
  if (out) await h.screenshot({ path: `${out}/live-24-already-plan.png` });
  await h.unroute('**/plans/*/approve');
  console.log('  ✓ אישור חוזר של הצעת פריסה שכבר אושרה: 409 «כבר אושרה», מוצג כ«כבר אושרה קודם», אישור אחד והודעה אחת');
  await h.context().close();
  console.log('  ✓ סשן שפג באמצע עריכת הגדרות: אחרי כניסה מחדש ההקלדה חוזרת, מסומנת כלא שמורה, ונשמרת; מעבר מסך רגיל לא משחזר');
  failPhase = false;
  ok(consoleFail >= 4, `שגיאות הקונסולה של הכשל המכוון לא נספרו (${consoleFail})`);

  // מסך הכניסה במובייל (לשונית חדשה בלי סשן ⇒ מסך הכניסה, בלי בקשות שנכשלות)
  const ml = await b.newPage({ viewport: { width: 390, height: 844 } });
  ml.on('pageerror', e => errors.push(String(e)));
  ml.on('console', x => x.type() === 'error' && errors.push('login-mobile: ' + x.text()));
  await ml.goto(base + '/app/#/invoices'); await ml.getByTestId('staff-login').waitFor();
  await noHScroll(ml, 'מסך כניסה מובייל');
  if (out) await ml.screenshot({ path: `${out}/web-login-mobile.png`, fullPage: true });
  await ml.close();
  ok(console429 === allowed429.length, `שגיאות 429 בקונסולה (${console429}) ≠ מאומתות (${allowed429.length})`);
  ok(console401 === allowed401.length, `שגיאות 401 בקונסולה (${console401}) ≠ 401 מאומתים (${allowed401.length})`);
  ok(console409 === allowed409.length, `שגיאות 409/422 בקונסולה (${console409}) ≠ מאומתות (${allowed409.length})`);
  errors.push(...routeErrors);
  if (errors.length) throw new Error('שגיאות:\n' + errors.join('\n'));
  console.log(`✓ דמו חי מקצה לקצה עבר · שגיאות צפויות שאומתו: ${allowed409.join(' | ')} · 0 שגיאות אחרות`);
} finally { await b.close(); srv.kill(); }
