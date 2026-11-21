// גבי עיצוב: סריקת עיצוב למצבים המותנים — כרטיסים שמופיעים רק במצב מסוים, ולכן סריקת הדמו (app-contrast) לא רואה אותם.
// מול שרת DEMO=1 אמיתי נוצרים דרך ה-API (כמו שהם נוצרים בחיים): הבטחה מעבר ל-14 יום («בדוק ואשר»), «שילמתי» מטלפון
// משותף לשני לקוחות (כרטיס שיוך), DSN בלי Message-ID שלנו (כרטיס «בדוק ואשר» ל-bounce), תלונת ספאם מאומתת, בקשות
// פרטיות (מחיקה+עיון), מועד מוערך (CSV), השהיית קטין. ואז בבית, בתשובות ובחשבוניות, דסקטופ+390px:
//   ניגודיות AA (contrast-lib) · בלי גלילה רוחבית · במובייל כל יעד-לחיצה בתוך «דורש טיפול» גבוה ≥40px · 0 שגיאות.
// הרצה: node e2e/app-states-sweep.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8181, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url'), HOOK = randomBytes(24).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, EMAIL_WEBHOOK_KEY: HOOK }, stdio: srvStdio('server-app-states-sweep') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const post = (p, body) => api(p, { method: 'POST', body: JSON.stringify(body) });
const hook = body => fetch(`${base}/webhooks/email?k=${HOOK}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await waitHealthy(base, srv);
const errors = [], findings = [];
const b = await launchChromium(chromium);
try {
  // ---- מצבים ----
  const dash = await api('/dashboard'), open = dash.invoices.filter(r => r.status === 'open');
  const sent = (await api('/outbox')).messages, mailOf = e => sent.find(m => m.channel === 'email' && m.to.toLowerCase() === (e || '').toLowerCase());
  const custs = await api('/customers'), list = Array.isArray(custs) ? custs : (custs.customers ?? []);
  const withPhone = list.filter(c => c.phone);
  ok(withPhone.length >= 2, 'אין מספיק לקוחות דמו עם טלפון');
  const minor = { customer_id: withPhone[0].id }, prom = withPhone[1];
  { const r = await post('/inbound', { channel: 'sms', sender: prom.phone, text: 'אשלם ב-28 בנובמבר' });
    ok(r.tags?.includes('promise_over_limit'), 'הבטחה מעל 14 לא סומנה: ' + JSON.stringify(r).slice(0, 300)); }
  await post(`/customers/${minor.customer_id}/hold`, { reason: 'minor', note: 'קטין לפי הורה' });
  await post(`/customers/${minor.customer_id}/dsr`, { kind: 'deletion', note: 'ביקש מחיקה בטלפון' });
  await post(`/customers/${minor.customer_id}/dsr`, { kind: 'access', note: 'ביקש עותק' });
  const mailed = open.filter(r => r.email && mailOf(r.email));
  ok(mailed.length >= 2, 'אין שני לקוחות עם מייל שיצא');
  await hook({ sender: 'MAILER-DAEMON@mx.example', subject: 'Undelivered Mail Returned to Sender', message_id: 'sw-b1',
    text: `Final-Recipient: rfc822; ${mailed[0].email}\nAction: failed\nStatus: 5.1.1\n` });          // בלי Message-ID ⇒ «בדוק ואשר»
  await hook({ sender: 'fbl@isp.example', subject: 'Email Abuse Report', message_id: 'sw-arf',
    text: `Feedback-Type: abuse\nVersion: 1\nOriginal-Rcpt-To: ${mailed[1].email}\nMessage-ID: <${mailOf(mailed[1].email).provider_message_id}>` });
  await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(
    'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך,תאריך לתשלום\n9401,אבא משותף,050-0000401,700,2026-10-01,\n9402,בן משותף,050-0000401,500,2026-10-02,2026-11-01\n', 'utf8') });
  await post('/inbound', { channel: 'sms', sender: '050-0000401', text: 'שילמתי אתמול בהעברה' });   // טלפון משותף ⇒ כרטיס שיוך

  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  };
  for (const [tag, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const p = await ctx.newPage(); watch(p);
    for (const [route, ready] of [['dashboard', 'needs-you'], ['inbox', 'dsr-register'], ['invoices', 'due-estimated']]) {
      await p.goto(`${base}/app/#/${route}`); await p.getByTestId(ready).first().waitFor();
      await p.waitForTimeout(300);
      const { fails } = await scan(p);
      for (const f of fails) findings.push(`${tag} ${route} ניגודיות ${f.r}<${f.need}: «${f.t}» (${f.cls})`);
      if (!(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))) findings.push(`${tag} ${route}: גלילה רוחבית`);
      if (tag === 'mobile' && route !== 'invoices') {
        const small = await p.locator(route === 'dashboard' ? '[data-testid="needs-you"]' : 'main').first().evaluate(root => [...root.querySelectorAll('button,a[href],input,select,summary')]
          .filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return [(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30), Math.round(r.height)]; })
          .filter(([, h]) => h < 40));
        for (const [t, h] of small) findings.push(`mobile ${route}: יעד ${h}px < 40: «${t}»`);
      }
      if (out) await p.screenshot({ path: `${out}/states-${route}-${tag}.png`, fullPage: true });
    }
    // שהמצבים אכן מוצגים (אחרת הסריקה ריקה)
    if (tag === 'desktop') {
      await p.goto(`${base}/app/#/dashboard`); await p.getByTestId('needs-you').waitFor();
      for (const id of ['notice-assign', 'notice-bounce-block', 'notice-dsr-link'])
        ok(await p.getByTestId(id).count() > 0, `המצב לא מוצג בבית: ${id}`);
      await p.goto(`${base}/app/#/inbox`); await p.getByTestId('dsr-register').waitFor();
      ok(await p.getByTestId('promise-request').count() > 0, 'המצב לא מוצג בתשובות: promise-request');
    }
    await ctx.close();
  }
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  if (findings.length) { console.log('✗ ממצאים:\n  ' + findings.join('\n  ')); process.exitCode = 1; }
  else console.log('✓ מצבים מותנים (הבטחה>14, שיוך משותף, bounce לבדיקה, ספאם, DSR, מוערך, קטין): AA, בלי גלילה רוחבית, יעדים ≥40px במובייל, 0 שגיאות — דסקטופ+390px');
} finally { await b.close(); srv.kill(); }
