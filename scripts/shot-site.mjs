import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const DIST = new URL('../dist/', import.meta.url).pathname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    let f = normalize(join(DIST, p));
    if (!f.startsWith(DIST)) { res.writeHead(403).end(); return; }
    if (!existsSync(f)) f = join(DIST, 'index.html'); // SPA fallback
    const body = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(500).end(); }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 2 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));

const ORG = process.env.ORG || 'maor-hachesed';
await page.goto(`${base}/?org=${ORG}&site`, { waitUntil: 'networkidle' });
await page.waitForSelector('nav', { timeout: 15000 });
await page.waitForTimeout(1400); // fonts + first paint

const scroller = await page.$('div[dir]'); // outer .ps container (fixed, overflowY:auto)
async function shot(name, y) {
  await page.evaluate((yy) => { const el = document.querySelector('div[style*="position: fixed"]') || document.scrollingElement; }, y);
  await page.evaluate((yy) => {
    // scroll the outer fixed container
    const outer = [...document.querySelectorAll('div')].find((d) => d.style && d.style.position === 'fixed' && d.style.overflowY === 'auto');
    if (outer) outer.scrollTo({ top: yy, behavior: 'instant' });
    else window.scrollTo(0, yy);
  }, y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/site-${name}.png` });
  console.log(`shot /tmp/site-${name}.png @${y}`);
}

const depths = (process.env.DEPTHS || '0,900,1800,2700,3600,4500').split(',').map(Number);
for (let i = 0; i < depths.length; i++) await shot(String(i).padStart(2, '0'), depths[i]);

console.log('console errors:', errs.length ? errs : 'none');
await browser.close();
server.close();
