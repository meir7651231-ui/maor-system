// דמו מקצה לקצה בדפדפן: שרת גבי אמיתי (DEMO=1, dry-run) + הממשק המעוצב מ-/app/.
// דרישה: npm run build. הרצה: node e2e/live.mjs [תיקיית-צילומים]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const PORT = 8141, base = `http://127.0.0.1:${PORT}`;
const srv = spawn('python3', ['-m', 'uvicorn', 'app.main:_lazy_app', '--factory', '--port', String(PORT), '--log-level', 'warning'],
  { cwd: new URL('..', import.meta.url).pathname + '/..', env: { ...process.env, DEMO: '1' }, stdio: 'ignore' });
const ok = (c, m) => { if (!c) throw new Error(m); };
for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch { /* עוד עולה */ } await new Promise(r => setTimeout(r, 250)); }
const b = await chromium.launch();
const errors = [];
try {
  const p = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: out ? 2 : 1 });
  p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto(base + '/app/#/dashboard');
  await p.getByTestId('mode').filter({ hasText: 'מחובר לשרת גבי' }).waitFor();
  const outbox0 = (await (await fetch(base + '/outbox')).json()).messages.length;
  const items = p.locator('li', { has: p.getByRole('button', { name: 'תצוגה ואישור' }) });
  ok(await items.count() === 2, `ציפיתי ל-2 בתור, יש ${await items.count()}`);
  ok(await p.getByText('אין נייד או מייל תקין').count() >= 1, 'החסימה no_contact לא מוצגת');
  if (out) await p.screenshot({ path: `${out}/live-01-dashboard.png`, fullPage: true });

  // חסום ⇒ אי אפשר לאשר
  await items.filter({ hasText: 'בלי פרטים' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  await p.getByText('⛔ חסום').waitFor();
  ok(await p.getByRole('button', { name: /אשר ושלח/ }).isDisabled(), 'תזכורת חסומה ניתנת לאישור');
  await p.getByRole('button', { name: 'ביטול' }).click();

  // יוסי ⇒ התצוגה המקדימה = הנוסח מהשרת, עם קישור תשלום וקישור הסרה
  await items.filter({ hasText: 'יוסי' }).getByRole('button', { name: 'תצוגה ואישור' }).click();
  const sms = p.locator('textarea');
  await p.waitForFunction(() => document.querySelector('textarea')?.value.includes('pay.example/gabi-demo'));
  const body = await sms.inputValue();
  ok(body.startsWith('סטודיו דמו:') && /\/u\//.test(body), 'נוסח ה-SMS לא מהשרת: ' + body);
  if (out) await p.screenshot({ path: `${out}/live-02-preview-sms.png` });
  await p.getByRole('tab', { name: /מייל/ }).click();
  await p.getByText('yossi@example.com').first().waitFor();
  if (out) await p.screenshot({ path: `${out}/live-03-preview-email.png` });
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  await p.waitForFunction(() => document.querySelectorAll('li button').length >= 0);
  const outbox1 = (await (await fetch(base + '/outbox')).json()).messages.length;
  ok(outbox1 === outbox0 + 2, `ביומן היוצאים ציפיתי ל-+2 (SMS+מייל), קיבלתי ${outbox0}→${outbox1}`);
  await p.waitForFunction(() => [...document.querySelectorAll('button')].filter(x => x.textContent === 'תצוגה ואישור').length === 1);
  ok((await p.getByTestId('outbox').textContent()).includes('יוסי'), 'יומן היוצאים בממשק לא התעדכן');

  // סימולציית תשובה
  await p.getByLabel('לקוח').selectOption({ label: 'יוסי כהן (דמו)' });
  await p.getByRole('button', { name: 'איך אפשר לשלם?' }).click();
  await p.getByRole('button', { name: 'שלח תשובה (סימולציה)' }).click();
  await p.getByTestId('reply-result').waitFor();
  ok((await p.getByTestId('reply-result').textContent()).includes('קישור תשלום'), 'הסיווג לא הוצג');
  if (out) await p.screenshot({ path: `${out}/live-04-after.png`, fullPage: true });

  await p.goto(base + '/app/#/invoices');
  await p.getByText('דנה לוי').first().waitFor();
  ok(await p.locator('tbody tr').count() === 5, 'ציפיתי ל-5 חשבוניות פתוחות');
  if (errors.length) throw new Error('שגיאות קונסולה:\n' + errors.join('\n'));
  console.log(`✓ דמו חי מקצה לקצה עבר: תור 2 → אישור יוסי → יומן +2 (${outbox0}→${outbox1}) → תשובת לקוח סווגה · 0 שגיאות קונסולה`);
} finally { await b.close(); srv.kill(); }
