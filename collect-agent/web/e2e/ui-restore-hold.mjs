// מנהל 325 · critic סבב 177: עצירת שליחה אחרי שחזור מגיבוי (restore_hold). עד היום: «✓ טופל» על הכרטיס הוריד אותו
// והעצירה נשארה בשקט, ושחרור היה API בלבד. כאן מול שרת דמו אמיתי שסומן «שוחזר» (mark_restored, כמו restore_backup):
// /app/ — באנר אדום + הכרטיס בלי «✓ טופל» (קישור לבאנר) · «חידוש» כבוי בלי תיעוד ≥5 · /ui — כרטיס #rh, כבוי עד 5
// תווים, תיעוד שורד רענון, שחרור ⇒ השרת: hold=null · הכרטיס נעלם בשני המסכים · 390px בלי גלילה רוחבית · אפס שגיאות.
// הרצה: node e2e/ui-restore-hold.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8194, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const PY = `
import sys, uvicorn
from app.demo import demo_service_ready
from app import restore_guard
from app.main import create_app
from app.service import _iso
s = demo_service_ready()
restore_guard.mark_restored(s.db.conn, at=_iso(s.clock()), source="/backups/nightly.gbk", ledger_rows=2, applied=2)
uvicorn.run(create_app(s), host="127.0.0.1", port=int(sys.argv[1]), log_level=sys.argv[2])
`;
const srv = spawnServer('python3', ['-c', PY, String(PORT), srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, OWNER_API_TOKEN: TOKEN, PORT: String(PORT) }, stdio: srvStdio('server-ui-restore-hold') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async p => { const r = await fetch(base + p, { headers: H }); ok(r.ok, `${p}: ${r.status}`); return r.json(); };
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
const watch = p => {
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
try {
  ok((await api('/owner/restore-hold')).hold, 'השרת לא עלה במצב «שוחזר»');
  ok((await api('/dashboard?view=list')).restore_hold?.ledger_applied === 2, '/dashboard?view=list בלי restore_hold');

  // ---- /app/ ----
  const a = await b.newPage({ viewport: { width: 1366, height: 900 } }); watch(a);
  await a.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
  const ban = a.getByTestId('restore-hold');
  await ban.waitFor();
  const bt = await ban.textContent();
  ok(/השליחה ללקוחות עצורה/.test(bt) && /2 הסרות/.test(bt), 'באנר /app/: ' + bt);
  const note = a.locator('[data-testid="notice"][data-intent="restore_hold"]');
  await note.waitFor();
  ok(await note.getByTestId('notice-done').count() === 0, 'כרטיס השחזור ב-/app/ עדיין עם «✓ טופל»');
  ok(await note.getByTestId('notice-restore-link').count() === 1, 'אין קישור מהכרטיס לבאנר');
  const go = ban.getByTestId('restore-hold-release');
  ok(await go.isDisabled(), '/app/: «חידוש» פעיל בלי תיעוד');
  await ban.getByTestId('restore-hold-note').fill('abcd');
  ok(await go.isDisabled(), '/app/: «חידוש» פעיל עם 4 תווים');
  await ban.getByTestId('restore-hold-note').fill('');
  if (out) await a.screenshot({ path: `${out}/app-restore-hold.png` });

  // ---- /ui ----
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage(); watch(p);
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.goto(base + '/ui');
  const card = p.locator('#rh');
  await card.waitFor({ state: 'visible' });
  ok(/2 הסרות/.test(await p.locator('#rhMsg').textContent()), 'ב-/ui אין מספר ההסרות שהוחזרו');
  const btn = p.locator('#rhGo');
  ok(await btn.isDisabled(), '/ui: «חידוש» פעיל בלי תיעוד');
  await p.locator('#rhNote').fill('abc ');
  ok(await btn.isDisabled(), '/ui: «חידוש» פעיל עם פחות מ-5 תווים');
  await p.locator('#rhNote').fill('החלתי מחדש את ההסרות מאז הגיבוי');
  ok(!(await btn.isDisabled()), '/ui: «חידוש» כבוי עם תיעוד מלא');
  await p.evaluate(() => { document.activeElement.blur(); return load(false); });
  ok((await p.locator('#rhNote').inputValue()) === 'החלתי מחדש את ההסרות מאז הגיבוי', 'התיעוד נמחק ברענון');
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל');
  if (out) await p.screenshot({ path: `${out}/ui-18-restore-hold-mobile.png` });
  await p.setViewportSize({ width: 1280, height: 900 });
  await btn.click();
  await card.waitFor({ state: 'hidden' });
  ok((await api('/owner/restore-hold')).hold === null, 'השרת: העצירה לא שוחררה');
  ok(/השליחה חודשה ותועדה/.test(await p.locator('#rhDone').textContent()), 'אין הודעת הצלחה ב-/ui');

  // ---- /app/ אחרי השחרור ----
  await a.reload();
  await a.getByTestId('kpis').waitFor();
  await a.waitForTimeout(300);
  ok(await a.getByTestId('restore-hold').count() === 0, 'הבאנר נשאר ב-/app/ אחרי השחרור');
  ok(await a.locator('[data-testid="notice"][data-intent="restore_hold"]').count() === 0, 'הכרטיס נשאר אחרי השחרור');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ עצירת שחזור: באנר /app/ + כרטיס בלי «טופל» · /ui #rh · כבוי בלי תיעוד ≥5 · תיעוד שורד רענון · שחרור ⇒ hold=null · נעלם בשני המסכים · מובייל');
} finally { await b.close(); srv.kill(); }
