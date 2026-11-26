// מבקר 194 (תיקון מנהל 345): מסך ההגדרות ב-/app/ כעובדת מחוברת (לא בעלת העסק) מול שרת גבי אמיתי (DEMO=1, dry-run).
// שדות בעל העסק (פרטי העסק, מקור החשבוניות, שולח SMS, קישור תשלום) נעולים ומסומנים «בעל העסק בלבד», «שמירה» כבויה —
// והעובדת לא מגלה את זה רק ב-403 בשמירה. בעל העסק (טוקן משותף) רואה את אותו מסך פתוח. דסקטופ + 390px, אפס שגיאות.
// איך מגיעים לעובדת עם TOTP: עובד הדמו (DEMO_USER_EMAIL, הסוד בקובץ) נוצר בעלים ⇒ ממנים את עובדת הדמו (DEMO_STAFF)
// לבעלים ומורידים את עובד הדמו לעובד ⇒ נכנסים כעובד הדמו (סיסמה+TOTP) ⇒ טוקן עובד.
// דרישה: npm run build. הרצה: node e2e/app-staff-settings.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree, tempDir } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8174, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const USER = { email: 'demo-staffset@biz.example', password: 'demo-staffset-password-1', secretFile: join(tempDir('gabi-e2e-'), 'totp') };
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT),
    DEMO_USER_EMAIL: USER.email, DEMO_USER_PASSWORD: USER.password, DEMO_USER_SECRET_FILE: USER.secretFile,
    DEMO_STAFF_EMAIL: 'demo-staff2@biz.example', DEMO_STAFF_PASSWORD: 'demo-staff2-password-1' }, stdio: srvStdio('server-staff-settings') });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  USER.secretFile], { cwd: root }).toString().trim();
// מבקר 261: מנהל 429 הוסיף כרטיס «ייצוא כל הנתונים» עם תג בעלים (עובד/ת לא מייצא/ת) — 5 תגים
const LOCKED = ['פרטי העסק', 'מאיפה מגיעות החשבוניות', 'ערוצי שליחה', 'קישור לתשלום', 'ייצוא כל הנתונים'];
const b = await launchChromium(chromium); const errors = [];
try {
  await waitHealthy(base, srv);
  const users = (await (await fetch(`${base}/team`, { headers: H })).json()).users;
  const me = users.find(u => u.email === USER.email), other = users.find(u => u.email === 'demo-staff2@biz.example');
  ok(me?.role === 'owner' && other?.role === 'staff', 'צוות הדמו לא נוצר: ' + JSON.stringify(users));
  for (const [id, role] of [[other.id, 'owner'], [me.id, 'staff']]) {
    const r = await fetch(`${base}/team/${id}/role`, { method: 'POST', headers: H, body: JSON.stringify({ role }) });
    ok(r.ok, `שינוי תפקיד ${id}⇒${role}: ${r.status} ${await r.text()}`);
  }
  const lr = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER.email, password: USER.password, code: totpCode() }) });
  ok(lr.ok, `כניסת עובד: ${lr.status} ${await lr.clone().text()}`);
  const staffTok = (await lr.json()).token;
  const before = await (await fetch(`${base}/settings`, { headers: H })).json();
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    // עובדת
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(String(e)));
    p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
    await p.goto(`${base}/app/#/settings?token=${staffTok}`);
    await p.waitForSelector('[data-testid="settings-live"][data-loaded="1"]');
    await p.getByTestId('settings-owner-only').waitFor();
    ok(await p.getByTestId('owner-only-badge').count() === LOCKED.length, `${name}: מספר תגי «בעל העסק בלבד»`);
    for (const lbl of ['שם העסק (פותח כל הודעה)', 'שם לחתימה', 'ע.מ. / ח.פ.', 'מייל לתשובות לקוחות', 'שם השולח ב-SMS']) {
      ok(await p.getByLabel(lbl).isDisabled(), `${name}: «${lbl}» פתוח לעריכה לעובדת`);
    }
    ok(await p.getByLabel('כתובת עמוד התשלום').isDisabled(), `${name}: קישור התשלום פתוח לעובדת`);
    for (const r of await p.getByRole('radio').all()) ok(await r.isDisabled(), `${name}: בורר פתוח לעובדת (${await r.textContent()})`);
    ok(await p.getByTestId('settings-save').isDisabled(), `${name}: «שמירה» פעילה לעובדת`);
    ok(await p.getByLabel('קובץ CSV').isEnabled(), `${name}: ייבוא CSV ננעל לעובדת (מותר לה)`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    if (out) await p.screenshot({ path: `${out}/app-staff-settings-${name}.png`, fullPage: true });
    await p.close();
    // בעל העסק (טוקן משותף) — אותו מסך פתוח
    const q = await b.newPage({ viewport: vp });
    q.on('pageerror', e => errors.push(String(e)));
    await q.goto(`${base}/app/#/settings?token=${TOKEN}`);
    await q.waitForSelector('[data-testid="settings-live"][data-loaded="1"]');
    ok(await q.getByTestId('settings-owner-only').count() === 0 && await q.getByTestId('owner-only-badge').count() === 0, `${name}: בעלים רואה נעילה`);
    ok(await q.getByLabel('מייל לתשובות לקוחות').isEnabled(), `${name}: בעלים לא יכול לערוך`);
    await q.close();
  }
  const after = await (await fetch(`${base}/settings`, { headers: H })).json();
  ok(JSON.stringify(before) === JSON.stringify(after), 'ההגדרות בשרת השתנו במהלך המסע');
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ app-staff-settings: עובדת רואה שדות בעלים נעולים ומסומנים (דסקטופ+390), בעלים רואה פתוח, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
