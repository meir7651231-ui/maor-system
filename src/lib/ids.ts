/**
 * יצירת-מזהים חסינת-התנגשות בין-מכשירית (#5, הכרעת בעלים "5 כן").
 *
 * הבעיה: nextId החזיר `prefix + seq` בלבד. seq הוא מונה מקומי — שני מכשירים
 * לא-מקוונים באותו ארגון-ענן שמתחילים מאותו seq מייצרים מזהה זהה (למשל
 * "fam100"), ובסנכרון אחת הרשומות דורסת את השנייה בשקט.
 *
 * הפתרון: מצרפים לכל מזהה חדש "תג-מכשיר" — מחרוזת base36 אקראית קבועה
 * לכל דפדפן/מכשיר (נשמרת ב-localStorage, גלובלית למכשיר — לא פר-ארגון). כך
 * שני מכשירים באותו seq מייצרים "fam100k3f9" מול "fam100b7c2" — נבדלים,
 * ושניהם שורדים את המיזוג.
 *
 * המזהה נשאר אטום בכל המערכת (אין מפרסר את החלק המספרי של מזהה nextId —
 * מספור הקבלות R-/D-/S- נפרד לגמרי). ידע-קיים (מזהים בלי תג) ממשיך לעבוד:
 * הם רק מחרוזות, וההשוואות הן שוויון-מחרוזת.
 */

/** מרכיב מזהה מתג נתון — טהור (הליבה הנבדקת). tag ריק ⇒ פורמט קודם (`prefix+seq`). */
export function makeId(prefix: string, seq: number, tag: string): string {
  return prefix + seq + tag;
}

const DEVICE_TAG_KEY = 'maor_device_tag'; // גלובלי-למכשיר (מזהה את הדפדפן, לא את הארגון)
let cachedTag: string | null = null;

/**
 * תג-המכשיר של הדפדפן הנוכחי — 5 תווי base36 (~60M צירופים) קבועים ונשמרים.
 * ללא localStorage (טסטים ב-Node / SSR) מחזיר '' — אז makeId נותן פורמט
 * דטרמיניסטי זהה-לעבר, כך שהטסטים והזרעים נשארים יציבים.
 */
export function deviceTag(): string {
  if (cachedTag != null) return cachedTag;
  try {
    let t = localStorage.getItem(DEVICE_TAG_KEY);
    if (!t) {
      t = Math.floor(Math.random() * 60466176).toString(36).padStart(5, '0'); // 36^5
      localStorage.setItem(DEVICE_TAG_KEY, t);
    }
    cachedTag = t;
    return t;
  } catch {
    return ''; // אין localStorage — בלי תג (דטרמיניסטי)
  }
}
