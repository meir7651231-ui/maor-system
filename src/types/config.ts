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

/**
 * סגנונות-תנועה (זהות-ורטיקל) — נכתבים כ-data-motion על ה-root ומכווננים
 * מהירות-המעברים של הממשק: calm (רגוע/איטי), snappy (מהיר/חד), bold (קפיצי).
 * חסר מ-config.motion = ברירת-המחדל של היום (בלי data-motion). allowlist ל-normalizeConfig.
 */
export const MOTION_KEYS = ['calm', 'snappy', 'bold'] as const;
export type MotionKey = (typeof MOTION_KEYS)[number];

/**
 * מספר-טלפון בתצורת-הטלפוניה (מוגדר כאן — שכבת-הטיפוסים — כדי ש-normalizeConfig
 * יחטא אותו בלי לייבא מרכיבים; ‏components/telephony/lib.ts מייבא מכאן).
 * ‏sim=SIM בשער-GSM · virtual=הפניית-לקוח · whatsapp=קישור-מכשיר.
 */
export interface TelNumber {
  id: string;
  e164: string;
  label: string;
  kind: 'sim' | 'virtual' | 'whatsapp';
  kosher?: boolean;
}

/**
 * תצורת-הטלפוניה שהאשף אוסף ומתמיד (downstream בלבד — מתאר ציוד-לקוח, בלי סודות).
 * נשמרת ב-config.json ומחוטאת ב-normalizeConfig (allowlist מלא — כל שדה זר נזרק).
 */
export interface TelephonyConfig {
  /** מתג-המקטע — **opt-in, ברירת-מחדל כבוי** (הפוך ממודול: חסר/false=כבוי, רק
   *  true מדליק). כבוי ⇒ המקטע מעומעם והטלפוניה לא נכללת בדף-המסירה. */
  enabled?: boolean;
  numbers: TelNumber[];
  officeDays: number[]; // 0=ראשון..6=שבת
  officeStart: string; // HH:MM
  officeEnd: string; // HH:MM
  officeExt: string;
  managerExt: string;
  vmBox: string;
  city: string; // מפתח-עיר לזמנים או '' לברירת-מחדל
  kosherMode: boolean;
  hebrewCalendar: boolean;
  zmanim: boolean;
  shabbat: boolean;
  fasts: boolean;
  voicemail: boolean;
}

/**
 * שפות האתר-הציבורי — עברית / אנגלית / אידיש (מהאפיון). ברירת-מחדל ['he'].
 * he+yi = RTL, en = LTR (הרכיב קובע dir לפי השפה הפעילה).
 */
export const SITE_LANGS = ['he', 'en', 'yi'] as const;
export type SiteLang = (typeof SITE_LANGS)[number];

/**
 * טקסט רב-לשוני לאתר-הציבורי — או מחרוזת יחידה (עברית), או מפה פר-שפה.
 * הרכיב פותר לפי השפה הפעילה עם נפילה-לעברית (resolveLocalized ב-lib/publicSite).
 */
export type LocalizedText = string | Partial<Record<SiteLang, string>>;

export interface PublicSiteStat {
  /** מספר/ערך להצגה (מחרוזת — "2,800", "24 שנה"). */
  value: string;
  label: LocalizedText;
}
export interface PublicSiteService {
  icon?: string;
  title: LocalizedText;
  text?: LocalizedText;
}
export interface PublicSiteCampaign {
  title?: LocalizedText;
  /** יעד הגיוס (מספר חיובי). */
  goal?: number;
  /** נגבה עד כה (מספר חיובי) — עדכני-לקוח; מוזן מהקונפיג. */
  raised?: number;
  /** תאריך-יעד ISO לספירה-לאחור. */
  end?: string;
  /** סמל-מטבע להצגה ('₪' ברירת-מחדל). */
  currency?: string;
}
export interface PublicSiteContact {
  phones?: string[];
  whatsapp?: string;
  email?: string;
  address?: LocalizedText;
  hours?: LocalizedText;
  mapUrl?: string;
  /** הערת-תחתית משפטית ("ע.ר. ... · אישור ניהול תקין"). */
  taxNote?: LocalizedText;
}

