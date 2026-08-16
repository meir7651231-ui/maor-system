/**
 * מטריצת-ורטיקלים — גלאי "מה לא מתחלף" (הכרעת-בעלים 4.8.2026):
 * לכל אחת מ-10 חבילות-הוורטיקל: מזריקים את הקונפיג שהאשף מייצר (מונחים+מודולים+
 * דגלים), עוברים על כל מסכי-הניווט בדפדפן אמיתי, וסורקים את הטקסט המרונדר:
 *
 *   ❌ דליפה = מונח-ברירת-מחדל ("משפחות"/"חוג"/"תורם"…) שמופיע על המסך למרות
 *      שהחבילה החליפה אותו — מחרוזת קשיחה שעקפה את termOf.
 *   ❌ אי-הופעה = תווית-הניווט של החבילה לא מוצגת (המונח לא חלחל).
 *   ❌ מודול שהחבילה כיבתה ועדיין מופיע בניווט (או להפך).
 *   ❌ שגיאת-JS בכל מסך.
 *
 * הנתונים ב-vertical-matrix-data.json — מחוללים מ-VERTICAL_PACKS/TERM_DEFS;
 * ratchet-סחף (vertical-matrix-drift.test.ts) מוודא שהם לא מתיישנים.
 *
 * הרצה: npm run build && node e2e/vertical-matrix.mjs
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = join(HERE, '..', 'dist');
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DATA = JSON.parse(readFileSync(join(HERE, 'vertical-matrix-data.json'), 'utf8'));

/** מילים גנריות-מדי לסריקה (מופיעות בעברית יומיומית — היו מציפות FP). */
const SKIP_WORDS = new Set(['חדש', 'בהכנה', 'רישום', 'מסירה', 'הושלם', 'כמות', 'קופה', 'מוצר', 'פריט', 'שיוך', 'חנות', 'רכז', 'מבצע', 'קריטריון', 'שם לטיפול']);
/** תחיליות/מילים לגיטימיות שמכילות מונח-ברירת-מחדל (לא דליפה).
 *  'משפחה / שם משפחה'/'שם משפחה' = שמות-עמודות מילוליים של קובץ-הייבוא הלגאסי
 *  (surname! — נכון בכל ורטיקל, מתאר פורמט-קובץ ולא ישות). הסדר: ארוך→קצר. */
const EXCEPTIONS = ['משפחה / שם משפחה', 'שם משפחה', 'חוגג', 'משפחתי', 'תמורה', 'אמורה', 'מרכז', 'תלמידה שסיימה'];

const NAV_KEYS = ['families', 'courses', 'calendar', 'diary', 'supporters', 'tzedaka', 'shop', 'shop7', 'reports'];

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
await new Promise((r) => server.listen(4193, r));
const BASE = 'http://localhost:4193/';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
let failures = 0;
const allLeaks = [];

