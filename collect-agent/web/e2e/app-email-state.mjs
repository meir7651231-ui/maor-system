// גבי עיצוב: «כתובת המייל לא פעילה (חזר)» ו«הלקוח סימן ספאם» בשורת הלקוח — /app/ (חשבוניות) ו-/ui (חובות) — מול
// שרת DEMO=1 אמיתי: bounce קבוע (DSN 5.1.1) ותלונת ספאם (ARF) נשלחים ל-/webhooks/email כמו מספק הדואר.
// בודק: ההערה מופיעה בשורה הנכונה עם פעולת תיקון (קישור להגדרות), אין הערה ללקוח אחר, ניגודיות AA (סורק
// contrast-lib) בדסקטופ+390px, /ui בהיר+כהה, בלי גלילה רוחבית, 0 שגיאות. הרצה: node e2e/app-email-state.mjs [צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8165, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url'), HOOK = randomBytes(24).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, EMAIL_WEBHOOK_KEY: HOOK }, stdio: srvStdio('server-app-email-state') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const hook = body => fetch(`${base}/webhooks/email?k=${HOOK}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // שני לקוחות שקיבלו מייל ביומן הדמו, עם חשבונית פתוחה
  const dash = await api('/dashboard');
  const mailed = new Set((await api('/outbox')).messages.filter(m => m.channel === 'email').map(m => m.to.toLowerCase()));
  const open = dash.invoices.filter(r => r.status === 'open' && r.email && mailed.has(r.email.toLowerCase()));
  const byMail = [...new Map(open.map(r => [r.email.toLowerCase(), r])).values()];
  ok(byMail.length >= 2, 'פחות משני לקוחות עם מייל שיצא: ' + byMail.length);
  const [bounced, spam] = byMail;
  const clean = dash.invoices.find(r => r.status === 'open' && r.customer !== bounced.customer && r.customer !== spam.customer);
  ok(clean, 'אין לקוח ביקורת');
  ok(dash.invoices.every(r => r.email_state == null), 'email_state לא ריק לפני האירועים');
  let r = await hook({ sender: 'MAILER-DAEMON@mx.example', subject: 'Undelivered Mail Returned to Sender', message_id: 'e2e-bounce',
    text: `Final-Recipient: rfc822; ${bounced.email}\nAction: failed\nStatus: 5.1.1\n` });
  { const j = await r.json(); ok(r.ok && j.bounce === 'failed', 'ה-bounce לא נקלט: ' + r.status + ' ' + JSON.stringify(j)); }
  r = await hook({ sender: 'fbl@isp.example', subject: 'Email Abuse Report', message_id: 'e2e-arf',
    text: `Feedback-Type: abuse\nUser-Agent: ISP-FBL/1.0\nVersion: 1\nOriginal-Rcpt-To: ${spam.email}\nArrival-Date: Thu, 19 Nov 2026 08:00:00 +0200` });
  ok(r.ok && (await r.json()).complaint === 'suppressed', 'תלונת הספאם לא נקלטה');
  const st = Object.fromEntries((await api('/dashboard')).invoices.map(x => [x.customer, x.email_state]));
  ok(st[bounced.customer] === 'bounced' && st[spam.customer] === 'spam' && st[clean.customer] == null, 'מצבי השרת: ' + JSON.stringify(st));
  ok((await api('/dashboard?view=list')).invoices.some(x => x.email_state === 'spam'), 'view=list בלי email_state');

  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    p.on('response', x => { if (x.status() >= 400) errors.push(`${x.status()} ${x.url()}`); });
  };
  const aa = async (p, where) => { const { fails } = await scan(p); ok(!fails.length, `ניגודיות < AA ב-${where}: ` + JSON.stringify(fails.slice(0, 3))); };
  const noH = async (p, where) => ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `גלילה רוחבית: ${where}`);

  // /app/ — מסך החשבוניות
  for (const [w, h, tag] of [[1366, 900, 'desktop'], [390, 844, 'mobile']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const p = await ctx.newPage(); watch(p);
    await p.goto(`${base}/app/#/invoices`);
    await p.getByTestId('email-state').first().waitFor();
    const notes = await p.getByTestId('email-state').evaluateAll(els => els.map(e => ({ s: e.dataset.state, row: e.closest('tr')?.textContent ?? '' })));
    ok(notes.some(n => n.s === 'bounced' && n.row.includes(bounced.customer)), `${tag}: אין «המייל חזר» בשורת ${bounced.customer}`);
    ok(notes.some(n => n.s === 'spam' && n.row.includes(spam.customer)), `${tag}: אין «ספאם» בשורת ${spam.customer}`);
    ok(!notes.some(n => n.row.includes(clean.customer)), `${tag}: הערה אצל לקוח תקין ${clean.customer}`);
    const fix = p.locator('[data-testid="email-state"][data-state="bounced"]').first().getByTestId('email-state-fix');
    const fb = await fix.boundingBox(); ok(fb && fb.height >= 40, `${tag}: יעד «לתיקון» < 40px: ` + JSON.stringify(fb));
    await aa(p, `/app/ חשבוניות ${tag}`); await noH(p, `/app/ ${tag}`);
    if (out) await p.locator('[data-testid="email-state"]').first().screenshot({ path: `${out}/email-state-app-${tag}.png` });
    await fix.click(); await p.getByTestId('settings-live').waitFor();
    ok(/#\/settings$/.test(p.url()), `${tag}: «לתיקון» לא הוביל להגדרות: ${p.url()}`);
    await ctx.close();
  }
  // /ui — טבלת החובות, בהיר+כהה
  for (const scheme of ['light', 'dark']) for (const [w, h] of [[1280, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const p = await ctx.newPage(); watch(p);
    await p.goto(`${base}/ui`);
    await p.locator('[data-estate]').first().waitFor();
    const rows = await p.locator('[data-estate]').evaluateAll(els => els.map(e => ({ s: e.dataset.estate, row: e.closest('tr')?.textContent ?? '' })));
    ok(rows.some(x => x.s === 'bounced' && x.row.includes(bounced.customer)) && rows.some(x => x.s === 'spam' && x.row.includes(spam.customer))
      && !rows.some(x => x.row.includes(clean.customer)), `/ui ${scheme} ${w}: שורות: ` + JSON.stringify(rows.map(x => x.s)));
    await aa(p, `/ui ${scheme} ${w}px`); await noH(p, `/ui ${scheme} ${w}px`);
    if (out && w === 390) await p.locator('[data-estate="spam"]').first().screenshot({ path: `${out}/email-state-ui-${scheme}.png` });
    await ctx.close();
  }
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log(`✓ מצב המייל: bounce 5.1.1 + ARF דרך /webhooks/email ⇒ «חזר»/«ספאם» בשורה הנכונה ב-/app/ וב-/ui · לקוח תקין בלי הערה · «לתיקון» ⇒ הגדרות · AA דסקטופ+390px · /ui בהיר+כהה`);
} finally { await b.close(); srv.kill(); }
