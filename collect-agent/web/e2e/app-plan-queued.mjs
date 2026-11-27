// מנהל 444 (מבקר 271🟡): «✓ אישור ההצעה» (הסדר תשלומים) כשהשירות עצור (ניסיון פג) — הטוסט לא אומר «נשלחה ללקוח».
// שרת DEMO=1 אמיתי (dry-run), בלי יירוט, 390px:
//  1) /demo/advance 20 יום ⇒ ניסיון הדמו פג · אחר כך לקוח מבקש פריסה ⇒ הצעה proposed (מועדים עתידיים).
//  2) דפדפן: חימוש + אישור ⇒ טוסט «עדיין לא נשלחה … חידוש» (לא «ונשלחה») · השרת: approved, queued_reason=trial_expired
//     · היומן היוצא לא גדל · בלי גלילה רוחבית · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-plan-queued.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8268, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', OWNER_API_TOKEN: TOKEN },
    stdio: srvStdio('server-app-plan-queued') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const A = (await api('/customers')).find(c => c.phone && !c.opted_out && !c.disputed && /^0[57]/.test(c.phone));
  ok(A, 'אין לקוח עם נייד בדמו');
  const adv = await api('/demo/advance?days=20', { method: 'POST' });
  ok(adv.trial_active === false, 'הניסיון לא פג אחרי הזזת השעון: ' + JSON.stringify(adv));
  const r1 = await post('/conversation/inbound', { channel: 'sms', sender: A.phone, text: 'אפשר לפרוס את זה לתשלומים?' });
  ok(r1.intent === 'plan_request' && r1.plan_id, 'בקשת פריסה לא זוהתה: ' + JSON.stringify(r1));
  const pid = r1.plan_id;
  const plan0 = (await api('/plans')).find(x => x.id === pid);
  ok(plan0 && plan0.status === 'proposed' && (plan0.amount_check?.length ?? 0) === 0, 'ההצעה לא proposed: ' + JSON.stringify(plan0));
  const ob0 = (await api('/outbox')).messages.length;

  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', x => { if (x.status() >= 400) errors.push(`${x.status()} ${x.url()}`); });
  await p.goto(`${base}/app/#/dashboard`);
  const offer = p.locator(`[data-testid="plan-offer"][data-pid="${pid}"]`);
  await offer.waitFor();
  await offer.getByRole('button', { name: /אישור ההצעה/ }).click();
  await offer.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
  const toast = p.getByTestId('toast');
  await toast.first().waitFor();
  await toast.filter({ hasText: 'עדיין לא נשלחה' }).waitFor({ timeout: 5000 }).catch(async () => { throw new Error('טוסט: ' + await toast.first().textContent()); });
  const tt = await toast.first().textContent();
  ok(!/ונשלחה/.test(tt) && /חידוש/.test(tt), 'טוסט שגוי: ' + tt);
  ok((await api('/plans')).find(x => x.id === pid).status === 'approved', 'ההסדר לא approved בשרת');
  const sd = (await api('/conversation/drafts?status=approved')).find(d => d.plan_id === pid);
  ok(sd && sd.queued_reason === 'trial_expired', 'השרת: ' + JSON.stringify(sd));
  ok((await api('/outbox')).messages.length === ob0, 'משהו יצא בזמן שהשירות עצור');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית ב-390px');
  if (out) await p.screenshot({ path: `${out}/app-plan-queued-390.png`, fullPage: true });
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /app/ «אישור ההצעה» בזמן עצירה: טוסט «עדיין לא נשלחה … חידוש» · approved + queued_reason=trial_expired · אפס יציאות · 390px · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
