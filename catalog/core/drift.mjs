/**
 * 🌬️ מזיז — נקודה ברוח: אחרי `steps` צעדים הנקודה זזה במהירות שלה — x ועוד vx כפול הצעדים, y ועוד vy כפול הצעדים.
 * הליבה בלי עולם של אבק-הזהב בפרנס׳לע (src/components/parnasa/Ambient.tsx:86–87): `p.x += p.vx * dt; p.y += p.vy * dt;`
 * הזזה ב-0 לא עושה כלום, ושתי הזזות = הזזה אחת בסכומן.
 * @param {{x: number, y: number}} point
 * @param {number} steps
 * @param {{x: number, y: number}} vel
 * @returns {{x: number, y: number}}
 */
export function drift(point, steps, vel) {
  const n = Number(steps) || 0;
  return { x: (Number(point?.x) || 0) + (Number(vel?.x) || 0) * n, y: (Number(point?.y) || 0) + (Number(vel?.y) || 0) * n };
}
