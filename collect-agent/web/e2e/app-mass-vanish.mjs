// גבי QA (מנהל 435, «הבא» של QA מאז 426): תקלת ספק (`/_mock/outage`) בדפדפן — כרטיס «נעלמו» (api_mass_vanish) ב-/app/
// מקצה לקצה, בלי יירוט. עד היום ההגנה נבדקה רק ב-pytest (מנהל 416–426); בדפדפן לא נבדק אף אחד משני הכפתורים.
// שרת גבי (DEMO=1, DEMO_CLOCK=1, dry-run) מדבר ב-HTTP עם שרת ה-mock של חשבונית ירוקה (app/gi_mock.py, seed demo):
//  0) סנכרון תקין ⇒ 10 פתוחות.
//  1) יום א׳ — תקלה (mode=empty, חיפוש ריק ב-200) ⇒ סנכרון: 0 נסגרו, vanish_held ⇒ כרטיס אחד; סנכרון שני ⇒ עדיין כרטיס אחד.
//     דפדפן: הכרטיס אומר «לא סימנה אותן כשולמו», שני כפתורים · 390px בלי גלילה רוחבית, כפתורים ≥40px בתוך המסך.
//     «השאר פתוחות» — לחיצה ראשונה רק מחמשת, השנייה ⇒ טוסט, הכרטיס יורד · השרת: כל ה-10 עדיין פתוחות.
//     סנכרון נוסף באותו יום ⇒ לא מציקים שוב (אין כרטיס אחרי רענון).
//  2) יום ב׳ (/demo/advance) — תקלה אחרת (mode=account) ⇒ כרטיס חדש. «כולן באמת שולמו» (2 לחיצות) ⇒ טוסט «N חשבוניות
//     סומנו כשולמו» · הכרטיס יורד · השרת: 0 פתוחות, אין תזכורת ממתינה עליהן.
//  3) התקלה נגמרת ⇒ סנכרון: המסמכים פתוחים במקור ⇒ כרטיס «חזרה כפתוחה» (api_reopened, 415) — לא נבלע בשקט.
//  · 0 שגיאות קונסולה / pageerror / 4xx-5xx (כל תשובה ≥400 נרשמת עם הנתיב — 262ℹ️).
// הרצה: node e2e/app-mass-vanish.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8261, GI_PORT = 8262, base = `http://127.0.0.1:${PORT}`, gi = `http://127.0.0.1:${GI_PORT}/api/v1`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT); await assertPortFree(GI_PORT);
const mock = spawnServer('python3', ['-m', 'app.gi_mock', '--port', String(GI_PORT), '--seed', 'demo'],
  { cwd: ROOT, stdio: srvStdio('mock-mass-vanish') });
