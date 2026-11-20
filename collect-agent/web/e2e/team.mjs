// מנהל 328: «צוות ותפקידים» בהגדרות /app/ מול שרת גבי אמיתי (DEMO=1, dry-run). עובד הדמו (DEMO_USER_EMAIL) הוא
// הראשון ⇒ בעל העסק הפעיל היחיד ⇒ הכרטיס מציג אותו בלי «הורדה»/«השבתה» ועם ההסבר. טוקן משותף = בעל העסק ⇒ הכרטיס
// גלוי. דסקטופ + 390px בלי גלילה רוחבית, ניגודיות AA, אפס שגיאות. הפעולות עצמן: tests/test_mgr328_team_screen.py.
// מנהל 330: עובדת דמו שנייה (DEMO_STAFF_EMAIL, staff) ⇒ בדסקטופ לוחצים באמת: מינוי לבעלים ⇒ הורדה לעובד ⇒ השבתה ⇒
// הפעלה מחדש — כל אחד עם אישור בלחיצה שנייה, והמצב נבדק גם בשרת (GET /team) וגם בהתראות settings_changed.
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
    DEMO_USER_EMAIL: 'demo-team@biz.example', DEMO_USER_PASSWORD: 'demo-team-password-1',
    DEMO_STAFF_EMAIL: 'demo-staff@biz.example', DEMO_STAFF_PASSWORD: 'demo-staff-password-1' }, stdio: srvStdio('server-team') });
const H = { Authorization: `Bearer ${TOKEN}` };
const b = await launchChromium(chromium); const errors = [];
try {
  await waitHealthy(base, srv);
  const team = async () => (await (await fetch(`${base}/team`, { headers: H })).json()).users;
  const t0 = await team();
  const own = t0.find(u => u.email === 'demo-team@biz.example'), stf = t0.find(u => u.email === 'demo-staff@biz.example');
  ok(t0.length === 2 && own?.role === 'owner' && stf?.role === 'staff' && stf.active, 'צוות הדמו לא נוצר (בעלים+עובדת): ' + JSON.stringify(t0));
  const uid = own.id, sid = stf.id;
  const srvState = async () => { const u = (await team()).find(x => x.id === sid); return `${u.active ? 'on' : 'off'}:${u.role}`; };
  // לחיצה ⇒ «לחצו שוב לאישור» + הסבר; לחיצה שנייה ⇒ השרת התעדכן והתג מתחלף
  const twoClick = async (p, tid, label, wantRole, wantSrv) => {
    const btn = p.getByTestId(tid);
    await btn.click();
    ok((await btn.textContent()) === 'לחצו שוב לאישור', `${label}: אין אישור בלחיצה שנייה`);
    await p.getByTestId(`team-confirm-${sid}`).waitFor();
    ok(await srvState() !== wantSrv, `${label}: השרת השתנה כבר בלחיצה הראשונה`);
    await btn.click();
    await p.waitForFunction(([id, want]) => document.querySelector(`[data-testid="team-role-${id}"]`)?.textContent === want, [sid, wantRole]);
    ok(await srvState() === wantSrv, `${label}: השרת לא התעדכן (${await srvState()} ≠ ${wantSrv})`);
  };
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
    await p.getByTestId(`team-row-${sid}`).waitFor();
    ok((await p.getByTestId(`team-role-${sid}`).textContent()) === 'עובד', `${name}: תג העובדת`);
    ok(await p.getByTestId(`team-toggle-${sid}`).isVisible() && await p.getByTestId(`team-off-${sid}`).isVisible(),
      `${name}: אין כפתורי מינוי/השבתה לעובדת`);
    await row.scrollIntoViewIfNeeded();
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    const { fails } = await scan(p);
    ok(!fails.length, `${name}: ניגודיות < AA במסך ההגדרות: ` + JSON.stringify(fails.slice(0, 3)));
    if (out) await p.getByTestId('team-list').screenshot({ path: `${out}/team-${name}.png` });
    if (name === 'desktop') {
      await twoClick(p, `team-toggle-${sid}`, 'מינוי', 'בעל העסק', 'on:owner');
      // שני בעלים ⇒ גם לבעלים המקורי מופיעה «הורדה» (הוא כבר לא האחרון)
      await p.getByTestId(`team-toggle-${uid}`).waitFor();
      await twoClick(p, `team-toggle-${sid}`, 'הורדה', 'עובד', 'on:staff');
      ok(await p.getByTestId(`team-toggle-${uid}`).count() === 0, 'אחרי ההורדה הבעלים המקורי שוב אחרון — אבל יש לו «הורדה»');
      await twoClick(p, `team-off-${sid}`, 'השבתה', 'מושבת', 'off:staff');
      ok(await p.getByTestId(`team-off-${sid}`).count() === 0 && await p.getByTestId(`team-toggle-${sid}`).count() === 0,
        'מושבת עם כפתורי מינוי/השבתה');
      if (out) await p.getByTestId('team-list').screenshot({ path: `${out}/team-deactivated.png` });
      await twoClick(p, `team-on-${sid}`, 'הפעלה מחדש', 'עובד', 'on:staff');
      ok(await p.getByTestId(`team-on-${sid}`).count() === 0, 'פעילה עם «הפעלה מחדש»');
      // כל שינוי ⇒ התראת «הגדרות רגישות שונו» (4: מינוי, הורדה, השבתה, הפעלה) — הנוסח עצמו נבדק ב-pytest
      const inbox = await (await fetch(`${base}/owner/inbox`, { headers: H })).json();
      const n = JSON.stringify(inbox).split('עובדת דמו').length - 1;
      ok(n >= 4, `פחות מ-4 התראות על שינויי הצוות בדשבורד (${n})`);
    }
    await p.close();
  }
  ok(!errors.length, 'שגיאות בדפדפן: ' + errors.join(' | '));
  console.log('✓ team: כרטיס צוות ותפקידים — בעלים אחרון מוגן, מינוי⇒הורדה⇒השבתה⇒הפעלה מחדש בלחיצה כפולה ובשרת, 390px, AA, אפס שגיאות');
} finally { await b.close(); srv.kill(); }
