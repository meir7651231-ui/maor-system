/**
 * רישום הפיצ'רים (feature registry) — טוגלים עדינים פר-יכולת, מעבר לטוגלי
 * המודולים הגסים ב-OrgConfig.modules.
 *
 * חוזה: מפתח חסר ב-config.features = פעיל; רק false מכבה. כיבוי מודול ניווט
 * שלם מכבה אוטומטית את כל הפיצ'רים שלו (ראו featureOn ב-lib/config.ts).
 * הקידומת של כל מפתח (הקטע שלפני הנקודה) חייבת להתאים לשדה module.
 */

export interface FeatureDef {
  /** מפתח יציב בצורת '<module>.<capability>' — זהו החוזה מול הקוד. */
  key: string;
  /** תווית קצרה בעברית לתצוגה במסך ההגדרות. */
  label: string;
  /** תיאור קצר — מה נעלם כשמכבים. */
  desc: string;
  /** המודול-אב; 'core'/'home'/'settings' אינם כפופים לטוגל מודול. */
  module:
    | 'families'
    | 'courses'
    | 'calendar'
    | 'diary'
    | 'supporters'
    | 'reports'
    | 'home'
    | 'settings'
    | 'core';
}

export const FEATURES: FeatureDef[] = [
  // ——— משפחות ———
  { key: 'families.cred', label: 'מדד אמינות', desc: 'ציון אמינות משפחתי בכרטיס המשפחה וברשימות', module: 'families' },
  { key: 'families.docs', label: 'מסמכים', desc: 'צירוף וניהול מסמכים בכרטיס המשפחה', module: 'families' },
  { key: 'families.history', label: 'היסטוריית משפחה', desc: 'ציר זמן של אירועים ושינויים במשפחה', module: 'families' },
  { key: 'families.join', label: 'שיבוץ מכרטיס המשפחה', desc: 'שיבוץ בן משפחה לחוג ישירות מכרטיס המשפחה', module: 'families' },
  { key: 'families.media', label: 'הסכמות מדיה בטופס', desc: 'שדות הסכמת צילום ופרסום בטופס המשפחה', module: 'families' },
  { key: 'families.report', label: 'דוח משפחה להורדה', desc: 'הורדת דוח מרוכז על משפחה כקובץ', module: 'families' },
  { key: 'families.finder', label: 'גלגל מאתר המשפחות', desc: 'גלגל סינון חי בתוך מסך המשפחות — צלילה ציר אחרי ציר', module: 'families' },

  // ——— חוגים ———
  { key: 'courses.punch', label: 'כרטיסיות ניקוב', desc: 'מכירת כרטיסיות וניקוב כניסות במקום מנוי', module: 'courses' },
  { key: 'courses.payments', label: 'תשלומים וחובות', desc: 'מעקב תשלומים, חובות ויתרות לחוגים', module: 'courses' },
  { key: 'courses.groups', label: 'קבוצות מרובות', desc: 'ניהול כמה קבוצות במקביל לאותו חוג', module: 'courses' },
  { key: 'courses.wheel', label: 'גלגל החוגים', desc: 'תצוגת גלגל שבועית של מערכת החוגים', module: 'courses' },
  { key: 'courses.printout', label: 'תדפיס למורה', desc: 'הדפסת רשימת משתתפים ונוכחות למורה', module: 'courses' },
  { key: 'courses.discounts', label: 'מדרגות מחיר', desc: 'הנחות ומדרגות מחיר לפי מספר נרשמים', module: 'courses' },

  // ——— לוח שנה ———
  { key: 'calendar.dayview', label: 'תצוגת יום', desc: 'מעבר לתצוגת יום מפורטת בלוח השנה', module: 'calendar' },
  { key: 'calendar.layers', label: 'שכבות אירועים', desc: 'שכבות ימי הולדת, הצטרפות והרשמות על הלוח', module: 'calendar' },
  { key: 'calendar.blocking', label: 'חסימת שבת/חג והתנגשויות', desc: 'חסימת שבתות וחגים והתרעה על התנגשויות', module: 'calendar' },

  // ——— יומן חדרים ———
  { key: 'diary.booking', label: 'הזמנת משבצת', desc: 'הזמנת משבצת זמן בחדר ישירות מהיומן', module: 'diary' },
  { key: 'diary.utilization', label: 'ניצולת חדרים', desc: 'סטטיסטיקת ניצולת ותפוסה של החדרים', module: 'diary' },

  // ——— תורמים ———
  { key: 'supporters.rfm', label: 'דירוג תורמים', desc: 'דירוג RFM — תדירות, עדכניות וסכום תרומות', module: 'supporters' },
  { key: 'supporters.nextdate', label: 'יעדי קשר', desc: 'תזכורות ותאריכי יעד לקשר הבא עם תורם', module: 'supporters' },
  { key: 'supporters.ayin', label: 'מעקב טיפול רב-שלבי', desc: 'תהליך טיפול מרובה-שלבים לכל תומך/ת — שמות, מעקב, תזכורות ודוח יומי', module: 'supporters' },

  // ——— מסך הבית ———
  { key: 'home.digest', label: 'תקציר הבוקר', desc: 'תקציר יומי בראש מסך הבית', module: 'home' },
  { key: 'home.carousel', label: 'קרוסלה', desc: 'קרוסלת כרטיסים מתחלפת במסך הבית', module: 'home' },
  { key: 'home.care', label: 'דורש טיפול', desc: 'רשימת פריטים הדורשים טיפול במסך הבית', module: 'home' },
  { key: 'home.board', label: 'לוח נבנה אישית', desc: 'עריכת מסך הבית: הוספה, הסרה וסידור ווידג\'טים', module: 'home' },
  { key: 'home.impactwall', label: 'קיר ההשפעה ✨', desc: 'מסך ראווה לטלוויזיה ולערבי גיוס — מונים חיים וזוהרים', module: 'home' },

  // ——— הגדרות ———
  { key: 'settings.rooms', label: 'ניהול חדרים', desc: 'הוספה ועריכה של חדרים בהגדרות', module: 'settings' },
  { key: 'settings.teachers', label: 'ניהול מורים', desc: 'הוספה ועריכה של מורים בהגדרות', module: 'settings' },
  { key: 'settings.import', label: 'ייבוא נתונים', desc: 'ייבוא נתונים מקובץ אל המערכת', module: 'settings' },
  { key: 'settings.audit', label: 'בדיקת תקינות נתונים', desc: 'סריקת כפילויות, ת"ז, טלפונים ולוגיקה — מסך ממצאים ותיקון אוטומטי', module: 'settings' },
  { key: 'settings.export', label: 'ייצוא נתונים', desc: 'ייצוא גיבוי ונתונים לקובץ', module: 'settings' },
  { key: 'settings.reset', label: 'איפוס מערכת', desc: 'מחיקת כל הנתונים ואיפוס המערכת', module: 'settings' },

  // ——— ליבה ———
  { key: 'core.receipts', label: 'קבלות להורדה', desc: 'הפקת קבלות להורדה על תשלומים ותרומות', module: 'core' },
  { key: 'core.daygate', label: 'מסך פתיחת יום', desc: 'מסך פתיחת יום בכניסה הראשונה של היום', module: 'core' },
];

