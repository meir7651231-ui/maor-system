/**
 * 📏 ממיין — נקודות לפי מרחק: הקרובה למוצא קודם. אותו מרחק ⇒ לפי x ואז לפי y (כך הסדר לא תלוי באיך שהגיעו).
 * הליבה בלי עולם של בחירת-השכנים ברשת-הסינפסות (src/lib/three-scene.ts:122–124):
 *   `cand.push([a.distanceToSquared(nodes[j]), j]); cand.sort((p, q) => p[0] - q[0]);`
 * @param {{x: number, y: number}[]} points
 * @param {{x: number, y: number}} from
 * @returns {{x: number, y: number}[]}
 */
export function byDistance(points, from) {
  const fx = Number(from?.x) || 0; const fy = Number(from?.y) || 0;
  const d2 = (p) => (Number(p.x) - fx) ** 2 + (Number(p.y) - fy) ** 2;
  return (Array.isArray(points) ? points : []).filter(Boolean).slice().sort((p, q) => d2(p) - d2(q) || Number(p.x) - Number(q.x) || Number(p.y) - Number(q.y));
}
