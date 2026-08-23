/**
 * אבחון-עומק כל-המסכים (בקשת-בעלים "תבדוק הכל לעומק כל מסך מהרשמה עד הקצה").
 * מודד לכל מסך: גלישה-אופקית, אלמנטים שחורגים מהחלון, יישור בר↔תוכן, שגיאות-קונסולה
 * — ומצלם. רץ desktop (1440) + mobile (390). ‏npm run build && node e2e/full-audit.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const SHOTS = join(HERE, 'shots-audit');
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEMO = readFileSync(join(DIST, 'demo.json'), 'utf8');

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
await new Promise((r) => server.listen(4192, r));
const BASE = 'http://localhost:4192/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

const FEATURES = {
  'supporters.rfm': true, 'supporters.hok': true, 'supporters.ayin': true, 'supporters.nextdate': true,
  'supporters.advfilter': true, 'supporters.colfilter': true, 'supporters.purpose': true, 'supporters.sort': true,
};
const findings = [];

async function metrics(page, label, tag) {
  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const overflowX = Math.round(de.scrollWidth - window.innerWidth);
    // אלמנטים גלויים שחורגים ימינה/שמאלה מעבר לחלון (טקסט/כרטיס/כפתור)
    let off = 0; const offSamples = [];
    for (const el of document.querySelectorAll('.app-main *, .app-top *, .app-side *')) {
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.overflow === 'hidden' || cs.overflowX === 'hidden') continue;
      if (b.right > window.innerWidth + 2 || b.left < -2) {
        off++;
        if (offSamples.length < 4) offSamples.push((el.className || el.tagName).toString().slice(0, 40) + ` [L=${Math.round(b.left)},R=${Math.round(window.innerWidth - b.right)}]`);
      }
    }
    const rr = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return Math.round(window.innerWidth - b.right); };
    const brand = rr('.brand'); // top-shell only
    const firstCard = rr('.app-main .hm-hero') ?? rr('.app-main .hm-stats') ?? rr('.app-main .card') ?? rr('.app-main .filterbar');
    const align = brand != null && firstCard != null ? Math.abs(brand - firstCard) : null;
    return { overflowX, off, offSamples, align, brand, firstCard };
  });
  const flags = [];
  if (m.overflowX > 2) flags.push(`OVERFLOW-X ${m.overflowX}px`);
  if (m.off > 0) flags.push(`OFF-VIEWPORT ${m.off} (${m.offSamples.join(' · ')})`);
  if (m.align != null && m.align > 3) flags.push(`HEADER-MISALIGN ${m.align}px`);
  const line = `[${tag}] ${label.padEnd(16)} ovfX=${m.overflowX} off=${m.off} align=${m.align ?? '-'}${flags.length ? '  ⚠ ' + flags.join(' | ') : '  ok'}`;
  console.log(line);
  if (flags.length) findings.push(`${tag} · ${label}: ${flags.join(' | ')}`);
  await page.screenshot({ path: join(SHOTS, `${tag}-${label}.png`), fullPage: false });
  return m;
}

async function appPass(width, tag) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 780 : 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  const wait = (ms) => page.waitForTimeout(ms);
  const CFG = JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: FEATURES });
  await ctx.addInitScript(([cfg, demo]) => { try { localStorage.setItem('maor_org_config', cfg); if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', demo); } catch { /* */ } }, [CFG, DEMO]);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(1300);
  const closeModals = async () => { for (let i = 0; i < 8; i++) { if (!(await page.locator('.modal-back').count())) return; await page.keyboard.press('Escape').catch(() => {}); await wait(140); } };
  await (async () => { const l = page.locator('button', { hasText: 'פתיחת יום' }); if (await l.count()) { await l.first().click().catch(() => {}); await wait(250); } })();
  await closeModals();

  const nav = async (label, name) => {
    await closeModals();
    // mobile: nav may be in bottom bar / "עוד" modal; desktop: side-link or top nav
    let btn = page.locator('.app-side .side-link, nav.app-nav button, .bottomnav button', { hasText: label });
    if (!(await btn.count())) {
      const more = page.locator('button', { hasText: 'עוד' });
      if (await more.count()) { await more.first().click().catch(() => {}); await wait(300); btn = page.locator('[role="dialog"] button, .modal button', { hasText: label }); }
    }
    if (await btn.count()) { await btn.first().click().catch(() => {}); await wait(650); }
    await closeModals();
    return metrics(page, name, tag);
  };

  await metrics(page, '01-home', tag);
  await nav('משפחות', '02-families');
  // family detail
  await closeModals(); await page.locator('.app-main table tbody tr, .app-main .card[role="button"]').first().click().catch(() => {}); await wait(650);
  await metrics(page, '02b-family-detail', tag);
  await nav('חוגים', '03-courses');
  await closeModals(); await page.locator('.app-main .card[role="button"], .app-main table tbody tr').first().click().catch(() => {}); await wait(650);
  await metrics(page, '03b-course-detail', tag);
  await nav('לוח', '04-calendar');
  await nav('יומן', '05-diary');
  await nav('תורמים', '06-supporters');
  await closeModals(); await page.locator('.app-main table tbody tr, .app-main .card[role="button"]').first().click().catch(() => {}); await wait(650);
  await metrics(page, '06b-supporter-detail', tag);
  await nav('קופות', '07-tzedaka');
  await nav('חנות', '08-shop');
  await nav('חלוקה', '09-distribution');
  await nav('דוחות', '10-reports');
  await nav('הגדרות', '11-settings');
  await nav('עזרה', '12-help');
  // a couple of modals from home
  await nav('בית', '13-home2');
  await closeModals();
  const addFam = page.locator('.app-main button, .app-top button', { hasText: 'הוספת' });
  if (await addFam.count()) { await addFam.first().click().catch(() => {}); await wait(500); await metrics(page, '14-add-form-modal', tag); await closeModals(); }

  console.log(`  [${tag}] console errors: ${errs.length ? errs.slice(0, 3).join(' | ') : 'none'}`);
  if (errs.length) findings.push(`${tag} · console: ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

async function signupPass(width, tag) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 780 : 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  const wait = (ms) => page.waitForTimeout(ms);
  // config WITH firebase ⇒ cloud gate ⇒ login/signup screen
  const CFG = JSON.stringify({ slug: 'default', orgName: 'עמותת מאור החסד', theme: 'or-rishon', modules: {}, features: {}, firebase: { apiKey: 'k', authDomain: 'a.firebaseapp.com', projectId: 'p', appId: 'x' } });
  await ctx.addInitScript((cfg) => { try { localStorage.setItem('maor_org_config', cfg); } catch { /* */ } }, CFG);
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(1600);
  await metrics(page, '00-login', tag);
  // switch to signup tab if present
  const signupTab = page.locator('button', { hasText: 'הרשמה' });
  if (await signupTab.count()) { await signupTab.first().click().catch(() => {}); await wait(700); await metrics(page, '00b-signup', tag); }
  console.log(`  [${tag}] signup console errors: ${errs.length ? errs.slice(0, 3).join(' | ') : 'none'}`);
  if (errs.length) findings.push(`${tag} · signup console: ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
}

console.log('\n===== DESKTOP 1440 =====');
await signupPass(1440, 'd');
await appPass(1440, 'd');
console.log('\n===== MOBILE 390 =====');
await signupPass(390, 'm');
await appPass(390, 'm');

console.log('\n===== SUMMARY =====');
if (!findings.length) console.log('✅ אפס ממצאי-פריסה (גלישה/חריגה/יישור/קונסולה)');
else { console.log(`⚠ ${findings.length} ממצאים:`); findings.forEach((f) => console.log('  - ' + f)); }
await browser.close();
server.close();