/** מסלול-שותפות (הוראת-קבע חודשית) — עמודת-תמחור בעיצוב. */
export interface PublicSiteTier {
  name: LocalizedText;
  amount?: number;
  period?: LocalizedText;
  perks?: LocalizedText[];
  featured?: boolean;
  url?: string;
}
/** מחשבון-תרומה — "כל ₪X = Y". */
export interface PublicSiteCalc {
  unitAmount?: number;
  unit?: LocalizedText;
  note?: LocalizedText;
}
export interface PublicSiteTestimonial {
  quote: LocalizedText;
  author?: string;
  role?: LocalizedText;
}
export interface PublicSiteFaq {
  q: LocalizedText;
  a: LocalizedText;
}
export interface PublicSiteEvent {
  date?: string;
  title: LocalizedText;
  meta?: LocalizedText;
  url?: string;
}
export interface PublicSitePartner {
  name: string;
  logo?: string;
  url?: string;
}
export interface PublicSiteNewsItem {
  date?: string;
  title: LocalizedText;
  body?: LocalizedText;
}
/** מייסד/ת — כרטיס-סיפור (תמונה + ציטוט). */
export interface PublicSiteFounder {
  name?: LocalizedText;
  quote?: LocalizedText;
  /** תמונת-המייסד/ת (https). */
  photo?: string;
}
/** אבן-דרך בציר-הזמן של הסיפור. */
export interface PublicSiteMilestone {
  year: string;
  title: LocalizedText;
  note?: LocalizedText;
}
/** גרף-צמיחה בסעיף-המספרים (דקורטיבי, מוזן-קונפיג). */
export interface PublicSiteGrowth {
  label?: LocalizedText;
  /** תווית-שינוי ("+38% מהשנה שעברה"). */
  delta?: string;
  /** נקודות-הגרף (ערכים 0..1, מנורמלים לגובה). */
  points?: number[];
}
/** אמצעי-תרומה (אונליין/העברה/צ׳קים) — כרטיס בבוחר-התרומה. */
export interface PublicSitePayMethod {
  label: LocalizedText;
  detail: LocalizedText;
  /** true ⇒ הפרטים מיושרים-שמאל (LTR, לצ׳קים בחו״ל). */
  ltr?: boolean;
}

/**
 * תוכן האתר-הציבורי (dashboard-נחיתה) — **מוזן ישירות מהקונפיג של הארגון**
 * (אותו OrgConfig שהמערכת משתמשת בו; מיתוג/ערכה/צבע נלקחים משדות-הליבה).
 * חסר ⇒ אין אתר ציבורי (ביט-זהה להיום). מחוטא ב-normalizeConfig (allowlist + תקרות).
 * ‏enabled=false ⇒ מכובה במפורש גם אם הדגל shell.publicsite דלוק.
 */
