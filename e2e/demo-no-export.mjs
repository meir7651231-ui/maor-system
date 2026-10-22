/**
 * 🔒 נעילת-הדמו בדפדפן אמיתי (22.10.2026). דרישת-הבעלים, מילה במילה:
 * «בדמו זה צריך חסום ללא כל אפשרות להורדת מידע ואם רוצים אתר משלך זה שולח אותך למסך הרשמה».
 *
 * הסקריפט נכנס ל-?org=demo נקי (בלי הזרקת-קונפיג — הקונפיג האמיתי של הדמו), עובר על כל
 * המסכים הראשיים ולוחץ על **כל** פקד שנראה כמו יציאת-מידע (ייצוא/הורדה/CSV/הדפסה/🖨/⬇/📋/
 * העתקה/גיבוי/קבלה/vCard/ICS/יומן גוגל/דוח…), כולל בתוך מודאלים שנפתחים, בפלטת ⌘K ובתפריטי ⋯.
 * לפני הטעינה מותקן "מלכודות" (init-script) שסופרות כל ניסיון להוציא מידע:
 *   window.print · iframe.contentWindow.print · navigator.clipboard.writeText/write ·
 *   document.execCommand('copy'|'cut') · navigator.share · <a download>/blob:/data: (גם a.click()
 *   תכנותי וגם הקשה אמיתית שלא בוטלה) · window.open ל-data:/blob: · ואירועי 'download' של Playwright.
 *
 * אוכף: אפס הורדות · אפס הדפסות · אפס העתקות/שיתופים · אפס שגיאות JS · לפחות הודעת-סירוב אחת
 * עם "בדמו" · מספר משמעותי של פקדי-ייצוא שנלחצו · ו-CTA «פתחו אתר משלכם» לחיץ בכניסה הראשונה
 * ומוביל לשורש-האתר (בלי פרמטרים — הכרעת-בעלים 22.10: מבקר לא-מחובר מקבל שם את ההרשמה, מחובר —
 * את המערכת שלו, כמו תמיד).
 *
 *   npx vite build && node e2e/demo-no-export.mjs
 *   DEBUG=1 node e2e/demo-no-export.mjs   # רשימת כל הפקדים שנלחצו, פר-מסך
 *   DIST_DIR=/path/to/dist-copy …         # הגשה מעותק-פרטי של ה-build
 *   PORT=4199 …                           # פורט אחר (ריצה מקבילה); ברירת-מחדל 4195
 */
import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.DIST_DIR ?? join(HERE, '..', 'dist'); // DIST_DIR — עותק-פרטי (מבודד מ-build מקביל)
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DEBUG = !!process.env.DEBUG;
const MIN_CLICKS = 40; // פחות מזה = הסריקה לא באמת עברה על המערכת

const server = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
  try {
    if (!existsSync(p) || !statSync(p).isFile()) p = join(DIST, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'text/plain';
    res.setHeader('content-type', mime);
    res.end(readFileSync(p));
  } catch { res.statusCode = 404; res.end('nf'); }
});
const PORT = Number(process.env.PORT) || 4195;
await new Promise((r) => server.listen(PORT, r));
const BASE = `http://localhost:${PORT}/`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1320, height: 980 }, acceptDownloads: true });

// ── המלכודות: כל נתיב-יציאה נספר (ולא מבוצע) ──
// (פונקציה בשם — אותן מלכודות בדיוק מותקנות גם בביקורת-החיובית של §6)
const TRAPS = () => {
  if (window.__leak) return;
  const c = { print: 0, iframePrint: 0, clipboard: 0, execCopy: 0, share: 0, anchorDl: 0, openData: 0, extShare: 0, opens: [], toasts: [], details: [] };
  window.__leak = c;
  const note = (k, d) => {
    c[k]++;
    c.details.push(k + ' :: ' + String(d).slice(0, 140));
  };
  // הדפסה — חלון ראשי
  window.print = () => note('print', 'window.print()');
  // הדפסה — iframe נסתר (receipt/printDoc/ParentCard). ה-Window של ה-iframe מתחלף בטעינת-מסמך,
  // לכן המלכודת מותקנת מחדש בכל גישה ל-contentWindow/contentDocument.
  const trapWin = (w) => {
    try {
      if (w && !(w.print && w.print.__probe)) {
        const f = () => note('iframePrint', 'iframe.contentWindow.print()');
        f.__probe = true;
        w.print = f;
      }
    } catch { /* cross-origin */ }
    return w;
  };
  const cwD = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
  Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
    configurable: true,
    get() { return trapWin(cwD.get.call(this)); },
  });
  const cdD = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentDocument');
  Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
    configurable: true,
    get() { const d = cdD.get.call(this); if (d) trapWin(d.defaultView); return d; },
  });
  // לוח-העתקה
  const clipTrap = {
    writeText: (t) => { note('clipboard', 'clipboard.writeText: ' + String(t).replace(/\s+/g, ' ')); return Promise.resolve(); },
    write: () => { note('clipboard', 'clipboard.write'); return Promise.resolve(); },
    readText: () => Promise.resolve(''),
    read: () => Promise.resolve([]),
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText = clipTrap.writeText;
    navigator.clipboard.write = clipTrap.write;
  } else {
    Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get: () => clipTrap });
  }
  const ex = Document.prototype.execCommand;
  Document.prototype.execCommand = function (cmd, ...a) {
    if (/^(copy|cut)$/i.test(String(cmd))) note('execCopy', 'execCommand(' + cmd + ')');
    return ex.call(this, cmd, ...a);
  };
  // גיליון-שיתוף ילידי (מוגדר גם בדסקטופ — כמו בנייד — כדי שקוד שבודק אותו ייכנס לנתיב)
  Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: (d) => { note('share', 'navigator.share ' + JSON.stringify(d ?? {})); return Promise.resolve(); } });
  Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: () => true });
  // הורדות דרך <a>
  const isDl = (a) => a.hasAttribute('download') || /^(blob|data):/i.test(a.getAttribute('href') || '');
  const ac = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (isDl(this)) note('anchorDl', 'a.click() download=' + (this.getAttribute('download') ?? '') + ' href=' + (this.getAttribute('href') || '').slice(0, 50));
    return ac.call(this);
  };
  window.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !e.isTrusted || !isDl(a)) return;
    setTimeout(() => { if (!e.defaultPrevented) note('anchorDl', 'tap on <a> download/href=' + (a.getAttribute('href') || '').slice(0, 50)); }, 0);
  }, true);
  // חלונות חדשים — data:/blob: = יציאת-מידע; השאר נרשמים לדיווח
  const wo = window.open;
  window.open = function (url, ...a) {
    const u = String(url ?? '');
    c.opens.push(u.slice(0, 80));
    if (/^(blob|data):/i.test(u)) { note('openData', 'window.open ' + u.slice(0, 50)); return null; }
    return wo.call(this, url, ...a);
  };
  // הודעות-הסירוב (toast) — נאספות ברגע שהן מופיעות (הן נעלמות אחרי כמה שניות)
  const watch = () => {
    const seen = new WeakSet();
    const grab = (el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      const t = (el.textContent || '').trim();
      if (t) c.toasts.push(t);
    };
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches('.toast')) grab(n);
        n.querySelectorAll('.toast').forEach(grab);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) watch();
  else document.addEventListener('DOMContentLoaded', watch);
};
await ctx.addInitScript(TRAPS);

// let — הביקורת-החיובית בסוף (§6) מחליפה את הדף לדף של לקוח רגיל, וכל עזרי-הניווט עובדים עליו
let page = await ctx.newPage();
const errors = [];
const consoleErrors = [];
const downloads = [];
const popups = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('download', (d) => downloads.push(d.suggestedFilename()));
page.on('filechooser', () => { /* אף פקד-ייצוא לא אמור לפתוח בורר-קבצים; ממילא לא נבחר קובץ */ });
ctx.on('page', async (p) => {
  if (p === page) return;
  popups.push(p);
  p.on('download', (d) => downloads.push('popup:' + d.suggestedFilename()));
});

