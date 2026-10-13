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
function donor(id, name, phone, gifts, opts = {}) {
  const dons = gifts.map(([date, amount], i) => ({ rid: 'D-' + id + i, date, amount, cur: '₪', cat: '' }));
  const dates = gifts.map((g) => g[0]).sort();
  return { id, name, phone, email: '', address: '', idNum: '', cat: 'פרטי', forWho: '', notes: '',
    count: dons.length, ils: gifts.reduce((a, g) => a + g[1], 0), usd: 0, first: dates[0] || '', last: dates.at(-1) || '',
    nextDate: opts.nextDate ?? '', nextNote: opts.nextNote ?? '', donations: dons };
}
const supporters = [
  donor('a', 'משפחת רוזנברג', '050-1', [['2026-08-06', 1800], ['2026-08-20', 2000]], { nextDate: '2026-08-27', nextNote: 'חידוש הו״ק' }),
  donor('b', 'קרן ידידות', '053-3', [['2026-08-10', 6000]], { nextDate: '2026-08-24', nextNote: 'כתובת' }),
  donor('c', 'דוד אוחנה', '054-4', [['2026-08-12', 500]], { nextDate: '2026-08-31' }),
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, TODAY]);
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.locator('nav >> text=תורמים').first().click().catch(() => {});
await wait(900);
const card = page.locator('.card', { hasText: 'התרומות הכללי' }).first();
await card.scrollIntoViewIfNeeded().catch(() => {});
await card.locator('button', { hasText: 'הצגה' }).first().click().catch(() => {});
await wait(1200);
await card.scrollIntoViewIfNeeded().catch(() => {});
await wait(400);
const shotCard = async (n) => { await card.screenshot({ path: join(OUT, n + '.png') }).catch(async () => { await page.screenshot({ path: join(OUT, n + '.png'), fullPage: true }); }); console.log('📸', n); };
await shotCard('06-donor-board-month');
// למצב שבועי — בורר בתוך הכרטיס
await card.locator('button[role=tab]', { hasText: 'שבועי' }).first().click().catch(() => {});
await wait(800);
await card.scrollIntoViewIfNeeded().catch(() => {});
await shotCard('07-donor-board-week');
// למצב יומי
await card.locator('button[role=tab]', { hasText: 'יומי' }).first().click().catch(() => {});
await wait(800);
await card.scrollIntoViewIfNeeded().catch(() => {});
await shotCard('08-donor-board-day');
await b.close(); server.close();
console.log('done');
