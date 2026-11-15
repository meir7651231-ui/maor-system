// גבי בדיקות (המקשר): שער «אישור רשימת הפתוחות» במסך המעוצב (/app/) מול שרת DEMO=1 חי (dry-run), בלי יירוט.
// משלים את live.mjs 7א (רק «עדיין פתוח») ואת ui-openlist.mjs (/ui):
//   ייבוא ⇒ /plan לא בונה תזכורת על חשבונית שלא אושרה ⇒ אישור בממשק («עדיין פתוח» + «כבר שולם»)
//   ⇒ /plan בונה תזכורת רק על הפתוחה ⇒ ייבוא חוזר (סנכרון) לא פותח מחדש את «שולם מחוץ למערכת»
//   ⇒ מובייל 390px: חשבונית חדשה, כרטיס בלי גלילה רוחבית, כפתורים ≥40px, אישור מהמובייל.
// 0 שגיאות קונסולה / pageerror / תשובות 4xx-5xx לא צפויות. הרצה: node e2e/app-openlist.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8149, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', OPEN_REVIEW: '1', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-openlist') });
process.on('exit', () => srv.kill());
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => {
  const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } });
  ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`);
  return r.json();
};
const importCsv = rows => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' },
  body: Buffer.from('מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n' + rows.join('\n') + '\n', 'utf8') });
const remindersFor = async n => (await api('/reminders')).filter(r => (r.numbers || [r.number]).includes(n));
const noHScroll = async (pg, where) =>
  ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `גלילה רוחבית: ${where}`);

await waitHealthy(base, srv);
const errors = [];
const b = await chromium.launch();
try {
  const OPEN = ['9201,רונית פתוחה,050-0000201,380,2026-10-01', '9202,דוד שילם בביט,050-0000202,520,2026-10-02'];
  await importCsv(OPEN);
  const pend = (await api('/open-list')).pending;
  ok(['9201', '9202'].every(n => pend.some(x => x.number === n)), 'חשבוניות ה-CSV לא ממתינות');

  // 1) לפני אישור: אין תזכורת
  await api('/plan', { method: 'POST' });
  ok((await remindersFor('9201')).length === 0 && (await remindersFor('9202')).length === 0,
    'נבנתה תזכורת על חשבונית שבעל העסק עוד לא אישר');

  // 2) אישור בממשק המעוצב (דסקטופ)
  const ctx = await b.newContext();
  await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1280, height: 900 });
  p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await p.goto(base + '/app/#/dashboard');
  const item = n => p.getByTestId(`open-item-${n}`);
  await item('9201').waitFor();
  await noHScroll(p, 'דסקטופ עם הכרטיס');
  ok(await p.getByTestId('open-list-confirm').isDisabled(), '«אישור» פעיל בלי סימון');
  await item('9201').getByRole('button', { name: 'עדיין פתוח' }).click();
  await item('9202').getByRole('button', { name: 'כבר שולם' }).click();
  ok(await item('9202').getByRole('button', { name: 'כבר שולם' }).getAttribute('aria-pressed') === 'true', 'aria-pressed');
  if (out) await p.getByTestId('open-list').screenshot({ path: `${out}/app-openlist-01-desktop.png` });
  const post = p.waitForRequest(r => r.url().endsWith('/open-list/confirm') && r.method() === 'POST');
  await p.getByTestId('open-list-confirm').click();
  const body = JSON.parse((await post).postData());
  const id = n => pend.find(x => x.number === n).id;
  ok(JSON.stringify(body.still_open) === JSON.stringify([id('9201')]) && JSON.stringify(body.paid) === JSON.stringify([id('9202')]),
    'גוף האישור: ' + JSON.stringify(body));
  await item('9201').waitFor({ state: 'detached' });
  const ol = await api('/open-list');
  ok(ol.confirmed.some(x => x.number === '9201'), 'השרת: 9201 לא אושרה');
  ok(!ol.confirmed.some(x => x.number === '9202') && !ol.pending.some(x => x.number === '9202'), 'השרת: 9202 עדיין פתוחה');

  // 3) אחרי אישור: תזכורת רק על הפתוחה
  await api('/plan', { method: 'POST' });
  ok((await remindersFor('9201')).length === 1, 'אחרי אישור «עדיין פתוח» לא נבנתה תזכורת');
  ok((await remindersFor('9202')).length === 0, 'נבנתה תזכורת על חשבונית שסומנה «כבר שולם»');

  // 4) סנכרון חוזר (אותו CSV + חשבונית חדשה): «שולם מחוץ למערכת» לא נפתח מחדש
  await importCsv([...OPEN, '9203,נוי חדשה,050-0000203,290,2026-10-05']);
  const ol2 = await api('/open-list');
  ok(!ol2.pending.some(x => x.number === '9202') && !ol2.confirmed.some(x => x.number === '9202'),
    'הייבוא החוזר פתח מחדש חשבונית שסומנה «כבר שולם»');
  ok(ol2.pending.some(x => x.number === '9203') && !ol2.pending.some(x => x.number === '9201'),
    'החדשה לא ממתינה / המאושרת חזרה להמתנה: ' + JSON.stringify(ol2.pending.map(x => x.number)));
  await api('/plan', { method: 'POST' });
  ok((await remindersFor('9202')).length === 0 && (await remindersFor('9203')).length === 0,
    'אחרי הייבוא החוזר נבנתה תזכורת על ששולמה או על חדשה שלא אושרה');
  const inv9202 = (await api('/dashboard')).invoices.filter(x => x.number === '9202');
  ok(inv9202.length && inv9202.every(x => x.status !== 'open'),
    'ששולמה מחוץ למערכת חזרה לחובות הפתוחים: ' + JSON.stringify(inv9202.map(x => x.status)));

  // 5) מובייל 390px: הכרטיס עם החדשה, אישור מהמובייל
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base + '/app/#/settings');
  await p.goto(base + '/app/#/dashboard');
  await item('9203').waitFor();
  await item('9203').scrollIntoViewIfNeeded();
  await noHScroll(p, 'מובייל עם הכרטיס');
  const btns = await p.getByTestId('open-list').locator('button').evaluateAll(bs => bs.map(x => {
    const r = x.getBoundingClientRect(); return { t: x.textContent.trim(), h: r.height, l: r.left, r: r.right }; }));
  ok(btns.length >= 4 && btns.every(x => x.h >= 40 && x.l >= 0 && x.r <= 390), 'מובייל: כפתור קטן מ-40px או חורג: ' + JSON.stringify(btns));
  if (out) await p.getByTestId('open-list').screenshot({ path: `${out}/app-openlist-02-mobile.png` });
  await item('9203').getByRole('button', { name: 'עדיין פתוח' }).click();
  await p.getByTestId('open-list-confirm').click();
  await item('9203').waitFor({ state: 'detached' });
  ok((await api('/open-list')).confirmed.some(x => x.number === '9203'), 'אישור מהמובייל לא הגיע לשרת');
  await api('/plan', { method: 'POST' });
  ok((await remindersFor('9203')).length === 1, 'אחרי אישור במובייל לא נבנתה תזכורת');

  ok(errors.length === 0, 'שגיאות:\n' + errors.join('\n'));
  console.log('✓ /app רשימת הפתוחות: אין תזכורת לפני אישור · אישור בממשק ⇒ תזכורת רק על הפתוחה · «כבר שולם» לא נפתח בייבוא חוזר · מובייל 390px (≥40px, בלי גלילה) · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
