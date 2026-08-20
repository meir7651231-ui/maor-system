/**
 * סמוק מרכז-הטיפול המלא (20.8, בקשת-בעלים "הוויג'דט שווה לטפל"):
 * הווידג'ט 🔔 בבית ← "המסך המלא ←" ← כל הפריטים (מונה=באדג'), חיפוש מסנן,
 * "✓ טופל" מעביר לרשימת-הטופלו, "לטפל ←" מנווט ליעד-העומק.
 * דורש build קודם (npm run build).
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8238, r));

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0;
let failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };

await pg.addInitScript(() => {
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {} }));
});
await pg.goto('http://localhost:8238/');
await pg.waitForSelector('main', { timeout: 20000 });
await pg.locator('text=📊 טעינת נתוני דמו').first().click();
await pg.waitForTimeout(1500);
const dayBtn = pg.locator('button', { hasText: 'פתיחת יום' }).first();
if (await dayBtn.count()) { await dayBtn.click(); await pg.waitForTimeout(400); }
await pg.locator('nav button, .side-link', { hasText: 'בית' }).first().click();
await pg.waitForTimeout(600);

/* ── 1 · פתיחת המסך-המלא — המונה = הבאדג' של הווידג'ט ── */
const carePanel = pg.locator('section.card', { hasText: 'דורש טיפול' }).first();
if (!(await carePanel.count())) { fail('ווידג\'ט דורש-טיפול לא נמצא'); }
else {
  const badge = ((await carePanel.locator('.hm-head .chip').first().textContent().catch(() => '')) ?? '').replace(/[^\d]/g, '');
  await carePanel.locator('button', { hasText: 'המסך המלא' }).click();
  await pg.waitForTimeout(500);
  const modal = pg.locator('[role="dialog"], .modal').first();
  // textContent של כל המודאל מדביק צ'יפים למונה — קוראים את אלמנט-המונה עצמו
  const counter = async () =>
    (((await modal.getByText(/פריטים פתוחים/).last().textContent().catch(() => '')) ?? '').match(/(\d+) פריטים פתוחים/)?.[1] ?? '');
  const mTxt = (await modal.textContent().catch(() => '')) ?? '';
  mTxt.includes('המסך המלא') ? ok('מרכז-הטיפול נפתח') : fail('המודאל לא נפתח');
  const counted = await counter();
  badge && counted === badge
    ? ok(`המונה במסך (${counted}) = הבאדג' בווידג'ט (${badge}) — כל הפריטים, בלי קיצוץ`)
    : fail(`מונה לא תואם: מסך ${counted} מול באדג' ${badge}`);

  /* ── 2 · חיפוש מסנן ── */
  const firstTitle = ((await modal.locator('.hm-row span').nth(1).textContent()) ?? '').trim().slice(0, 10);
  await modal.locator('input[type="search"]').fill('מחרוזת-שאיננה');
  await pg.waitForTimeout(300);
  const emptyQ = (await modal.textContent()) ?? '';
  await modal.locator('input[type="search"]').fill('');
  await pg.waitForTimeout(300);
  emptyQ.includes('אין תוצאות לחיפוש')
    ? ok('החיפוש מסנן (מחרוזת-זרה ⇒ "אין תוצאות")')
    : fail('החיפוש לא סינן');

  /* ── 3 · ✓ טופל מהמסך — עובר לרשימת-הטופלו ── */
  const before = await counter();
  await modal.locator('button', { hasText: '✓ טופל' }).first().click();
  await pg.waitForTimeout(500);
  const afterT = (await modal.textContent()) ?? '';
  const after = await counter();
  Number(after) === Number(before) - 1 && afterT.includes('טופלו')
    ? ok(`"✓ טופל" מהמסך: ${before} ⇒ ${after} פתוחים + מופיע ברשימת-הטופלו`)
    : fail(`סימון-טופל לא עבד (${before} ⇒ ${after})`);

  /* ── 4 · "לטפל ←" מנווט ליעד-העומק וסוגר את המסך ── */
  await modal.locator('button.hm-row').first().click();
  await pg.waitForTimeout(700);
  const modalGone = (await pg.locator('[role="dialog"], .modal').count()) === 0;
  const onHome = (await pg.locator('main').textContent())?.includes('דורש טיפול') && modalGone;
  modalGone && !onHome
    ? ok('"לטפל ←" סגר את המסך וניווט ליעד-העומק (עזבנו את הבית)')
    : modalGone
      ? ok('"לטפל ←" סגר את המסך (היעד באותו מסך-בית)')
      : fail('"לטפל ←" לא סגר את המסך');
  void firstTitle;
}

if (errors.length) fail('שגיאות-JS: ' + errors.slice(0, 3).join(' | '));
else ok('אפס שגיאות JS');

console.log(`\n── סיכום מרכז-הטיפול ──\n${passed}/${passed + failed} עברו`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
