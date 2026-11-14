// התראות מערכת לבעל העסק בדשבורד החי («דורש טיפול שלך»): שרת גבי (DEMO=1, dry-run) עם ניסיון שמסתיים
// בעוד 3 ימים ⇒ כרטיס trial_ending, בדסקטופ ובמובייל, בלי גלילה רוחבית ובלי שגיאות. ניסיון רגיל (9 ימים) ⇒ אין כרטיס.
// דרישה: npm run build. הרצה: node e2e/notices.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { srvStdio, srvLogLevel, waitHealthy } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const ok = (c, m) => { if (!c) throw new Error(m); };

async function run(port, trialStart) {
  const base = `http://127.0.0.1:${port}`;
  const TOKEN = (await import('node:crypto')).randomBytes(32).toString('base64url');
  const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(port), '--log-level', srvLogLevel()],
    { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(port), DEMO_TRIAL_START: trialStart }, stdio: srvStdio(`server-notices-${port}`) });
  await waitHealthy(base, srv);
  const b = await chromium.launch(); const errors = []; const seen = {};
  try {
    for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      const p = await b.newPage({ viewport: vp });
      p.on('pageerror', e => errors.push(String(e)));
      p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
      await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
      await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
      await p.getByTestId('kpi-grid').or(p.getByTestId('needs-you')).first().waitFor({ state: 'attached' }).catch(() => {});
      await p.waitForTimeout(600);
      const notices = p.getByTestId('notice');
      seen[name] = { n: await notices.count(), intents: await notices.evaluateAll(els => els.map(e => e.dataset.intent)),
        text: (await notices.count()) ? await notices.first().textContent() : '' };
      ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
      await p.close();
    }
  } finally { await b.close(); srv.kill(); }
  ok(!errors.length, 'שגיאות קונסולה: ' + errors.join(' | '));
  return seen;
}

const ending = await run(8161, '2026-10-28');   // שעון ההדגמה 8.11 ⇒ נותרו 3 ימים
for (const k of ['desktop', 'mobile']) {
  ok(ending[k].intents.includes('trial_ending'), `${k}: אין כרטיס סוף ניסיון`);
  ok(/מסתיימת בעוד 3 ימים/.test(ending[k].text), `${k}: נוסח סוף הניסיון חסר: ${ending[k].text}`);
}
const normal = await run(8163, '2026-11-03');   // נותרו 9 ימים ⇒ אין התראה
ok(!normal.desktop.intents.includes('trial_ending'), 'כרטיס סוף ניסיון הופיע כשנותרו 9 ימים');
console.log('✓ התראות לבעל העסק: סוף ניסיון מוצג (דסקטופ+מובייל), לא מוצג כשאין צורך · 0 שגיאות');
