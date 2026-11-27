// גבי QA (מנהל 438, «הבא» של QA מאז 435): תקלת ספק **חלקית** (`/_mock/outage` mode=hide) בדפדפן, בלי יירוט.
// app-mass-vanish.mjs בדק רק רשימה ריקה/חשבון אחר — שם «כולן שולמו» סוגר את **כל** הפתוחות, ולכן לא הוכח שהכפתור סוגר
// רק את מה שנעלם. כאן המקור מחזיר חלק מהמסמכים:
//  1) מתחת לסף (2 נעלמו, השאר חזרו) ⇒ נסגרות כרגיל — אין כרטיס «נעלמו» (לא חוסמים סגירה לגיטימית), ב-/app/ אין כרטיס.
//  2) מעל הסף (5 מתוך 6 נעלמו, 1 חזר) ⇒ 0 נסגרו, כרטיס אחד «1 מסמכים… 5 מתוך 6» בלי PII, 390px בלי גלילה רוחבית,
//     כפתורים ≥40px. «כולן באמת שולמו» (2 לחיצות) ⇒ טוסט «5 חשבוניות סומנו כשולמו» ⇒ בדיוק 5 נסגרו — החשבונית שחזרה
//     מהמקור **נשארת פתוחה**; לחשבוניות שנסגרו — אין תזכורת פעילה; תזכורת מאוחדת שכללה גם אותה בוטלה, והתכנון
//     הבא בונה תזכורת רק עליה.
//  3) התקלה נגמרת ⇒ כל השבע חוזרות פתוחות במקור ⇒ סנכרון: פתוחות שוב, כרטיס «חזרה כפתוחה» (api_reopened) — לא נבלע.
//  · 0 שגיאות קונסולה / pageerror / ≥400 (עם method+נתיב).
// הרצה: node e2e/app-mass-vanish-hide.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8265, GI_PORT = 8266, base = `http://127.0.0.1:${PORT}`, gi = `http://127.0.0.1:${GI_PORT}/api/v1`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT); await assertPortFree(GI_PORT);
const mock = spawnServer('python3', ['-m', 'app.gi_mock', '--port', String(GI_PORT), '--seed', 'demo'],
  { cwd: ROOT, stdio: srvStdio('mock-mass-vanish-hide') });
