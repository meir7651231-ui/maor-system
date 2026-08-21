/**
 * מנוע install-kit · ערכת-התקנה/מסירה פר-פרויקט (ורטיקל-הסטודיו) — טהור.
 *
 * צ'ק-ליסט מסירה על התיק (AyinCase.kit): כמה הושלמו מתוך כמה + אחוז. additive-only,
 * אפס-מיגרציה; מגודר supporters.ayin.kit + הקשר-מסחרי. undefined ⇒ ריק (0/0).
 */
import type { AyinCase, KitItem } from '../types/domain';

export interface KitProgress {
  done: number;
  total: number;
  /** אחוז-השלמה 0–100 (0 כשאין פריטים). */
  pct: number;
  ready: boolean; // הכל סומן — מוכן-למסירה
}

export function kitProgress(a: Pick<AyinCase, 'kit'> | null | undefined): KitProgress {
  const kit: KitItem[] = a?.kit || [];
  const total = kit.length;
  const done = kit.reduce((n, k) => n + (k.done ? 1 : 0), 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, ready: total > 0 && done === total };
}

/** ערכת-ברירת-מחדל לפרויקט-חדש (הצעה; הלקוח עורך). */
export const DEFAULT_KIT_LABELS: readonly string[] = [
  'הטמעת התוצר בסביבת-הלקוח',
  'בדיקת-קבלה מול הלקוח',
  'מסירת חומרי-הדרכה',
  'גיבוי + הרשאות-גישה',
  'חתימת-מסירה',
];
