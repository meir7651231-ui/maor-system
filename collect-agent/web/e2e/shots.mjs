// מצב מוק (בלי שרת): כל המסכים, דסקטופ + מובייל, אפס שגיאות, אפס בקשות חיצוניות, אפס גלילה רוחבית.
// דרישה: npm run build. הרצה: node e2e/shots.mjs <תיקיית-צילומים>
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2] ?? 'screenshots';
const srv = spawn('npx', ['vite', 'preview', '--port', '4319', '--strictPort'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));
const base = 'http://localhost:4319/';
const ok = (c, m) => { if (!c) throw new Error(m); };
async function fullShot(pg, path) {
  const vp = pg.viewportSize();
  const h = await pg.evaluate(() => document.documentElement.scrollHeight);
  await pg.setViewportSize({ width: vp.width, height: Math.max(h, vp.height) });
  await pg.screenshot({ path });
  await pg.setViewportSize(vp);
}
async function noHScroll(pg, where) {
  const [sw, cw] = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw <= cw, `גלילה רוחבית ב-${where}: ${sw}>${cw}`);
}
const b = await chromium.launch();
const errors = [], external = [], posts = [];
async function page(vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 2 });
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  p.on('pageerror', e => errors.push(String(e)));
  p.on('request', r => {
    if (!r.url().startsWith('http://localhost:4319/') && !r.url().startsWith('data:')) external.push(r.url());
    if (r.method() !== 'GET') posts.push(`${r.method()} ${r.url()}`);
  });
  return p;
}
const ROUTES = ['', '#/signup', '#/dashboard', '#/invoices', '#/inbox', '#/settings'];
try {
  const p = await page({ width: 1366, height: 900 });
  await p.goto(base); await p.waitForTimeout(600);
  // דף נחיתה (v2): סלוגן, מחיר אחד בשתי תקופות כולל מע״מ, כללי המוצר, טיוטה משפטית, בלי וואטסאפ ובלי מחירונים אחרים
  ok((await p.getByTestId('hero-title').textContent()).includes('הכסף שלך חוזר'), 'סלוגן חסר');
  const price = await p.getByTestId('price-card').textContent();
  ok(/₪119/.test(price) && /₪1,190/.test(price) && /כולל מע״מ/.test(price) && /14 יום/.test(price), 'כרטיס מחיר: ' + price);
  const landingText = await p.evaluate(() => document.body.innerText);
  ok(!/לפני מע״מ/.test(landingText), '"לפני מע״מ" בדף');
  ok(!/וואטסאפ|whatsapp/i.test(landingText), 'דף הנחיתה מזכיר וואטסאפ');
  ok(!/העוזר לגביית חובות/.test(landingText), 'נשאר התיאור הישן');
  ok(!/₪(0|49|79|179|249|349)(?![\d,])/.test(landingText), 'מחירון אחר בדף');
  ok(/08:00/.test(landingText) && /20:00/.test(landingText) && /עד 3 תזכורות/.test(landingText), 'כללי שעות/3 תזכורות חסרים');
  ok(/טיוטה – לבדיקת עו״ד/.test(landingText) && /\[שם החברה/.test(landingText), 'פוטר משפטי/placeholder חסר');
  ok(await p.evaluate(() => document.querySelector('meta[name=robots]')?.getAttribute('content')) === 'noindex, nofollow', 'noindex');
  await fullShot(p, `${out}/01-landing.png`);
  // רשימת המתנה: אין שום בקשת רשת
  const before = posts.length;
  await p.getByTestId('waitlist').locator('input').fill('test@example.com');
  await p.getByRole('button', { name: 'לרשימת ההמתנה' }).click();
  await p.getByTestId('waitlist').getByRole('status').filter({ hasText: 'תודה' }).waitFor();
  ok(posts.length === before, 'טופס רשימת ההמתנה שלח בקשה: ' + posts.slice(before).join(', '));

  await p.goto(base + '#/dashboard');
  await p.getByTestId('mode').filter({ hasText: 'מצב דמו (מוק)' }).waitFor({ timeout: 5000 }); // בלי שרת ⇒ מוק
  await fullShot(p, `${out}/02-dashboard.png`);
  await p.getByRole('button', { name: 'תצוגה ואישור' }).first().click();
  await p.screenshot({ path: `${out}/03-preview-sms.png` });
  await p.getByRole('tab', { name: /מייל/ }).click();
  await p.screenshot({ path: `${out}/04-preview-email.png` });
  const n0 = await p.getByRole('button', { name: 'תצוגה ואישור' }).count();
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  ok(await p.getByRole('button', { name: 'תצוגה ואישור' }).count() === n0 - 1, 'תור האישורים לא התעדכן');
  await p.goto(base + '#/invoices'); await p.waitForTimeout(300);
  await fullShot(p, `${out}/05-invoices.png`);
  await p.getByLabel('חיפוש').fill('גפן');
  ok(await p.locator('tbody tr').count() === 1, 'חיפוש לא סינן');
  await p.goto(base + '#/settings'); await p.waitForTimeout(300);
  await p.getByTestId('settings-mock').waitFor();
  ok(await p.getByRole('button', { name: 'שמירה בלשונית בלבד (מוק)' }).isDisabled(), 'במוק בלי שינוי — אין שמירה');
  await p.getByLabel('שם לחתימה').fill('לוטם כהן');
  await p.getByRole('button', { name: 'שמירה בלשונית בלבד (מוק)' }).click();
  await p.getByText('נשמר בלשונית הזו בלבד — לא בשרת (מוק)').waitFor();
  ok(await p.getByLabel('קובץ CSV').isDisabled(), 'ייבוא CSV במוק אמור להיות כבוי');
  await fullShot(p, `${out}/06-settings.png`);
  await p.goto(base + '#/signup'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/07-signup.png` });
  for (const r of ROUTES) { await p.goto(base + r); await p.waitForTimeout(250); await noHScroll(p, `דסקטופ ${r || 'נחיתה'}`); }

  const m = await page({ width: 390, height: 844 });
  for (const r of ROUTES) { await m.goto(base + r); await m.waitForTimeout(300); await noHScroll(m, `מובייל ${r || 'נחיתה'}`); }
  await m.goto(base); await m.waitForTimeout(500);
  await fullShot(m, `${out}/08-mobile-landing.png`);
  await m.goto(base + '#/dashboard'); await m.waitForTimeout(300);
  await m.getByTestId('mode-mobile').filter({ hasText: 'מצב דמו' }).waitFor();
  await m.getByRole('button', { name: 'תצוגה ואישור' }).first().click();
  await m.screenshot({ path: `${out}/09-mobile-preview.png` });
  await noHScroll(m, 'מובייל תצוגה מקדימה');

  // לוגו: כל סמל על רקע כהה (סרגל, פוטר, מובייל) מקבל אריח קרם, והעין navy תמיד
  for (const [pg, url] of [[p, base + '#/dashboard'], [p, base], [m, base + '#/dashboard']]) {
    await pg.goto(url); await pg.waitForTimeout(300);
    const bad = await pg.evaluate(() => [...document.querySelectorAll('svg[data-logo]')].filter(svg => {
      if (!svg.getClientRects().length) return false;
      let el = svg.parentElement, bg = '';
      while (el && !bg) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') bg = c; el = el.parentElement; }
      const [r, g, b2] = (bg.match(/\d+/g) ?? ['255', '255', '255']).map(Number);
      const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b2 < 128;
      const eye = svg.querySelector('circle')?.getAttribute('fill');
      return (dark && svg.getAttribute('data-tile') !== 'cream') || eye !== '#0F172A';
    }).length);
    ok(bad === 0, `${bad} לוגואים על רקע כהה בלי אריח קרם / עין לא navy (${url})`);
  }
  ok(external.length === 0, 'בקשות חיצוניות: ' + [...new Set(external)].join(', '));
  if (errors.length) throw new Error('שגיאות קונסולה:\n' + errors.join('\n'));
  console.log(`✓ מוק: ${ROUTES.length} מסכים × דסקטופ+מובייל בלי גלילה רוחבית · 0 בקשות חיצוניות · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
