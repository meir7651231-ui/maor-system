// גבי QA (מנהל 401, «הבא» (1) מ-400): כרטיס «אולי שינוי שם?» יורד גם כשהחשבונית **חוזרת** לשם הקודם (`why: back`, מנהל 394)
// — מקצה לקצה מהמסך. מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי, בלי יירוט:
//  1) ייבוא ראשון (API): «דויד כהן» עם 9821+9822, טלפון 050-0000821.
//  2) קובץ **חלקי** מהמסך: רק 9822 בשם «דוד כהן-לוי» ⇒ כרטיס אחד `shared_contact` «אולי שינוי שם?» בדשבורד (בלי שם/טלפון), 390px.
//  3) קובץ **בשם הישן** מהמסך (9821+9822 בשם «דויד כהן» — בעל העסק בחר «עברה לאדם אחר»/תיקן חזרה) ⇒ הכרטיס **יורד**
//     מ-/owner/inbox ומהדשבורד (דסקטופ+390px) · audit `shared_contact_resolved` עם why=back בלי PII ·
//     /app/#/invoices לפי הטלפון: 9821+9822 תחת «דויד כהן», השם החדש לא מחזיק חשבונית.
//  4) בקרה: אותו קובץ ישן שוב ⇒ אין כרטיס חדש ואין resolved כפול · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-csv-rename-back.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8231, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-rename-back') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const HEAD = 'מספר מסמך,שם לקוח,טלפון,סכום,סטטוס,תאריך,תאריך לתשלום\n';
const OLD = 'דויד כהן', NEW = 'דוד כהן-לוי', PHONE = '050-0000821', DIGITS = '0500000821';
const row = (num, name) => `${num},${name},${PHONE},500,פתוח,01/10/26,15/10/26\n`;
const V1 = HEAD + row('9821', OLD) + row('9822', OLD);
const PARTIAL = HEAD + row('9822', NEW);
const BACK = HEAD + row('9821', OLD) + row('9822', OLD);
const byPhone = cs => cs.filter(c => (c.phone || '').replace(/\D/g, '').endsWith('500000821'));
const renameCards = async () => (await api('/owner/inbox')).filter(m => m.intent === 'shared_contact' && /9822/.test(m.body || ''));

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // 1) ייבוא ראשון
  const r1 = await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(V1, 'utf8') });
  ok(r1.imported === 2 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));
  const c1 = byPhone(await api('/customers'));
  ok(c1.length === 1 && c1[0].name === OLD, 'אחרי ייבוא ראשון: ' + JSON.stringify(c1));
  ok(!(await renameCards()).length, 'כרטיס «אולי שינוי שם?» כבר בייבוא הראשון');

  const watch = p => {
    p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  };
  const ctxOf = async (w, h) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(t => { try { sessionStorage.setItem('gabi_owner_token', t); } catch { /* */ } }, TOKEN);
    return ctx;
  };
  const uploadFromScreen = async (pg, body, file, imported) => {
    await pg.goto(`${base}/app/#/settings`);
    const input = pg.getByLabel('קובץ CSV');
    await input.waitFor({ state: 'attached' });
    await input.setInputFiles({ name: file, mimeType: 'text/csv', buffer: Buffer.from(body, 'utf8') });
    await pg.waitForFunction(() => /יובאו/.test(document.querySelector('[data-testid=csv-result]')?.textContent || ''));
    const res = await pg.getByTestId('csv-result').textContent();
    ok(new RegExp(`יובאו\\s*${imported}\\s*חשבוני`).test(res) && !/נדחו/.test(res), `תוצאת הייבוא מהמסך (${file}): ` + res);
  };
  const dashboard = async pg => {
    await pg.goto(`${base}/app/#/dashboard`);
    await pg.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
    await pg.getByTestId('kpis').waitFor({ state: 'attached' });
    await pg.waitForTimeout(600);
  };
  const checkCard = async (pg, tag) => {
    await dashboard(pg);
    const cards = pg.locator('[data-testid=notice][data-intent=shared_contact]').filter({ hasText: '9822' });
    await cards.first().waitFor();
    ok(await cards.count() === 1, `${tag}: ${await cards.count()} כרטיסים על 9822 במקום 1`);
    const t = await cards.first().textContent();
    ok(t.includes('אולי שינוי שם?'), `${tag}: הכרטיס לא שואל «אולי שינוי שם?»: ` + t);
    ok(/העלו קובץ עם כולן/.test(t) && /עברה לאדם אחר — אין צורך/.test(t), `${tag}: הכרטיס לא אומר מה לעשות בכל מקרה: ` + t);
    ok(!t.includes('שני לקוחות בשמות שונים'), `${tag}: נוסח 26 (חשבונית חדשה) במקום נוסח 388: ` + t);
    for (const pii of [OLD, NEW, 'דויד', 'כהן-לוי']) ok(!t.includes(pii), `${tag}: שם בכרטיס («${pii}»): ` + t);
    ok(!t.replace(/\D/g, '').includes(DIGITS) && !t.replace(/\D/g, '').includes('500000821'), `${tag}: טלפון בכרטיס: ` + t);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: גלילה רוחבית`);
    if (out) { await cards.first().scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${out}/csv-rename-back-${tag}.png`, fullPage: false }); }
  };

  // 2) קובץ חלקי מהמסך ⇒ פיצול + כרטיס אחד
  const ctx = await ctxOf(1366, 900);
  const p = await ctx.newPage(); watch(p);
  await uploadFromScreen(p, PARTIAL, 'partial.csv', 1);
  const split = byPhone(await api('/customers'));
  ok(split.length === 2 && split.some(c => c.name === OLD) && split.some(c => c.name === NEW), 'הקובץ החלקי לא פוצל (383): ' + JSON.stringify(split));
  await checkCard(p, 'desktop');
  ok((await renameCards()).length === 1, 'השרת: כרטיסים «אולי שינוי שם?» פתוחים: ' + (await renameCards()).length);
  const m = await ctxOf(390, 844);
  const mp = await m.newPage(); watch(mp);
  await checkCard(mp, 'mobile');

  // 3) קובץ בשם הישן מהמסך ⇒ החשבונית חזרה ⇒ הכרטיס יורד (why: back)
  await uploadFromScreen(p, BACK, 'back.csv', 2);
  ok((await renameCards()).length === 0, 'הכרטיס «אולי שינוי שם?» לא ירד אחרי שהחשבונית חזרה לשם הקודם (why: back): ' + (await renameCards()).length);
  const resolved = (await api('/audit')).filter(a => a.action === 'shared_contact_resolved').map(a => ({ ...a, d: JSON.parse(a.detail || '{}') }));
  ok(resolved.length === 1 && resolved[0].d.why === 'back', 'audit shared_contact_resolved: ' + JSON.stringify(resolved.map(x => x.d)));
  for (const pii of [OLD, NEW, 'דויד', DIGITS, '500000821']) ok(!resolved[0].detail.includes(pii), `PII ב-audit («${pii}»): ` + resolved[0].detail);
  ok(Object.keys(resolved[0].d).sort().join() === 'invoice,message,why', 'שדות ב-audit מעבר ל-message/invoice/why: ' + resolved[0].detail);
  // הטלפון כבר מציג את הדשבורד מלפני הקובץ ⇒ פתיחה מחדש (כמו בעל עסק שפותח את האפליקציה); בלי זה goto לאותו #
  // לא טוען כלום, והמסך לא מתרענן לבד כשאין stale (ממצא QA 401 — ב-STATUS).
  for (const [pg, tag] of [[p, 'desktop'], [mp, 'mobile']]) {
    if (pg === mp) await mp.goto('about:blank');
    await dashboard(pg);
    ok(await pg.locator('[data-testid=notice][data-intent=shared_contact]').filter({ hasText: '9822' }).count() === 0,
      `${tag}: הכרטיס «אולי שינוי שם?» עדיין בדשבורד אחרי שהחשבונית חזרה`);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: גלילה רוחבית בדשבורד`);
    if (out) await pg.screenshot({ path: `${out}/csv-rename-back-dashboard-${tag}.png`, fullPage: false });
  }
  await p.goto(`${base}/app/#/invoices`);
  const find = p.getByTestId('inv-find'); await find.waitFor();
  await find.fill('0000821');
  await p.waitForFunction(() => document.querySelectorAll('tbody tr > td:first-child > .font-bold').length >= 2 || !!document.querySelector('[data-testid=inv-empty]'));
  const rows = await p.locator('tbody > tr').evaluateAll(trs => trs
    .map(tr => ({ name: tr.querySelector('td:first-child > .font-bold')?.textContent?.trim() || '', text: tr.textContent || '' }))
    .filter(x => x.name));
  ok(rows.length === 2 && rows.every(x => x.name === OLD) && rows.some(x => x.text.includes('9821')) && rows.some(x => x.text.includes('9822')),
    `9821/9822 לא חזרו תחת «${OLD}»: ` + JSON.stringify(rows.map(x => x.name)));
  if (out) await p.screenshot({ path: `${out}/csv-rename-back-invoices.png`, fullPage: false });

  // 4) בקרה: אותו קובץ שוב ⇒ אין כרטיס חדש, אין resolved כפול
  await uploadFromScreen(p, BACK, 'back-again.csv', 2);
  ok((await renameCards()).length === 0, 'קובץ ישן חוזר פתח כרטיס חדש');
  ok((await api('/audit')).filter(a => a.action === 'shared_contact_resolved').length === 1, 'resolved נרשם פעמיים');
  await m.close(); await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log('✓ why: back — קובץ חלקי מהמסך ⇒ כרטיס אחד (בלי שם/טלפון, 390px) · קובץ בשם הישן ⇒ הכרטיס יורד מהשרת ומהדשבורד (דסקטופ+390px), audit why=back בלי PII, 9821+9822 חזרו לשם הקודם · קובץ חוזר ⇒ בלי כרטיס/resolved כפול · 0 שגיאות');
} finally { await b.close(); srv.kill(); }