let srv = null, b = null;
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${o.method || 'GET'} ${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const outage = async mode => {
  const r = await fetch(`${gi}/_mock/outage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
  ok(r.status === 200, `/_mock/outage ${mode}: ${r.status} ${await r.text()}`);
};
const inboxCards = async intent => {
  const x = await api('/owner/inbox');
  return (Array.isArray(x) ? x : x.items || []).filter(m => m.intent === intent);
};
const openCount = async () => (await api('/dashboard')).invoices.filter(i => i.status === 'open').length;
const errors = [];
try {
  await waitHealthy(gi, mock, { name: 'ה-mock של חשבונית ירוקה', path: '/users/me', anyStatus: true });
  srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
    { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', PORT: String(PORT), OWNER_API_TOKEN: TOKEN,
      GREENINVOICE_ENV: 'mock', GREENINVOICE_MOCK_URL: gi, REAL_DATA_ALLOWED: '' }, stdio: srvStdio('server-mass-vanish') });
  await waitHealthy(base, srv);

  // 0) סנכרון תקין
  const s0 = await post('/sync');
  ok(s0.closed === 0 && s0.open >= 5, 'סנכרון תקין: ' + JSON.stringify(s0));
  const OPEN = await openCount();
  ok(OPEN >= 5, `פתוחות אחרי סנכרון: ${OPEN}`);
  ok((await inboxCards('api_mass_vanish')).length === 0, 'כרטיס «נעלמו» לפני תקלה');

  // 1) יום א׳: חיפוש ריק ב-200 ⇒ לא סוגרים, כרטיס אחד
  await outage('empty');
  const s1 = await post('/sync');
  ok(s1.closed === 0 && s1.vanish_held === OPEN, 'סנכרון בתקלה סגר/לא החזיק: ' + JSON.stringify(s1));
  await post('/sync');
  ok((await inboxCards('api_mass_vanish')).length === 1, 'תקלה + סנכרון שני ⇒ לא כרטיס אחד');
  ok(await openCount() === OPEN, 'חשבוניות נסגרו בתקלה');

  b = await launchChromium(chromium);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
  await p.goto(`${base}/app/#/dashboard`);
  const card = p.locator('[data-testid="notice"][data-intent="api_mass_vanish"]');
  await card.first().waitFor();
  ok(await card.count() === 1, `כרטיסי «נעלמו» בדפדפן: ${await card.count()}`);
  const txt = await card.textContent();
  ok(txt.includes('לא סימנה אותן כשולמו') && txt.includes(`${OPEN} מתוך ${OPEN}`), 'גוף הכרטיס: ' + txt);
  ok(await card.getByTestId('notice-mass-close').count() === 1 && await card.getByTestId('notice-done').count() === 1, 'אין צמד כפתורים');
  ok(!/\b05\d-?\d{7}\b|@example\.com/.test(txt), 'פרטי לקוח בכרטיס תקלה: ' + txt);
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-23-mass-vanish.png` }); }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל (כרטיס «נעלמו»)');
  for (const t of ['notice-mass-close', 'notice-done']) {
    const bb = await card.getByTestId(t).boundingBox();
    ok(bb && bb.x >= 0 && bb.x + bb.width <= 391 && bb.height >= 40, `${t} ב-390px: ` + JSON.stringify(bb));
  }
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-23-mass-vanish-390.png` }); }

  // «השאר פתוחות» — לחיצה ראשונה מחמשת בלבד (במובייל, כמו בעל עסק בטלפון)
  const keep = card.getByTestId('notice-done');
  await keep.click();
  ok((await keep.textContent()).includes('לחצו שוב לאישור'), '«השאר פתוחות» לא חימש');
  ok((await inboxCards('api_mass_vanish')).length === 1, 'לחיצה אחת כבר סגרה את הכרטיס');
  await keep.click();
  await p.getByTestId('toast').filter({ hasText: 'החשבוניות נשארות פתוחות' }).waitFor();
  await card.waitFor({ state: 'detached' });
  ok((await inboxCards('api_mass_vanish')).length === 0, 'השרת: הכרטיס לא ירד');
  ok(await openCount() === OPEN, 'השרת: «השאר פתוחות» סגר חשבוניות');
  // אותו יום, התקלה נמשכת ⇒ לא מציקים שוב
  await post('/sync');
  await p.reload();
  await p.getByTestId('notice').first().waitFor({ timeout: 5000 }).catch(() => { /* ייתכן שאין התראות כלל */ });
  ok(await card.count() === 0, 'אחרי «השאר פתוחות» כרטיס חזר באותו יום');
  ok(await openCount() === OPEN, 'סנכרון שני בתקלה סגר חשבוניות');

  // 2) יום ב׳: חשבון אחר ⇒ כרטיס חדש ⇒ «כולן באמת שולמו»
  await post('/demo/advance?days=1');
  await outage('account');
  const s2 = await post('/sync');
  ok(s2.closed === 0 && s2.vanish_held === OPEN, 'יום ב׳ סנכרון: ' + JSON.stringify(s2));
  await p.reload();
  await card.first().waitFor();
  ok(await card.count() === 1, `יום ב׳ כרטיסים: ${await card.count()}`);
  const close = card.getByTestId('notice-mass-close');
  await close.click();
  ok((await close.textContent()).includes('לחצו שוב לאישור'), '«כולן שולמו» לא חימש');
  ok(await openCount() === OPEN, 'לחיצה אחת כבר סגרה חשבוניות');
  await close.click();
  await p.getByTestId('toast').filter({ hasText: `${OPEN} חשבוניות סומנו כשולמו` }).waitFor();
  await card.waitFor({ state: 'detached' });
  ok(await openCount() === 0, 'השרת: «כולן שולמו» לא סגר את כולן');
  const pend = (await api('/reminders')).filter(r => r.status === 'pending_approval' || r.status === 'approved');
  ok(pend.length === 0, 'נשארו תזכורות פעילות על חשבוניות שסומנו כשולמו: ' + JSON.stringify(pend.map(r => [r.id, r.status])));

  // 3) התקלה נגמרת — המסמכים עדיין פתוחים במקור ⇒ לא נבלע: כרטיס «חזרה כפתוחה»
  await outage('off');
  await post('/sync');
  await p.reload();
  const reo = p.locator('[data-testid="notice"][data-intent="api_reopened"]');
  await reo.first().waitFor();
  ok(await card.count() === 0, 'כרטיס «נעלמו» חזר אחרי סנכרון תקין');
  if (out) { await reo.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-23-mass-vanish-reopened-390.png` }); }

  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log(`✓ /app/ תקלת ספק: ${OPEN} פתוחות ⇒ חיפוש ריק ⇒ 0 נסגרו, כרטיס אחד (גם בסנכרון שני) · 390px · «השאר פתוחות» (2 לחיצות) ⇒ ` +
    'הכרטיס ירד, כולן פתוחות, לא חוזר באותו יום · יום ב׳ חשבון אחר ⇒ כרטיס חדש ⇒ «כולן שולמו» (2 לחיצות) ⇒ 0 פתוחות, ' +
    'אין תזכורות פעילות · התקלה נגמרת ⇒ «חזרה כפתוחה» · 0 שגיאות');
} finally { if (b) await b.close(); if (srv) srv.kill(); mock.kill(); }
