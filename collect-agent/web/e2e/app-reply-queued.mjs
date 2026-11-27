// מנהל 443 (מבקר 270🟡): «✓ אשר ושלח» כשהשירות עצור (ניסיון פג) — הטוסט לא אומר «נשלח», והתשובה מופיעה
// ב«⏳ אושרו וממתינות לשליחה» במקום להיעלם בשקט. שרת DEMO=1 אמיתי (dry-run), בלי יירוט, 390px:
//  1) לקוח כותב «איך אפשר לשלם?» ⇒ טיוטה בתור · /demo/advance 20 יום ⇒ ניסיון הדמו פג (השירות עצור).
//  2) דפדפן: «אשר ושלח» ⇒ טוסט «עדיין לא נשלח … חידוש» (לא «ונשלח") · כרטיס התור עם שם הלקוח · השרת: approved
//     + queued_reason=trial_expired · היומן היוצא לא גדל · בלי גלילה רוחבית · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-reply-queued.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8267, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', OWNER_API_TOKEN: TOKEN },
    stdio: srvStdio('server-app-reply-queued') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const cust = (await api('/customers')).find(c => c.phone && !c.opted_out);
  ok(cust, 'אין לקוח עם טלפון בדמו');
  const r = await post('/conversation/inbound', { channel: 'sms', sender: cust.phone, text: 'איך אפשר לשלם?' });
  ok(r.draft_id, 'לא נוצרה טיוטה: ' + JSON.stringify(r));
  const adv = await api('/demo/advance?days=20', { method: 'POST' });
  ok(adv.trial_active === false, 'הניסיון לא פג אחרי הזזת השעון: ' + JSON.stringify(adv));
  const ob0 = (await api('/outbox')).messages.length;

  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', x => { if (x.status() >= 400) errors.push(`${x.status()} ${x.url()}`); });
  await p.goto(`${base}/app/#/inbox`);
  const card = p.getByTestId('drafts').locator('li', { hasText: cust.name.split(' ')[0] }).first();
  await card.waitFor();
  await card.getByRole('button', { name: 'אשר ושלח' }).click();
  const toast = p.getByTestId('toast');
  await toast.filter({ hasText: 'עדיין לא נשלח' }).waitFor();
  const tt = await toast.first().textContent();
  ok(!/ונשלח/.test(tt) && /חידוש/.test(tt), 'טוסט שגוי: ' + tt);
  const q = p.getByTestId('queued-drafts');
  await q.waitFor();
  ok((await q.textContent()).includes(cust.name.split(' ')[0]), 'כרטיס התור בלי שם הלקוח');
  const sd = (await api('/conversation/drafts?status=approved')).find(d => d.id === r.draft_id);
  ok(sd && sd.queued_reason === 'trial_expired', 'השרת: ' + JSON.stringify(sd));
  ok((await api('/outbox')).messages.length === ob0, 'משהו יצא בזמן שהשירות עצור');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית ב-390px');
  if (out) await p.screenshot({ path: `${out}/app-reply-queued-390.png`, fullPage: true });
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /app/ «אשר ושלח» בזמן עצירה: טוסט «עדיין לא נשלח … חידוש» · כרטיס «ממתינות לשליחה» · queued_reason=trial_expired · אפס יציאות · 390px · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
