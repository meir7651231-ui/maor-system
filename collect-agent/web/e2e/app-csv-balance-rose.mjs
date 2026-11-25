// גבי QA (מנהל 390, «הבא» של QA מ-386–389): כרטיס `csv_balance_rose` («יתרה עלתה בקובץ — אולי קובץ ישן») ב-/app/ — מקצה לקצה, בלי יירוט.
// מול שרת DEMO=1 · SOURCE_SYSTEM=csv אמיתי:
//  1) ייבוא (API): 9801 «דנה לוי» ₪1,200 ⇒ ייבוא (API) ₪800 (שולם חלק) ⇒ אין כרטיס (ירידה).
//  2) ייבוא **מהמסך** (/app/ ← הגדרות ← קובץ CSV) של הקובץ הישן ₪1,200 ⇒ בדשבורד «דורש טיפול שלך» **כרטיס אחד**
//     `csv_balance_rose` שמזכיר את 9801 ואת שני הסכומים — בלי שם הלקוח ובלי הטלפון (בלי PII בכרטיס).
//  3) 390px: אותו כרטיס, בלי גלילה רוחבית.
//  4) ייבוא מהמסך של הקובץ העדכני ₪800 ⇒ הכרטיס יורד מהדשבורד (מנהל 389) · השרת: needs_owner=0 · audit csv_card_resolved.
//  5) 0 שגיאות קונסולה/רשת.
// הרצה: node e2e/app-csv-balance-rose.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy, launchChromium, spawnServer } from './lib.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8191, base = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('base64url');
const ROOT = new URL('../..', import.meta.url).pathname;
await assertPortFree(PORT);
const srv = spawnServer('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: ROOT, env: { ...process.env, DEMO: '1', DEMO_CLOCK: '1', SOURCE_SYSTEM: 'csv', OWNER_API_TOKEN: TOKEN }, stdio: srvStdio('server-app-csv-balance-rose') });
const ok = (c, m) => { if (!c) throw new Error(m); };
const H = { Authorization: `Bearer ${TOKEN}` };
const api = async (p, o = {}) => { const r = await fetch(base + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); ok(r.ok, `${p}: ${r.status} ${await r.clone().text()}`); return r.json(); };
const HEAD = 'מספר חשבונית,שם לקוח,טלפון,סכום,תאריך לתשלום\n';
const NAME = 'דנה לוי', PHONE = '050-0000801', NUM = '9801';
const csv = amount => HEAD + `${NUM},${NAME},${PHONE},${amount},2026-10-15\n`;
const postCsv = amount => api('/settings/source/csv', { method: 'POST', headers: { 'Content-Type': 'text/csv' }, body: Buffer.from(csv(amount), 'utf8') });
const roseCards = async () => (await api('/owner/inbox')).filter(m => m.intent === 'csv_balance_rose');

await waitHealthy(base, srv);
const errors = [];
const b = await launchChromium(chromium);
try {
  // 1) קובץ ראשון ₪1,200 ⇒ קובץ ₪800 (ירידה ⇒ אין כרטיס)
  const r1 = await postCsv(1200);
  ok(r1.imported === 1 && !r1.rejected.length, 'ייבוא ראשון: ' + JSON.stringify(r1));
  const r2 = await postCsv(800);
  ok(r2.imported === 1, 'ייבוא שני: ' + JSON.stringify(r2));
  ok(!(await roseCards()).length, 'כרטיס «יתרה עלתה» על ירידה ביתרה');

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
  const uploadFromScreen = async (pg, amount, file) => {
    await pg.goto(`${base}/app/#/settings`);
    const input = pg.getByLabel('קובץ CSV');
    await input.waitFor({ state: 'attached' });
    await input.setInputFiles({ name: file, mimeType: 'text/csv', buffer: Buffer.from(csv(amount), 'utf8') });
    await pg.waitForFunction(() => /יובאו/.test(document.querySelector('[data-testid=csv-result]')?.textContent || ''));
    const res = await pg.getByTestId('csv-result').textContent();
    ok(/יובאו\s*1\s*חשבוני/.test(res) && !/נדחו/.test(res), `תוצאת הייבוא מהמסך (${file}): ` + res);
  };
  const roseOnDashboard = async pg => {
    await pg.goto(`${base}/app/#/dashboard`);
    await pg.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
    await pg.getByTestId('kpis').waitFor({ state: 'attached' });
    await pg.waitForTimeout(600);
    return pg.locator('[data-testid=notice][data-intent=csv_balance_rose]');
  };
  const checkCard = async (pg, tag) => {
    const cards = await roseOnDashboard(pg);
    await cards.first().waitFor();
    ok(await cards.count() === 1, `${tag}: ${await cards.count()} כרטיסי «יתרה עלתה» במקום 1`);
    const t = await cards.first().textContent();
    ok(t.includes(NUM), `${tag}: מספר החשבונית לא בכרטיס: ` + t);
    ok(/1,200/.test(t) && /800/.test(t), `${tag}: שני הסכומים לא בכרטיס: ` + t);
    ok(/קובץ ישן/.test(t), `${tag}: הכרטיס לא מסביר «אולי קובץ ישן»: ` + t);
    ok(!t.includes(NAME) && !t.replace(/\D/g, '').includes('0500000801'), `${tag}: PII בכרטיס: ` + t);
    ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${tag}: גלילה רוחבית`);
    if (out) { await cards.first().scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${out}/csv-balance-rose-${tag}.png`, fullPage: false }); }
  };

  // 2) הקובץ הישן מהמסך ⇒ כרטיס אחד בדשבורד
  const ctx = await ctxOf(1366, 900);
  const p = await ctx.newPage(); watch(p);
  await uploadFromScreen(p, 1200, 'old.csv');
  await checkCard(p, 'desktop');
  const srvCards = await roseCards();   // /owner/inbox = needs_owner=1 בלבד
  ok(srvCards.length === 1, 'השרת: כרטיסים פתוחים: ' + srvCards.length);
  const cardId = srvCards[0].id;

  // 3) מובייל
  const m = await ctxOf(390, 844);
  const mp = await m.newPage(); watch(mp);
  await checkCard(mp, 'mobile');
  await m.close();

  // 4) הקובץ העדכני מהמסך ⇒ הכרטיס יורד
  await uploadFromScreen(p, 800, 'fresh.csv');
  const after = await roseOnDashboard(p);
  ok(await after.count() === 0, 'הכרטיס לא ירד מהדשבורד אחרי הקובץ העדכני');
  const open = (await api('/owner/inbox')).filter(x => x.id === cardId);
  ok(!open.length, 'השרת: הכרטיס עדיין פתוח: ' + JSON.stringify(open));
  if (out) await p.screenshot({ path: `${out}/csv-balance-rose-resolved.png`, fullPage: false });
  await ctx.close();
  ok(!errors.length, 'שגיאות: ' + errors.join(' | '));
  console.log(`✓ כרטיס «יתרה עלתה בקובץ»: ₪1,200⇒₪800 בלי כרטיס · קובץ ישן מהמסך ⇒ כרטיס אחד ב«דורש טיפול שלך» (${NUM}, שני הסכומים, בלי שם/טלפון) · 390px · קובץ עדכני ⇒ הכרטיס יורד · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
