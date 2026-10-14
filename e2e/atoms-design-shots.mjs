/**
 * 🎨 ארגז המנועים — צילומי לפני/אחרי של העיצוב (ATOMS-DESIGN 14.10.2026).
 * המסע המלא של הבעלים ב-390×844 + שלושה ב-1280×800 · אותו ארגון ואותו שעון כמו enginebox-smoke.
 *   npm run build && node e2e/atoms-design-shots.mjs after      (ברירת-מחדל: after)
 * כל צילום ≤150KB (נדחס ל-PNG-פלטה אם צריך) ⇒ knowledge/shots/atoms-design-2026-10-14/<prefix>-*.png
 * אין כאן בדיקות-התנהגות — אלה ב-enginebox-smoke. רק צילומים ושגיאות-קונסולה.
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIX = process.argv[2] === 'before' ? 'before' : 'after';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', 'dist');
const OUT = join(HERE, '..', 'knowledge', 'shots', 'atoms-design-2026-10-14');
await mkdir(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/maor-system\/?/, '/'); if (p === '/' || p === '') p = '/index.html';
    const data = await readFile(normalize(join(ROOT, p))); res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/maor-system/`;
const CHROME = process.env.CHROME_PATH ?? (process.env.PLAYWRIGHT_BROWSERS_PATH ? join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium') : '/opt/pw-browsers/chromium');
const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const NOW = new Date('2026-10-14T09:00:00Z');
let problems = 0;

/* ───────── הארגון: נתונים קטנים ואמיתיים ───────── */
const AT = '2026-10-01T08:00:00.000Z';
const unit = (o) => ({ type: 'צימר', beds: 2, cap: 4, rate: 600, status: 'free', subRooms: [], createdAt: AT, updatedAt: AT, ...o });
const guest = (o) => ({ kind: 'guest', phone: '', email: '', adults: 2, kids: 0, notes: '', createdAt: AT, updatedAt: AT, ...o });
const booking = (o) => ({ roomIds: [], adults: 2, kids: 0, status: 'confirmed', charges: [], payments: [], notes: '', shabbat: false, createdAt: AT, updatedAt: AT, ...o });
const listing = (o) => ({
  source: 'owner', title: '', area: 'בני ברק', city: '', phone2: '', whatsapp: '', hours: [], always: true, hoursNote: '', services: [], languages: ['he'],
  kashrut: '', emergency: false, desc: '', notes: '', status: 'approved', featuredUntil: '', recs: [], createdAt: AT, updatedAt: AT, ...o,
});
const post = (o) => ({ kind: 'minyan', text: '', phone: '', noticeKind: '', days: [], date: '', time: '', until: '', approved: true, pinned: false, createdAt: AT, updatedAt: AT, ...o });
const SEED_DB = {
  v: 6,
  hostUnits: [unit({ id: 'hu1', name: 'צימר הגפן' }), unit({ id: 'hu2', name: 'דירת הנחל', type: 'דירה', cap: 6, beds: 3 })],
  hostBookings: [
    // שישי ⇒ ראשון · (ATOMS) יתרה פתוחה ₪1,200 — לחלוקה לתשלומים
    booking({ id: 'hb1', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-16', checkOut: '2026-10-18', kids: 3, charges: [{ id: 'c1', kind: 'stay', label: 'לינה', amount: 1200 }] }),
    booking({ id: 'hb2', guestId: 'hg2', unitId: 'hu2', checkIn: '2026-10-17', checkOut: '2026-10-19' }), // נכנסת בשבת
    // (FINAL) שתי שהיות-שבת שכבר היו בחודש האחרון — ל"מה היה קורה" (ליל-שבת 9.10 · 2.10)
    booking({ id: 'hb3', guestId: 'hg3', unitId: 'hu1', checkIn: '2026-10-09', checkOut: '2026-10-11', status: 'done' }),
    booking({ id: 'hb4', guestId: 'hg3', unitId: 'hu2', checkIn: '2026-10-02', checkOut: '2026-10-04', status: 'done' }),
  ],
  hostRecords: [
    guest({ id: 'hg1', name: 'משפחת לוי', phone: '050-1234567', kids: 3 }),
    guest({ id: 'hg2', name: 'משפחת שפירא', phone: '052-7654321' }),
    guest({ id: 'hg3', name: 'משפחת כהן', phone: '053-1111111' }),
    { id: 'hf1', kind: 'fault', unitId: 'hu1', assetId: '', category: 'אינסטלציה', priority: 2, desc: 'נזילה בכיור', status: 'open', safety: false, blocked: false, createdAt: AT, updatedAt: AT },
    { id: 'hc1', kind: 'clean', unitId: 'hu2', type: 'ניקיון אחרי עזיבה', status: 'open', date: '2026-10-14', createdAt: AT, updatedAt: AT },
    // (ATOMS) הצוות — שתי מנקות: "מעביר הלאה כשאין תשובה" ו"מחלק בתורות" נשענים עליהן
    { id: 'hs1', kind: 'staff', name: 'דנה', role: 'ניקיון', phone: '', createdAt: AT, updatedAt: AT },
    { id: 'hs2', kind: 'staff', name: 'רבקה', role: 'ניקיון', phone: '', createdAt: AT, updatedAt: AT },
  ],
  prListings: [
    listing({ id: 'pl101', dialCode: '101', name: 'אינסטלציה זילברמן', title: 'נזילות, סתימות ודודים', category: 'elec', phone: '050-0000101' }),
    listing({ id: 'pl111', dialCode: '111', name: 'ניקיון ברק', title: 'ניקיון דירות ומשרדים', category: 'home', phone: '050-0000111' }),
  ],
  prPosts: [
    post({ id: 'pm1', title: 'בית המדרש הגדול', place: 'רח׳ רבי עקיבא 10', prayers: [{ prayer: 'שחרית', times: ['06:30'] }, { prayer: 'מנחה', times: ['sh-15'] }] }),
    post({ id: 'pm2', title: 'שטיבלך', place: 'רח׳ חזון איש 3', days: [5, 6], prayers: [{ prayer: 'קבלת שבת', times: ['sh-10'] }] }),
  ],
  ui: {
    hosting: { businessName: 'צימרי הגליל' },
    parnasa: { communityName: 'קהילת בעלזא', zmanim: { city: 'bneibrak', label: 'בני ברק' } },
  },
};
const CFG = { slug: 'default', orgName: 'צימרי הגליל', theme: 'or-rishon', modules: { parnasa: true, hosting: true }, features: { 'shell.enginebox': true, 'shell.demodrop': false }, integrations: { whatsapp: { enabled: true } } };
const BOX = '[role=dialog][aria-label="🧩 ארגז המנועים"]';

/** dark ⇒ ערכת "היכל" (הערכה הכהה של האפליקציה — אין מצב-כהה נפרד). */
async function open(viewport, dark = false) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(({ c, dbJson }) => {
    if (sessionStorage.getItem('eb_seeded')) return;
    sessionStorage.setItem('eb_seeded', '1');
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(c));
    localStorage.setItem('maor_day', '2026-10-14');
    localStorage.setItem('maor_db', dbJson);
  }, { c: dark ? { ...CFG, theme: 'heichal' } : CFG, dbJson: JSON.stringify(SEED_DB) });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(600);
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await page.locator(BOX).waitFor({ timeout: 6000 }).catch(() => {});
  await page.locator(`${BOX} [data-host="bookings"]`).first().waitFor({ timeout: 6000 }).catch(() => {});
  await wait(500);
  return { ctx, page, errors };
}
const A = (page, sel) => page.locator(`${BOX} ${sel}`).first();
async function shot(page, name, el) {
  await page.addStyleTag({ content: '.bottom-nav{display:none!important} *{caret-color:transparent!important}' });
  if (el) await A(page, el).scrollIntoViewIfNeeded().catch(() => {});
  await wait(450);
  const path = join(OUT, `${PREFIX}-${name}.png`);
  await page.screenshot({ path });
  if ((await stat(path)).size > 150 * 1024) {
    execFileSync('python3', ['-c', 'import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert("RGB");im.quantize(colors=128,method=Image.Quantize.MEDIANCUT).save(sys.argv[1],optimize=True)', path]);
  }
  const kb = Math.round((await stat(path)).size / 1024);
  console.log(`  📸 ${PREFIX}-${name}.png ${kb}KB`);
  if (kb > 150) problems++;
}
const click = async (page, sel) => { await A(page, sel).scrollIntoViewIfNeeded().catch(() => {}); await A(page, sel).click(); await wait(350); };
const waitMade = async (page) => { await A(page, '[data-made]').waitFor({ timeout: 6000 }).catch(() => {}); await wait(500); };
const connectBtn = (page) => page.locator(`${BOX} [data-connect], ${BOX} .at-actions button`).filter({ hasText: 'חבר' }).first();

