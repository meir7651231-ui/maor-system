/** צילום מעקב-טיפול (ayin) — כרטיס עם שלבים/שמות/עיניים/שער-תשלום. */
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
const supporters = [{
  id: 'a', name: 'משפחת רוזנברג', phone: '050-1111111', email: '', address: '', idNum: '', cat: 'פרטי',
  forWho: 'סיוע רפואי', notes: '', count: 1, ils: 1800, usd: 0, first: '2026-08-06', last: '2026-08-06', nextDate: '', nextNote: '',
  donations: [{ rid: 'D-a0', date: '2026-08-06', amount: 1800, cur: '₪', cat: '' }],
  ayin: {
    stage: 'answer', answerPushed: true, paid: false, answeredNote: 'לתאם מסירה מול המשפחה',
    names: [
      { id: 'n1', name: 'יוסף בן שרה', eyes: 3, done: false, note: 'דחוף' },
      { id: 'n2', name: 'רבקה בת לאה', eyes: 5, done: true, note: 'נמסר בהצלחה' },
    ],
    log: [{ date: '2026-08-30', eyes: 3, name: 'יוסף בן שרה' }],
    answers: [{ date: '2026-08-28', note: 'לתאם מסירה מול המשפחה' }],
    lastTouch: '2026-08-30', nextTalk: '2026-09-02',
  },
}];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1100 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({
      slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {},
      features: { 'supporters.ayin.paygate': true, 'supporters.ayin.unassignondone': true },
    }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, TODAY]);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await page.locator('nav >> text=תורמים').first().click().catch(() => {});
await wait(800);
await page.locator('text=משפחת רוזנברג').first().click().catch(() => {});
await wait(900);
// לגלול לכרטיס מעקב-הטיפול
await page.locator('text=מעקב').first().scrollIntoViewIfNeeded().catch(() => {});
await wait(400);
await page.screenshot({ path: join(OUT, 'ayin-card-full.png'), fullPage: true });
console.log('📸 ayin-card-full');
// גזירת כרטיס-הטיפול עצמו אם נמצא
const card = page.locator('.card', { hasText: 'מעקב' }).first();
if (await card.count()) { await card.screenshot({ path: join(OUT, 'ayin-card.png') }).catch(() => {}); console.log('📸 ayin-card'); }
await b.close(); server.close();
console.log('done');
