// עזרים משותפים לבדיקות הדפדפן (live.mjs, ui.mjs, rebuild.mjs, notices.mjs, beta.mjs).
import { mkdirSync, mkdtempSync, openSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
/** הפעלה 222 (QA, «הבא» 3 מ-221): live.mjs השאיר ב-TMPDIR תיקייה עם סוד ה-TOTP של עובד הדמו, ו-beta.mjs ארבע
 *  תיקיות עם sqlite של נתוני הענף — בכל ריצה, גם בהצלחה. tempDir יוצר תיקייה זמנית ומוחק אותה ביציאה (רגילה,
 *  חריגה שלא נתפסה, SIGINT⇒130, SIGTERM⇒143). שרתים שנרשמו ב-trackProc נהרגים (SIGKILL) *לפני* המחיקה — אחרת
 *  שרת שעוד עולה כותב את הסוד אחרי ה-rm (אותו לקח כמו demo.sh, הפעלה 221). */
const _temps = new Set(), _procs = new Set();
let _hooked = false;
export function cleanupTemps() {
  for (const p of _procs) {
    // קבוצת תהליכים (spawnServer): הורגים את כל הקבוצה גם אם המוביל כבר יצא — נכד (vite מתחת ל-npx) עוד חי.
    if (p[GROUP]) { try { process.kill(-p.pid, 'SIGKILL'); } catch { /* הקבוצה כבר ריקה */ } continue; }
    try { if (p.exitCode === null && p.signalCode === null) p.kill('SIGKILL'); } catch { /* כבר מת */ }
  }
  for (const d of _temps) { try { rmSync(d, { recursive: true, force: true }); } catch { /* מחיקה נכשלה — לא מפילים יציאה */ } }
  _temps.clear();
}
function hookExit() {
  if (_hooked) return;
  _hooked = true;
  process.on('exit', cleanupTemps);
  process.once('SIGINT', () => process.exit(130));
  process.once('SIGTERM', () => process.exit(143));
}
export function tempDir(prefix) {
  hookExit();
  const d = mkdtempSync(join(tmpdir(), prefix));
  _temps.add(d);
  return d;
}
export function trackProc(p) { hookExit(); _procs.add(p); return p; }
const GROUP = Symbol('gabi-proc-group');
/** הפעלה 235 (QA, «הבא» 2 מ-234): a11y.mjs ו-shots.mjs הרימו `npx vite preview` ועצרו ב-srv.kill() — זה הורג רק
 *  את npx; vite (נכד) נשאר חי על הפורט **בכל ריצה, גם בהצלחה** (נמדד: SIGTERM וגם SIGKILL ⇒ יתום). ושאר הסקריפטים
 *  (uvicorn) רשמו רק process.on('exit') ⇒ ב-SIGINT/SIGTERM node יוצא בלי exit ⇒ השרת יתום.
 *  spawnServer: קבוצת תהליכים משלו (detached) + רישום ב-trackProc ⇒ srv.kill() הורג את כל הקבוצה, ו-cleanupTemps
 *  הורג אותה (SIGKILL) ביציאה רגילה, בחריגה, ב-SIGINT⇒130 וב-SIGTERM⇒143. כל spawn ב-e2e/ עובר דרכו (מגן-מקור
 *  ב-tests/e2e-procs.check.ts). */
export function spawnServer(cmd, args, opts = {}) {
  const p = trackProc(spawn(cmd, args, { ...opts, detached: true }));
  p[GROUP] = true;
  p.kill = (sig = 'SIGTERM') => { try { process.kill(-p.pid, sig); return true; } catch { return false; } };
  return p;
}
/** הפעלה 223 (QA, «הבא» 3 מ-222): Chromium עצמו כותב ל-TMPDIR של התהליך שלו (‎.org.chromium.Chromium.*‎) ולפעמים
 *  לא מנקה ב-close() — מרוץ בכיבוי. נמדד: 5 מ-64 הרצות של סקריפטי concepts-*-board השאירו תיקייה כזו, גם בהצלחה.
 *  launchChromium נותן לדפדפן TMPDIR פרטי מ-tempDir (נמחק ביציאה, גם בחריגה/SIGINT/SIGTERM). כל launch של
 *  Playwright ב-e2e/ וב-scripts/ עובר דרכו (מגן-מקור ב-tests/e2e-tmp.check.ts). */
export function launchChromium(chromium, opts = {}) {
  const d = tempDir('gabi-chromium-');
  return chromium.launch({ ...opts, env: { ...process.env, ...(opts.env ?? {}), TMPDIR: d, TMP: d, TEMP: d } });
}
/** stdio לשרת שהבדיקה מרימה. עם E2E_LOG_DIR (ב-CI: תיקיית הצילומים, שעולה כ-artifact בכישלון) stdout+stderr
 *  של השרת נכתבים ל-<שם>.log; בלי המשתנה — 'ignore', כמו קודם. הפעלה 156: כשל נדיר של live.mjs (154) ו-460
 *  לא ניתנו לאבחון בדיעבד כי הפלט של השרת נזרק. */
export function srvStdio(name) {
  const dir = process.env.E2E_LOG_DIR;
  if (!dir) return 'ignore';
  mkdirSync(dir, { recursive: true });
  const fd = openSync(join(dir, `${name}.log`), 'a');
  return ['ignore', fd, fd];
}
/** רמת הלוג של uvicorn: כשהלוג נשמר (E2E_LOG_DIR) — info, כדי שרצף הבקשות והסטטוסים יהיה בקובץ; אחרת warning. */
export const srvLogLevel = () => (process.env.E2E_LOG_DIR ? 'info' : 'warning');
/** יירוט תשובה (הזרקה לתשובה האמיתית של השרת). בקשה שעוד באוויר כשהדף מנווט הלאה נסגרת ב«disposed/closed»;
 *  בלי התפיסה כאן החריגה עולה מתוך ה-callback, מפילה את התהליך לפני ה-finally ומשאירה שרת יתום (הפעלה 140).
 *  כל שגיאה אחרת בתוך היירוט (כולל ok שנכשל) נרשמת ב-routeErrors, והקורא מכשיל את הריצה בסוף. */
export function makeInject(routeErrors) {
  return (pg, pattern, fn) => pg.route(pattern, async route => {
    try { await fn(retryingRoute(route)); } catch (e) {
      if (/disposed|has been closed|Target closed|Route is already handled/i.test(String(e))) return;
      routeErrors.push('יירוט ' + pattern + ': ' + String(e));
      try { await route.continue(); } catch { /* הבקשה כבר נסגרה */ }
    }
  });
}
/** הפעלה 189: route.fetch() של GET נכשל לעיתים ב«socket hang up» (live.mjs, 1 מ-6 ריצות מקומית, יירוט /dashboard):
 *  ה-APIRequest של Playwright ממחזר חיבור keep-alive ש-uvicorn סגר באותו רגע. זה מרוץ ברשת של הבדיקה, לא תשובה
 *  של השרת ⇒ ל-GET בלבד ניסיון חוזר אחד. POST וכו׳ לא חוזרים (ניסיון חוזר עלול לרשום פעולה פעמיים — שלב 1014
 *  שולח אישור פעמיים במכוון). כל שגיאה אחרת עולה כרגיל. */
export const TRANSIENT_FETCH = /socket hang up|ECONNRESET|ECONNREFUSED|EPIPE/i;
export function retryingRoute(route) {
  return new Proxy(route, {
    get(t, k) {
      if (k === 'fetch') return async opts => {
        try { return await t.fetch(opts); } catch (e) {
          const method = (opts?.method ?? t.request().method()).toUpperCase();
          if (method !== 'GET' || !TRANSIENT_FETCH.test(String(e))) throw e;
          return await t.fetch(opts);
        }
      };
      const v = Reflect.get(t, k, t);
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
}
/** שרת יתום מהרצה קודמת על אותו פורט (טוקן אחר) גורם לכישלון מבלבל ⇒ עוצרים מיד עם הסבר. */
export async function assertPortFree(port) {
  try { await globalThis.fetch(`http://127.0.0.1:${port}/health`); } catch { return; }
  console.error(`פורט ${port} תפוס (שרת מהרצה קודמת?) — עצרו אותו והריצו שוב`);
  process.exit(1);
}

// יעדי-לחיצה גלויים מתחת ל-40px (גובה או רוחב). sr-only פטור (קלט הקובץ).
// משותף ל-shots (מוק) ול-live (עמודי השרת /p ו-/u, הפעלה 188). רץ בתוך הדף (page.evaluate).
export const smallTargets = () => [...document.querySelectorAll('button,a[href],select,input:not([type=hidden]),[role=button],[role=radio],summary')]
  .filter(e => e.getClientRects().length && !e.classList.contains('sr-only') && getComputedStyle(e).visibility !== 'hidden')
  .map(e => { const q = e.getBoundingClientRect(); return [(e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 24), Math.round(q.height), Math.round(q.width)]; })
  .filter(([, h, w]) => h < 40 || w < 40);
/** הפעלה 197 (סריקת «פקודה חסרה/כשל ⇒ ממשיך בשקט», «הבא» 2 מ-195): לולאת ההמתנה ל-/health נגמרה בשקט כשהשרת
 *  לא עלה (מפרש בלי תלויות, פורט, קריסה בעלייה) ⇒ הבדיקה המשיכה ונפלה 20 שניות אחר כך בשגיאה לא קשורה
 *  (fetch failed / timeout של playwright). עכשיו: שרת שיצא ⇒ כשל מיידי עם קוד היציאה; לא עלה בזמן ⇒ כשל ברור. */
/*  הפעלה 198: path + anyStatus — גם ל-mock של חשבונית ירוקה (rebuild.mjs, ‏/users/me: כל תשובת HTTP = עלה). */
export async function waitHealthy(base, srv, { tries = 80, ms = 250, name = 'השרת', path = '/health', anyStatus = false } = {}) {
  let exit = null, spawnErr = null;
  if (srv) {
    if (srv.exitCode !== null || srv.signalCode !== null) exit = srv.exitCode ?? srv.signalCode;
    srv.once?.('exit', (c, s) => { exit = c ?? s; });
    srv.once?.('error', e => { spawnErr = e; });
  }
  for (let i = 0; i < tries; i++) {
    if (spawnErr) throw new Error(`${name} לא הופעל: ${spawnErr.message} (python3 ב-PATH?)`);
    if (exit !== null) throw new Error(`${name} יצא לפני שעלה (קוד ${exit}) — חסרות תלויות? הריצו ../demo.sh --check, או E2E_LOG_DIR=… לפלט`);
    try { const r = await globalThis.fetch(base + path); if (anyStatus || r.ok) return; } catch { /* עוד עולה */ }
    await new Promise(r => setTimeout(r, ms));
  }
  throw new Error(`${name} לא עלה ב-${(tries * ms) / 1000} שניות: ${base}${path}`);
}

/** הפעלה 445 (מבקר 270ℹ️): ב-live.mjs לחיצה על «שמירה» נכשלה פעם ב-timeout (הכפתור disabled) והלוג לא אמר איזו מ-15
 *  הלחיצות במסע, ולא למה. clickSave מחכה שהכפתור יהיה זמין; אם לא — זורק שגיאה עם שם השלב ומצב המסך: data-loaded,
 *  «יש שינויים שלא נשמרו», שורת השגיאה, שדות לא תקינים (aria-invalid) וטקסט הכפתור. כך הכשל החולף הבא אומר מה קרה. */
export async function saveDiag(page) {
  return page.evaluate(() => {
    const q = s => document.querySelector(s);
    const t = s => (q(s)?.textContent || '').trim();
    const btn = q('[data-testid="settings-save"]');
    return JSON.stringify({
      loaded: q('[data-testid="settings-live"]')?.getAttribute('data-loaded') ?? null,
      button: btn ? { disabled: btn.disabled, text: btn.textContent.trim() } : null,
      dirty: t('[data-testid="settings-dirty"]') || null,
      error: t('[data-testid="settings-error"]') || null,
      invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.getAttribute('aria-label') || e.id || e.name || e.tagName),
    });
  }).catch(e => `(אבחון נכשל: ${e.message})`);
}
export async function clickSave(page, stage, timeout = 10000) {
  if (!stage) throw new Error('clickSave בלי שם שלב');
  try {
    await page.waitForFunction(() => { const b = document.querySelector('[data-testid="settings-save"]'); return !!b && !b.disabled; }, null, { timeout });
  } catch (e) {
    throw new Error(`שלב «${stage}»: «שמירה» לא זמינה ללחיצה אחרי ${timeout}ms · ${await saveDiag(page)}`);
  }
  await page.getByTestId('settings-save').click();
}
