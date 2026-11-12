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
    try { await fn(route); } catch (e) {
      if (/disposed|has been closed|Target closed|Route is already handled/i.test(String(e))) return;
      routeErrors.push('יירוט ' + pattern + ': ' + String(e));
      try { await route.continue(); } catch { /* הבקשה כבר נסגרה */ }
    }
  });
}
/** שרת יתום מהרצה קודמת על אותו פורט (טוקן אחר) גורם לכישלון מבלבל ⇒ עוצרים מיד עם הסבר. */
export async function assertPortFree(port) {
  try { await globalThis.fetch(`http://127.0.0.1:${port}/health`); } catch { return; }
  console.error(`פורט ${port} תפוס (שרת מהרצה קודמת?) — עצרו אותו והריצו שוב`);
  process.exit(1);
}
