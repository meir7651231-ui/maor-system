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
export type ModuleKey = 'families' | 'courses' | 'calendar' | 'diary' | 'supporters' | 'reports' | 'tzedaka' | 'shop' | 'shop7';

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
  /** מספר עמותה/מלכ"ר — מופיע בקבלת סעיף 46. */
  orgTaxId?: string;
  /** שם החותם על קבלות סעיף 46. */
  orgSignatory?: string;
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
  /** הרחבות (INTEGRATIONS) לפי שם — מפתחות חוקיים: INTEGRATION_KEYS בלבד.
   *  גל ג׳ ("עד-המפתח"): לצד enabled מותרות הגדרות-מחרוזת פר-הרחבה מתוך
   *  ‏INTEGRATION_SETTING_KEYS (למשל payments.payUrl). סודות — לעולם לא כאן. */
  integrations?: Record<string, { enabled: boolean; [setting: string]: unknown }>;
  /**
   * מיילים של מנהלי-על — רק הם רשאים לפתוח את אשף ההקמה ולשנות ערכת נושא.
   * ריק/חסר = אין הגבלה (כל מי שמחובר, כמו היום). כשמוגדר — משתמש שאינו ברשימה
   * לא רואה/פותח את האשף ואינו יכול לשנות נושא. ההשוואה case-insensitive.
   */
  adminEmails?: string[];
  /**
   * תפקידים (P3 פריט 15, הכרעה 2): מיפוי מייל→teacherId למורות מחוברות.
   * מורה רואה רק את החוגים שלה ופעולות הניהול מוסתרות. חסר/ריק = אין
   * תפקידים — התנהגות של היום בדיוק. ההשוואה case-insensitive.
   */
  roles?: { teachers?: Record<string, string> };
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
  /**
   * נתיבי-שורש בענן (CLOUD2 ענן 1): true = האוספים יושבים בשורש הפרויקט —
   * הלקוח הקיים (maor-hachesed), ביט-זהה להתנהגות של היום. חסר/false =
   * ארגון-פלטפורמה — האוספים תחת orgs/{slug}/. המעבר של הלקוח הקיים
   * ל-orgs/ — בחלון שקט, בפקודה נפרדת.
   */
  cloudRoot?: boolean;
}

/** קונפיגורציית Firebase של ארגון — קיצור נוחות. */
export type FirebaseOrgConfig = NonNullable<OrgConfig['firebase']>;

/**
 * מפתחות-ההרחבות החוקיים (INTEGRATIONS) — מקור-אמת יחיד: normalizeConfig מחטא
 * לפיו (מפתח זר/שגיאת-כתיב נזרק — לא נבלע בשקט), ו-INTEGRATION_LABELS/STATUS
 * באשף מיושרים אליו (ratchet). הוספת הרחבה = להוסיף כאן + תווית + סטטוס.
 */
export const INTEGRATION_KEYS = [
  'receipts', 'payments', 'whatsapp', 'sms', 'phone', 'gcal',
  'drive', 'sheets', 'maps', 'esign', 'ai', 'campaign',
] as const;

/**
 * הגדרות-מחרוזת מותרות פר-הרחבה (גל ג׳ — "עד-המפתח"): normalizeConfig שומר רק
 * את אלה (מחרוזות בלבד). **סודות אסורים כאן** (הקונפיג מסתנכרן לענן/גיבוי) —
 * מפתח-AI וכד' נשמרים מקומית-למכשיר בלבד.
 */
export const INTEGRATION_SETTING_KEYS: Record<string, readonly string[]> = {
  payments: ['provider', 'payUrl'],
  campaign: ['url'],
  sheets: ['spreadsheetId'], // גל ד׳ — sheetsNightly קורא מכאן (platformOrgs.config)
};

export const DEFAULT_CONFIG: OrgConfig = {
  slug: 'default',
  orgName: '',
  theme: 'or-rishon',
  modules: {},
  features: {},
};
