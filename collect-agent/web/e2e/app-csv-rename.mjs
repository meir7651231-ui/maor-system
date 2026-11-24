// גבי QA (מנהל 387, «הבא» של QA מ-383–386): שינוי שם בקובץ CSV ⇒ אותו לקוח ברשימה של /app/ — מקצה לקצה, בלי יירוט.
// מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי:
//  1) ייבוא ראשון (API): «רינה כהן» עם 9701+9702 בטלפון 050-0000701 ⇒ תכנון ⇒ תזכורת ממתינה.
//  2) ייבוא שני **מהמסך** (/app/ ← הגדרות ← קובץ CSV): אותן חשבוניות, השם «רינה אברמוב» (נישואין/תיקון כתיב — מנהל 382),
//     + חשבונית **חדשה** 9703 של «שרה פרץ» באותו טלפון (אדם אחר — חייב להיפרד, מנהל 383).
//  3) /app/#/invoices, חיפוש לפי הטלפון ⇒ 3 שורות: 9701+9702 תחת «רינה אברמוב» (אין «רינה כהן» בשום מקום), 9703 תחת «שרה פרץ».
//  4) השרת: אותו מזהה לקוח לרינה, השם התעדכן, לא נוצר לקוח-רפאים · שרה = לקוח נפרד · התזכורת הממתינה לא בוטלה
//     (contact_changed) · אין כרטיס «שני לקוחות בשמות שונים» על רינה.
//  5) 390px: אותה רשימה, בלי גלילה רוחבית · 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-csv-rename.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8189, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-rename') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const HEAD = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n';
const OLD = 'רינה כהן', NEW = 'רינה אברמוב', OTHER = 'שרה פרץ', PHONE = '050-0000701';
const V1 = HEAD + `9701,${OLD},${PHONE},450,2026-10-15\n9702,${OLD},${PHONE},300,2026-10-20\n`;
const V2 = HEAD + `9701,${NEW},${PHONE},450,2026-10-15\n9702,${NEW},${PHONE},300,2026-10-20\n9703,${OTHER},${PHONE},200,2026-10-25\n`;
const byPhone = cs => cs.filter(c => (c.phone || '').replace(/\D/g, '').endsWith('500000701'));

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // 1) ייבוא ראשון + תכנון
  const r1 = await api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(V1, 'utf8') });
  ok(r1.imported === 2 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));
  // שער «אישור רשימת הפתוחות» (דלוק בהדגמה): מאשרים שהשתיים עדיין פתוחות ⇒ תכנון ⇒ תזכורת ממתינה
  const ol = (await api('/open-list')).pending.filter(x => ['9701', '9702'].includes(x.number));
  ok(ol.length === 2, 'רשימת הפתוחות: ' + JSON.stringify(ol));
  await api('/open-list/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ still_open: ol.map(x => x.id) }) });
  await api('/plan', { method: 'POST' });
  const c1 = byPhone(await api('/customers'));
  ok(c1.length === 1 && c1[0].name === OLD, 'אחרי ייבוא ראשון: ' + JSON.stringify(c1));
  const rinaId = c1[0].id, total1 = (await api('/customers')).length;
  const pend = (await api('/reminders')).filter(r => ['9701', '9702'].some(n => String(r.number || '').includes(n)) && r.status === 'pending_approval');
  ok(pend.length >= 1, 'אין תזכורת ממתינה ל-9701/9702 אחרי תכנון');
  const pendIds = pend.map(r => r.id);

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
  // 2) ייבוא שני מהמסך
  const ctx = await ctxOf(1366, 900);
  const p = await ctx.newPage(); watch(p);
  await p.goto(`${base}/app/#/settings`);
  const input = p.getByLabel('קובץ CSV');
  await input.waitFor({ state: 'attached' });
  await input.setInputFiles({ name: 'rename.csv', mimeType: 'text/csv', buffer: Buffer.from(V2, 'utf8') });
  await p.waitForFunction(() => /יובאו/.test(document.querySelector('[data-testid=csv-result]')?.textContent || ''));
  const res = await p.getByTestId('csv-result').textContent();
  ok(/יובאו\s*3\s*חשבוניות/.test(res) && !/נדחו/.test(res), 'תוצאת הייבוא מהמסך: ' + res);

  // 3) הרשימה ב-/app/
  const checkList = async (pg, tag) => {
    await pg.goto(`${base}/app/#/invoices`);
    const find = pg.getByTestId('inv-find'); await find.waitFor();
    await find.fill('0000701');
    await pg.waitForFunction(() => document.querySelectorAll('tbody tr > td:first-child > .font-bold').length >= 3 || !!document.querySelector('[data-testid=inv-empty]'));
    const rows = await pg.locator('tbody > tr').evaluateAll(trs => trs
      .map(tr => ({ name: tr.querySelector('td:first-child > .font-bold')?.textContent?.trim() || '', text: tr.textContent || '' }))
      .filter(x => x.name));
    const nameOf = n => rows.find(x => x.text.includes(n))?.name;
    ok(rows.length === 3, `${tag}: ${rows.length} שורות במקום 3: ` + JSON.stringify(rows.map(x => x.name)));
    ok(nameOf('9701') === NEW && nameOf('9702') === NEW, `${tag}: 9701/9702 לא תחת «${NEW}»: ` + JSON.stringify(rows.map(x => x.name)));
    ok(nameOf('9703') === OTHER, `${tag}: 9703 לא תחת «${OTHER}»`);
    ok(!(await pg.locator('main').textContent()).includes(OLD), `${tag}: השם הישן «${OLD}» עדיין מוצג`);
    await find.fill('רינה');
    await pg.waitForFunction(() => document.querySelectorAll('tbody tr > td:first-child > .font-bold').length === 2);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: גלילה רוחבית`);
    if (out) await pg.screenshot({ path: `${out}/csv-rename-${tag}.png`, fullPage: false });
  };
  await checkList(p, 'desktop');

  // 4) השרת
  const all = await api('/customers'), c2 = byPhone(all);
  const rina = c2.find(c => c.id === rinaId);
  ok(rina && rina.name === NEW, 'הלקוח של רינה לא שמר מזהה/שם: ' + JSON.stringify(c2));
  ok(!c2.some(c => c.name === OLD), 'נשאר לקוח-רפאים בשם הישן: ' + JSON.stringify(c2));
  ok(c2.length === 2 && c2.some(c => c.name === OTHER && c.id !== rinaId), 'שרה לא הופרדה ללקוח משלה: ' + JSON.stringify(c2));
  ok(all.length === total1 + 1, `מספר הלקוחות: ${all.length} (צפוי ${total1 + 1} — רק שרה נוספה)`);
  const rem = await api('/reminders');
  for (const id of pendIds) {
    const r = rem.find(x => x.id === id);
    ok(r && r.status !== 'cancelled' && r.block_reason !== 'contact_changed', `התזכורת ${id} בוטלה בשינוי השם: ` + JSON.stringify(r && { status: r.status, block_reason: r.block_reason }));
  }
  const inbox = await api('/owner/inbox');
  const rinaCards = inbox.filter(m => m.intent === 'shared_contact' && m.customer_id === rinaId && /רינה/.test(m.body || ''));
  ok(!rinaCards.some(m => (m.body || '').includes(OLD) && (m.body || '').includes(NEW)), 'כרטיס «שני לקוחות» על שינוי שם: ' + JSON.stringify(rinaCards.map(m => m.body)));
  await ctx.close();

  // 5) מובייל
  const m = await ctxOf(390, 844);
  const mp = await m.newPage(); watch(mp);
  await checkList(mp, 'mobile');
  await m.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log(`✓ שינוי שם בקובץ CSV: ייבוא מהמסך ⇒ 9701+9702 תחת «${NEW}» (אותו לקוח #${rinaId}, אין «${OLD}») · 9703 «${OTHER}» לקוח נפרד · תזכורת ממתינה לא בוטלה · אין כרטיס שווא · 390px · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
