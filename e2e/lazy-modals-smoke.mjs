/**
 * סמוק 19.11.2026 — המודאלים שעברו לטעינה-בפתיחה (bundle-split) עדיין נפתחים ועובדים.
 *
 * רקע: כדי להוריד את הבנדל הראשי (159.7KB ⇒ 131.6KB gzip) 11 מודאלים ב-App.tsx עברו מ-import
 * סטטי ל-lazy() + <Suspense fallback={null}>. הסיכון: מודאל שלא נטען/נזרק בטעינה ⇒ לחיצה שלא
 * עושה כלום. כאן כל אחד נפתח בדרך האמיתית שלו (hash / Ctrl+K / תפריט-העזרה / #call=), מוודאים
 * שהתוכן שלו מופיע, נסגר — ואפס שגיאות-קונסולה בכל הזרימה.
 *   npm run build && node e2e/lazy-modals-smoke.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CHROME_EXE } from './chrome-path.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('Content-Type', MIME[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(8311, r));
const BASE = 'http://localhost:8311/';

const cfg = JSON.parse(readFileSync(join(HERE, '..', 'public', 'config.json'), 'utf8'));
delete cfg.firebase;
cfg.telephony = { ...(cfg.telephony || {}), enabled: true, city: 'jerusalem' };
const demo = readFileSync(join(DIST, 'demo.json'), 'utf8');

const browser = await chromium.launch({ executablePath: CHROME_EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(([c, d]) => {
  localStorage.setItem('maor_org_config', c);
  if (!localStorage.getItem('maor_db')) localStorage.setItem('maor_db', d);
}, [JSON.stringify(cfg), demo]);
const pg = await ctx.newPage();
pg.setDefaultTimeout(8000);
const errors = [];
pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

let passed = 0, failed = 0;
const ok = (m) => { passed++; console.log('✅ ' + m); };
const fail = (m) => { failed++; console.log('❌ ' + m); };

await pg.goto(BASE, { waitUntil: 'networkidle' });
await pg.waitForSelector('main', { timeout: 20000 });
const day = pg.locator('button', { hasText: 'פתיחת יום' });
if (await day.count()) { await day.first().click(); await pg.waitForTimeout(300); }

const overlay = '.modal-back, [role="dialog"]';
const overlays = () => pg.locator(overlay).count();
const closeAll = async () => {
  for (let i = 0; i < 6 && ((await overlays()) || (await pg.locator('.impact-wall').count())); i++) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); }
  await pg.evaluate(() => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); });
};
/** פותח, מחכה לטקסט-הזיהוי של המודאל, סוגר. */
async function check(label, open, marker, sel = overlay) {
  await closeAll();
  const before = await overlays();
  try {
    await open();
    await pg.locator(sel).filter({ hasText: marker }).first().waitFor({ state: 'visible', timeout: 8000 });
    ok(`${label} נפתח (נטען בפתיחה) — "${marker instanceof RegExp ? marker.source : marker}"`);
  } catch (e) {
    fail(`${label} לא נפתח: ${String(e.message).split('\n')[0]} (שכבות לפני ${before}, אחרי ${await overlays()})`);
  }
  await closeAll();
}
const viaHash = (h) => async () => { await pg.evaluate((x) => { location.hash = x; }, h); };

// ה-hash-ים הקיימים (useState מאזין ל-hashchange ב-App.tsx)
// קיר-ההשפעה = מסך-ראווה מלא (.impact-wall), לא דיאלוג
await check('🧱 קיר-ההשפעה (#wall)', viaHash('#wall'), /./, '.impact-wall');
await check('⏱ טיימר-כסף (#timer)', viaHash('#timer'), /./);
await check('💵 קופה רושמת (#cashbox)', viaHash('#cashbox'), /./);
await check('🩻 מפת-אזורים (#bodymap)', viaHash('#bodymap'), /./);
await check('🔗 איחוד-כפילויות (#dedup)', viaHash('#dedup'), /./);
await check('📞 כרטיס-שיחה-נכנסת (#call=)', viaHash('#call=0501234567'), /0501234567|050-1234567/);
await check('⌘ פלטת-הפקודות (Ctrl+K)', async () => { await pg.locator('main').click({ position: { x: 5, y: 5 } }).catch(() => {}); await pg.keyboard.press('Control+k'); }, /./);
await check('🩺 בדיקת-תקשורת (❓ ⇒ בדיקת תקשורת)', async () => {
  await pg.locator('button.nav-gear, button.side-link').filter({ has: pg.locator('text=❓') }).first().click().catch(async () => {
    await pg.locator('button[aria-label*="עזרה"]').first().click();
  });
  await pg.locator('button', { hasText: 'בדיקת תקשורת' }).first().click();
}, /תקשורת|חסום|סינון/);

// ייבוא-ה-chunks באמת קרה בפתיחה ולא בטעינה: לפני לחיצה ראשונה ה-chunk לא נטען.
const fresh = await ctx.newPage();
const loaded = [];
fresh.on('response', (r) => { if (/\/assets\/.*\.js$/.test(r.url())) loaded.push(r.url().split('/').pop()); });
await fresh.goto(BASE, { waitUntil: 'networkidle' });
await fresh.waitForTimeout(800);
const preload = loaded.filter((f) => /^(CashRegister|ImpactWall|MoneyTimer|BodyMap|CommandPalette|NetCheckModal)-/.test(f));
preload.length === 0 ? ok('בטעינת-הבית אף מודאל לא נטען מראש (' + loaded.length + ' קבצי-JS)') : fail('מודאלים נטענו בלי פתיחה: ' + preload.join(', '));
await fresh.close();

errors.length === 0 ? ok('אפס שגיאות-קונסולה בכל הזרימה') : fail('שגיאות: ' + errors.slice(0, 4).join(' | '));
console.log(`\n${passed} ✅ · ${failed} ❌`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
