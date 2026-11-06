// צילומי מסך + בדיקת אפס-שגיאות-קונסולה. דרישה: npm run build קודם. הרצה: node e2e/shots.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
const out = process.argv[2] ?? 'screenshots';
const srv = spawn('npx', ['vite', 'preview', '--port', '4319', '--strictPort'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const base = 'http://localhost:4319/';
const b = await chromium.launch();
const errors = [];
async function page(vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  p.on('console', m => m.type() === 'error' && !/fonts\.g/.test(m.text()) && errors.push(m.text()));
  p.on('pageerror', e => errors.push(String(e)));
  return p;
}
try {
  const p = await page({ width: 1366, height: 900 });
  await p.goto(base); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/01-landing.png`, fullPage: true });
  await p.goto(base + '#/dashboard'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/02-dashboard.png`, fullPage: true });
  await p.getByRole('button', { name: 'תצוגה ואישור' }).first().click();
  await p.screenshot({ path: `${out}/03-preview-sms.png` });
  await p.getByRole('tab', { name: /מייל/ }).click();
  await p.screenshot({ path: `${out}/04-preview-email.png` });
  const before = await p.getByRole('button', { name: 'תצוגה ואישור' }).count();
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  const after = await p.getByRole('button', { name: 'תצוגה ואישור' }).count();
  if (after !== before - 1) throw new Error(`תור האישורים לא התעדכן: ${before}→${after}`);
  await p.goto(base + '#/invoices'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/05-invoices.png`, fullPage: true });
  await p.getByLabel('חיפוש').fill('גפן');
  if (await p.locator('tbody tr').count() !== 1) throw new Error('חיפוש לא סינן');
  await p.goto(base + '#/settings'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/06-settings.png`, fullPage: true });
  await p.goto(base + '#/signup'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/07-signup.png` });
  const m = await page({ width: 390, height: 844 });
  await m.goto(base); await m.waitForTimeout(500);
  await m.screenshot({ path: `${out}/08-mobile-landing.png`, fullPage: true });
  await m.goto(base + '#/dashboard'); await m.waitForTimeout(300);
  const sw = await m.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 390) throw new Error(`גלילה אופקית במובייל: ${sw}px`);
  await m.getByRole('button', { name: 'תצוגה ואישור' }).first().click();
  await m.screenshot({ path: `${out}/09-mobile-preview.png` });
  if (errors.length) throw new Error('שגיאות קונסולה:\n' + errors.join('\n'));
  console.log('✓ כל המסלולים עברו, 0 שגיאות קונסולה');
} finally { await b.close(); srv.kill(); }
