/**
 * צילומי-הוכחה לבקשות 30.8 (בקשת-בעלים "תביא צילום ווידוא"):
 * קשר-הבא (משבצת גדולה + 💾 שמירה + 🕯 40 ימים), לוח-תורמים יומי/שבועי/חודשי
 * עם 🎯 יעד-קשר-הבא, ולוח-השנה יומי/שבועי/חודשי. node e2e/proof-shots.mjs
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const OUT = process.env.SHOTS_OUT || join(dirname(fileURLToPath(import.meta.url)), 'proof-shots');
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

const TODAY = '2026-08-30';
function donor(id, name, phone, gifts, opts = {}) {
  const dons = gifts.map(([date, amount], i) => ({ rid: 'D-' + id + i, date, amount, cur: '₪', cat: '' }));
  const dates = gifts.map((g) => g[0]).sort();
  const ils = gifts.reduce((a, g) => a + g[1], 0);
  return {
    id, name, phone, email: opts.email ?? '', address: '', idNum: '', cat: 'פרטי', forWho: '', notes: '',
    count: dons.length, ils, usd: 0, first: dates[0] || '', last: dates[dates.length - 1] || '',
    nextDate: opts.nextDate ?? '', nextNote: opts.nextNote ?? '', donations: dons,
  };
}
const supporters = [
  donor('a', 'משפחת רוזנברג', '050-1111111', [['2026-08-06', 1800], ['2026-08-20', 2000]],
    { nextDate: '2026-09-03', nextNote: 'לעדכן על הקבלה ולבקש חידוש הוראת-קבע', email: 'r@x.co' }),
  donor('b', 'קרן ידידות', '053-3333333', [['2026-08-10', 6000]], { nextDate: '2026-09-01', nextNote: 'לברר כתובת חדשה' }),
  donor('c', 'דוד אוחנה', '054-4444444', [['2026-08-12', 500], ['2026-08-25', 500]], { nextDate: '2026-09-10' }),
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({
      slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {},
    }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, TODAY]);
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('❌', m.text()); });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = async (label) => { await page.locator(`nav >> text=${label}`).first().click().catch(() => {}); await wait(700); };
const clickBtn = async (label, which = 'first') => { const l = page.locator('button', { hasText: label }); await (which === 'last' ? l.last() : l.first()).click().catch(() => {}); await wait(700); };
const shotEl = async (sel, name) => {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await wait(300);
  await el.screenshot({ path: join(OUT, name + '.png') }).catch(async () => { await page.screenshot({ path: join(OUT, name + '.png') }); });
  console.log('📸', name);
};
const shotFull = async (name) => { await page.screenshot({ path: join(OUT, name + '.png'), fullPage: true }); console.log('📸', name); };

// ── 1. כרטיס-תורם: קשר-הבא (משבצת גדולה + שמירה + 40 ימים) ──
await nav('תורמים');
await page.locator('text=משפחת רוזנברג').first().click().catch(() => {});
await wait(800);
await page.locator('text=קשר הבא').first().scrollIntoViewIfNeeded().catch(() => {});
await wait(300);
await shotFull('01-supporter-card-full');
// גזירת כרטיס קשר-הבא עצמו
await shotEl('.card:has-text("קשר הבא")', '02-kesher-haba');

// ── 2. לוח-השנה: יומי/שבועי/חודשי ──
await nav('לוח');
await wait(800);
await shotFull('03-calendar-month');
await clickBtn('שבועי');
await shotFull('04-calendar-week');
await clickBtn('יומי');
await shotFull('05-calendar-day');

// ── 3. לוח-התורמים: יומי/שבועי/חודשי + 🎯 יעד-קשר-הבא ──
await nav('תורמים');
await wait(500);
// בורר-המבטים — לוח-התרומות
for (const lbl of ['לוח תרומות', 'לוח', '📅 לוח', 'לוח התורמים']) {
  const el = page.locator('button', { hasText: lbl }).first();
  if (await el.count()) { await el.click().catch(() => {}); await wait(700); break; }
}
await shotFull('06-donor-board');

console.log('\n✅ shots in', OUT);
await b.close();
server.close();
