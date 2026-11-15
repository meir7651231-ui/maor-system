/**
 * W2-S3 · ריצה-יבשה "הקמה בשבוע" (7.11.2026) — מרכז חוגים מזויף-בנתונים, אמיתי-בצורה.
 * מקומי בלבד, בלי ענן: ?org=chugim-test עם קונפיג-דריסה (בלי firebase).
 *   npm run build && node e2e/setup-week-dryrun.mjs
 * הנתונים: knowledge/playbook/setup-week-*.csv (scripts/gen-setup-week-sample.py).
 * מודד זמן-מכונה לכל צעד + מצלם; מתעד תקלות. לא שער.
 */
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(ROOT, 'dist');
const PB = join(ROOT, 'knowledge', 'playbook');
const SHOTS = join(HERE, 'shots', 'setup-week');
mkdirSync(SHOTS, { recursive: true });
const SLUG = 'chugim-test';
const ENROLL_SAMPLE = +(process.env.ENROLL_SAMPLE || 12);
const ONLY = process.env.ONLY ? +process.env.ONLY : 0; // מספר חוגים לדיבוג
const csv = (n) => readFileSync(join(PB, `setup-week-${n}.csv`), 'utf8');
const rows = (n) => csv(n).trim().split('\n').slice(1).map((l) => l.split(','));

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
  res.setHeader('content-type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'application/octet-stream');
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(4198, r));
const BASE = 'http://localhost:4198/';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page0 = await (await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'he-IL' })).newPage();
const page = page0;
page.setDefaultTimeout(+(process.env.STEP_TO || 8000));
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const wait = (ms) => page.waitForTimeout(ms);
const steps = [];
const issues = [];
let shotN = 0;
async function step(name, fn) {
  const t0 = Date.now();
  let ok = true, note = '';
  try { note = (await fn()) ?? ''; } catch (e) { ok = false; note = String(e).split('\n')[0].slice(0, 200); }
  const ms = Date.now() - t0;
  steps.push({ name, ok, ms, note });
  console.log((ok ? '  ✅ ' : '  ❌ ') + name + ' — ' + ms + 'ms' + (note ? ' · ' + note : ''));
  await page.screenshot({ path: join(SHOTS, String(++shotN).padStart(2, '0') + '-' + name.replace(/[^\p{L}\d]+/gu, '-').slice(0, 40) + '.png') }).catch(() => {});
}
const dbOf = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), 'maor_db:' + SLUG);
async function gotoNav(label) {
  await page.locator(`nav >> text=${label}`).first().click();
  await wait(500);
  // אחרי שמירת-חוג נשארים בכרטיס-החוג — חוזרים לרשימה
  const back = page.locator('button', { hasText: /^→? ?כל /, }).first();
  if (await back.isVisible().catch(() => false)) { await back.click(); await wait(400); }
}
/** "פתיחת יום" קופץ באמצע ההקמה (ברגע שיש נתונים) — מתועד כתקלה ונסגר */
async function dismissDay() {
  const day = page.locator('.modal-back button', { hasText: 'פתיחת יום' });
  if (await day.count()) {
    if (!issues.some((i) => i.startsWith('UX: מודאל'))) issues.push('UX: מודאל "פתיחת יום עבודה" קופץ באמצע ההקמה (מיד אחרי הייבוא הראשון) וחוסם את המסך');
    await day.first().click();
    await wait(400);
  }
}
async function openSettings(groupLabel) {
  await dismissDay();
  await page.locator('nav >> text=הגדרות').first().click().catch(async () => { await page.locator('button[aria-label*="הגדרות"], button:has-text("⚙️")').first().click(); });
  await wait(600);
  if (groupLabel) { await page.getByText(groupLabel, { exact: true }).first().click(); await wait(400); }
}

console.log('\n🏗 הקמה בשבוע — ריצה יבשה (' + SLUG + ')');
await step('0 · ארגון ריק נפתח', async () => {
  await page.goto(BASE + '__blank'); // אותו origin
  await page.evaluate((slug) => {
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify({ slug, orgName: 'מרכז חוגים לדוגמה', theme: 'or-rishon', modules: {}, features: {} }));
  }, SLUG);
  await page.goto(BASE + '?org=' + SLUG, { waitUntil: 'networkidle' });
  await wait(1200);
  const day = page.locator('.modal-back button', { hasText: 'פתיחת יום' });
  if (await day.count()) await day.first().click();
  return 'nav=' + (await page.locator('nav').count());
});

await step('1 · שם הארגון', async () => {
  await openSettings();
  const inp = page.getByLabel(/שם הארגון/).first();
  const before = await inp.inputValue();
  if (before === 'מאור החסד') issues.push('ארגון חדש: שדה "שם הארגון" בהגדרות ממולא מראש ב"מאור החסד" (emptyDb.orgName) — הכותרת מציגה את שם-הקונפיג');
  await inp.fill('מרכז חוגים "קשת" (בדיקה)');
  await page.locator('button', { hasText: 'שמירת פרטי הארגון' }).first().click();
  await wait(600);
  const header = ((await page.locator('aside, .side, header').first().textContent()) ?? '').slice(0, 60);
  return 'לפני: ' + before + ' · db: ' + ((await dbOf()).orgName ?? '') + ' · כותרת: ' + header.trim();
});

