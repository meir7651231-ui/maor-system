/**
 * ⏱️ pace · מווסת קצב — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * מקבל רגעים (מספרים, כבר "מוזרקים" — אין שעון) ומרווח, ומחזיר את הרגעים שבהם הפעולה באמת יוצאת:
 *   · 'throttle' (ברירת-מחדל) — הראשון בגל מנצח: יוצא מיד, וכל מה שבא פחות מ-gap אחריו נבלע.
 *     כמו שומר-הלחיצה-הכפולה (400ms) ונעילת-ה-PIN באורביט.
 *   · 'debounce' — האחרון בגל מנצח: יוצא gap אחרי הקריאה האחרונה ברצף (קריאות שמרווחן < gap = אותו גל).
 *     כמו השמירה האוטומטית של אורביט (500ms) והדחיפה לענן (800ms).
 * שני המצבים: אין שתי יציאות קרובות מ-gap, ומספר היציאות ≤ ⌊T/gap⌋+1.
 * גם `backoff` — ההשהיה אחרי n כשלונות ברצף (5s·2^(n-1) עד תקרה), כמו flushPush.
 */

/**
 * @param {number[]} times  הרגעים שבהם ביקשו (לא חייבים להיות ממוינים)
 * @param {number} gap      המרווח המינימלי (≤0 ⇒ אין ויסות)
 * @param {'throttle'|'debounce'} [mode]
 * @returns {number[]} רגעי-היציאה, ממוינים
 */
export function pace(times, gap, mode = 'throttle') {
  const ts = (Array.isArray(times) ? times : []).filter((t) => typeof t === 'number' && Number.isFinite(t)).slice().sort((a, b) => a - b);
  const g = typeof gap === 'number' && Number.isFinite(gap) && gap > 0 ? gap : 0;
  if (!ts.length) return [];
  if (mode === 'debounce') {
    const out = [];
    for (let k = 0; k < ts.length; k++) if (k === ts.length - 1 || ts[k + 1] - ts[k] >= g) out.push(ts[k] + g);
    return g === 0 ? [...new Set(out)] : out;
  }
  const out = [ts[0]];
  for (const t of ts) if (t - out[out.length - 1] >= g && t !== out[out.length - 1]) out.push(t);
  return out;
}

/**
 * השהיה אחרי n כשלונות ברצף: 0 כשאין כשלון; אחרת base·2^(n-1), לא יותר מ-cap.
 * @param {number} fails
 * @param {number} [base]
 * @param {number} [cap]
 * @returns {number}
 */
export function backoff(fails, base = 5000, cap = 300000) {
  const n = Math.floor(Number(fails));
  if (!(n > 0)) return 0;
  return Math.min(base * 2 ** Math.min(n - 1, 52), cap);
}
