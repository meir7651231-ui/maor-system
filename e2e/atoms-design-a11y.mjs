/**
 * ♿ ארגז המנועים — בדיקת נגישות מהירה לעיצוב (ATOMS-DESIGN 14.10.2026): ניגודיות AA לכל טקסט גלוי בארגז ב-4 הערכות
 * (כולל "היכל" הכהה), שם נגיש לכל כפתור, יעד-מגע ≥ 44px לכפתורי הארגז, וסדר-פוקוס (Tab) שעובר דלתות ⇒ מנועים.
 *   npm run build && node e2e/atoms-design-a11y.mjs
 * (מבוסס על אותו ארגון כמו atoms-design-shots — הקוד המשותף הועתק כדי שכל סקריפט ירוץ לבד.)
 *
 * --- מכאן: הכותרת המקורית של סקריפט-הצילומים ---
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

/** ניגודיות לפי WCAG 2.1. */
const AUDIT = () => {
  const parse = (c) => {
    if (!c) return null;
    let m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    m = c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
    return null;
  };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const img = cs.backgroundImage;
      if (img && img !== 'none') {
        // גרדיאנט: לוקחים את התחנה הבהירה/הכהה הגרועה ביותר מול הטקסט — כאן: כל התחנות, ומחזירים את כולן
        const stops = [...img.matchAll(/(rgba?\([^)]*\)|color\(srgb [^)]*\))/g)].map((x) => parse(x[1])).filter(Boolean);
        if (stops.length) { stack.push({ grad: stops }); break; }
      }
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0) { stack.push({ c }); if (c[3] >= 1) break; }
    }
    return stack;
  };
  const resolve = (stack) => {
    // מהעמוק (האטום) אל השטחי
    let bases = [[255, 255, 255, 1]];
    for (let i = stack.length - 1; i >= 0; i--) {
      const s = stack[i];
      if (s.grad) bases = s.grad.flatMap((g) => bases.map((b) => blend(g, b)));
      else bases = bases.map((b) => blend(s.c, b));
    }
    return bases;
  };
  const box = document.querySelector('[role=dialog][aria-label="🧩 ארגז המנועים"]');
  const bad = [];
  let checked = 0;
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim();
    if (!t || !/[\p{L}\d]/u.test(t)) continue;
    const el = n.parentElement;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest('[aria-hidden="true"], .eb-future, :disabled, [aria-disabled="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const fg0 = parse(cs.color);
    if (!fg0) continue;
    const bgs = resolve(bgOf(el));
    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    let worst = 99;
    for (const bg of bgs) {
      const fg = fg0[3] < 1 ? blend(fg0, bg) : fg0;
      const a = lum(fg), b = lum(bg);
      worst = Math.min(worst, (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
    }
    checked++;
    if (worst < need) bad.push(`${worst.toFixed(2)}<${need} «${t.slice(0, 40)}» .${el.className || el.tagName}`);
  }
  // כפתורים: שם נגיש + יעד-מגע
  const unnamed = [];
  const small = [];
  for (const b of box.querySelectorAll('button')) {
    const name = (b.getAttribute('aria-label') || b.textContent || '').replace(/[\p{Extended_Pictographic}️\s←→▾✓✕]/gu, '');
    if (!name && !b.getAttribute('aria-label')) unnamed.push(b.outerHTML.slice(0, 80));
    const r = b.getBoundingClientRect();
    if (r.width && r.height < 44 && !b.closest('.eb-tabs')) small.push(`${Math.round(r.height)}px «${(b.textContent || '').trim().slice(0, 24)}»`);
  }
  for (const s of box.querySelectorAll('summary')) {
    const r = s.getBoundingClientRect();
    if (r.width && r.height < 30) small.push(`summary ${Math.round(r.height)}px`);
  }
  return { checked, bad, unnamed, small };
};

let fails = 0;
const report = (label, r) => {
  const ok = r.bad.length === 0 && r.unnamed.length === 0 && r.small.length === 0;
  console.log(`  ${ok ? '✅' : '❌'} ${label}: ${r.checked} טקסטים · ניגודיות ${r.bad.length ? r.bad.length + ' נמוכה' : 'AA'} · בלי שם ${r.unnamed.length} · קטן מ-44px ${r.small.length}`);
  for (const x of [...r.bad, ...r.unnamed, ...r.small].slice(0, 8)) console.log('     · ' + x);
  if (!ok) fails++;
};
const THEMES = ['or-rishon', 'heichal', 'tsohar', 'kehila'];
for (const theme of THEMES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(({ c, dbJson }) => {
    if (sessionStorage.getItem('eb_seeded')) return;
    sessionStorage.setItem('eb_seeded', '1');
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(c));
    localStorage.setItem('maor_day', '2026-10-14');
    localStorage.setItem('maor_db', dbJson);
  }, { c: { ...CFG, theme }, dbJson: JSON.stringify(SEED_DB) });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(500);
  await page.evaluate(() => { location.hash = '#enginebox'; });
  const A = (sel) => page.locator(`${BOX} ${sel}`).first();
  await A('[data-host="bookings"]').waitFor({ timeout: 6000 }).catch(() => {});
  await wait(400);
  console.log(`— ${theme}`);
  report('בית (בנה בעצמך)', await page.evaluate(AUDIT));
  // סדר-פוקוס: מהכפתור הראשון — ✕ ⇒ 3 דלתות ⇒ "בחר" של המנוע הראשון
  if (theme === 'or-rishon') {
    const order = [];
    await page.locator(`${BOX} button[aria-label="סגירה"]`).focus();
    for (let i = 0; i < 6; i++) {
      order.push(await page.evaluate(() => { const e = document.activeElement; return e.getAttribute('data-tab') || e.getAttribute('data-host') || e.getAttribute('data-engine') && 'parts:' + e.getAttribute('data-engine') || e.getAttribute('aria-label') || e.tagName; }));
      await page.keyboard.press('Tab');
    }
    const want = 'סגירה,goal,atoms,plug,zmanim';
    const ok = order.slice(0, 5).join(',') === want;
    console.log(`  ${ok ? '✅' : '❌'} סדר-פוקוס: ${order.join(' ⇒ ')}`);
    if (!ok) fails++;
  }
  await A('[data-host="bookings"]').click(); await wait(300);
  report('בחר מה להוסיף', await page.evaluate(AUDIT));
  await A('[data-atom="divide"]').click(); await wait(300);
  report('השאלה', await page.evaluate(AUDIT));
  await A('[data-place="bookings.turnover"]').click(); await wait(300);
  report('הפרטים', await page.evaluate(AUDIT));
  await page.locator(`${BOX} .at-sticky button`).first().click();
  await A('[data-made]').waitFor({ timeout: 6000 }).catch(() => {});
  await wait(600);
  report('✨ נוצר מנוע חדש', await page.evaluate(AUDIT));
  await A('[data-tab="goal"]').click(); await wait(300);
  await A('[data-goal-input]').fill('3 לילות פנויים ברצף');
  await A('[data-goal] form button[type=submit]').click(); await wait(500);
  report('🎯 תגיד מה אתה רוצה', await page.evaluate(AUDIT));
  await A('[data-tab="plug"]').click(); await wait(300);
  report('🔌 חבר מנוע מוכן', await page.evaluate(AUDIT));
  await ctx.close();
}
await b.close();
server.close();
if (fails) { console.log(`\n💥 ${fails} בעיות נגישות`); process.exit(1); }
console.log('\n♿ הארגז עובר: ניגודיות AA ב-4 הערכות, שמות לכל הכפתורים, יעדי-מגע 44px, סדר-פוקוס');
