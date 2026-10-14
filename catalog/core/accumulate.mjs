/**
 * 🪙 צובר (accumulate) — מטבע אחרי מטבע נכנס לקופה; כשהקופה מלאה — ריקון, ומתחילים מאפס.
 * הליבה בלי עולם של: קופת-צדקה עד "ריקון", מונה-הכסף שגדל כל שנייה, סכום-ביניים בקופה הרושמת. מקורות: origins.json.
 * טהור: רשימת-ההפקדות היא הזמן (צעד לכל הפקדה).
 * @param {{capacity: number}} spec   — 0 או פחות = קופה בלי תקרה (לא מתרוקנת לבד)
 * @param {number[]} deposits
 * @returns {number[]} הגובה בקופה אחרי כל הפקדה
 */
export function accumulate(spec, deposits) {
  const c = fin(spec?.capacity);
  const cap = c > 0 ? c : Infinity;
  const out = [];
  let level = 0;
  for (const d0 of Array.isArray(deposits) ? deposits : []) {
    const d = Math.abs(fin(d0));
    if (level > 0 && level + d > cap) level = 0; // ריקון
    level += d;
    out.push(level);
  }
  return out;
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
