/**
 * שער יציאת-מידע יחיד (13.8, בקשת-בעלים "כפתור שמבטל לעובד כל הוצאת מידע").
 * המנהל מכבה `core.export` בכרטיס-העובד ⇒ הקונפיג-האפקטיבי של אותה עובדת מסמן
 * את השער כחסום ⇒ כל נתיב הורדה/הדפסה/העתקה מסרב בנקודת-חנק אחת.
 *
 * למה נקודת-חנק ולא גידור פר-קריאה: `core.export` אינו חולק קידומת-נקודה עם
 * תת-דגלי-הייצוא (reports.csv / shop7.export / supporters.annualreport …) ולכן
 * `featureOn` לא משתרשר אליהם — גידור מפורש בכל אתר-הורדה דלף (~18 נתיבים).
 * במקום זאת פונקציות-ההורדה הבסיסיות עצמן שואלות את השער.
 *
 * חוזה-הדגלים נשמר: חסר=מותר, רק false חוסם. ברירת-המחדל כאן = מותר, כך שכל
 * הבדיקות והמשתמשים הרגילים אינם מושפעים עד שהמנהל חוסם עובדת במפורש.
 */

let blocked = false;
let notify: (() => void) | null = null;

/** נקבע מ-App לפי הקונפיג-האפקטיבי; onBlocked (אופציונלי) מריץ toast בסירוב. */
export function setExportBlocked(isBlocked: boolean, onBlocked?: () => void): void {
  blocked = isBlocked;
  notify = onBlocked ?? null;
}

/** האם יציאת-מידע מותרת כרגע (חסר-דגל/ברירת-מחדל ⇒ true). */
export function exportAllowed(): boolean {
  return !blocked;
}

/**
 * שער לפני כל נתיב-יציאה: מחזיר true אם מותר. אם חסום — מריץ את ההתרעה
 * (toast) ומחזיר false, כדי שהקורא יעצור בלי להוריד/להדפיס דבר.
 */
export function guardExport(): boolean {
  if (blocked) {
    notify?.();
    return false;
  }
  return true;
}
