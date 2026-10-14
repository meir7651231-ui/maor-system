/**
 * ⏳ סופר לאחור (countdown) — כמה נשאר עד הרגע: יורד בדיוק במה שעבר, נעצר באפס ולא יורד מתחתיו.
 * הליבה בלי עולם של: "עוד 3:12" בשעון-הכסף, "נותרו X ימים" בקופון, ספירה לזמן התפילה, שליחה-חוזרת של קוד. מקורות: origins.json.
 * טהור: "כמה עבר" מוזרק (לא שעון).
 * @param {{total: number}} spec
 * @param {number} elapsed
 * @returns {number}
 */
export function countdown(spec, elapsed) {
  const total = fin(spec?.total);
  const e = Math.max(0, fin(elapsed));
  return Math.max(0, total - e);
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
