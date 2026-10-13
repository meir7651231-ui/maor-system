/**
 * 🧩 ארגז המנועים — smoke בדפדפן (13.10.2026).
 *  · דגל כבוי (חסר) ⇒ אין צ׳יפ בהגדרות, ‎#enginebox‎ לא פותח כלום.
 *  · דגל דלוק (`shell.enginebox: true`) ⇒ צ׳יפ "🧩 ארגז המנועים" בהגדרות ⇒ המסך העצל נפתח
 *    במצב-ריק כן ("הארגז בהרכבה — עוד מעט"; source=null עד סשן-החיבור) · אפס שגיאות JS.
 *  · צילום 390px (מובייל) ל-e2e/proof-shots.
 *
 *   npm run build && node e2e/enginebox-smoke.mjs
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'proof-shots');
await mkdir(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/maor-system\/?/, '/'); if (p === '/' || p === '') p = '/index.html';
    const data = await readFile(normalize(join(ROOT, p))); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/maor-system/`;
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium';
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

let failures = 0;
const T = (name, cond) => { console.log(`  ${cond ? '✅' : '❌'} ${name}`); if (!cond) failures++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(features, viewport) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript((f) => {
    if (!localStorage.getItem('maor_org_config')) {
      localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: f }));
      localStorage.setItem('maor_day', '2026-10-13');
    }
  }, features);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  return { ctx, page, errors };
}
async function gotoSettings(page) {
  await page.evaluate(() => { location.hash = ''; });
  const side = page.locator('.side-link', { hasText: 'הגדרות' }).first();
  if (await side.isVisible().catch(() => false)) await side.click();
  else {
    // מובייל: ניווט-תחתון ⇒ "עוד" ⇒ הגדרות
    await page.locator('.bottom-nav button', { hasText: 'עוד' }).first().click().catch(() => {});
    await wait(300);
    await page.locator('[role=dialog] button', { hasText: 'הגדרות' }).first().click().catch(() => {});
  }
  await wait(900);
  return ((await page.locator('body').textContent()) ?? '').includes('ניהול המערכת');
}

console.log('🧩 ארגז המנועים — smoke');

// 1 · דגל חסר ⇒ אפס שינוי
{
  const { ctx, page, errors } = await open({}, { width: 1180, height: 900 });
  T('דגל חסר: מסך ההגדרות נפתח', await gotoSettings(page));
  T('דגל חסר: אין צ׳יפ בהגדרות', (await page.locator('text=🧩 ארגז המנועים').count()) === 0);
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await wait(700);
  T('דגל חסר: ‎#enginebox‎ לא פותח מסך', (await page.locator('[role=dialog][aria-label="🧩 ארגז המנועים"]').count()) === 0);
  T('דגל חסר: אפס שגיאות JS', errors.length === 0);
  await ctx.close();
}

// 2 · דגל דלוק, מובייל 390px
{
  const { ctx, page, errors } = await open({ 'shell.enginebox': true }, { width: 390, height: 844 });
  T('דגל דלוק: מסך ההגדרות נפתח (מובייל)', await gotoSettings(page));
  const chip = page.locator('text=🧩 ארגז המנועים').first();
  T('דגל דלוק: הצ׳יפ בהגדרות', (await chip.count()) > 0);
  await chip.click().catch(() => {});
  await wait(900);
  const dlg = page.locator('[role=dialog][aria-label="🧩 ארגז המנועים"]');
  T('הצ׳יפ פותח את המסך', (await dlg.count()) === 1);
  const txt = (await dlg.textContent().catch(() => '')) ?? '';
  T('source=null ⇒ "הארגז בהרכבה — עוד מעט"', txt.includes('הארגז בהרכבה — עוד מעט'));
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  T('אין גלילה אופקית ב-390px', !hscroll);
  await page.screenshot({ path: join(OUT, 'enginebox-empty-390.png') });
  console.log('  📸 enginebox-empty-390.png');
  await page.keyboard.press('Escape');
  await wait(400);
  T('Escape סוגר', (await dlg.count()) === 0);
  T('דגל דלוק: אפס שגיאות JS', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));
  await ctx.close();
}

await b.close();
server.close();
if (failures) { console.log(`\n💥 ${failures} כשלים`); process.exit(1); }
console.log('\n🏆 ארגז המנועים: כבוי=בלתי-נראה, דלוק=נפתח במצב-ריק כן');
