#!/usr/bin/env node
/**
 * 📸 צילומי המוצר (PRODUCT-V2, 14.10.2026) — «מוקד-חלוקה» בדף שעובד, ב-390×844 וב-1280×800:
 *   1 בהתחלה · 2 שיבוץ עם קיבולת · 3 מסלולים ממוטבים (+ סדר הרשימה מקווקו) · 4 באמצע החלוקה · 5 מה-אם (רכב קטן ⇒ המתנה)
 *   · 6 עיר: 400 משפחות ו-30 מתנדבים · 7 דף-מסלול להדפסה (תצוגת-הדפסה) · 8 דוח סוף היום.
 * וגם lab.html על המילה (כל הצרכים ✅, בלי "חסר"). אפס שגיאות קונסולה — אחרת יציאה 1.
 *   node catalog/products/shots.mjs [--out <תיקייה>]   ⇒ knowledge/shots/product-v2-2026-10-14/ (ברירת-מחדל)
 * מרים שרת סטטי קטן על שורש-הריפו (בלי תלויות). ההדמיה מקודמת דרך window.__dispatch.advance — אותו tick, אותם חלקים.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outArg = process.argv.indexOf('--out');
const OUT = resolve(ROOT, outArg > 0 ? process.argv[outArg + 1] : 'knowledge/shots/product-v2-2026-10-14');
const TYPES = { '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json' };
const WORD = 'מוקד-חלוקה';

const server = createServer(async (req, res) => {
  const p = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const host = 'http://127.0.0.1:' + server.address().port;

await mkdir(OUT, { recursive: true });
const CHROME = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const errors = [];
const bad = [];
const facts = {};
for (const [w, h, tag] of [[390, 844, 'mobile'], [1280, 800, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
  page.on('console', (m) => m.type() === 'error' && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + String(e)));
  await page.goto(host + '/catalog/products/distribution/index.html');
  await page.waitForFunction(() => !!window.__dispatch);
  await page.evaluate(() => { window.__dispatch.noPrint = true; });
  const shot = async (name, sel) => {
    if (sel) await page.evaluate((s) => document.querySelector(s).scrollIntoView(), sel);
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT, name + '-' + tag + '.png') });
    console.log('📸 ' + name + ' ' + tag);
  };
  const num = (id) => page.$eval('#' + id, (el) => Number(el.textContent.replace(/[^\d.-]/g, '')));
  await shot('1-start');
  await page.click('#b-assign');
  await shot('2-assigned', '#h-map');
  await page.click('#b-routes');
  await page.click('#b-board');
  const plan = await page.evaluate(() => window.__dispatch.plan());
  facts[tag] = { plan };
  if (!(plan.pct > 0 && plan.saved > 0)) bad.push(tag + ': אין חיסכון במסלולים');
  if (!/המסלולים קצרים ב-\d+% \([\d.]+ ק״מ\) לעומת סדר הרשימה/.test(await page.innerText('#save'))) bad.push(tag + ': שורת-החיסכון חסרה');
  await shot('3-routes', '#h-map');
  await page.evaluate(() => document.getElementById('h-kpi').scrollIntoView());
  await shot('3b-numbers');
  await page.click('#b-board');
  await page.click('#b-start');
  await page.click('#b-addwait');
  await page.evaluate(() => window.__dispatch.advance(18));
  await page.click('#waitlist button');
  await page.evaluate(() => window.__dispatch.advance(10));
  if ((await num('k-done')) <= 0 || (await num('k-left')) <= 0) bad.push(tag + ': באמצע החלוקה — אין התקדמות');
  if ((await num('k-late')) <= 0) bad.push(tag + ': באמצע החלוקה — אין משלוח שמאחר מהתכנית');
  if (!/לא ענה — המסלול שלו עבר/.test(await page.innerText('#alerts'))) bad.push(tag + ': המתנדב שלא ענה לא הועבר');
  await shot('4-mid', '#h-map');
  await page.evaluate(() => window.__dispatch.advance(400));
  for (let k = 0; k < 20 && (await page.$('#alerts button')); k++) await page.click('#alerts button');
  if ((await num('k-left')) !== 0) bad.push(tag + ': בסוף — נותרו סלים');
  await shot('8-report', '#h-report');
  // מה-אם: רכב קטן ⇒ רשימת המתנה; עוד מתנדב ⇒ מתפנה
  await page.click('#b-reset');
  await page.click('#b-assign'); await page.click('#b-routes');
  await page.$eval('#cap', (el) => { el.value = '5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(120);
  const over = await page.$$eval('#waitlist li', (x) => x.length);
  if (over !== 10) bad.push(tag + ': מה-אם — 6 רכבים × 5 = 30 מקומות ל-40 משפחות ⇒ 10 בהמתנה, ולא ' + over);
  await shot('5-whatif', '#h-plan');
  await page.click('#v-plus'); await page.click('#v-plus');
  const over2 = await page.$$eval('#waitlist li', (x) => x.length);
  if (over2 !== 0) bad.push(tag + ': אחרי 2 מתנדבים נוספים — עדיין בהמתנה ' + over2);
  // עיר
  await page.click('#b-scale');
  await page.waitForTimeout(150);
  const S = await page.evaluate(() => { const s = window.__dispatch.state(); return { fams: s.fams.length, vols: s.vols.length, ms: s.ms, routed: s.plan ? s.plan.size : 0 }; });
  facts[tag].city = { ...S, plan: await page.evaluate(() => window.__dispatch.plan()) };
  if (S.fams !== 400 || S.vols !== 30 || S.routed !== 30) bad.push(tag + ': מצב העיר לא 400/30 ממוטב');
  await shot('6-city', '#h-map');
  await page.evaluate(() => document.getElementById('h-kpi').scrollIntoView());
  await shot('6b-city-numbers');
  // דף מסלול להדפסה
  await page.click('#b-scale');
  await page.evaluate(() => window.__dispatch.printSheet('v1'));
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('7-print');
  if (!/דף מסלול — מתנדב 1/.test(await page.innerText('#print'))) bad.push(tag + ': אין דף מסלול');
  await page.emulateMedia({ media: 'screen' });
  const html = await page.content();
  if (/wa\.me\/\d|phone=/.test(html)) bad.push(tag + ': קישור וואטסאפ עם מספר');
  for (const n of ['n1', 'n17', 'n18', 'n19']) if (!(await page.$('[data-chip="' + n + '"]'))) bad.push(tag + ': אין שבב ' + n);
  for (const x of ['sum', 'gap', 'pct', 'max']) if (!(await page.$('[data-x="' + x + '"]'))) bad.push(tag + ': אין שבב-מדידה ' + x);
  await page.close();
  // lab.html על המילה — כל הצרכים ✅
  const lab = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
  lab.on('console', (m) => m.type() === 'error' && errors.push('lab ' + tag + ': ' + m.text()));
  lab.on('pageerror', (e) => errors.push('lab ' + tag + ': ' + String(e)));
  await lab.goto(host + '/catalog/lab.html#w=' + encodeURIComponent(WORD));
  await lab.waitForSelector('.out .title');
  const lb = await lab.innerText('body');
  if (/חסר|🔎 עוד לא נחפר\s*│|⛏️ נמצא בקוד — בכרייה\s*│/.test(lb)) bad.push('lab ' + tag + ': "חסר"/🔎 בדף');
  await lab.screenshot({ path: join(OUT, 'lab-' + tag + '.png') });
  console.log('📸 lab ' + tag);
  await lab.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(facts));
if (bad.length) { console.error('✗ ' + bad.join('\n✗ ')); process.exit(1); }
if (errors.length) { console.error('שגיאות קונסולה:\n' + errors.join('\n')); process.exit(1); }
console.log('✓ אפס שגיאות קונסולה · ' + OUT);
