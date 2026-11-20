// גבי עיצוב (מבקר 195ג + הכרעת ראש צוות): פעולות של בעל העסק בלבד מסומנות לעובד/ת מראש — נעול + «🔒 בעל העסק בלבד»,
// באותו דפוס של מסך ההגדרות (194): «↻ חידוש» על השהיית-בעלים (קטין), «⬇ ייצוא מידע», סגירת בקשת **מחיקה** במרשם.
// מול שרת DEMO=1: עובדת אמיתית (סשן /auth/login) ⇒ /app/ (בית, חשבוניות, תשובות) ו-/ui נעולים + תג; השרת מחזיר 403
// גם אם עוקפים את המסך; בעלים (קוד בעלים) ⇒ פתוח. עיון — עובדת עדיין סוגרת. AA, 390px, 0 שגיאות, צילומים.
// משלים את app-staff-owner-only.mjs (גבי מנוע): גם מרשם DSR (סגירת מחיקה) ו-/ui.
// דרישה: npm run build. הרצה: node e2e/app-staff-owner-only-full.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree, tempDir } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8177, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const USER = { email: 'demo-staffonly@biz.example', password: 'demo-staffonly-password-1', secretFile: join(tempDir('gabi-e2e-'), 'totp') };
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT),
    DEMO_USER_EMAIL: USER.email, DEMO_USER_PASSWORD: USER.password, DEMO_USER_SECRET_FILE: USER.secretFile,
    DEMO_STAFF_EMAIL: 'demo-staff3@biz.example', DEMO_STAFF_PASSWORD: 'demo-staff3-password-1' }, stdio: srvStdio('server-staff-owner-only-full') });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  USER.secretFile], { cwd: root }).toString().trim();
