// מנהל 324: מרשם בקשות עיון/תיקון/מחיקה (חוק הגנת הפרטיות §13–14) גם בדשבורד הפשוט (/ui). עד היום רק ב-/app/
// (מנהל 321) — בעל עסק שעובד ב-/ui (גם demo.sh בלי build) קיבל התראה, ו«✓ טופל» סגר רק את ההודעה ⇒ הבקשה
// נשארה open והתראות האיחור המשיכו (critic 172). כאן מול שרת DEMO=1 אמיתי: שתי בקשות פתוחות ⇒ כרטיס עם שתי
// שורות · «סגירה» כבויה עד תיעוד ≥5 תווים · תיעוד שורד רענון · סגירה ⇒ השרת: done + התיעוד · השנייה נשארת ·
// סגירת האחרונה ⇒ הכרטיס נעלם · מובייל 390px בלי גלילה רוחבית. הרצה: node e2e/ui-dsr.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8193, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-dsr') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const post = (p, body) => api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  const open0 = (await api('/dsr')).filter(r => r.status === 'open');
  const [A, B] = (await api('/customers')).filter(c => c.name);
  ok(A && B, 'אין שני לקוחות בדמו');
  const rA = (await post(`/customers/${A.id}/dsr`, { kind: 'access', note: 'ביקש בטלפון' })).id;
  const rB = (await post(`/customers/${B.id}/dsr`, { kind: 'deletion' })).id;

  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  const card = p.locator('#ds');
  await card.locator('li[data-sid]').first().waitFor();
  ok(await card.locator('li[data-sid]').count() === open0.length + 2, 'מספר השורות ≠ הבקשות הפתוחות');
  ok(/בקשות פרטיות פתוחות/.test(await p.locator('#dsH').textContent()), 'כותרת: ' + await p.locator('#dsH').textContent());
  const rowA = card.locator(`li[data-sid="${rA}"]`), rowB = card.locator(`li[data-sid="${rB}"]`);
  const tA = await rowA.textContent();
  ok(tA.includes(A.name) && tA.includes('עיון במידע') && /נותרו 30 ימים/.test(tA) && tA.includes('ביקש בטלפון'), 'שורה A: ' + tA);
  ok((await rowB.textContent()).includes('מחיקת מידע'), 'שורה B בלי סוג הבקשה');
  const btnA = rowA.getByRole('button', { name: 'סגירת הבקשה' });
  ok(await btnA.isDisabled(), '«סגירה» פעילה בלי תיעוד');
  await rowA.locator('textarea').fill('abc ');
  ok(await btnA.isDisabled(), '«סגירה» פעילה עם פחות מ-5 תווים');
  await rowA.locator('textarea').fill('נשלח ללקוח קובץ הייצוא במייל');
  ok(!(await btnA.isDisabled()), '«סגירה» כבויה עם תיעוד מלא');
  await p.evaluate(() => { document.activeElement.blur(); return load(false); });   // רענון לא מוחק תיעוד שהוקלד
  ok((await rowA.locator('textarea').inputValue()) === 'נשלח ללקוח קובץ הייצוא במייל', 'התיעוד נמחק ברענון');
  if (out) await p.screenshot({ path: `${out}/ui-16-dsr-register.png` });
  await rowA.getByRole('button', { name: 'סגירת הבקשה' }).click();
  await rowA.waitFor({ state: 'detached' });
  const sA = (await api('/dsr')).find(r => r.id === rA);
  ok(sA.status === 'done' && sA.note === 'נשלח ללקוח קובץ הייצוא במייל', 'השרת: ' + JSON.stringify(sA));
  ok(/נסגרה ותועדה/.test(await p.locator('#dsDone').textContent()), 'אין הודעת הצלחה');
  ok(await rowB.count() === 1, 'הבקשה השנייה נעלמה');
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  if (out) await p.screenshot({ path: `${out}/ui-17-dsr-mobile.png`, fullPage: false });
  for (const r of (await api('/dsr')).filter(r => r.status === 'open')) await post(`/dsr/${r.id}/done`, { note: 'טופל בבדיקה' });
  await p.evaluate(() => load(false));
  await card.waitFor({ state: 'hidden' });
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui מרשם בקשות פרטיות: שורה לכל בקשה פתוחה · סגירה כבויה בלי תיעוד ≥5 · תיעוד שורד רענון · סגירה ⇒ done+תיעוד בשרת · אחרונה ⇒ הכרטיס נעלם · מובייל');
} finally { await b.close(); srv.kill(); }
