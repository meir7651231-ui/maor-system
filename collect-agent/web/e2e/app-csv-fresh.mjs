// גבי עיצוב (משימת מקשר על b050cc8): עסק שעובד עם CSV — באנר «העלו קובץ CSV עדכני — הרשימה של היום מבוססת על ייבוא
// מ-<תאריך>» בבית, כשהייבוא האחרון מעל 24 שעות (אותו חישוב כמו סיכום הבוקר; /dashboard csv_freshness). מול שרת DEMO=1
// עם DEMO_CLOCK=1 ו-SOURCE_SYSTEM=csv (הדגמת עסק CSV — ייבוא דמו בעלייה, bf528ae): ייבוא טרי ⇒ אין באנר · +2 ימים ⇒ באנר עם 08.11.2026 ·
// «ייבוא קובץ» ⇒ הגדרות, גלול לייבוא ה-CSV · ייבוא טרי ⇒ הבאנר נעלם. דסקטופ+390px, AA, בלי גלילה רוחבית, 0 שגיאות.
// («עוד לא הועלה קובץ» — בבדיקת היחידה csvBannerText ב-tests/lib.check.ts.)
// הרצה: node e2e/app-csv-fresh.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8187, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-fresh') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const CSV = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n9501,קובץ לקוחה,050-0000501,450,2026-10-15\n';
const importCsv = () => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(CSV, 'utf8') });
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/dashboard')).csv_freshness?.upload_needed === false, 'הדגמת CSV בעלייה: מבקש קובץ למרות ייבוא הדמו');
  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  };
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage(); watch(p);
  const banner = p.getByTestId('csv-fresh-banner');
  // 1) ייבוא הדמו בעלייה טרי ⇒ אין באנר
  await p.goto(`${base}/app/#/dashboard`); await p.getByTestId('kpis').waitFor();
  ok(await banner.count() === 0, 'באנר אחרי ייבוא הדמו הטרי');
  // 2) ייבוא נוסף מאותו יום (מבעל העסק) ⇒ עדיין אין באנר
  await importCsv(); await p.reload(); await p.getByTestId('kpis').waitFor();
  ok(await banner.count() === 0, 'באנר אחרי ייבוא טרי');
  // 3) +2 ימים ⇒ «מבוססת על ייבוא מ-08.11.2026»
  await api('/demo/advance?days=2', { method: 'POST' });
  const f = (await api('/dashboard')).csv_freshness;
  ok(f.upload_needed === true && f.last_import === '2026-11-08', 'השרת אחרי 48 שעות: ' + JSON.stringify(f));
  await p.reload(); await banner.waitFor();
  ok((await banner.textContent()).includes('העלו קובץ CSV עדכני — הרשימה של היום מבוססת על ייבוא מ-08.11.2026'), 'טקסט: ' + await banner.textContent());
  const aa = async (pg, where) => { const { fails } = await scan(pg); ok(!fails.length, `ניגודיות < AA ב-${where}: ` + JSON.stringify(fails.slice(0, 3))); };
  await aa(p, 'בית דסקטופ');
  if (out) await banner.screenshot({ path: `${out}/csv-fresh-desktop.png` });
  // 4) «ייבוא קובץ» ⇒ הגדרות, הייבוא בתצוגה
  await p.getByTestId('csv-fresh-import').click();
  ok(/#\/settings\?s=csv$/.test(p.url()), 'הקישור: ' + p.url());
  await p.waitForFunction(() => { const r = document.getElementById('csv-import')?.getBoundingClientRect(); return r && r.top >= 0 && r.top <= innerHeight; });
  ok(await p.getByLabel('קובץ CSV').count() === 1, 'אין שדה קובץ CSV בהגדרות');
  // 5) מובייל 390px
  const m = await b.newContext({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const mp = await m.newPage(); watch(mp);
  await mp.goto(`${base}/app/#/dashboard`); await mp.getByTestId('csv-fresh-banner').waitFor();
  ok(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  const bb = await mp.getByTestId('csv-fresh-import').boundingBox();
  ok(bb && bb.height >= 40 && bb.x >= 0 && bb.x + bb.width <= 390, 'מובייל: כפתור הייבוא: ' + JSON.stringify(bb));
  await aa(mp, 'בית 390px');
  if (out) await mp.getByTestId('csv-fresh-banner').screenshot({ path: `${out}/csv-fresh-mobile.png` });
  await m.close();
  // 5ב) /ui (בהיר+כהה, 390px): אותו באנר + קישור לייבוא
  for (const scheme of ['light', 'dark']) {
    const uc = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    await uc.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    const up = await uc.newPage(); watch(up);
    await up.goto(`${base}/ui`); await up.locator('#csvWarn:not([hidden])').waitFor();
    ok((await up.locator('#csvWarn').textContent()).includes('מבוססת על ייבוא מ-08.11.2026'), '/ui: ' + await up.locator('#csvWarn').textContent());
    ok(await up.locator('#csvLink').getAttribute('href') === '/app/#/settings?s=csv', '/ui: קישור הייבוא');
    ok(await up.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `/ui ${scheme}: גלילה רוחבית`);
    await aa(up, `/ui ${scheme}`);
    if (out) await up.locator('#csvWarn').screenshot({ path: `${out}/csv-fresh-ui-${scheme}.png` });
    await uc.close();
  }
  // 6) ייבוא טרי ⇒ הבאנר נעלם
  await importCsv();
  ok((await api('/dashboard')).csv_freshness?.upload_needed === false, 'השרת: עדיין מבקש קובץ אחרי ייבוא טרי');
  await p.goto(`${base}/app/#/dashboard`); await p.reload(); await p.getByTestId('kpis').waitFor();   // ייבוא ב-API ⇒ רענון
  ok(await banner.count() === 0, 'הבאנר נשאר אחרי ייבוא טרי');
  await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ CSV (SOURCE_SYSTEM=csv): ייבוא דמו ⇒ אין באנר · +48ש ⇒ «מבוססת על ייבוא מ-08.11.2026» · «ייבוא קובץ» ⇒ הגדרות · /ui בהיר+כהה · ייבוא טרי ⇒ נעלם · 390px · AA · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
