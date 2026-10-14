/**
 * 🧩 ארגז המנועים — מסע אמיתי בדפדפן (ENGINEBOX-B 13.10.2026), 390×844.
 *
 * "הלקוח פותח את הארגז, בוחר, לוחץ חבר — והמוצר באמת משתנה":
 *   0 · דגל חסר ⇒ אין צ׳יפ, ‎#enginebox‎ לא נפתח (אפס שינוי).
 *   1 · ארגון קטן אמיתי (אירוח + פרנסה׳לע): יחידות · שהייה לשבת · שהייה שנכנסת בשבת · תקלה · ניקיון · מדריך (אינסטלטור,
 *       מנקה) · מניינים · מיקום-זמנים. השעון מקובע (רביעי 14.10.2026 12:00 ישראל).
 *   2 · 🧩 ⇒ "אירוח משפחתי" ⇒ "זמני היום והשבת" ⇒ רואים איפה מתחבר ומה יוצא ⇒ "נתק" בכרטיס-השהייה ⇒ פותחים את ההזמנה:
 *       הזמנים נעלמו ⇒ "חבר" ⇒ חזרו.
 *   3 · "📅 הלוח העברי" ⇒ חבר תאריכים עבריים ⇒ ברשימת-ההזמנות רואים תאריך עברי ⇒ חבר שומר-שבת ⇒ ההזמנה שנכנסת בשבת:
 *       "⚠ הכניסה נופלת בשבת · …".
 *   4 · (FINAL) 🎯 "להתחיל מהסוף": מנתקים קודם חיבור אחד של הדרך ⇒ לשונית "🎯 להתחיל מהסוף" ⇒ המשפט של הבעלים ⇒ הדרך
 *       + "בקרוב" הכן ⇒ "חבר את כל הדרך" ⇒ "✓ כבר מחובר" ⇒ "בקשו מהמחולל לבנות אותו" ⇒ טוסט + שורת-לוג.
 *   5 · (FINAL) 📊 בזרימת 3-הצעדים: זמני השבת ⇒ "מה היה קורה בחודש האחרון" עם המספרים האמיתיים של הארגון.
 *   6 · (ATOMS 14.10) 🧬 "מנועים וחלקים" — לשונית-הפתיחה: המנועים ⇒ 🛏️ מנוע ההזמנות ⇒ 13 החלקים ⇒ "יש לך מנוע" ⇒ ✂️ ⇒
 *       "מה לחלק?" (רק המקומות המתאימים, כל אחד עם התוצאה האמיתית) ⇒ חלון הניקיון ⇒ גודל 40 · הפסקה 0 ⇒ "חבר" ⇒ "✨ נוצר מנוע
 *       חדש" עם התורים האמיתיים ⇒ 🔗 "מה לאחד?" ⇒ הלילות ⇒ "פנוי N לילות ברצף" ⇒ 📣 ⇒ משימות הניקיון ⇒ תוכנית-ההסלמה ⇒
 *       השרשראות ⇒ "הסר" בשתי לחיצות. (צעדים 1–5 לוחצים קודם על "🔌 לחבר מנוע" — לשונית-הפתיחה השתנתה.)
 *   9 · (ATOMS-GOAL 14.10) 🎯 "מה אתה רוצה לקבל?": כותבים "תורים של 40 דקות בחלון הניקיון" ⇒ כרטיס עם המשפט במילים והתורים
 *       האמיתיים ⇒ "חבר" ⇒ "✨ נוצר מנוע חדש" ⇒ צ'יפ "3 לילות פנויים ברצף" ⇒ גם שרשרת (2 חלקים) ⇒ "חבר" יוצר את שניהם ⇒
 *       "לחלק" ⇒ שאלה סגורה כצ'יפים ⇒ צ'יפ ⇒ תוצאה ⇒ "השעות הזמניות של היום" ⇒ מחשבון הזמנים. צילומים ⇒ knowledge/shots/atoms-goal-2026-10-14/.
 *   אפס שגיאות קונסולה. צילום PNG לכל צעד ⇒ knowledge/shots/enginebox-2026-10-13/ (1–5) · knowledge/shots/atoms-names-2026-10-14/ (6) (‏≤150KB).
 *
 *   npm run build && node e2e/enginebox-smoke.mjs
 */
import { chromium } from 'playwright-core';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', 'dist');
const OUT = join(HERE, '..', 'knowledge', 'shots', 'enginebox-2026-10-13');
// ATOMS-NAMES 14.10: צילומי המסע עם השמות החדשים (צילומי atoms-2026-10-14 של S4 נשארים כהיסטוריה)
const OUT_ATOMS = join(HERE, '..', 'knowledge', 'shots', 'atoms-names-2026-10-14');
await mkdir(OUT, { recursive: true });
await mkdir(OUT_ATOMS, { recursive: true });
// ATOMS-CHAIN 14.10: מנוע שנוצר חוזר לארגז — המסע של השרשרת
const OUT_CHAIN = join(HERE, '..', 'knowledge', 'shots', 'atoms-chain-2026-10-14');
await mkdir(OUT_CHAIN, { recursive: true });
// ATOMS-GOAL 14.10: "🎯 מה אתה רוצה לקבל?" — להתחיל מהסוף
const OUT_GOAL = join(HERE, '..', 'knowledge', 'shots', 'atoms-goal-2026-10-14');
await mkdir(OUT_GOAL, { recursive: true });
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

