/**
 * 🛟 tolerate · סובל כשל — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * מריץ צעד על כל פריט; צעד שנכשל (זרק) נותן את ערך-הנפילה במקומו, השאר נשארים במקום ובסדר, ושום דבר לא זורק.
 * כמו safeDecode/readPinFails/readCloudEnvelope באורביט (נכשל ⇒ ברירת-מחדל בטוחה), ו-smsOutbox
 * (הודעה שנכשלה מסומנת error והלולאה ממשיכה לבאות).
 *   · `attempt(step, input, fallback)` — ניסיון אחד (fallback יכול להיות פונקציה של הקלט והשגיאה).
 *   · `tolerateEach(items, step, fallback)` — על רשימה.
 *   · `tolerateParse(texts, fallback)` — המופע בלי פונקציות (בשביל הקורא): הצעד = קריאת JSON קפדנית.
 */

/** @param {(x: any) => any} step @param {any} input @param {any} fallback */
export function attempt(step, input, fallback) {
  try {
    return step(input);
  } catch (err) {
    return typeof fallback === 'function' ? safeFallback(fallback, input, err) : fallback;
  }
}
function safeFallback(fb, input, err) {
  try { return fb(input, err); } catch { return null; }
}

/** @param {any[]} items @param {(x: any) => any} step @param {any} fallback */
export function tolerateEach(items, step, fallback) {
  if (!Array.isArray(items)) return [];
  return items.map((x) => attempt(step, x, fallback));
}

/** צעד קפדני: רק טקסט שהוא JSON תקין — כל דבר אחר זורק. */
function strictJson(text) {
  if (typeof text !== 'string') throw new TypeError('not text');
  return JSON.parse(text);
}

/**
 * קורא כל טקסט כ-JSON; טקסט שבור (או לא-טקסט) ⇒ ערך-הנפילה במקומו. אורך וסדר נשמרים. לעולם לא זורק.
 * @param {string[]} texts
 * @param {null|number|string} [fallback]
 * @returns {any[]}
 */
export function tolerateParse(texts, fallback = null) {
  return tolerateEach(texts, strictJson, fallback);
}
