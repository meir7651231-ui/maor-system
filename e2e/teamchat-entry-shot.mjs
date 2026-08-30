/** צילום כניסת צ׳אט-הצוות מההגדרות + המודאל (בקשת-בעלים 30.8). */
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

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript((today) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', today);
  }
}, '2026-08-30');
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// הגדרות
await page.locator('.side-link', { hasText: 'הגדרות' }).first().click().catch(() => page.getByText('הגדרות', { exact: true }).first().click().catch(() => {}));
await wait(900);
await page.locator('text=💬 צ׳אט הצוות').first().scrollIntoViewIfNeeded().catch(() => {});
await wait(300);
await page.screenshot({ path: join(OUT, '11-settings-teamchat-chip.png'), fullPage: true });
console.log('📸 11-settings-teamchat-chip');
// לחיצה ⇒ המודאל
await page.locator('text=💬 צ׳אט הצוות').first().click().catch(() => {});
await wait(700);
await page.screenshot({ path: join(OUT, '12-teamchat-modal.png') });
console.log('📸 12-teamchat-modal');
await b.close(); server.close();
console.log('done');
