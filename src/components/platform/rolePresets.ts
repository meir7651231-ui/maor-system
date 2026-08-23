/**
 * 👤 פרופילי-תפקיד בקליק (VISION-LIGHT ‏#2, 23.8.2026, חבילת-הפשטות) —
 * במקום שהמנהל ידפדף קיר-מודולים פר-עובדת, לחיצה אחת מלבישה כרטיס-עובד
 * שלם: "מזכירה" / "גזברית" / "רכזת-חוגים". טהור, בלי store/DOM.
 *
 * סמנטיקה — בדיוק כמו כרטיס-העובד הקיים (EmployeeOverride, הגבלה-בלבד):
 *  · הפרופיל כותב `modules[m]=false` רק למודולים שמוסתרים, **ורק בתוך
 *    תקרת-הארגון** (scope = orgEnabledModules — מה שהבעלים לא הדליק ממילא
 *    לא קיים ואין מה לכתוב).
 *  · מה שלא נכתב = ירושה מהארגון (דלוק). הפרופיל הוא נקודת-פתיחה —
 *    המנהל ממשיך לכוונן בצ'יפים כרגיל. אפס אובדן-יכולת.
 *  · "גישה מלאה" = מפה ריקה ⇒ הכול בירושה.
 */
import type { ModuleKey } from '../../types/config';

export interface RolePreset {
  key: string;
  icon: string;
  label: string;
  /** מה הפרופיל משאיר — לתיאור בכפתור. */
  desc: string;
  /** המודולים שהפרופיל מסתיר (בתוך תקרת-הארגון בלבד). */
  hide: ModuleKey[];
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    key: 'secretary',
    icon: '🖊',
    label: 'מזכירה',
    desc: 'משפחות · חוגים · לוח · יומן — בלי מסכי-הכסף',
    hide: ['supporters', 'reports', 'tzedaka', 'shop', 'shop7'],
  },
  {
    key: 'treasurer',
    icon: '💰',
    label: 'גזברית',
    desc: 'תורמים · דוחות · משפחות · לוח — בלי תפעול-החוגים',
    hide: ['courses', 'diary', 'tzedaka', 'shop', 'shop7'],
  },
  {
    key: 'courses',
    icon: '🎨',
    label: 'רכזת-חוגים',
    desc: 'חוגים · משפחות · לוח · יומן-חדרים — בלי כסף ודוחות',
    hide: ['supporters', 'reports', 'tzedaka', 'shop', 'shop7', 'calendar'],
  },
  {
    key: 'full',
    icon: '🔓',
    label: 'גישה מלאה',
    desc: 'איפוס — הכול בירושה מהארגון',
    hide: [],
  },
];

/**
 * מפת-המודולים שהפרופיל כותב לכרטיס-העובד: ‏false לכל מודול-מוסתר שנמצא
 * בתקרת-הארגון; פרופיל ריק (גישה-מלאה) ⇒ מפה ריקה = הכול בירושה.
 */
export function presetModules(preset: RolePreset, scope: readonly ModuleKey[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const m of preset.hide) if (scope.includes(m)) out[m] = false;
  return out;
}

/** האם כרטיס-העובד תואם כרגע את הפרופיל (להדגשת הצ'יפ הפעיל). */
export function presetMatches(
  preset: RolePreset,
  modules: Record<string, boolean> | undefined,
  scope: readonly ModuleKey[],
): boolean {
  const want = presetModules(preset, scope);
  const have = modules ?? {};
  // כל מה שהפרופיל מסתיר אכן כבוי, ושום מודול-בתקרה אחר לא כבוי
  for (const m of scope) {
    const wantOff = want[m] === false;
    const haveOff = have[m] === false;
    if (wantOff !== haveOff) return false;
  }
  return true;
}
