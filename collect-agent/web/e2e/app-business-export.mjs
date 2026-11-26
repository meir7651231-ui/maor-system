// גבי QA (מנהל 436, «הבא» של QA מאז 434): «⬇ ייצוא כל הנתונים» (מנהל 429, TERMS §9 / DPA 4.3) — הורדה אמיתית בדפדפן.
// עד היום: pytest על GET /export (tests/test_mgr429_business_export.py) + ספירת תג «בעל העסק בלבד» ב-app-staff-settings.
// הכפתור עצמו — ההורדה, שם הקובץ, התוכן מול השרת, הטוסט והרישום ביומן — לא נבדק מעולם בדפדפן.
// שרת גבי אמיתי (DEMO=1, dry-run), בלי יירוט:
//  1) בעל העסק (טוקן משותף), דסקטופ + 390px: לחיצה ⇒ קובץ `gabi-business-export-YYYY-MM-DD.json` (ASCII) ·
//     JSON תקין עם 11 הטבלאות + generated_at + note · מספר השורות בכל טבלה = מה שנרשם ביומן (`business_export`) ·
//     לקוחות/חשבוניות = /dashboard · בלי unsub_token / blocked_* / payload / to_addr ובלי טוקן הבעלים ·
//     יומן הביקורת בקובץ מלא (לא 200 אחרונות) · טוסט «הקובץ ירד» · הכפתור חוזר לפעיל · 390px בלי גלילה רוחבית.
//  2) עובדת מחוברת (סיסמה+TOTP): במקום הכפתור «רק בעל העסק מייצא…», אין כפתור · GET /export בטוקן שלה ⇒ 403
//     ו-`business_export_refused` נרשם (התנהגות השרת — המסך לא הסתיר רק בצד הלקוח).
//  · 0 שגיאות קונסולה / pageerror / תשובות ≥400 בדפדפן.
// דרישה: npm run build. הרצה: node e2e/app-business-export.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree, tempDir } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8264, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const USER = { email: 'demo-export@biz.example', password: 'demo-export-password-1', secretFile: join(tempDir('gabi-e2e-'), 'totp') };
const TABLES = ['customers', 'invoices', 'reminders', 'reminder_invoices', 'plans', 'messages', 'drafts', 'dsr',
  'business_settings', 'access_log', 'audit'];
const HIDDEN = { customers: ['unsub_token', 'blocked_phone', 'blocked_email'], reminders: ['payload'], messages: ['payload'], drafts: ['to_addr'] };
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT),
    DEMO_USER_EMAIL: USER.email, DEMO_USER_PASSWORD: USER.password, DEMO_USER_SECRET_FILE: USER.secretFile,
    DEMO_STAFF_EMAIL: 'demo-export2@biz.example', DEMO_STAFF_PASSWORD: 'demo-export2-password-1' }, stdio: srvStdio('server-business-export') });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async (p, h = H) => { const r = await fetch(base + p, { headers: h }); ok(r.ok, `GET ${p}: ${r.status}`); return r.json(); };
