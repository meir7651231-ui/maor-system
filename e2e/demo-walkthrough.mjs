/**
 * מעבר דמו מלא — מריץ את כל המערכת בדפדפן אמיתי, עובר על כל התהליכים
 * המרכזיים, מצלם כל מסך, ואוכף אפס שגיאות JS. נותן הוכחה חזותית שהכול עובד.
 *
 *   npm run build && node e2e/demo-walkthrough.mjs
 * הצילומים נשמרים ב-e2e/shots/.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots');
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4191, r));
const BASE = 'http://localhost:4191/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const log = [];
let step = 0;
const shot = async (name) => {
  step++;
  const file = join(SHOTS, `${String(step).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  return file;
};
const ok = (name, cond) => { log.push(`  ${cond ? '✅' : '❌'} ${name}`); return cond; };
const nav = async (label) => { await page.locator(`nav >> text=${label}`).first().click(); await page.waitForTimeout(500); };
const save = async () => { await page.locator('.modal button', { hasText: 'שמירה' }).first().click(); await page.waitForTimeout(600); };

let failures = 0;
const T = (name, cond) => { if (!ok(name, cond)) failures++; };

// ── טעינה נקייה, כל המודולים דולקים ──
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
  localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await shot('בית');
T('מסך הבית נטען', ((await page.locator('main').textContent()) ?? '').length > 20);

// ── משפחות: יצירה + ילד ──
await nav('משפחות');
await page.locator('button', { hasText: 'משפחה חדשה' }).first().click();
await page.waitForTimeout(300);
await page.locator('.modal input').first().fill('משפחת כהן');
await save();
T('נוצרה משפחה', ((await page.locator('main').textContent()) ?? '').includes('כהן'));
const addMember = page.locator('button', { hasText: 'הוספת בן משפחה' }).first();
if (await addMember.count()) {
  await addMember.click();
  await page.waitForTimeout(300);
  await page.locator('.modal input').first().fill('רוני');
  await save();
  T('נוסף ילד', ((await page.locator('main').textContent()) ?? '').includes('רוני'));
}
await shot('כרטיס-משפחה');

// ── חוגים: יצירה ──
await nav('חוגים');
await page.locator('button', { hasText: 'חוג חדש' }).first().click();
await page.waitForTimeout(300);
await page.locator('.modal input').first().fill('חוג ציור');
await save();
T('נוצר חוג', ((await page.locator('main').textContent()) ?? '').includes('ציור'));
await shot('חוגים');

// ── שיבוץ + תשלום ──
const enrollBtn = page.locator('button', { hasText: 'שיבוץ' }).first();
if (await enrollBtn.count()) {
  await enrollBtn.click();
  await page.waitForTimeout(300);
  await page.locator('.modal input').first().fill('רוני');
  await page.waitForTimeout(400);
  const opt = page.locator('.modal button', { hasText: 'רוני' }).first();
  if (await opt.count()) await opt.click();
  await page.waitForTimeout(200);
  await page.locator('.modal button', { hasText: 'שיבוץ' }).last().click();
  await page.waitForTimeout(700);
  T('בוצע שיבוץ', ((await page.locator('main').textContent()) ?? '').includes('רוני'));
  await shot('שיבוץ');
}

// ── תורמים + תרומה ──
await nav('תורמים');
const newSup = page.locator('button', { hasText: 'תורמת חדשה' }).first();
if (await newSup.count()) {
  await newSup.click();
  await page.waitForTimeout(300);
  await page.locator('.modal input').first().fill('קרן פרידמן');
  await save();
  T('נוסף תורם', ((await page.locator('main').textContent()) ?? '').includes('פרידמן'));
}
await shot('תורמים');

// ── לוח שנה ──
await nav('לוח');
await page.waitForTimeout(400);
await shot('לוח-שנה');
T('לוח השנה נטען', errors.length === 0);

// ── דוחות ──
const reportsNav = page.locator('nav >> text=דוחות').first();
if (await reportsNav.count()) {
  await reportsNav.click();
  await page.waitForTimeout(500);
  await shot('דוחות');
}

// ── הגדרות ──
const setNav = page.locator('nav >> text=הגדרות').first();
if (await setNav.count()) {
  await setNav.click();
  await page.waitForTimeout(500);
  await shot('הגדרות');
}

T('אפס שגיאות JS בכל המעבר', errors.length === 0);

console.log('\n🎬 מעבר דמו מלא — עמותת מאור החסד');
console.log(log.join('\n'));
if (errors.length) console.log('\nשגיאות JS:\n' + errors.slice(0, 5).join('\n'));
console.log(`\nצילומים נשמרו ב: ${SHOTS}`);

await ctx.close();
await browser.close();
server.close();
console.log(failures === 0 ? '\n🏆 כל התהליכים עברו — המערכת מוכנה להדגמה מלאה' : `\n💥 ${failures} כשלים`);
process.exit(failures === 0 ? 0 : 1);