// ───── מובייל: המסע המלא ─────
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 });
  await shot(page, '01-home');
  await click(page, '[data-host="bookings"]');
  await shot(page, '02-pick-part');
  await click(page, '[data-atom="divide"]');
  await shot(page, '03-question');
  await click(page, '[data-place="bookings.turnover"]');
  await click(page, '[data-choice="by:size"]');
  await A(page, '[data-detail="size"]').fill('40');
  await A(page, '[data-detail="gap"]').fill('0');
  await wait(300);
  // הפרטים מהכותרת: "מתחבר אל" + התוצאה כגיבור (מתחת לפס העליון הדביק)
  await A(page, '#at-h-details').evaluate((el) => { el.scrollIntoView({ block: 'start' }); el.closest('.modal-back')?.scrollBy(0, -90); });
  await shot(page, '04-details');
  await connectBtn(page).scrollIntoViewIfNeeded();
  await connectBtn(page).click();
  await waitMade(page);
  await shot(page, '05-made');
  await shot(page, '06-mine', '[data-capability]');
  // בונים על המנוע שנוצר
  await click(page, '[data-open-cap="bookings:bookings.turnover:divide"]');
  await shot(page, '07-build-on');
  await click(page, '[data-atom="merge"]');
  await shot(page, '08-chain-question');
  await click(page, '[data-place="out:bookings:bookings.turnover:divide"]');
  await connectBtn(page).scrollIntoViewIfNeeded();
  await connectBtn(page).click();
  await waitMade(page);
  await shot(page, '09-second-generation');
  // הסרה חסומה
  await page.locator(`${BOX} button[title="הסר: מנוע תורים"]`).first().scrollIntoViewIfNeeded();
  await page.locator(`${BOX} button[title="הסר: מנוע תורים"]`).first().click();
  await wait(300);
  await shot(page, '10-remove-blocked', '[data-blocked]');
  // השרשראות של מנוע ההזמנות
  await page.keyboard.press('Escape');
  await wait(500);
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await A(page, '[data-host="bookings"]').waitFor({ timeout: 6000 }).catch(() => {});
  await click(page, '[data-host="bookings"]');
  await shot(page, '11-chains', '[data-chain]');
  // הדרכים האחרות: 🔌 ו-🎯 (v1)
  await click(page, '[data-tab="plug"]');
  await shot(page, '12-plug');
  await click(page, '[data-start="hosting"]');
  await click(page, '[data-pick="pr.zmanim"]');
  await shot(page, '13-plug-options');
  await click(page, '[data-tab="goal"]');
  await shot(page, '14-goal');
  if (PREFIX === 'after') {
    // 🎯 הכרטיס של G בדלת הראשונה: משפט ⇒ ההרכבה עם התוצאה האמיתית
    await A(page, '[data-goal-input]').fill('תורים של 40 דקות בחלון הניקיון');
    await A(page, '[data-goal] form button[type=submit]').click();
    await A(page, '[data-goal-result]').waitFor({ timeout: 6000 }).catch(() => {});
    await shot(page, '14b-goal-result', '[data-goal-result]');
  }
  if (errors.length) { console.log('  ❌ שגיאות קונסולה:', errors.slice(0, 3).join(' | ')); problems++; }
  await ctx.close();
}
// ───── מובייל כהה (ערכת היכל): הבית + השאלה ─────
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 }, true);
  await shot(page, '15-dark-home');
  await click(page, '[data-host="bookings"]');
  await click(page, '[data-atom="divide"]');
  await shot(page, '16-dark-question');
  if (errors.length) { console.log('  ❌ שגיאות קונסולה (כהה):', errors.slice(0, 3).join(' | ')); problems++; }
  await ctx.close();
}
// ───── מחשב: 3 צילומים ─────
{
  const { ctx, page, errors } = await open({ width: 1280, height: 800 });
  await shot(page, 'desktop-1-home');
  await click(page, '[data-host="bookings"]');
  await click(page, '[data-atom="divide"]');
  await shot(page, 'desktop-2-question');
  await click(page, '[data-place="bookings.turnover"]');
  await connectBtn(page).click();
  await waitMade(page);
  await shot(page, 'desktop-3-made');
  if (errors.length) { console.log('  ❌ שגיאות קונסולה (מחשב):', errors.slice(0, 3).join(' | ')); problems++; }
  await ctx.close();
}
await b.close();
server.close();
if (problems) { console.log(`\n💥 ${problems} בעיות`); process.exit(1); }
console.log(`\n🎨 צילומי ${PREFIX} מוכנים`);
