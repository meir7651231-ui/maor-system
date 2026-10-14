/**
 * 🔬 דוגם (sample) — קורא מהסביבה כל קריאה k-ית: הראשונה, ה-k, ה-2k… — בלי לשנות את מה שנקרא ובלי לדלג על תור.
 * הליבה בלי עולם של: דגימת הלוגו פיקסל-כל-2 (orbit-final של המחולל), מצלמה שנקראת כל פריים (ברקוד, בנייה-חכמה),
 * זיקית שקוראת את הצבע מהרקע. מקורות: origins.json. טהור: הקריאות עצמן מוזרקות (הסביבה אצל הקורא).
 * @param {{every: number}} spec
 * @param {number[]} readings  (הקוד לא נוגע בקריאה עצמה — כל סוג עובר כמו שהוא; ראו core-census: T[])
 * @returns {number[]}
 */
export function sample(spec, readings) {
  const k = Math.max(1, Math.floor(Math.abs(Number(spec?.every)) || 1));
  const xs = Array.isArray(readings) ? readings : [];
  const out = [];
  for (let i = 0; i < xs.length; i += k) out.push(xs[i]);
  return out;
}
