/**
 * צילום כל-המסכים לביקורת-נחיל (בקשת-בעלים "תעבור על כל המסכים אחד לאחד").
 * ערכת קהילה (ערכת-הבעלים) ברוחב 1080 + מובייל 390 למסכים ראשיים.
 *   npm run build && node e2e/swarm-capture.mjs   → e2e/shots-swarm/
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-swarm');
rmSync(SHOTS, { recursive: true, force: true }); mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO = readFileSync(join(DIST, 'demo.json'), 'utf8');
const server = createServer((q, s) => { let p = join(DIST, decodeURIComponent(q.url.split('?')[0].split('#')[0])); try { if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html'); const m = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' }[extname(p)] ?? 'text/plain'; s.setHeader('content-type', m); s.end(readFileSync(p)); } catch { s.statusCode = 404; s.end('x'); } });
await new Promise((r) => server.listen(4181, r));
const BASE = 'http://localhost:4181/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const FEATURES = { 'supporters.rfm': true, 'supporters.hok': true, 'supporters.ayin': true, 'supporters.nextdate': true, 'supporters.advfilter': true, 'supporters.colfilter': true, 'supporters.purpose': true, 'supporters.sort': true, 'shell.palette': true };
const errors = [];

async function session(width, height, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag}: ${String(e).slice(0, 100)}`));
  const wt = (ms) => page.waitForTimeout(ms);
  const CFG = JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'kehila', modules: {}, features: FEATURES });
  await ctx.addInitScript(([c, d]) => { try { localStorage.setItem('maor_org_config', c); if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', d); } catch { /* */ } }, [CFG, DEMO]);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wt(1300);
  const esc = async () => { for (let i = 0; i < 6; i++) { if (!(await page.locator('.modal-back,[role="dialog"][aria-modal="true"]').count())) return; await page.keyboard.press('Escape').catch(() => {}); await wt(130); } };
  const l0 = page.locator('button', { hasText: 'פתיחת יום' }); if (await l0.count()) { await l0.first().click().catch(() => {}); await wt(300); }
  await esc();
  const shot = async (name, full = true) => { await esc(); await page.screenshot({ path: join(SHOTS, `${tag}-${name}.png`), fullPage: full }); console.log('📸', tag, name); };
  const shotModal = async (name) => { await wt(300); await page.screenshot({ path: join(SHOTS, `${tag}-${name}.png`) }); console.log('📸', tag, name); await esc(); };
  const nav = async (label) => { await esc(); let b = page.locator('.app-side .side-link, nav.app-nav button, .bottomnav button', { hasText: label }); if (!(await b.count())) { const more = page.locator('nav.app-nav button, .bottomnav button', { hasText: 'עוד' }); if (await more.count()) { await more.first().click().catch(() => {}); await wt(300); b = page.locator('[role="dialog"] button,.modal button', { hasText: label }); } } if (await b.count()) { await b.first().click().catch(() => {}); await wt(650); } };
  const clickText = async (t, sel = 'button') => { const el = page.locator(sel, { hasText: t }); if (await el.count()) { await el.first().click().catch(() => {}); await wt(500); return true; } return false; };
  const openRow = async () => { await page.locator('.app-main table tbody tr, .app-main .card[role="button"]').first().click().catch(() => {}); await wt(650); };

  await shot('01-home');
  await nav('משפחות'); await shot('02-families');
  await openRow(); await shot('02b-family-detail'); await esc();
  await nav('משפחות'); if (await clickText('הוספת')) await shotModal('02c-family-add');
  await nav('חוגים'); await shot('03-courses');
  await openRow(); await shot('03b-course-detail'); await esc();
  await nav('חוגים'); if (await clickText('הוספת')) await shotModal('03c-course-add');
  await nav('לוח'); await shot('04-calendar');
  await nav('יומן'); await shot('05-diary');
  await nav('תורמים'); await shot('06-supporters');
  await openRow(); await shot('06b-supporter-detail');
  if (await clickText('תרומה')) await shotModal('06d-donation'); await esc();
  await nav('תורמים'); if (await clickText('הוספת')) await shotModal('06c-supporter-add');
  await nav('קופות'); await shot('07-tzedaka');
  await nav('חנות'); await shot('08-shop');
  await nav('חלוקה'); await shot('09-distribution');
  await nav('דוחות'); await shot('10-reports');
  await nav('הגדרות'); await shot('11-settings');
  await nav('עזרה'); await shot('12-help');
  await nav('בית');
  await page.keyboard.press('Control+k').catch(() => {}); await wt(400);
  if (await page.locator('.modal-back,[role="dialog"]').count()) await shotModal('13-palette');

  await ctx.close();
}

// שער-כניסה (עם firebase)
async function loginShot(width, height, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${tag}-login: ${String(e).slice(0, 100)}`));
  const CFG = JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'kehila', modules: {}, features: {}, firebase: { apiKey: 'k', authDomain: 'a.firebaseapp.com', projectId: 'p', appId: 'x' } });
  await ctx.addInitScript((c) => { try { localStorage.setItem('maor_org_config', c); } catch { /* */ } }, CFG);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForTimeout(1600);
  await page.screenshot({ path: join(SHOTS, `${tag}-00-login.png`), fullPage: true }); console.log('📸', tag, '00-login');
  await ctx.close();
}

await loginShot(1080, 1400, 'd');
await session(1080, 1200, 'd');
await session(390, 780, 'm');

console.log(errors.length ? '❌ JS errors:\n  ' + errors.join('\n  ') : '✅ אפס שגיאות JS בכל המסכים');
await browser.close(); server.close();
