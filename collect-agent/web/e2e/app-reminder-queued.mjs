// מנהל 448 (מבקר 274ℹ️): תזכורת שאושרה בזמן שהשירות עצור (ניסיון פג) — שורת החשבונית בטבלה אומרת «⏳ … טרם נשלחה».
// שרת DEMO=1 אמיתי (dry-run), בלי יירוט, 390px:
//  1) /demo/advance 20 יום ⇒ ניסיון הדמו פג · אישור תזכורת ממתינה דרך ה-API (seen_hash כמו בממשק) ⇒ approved, לא יוצאת.
//  2) דפדפן /app/#/invoices: השורה מסומנת inv-queued עם «טרם נשלחה … אחרי חידוש» · /dashboard → queued_reason=trial_expired
//     · היומן היוצא לא גדל · בלי גלילה רוחבית · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-reminder-queued.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8269, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', OWNER_API_TOKEN: TOKEN },
    stdio: srvStdio('server-app-reminder-queued') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const adv = await api('/demo/advance?days=20', { method: 'POST' });
  ok(adv.trial_active === false, 'הניסיון לא פג אחרי הזזת השעון: ' + JSON.stringify(adv));
  const pend = (await api('/reminders?status=pending_approval')).filter(r => !r.block_reason && !r.amount_drift);
  ok(pend.length, 'אין תזכורת ממתינה בדמו');
  const rem = pend[0];
  const pv = await api(`/reminders/${rem.id}/preview`);
  const ob0 = (await api('/outbox')).messages.length;
  const ap = await post(`/reminders/${rem.id}/approve`, { confirm_open: true, confirm_amount: true, seen_hash: pv.body_hash });
  ok(ap.status === 'approved', 'האישור: ' + JSON.stringify(ap));
  await api('/dispatch', { method: 'POST' });
  const row = (await api('/dashboard')).invoices.find(x => x.last_reminder?.id === rem.id);
  ok(row && row.last_reminder.queued_reason === 'trial_expired', 'השרת: ' + JSON.stringify(row?.last_reminder));
  ok((await api('/outbox')).messages.length === ob0, 'משהו יצא בזמן שהשירות עצור');

  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', x => { if (x.status() >= 400) errors.push(`${x.status()} ${x.url()}`); });
  await p.goto(`${base}/app/#/invoices`);
  const mark = p.getByTestId('inv-queued');
  await mark.first().waitFor({ timeout: 10000 });
  const t = await mark.first().textContent();
  ok(/טרם נשלחה/.test(t) && /אחרי חידוש/.test(t) && /בתור מאז \d{1,2}\.\d{1,2} · עוד \d+ ימים/.test(t), 'הסימן (ספירה לאחור, מנהל 449): ' + t);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית ב-390px');
  if (out) { await mark.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/app-reminder-queued-390.png` }); }
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log(`✓ /app/ חשבוניות: תזכורת שאושרה בזמן עצירה מסומנת «${t.slice(0, 40)}…» · queued_reason=trial_expired · אפס יציאות · 390px · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
