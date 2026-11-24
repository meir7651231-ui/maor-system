// מנהל 384 (QA «הבא» מ-380–383): «סנכרון חשבונית ירוקה» ב-/ui כששער בטא 4 חוסם. עד היום השער נבדק רק ב-pytest
// (POST /sync ⇒ 403); כאן מקצה לקצה בדפדפן, בלי יירוט: שרת גבי (DEMO=1, dry-run) מדבר ב-HTTP עם שרת ה-mock של
// חשבונית ירוקה (app/gi_mock.py), ובמקור נוספת חשבונית עם טלפון שאינו בטווח הדמו («050-1234567»).
// נאכף: לחיצה ⇒ שורת שגיאה בעברית בדף («הפעולה לא בוצעה: שלב בטא … לא נשמר דבר»), לא חלון קופץ, לא «שגיאה 403»
// גולמית ולא «השרת לא זמין» · שום דבר לא נשמר (לקוחות/חשבוניות כמו לפני) · audit api_sync_blocked בלי הטלפון/השם ·
// כפתורי הכותרת חוזרים לפעולה · «הבנתי» סוגר · 390px: ההודעה גלויה ואין גלילה רוחבית · אפס שגיאות דף מלבד ה-403 הצפוי.
// הרצה: node e2e/ui-sync-blocked.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8201, GI_PORT = 8202, base = `http://127.0.0.1:${PORT}`, gi = `http://127.0.0.1:${GI_PORT}/api/v1`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
const REAL_PHONE = '050-1234567', REAL_NAME = 'לקוח אמיתי בבדיקה';
await assertPortFree(PORT); await assertPortFree(GI_PORT);
const mock = spawnServer('python3', ['-m', 'app.gi_mock', '--port', String(GI_PORT), '--seed', 'demo'],
  { cwd: ROOT, stdio: srvStdio('mock-sync-blocked') });
