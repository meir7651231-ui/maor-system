/** צילום הורדה-מסוננת + ייבוא במסך-השמות המלא של מעקב-הטיפול (בקשת-בעלים 31.8). */
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

const supporters = [
  { id: 's1', name: 'משפחת כהן', phone: '050-1111111', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [],
    ayin: { stage: 'eyes', answerPushed: false, paid: false, names: [ { id: 'n1', name: 'יעקב בן רחל', eyes: 2, done: false, note: '' }, { id: 'n2', name: 'שרה בת מרים', eyes: 4, done: true, note: 'נמסר' } ], log: [], answers: [], lastTouch: '2026-08-31' } },
  { id: 's2', name: 'משפחת לוי', phone: '050-2222222', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '', donations: [],
    ayin: { stage: 'answer', answerPushed: true, paid: false, names: [ { id: 'n3', name: 'משה בן דבורה', eyes: 1, done: false, note: '' } ], log: [], answers: [], lastTouch: '2026-08-31' } },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 950 }, deviceScaleFactor: 2, acceptDownloads: true });
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {} }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, '2026-08-31']);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.locator('.side-link', { hasText: 'תורמים' }).first().click().catch(() => page.getByText('תורמים', { exact: true }).first().click().catch(() => {}));
await wait(800);
await page.getByText('⋯ עוד', { exact: false }).first().click().catch(() => {});
await wait(400);
await page.getByText(/מעקב טיפול — כל השמות/).first().click().catch(() => {});
await wait(700);
await page.screenshot({ path: join(OUT, 'ayin-board-sheet.png'), fullPage: true });
console.log('📸 ayin-board-sheet (הכל)');

// סינון: "ממתין" — ואז הכפתור אמור להראות "(מסונן · N)"
await page.getByText(/^ממתין ·/).first().click().catch(() => {});
await wait(500);
await page.screenshot({ path: join(OUT, 'ayin-board-sheet-filtered.png'), fullPage: true });
const dlLabel = await page.getByText(/⬇ הורדת גיליון/).first().innerText().catch(() => '?');
console.log('📸 ayin-board-sheet-filtered · כפתור:', dlLabel);

// אימות הורדה חיה של המסונן
try {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByText(/⬇ הורדת גיליון/).first().click(),
  ]);
  await dl.saveAs(join(OUT, 'ayin-board-filtered.csv'));
  const txt = await readFile(join(OUT, 'ayin-board-filtered.csv'), 'utf8');
  const rows = txt.trim().split('\n');
  console.log('⬇ הורד מסונן — שורות:', rows.length, '(כותרת+נתונים)');
  console.log(rows.slice(0, 4).join('\n'));
} catch (e) { console.log('⚠ הורדה:', e.message); }

await b.close(); server.close();
console.log('done');