const log = [];
let failures = 0;
const T = (name, cond, extra = '') => { log.push(`  ${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) failures++; return cond; };
const wait = (ms) => page.waitForTimeout(ms);

// ── פקדים שנראים כמו יציאת-מידע (נדיב בכוונה) ו"מסוכנים" שלא נוגעים בהם ──
const EXPORT_RE = /ייצוא|יצוא|ייצא|הורד|⬇|csv|הדפס|🖨|📋|העתק|גיבוי|קבלה|קבלות|vcard|vcf|\bics\b|יומן גוגל|גוגל|google|דוח|דו״ח|דו"ח|pdf|📄|📎|שית|שתפ|📤|📥|תדפיס|אקסל|excel|קובץ|קבצים|רשימת חיוג|🧾|📑|סיכום להורים|כרטיס.?הורה|הפקת|הנפקת/i;
const SKIP_RE = /מחיק|מחק|🗑|איפוס|אפס|שכפ|סיום|בטוח\?|מסמך…|תמונה…|התחל דמו מחדש|פתחו אתר משלכם|שחזור|ייבוא|יבוא|העלא|העלה|התנתק|יציאה|בדוק עדכון|סגירה|^✕$|ביטול/;
// פקדים שפותחים פאנל/מודאל/מסך-משנה שבתוכו עלולים להסתתר פקדי-ייצוא (נסרקים שכבה אחת פנימה)
const OPENER_RE = /דשבורד|גבייה|מרכז|הודעה לכיתה|שימור|מודיעין|חלון.העבודה|מעקב|אבחון|ניהול|⚙|📢|💰|💚|🎯|🗓|גיליון|רשימת|פעולות|הצגת הכל|המסך המלא|🙏|תפילה|רישום תרומה|💳|מכתב|📇|📈|סיכום|היסטוריה|✎ עריכ|⋯|▾|לוח מעקב|שמות|מתנדב|ימי.חלוקה|רכז|קטלוג|שיוכים|מימושים|תקופה|שבועי|חודשי|לשונית|טאב/;
// פותחנים שהם בעצם ניווט לכרטיס אחר / תא-יום — כבר מכוסים במפורש, ורק מוסיפים רעש
const OPENER_SKIP = /לכרטיס|תצוגת יום|מעבר:|פתיחת כרטיס|^✓ /;
const MAX_OPENERS = 10;
const MAX_PER_LABEL = 2; // אותו פקד שחוזר בכל שורה — שתי שורות מספיקות

const clicked = []; // `${screen} :: ${label}`

const OVERLAY = '.modal-back, .palette-back';
/** סוגר מודאלים/פלטה עד שנשארים `level` (מודאל-הבסיס של פותחן נשאר פתוח). רכיב Modal נסגר ב-Escape או ב-mousedown על הרקע. */
async function closeModalsTo(level) {
  for (let i = 0; i < 8; i++) {
    const n = await page.locator(OVERLAY).count();
    if (n <= level) return;
    await page.keyboard.press('Escape').catch(() => {});
    await wait(160);
    if ((await page.locator(OVERLAY).count()) >= n) {
      await page.locator(OVERLAY).last().dispatchEvent('mousedown').catch(() => {});
      await wait(160);
    }
  }
}
const closeModals = () => closeModalsTo(0);
let bannerNoted = false;
/** מצב-בסיס: בלי מודאלים/פלטה ובלי מסך-hash (אשף/קיר/טיימר/מדריך). */
async function resetView() {
  // באנר "עודכנה גרסה חדשה" (version.json ≠ ה-build המוגש — build מקביל באותה תיקייה) מכסה את הניווט
  const x = page.locator('.update-banner-x');
  if (await x.count()) {
    await x.first().click({ timeout: 2000 }).catch(() => {});
    if (!bannerNoted) { bannerNoted = true; log.push('  ℹ️ באנר "גרסה חדשה" נסגר — dist/version.json השתנה תוך כדי (build מקביל?). מומלץ DIST_DIR לעותק-פרטי.'); }
  }
  await closeModals();
  if (await page.evaluate(() => location.hash.length > 1)) {
    await page.evaluate(() => { location.hash = ''; });
    await wait(350);
    await closeModals();
  }
}

/** סורק את הפקדים הגלויים בתוך scope, מסמן את הבא-בתור ב-data-probe ומחזיר את התווית שלו. */
async function nextTarget(scopeSel, done, mode = 'export') {
  return page.evaluate(({ scopeSel, done, exportSrc, skipSrc, maxPer, mode, openerSrc, opSkipSrc }) => {
    const EX = new RegExp(exportSrc, 'i');
    const OP = new RegExp(openerSrc, 'i');
    const OPS = new RegExp(opSkipSrc);
    const SK = new RegExp(skipSrc);
    document.querySelectorAll('[data-probe]').forEach((e) => e.removeAttribute('data-probe'));
    // קישורי-שיתוף חיצוניים (וואטסאפ/מפות/SMS/מייל/חיוג) נושאים את הרשומה ב-URL (טלפון, סיכום, חוב,
    // כתובות) — בדמו אסור שיהיה אחד עם href. נספרים פעם אחת לכל href. tel: (ביקורת 22.10): 📞 בטבלת-
    // התורמים/זרימה-אחת/קוקפיט/CallBtn העביר את טלפון-הרשומה לחייגן — אותו ערוץ כמו וואטסאפ.
    const L = window.__leak;
    L.extSeen = L.extSeen || new Set();
    for (const a of document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href') || '';
      if (!/^(https:\/\/wa\.me\/|whatsapp:|https:\/\/www\.google\.com\/maps|sms:|mailto:|tel:)/i.test(h) || L.extSeen.has(h)) continue;
      L.extSeen.add(h);
      L.extShare++;
      L.details.push('extShare :: ' + h.slice(0, 90));
    }
    const scopes = [...document.querySelectorAll(scopeSel)];
    const scope = scopes[scopes.length - 1];
    if (!scope) return null;
    const modalOpen = !!document.querySelector('.modal-back, .palette-back');
    const els = [...scope.querySelectorAll('button, a, [role=button], [role=menuitem], [role=tab], [role=option], summary, label.btn')];
    const seen = new Map();
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest('[aria-hidden=true]')) continue;
      // כשמודאל פתוח והסריקה היא על כל העמוד — רק מה שבתוך המודאל העליון לחיץ באמת
      if (modalOpen && scopeSel === 'body' && !el.closest('.modal-back, .palette-back')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      const title = (el.getAttribute('title') || el.getAttribute('aria-label') || '').trim().slice(0, 70);
      const label = text + (title ? ' [' + title + ']' : '');
      if (!label) continue;
      // ה"מסוכנים" נבדקים בטקסט הגלוי בלבד: title כמו «קובץ ICS לייבוא ליומן» לא הופך פקד-ייצוא לפקד-ייבוא
      if (SK.test(text)) continue;
      if (mode === 'export' ? !EX.test(label) : (EX.test(label) || !OP.test(label) || OPS.test(label) || text.length > 40)) continue;
      // קישור חיצוני (wa.me/מפות וכד׳) — לא יציאת-קובץ; נרשם רק אם הוא data:/blob:
      if (el.tagName === 'A') {
        const h = el.getAttribute('href') || '';
        if (h && !/^(blob|data):/i.test(h) && !el.hasAttribute('download') && !h.startsWith('#')) continue;
      }
      const n = seen.get(label) ?? 0;
      seen.set(label, n + 1);
      if (n >= maxPer) continue;
      const key = label + '#' + n;
      if (done.includes(key)) continue;
      el.setAttribute('data-probe', '1');
      el.scrollIntoView({ block: 'center' });
      return { key, label };
    }
    return null;
  }, { scopeSel, done: [...done], exportSrc: EXPORT_RE.source, skipSrc: SKIP_RE.source, maxPer: mode === 'export' ? MAX_PER_LABEL : 1, mode, openerSrc: OPENER_RE.source, opSkipSrc: OPENER_SKIP.source });
}

async function clickProbe() {
  const l = page.locator('[data-probe]').first();
  // force: פקד מתחת ל-overlay שקוף עדיין "לחיץ" מבחינת המבקר — רוצים לבדוק גם אותו
  await l.click({ timeout: 2500 }).catch(async () => { await l.click({ timeout: 1500, force: true }).catch(() => {}); });
}

const screenSig = () =>
  page.evaluate(() => {
    const nav = document.querySelector('nav.app-nav button.active')?.textContent ?? '';
    const h = document.querySelector('main h1, main h2, main h3')?.textContent ?? '';
    return nav + '|' + h.trim().slice(0, 40) + '|' + location.hash;
  });
/**
 * חתימת-השכבות הפתוחות (כותרות המודאלים + פלטה). ביקורת-השוטר 22.10: תפריט «⋯ עוד» (ActionsMenu) הוא
 * מודאל שנסגר בלחיצה על פריט — ואם הפריט פתח מודאל משלו, מספר-השכבות חזר לרמת-הבסיס עם מודאל *אחר*.
 * ההשוואה לפי ספירה בלבד לא זיהתה זאת, והסריקה נעצרה אחרי הפריט הראשון (דוחות-שנתיים-לכולם, שמות-לתפילה
 * וכו׳ לא נלחצו). השוואת-החתימה מחזירה את התפריט לפני כל פריט.
 */
const overlaySig = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.modal-back > .modal, .palette-back')]
      .map((m) => m.getAttribute('aria-label') || m.className)
      .join('|'),
  );

/** אחרי לחיצה שפתחה מודאל — לוחצים גם על פקדי-הייצוא שבתוכו (שכבה אחת, עד 12). */
async function sweepModal(screen, done) {
  for (let i = 0; i < 12; i++) {
    if (!(await page.locator(OVERLAY).count())) return;
    const t = await nextTarget(OVERLAY, done);
    if (!t) return;
    done.add(t.key);
    await clickProbe();
    clicked.push(`${screen} › מודאל :: ${t.label}`);
    await wait(350);
  }
}

/**
 * סריקת-מסך: goto מביא למסך (טרי), ואז לוחצים על כל פקד-ייצוא בו — כל פעם הבא-בתור.
 * אם הלחיצה הזיזה למסך אחר — חוזרים (goto) לפני הבא.
 */
async function sweep(screen, goto, scopeSel = 'body', { openers = true, fresh = false } = {}) {
  const done = new Set();
  const before = clicked.length;
  if (fresh) await freshPage();
  try {
    await goto();
  } catch (e) {
    const msg = String(e).split('\n')[0];
    // לשונית-הגדרות שלא קיימת בדמו (#511 — אין נתונים/גיבוי) היא מצב צפוי, לא תקלת-סריקה
    log.push(`  ${msg.includes('אין לשונית') ? 'ℹ️' : '⚠️'} ${screen}: לא נפתח (${msg.slice(0, 80)})`);
    if (process.env.SHOT_DIR) await page.screenshot({ path: join(process.env.SHOT_DIR, 'fail-' + screen.replace(/[^\p{L}\d]+/gu, '_').slice(0, 40) + '.png') }).catch(() => {});
    await resetView().catch(() => {});
    return 0;
  }
  const sig0 = await screenSig();
  const base = await page.locator(OVERLAY).count(); // goto שפתח מודאל (פותחן) — זו רמת-הבסיס
  const ov0 = await overlaySig(); // אילו מודאלים בדיוק (לא רק כמה) — ראו overlaySig
  for (let guard = 0; guard < 60; guard++) {
    const t = await nextTarget(scopeSel, done);
    if (!t) break;
    done.add(t.key);
    await clickProbe();
    clicked.push(`${screen} :: ${t.label}`);
    await wait(380);
    await sweepModal(screen, done);
    await closeModalsTo(base);
    if (
      (await screenSig()) !== sig0 ||
      (await page.locator(OVERLAY).count()) !== base ||
      (await overlaySig()) !== ov0 ||
      !(await page.locator(scopeSel).count())
    ) {
      await goto().catch(() => {});
    }
  }
  const n = clicked.length - before;
  log.push(`  · ${screen}: ${n} פקדי-ייצוא נלחצו`);
  if (!openers) return n;
  // שכבה אחת פנימה: כל פותחן (פאנל/מודאל/מסך-משנה) ⇒ סריקת-ייצוא בתוכו
  await goto().catch(() => {});
  const opDone = new Set();
  const opLabels = [];
  for (let i = 0; i < MAX_OPENERS; i++) {
    const o = await nextTarget('main', opDone, 'opener');
    if (!o) break;
    opDone.add(o.key);
    opLabels.push(o.label);
  }
  for (const label of opLabels) {
    await sweep(`${screen} › ${label.slice(0, 28)}`, async () => {
      await goto();
      await clickByLabel('main', label);
      await wait(450);
    }, 'body', { openers: false, fresh: true });
  }
  return clicked.length - before;
}

/** לוחץ על הפקד הראשון ב-scope שהתווית המחושבת שלו זהה (לפותחנים). */
async function clickByLabel(scopeSel, label) {
  const ok = await page.evaluate(({ scopeSel, label }) => {
    document.querySelectorAll('[data-probe]').forEach((e) => e.removeAttribute('data-probe'));
    const scope = [...document.querySelectorAll(scopeSel)].pop();
    if (!scope) return false;
    for (const el of scope.querySelectorAll('button, a, [role=button], [role=menuitem], [role=tab], [role=option], summary, label.btn')) {
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70);
      const title = (el.getAttribute('title') || el.getAttribute('aria-label') || '').trim().slice(0, 70);
      if (text + (title ? ' [' + title + ']' : '') === label && el.getBoundingClientRect().width) {
        el.setAttribute('data-probe', '1');
        return true;
      }
    }
    return false;
  }, { scopeSel, label });
  if (!ok) throw new Error('הפותחן לא נמצא: ' + label.slice(0, 40));
  await clickProbe();
}

// ── ניווט ──
async function navTo(label) {
  await resetView();
  const direct = page.locator('nav.app-nav button', { hasText: label });
  if (await direct.count()) {
    await direct.first().click({ timeout: 4000 });
  } else {
    await page.locator('nav.app-nav button', { hasText: 'עוד' }).first().click({ timeout: 4000 });
    await wait(300);
    await page.locator('.modal-back button', { hasText: label }).first().click({ timeout: 3000 });
  }
  await wait(550);
}
/** מסך-רשימה נקי: חוזרים מכרטיס פתוח (→ כל …) עד שהרשימה עצמה מוצגת. */
async function navList(label) {
  await navTo(label);
  for (let i = 0; i < 3; i++) {
    const back = page.locator('.sticky-back button');
    if (!(await back.count())) break;
    await back.first().click({ timeout: 3000 }).catch(() => {});
    await wait(450);
  }
  // מבט-עבודה (קוקפיט/מודיעין) שנשאר דלוק ⇒ חזרה לרשימה עצמה
  for (const t of ['☰ מסך הנתונים', '☰ הרשימה']) {
    const b = page.locator('main button:visible', { hasText: t });
    if (await b.count()) { await b.first().click({ timeout: 3000 }).catch(() => {}); await wait(400); }
  }
}
/** מצטבר-המלכודות בצד-הבדיקה: טעינה-מחדש מאפסת את window.__leak, לכן אוספים לפני. */
const total = { print: 0, iframePrint: 0, clipboard: 0, execCopy: 0, share: 0, anchorDl: 0, openData: 0, extShare: 0, opens: [], toasts: [], details: [] };
const LEAK_KEYS = ['print', 'iframePrint', 'clipboard', 'execCopy', 'share', 'anchorDl', 'openData', 'extShare'];
async function harvest() {
  const l = await page.evaluate((keys) => {
    const c = window.__leak;
    const { extSeen, ...rest } = c; // Set לא עובר JSON — נשאר בדף (דדופ פר-טעינה)
    void extSeen;
    const snap = JSON.parse(JSON.stringify(rest));
    for (const k of keys) c[k] = 0;
    c.opens = []; c.toasts = []; c.details = [];
    return snap;
  }, LEAK_KEYS).catch(() => null);
  if (!l) return;
  for (const k of LEAK_KEYS) total[k] += l[k];
  total.opens.push(...l.opens); total.toasts.push(...l.toasts); total.details.push(...l.details);
}
/** טעינה-מחדש בין קבוצות-מסכים: מצב-סשן (מסננים זכורים, כרטיס פתוח) לא זולג מקבוצה לקבוצה. */
async function freshPage() {
  await harvest();
  await page.reload({ waitUntil: 'networkidle' });
  await wait(1100);
}
async function openSettings() {
  await resetView();
  await page.locator('button[aria-label="הגדרות"]').first().click({ timeout: 4000 });
  await wait(600);
}
/** פותח את הפריט הראשון ברשימה במסך הנוכחי (כרטיס משפחה/תורם/חוג). */
async function openFirst(selectors) {
  for (const sel of selectors) {
    const l = page.locator(sel);
    if (await l.count()) {
      await l.first().click({ timeout: 3000 });
      await wait(700);
      return true;
    }
  }
  throw new Error('לא נמצא פריט לפתיחה: ' + selectors.join(' , '));
}
const ROW_SEL = ['main tbody tr', 'main .card[role=button]', 'main [role=button][title*="כרטיס"]', 'main li[role=button]'];

console.log('🧪 נעילת-הדמו — ?org=demo: אפס יציאת-מידע + CTA לשורש-האתר');

// ── כניסה נקייה — הקונפיג האמיתי של הדמו (public/c/demo/config.json), בלי הזרקה ──
await page.goto(BASE + '?org=demo', { waitUntil: 'networkidle' });
await wait(1600);

// ── 1. ה-CTA «פתחו אתר משלכם» — לחיץ בכניסה הראשונה ומוביל לשורש-האתר ──
T('סרט "מצב הדגמה" מוצג', ((await page.locator('body').textContent()) ?? '').includes('מצב הדגמה'));
T('אין מודאל פתוח בכניסה הראשונה (שום דבר לא בולע את ה-CTA)', (await page.locator('.modal-back').count()) === 0);
const cta = page.locator('a', { hasText: 'פתחו אתר משלכם' }).first();
T('CTA «פתחו אתר משלכם» קיים', (await cta.count()) === 1 || (await cta.count()) > 0);
T('CTA לחיץ בכניסה הראשונה (לא מכוסה)', await cta.click({ trial: true, timeout: 3000 }).then(() => true, () => false));
const ctaHref = (await cta.getAttribute('href')) ?? '';
const ctaUrl = new URL(ctaHref, page.url());
T('CTA ⇒ שורש-האתר (בלי פרמטרים)', ctaUrl.href === BASE && !ctaUrl.search, ctaHref);
T('CTA לא נפתח בחלון חדש (אותו טאב ⇒ השורש)', !(await cta.getAttribute('target')));
T('נעילת-הדמו פעילה (data-demo-lock על ה-root)', await page.evaluate(() => document.documentElement.hasAttribute('data-demo-lock')));

// ── 2. קיצורי-דפדפן והעתקה ידנית ──
await page.keyboard.press('Control+p');
await wait(250);
await page.keyboard.press('Control+s');
await wait(250);
await page.locator('main').first().selectText().catch(() => {});
await page.keyboard.press('Control+c');
await wait(200);
await page.evaluate(() => { try { document.execCommand('copy'); } catch { /* */ } });
// ה-execCommand הזה הוא של הבדיקה עצמה — לא של האפליקציה; מנקים אותו מהמונה אחרי שבדקנו שהאירוע נבלע
const manualCopyBlocked = await page.evaluate(() => {
  const ev = new Event('copy', { bubbles: true, cancelable: true });
  document.body.dispatchEvent(ev);
  const c = window.__leak;
  c.execCopy = 0;
  c.details = c.details.filter((d) => !d.startsWith('execCopy'));
  return ev.defaultPrevented;
});
T('העתקה ידנית (Ctrl+C / אירוע copy) נבלעת', manualCopyBlocked);
// הדפסה מתפריט-הדפדפן / «שמירה כ-PDF» — אי-אפשר לבטל מ-JS, לכן גיליון-ההדפסה מסתיר את הדף
await page.emulateMedia({ media: 'print' });
T('הדפסה מתפריט-הדפדפן: גיליון-ההדפסה מסתיר את כל הדף (body display:none)', await page.evaluate(() => getComputedStyle(document.body).display === 'none'));
await page.emulateMedia({ media: 'screen' });
T('סימון-טקסט כבוי מחוץ לשדות-קלט (user-select:none ⇒ אין גרירה/שיתוף של טקסט מסומן)', await page.evaluate(() => getComputedStyle(document.body).userSelect === 'none'));

// ── 2ב. זריעה: נתיבי-ייצוא שנעצרים ב"אין מה להוריד" כשהרשימה ריקה ──
// ביקורת-השוטר 22.10: בנתוני-הדמו אין שמות-לטיפול ואין שמות-לתפילה ⇒ «📥 דוח שמות», «⬇ דוח מלא CSV»,
// «⬇ הורדת גיליון», «🙏 שמות לתפילה — קובץ מסודר» וכפתורי-ההעתקה/הדפסה בכרטיס עצרו בהודעת "אין…" *לפני*
// שהגיעו לעזר-ההורדה — לחיצה שלא מוכיחה כלום. זריעת שם אחד מכל סוג מכריחה אותם להגיע עד השער.
const SEED_CARE = 'שם-בדיקה לטיפול';
const SEED_PRAYER = 'רחל בת לאה';
/** זורע שם-לטיפול ושם-לתפילה בכרטיס-התורם הראשון. נקרא שוב לפני התרחישים הממוקדים: הסריקה לוחצת
 *  גם «↻ מחזור חדש» (פתיחת מחזור-טיפול מאפסת את השמות) — ריצה מלאה 22.10 נכשלה בדיוק על זה. */
async function seedNames(tag) {
  try {
    await navList('תורמים');
    await openFirst(ROW_SEL);
    const careIn = page.locator('input[placeholder="שם לטיפול"]').first();
    await careIn.fill(SEED_CARE, { timeout: 4000 });
    await page.locator('input[placeholder="כמות"]').first().fill('7').catch(() => {});
    await page.locator('button', { hasText: '+ הוספה' }).first().click({ timeout: 3000 });
    await wait(400);
    await page.locator('input[aria-label="שם לתפילה"]').first().fill(SEED_PRAYER, { timeout: 4000 });
    await page.locator('button', { hasText: '+ הוספת שם לתפילה' }).first().click({ timeout: 3000 });
    await wait(500);
    const seeded = await page.evaluate((names) => {
      const has = (n) => document.body.innerText.includes(n) || [...document.querySelectorAll('input, textarea')].some((i) => i.value === n);
      return names.map(has);
    }, [SEED_CARE, SEED_PRAYER]);
    T(`זריעה (${tag}): שם-לטיפול נוסף לכרטיס-התורם (נתיבי-הייצוא של מעקב-הטיפול מגיעים לשער)`, seeded[0]);
    T(`זריעה (${tag}): שם-לתפילה נוסף לכרטיס-התורם (נתיבי-ההעתקה/ההדפסה של שמות-התפילה מגיעים לשער)`, seeded[1]);
  } catch (e) {
    T(`זריעה (${tag}): שם-לטיפול + שם-לתפילה`, false, String(e).split('\n')[0].slice(0, 90));
  }
  await resetView();
}
await seedNames('לפני הסריקה');

// ── 3. סריקת כל המסכים ──
await sweep('בית', async () => { await navTo('בית'); });
// לוח-הבית בעריכה: מוסיפים את כל הווידג'טים (כולל ⚡ פעולות-מהירות ⇒ ⬇ גיבוי) ושומרים
try {
  await navTo('בית');
  const edit = page.locator('button.hm-edit-link');
  if (await edit.count()) {
    await edit.first().click();
    await wait(500);
    for (let i = 0; i < 40; i++) {
      const add = page.locator('button', { hasText: '+ הוספה' });
      if (!(await add.count())) break;
      await add.first().click();
      await wait(120);
    }
    await page.locator('button[title="שמירת הפריסה ללוח הבית של הארגון"]').first().click({ timeout: 3000 });
    await wait(600);
  }
} catch (e) {
  log.push('  ⚠️ עריכת-הלוח: ' + String(e).split('\n')[0].slice(0, 80));
}
await sweep('בית (כל הווידג׳טים)', async () => { await navTo('בית'); });

await freshPage();
await sweep('משפחות', async () => { await navList('משפחות'); });
await freshPage();
await sweep('כרטיס משפחה', async () => { await navList('משפחות'); await openFirst(ROW_SEL); });

await freshPage();
await sweep('חוגים', async () => { await navList('חוגים'); });
await freshPage();
await sweep('כרטיס חוג', async () => { await navList('חוגים'); await openFirst(['main .card[role=button]', ...ROW_SEL]); });

await freshPage();
await sweep('לוח שנה', async () => { await navTo('לוח שנה'); });
await freshPage();
await sweep('יומן חדרים', async () => { await navTo('יומן חדרים'); });

await freshPage();
await sweep('תורמים', async () => { await navList('תורמים'); });
await freshPage();
await sweep('תורמים › תפריט ⋯', async () => {
  await navList('תורמים');
  await page.locator('main button', { hasText: '⋯' }).first().click({ timeout: 3000 });
  await wait(300);
});
await freshPage();
await sweep('כרטיס תורם', async () => { await navList('תורמים'); await openFirst(ROW_SEL); });

// מודולים מאחורי "עוד ▾" (בדמו כולם דלוקים — modules:{} ⇒ חסר=פעיל)
for (const mod of ['קופות צדקה', 'חנות', 'חלוקה', 'דוחות']) {
  await freshPage();
  await sweep(mod, async () => { await navList(mod); });
}
// לשוניות-הפנים של העמודות המבודדות: מסך-הכניסה של קופות-הצדקה הוא «רכזים» ושל החנות «קטלוג» —
// ייצוא-הריקונים/המימושים יושב בלשונית «טיפול», קבלות-החנות ב«מוטבים», תדפיס-הרכז בכרטיס-הרכז
// ותדפיס-המסירות בלוח-המסירות של יום-חלוקה. בלי המעבר הזה הסריקה לא נגעה בהם בכלל.
const MODULE_TABS = [
  ['קופות צדקה', ['🏠 טיפול', '📅 לוח', '🏆 ראווה']],
  ['חנות', ['👥 מוטבים', '🏠 טיפול', '📅 לוח', '🖼 ראווה']],
  ['חלוקה', ['🦺']],
];
const MUST_HIT = new Set(['קופות צדקה › 🏠 טיפול', 'חנות › 🏠 טיפול']); // פקד-ייצוא ידוע בלשונית
for (const [mod, tabs] of MODULE_TABS) {
  for (const tab of tabs) {
    await freshPage();
    const name = `${mod} › ${tab}`;
    const n = await sweep(name, async () => {
      await navList(mod);
      const chip = page.locator('main button.chip', { hasText: tab });
      if (!(await chip.count())) throw new Error('אין לשונית ' + tab + ' בדמו');
      await chip.first().click({ timeout: 4000 });
      await wait(500);
    }, 'body', { openers: false });
    if (MUST_HIT.has(name)) T(`${name}: פקד-הייצוא נמצא ונלחץ`, n >= 1, `נלחצו ${n}`);
  }
}
await freshPage();
const coordN = await sweep('קופות צדקה › כרטיס רכז', async () => {
  await navList('קופות צדקה');
  await page.locator('main button.card[title="פתיחת כרטיס הרכז/ת"]').first().click({ timeout: 4000 });
  await wait(500);
}, 'body', { openers: false });
T('קופות צדקה › כרטיס רכז: «🖨 תדפיס» נמצא ונלחץ', coordN >= 1, `נלחצו ${coordN}`);
await freshPage();
const dayN = await sweep('חלוקה › לוח מסירות', async () => {
  await navList('חלוקה');
  await page.locator('main button', { hasText: 'לוח מסירות' }).first().click({ timeout: 4000 });
  await wait(500);
}, 'body', { openers: false });
T('חלוקה › לוח מסירות: «🖨 תדפיס מסירות» נמצא ונלחץ', dayN >= 1, `נלחצו ${dayN}`);

// הגדרות — כל הלשוניות
// (בדמו ההגדרות מוקשחות — #511: רק "הארגון שלי"/"אשף ההקמה"/"צ׳אט"; לשונית שלא קיימת נרשמת ולא נכשלת)
const SETTINGS_TABS = ['הארגון שלי', 'אשף ההקמה', 'צ׳אט הצוות', 'נתונים', 'מתקדם', 'גיבוי'];
await freshPage();
await sweep('הגדרות', openSettings);
for (const tab of SETTINGS_TABS) {
  await sweep('הגדרות › ' + tab, async () => {
    await openSettings();
    const chip = page.locator('main button', { hasText: tab });
    if (!(await chip.count())) throw new Error('אין לשונית ' + tab + ' בדמו');
    await chip.first().click({ timeout: 4000 });
    await wait(700);
  });
}
await resetView();

await freshPage();
// מסכי-hash: קופה רושמת / טיימר / קיר-השפעה / מדריך
for (const [name, hash] of [['קופה רושמת', '#cashbox'], ['טיימר', '#timer'], ['קיר ההשפעה', '#wall'], ['מדריך', '#guide']]) {
  await sweep(name, async () => {
    await resetView();
    await page.evaluate((h) => { location.hash = h; }, hash);
    await wait(800);
  }, 'body', { openers: false });
  await resetView();
}
// עזרה ❓
await sweep('עזרה', async () => { await resetView(); await page.locator('button[aria-label="עזרה"]').first().click({ timeout: 4000 }); await wait(600); }, 'body', { openers: false });

// פלטת ⌘K — מחפשים כל מילת-ייצוא ולוחצים על כל תוצאה
const PALETTE_QUERIES = ['גיבוי', 'ייצוא', 'הורדה', 'העתק', 'טלפונים', 'CSV', 'הדפס', 'דוח', 'קבלה', 'יומן', 'vCard', 'קופה'];
await freshPage();
for (const q of PALETTE_QUERIES) {
  const openPalette = async () => {
    await resetView();
    await navTo('בית');
    await page.keyboard.press('Control+k');
    await wait(350);
    const inp = page.locator('.palette input').first();
    if (!(await inp.count())) throw new Error('הפלטה לא נפתחה');
    await inp.fill(q);
    await wait(350);
  };
  // כל תוצאה בפלטה היא פקודה — כולן נלחצות (לא רק אלה שהתווית שלהן "נראית" כמו ייצוא)
  // פלטה שלא נפתחה = כשל (לא אזהרה): אחרת נתיבי-הפלטה (גיבוי/העתקת-טלפונים) לא נבדקים בכלל
  const paletteOpens = () => openPalette().then(() => true, (e) => { T(`פלטה ⌘K "${q}" נפתחה`, false, String(e).split('\n')[0].slice(0, 80)); return false; });
  const before = clicked.length;
  const n = (await paletteOpens()) ? await page.locator('.palette [role=option]').count() : 0;
  for (let i = 0; i < Math.min(n, 8); i++) {
    if (!(await paletteOpens())) break;
    const opt = page.locator('.palette [role=option]').nth(i);
    if (!(await opt.count())) break;
    const lbl = ((await opt.textContent()) ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
    await opt.click({ timeout: 2500 }).catch(() => {});
    clicked.push(`פלטה ⌘K "${q}" :: ${lbl}`);
    await wait(400);
    await sweepModal(`פלטה ⌘K "${q}"`, new Set());
    await resetView();
  }
  log.push(`  · פלטה ⌘K "${q}": ${clicked.length - before} פקודות הורצו`);
  // נתיב-מקלדת: Enter על התוצאה הראשונה
  await resetView();
  await page.keyboard.press('Control+k');
  await wait(300);
  const inp = page.locator('.palette input').first();
  if (await inp.count()) {
    await inp.fill(q);
    await wait(300);
    await page.keyboard.press('Enter');
    clicked.push(`פלטה ⌘K "${q}" :: Enter`);
    await wait(450);
  } else {
    T(`פלטה ⌘K "${q}" נפתחה (נתיב-מקלדת)`, false);
  }
  await closeModals();
}

// ── 3ב. תרחישים ממוקדים — נתיבי-יציאה שנולדים מפעולה (לא מכפתור שנקרא "ייצוא") ──
// strict: תרחיש שלא הושלם (פקד חסר/לא לחיץ) = כשל, לא אזהרה — לפקדים שידוע שקיימים בדמו
const flowRefusal = async (name, fn, { strict = false } = {}) => {
  const t0 = (await page.evaluate(() => window.__leak.toasts.length));
  try {
    await fn();
  } catch (e) {
    const msg = String(e).split('\n')[0].slice(0, 90);
    if (strict) T(`תרחיש: ${name} — הושלם`, false, msg);
    else log.push(`  ⚠️ תרחיש "${name}" לא הושלם: ${msg}`);
    await resetView().catch(() => {});
    return;
  }
  await wait(500);
  const fresh = await page.evaluate((t0) => window.__leak.toasts.slice(t0), t0);
  T(`תרחיש: ${name} ⇒ הודעת-סירוב "בדמו"`, fresh.some((t) => t.includes('בדמו')), fresh.slice(0, 2).join(' | ').slice(0, 120));
  clicked.push(`תרחיש :: ${name}`);
  await resetView();
};
const openSupporterCard = async () => { await navList('תורמים'); await openFirst(ROW_SEL); };
const openCourseCard = async () => { await navList('חוגים'); await openFirst(['main .card[role=button]', ...ROW_SEL]); };
await freshPage();
const recordDonation = async () => {
  await openSupporterCard();
  await page.locator('main button:visible', { hasText: '➕ רישום' }).first().click({ timeout: 4000 });
  await wait(400);
  await page.locator('.modal input[type=number]').first().fill('180');
  await page.locator('.modal .modal-actions button').first().click({ timeout: 3000 });
  await wait(600);
};
// (א) רישום תרומה ⇒ קבלת D- יורדת אוטומטית (קובץ טקסט)
await flowRefusal('רישום תרומה ⇒ קבלה אוטומטית (טקסט)', async () => {
  await openSettings();
  await page.locator('main button', { hasText: '📄 קובץ טקסט' }).first().click({ timeout: 4000 });
  await wait(300);
  await recordDonation();
});
// (ב) אותו דבר בפורמט PDF ⇒ iframe-הדפסה; וגם הורדה-חוזרת של קבלה קיימת כ-PDF
await flowRefusal('רישום תרומה ⇒ קבלה אוטומטית (PDF/הדפסה)', async () => {
  await openSettings();
  await page.locator('main button', { hasText: '🖨 PDF / הדפסה' }).first().click({ timeout: 4000 });
  await wait(300);
  await recordDonation();
});
await flowRefusal('הורדה-חוזרת של קבלה כ-PDF', async () => {
  await openSupporterCard();
  await page.locator('main button:visible', { hasText: '🧾 הורדה' }).first().click({ timeout: 4000 });
});
await openSettings();
await page.locator('main button', { hasText: '📄 קובץ טקסט' }).first().click({ timeout: 4000 }).catch(() => {});
// (ג) קבלת תשלום על שיבוץ ⇒ קבלת R-
await flowRefusal('קבלת תשלום בחוג ⇒ קבלת R-', async () => {
  await openCourseCard();
  await page.locator('main button:visible', { hasText: '⚙' }).first().click({ timeout: 4000 });
  await wait(500);
  await page.locator('.modal input[placeholder="סכום ₪"]').first().fill('120');
  await page.locator('.modal button', { hasText: 'קבלת תשלום' }).first().click({ timeout: 3000 });
  await wait(600);
});
// (ד) קובץ מצורף לחוג (data:) — לא נפתח/נשמר: בלי href, והקשה (רגילה/אמצעית) מסורבת
await flowRefusal('קובץ מצורף לחוג (data:) — פתיחה מהטופס ומהכרטיס', async () => {
  await openCourseCard();
  await page.locator('main button:visible', { hasText: '✎ עריכת' }).first().click({ timeout: 4000 });
  await wait(500);
  await page.locator('.modal input[type=file]:not([accept])').first().setInputFiles({
    name: 'demo-secret.txt', mimeType: 'text/plain', buffer: Buffer.from('סוד של הדמו'),
  });
  await wait(600);
  const inForm = page.locator('.modal a', { hasText: 'demo-secret.txt' }).first();
  T('קובץ מצורף בטופס-החוג: אין href (גם לא ל«שמירת קישור בשם»)', (await inForm.count()) > 0 && !(await inForm.getAttribute('href')));
  await inForm.click({ timeout: 3000 });
  await inForm.click({ button: 'middle', timeout: 3000 }).catch(() => {});
  await wait(300);
  await page.locator('.modal .modal-actions button').first().click({ timeout: 3000 }); // שמירה
  await wait(600);
  await closeModals();
  const onCard = page.locator('main a', { hasText: 'demo-secret.txt' }).first();
  T('קובץ מצורף בכרטיס-החוג: אין href', (await onCard.count()) > 0 && !(await onCard.getAttribute('href')));
  await onCard.click({ timeout: 3000 });
  await onCard.click({ button: 'middle', timeout: 3000 }).catch(() => {});
  await onCard.focus().catch(() => {});
  await page.keyboard.press('Enter');
});
// (ה) מודעת-הדמו באשף-ההקמה (#511) — ה-CTA שלה מוביל לאותו שורש-אתר
try {
  await openSettings();
  await page.locator('main button', { hasText: 'אשף ההקמה' }).first().click({ timeout: 4000 });
  await wait(900);
  const wizCta = page.locator('a', { hasText: 'רוצים אתר משלכם' }).first();
  T('אשף בדמו: מודעת-הדמו עם CTA «רוצים אתר משלכם»', (await wizCta.count()) > 0);
  if (await wizCta.count()) {
    await wizCta.scrollIntoViewIfNeeded().catch(() => {});
    const u = new URL((await wizCta.getAttribute('href')) ?? '', page.url());
    T('אשף בדמו: CTA ⇒ שורש-האתר (בלי פרמטרים)', u.href === BASE && !u.search, u.pathname + u.search);
    T('אשף בדמו: CTA לחיץ', await wizCta.click({ trial: true, timeout: 3000 }).then(() => true, () => false));
  }
} catch (e) {
  T('אשף בדמו: נפתח', false, String(e).split('\n')[0].slice(0, 80));
}
await resetView();

// (ו) ביקורת-השוטר 22.10 — פקדים שהסריקה הכללית לא הגיעה אליהם (או הגיעה ונעצרה ב"אין מה להוריד"):
//     כל אחד נלחץ במפורש, ונדרשת הודעת-הסירוב "בדמו" (strict — פקד חסר = כשל, לא אזהרה).
const openSupMenu = async () => {
  await navList('תורמים');
  await page.locator('main button', { hasText: '⋯ עוד' }).first().click({ timeout: 4000 });
  await wait(350);
};
const supMenuItem = (text) => async () => {
  await openSupMenu();
  await page.locator('.modal-back button', { hasText: text }).first().click({ timeout: 3000 });
  await wait(400);
};
await freshPage();
await seedNames('לפני התרחישים הממוקדים');
await flowRefusal('תורמים ⋯ › 📄 דוחות שנתיים לכולם', supMenuItem('📄 דוחות שנתיים לכולם'), { strict: true });
await flowRefusal('תורמים ⋯ › 📥 דוח שמות (למנהל) — אחרי זריעת שם-לטיפול', supMenuItem('📥 דוח שמות'), { strict: true });
await flowRefusal('תורמים ⋯ › 🙏 שמות לתפילה — קובץ מסודר (printDoc) — אחרי זריעת שם', supMenuItem('🙏 שמות לתפילה'), { strict: true });
await flowRefusal('תורמים › 📋 כל השמות › ⬇ דוח מלא CSV — אחרי זריעה', async () => {
  await navList('תורמים');
  await page.locator('main button:visible', { hasText: '📋 כל ה' }).first().click({ timeout: 4000 });
  await wait(500);
  await page.locator('.modal-back button', { hasText: '⬇ דוח מלא CSV' }).first().click({ timeout: 3000 });
}, { strict: true });
await flowRefusal('כרטיס תורם › 🙏 📋 העתקת הרשימה', async () => {
  await openSupporterCard();
  await page.locator('main button:visible', { hasText: '📋 העתקת הרשימה' }).first().click({ timeout: 4000 });
}, { strict: true });
await flowRefusal('כרטיס תורם › 🙏 🖨 הורדה / הדפסה (printDoc)', async () => {
  await openSupporterCard();
  await page.locator('main button:visible', { hasText: '🖨 הורדה / הדפסה' }).first().click({ timeout: 4000 });
}, { strict: true });
// קופה רושמת: מכירה ⇒ חשבונית ⇒ 🖨 הדפסה (window.print), ומשמרת ⇒ סגירה ⇒ דוח-Z ⇒ 🖨 הדפסה
const openCashbox = async () => {
  await resetView();
  await page.evaluate(() => { location.hash = '#cashbox'; });
  await wait(800);
  if (!(await page.locator('.modal-back [aria-label^="💵"]').count())) throw new Error('הקופה הרושמת לא נפתחה');
};
await flowRefusal('קופה רושמת › מכירה ⇒ חשבונית ⇒ 🖨 הדפסה', async () => {
  await openCashbox();
  await page.locator('.modal input[type=number][placeholder="0"]').first().fill('50', { timeout: 3000 });
  await page.locator('.modal button', { hasText: 'סכום מדויק' }).first().click({ timeout: 3000 });
  await page.locator('.modal button', { hasText: 'סיום והפקת חשבונית' }).first().click({ timeout: 3000 });
  await wait(500);
  await page.locator('.modal button', { hasText: '🖨 הדפסה' }).first().click({ timeout: 3000 });
}, { strict: true });
await flowRefusal('קופה רושמת › משמרת ⇒ סגירה ⇒ דוח-Z ⇒ 🖨 הדפסה', async () => {
  await openCashbox();
  await page.locator('.modal button', { hasText: '🗂 משמרת' }).first().click({ timeout: 3000 });
  await wait(300);
  const open = page.locator('.modal button', { hasText: 'פתיחת משמרת' });
  if (await open.count()) { await open.first().click({ timeout: 3000 }); await wait(300); }
  await page.locator('.modal button', { hasText: 'סגירת קופה (ספירה)' }).first().click({ timeout: 3000 });
  await wait(300);
  await page.locator('.modal button', { hasText: 'סיום וסגירת קופה' }).first().click({ timeout: 3000 });
  await wait(400);
  await page.locator('.modal button', { hasText: '🖨 הדפסה' }).first().click({ timeout: 3000 });
}, { strict: true });

// ── 3ג. "מקסימום": מבקר שהדליק באשף-הדמו את כל דגלי-ה-opt-in ואת כל ההרחבות ──
// (מקטע-ההרחבות לא קיים באשף-הדמו ו-integrationOn כבוי בדמו — ההזרקה כאן מוודאת שגם הרחבות
//  שהגיעו מהמטמון לא פותחות ערוץ-שיתוף: אף קישור וואטסאפ/מפות/תשלום עם רשומה.)
// (חלון-העבודה, מודיעין, כרטיס-הורה, מרכז-שימור, רישום-לשנה-הבאה, יומן-ICS, אנשי-קשר…) —
// משטחי-יציאה שכבויים בקונפיג-הדמו הרגיל. נזרק כמטמון-קונפיג של הדמו (slug נשאר demo).
const OPT_IN_ALL = [
  'supporters.cockpit', 'supporters.intel', 'supporters.galaxy', 'supporters.rebrand', 'supporters.card',
  'courses.cockpit', 'courses.plannedcharges', 'shop.plannedcharges', 'courses.teacherapp', 'courses.parentcard',
  'courses.ai', 'shell.portal', 'supporters.photos', 'supporters.hokbulk', 'supporters.plannedcharges',
  'supporters.universe3d', 'courses.reenroll', 'supporters.oneflow', 'supporters.ayin.paygate',
  'supporters.hebtiming', 'home.morningbrief', 'shell.askmaor',
];
const INTEGRATIONS_ALL = ['receipts', 'payments', 'whatsapp', 'sms', 'phone', 'gcal', 'drive', 'sheets', 'maps', 'esign', 'ai', 'campaign', 'mail', 'gcontacts'];
await harvest();
await page.evaluate(async ({ opt, integ }) => {
  const base = await (await fetch('./c/demo/config.json', { cache: 'no-cache' })).json();
  const cfg = {
    ...base,
    slug: 'demo',
    features: { ...base.features, ...Object.fromEntries(opt.map((k) => [k, true])) },
    integrations: Object.fromEntries(integ.map((k) => [k, { enabled: true }])),
    // ☎️ טלפוניה (מבקר יכול להדליק באשף-הדמו) ⇒ CallBtn בכרטיסים/רשימות + קישורי-הטלפון בניהול-שיבוץ
    telephony: { enabled: true },
  };
  localStorage.setItem('maor_cloudcfg:demo', JSON.stringify(cfg));
}, { opt: OPT_IN_ALL, integ: INTEGRATIONS_ALL });
await page.reload({ waitUntil: 'networkidle' });
await wait(1300);
T('מקסימום: עדיין סשן-דמו נעול (סרט + data-demo-lock)', ((await page.locator('body').textContent()) ?? '').includes('מצב הדגמה') && (await page.evaluate(() => document.documentElement.hasAttribute('data-demo-lock'))));
await sweep('מקסימום · בית', async () => { await navTo('בית'); });
await freshPage();
await sweep('מקסימום · תורמים', async () => { await navList('תורמים'); });
await freshPage();
await sweep('מקסימום · כרטיס תורם', async () => { await navList('תורמים'); await openFirst(ROW_SEL); });
await freshPage();
await sweep('מקסימום · חוגים', async () => { await navList('חוגים'); });
await freshPage();
await sweep('מקסימום · כרטיס חוג', async () => { await navList('חוגים'); await openFirst(['main .card[role=button]', ...ROW_SEL]); });
await freshPage();
await sweep('מקסימום · כרטיס משפחה', async () => { await navList('משפחות'); await openFirst(ROW_SEL); });
await freshPage();
await sweep('מקסימום · לוח שנה', async () => { await navTo('לוח שנה'); });
await freshPage();
await sweep('מקסימום · הגדרות', openSettings);
// ביקורת-השוטר 22.10: שני משטחי-opt-in שהסריקה הכללית לא נכנסה אליהם —
// «🗓 רישום לשנה הבאה» (הייצוא/ההעתקה יושבים בחייגן-FAB ☎ שנפתח בלחיצה) ו«👁 תצוגה כמורה» (TeacherPanel).
const openReenrollDial = async () => {
  await navList('חוגים');
  await page.locator('main button', { hasText: '🗓 רישום לשנה הבאה' }).first().click({ timeout: 4000 });
  await wait(600);
  await page.locator('button[aria-label="חייגן פעולות רישום"]').first().click({ timeout: 3000 });
  await wait(300);
};
await freshPage();
await flowRefusal('מקסימום · רישום לשנה הבאה › ☎ ⇒ ⬇ ייצוא CSV', async () => {
  await openReenrollDial();
  await page.locator('button', { hasText: '⬇ ייצוא CSV' }).first().click({ timeout: 3000 });
}, { strict: true });
await flowRefusal('מקסימום · רישום לשנה הבאה › ☎ ⇒ 📋 העתקת רשימה', async () => {
  await openReenrollDial();
  await page.locator('button', { hasText: '📋 העתקת רשימה' }).first().click({ timeout: 3000 });
}, { strict: true });
const openTeacherPreview = async () => {
  await navList('חוגים');
  await page.locator('main button', { hasText: '👁 תצוגה כמורה' }).first().click({ timeout: 4000 });
  await wait(400);
  await page.locator('.modal-back button', { hasText: '🎓' }).first().click({ timeout: 3000 });
  await wait(600);
};
await flowRefusal('מקסימום · 👁 תצוגה כמורה › ⬇ דוח חודשי', async () => {
  await openTeacherPreview();
  await page.locator('main button:visible', { hasText: '⬇ דוח חודשי' }).first().click({ timeout: 3000 });
}, { strict: true });
await freshPage();
await sweep('מקסימום · 👁 תצוגה כמורה', openTeacherPreview);
await harvest();
await page.evaluate(() => localStorage.removeItem('maor_cloudcfg:demo'));
await page.reload({ waitUntil: 'networkidle' });
await wait(900);

// ── 4. אכיפה ──
await wait(600);
await harvest();
const leak = total;
for (const p of popups) {
  const u = p.url();
  if (/^(blob|data):/i.test(u)) { leak.openData++; leak.details.push('popup :: ' + u.slice(0, 60)); }
}
const refusals = leak.toasts.filter((t) => t.includes('בדמו'));

T(`נלחצו לפחות ${MIN_CLICKS} פקדי-ייצוא ברחבי הדמו`, clicked.length >= MIN_CLICKS, `נלחצו ${clicked.length}`);
T('אפס הורדות-קובץ (אירועי download)', downloads.length === 0, downloads.join(', '));
T('אפס <a download>/blob:/data: שהופעלו', leak.anchorDl === 0, String(leak.anchorDl));
T('אפס הדפסות (window.print)', leak.print === 0, String(leak.print));
T('אפס הדפסות iframe (receipt/printDoc/כרטיס-הורה)', leak.iframePrint === 0, String(leak.iframePrint));
T('אפס כתיבות ללוח-ההעתקה (clipboard.writeText/write)', leak.clipboard === 0, String(leak.clipboard));
T('אפס execCommand(copy/cut) של האפליקציה', leak.execCopy === 0, String(leak.execCopy));
T('אפס גיליון-שיתוף (navigator.share)', leak.share === 0, String(leak.share));
T('אפס פתיחות data:/blob: (קבצים שמורים)', leak.openData === 0, String(leak.openData));
T('אפס קישורי-שיתוף חיצוניים עם רשומות (וואטסאפ/מפות/SMS/מייל/חיוג) — גם ב"מקסימום"', leak.extShare === 0, String(leak.extShare));
T('לפחות הודעת-סירוב אחת עם "בדמו"', refusals.length > 0, `${refusals.length} הודעות`);
T('אפס שגיאות JS', errors.length === 0, errors.length ? errors.slice(0, 3).join(' | ') : '');

// הודעות-הצלחה שמופיעות למרות שהיציאה נחסמה (לא דליפה — אבל מבלבל את המבקר): אזהרה, לא כשל
// (חשבונית-קופה / דוח-Z "הופק" = רשומה בתוך האפליקציה, לא קובץ — לא נחשבים)
const falseSuccess = [...new Set(leak.toasts.filter((t) => !t.includes('בדמו') && !/יירדו|ייפתחו|חשבונית \d+ הופקה|דוח-Z הופק/.test(t) && /ירד|ירדה|הועתק|הופק|נפתח להדפסה|נפתחה להדפסה|חלון-ההדפסה נפתח/.test(t)))];
console.log(log.join('\n'));
if (falseSuccess.length) console.log('\n⚠️ הודעות-הצלחה שהוצגו למרות החסימה (לא דליפה — שום קובץ לא ירד; UX מבלבל):\n  ' + falseSuccess.join('\n  '));
if (leak.details.length) console.log('\n🚨 פרטי-הדליפות:\n  ' + leak.details.join('\n  '));
if (downloads.length) console.log('\n🚨 הורדות:\n  ' + downloads.join('\n  '));
if (leak.opens.length) console.log('\nℹ️ window.open (לא data:/blob:):\n  ' + leak.opens.join('\n  '));
if (errors.length) console.log('\nJS errors:\n' + errors.join('\n'));
if (DEBUG) {
  console.log('\n— פקדים שנלחצו —\n  ' + clicked.join('\n  '));
  console.log('\n— הודעות —\n  ' + [...new Set(leak.toasts)].join('\n  '));
  if (consoleErrors.length) console.log('\n— console.error —\n  ' + consoleErrors.slice(0, 20).join('\n  '));
}
console.log(`\nסה״כ פקדי-ייצוא שנלחצו: ${clicked.length} · הודעות-סירוב "בדמו": ${refusals.length}`);

// ── 5. לחיצה אמיתית על «פתחו אתר משלכם» (מבקר לא-מחובר) ⇒ מסך-ההרשמה של השורש (לא הדמו) ──
// (גם אחרי שהמבקר שיחק באשף-הדמו — הדריסה המקומית עם slug=demo לא מוצגת בשורש)
await page.goto(BASE + '?org=demo', { waitUntil: 'networkidle' });
await wait(1200);
await page.locator('a', { hasText: 'פתחו אתר משלכם' }).first().click({ timeout: 4000 });
await page.waitForLoadState('domcontentloaded');
await wait(2200);
const rootTxt = (await page.locator('body').textContent()) ?? '';
const finalLog = [];
const T2 = (name, cond, extra = '') => { finalLog.push(`  ${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) failures++; };
T2('אחרי הלחיצה: בשורש-האתר, בלי פרמטרים', page.url() === BASE, page.url());
T2('אחרי הלחיצה: השורש לא מציג את הדמו (אין סרט "מצב הדגמה")', !rootTxt.includes('מצב הדגמה'));
T2('אחרי הלחיצה: נעילת-הדמו לא נשארת על השורש', !(await page.evaluate(() => document.documentElement.hasAttribute('data-demo-lock'))));
T2('אחרי הלחיצה: מוצג מסך כניסה/הרשמה (לא שלד-מערכת)', /הרשמ|הירשמ|כניסה/.test(rootTxt) && (await page.locator('nav.app-nav').count()) === 0, rootTxt.replace(/\s+/g, ' ').slice(0, 80));
T2('אפס שגיאות JS גם בדרך להרשמה', errors.length === 0, errors.slice(0, 2).join(' | '));
console.log(finalLog.join('\n'));

// ── 6. ביקורת-חיובית: אותן מלכודות על לקוח רגיל (לא דמו) עם אותם נתונים ⇒ היציאות *כן* נספרות ──
// בלי זה "אפס" למעלה יכול לנבוע ממלכודת שלא תופסת ולא מהנעילה. זו גם עדות שמחוץ לדמו שום דבר
// לא נחסם: אותם פקדים מורידים/מדפיסים/מעתיקים כרגיל, בלי הודעת-הדמו ובלי data-demo-lock.
// הקונפיג = קונפיג-השורש של הלקוח-החי בלי firebase (אין שער-ענן), בשלד kehila כמו הדמו (אותם בוררים).
// (?org=demo אינו בכתובת וה-slug הוא default — לכן isDemoSession=false.)
console.log('\n🧪 ביקורת-חיובית — לקוח רגיל (לא דמו), אותן מלכודות:');
const ctrlLog = [];
const TC = (name, cond, extra = '') => { ctrlLog.push(`  ${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) failures++; return cond; };
const ctrlCtx = await browser.newContext({ viewport: { width: 1320, height: 980 }, acceptDownloads: true });
await ctrlCtx.addInitScript(TRAPS);
const liveCfg = JSON.parse(readFileSync(join(DIST, 'config.json'), 'utf8'));
delete liveCfg.firebase;
liveCfg.theme = 'kehila';
await ctrlCtx.addInitScript(({ c, dbJson }) => {
  // זריעה פעם אחת לסשן — טעינות-המשך לא דורסות את מה שהבדיקה שינתה (פורמט-קבלה וכו׳)
  if (sessionStorage.getItem('ctrl_seeded') === '1') return;
  sessionStorage.setItem('ctrl_seeded', '1');
  localStorage.setItem('maor_org_config', JSON.stringify(c));
  localStorage.setItem('maor_db', dbJson);
}, { c: liveCfg, dbJson: readFileSync(join(DIST, 'demo.json'), 'utf8') });
page = await ctrlCtx.newPage();
const ctrlDownloads = [];
const ctrlErrors = [];
page.on('download', (d) => ctrlDownloads.push(d.suggestedFilename()));
page.on('pageerror', (e) => ctrlErrors.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });
await wait(1500);
const dayGate = async () => {
  // שער פתיחת-היום של הלקוח הרגיל — לא חלק מהבדיקה
  const d = page.locator('.modal-back button', { hasText: 'פתיחת יום' });
  if (await d.count()) { await d.first().click({ timeout: 3000 }).catch(() => {}); await wait(400); }
};
await dayGate();
TC('ביקורת: זה לא סשן-דמו (אין data-demo-lock ואין סרט "מצב הדגמה")',
  !(await page.evaluate(() => document.documentElement.hasAttribute('data-demo-lock'))) && !((await page.locator('body').textContent()) ?? '').includes('מצב הדגמה'));
const ctrlStep = async (name, fn) => {
  try {
    await dayGate();
    await fn();
    await wait(900);
  } catch (e) {
    ctrlLog.push(`  ⚠️ ביקורת: "${name}" לא הושלם: ${String(e).split('\n')[0].slice(0, 90)}`);
  }
  await resetView().catch(() => {});
};
const paletteRun = async (q, optText) => {
  await resetView();
  await page.keyboard.press('Control+k');
  await wait(350);
  await page.locator('.palette input').first().fill(q);
  await wait(350);
  await page.locator('.palette [role=option]', { hasText: optText }).first().click({ timeout: 3000 });
};
await ctrlStep('גיבוי מהפלטה', () => paletteRun('גיבוי', 'הורדת גיבוי מלא'));
await ctrlStep('העתקת טלפונים מהפלטה', () => paletteRun('טלפונים', 'העתקת כל הטלפונים'));
let ctrlExtLinks = 0;
await ctrlStep('דוח משפחה', async () => {
  await navList('משפחות');
  await openFirst(ROW_SEL);
  // אותו regex של סריקת קישורי-השיתוף החיצוניים (nextTarget) — אצל הלקוח הרגיל הם קיימים בכרטיס
  ctrlExtLinks = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
    .filter((a) => /^(https:\/\/wa\.me\/|whatsapp:|https:\/\/www\.google\.com\/maps|sms:|mailto:|tel:)/i.test(a.getAttribute('href') || '')).length);
  await page.locator('main button:visible', { hasText: '⬇ דוח משפחה' }).first().click({ timeout: 3000 });
});
await ctrlStep('הדפסת כל הדוחות', async () => {
  await navList('דוחות');
  await page.locator('main button:visible', { hasText: '🖨 הדפסת כל הדוחות' }).first().click({ timeout: 3000 });
});
await ctrlStep('קבלה כ-PDF (iframe-הדפסה)', async () => {
  await openSettings();
  await page.locator('main button', { hasText: '🖨 PDF / הדפסה' }).first().click({ timeout: 4000 });
  await wait(300);
  await navList('תורמים');
  await openFirst(ROW_SEL);
  await page.locator('main button:visible', { hasText: '🧾 הורדה' }).first().click({ timeout: 3000 });
});
await wait(800);
const cl = await page.evaluate(() => ({ ...window.__leak, extSeen: undefined }));
TC('ביקורת: גיבוי/דוח-משפחה ⇒ אירועי download נתפסו', ctrlDownloads.length >= 2, ctrlDownloads.join(', '));
TC('ביקורת: <a download> נתפס (a.click)', cl.anchorDl >= 2, String(cl.anchorDl));
TC('ביקורת: window.print נתפס', cl.print >= 1, String(cl.print));
TC('ביקורת: הדפסת-iframe נתפסה', cl.iframePrint >= 1, String(cl.iframePrint));
TC('ביקורת: clipboard.writeText נתפס', cl.clipboard >= 1, String(cl.clipboard));
TC('ביקורת: סריקת קישורי-השיתוף (וואטסאפ/חיוג/מפות…) מוצאת אותם בכרטיס-משפחה', ctrlExtLinks >= 1, String(ctrlExtLinks));
TC('ביקורת: אף הודעת "בדמו" אצל הלקוח הרגיל', !cl.toasts.some((t) => t.includes('בדמו')), cl.toasts.filter((t) => t.includes('בדמו')).length + ' הודעות');
TC('ביקורת: אפס שגיאות JS', ctrlErrors.length === 0, ctrlErrors.slice(0, 2).join(' | '));
// ── 6ב. אשף שנפתח בשורש (לא דמו): מזהה עם תחילית demo מוקלד עד הסוף (ביקורת 22.10 #12) ──
// 🐛 שנסגר: נעילת שדה-המזהה נבדקה מה-slug החי ⇒ אחרי 'demo' (האות הרביעית) השדה ננעל, ההקלדה נעצרה
// וכל סשן-השורש נכנס לנעילת-הדמו. עכשיו הנעילה נקבעת בפתיחת-האשף ⇒ בשורש ההקלדה ממשיכה כמו ב-main.
// הקשר נפרד: קונפיג-שורש בלי adminEmails/firebase (כמו wizard-shot) — אחרת האשף מסורב ("למנהל המערכת בלבד").
{
  const wzCtx = await browser.newContext({ viewport: { width: 1320, height: 980 } });
  await wzCtx.addInitScript((c) => {
    if (sessionStorage.getItem('wz_seeded') === '1') return;
    sessionStorage.setItem('wz_seeded', '1');
    localStorage.setItem('maor_org_config', JSON.stringify(c));
  }, { slug: 'default', orgName: 'ארגון-בדיקה', theme: 'or-rishon', modules: {}, features: {} });
  const wp = await wzCtx.newPage();
  const wzErrors = [];
  wp.on('pageerror', (e) => wzErrors.push(String(e)));
  try {
    await wp.goto(BASE + '#builder', { waitUntil: 'networkidle' });
    await wp.waitForTimeout(1500);
    const slugIn = wp.getByLabel('מזהה לקוח (לועזי, לכתובת)').first();
    for (const want of ['demo-school', 'demos']) {
      await slugIn.selectText({ timeout: 5000 });
      await slugIn.pressSequentially(want, { delay: 40 });
      await wp.waitForTimeout(400);
      const st = await slugIn.evaluate((el) => ({ v: el.value, ro: el.readOnly }));
      TC(`אשף-שורש: הקלדת "${want}" במזהה — הערך המלא נשמר והשדה לא ננעל`, st.v === want && !st.ro, JSON.stringify(st));
    }
    TC('אשף-שורש: הסשן לא נכנס לנעילת-הדמו (אין data-demo-lock)', !(await wp.evaluate(() => document.documentElement.hasAttribute('data-demo-lock'))));
    TC('אשף-שורש: מקטע-ההרחבות קיים (כמו ב-main)', (await wp.locator('#wz-integrations').count()) === 1);
  } catch (e) {
    TC('אשף-שורש: הקלדת מזהה עם תחילית demo', false, String(e).split('\n')[0].slice(0, 120));
  }
  TC('אשף-שורש: אפס שגיאות JS', wzErrors.length === 0, wzErrors.slice(0, 2).join(' | '));
  await wzCtx.close();
}
console.log(ctrlLog.join('\n'));
if (DEBUG) console.log('  — ביקורת: ' + cl.details.join('\n    '));
await ctrlCtx.close();

// ── 7. מבקר שכבר מחובר בדפדפן ⇒ ה-CTA מוביל לשורש בדיוק כמו הקלדת-השורש (הכרעת-בעלים 22.10) ──
// §5 הוכיח מבקר אנונימי. כאן משתמש-Firebase מדומה שמור בדפדפן (persistence של Firebase ב-localStorage,
// טוקן בתוקף) וכל הרשת החיצונית חסומה — Firebase שומר משתמש שמור כשהאימות-מחדש נכשל ברשת, ולכן הדפדפן
// "מחובר" בלי שרת אמיתי. המחובר מגיע לשורש ומקבל את מה שהשורש נותן לו תמיד (המערכת שלו), ונעילת-הדמו
// לא נשארת עליו.
console.log('\n🧪 מבקר מחובר (משתמש-Firebase מדומה, אופליין):');
const siLog = [];
const TS = (name, cond, extra = '') => { siLog.push(`  ${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) failures++; return cond; };
const siCtx = await browser.newContext({ viewport: { width: 1320, height: 980 } });
await siCtx.route((u) => !u.href.startsWith(BASE), (r) => r.abort('internetdisconnected'));
const rootCfg = JSON.parse(readFileSync(join(DIST, 'config.json'), 'utf8'));
const apiKey = rootCfg.firebase?.apiKey;
const SI_EMAIL = 'visitor@example.com';
if (!apiKey) {
  TS('קונפיג-השורש עם firebase (תנאי לתרחיש-המחובר)', false);
} else {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const jwt = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: 'police', aud: 'police', sub: 'police-uid', email: SI_EMAIL, iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'password' } }) + '.sig';
  const fakeUser = {
    uid: 'police-uid', email: SI_EMAIL, emailVerified: true, isAnonymous: false,
    providerData: [{ providerId: 'password', uid: SI_EMAIL, displayName: null, email: SI_EMAIL, phoneNumber: null, photoURL: null }],
    stsTokenManager: { refreshToken: 'police-refresh', accessToken: jwt, expirationTime: Date.now() + 3600e3 },
    createdAt: '1700000000000', lastLoginAt: '1700000000000', apiKey, appName: '[DEFAULT]',
  };
  await siCtx.addInitScript(({ k, v }) => { localStorage.setItem(k, v); }, { k: `firebase:authUser:${apiKey}:[DEFAULT]`, v: JSON.stringify(fakeUser) });
  const sp = await siCtx.newPage();
  const siErrors = [];
  sp.on('pageerror', (e) => siErrors.push(String(e)));
  const bodyTxt = async () => ((await sp.locator('body').textContent()) ?? '').replace(/\s+/g, ' ');
  // ביקורת: השורש עצמו — המשתמש המחובר *לא* מקבל את מסך-ההרשמה (ההתנהגות של main)
  await sp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await sp.waitForTimeout(3500);
  const rootPlain = await bodyTxt();
  const rootSignupTabs = await sp.locator('.orbit-tabs').count();
  TS('ביקורת: בשורש, המחובר לא רואה את מסך-ההרשמה', rootSignupTabs === 0, rootPlain.slice(0, 70));
  // הדמו ⇒ «פתחו אתר משלכם»
  await sp.goto(BASE + '?org=demo', { waitUntil: 'domcontentloaded' });
  await sp.waitForTimeout(2500);
  const siCta = sp.locator('a', { hasText: 'פתחו אתר משלכם' }).first();
  TS('מחובר: הדמו נטען וה-CTA לחיץ', await siCta.click({ trial: true, timeout: 3000 }).then(() => true, () => false));
  await siCta.click({ timeout: 4000 }).catch(() => {});
  await sp.waitForTimeout(3500);
  const afterCta = await bodyTxt();
  TS('מחובר: אחרי ה-CTA — בשורש-האתר, בלי פרמטרים', sp.url() === BASE, sp.url());
  TS('מחובר: אחרי ה-CTA — לא מסך-הרשמה (כמו הקלדת-השורש)', (await sp.locator('.orbit-tabs').count()) === rootSignupTabs, afterCta.slice(0, 70));
  TS('מחובר: אחרי ה-CTA — אין סרט-דמו ואין נעילת-דמו', !afterCta.includes('מצב הדגמה') && !(await sp.evaluate(() => document.documentElement.hasAttribute('data-demo-lock'))));
  TS('מחובר: אפס שגיאות JS', siErrors.length === 0, siErrors.slice(0, 2).join(' | '));
}
console.log(siLog.join('\n'));
await siCtx.close();

await browser.close();
server.close();
if (failures) { console.log(`\n💥 ${failures} כשלים`); process.exit(1); }
console.log('\n🏆 הדמו נעול — אפס יציאת-מידע בכל המסכים, וה-CTA מוביל לשורש-האתר');