let srv = null;
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async p => { const r = await fetch(base + p, { headers: H }); ok(r.ok, `${p}: ${r.status}`); return r.json(); };
const counts = async () => {
  const d = await api('/dashboard');
  ok(Array.isArray(d.invoices), '/dashboard בלי invoices');
  return { customers: (await api('/customers')).length, invoices: d.invoices.length,
    real: d.invoices.some(i => String(i.number ?? '') === '2999') };
};
const errors = [];
let b = null;
try {
  await waitHealthy(gi, mock, { name: 'ה-mock של חשבונית ירוקה', path: '/users/me', anyStatus: true });
  srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
    { cwd: ROOT, env: { ...process.env, DEMO: '1', PORT: String(PORT), OWNER_API_TOKEN: TOKEN,
      GREENINVOICE_ENV: 'mock', GREENINVOICE_MOCK_URL: gi, REAL_DATA_ALLOWED: '' }, stdio: srvStdio('server-sync-blocked') });
  await waitHealthy(base, srv);

  // נתוני הדמו מסונתזים ⇒ סנכרון רגיל עובר (השער לא חוסם את ההדגמה עצמה)
  const s0 = await fetch(base + '/sync', { method: 'POST', headers: H });
  ok(s0.status === 200, `סנכרון של נתוני הדמו נכשל: ${s0.status} ${await s0.text()}`);
  const before = await counts();
  ok(before.customers > 0 && before.invoices > 0 && !before.real, 'אין נתוני דמו אחרי סנכרון: ' + JSON.stringify(before));

  // במקור: חשבונית חדשה עם טלפון אמיתי (לא 05X-000XXXX). בלי webhook ⇒ רק «סנכרון» יביא אותה.
  const add = await fetch(`${gi}/_mock/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'real1', number: '2999', type: 305, status: 0, amount: '640.00', dueDate: '2026-10-20',
      documentDate: '2026-09-01', client: { id: 'clreal1', name: REAL_NAME, phone: REAL_PHONE, emails: [] } }) });
  ok(add.status === 200, `ה-mock לא הוסיף מסמך: ${add.status} ${await add.text()}`);

  b = await launchChromium(chromium);
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  let dialogs = 0;
  p.on('dialog', d => { dialogs++; void d.dismiss(); });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => {
    // הדפדפן מדפיס כל תגובת 4xx כשגיאת קונסולה; ה-403 של /sync הוא בדיוק מה שנבדק
    if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/status of 403/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  const got403 = [];
  p.on('response', r => {
    if (r.status() === 403 && new URL(r.url()).pathname === '/sync') got403.push(r.url());
    else if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(base + '/ui');
  const btn = p.locator('#btnSync');
  await btn.waitFor();
  await p.waitForFunction(() => !document.querySelector('#btnSync').disabled);
  ok(await p.locator('#acterr').isHidden(), 'שורת שגיאה מוצגת לפני לחיצה');

  await btn.click();
  const err = p.locator('#acterr');
  await err.waitFor({ state: 'visible' });
  const msg = (await p.locator('#actMsg').textContent()) ?? '';
  ok(got403.length === 1, `ציפינו ל-403 אחד מ-/sync, התקבלו ${got403.length}`);
  ok(/^הפעולה לא בוצעה: /.test(msg), 'ההודעה לא בפורמט שורת הכשל: ' + msg);
  ok(/שלב בטא/.test(msg) && /נתוני דמו/.test(msg) && /לא נשמר דבר/.test(msg), 'ההודעה לא מסבירה את שער הבטא: ' + msg);
  ok(!/403|שגיאה \d|השרת לא זמין|Forbidden/i.test(msg), 'הודעה גולמית/מטעה: ' + msg);
  ok(!msg.includes(REAL_PHONE) && !msg.includes(REAL_NAME), 'ההודעה חושפת את פרטי הלקוח');
  ok(dialogs === 0, 'נפתח חלון קופץ של הדפדפן');
  ok(await p.locator('#wunk').isHidden(), 'הכשל הוצג כ«תוצאה לא ידועה» במקום כחסימה ברורה');
  // הכפתורים חוזרים לפעולה (busy ירד) — אפשר לנסות שוב אחרי תיקון המקור
  await p.waitForFunction(() => ['#btnSync', '#btnPlan', '#btnDispatch'].every(s => !document.querySelector(s).disabled));

  // השרת: לא נשמר דבר, והניסיון ב-audit בלי תוכן
  const after = await counts();
  ok(after.customers === before.customers && after.invoices === before.invoices && !after.real,
    `נשמרו נתונים למרות החסימה: ${JSON.stringify(before)} ⇒ ${JSON.stringify(after)}`);
  ok(!(await api('/customers')).some(c => String(c.phone ?? '').replace(/\D/g, '').endsWith('1234567') || c.name === REAL_NAME),
    'הלקוח האמיתי נשמר');
  const audit = await api('/audit');
  const row = audit.find(r => r.action === 'api_sync_blocked');
  ok(row, 'אין api_sync_blocked ב-audit');
  ok(!String(row.detail ?? '').includes('1234567') && !String(row.detail ?? '').includes(REAL_NAME), 'ה-audit שומר תוכן');

  if (out) await p.screenshot({ path: `${out}/ui-19-sync-blocked.png` });
  // 390px: ההודעה גלויה בתוך המסך, בלי גלילה רוחבית, «הבנתי» ≥40px
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  const box = await err.boundingBox();
  ok(box && box.x >= 0 && box.x + box.width <= 391, 'שורת השגיאה חורגת מרוחב המסך: ' + JSON.stringify(box));
  const okBox = await p.locator('#btnAct').boundingBox();
  ok(okBox && okBox.height >= 40 && okBox.width >= 40, '«הבנתי» קטן מ-40px: ' + JSON.stringify(okBox));
  if (out) await p.screenshot({ path: `${out}/ui-19-sync-blocked-mobile.png`, fullPage: false });
  await p.locator('#btnAct').click();
  ok(await err.isHidden(), '«הבנתי» לא סגר את ההודעה');

  // לחיצה שנייה ⇒ אותה הודעה (לא נעלמת בשקט אחרי הפעם הראשונה)
  await p.setViewportSize({ width: 1280, height: 900 });
  await btn.click();
  await err.waitFor({ state: 'visible' });
  ok(/שלב בטא/.test((await p.locator('#actMsg').textContent()) ?? ''), 'בלחיצה שנייה ההודעה שונה');
  ok(got403.length === 2, 'הלחיצה השנייה לא הגיעה לשרת');

  ok(errors.length === 0, 'שגיאות בדף:\n' + errors.join('\n'));
  console.log('✓ ui-sync-blocked: /ui «סנכרון» חסום ⇒ הודעת שער בטא בעברית, לא נשמר דבר, audit בלי תוכן, 390px');
} finally {
  await b?.close();
  srv?.kill(); mock.kill();
}
