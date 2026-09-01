/** צילום סעיף סנכרון אנשי-קשר ל-Google (הרחבת gcontacts דלוקה, בקשת-בעלים 1.9). */
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

const db = {
  v: 6,
  orgName: 'עמותת מאור החסד',
  families: [
    { id: 'f1', name: 'משפחת כהן', father: '', fatherId: '', mother: '', motherId: '', phone: '050-1111111', phone2: '', email: 'k@x.com', city: 'ירושלים', address: 'הרצל 3', community: '', maritalStatus: '', language: '', tzedaka: '', fullSefach: false, discount: '', status: 'active', notes: '', members: [], docs: [], cred: { score: 0, log: [] }, createdAt: '2026-01-01' },
    { id: 'f2', name: 'משפחת לוי', father: '', fatherId: '', mother: '', motherId: '', phone: '052-2222222', phone2: '', email: '', city: 'בני ברק', address: 'רבי עקיבא 10', community: '', maritalStatus: '', language: '', tzedaka: '', fullSefach: false, discount: '', status: 'active', notes: '', members: [], docs: [], cred: { score: 0, log: [] }, createdAt: '2026-01-01' },
  ],
  supporters: [{ id: 's1', name: 'ראובן גולד', phone: '053-3333333', email: 'r@x.com', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [] }],
  volunteers: [{ id: 'v1', name: 'שמעון מתנדב', phone: '054-4444444', active: true, note: '', createdAt: '2026-01-01', area: 'צפון' }],
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 950 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([database, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({
      slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {},
      integrations: { gcontacts: { enabled: true, groupName: 'מאור — אנשי קשר' } },
    }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify(database));
  }
}, [db, '2026-09-01']);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
page.on('pageerror', (e) => console.log('PAGEERR:', e.message));
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.locator('.side-link', { hasText: 'הגדרות' }).first().click().catch(() => page.getByText('הגדרות', { exact: true }).first().click().catch(() => {}));
await wait(700);
await page.getByText('📚 נתונים', { exact: true }).first().click().catch(() => {});
await wait(600);
await page.getByText('📇 סנכרון אנשי-קשר ל-Google', { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
await wait(400);
await page.screenshot({ path: join(OUT, 'gcontacts-section.png'), fullPage: true });
const found = await page.getByText('📇 סנכרון אנשי-קשר ל-Google').first().count();
console.log('📸 gcontacts-section · section found:', found);
await b.close(); server.close();
console.log('done');
