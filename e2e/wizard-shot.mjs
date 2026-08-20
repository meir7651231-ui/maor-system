/** צילום אשף-ההרכבה (#builder) — לאמת שהמתגים החדשים של התורמים מופיעים בו. */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'nextgen-shots');
await mkdir(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/maor-system\/?/, '/');
    if (p === '/' || p === '') p = '/index.html';
    const data = await readFile(normalize(join(ROOT, p)));
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/maor-system/`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', '2026-08-20');
  }
});
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
await page.goto(base + '#builder', { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(1200);

// שימוש בתיבת-החיפוש של האשף — חיפוש פותח את כל הסקשנים הרלוונטיים
await page.getByPlaceholder(/חיפוש יכולת/).fill('מודיעין').catch(() => {});
await wait(800);

// חיפוש "מודיעין" באשף — לוודא שהמתג קיים
const found = await page.getByText('מרכז-המודיעין', { exact: false }).count();
console.log('מתג "מרכז-המודיעין" באשף:', found > 0 ? '✅ מופיע' : '❌ לא נמצא');
const cardFound = await page.getByText('כרטיס-תורם מאוחד', { exact: false }).count();
console.log('מתג "כרטיס-תורם מאוחד" באשף:', cardFound > 0 ? '✅ מופיע' : '❌ לא נמצא');

// גלילה לסקשן התורמים אם קיים
await page.locator('text=מרכז-המודיעין').first().scrollIntoViewIfNeeded().catch(() => {});
await wait(400);
await page.screenshot({ path: join(OUT, 'wizard-supporters.png'), fullPage: true });
console.log('📸 wizard-supporters');
await b.close();
server.close();
