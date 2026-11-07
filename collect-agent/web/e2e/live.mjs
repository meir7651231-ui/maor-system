// דמו מקצה לקצה בדפדפן: שרת גבי אמיתי (DEMO=1, dry-run) + הממשק המעוצב מ-/app/.
// דרישה: npm run build. הרצה: node e2e/live.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8141, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url'); // קוד גישה חד-פעמי לבדיקה (השרת דורש 32+ תווים)
const ROOT = new URL('../..', import.meta.url).pathname;
// שער 6: עובד דמו אמיתי (מייל+סיסמה+סוד TOTP בקובץ זמני) — כמו demo.sh --check, רק דרך הדפדפן
const STAFF = { email: 'dana@example.co.il', password: 'demo-pass-12345', secretFile: join(mkdtempSync(join(tmpdir(), 'gabi-e2e-')), 'totp') };
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', 'warning'],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN,
    DEMO_USER_EMAIL: STAFF.email, DEMO_USER_PASSWORD: STAFF.password, DEMO_USER_SECRET_FILE: STAFF.secretFile }, stdio: 'ignore' });
// קוד ה-TOTP נגזר משעון הדמו הקבוע (app/demo.py DEMO_NOW) ומאותו מימוש בשרת (app/totp.py)
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  STAFF.secretFile], { cwd: ROOT }).toString().trim();
const ok = (c, m) => { if (!c) throw new Error(m); };
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
let gatePhase = true;         // 401 מותר רק בשלב שער קוד הגישה (לפני כניסה), ורק מהשרת שלנו
const allowed401 = [];
const allowed429 = [];        // 429 מותר רק בבדיקת הנעילה של מסך הכניסה (שלב השער)
const allowed409 = [];        // תגובות 409 שאומתו
const errors = [];
const b = await chromium.launch();
try {
  const ctx = await b.newContext();
  const p = await ctx.newPage();
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
  ok(await items.count() === 2, `ציפיתי ל-2 בתור, יש ${await items.count()}`);
  ok(await p.getByText('אין נייד או מייל תקין').count() >= 1, 'החסימה no_contact לא מוצגת');
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
  await p.waitForFunction(() => [...document.querySelectorAll('button')].filter(x => x.textContent === 'תצוגה ואישור').length === 1);
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
  expect409 = { url: /\/conversation\/drafts\/\d+\/approve$/, reason: /marketing/ };
  await card.getByRole('button', { name: 'אשר ושלח' }).click();
  await card.getByRole('alert').waitFor();
  ok(/תוכן שיווקי/.test(await card.getByRole('alert').textContent()), 'הסבר דחיית המסנן לא תורגם לבעל העסק');
  ok(allowed409.length === 1 && expect409 === null, 'הדחייה לא הגיעה כ-409 המצופה (בקשה+סיבה)');
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
  await p.getByTestId('settings-live').waitFor();
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
  await p.route('**/dashboard', async route => {
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
  await p.goto(base + '/app/#/invoices');
  await p.getByText('דנה לוי').first().waitFor();
  ok(await p.locator('tbody tr').count() === 6, 'ציפיתי ל-6 חשבוניות פתוחות (5 + אחת מ-CSV)');

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
  if (errors.length) throw new Error('שגיאות:\n' + errors.join('\n'));
  console.log(`✓ דמו חי מקצה לקצה עבר · שגיאות צפויות שאומתו: ${allowed409.join(' | ')} · 0 שגיאות אחרות`);
} finally { await b.close(); srv.kill(); }
