/**
 * בדיקה-פונקציונלית: האם הדריל-אין באמת מסנן (לא רק צילום).
 * נכנס לקוקפיט, לוחץ סגמנט, ומוודא שצ׳יפ-הסינון הופיע במסך-הנתונים.
 */
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

const TODAY = '2026-08-20';
function donor(id, name, cat, gifts) {
  const dons = gifts.map(([date, amount], i) => ({ rid: 'D-' + id + i, date, amount, cur: '₪', cat: '' }));
  const dates = gifts.map((g) => g[0]).sort();
  return { id, name, phone: '050-0000000', email: '', address: '', idNum: '', cat, forWho: '', notes: '',
    count: dons.length, ils: gifts.reduce((a, g) => a + g[1], 0), usd: 0, first: dates[0] || '', last: dates[dates.length - 1] || '', nextDate: '', donations: dons };
}
const supporters = [
  donor('a', 'משפחת רוטשילד', 'קרן', [['2025-09-06', 20000], ['2026-01-06', 22000]]),
  donor('gone', 'תורם נוטש', 'פרטי', [['2024-01-01', 3000], ['2024-03-01', 3000]]),
  donor('gone2', 'עוד נוטש', 'פרטי', [['2024-02-01', 2000], ['2024-05-01', 2000]]),
  donor('fresh', 'תורם טרי', 'עסק', [['2026-07-06', 5000], ['2026-08-06', 5000]]),
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
await ctx.addInitScript(([sup, today]) => {
  if (!localStorage.getItem('maor_org_config')) {
    localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, telephony: { enabled: true }, features: { 'supporters.cockpit': true, 'supporters.intel': true, 'supporters.galaxy': true, 'supporters.rebrand': true, 'supporters.card': true } }));
    localStorage.setItem('maor_day', today);
    localStorage.setItem('maor_db', JSON.stringify({ v: 6, supporters: sup }));
  }
}, [supporters, TODAY]);
const page = await ctx.newPage();
let consoleErr = 0;
page.on('console', (m) => { if (m.type() === 'error') { consoleErr++; console.log('❌ console:', m.text()); } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clickBtn = async (label) => { await page.locator('button', { hasText: label }).first().click().catch(() => {}); };

// בדיקת מסך-הבית: התראת "בסיכון-נטישה" + נחיתה מסוננת
await wait(400);
const homeRisk = await page.locator('text=/בסיכון-נטישה/').count();
console.log('בית — התראת "בסיכון-נטישה" מופיעה:', homeRisk > 0 ? '✅' : '❌');
await page.screenshot({ path: join(OUT, 'func-home-atrisk.png') });
if (homeRisk > 0) {
  await page.locator('text=/בסיכון-נטישה/').first().click().catch(() => {});
  await wait(800);
  const landedFiltered = await page.locator('text=/סגמנט:.*בסיכון/').count();
  console.log('בית → קליק → נחת על רשימה מסוננת:', landedFiltered > 0 ? '✅ מסונן!' : '❌');
}

await page.locator('nav >> text=תורמים').first().click().catch(() => {});
await wait(700);

// מעבר לחלון-העבודה (קוקפיט)
await clickBtn('חלון העבודה');
await wait(700);

// לחיצה על סגמנט "בסיכון נטישה"
const segBtn = page.locator('button', { hasText: 'בסיכון נטישה' }).first();
const hasSeg = await segBtn.count();
await segBtn.click().catch(() => {});
await wait(800);

// אימות: צ׳יפ-הסינון "סגמנט:" הופיע במסך-הנתונים
const segChip = await page.locator('text=/סגמנט:.*בסיכון/').count();
const clearChip = await page.locator('text=/✕ ניקוי/').count();
console.log('סגמנט "בסיכון" קיים בקוקפיט:', hasSeg > 0 ? '✅' : '❌');
console.log('אחרי קליק — צ׳יפ-סינון "סגמנט: בסיכון" הופיע:', segChip > 0 ? '✅ מסנן!' : '❌ לא סינן');
console.log('צ׳יפ-ניקוי קיים:', clearChip > 0 ? '✅' : '❌');
console.log('שגיאות-קונסולה:', consoleErr);
await page.screenshot({ path: join(OUT, 'func-segment-filtered.png') });
console.log('📸 func-segment-filtered');

// חייגן מחווט למודיעין: חזרה לקוקפיט → קליק "📞 חייגן" → החייגן נפתח
await clickBtn('חלון העבודה');
await wait(600);
const dialBtn = page.locator('button', { hasText: '📞 חייגן' }).first();
const hasDialBtn = await dialBtn.count();
console.log('קוקפיט — כפתור "📞 חייגן" קיים:', hasDialBtn > 0 ? '✅' : '❌');
if (hasDialBtn > 0) {
  await dialBtn.click().catch(() => {});
  await wait(700);
  const dialerOpen = await page.locator('text=/📞 חייגן/').count();
  console.log('אחרי קליק — מודאל-החייגן נפתח:', dialerOpen > 0 ? '✅ נפתח!' : '❌');
  await page.screenshot({ path: join(OUT, 'func-dialer.png') });
  console.log('📸 func-dialer');
  await page.keyboard.press('Escape').catch(() => {});
  await wait(300);
}

// חיפוש-מפורש לפי שנה: מעבר למסך-הנתונים → בחירת שנת-נתינה → צ׳יפ-תקופה + סינון
await clickBtn('מסך הנתונים');
await wait(500);
const yearSel = page.locator('select').filter({ has: page.locator('option', { hasText: 'כל השנים' }) }).first();
const hasYearSel = await yearSel.count();
console.log('מסך-הנתונים — בורר-שנה גלוי:', hasYearSel > 0 ? '✅' : '❌');
if (hasYearSel > 0) {
  await yearSel.selectOption('2024').catch(() => {});
  await wait(600);
  // הצ׳יפ הוא כפתור-ניקוי (מובחן מאופציית-הבורר) — מוכיח שהסינון פעל
  const periodChip = await page.locator('button', { hasText: 'נתנו ב-2024' }).filter({ hasText: '✕ ניקוי' }).count();
  console.log('אחרי בחירת שנה — צ׳יפ-סינון "נתנו ב-2024" הופיע:', periodChip > 0 ? '✅ מסנן!' : '❌');
  await page.screenshot({ path: join(OUT, 'func-year-filter.png') });
  console.log('📸 func-year-filter');
}

await b.close();
server.close();
