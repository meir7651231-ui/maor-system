/**
 * 🗂️ מקבץ — נקודות לפי צד: כל נקודה הולכת לאזור שלה לפי הצד של המרכז שבו היא נמצאת (מימין/משמאל · למעלה/למטה).
 * הליבה בלי עולם של "שתי האונות" של כדור-המוח בדף ההרשמה (src/lib/three-scene.ts:121):
 *   `Math.sign(nodes[j].x) !== Math.sign(a.x)` — כל צומת שייך לאונה לפי סימן ה-x שלו (הסדק המרכזי באמצע).
 * כאן: אותו מבחן-סימן, יחסית למרכז נתון, על x ועל y — ארבעה אזורים (ועל הקו עצמו — אזור "0").
 * הסדר בתוך כל אזור = סדר ההגעה; איזה אזור — רק לפי הנקודה עצמה.
 * @param {{x: number, y: number}[]} points
 * @param {{x: number, y: number}} center
 * @returns {Record<string, {x: number, y: number}[]>}
 */
export function groupBySide(points, center) {
  const cx = Number(center?.x) || 0; const cy = Number(center?.y) || 0;
  const s = (v) => { const k = Math.sign(v); return k > 0 ? '+' : k < 0 ? '-' : '0'; };
  const out = {};
  for (const p of Array.isArray(points) ? points : []) {
    if (!p) continue;
    const key = s(Number(p.x) - cx) + s(Number(p.y) - cy);
    (out[key] ??= []).push(p);
  }
  return out;
}
