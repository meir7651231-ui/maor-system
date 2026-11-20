// מנהל 336: כרטיס «הסדרי תשלומים» גם בדשבורד הפשוט (/ui). עד היום רק ב-/app/ (מנהל 334) — בעל עסק שעובד ב-/ui
// (גם demo.sh בלי build) אישר הסדר והוא נעלם מהמסך. כאן מול שרת DEMO=1 אמיתי: בלי הסדרים ⇒ אין כרטיס · שני
// לקוחות מבקשים פריסה ⇒ הצעה (proposed) עדיין לא בכרטיס · אישור שתיהן ⇒ «פעיל» 0/3 עם התשלום הבא · חשבונית
// אחת שולמה מחוץ למערכת + סבב ⇒ «הושלם» 100% ויורד מתחת לפעיל · שם מוצג מוברח · מובייל 390px בלי גלילה רוחבית.
// הרצה: node e2e/ui-plans.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8196, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-plans') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/plans')).length === 0, 'הדמו התחיל עם הסדרים');
  const custs = (await api('/customers')).filter(c => c.phone && !c.opted_out && !c.disputed && /^0[57]/.test(c.phone));
  const [A, B] = custs;
  ok(A && B, 'אין שני לקוחות עם נייד בדמו');

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  await p.locator('#kpis .kpi').first().waitFor();
  const card = p.locator('#pl');
  ok(await card.isHidden(), 'כרטיס ההסדרים מוצג בלי הסדרים');

  for (const c of [A, B]) await post('/conversation/inbound', { channel: 'sms', sender: c.phone, text: 'אפשר לפרוס את זה לתשלומים?' });
  const prop = await api('/plans');
  const pA = prop.find(x => x.customer_id === A.id), pB = prop.find(x => x.customer_id === B.id);
  ok(pA && pB && pA.status === 'proposed' && pB.status === 'proposed', 'לא נוצרו הצעות פריסה: ' + JSON.stringify(prop));
  await p.evaluate(() => load(false));
  ok(await card.isHidden(), 'הצעה (proposed) מוצגת בכרטיס ההסדרים — מקומה ב«הודעות מלקוחות»');

  for (const x of [pA, pB]) await post(`/plans/${x.id}/approve`);
  await p.evaluate(() => load(false));
  await card.locator('li[data-pid]').nth(1).waitFor();
  ok(await card.locator('li[data-pid]').count() === 2, 'מספר השורות ≠ 2');
  const rowA = card.locator(`li[data-pid="${pA.id}"]`), rowB = card.locator(`li[data-pid="${pB.id}"]`);
  const tA = await rowA.textContent();
  const n1 = pA.installments[0];
  const dmy = n1.due.split('-').reverse().join('.');
  ok(tA.includes(A.name) && tA.includes('פעיל') && tA.includes(`0/${pA.installments.length} תשלומים`), 'שורה A: ' + tA);
  ok((await rowA.locator('[data-next]').textContent()).includes(`תשלום 1 מתוך ${pA.installments.length}`) && tA.includes(dmy), 'אין «הבא» עם התאריך: ' + tA);
  ok(await rowA.getByRole('progressbar').getAttribute('aria-valuenow') === '0', 'פס התקדמות ≠ 0');
  if (out) await p.screenshot({ path: `${out}/ui-19-plans.png` });

  await api(`/invoices/${pB.invoice_id}/mark-paid`, { method: 'POST' });
  await api('/plan', { method: 'POST' });
  ok((await api('/plans')).find(x => x.id === pB.id).status === 'completed', 'השרת: ההסדר של B לא הושלם');
  await p.evaluate(() => load(false));
  await rowB.locator('.chip', { hasText: 'הושלם' }).waitFor();
  ok(await rowB.getByRole('progressbar').getAttribute('aria-valuenow') === '100', 'הושלם בלי 100%');
  ok((await rowB.locator('[data-next]').textContent()).includes('כל התשלומים התקבלו'), 'הושלם בלי «כל התשלומים התקבלו»');
  const order = await card.locator('li[data-pid]').evaluateAll(ls => ls.map(l => l.dataset.status));
  ok(order.join() === 'approved,completed', 'סדר: ' + order.join());
  ok(!(await card.innerHTML()).includes('<script'), 'שם לא מוברח');

  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/ui-20-plans-mobile.png` }); }
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui הסדרי תשלומים: אין כרטיס בלי הסדרים · הצעה לא בכרטיס · אישור ⇒ «פעיל» 0/N + התשלום הבא · שולם ⇒ «הושלם» 100% ומתחת לפעיל · מובייל');
} finally { await b.close(); srv.kill(); }
