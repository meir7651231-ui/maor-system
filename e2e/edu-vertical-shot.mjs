/**
 * הוכחה · 🎓 חבילת "חינוך וחוגים" (edu, 7.11.2026) — מקומי, בלי ענן.
 *   npm run build && node e2e/edu-vertical-shot.mjs
 * (1) מסך-הכניסה ⇒ החנות ⇒ "חינוך וחוגים" ⇒ "פתיחת המערכת" ⇒ אשף-ההרשמה שלב 1 עם התחום מסומן.
 * (2) ארגון עם החבילה מוחלת + נתוני-דמו ⇒ ניווט בלי תורמים/צדקה/חנות, צבע ירוק-תפוח, מונחי-חינוך.
 */
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots', 'edu-vertical');
mkdirSync(SHOTS, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('content-type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(4199, r));
const BASE = 'http://localhost:4199/';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let fails = 0;
const T = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? '  ✅ ' : '  ❌ ') + name + (extra ? ' — ' + extra : '')); };

console.log('\n🎓 (1) חנות ⇒ חינוך וחוגים ⇒ פתיחת המערכת ⇒ אשף-הרשמה');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('maor_org_config', JSON.stringify({ slug: 'default', orgName: 'אורביט', firebase: { apiKey: 'demo-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: '1:1:web:1' }, features: { 'signup.hero3d': false } }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.locator('button[aria-label^="החנות שלנו"]').first().click();
const store = page.frameLocator('iframe[title="החנות שלנו"]');
const ed = store.locator('button.ed[data-ed="edu"]');
await ed.waitFor({ timeout: 15000 });
T('בחנות: "חינוך וחוגים" בלי תווית "בקרוב"', (await ed.locator('.soon').count()) === 0);
await ed.click();
await page.waitForTimeout(500);
T('התחום נבחר בחנות', (await ed.getAttribute('aria-pressed')) === 'true');
await page.screenshot({ path: join(SHOTS, '1-store-edu.png') });
await store.locator('[data-signup]').first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(SHOTS, '2-store-mine.png') });
await store.locator('[data-start]').first().click();
await page.waitForTimeout(1500);
const chosen = page.locator('.orbit-choice', { hasText: 'חינוך וחוגים' }).first();
const chosenTxt = (await chosen.textContent().catch(() => '')) ?? '';
T('אשף-ההרשמה נפתח ו"חינוך וחוגים" מסומן ✓', chosenTxt.includes('✓'), chosenTxt.replace(/\s+/g, ' ').slice(0, 60));
await chosen.scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(300);
await page.screenshot({ path: join(SHOTS, '3-signup-step1-edu.png') });

console.log('\n🎓 (2) ארגון עם החבילה מוחלת + נתוני-דמו');
const page2 = await ctx.newPage();
page2.on('pageerror', (e) => errors.push(e.message));
await page2.goto(BASE + '__blank');
await page2.evaluate(() => {
  localStorage.clear();
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('maor_day:edu-test', today);
  localStorage.setItem('maor_org_config', JSON.stringify({
    slug: 'edu-test', orgName: 'מרכז חוגים "קשת"', theme: 'kehila', accent: '#3c8f2f', emoji: '🎓', motion: 'calm',
    terms: { 'nav.families': 'משפחות', 'entity.member': 'ילד/ה', 'entity.members': 'ילדים', 'nav.courses': 'חוגים', 'entity.course': 'חוג', 'nav.diary': 'יומן כיתות', 'entity.room': 'כיתה', 'entity.rooms': 'כיתות' },
    modules: { families: true, courses: true, calendar: true, diary: true, supporters: false, reports: true, tzedaka: false, shop: false, shop7: false },
    features: {},
  }));
});
await page2.goto(BASE + '?org=edu-test', { waitUntil: 'networkidle' });
await page2.waitForTimeout(1200);
const demoBtn = page2.locator('button', { hasText: 'טעינת נתוני דמו' }).first();
if (await demoBtn.count()) { await demoBtn.click(); await page2.waitForTimeout(1500); }
const day = page2.locator('.modal-back button', { hasText: 'פתיחת יום' });
if (await day.count()) { await day.first().click(); await page2.waitForTimeout(300); }
const nav = ((await page2.locator('nav').first().textContent()) ?? '').replace(/\s+/g, ' ');
T('ניווט: יש חוגים/יומן כיתות, אין תורמים/קופות/חנות/חלוקה', nav.includes('חוגים') && nav.includes('יומן כיתות') && !/תורמים|קופות צדקה|חנות|חלוקה/.test(nav), nav.slice(0, 120));
const accent = await page2.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
T('צבע-הדגשה ירוק-תפוח', accent.toLowerCase() === '#3c8f2f', accent);
await page2.screenshot({ path: join(SHOTS, '4-edu-home.png') });
await page2.locator('nav >> text=חוגים').first().click();
await page2.waitForTimeout(800);
const h = ((await page2.locator('main h1, main h2').first().textContent()) ?? '').trim();
T('כותרת מסך-החוגים "חוגים" (לא "ניהול קורסים")', h.includes('חוגים') && !h.includes('קורסים'), h);
await page2.screenshot({ path: join(SHOTS, '5-edu-courses.png') });
T('אפס שגיאות JS', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(fails ? `\n💥 ${fails} כשלים` : '\n🏆 חינוך וחוגים — מהחנות להרשמה ולמערכת המולבשת');
await browser.close();
server.close();
process.exit(fails ? 1 : 0);
