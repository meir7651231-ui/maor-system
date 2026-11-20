// מנהל 346: «תשלום לא התקבל» ב-/app/ (React) — המקבילה של ui-plans-missed.mjs (מנהל 337, /ui). עד היום כרטיס
// «הסדרי תשלומים» של /app/ (PlansCard, מנהל 334) נבדק רק ביחידה (plansVisible/nextLine) — לא מול שרת שבאמת מחמיץ.
// כאן: DEMO=1 + DEMO_CLOCK=1 ⇒ שני הסדרים מאושרים ⇒ של B שולם מחוץ למערכת ⇒ השעון זז ליום האחרון של החסד ⇒ סבב ⇒
// בדפדפן A עדיין «פעיל» (בקרה) ⇒ עוד יום ⇒ סבב ⇒ רענון ⇒ A «תשלום לא התקבל» ראשון בכרטיס, שורת «הבא» מודגשת עם
// «באיחור של N ימים» לפי התאריך של השרת (לא DEMO_TODAY של הלקוח), הסבר «התזכורות חזרו», 0%, והתראת plan_missed
// ב«דורש טיפול שלך». דסקטופ + 390px, אפס שגיאות.
// דרישה: npm run build. הרצה: node e2e/app-plans-missed.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8198, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
// DEMO_TRIAL_START: הניסיון (14 יום) לא נגמר באמצע ההזזה — אחרת הסבב לא רץ בכלל
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', DEMO_TRIAL_START: '2026-11-15', OWNER_API_TOKEN: TOKEN },
    stdio: srvStdio('server-app-plans-missed') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const days = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
const dmy = iso => iso.split('-').reverse().join('.');
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
  const due1 = pA.installments[0].due, GRACE = 7, N = pA.installments.length;
  let adv = await post(`/demo/advance?days=${days(today0, due1) + GRACE}`);   // היום האחרון של החסד
  ok(adv.trial_active, 'הניסיון של הדמו נגמר — הסבב לא ירוץ: ' + JSON.stringify(adv));
  await api('/plan', { method: 'POST' });
  ok((await api('/plans')).find(x => x.id === pA.id).status === 'approved', 'בקרה: הוחמץ כבר ביום האחרון של החסד');

  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
  const card = p.getByTestId('plans'), rows = card.getByTestId('plan');
  await rows.first().waitFor();
  const rowOf = name => rows.filter({ hasText: name });
  ok(await rowOf(A.name).getAttribute('data-status') === 'approved', 'בקרה בדפדפן: A לא «פעיל»');
  ok((await rowOf(A.name).getByTestId('plan-badge').textContent()).trim() === 'פעיל', 'בקרה: תג A');
  const nx0 = await rowOf(A.name).getByTestId('plan-next').textContent();
  ok(nx0.includes(`באיחור של ${GRACE} ימים`), `ביום האחרון של החסד אין «באיחור של ${GRACE} ימים» (התאריך מהשרת?): ${nx0}`);
  ok(await p.locator('[data-testid="notice"][data-intent="plan_missed"]').count() === 0, 'בקרה: התראת הוחמץ לפני ההחמצה');

  adv = await post('/demo/advance?days=1');
  ok(adv.trial_active, 'הניסיון נגמר');
  await api('/plan', { method: 'POST' });
  const sA = (await api('/plans')).find(x => x.id === pA.id);
  ok(sA.status === 'missed' && sA.progress && sA.progress.done === 0, 'השרת: A לא הוחמץ: ' + JSON.stringify(sA));

  await p.reload();
  const rowA = rowOf(A.name);
  await rowA.and(p.locator('[data-status="missed"]')).waitFor();
  const order = await rows.evaluateAll(ls => ls.map(l => l.dataset.status));
  ok(order.join() === 'missed,completed', 'סדר: ' + order.join());
  ok((await rows.first().textContent()).includes(A.name), 'הוחמץ לא ראשון בכרטיס');
  ok((await rowA.getByTestId('plan-badge').textContent()).trim() === 'תשלום לא התקבל', 'תג «תשלום לא התקבל»');
  const late = days(due1, adv.today);
  ok(late === GRACE + 1, `איחור ${late}`);
  const nx = rowA.getByTestId('plan-next');
  ok(await nx.evaluate(e => e.classList.contains('font-bold')), '«הבא» של הוחמץ לא מודגש');
  const nxt = await nx.textContent();
  ok(nxt.includes(`תשלום 1 מתוך ${N}`) && nxt.includes(`באיחור של ${late} ימים`) && nxt.includes(dmy(due1)), '«הבא»: ' + nxt);
  ok((await rowA.textContent()).includes('התזכורות הרגילות חזרו'), 'אין הסבר מה קורה אחרי החמצה');
  ok(await rowA.getByRole('progressbar').getAttribute('aria-valuenow') === '0', 'פס התקדמות ≠ 0');
  const rowB = rowOf(B.name);
  ok(await rowB.getAttribute('data-status') === 'completed' && (await rowB.getByTestId('plan-next').textContent()).includes('כל התשלומים התקבלו'), 'B לא «הושלם»');
  ok(await rowB.getByRole('progressbar').getAttribute('aria-valuenow') === '100', 'B לא 100%');

  const notice = p.locator('[data-testid="notice"][data-intent="plan_missed"]');
  ok(await notice.count() === 1, `התראות plan_missed: ${await notice.count()}`);
  const nt = await notice.textContent();
  ok(nt.includes('תשלום בהסדר לא התקבל') && nt.includes(`תשלום 1 מתוך ${N}`), 'גוף התראת הוחמץ: ' + nt);
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-21-plan-missed.png` }); }

  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-21-plan-missed-390.png` }); }
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log(`✓ /app/ הוחמץ: /demo/advance דורש אימות · יום ${GRACE} של החסד ⇒ «פעיל» (איחור מהשרת) · יום ${GRACE + 1} ⇒ «תשלום לא התקבל» ראשון, «באיחור של ${late} ימים» מודגש, הסבר, 0%, B 100% · התראת plan_missed ב«דורש טיפול» · 390px`);
} finally { await b.close(); srv.kill(); }
