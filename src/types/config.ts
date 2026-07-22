/**
 * קונפיגורציית ארגון (white-label) — קובעת מיתוג, ערכת נושא ומודולים פעילים.
 * נטענת ב-lib/config.ts לפי סדר: localStorage ← config.json ← ברירת מחדל.
 */

/**
 * מפתחות המודולים הניתנים לכיבוי בניווט (בית והגדרות תמיד פעילים).
 *
 * חוזה המודולים: כיבוי מודול (false) לעולם אינו מוחק נתונים ולעולם אינו מפיל
 * את המערכת — הוא מסתיר את מסכי המודול *וגם* את כל המשטחים שלו במסכים אחרים
 * (מסך הבית, פלטת הפקודות, כרטיס המשפחה וכו'). הפעלה מחדש מחזירה הכול כפי
 * שהיה. הבדיקה נעשית תמיד דרך moduleOn() ב-lib/config.ts (מפתח חסר = פעיל).
 */
export type ModuleKey = 'families' | 'courses' | 'calendar' | 'diary' | 'supporters' | 'reports';

export interface OrgConfig {
  /** מזהה קצר של הארגון (לשם קובץ/כתובת). */
  slug: string;
  /** שם הארגון למיתוג — ריק = השם השמור בנתונים (db.orgName). */
  orgName: string;
  /** לוגו כ-data URI (אופציונלי). */
  logoDataUri?: string;
  /** מפתח ערכת נושא: or-rishon / heichal / tsohar / kehila. */
  theme: string;
  /** דריסת צבע הדגשה ארגוני (hex) — נכתב כ---accent על ה-DOM. */
  accent?: string;
  /** מודולים פעילים — מפתח חסר = פעיל; false = מוסתר מהניווט. */
  modules: Partial<Record<ModuleKey, boolean>>;
  /**
   * פיצ'רים עדינים פר-יכולת (מפתחות מ-types/features.ts) — מפתח חסר = פעיל;
   * false = כבוי. הבדיקה תמיד דרך featureOn() ב-lib/config.ts, שגם משרשרת
   * כיבוי מודול-אב אל הפיצ'רים שלו.
   */
  features?: Record<string, boolean>;
  /** מילון מונחים מותאם (למשל "חוגים" ← "שיעורים"). */
  terms?: Record<string, string>;
  /** אינטגרציות עתידיות לפי שם. */
  integrations?: Record<string, { enabled: boolean }>;
  /**
   * חיבור ענן (Firebase) — opt-in פר-ארגון. מפתח חסר = המערכת מקומית בלבד,
   * בדיוק כמו היום. קיים = נדרשת התחברות (אימייל+סיסמה) וסנכרון Firestore.
   */
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId: string;
  };
}

/** קונפיגורציית Firebase של ארגון — קיצור נוחות. */
export type FirebaseOrgConfig = NonNullable<OrgConfig['firebase']>;

export const DEFAULT_CONFIG: OrgConfig = {
  slug: 'default',
  orgName: '',
  theme: 'or-rishon',
  modules: {},
  features: {},
};
