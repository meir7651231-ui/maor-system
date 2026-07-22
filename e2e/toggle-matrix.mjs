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
    config: { modules: { courses: false, calendar: false, diary: false, supporters: false, reports: false } },
  },
  {
    name: 'מונחים מותאמים (מוטבים/שיעורים)',
    config: { terms: { 'nav.families': 'מוטבים', 'nav.courses': 'שיעורים', 'entity.family': 'מוטב' } },
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

  // הזרקת הפרופיל לפני הטעינה
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((cfg) => {
    localStorage.clear();
    if (cfg) {
      localStorage.setItem(
        'maor_org_config',
        JSON.stringify({ slug: 'default', orgName: 'עמותת מבחן', theme: 'or-rishon', modules: {}, ...cfg }),
      );
    }
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10)); // בלי שער יום
  }, profile.config);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  // ── זרימה 1: יצירת משפחה ──
  await page.locator(`nav >> text=${famLabel}`).click();
  await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'משפחה חדשה' }).first().click();
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
    // ── זרימה 3: יצירת חוג ──
    await page.locator(`nav >> text=${crsLabel}`).click();
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: 'חוג חדש' }).first().click();
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
        modules: { families: false, courses: false, calendar: false, diary: false, supporters: false, reports: false },
      }),
    );
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const main = (await page.locator('main').textContent()) ?? '';
  const navTxt = (await page.locator('nav').first().textContent()) ?? '';
  // שרידים שדלפו בעבר כשהכול כבוי — אסור שיופיעו (החוזה: כבוי = מוסתר בכל המשטחים)
  for (const leak of ['משפחה חדשה', 'משפחות אחרונות', 'ניקוב', 'בני משפחה', 'יום הולדת', 'תורמים', 'דוחות']) {
    t(`אין "${leak}" כשהכול כבוי`, !main.includes(leak));
  }
  t('הניווט נקי ממודולים כבויים', !navTxt.includes('משפחות') && !navTxt.includes('חוגים'));
  t('אפס שגיאות JS בפרופיל', errors.length === 0, errors.slice(0, 2).join(' | '));

  console.log('\n📦 קיצון — הכול כבוי (בדיקת דליפות)');
  console.log(log.join('\n'));
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures === 0 ? '\n🏆 המטריצה כולה ירוקה — מחווט מקצה לקצה בכל פרופיל' : `\n💥 ${failures} כשלים`);
process.exit(failures === 0 ? 0 : 1);
