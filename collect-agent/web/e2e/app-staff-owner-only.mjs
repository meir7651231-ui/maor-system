// מבקר 195 + הכרעות ראש צוות (20.11) מול שרת גבי אמיתי (DEMO=1, dry-run), דסקטופ + 390px, אפס שגיאות:
//  • עובדת: «↻ חידוש תזכורות» על השהיית-בעלים (נפטר/ה) נעול + «🔒 בעל העסק בלבד»; «⬇ ייצוא מידע» נעול. בעל העסק: פתוחים.
//  • מבקר 195א (מנהל 348): התראת-הביטחון «הגדרות רגישות שונו» (נוצרת כאן משינוי התפקידים) — לעובדת «✓ טופל» נעול+תג
//    והשרת מחזיר 403; בעל העסק רואה «✓ טופל» פתוח.
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
  // מבקר 195א: שינויי התפקידים למעלה יצרו התראת settings_changed — עובדת לא סוגרת אותה (403), היא נשארת פתוחה
  const secNotice = (await (await fetch(`${base}/owner/inbox`, { headers: H })).json()).find(m => m.intent === 'settings_changed');
  ok(secNotice, 'שינוי התפקידים לא יצר התראת settings_changed');
  const sd = await fetch(`${base}/owner/inbox/${secNotice.id}/done`, { method: 'POST', headers: { Authorization: `Bearer ${staffTok}` } });
  ok(sd.status === 403, `עובדת סגרה התראת-ביטחון: ${sd.status}`);
  ok((await (await fetch(`${base}/owner/inbox`, { headers: H })).json()).some(m => m.id === secNotice.id), 'ההתראה ירדה אחרי ניסיון העובדת');
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    // עובדת — סקירה: חידוש נעול על השהיית-בעלים
    let p = await page(vp, 'dashboard', staffTok);
    await p.getByTestId('resume-locked').first().waitFor();
    ok(await p.getByTestId('resume-locked').getByRole('button').first().isDisabled(), `${name}: חידוש פתוח לעובדת`);
    ok(await p.getByTestId('resume-locked').getByText('בעל העסק בלבד').count() > 0, `${name}: חסר תג`);
    // גבי עיצוב: בלי «חדשו רק אחרי שבדקתם» לעובדת שלא יכולה לחדש
    ok(await p.getByTestId('resume-locked').first().locator('xpath=ancestor::li[1]').getByTestId('resume-warning').count() === 0, `${name}: אזהרת חידוש לעובדת`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    if (out) { await p.getByTestId('resume-locked').first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/staff-resume-locked-${name}.png` }); }
    // מבקר 195א: «✓ טופל» על התראת-הביטחון נעול לעובדת + תג; התראות אחרות לא ננעלות בגללה
    const sec = p.locator('[data-testid="notice"][data-intent="settings_changed"]').first();
    await sec.waitFor();
    ok(await sec.getByTestId('notice-done-locked').getByRole('button').isDisabled() && await sec.getByTestId('owner-only-badge').count() === 1, `${name}: «טופל» על התראת-ביטחון פתוח לעובדת`);
    ok(await sec.getByTestId('notice-done').count() === 0, `${name}: כפתור «טופל» פעיל בהתראת-ביטחון`);
    if (out) { await sec.scrollIntoViewIfNeeded(); await sec.screenshot({ path: `${out}/staff-security-notice-locked-${name}.png` }); }
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
    ok(await p.locator('[data-testid="notice"][data-intent="settings_changed"]').first().getByTestId('notice-done').count() === 1
      && await p.getByTestId('notice-done-locked').count() === 0, `${name}: בעלים לא רואה «✓ טופל» על התראת-ביטחון`);
    await p.close();
    p = await page(vp, 'invoices', TOKEN);
    await p.getByTestId('data-export').first().waitFor();
    await p.close();
  }
  // סגירת בקשת **מחיקה** במרשם = בעל העסק בלבד (מבקר 195ג, הוחזר מענף העיצוב שמוזג): בעל העסק פותח מחיקה + עיון;
  // השרת דוחה עובדת ב-403 גם בעקיפה; /app/#/inbox ו-/ui — מחיקה נעולה + תג, עיון נשאר פתוח לעובדת
  const SH = { Authorization: `Bearer ${staffTok}`, 'Content-Type': 'application/json' };
  const openDsr = async kind => { const r = await fetch(`${base}/customers/${dead.id}/dsr`, { method: 'POST', headers: H, body: JSON.stringify({ kind, note: 'בדיקת e2e' }) });
    ok(r.ok, `פתיחת ${kind}: ${r.status}`); return (await r.json()).id; };
  const delId = await openDsr('deletion'); await openDsr('access');
  ok((await fetch(`${base}/dsr/${delId}/done`, { method: 'POST', headers: SH, body: JSON.stringify({ note: 'נמחק לגמרי' }) })).status === 403, 'סגירת מחיקה כעובדת לא נחסמה בשרת');
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await page(vp, 'inbox', staffTok);
    await p.getByTestId('dsr-row').first().waitFor();
    const del = p.getByTestId('dsr-row').filter({ hasText: 'מחיקת' }).first(), acc = p.getByTestId('dsr-row').filter({ hasText: 'עיון' }).first();
    await del.getByTestId('dsr-note').fill('נמחק מכל המערכות');
    ok(await del.getByTestId('dsr-close').isDisabled() && await del.getByTestId('dsr-owner-badge').count() === 1, `${name}: סגירת מחיקה לא נעולה/בלי תג`);
    await acc.getByTestId('dsr-note').fill('נשלח עותק במייל');
    ok(!(await acc.getByTestId('dsr-close').isDisabled()) && await acc.getByTestId('dsr-owner-badge').count() === 0, `${name}: עיון ננעל בטעות`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית במרשם`);
    if (out) await del.screenshot({ path: `${out}/staff-dsr-delete-locked-${name}.png` });
    await p.close();
  }
  { const p = await page({ width: 1366, height: 900 }, 'inbox', TOKEN);
    await p.getByTestId('dsr-row').first().waitFor();
    ok(await p.getByTestId('dsr-owner-badge').count() === 0, 'בעלים: סגירת מחיקה נעולה'); await p.close(); }
  // מבקר 195ג — /ui: עובדת רואה תג «רק בעל העסק» במקום «חידוש»; בעל העסק (טוקן משותף) רואה את הכפתור
  for (const [who, tok] of [['staff', staffTok], ['owner', TOKEN]]) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, tok);
    const u = await ctx.newPage();
    u.on('pageerror', e => errors.push(String(e)));
    await u.goto(base + '/ui');
    await u.locator('#debts tr').first().waitFor();
    const row = u.locator('#debts tr', { hasText: dead.name });
    await row.first().waitFor();
    const udel = u.locator('#dsList li', { hasText: 'מחיקת מידע' }).first(); await udel.waitFor();
    await udel.locator('textarea').fill('נמחק מכל המערכות');
    const dLocked = await udel.locator('[data-a="done"]').isDisabled() && /בעל העסק בלבד/.test(await udel.textContent());
    ok(who === 'staff' ? dLocked : !dLocked, `/ui ${who}: נעילת סגירת מחיקה=${dLocked}`);
    const locked = await row.getByTestId('resume-owner-only').count(), btn = await row.locator('button.resume:enabled').count();   // עובדת: כפתור נעול בתוך התג (מבקר 195ג, שני המימושים מוזגו)
    ok(who === 'staff' ? locked === 1 && btn === 0 : locked === 0 && btn === 1, `/ui ${who}: תג=${locked} כפתור=${btn}`);
    if (out && who === 'staff') { await row.first().scrollIntoViewIfNeeded(); await u.screenshot({ path: `${out}/ui-staff-resume-owner-only.png` }); }
    await ctx.close();
  }
  // מבקר 201: עובדת — «בדוק ואשר» נעול + תג, והשרת מחזיר 403 (הכרעת בעל העסק בלבד)
  { const s = await page({ width: 390, height: 844 }, 'inbox', staffTok);
    await s.getByTestId('promise-request').first().waitFor();
    ok(await s.getByTestId('promise-approve').first().isDisabled() && await s.getByTestId('promise-refuse').first().isDisabled(), 'עובדת: כפתורי «בדוק ואשר» פתוחים');
    ok(await s.getByTestId('promise-owner-only').count() >= 1, 'עובדת: אין תג «בעל העסק בלבד» בבדוק ואשר');
    if (out) { await s.getByTestId('promise-request').first().scrollIntoViewIfNeeded(); await s.screenshot({ path: `${out}/promise-request-staff-locked-390.png` }); }
    await s.close();
    const r = await fetch(`${base}/customers/${prom.id}/promise-request`, { method: 'POST',
      headers: { Authorization: `Bearer ${staffTok}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ approve: true }) });
    ok(r.status === 403, `עובדת: הכרעה על המועד ⇒ ${r.status} (צפוי 403)`); }
  // q21-19 — בעל העסק בתיבת התשובות: «בדוק ואשר» ⇒ לאשר
  const q = await page({ width: 1366, height: 900 }, 'inbox', TOKEN);
  await q.getByTestId('promise-request').first().waitFor();
  if (out) { await q.getByTestId('promise-request').first().scrollIntoViewIfNeeded(); await q.screenshot({ path: `${out}/promise-request-card.png` }); }
  await q.getByTestId('promise-approve').first().click();
  await q.getByText('המועד המבוקש אושר').first().waitFor();
  // מנהל 360: ההכרעה ניסחה עדכון ללקוח ⇒ הטוסט אומר שהוא ממתין לאישור, והמסך קופץ לכרטיס החדש (מסומן)
  await q.getByText('ממתין לאישורך בתור').first().waitFor();
  const fresh = q.locator('[data-fresh="1"]');
  await fresh.first().waitFor();
  ok(await fresh.getAttribute('data-intent') === 'promise', 'הכרטיס המסומן אינו עדכון ההבטחה');
  ok(await fresh.getByTestId('promise-request').count() === 0, 'העדכון ללקוח מציג שוב «בדוק ואשר»');
  if (out) await q.screenshot({ path: `${out}/promise-decision-update-card.png` });
  await q.close();
  const audit = await (await fetch(`${base}/audit`, { headers: H })).json();
  ok(audit.some(a => a.action === 'promise_request_approved'), 'האישור לא נרשם');
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ app-staff-owner-only: חידוש השהיית-בעלים (/app/ ו-/ui), «טופל» על התראת-ביטחון (403+נעול) וייצוא וסגירת מחיקה (/app/ ו-/ui) נעולים לעובדת (+תג), עיון פתוח, פתוחים לבעלים; «בדוק ואשר» על הבטחה מעל 14 יום נעול לעובדת (403) ואושר ע״י בעל העסק — דסקטופ+390, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
