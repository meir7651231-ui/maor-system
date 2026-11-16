// הפעלה 240 (QA, «הבא» 3 מ-239): לקוח כותב «טעות בשם בחשבונית, תתקנו ואשלם» ⇒ המנוע מתייג invoice_fix ומוסיף
// לבעל העסק פעולה «לתקן את פרטי החשבונית…». עד עכשיו זה נבדק רק ביחידה (tests/test_mgr239_invoice_fix.py) — כאן
// מול שרת DEMO=1 אמיתי (dry-run) ובדפדפן, בלי יירוט:
//   A: «טעות בשם בחשבונית, תתקנו ואשלם» (SMS) ⇒ בכרטיס «הודעות מלקוחות» מופיעה פעולת התיקון, מוסלם (לא דחוף),
//      ותזכורת שכבר אושרה אליו לא יוצאת עד שבעל העסק מטפל (awaiting_owner).
//   B: «wrong name on the invoice, please send a corrected invoice» (מייל) ⇒ אותה פעולה.
//   C: «טעות קטנה בסכום אבל אשלם» ⇒ מחלוקת **דחופה** (שבב «דחוף»), בלי פעולת תיקון-חשבונית.
//   D (מלכודת): «מה שם העסק?» ⇒ בלי פעולת תיקון.
// ולבסוף מובייל 390px: הפעולה גלויה ובלי גלילה רוחבית. הרצה: node e2e/ui-invoice-fix.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8156, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
const FIX = 'לתקן את פרטי החשבונית';
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-invoice-fix') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const addrs = c => new Set([(c.phone || '').replace(/\D/g, '').replace(/^0/, '972'), c.email].filter(Boolean));
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/conversation/drafts')).length === 0, 'הדמו התחיל עם הודעות בתור');
  const custs = (await api('/customers')).filter(c => c.phone && !c.opted_out && !c.disputed);
  const pendR = (await api('/reminders?status=pending_approval')).filter(r => !r.block_reason);
  // A = לקוח עם תזכורת שממתינה לאישור — כדי להוכיח שאחרי «תתקנו ואשלם» היא לא יוצאת עד הטיפול
  const A = custs.find(c => pendR.some(r => r.customer_name === c.name));
  ok(A, 'אין בדמו לקוח עם תזכורת שממתינה לאישור');
  const rest = custs.filter(c => c.id !== A.id);
  const B = rest.find(c => c.email), C = rest.find(c => c !== B), D = rest.find(c => c !== B && c !== C);
  ok(B && C && D, 'אין בדמו מספיק לקוחות (B עם מייל, C, D)');
  const rA = pendR.find(r => r.customer_name === A.name);
  await api(`/reminders/${rA.id}/approve`, { method: 'POST' });   // בעל העסק כבר אישר תזכורת אל A

  await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'טעות בשם בחשבונית, תתקנו ואשלם' });
  await post('/conversation/inbound', { channel: 'email', sender: B.email, text: 'Hi, wrong name on the invoice. Please send a corrected invoice and I will pay.' });
  await post('/conversation/inbound', { channel: 'sms', sender: C.phone, text: 'טעות קטנה בסכום אבל אשלם' });
  await post('/conversation/inbound', { channel: 'sms', sender: D.phone, text: 'מה שם העסק?' });
  const q = await api('/conversation/drafts');
  const by = id => q.find(d => d.customer_id === id);
  const [dA, dB, dC, dD] = [A, B, C, D].map(c => by(c.id));
  ok(dA && dB && dC && dD, 'לא כל ההודעות בתור: ' + JSON.stringify(q.map(d => [d.customer, d.intent, d.status])));
  const hasFix = d => (d.owner_actions || []).some(x => x.includes(FIX));
  ok(hasFix(dA), 'A («טעות בשם… תתקנו ואשלם»): אין פעולת תיקון: ' + JSON.stringify(dA.owner_actions));
  ok(dA.intent === 'promise' && dA.escalate === 'normal', 'A: ' + JSON.stringify({ i: dA.intent, e: dA.escalate }));
  ok(hasFix(dB), 'B (wrong name on the invoice): אין פעולת תיקון: ' + JSON.stringify(dB.owner_actions));
  ok(dC.intent === 'dispute' && dC.escalate === 'urgent', 'C («טעות קטנה בסכום אבל אשלם») לא מחלוקת דחופה: ' + JSON.stringify({ i: dC.intent, e: dC.escalate }));
  ok(!hasFix(dC), 'C: מחלוקת על סכום קיבלה פעולת תיקון-חשבונית');
  ok(!hasFix(dD), 'D («מה שם העסק?») — התראת שווא: ' + JSON.stringify(dD.owner_actions));

  // התזכורת שאושרה אל A לא יוצאת כל עוד ההודעה שלו מחכה לבעל העסק
  const mark = (await api('/outbox')).messages.length;
  await api('/dispatch', { method: 'POST' });
  const toA = addrs(A);
  const leaked = (await api('/outbox')).messages.slice(mark).filter(m => toA.has(m.to));
  ok(leaked.length === 0, 'תזכורת יצאה אל A בזמן שהוא מחכה לחשבונית מתוקנת: ' + JSON.stringify(leaked.map(m => m.body.slice(0, 50))));

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  const card = p.locator('#cm');
  await card.locator('li[data-did]').first().waitFor();
  const row = d => card.locator(`li[data-did="${d.id}"]`);
  for (const [d, who] of [[dA, 'A'], [dB, 'B']]) {
    const acts = row(d).locator('ul.acts');
    ok(await acts.isVisible(), `${who}: אין רשימת פעולות בכרטיס`);
    ok((await acts.textContent()).includes(FIX), `${who}: פעולת התיקון לא מוצגת בכרטיס: ` + await acts.textContent());
  }
  ok(!((await row(dC).textContent()).includes(FIX)), 'C: פעולת תיקון בכרטיס של מחלוקת סכום');
  ok(await row(dC).locator('.chip.urgent').count() === 1, 'C: אין שבב «דחוף» בכרטיס');
  ok(!((await row(dD).textContent()).includes(FIX)), 'D: פעולת תיקון בכרטיס של «מה שם העסק?»');
  if (out) await row(dA).screenshot({ path: `${out}/ui-16-invoice-fix.png` });

  // מובייל: הפעולה גלויה ובלי גלילה רוחבית
  await p.setViewportSize({ width: 390, height: 844 });
  await row(dA).locator('ul.acts').scrollIntoViewIfNeeded();
  ok(await row(dA).locator('ul.acts').isVisible(), 'מובייל: פעולת התיקון לא גלויה');
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(sw <= 0, `מובייל: גלילה רוחבית ${sw}px`);
  if (out) await p.screenshot({ path: `${out}/ui-16-invoice-fix-mobile.png`, fullPage: true });

  ok(errors.length === 0, 'שגיאות בדפדפן: ' + errors.join(' | '));
  console.log('✓ ui-invoice-fix: פעולת «לתקן את פרטי החשבונית» בכרטיס (SMS+מייל), מחלוקת סכום דחופה בלי תיקון, מלכודת בלי התראת שווא, תזכורת לא יוצאת, מובייל');
} finally {
  await b.close(); srv.kill();
}
process.exit(0);
