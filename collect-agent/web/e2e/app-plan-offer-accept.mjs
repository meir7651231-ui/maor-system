// מנהל 363 · QA (ב«הבא» מאז 356): הצעת פריסה שבעל העסק מאשר בדשבורד /app/ ⇒ הלקוח עונה «מאשר» ⇒ בתור התשובות
// כרטיס plan_accept עם «ההסדר בתוקף». עד היום 202🟠/356 נבדק רק ב-pytest (test_mgr356_dashboard_plan_state) — לא
// הלחיצה האמיתית ב«דורש טיפול שלך» מול שרת DEMO=1. כאן:
//   1. לקוח מבקש פריסה ב-SMS ⇒ בדשבורד כרטיס «💳 הצעת פריסה» עם שם הלקוח + הלוח; בתור — כרטיס plan_request.
//   2. «✓ אישור ההצעה» דורש לחיצה שנייה (לחיצה אחת ⇒ השרת עדיין proposed) ⇒ לחיצה שנייה ⇒ טוסט «אושרה ונשלחה»,
//      הכרטיס נעלם מ«דורש טיפול», בשרת approved, והטיוטה הישנה של plan_request יוצאת מהתור (לא שתי הודעות ללקוח).
//   3. הלקוח עונה «מאשר» ⇒ plan_accept על **אותו** הסדר (לא הצעה שנייה, לא «לא זיהיתי»), עדיין הסדר אחד.
//   4. /app/#/inbox: כרטיס plan_accept אחד ללקוח, הסיכום «אישר/ה את ההסדר שאישרת», הגוף «ההסדר בתוקף» + התשלום הראשון.
//   5. «✓ אשר ושלח» ⇒ התור ריק מהלקוח, בשרת הטיוטה sent_dry_run, ההסדר נשאר approved (לא «הועבר לאישור סופי»).
//   דסקטופ + 390px בלי גלילה רוחבית, אפס שגיאות קונסולה / 4xx.
// דרישה: npm run build. הרצה: node e2e/app-plan-offer-accept.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8199, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-plan-offer-accept') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
const queueOf = async cid => (await api('/conversation/drafts')).filter(d => d.customer_id === cid);
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const A = (await api('/customers')).find(c => c.phone && !c.opted_out && !c.disputed && /^0[57]/.test(c.phone));
  ok(A, 'אין לקוח עם נייד בדמו');
  const r1 = await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'אפשר לפרוס את זה לתשלומים?' });
  ok(r1.intent === 'plan_request' && r1.plan_id, 'בקשת פריסה לא זוהתה: ' + JSON.stringify(r1));
  const pid = r1.plan_id;
  const plan0 = (await api('/plans')).find(x => x.id === pid);
  ok(plan0 && plan0.status === 'proposed' && (plan0.amount_check?.length ?? 0) === 0, 'ההצעה לא proposed (או סכום חריג): ' + JSON.stringify(plan0));
  const q0 = await queueOf(A.id);
  ok(q0.some(d => d.intent === 'plan_request'), 'אין כרטיס plan_request בתור לפני האישור: ' + JSON.stringify(q0.map(d => d.intent)));

  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);

  // 1. הכרטיס ב«דורש טיפול שלך»
  const offer = p.locator(`[data-testid="plan-offer"][data-pid="${pid}"]`);
  await offer.waitFor();
  const ot = await offer.textContent();
  ok(ot.includes('הצעת פריסה') && ot.includes(A.name), 'כרטיס ההצעה בלי שם הלקוח: ' + ot);
  ok(await offer.locator('ol li').count() === plan0.installments.length, 'מספר התשלומים בכרטיס ≠ ההצעה');
  const d1 = plan0.installments[0].due.split('-').reverse().join('.');
  ok(ot.includes(d1), `מועד התשלום הראשון ${d1} לא בכרטיס`);
  if (out) { await offer.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-22-plan-offer.png` }); }

  // 2. לחיצה כפולה (חימוש) ⇒ אושר ונשלח
  const btn = offer.getByRole('button', { name: /אישור ההצעה/ });
  await btn.click();
  await offer.getByRole('button', { name: 'לחצו שוב לאישור' }).waitFor();
  ok((await api('/plans')).find(x => x.id === pid).status === 'proposed', 'לחיצה אחת כבר אישרה את ההצעה (בלי חימוש)');
  await offer.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
  await p.getByTestId('toast').filter({ hasText: 'ההצעה אושרה ונשלחה' }).waitFor();
  await offer.waitFor({ state: 'detached' });
  ok((await api('/plans')).find(x => x.id === pid).status === 'approved', 'בשרת ההסדר לא approved אחרי הלחיצה השנייה');
  const q1 = await queueOf(A.id);
  ok(!q1.some(d => d.intent === 'plan_request'), 'טיוטת plan_request נשארה בתור אחרי שההצעה יצאה — שתי הודעות ללקוח: ' + JSON.stringify(q1.map(d => d.intent)));

  // 3. הלקוח עונה «מאשר»
  const r2 = await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'מאשר' });
  ok(r2.intent === 'plan_accept' && r2.plan_id === pid, '«מאשר» לא זוהה כאישור ההסדר הזה (202🟠): ' + JSON.stringify(r2));
  ok(!(r2.owner_summary || '').includes('לא זיהיתי'), '«לא זיהיתי» בסיכום');
  const plans = (await api('/plans')).filter(x => x.customer_id === A.id);
  ok(plans.length === 1 && plans[0].status === 'approved', 'נוצרה הצעה שנייה / ההסדר זז: ' + JSON.stringify(plans.map(x => [x.id, x.status])));

  // 4. בתור התשובות ב-/app/
  await p.goto(`${base}/app/#/inbox`);
  const card = p.getByTestId(`draft-${r2.draft_id}`);
  await card.waitFor();
  ok(await card.getAttribute('data-intent') === 'plan_accept', 'הכרטיס אינו plan_accept');
  ok(await p.locator(`[data-testid^="draft-"][data-intent="plan_request"]`).count() === 0, 'כרטיס plan_request ישן בתור');
  const ct = await card.textContent();
  ok(ct.includes(A.name) && ct.includes('אישר/ה את ההסדר שאישרת'), 'סיכום הכרטיס: ' + ct.slice(0, 300));
  const body = await card.locator('textarea').inputValue();
  ok(body.includes('ההסדר בתוקף') && body.includes('התשלום הראשון') && !body.includes('לאישור סופי'), 'גוף התשובה: ' + body);
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-22-plan-accept-inbox.png` }); }

  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל (תור)');
  if (out) { await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-22-plan-accept-inbox-390.png` }); }

  // 5. אשר ושלח
  await card.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByTestId('toast').filter({ hasText: 'המענה אושר ונשלח' }).waitFor();
  await card.waitFor({ state: 'detached' });
  ok((await queueOf(A.id)).length === 0, 'נשארו טיוטות ללקוח בתור');
  const sent = (await api('/conversation/drafts?status=sent_dry_run')).find(d => d.id === r2.draft_id);
  ok(sent, 'הטיוטה לא sent_dry_run בשרת');
  ok((await api('/plans')).find(x => x.id === pid).status === 'approved', 'ההסדר לא approved אחרי שליחת האישור');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /app/ הצעה מהדשבורד ⇒ «מאשר»: כרטיס «הצעת פריסה» עם הלוח · חימוש (לחיצה אחת לא מאשרת) · אושר ⇒ plan_request יוצא מהתור · «מאשר» ⇒ plan_accept על אותו הסדר, בלי הצעה שנייה · בתור «ההסדר בתוקף» ⇒ אשר ושלח ⇒ sent_dry_run · 390px');
} finally { await b.close(); srv.kill(); }