const b = await launchChromium(chromium); const errors = [];
const allowed = [];   // 403 צפוי בבדיקת העקיפה בלבד
try {
  await waitHealthy(base, srv);
  // עובד הדמו ⇒ staff, עובד שני ⇒ owner (כמו app-staff-settings)
  const users = (await (await fetch(`${base}/team`, { headers: H })).json()).users;
  const me = users.find(u => u.email === USER.email), other = users.find(u => u.email === 'demo-staff3@biz.example');
  for (const [id, role] of [[other.id, 'owner'], [me.id, 'staff']]) {
    const r = await fetch(`${base}/team/${id}/role`, { method: 'POST', headers: H, body: JSON.stringify({ role }) });
    ok(r.ok, `שינוי תפקיד ${id}⇒${role}: ${r.status} ${await r.text()}`);
  }
  // בעלים מסמן השהיית קטין על לקוח עם חשבונית פתוחה + שתי בקשות פרטיות: מחיקה ועיון
  const dash = await (await fetch(`${base}/dashboard`, { headers: H })).json();
  const row = dash.invoices.find(r => r.status === 'open' && !r.paused_reason);
  ok(row, 'אין לקוח פתוח להשהיה');
  ok((await fetch(`${base}/customers/${row.customer_id}/hold`, { method: 'POST', headers: H, body: JSON.stringify({ reason: 'minor', note: 'קטין לפי הורה' }) })).ok, 'השהיית קטין נכשלה');
  const dsr = async kind => (await (await fetch(`${base}/customers/${row.customer_id}/dsr`, { method: 'POST', headers: H, body: JSON.stringify({ kind, note: 'בדיקת e2e' }) })).json()).id;
  const delId = await dsr('deletion'), accId = await dsr('access');
  const lr = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER.email, password: USER.password, code: totpCode() }) });
  ok(lr.ok, `כניסת עובדת: ${lr.status}`);
  const staffTok = (await lr.json()).token, SH = { Authorization: `Bearer ${staffTok}`, 'Content-Type': 'application/json' };
  // השרת אוכף גם בלי המסך
  ok((await fetch(`${base}/customers/${row.customer_id}/data`, { headers: SH })).status === 403, 'ייצוא כעובדת לא נחסם בשרת');
  ok((await fetch(`${base}/customers/${row.customer_id}/resume`, { method: 'POST', headers: SH })).status === 403, 'חידוש קטין כעובדת לא נחסם');
  ok((await fetch(`${base}/dsr/${delId}/done`, { method: 'POST', headers: SH, body: JSON.stringify({ note: 'נמחק לגמרי' }) })).status === 403, 'סגירת מחיקה כעובדת לא נחסמה');

  const watch = p => {
    p.on('pageerror', e => errors.push(String(e)));
    p.on('console', m => m.type() === 'error' && !/fonts\.g|403/.test(m.text()) && errors.push(m.text()));
    p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  };
  const aa = async (p, where) => { const { fails } = await scan(p); ok(!fails.length, `ניגודיות < AA ב-${where}: ` + JSON.stringify(fails.slice(0, 3))); };
  const noH = async (p, where) => ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `גלילה רוחבית: ${where}`);
  const ctxFor = async (vp, tok) => { const c = await b.newContext({ viewport: vp }); await c.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, tok); return c; };

  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await ctxFor(vp, staffTok); const p = await ctx.newPage(); watch(p);
    // בית: «חידוש» על השהיית קטין — נעול + תג
    await p.goto(`${base}/app/#/dashboard`);
    const ro = p.getByTestId('resume-locked').first(); await ro.waitFor();
    ok(await ro.getByRole('button', { name: '↻ חידוש תזכורות' }).isDisabled(), `${name}: «חידוש» לא נעול לעובדת`);
    ok(/בעל העסק בלבד/.test(await ro.getByTestId('owner-only-badge').textContent()), `${name}: אין תג בעל העסק`);
    ok(await ro.locator('xpath=ancestor::li[1]').getByTestId('resume-warning').count() === 0, `${name}: אזהרת «חדשו רק אחרי שבדקתם» לעובדת שלא יכולה לחדש`);
    await aa(p, `בית ${name}`); await noH(p, `בית ${name}`);
    if (out) await ro.locator('xpath=ancestor::li[1]').screenshot({ path: `${out}/staff-owner-only-resume-${name}.png` });
    // חשבוניות: ייצוא — נעול + תג, אין כפתור פעיל
    await p.goto(`${base}/app/#/invoices`);
    await p.getByTestId('data-export-owner-only').first().waitFor();
    ok(await p.getByTestId('data-export').count() === 0, `${name}: כפתור ייצוא פעיל לעובדת`);
    ok(await p.getByTestId('data-export-owner-only').first().locator('button').isDisabled(), `${name}: ייצוא לא נעול`);
    await aa(p, `חשבוניות ${name}`); await noH(p, `חשבוניות ${name}`);
    if (out) await p.getByTestId('data-export-owner-only').first().locator('xpath=ancestor::td[1]').screenshot({ path: `${out}/staff-owner-only-export-${name}.png` });
    // תשובות: מרשם — מחיקה נעולה + תג, עיון פתוח (אחרי תיעוד)
    await p.goto(`${base}/app/#/inbox`);
    await p.getByTestId('dsr-row').first().waitFor();
    const rows = p.getByTestId('dsr-row');
    const del = rows.filter({ hasText: 'מחיקת מידע' }).first(), acc = rows.filter({ hasText: 'עיון במידע' }).first();
    await del.getByTestId('dsr-note').fill('נמחק מכל המערכות');
    ok(await del.getByTestId('dsr-close').isDisabled() && await del.getByTestId('dsr-owner-badge').count() === 1, `${name}: סגירת מחיקה לא נעולה/בלי תג`);
    await acc.getByTestId('dsr-note').fill('נשלח עותק במייל');
    ok(!(await acc.getByTestId('dsr-close').isDisabled()) && await acc.getByTestId('dsr-owner-badge').count() === 0, `${name}: עיון ננעל בטעות`);
    await aa(p, `מרשם ${name}`); await noH(p, `מרשם ${name}`);
    if (out) await del.screenshot({ path: `${out}/staff-owner-only-dsr-${name}.png` });
    // /ui: במקום «חידוש» — «🔒 רק בעל העסק מחדש» (תיקון 9bd99cb2), סגירת מחיקה נעולה + תג
    await p.goto(`${base}/ui`);
    const ur = p.locator('#debts [data-testid="resume-owner-only"]').first(); await ur.waitFor();
    ok(/בעל העסק/.test(await ur.textContent()), `${name}: /ui בלי «רק בעל העסק»`);
    const udel = p.locator('#dsList li', { hasText: 'מחיקת מידע' }).first(); await udel.locator('textarea').fill('נמחק מכל המערכות');
    ok(await udel.locator('[data-a="done"]').isDisabled() && await udel.locator('[data-testid="dsr-owner-only"]').count() === 1, `${name}: /ui סגירת מחיקה לא נעולה`);
    const uacc = p.locator('#dsList li', { hasText: 'עיון במידע' }).first(); await uacc.locator('textarea').fill('נשלח עותק במייל');
    ok(!(await uacc.locator('[data-a="done"]').isDisabled()), `${name}: /ui עיון ננעל בטעות`);
    await aa(p, `/ui ${name}`); await noH(p, `/ui ${name}`);
    if (out) await udel.screenshot({ path: `${out}/staff-owner-only-ui-${name}.png` });
    await ctx.close();
  }
  // בעלים: הכול פתוח
  const ctx = await ctxFor({ width: 1366, height: 900 }, TOKEN); const p = await ctx.newPage(); watch(p);
  await p.goto(`${base}/app/#/dashboard`); await p.getByTestId('kpis').waitFor();
  await p.getByRole('button', { name: '↻ חידוש תזכורות' }).first().waitFor();
  ok(await p.getByTestId('resume-locked').count() === 0 && !(await p.getByRole('button', { name: '↻ חידוש תזכורות' }).first().isDisabled()), 'בעלים: חידוש נעול');
  await p.goto(`${base}/app/#/invoices`); await p.getByTestId('data-export').first().waitFor();
  ok(await p.getByTestId('data-export-owner-only').count() === 0, 'בעלים: ייצוא נעול');
  await p.goto(`${base}/app/#/inbox`); await p.getByTestId('dsr-row').first().waitFor();
  ok(await p.getByTestId('dsr-owner-badge').count() === 0, 'בעלים: סגירת מחיקה נעולה');
  await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ בעל העסק בלבד: עובדת רואה «חידוש» (קטין), «ייצוא» וסגירת מחיקה נעולים + «🔒 בעל העסק בלבד» ב-/app/ וב-/ui (דסקטופ+390), עיון פתוח, השרת 403 בעקיפה, בעלים פתוח, AA, 0 שגיאות');
} finally { await b.close(); srv.kill(); }