let srv = null, b = null;
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${o.method || 'GET'} ${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const outage = async body => {
  const r = await fetch(`${gi}/_mock/outage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  ok(r.status === 200, `/_mock/outage ${JSON.stringify(body)}: ${r.status} ${await r.text()}`);
};
const inboxCards = async intent => {
  const x = await api('/owner/inbox');
  return (Array.isArray(x) ? x : x.items || []).filter(m => m.intent === intent);
};
const invoices = async () => (await api('/dashboard')).invoices;
// /dashboard לא חושף external_id ⇒ מזהה המסמך במקור לפי המספר, מחיפוש ב-mock עצמו (פרטי הדמו של demo_data.py)
let docIdOf = null;
const loadDocIds = async () => {
  const t = await (await fetch(`${gi}/account/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'demo-id', secret: 'demo-secret', grant_type: 'client_credentials' }) })).json();
  const r = await (await fetch(`${gi}/documents/search`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t.token}` }, body: JSON.stringify({ pageSize: 100 }) })).json();
  ok(r.total <= 100 && Array.isArray(r.items), "חיפוש מסמכים ב-mock: " + JSON.stringify(r).slice(0, 200));
  docIdOf = new Map((r.items || []).map(d => [String(d.number), String(d.id)]));
};
const openExt = async () => (await invoices()).filter(i => i.status === 'open').map(i => {
  const id = docIdOf.get(String(i.number)); ok(id, `אין מסמך במקור למספר ${i.number}`); return id;
}).sort();
const activeRem = async ids => {
  const set = new Set(ids.map(Number));
  return (await api('/reminders')).filter(r => (r.status === 'pending_approval' || r.status === 'approved')
    && (r.invoice_ids || [r.invoice_id]).some(x => set.has(Number(x))));
};
const errors = [];
try {
  await waitHealthy(gi, mock, { name: 'ה-mock של חשבונית ירוקה', path: '/users/me', anyStatus: true });
  srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
    { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', PORT: String(PORT), OWNER_API_TOKEN: TOKEN,
      GREENINVOICE_ENV: 'mock', GREENINVOICE_MOCK_URL: gi, REAL_DATA_ALLOWED: '' }, stdio: srvStdio('server-mass-vanish-hide') });
  await waitHealthy(base, srv);

  // 0) סנכרון תקין
  const s0 = await post('/sync');
  ok(s0.closed === 0, 'סנכרון תקין: ' + JSON.stringify(s0));
  await loadDocIds();
  const ALL = await openExt();
  ok(ALL.length >= 7, `צריך ≥7 פתוחות לתרחיש, יש ${ALL.length}`);

  // 1) מתחת לסף: 2 נעלמו ⇒ נסגרות כרגיל, בלי כרטיס
  const small = ALL.slice(0, 2);
  await outage({ mode: 'hide', ids: small });
  const s1 = await post('/sync');
  ok(s1.closed === 2 && !s1.vanish_held, 'מתחת לסף לא נסגר כרגיל: ' + JSON.stringify(s1));
  const after1 = await openExt();
  ok(after1.length === ALL.length - 2 && small.every(x => !after1.includes(x)), 'אחרי 2 נעלמו: ' + after1);
  ok((await inboxCards('api_mass_vanish')).length === 0, 'כרטיס «נעלמו» על 2 חשבוניות (מתחת לסף)');

  b = await launchChromium(chromium);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
  const card = p.locator('[data-testid="notice"][data-intent="api_mass_vanish"]');
  await p.goto(`${base}/app/#/dashboard`);
  await p.getByTestId('notice').first().waitFor({ timeout: 5000 }).catch(() => { /* ייתכן שאין התראות כלל */ });
  ok(await card.count() === 0, 'מתחת לסף: כרטיס «נעלמו» בדפדפן');

  // 2) מעל הסף: 5 מתוך 6 נעלמו, 1 חזר
  const KEEP = after1[after1.length - 1];
  const big = after1.filter(x => x !== KEEP);
  ok(big.length >= 5, `צריך ≥5 להסתרה, יש ${big.length}`);
  await outage({ mode: 'hide', ids: [...small, ...big] });
  const s2 = await post('/sync');
  ok(s2.closed === 0 && s2.vanish_held === big.length && s2.open === 1, 'מעל הסף: ' + JSON.stringify(s2));
  ok((await openExt()).length === after1.length, 'חשבוניות נסגרו בתקלה חלקית');
  await p.reload();
  await card.first().waitFor();
  ok(await card.count() === 1, `כרטיסי «נעלמו»: ${await card.count()}`);
  const txt = await card.textContent();
  ok(txt.includes('לא סימנה אותן כשולמו') && txt.includes(`${big.length} מתוך ${after1.length}`) && txt.includes('בסנכרון מסמך פתוח אחד,'),
    'גוף הכרטיס: ' + txt);
  ok(!/\b05\d-?\d{7}\b|@example\.com/.test(txt), 'פרטי לקוח בכרטיס: ' + txt);
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-24-mass-vanish-hide.png` }); }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית ב-390px');
  for (const t of ['notice-mass-close', 'notice-done']) {
    const bb = await card.getByTestId(t).boundingBox();
    ok(bb && bb.x >= 0 && bb.x + bb.width <= 391 && bb.height >= 40, `${t} ב-390px: ` + JSON.stringify(bb));
  }
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-24-mass-vanish-hide-390.png` }); }

  const inv = await invoices();
  const idOf = ext => inv.find(i => docIdOf.get(String(i.number)) === ext).invoice_id;
  const keepId = idOf(KEEP);
  const remKeepBefore = (await activeRem([keepId])).length;
  const close = card.getByTestId('notice-mass-close');
  await close.click();
  ok((await close.textContent()).includes('לחצו שוב לאישור'), '«כולן שולמו» לא חימש');
  ok((await openExt()).length === after1.length, 'לחיצה אחת כבר סגרה');
  await close.click();
  await p.getByTestId('toast').filter({ hasText: `${big.length} חשבוניות סומנו כשולמו` }).waitFor();
  await card.waitFor({ state: 'detached' });
  const after2 = await openExt();
  ok(after2.length === 1 && after2[0] === KEEP, 'אחרי «כולן שולמו» — צריכה להישאר רק זו שחזרה מהמקור: ' + after2);
  ok((await activeRem(big.map(idOf))).length === 0, 'תזכורות פעילות על חשבוניות שסומנו כשולמו');
  // תזכורת מאוחדת שכללה גם את זו שנשארה בוטלה (הנוסח כבר לא נכון — `_cancel_invoice`); התכנון הבא בונה אחת רק עליה
  if (remKeepBefore) {
    await post('/plan');
    const rebuilt = await activeRem([keepId]);
    ok(rebuilt.length === 1 && (rebuilt[0].invoice_ids || [rebuilt[0].invoice_id]).every(x => Number(x) === keepId),
      'אחרי תכנון — תזכורת על החשבונית שנשארה (ורק עליה): ' + JSON.stringify(rebuilt));
  }

  // 3) התקלה נגמרת ⇒ כולן חוזרות פתוחות, כרטיס «חזרה כפתוחה»
  await outage({ mode: 'off' });
  await post('/sync');
  ok((await openExt()).length === ALL.length, 'אחרי סוף התקלה לא כולן פתוחות');
  await p.reload();
  const reo = p.locator('[data-testid="notice"][data-intent="api_reopened"]');
  await reo.first().waitFor();
  ok(await card.count() === 0, 'כרטיס «נעלמו» חזר אחרי סנכרון תקין');
  if (out) { await reo.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-24-mass-vanish-hide-reopened-390.png` }); }

  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log(`✓ /app/ תקלה חלקית (mode=hide): 2 נעלמו ⇒ נסגרו כרגיל, אין כרטיס · ${big.length} מתוך ${after1.length} נעלמו ⇒ ` +
    `0 נסגרו, כרטיס אחד, 390px · «כולן שולמו» ⇒ בדיוק ${big.length} נסגרו, זו שחזרה מהמקור נשארה פתוחה (+תזכורת רק עליה בתכנון) · ` +
    `סוף התקלה ⇒ ${ALL.length} פתוחות + «חזרה כפתוחה» · 0 שגיאות`);
} finally { if (b) await b.close(); if (srv) srv.kill(); mock.kill(); }
