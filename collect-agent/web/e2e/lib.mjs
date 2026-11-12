// עזרים משותפים לבדיקות הדפדפן (live.mjs, ui.mjs).
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
