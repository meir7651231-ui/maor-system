// גבי QA (מנהל 391, «הבא» של QA מ-390): כרטיס `csv_reopened` («נסגרה לפי קובץ קודם, ובקובץ הזה שוב פתוחה») ב-/app/
// — מקצה לקצה, בלי יירוט. מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי:
//  1) ייבוא (API): 9811 «דנה לוי» ₪500 פתוחה ⇒ ייבוא (API) של אותה שורה «שולם» ⇒ נסגרה (closed=1), אין כרטיס.
//  2) ייבוא **מהמסך** (/app/ ← הגדרות ← קובץ CSV) של הקובץ הישן (9811 פתוחה) ⇒ בדשבורד «דורש טיפול שלך» **כרטיס אחד**
//     `csv_reopened` שמזכיר את 9811 ו«קובץ ישן» — בלי שם הלקוח ובלי הטלפון (בלי PII בכרטיס).
//  3) 390px: אותו כרטיס, בלי גלילה רוחבית.
//  4) ייבוא מהמסך של הקובץ העדכני («שולם») ⇒ «סומנו בקובץ כשולמו» במסך · הכרטיס יורד מהדשבורד ומ-/owner/inbox
//     (מנהל 389).
//  5) 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-csv-reopened.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8203, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-reopened') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const HEAD = 'מספר חשבונית,שם לקוח,טלפון,סכום,סטטוס,תאריך לתשלום\n';
const NAME = 'דנה לוי', PHONE = '050-0000811', NUM = '9811';
const csv = st => HEAD + `${NUM},${NAME},${PHONE},500,${st},2026-10-15\n`;
const postCsv = st => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(csv(st), 'utf8') });
const reopenCards = async () => (await api('/owner/inbox')).filter(m => m.intent === 'csv_reopened');

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // 1) קובץ ראשון 9811 פתוחה ⇒ קובץ «שולם» ⇒ נסגרה, בלי כרטיס
  const r1 = await postCsv('פתוח');
  ok(r1.imported === 1 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));
  const r2 = await postCsv('שולם');
  ok(r2.closed === 1 && r2.imported === 0, 'ייבוא «שולם»: ' + JSON.stringify(r2));
  ok(!(await reopenCards()).length, 'כרטיס «נפתחה מחדש» על סגירה');

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
  const uploadFromScreen = async (pg, st, file, imported) => {
    await pg.goto(`${base}/app/#/settings`);
    const input = pg.getByLabel('קובץ CSV');
    await input.waitFor({ state: 'attached' });
    await input.setInputFiles({ name: file, mimeType: 'text/csv', buffer: Buffer.from(csv(st), 'utf8') });
    await pg.waitForFunction(() => /יובאו/.test(document.querySelector('[data-testid=csv-result]')?.textContent || ''));
    const res = await pg.getByTestId('csv-result').textContent();
    ok(new RegExp(`יובאו\\s*${imported}\\s*חשבוני`).test(res) && !/נדחו/.test(res), `תוצאת הייבוא מהמסך (${file}): ` + res);
    return pg.getByTestId('csv-result');
  };
  const reopenOnDashboard = async pg => {
    await pg.goto(`${base}/app/#/dashboard`);
    await pg.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
    await pg.getByTestId('kpis').waitFor({ state: 'attached' });
    await pg.waitForTimeout(600);
    return pg.locator('[data-testid=notice][data-intent=csv_reopened]');
  };
  const checkCard = async (pg, tag) => {
    const cards = await reopenOnDashboard(pg);
    await cards.first().waitFor();
    ok(await cards.count() === 1, `${tag}: ${await cards.count()} כרטיסי «נפתחה מחדש» במקום 1`);
    const t = await cards.first().textContent();
    ok(t.includes(NUM), `${tag}: מספר החשבונית לא בכרטיס: ` + t);
    ok(/קובץ ישן/.test(t) && /שוב פתוחה/.test(t), `${tag}: הכרטיס לא מסביר «נסגרה ושוב פתוחה — אולי קובץ ישן»: ` + t);
    ok(/בלי אישורכם/.test(t), `${tag}: הכרטיס לא אומר שתזכורת לא תצא בלי אישור: ` + t);
    ok(!t.includes(NAME) && !t.replace(/\D/g, '').includes('0500000811'), `${tag}: PII בכרטיס: ` + t);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: גלילה רוחבית`);
    if (out) { await cards.first().scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${out}/csv-reopened-${tag}.png`, fullPage: false }); }
  };

  // 2) הקובץ הישן (פתוחה) מהמסך ⇒ כרטיס אחד בדשבורד
  const ctx = await ctxOf(1366, 900);
  const p = await ctx.newPage(); watch(p);
  await uploadFromScreen(p, 'פתוח', 'old.csv', 1);
  await checkCard(p, 'desktop');
  const srvCards = await reopenCards();   // /owner/inbox = needs_owner=1 בלבד
  ok(srvCards.length === 1, 'השרת: כרטיסים פתוחים: ' + srvCards.length);
  const cardId = srvCards[0].id;

  // 3) מובייל
  const m = await ctxOf(390, 844);
  const mp = await m.newPage(); watch(mp);
  await checkCard(mp, 'mobile');
  await m.close();

  // 4) הקובץ העדכני («שולם») מהמסך ⇒ «נסגרו» במסך · הכרטיס יורד
  const res = await uploadFromScreen(p, 'שולם', 'fresh.csv', 0);
  const closedNote = res.getByTestId('csv-closed');
  ok(await closedNote.count() === 1 && /\b1\b/.test(await closedNote.textContent()), 'המסך לא מדווח שחשבונית אחת נסגרה לפי הקובץ');
  const after = await reopenOnDashboard(p);
  ok(await after.count() === 0, 'הכרטיס לא ירד מהדשבורד אחרי הקובץ העדכני');
  const open = (await api('/owner/inbox')).filter(x => x.id === cardId);
  ok(!open.length, 'השרת: הכרטיס עדיין פתוח: ' + JSON.stringify(open));
  if (out) await p.screenshot({ path: `${out}/csv-reopened-resolved.png`, fullPage: false });
  await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log(`✓ כרטיס «נסגרה ושוב פתוחה בקובץ»: פתוחה⇒«שולם» בלי כרטיס · קובץ ישן מהמסך ⇒ כרטיס אחד ב«דורש טיפול שלך» (${NUM}, «קובץ ישן», בלי שם/טלפון) · 390px · קובץ «שולם» מהמסך ⇒ «נסגרו» + הכרטיס יורד · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
