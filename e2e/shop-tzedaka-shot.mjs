/** צילום לוחות חנות + צדקה בתצוגת יומי/שבועי/חודשי (בקשת-בעלים 30.8). */
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

const TODAY = '2026-08-30';
const shopEvents = [
  { id: 's1', date: '2026-08-27', kind: 'meeting', title: 'פגישת ייעוץ', time: '10:00', done: false },
  { id: 's2', date: '2026-08-28', kind: 'delivery', title: 'מסירת חבילה', time: '', done: false },
  { id: 's3', date: '2026-08-31', kind: 'custom', title: 'מעקב', time: '', done: false },
];
const tzEvents = [
  { id: 't1', date: '2026-08-27', kind: 'round', title: 'סבב איסוף', time: '18:00', done: false },
  { id: 't2', date: '2026-08-30', kind: 'campaign', title: 'מבצע חלוקה', time: '', done: false },
  { id: 't3', date: '2026-08-29', kind: 'reminder', title: 'תזכורת ריקון', time: '', done: false },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([se, te, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, shopEvents: se, tzEvents: te }));
  }
}, [shopEvents, tzEvents, TODAY]);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clickBtn = async (label) => { await page.locator('button', { hasText: label }).first().click().catch(() => {}); await wait(600); };
const shot = async (n) => { await page.screenshot({ path: join(OUT, n + '.png'), fullPage: true }); console.log('📸', n); };

const navTo = async (label) => {
  const l = page.locator('.side-link', { hasText: label });
  if (await l.count()) await l.first().click().catch(() => {});
  else await page.getByText(label, { exact: true }).first().click().catch(() => {});
  await wait(900);
};

// חנות → 📅 לוח → שבועי
await navTo('חנות');
await page.getByText('📅 לוח', { exact: false }).first().click().catch(() => {});
await wait(600);
await page.locator('button[role=tab]', { hasText: 'שבועי' }).first().click().catch(() => {});
await wait(600);
await shot('09-shop-week');

// קופות צדקה → 📅 לוח → שבועי
await navTo('קופות צדקה');
await page.getByText('📅 לוח', { exact: false }).first().click().catch(() => {});
await wait(600);
await page.locator('button[role=tab]', { hasText: 'שבועי' }).first().click().catch(() => {});
await wait(600);
await shot('10-tzedaka-week');
await b.close(); server.close();
console.log('done');
