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
const ROUTES = ['', '#/signup', '#/login', '#/dashboard', '#/invoices', '#/inbox', '#/settings'];
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
  // הפעלה 140: המוק מספר את אותו סיפור כמו ההדגמה של השרת — הלקוח בחו״ל שילם $500, מוצג ליד ה-₪ ולא מחובר אליו
  ok((await p.getByTestId('chart-other').textContent()).trim() === '· ועוד $500, לא בגרף', 'מוק: שורת «לא בגרף» של הלקוח בדולר חסרה');
  ok((await p.getByTestId('kpis').textContent()).includes('ועוד $500'), 'מוק: «נגבה» בלי הדולר שנגבה');
  ok((await p.getByTestId('collection-chart').getAttribute('aria-label')).replace(/[^\d]/g, '') === '124870', 'מוק: הדולר חובר לסה״כ ב-₪ של הגרף');
  await fullShot(p, `${out}/02-dashboard.png`);
  await p.getByRole('button', { name: 'תצוגה ואישור' }).first().click();
  await p.screenshot({ path: `${out}/03-preview-sms.png` });
  // הפעלה 126: במוק ה-SMS נושא את הקישור המקוצר (demoShortUrl) ⇒ «חסר קישור תשלום» הופיע בכל תצוגה מקדימה
  ok(await p.getByText('חסר קישור תשלום').count() === 0, 'מוק: אזהרת «חסר קישור תשלום» שגויה על SMS עם קישור');
  await p.getByRole('tab', { name: /מייל/ }).click();
  await p.screenshot({ path: `${out}/04-preview-email.png` });
  const n0 = await p.getByRole('button', { name: 'תצוגה ואישור' }).count();
  await p.getByRole('button', { name: /אשר ושלח/ }).click();
  await p.getByText('לא נשלחה הודעה אמיתית').waitFor();
  ok(await p.getByRole('button', { name: 'תצוגה ואישור' }).count() === n0 - 1, 'תור האישורים לא התעדכן');
  // הפעלה 126: סכום חריג גם בהדגמה הסטטית — 2,490 ₪ ללקוח שמשלם 24.90/29.90 ⇒ אישור מפורש
  const gal = p.locator('li').filter({ hasText: 'גל שרון' });
  await gal.getByTestId('mock-amount-check').waitFor();
  await gal.getByRole('button', { name: 'תצוגה ואישור' }).click();
  const send = p.getByRole('button', { name: /אשר ושלח/ });
  await p.getByText('הסכום נכון — בדקתי').waitFor();
  ok(await send.isDisabled(), 'סכום חריג במוק: «אשר ושלח» פתוח לפני סימון «הסכום נכון»');
  await p.screenshot({ path: `${out}/03b-preview-amount-check.png` });
  await p.getByRole('checkbox', { name: /הסכום נכון/ }).check();
  ok(!(await send.isDisabled()), 'סכום חריג במוק: «אשר ושלח» נעול גם אחרי הסימון');
  await send.click();
  await p.getByText('לא נשלחה הודעה אמיתית').first().waitFor();
  ok(await gal.count() === 0, 'גל שרון נשארה בתור אחרי האישור');
  await p.goto(base + '#/invoices'); await p.waitForTimeout(300);
  await fullShot(p, `${out}/05-invoices.png`);
  // הפעלה 141: החשבונית בדולר של המוק (2010) שולמה ⇒ היא לא ברשימת «לא שולמו», וכל הסכומים בעמוד ב-₪
  const amounts141 = await p.locator('tbody tr td:nth-child(3)').allTextContents();
  ok(await p.locator('tbody tr', { hasText: 'Studio Abroad' }).count() === 0 && !(await p.locator('tbody').textContent()).includes('$'),
    'חשבונית הדולר ששולמה מופיעה ב«חשבוניות שלא שולמו»');
  ok(amounts141.length > 0 && amounts141.every(t => t.includes('₪')), 'עמוד החשבוניות במוק: סכום בלי ₪: ' + amounts141.join(' | '));
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
  // מסך הכניסה (שער 6) במוק: הטופס מוצג, אין שרת ⇒ אין בקשה; הסבר + «המשך להדגמה»; בלי «קוד גישה משותף»
  await p.goto(base + '#/login'); await p.getByTestId('login-mock').waitFor();
  ok(await p.getByText('יש לי קוד גישה משותף').count() === 0, 'במוק אין קוד משותף');
  const postsBeforeLogin = posts.length;
  await p.getByLabel('מייל').fill('dana@example.co.il');
  await p.getByLabel('סיסמה', { exact: true }).fill('x'.repeat(12));
  await p.getByLabel('קוד אימות').fill('12 34 56');
  ok(await p.getByLabel('קוד אימות').inputValue() === '123456', 'קוד האימות לא נוקה לספרות');
  await p.getByRole('button', { name: 'כניסה' }).click();
  await p.getByTestId('login-error').filter({ hasText: 'מצב דמו' }).waitFor();
  ok(posts.length === postsBeforeLogin, 'כניסה במוק שלחה בקשה');
  await p.screenshot({ path: `${out}/07b-login.png` });
  await p.getByRole('button', { name: 'המשך להדגמה ←' }).click();
  await p.getByTestId('mode').filter({ hasText: 'מצב דמו (מוק)' }).waitFor();
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

  // הפעלה 185 (עיצוב, פתוח מ-171/174): ב-390px החיפוש בחשבוניות ברוחב מלא (היה max-w-xs ⇒ רווח 38px מול המיון),
  // צ׳יפי הסינון ≥40px גובה (היו 34px), וב-320px הדשבורד בלי גלילה רוחבית (העמודה המובלעת התרחבה לשם הארוך)
  await m.goto(base + '#/invoices'); await m.getByTestId('inv-find').waitFor();
  const inv = await m.evaluate(() => {
    const w = e => e.getBoundingClientRect().width;
    const inp = document.querySelector('[data-testid=inv-find]');
    return { inp: w(inp), sel: w(document.querySelector('select[aria-label="מיון"]')),
      chips: [...inp.nextElementSibling.querySelectorAll('button')].map(c => [c.textContent, c.getBoundingClientRect().height]) };
  });
  ok(Math.abs(inv.inp - inv.sel) < 1, `מובייל: חיפוש החשבוניות לא ברוחב מלא (${inv.inp} מול ${inv.sel})`);
  ok(inv.chips.length >= 4 && inv.chips.every(([, h]) => h >= 40), 'מובייל: צ׳יפ סינון נמוך מ-40px: ' + JSON.stringify(inv.chips));
  await m.setViewportSize({ width: 320, height: 700 });
  for (const r of ['#/dashboard', '#/invoices', '#/inbox', '#/settings']) { await m.goto(base + r); await m.waitForTimeout(300); await noHScroll(m, `320px ${r}`); }
  await m.goto(base + '#/dashboard'); await m.getByTestId('queue-find').waitFor();
  const qf = await m.getByTestId('queue-find').boundingBox();
  ok(qf && qf.x >= 0 && qf.x + qf.width <= 320, '320px: חיפוש התור חורג מהמסך: ' + JSON.stringify(qf));
  await m.setViewportSize({ width: 390, height: 844 });

  // לוגו: על רקע כהה — גרסת-כהה (דיו קרם); על בהיר — דיו נייבי; המטבע הירוק היחיד
  for (const [pg, url] of [[p, base + '#/dashboard'], [p, base], [m, base + '#/dashboard']]) {
    await pg.goto(url); await pg.waitForTimeout(300);
    const bad = await pg.evaluate(() => [...document.querySelectorAll('svg[data-logo]')].filter(svg => {
      if (!svg.getClientRects().length) return false;
      let el = svg.parentElement, bg = '';
      while (el && !bg) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') bg = c; el = el.parentElement; }
      const [r, g, b2] = (bg.match(/\d+/g) ?? ['255', '255', '255']).map(Number);
      const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b2 < 128;
      const variant = svg.getAttribute('data-variant');
      const coin = svg.querySelector('circle[clip-path]')?.getAttribute('fill');
      return (dark ? variant !== 'dark' && svg.getAttribute('data-tile') !== 'navy' : variant !== 'light') || !['#10B981', '#059669'].includes(coin);
    }).length);
    ok(bad === 0, `${bad} לוגואים בגרסה לא תואמת לרקע / מטבע לא ירוק (${url})`);
  }
  ok(external.length === 0, 'בקשות חיצוניות: ' + [...new Set(external)].join(', '));
  if (errors.length) throw new Error('שגיאות קונסולה:\n' + errors.join('\n'));
  console.log(`✓ מוק: ${ROUTES.length} מסכים × דסקטופ+מובייל בלי גלילה רוחבית · 0 בקשות חיצוניות · 0 שגיאות`);
} finally { await b.close(); srv.kill(); }
