// מנהל 337: «תשלום לא התקבל» בדפדפן. עד היום מצב «הוחמץ» כוסה רק ב-pytest — שרת DEMO=1 עם שעון קבוע לא יכול להגיע
// אליו. עכשיו DEMO_CLOCK=1 מוסיף POST /demo/advance (רק בשירות הדמו). כאן: שני הסדרים מאושרים ⇒ של B שולם מחוץ למערכת ⇒
// השעון זז יום אחד לפני סוף ימי החסד ⇒ סבב ⇒ A עדיין «פעיל» (בקרה) ⇒ עוד יום ⇒ סבב ⇒ A «תשלום לא התקבל», ראשון בכרטיס,
// שורת «הבא» אדומה עם «באיחור של N ימים» לפי התאריך של השרת, הסבר «התזכורות חזרו», והתראת plan_missed לבעל העסק.
// הרצה: node e2e/ui-plans-missed.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8197, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
// DEMO_TRIAL_START: הניסיון (14 יום) לא נגמר באמצע ההזזה — אחרת הסבב לא רץ בכלל
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', DEMO_TRIAL_START: '2026-11-15', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-plans-missed') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const days = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await fetch(base + '/demo/advance?days=1', { method: 'POST' })).status === 401, '/demo/advance בלי אימות');
  const custs = (await api('/customers')).filter(c => c.phone && !c.opted_out && !c.disputed && /^0[57]/.test(c.phone));
  const [A, B] = custs;
  ok(A && B, 'אין שני לקוחות עם נייד בדמו');
  for (const c of [A, B]) await post('/conversation/inbound', { channel: 'sms', sender: c.phone, text: 'אפשר לפרוס את זה לתשלומים?' });
  const prop = await api('/plans');
  const pA = prop.find(x => x.customer_id === A.id), pB = prop.find(x => x.customer_id === B.id);
  ok(pA && pB, 'לא נוצרו הצעות פריסה: ' + JSON.stringify(prop));
  for (const x of [pA, pB]) await post(`/plans/${x.id}/approve`);
  await api(`/invoices/${pB.invoice_id}/mark-paid`, { method: 'POST' });

  const today0 = (await api('/dashboard')).today;
  const due1 = pA.installments[0].due, GRACE = 7;
  const gap = days(today0, due1) + GRACE;   // היום האחרון של החסד — עדיין לא «הוחמץ»
  let adv = await post(`/demo/advance?days=${gap}`);
  ok(adv.trial_active, 'הניסיון של הדמו נגמר — הסבב לא ירוץ: ' + JSON.stringify(adv));
  await api('/plan', { method: 'POST' });
  ok((await api('/plans')).find(x => x.id === pA.id).status === 'approved', 'בקרה: הוחמץ כבר ביום האחרון של החסד');

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  await p.locator('#kpis .kpi').first().waitFor();
  const card = p.locator('#pl'), rowA = card.locator(`li[data-pid="${pA.id}"]`);
  await rowA.waitFor();
  ok(await rowA.getAttribute('data-status') === 'approved', 'בקרה בדפדפן: A לא «פעיל»');
  ok((await rowA.locator('[data-next]').textContent()).includes(`באיחור של ${GRACE} ימים`), 'ביום האחרון של החסד אין «באיחור של 7 ימים»');

  adv = await post('/demo/advance?days=1');
  ok(adv.trial_active, 'הניסיון נגמר');
  await api('/plan', { method: 'POST' });
  const sA = (await api('/plans')).find(x => x.id === pA.id);
  ok(sA.status === 'missed' && sA.progress && sA.progress.done === 0, 'השרת: A לא הוחמץ: ' + JSON.stringify(sA));

  await p.evaluate(() => load(false));
  await rowA.locator('.chip', { hasText: 'תשלום לא התקבל' }).waitFor();
  const order = await card.locator('li[data-pid]').evaluateAll(ls => ls.map(l => l.dataset.status));
  ok(order.join() === 'missed,completed', 'סדר: ' + order.join());
  const late = days(due1, adv.today);
  ok(late === GRACE + 1, `איחור ${late}`);
  const nx = rowA.locator('[data-next]');
  ok(await nx.evaluate(e => e.classList.contains('late')), '«הבא» של הוחמץ לא מסומן late');
  const nxt = await nx.textContent();
  ok(nxt.includes(`תשלום 1 מתוך ${pA.installments.length}`) && nxt.includes(`באיחור של ${late} ימים`) && nxt.includes(due1.split('-').reverse().join('.')), '«הבא»: ' + nxt);
  ok((await rowA.textContent()).includes('התזכורות הרגילות חזרו'), 'אין הסבר מה קורה אחרי החמצה');
  ok(await rowA.getByRole('progressbar').getAttribute('aria-valuenow') === '0', 'פס התקדמות ≠ 0');
  ok(JSON.stringify(await api('/owner/inbox')).includes(`תשלום 1 מתוך ${pA.installments.length}`), 'אין התראת «הוחמץ» בתיבת בעל העסק');
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/ui-21-plan-missed.png` }); }

  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log(`✓ /ui הוחמץ: /demo/advance דורש אימות · יום ${GRACE} של החסד ⇒ עדיין «פעיל» · יום ${GRACE + 1} ⇒ «תשלום לא התקבל» ראשון, «באיחור של ${late} ימים» באדום, הסבר, 0% · מובייל`);
} finally { await b.close(); srv.kill(); }
