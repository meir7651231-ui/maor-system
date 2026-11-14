// הפעלה 193 (critic סבב 70 💡): Content-Security-Policy בעמודי השרת — בדפדפן אמיתי מול DEMO=1 (dry-run).
// לכל עמוד: הכותרת קיימת, העמוד עולה ועובד, ו-0 אירועי securitypolicyviolation (המדיניות לא שוברת כלום).
// ביקורת חיובית: סקריפט inline שמוזרק לעמוד (כמו XSS) נחסם ונרשמת הפרה ⇒ המדיניות באמת נאכפת.
// דרישה: npm run build. הרצה: node e2e/csp.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { srvStdio, srvLogLevel, assertPortFree, waitHealthy } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const ok = (c, m) => { if (!c) throw new Error(m); };
const port = 8171, base = `http://127.0.0.1:${port}`;
await assertPortFree(port);
const TOKEN = (await import('node:crypto')).randomBytes(32).toString('base64url');
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(port), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(port) }, stdio: srvStdio(`server-csp-${port}`) });
await waitHealthy(base, srv);
const H = { Authorization: 'Bearer ' + TOKEN };
const api = async (p, m = 'GET') => (await fetch(base + p, { method: m, headers: H })).json();

const b = await chromium.launch(); const fails = [];
try {
  await api('/sync', 'POST'); await api('/plan', 'POST');
  // קוד /p/ אמיתי מתור התזכורות
  const q = await api('/reminders');
  const body = JSON.stringify(q);
  const code = (body.match(/\/p\/(\w+)/) || [])[1];
  ok(code, 'לא נמצא קוד /p/ בתור');
  const pages = [
    ['/p', `/p/${code}`, async p => ok(await p.locator('form').count() >= 1, '/p: אין טפסים')],
    ['/p-404', '/p/zzzzzzz', async () => {}],
    ['/ui', '/ui', async p => {
      await p.evaluate(t => sessionStorage.setItem('gabi_owner_token', t), TOKEN); await p.reload();
      await p.waitForFunction(() => document.querySelector('#kpis')?.textContent.trim().length > 0, null, { timeout: 15000 });
    }],
    ['/app dashboard', `/app/#/dashboard?token=${TOKEN}`, async p =>
      p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached', timeout: 15000 })],
    ['/app landing', '/app/', async p => ok((await p.textContent('body')).includes('119'), '/app/: דף הנחיתה לא עלה')],
    ['/pay', `/pay/${code}`, async p => { await p.getByTestId('pay-amount').waitFor({ timeout: 15000 });
      ok(await p.getByTestId('pay-page').count() === 1, '/pay: חסר כפתור התשלום'); }],
    ['/connect/orbit', '/connect/orbit', async p =>
      p.locator('#st').filter({ hasText: 'אינו תקף' }).waitFor({ timeout: 10000 })],   // בלי #h ⇒ הסקריפט רץ וכתב הודעה
  ];
  for (const [name, path, check] of pages) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    p.on('console', m => m.type() === 'error' && /Content Security Policy/i.test(m.text()) && errs.push(m.text()));
    await p.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation',
      e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
    try {
      const r = await p.goto(base + path);
      ok(/default-src 'none'/.test(r.headers()['content-security-policy'] || ''), `${name}: אין CSP`);
      await check(p);
      await p.waitForTimeout(400);
      const v = await p.evaluate(() => window.__csp);
      ok(!v.length && !errs.length, `${name}: הפרות CSP/שגיאות: ${[...v, ...errs].join(' | ')}`);
      // ביקורת חיובית: סקריפט inline מוזרק לא רץ
      const ran = await p.evaluate(() => { const s = document.createElement('script'); s.textContent = 'window.__pwn=1';
        document.head.append(s); return window.__pwn === 1; });
      await p.waitForTimeout(100);
      ok(!ran && (await p.evaluate(() => window.__csp.length)) > 0, `${name}: סקריפט מוזרק רץ — המדיניות לא נאכפת`);
      console.log(`✓ ${name}`);
    } catch (e) { fails.push(String(e.message || e)); } finally { await p.close(); }
  }
} finally { await b.close(); srv.kill(); }
ok(!fails.length, 'CSP:\n' + fails.join('\n'));
console.log('csp: 7/7 עמודים בלי הפרות, וסקריפט מוזרק נחסם בכולם');
