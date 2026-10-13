/**
 * מטריצת קצה-לקצה של מתגי החבילה — ההוכחה ש"כל קומבינציה נשארת מחווטת".
 *
 * לכל פרופיל חבילה: מזריקים config, מריצים את הזרימות האמיתיות בדפדפן
 * (יצירת משפחה, ילד, שיבוץ, ניקוב, תשלום), מרעננים ובודקים התמדה —
 * ואוכפים אפס שגיאות JS.
 *
 * הרצה (דורש chromium של Playwright):
 *   npm run build && node e2e/toggle-matrix.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const CHROME =
  process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch {
    res.statusCode = 404;
    res.end('nf');
  }
});
await new Promise((r) => server.listen(4190, r));
const BASE = 'http://localhost:4190/';

/** פרופילי חבילה — כמו שהאשף מייצר. */
const PROFILES = [
  { name: 'מלא — הכול דולק', config: null },
  {
    name: 'בלי כספים (תשלומים+קבלות כבויים)',
    config: { features: { 'courses.payments': false, 'core.receipts': false } },
  },
  {
    name: 'בלי כרטיסיות',
    config: { features: { 'courses.punch': false } },
  },
  {
    name: 'משפחות בלבד (כל שאר המודולים כבויים)',
    config: { modules: { courses: false, calendar: false, diary: false, supporters: false, tzedaka: false, shop: false, reports: false } },
  },
  {
    // PLATFORM אשף 4: הפרופיל מורחב לוורטיקל גמ"ח — nav.shop מתויג 'גמ"ח'
    name: 'מונחים מותאמים (מוטבים/שיעורים/גמ"ח)',
    config: { terms: { 'nav.families': 'מוטבים', 'nav.courses': 'שיעורים', 'entity.family': 'מוטב', 'nav.shop': 'גמ"ח' } },
  },
];

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
let failures = 0;

