/**
 * 🧹 מסיר כפולים — נקודות: כל מקום נשאר פעם אחת (הראשון שהגיע), בסדר המקורי.
 * הליבה בלי עולם של `seen` ברשת-הסינפסות (src/lib/three-scene.ts:127–129): מפתח לכל זוג, `if (seen.has(key)) continue; seen.add(key)`,
 * ושל מניעת-הכפילות בחלוקת-המעטפות של פרנס׳לע (src/components/parnasa/envelope.ts:170): `if (seen.has(k)) r.splice(i, 1); else seen.add(k)`.
 * כאן המפתח הוא המקום עצמו — `x,y`.
 * @param {{x: number, y: number}[]} points
 * @returns {{x: number, y: number}[]}
 */
export function dedupePoints(points) {
  const seen = new Set();
  const out = [];
  for (const p of Array.isArray(points) ? points : []) {
    if (!p) continue;
    const key = Number(p.x) + ',' + Number(p.y);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
