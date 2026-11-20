// מבקר 195 + הכרעות ראש צוות (20.11) מול שרת גבי אמיתי (DEMO=1, dry-run), דסקטופ + 390px, אפס שגיאות:
//  • עובדת: «↻ חידוש תזכורות» על השהיית-בעלים (נפטר/ה) נעול + «🔒 בעל העסק בלבד»; «⬇ ייצוא מידע» נעול. בעל העסק: פתוחים.
//  • q21-19: הבטחה מעבר ל-14 יום ⇒ בכרטיס «בדוק ואשר» כפתורי לאשר/לסרב; בעל העסק מאשר ⇒ ההשהיה עד המועד המבוקש.
// איך מגיעים לעובדת עם TOTP: עובד הדמו (DEMO_USER_EMAIL, הסוד בקובץ) נוצר בעלים ⇒ ממנים את עובדת הדמו (DEMO_STAFF)
// לבעלים ומורידים את עובד הדמו לעובד ⇒ נכנסים כעובד הדמו (סיסמה+TOTP) ⇒ טוקן עובד.
// דרישה: npm run build. הרצה: node e2e/app-staff-owner-only.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree, tempDir } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8176, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const USER = { email: 'demo-staffown@biz.example', password: 'demo-staffown-password-1', secretFile: join(tempDir('gabi-e2e-'), 'totp') };
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT),
    DEMO_USER_EMAIL: USER.email, DEMO_USER_PASSWORD: USER.password, DEMO_USER_SECRET_FILE: USER.secretFile,
    DEMO_STAFF_EMAIL: 'demo-staff2@biz.example', DEMO_STAFF_PASSWORD: 'demo-staff2-password-1' }, stdio: srvStdio('server-staff-owner-only') });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const totpCode = () => execFileSync('python3', ['-c',
  'import sys; from app import totp; from app.demo import DEMO_NOW; print(totp.code_at(open(sys.argv[1]).read().strip(), DEMO_NOW.timestamp()))',
  USER.secretFile], { cwd: root }).toString().trim();
const b = await launchChromium(chromium); const errors = [];
const page = async (vp, path, tok) => {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => m.type() === 'error' && !/fonts\.g|403/.test(m.text()) && errors.push(m.text()));
  await p.goto(`${base}/app/#/${path}?token=${tok}`);
  return p;
};
try {
  await waitHealthy(base, srv);
  const users = (await (await fetch(`${base}/team`, { headers: H })).json()).users;
  const me = users.find(u => u.email === USER.email), other = users.find(u => u.email === 'demo-staff2@biz.example');
  for (const [id, role] of [[other.id, 'owner'], [me.id, 'staff']]) {
    const r = await fetch(`${base}/team/${id}/role`, { method: 'POST', headers: H, body: JSON.stringify({ role }) });
    ok(r.ok, `שינוי תפקיד ${id}⇒${role}: ${r.status}`);
  }
  const lr = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: USER.email, password: USER.password, code: totpCode() }) });
  ok(lr.ok, `כניסת עובד: ${lr.status}`);
  const staffTok = (await lr.json()).token;
  const custs = await (await fetch(`${base}/customers`, { headers: H })).json();
  const list = Array.isArray(custs) ? custs : (custs.customers ?? []);
  const withPhone = list.filter(c => c.phone);
  ok(withPhone.length >= 2, 'אין מספיק לקוחות דמו עם טלפון');
  const dead = withPhone[0], prom = withPhone[1];
  ok((await fetch(`${base}/customers/${dead.id}/hold`, { method: 'POST', headers: H,
    body: JSON.stringify({ reason: 'deceased', note: 'המשפחה הודיעה — לא לפנות' }) })).ok, 'סימון פטירה');
  // q21-19: «I'll pay on <DEMO_NOW + 20>» (מעל 14)
  const ir = await fetch(`${base}/inbound`, { method: 'POST', headers: H,
    body: JSON.stringify({ channel: 'sms', sender: prom.phone, text: 'אשלם ב-28 בנובמבר' }) });
  const inb = await ir.json();
  ok(ir.ok && inb.tags?.includes('promise_over_limit'), 'ההבטחה לא סומנה מעל המגבלה: ' + JSON.stringify(inb));
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    // עובדת — סקירה: חידוש נעול על השהיית-בעלים
    let p = await page(vp, 'dashboard', staffTok);
    await p.getByTestId('resume-locked').first().waitFor();
    ok(await p.getByTestId('resume-locked').getByRole('button').first().isDisabled(), `${name}: חידוש פתוח לעובדת`);
    ok(await p.getByTestId('resume-locked').getByText('בעל העסק בלבד').count() > 0, `${name}: חסר תג`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    if (out) { await p.getByTestId('resume-locked').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/staff-resume-locked-${name}.png` }); }
    await p.close();
    // עובדת — חשבוניות: ייצוא נעול
    p = await page(vp, 'invoices', staffTok);
    await p.getByTestId('data-export-owner-only').first().waitFor();
    ok(await p.getByTestId('data-export').count() === 0, `${name}: כפתור ייצוא מוצג לעובדת`);
    if (out) await p.screenshot({ path: `${out}/staff-export-locked-${name}.png` });
    await p.close();
    // בעל העסק — אותם מסכים פתוחים
    p = await page(vp, 'dashboard', TOKEN);
    await p.getByText('↻ חידוש תזכורות').first().waitFor();
    ok(await p.getByTestId('resume-locked').count() === 0, `${name}: בעלים רואה נעילה`);
    await p.close();
    p = await page(vp, 'invoices', TOKEN);
    await p.getByTestId('data-export').first().waitFor();
    await p.close();
  }
  // q21-19 — בעל העסק בתיבת התשובות: «בדוק ואשר» ⇒ לאשר
  const q = await page({ width: 1366, height: 900 }, 'inbox', TOKEN);
  await q.getByTestId('promise-request').first().waitFor();
  if (out) { await q.getByTestId('promise-request').first().scrollIntoViewIfNeeded(); await q.screenshot({ path: `${out}/promise-request-card.png` }); }
  await q.getByTestId('promise-approve').first().click();
  await q.getByText('המועד המבוקש אושר').first().waitFor();
  await q.close();
  const audit = await (await fetch(`${base}/audit`, { headers: H })).json();
  ok(audit.some(a => a.action === 'promise_request_approved'), 'האישור לא נרשם');
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ app-staff-owner-only: חידוש השהיית-בעלים וייצוא נעולים לעובדת (+תג), פתוחים לבעלים; «בדוק ואשר» על הבטחה מעל 14 יום אושר — דסקטופ+390, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
