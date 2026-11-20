// critic סבב 172ב: מסך מרשם בקשות העיון/התיקון/המחיקה מול שרת גבי אמיתי (DEMO=1, dry-run).
// לקוח כותב «מחקו את המידע שלי» ⇒ כרטיס dsr בסקירה עם קישור למרשם ⇒ «תשובות לקוחות» ⇒ שורה עם «נותרו N ימים»
// ⇒ כפתור הסגירה כבוי עד תיעוד ≥5 תווים ⇒ סגירה ⇒ השרת מחזיר status=done. דסקטופ + מובייל 390px, בלי גלילה רוחבית.
// דרישה: npm run build. הרצה: node e2e/dsr.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer, assertPortFree } from './lib.mjs';
import { scan } from './contrast-lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8171, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT) }, stdio: srvStdio('server-dsr') });
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const api = async (p, init) => { const r = await fetch(base + p, { ...init, headers: H }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const b = await launchChromium(chromium); const errors = [];
try {
  await waitHealthy(base, srv);
  const [c1, c2] = (await api('/customers')).filter(c => c.phone);
  ok(c1 && c2, 'אין שני לקוחות עם טלפון בדמו');
  await api('/inbound', { method: 'POST', body: JSON.stringify({ channel: 'sms', sender: c1.phone, text: 'מחקו את המידע שלי בבקשה' }) });
  await api(`/customers/${c2.id}/dsr`, { method: 'POST', body: JSON.stringify({ kind: 'access', note: 'ביקש בטלפון' }) });
  const before = (await api('/dsr')).filter(r => r.status === 'open');
  ok(before.length === 2, `צפויות 2 בקשות פתוחות, נמצאו ${before.length}`);

  for (const [name, vp] of [['desktop', { width: 1366, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(String(e)));
    p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
    await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
    await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
    const link = p.getByTestId('notice-dsr-link').first();
    await link.waitFor();
    await link.click();
    const reg = p.getByTestId('dsr-register');
    await reg.waitFor();
    await p.getByTestId('dsr-row').first().waitFor();
    const rows = p.getByTestId('dsr-row');
    const n = await rows.count();
    ok(n >= 1, `${name}: אין שורות במרשם`);
    const st = await rows.first().getByTestId('dsr-state').textContent();
    ok(/נותרו \d+ ימים|היום האחרון/.test(st ?? ''), `${name}: אין «נותרו N ימים»: ${st}`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${name}: גלילה רוחבית`);
    const btn = rows.first().getByTestId('dsr-close');
    ok(await btn.isDisabled(), `${name}: אפשר לסגור בלי תיעוד`);
    await rows.first().getByTestId('dsr-note').fill('abcd');
    ok(await btn.isDisabled(), `${name}: אפשר לסגור עם 4 תווים`);
    // גבי עיצוב: ניגודיות AA על המסך עם שורות במרשם (בסריקה הכללית אין בקשות בדמו)
    const { fails } = await scan(p);
    ok(!fails.length, `${name}: ניגודיות < AA במסך המרשם: ` + JSON.stringify(fails.slice(0, 3)));
    if (out) await reg.screenshot({ path: `${out}/dsr-register-${name}.png` });
    await rows.first().getByTestId('dsr-note').fill('נשלח ללקוח קובץ הייצוא במייל');
    await btn.click();
    await p.getByTestId('toast').filter({ hasText: 'נסגרה ותועדה' }).waitFor();
    await p.getByTestId('dsr-row').nth(n - 2).waitFor({ state: 'attached' }).catch(() => {});
    ok(await p.getByTestId('dsr-row').count() === n - 1, `${name}: השורה לא ירדה מהפתוחות`);
    ok(await p.getByTestId('dsr-done').isVisible(), `${name}: אין «בקשות שטופלו»`);
    await p.close();
  }
  const after = await api('/dsr');
  ok(after.filter(r => r.status === 'open').length === 0, 'בקשות נשארו פתוחות בשרת');
  ok(after.every(r => r.status === 'done' && r.note.includes('קובץ הייצוא')), 'התיעוד לא נשמר בשרת');
} finally { await b.close(); srv.kill(); }
ok(!errors.length, 'שגיאות קונסולה: ' + errors.join(' | '));
console.log('✓ מרשם DSR: קישור מהכרטיס ⇒ רשימה עם ימים שנותרו ⇒ סגירה רק עם תיעוד ⇒ done בשרת (דסקטופ+מובייל) · 0 שגיאות');
