// תסריט ההדגמה של גבי מכירות (sales/demo-script.md, 5 דקות): כל שלב בתסריט = שלב כאן, מול הדמו האמיתי
// (שרת גבי, DEMO=1, dry-run). שלב שלא קיים בדמו ⇒ הבדיקה נכשלת. עם תיקייה: צילום לכל שלב (sales-demo-S#.png).
// tests/test_sales_demo_script.py מוודא שכל שלב בתסריט מופיע כאן ושיש לו צילום.
// דרישה: npm run build. הרצה: node e2e/sales-demo.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { assertPortFree, srvStdio, srvLogLevel, waitHealthy } from './lib.mjs';
const pw = createRequire(import.meta.url)('playwright');
const root = new URL('../..', import.meta.url).pathname;
const out = process.argv[2];
const ok = (c, m) => { if (!c) throw new Error(m); };
const PORT = 8191, base = `http://127.0.0.1:${PORT}`;
const TOKEN = (await import('node:crypto')).randomBytes(32).toString('base64url');
const api = async (path, init = {}) => (await fetch(base + path, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...init.headers } })).json();
await assertPortFree(PORT);
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', srvLogLevel()],
  { cwd: root, env: { ...process.env, DEMO: '1', OWNER_API_TOKEN: TOKEN, PORT: String(PORT) }, stdio: srvStdio('server-sales-demo') });
const b = await pw.chromium.launch();
const errors = [];
const watch = pg => { pg.on('pageerror', e => errors.push(String(e))); pg.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text())); };
const shot = async (pg, id) => { if (out) await pg.screenshot({ path: `${out}/sales-demo-${id}.png` }); };
const done = [];
try {
  await waitHealthy(base, srv);
  const p = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: out ? 2 : 1 });
  watch(p);
  const items = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) });

  const STEPS = {
    // S1 · נחיתה: הסלוגן והמחיר המלא
    S1: async () => {
      await p.goto(base + '/app/');
      ok((await p.getByTestId('hero-title').textContent()).includes('הכסף שלך חוזר'), 'הסלוגן חסר');
      const price = await p.getByTestId('price-card').textContent();
      ok(/₪119/.test(price) && /1,190/.test(price) && /כולל מע״מ/.test(price), 'המחיר המלא חסר: ' + price);
      await shot(p, 'S1');
    },
    // S2 · הבוקר של בעל העסק: הדשבורד והתור לאישור
    S2: async () => {
      await p.goto(`${base}/app/#/dashboard?token=${TOKEN}`);
      await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).first().waitFor({ state: 'attached' });
      await p.getByTestId('kpis').waitFor();
      ok(await items.filter({ hasText: 'יוסי' }).count() === 1, 'יוסי לא בתור האישורים');
      await shot(p, 'S2');
    },
    // S3 · כלום לא יוצא בלי אישור: התצוגה המקדימה של יוסי ⇒ אישור ⇒ יוצא (dry-run)
    S3: async () => {
      const before = (await api('/outbox')).messages.length;
      await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
      await p.getByRole('dialog').waitFor();
      ok((await p.getByRole('dialog').textContent()).includes('3,450.50'), 'הסכום של יוסי לא בתצוגה המקדימה');
      await shot(p, 'S3');
      await p.getByRole('button', { name: /אשר ושלח/ }).click();
      await p.getByRole('dialog').waitFor({ state: 'detached' });
      for (let i = 0; i < 40 && (await api('/outbox')).messages.length === before; i++) await p.waitForTimeout(150);
      ok((await api('/outbox')).messages.length > before, 'אחרי האישור שום הודעה לא יצאה (dry-run)');
    },
    // S4 · גבי לא מנחש: בלי פרטי קשר ⇒ חסום; סכום חריג (גל שרון) ⇒ אי אפשר לאשר בלי «הסכום נכון»
    S4: async () => {
      await items.filter({ hasText: 'בלי פרטים' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
      ok(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled(), 'תזכורת בלי פרטי קשר ניתנת לאישור');
      await p.getByRole('button', { name: 'ביטול' }).click();
      await items.filter({ hasText: 'גל שרון' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
      await p.getByTestId('confirm-amount').waitFor();
      ok(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled(), 'סכום חריג ניתן לאישור בלי סימון');
      await shot(p, 'S4');
      await p.getByRole('button', { name: 'ביטול' }).click();
    },
    // S5 · מה הלקוח רואה: עמוד החייב במובייל, התשלום בעמוד של העסק
    S5: async () => {
      const sms = (await api('/outbox')).messages.find(x => x.channel === 'sms' && x.body.includes('/p/'));
      ok(sms, 'אין SMS עם קישור קצר');
      const code = sms.body.split('/p/')[1].split(/\s/)[0];
      const ctx = await b.newContext({ ...pw.devices['iPhone 13'] });
      const pm = await ctx.newPage(); watch(pm);
      await pm.goto(`${base}/pay/${code}`);
      await pm.getByTestId('pay-amount').waitFor();
      ok(await pm.getByTestId('pay-page').count() === 1, 'אין כפתור תשלום');
      ok((await pm.getByTestId('pay-host').textContent()).includes('pay.example'), 'היעד אינו עמוד התשלום של העסק');
      await shot(pm, 'S5');
      await ctx.close();
    },
    // S6 · «אפשר בתשלומים?» ⇒ הצעה בלי ריבית, מחכה לאישור ⇒ אישור ⇒ הודעה אחת
    S6: async () => {
      await p.goto(base + '/app/#/dashboard');
      await p.getByLabel('לקוח').selectOption({ label: 'יוסי כהן (דמו)' });
      await p.getByRole('button', { name: 'אפשר ב-3 תשלומים?' }).click();
      await p.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
      const plan = p.getByTestId('needs-you').locator('li', { hasText: 'הצעת פריסה' });
      await plan.waitFor();
      ok((await plan.textContent()).includes('ללא ריבית'), 'ההצעה לא מציינת «ללא ריבית»');
      await plan.scrollIntoViewIfNeeded(); await shot(p, 'S6');
      const before = (await api('/outbox')).messages.length;
      await plan.getByRole('button', { name: /אישור ההצעה/ }).click();
      await plan.getByRole('button', { name: 'לחצו שוב לאישור' }).click();
      await p.getByText('ההצעה אושרה').waitFor();
      ok((await api('/outbox')).messages.length === before + 1, 'הצעת הפריסה לא יצאה פעם אחת בדיוק');
    },
  };
  for (const [id, run] of Object.entries(STEPS)) {
    try { await run(); } catch (e) { throw new Error(`שלב ${id} בתסריט לא עובד בדמו: ${e.message}`); }
    done.push(id);
  }
  ok(!errors.length, 'שגיאות קונסולה: ' + errors.join(' | '));
} finally { await b.close(); srv.kill(); }
console.log(`✓ תסריט ההדגמה של מכירות: ${done.join(' · ')} עברו מול הדמו · 0 שגיאות`);
