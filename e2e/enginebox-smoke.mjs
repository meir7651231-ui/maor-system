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
 *   אפס שגיאות קונסולה. צילום PNG לכל צעד ⇒ knowledge/shots/enginebox-2026-10-13/ (‏≤150KB).
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
    booking({ id: 'hb1', guestId: 'hg1', unitId: 'hu1', checkIn: '2026-10-16', checkOut: '2026-10-18', kids: 3 }), // שישי ⇒ ראשון
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
async function shot(page, name, hideBars = true, clip = undefined) {
  // הסתרת הפס-התחתון הקבוע לצילום בלבד — ומחזירים אותו מיד (הניווט במובייל עובר דרכו)
  if (hideBars) await page.evaluate(() => { const st = document.createElement('style'); st.id = 'eb-shot'; st.textContent = '.bottom-nav{display:none!important}'; document.head.appendChild(st); });
  const path = join(OUT, name);
  await page.screenshot({ path, clip });
  if (hideBars) await page.evaluate(() => document.getElementById('eb-shot')?.remove());
  const size = (await stat(path)).size;
  T(`📸 ${name} (${Math.round(size / 1024)}KB ≤ 150KB)`, size <= 150 * 1024);
}
async function openBox(page) {
  await page.evaluate(() => { location.hash = '#enginebox'; });
  await page.locator(BOX).waitFor({ timeout: 5000 }).catch(() => {});
  await wait(300);
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

await b.close();
server.close();
if (failures) { console.log(`\n💥 ${failures} כשלים`); process.exit(1); }
console.log('\n🏆 ארגז המנועים: בוחרים, לוחצים "חבר" — והמוצר באמת משתנה');
