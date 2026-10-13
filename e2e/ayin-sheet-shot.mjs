/** צילום + אימות round-trip של גיליון מעקב-הטיפול (הורדה⟳ייבוא) על קונפיג-החי (בקשת-בעלים 31.8). */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
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

const supporters = [{
  id: 's1', name: 'משפחת כהן', phone: '050-1234567', email: '', address: '', idNum: '', cat: 'פרטי',
  forWho: '', notes: '', count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', nextNote: '',
  donations: [],
  ayin: {
    stage: 'eyes', answerPushed: false, paid: false,
    names: [
      { id: 'n1', name: 'יעקב בן רחל', eyes: 2, done: false, note: '' },
      { id: 'n2', name: 'שרה בת מרים', eyes: 4, done: false, note: '' },
    ],
    log: [], answers: [], lastTouch: '2026-08-31',
  },
}];

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

// הגדרות → 📚 נתונים → ייבוא נתונים → לשונית "גיליון מעקב טיפול"
await page.locator('.side-link', { hasText: 'הגדרות' }).first().click().catch(() => page.getByText('הגדרות', { exact: true }).first().click().catch(() => {}));
await wait(700);
await page.getByText('📚 נתונים', { exact: true }).first().click().catch(() => {});
await wait(500);
await page.getByText('ייבוא נתונים', { exact: true }).first().click().catch(() => {});
await wait(500);
// לשונית גיליון מעקב טיפול
await page.getByText(/גיליון מעקב טיפול/).first().click().catch(() => {});
await wait(500);
await page.getByText('גיליון מעקב טיפול (CSV)', { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
await wait(300);
await page.screenshot({ path: join(OUT, 'ayin-sheet-ui.png'), fullPage: true });
console.log('📸 ayin-sheet-ui');

// --- אימות הורדה חיה ---
let csvText = '';
try {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.getByText('⬇ הורדת הגיליון', { exact: false }).first().click(),
  ]);
  const path = join(OUT, 'maor-ayin-eyes.csv');
  await dl.saveAs(path);
  csvText = await readFile(path, 'utf8');
  console.log('⬇ הורד הגיליון:', dl.suggestedFilename());
  console.log('--- CSV ---\n' + csvText.split('\n').slice(0, 4).join('\n'));
} catch (e) { console.log('⚠ הורדה נכשלה:', e.message); }

// --- אימות ייבוא חוזר: ממלאים עיני+נמסר ומעלים ---
if (csvText) {
  const lines = csvText.trim().split('\n');
  // עמודה 3=שם, 4=עיניים, 5=נמסר — נעדכן: יעקב→5 עיניים+נמסר כן
  const filled = lines.map((ln, i) => {
    if (i === 0) return ln;
    const c = ln.split(',');
    if (c[2] && c[2].includes('יעקב')) { c[3] = '5'; c[4] = 'כן'; }
    return c.join(',');
  }).join('\n');
  const upPath = join(OUT, 'ayin-filled.csv');
  await writeFile(upPath, filled, 'utf8');
  const input = page.locator('input[type="file"][accept*="csv"]').last();
  await input.setInputFiles(upPath).catch((e) => console.log('⚠ קלט-קובץ:', e.message));
  await wait(800);
  await page.screenshot({ path: join(OUT, 'ayin-sheet-parsed.png'), fullPage: true });
  console.log('📸 ayin-sheet-parsed (סיכום זיהוי)');
  // החלה
  await page.getByText(/החלת העדכונים/).first().click().catch((e) => console.log('⚠ החלה:', e.message));
  await wait(800);
  await page.screenshot({ path: join(OUT, 'ayin-sheet-applied.png') });
  console.log('📸 ayin-sheet-applied');
  // אימות שהעדכון נכנס: נבדוק את ה-DB
  const eyes = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('maor_db') || '{}');
    const n = db.supporters?.[0]?.ayin?.names?.find((x) => x.name.includes('יעקב'));
    const log = db.supporters?.[0]?.ayin?.log || [];
    return { eyes: n?.eyes, done: n?.done, logCount: log.length };
  });
  console.log('✔ אחרי-החלה: יעקב עיניים=' + eyes.eyes + ' נמסר=' + eyes.done + ' רישומי-log=' + eyes.logCount);
}
await b.close(); server.close();
console.log('done');
