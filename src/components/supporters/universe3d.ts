/**
 * מנוע-היקום-התלת-ממד — טהור ודטרמיניסטי. מרים כל כוכב מהגלקסיה (donorConstellation)
 * לקואורדינטת-מרחב (x,y,z) על קליפת-כדור, שאותה מסך-היקום מסובב ומקרין בפרספקטיבה.
 *
 * DRY: הכל נגזרת של constellation (דרכה — donorScan) ⇒ דרגה/ערך/סיכון/גודל זהים
 * למבט-הגלקסיה. הזווית-הפולרית (phi) דטרמיניסטית ממזהה-התורם ⇒ יציבה בין רינדורים
 * (לא Math.random). ה-radius מהגלקסיה (טריות) הופך למרחק-מהמרכז בכדור.
 */
import type { Supporter } from '../../types/domain';
import { donorConstellation, type ConstellationOpts, type TierKey } from './constellation';

export interface UniverseNode {
  id: string;
  name: string;
  /** מיקום במרחב-יחידה [-1,1] (מרכז=0). */
  x: number;
  y: number;
  z: number;
  /** גודל יחסי 0.15–1 (ערך-חיים) · דרגה · בוהק-סיכון · ערך-חיים לטוליטיפ. */
  size: number;
  tier: TierKey;
  atRisk: boolean;
  val: number;
  churn: number;
}

/** hash דטרמיניסטי [0,1) ממחרוזת (FNV-1a) — לזווית-פולרית יציבה בלי רנדום. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

/**
 * מרים את כוכבי-הגלקסיה למרחב תלת-ממדי. azimuth=angle (סיבוב) · polar=hash(id)
 * (פיזור אנכי אחיד-למראה) · מרחק-מהמרכז=radius (טריות). מעבר-יחיד מעל constellation.
 */
export function donorUniverse(
  supporters: readonly Supporter[],
  todayIso: string,
  opts: ConstellationOpts = {},
): UniverseNode[] {
  return donorConstellation(supporters, todayIso, opts).map((n) => {
    const theta = n.angle * Math.PI * 2; // אזימוט [0,2π)
    // polar דטרמיניסטי [0,π] — arccos של [-1,1] נותן פיזור-שווה על הכדור (ללא צביר-קטבים).
    const phi = Math.acos(2 * hash01(n.id + '#p') - 1);
    const r = n.radius; // 0..~1 — טרי=פנימי
    const sinP = Math.sin(phi);
    return {
      id: n.id,
      name: n.name,
      x: r * sinP * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * sinP * Math.sin(theta),
      size: n.size,
      tier: n.tier,
      atRisk: n.atRisk,
      val: n.val,
      churn: n.churn,
    };
  });
}

/** הקרנת-פרספקטיבה של נקודה (אחרי סיבוב) למסך. מחזיר x,y בפיקסלים + scale-עומק. */
export function project(
  p: { x: number; y: number; z: number },
  yaw: number,
  pitch: number,
  w: number,
  h: number,
): { sx: number; sy: number; depth: number; scale: number } {
  // סיבוב סביב Y (yaw) ואז סביב X (pitch).
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  const y1 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  // פרספקטיבה: המצלמה במרחק 3 יחידות; קרוב=גדול.
  const cam = 3;
  const scale = cam / (cam - z2);
  const rad = Math.min(w, h) * 0.42;
  return { sx: w / 2 + x1 * rad * scale, sy: h / 2 + y1 * rad * scale, depth: z2, scale };
}
