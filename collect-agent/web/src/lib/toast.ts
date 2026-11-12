// הפעלה 148: מיקום ה-toast מול סרגל פעולה דביק בתחתית המסך (כיום: סרגל השמירה בהגדרות).
// ה-toast תמיד בתחתית. כשיש סרגל דביק גלוי הוא מורם מעליו, כך שהוא לא מכסה את שורת השגיאה שבסרגל
// (הפעלה 145) וגם לא את הכותרת, מצב החיבור וכפתור היציאה שבראש המסך (מה שקרה כשהוצג למעלה).
export const TOAST_GAP = 8;      // רווח בין ה-toast לסרגל
export const TOAST_BOTTOM = 20;  // המרחק הרגיל מתחתית המסך (bottom-5)

/** המרחק מתחתית החלון שבו מוצג ה-toast. barTop = ראש הסרגל הדביק ביחס לחלון, או null כשאין סרגל. */
export function toastBottom(barTop: number | null, viewportH: number): number {
  if (barTop === null || !Number.isFinite(barTop) || barTop <= 0 || barTop >= viewportH) return TOAST_BOTTOM;
  return Math.max(TOAST_BOTTOM, Math.round(viewportH - barTop + TOAST_GAP));
}

/** כמה זמן ההודעה מוצגת: הודעה ארוכה נשארת יותר זמן. */
export const toastMs = (text: string): number => Math.max(3600, text.length * 60);