await step('2 · ייבוא 150 משפחות (CSV 13 עמודות)', async () => {
  await openSettings('📚 נתונים');
  await page.locator('button', { hasText: /^משפחות \(CSV\)/ }).first().click();
  await wait(300);
  await page.locator('textarea').first().fill(csv('משפחות-13'));
  await page.locator('button', { hasText: 'בדיקת הקובץ (שלב 1)' }).first().click();
  await wait(800);
  await page.locator('button', { hasText: /^ייבוא \d+ משפחות/ }).first().click();
  await wait(1500);
  const fams = (await dbOf()).families ?? [];
  if (fams.length !== 150) issues.push('ייבוא-משפחות: ' + fams.length + '/150');
  const comm = [...new Set(fams.map((f) => f.community))];
  return fams.length + ' משפחות · קהילה: ' + comm.join('/');
});

await step('3 · ייבוא 300 ילדים (CSV)', async () => {
  await dismissDay();
  await page.locator('button', { hasText: /^ילדים \(CSV\)/ }).first().click();
  await wait(300);
  await page.locator('textarea').first().fill(csv('ילדים'));
  await page.locator('button', { hasText: 'בדיקת התאמות (שלב 1)' }).first().click();
  await wait(1500);
  const btn = page.locator('button', { hasText: /אישור ייבוא \(\d+ ילדים\)/ }).first();
  const label = (await btn.textContent()) ?? '';
  await btn.click();
  await wait(1500);
  const fams = (await dbOf()).families ?? [];
  const mem = fams.flatMap((f) => f.members ?? []);
  const girlsSrc = rows('ילדים').filter((r) => r[5] === 'נ').length;
  const girls = mem.filter((m) => m.gender === 'f').length;
  if (mem.length !== 300) issues.push('ייבוא-ילדים: ' + mem.length + '/300');
  if (girls !== girlsSrc) issues.push('ייבוא-ילדים: מגדר — בקובץ ' + girlsSrc + ' בנות ("נ"), נקלטו ' + girls + ' (העמודה "מין" עם ז/נ לא מזוהה)');
  return label.trim() + ' ⇒ ' + mem.length + ' ילדים · בנות ' + girls + '/' + girlsSrc;
});

const COURSES = rows('חוגים'); // חוג,חדר,מורה,יום,שעה,מחיר,מקסימום
const DAYS = { 'א': 'ראשון', 'ב': 'שני', 'ג': 'שלישי', 'ד': 'רביעי', 'ה': 'חמישי', 'ו': 'שישי' };
await step('4 · 12 חוגים (+4 חדרים ו-4 מורות בתוך הטופס)', async () => {
  await dismissDay();
  await gotoNav('חוגים');
  const t0 = Date.now();
  const per = [];
  let stage = '';
  for (const [name, room, teacher, day, time, price] of (ONLY ? COURSES.slice(0, ONLY) : COURSES)) {
    const ts = Date.now();
    try {
    stage = 'פתיחה';
    await dismissDay();
    await gotoNav('חוגים');
    await page.locator('button', { hasText: /הוספת חוג/ }).first().click();
    await wait(300);
    const M = page.locator('.modal').last();
    await M.getByLabel(/שם החוג/).fill(name);
    const db0 = await dbOf();
    const tch = (db0.teachers ?? []).find((t) => t.name === teacher);
    const tSel = M.getByLabel(/^מורה$/);
    stage = 'מורה';
    if (tch) await tSel.selectOption(tch.id);
    else { await tSel.selectOption({ label: '＋ הוספת מורה…' }); await M.getByLabel(/שם המורה/).fill(teacher); }
    await M.getByLabel(/מחיר מלא/).fill(price);
    stage = 'חדר';
    const rm = (db0.rooms ?? []).find((r) => r.name === room);
    if (rm) await M.locator(`select:has(option[value="${rm.id}"])`).first().selectOption(rm.id);
    else {
      await M.locator('button', { hasText: '➕ חדר חדש' }).click();
      await M.getByPlaceholder('שם החדר').fill(room);
      await M.locator('button', { hasText: 'יצירה' }).click();
      await wait(200);
    }
    // ימי-מפגש: "ראשון" מסומן מראש בטופס חדש ⇒ קובעים לפי aria-pressed (לחיצה עיוורת מכבה אותו)
    for (const dn of Object.values(DAYS)) {
      const b = M.locator('button[aria-pressed]', { hasText: dn }).first();
      const on = (await b.getAttribute('aria-pressed')) === 'true';
      if (on !== (dn === DAYS[day])) await b.click();
    }
    await M.getByLabel('שעה').fill(time);
    await M.locator('button', { hasText: /^שמירה/ }).last().click();
    await wait(500);
    if (await page.locator('.modal-back').count()) {
      const all = ((await page.locator('.modal').last().textContent()) ?? '').replace(/\s+/g, ' ');
      const errEl = await page.locator('.modal [role=alert], .modal .form-error, .modal .error').allTextContents().catch(() => []);
      issues.push('חוג ' + name + ': הטופס לא נסגר — ' + (errEl.join(' | ') || all.slice(-200)));
      await page.screenshot({ path: join(SHOTS, 'err-course-' + name + '.png') });
      await page.keyboard.press('Escape');
    }
    } catch (e) {
      issues.push('[סקריפט] חוג ' + name + ' נכשל בשלב ' + stage + ': ' + String(e).split('\n')[0].slice(0, 120));
      await page.screenshot({ path: join(SHOTS, 'err-course-' + name + '.png') });
      await page.keyboard.press('Escape').catch(() => {});
    }
    per.push(Date.now() - ts);
  }
  const db = await dbOf();
  const audience = [...new Set((db.courses ?? []).map((c) => c.gender))];
  if (audience.length === 1 && audience[0] === 'f') issues.push('ברירת-מחדל: כל חוג חדש נוצר עם קהל "נשים ובנות" (מוסתר תחת "הגדרות מתקדמות") — במרכז מעורב בנים מוסתרים בשיבוץ');
  return (db.courses ?? []).length + ' חוגים · ' + (db.rooms ?? []).length + ' חדרים · ' + (db.teachers ?? []).length + ' מורות · קהל=' + audience.join('/') + ' · ממוצע ' + Math.round(per.reduce((a, b) => a + b, 0) / per.length) + 'ms/חוג';
});

