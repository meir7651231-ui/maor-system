/**
 * 🛤️ מתקדם במסלול (move-along-path) — נקודה שזזה על דרך של תחנות: 0 = בתחנה הראשונה, 1 = באחרונה,
 * ובאמצע — בדיוק על הדרך, לפי המרחק שעבר (לא לפי מספר התחנות).
 * הליבה בלי עולם של: התקדמות-משלוח איסוף→בדרך→נמסר, מסלול-מתנדב, מטבע שמחליק לקופה. מקורות: origins.json.
 * טהור: ההתקדמות מוזרקת (0..1).
 * @param {{points: {x: number, y: number}[]}} spec
 * @param {number} progress
 * @returns {{x: number, y: number} | null}
 */
export function moveAlongPath(spec, progress) {
  const pts = (Array.isArray(spec?.points) ? spec.points : []).map((p) => ({ x: fin(p?.x), y: fin(p?.y) }));
  if (!pts.length) return null;
  if (pts.length === 1) return { ...pts[0] };
  const seg = [];
  let total = 0;
  for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y); seg.push(d); total += d; }
  const p = Math.min(1, Math.max(0, fin(progress)));
  if (p <= 0 || total === 0) return { ...pts[0] };
  if (p >= 1) return { ...pts[pts.length - 1] };
  let left = p * total;
  for (let k = 0; k < seg.length; k++) {
    if (left <= seg[k] || k === seg.length - 1) {
      const t = seg[k] ? Math.min(1, left / seg[k]) : 0;
      return { x: pts[k].x + (pts[k + 1].x - pts[k].x) * t, y: pts[k].y + (pts[k + 1].y - pts[k].y) * t };
    }
    left -= seg[k];
  }
  return { ...pts[pts.length - 1] };
}

function fin(x) { const v = Number(x); return Number.isFinite(v) ? v : 0; }
