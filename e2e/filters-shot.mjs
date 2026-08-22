/**
 * צילום עיצוב-הסינון-האחיד במסך התורמים (בקשת-בעלים "תעצב את כל המסננים טוב יותר").
 * מדליק את דגלי-הסינון, זורע דמו, נכנס לתורמים, פותח סינון-מתקדם, בוחר תקופה
 * (חושף את בורר-המצב + רצועת-הסינון-הפעיל), ומצלם באור + בכהה.
 *   npm run build && node e2e/filters-shot.mjs   → e2e/shots-filters/
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-filters');
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO = readFileSync(join(DIST, 'demo.json'), 'utf8');

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4199, r));
const BASE = 'http://localhost:4199/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

async function run(theme) {
  const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const wait = (ms) => page.waitForTimeout(ms);
  const shot = async (name) => { await page.screenshot({ path: join(SHOTS, `${theme}-${name}.png`) }); console.log('📸', theme, name); };

  const CFG = JSON.stringify({
    slug: 'default', orgName: 'עמותת מאור החסד', theme,
    modules: {},
    features: {
      'supporters.rfm': true, 'supporters.hok': true, 'supporters.ayin': true,
      'supporters.nextdate': true, 'supporters.advfilter': true, 'supporters.colfilter': true,
      'supporters.purpose': true, 'supporters.sort': true,
    },
  });
  await ctx.addInitScript(
    ([cfg, demo]) => {
      try {
        localStorage.setItem('maor_org_config', cfg);
        if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', demo);
      } catch { /* חסום */ }
    },
    [CFG, DEMO],
  );
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await wait(1400);

  const closeModals = async () => {
    for (let i = 0; i < 8; i++) {
      if (!(await page.locator('.modal-back').count())) return;
      await page.keyboard.press('Escape').catch(() => {});
      await wait(200);
    }
  };
  const clickText = async (txt, sel = 'button') => {
    const l = page.locator(sel, { hasText: txt });
    if (await l.count()) { await l.first().click().catch(() => {}); await wait(500); return true; }
    return false;
  };
  await clickText('פתיחת יום');
  await closeModals();

  // ניווט לתורמים
  await page.locator('nav >> text=תורמים').first().click().catch(async () => {
    await page.locator('nav >> text=תומכות').first().click().catch(() => {});
  });
  await wait(800);
  await closeModals();
  await shot('01-default');

  // פתיחת סינון-מתקדם
  await clickText('סינון מתקדם');
  await wait(400);
  await shot('02-advanced-open');

  // בחירת שנה (חושף בורר-מצב-התקופה + רצועת-הסינון-הפעיל)
  const selects = page.locator('.filterbar select');
  const n = await selects.count();
  for (let i = 0; i < n; i++) {
    const opts = await selects.nth(i).locator('option').allTextContents();
    if (opts.some((o) => o.includes('נתנו ב-'))) {
      const yearOpt = opts.find((o) => /נתנו ב-\d{4}/.test(o));
      if (yearOpt) { await selects.nth(i).selectOption({ label: yearOpt }).catch(() => {}); break; }
    }
  }
  await wait(500);
  await shot('03-period-active');

  console.log(theme, errors.length ? '❌ ' + errors.slice(0, 2).join(' | ') : '✅ אפס שגיאות JS');
  await ctx.close();
}

await run('or-rishon');
await run('heichal'); // כהה
await browser.close();
server.close();
