/**
 * גלריית-תמונות — עזרי-טוהר (תקרות · יחס-ממדים · אימות). ההקטנה עצמה בקומפוננטה
 * (canvas/DOM); כאן רק הלוגיקה הטהורה הנבדקת ביחידה. שמירה מקומית ב-DB (data:URI),
 * לכן תקרה קשיחה כדי לא לנפח את מסמך-ה-DB. מגודר supporters.photos.
 */

/** מקסימום תמונות לתורם (תקרה קשיחה — DB מקומי). */
export const PHOTO_MAX = 5;
/** צלע-מרבית בפיקסלים אחרי הקטנה. */
export const PHOTO_MAX_DIM = 800;
/** תקרת-משקל למחרוזת-התמונה אחרי הקטנה (~450KB base64 ≈ ~330KB בינארי). */
export const PHOTO_MAX_LEN = 460_000;
/**
 * נחיל ב׳ (3.9): תקציב-כולל לתורם — 5×460k = 2.3MB חרג מתקרת-מסמך-Firestore (1MB) ⇒ הדחיפה
 * נכשלה לנצח (invalid-argument). <1MB גם עם ניפוח-הצפנה ~1.37×. (מספר = פשרת-מוצר — לבעלים.)
 */
export const PHOTO_TOTAL_MAX_LEN = 600_000;

/**
 * האם ניתן להוסיף עוד תמונה — מתחת לתקרת-הכמות **וגם** לתקציב-המשקל-הכולל (כולל התמונה
 * המועמדת, nextLen). בלי nextLen = בדיקת-כמות+משקל-קיים בלבד (תאימות-לאחור).
 */
export function canAddPhoto(current: readonly string[] | undefined, nextLen = 0): boolean {
  const cur = current ?? [];
  return cur.length < PHOTO_MAX && cur.reduce((a, p) => a + p.length, 0) + nextLen <= PHOTO_TOTAL_MAX_LEN;
}

/** מחרוזת היא תמונת-data תקינה (data:image/...;base64,...). */
export function isDataImage(s: unknown): s is string {
  return typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s);
}

/**
 * ממדי-יעד אחרי הקטנה — משמר יחס-גובה-רוחב, הצלע-הגדולה ל-max לכל-היותר (לא
 * מגדיל תמונה קטנה). מחזיר מספרים שלמים חיוביים.
 */
export function fitDimensions(w: number, h: number, max: number): { w: number; h: number } {
  if (w <= 0 || h <= 0) return { w: 0, h: 0 };
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

/**
 * סינון-מערך-תמונות מתקבל-מבחוץ (ייבוא/סנכרון/ישן) — רק תמונות-data תקינות מתחת
 * לתקרת-המשקל, עד PHOTO_MAX. שער-חיטוי לפני התמדה.
 */
export function sanitizePhotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => isDataImage(x) && x.length <= PHOTO_MAX_LEN).slice(0, PHOTO_MAX);
}