await step('5 · שיבוצים — דגימה של ' + ENROLL_SAMPLE + ' מתוך 300 (מכרטיס החוג)', async () => {
  const ENR = rows('שיבוצים'); // משפחה,שם,טלפון,חוג
  const per = [];
  let ok = 0, hidden = 0;
  for (const [fam, first, , course] of ENR.slice(0, ENROLL_SAMPLE)) {
    const ts = Date.now();
    await dismissDay();
    await gotoNav('חוגים');
    await page.locator('.card[role=button]', { hasText: course }).first().click();
    await wait(500);
    await page.locator('button', { hasText: /^➕? ?שיבוץ/ }).first().click();
    await wait(300);
    const M = page.locator('.modal').last();
    await M.locator('input').first().fill(first + ' ' + fam);
    await wait(300);
    let opt = M.locator('button', { hasText: first + ' ' }).filter({ hasText: fam }).first();
    if (!(await opt.count())) {
      const showAll = M.locator('button', { hasText: 'הצג הכל' });
      if (await showAll.count()) { hidden++; await showAll.first().click(); await wait(250); }
      opt = M.locator('button', { hasText: first }).filter({ hasText: fam }).first();
    }
    if (await opt.count()) await opt.click();
    await wait(150);
    await M.locator('button', { hasText: 'שיבוץ' }).last().click();
    await wait(500);
    if (await page.locator('.modal-back').count()) { await page.keyboard.press('Escape'); await wait(200); } else ok++;
    await page.keyboard.press('Escape').catch(() => {});
    per.push(Date.now() - ts);
  }
  const n = ((await dbOf()).enrollments ?? []).length;
  if (hidden) issues.push('שיבוץ: ' + hidden + '/' + ENROLL_SAMPLE + ' ילדים הוסתרו ע"י הסינון החכם (מגדר/גיל) — נדרש "הצג הכל" לכל אחד');
  const cap = ((await dbOf()).courses ?? []).map((c) => c.maxStudents);
  if (cap.every((m) => m && m < 25)) issues.push('תפוסה: מקסימום-ברירת-מחדל ' + cap[0] + ' לחוג (מוסתר ב"הגדרות מתקדמות") — בגיליון ~25 ילדים לחוג ⇒ השיבוץ ה-' + (cap[0] + 1) + ' נחסם "החוג מלא" (EnrollModal.tsx:171)');
  issues.push('אין ייבוא-שיבוצים: 300 שיבוצים = 300 פעולות ידניות (חיפוש-ילד ⇒ שיבוץ) — עמודת "חוג" בגיליון-הילדים לא נקלטת');
  return n + ' שיבוצים נוצרו (' + ok + ' ok) · ממוצע-מכונה ' + Math.round(per.reduce((a, b) => a + b, 0) / per.length) + 'ms/שיבוץ';
});

await step('6 · תמונת-מצב: חוגים', async () => {
  await dismissDay();
  await gotoNav('חוגים');
  await wait(600);
  return '';
});
await step('7 · תמונת-מצב: משפחות', async () => {
  await gotoNav('משפחות');
  await wait(600);
  return '';
});
await step('8 · תמונת-מצב: בית', async () => {
  await page.locator('nav:visible').first().getByText('בית', { exact: true }).first().click();
  await wait(600);
  return '';
});

const report = { steps, issues, errors: [...new Set(errors)] };
writeFileSync(join(SHOTS, 'result.json'), JSON.stringify(report, null, 2));
console.log('📊 ' + JSON.stringify({ ok: steps.filter((s) => s.ok).length, of: steps.length, issues, errors: report.errors.length }));
await browser.close();
server.close();