export interface PublicSiteContent {
  enabled?: boolean;
  langs?: SiteLang[];
  /** אייקון ה-hero (אימוג'י) — לאתר-הציבורי בלבד, נפרד מ-config.emoji (favicon/כותרת).
   *  חסר ⇒ נפילה ל-config.emoji/logoDataUri. */
  icon?: string;
  /** תת-כותרת ה-hero ("הבית של האלמנות והיתומים"). */
  tagline?: LocalizedText;
  /** שורת-מותג קטנה מתחת לשם-הארגון בניווט ("אור לאלמנה וליתום"). חסר ⇒ אינה מוצגת. */
  brandLine?: LocalizedText;
  /** מילות-זהב מתחלפות ב-hero. */
  heroWords?: LocalizedText[];
  stats?: PublicSiteStat[];
  /** true ⇒ מונה-משפחות חי מהנתונים המקומיים (מספר בלבד, בלי PII). */
  liveFamilies?: boolean;
  liveFamiliesLabel?: LocalizedText;
  campaign?: PublicSiteCampaign;
  services?: PublicSiteService[];
  /** "כל חודש מה חדש". */
  news?: LocalizedText;
  /** "הסיפור שמאחורי". */
  story?: LocalizedText;
  /** כותרת-הסיפור ("24 שנה של בית חם."). */
  storyTitle?: LocalizedText;
  /** מילת-ההדגשה בכותרת-הסיפור ("וזה רק מתחיל."). */
  storyTitleAccent?: LocalizedText;
  /** צ׳יפ-ברכה מתחת לסיפור ("בברכת גדולי ישראל ♡"). */
  storyBadge?: LocalizedText;
  /** מייסד/ת — כרטיס-תמונה + ציטוט. */
  founder?: PublicSiteFounder;
  /** ציר-זמן — אבני-דרך. */
  timeline?: PublicSiteMilestone[];
  /** גרף-צמיחה בסעיף-המספרים. */
  growth?: PublicSiteGrowth;
  /** אמצעי-תרומה (בבוחר-התרומה). */
  paymentMethods?: PublicSitePayMethod[];
  /** הערת-תחתית בבוחר-התרומה ("תרומות מוכרות למס..."). */
  donateNote?: LocalizedText;
  /** תמונות-גלריה (https בלבד). */
  gallery?: string[];
  contact?: PublicSiteContact;
  /** קישור-תרומה (https) — נפילה ל-integrations.payments.payUrl. */
  donateUrl?: string;
  /* ── עיצוב-דף-התרומות (design 16.8) ── */
  /** תמונת/וידאו ה-hero (https). */
  heroImage?: string;
  /** כותרת ה-hero ("הבית של"). חסר ⇒ שם-הארגון. */
  heroTitle?: LocalizedText;
  /** תג מעל הכותרת ("2,800 משפחות איתנו היום"). */
  heroBadge?: LocalizedText;
  /** מילת-ההדגשה בכותרת (מודגשת בקורל, בשורה שנייה). */
  titleAccent?: LocalizedText;
  /** כותרת סעיף-השירותים ("שישה דרכים לחבק משפחה"). */
  servicesHeading?: LocalizedText;
  /** מיקרו-שורה מתחת ל-CTA ("כל ₪9 = ארוחה חמה"). */
  microCopy?: LocalizedText;
  /** רצועת-קמפיין עליונה ("קמפיין החגים · ₪X נאספו"). */
  ticker?: LocalizedText;
  /** מרקיזת-נתונים נגללת (פריטי-טקסט). */
  marquee?: LocalizedText[];
  /** מחשבון-תרומה. */
  calc?: PublicSiteCalc;
  /** מסלולי-שותפות (הו"ק חודשית). */
  tiers?: PublicSiteTier[];
  testimonials?: PublicSiteTestimonial[];
  faq?: PublicSiteFaq[];
  events?: PublicSiteEvent[];
  partners?: PublicSitePartner[];
  /** בלוק-שקיפות ("כל שקל מתועד") + מדליוני-אמון. */
  transparency?: { heading?: LocalizedText; text?: LocalizedText; reportsUrl?: string; badges?: LocalizedText[] };
  /** טופס-קשר (לידים). */
  contactForm?: { enabled?: boolean; note?: LocalizedText };
}

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
  /**
   * צבע-הדגשה נבחר ידנית (provenance) — true = המשתמש בחר צבע באשף. החלת
   * חבילת-ורטיקל שומרת accent כשהדגל דלוק (הכרעת-בעלים: "הכל מוחלף חוץ מצבע
   * ידני"); חסר/false = הצבע נגזר מהחבילה/הערכה ומוחלף חופשי. מחוטא ב-normalizeConfig.
   */
  accentCustom?: boolean;
  /**
   * אימוג'י-הארגון (זהות-ורטיקל) — מוצג כאייקון האתר בכותרת (במקום האות-הראשונה)
   * וב-favicon. חסר = אין אימוג'י ⇒ נפילה לאות-הראשונה/לוגו (ביט-זהה ללקוח-החי).
   * מוזרק ע"י applyVerticalPack; מחוטא ב-normalizeConfig (מחרוזת קצרה בלבד).
   */
  emoji?: string;
  /**
   * סגנון-תנועה (זהות-ורטיקל) — נכתב כ-data-motion על ה-root ומכוונן מהירות-מעברים
   * (calm/snappy/bold). מכבד prefers-reduced-motion. חסר = ברירת-המחדל (ביט-זהה
   * להיום). ערכים חוקיים: MOTION_KEYS; מחוטא ב-normalizeConfig.
   */
  motion?: string;
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
  /** תבניות-הודעה עריכות (ROADMAP-100 ‏#12) — מפתחות חוקיים: TEMPLATE_KEYS
   *  (lib/templates); ריק/חסר = נוסח ברירת-המחדל. מחוטא ב-normalizeConfig. */
  templates?: Record<string, string>;
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
  /**
   * תצורת-טלפוניה (downstream) — נאספת באשף-ההקמה ומיוצאת עם החבילה. מחוטאת
   * ב-normalizeConfig (allowlist מלא). חסר = לא-הוגדרה טלפוניה (ביט-זהה להיום).
   * מכילה אך-ורק ציוד-לקוח (מספרים/שעות/שלוחות/דגלים) — לעולם לא סודות.
   */
  telephony?: TelephonyConfig;
  /**
   * מסלול-B (רי-ארכיטקצורה 14.8): פיצול-תרומות לאוסף-ענן נפרד פר-ייעוד לאכיפת-
   * הרשאה בשכבת-הנתונים. **דגל-אב off-by-default** — נדלק ידנית ע"י הבעלים רק
   * אחרי מיגרציה מבוקרת (P4). מגודר גם מ-cloudRoot: הלקוח-השורש לעולם לא מפוצל
   * (ביט-זהה, ratchet). חסר/false ⇒ תרומות מקוננות בתומך כהיום.
   */
  donationSplit?: boolean;
  /**
   * אכיפת-תומכים בשכבת-הנתונים (15.8: "אכיפה מלאה · פירוק", ארגוני-פלטפורמה בלבד) —
   * מסמך-תומך נושא `skey`=forWho plaintext, ועובד/ת מוגבל/ת קורא/ת בשאילתה מסוננת
   * ש-Rules אוכפים. **off-by-default** — נדלק ידנית אחרי מיגרציה (seed skey). חסר/
   * false ⇒ ביט-זהה להיום. ⚠️ לא-נתמך בלקוח-שורש (cloudRoot) — מודל-השורש הוא
   * allowlist מלא בלי „עובד מוגבל" בשרת (enableSupEnforce חוסם שורש/default).
   */
  supporterEnforce?: boolean;
  /**
   * תוכן האתר-הציבורי (dashboard-נחיתה, מגודר shell.publicsite + ‎?site‎ בכתובת).
   * מוזן ישירות מהקונפיג; חסר ⇒ אין אתר ציבורי. מחוטא ב-normalizeConfig.
   */
  site?: PublicSiteContent;
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
  'drive', 'sheets', 'maps', 'esign', 'ai', 'campaign', 'mail',
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
  // צרור-הלילה (ROADMAP-100 ‏#3): remindersNightly קורא מכאן את יעדי-התקציר
  sms: ['adminPhone'], // טלפון-המנהל לתקציר-הבוקר (לא סוד — יעד, לא מפתח)
  mail: ['digestTo'], // מייל-היעד לתקציר; כתובת-השולח היא secret בשרת (MAIL_FROM)
};

export const DEFAULT_CONFIG: OrgConfig = {
  slug: 'default',
  orgName: '',
  theme: 'or-rishon',
  modules: {},
  features: {},
};
