/** צילום באנר "יש גרסה חדשה" — השרת מגיש version.json עם id שונה מה-build (בקשת-בעלים 31.8). */
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
  try {
    let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/maor-system\/?/, '/'); if (p === '/' || p === '') p = '/index.html';
    // 🔄 מזייף גרסה חדשה: version.json מחזיר id שונה מזה שהוטבע ב-build
    if (p === '/version.json') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id: 'NEWER-BUILD-9999' })); return; }
    const data = await readFile(normalize(join(ROOT, p))); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/maor-system/`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 });
await ctx.addInitScript((today) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', today);
  }
}, '2026-08-31');
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);
await page.screenshot({ path: join(OUT, 'update-banner.png') });
console.log('📸 update-banner');
const banner = page.locator('.update-banner');
console.log('banner visible:', await banner.count());
await b.close(); server.close();
console.log('done');