for (const profile of PROFILES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };

  const modulesOff = profile.config?.modules ?? {};
  const featOff = profile.config?.features ?? {};
  const coursesOn = modulesOff.courses !== false;
  const paymentsOn = coursesOn && featOff['courses.payments'] !== false;
  const punchOn = coursesOn && featOff['courses.punch'] !== false;
  const famLabel = profile.config?.terms?.['nav.families'] ?? 'משפחות';
  const crsLabel = profile.config?.terms?.['nav.courses'] ?? 'חוגים';
  // כפתורי ההוספה הם "➕ הוספת <ישות>" עם מונח דינמי (termOf)
  const famEntity = profile.config?.terms?.['entity.family'] ?? 'משפחה';
  const crsEntity = profile.config?.terms?.['entity.course'] ?? 'חוג';

  // הזרקת הפרופיל לפני הטעינה. מזריקים config גם בפרופיל "מלא" (cfg=null):
  // localStorage גובר על config.json, וה-config המוזרק בלי firebase ⇒ ענן כבוי ⇒
  // אין מסך "כניסה למערכת" שחוסם את הבדיקה (ראה CLAUDE.md).
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((cfg) => {
    localStorage.clear();
    localStorage.setItem(
      'maor_org_config',
      JSON.stringify({ slug: 'default', orgName: 'עמותת מבחן', theme: 'or-rishon', modules: {}, ...cfg }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10)); // בלי שער יום
  }, profile.config);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // ── זרימה 1: יצירת משפחה ──
  await page.locator(`nav >> text=${famLabel}`).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: `הוספת ${famEntity}` }).first().click();
  await page.waitForTimeout(300);
  await page.locator('.modal input').first().fill('בדיקה-מטריצה');
  await page.locator('.modal button', { hasText: 'שמירה' }).click();
  await page.waitForTimeout(700);
  t('יצירת משפחה', (await page.locator('main').textContent()).includes('בדיקה-מטריצה'));

  // ── זרימה 2: הוספת ילד ──
  const addMember = page.locator('button', { hasText: 'הוספת בן משפחה' }).first();
  if (await addMember.count()) {
    await addMember.click();
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('רוני');
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(600);
    t('הוספת ילד', (await page.locator('main').textContent()).includes('רוני'));
  } else {
    t('הוספת ילד (כפתור קיים)', false, 'כפתור הוספת בן משפחה לא נמצא');
  }

  if (coursesOn) {
    // ── זרימה 3א: יצירת חדר (חדר פעילות הוא שדה חובה בטופס החוג) ──
    await page.locator('nav >> text=הגדרות').click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'הוספת חדר' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('חדר-מטריצה');
    await page.locator('.modal button', { hasText: 'שמירת הגדרות' }).click();
    await page.waitForTimeout(500);

    // ── זרימה 3: יצירת חוג ──
    await page.locator(`nav >> text=${crsLabel}`).click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: `הוספת ${crsEntity}` }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('חוג-מטריצה');
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(700);
    t('יצירת חוג', (await page.locator('main').textContent()).includes('חוג-מטריצה'));

    // ── זרימה 4: שיבוץ מהחוג ──
    const enrollBtn = page.locator('button', { hasText: 'שיבוץ' }).first();
    if (await enrollBtn.count()) {
      await enrollBtn.click();
      await page.waitForTimeout(300);
      await page.locator('.modal input').first().fill('רוני');
      await page.waitForTimeout(400);
      // סינון שיבוץ חכם (P1.7, דלוק כברירת מחדל) עשוי להסתיר את רוני (בן) מחוג
      // ברירת-המחדל (בנות) — "הצג הכל" מחזיר אותו
      const showAllBtn = page.locator('.modal button', { hasText: 'הצג הכל' });
      if (await showAllBtn.count()) { await showAllBtn.first().click(); await page.waitForTimeout(250); }
      const opt = page.locator('.modal button', { hasText: 'רוני' }).first();
      if (await opt.count()) await opt.click();
      await page.waitForTimeout(200);
      await page.locator('.modal button', { hasText: 'שיבוץ' }).last().click();
      await page.waitForTimeout(700);
      // אם המודאל עדיין פתוח (ולידציה) — נסגור וניכשל בעדינות בבדיקת השיבוץ
      const stillOpen = await page.locator('.modal-back').count();
      if (stillOpen) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
      const main = await page.locator('main').textContent();
      t('שיבוץ ילד לחוג', !stillOpen && main.includes('רוני'), stillOpen ? 'מודאל השיבוץ לא נסגר' : '');

      // ── זרימה 5: ניקוב/ניהול לפי הפרופיל ──
      if (punchOn) {
        const punchBtn = page.locator('button', { hasText: 'ניקוב' }).first();
        t('כפתור ניקוב קיים (מתג דולק)', (await punchBtn.count()) > 0);
      } else {
        t('אין כפתור ניקוב (מתג כבוי)', (await page.locator('main button', { hasText: /^ניקוב/ }).count()) === 0);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      const manage = page.locator('main button', { hasText: '⚙' }).first();
      if (await manage.count()) {
        await manage.click();
        await page.waitForTimeout(400);
        const modalTxt = (await page.locator('.modal').textContent().catch(() => '')) ?? '';
        if (paymentsOn) t('מודאל ניהול: תשלומים מוצגים', modalTxt.includes('תשלום') || modalTxt.includes('💳'));
        else t('מודאל ניהול: אין תשלומים (מתג כבוי)', !modalTxt.includes('הוספת תשלום'));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
      }
    } else {
      t('כפתור שיבוץ נמצא', false);
    }
  } else {
    t('מודול חוגים מוסתר (מכוון)', !(await page.locator('nav').textContent()).includes(crsLabel));
  }

  // ── פרנסה׳לע (opt-in, 12.10 — BUILD-ORDER-PARNASA הכרעה 1): חסר = כבוי ⇒ אף פרופיל-ברירת-מחדל
  //    לא מציג את הקישור (מפת-מודולים {} — כמו הלקוח-החי והדמו); רק modules.parnasa === true מדליק ──
  {
    const parnasaOn = profile.config?.modules?.parnasa === true;
    const navNow = (await page.locator('nav').first().textContent()) ?? '';
    t('קישור "פרנסה׳לע" ' + (parnasaOn ? 'קיים' : 'נעדר (opt-in — חסר = כבוי)'), navNow.includes('פרנסה') === parnasaOn);
  }
  // ── אירוח משפחתי (opt-in, 12.10 — BUILD-ORDER-HOSTING הכרעה 1): אותו חוזה — רק modules.hosting === true מדליק ──
  {
    const hostingOn = profile.config?.modules?.hosting === true;
    const navNow = (await page.locator('nav').first().textContent()) ?? '';
    t('קישור "אירוח משפחתי" ' + (hostingOn ? 'קיים' : 'נעדר (opt-in — חסר = כבוי)'), navNow.includes('אירוח משפחתי') === hostingOn);
  }

  // ── קופות צדקה (BUILD-ORDER-TZEDAKA): קישור לפי המודול + זרימה מלאה בברירת המחדל ──
  const tzedakaOn = modulesOff.tzedaka !== false;
  {
    const navNow = (await page.locator('nav').first().textContent()) ?? '';
    t('קישור "קופות צדקה" ' + (tzedakaOn ? 'קיים' : 'נעדר'), navNow.includes('קופות צדקה') === tzedakaOn);
  }
  if (!profile.config) {
    await page.locator('nav >> text=קופות צדקה').click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'הוספת רכז' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('רכזת-מטריצה');
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(500);
    t('הוספת רכז', (await page.locator('main').textContent()).includes('רכזת-מטריצה'));
    await page.locator('main button', { hasText: 'רכזת-מטריצה' }).first().click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: 'הוספת קופה' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('77');
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(500);
    t('הוספת קופה', (await page.locator('main').textContent()).includes('#77'));
    await page.locator('main button', { hasText: '💰 ריקון' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[type="number"]').first().fill('100');
    await page.locator('.modal button', { hasText: 'רישום הריקון' }).click();
    await page.waitForTimeout(500);
    t('ריקון 100 ₪ נרשם והסכום מופיע', (await page.locator('main').textContent()).includes('100'));
    // UX סינון 1: חזרה לרשימה — חיפוש (מדויק + שגוי-קלות, smartFilter) ומבט "כל הקופות"
    await page.locator('main button', { hasText: 'כל הרכזים' }).click();
    await page.waitForTimeout(300);
    const tzSearch = page.locator('main input[placeholder*="חיפוש"]').first();
    await tzSearch.fill('רכזת-מטריצה');
    await page.waitForTimeout(300);
    t('חיפוש הרכז מוצא', (await page.locator('main').textContent()).includes('רכזת-מטריצה'));
    await tzSearch.fill('רכזת-מטריצא');
    await page.waitForTimeout(300);
    t('חיפוש שגוי-קלות מוצא (smartFilter)', (await page.locator('main').textContent()).includes('רכזת-מטריצה'));
    await tzSearch.fill('');
    await page.waitForTimeout(200);
    await page.locator('main button', { hasText: '📦 כל הקופות' }).click();
    await page.waitForTimeout(300);
    t('מבט "כל הקופות" מציג את קופה #77', (await page.locator('main').textContent()).includes('#77'));
    await page.locator('main button', { hasText: '📦 כל הקופות' }).click();
    await page.waitForTimeout(200);
  }

  // ── חנות (BUILD-ORDER-SHOP): קישור לפי המודול + זרימה מלאה בברירת המחדל ──
  const shopOn = modulesOff.shop !== false;
  const shopLabel = profile.config?.terms?.['nav.shop'] ?? 'חנות';
  {
    const navNow = (await page.locator('nav').first().textContent()) ?? '';
    t(`קישור "${shopLabel}" ` + (shopOn ? 'קיים' : 'נעדר'), navNow.includes(shopLabel) === shopOn);
    // PLATFORM אשף 4: בפרופיל המונחים — 'גמ"ח' מופיע במקום 'חנות'
    if (shopOn && shopLabel !== 'חנות') t('התיוג מחליף — "חנות" לא בניווט', !navNow.includes('חנות'));
  }
  if (!profile.config) {
    await page.locator('nav >> text=חנות').click();
    await page.waitForTimeout(400);
    // SHOP4 (מודל הפריטים): קודם פריט בקטלוג — שווי 200, סמלי 50, מלאי 3
    await page.locator('main input[placeholder="סט תפילין"]').fill('מתנת חתן');
    await page.locator('main input[placeholder="200"]').fill('200');
    await page.locator('main input[placeholder="50"]').fill('50');
    await page.locator('main input[placeholder="3"]').fill('3');
    await page.locator('main button', { hasText: 'הוספת פריט' }).click();
    await page.waitForTimeout(400);
    t('הוספת פריט לקטלוג', (await page.locator('main').textContent()).includes('מתנת חתן'));
    // חבילה "מוצר חתן" — הרכיב מצביע על הפריט (נבחר אוטומטית — הפריט הפעיל הראשון)
    await page.locator('button', { hasText: 'הוספת מוצר' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[placeholder="לדוגמה: מוצר חתן"]').fill('מוצר חתן');
    await page.locator('.modal button', { hasText: '➕ רכיב' }).click();
    await page.waitForTimeout(200);
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(500);
    t('הוספת מוצר חתן', (await page.locator('main').textContent()).includes('מוצר חתן'));
    // שיוך למשפחה הקיימת מהזרימה הקודמת
    await page.locator('main button', { hasText: '👥 מוטבים' }).click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'הוספת שיוך' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[placeholder="הקלידו שם משפחה"]').fill('בדיקה-מטריצה');
    await page.waitForTimeout(200);
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(500);
    t('הוספת שיוך למשפחה', (await page.locator('main').textContent()).includes('בדיקה-מטריצה'));
    // UX סינון 2: "ממתינים בלבד" מציג את השיוך (הרכיב טרם מומש ⇒ ממתין)
    await page.locator('main button', { hasText: 'ממתינים בלבד' }).click();
    await page.waitForTimeout(300);
    t('"ממתינים בלבד" מציג את השיוך', (await page.locator('main').textContent()).includes('בדיקה-מטריצה'));
    await page.locator('main button', { hasText: 'ממתינים בלבד' }).click();
    await page.waitForTimeout(200);
    // מימוש — המחיר מאוכלס אוטומטית (50 = סמלי בלי הנחות) והסכום מופיע בטיפול
    await page.locator('main button', { hasText: 'מוצר חתן' }).first().click();
    await page.waitForTimeout(400);
    await page.locator('main button', { hasText: '🎁 מימוש' }).first().click();
    await page.waitForTimeout(300);
    // SHOP5 (הכרעה 20): '💵 גבייה בקופה' פותח קופה ממולאת — והמודאל שורד מאחוריה
    await page.locator('.modal button', { hasText: '💵 גבייה בקופה' }).click();
    await page.waitForTimeout(400);
    t('הקופה הרושמת נפתחה מהמימוש', ((await page.locator('body').textContent()) ?? '').includes('סיום והפקת חשבונית'));
    await page.locator('.modal button', { hasText: 'ביטול' }).last().click(); // סגירת הקופה
    await page.waitForTimeout(400);
    t('מודאל המימוש שרד את הקופה', ((await page.locator('.modal').last().textContent().catch(() => '')) ?? '').includes('רישום המימוש'));
    await page.locator('.modal button', { hasText: 'רישום המימוש' }).click();
    await page.waitForTimeout(500);
    // SHOP2: המימוש (paid 50) הנפיק אישור S-1, והמלאי ירד 3→2
    const cardTxt = (await page.locator('main').textContent()) ?? '';
    t('אישור S-1 מופיע בשורת המימוש', cardTxt.includes('S-1'));
    t('מלאי 3 → "נותרו 2" אחרי המימוש', cardTxt.includes('נותרו 2'));
    await page.locator('main button', { hasText: '🏠 טיפול' }).click();
    await page.waitForTimeout(400);
    const shopMain = (await page.locator('main').textContent()) ?? '';
    t('המימוש נרשם והסכומים מופיעים בטיפול', shopMain.includes('שווי שניתן · 200') && shopMain.includes('שולם סמלי · 50'));
    // SHOP3: חידוש מלאי מהיר +2 מהקטלוג ⇒ 2+2 = "נותרו 4"
    await page.locator('main button', { hasText: '🛍 קטלוג' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button[title="חידוש מלאי"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[type="number"]').first().fill('2');
    await page.locator('.modal button', { hasText: 'עדכון המלאי' }).click();
    await page.waitForTimeout(400);
    t('חידוש מלאי +2 ⇒ "נותרו 4"', ((await page.locator('main').textContent()) ?? '').includes('נותרו 4'));
    // SHOP3: ביטול המימוש עם סימון — הרשומה נשארת והסכומים יורדים
    await page.locator('main button', { hasText: '👥 מוטבים' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: 'מוצר חתן' }).first().click();
    await page.waitForTimeout(400);
    // UX סבב-ז׳: סיבת-הביטול עברה מ-window.prompt למודאל פנימי
    await page.locator('main button', { hasText: '🚫 ביטול' }).first().click(); // חימוש (useArmed)
    await page.waitForTimeout(200);
    await page.locator('main button', { hasText: 'שוב מבטלת' }).first().click(); // ביצוע ⇒ מודאל-סיבה
    await page.waitForTimeout(300);
    await page.locator('.modal input').first().fill('בדיקת מטריצה');
    await page.locator('.modal button', { hasText: 'ביטול המימוש' }).click();
    await page.waitForTimeout(400);
    t('המימוש סומן מבוטל (הרשומה נשארה)', ((await page.locator('main').textContent()) ?? '').includes('מבוטל'));
    await page.locator('main button', { hasText: '🏠 טיפול' }).click();
    await page.waitForTimeout(400);
    const voidedMain = (await page.locator('main').textContent()) ?? '';
    t('הסכומים ירדו אחרי הביטול', voidedMain.includes('שווי שניתן · 0') && voidedMain.includes('שולם סמלי · 0'));
    // SHOP4 (הכרעה 16): פגישה עם חדר תופסת את הלוח — חדר תפוס נחסם.
    // מוסיפים רכיב-פגישה למוצר דרך פריט חדש inline, ואז שתי פגישות באותו חדר+שעה
    await page.locator('main button', { hasText: '🛍 קטלוג' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: '✏️ עריכה' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal button', { hasText: '➕ רכיב' }).click();
    await page.waitForTimeout(200);
    await page.locator('.modal button', { hasText: 'פריט חדש' }).last().click();
    await page.waitForTimeout(200);
    await page.locator('.modal input[placeholder="סט תפילין"]').fill('פגישת ליווי');
    await page.locator('.modal select').last().selectOption('meeting');
    await page.locator('.modal button', { hasText: 'יצירה וקישור' }).click();
    await page.waitForTimeout(300);
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(400);
    await page.locator('main button', { hasText: '👥 מוטבים' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: 'מוצר חתן' }).first().click();
    await page.waitForTimeout(400);
    // פגישה ראשונה — חדר-מטריצה (מהזרימה של החוגים) בשעה 09:00 — נשמרת
    await page.locator('main button', { hasText: '📅 קביעת פגישה' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[type="time"]').fill('09:00');
    await page.locator('.modal select:has(option:has-text("ללא חדר"))').selectOption({ label: 'חדר-מטריצה' });
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(400);
    t('פגישה עם חדר נשמרה', (await page.locator('.modal-back').count()) === 0);
    // פגישה שנייה באותו חדר+שעה — נחסמת (המודאל נשאר פתוח עם שגיאת התנגשות)
    await page.locator('main button', { hasText: '📅 קביעת פגישה' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[type="time"]').fill('09:00');
    await page.locator('.modal select:has(option:has-text("ללא חדר"))').selectOption({ label: 'חדר-מטריצה' });
    await page.locator('.modal button', { hasText: 'שמירה' }).click();
    await page.waitForTimeout(400);
    const clashModal = (await page.locator('.modal').textContent().catch(() => '')) ?? '';
    t('פגישה לחדר תפוס נחסמת', clashModal.includes('התנגשות'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // SHOP5 (הכרעה 19): הפגישה (היום 09:00, חדר-מטריצה) מופיעה ביומן החדרים
    await page.locator('nav >> text=יומן חדרים').click();
    await page.waitForTimeout(500);
    t('הפגישה מופיעה ביומן החדרים', ((await page.locator('main').textContent()) ?? '').includes('פגישת ליווי'));
    // SHOP5 (הכרעה 22): סקשן "פגישות קרובות" בטיפול — הפגישה של היום מופיעה
    await page.locator('nav >> text=חנות').click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: '🏠 טיפול' }).click();
    await page.waitForTimeout(400);
    const soonMain = (await page.locator('main').textContent()) ?? '';
    t('סקשן פגישות קרובות מוצג עם הפגישה', soonMain.includes('פגישות קרובות') && soonMain.includes('חדר-מטריצה'));
    // ── SHOP6 (חנות 28): קליטה → שיוך המוני → רשימת חלוקה → סימון-חולק-לכולם ──
    // קליטת תרומה-בעין +5 ⇒ 5+5 = "נותרו 10"; יומן הקליטות מופיע
    await page.locator('main button', { hasText: '🛍 קטלוג' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button[title="חידוש מלאי"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal input[type="number"]').first().fill('5');
    await page.locator('.modal select').first().selectOption('donation');
    await page.locator('.modal button', { hasText: 'עדכון המלאי' }).click();
    await page.waitForTimeout(400);
    const intakeMain = (await page.locator('main').textContent()) ?? '';
    t('קליטה +5 ⇒ "נותרו 10"', intakeMain.includes('נותרו 10'));
    t('יומן הקליטות מופיע עם הרשומה', intakeMain.includes('יומן קליטות'));
    // שתי משפחות חדשות לשיוך ההמוני (חזרה לרשימה — כרטיס משפחה עשוי להיות פתוח)
    for (const nm of ['המונית-א', 'המונית-ב']) {
      await page.locator(`nav >> text=${famLabel}`).click();
      await page.waitForTimeout(300);
      const backBtn = page.locator('main button', { hasText: `→ כל ${famLabel}` });
      if (await backBtn.count()) {
        await backBtn.first().click();
        await page.waitForTimeout(300);
      }
      await page.locator('button', { hasText: `הוספת ${famEntity}` }).first().click();
      await page.waitForTimeout(300);
      await page.locator('.modal input').first().fill(nm);
      await page.locator('.modal button', { hasText: 'שמירה' }).click();
      await page.waitForTimeout(500);
    }
    await page.locator('nav >> text=חנות').click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: '👥 מוטבים' }).click();
    await page.waitForTimeout(300);
    await page.locator('main button', { hasText: '👥 שיוך המוני' }).click();
    await page.waitForTimeout(400);
    t('הזכאיות מוצגות (מי שכבר משויכת — מסוננת)', ((await page.locator('.modal').textContent()) ?? '').includes('2 משפחות זכאיות'));
    await page.locator('.modal button', { hasText: 'שייך 2 משפחות' }).click(); // חימוש (useArmed)
    await page.waitForTimeout(200);
    await page.locator('.modal button', { hasText: 'שוב לשיוך' }).click();
    await page.waitForTimeout(500);
    t('השיוך ההמוני נוצר לשתי המשפחות', ((await page.locator('main').textContent()) ?? '').includes('המונית-א'));
    // רשימת חלוקה — תדפיס יורד (דפוס תדפיס-הרכז)
    await page.locator('main button', { hasText: '🛍 קטלוג' }).click();
    await page.waitForTimeout(300);
    const dl = page.waitForEvent('download', { timeout: 5000 });
    await page.locator('main button', { hasText: '🖨 רשימת חלוקה' }).first().click();
    t('רשימת החלוקה ירדה', !!(await dl.catch(() => null)));
    // סימון חולק לכולם — 3 ממתינים (בדיקה-מטריצה שמימושה בוטל + שתי החדשות)
    await page.locator('main button', { hasText: '🎁 סימון חולק לכולם' }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.modal button', { hasText: '🎁 חלוקה לכולם' }).click();
    await page.waitForTimeout(500);
    t('המלאי ירד בהתאם — "נותרו 7" (10−3)', ((await page.locator('main').textContent()) ?? '').includes('נותרו 7'));
    await page.locator('main button', { hasText: '👥 מוטבים' }).click();
    await page.waitForTimeout(400);
    const bulkMain = (await page.locator('main').textContent()) ?? '';
    t('הסטטוסים "נמסר" — המשפחות החדשות מומשו 1/2', bulkMain.includes('מומשו 1/2'));
  }

  // ── זרימה 6: התמדה אחרי ריענון ──
  await page.waitForTimeout(800); // debounce שמירה
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator(`nav >> text=${famLabel}`).click();
  await page.waitForTimeout(400);
  t('התמדה אחרי ריענון', (await page.locator('main').textContent()).includes('בדיקה-מטריצה'));

  // ── אכיפת אפס שגיאות ──
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log(`\n📦 ${profile.name}`);
  console.log(log.join('\n'));
  await ctx.close();
}

// ── פרופיל קיצון: הכול כבוי — מסך הבית חייב להיות נקי מכל שריד של מודול כבוי ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'maor_org_config',
      JSON.stringify({
        slug: 'default',
        orgName: 'עמותת מבחן',
        theme: 'or-rishon',
        modules: { families: false, courses: false, calendar: false, diary: false, supporters: false, tzedaka: false, shop: false, reports: false },
      }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const main = (await page.locator('main').textContent()) ?? '';
  const navTxt = (await page.locator('nav').first().textContent()) ?? '';
  // שרידים שדלפו בעבר כשהכול כבוי — אסור שיופיעו (החוזה: כבוי = מוסתר בכל המשטחים)
  // CONNECT: גם צ'יפי חוצה-העמודות (חיבור 3) אסור שידלפו כשהמודולים כבויים
  for (const leak of ['משפחה חדשה', 'משפחות אחרונות', 'ניקוב', 'בני משפחה', 'יום הולדת', 'תורמים', 'דוחות', '🪙 קופות', '🛍 חנות']) {
    t(`אין "${leak}" כשהכול כבוי`, !main.includes(leak));
  }
  t('הניווט נקי ממודולים כבויים', !navTxt.includes('משפחות') && !navTxt.includes('חוגים'));
  // קופות צדקה (מודול tzedaka) — כבוי ⇒ הקישור נעלם
  t('אין "קופות צדקה" כשהמודול כבוי', !navTxt.includes('קופות צדקה'));
  // חנות (מודול shop) — כבוי ⇒ הקישור נעלם
  t('אין "חנות" כשהמודול כבוי', !navTxt.includes('חנות'));
  // פרנסה׳לע (opt-in) — לא הודלק ⇒ אין קישור
  t('אין "פרנסה׳לע" (opt-in — חסר = כבוי)', !navTxt.includes('פרנסה'));
  // אירוח משפחתי (opt-in) — לא הודלק ⇒ אין קישור
  t('אין "אירוח משפחתי" (opt-in — חסר = כבוי)', !navTxt.includes('אירוח משפחתי'));
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log('\n📦 קיצון — הכול כבוי (בדיקת דליפות)');
  console.log(log.join('\n'));
  await ctx.close();
}

// ── פרנסה׳לע מודלק במפורש (opt-in, 12.10): הקישור מופיע, ה-chunk העצל נטען, 9 המודולים הקיימים לא זזים
//    (חסר = פעיל); אשכול 5: הלשוניות האמיתיות — ➕ עסק ⇒ קוד-חיוג, "מה צריך?", "לא מצאתי" ⇒ בקשה, כל לשונית ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'maor_org_config',
      JSON.stringify({ slug: 'default', orgName: 'עמותת מבחן', theme: 'or-rishon', modules: { parnasa: true } }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const navTxt = (await page.locator('nav').first().textContent()) ?? '';
  t('קישור "פרנסה׳לע" קיים (modules.parnasa === true)', navTxt.includes('פרנסה׳לע'));
  t('המודולים הקיימים נשארו דלוקים (חסר = פעיל)', navTxt.includes('קופות צדקה') && navTxt.includes('חלוקה') && navTxt.includes('דוחות'));
  await page.locator('nav >> text=פרנסה׳לע').click();
  await page.waitForTimeout(700);
  const main = (await page.locator('main').textContent()) ?? '';
  // אשכול 5 (12.10): ה-stub "המודול בבנייה" הוחלף בלשוניות האמיתיות — מקומי בלי adminEmails = סמכות-גבאי
  // אשכול 6ב (12.10): + 📞 הקו — סימולטור (לא קו חי)
  // עיצוב 1 (13.10): הניווט של המקור — פס-הלשוניות הצף (5 לשוניות) + אזורי "ניהול"; אף לשונית של הפורט לא אבדה
  const PR_TABS = ['אלפון', 'לוח בקשות', 'לוח הקהילה', 'העסק שלי', 'ניהול'];
  const PR_SEGS = ['אישורים', 'הכנסות', 'חסויות', 'מודעות וחוברת', '📞 הקו', 'הגדרות'];
  const barTxt = (await page.locator('main .pn-tabbar').textContent().catch(() => '')) ?? '';
  t('מסך פרנסה׳לע נטען בסקין המקורי — הפס, 5 הלשוניות של המקור', main.includes('ב״ה') && PR_TABS.every((x) => barTxt.includes(x)), PR_TABS.filter((x) => !barTxt.includes(x)).join(', '));
  t('ה-stub הישן לא חזר', !main.includes('המודול בבנייה'));
  const prTab = (label) => page.locator('main .pn-tabbar button', { hasText: label }).first().click();
  const prSeg = async (label) => {
    await prTab('ניהול');
    await page.waitForTimeout(250);
    await page.locator('main .pn-seg button', { hasText: label }).first().click();
  };
  await prTab('ניהול');
  await page.waitForTimeout(300);
  const segTxt = (await page.locator('main .pn-seg').textContent().catch(() => '')) ?? '';
  t('"ניהול" — 6 אזורי-הניהול (טיפול, פרסום, חוברת, הקו, הגדרות-גבאי)', PR_SEGS.every((x) => segTxt.includes(x)), PR_SEGS.filter((x) => !segTxt.includes(x)).join(', '));

  // ➕ עסק (גבאי ⇒ מאושר מיד + קוד-החיוג הבא) ⇒ הכרטיס המלא נפתח — עיצוב 4: "העסק שלי" של המקור = עורך-הדף
  //    בן 8 החלקים בתוך הלשונית (לא מודאל); "פרטים בסיסיים" פתוח לעסק חדש, וטבעת-ההשלמות זזה עם ההקלדה
  await prTab('העסק שלי');
  await page.waitForTimeout(300);
  await page.locator('main .pn-mepick button', { hasText: '➕ הוספת עסק' }).click();
  await page.waitForTimeout(200);
  t('"העסק שלי" — עורך-הדף של המקור: 8 חלקים, טיוטה, טבעת 0%', (await page.locator('main .pn-ed .pn-eds').count()) >= 8 && ((await page.locator('main .pn-livepill').textContent().catch(() => '')) ?? '').includes('טיוטה') && ((await page.locator('main .pn-ring b').textContent().catch(() => '')) ?? '').startsWith('0'));
  await page.locator('main .pn-ed [data-f="name"]').fill('אינסטלציה-מטריצה');
  await page.locator('main .pn-ed [data-f="title"]').fill('נזילות וסתימות');
  await page.locator('main .pn-ed select[data-f="cat"]').selectOption('elec');
  await page.locator('main .pn-ed [data-f="phone"]').fill('050-0000101');
  await page.waitForTimeout(250);
  t('טבעת-ההשלמות זזה עם ההקלדה (שם, מקצוע וטלפון = +20%)', ((await page.locator('main .pn-ring b').textContent().catch(() => '')) ?? '').startsWith('2'));
  await page.locator('main .pn-edsave label', { hasText: 'קיבלתי את הסכמתו' }).locator('input').check();
  await page.locator('main .pn-edsave button', { hasText: 'הוספה לאלפון' }).click();
  await page.waitForTimeout(900);
  // עיצוב 3: דף-העסק = הגיליון של המקור (פורטל מעל הלשונית, לא בתוך main)
  const sheetTxt = async () => ((await page.locator('.pn-sheet').first().textContent().catch(() => '')) ?? '');
  let prSheet = await sheetTxt();
  t('עסק חדש של הגבאי — מאושר עם קוד-חיוג 101, דף-העסק (הגיליון) נפתח', prSheet.includes('אינסטלציה-מטריצה') && prSheet.includes('קוד חיוג 101') && prSheet.includes('פרטי העסק'));
  await page.locator('.pn-sheet .pn-cx button[aria-label="חזרה"]').first().click();
  await page.locator('.pn-sheet').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
  t('הגיליון נסגר ("חזרה") — נעילת-הגלילה הוסרה', (await page.locator('.pn-sheet').count()) === 0 && !(await page.evaluate(() => document.documentElement.classList.contains('pn-scroll-lock'))));
  await prTab('אלפון');
  await page.waitForTimeout(400);
  // עיצוב 3: "כל האלפון" של המקור — מפתח 15 השערים באותיות (+הכול) והשער עם הבאנר וקוד-החיוג
  await page.locator('main .pn-hmore-all').click();
  await page.waitForTimeout(500);
  const browseTxt = (await page.locator('main .pn-browse').textContent().catch(() => '')) ?? '';
  t('"כל האלפון" — 16 אריחי-שערים, הבאנר עם קוד-החיוג', (await page.locator('main .pn-idx .pn-ix').count()) === 16 && browseTxt.includes('אינסטלציה-מטריצה') && browseTxt.includes('☎ 101'));
  await page.locator('main .pn-browse .pn-back').click();
  await page.waitForTimeout(400);

  // "מה צריך?" — שאילתת-בעיה מוצאת את בעל-המקצוע
  await page.locator('main input[placeholder="נזילה, קצר בחשמל, מלמד…"]').fill('יש לי נזילה בכיור');
  await page.waitForTimeout(300);
  let prMain = (await page.locator('main').textContent()) ?? '';
  t('"מה צריך?" — "נזילה בכיור" מוצא את אינסטלציה-מטריצה', prMain.includes('אינסטלציה-מטריצה') && prMain.includes('אינסטלציה'));

  // עיצוב 2: התשובות כבאנרי-תמונה של המקור + שורת-ההבנה
  t('"מה צריך?" — באנר-תמונה ושורת-ההבנה של המקור', (await page.locator('main .pn-answers .pn-pbn').count()) > 0 && (await page.locator('main .pn-understood').count()) === 1);
  // "לא מצאתי" ⇒ "עם טלפון" ⇒ בקשה ממולאת ⇒ לשונית-הבקשות עם שורת-המסלול
  await page.locator('main input[placeholder="נזילה, קצר בחשמל, מלמד…"]').fill('מחפש מלמד לגמרא');
  await page.waitForTimeout(300);
  await page.locator('main button', { hasText: 'עם טלפון' }).click();
  await page.waitForTimeout(300);
  // בשבת/חג (הרצה בזמן-אמת) הפנייה נחה בעדינות — "שעת צורך, להמשיך" פותח (המקור)
  const shabNeed = page.locator('.pn-toast button', { hasText: 'שעת צורך, להמשיך' });
  if (await shabNeed.count()) {
    t('🕯 בשבת/חג — "עם טלפון" נח בעדינות, "שעת צורך, להמשיך" ממשיך', true);
    await shabNeed.first().click();
    await page.waitForTimeout(300);
  }
  // עיצוב 5: הטופס של המקור נפתח בתוך הלוח (לא חלון) — "פרסום בלוח"; הטופס מתאפס ונשאר פתוח
  await page.locator('main .pn-reqForm button[type=submit]').click();
  await page.waitForTimeout(500);
  prMain = (await page.locator('main').textContent()) ?? '';
  t('"לא מצאתי" ⇒ הטופס בתוך הלוח ⇒ "פרסום בלוח" ⇒ הבקשה בלוח ומנותבת (פתוחה לקהילה — אין עסק בתחום)', prMain.includes('מחפש מלמד לגמרא') && prMain.includes('פתוחה לכל הקהילה'));
  // הכרטיס נפתח (details) ⇒ "⋯ ניהול" ⇒ "סמן שנמצא" ⇒ ב"הכול" — קבוצת "נמצאו"
  const reqCard = page.locator('main .pn-reqList details.pn-req', { hasText: 'מחפש מלמד לגמרא' }).first();
  await reqCard.locator('summary.pn-rq-sum').click();
  await reqCard.locator('details.pn-rq-adm > summary').click();
  await reqCard.locator('.pn-rq-adm-b button', { hasText: 'סמן שנמצא' }).click();
  await page.waitForTimeout(400);
  await page.locator('main .pn-reqfilter button', { hasText: 'הכול' }).click();
  await page.waitForTimeout(300);
  t('"סמן שנמצא" ⇒ קבוצת "נמצאו" והתג "נמצא" (לוח-הבקשות של המקור)', (await page.locator('main .pn-reqList details.pn-req.pn-closed', { hasText: 'מחפש מלמד לגמרא' }).count()) === 1);
  await page.locator('main .pn-reqfilter button', { hasText: 'פתוחות' }).click();
  // לוח הקהילה — הקיר של המקור (מנורה · "לוח הקהילה" · המתג) ולוח-המודעות עם הדוגמאות כשריק
  await prTab('לוח הקהילה');
  await page.waitForTimeout(400);
  t('📌 "לוח הקהילה" — הקיר של המקור: הכתר, שעון-הדפים, "המניין הבא"', (await page.locator('main .pl-crest .pl-clock .pl-flip').count()) === 4 && (await page.locator('main .pl-next').count()) === 1);
  await page.locator('main .pl-seg button', { hasText: 'לוח המודעות' }).click();
  await page.waitForTimeout(300);
  t('📌 לוח המודעות — לבד, שלט, ופתקי-הדוגמה של המקור כשאין מודעות', (await page.locator('main .pl-plaque').count()) === 1 && (await page.locator('main .pl-notes .pl-note').count()) === 8 && (await page.locator('main .pl-exb').count()) === 1);
  await page.locator('main .pl-seg button', { hasText: 'לוח הזמנים' }).click();

  // אשכול 8 · 📖 החוברת יורדת כקובץ HTML (שער יציאת-המידע פתוח) — העסק וקוד-החיוג מודפסים. עיצוב 6: "הפקת חוברת
  //    להדפסה" של המקור (כריכה-זעירה + קווי-נקודות), והכריכה עם סמל-הפושקע הווקטורי שנטען בצ'אנק עצל
  await prSeg('מודעות וחוברת');
  await page.waitForTimeout(250);
  t('📖 "חוברת להדפסה" של המקור — כריכה-זעירה ותוכן-עניינים בקווי-נקודות', (await page.locator('main .pn-bk .pn-mini').count()) === 1 && (await page.locator('main .pn-toc .pn-dots').count()) >= 5);
  await page.waitForTimeout(400); // הסמל נטען עצל עם פתיחת האזור
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('main button', { hasText: 'הפקת חוברת להדפסה' }).click()]);
  const dlPath = await dl.path();
  const bookletTxt = dlPath ? readFileSync(dlPath, 'utf8') : '';
  t(
    '📖 חוברת ירדה כקובץ HTML — העסק + קוד-חיוג 101, כריכת המקור עם הסמל, בלי סקריפט ובלי כתובת-רשת',
    dl.suggestedFilename().startsWith('parnasa-booklet-') && bookletTxt.includes('אינסטלציה-מטריצה') && bookletTxt.includes('☎ קוד 101') && bookletTxt.includes('<div class="frame"><svg class="mk"') && !bookletTxt.includes('<script') && !/https?:\/\//.test(bookletTxt),
  );

  // אשכול 6ב · 📞 הקו — סימולטור, לא קו חי: 1 ⇒ תחומי-המקצוע · "אמרו משהו" ⇒ צומת-אישור, לעולם לא חיבור
  await prSeg('📞 הקו');
  await page.waitForTimeout(300);
  prMain = (await page.locator('main').textContent()) ?? '';
  t('📞 באנר "הקו עוד לא חי" + הקו מתרנדר', prMain.includes('תצוגה בלבד — הקו עוד לא חי') && prMain.includes('הקו של פרנסה׳לע'));
  // ההרצה בזמן-אמת: בשבת/חג הקו סגור (הודעת-הסגירה בלבד) — בודקים אותה, ועוברים לתצוגת "ביום חול" לתפריט
  if (prMain.includes('🕯 סגור ברגע')) {
    t('📞 בשבת/חג — הודעת-הסגירה, המקלדת מושבתת', prMain.includes('אין תפריט, אין קוד ואין חיבור') && (await page.getByRole('button', { name: 'מקש 1', exact: true }).isDisabled()));
    await page.locator('main button.chip', { hasText: '☀ ביום חול' }).click();
    await page.waitForTimeout(300);
  }
  await page.getByRole('button', { name: 'מקש 1', exact: true }).click();
  await page.waitForTimeout(250);
  prMain = (await page.locator('main').textContent()) ?? '';
  t(
    '📞 מקש 1 ⇒ תחומי המקצוע (נוסח-התחומים + חשמל, אינסטלציה ומיזוג)',
    prMain.includes('אמרו מה אתם צריכים, או הקישו את מספר התחום') && prMain.includes('חשמל, אינסטלציה ומיזוג'),
  );
  await page.locator('#pr-phone-say').fill('יש לי נזילה בכיור');
  await page.locator('main button', { hasText: '🎙 אמירה' }).click();
  await page.waitForTimeout(250);
  prMain = (await page.locator('main').textContent()) ?? '';
  t(
    '📞 "אמרו משהו" ⇒ צומת-אישור ("שמעתי…" + "לאישור הקישו 1") — אף פעם לא חיבור',
    prMain.includes('שמעתי: יש לי נזילה בכיור') && prMain.includes('אינסטלציה-מטריצה') && prMain.includes('לאישור הקישו 1') &&
      !prMain.includes('מחברים אתכם') && !prMain.includes('כאן הקו היה מחבר'),
  );
  const [sdl] = await Promise.all([page.waitForEvent('download'), page.locator('main button', { hasText: '⬇ תסריט הקו' }).click()]);
  const sdlPath = await sdl.path();
  const scriptTxt = sdlPath ? readFileSync(sdlPath, 'utf8') : '';
  t(
    '📞 תסריט הקו ירד כקובץ טקסט — צמתים, העסק וקוד-החיוג 101',
    sdl.suggestedFilename().startsWith('parnasa-line-script-') && scriptTxt.includes('תסריט הקריינות') && scriptTxt.includes('אינסטלציה-מטריצה') && scriptTxt.includes('הקוד בקו: אחת אפס אחת'),
  );

  // אשכול 8 · 📣 מודעה בחוברת ⇒ סימון-תשלום ידני (רישום בלבד, אפס קבלות). עיצוב 6: הטופס של המקור בתוך הדף
  await prSeg('מודעות וחוברת');
  await page.waitForTimeout(250);
  await page.locator('main .pn-adForm input[type=text]').first().fill('מפרסם-מטריצה');
  await page.locator('main .pn-adForm button[type=submit]').click();
  await page.waitForTimeout(300);
  await page.locator('main .pn-ritem', { hasText: 'מפרסם-מטריצה' }).locator('button', { hasText: 'סימון כשולם' }).click();
  await page.waitForTimeout(300);
  prMain = (await page.locator('main').textContent()) ?? '';
  t('📣 מודעה נשמרה (הטופס בדף) וסומנה כשולמה — אריחי-הסיכום מתעדכנים', prMain.includes('מפרסם-מטריצה') && prMain.includes('ביטול סימון התשלום') && prMain.includes('נגבה'));
  // עיצוב 6 · ⭐ "כרטיסים מודגשים": הטופס של המקור ⇒ הכרטיס מודגש "עד שיבוטל", ההכנסה החודשית עולה
  await prSeg('הכנסות');
  await page.waitForTimeout(300);
  t('💰 "הכנסות" של המקור — 4 אריחים (הקטיפה ראשונה) ופנקס עם "סה״כ לחודש"', (await page.locator('main .pn-kpis .pn-kpi').count()) === 4 && (await page.locator('main .pn-kpi.pn-lead').count()) === 1 && (await page.locator('main .pn-lg-row.pn-sum').count()) === 1);
  const ftSel = page.locator('main .pn-ftForm select');
  const ftOpt = await ftSel.locator('option', { hasText: 'אינסטלציה-מטריצה' }).first().getAttribute('value');
  await ftSel.selectOption(ftOpt ?? '');
  await page.locator('main .pn-ftForm button[type=submit]').click();
  await page.waitForTimeout(400);
  const ftItem = (await page.locator('main .pn-ritem', { hasText: 'אינסטלציה-מטריצה' }).first().textContent().catch(() => '')) ?? '';
  t('⭐ "הדגשת הכרטיס" ⇒ ברשימת המודגשים "עד שיבוטל", ו"כרטיסים מודגשים" בפנקס', ftItem.includes('עד שיבוטל') && ((await page.locator('main .pn-lg-row', { hasText: 'כרטיסים מודגשים' }).textContent()) ?? '').includes('כרטיס אחד פעיל'));
  // עיצוב 6 · 🪙 "חסויות": שורת מטבע-הפלטינה ⇒ הטופס נפתח מתחתיה ⇒ "בחסות …"
  await prSeg('חסויות');
  await page.waitForTimeout(300);
  t('👑 "חסויות" של המקור — דף הבית, מטבע הפלטינה ו-15 השערים', (await page.locator('main .pn-sprow').count()) === 17);
  await page.locator('main .pn-sprow[data-cat="coin"] .pn-end button', { hasText: 'הגדרה' }).click();
  await page.waitForTimeout(300);
  await page.locator('main .pn-spForm input[type=text]').first().fill('מטבע-מטריצה');
  await page.locator('main .pn-spForm select').selectOption('elec');
  await page.locator('main .pn-spForm button[type=submit]').click();
  await page.waitForTimeout(400);
  t('🪙 מטבע הפלטינה בחסות (הטופס נסגר, השורה מציגה את נותן החסות)', (await page.locator('main .pn-spForm').count()) === 0 && ((await page.locator('main .pn-sprow[data-cat="coin"]').textContent()) ?? '').includes('בחסות מטבע-מטריצה'));
  // עיצוב 6 · ✅ "אישורים": כרטיסי-הניהול + "הוספת איש מקצוע ידנית" עם אותו עורך
  await prSeg('אישורים');
  await page.waitForTimeout(300);
  t('✅ "אישורים" של המקור — "הוספת איש מקצוע ידנית" עם עורך-הדף, ו"כרטיסים מוסתרים"', (await page.locator('main .pn-admForm form.pn-ed').count()) === 1 && ((await page.locator('main').textContent()) ?? '').includes('כרטיסים מוסתרים'));

  // אשכול 7 · 🔎 פלטת-החיפוש: עסק כתוצאת-ישות (שם · מקצוע · ☎ קוד) ⇒ Enter ⇒ כרטיס-העסק נפתח במדריך — גם כשהמסך
  //    עולה מחדש (יוצאים קודם הביתה): בקשה חוצה-מסכים בלי store (paletteLink)
  await page.locator('nav >> text=בית').first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(300);
  await page.locator('.palette input').first().fill('אינסטלציה-מטריצה');
  await page.waitForTimeout(300);
  const palTxt = (await page.locator('.palette').textContent()) ?? '';
  t('🔎 הפלטה מוצאת את העסק (שם · מקצוע · ☎ 101) תחת "פרנסה׳לע"', palTxt.includes('אינסטלציה-מטריצה — עסק') && palTxt.includes('נזילות וסתימות · ☎ 101') && palTxt.includes('פרנסה׳לע'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1100);
  prSheet = await sheetTxt();
  t('🔎 Enter ⇒ מסך פרנסה׳לע עם דף-העסק פתוח (קוד חיוג 101 · פרטי העסק)', prSheet.includes('אינסטלציה-מטריצה') && prSheet.includes('קוד חיוג 101') && prSheet.includes('פרטי העסק'));
  await page.keyboard.press('Escape');
  await page.locator('.pn-sheet').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
  t('Esc סוגר את דף-העסק', (await page.locator('.pn-sheet').count()) === 0);
  // אשכול 7 · 📖 המדריך המהיר — שורת פרנסה׳לע (רק כשהמודול דלוק; כבוי ⇒ ביט-זהה — נבדק ביחידה)
  await page.evaluate(() => {
    window.location.hash = '#guide';
  });
  await page.waitForTimeout(400);
  const guideTxt = (await page.locator('.modal').first().textContent().catch(() => '')) ?? '';
  t('📖 המדריך המהיר — שורת פרנסה׳לע ("מה צריך?" · חוברת עם קוד חיוג)', guideTxt.includes('פרנסה׳לע') && guideTxt.includes('חוברת עם קוד חיוג'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // כל לשונית וכל אזור-ניהול מתרנדרים בדפדפן בלי שגיאה
  for (const label of PR_TABS) {
    await prTab(label);
    await page.waitForTimeout(250);
  }
  for (const label of PR_SEGS) {
    await prSeg(label);
    await page.waitForTimeout(250);
  }
  prMain = (await page.locator('main').textContent()) ?? '';
  t('⚙ הגדרות נטענו (מיקום הזמנים)', prMain.includes('מיקום הזמנים'));
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log('\n📦 פרנסה׳לע מודלק במפורש (opt-in)');
  console.log(log.join('\n'));
  await ctx.close();
}

// ── אירוח משפחתי מודלק במפורש (opt-in, 12.10 — BUILD-ORDER-HOSTING): הקישור מופיע, ה-chunk העצל + הסקין נטענים,
//    המודולים הקיימים לא זזים; אשכול 5: 11 הלשוניות של המקור, זרימת-שהייה מלאה — יחידה ⇒ אורח ⇒ הזמנה ⇒ אישור ⇒
//    צ׳ק-אין ⇒ תשלום (פנקס, לא קבלה) ⇒ צ׳ק-אאוט ⇒ ניקיון נפתח ונסגר ⇒ דוח CSV; התמדה אחרי רענון; אפס שגיאות JS ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };
  // המודאלים בשכבת-פורטל של הסקין (‎.hst-portal על body) — לא בתוך main
  const modal = () => page.locator('.hst-portal .h-modal').last();
  const hTab = async (label) => {
    await page.locator('.hst-root button.h-tab', { hasText: label }).first().click();
    await page.waitForTimeout(250);
  };
  const hTxt = async () => (await page.locator('.hst-root').textContent()) ?? '';

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'maor_org_config',
      JSON.stringify({ slug: 'default', orgName: 'צימרי מבחן', theme: 'or-rishon', modules: { hosting: true } }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const navTxt = (await page.locator('nav').first().textContent()) ?? '';
  t('קישור "אירוח משפחתי" קיים (modules.hosting === true)', navTxt.includes('אירוח משפחתי'));
  t('המודולים הקיימים נשארו דלוקים (חסר = פעיל) ופרנסה׳לע לא הודלק', navTxt.includes('קופות צדקה') && navTxt.includes('דוחות') && !navTxt.includes('פרנסה'));
  await page.locator('nav >> text=אירוח משפחתי').first().click();
  await page.waitForTimeout(800);
  const HS_TABS = ['📊 לוח בקרה', '📅 יומן', '🗂️ הזמנות', '🏠 יחידות', '👪 אורחים', '🧹 ניקיון', '🍳 מטבח', '🕯️ שבת', '🔧 תחזוקה', '📈 דוחות', '⚙️ הגדרות'];
  const tabsNow = await page.locator('.hst-root button.h-tab').allTextContents();
  t('מסך האירוח נטען בסקין המקורי — 11 הלשוניות (מקומי = מנהל ⇒ ⚙️)', JSON.stringify(tabsNow) === JSON.stringify(HS_TABS), tabsNow.join(' | '));
  t('הכותרת: 🏡 + שם-הארגון', ((await page.locator('.hst-root .h-brand').textContent()) ?? '').includes('צימרי מבחן'));

  // יחידה + אורח
  await hTab('🏠 יחידות');
  await page.locator('.hst-root button', { hasText: /יחידה (חדשה|ראשונה)/ }).first().click();
  await modal().getByLabel('שם היחידה').fill('צימר-מטריצה');
  await modal().locator('button', { hasText: 'שמירה' }).click();
  await page.waitForTimeout(300);
  t('יחידה נוספה', (await hTxt()).includes('צימר-מטריצה'));
  await hTab('👪 אורחים');
  await page.locator('.hst-root button', { hasText: /אורח (חדש|ראשון)/ }).first().click();
  await modal().getByLabel('שם', { exact: true }).fill('משפחת-מטריצה');
  await modal().getByLabel('טלפון').fill('050-1234567');
  await modal().locator('button', { hasText: 'שמירה' }).click();
  await page.waitForTimeout(300);
  t('אורח נוסף', (await hTxt()).includes('משפחת-מטריצה'));

  // הזמנה ⇒ אישור ⇒ צ׳ק-אין ⇒ תשלום ⇒ צ׳ק-אאוט
  await hTab('🗂️ הזמנות');
  await page.locator('.hst-root button', { hasText: 'הזמנה חדשה' }).first().click();
  await page.waitForTimeout(200);
  const quote = (await modal().textContent()) ?? '';
  t('טופס-הזמנה: תיק-מחיר חי (לינה · ניקיון · מע״מ · סה״כ)', quote.includes('דמי ניקיון') && quote.includes('מע״מ') && quote.includes('סה״כ'));
  await modal().locator('button', { hasText: 'צור הזמנה' }).click();
  await page.waitForTimeout(300);
  const card = () => page.locator('.hst-root .h-crmc', { hasText: 'משפחת-מטריצה' }).first();
  t('הזמנה נוצרה (ממתינה)', (await card().count()) === 1 && ((await card().textContent()) ?? '').includes('ממתינה'));
  await card().click();
  await modal().locator('button', { hasText: 'אשר הזמנה' }).click();
  await page.waitForTimeout(250);
  await card().click();
  await modal().locator('button', { hasText: 'צ׳ק-אין' }).click();
  await page.waitForTimeout(250);
  t('צ׳ק-אין ⇒ בשהייה', ((await card().textContent()) ?? '').includes('בשהייה'));
  await card().click();
  await modal().locator('button', { hasText: '＋ תשלום' }).click();
  await modal().getByLabel('הערה').fill('מזומן');
  await modal().locator('button', { hasText: 'רשום תשלום' }).click();
  await page.waitForTimeout(300);
  const folio = (await modal().textContent()) ?? '';
  t('תשלום נרשם בתיק-השהייה (פנקס, לא קבלה) — יתרה ₪ 0', folio.includes('תשלום · מזומן') && folio.includes('יתרה לתשלום₪ 0'), folio.slice(0, 80));
  await modal().locator('button', { hasText: 'צ׳ק-אאוט' }).click();
  await page.waitForTimeout(300);
  t('צ׳ק-אאוט ⇒ הושלמה', ((await card().textContent()) ?? '').includes('הושלמה'));

  // ניקיון: הצ׳ק-אאוט פתח משימה ⇒ סיום ⇒ היחידה זמינה
  await hTab('🧹 ניקיון');
  t('הצ׳ק-אאוט פתח "ניקיון אחרי עזיבה"', (await hTxt()).includes('ניקיון אחרי עזיבה'));
  await page.locator('.hst-root button', { hasText: '✓ סיום' }).first().click();
  await page.waitForTimeout(300);
  t('הניקיון הסתיים — אין משימות פתוחות', (await hTxt()).includes('0 משימות פתוחות'));

  // 📈 דוח ⇒ CSV (שער יציאת-המידע פתוח)
  await hTab('📈 דוחות');
  const [csv] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.locator('.hst-root button', { hasText: '📄 CSV' }).click(),
  ]);
  const csvPath = csv ? await csv.path() : null;
  const csvTxt = csvPath ? readFileSync(csvPath, 'utf8') : '';
  t('📄 דוח הכנסות ירד כ-CSV — ההזמנה בפנים', !!csv && csv.suggestedFilename().startsWith('revenue-') && csvTxt.includes('משפחת-מטריצה'), csv ? csv.suggestedFilename() : 'אין הורדה');

  // כל לשונית מתרנדרת בדפדפן בלי שגיאה
  for (const label of HS_TABS) await hTab(label);
  t('⚙️ הגדרות נטענו (פרטי הארגון · גיבוי ושחזור)', (await hTxt()).includes('גיבוי ושחזור'));

  // התמדה: רענון ⇒ חזרה לאירוח ⇒ ההזמנה שם
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.locator('nav >> text=אירוח משפחתי').first().click();
  await page.waitForTimeout(700);
  await hTab('🗂️ הזמנות');
  t('התמדה — ההזמנה שרדה רענון', ((await card().textContent()) ?? '').includes('הושלמה'));
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log('\n📦 אירוח משפחתי מודלק במפורש (opt-in)');
  console.log(log.join('\n'));
  await ctx.close();
}

// ── 🔌 המרכזייה (13.10 — BUILD-ORDER-SWITCHBOARD): שני הכלים דלוקים — הסיפור של משפחת לוי מקצה לקצה:
//    אינסטלטור במדריך ⇒ שהייה לשבת ⇒ זמני-השבת מלוח-הקהילה בכרטיס-ההזמנה (+ 📤 למשפחה) ⇒ נזילה ⇒ "🔧 מצא בעל מקצוע" ⇒
//    האינסטלטור ⇒ ☀ תקציר-היום ⇒ הקו: "אינסטלטור" מוצא את אותו אינסטלטור, ומקש 5 = בדיקת יחידת אירוח פנויה ──
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };
  const modal = () => page.locator('.hst-portal .h-modal').last();
  const hTab = async (label) => {
    await page.locator('.hst-root button.h-tab', { hasText: label }).first().click();
    await page.waitForTimeout(250);
  };
  // 13.10 מיזוג עם העיצוב המקורי: הניווט של פרנסה׳לע = פס-הלשוניות של המקור + אזורי "ניהול" (כמו ריצת-פרנסה׳לע)
  const prTab = (label) => page.locator('main .pn-tabbar button', { hasText: label }).first().click();
  const prSeg = async (label) => {
    await prTab('ניהול');
    await page.waitForTimeout(250);
    await page.locator('main .pn-seg button', { hasText: label }).first().click();
  };

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      'maor_org_config',
      JSON.stringify({ slug: 'default', orgName: 'צימרי מבחן', theme: 'or-rishon', modules: { parnasa: true, hosting: true }, integrations: { whatsapp: { enabled: true } } }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const navTxt = (await page.locator('nav').first().textContent()) ?? '';
  t('שני הכלים בניווט (פרנסה׳לע + אירוח משפחתי)', navTxt.includes('פרנסה׳לע') && navTxt.includes('אירוח משפחתי'));

  // 1 · אינסטלטור באלפון (גבאי ⇒ מאושר + קוד 101) — דרך "העסק שלי" של המקור (עורך-הדף), כמו ריצת-פרנסה׳לע
  await page.locator('nav >> text=פרנסה׳לע').click();
  await page.waitForTimeout(600);
  await prTab('העסק שלי');
  await page.waitForTimeout(300);
  await page.locator('main .pn-mepick button', { hasText: '➕ הוספת עסק' }).click();
  await page.waitForTimeout(200);
  await page.locator('main .pn-ed [data-f="name"]').fill('אינסטלציה-מרכזייה');
  await page.locator('main .pn-ed [data-f="title"]').fill('נזילות וסתימות');
  await page.locator('main .pn-ed select[data-f="cat"]').selectOption('elec');
  await page.locator('main .pn-ed [data-f="phone"]').fill('050-0000101');
  // זמין 24/7 (חלק "שעות פעילות" בעורך) — כדי ש"מצא בעל מקצוע" יראה אותו פתוח בכל שעת-ריצה
  await page.locator('main .pn-ed [data-sec="hours"] .pn-edh').click();
  await page.waitForTimeout(150);
  await page.locator('main .pn-ed [data-sec="hours"] label', { hasText: 'זמין 24/7' }).locator('input').check();
  await page.locator('main .pn-edsave label', { hasText: 'קיבלתי את הסכמתו' }).locator('input').check();
  await page.locator('main .pn-edsave button', { hasText: 'הוספה לאלפון' }).click();
  await page.waitForTimeout(900);
  const addedTxt = ((await page.locator('.pn-sheet').first().textContent().catch(() => '')) ?? '');
  t('אינסטלטור נוסף לאלפון (קוד חיוג 101)', addedTxt.includes('אינסטלציה-מרכזייה') && addedTxt.includes('קוד חיוג 101'));
  await page.locator('.pn-sheet .pn-cx button[aria-label="חזרה"]').first().click();
  await page.locator('.pn-sheet').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});

  // 2 · אירוח: יחידה + משפחת לוי + שהייה לשבת (שישי ⇒ ראשון)
  await page.locator('nav >> text=אירוח משפחתי').first().click();
  await page.waitForTimeout(800);
  await hTab('🏠 יחידות');
  await page.locator('.hst-root button', { hasText: /יחידה (חדשה|ראשונה)/ }).first().click();
  await modal().getByLabel('שם היחידה').fill('צימר הגפן');
  await modal().locator('button', { hasText: 'שמירה' }).click();
  await page.waitForTimeout(300);
  await hTab('👪 אורחים');
  await page.locator('.hst-root button', { hasText: /אורח (חדש|ראשון)/ }).first().click();
  await modal().getByLabel('שם', { exact: true }).fill('משפחת לוי');
  await modal().getByLabel('טלפון').fill('050-1234567');
  await modal().locator('button', { hasText: 'שמירה' }).click();
  await page.waitForTimeout(300);
  const now = new Date();
  const toFri = (5 - now.getDay() + 7) % 7;
  const iso = (d) => d.toISOString().slice(0, 10);
  const fri = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + toFri, 12));
  const sun = new Date(fri.getTime() + 2 * 86_400_000);
  await hTab('🗂️ הזמנות');
  await page.locator('.hst-root button', { hasText: 'הזמנה חדשה' }).first().click();
  await page.waitForTimeout(200);
  await modal().getByLabel('צ׳ק-אאוט').fill(iso(sun));
  await modal().getByLabel('צ׳ק-אין').fill(iso(fri));
  await modal().locator('button', { hasText: 'צור הזמנה' }).click();
  await page.waitForTimeout(300);
  const card = () => page.locator('.hst-root .h-crmc', { hasText: 'משפחת לוי' }).first();
  t('שהייה לשבת נוצרה (' + iso(fri) + ' ⇒ ' + iso(sun) + ')', (await card().count()) === 1);

  // 3 · כרטיס-ההזמנה: זמני השבת + מניינים מלוח-הקהילה, ו"📤 שליחה למשפחה" לוואטסאפ של המשפחה
  await card().click();
  const stay = await page.waitForSelector('.hst-portal [data-switch="stay-shabbat"]', { timeout: 5000 }).catch(() => null);
  const stayTxt = stay ? ((await stay.textContent()) ?? '') : '';
  t('🕯 כרטיס-ההזמנה: "שבת בשהייה" עם הדלקת נרות וצאת השבת מלוח-הקהילה', /שבת בשהייה/.test(stayTxt) && /הדלקת נרות · שישי \d+\/\d+ \d\d:\d\d/.test(stayTxt) && /צאת השבת \d\d:\d\d/.test(stayTxt), stayTxt.slice(0, 120));
  const send = page.locator('.hst-portal [data-switch="stay-shabbat"] a', { hasText: '📤 שליחה למשפחה' });
  const sendHref = (await send.count()) ? ((await send.getAttribute('href')) ?? '') : '';
  t('📤 שליחה למשפחה ⇒ וואטסאפ ממולא למשפחת לוי (זמנים בפנים)', sendHref.startsWith('https://wa.me/972501234567?text=') && decodeURIComponent(sendHref).includes('הדלקת נרות'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // 4 · תחזוקה: נזילה בכיור ⇒ "🔧 מצא בעל מקצוע" ⇒ האינסטלטור מהמדריך (שם · ☎ 101)
  await hTab('🔧 תחזוקה');
  await page.locator('.hst-root button', { hasText: '＋ קריאת תחזוקה' }).click();
  await modal().getByLabel('תיאור התקלה').fill('נזילה בכיור');
  await modal().getByLabel('קטגוריה').selectOption('אינסטלציה');
  await modal().locator('button', { hasText: 'פתח קריאה' }).click();
  await page.waitForTimeout(300);
  await page.locator('.hst-root button', { hasText: '🔧 מצא בעל מקצוע' }).first().click();
  const pro = await page.waitForSelector('.hst-portal [data-switch="pro"]', { timeout: 5000 }).catch(() => null);
  const proTxt = (await modal().textContent()) ?? '';
  t('🔧 "מצא בעל מקצוע" ⇒ האינסטלטור מהמדריך (שם · ☎ 101 · מצב-פתיחה)', !!pro && proTxt.includes('אינסטלציה-מרכזייה') && proTxt.includes('☎ 101') && /פנוי עכשיו|חוזר ב/.test(proTxt), proTxt.slice(0, 140));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  // 5 · ☀ תקציר היום בלוח-הבקרה — מכל הכלים
  await hTab('📊 לוח בקרה');
  const today = await page.waitForSelector('.hst-root [data-switch="today"]', { timeout: 5000 }).catch(() => null);
  const todayTxt = today ? ((await today.textContent()) ?? '') : '';
  t('☀ תקציר היום בלוח-הבקרה — אירוח + שבת מהלוח', todayTxt.includes('☀ תקציר היום') && todayTxt.includes('🏡 הגעות היום') && /🕯 שבת/.test(todayTxt), todayTxt.slice(0, 160));

  // 6 · הקו: "אינסטלטור" ⇒ אותו אינסטלטור; מקש 5 = בדיקת יחידת אירוח פנויה
  await page.locator('nav >> text=פרנסה׳לע').click();
  await page.waitForTimeout(600);
  await prSeg('אישורים'); // "ניהול" ⇒ "אישורים" = לשונית-הטיפול (עם ☀ תקציר-היום)
  await page.waitForSelector('main [data-switch="today"]', { timeout: 5000 }).catch(() => null);
  const careTxt = (await page.locator('main').textContent()) ?? '';
  t('☀ תקציר היום גם בלשונית-הטיפול של פרנסה׳לע', careTxt.includes('☀ תקציר היום') && careTxt.includes('🏡 הגעות היום'));
  await prSeg('📞 הקו');
  await page.waitForTimeout(600);
  let prMain = (await page.locator('main').textContent()) ?? '';
  if (prMain.includes('🕯 סגור ברגע')) {
    await page.locator('main button.chip', { hasText: '☀ ביום חול' }).click();
    await page.waitForTimeout(400);
    prMain = (await page.locator('main').textContent()) ?? '';
  }
  t('📞 הקו: "לבדיקת יחידת אירוח פנויה הקישו 5" (דרך המרכזייה)', prMain.includes('לבדיקת יחידת אירוח פנויה הקישו 5'));
  await page.locator('#pr-phone-say').fill('אינסטלטור');
  await page.locator('main button', { hasText: '🎙 אמירה' }).click();
  await page.waitForTimeout(250);
  prMain = (await page.locator('main').textContent()) ?? '';
  t('📞 "אינסטלטור" בקו ⇒ אותו אינסטלטור שהאירוח מצא (צומת-אישור, לא חיבור)', prMain.includes('שמעתי: אינסטלטור') && prMain.includes('אינסטלציה-מרכזייה') && prMain.includes('לאישור הקישו 1'));
  await page.locator('main button', { hasText: '🔄 מההתחלה' }).click();
  await page.getByRole('button', { name: 'מקש 5', exact: true }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'מקש 1', exact: true }).click();
  await page.waitForTimeout(200);
  prMain = (await page.locator('main').textContent()) ?? '';
  t('📞 5 ⇒ 1 ⇒ הקראת היחידות הפנויות הלילה (צימר הגפן)', /(הלילה|בליל).*(פנויה|פנויות|אין יחידת אירוח פנויה)/.test(prMain) && prMain.includes('המידע נכון לרגע זה'));
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log('\n📦 🔌 המרכזייה — שני הכלים דלוקים (משפחת לוי מקצה לקצה)');
  console.log(log.join('\n'));
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures === 0 ? '\n🏆 המטריצה כולה ירוקה — מחווט מקצה לקצה בכל פרופיל' : `\n💥 ${failures} כשלים`);
process.exit(failures === 0 ? 0 : 1);
