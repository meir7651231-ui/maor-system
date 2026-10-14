import { byDistance } from './by-distance.mjs';

/**
 * 🎯 בוחר את הקיצוני — הנקודה הקרובה ביותר: מכל הנקודות, זו שהמרחק שלה מהמוצא הכי קטן (אין נקודות ⇒ null).
 * הליבה בלי עולם של "בדיקת-הריחוף" של הגלקסיה (src/components/supporters/SupportersGalaxy.tsx:124–125):
 *   `let best = null, bd = 16; for (const p of pos) { const d = Math.hypot(p.x - mx, p.y - my); if (d < bd + p.r) { bd = d; best = p; } }`
 *   — כל כוכב קרוב יותר מהטוב-עד-עכשיו מחליף אותו (bd יורד), ובסוף `best` = הכוכב הקרוב לעכבר.
 * מה שהוסר: סף-הריחוף (16 פיקסלים + רדיוס הכוכב) — כאן אין מסך; הקרובה ביותר תמיד נבחרת.
 * בונה על ליבת «ממיין» (by-distance.mjs — אותו מרחק, ושוויון נשבר לפי x ואז y): הקרובה = הראשונה בסדר-המרחק.
 * כך הבחירה לא תלויה בסדר שבו הנקודות הגיעו (בגלקסיה — הראשון שנמצא במרחק שווה נשאר).
 * @param {{x: number, y: number}[]} points
 * @param {{x: number, y: number}} from
 * @returns {{x: number, y: number} | null}
 */
export function nearestPoint(points, from) {
  return byDistance(points, from)[0] ?? null;
}
