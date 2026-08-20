/**
 * אימות-חי + צילומים של מסכי-הדור-הבא לתורמים (cockpit/intel/galaxy/rebrand).
 * מזריק קונפיג עם הדגלים דלוקים + נתוני-דוגמה, ומצלם כל מבט. לא e2e-חוסם —
 * כלי-אימות ידני (node e2e/nextgen-shots.mjs).
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const OUT = process.env.SHOTS_OUT || join(dirname(fileURLToPath(import.meta.url)), 'nextgen-shots');
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

// ── נתוני-דוגמה: תורמים מגוונים (דרגות · בסיכון · הו״ק · תחזיות) ──
const TODAY = '2026-08-20';
function donor(id, name, cat, phone, gifts, opts = {}) {
  const dons = gifts.map(([date, amount], i) => ({ rid: 'D-' + id + i, date, amount, cur: '₪', cat: '' }));
  const dates = gifts.map((g) => g[0]).sort();
  const ils = gifts.reduce((a, g) => a + g[1], 0);
  return {
    id, name, phone, email: opts.email ?? '', address: '', idNum: '', cat, forWho: '', notes: '',
    count: dons.length, ils, usd: 0, first: dates[0] || '', last: dates[dates.length - 1] || '',
    nextDate: opts.nextDate ?? '', donations: dons, ...(opts.hok ? { hok: opts.hok } : {}),
  };
}
const G = (m) => gm(m); function gm(mon) { return '2026-' + String(mon).padStart(2, '0') + '-06'; }
const supporters = [
  donor('a', 'משפחת רוטשילד-אדלר', 'קרן', '050-1111111',
    [['2025-09-06', 20000], ['2025-11-06', 18000], ['2026-01-06', 22000], ['2026-03-06', 19000], ['2026-05-10', 21000]], { email: 'r@x.co' }),
  donor('b', 'מאפיית הזהב בע״מ', 'עסק', '052-2222222',
    [[G(3), 12000], [G(5), 14000], [G(7), 16000], ['2026-08-18', 18000]], { email: 'g@x.co' }),
  donor('c', 'קרן ידידות ירושלים', 'קרן', '053-3333333',
    [[G(2), 6000], [G(5), 7000], [G(7), 8000]], { nextDate: '2026-08-01', email: 'k@x.co' }),
  donor('d', 'דוד אוחנה', 'פרטי', '054-4444444',
    [[G(4), 500], [G(5), 500], [G(6), 500], [G(7), 500]], { hok: { amount: 500, cur: '₪', day: 3, method: 'bank', note: '', active: true, startedAt: '2026-01-01' } }),
  donor('e', 'שרה לוי', 'פרטי', '055-5555555', [['2024-06-01', 600], ['2024-08-01', 600]]),
  donor('f', 'עמותת אור לגליל', 'קרן', '', [[G(6), 4000], [G(7), 4500], ['2026-08-12', 5000]], { email: 'or@x.co' }),
  donor('g', 'משפחת כהן', 'פרטי', '058-8888888', [[G(1), 300], [G(4), 350], [G(7), 400]]),
  donor('h', 'ד"ר לוין', 'פרטי', '', [['2025-12-06', 2500], ['2026-06-06', 2800]], { nextDate: '2026-08-15' }),
  donor('i', 'גולן השקעות', 'עסק', '050-9999999', [[G(2), 9000], [G(6), 11000]], { email: 'go@x.co' }),
  donor('j', 'משפחת פרץ', 'פרטי', '052-1212121', [['2025-07-06', 800]]),
  donor('k', 'קרן מרים', 'קרן', '', [[G(3), 3000], [G(5), 3200], [G(7), 3400]], { email: 'm@x.co' }),
  donor('l', 'חסדי נעמי', 'עסק', '054-3434343', [[G(5), 1500], ['2026-08-10', 1800]]),
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
// זריעת localStorage לפני שה-JS של האפליקציה רץ — כדי שה-DB שלנו נטען בבוט הראשון
// (אחרת האפליקציה שומרת DB ריק לפני שהזרקה-אחרי-טעינה נקראת).
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({
      slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {},
      features: { 'supporters.cockpit': true, 'supporters.intel': true, 'supporters.galaxy': true, 'supporters.rebrand': true },
    }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, TODAY]);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌ console:', m.text()); });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const nav = async (label) => { await page.locator(`nav >> text=${label}`).first().click().catch(() => {}); await wait(600); };
const shot = async (name) => { await page.screenshot({ path: join(OUT, name + '.png') }); console.log('📸', name); };

await nav('תורמים');
await wait(700);
await shot('01-rebrand-list'); // הטבלה + רצועת-KPI

await page.getByRole('button', { name: /מודיעין/ }).first().click().catch(() => {});
await wait(900);
await shot('02-intel');

await page.getByRole('button', { name: /מסך הנתונים/ }).first().click().catch(() => {});
await wait(500);
await page.getByRole('button', { name: /גלקסיה/ }).first().click().catch(() => {});
await wait(1800); // אנימציה
await shot('03-galaxy');

await page.getByRole('button', { name: /מסך הנתונים/ }).first().click().catch(() => {});
await wait(500);
await page.getByRole('button', { name: /חלון העבודה/ }).first().click().catch(() => {});
await wait(800);
await shot('04-cockpit');

console.log('\n✅ shots in', OUT);
await b.close();
server.close();