for (const pack of DATA.packs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const log = [];
  const t = (name, ok, extra = '') => {
    log.push(`  ${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
    if (!ok) failures++;
  };

  const config = {
    slug: 'vtx',
    orgName: 'ארגון בדיקה',
    theme: 'tsohar',
    modules: pack.modules,
    features: pack.features,
    terms: pack.terms,
  };
  await page.addInitScript((cfg) => {
    localStorage.clear();
    localStorage.setItem('maor_org_config', JSON.stringify(cfg));
    localStorage.setItem('maor_day', new Date().toISOString().slice(0, 10));
  }, config);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // אילו מילות-ברירת-מחדל אסורות בחבילה הזו: רק מונחים שהחבילה באמת החליפה,
  // ורק כשמונח-החבילה לא מכיל בעצמו את מילת-ברירת-המחדל (אחרת FP מובנה).
  const forbidden = [];
  for (const [key, fb] of Object.entries(DATA.termFallbacks)) {
    const packTerm = pack.terms[key];
    if (!packTerm || packTerm === fb) continue;
    if (SKIP_WORDS.has(fb)) continue;
    if (packTerm.includes(fb)) continue;
    // מודול כבוי בחבילה ⇒ המונח שלו ממילא לא אמור להופיע — סורקים בכל זאת
    // (דליפה חוצת-מודולים), אבל בלי בדיקת-חיוב.
    forbidden.push({ key, word: fb });
  }
  // ביקורת 6.8: נרדפות היסטוריות — 'תומכות' דלפה אף שה-fallback המוצהר הוא
  // 'תורמים'; הסורק היה עיוור למילים שאינן ב-termFallbacks.
  const SYNONYMS = { 'nav.supporters': ['תומכות'] };
  for (const [key, words] of Object.entries(SYNONYMS)) {
    const packTerm = pack.terms[key];
    const fb = DATA.termFallbacks[key];
    if (!packTerm || packTerm === fb) continue;
    for (const w of words) if (!packTerm.includes(w)) forbidden.push({ key: key + ':syn', word: w });
  }

  // הניווט: אילו מודולים אמורים להופיע
  const expectedOn = NAV_KEYS.filter((k) => pack.modules[k] !== false);
  const expectedOff = NAV_KEYS.filter((k) => pack.modules[k] === false);

  const navTexts = await page.locator('.side-link, .nav-btn').allInnerTexts();
  const navJoined = navTexts.join(' | ');

  for (const k of expectedOn) {
    const label = pack.terms['nav.' + k] ?? DATA.termFallbacks['nav.' + k] ?? k;
    t(`ניווט מציג "${label}" (${k})`, navJoined.includes(label));
  }
  for (const k of expectedOff) {
    const label = pack.terms['nav.' + k] ?? DATA.termFallbacks['nav.' + k] ?? k;
    t(`ניווט בלי "${label}" (${k} כבוי)`, !navJoined.includes(label));
  }

  // מעבר על כל המסכים + סריקת-דליפות
  const visits = [...expectedOn.map((k) => ({ k, label: pack.terms['nav.' + k] ?? DATA.termFallbacks['nav.' + k] })), { k: 'settings', label: 'הגדרות' }];
  for (const v of visits) {
    const link = page.locator('.side-link, .nav-btn', { hasText: v.label }).first();
    if ((await link.count()) === 0) {
      t(`מסך ${v.k}: קישור-ניווט נמצא`, false, `"${v.label}" לא בניווט`);
      continue;
    }
    await link.click();
    await page.waitForTimeout(350);
    // ביקורת 6.8: ההגדרות מקובצות ל-4 לשוניות — סורקים את כולן, לא רק את
    // ברירת-המחדל (אחרת דליפות בקבוצות נתונים/אבטחה/מתקדם בלתי-נראות לסורק)
    let text = await page.evaluate(() => document.body.innerText);
    if (v.k === 'settings') {
      for (const tab of ['📚 נתונים', '🔐 אבטחה', '🧪 מתקדם']) {
        const tabBtn = page.locator('button.chip', { hasText: tab }).first();
        if ((await tabBtn.count()) === 0) continue; // לשונית ריקה מוסתרת — תקין
        await tabBtn.click();
        await page.waitForTimeout(250);
        text += '\n' + (await page.evaluate(() => document.body.innerText));
      }
    }
    for (const ex of EXCEPTIONS) text = text.split(ex).join('');
    for (const f of forbidden) {
      const i = text.indexOf(f.word);
      if (i >= 0) {
        const snippet = text.slice(Math.max(0, i - 30), i + f.word.length + 30).replace(/\s+/g, ' ');
        t(`מסך ${v.k}: בלי דליפת "${f.word}" (${f.key})`, false, `«…${snippet}…»`);
        allLeaks.push({ pack: pack.id, view: v.k, key: f.key, word: f.word, snippet });
      }
    }
  }

  t('אפס שגיאות JS', errors.length === 0, errors.slice(0, 2).join(' · '));

  console.log(`\n🏷 ${pack.label} (${pack.id})`);
  // מציגים רק כשלים + סיכום הצלחות (לא להציף)
  const fails = log.filter((l) => l.includes('❌'));
  const oks = log.length - fails.length;
  console.log(`  ✅ ${oks} בדיקות עברו${fails.length ? '' : ' — נקי'}`);
  for (const f of fails) console.log(f);
  await ctx.close();
}

await browser.close();
server.close();

console.log('\n──────────');
if (failures === 0) {
  console.log(`🏆 כל ${DATA.packs.length} הוורטיקלים מתחלפים עד הקצה — אפס דליפות`);
} else {
  console.log(`❌ ${failures} כשלים · ${allLeaks.length} דליפות-מונח — פירוט למעלה`);
  process.exitCode = 1;
}
