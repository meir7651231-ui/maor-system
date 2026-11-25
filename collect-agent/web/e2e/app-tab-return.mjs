// מנהל 403 (ממצא QA 401): מכשיר שכבר מציג את הדשבורד לא התרענן אחרי שינוי ממכשיר אחר (ייבוא קובץ) — הכרטיס
// נשאר/חסר עד פתיחה מחדש. עכשיו: חזרה ללשונית (visibilitychange) אחרי ≥60 ש׳ מהרענון המוצלח האחרון ⇒ רענון שקט.
// מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי, בלי יירוט ובלי ניווט:
//  1) ייבוא ראשון (API) ⇒ הדשבורד (390px) נפתח בלי כרטיס «אולי שינוי שם?».
//  2) «מכשיר אחר» מעלה קובץ חלקי (API) ⇒ הכרטיס נוצר בשרת; המסך הפתוח עוד לא יודע.
//  3) חזרה ללשונית אחרי פחות מ-60 ש׳ ⇒ אין בקשת /dashboard (לא מציפים את השרת בכל מעבר לשונית).
//  4) לשונית ברקע + «עברו 61 ש׳» ⇒ עדיין אין בקשה; חזרה לחזית ⇒ בקשת /dashboard אחת והכרטיס מופיע בלי ניווט.
//  5) 0 שגיאות קונסולה/רשת · בלי גלילה רוחבית.
// השעון: Date.now מוזז בהזרקה (window.__skew) — הקוד של האפליקציה לא יודע על הבדיקה.
// הרצה: node e2e/app-tab-return.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8243, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-tab-return') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const csv = async body => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(body, 'utf8') });
const HEAD = 'מספר מסמך,שם לקוח,טלפון,סכום,סטטוס,תאריך,תאריך לתשלום\n';
const row = (num, name) => `${num},${name},050-0000843,500,פתוח,01/10/26,15/10/26\n`;

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const r1 = await csv(HEAD + row('9841', 'דויד כהן') + row('9842', 'דויד כהן'));
  ok(r1.imported === 2 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));

  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(t => {
    try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ }
    const real = Date.now.bind(Date); window.__skew = 0; Date.now = () => real() + window.__skew;
    let vis = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => vis });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => vis === 'hidden' });
    window.__setVis = v => { vis = v; document.dispatchEvent(new Event('visibilitychange')); };
  }, TOKEN);
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  let dash = 0;
  p.on('request', r => { if (new URL(r.url()).pathname === '/dashboard') dash++; });

  await p.goto(`${base}/app/#/dashboard`);
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
  await p.getByTestId('kpis').waitFor({ state: 'attached' });
  await p.waitForTimeout(600);
  const card = p.locator('[data-testid=notice][data-intent=shared_contact]').filter({ hasText: '9842' });
  ok(await card.count() === 0, 'כרטיס «אולי שינוי שם?» כבר לפני הקובץ החלקי');

  // 2) מכשיר אחר
  const r2 = await csv(HEAD + row('9842', 'דוד כהן-לוי'));
  ok(r2.imported === 1, 'קובץ חלקי: ' + JSON.stringify(r2));
  ok((await api('/owner/inbox')).some(m => m.intent === 'shared_contact' && /9842/.test(m.body || '')), 'השרת לא פתח כרטיס «אולי שינוי שם?»');

  // 3) חזרה מהירה ⇒ בלי רענון
  const before = dash;
  await p.evaluate(() => { window.__setVis('hidden'); window.__setVis('visible'); });
  await p.waitForTimeout(1500);
  ok(dash === before, `חזרה ללשונית אחרי פחות מ-60 ש׳ ביקשה /dashboard (${dash - before})`);
  ok(await card.count() === 0, 'הכרטיס הופיע בלי רענון?');

  // 4) ברקע + 61 ש׳ ⇒ אין בקשה עד החזרה; חזרה ⇒ רענון אחד והכרטיס מופיע
  await p.evaluate(() => { window.__setVis('hidden'); window.__skew += 61_000; });
  await p.waitForTimeout(800);
  ok(dash === before, 'בקשת /dashboard כשהלשונית ברקע');
  await p.evaluate(() => window.__setVis('visible'));
  await card.first().waitFor({ timeout: 10_000 });
  ok(dash === before + 1, `חזרה ללשונית: ${dash - before} בקשות /dashboard במקום 1`);
  const t = await card.first().textContent();
  ok(t.includes('אולי שינוי שם?'), 'נוסח הכרטיס: ' + t);
  ok(await p.evaluate(() => location.hash) === '#/dashboard', 'הרענון ניווט');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית');
  if (out) { await card.first().scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/tab-return-mobile.png` }); }

  // חזרה נוספת מיד אחרי ⇒ שוב בלי בקשה (השעון התאפס עם הרענון המוצלח)
  await p.evaluate(() => { window.__setVis('hidden'); window.__setVis('visible'); });
  await p.waitForTimeout(1000);
  ok(dash === before + 1, 'חזרה שנייה מיד אחרי רענון ביקשה /dashboard שוב');
  await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ חזרה ללשונית — <60 ש׳ ⇒ בלי בקשה · ברקע ⇒ בלי בקשה · ≥60 ש׳ ⇒ /dashboard אחד והכרטיס מהמכשיר האחר מופיע בלי ניווט (390px) · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