const auditAll = async () => { const x = await api('/audit?all=1'); return Array.isArray(x) ? x : x.items || []; };
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  USER.secretFile], { cwd: root }).toString().trim();
const b = await launchChromium(chromium); const errors = [];
const watch = (p, name) => {
  p.on('pageerror', e => errors.push(`${name} pageerror: ${e.message}`));
  p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(`${name} console: ${m.text()}`));
  p.on('response', r => { if (r.status() >= 400) errors.push(`${name} ${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
};
try {
  await waitHealthy(base, srv);
  const dash = await api('/dashboard');
  ok(dash.invoices.length >= 5, `נתוני דמו: ${dash.invoices.length} חשבוניות`);

  // 1) בעל העסק — דסקטופ + 390px
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, acceptDownloads: true });
    const p = await ctx.newPage(); watch(p, name);
    await p.goto(`${base}/app/#/settings?token=${TOKEN}`);
    await p.waitForSelector('[data-testid="settings-live"][data-loaded="1"]');
    const card = p.getByTestId('business-export');
    await card.scrollIntoViewIfNeeded();
    ok(await card.getByTestId('business-export-owner-only').count() === 0, `${name}: בעלים רואה «רק בעל העסק»`);
    const btn = card.getByTestId('business-export-btn');
    ok(await btn.isEnabled(), `${name}: הכפתור כבוי לבעלים`);
    const bb = await btn.boundingBox();
    ok(bb && bb.height >= 40 && bb.x >= 0 && bb.x + bb.width <= vp.width, `${name}: הכפתור קטן/מחוץ למסך ${JSON.stringify(bb)}`);
    const nBefore = (await auditAll()).filter(a => a.action === 'business_export').length;
    const [dl] = await Promise.all([p.waitForEvent('download'), btn.click()]);
    const fn = dl.suggestedFilename();
    ok(/^gabi-business-export-\d{4}-\d{2}-\d{2}\.json$/.test(fn), `${name}: שם הקובץ ${fn}`);
    const raw = readFileSync(await dl.path(), 'utf8');
    const got = JSON.parse(raw);
    for (const t of TABLES) ok(Array.isArray(got[t]), `${name}: חסרה טבלה ${t}`);
    ok(typeof got.generated_at === 'string' && typeof got.note === 'string', `${name}: חסרים generated_at/note`);
    // הקובץ = מה שהשרת הפיק באותה לחיצה: הספירות ביומן (נכתבות אחרי ההפקה) תואמות לקובץ
    const exp = (await auditAll()).filter(a => a.action === 'business_export');
    ok(exp.length === nBefore + 1, `${name}: נרשמו ${exp.length - nBefore} ייצואים ביומן (ציפיתי 1)`);
    const counts = JSON.parse(exp[0].detail || '{}');
    for (const t of TABLES) ok(counts[t] === got[t].length, `${name}: ${t} — בקובץ ${got[t].length}, ביומן ${counts[t]}`);
    ok(exp[0].actor !== undefined, `${name}: ביומן אין actor`);
    // תוכן: לקוחות/חשבוניות מול השרת
    ok(got.invoices.length === dash.invoices.length, `${name}: חשבוניות ${got.invoices.length} ≠ ${dash.invoices.length}`);
    const custNames = new Set(got.customers.map(c => c.name));
    for (const i of dash.invoices) ok(custNames.has(i.customer) || [...custNames].some(n => n && i.customer.startsWith(n)), `${name}: הלקוח «${i.customer}» חסר בקובץ`);
    // מה שאסור שיהיה בקובץ
    for (const [t, cols] of Object.entries(HIDDEN)) for (const row of got[t]) for (const c of cols) ok(!(c in row), `${name}: ${t}.${c} בקובץ`);
    ok(!raw.includes(TOKEN), `${name}: טוקן הבעלים בקובץ`);
    ok(!/unsub_token|totp_secret|password_hash/.test(raw), `${name}: סוד/טוקן בקובץ`);
    // יומן מלא — לא חתוך ל-200; ה-audit בקובץ מכיל את כל מה שהיה לפני הייצוא הזה
    const fullBefore = (await auditAll()).filter(a => a.id < exp[0].id);
    ok(got.audit.length === fullBefore.length, `${name}: audit בקובץ ${got.audit.length}, ביומן לפני הייצוא ${fullBefore.length}`);
    // מסך: טוסט, הכפתור חוזר
    await p.getByText('הקובץ ירד — כל נתוני העסק ויומן הביקורת המלא').waitFor();
    await p.waitForFunction(() => { const x = document.querySelector('[data-testid="business-export-btn"]'); return x && !x.disabled && /ייצוא כל הנתונים/.test(x.textContent); });
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    if (out) await p.screenshot({ path: `${out}/app-business-export-${name}.png`, fullPage: false });
    console.log(`  ✓ ${name}: ${fn} — ${TABLES.map(t => `${t}:${got[t].length}`).join(' ')}`);
    await ctx.close();
  }

  // 2) עובדת מחוברת — אין כפתור, והשרת מסרב
  const users = (await api('/team')).users;
  const me = users.find(u => u.email === USER.email), other = users.find(u => u.email === 'demo-export2@biz.example');
  ok(me?.role === 'owner' && other?.role === 'staff', 'צוות הדמו לא נוצר: ' + JSON.stringify(users));
  for (const [id, role] of [[other.id, 'owner'], [me.id, 'staff']]) {
    const r = await fetch(`${base}/team/${id}/role`, { method: 'POST', headers: H, body: JSON.stringify({ role }) });
    ok(r.ok, `שינוי תפקיד ${id}⇒${role}: ${r.status} ${await r.text()}`);
  }
  const lr = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER.email, password: USER.password, code: totpCode() }) });
  ok(lr.ok, `כניסת עובדת: ${lr.status} ${await lr.clone().text()}`);
  const staffTok = (await lr.json()).token;
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); watch(p, 'staff');
    await p.goto(`${base}/app/#/settings?token=${staffTok}`);
    await p.waitForSelector('[data-testid="settings-live"][data-loaded="1"]');
    const card = p.getByTestId('business-export');
    await card.getByTestId('business-export-owner-only').waitFor();
    ok(await card.getByTestId('business-export-btn').count() === 0, 'עובדת רואה כפתור ייצוא');
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'staff: גלילה רוחבית');
    if (out) await p.screenshot({ path: `${out}/app-business-export-staff.png`, fullPage: false });
    await ctx.close();
  }
  const refusedBefore = (await auditAll()).filter(a => a.action === 'business_export_refused').length;
  const r403 = await fetch(`${base}/export`, { headers: { Authorization: `Bearer ${staffTok}` } });
  ok(r403.status === 403, `GET /export כעובדת: ${r403.status}`);
  ok((await auditAll()).filter(a => a.action === 'business_export_refused').length === refusedBefore + 1, 'הסירוב לא נרשם ביומן');
  console.log('  ✓ עובדת: «רק בעל העסק מייצא», אין כפתור, GET /export ⇒ 403 ונרשם');

  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ app-business-export: הורדה אמיתית (דסקטופ+390) = מה שהשרת הפיק, בלי סודות, יומן מלא; עובדת ⇒ אין כפתור + 403, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
