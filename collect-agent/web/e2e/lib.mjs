// עזרים משותפים לבדיקות הדפדפן (live.mjs, ui.mjs, rebuild.mjs, notices.mjs).
import { mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';
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
