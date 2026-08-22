/**
 * מנוע-מחסן · מלאי-חומרים חוצה-פרויקטים (ורטיקל-הסטודיו) — טהור ודטרמיניסטי.
 *
 * המחסן עצמאי (db.warehouse). ה"הקצאה" מחושבת כנגזרת: סכום כמויות-החומרים
 * (AyinCase.mat[].qty) בכל הפרויקטים, לפי התאמת-שם מנורמלת מול פריט-המחסן. נותר
 * = מלאי − הוקצה. undefined/ריק ⇒ 0. אפס-כתיבה, אפס-כסף/קבלות.
 */
import type { Supporter, WarehouseItem } from '../types/domain';

export interface WarehouseAllocation {
  item: WarehouseItem;
  /** סכום-ההקצאה בכל הפרויקטים (התאמת-שם). */
  allocated: number;
  /** נותר-במלאי = qty − allocated (יכול להיות שלילי = חוסר). */
  remaining: number;
  /** מחסור: הוקצה מעבר-למלאי. */
  short: boolean;
  /** פירוק פר-פרויקט (רק אלו שצורכים את הפריט). */
  byProject: { id: string; name: string; qty: number }[];
}

/** נרמול-שם להתאמה (רווחים מיותרים + אותיות קטנות). */
function norm(s: string): string {
  return (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * סקירת-המחסן: לכל פריט, כמה הוקצה בפרויקטים (לפי שם-החומר) וכמה נותר. מעבר-יחיד
 * מעל כל רשומות-החומרים ⇒ O(סה"כ-רשומות-חומרים). דטרמיניסטי, ללא Date/random.
 */
export function warehouseOverview(
  warehouse: readonly WarehouseItem[],
  supporters: readonly Supporter[],
): WarehouseAllocation[] {
  // איסוף צריכה פר-שם-מנורמל: name → [{projectId, projectName, qty}]
  const used = new Map<string, { id: string; name: string; qty: number }[]>();
  for (const sp of supporters) {
    const mat = sp.ayin?.mat;
    if (!mat || !mat.length) continue;
    // צבירה פר-פרויקט-ושם (כמה מאותו-חומר בפרויקט אחד).
    const perName = new Map<string, number>();
    for (const m of mat) {
      const k = norm(m.name);
      if (!k) continue;
      perName.set(k, (perName.get(k) || 0) + (+m.qty || 0));
    }
    for (const [k, qty] of perName) {
      if (qty <= 0) continue;
      used.set(k, [...(used.get(k) || []), { id: sp.id, name: sp.name, qty }]);
    }
  }

  return warehouse.map((item) => {
    const rows = used.get(norm(item.name)) || [];
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    const remaining = (+item.qty || 0) - allocated;
    return {
      item,
      allocated,
      remaining,
      short: remaining < 0,
      byProject: [...rows].sort((a, b) => b.qty - a.qty),
    };
  });
}

/** ערך-מלאי כולל (Σ qty×cost) — למדד-מחסן. */
export function warehouseValue(warehouse: readonly WarehouseItem[]): number {
  return Math.round(warehouse.reduce((a, w) => a + (+w.qty || 0) * (+w.cost || 0), 0));
}
