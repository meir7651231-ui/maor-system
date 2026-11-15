// הפעלה 214: שער «אישור רשימת הפתוחות» בדשבורד הפשוט (/ui). critic 79 בנה משטח רק ב-/app/; בעל עסק שעובד ב-/ui
// לא ראה שחשבונית חדשה ממתינה לאישור, וגבי לא תזכר עליה בשקט. כאן מול שרת DEMO=1 אמיתי (dry-run), בלי יירוט:
// ייבוא CSV עם 3 חשבוניות חדשות ⇒ הכרטיס מופיע עם 3 · «כבר שולם» על אחת, «עדיין פתוח» על אחרת ⇒ אישור ⇒ השרת
// רשם בדיוק את זה (/open-list), הכרטיס מציג 1, והחשבונית ששולמה לא בטבלת החובות הפתוחים. «הכול עדיין פתוח» ⇒
// הכרטיס נעלם. הרצה: node e2e/ui-openlist.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8147, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OPEN_REVIEW: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-ui-openlist') });
process.on('exit', () => srv.kill());
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  ok((await api('/open-list')).pending.length === 0, 'הדמו התחיל עם ממתינות (app/demo.py אמור לאשר)');
  const csv = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n'
    + '9101,אורי פתוח,050-0000101,300,2026-10-01\n9102,שירה שילמה,050-0000102,450,2026-10-02\n9103,נועם עוד,050-0000103,600,2026-10-03\n';
  await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(csv, 'utf8') });
  const pend = (await api('/open-list')).pending;
  ok(['9101', '9102', '9103'].every(n => pend.some(x => x.number === n)), 'חשבוניות ה-CSV לא ממתינות: ' + JSON.stringify(pend.map(x => x.number)));
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/ui');
  const card = p.locator('#ol');
  await card.locator('li').first().waitFor();
  ok(/יש 3 חשבוניות שמחכות לאישור שלך/.test(await p.locator('#olH').textContent()), 'כותרת: ' + await p.locator('#olH').textContent());
  ok(await card.locator('li').count() === 3, 'לא 3 שורות בכרטיס');
  const row = n => card.locator('li', { hasText: `חשבונית ${n}` });
  ok(/מקובץ CSV/.test(await row('9101').textContent()) && /300/.test(await row('9101').textContent()), 'שורה בלי מקור/סכום');
  ok(await p.locator('#olOk').isDisabled(), '«אישור» פעיל בלי סימון');
  await row('9102').getByRole('button', { name: 'כבר שולם' }).click();
  await row('9101').getByRole('button', { name: 'עדיין פתוח' }).click();
  ok(await row('9102').getByRole('button', { name: 'כבר שולם' }).getAttribute('aria-pressed') === 'true', 'aria-pressed לא עודכן');
  ok((await p.locator('#olOk').textContent()).trim() === 'אישור (2)', 'מונה האישור');
  // לחיצה שנייה על אותו סימון מבטלת אותו
  await row('9103').getByRole('button', { name: 'עדיין פתוח' }).click();
  await row('9103').getByRole('button', { name: 'עדיין פתוח' }).click();
  ok((await p.locator('#olOk').textContent()).trim() === 'אישור (2)', 'ביטול סימון לא עבד');
  if (out) await p.screenshot({ path: `${out}/ui-12-open-list.png` });
  const post = p.waitForRequest(r => r.url().endsWith('/open-list/confirm') && r.method() === 'POST');
  await p.locator('#olOk').click();
  const body = JSON.parse((await post).postData());
  const id = n => pend.find(x => x.number === n).id;
  ok(JSON.stringify(body) === JSON.stringify({ still_open: [id('9101')], paid: [id('9102')] }), 'גוף האישור: ' + JSON.stringify(body));
  await p.locator('#olDone').waitFor();
  ok(/1 פתוחות · 1 סומנו כשולמו/.test(await p.locator('#olDone').textContent()), 'הודעת הצלחה: ' + await p.locator('#olDone').textContent());
  await p.waitForFunction(() => document.querySelectorAll('#ol li').length === 1);
  ok(/חשבונית אחת מחכה/.test(await p.locator('#olH').textContent()), 'הכותרת לא ירדה ל-1');
  const ol = await api('/open-list');
  ok(ol.pending.length === 1 && ol.pending[0].number === '9103', 'השרת: נשארה לא נכונה ' + JSON.stringify(ol.pending));
  ok(ol.confirmed.some(x => x.number === '9101') && !ol.confirmed.some(x => x.number === '9102'), 'השרת: 9101 לא אושרה או 9102 עדיין פתוחה');
  ok(!/שירה שילמה/.test(await p.locator('#debts').textContent()), 'חשבונית ששולמה עדיין בחובות הפתוחים');
  await p.setViewportSize({ width: 390, height: 844 });
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'גלילה רוחבית במובייל עם הכרטיס');
  if (out) await p.screenshot({ path: `${out}/ui-13-open-list-mobile.png`, fullPage: false });
  await p.setViewportSize({ width: 1280, height: 900 });
  await p.locator('#olAll').click();
  await p.locator('#olOk').click();
  await card.waitFor({ state: 'hidden' });
  ok((await api('/open-list')).pending.length === 0, 'אחרי «הכול עדיין פתוח» נשארו ממתינות');
  ok((await api('/dashboard')).totals.open_unreviewed === 0, 'המונה לא התאפס');
  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /ui רשימת הפתוחות: 3 ממתינות מ-CSV ⇒ כרטיס · «כבר שולם»/«עדיין פתוח» ⇒ השרת רשם בדיוק · ששולמה ירדה מהחובות · «הכול עדיין פתוח» ⇒ הכרטיס נעלם · מובייל בלי גלילה רוחבית');
} finally { await b.close(); srv.kill(); }
