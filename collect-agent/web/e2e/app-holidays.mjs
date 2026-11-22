// גבי עיצוב (משימה מהביקורת): התראת פקיעת לוח החגים במסכים — בית (/app/#/dashboard) והגדרות — מול שרת DEMO=1 חי.
// השרת מחזיר send_window.holidays_until/holidays_expiring (critic סבב 119). הלוח האמיתי בתוקף עד 2029 ⇒ בלי באנר;
// את «עוד 45 יום» ואת «פג» מדמים ביירוט של /dashboard בלבד (התשובה האמיתית + שינוי שדות send_window).
// בודק: באנר בבית+בהגדרות עם התאריך, «לפרטים ועדכון» מגיע לסעיף בהגדרות, ניגודיות AA מחושבת מהצבעים המרונדרים,
// מובייל 390px בלי גלילה רוחבית ויעד ≥40px, 0 שגיאות. שם עסק ניטרלי בצילומים. הרצה: node e2e/app-holidays.mjs [צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, makeInject } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8159, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-holidays') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: H }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

await waitHealthy(base, srv);
const errors = [];
const routeErrors = [];
const inject = makeInject(routeErrors);
const b = await launchChromium(chromium);
try {
  // שם עסק ניטרלי בכל הצילומים
  await api('/settings', { method: 'PUT', body: JSON.stringify({ business_name: 'העסק לדוגמה', owner_name: 'בעל העסק' }) });
  const real = await api('/dashboard');
  ok(real.send_window?.holidays_until && real.send_window.holidays_expiring === false, 'השרת לא מחזיר holidays_until/expiring: ' + JSON.stringify(real.send_window));
  const today = real.today;
  let mode = 'real';
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await inject(p, '**/dashboard', async route => {
    const r = await route.fetch(); const j = await r.json();
    if (mode === 'expiring') j.send_window = { ...j.send_window, holidays_until: addDays(today, 45), holidays_expiring: true };
    if (mode === 'expired') j.send_window = { ...j.send_window, holidays_until: addDays(today, -3), holidays_expiring: true, open_now: false };
    await route.fulfill({ response: r, json: j });
  });
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const banner = w => p.getByTestId(`holiday-banner-${w}`);
  // ניגודיות מהצבעים שהדפדפן באמת צייר (rgb מחושב), כל טקסט בתוך הבאנר מול רקע הבאנר
  const contrast = loc => loc.evaluate(el => {
    // צבע מחושב יכול להיות oklch(...) (Tailwind v4) ⇒ פענוח דרך canvas (sRGB)
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgb = s => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
    const L = c => { const [r, g, b] = c.map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const bg = L(rgb(getComputedStyle(el).backgroundColor));
    return [...el.querySelectorAll('p, a, span:not([aria-hidden])')].filter(e => e.textContent.trim()).map(e => {
      const f = L(rgb(getComputedStyle(e).color)); const [a, b] = [f, bg].sort((x, y) => y - x);
      return { t: e.textContent.trim().slice(0, 30), r: +((a + 0.05) / (b + 0.05)).toFixed(2) };
    });
  });
  const aa = async (loc, where) => { const c = await contrast(loc); ok(c.length >= 2 && c.every(x => x.r >= 4.5), `ניגודיות < 4.5 ב-${where}: ` + JSON.stringify(c)); return Math.min(...c.map(x => x.r)); };
  // הפעלה 378 (CI אדום 1267/1268): היה `goto(#/settings)` ואז `goto(#/dashboard)` — שני שינויי hash באותו מסמך
  // שחוזרים מיד; ברץ מהיר React ראה dashboard⇒dashboard, אפקט הרענון לא רץ, /dashboard לא נטען מחדש עם היירוט
  // ⇒ הבאנר לא הופיע (Timeout 30s). טעינה מלאה = בקשת /dashboard חדשה ודאית (הטוקן ב-sessionStorage נשמר).
  const refetch = async () => {
    await p.goto(base + '/app/#/dashboard');
    const got = p.waitForResponse(r => new URL(r.url()).pathname === '/dashboard' && r.request().method() === 'GET');
    await p.reload(); await got;
  };
  const ddmm = iso => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

  // 1) הלוח האמיתי בתוקף (2029) ⇒ אין באנר
  await p.goto(base + '/app/#/dashboard');
  await p.getByTestId('kpis').waitFor();
  ok(await banner('dashboard').count() === 0, 'באנר מוצג כשהלוח בתוקף לאורך זמן');

  // 2) עוד 45 יום ⇒ באנר אזהרה בבית, עם התאריך והימים
  mode = 'expiring';
  await refetch();
  await banner('dashboard').waitFor();
  const until = addDays(today, 45);
  const t1 = await banner('dashboard').textContent();
  ok(await banner('dashboard').getAttribute('role') === 'status' && /בתוקף עד/.test(t1) && t1.includes(ddmm(until)) && /45/.test(t1), 'טקסט/role באנר האזהרה: ' + t1);
  const minWarn = await aa(banner('dashboard'), 'באנר אזהרה (בית)');
  if (out) await p.screenshot({ path: `${out}/holidays-1-dashboard-expiring.png` });

  // 3) «לפרטים ועדכון» ⇒ ההגדרות, הסעיף בתצוגה
  await p.getByTestId('holiday-banner-link').click();
  await banner('settings').waitFor();
  ok(/#\/settings\?s=holidays$/.test(p.url()), 'הקישור לא הגיע להגדרות: ' + p.url());
  await p.waitForFunction(() => { const r = document.getElementById('holidays')?.getBoundingClientRect(); return r && r.top >= 0 && r.bottom <= innerHeight; });
  ok(/עדכון גרסה של גבי/.test(await banner('settings').textContent()), 'בהגדרות חסר הסבר איך מתעדכן');
  await aa(banner('settings'), 'באנר אזהרה (הגדרות)');
  if (out) await p.screenshot({ path: `${out}/holidays-2-settings-expiring.png` });

  // 4) פג ⇒ role=alert, «פג», אדום, AA
  mode = 'expired';
  await refetch();
  await p.locator('[data-testid="holiday-banner-dashboard"][data-level="expired"]').waitFor();
  const t2 = await banner('dashboard').textContent();
  ok(await banner('dashboard').getAttribute('role') === 'alert' && /פג/.test(t2) && t2.includes(ddmm(addDays(today, -3))), 'באנר «פג»: ' + t2);
  const minExp = await aa(banner('dashboard'), 'באנר פג (בית)');
  if (out) await p.screenshot({ path: `${out}/holidays-3-dashboard-expired.png` });

  // 5) מובייל 390px: בלי גלילה רוחבית, הקישור ≥40px ובתוך המסך
  await p.setViewportSize({ width: 390, height: 844 });
  await banner('dashboard').scrollIntoViewIfNeeded();
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל עם הבאנר');
  const lb = await p.getByTestId('holiday-banner-link').boundingBox();
  ok(lb && lb.height >= 40 && lb.x >= 0 && lb.x + lb.width <= 390, 'מובייל: יעד הקישור: ' + JSON.stringify(lb));
  if (out) await banner('dashboard').screenshot({ path: `${out}/holidays-4-mobile-expired.png` });

  ok(!errors.length && !routeErrors.length, 'שגיאות: ' + [...errors, ...routeErrors].join(' | '));
  console.log(`✓ לוח החגים: בלי באנר כשבתוקף · אזהרה 45 יום (AA מינ' ${minWarn}) · קישור לסעיף בהגדרות · «פג» role=alert (AA מינ' ${minExp}) · מובייל 390px`);
} finally {
  await b.close(); srv.kill();
}