let failures = 0;
const T = (name, cond, extra = '') => { console.log(`  ${cond ? '✅' : '❌'} ${name}${!cond && extra ? ' — ' + extra : ''}`); if (!cond) failures++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const MOBILE = { width: 390, height: 844 };
const NOW = new Date('2026-10-14T09:00:00Z'); // רביעי · 12:00 בישראל

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
const CFG = (features) => ({ slug: 'default', orgName: 'צימרי הגליל', theme: 'or-rishon', modules: { parnasa: true, hosting: true }, features, integrations: { whatsapp: { enabled: true } } });

async function open(cfg, seed) {
  const ctx = await b.newContext({ viewport: MOBILE, deviceScaleFactor: 1 });
  // זריעה פעם-בסשן (דגל sessionStorage) — אחרת ה-flush של היציאה דורס אותה ברענון
  await ctx.addInitScript(({ c, dbJson }) => {
    if (sessionStorage.getItem('eb_seeded')) return;
    sessionStorage.setItem('eb_seeded', '1');
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(c));
    localStorage.setItem('maor_day', '2026-10-14');
    if (dbJson) localStorage.setItem('maor_db', dbJson);
  }, { c: cfg, dbJson: seed ? JSON.stringify(seed) : '' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(600);
  return { ctx, page, errors };
}

/** ניווט במובייל: ניווט-תחתון ⇒ (או "עוד" ⇒) המסך. */
async function goView(page, label) {
  await page.evaluate(() => { location.hash = ''; });
  const side = page.locator('.side-link', { hasText: label }).first();
  if (await side.isVisible().catch(() => false)) await side.click();
  else {
    const direct = page.locator('.bottom-nav button', { hasText: label }).first();
    if (await direct.isVisible().catch(() => false)) await direct.click();
    else {
      await page.locator('.bottom-nav button', { hasText: 'עוד' }).first().click().catch(() => {});
      await wait(300);
      await page.locator('[role=dialog] button', { hasText: label }).first().click().catch(() => {});
    }
  }
  await wait(900);
}

const BOX = '[role=dialog][aria-label="🧩 ארגז המנועים"]';
async function shot(page, name, hideBars = true, clip = undefined, dir = OUT) {
  // הסתרת הפס-התחתון הקבוע לצילום בלבד — ומחזירים אותו מיד (הניווט במובייל עובר דרכו)
  if (hideBars) await page.evaluate(() => { const st = document.createElement('style'); st.id = 'eb-shot'; st.textContent = '.bottom-nav{display:none!important}'; document.head.appendChild(st); });
  const path = join(dir, name);
  await page.screenshot({ path, clip });
  if (hideBars) await page.evaluate(() => document.getElementById('eb-shot')?.remove());
  const size = (await stat(path)).size;
  T(`📸 ${name} (${Math.round(size / 1024)}KB ≤ 150KB)`, size <= 150 * 1024);
}
async function openBox(page, tab = 'plug') {
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await page.locator(BOX).waitFor({ timeout: 5000 }).catch(() => {});
  await wait(300);
  if (tab) await plugTab(page, tab);
}
/** ATOMS 14.10: לשונית-הפתיחה היא "🧬 מנועים וחלקים" — הזרימה הישנה לוחצת קודם על "🔌 לחבר מנוע". */
async function plugTab(page, tab = 'plug') {
  const t = page.locator(`${BOX} [data-tab="${tab}"]`).first();
  if (await t.count()) { await t.click(); await wait(250); }
}
async function closeBox(page) {
  await page.keyboard.press('Escape');
  await page.locator(BOX).waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
}
/** 🧩 ⇒ התחלה ⇒ בחירה (עם צעדי-חזרה כשצריך). */
async function boxTo(page, start, pick) {
  await page.locator(`${BOX} [data-start="${start}"]`).first().click();
  await wait(250);
  await page.locator(`${BOX} [data-pick="${pick}"]`).first().click();
  await wait(300);
}
const opt = (page, key) => page.locator(`${BOX} [data-option="${key}"]`);
async function hostTab(page, label) {
  await page.locator('.hst-root button.h-tab', { hasText: label }).first().click();
  await wait(400);
}
const card = (page, who) => page.locator('.hst-root .h-crmc', { hasText: who }).first();
const hostModal = (page) => page.locator('.hst-portal .h-modal').last();
async function openBooking(page, who) {
  await hostTab(page, 'הזמנות');
  await card(page, who).click();
  await hostModal(page).waitFor({ timeout: 4000 }).catch(() => {});
  await wait(500);
}
async function closeHostModal(page) {
  await page.keyboard.press('Escape');
  await wait(300);
}

console.log('🧩 ארגז המנועים — מסע אמיתי');

// 0 · דגל חסר ⇒ אפס שינוי
{
  const { ctx, page, errors } = await open(CFG({ 'shell.demodrop': false }), null);
  await goView(page, 'הגדרות');
  T('דגל חסר: מסך ההגדרות נפתח', ((await page.locator('body').textContent()) ?? '').includes('ניהול המערכת'));
  T('דגל חסר: אין צ׳יפ בהגדרות', (await page.locator('text=🧩 ארגז המנועים').count()) === 0);
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await wait(700);
  T('דגל חסר: ‎#enginebox‎ לא פותח מסך', (await page.locator(BOX).count()) === 0);
  T('דגל חסר: אפס שגיאות קונסולה', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// 1–3 · המסע
{
  const { ctx, page, errors } = await open(CFG({ 'shell.enginebox': true, 'shell.demodrop': false }), SEED_DB);
  const STAY = 'pr.zmanim>times.shabbat>host.stay';

  // 1 · פותחים את הארגז מהצ׳יפ בהגדרות
  await goView(page, 'הגדרות');
  const chip = page.locator('text=🧩 ארגז המנועים').first();
  T('הצ׳יפ "🧩 ארגז המנועים" בהגדרות', (await chip.count()) > 0);
  await chip.click().catch(() => {});
  await page.locator(BOX).waitFor({ timeout: 5000 }).catch(() => {});
  await wait(300);
  T('לשונית-הפתיחה: "🧬 מנועים וחלקים"', (await page.locator(`${BOX} [data-tab="atoms"][aria-selected="true"]`).count()) === 1);
  await plugTab(page);
  const boxTxt = (await page.locator(BOX).textContent().catch(() => '')) ?? '';
  T('הארגז נפתח עם מוצרים אמיתיים (לא "בהרכבה")', boxTxt.includes('אירוח משפחתי') && boxTxt.includes('פרנסה׳לע') && !boxTxt.includes('הארגז בהרכבה'));
  T('אין גלילה אופקית ב-390px', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await shot(page, '01-box-start.png');

  // 2 · מתחילים מ"אירוח משפחתי" ⇒ גריד המנועים
  await page.locator(`${BOX} [data-start="hosting"]`).first().click();
  await wait(300);
  const pickTxt = (await page.locator(BOX).textContent()) ?? '';
  T('צעד 2: "איזה מנוע להוסיף?" — זמני השבת והלוח העברי בארגז, בלי מנועי-האירוח', pickTxt.includes('איזה מנוע להוסיף') && pickTxt.includes('זמני היום והשבת') && pickTxt.includes('הלוח העברי') && (await page.locator(`${BOX} [data-pick="host.stay"]`).count()) === 0);
  T('הכותרת: "11 חיבורים עכשיו"', pickTxt.includes('11 חיבורים עכשיו'), pickTxt.slice(0, 120));
  await shot(page, '02-box-pick.png');

  // 3 · בוחרים "זמני היום והשבת" ⇒ איפה מתחבר ומה יוצא
  await page.locator(`${BOX} [data-pick="pr.zmanim"]`).first().click();
  await wait(300);
  const plugTxt = (await page.locator(BOX).textContent()) ?? '';
  T('צעד 3: שלושה מקומות-חיבור — כרטיס השהייה · לשונית שבת · לוח הבקרה', (await page.locator(`${BOX} [data-option]`).count()) === 3 && plugTxt.includes('כרטיס השהייה') && plugTxt.includes('לשונית שבת') && plugTxt.includes('לוח הבקרה'));
  T('התוצאה כתובה: "🕯️ שבת בשהייה" בכרטיס ההזמנה', plugTxt.includes('"🕯️ שבת בשהייה"'));
  T('כולם "✓ מחובר" (ברירת-המחדל = החיווט של היום)', (await page.locator(`${BOX} .eb-option.eb-linked`).count()) === 3);
  await shot(page, '03-box-plug-zmanim.png');

  // 4 · "נתק" בכרטיס-השהייה
  await opt(page, STAY).locator('button', { hasText: 'נתק' }).click();
  await wait(500);
  T('נתק ⇒ השורה עוברת ל"חבר"', (await opt(page, STAY).locator('button', { hasText: 'חבר' }).count()) === 1);
  T('הכותרת: "10 חיבורים עכשיו"', ((await page.locator(BOX).textContent()) ?? '').includes('10 חיבורים עכשיו'));
  await shot(page, '04-box-disconnected.png');
  await closeBox(page);

  // 5 · פותחים את ההזמנה של לוי (שישי ⇒ ראשון): הזמנים נעלמו, הטופס עובד
  await goView(page, 'אירוח משפחתי');
  await openBooking(page, 'משפחת לוי');
  T('אחרי ניתוק: בכרטיס ההזמנה אין "🕯️ שבת בשהייה"', (await page.locator('.hst-portal [data-switch="stay-shabbat"]').count()) === 0 && (await hostModal(page).count()) === 1);
  await shot(page, '05-stay-without-times.png');
  await closeHostModal(page);

  // 6 · חוזרים לארגז ⇒ "חבר" ⇒ הזמנים חזרו
  await openBox(page);
  await boxTo(page, 'hosting', 'pr.zmanim');
  await opt(page, STAY).locator('button', { hasText: 'חבר' }).click();
  await wait(500);
  T('חבר ⇒ "✓ מחובר" שוב', (await opt(page, STAY).locator('.eb-on').count()) === 1);
  await closeBox(page);
  await openBooking(page, 'משפחת לוי');
  const stayTxt = (await page.locator('.hst-portal [data-switch="stay-shabbat"]').textContent().catch(() => '')) ?? '';
  T('אחרי חיבור: "🕯️ שבת בשהייה" עם הדלקת נרות וצאת השבת', /שבת בשהייה/.test(stayTxt) && /הדלקת נרות/.test(stayTxt) && /צאת השבת/.test(stayTxt), stayTxt.slice(0, 100));
  await shot(page, '06-stay-times-back.png');
  await closeHostModal(page);

  // 7 · "📅 הלוח העברי" ⇒ חבר תאריכים עבריים לרשימת ההזמנות
  await openBox(page);
  await boxTo(page, 'hosting', 'orbit.calendar');
  const calTxt = (await page.locator(BOX).textContent()) ?? '';
  T('הלוח העברי: שני מקומות-חיבור, מנותקים (שומר-שבת · תאריך עברי ברשימה)', (await page.locator(`${BOX} [data-option]`).count()) === 2 && (await page.locator(`${BOX} .eb-option.eb-linked`).count()) === 0 && calTxt.includes('רשימת ההזמנות'));
  await shot(page, '07-box-calendar.png');
  await opt(page, 'orbit.calendar>date.hebrew>host.bookings').locator('button', { hasText: 'חבר' }).click();
  await wait(500);
  T('תאריכים עבריים ⇒ "✓ מחובר"', (await opt(page, 'orbit.calendar>date.hebrew>host.bookings').locator('.eb-on').count()) === 1);
  await closeBox(page);
  await hostTab(page, 'הזמנות');
  await page.locator('.hst-root [data-switch="stay-hebdates"]').first().waitFor({ timeout: 5000 }).catch(() => {});
  const heb = (await page.locator('.hst-root [data-switch="stay-hebdates"]').allTextContents()).join(' | ');
  T('רשימת ההזמנות: תאריך עברי ליד כל שהייה (ה׳–ז׳ חשוון · ו׳–ח׳ חשוון)', heb.includes('ה׳–ז׳ חשוון') && heb.includes('ו׳–ח׳ חשוון'), heb);
  // הכרטיסים עצמם (רשימה צפופה ⇒ חיתוך לאזור-הרשימה, כדי להישאר ≤150KB)
  await page.locator('.hst-root [data-switch="stay-hebdates"]').first().evaluate((el) => el.closest('.h-crmc')?.scrollIntoView({ block: 'start' }));
  await wait(200);
  await shot(page, '08-bookings-hebrew-dates.png', true, { x: 0, y: 0, width: 390, height: 640 });

  // 8 · חבר שומר-שבת ⇒ ההזמנה שנכנסת בשבת מזהירה עם התאריך העברי
  await openBox(page);
  await boxTo(page, 'hosting', 'orbit.calendar');
  await opt(page, 'orbit.calendar>times.blocked>host.stay').locator('button', { hasText: 'חבר' }).click();
  await wait(500);
  T('שומר-שבת ⇒ "✓ מחובר"', (await opt(page, 'orbit.calendar>times.blocked>host.stay').locator('.eb-on').count()) === 1);
  await shot(page, '09-box-guard-connected.png');
  await closeBox(page);
  await openBooking(page, 'משפחת שפירא');
  const guard = (await page.locator('.hst-portal [data-switch="shabbat-guard"]').textContent().catch(() => '')) ?? '';
  T('ההזמנה שנכנסת בשבת: "⚠ הכניסה נופלת בשבת · ו׳ חשוון"', guard.includes('⚠ הכניסה נופלת בשבת · ו׳ חשוון'), guard);
  await shot(page, '10-booking-shabbat-guard.png');
  await closeHostModal(page);

  // לוג-הפעולות: שורה לכל שינוי
  const audit = await page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).map((a) => a.act + ': ' + a.what));
  T('לוג-הפעולות: 4 שורות (ניתוק · חיבור · חיבור · חיבור)', audit.filter((a) => a.startsWith('ניתוק מנוע')).length === 1 && audit.filter((a) => a.startsWith('חיבור מנוע')).length === 3, audit.join(' | '));

  // ───────── 4 · (FINAL) 🎯 להתחיל מהסוף ─────────
  const OWNER = 'אני רוצה שאורחים יוכלו להזמין שבת גם מטלפון כשר';
  // מנתקים קודם חיבור אחד של הדרך (זמני השבת ⇒ כרטיס השהייה), כדי שהדרך תציע "חבר את כל הדרך"
  await openBox(page);
  await boxTo(page, 'hosting', 'pr.zmanim');
  await opt(page, STAY).locator('button', { hasText: 'נתק' }).click();
  await wait(500);
  T('לפני המטרה: ניתקנו חיבור של הדרך (זמני השבת ⇒ כרטיס השהייה)', (await opt(page, STAY).locator('button', { hasText: 'חבר' }).count()) === 1);
  T('הלשוניות: "🔌 לחבר מנוע" · "🎯 להתחיל מהסוף"', (await page.locator(`${BOX} [data-tab="plug"]`).count()) === 1 && (await page.locator(`${BOX} [data-tab="goal"]`).count()) === 1);
  await page.locator(`${BOX} [data-tab="goal"]`).click();
  await wait(300);
  await page.locator(`${BOX} #eg-goal-text`).fill(OWNER);
  await page.locator(`${BOX} .eg-route`).first().waitFor({ timeout: 5000 }).catch(() => {});
  await wait(300);
  const goalTxt = (await page.locator(BOX).textContent()) ?? '';
  T('המטרה: "מתחילים מ: אירוח משפחתי" + מה הובן (להזמין · שבת · מטלפון כשר)', goalTxt.includes('מתחילים מ:') && goalTxt.includes('להזמין · הזמנה') && goalTxt.includes('מטלפון כשר · שלוחה בקו'), goalTxt.slice(0, 160));
  T('הדרך: צעדים ממוספרים — הקו מקבל מקום פנוי מהיחידות', (await page.locator(`${BOX} .eg-route .eg-step`).count()) >= 3 && goalTxt.includes('📞 הקו (טלפון כשר) מקבל מקום פנוי מ-🛏️ יחידות ותפוסה'));
  T('החסר הכן: "הזמנה עוד לא זמין · בקרוב" · "שלוחה בקו עוד לא זמין · בקרוב"', goalTxt.includes('הזמנה עוד לא זמין · בקרוב') && goalTxt.includes('שלוחה בקו עוד לא זמין · בקרוב'));
  const applyBtn = page.locator(`${BOX} .eg-route button`, { hasText: 'חבר את כל הדרך' }).first();
  T('הדרך מציעה "חבר את כל הדרך"', (await applyBtn.count()) === 1);
  T('אין גלילה אופקית ב-390px (לשונית המטרה)', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await page.locator(`${BOX} .eg-route`).first().scrollIntoViewIfNeeded();
  await shot(page, '11-goal-route.png');
  const linkedBefore = (await page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).filter((a) => a.act === 'חיבור מנוע').length));
  await applyBtn.click();
  await page.locator(`${BOX} .eg-on`).first().waitFor({ timeout: 5000 }).catch(() => {});
  await wait(700);
  T('אחרי "חבר את כל הדרך": "✓ כבר מחובר"', (await page.locator(`${BOX} .eg-route .eg-on`, { hasText: '✓ כבר מחובר' }).count()) === 1 && (await page.locator(`${BOX} .eg-route button`, { hasText: 'חבר את כל הדרך' }).count()) === 0);
  const applyToast = (await page.locator('.toasts').textContent().catch(() => '')) ?? '';
  T('טוסט אחד: "הדרך מחוברת ✓"', applyToast.includes('הדרך מחוברת ✓'), applyToast);
  await shot(page, '12-goal-applied.png');
  const linkedAfter = (await page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).filter((a) => a.act === 'חיבור מנוע').length));
  T('לוג-הפעולות: שורת "חיבור מנוע" לכל חיבור שנוסף (לפחות 2 — כולל זה שניתקנו)', linkedAfter - linkedBefore >= 2, linkedBefore + '⇒' + linkedAfter);
  const reqBtn = page.locator(`${BOX} .eg-missing button`, { hasText: 'בקשו מהמחולל לבנות אותו' }).last();
  await reqBtn.scrollIntoViewIfNeeded();
  await reqBtn.click();
  await wait(600);
  const reqToast = (await page.locator('.toasts').textContent().catch(() => '')) ?? '';
  T('"בקשו מהמחולל" ⇒ טוסט "הבקשה נרשמה בלוג הפעולות"', reqToast.includes('הבקשה נרשמה בלוג הפעולות'), reqToast);
  await shot(page, '13-goal-request.png');
  const reqLines = await page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).filter((a) => a.act === 'בקשה למנוע חדש').map((a) => a.what));
  T('לוג-הפעולות: "בקשה למנוע חדש: שלוחה בקו — «…»"', reqLines.length === 1 && reqLines[0] === 'שלוחה בקו — «' + OWNER + '»', reqLines.join(' | '));

  // ───────── 5 · (FINAL) 📊 מה היה קורה בחודש האחרון ─────────
  // חזרה ללשונית החיבור — המסך זוכר את ההתחלה ואת המנוע שנבחר; בוחרים מחדש את זמני השבת במפורש
  await page.locator(`${BOX} [data-tab="plug"]`).click();
  await wait(300);
  if ((await page.locator(`${BOX} [data-pick="pr.zmanim"]`).count()) === 0) {
    await page.locator(`${BOX} .eb-head button`, { hasText: 'מנוע אחר' }).click();
    await wait(300);
  }
  await page.locator(`${BOX} [data-pick="pr.zmanim"]`).first().click();
  await page.locator(`${BOX} [data-impact="${STAY}"]`).waitFor({ timeout: 5000 }).catch(() => {});
  await wait(500);
  const imp = (await page.locator(`${BOX} [data-impact="${STAY}"]`).textContent().catch(() => '')) ?? '';
  T('📊 "מה היה קורה בחודש האחרון" מתחת לכרטיס השהייה', imp.includes('📊 מה היה קורה בחודש האחרון'), imp);
  T('המספרים האמיתיים: "ב-30 הימים האחרונים היו 2 הזמנות עם שבת"', imp.includes('ב-30 הימים האחרונים היו 2 הזמנות עם שבת'), imp);
  T('דוגמאות לפי יחידה ותאריך — בלי שם אורח', imp.includes('צימר הגפן') && !imp.includes('משפחת כהן') && !imp.includes('משפחת לוי'), imp);
  T('השורה קטנה מהתוצאה', await page.evaluate((k) => {
    const row = document.querySelector(`[data-option="${k}"]`);
    const r = row?.querySelector('.eb-result');
    const t = row?.querySelector('.eb-impact-text');
    return !!r && !!t && parseFloat(getComputedStyle(t).fontSize) < parseFloat(getComputedStyle(r).fontSize);
  }, STAY));
  await page.locator(`${BOX} [data-impact="${STAY}"]`).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('.toast').length === 0, null, { timeout: 8000 }).catch(() => {});
  await shot(page, '14-impact-shabbat.png');
  await closeBox(page);

  T('אפס שגיאות קונסולה במסע', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ───────── 6 · (ATOMS 14.10) 🧬 מנועים וחלקים — הזרימה של הבעלים ─────────
{
  const { ctx, page, errors } = await open(CFG({ 'shell.enginebox': true, 'shell.demodrop': false }), SEED_DB);
  const A = (sel) => page.locator(`${BOX} ${sel}`);
  const boxText = async () => (await page.locator(BOX).textContent().catch(() => '')) ?? '';
  const ashot = (name, clip) => shot(page, name, true, clip, OUT_ATOMS);
  const auditOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).map((a) => a.act + ': ' + a.what));
  const capsOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').ui || {}).capabilities || []);
  /** אחרי "חבר": מחכים לכרטיס "✨ נוצר מנוע חדש" (הכתיבה עצלה — import() ואז ה-store). */
  const waitMade = async () => { await A('[data-made]').first().waitFor({ timeout: 6000 }).catch(() => {}); await wait(400); };
  const flushToasts = () => page.waitForFunction(() => document.querySelectorAll('.toast').length === 0, null, { timeout: 8000 }).catch(() => {});

  // 6.1 · 🧩 נפתח על "מנועים וחלקים" ⇒ המנועים
  await openBox(page, null);
  await A('[data-atoms="engines"]').waitFor({ timeout: 6000 }).catch(() => {});
  T('🧬 לשונית-הפתיחה = "מנועים וחלקים", עם המנועים האמיתיים (לא "בהרכבה")', (await A('[data-tab="atoms"][aria-selected="true"]').count()) === 1 && (await A('[data-engine]').count()) === 3 && !(await boxText()).includes('בהרכבה'));
  T('🧬 אין גלילה אופקית ב-390px', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  // ATOMS-NAMES · השם אומר מה המנוע עושה, משפט אחד, ודוגמה "קלט ← תוצאה" — בלי מילים טכניות
  const engNames = await A('[data-engine] .at-name').allTextContents();
  T('🔤 שמות המנועים: מחשבון הזמנים · מבין בקשות · מנהל ההזמנות', engNames.join('|') === 'מחשבון הזמנים|מבין בקשות|מנהל ההזמנות', engNames.join('|'));
  T('🔤 לכל מנוע דוגמה גלויה עם "←" ו"עוד דוגמאות"', (await A('[data-engine] + [data-examples] .at-ex-arrow').count()) >= 3 && (await A('[data-engine] + [data-examples] summary').count()) === 3);
  await ashot('01-engines.png');

  // 6.2 · 🛏️ מנהל ההזמנות ⇒ 13 החלקים
  await A('[data-engine="bookings"]').click();
  await wait(300);
  T('🛏️ מנהל ההזמנות נפתח ⇒ 13 חלקים ממוספרים', (await A('[data-parts="bookings"] li').count()) === 13);
  const partNames = await A('[data-parts="bookings"] .at-part-name').allTextContents();
  T('🔤 החלקים הפנימיים בשפה פשוטה: "סופר לילות בין שני תאריכים", "בודק מה פנוי"', partNames.some((t) => t.includes('סופר לילות בין שני תאריכים')) && partNames.some((t) => t.includes('בודק מה פנוי')), partNames.slice(0, 3).join('|'));
  await A('[data-parts="bookings"]').scrollIntoViewIfNeeded();
  await ashot('02-bookings-parts.png');
  await A('[data-engine="bookings"]').click();
  await wait(200);

  // 6.3 · "יש לך מנוע" ⇒ ההזמנות ⇒ גריד החלקים + השרשראות
  await A('[data-host="bookings"]').click();
  await wait(300);
  T('"איזה חלק לחבר אל 🛏️ מנהל ההזמנות?" — 8 חלקים', (await boxText()).includes('איזה חלק לחבר אל 🛏️ מנהל ההזמנות') && (await A('[data-atom]').count()) === 8);
  const atomNames = await A('[data-atom] .at-name').allTextContents();
  const BANNED = ['מיזוג', 'ניתוב', 'הסלמה', 'סלחני', 'יחסי', 'אטום', 'רצף', 'טווח'];
  T('🔤 שמות החלקים בלי מילים טכניות', atomNames.length === 8 && atomNames.every((n) => !BANNED.some((w) => n.includes(w))), atomNames.join('|'));
  T('🔤 "✂️ מחלק לחלקים שווים" — "8:00 עד 16:00, ל-8 חלקים ← 8 תורים של שעה"', atomNames[0] === 'מחלק לחלקים שווים' && ((await A('[data-examples="divide"]').textContent()) ?? '').includes('8 תורים של שעה'));
  await ashot('03-pick-atom.png');
  // "עוד דוגמאות" נפתח במקום — שלוש הדוגמאות של "מוצא גם עם טעות כתיב"
  await A('[data-examples="fuzzy"] summary').scrollIntoViewIfNeeded();
  await A('[data-examples="fuzzy"] summary').click();
  await wait(200);
  T('🔤 "עוד דוגמאות" ⇒ 3 דוגמאות גלויות', (await A('[data-examples="fuzzy"] .at-ex:visible').count()) === 3);
  T('🧬 אין גלילה אופקית עם הדוגמאות פתוחות', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await ashot('03b-more-examples.png');
  await A('[data-examples="fuzzy"] summary').click();

  // 6.4 · ✂️ ⇒ "מה לחלק?" — רק המקומות מהסוג, כל אחד עם התוצאה האמיתית
  await A('[data-atom="divide"]').click();
  await A('.at-question').waitFor({ timeout: 4000 }).catch(() => {});
  await wait(300);
  const q = (await A('.at-question').textContent().catch(() => '')) ?? '';
  const places = await A('[data-place]').evaluateAll((els) => els.map((e) => e.getAttribute('data-place')));
  T('השאלה הגדולה: "מה לחלק?"', q.trim() === 'מה לחלק?', q);
  const asks = (await A('.at-asks').textContent().catch(() => '')) ?? '';
  T('🔤 "✂️ מחלק לחלקים שווים שואל:"', asks.trim() === '✂️ מחלק לחלקים שווים שואל:', asks);
  T('רק המקומות המתאימים (מ… עד… / סכום): 6, בלי הלילות', places.length === 6 && places.includes('bookings.turnover') && places.includes('bookings.balance') && !places.includes('bookings.nights'), places.join(','));
  const turnRow = (await A('[data-place="bookings.turnover"]').textContent()) ?? '';
  const balRow = (await A('[data-place="bookings.balance"]').textContent()) ?? '';
  T('ליד חלון הניקיון — התוצאה האמיתית: "חלון הניקיון 11:00–15:00 · 12 תורים" עם המנקות', turnRow.includes('חלון הניקיון 11:00–15:00 · 12 תורים') && turnRow.includes('11:00–11:20 · דנה'), turnRow);
  T('ליד היתרה — "₪1,200 = 12 × ₪100"', balRow.includes('צימר הגפן · ₪1,200 = 12 × ₪100'), balRow);
  await ashot('04-what-to-divide.png');

  // 6.5 · חלון הניקיון ⇒ הפרטים: לפי גודל · 40 · הפסקה 0 ⇒ "חבר"
  await A('[data-place="bookings.turnover"]').click();
  await wait(300);
  await A('[data-choice="by:size"]').click();
  await A('[data-detail="size"]').fill('40');
  await A('[data-detail="gap"]').fill('0');
  await wait(250);
  const live = (await A('[data-preview="real"]').first().textContent().catch(() => '')) ?? '';
  T('בטופס — התוצאה מתעדכנת: "6 תורים"', live.includes('חלון הניקיון 11:00–15:00 · 6 תורים'), live);
  await A('.at-actions button', { hasText: 'חבר' }).first().scrollIntoViewIfNeeded();
  await ashot('05-details.png');
  await A('.at-actions button').filter({ hasText: 'חבר' }).first().click();
  await waitMade();
  const made1 = (await A('[data-made]').textContent().catch(() => '')) ?? '';
  T('"✨ נוצר מנוע חדש: מנוע תורים"', made1.includes('✨ נוצר מנוע חדש: מנוע תורים'), made1.slice(0, 80));
  T('עם התורים האמיתיים: 11:00–11:40 · דנה … 14:20–15:00 · רבקה · 6 תורים', made1.includes('6 תורים') && made1.includes('11:00–11:40 · דנה') && made1.includes('14:20–15:00 · רבקה'), made1);
  T('"המנועים שיצרת" — מנוע תורים', (await A('[data-capability="bookings:bookings.turnover:divide"]').count()) === 1);
  await flushToasts();
  await ashot('06-new-engine-turns.png');

  // 6.6 · 🔗 מחבר דברים צמודים ⇒ "מה לאחד?" ⇒ הלילות ⇒ "חבר" ⇒ "פנוי N לילות ברצף"
  await A('.at-head button').first().click(); // → עוד חלק
  await wait(300);
  await A('[data-atom="merge"]').click();
  await wait(300);
  const q2 = (await A('.at-question').textContent().catch(() => '')) ?? '';
  T('🔗 השאלה: "מה לאחד?" — והלילות ביניהן', q2.trim() === 'מה לאחד?' && (await A('[data-place="bookings.nights"]').count()) === 1, q2);
  await A('[data-place="bookings.nights"]').click();
  await wait(300);
  await A('.at-actions button').filter({ hasText: 'חבר' }).first().click();
  await waitMade();
  const made2 = (await A('[data-made]').textContent().catch(() => '')) ?? '';
  T('"✨ נוצר מנוע חדש: מנוע לילות פנויים צמודים" — "צימר הגפן · פנוי 2 לילות ברצף מ-14/10"', made2.includes('מנוע לילות פנויים צמודים') && made2.includes('צימר הגפן · פנוי 2 לילות ברצף מ-14/10') && /פנוי \d+ לילות ברצף/.test(made2), made2);
  await flushToasts();
  await ashot('07-new-engine-free-nights.png');

  // 6.7 · 📣 מעביר הלאה כשאין תשובה ⇒ משימות הניקיון ⇒ תוכנית ההסלמה האמיתית
  await A('.at-head button').first().click();
  await wait(300);
  await A('[data-atom="escalate"]').click();
  await wait(300);
  const q3 = (await A('.at-question').textContent().catch(() => '')) ?? '';
  T('📣 השאלה: "מה להעביר הלאה כשאין תשובה?"', q3.trim() === 'מה להעביר הלאה כשאין תשובה?', q3);
  await A('[data-place="bookings.cleaning"]').click();
  await wait(300);
  await A('.at-actions button').filter({ hasText: 'חבר' }).first().click();
  await waitMade();
  const made3 = (await A('[data-made]').textContent().catch(() => '')) ?? '';
  T('תוכנית ההעברה הלאה: "משימת ניקיון · דירת הנחל — עכשיו אצל דנה · אם אין אישור עד 14:00 ⇒ רבקה"', made3.includes('משימת ניקיון · דירת הנחל — עכשיו אצל דנה · אם אין אישור עד 14:00 ⇒ רבקה'), made3);
  await flushToasts();
  await ashot('08-new-engine-escalation.png');

  // 6.8 · השרשראות
  await A('.at-head button').first().click();
  await wait(300);
  await A('.at-chains').scrollIntoViewIfNeeded();
  const chains = (await A('.at-chains').textContent().catch(() => '')) ?? '';
  T('השרשראות: תורים באורך משתנה · החלון הפנוי הבא של N לילות · חלוקה הוגנת של הזמן הפנוי', chains.includes('תורים באורך משתנה') && /החלון הפנוי הבא של \d+ לילות/.test(chains) && chains.includes('חלוקה הוגנת של הזמן הפנוי'), chains.slice(0, 160));
  T('שורה מחושבת: "צימר הגפן · 3 לילות פנויים ברצף מ-18/10"', chains.includes('צימר הגפן · 3 לילות פנויים ברצף מ-18/10'), chains);
  T('תורים באורך משתנה לוקחים את מה שנבחר (משבצות של 40)', chains.includes('6 משבצות של 40 דקות בחלון 11:00–15:00'), chains);
  await ashot('09-chains.png');

  // 6.9 · "הסר" בשתי לחיצות
  const capsBefore = await capsOf();
  const rm = A('[data-capability="bookings:bookings.cleaning:escalate"] button');
  await rm.scrollIntoViewIfNeeded();
  await rm.click();
  await wait(200);
  T('לחיצה ראשונה ⇒ "בטוח? לחצו שוב" (עדיין לא הוסר)', ((await rm.textContent()) ?? '').includes('בטוח? לחצו שוב') && (await capsOf()).length === capsBefore.length);
  await ashot('10-remove-armed.png');
  await rm.click();
  await page.waitForFunction(() => !document.querySelector('[data-capability="bookings:bookings.cleaning:escalate"]'), null, { timeout: 5000 }).catch(() => {});
  await wait(1000); // השמירה ל-localStorage ב-debounce של 500ms
  const capsAfter = await capsOf();
  T('לחיצה שנייה ⇒ הוסר (3 ⇒ 2 ב-db.ui.capabilities)', capsBefore.length === 3 && capsAfter.length === 2 && !capsAfter.some((c) => c.atom === 'escalate'), capsBefore.length + '⇒' + capsAfter.length);
  const audit = await auditOf();
  T('לוג-הפעולות: "מנוע חדש: מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)"', audit.includes('מנוע חדש: מנוע תורים (מנהל ההזמנות · חלון הניקיון · ✂️ חלוקה)'), audit.join(' | '));
  T('לוג-הפעולות: 3 × "מנוע חדש" + "הסרת מנוע"', audit.filter((a) => a.startsWith('מנוע חדש')).length === 3 && audit.filter((a) => a.startsWith('הסרת מנוע: מנוע העברת ניקיון')).length === 1, audit.join(' | '));

  // 6.10 · נשמר: סוגרים ופותחים — המנועים שנוצרו עדיין שם
  await closeBox(page);
  await openBox(page, null);
  await A('[data-host="bookings"]').waitFor({ timeout: 6000 }).catch(() => {});
  T('אחרי סגירה ופתיחה: "המנועים שיצרת" — 2', (await A('[data-capability]').count()) === 2);
  await closeBox(page);

  T('🧬 אפס שגיאות קונסולה', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ───────── 8 · (ATOMS-PREVIEWS, מוזג) תוצאות אמיתיות גם במחשבון הזמנים ובמבין בקשות ─────────
{
  const { ctx, page, errors } = await open(CFG({ 'shell.enginebox': true, 'shell.demodrop': false }), SEED_DB);
  const A = (sel) => page.locator(`${BOX} ${sel}`);
  const pshot = (name) => shot(page, name, true, undefined, OUT_CHAIN);
  await openBox(page, null);
  await A('[data-host="zmanim"]').waitFor({ timeout: 6000 }).catch(() => {});
  // (א) 🕯️ ⇒ ✂️ ⇒ "היום מהנץ עד השקיעה" עם השעה הזמנית האמיתית
  await A('[data-host="zmanim"]').click();
  await wait(250);
  await A('[data-atom="divide"]').click();
  await A('.at-question').waitFor({ timeout: 4000 }).catch(() => {});
  await wait(300);
  const dayRow = (await A('[data-place="zmanim.day"]').textContent().catch(() => '')) ?? '';
  T('🕯️ (א) מחשבון הזמנים · ✂️ — ליד "היום" תוצאה אמיתית: "שעה זמנית היום = …"', (await A('[data-place="zmanim.day"] [data-preview="real"]').count()) === 1 && dayRow.includes('שעה זמנית היום'), dayRow);
  await A('[data-place="zmanim.day"]').scrollIntoViewIfNeeded();
  await pshot('09-zmanim-real.png');
  // (ב) 🙋 ⇒ 🔍 ⇒ שמות העסקים — תוצאה אמיתית מהמדריך
  await A('.at-head button').first().click(); await wait(200);
  await A('.at-head button').first().click(); await wait(250);
  await A('[data-host="whatNeed"]').click();
  await wait(250);
  await A('[data-atom="fuzzy"]').click();
  await A('.at-question').waitFor({ timeout: 4000 }).catch(() => {});
  await wait(300);
  const reals = await A('[data-place] [data-preview="real"]').allTextContents();
  T('🙋 (ב) מבין בקשות · 🔍 — לפחות מקום אחד עם תוצאה אמיתית מהנתונים', reals.length >= 1 && reals.every((t) => t.trim().length > 0), reals.join(' | ').slice(0, 200));
  T('🙋 בלי שמות אורחים בתוצאות', !reals.join(' ').includes('משפחת לוי') && !reals.join(' ').includes('משפחת שפירא'));
  await pshot('10-whatneed-real.png');
  await closeBox(page);
  T('🕯️🙋 אפס שגיאות קונסולה', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ───────── 7 · (ATOMS-CHAIN 14.10) ✨ מנוע שנוצר חוזר לארגז — בונים עליו ─────────
{
  const { ctx, page, errors } = await open(CFG({ 'shell.enginebox': true, 'shell.demodrop': false }), SEED_DB);
  const A = (sel) => page.locator(`${BOX} ${sel}`);
  const boxText = async () => (await page.locator(BOX).textContent().catch(() => '')) ?? '';
  const cshot = (name, clip) => shot(page, name, true, clip, OUT_CHAIN);
  const auditOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).map((a) => a.act + ': ' + a.what));
  const capsOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').ui || {}).capabilities || []);
  const waitMade = async () => { await A('[data-made]').first().waitFor({ timeout: 6000 }).catch(() => {}); await wait(400); };
  const flushToasts = () => page.waitForFunction(() => document.querySelectorAll('.toast').length === 0, null, { timeout: 8000 }).catch(() => {});
  const backTo = async (step) => {
    for (let i = 0; i < 5 && !(await A(`[data-atoms="${step}"]`).count()); i++) { await A('.at-head button').first().click().catch(() => {}); await wait(250); }
  };
  const TURNS = 'bookings:bookings.turnover:divide';
  const VAR = TURNS + '>merge';
  const ROW = (id) => A(`[data-capability="${id}"]`);
  const rmBtn = (name) => A(`button[title="הסר: ${name}"]`);

  // 7.1 · יוצרים "מנוע תורים" כמו היום
  await openBox(page, null);
  await A('[data-host="bookings"]').waitFor({ timeout: 6000 }).catch(() => {});
  await A('[data-host="bookings"]').click();
  await wait(250);
  await A('[data-atom="divide"]').click();
  await wait(250);
  await A('[data-place="bookings.turnover"]').click();
  await wait(250);
  await A('[data-choice="by:size"]').click();
  await A('[data-detail="size"]').fill('40');
  await A('[data-detail="gap"]').fill('0');
  await wait(200);
  await A('.at-actions button').filter({ hasText: 'חבר' }).first().click();
  await waitMade();
  T('✨ 7.1 "מנוע תורים" נוצר כמו היום', ((await A('[data-made]').textContent().catch(() => '')) ?? '').includes('✨ נוצר מנוע חדש: מנוע תורים'));
  await flushToasts();

  // 7.2 · פותחים את "✨ מנוע תורים" מהארגז — כרטיס בגריד המנועים
  await backTo('engines');
  const capCard = A(`[data-host-cap="${TURNS}"]`);
  T('✨ 7.2 בגריד המנועים יש כרטיס "✨ מנוע תורים"', (await capCard.count()) === 1 && ((await capCard.textContent()) ?? '').includes('מנוע תורים'));
  await capCard.scrollIntoViewIfNeeded();
  await cshot('01-created-engine-in-box.png');
  await capCard.click();
  await wait(300);
  const offered = await A('[data-atom]').evaluateAll((els) => els.map((e) => e.getAttribute('data-atom')));
  T('✨ "איזה חלק לחבר אל ✨ מנוע תורים?" — רק מה שמתחבר לתורים: 🔗 ⏭️ 🔄', (await boxText()).includes('איזה חלק לחבר אל ✨ מנוע תורים?') && offered.join(',') === 'merge,next,rotate', offered.join(','));
  T('✨ אין גלילה אופקית ב-390px', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await cshot('02-pick-on-created.png');

  // 7.3 · 🔗 ⇒ המקום היחיד, עם התורים באורך משתנה האמיתיים
  await A('[data-atom="merge"]').click();
  await A('.at-question').waitFor({ timeout: 4000 }).catch(() => {});
  await wait(250);
  const outRow = (await A(`[data-place="out:${TURNS}"]`).textContent().catch(() => '')) ?? '';
  T('✨ 7.3 מקום אחד: "התורים של מנוע תורים"', (await A('[data-place]').count()) === 1 && outRow.includes('התורים של מנוע תורים'), outRow);
  T('✨ התוצאה האמיתית: "6 תורים של 40 דקות" · "תור של 2 צמודים = 80 דקות · 11:00–12:20"', outRow.includes('6 תורים של 40 דקות בחלון 11:00–15:00') && outRow.includes('תור של 2 צמודים = 80 דקות · 11:00–12:20'), outRow);
  await cshot('03-variable-length.png');
  await A(`[data-place="out:${TURNS}"]`).click();
  await wait(250);

  // 7.4 · "חבר" ⇒ מנוע מהדור השני
  await A('.at-actions button').filter({ hasText: 'חבר' }).first().click();
  await waitMade();
  const made = (await A('[data-made]').textContent().catch(() => '')) ?? '';
  T('✨ 7.4 "✨ נוצר מנוע חדש: מנוע תורים באורך משתנה" — עם התורים הארוכים', made.includes('✨ נוצר מנוע חדש: מנוע תורים באורך משתנה') && made.includes('יחידה גדולה ⇒ 3 תורים ארוכים'), made);
  await flushToasts();
  await cshot('04-second-generation.png');

  // 7.5 · ברשימה: "בנוי על ✨ מנוע תורים"
  T('✨ 7.5 "המנועים שיצרת": מנוע תורים באורך משתנה · בנוי על ✨ מנוע תורים', (await ROW(VAR).count()) === 1 && ((await ROW(VAR).textContent()) ?? '').includes('בנוי על ✨ מנוע תורים'));

  // 7.6 · "הסר" על מנוע תורים — חסום, עם הסבר
  await rmBtn('מנוע תורים').scrollIntoViewIfNeeded();
  await rmBtn('מנוע תורים').click();
  await wait(250);
  const blocked = (await A(`[data-blocked="${TURNS}"]`).textContent().catch(() => '')) ?? '';
  T('✨ 7.6 הסרת מנוע תורים חסומה: "קודם הסירו את ✨ מנוע תורים באורך משתנה שבנוי עליו"', blocked === 'קודם הסירו את ✨ מנוע תורים באורך משתנה שבנוי עליו', blocked);
  await wait(700);
  T('✨ ושום דבר לא הוסר (2 מנועים)', (await capsOf()).length === 2);
  await cshot('05-remove-blocked.png');

  // 7.7 · מסירים את הבנוי, ואז את מנוע תורים — שניהם נעלמים
  await rmBtn('מנוע תורים באורך משתנה').click();
  await wait(150);
  await rmBtn('מנוע תורים באורך משתנה').click();
  await page.waitForFunction((id) => !document.querySelector(`[data-capability="${id}"]`), VAR, { timeout: 5000 }).catch(() => {});
  await rmBtn('מנוע תורים').click();
  await wait(150);
  await rmBtn('מנוע תורים').click();
  await page.waitForFunction((id) => !document.querySelector(`[data-capability="${id}"]`), TURNS, { timeout: 5000 }).catch(() => {});
  await wait(1000);
  T('✨ 7.7 הבנוי ואחריו מנוע תורים — שניהם הוסרו', (await capsOf()).length === 0 && (await A('[data-capability]').count()) === 0);
  const audit = await auditOf();
  T('✨ לוג עם כל הדרך: "מנוע חדש: מנוע תורים באורך משתנה (מנהל ההזמנות · חלון הניקיון · ✂️ ← 🔗)"', audit.includes('מנוע חדש: מנוע תורים באורך משתנה (מנהל ההזמנות · חלון הניקיון · ✂️ ← 🔗)'), audit.join(' | '));
  T('✨ ו-2 × "הסרת מנוע" (הבנוי קודם)', audit.filter((a) => a.startsWith('הסרת מנוע')).map((a) => a.split(' (')[0]).join('|') === 'הסרת מנוע: מנוע תורים באורך משתנה|הסרת מנוע: מנוע תורים', audit.join(' | '));
  await flushToasts();

  // 7.8 · "שמור כמנוע" משרשרת מוצעת — 🔗 ⇒ ⏭️ החלון הפנוי הבא של 3 לילות
  await backTo('engines');
  await A('[data-host="bookings"]').click();
  await wait(300);
  const save = A('[data-save-chain="merge>next"]');
  await save.scrollIntoViewIfNeeded();
  await cshot('06-chains-save.png');
  await save.click();
  await waitMade();
  const made2 = (await A('[data-made]').textContent().catch(() => '')) ?? '';
  T('✨ 7.8 "שמור כמנוע" ⇒ "✨ נוצר מנוע חדש: מנוע החלון הפנוי הבא" — "צימר הגפן · 3 לילות פנויים ברצף מ-18/10"', made2.includes('✨ נוצר מנוע חדש: מנוע החלון הפנוי הבא') && made2.includes('צימר הגפן · 3 לילות פנויים ברצף מ-18/10'), made2);
  await wait(800);
  const ids = (await capsOf()).map((c) => c.id);
  T('✨ נוצרו שניים: מנוע לילות פנויים צמודים ⇒ והבנוי עליו', ids.join(',') === 'bookings:bookings.nights:merge,bookings:bookings.nights:merge>next', ids.join(','));
  await flushToasts();
  await cshot('07-saved-chain.png');

  // 7.9 · סוגרים ופותחים — הכול נשמר; "בנה עליו" פותח את המנוע השמור
  await closeBox(page);
  await openBox(page, null);
  await A('[data-host="bookings"]').waitFor({ timeout: 6000 }).catch(() => {});
  T('✨ 7.9 אחרי סגירה ופתיחה: 2 מנועים, והבנוי "בנוי על ✨ מנוע לילות פנויים צמודים"', (await A('[data-capability]').count()) === 2 && ((await ROW('bookings:bookings.nights:merge>next').textContent()) ?? '').includes('בנוי על ✨ מנוע לילות פנויים צמודים'));
  T('✨ שני כרטיסי ✨ בגריד המנועים', (await A('[data-host-cap]').count()) === 2);
  await A('[data-open-cap="bookings:bookings.nights:merge>next"]').scrollIntoViewIfNeeded();
  await A('[data-open-cap="bookings:bookings.nights:merge>next"]').click();
  await wait(300);
  T('✨ "בנה עליו" ⇒ "איזה חלק לחבר אל ✨ מנוע החלון הפנוי הבא?" — 🎯 ⏭️ ⏱️', (await boxText()).includes('איזה חלק לחבר אל ✨ מנוע החלון הפנוי הבא?') && (await A('[data-atom]').evaluateAll((els) => els.map((e) => e.getAttribute('data-atom')))).join(',') === 'next,round,offset');
  await cshot('08-build-on-saved.png');
  await closeBox(page);

  T('✨ אפס שגיאות קונסולה', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ───────── 9 · (ATOMS-GOAL 14.10) 🎯 "מה אתה רוצה לקבל?" — להתחיל מהסוף ─────────
{
  const { ctx, page, errors } = await open(CFG({ 'shell.enginebox': true, 'shell.demodrop': false }), SEED_DB);
  const A = (sel) => page.locator(`${BOX} ${sel}`);
  const G = (sel) => page.locator(`${BOX} [data-goal] ${sel}`);
  const gshot = (name, clip) => shot(page, name, true, clip, OUT_GOAL);
  const capsOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').ui || {}).capabilities || []);
  const auditOf = () => page.evaluate(() => (JSON.parse(localStorage.getItem('maor_db') || '{}').audit || []).map((a) => a.act + ': ' + a.what));
  const goalText = async () => (await A('[data-goal]').textContent().catch(() => '')) ?? '';
  const flushToasts = () => page.waitForFunction(() => document.querySelectorAll('.toast').length === 0, null, { timeout: 8000 }).catch(() => {});
  const askGoal = async (t) => {
    await G('[data-goal-input]').fill(t);
    await G('form button[type=submit]').click();
    await wait(400);
  };
  const GUESTS = ['משפחת לוי', 'משפחת שפירא', 'משפחת כהן'];
  const TURNS = 'bookings:bookings.turnover:divide';
  const NEXT3 = 'bookings:bookings.nights:merge>next';

  // 9.1 · הכרטיס העליון בלשונית
  await openBox(page, null);
  await A('[data-goal]').waitFor({ timeout: 6000 }).catch(() => {});
  T('🎯 9.1 בראש "מנועים וחלקים": "🎯 מה אתה רוצה לקבל?" עם 6 צ\'יפי-דוגמה', (await goalText()).includes('🎯 מה אתה רוצה לקבל?') && (await G('[data-goal-example]').count()) === 6);
  await gshot('01-goal-card.png');

  // 9.2 · כותבים את המטרה ⇒ המשפט במילים + התורים האמיתיים
  await askGoal('תורים של 40 דקות בחלון הניקיון');
  const first = G(`[data-goal-result="${TURNS}"]`);
  await first.waitFor({ timeout: 6000 }).catch(() => {});
  const firstTxt = ((await first.textContent().catch(() => '')) ?? '').replace(/⁨|⁩/g, '');
  T('🎯 9.2 הכרטיס הראשון: "✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים"', firstTxt.includes('✂️ מחלק לחלקים שווים את חלון הניקיון, כל חלק 40 דקות ← 6 תורים'), firstTxt.slice(0, 160));
  T('🎯 התורים האמיתיים: 11:00–11:40 · דנה … 14:20–15:00 · רבקה', firstTxt.includes('11:00–11:40 · דנה') && firstTxt.includes('14:20–15:00 · רבקה'), firstTxt.slice(0, 220));
  T('🎯 אין גלילה אופקית ב-390px', !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
  await first.scrollIntoViewIfNeeded();
  await gshot('02-goal-turns.png');

  // 9.3 · "חבר" ⇒ "✨ נוצר מנוע חדש" (טוסט + כרטיס), ושורת-לוג
  await first.locator('button', { hasText: 'חבר' }).click();
  await page.locator('.toast', { hasText: '✨ נוצר מנוע חדש' }).first().waitFor({ timeout: 6000 }).catch(() => {});
  const toastOk = (await page.locator('.toast', { hasText: '✨ נוצר מנוע חדש' }).count()) >= 1;
  // השמירה ל-localStorage מושהית (debounce) — מחכים לה, לא לשעון
  await page.waitForFunction((id) => ((JSON.parse(localStorage.getItem('maor_db') || '{}').ui || {}).capabilities || []).some((c) => c.id === id), TURNS, { timeout: 8000 }).catch(() => {});
  const caps1 = await capsOf();
  T('🎯 9.3 "חבר" ⇒ טוסט "✨ נוצר מנוע חדש" + "✨ נוצר מנוע חדש" בכרטיס', toastOk && (await G(`[data-goal-made="${TURNS}"]`).count()) === 1);
  const audit1 = await auditOf();
  T('🎯 המנוע נשמר עם 40 דקות, ובלוג "מנוע חדש: מנוע תורים"', caps1.some((c) => c.id === TURNS && c.params.size === 40 && c.params.by === 'size') && audit1.some((a) => a.startsWith('מנוע חדש: מנוע תורים')), JSON.stringify(caps1.map((c) => [c.id, c.params])) + ' | ' + audit1.slice(-2).join(' | '));
  await first.scrollIntoViewIfNeeded();
  await gshot('03-goal-connected.png');
  await flushToasts();

  // 9.4 · צ'יפ "3 לילות פנויים ברצף" ⇒ גם שרשרת (2 חלקים) עם החלון האמיתי ⇒ "חבר" יוצר את שניהם
  await G('[data-goal-example="3 לילות פנויים ברצף"]').click();
  await wait(400);
  const chain = G(`[data-goal-result="${NEXT3}"]`);
  await chain.waitFor({ timeout: 6000 }).catch(() => {});
  const chainTxt = ((await chain.textContent().catch(() => '')) ?? '').replace(/⁨|⁩/g, '');
  T('🎯 9.4 "3 לילות פנויים ברצף" ⇒ שרשרת: "2 חלקים" · 🔗 ואז ⏭️ · "3 לילות פנויים ברצף מ-…"', chainTxt.includes('2 חלקים') && chainTxt.includes('ואז ⏭️') && /3 לילות פנויים ברצף מ-\d+\/\d+/.test(chainTxt), chainTxt.slice(0, 220));
  await chain.scrollIntoViewIfNeeded();
  await gshot('04-goal-chain.png');
  await chain.locator('button', { hasText: 'חבר' }).click();
  await page.waitForFunction((id) => ((JSON.parse(localStorage.getItem('maor_db') || '{}').ui || {}).capabilities || []).some((c) => c.id === id), NEXT3, { timeout: 8000 }).catch(() => {});
  const caps2 = await capsOf();
  const child = caps2.find((c) => c.id === NEXT3);
  T('🎯 "חבר" לשרשרת ⇒ שני מנועים: הראשון, והבנוי עליו (parent)', caps2.some((c) => c.id === 'bookings:bookings.nights:merge') && !!child && child.parent === 'bookings:bookings.nights:merge', JSON.stringify(caps2.map((c) => c.id)));
  await flushToasts();

  // 9.5 · משפט לא ברור ⇒ שאלה סגורה כצ'יפים (לא ניחוש) ⇒ צ'יפ ⇒ תוצאה
  await askGoal('לחלק');
  await G('[data-goal-chip]').first().waitFor({ timeout: 4000 }).catch(() => {});
  T('🎯 9.5 "לחלק" ⇒ "✂️ מה לחלק?" עם צ\'יפים, בלי כרטיסי-הרכבה', (await goalText()).includes('✂️ מה לחלק?') && (await G('[data-goal-chip]').count()) >= 2 && (await G('[data-goal-result]').count()) === 0);
  await G('[data-goal-question]').scrollIntoViewIfNeeded();
  await gshot('05-goal-question.png');
  await G('[data-goal-chip="bookings.balance"]').click();
  await wait(400);
  const balTxt = ((await G('[data-goal-result]').first().textContent().catch(() => '')) ?? '').replace(/⁨|⁩/g, '');
  T('🎯 צ\'יפ "🛏️ היתרה" ⇒ "₪1,200 = 12 × ₪100"', balTxt.includes('₪1,200 = 12 × ₪100'), balTxt.slice(0, 200));
  await gshot('06-goal-chip-answer.png');

  // 9.6 · מחשבון הזמנים: "השעות הזמניות של היום"
  await G('[data-goal-example="השעות הזמניות של היום"]').click();
  await wait(400);
  const zTxt = ((await G('[data-goal-result="zmanim:zmanim.day:divide"]').textContent().catch(() => '')) ?? '').replace(/⁨|⁩/g, '');
  T('🎯 9.6 "השעות הזמניות של היום" ⇒ 🕯️ "שעה 1 · …" מהנתונים', zTxt.includes('✂️ מחלק לחלקים שווים את היום מהנץ עד השקיעה') && zTxt.includes('שעה 1 ·'), zTxt.slice(0, 200));
  await G('[data-goal-result="zmanim:zmanim.day:divide"]').scrollIntoViewIfNeeded().catch(() => {});
  await gshot('07-goal-zmanim.png');

  // 9.7 · אין הרכבה ⇒ שורה כנה
  await askGoal('תזכורת יומיים לפני כל הגעה');
  T('🎯 9.7 אין הרכבה ⇒ "לא מצאתי הרכבה שנותנת את זה מהמנועים שיש…"', (await goalText()).includes('לא מצאתי הרכבה שנותנת את זה מהמנועים שיש'));
  await gshot('08-goal-none.png');

  const all = (await goalText()) + JSON.stringify(caps2);
  T('🎯 בלי שמות אורחים בכרטיס', !GUESTS.some((n) => all.includes(n)));
  await closeBox(page);
  T('🎯 אפס שגיאות קונסולה', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

await b.close();
server.close();
if (failures) { console.log(`\n💥 ${failures} כשלים`); process.exit(1); }
console.log('\n🏆 ארגז המנועים: בוחרים, לוחצים "חבר" — והמוצר באמת משתנה');
