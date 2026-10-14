/**
 * 🕸️ מחבר לשכנים (connect) — נקודות ⇒ רשת: כל נקודה מתחברת ל-`near` הנקודות הקרובות אליה, כל קשת פעם אחת,
 * והמחיר של קשת = המרחק בין שתי הנקודות.
 * הליבה בלי עולם של "רשת הסינפסות" של כדור-המוח בדף ההרשמה (src/lib/three-scene.ts:114–131):
 *   לכל צומת — רשימת המועמדים לפי `distanceToSquared`, ממוינת, ושלושת הקרובים נקשרים; מפתח `min_max` מונע קשת כפולה.
 * מה שהוסר: אובייקטי THREE (‏LineSegments) והאילוץ "באותה אונה" (סימן ה-x — במוח יש שתי אונות; כאן אין עולם).
 * הנקודות וכל שאר השדות של ההגדרה נשמרים כמו שהם — מתווספות רק הקשתות (כמו במוח: אותם צמתים + הקווים).
 * טהור ודטרמיניסטי: שוויון-מרחק נשבר לפי האינדקס.
 * שדות נוספים (למשל `sources` — מאיפה גל מתחיל) עוברים כמו שהם, כדי שמי שמקבל את הרשת יקבל גם אותם.
 * @param {{points: {x: number, y: number}[], near: 1|2|3, sources?: (0|1|2|3|4|5)[]}} spec
 * @returns {{points: {x: number, y: number}[], near: number, edges: {a: number, b: number, w: number}[]}}
 */
export function nearNet(spec) {
  const pts = Array.isArray(spec?.points) ? spec.points : [];
  const k = Math.max(1, Math.min(8, Math.floor(Number(spec?.near)) || 1)); // near ≤ 0 ⇒ 1 (הרצפה), לא |near|
  const ok = (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y));
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < pts.length; i++) {
    if (!ok(pts[i])) continue;
    const cand = [];
    for (let j = 0; j < pts.length; j++) {
      if (i === j || !ok(pts[j])) continue;
      cand.push([(pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2, j]);
    }
    cand.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    for (let n = 0; n < Math.min(k, cand.length); n++) {
      const j = cand[n][1];
      const key = Math.min(i, j) + '_' + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: Math.min(i, j), b: Math.max(i, j), w: Math.sqrt(cand[n][0]) });
    }
  }
  return { ...spec, edges };
}
