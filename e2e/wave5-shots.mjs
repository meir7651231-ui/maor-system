/**
 * צילומי-מסך לגל ה׳ של החוגים — מדליק את הדגלים, זורע דמו, ומצלם את היכולות
 * החדשות: מרכז-שימור (💚), כרטיס-הורה (👪), ותשלום-מקוון (💳).
 *   npm run build && node e2e/wave5-shots.mjs   → e2e/shots-wave5/
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-wave5');
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO = readFileSync(join(DIST, 'demo.json'), 'utf8');

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4198, r));
const BASE = 'http://localhost:4198/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
let step = 0;
const shot = async (name) => { step++; await page.screenshot({ path: join(SHOTS, `${String(step).padStart(2, '0')}-${name}.png`) }); console.log('📸', name); };
const wait = (ms) => page.waitForTimeout(ms);

// דגלים דלוקים + הרחבת-סליקה עם כתובת (עד-המפתח) + זריעת-דמו — מוזרק *לפני* קוד-האפליקציה
// דרך addInitScript ⇒ ה-DB קיים לפני ה-boot (מונע מרוץ שדורס ב-db-ריק).
const CFG = JSON.stringify({
  slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {},
  features: { 'courses.parentcard': true, 'courses.ai': true, 'courses.cockpit': true, 'courses.teacherapp': true },
  integrations: { whatsapp: { enabled: true }, payments: { enabled: true, payUrl: 'https://pay.example.com/maor' } },
});
await ctx.addInitScript(
  ([cfg, demo]) => {
    try {
      localStorage.setItem('maor_org_config', cfg);
      if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', demo);
    } catch { /* חסום */ }
  },
  [CFG, DEMO],
);
await page.goto(BASE, { waitUntil: 'networkidle' });
await wait(1400);

async function closeModals() {
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('.modal-back').count())) return;
    await page.keyboard.press('Escape').catch(() => {});
    await wait(220);
    if (await page.locator('.modal-back').count()) {
      await page.locator('.modal-back').last().dispatchEvent('mousedown').catch(() => {});
      await wait(220);
    }
  }
}
const clickText = async (txt, sel = 'button') => {
  const l = page.locator(sel, { hasText: txt });
  if (await l.count()) { await l.first().click().catch(() => {}); await wait(600); return true; }
  return false;
};
const nav = async (label) => { await closeModals(); await page.locator(`nav >> text=${label}`).first().click().catch(() => {}); await wait(700); };

// שער "פתיחת יום עבודה" מופיע בטעינה ומיירט קליקים — דוחים אותו בבחירה מפורשת
await clickText('פתיחת יום');
await wait(400);
await closeModals();

// ── חוגים: כותרת עם הכפתורים החדשים ──
await nav('חוגים');
await shot('courses-header');

// ── 💚 מרכז-שימור ──
if (await clickText('שימור')) await shot('retention-center');
await closeModals();

// ── 📊 דשבורד ──
if (await clickText('דשבורד')) await shot('dashboard');
await closeModals();

// ── 👁 תצוגה כמורה (בעלים) → מסך-המורה של המורה הנבחרת ──
await nav('חוגים');
if (await clickText('תצוגה כמורה')) {
  await wait(400);
  const tBtn = page.locator('.modal button', { hasText: '🎓' });
  if (await tBtn.count()) { await tBtn.first().click().catch(() => {}); await wait(800); await shot('teacher-preview'); }
}
await closeModals();

// ── 👪 כרטיס-הורה: חיפוש משפחת "כהן" (4 ילדים משובצים) → כפתור כרטיס-הורה בפאנל-השיבוצים ──
await nav('משפחות'); await wait(400);
const famSearch = page.locator('main input').first();
if (await famSearch.count()) { await famSearch.fill('כהן'); await wait(600); }
await page.locator('table tbody tr').first().click().catch(() => {}); await wait(700);
// הכפתור מציג רק אימוג׳י 👪 — "כרטיס-הורה" יושב ב-title (hasText לא תופס title)
const pc = page.locator('main button[title*="כרטיס-הורה"]');
if (await pc.count()) {
  await pc.first().scrollIntoViewIfNeeded().catch(() => {});
  await wait(300); await shot('family-enrollments');
  await pc.first().click().catch(() => {}); await wait(700);
  await shot('parent-card');
}
await closeModals();

// ── 💳 תשלום-מקוון: חוגים → כרטיס-חוג → ⚙ ניהול שיבוץ (בתוך main) ──
await nav('חוגים'); await wait(400);
await page.locator('.card[role="button"]').first().click().catch(() => {}); await wait(800);
const gear = page.locator('main button', { hasText: '⚙' });
if (await gear.count()) { await gear.first().click().catch(() => {}); await wait(600); await shot('manage-paylink'); }
await closeModals();

console.log(errors.length ? '❌ JS errors: ' + errors.slice(0, 3).join(' | ') : '✅ אפס שגיאות JS');
await browser.close();
server.close();
