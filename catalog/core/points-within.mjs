/**
 * 🔍 מסנן — נקודות בתוך עיגול: משאיר רק את הנקודות שהמרחק שלהן מהמרכז לא עולה על הרדיוס, בסדר המקורי.
 * הליבה בלי עולם של "בדיקת-הפגיעה" של הגלקסיה (src/components/supporters/SupportersGalaxy.tsx:125):
 *   `const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) …` — כוכב שבתוך הרדיוס סביב העכבר נבחר;
 * ושל שדה-הכוח במחולל (knowledge/assets/screens/sde-hakoach.html:171): `Math.hypot(mx-o.x,my-o.y)<26`.
 * כאן: אותו מבחן-מרחק, לכל נקודה לחוד (כל נקודה נבחנת לבד — לא תלוי בשכנות).
 * @param {{x: number, y: number}[]} points
 * @param {{x: number, y: number}} center
 * @param {number} radius
 * @returns {{x: number, y: number}[]}
 */
export function pointsWithin(points, center, radius) {
  const cx = Number(center?.x) || 0; const cy = Number(center?.y) || 0;
  const r = Math.abs(Number(radius) || 0);
  return (Array.isArray(points) ? points : []).filter((p) => p && Math.hypot(Number(p.x) - cx, Number(p.y) - cy) <= r);
}
