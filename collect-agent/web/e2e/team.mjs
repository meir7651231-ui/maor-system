// מנהל 328: «צוות ותפקידים» בהגדרות /app/ מול שרת גבי אמיתי (DEMO=1, dry-run). עובד הדמו (DEMO_USER_EMAIL) הוא
// הראשון ⇒ בעל העסק הפעיל היחיד ⇒ הכרטיס מציג אותו בלי «הורדה»/«השבתה» ועם ההסבר. טוקן משותף = בעל העסק ⇒ הכרטיס
// גלוי. דסקטופ + 390px בלי גלילה רוחבית, ניגודיות AA, אפס שגיאות. הפעולות עצמן: tests/test_mgr328_team_screen.py.
// דרישה: npm run build. הרצה: node e2e/team.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8173, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT),
    DEMO_USER_EMAIL: 'demo-team@biz.example', DEMO_USER_PASSWORD: 'demo-team-password-1' }, stdio: srvStdio('server-team') });
const H = { Authorization: `Bearer ${TOKEN}` };
const b = await launchChromium(chromium); const errors = [];
try {
  await waitHealthy(base, srv);
  const t = await (await fetch(`${base}/team`, { headers: H })).json();
  ok(t.users?.length === 1 && t.users[0].role === 'owner', 'עובד הדמו לא נוצר כבעל העסק: ' + JSON.stringify(t));
  const uid = t.users[0].id;
  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(String(e)));
    p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
    await p.goto(`${base}/app/#/settings?token=${TOKEN}`);
    await p.getByTestId('settings-live').waitFor();
    const row = p.getByTestId(`team-row-${uid}`);
    await row.waitFor();
    ok((await p.getByTestId(`team-role-${uid}`).textContent()) === 'בעל העסק', `${name}: התפקיד לא מוצג`);
    ok(await p.getByTestId(`team-toggle-${uid}`).count() === 0, `${name}: אפשר להוריד את הבעלים האחרון`);
    ok(await p.getByTestId(`team-off-${uid}`).count() === 0, `${name}: אפשר להשבית את הבעלים האחרון`);
    ok(/היחיד/.test(await row.textContent() ?? ''), `${name}: אין הסבר למה אין פעולות`);
    await row.scrollIntoViewIfNeeded();
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    const { fails } = await scan(p);
    ok(!fails.length, `${name}: ניגודיות < AA במסך ההגדרות: ` + JSON.stringify(fails.slice(0, 3)));
    if (out) await p.getByTestId('team-list').screenshot({ path: `${out}/team-${name}.png` });
    await p.close();
  }
  ok(!errors.length, 'שגיאות בדפדפן: ' + errors.join(' | '));
  console.log('✓ team: כרטיס צוות ותפקידים — בעלים אחרון מוגן, 390px, AA, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
