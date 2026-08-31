/**
 * מנוע-הגרסה (טהור) — עוזר להחלטת "יש גרסה חדשה". מופרד מהרכיב כדי שהלוגיקה
 * תיבדק ביחידה. אין DOM/רשת כאן — רק השוואת-מזהים בטוחה מול קלט לא-מהימן
 * (version.json מהשרת/מתווך; ערכים חסרים/שווים ⇒ אין עדכון, מונע לולאת-רענון).
 */

/** האם ה-id שנקרא מ-version.json מייצג גרסה חדשה מזו שטעונה כרגע.
 *  שני הצדדים חייבים להיות מחרוזות לא-ריקות ושונות; אחרת false (בטוח). */
export function isNewVersion(currentId: unknown, fetchedId: unknown): boolean {
  if (typeof currentId !== 'string' || typeof fetchedId !== 'string') return false;
  if (!currentId || !fetchedId) return false;
  return currentId !== fetchedId;
}

/** מפתח-שומר לדילוג-כפול פר-גרסה (מונע הצגת-חוזרת/רענון-לולאה לאותו build). */
export function versionSeenKey(id: string): string {
  return 'maor_ver_seen:' + id;
}
