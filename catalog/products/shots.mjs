#!/usr/bin/env node
/**
 * 📸 צילומי המוצר (PRODUCT, 14.10.2026) — «מוקד-חלוקה» בדף שעובד, ב-390×844 וב-1280×800:
 *   1 בהתחלה · 2 אחרי חלוקה למתנדבים · 3 אחרי חישוב מסלולים · 4 באמצע החלוקה · 5 דוח סוף היום.
 * וגם lab.html על המילה (כל הצרכים ✅, בלי "חסר"). אפס שגיאות קונסולה — אחרת יציאה 1.
 *   node catalog/products/shots.mjs [--out <תיקייה>]   ⇒ knowledge/shots/product-distribution-2026-10-14/ (ברירת-מחדל)
 * מרים שרת סטטי קטן על שורש-הריפו (בלי תלויות). ההדמיה מקודמת דרך window.__dispatch.advance — אותו tick, אותם חלקים.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outArg = process.argv.indexOf('--out');
const OUT = resolve(ROOT, outArg > 0 ? process.argv[outArg + 1] : 'knowledge/shots/product-distribution-2026-10-14');
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
for (const [w, h, tag] of [[390, 844, 'mobile'], [1280, 800, 'desktop']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
  page.on('console', (m) => m.type() === 'error' && errors.push(tag + ': ' + m.text()));
  page.on('pageerror', (e) => errors.push(tag + ': ' + String(e)));
  await page.goto(host + '/catalog/products/distribution/index.html');
  await page.waitForFunction(() => !!window.__dispatch);
  const shot = async (name) => {
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT, name + '-' + tag + '.png') });
    await page.screenshot({ path: join(OUT, name + '-' + tag + '-full.png'), fullPage: true });
    console.log('📸 ' + name + ' ' + tag);
  };
  const num = (id) => page.$eval('#' + id, (el) => Number(el.textContent));
  await shot('1-start');
  await page.click('#b-assign');
  await shot('2-assigned');
  await page.click('#b-routes');
  await shot('3-routes');
  await page.click('#b-start');
  await page.click('#b-addwait');
  await page.evaluate(() => window.__dispatch.advance(30));
  await page.click('#waitlist button');
  await page.evaluate(() => window.__dispatch.advance(22));
  if ((await num('k-done')) <= 0 || (await num('k-left')) <= 0) bad.push(tag + ': באמצע החלוקה — אין התקדמות');
  if ((await num('k-late')) <= 0) bad.push(tag + ': באמצע החלוקה — אין משלוח שמאחר');
  if (!/לא ענה — המסלול שלו עבר/.test(await page.innerText('#alerts'))) bad.push(tag + ': המתנדב שלא ענה לא הועבר');
  await page.evaluate(() => document.getElementById('h-map').scrollIntoView());
  await shot('4-mid');
  await page.evaluate(() => window.__dispatch.advance(200));
  for (let k = 0; k < 20 && (await page.$('#alerts button')); k++) await page.click('#alerts button');
  if ((await num('k-left')) !== 0) bad.push(tag + ': בסוף — נותרו סלים');
  await page.evaluate(() => document.getElementById('h-report').scrollIntoView());
  await shot('5-report');
  const body = await page.innerText('body');
  for (const n of ['n1', 'n16']) if (!(await page.$('[data-chip="' + n + '"]'))) bad.push(tag + ': אין שבב ' + n);
  if (!/🧩 נמצא ב: אורביט · קובע את הסטטוס הבא/.test(body)) bad.push(tag + ': שבב הסטטוס לא מההרכבה');
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
  await lab.screenshot({ path: join(OUT, 'lab-' + tag + '-full.png'), fullPage: true });
  console.log('📸 lab ' + tag);
  await lab.close();
}
await browser.close();
server.close();
if (bad.length) { console.error('✗ ' + bad.join('\n✗ ')); process.exit(1); }
if (errors.length) { console.error('שגיאות קונסולה:\n' + errors.join('\n')); process.exit(1); }
console.log('✓ אפס שגיאות קונסולה · ' + OUT);
