// הפעלה 244 (QA, «הבא» 2 מ-243): invoice_fix במסך המעוצב (/app/#/inbox), לא רק ב-/ui (ui-invoice-fix.mjs).
// מול שרת DEMO=1 אמיתי (dry-run), בלי יירוט:
//   A: «טעות בשם בחשבונית, תתקנו ואשלם» (SMS) ⇒ פעולת «לתקן את פרטי החשבונית…» בכרטיס, «לטיפולך» (לא דחוף).
//   B: «Hi, wrong name on the invoice…» (מייל) ⇒ אותה פעולה.
//   C: «טעות קטנה בסכום אבל אשלם» ⇒ «דחוף», בלי פעולת תיקון.
//   D (מלכודת): «מה שם העסק?» ⇒ בלי פעולת תיקון.
//   ⇒ «✓ אשר ושלח» על A: הכרטיס יורד מהתור והשרת מסמן approved; התיקון עדיין באחריות בעל העסק (לא נוצרה חשבונית).
//   E (חדש, הפעלה 241), אחרי זה מאותו A: «השם שלי בחשבונית שגוי» ⇒ «דחוף» **וגם** פעולת תיקון — שניהם גלויים יחד.
//   (בדמו יש רק 4 לקוחות עם טלפון תקין, לכן E נשלח מ-A אחרי שהכרטיס שלו נסגר.)
//   ⇒ מובייל 390px: הפעולה של E גלויה, בלי גלילה רוחבית. 0 שגיאות קונסולה / pageerror / 4xx-5xx.
// הרצה: node e2e/app-invoice-fix.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8157, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
const FIX = 'לתקן את פרטי החשבונית';
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-invoice-fix') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/conversation/drafts')).length === 0, 'הדמו התחיל עם הודעות בתור');
  const custs = (await api('/customers')).filter(c => c.phone && !c.opted_out && !c.disputed);
  const B = custs.find(c => c.email);
  const [A, C, D] = custs.filter(c => c !== B && c.phone.replace(/\D/g, '').length >= 9);
  ok(B && D, 'אין בדמו מספיק לקוחות (B עם מייל + 3 עם טלפון תקין)');
  await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'טעות בשם בחשבונית, תתקנו ואשלם' });
  await post('/conversation/inbound', { channel: 'email', sender: B.email, text: 'Hi, wrong name on the invoice. Please send a corrected invoice and I will pay.' });
  await post('/conversation/inbound', { channel: 'sms', sender: C.phone, text: 'טעות קטנה בסכום אבל אשלם' });
  await post('/conversation/inbound', { channel: 'sms', sender: D.phone, text: 'מה שם העסק?' });
  const q = await api('/conversation/drafts');
  const [dA, dB, dC, dD] = [A, B, C, D].map(c => q.find(d => d.customer_id === c.id));
  ok(dA && dB && dC && dD, 'לא כל ההודעות בתור: ' + JSON.stringify({ q: q.map(d => [d.customer_id, d.customer, d.intent, d.status]), c: [A, B, C, D].map(c => [c.id, c.name, c.phone, c.email]) }));

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/app/#/inbox');
  const card = d => p.getByTestId(`draft-${d.id}`);
  await card(dD).waitFor();
  const acts = d => card(d).getByRole('list', { name: 'מה לעשות' });
  const esc = async d => (await card(d).getByTestId('draft-esc').textContent()).trim();
  for (const [d, who] of [[dA, 'A'], [dB, 'B']]) {
    ok(await acts(d).isVisible(), `${who}: אין רשימת «מה לעשות» בכרטיס`);
    ok((await acts(d).textContent()).includes(FIX), `${who}: פעולת התיקון לא מוצגת: ` + await acts(d).textContent());
  }
  ok(await esc(dA) === 'לטיפולך', 'A: ' + await esc(dA));
  ok(await esc(dC) === 'דחוף' && !(await card(dC).textContent()).includes(FIX), 'C: לא «דחוף» או עם פעולת תיקון');
  ok(!(await card(dD).textContent()).includes(FIX), 'D («מה שם העסק?»): התראת שווא');
  if (out) await card(dA).screenshot({ path: `${out}/app-invoice-fix-01-desktop.png` });

  // אישור המענה ל-A ⇒ יורד מהתור, השרת approved; לא נוצרת חשבונית חדשה (התיקון ידני אצל בעל העסק)
  const invBefore = (await api('/dashboard')).invoices.length;
  await card(dA).getByRole('button', { name: '✓ אשר ושלח' }).click();
  await card(dA).waitFor({ state: 'detached' });
  ok(!(await api('/conversation/drafts')).some(d => d.id === dA.id), 'A עדיין בתור אחרי אישור');
  ok((await api('/dashboard')).invoices.length === invBefore, 'אישור המענה יצר/מחק חשבונית');
  ok(await card(dC).isVisible(), 'C נעלם אחרי אישור A');

  // E: «השם שלי בחשבונית שגוי» מאותו לקוח ⇒ דחוף + פעולת תיקון
  await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'השם שלי בחשבונית שגוי' });
  const dE = (await api('/conversation/drafts')).find(d => d.customer_id === A.id);
  ok(dE && dE.intent === 'dispute' && dE.escalate === 'urgent' && dE.owner_actions.some(x => x.includes(FIX)),
    'E בשרת: ' + JSON.stringify(dE && { i: dE.intent, e: dE.escalate, a: dE.owner_actions }));
  await p.goto(base + '/app/#/settings');
  await p.goto(base + '/app/#/inbox');
  await card(dE).waitFor();
  ok((await acts(dE).textContent()).includes(FIX), 'E: פעולת התיקון לא מוצגת: ' + await acts(dE).textContent());
  ok(await esc(dE) === 'דחוף', 'E («השם שלי בחשבונית שגוי»): לא «דחוף» — ' + await esc(dE));
  ok((await card(dE).textContent()).includes('מחלוקת'), 'E: הכוונה «מחלוקת» לא מוצגת');
  if (out) await card(dE).screenshot({ path: `${out}/app-invoice-fix-02-name-wrong.png` });

  // מובייל 390px
  await p.setViewportSize({ width: 390, height: 844 });
  await acts(dE).scrollIntoViewIfNeeded();
  ok(await acts(dE).isVisible(), 'מובייל: פעולת התיקון של E לא גלויה');
  const box = await acts(dE).boundingBox();
  ok(box && box.x >= 0 && box.x + box.width <= 390, 'מובייל: רשימת הפעולות חורגת: ' + JSON.stringify(box));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(sw <= 0, `מובייל: גלילה רוחבית ${sw}px`);
  if (out) await card(dE).screenshot({ path: `${out}/app-invoice-fix-03-mobile.png` });

  ok(errors.length === 0, 'שגיאות בדפדפן: ' + errors.join(' | '));
  console.log('✓ app-invoice-fix: /app/#/inbox — פעולת «לתקן את פרטי החשבונית» (SMS+מייל), «השם שלי בחשבונית שגוי» = דחוף+תיקון, מחלוקת סכום בלי תיקון, מלכודת, אישור ⇒ יורד מהתור, מובייל, 0 שגיאות');
} finally {
  await b.close(); srv.kill();
}
process.exit(0);
