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
    if (!existsSync(f)) f = join(DIST, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }).end(await readFile(f));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

// org מדומה בשם "אורביט" + אימוג'י 🪐 + firebase (ענן דלוק ⇒ מסך ההרשמה)
const CFG = {
  slug: 'orbit-demo', orgName: 'אורביט', emoji: '🪐', theme: 'or-rishon', modules: {}, terms: {},
  firebase: { apiKey: 'demo-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: '1:1:web:1' },
};

const browser = await chromium.launch({ executablePath: CHROME });
const errs = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), CFG);
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await page.screenshot({ path: '/tmp/signup-orbit.png' });
console.log('desktop shot');

const m = await browser.newPage({ viewport: { width: 402, height: 860 }, deviceScaleFactor: 2 });
await m.addInitScript((c) => localStorage.setItem('maor_org_config', JSON.stringify(c)), CFG);
await m.goto(base, { waitUntil: 'networkidle' });
await m.waitForTimeout(2600);
await m.screenshot({ path: '/tmp/signup-orbit-mobile.png' });
console.log('mobile shot · console errors:', errs.length ? errs.slice(0, 3) : 'none');
await browser.close();
server.close();
