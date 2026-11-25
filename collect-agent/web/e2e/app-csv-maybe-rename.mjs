// גבי QA (מנהל 393, «הבא» (1) מ-392): «אולי שינוי שם?» (388) מקצה לקצה מהמסך, כולל תשובה נכנסת אחרי האיחוד (392).
// מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי, בלי יירוט:
//  1) ייבוא ראשון (API): «דויד כהן» עם 9821+9822, טלפון 050-0000821.
//  2) קובץ **חלקי** מהמסך (/app/ ← הגדרות ← קובץ CSV): רק 9822, בשם «דוד כהן-לוי» ⇒ בדשבורד «דורש טיפול שלך»
//     **כרטיס אחד** `shared_contact` שאומר «אולי שינוי שם?» + 9822 + מה לעשות («העלו קובץ עם כולן» / «עברה לאדם אחר —
//     אין צורך»), **בלי שם ובלי טלפון** · 390px בלי גלילה רוחבית.
//  3) קובץ **מלא** מהמסך (9821+9822 בשם החדש) ⇒ /app/#/invoices לפי הטלפון: שתי השורות תחת «דוד כהן-לוי», השם הישן
//     לא מוצג בשום מקום · הכרטיס **יורד** מהדשבורד ומ-/owner/inbox (מנהל 394).
//  4) «איך משלמים?» מהטלפון (/inbound) ⇒ **לא** `shared_contact_ambiguous` (לקוח-הרפאים «דויד כהן» לא מתחרה — 392),
//     משויכת למי שמחזיק את החוב, ויש טיוטה ⇒ הטיוטה מופיעה ב-/app/#/inbox, ואין בדשבורד כרטיס «הודעה ממספר של כמה
//     לקוחות».  · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-csv-maybe-rename.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8204, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-maybe-rename') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const HEAD = 'מספר מסמך,שם לקוח,טלפון,סכום,סטטוס,תאריך,תאריך לתשלום\n';
const OLD = 'דויד כהן', NEW = 'דוד כהן-לוי', PHONE = '050-0000821', DIGITS = '0500000821';
const row = (num, name) => `${num},${name},${PHONE},500,פתוח,01/10/26,15/10/26\n`;
const V1 = HEAD + row('9821', OLD) + row('9822', OLD);
const PARTIAL = HEAD + row('9822', NEW);
const FULL = HEAD + row('9821', NEW) + row('9822', NEW);
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
    if (out) { await cards.first().scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${out}/csv-maybe-rename-${tag}.png`, fullPage: false }); }
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

  // 3) קובץ מלא מהמסך ⇒ שתי החשבוניות תחת השם החדש
  await uploadFromScreen(p, FULL, 'full.csv', 2);
  await p.goto(`${base}/app/#/invoices`);
  const find = p.getByTestId('inv-find'); await find.waitFor();
  await find.fill('0000821');
  await p.waitForFunction(() => document.querySelectorAll('tbody tr > td:first-child > .font-bold').length >= 2 || !!document.querySelector('[data-testid=inv-empty]'));
  const rows = await p.locator('tbody > tr').evaluateAll(trs => trs
    .map(tr => ({ name: tr.querySelector('td:first-child > .font-bold')?.textContent?.trim() || '', text: tr.textContent || '' }))
    .filter(x => x.name));
  ok(rows.length === 2, `${rows.length} שורות במקום 2: ` + JSON.stringify(rows.map(x => x.name)));
  ok(rows.every(x => x.name === NEW) && rows.some(x => x.text.includes('9821')) && rows.some(x => x.text.includes('9822')),
    `9821/9822 לא תחת «${NEW}»: ` + JSON.stringify(rows.map(x => x.name)));
  ok(!(await p.locator('main').textContent()).includes(OLD), `השם הישן «${OLD}» עדיין מוצג ברשימה`);
  if (out) await p.screenshot({ path: `${out}/csv-maybe-rename-merged.png`, fullPage: false });
  // השרת: מחזיק החוב = «דוד כהן-לוי»; «דויד כהן» נשאר בטבלה בלי חשבוניות (רפאים — 392, לא מזיק)
  const merged = byPhone(await api('/customers'));
  const holder = merged.filter(c => c.name === NEW);
  ok(holder.length === 1, 'השרת: לא לקוח אחד בשם החדש אחרי הקובץ המלא: ' + JSON.stringify(merged));
  const owner = holder[0].id;
  // 3ב) מנהל 394: הכרטיס יורד אחרי האיחוד — בשרת ובדשבורד (הכותרת «נשמרו כלקוחות נפרדים» כבר לא נכונה)
  ok((await renameCards()).length === 0, 'הכרטיס «אולי שינוי שם?» לא ירד אחרי הקובץ המלא (מנהל 394): ' + (await renameCards()).length);
  await dashboard(p);
  ok(await p.locator('[data-testid=notice][data-intent=shared_contact]').filter({ hasText: '9822' }).count() === 0,
    'הכרטיס «אולי שינוי שם?» עדיין בדשבורד אחרי האיחוד (מנהל 394)');

  // 4) תשובה מהטלפון ⇒ טיוטה, לא «דו-משמעית»
  const r = await api('/inbound', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'sms', sender: PHONE, text: 'איך משלמים?' }) });
  ok(r.intent !== 'shared_contact_ambiguous', 'התשובה נחשבה דו-משמעית (לקוח-רפאים מתחרה — 392): ' + JSON.stringify(r));
  ok(r.draft_id, 'אין טיוטה לתשובה: ' + JSON.stringify(r));
  if (r.customer_id !== undefined) ok(r.customer_id === owner, `התשובה שויכה ללקוח ${r.customer_id} ולא למחזיק החוב ${owner}`);
  await p.goto(`${base}/app/#/inbox`);
  const draft = p.getByTestId(`draft-${r.draft_id}`);
  await draft.waitFor();
  ok(await draft.getAttribute('data-intent') !== 'shared_contact_ambiguous', 'הטיוטה ב-/app/#/inbox מסומנת דו-משמעית');
  if (out) { await draft.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${out}/csv-maybe-rename-reply.png`, fullPage: false }); }
  await dashboard(p);
  ok(await p.locator('[data-testid=notice][data-intent=shared_contact_ambiguous]').count() === 0, 'בדשבורד כרטיס «הודעה ממספר של כמה לקוחות»');
  await mp.goto(`${base}/app/#/inbox`);
  await mp.getByTestId(`draft-${r.draft_id}`).waitFor();
  ok(await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile: גלילה רוחבית ב-/app/#/inbox');
  await m.close(); await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log(`✓ «אולי שינוי שם?»: קובץ חלקי מהמסך ⇒ כרטיס אחד (9822, שני המסלולים, בלי שם/טלפון), 390px · קובץ מלא ⇒ 9821+9822 תחת «${NEW}», «${OLD}» לא מוצג, הכרטיס יורד · «איך משלמים?» מהטלפון ⇒ טיוטה (${r.intent}) ב-/app/#/inbox, לא דו-משמעית · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