/** הגדרת מונח במילון המונחים — label לתצוגה במסך ההגדרות, fallback = ברירת המחדל. */
export interface TermDef {
  /** מפתח יציב בצורת 'nav.<view>' או 'entity.<name>'. */
  key: string;
  /** תווית בעברית למסך ההגדרות (מה המונח מציין). */
  label: string;
  /** ערך ברירת המחדל כשאין דריסה ב-config.terms. */
  fallback: string;
}

export const TERM_DEFS: TermDef[] = [
  // ——— ניווט ———
  { key: 'nav.families', label: 'שם מסך המשפחות', fallback: 'משפחות' },
  { key: 'nav.courses', label: 'שם מסך החוגים', fallback: 'חוגים' },
  { key: 'nav.calendar', label: 'שם לוח השנה', fallback: 'לוח שנה' },
  { key: 'nav.diary', label: 'שם יומן החדרים', fallback: 'יומן חדרים' },
  { key: 'nav.supporters', label: 'שם מסך התורמים', fallback: 'תורמים' },
  { key: 'nav.reports', label: 'שם מסך הדוחות', fallback: 'דוחות' },

  // ——— ישויות ———
  { key: 'entity.family', label: 'משפחה (יחיד)', fallback: 'משפחה' },
  { key: 'entity.member', label: 'בן/בת משפחה', fallback: 'בן/בת משפחה' },
  { key: 'entity.course', label: 'חוג (יחיד)', fallback: 'חוג' },
  { key: 'entity.teacher', label: 'מורה', fallback: 'מורה' },
  { key: 'entity.room', label: 'חדר', fallback: 'חדר' },
  { key: 'entity.supporter', label: 'תורם', fallback: 'תורם' },
  { key: 'entity.donation', label: 'תרומה', fallback: 'תרומה' },
  { key: 'entity.enrollment', label: 'שיבוץ', fallback: 'שיבוץ' },
  { key: 'entity.cred', label: 'מדד אמינות', fallback: 'מדד אמינות' },

  // ——— מעקב טיפול (feature supporters.ayin) — כללי וניתן לשינוי-שם מלא ———
  { key: 'nav.ayin', label: 'שם מעקב הטיפול', fallback: 'מעקב טיפול' },
  { key: 'entity.ayinItem', label: 'פריט למעקב (יחיד)', fallback: 'שם לטיפול' },
  { key: 'entity.ayinUnit', label: 'מונה הפריט', fallback: 'כמות' },
  { key: 'ayin.stage.new', label: 'שלב מעקב 1', fallback: 'חדש' },
  { key: 'ayin.stage.lead', label: 'שלב מעקב 2', fallback: 'בהכנה' },
  { key: 'ayin.stage.eyes', label: 'שלב מעקב 3', fallback: 'רישום' },
  { key: 'ayin.stage.answer', label: 'שלב מעקב 4', fallback: 'מסירה' },
  { key: 'ayin.stage.done', label: 'שלב מעקב 5', fallback: 'הושלם' },
];
