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
  { key: 'families.cardops', label: 'פעולות תפעול בכרטיס', desc: 'ניקוב, חיסור, ניהול והסרת שיבוץ + כרטיסי אב/אם להשלמה + "➕ אירוע" — ישירות מכרטיס המשפחה', module: 'families' },

  // ——— חוגים ———
  { key: 'courses.punch', label: 'כרטיסיות ניקוב', desc: 'מכירת כרטיסיות וניקוב כניסות במקום מנוי', module: 'courses' },
  { key: 'courses.payments', label: 'תשלומים וחובות', desc: 'מעקב תשלומים, חובות ויתרות לחוגים', module: 'courses' },
  { key: 'courses.groups', label: 'קבוצות מרובות', desc: 'ניהול כמה קבוצות במקביל לאותו חוג', module: 'courses' },
  { key: 'courses.wheel', label: 'גלגל החוגים', desc: 'תצוגת גלגל שבועית של מערכת החוגים', module: 'courses' },
  { key: 'courses.printout', label: 'תדפיס למורה', desc: 'הדפסת רשימת משתתפים ונוכחות למורה', module: 'courses' },
  // תת-יכולות עדינות (עצמאיות — בלוק/כפתור נפרד לכל אחת)
  { key: 'courses.punch.buy', label: 'קניית/טעינת כרטיסייה', desc: 'תיבת טעינת הניקובים בניהול השיבוץ', module: 'courses' },
  { key: 'courses.punch.confirm', label: 'אישור כפול לניקוב', desc: 'לחיצה ראשונה "לאשר ניקוב?" ושנייה בתוך 3 שניות מבצעת — מונע ניקוב בטעות (כמו בקובץ החי)', module: 'courses' },
  { key: 'courses.punch.undo', label: 'ביטול ניקוב אחרון', desc: 'כפתור ביטול הניקוב האחרון', module: 'courses' },
  { key: 'courses.punch.switchmonthly', label: 'מעבר למנוי חודשי', desc: 'כפתור המרת כרטיסייה למנוי', module: 'courses' },
  { key: 'courses.printout.daily', label: 'דו"ח יומי מפורט', desc: 'כפתור הדו"ח היומי מפגש-מפגש', module: 'courses' },
  { key: 'courses.printout.custom', label: 'דו"ח מותאם (חוג)', desc: 'כפתור הדו"ח המותאם בכרטיס החוג', module: 'courses' },
  { key: 'courses.discounts', label: 'מדרגות מחיר', desc: 'הנחות ומדרגות מחיר לפי מספר נרשמים', module: 'courses' },
  { key: 'courses.receipt.summary', label: 'קבלה מלאה', desc: 'שורות "סה"כ עסקה / שולם עד כה / יתרה / תשלום הבא" על הקבלה + הורדה חוזרת פר-תשלום', module: 'courses' },
  { key: 'courses.enroll.smartfilter', label: 'סינון שיבוץ חכם', desc: 'סינון אוטומטי לפי גיל/מגדר בזרימת השיבוץ + מתג "הצג הכל" + אזהרת התנגשות לו"ז', module: 'courses' },

  // ——— לוח שנה ———
  { key: 'calendar.dayview', label: 'תצוגת יום', desc: 'מעבר לתצוגת יום מפורטת בלוח השנה', module: 'calendar' },
  { key: 'calendar.layers', label: 'שכבות אירועים', desc: 'שכבות ימי הולדת, הצטרפות והרשמות על הלוח', module: 'calendar' },
  { key: 'calendar.blocking', label: 'חסימת שבת/חג והתנגשויות', desc: 'חסימת שבתות וחגים והתרעה על התנגשויות', module: 'calendar' },
  // חסימות הלוח — שתי היכולות ניתנות לכיבוי בנפרד (תת-דגלים של calendar.blocking)
  { key: 'calendar.blocking.roomclash', label: 'התרעת התנגשות חדר', desc: 'חסימת שמירת אירוע כשחדר תפוס באותה שעה', module: 'calendar' },
  { key: 'calendar.blocking.shabbat', label: 'חסימת שבת/חג', desc: 'חסימת אירוע ארגוני בשבת ובחג + באנר "יום חסום"', module: 'calendar' },
  // שכבות הלוח — כל שכבה ניתנת לכיבוי בנפרד (עצמאי לחלוטין)
  { key: 'calendar.layers.bdays', label: 'שכבת ימי הולדת', desc: 'גלולות ימי ההולדת בלוח', module: 'calendar' },
  { key: 'calendar.layers.joins', label: 'שכבת הצטרפות', desc: 'גלולות שנות ההצטרפות בלוח', module: 'calendar' },
  { key: 'calendar.layers.enrolls', label: 'שכבת הרשמות', desc: 'גלולות ההרשמה לחוגים בלוח', module: 'calendar' },
  { key: 'calendar.layers.holidays', label: 'שכבת חגים', desc: 'סימון החגים בתאי הלוח', module: 'calendar' },
  { key: 'calendar.layers.reminders', label: 'שכבת תזכורות', desc: 'אירועי תזכורת בלוח', module: 'calendar' },
  { key: 'calendar.layers.calls', label: 'שכבת טלפונים', desc: 'אירועי שיחה בלוח', module: 'calendar' },
  { key: 'calendar.layers.family', label: 'שכבת אירועים משפחתיים', desc: 'אירועים המשויכים למשפחה בלוח', module: 'calendar' },

  // ——— יומן חדרים ———
  { key: 'diary.booking', label: 'הזמנת משבצת', desc: 'הזמנת משבצת זמן בחדר ישירות מהיומן', module: 'diary' },
  { key: 'diary.utilization', label: 'ניצולת חדרים', desc: 'סטטיסטיקת ניצולת ותפוסה של החדרים', module: 'diary' },

  // ——— תורמים ———
  { key: 'supporters.rfm', label: 'דירוג תורמים', desc: 'דירוג RFM — תדירות, עדכניות וסכום תרומות', module: 'supporters' },
  { key: 'supporters.nextdate', label: 'יעדי קשר', desc: 'תזכורות ותאריכי יעד לקשר הבא עם תורם', module: 'supporters' },
  { key: 'supporters.ayin', label: 'מעקב טיפול רב-שלבי', desc: 'תהליך טיפול מרובה-שלבים לכל תומך/ת — שמות, מעקב, תזכורות ודוח יומי', module: 'supporters' },
  { key: 'supporters.multicur', label: 'מטבע כפול (₪/$)', desc: 'אפשרות לבחור מטבע דולר ברישום תרומה — כבוי: הכול בשקלים', module: 'supporters' },
  { key: 'supporters.doncal', label: 'לוח תרומות בכרטיס', desc: 'לוח-חודש חזותי של תרומות התורם/ת + יעד הקשר הבא, בכרטיס התורם', module: 'supporters' },
  { key: 'supporters.customreport', label: 'דו"ח מותאם (תומכים)', desc: 'כפתור ייצוא דו"ח מותאם במסך התומכים', module: 'supporters' },
  { key: 'supporters.ayin.dailyreport', label: 'דוח יומי — מעקב טיפול', desc: 'כפתור ייצוא הדוח היומי של מעקב הטיפול (תת-דגל של מעקב טיפול)', module: 'supporters' },
  { key: 'supporters.hist', label: 'תרומות מהקובץ ההיסטורי', desc: 'מיזוג התרומות שהגיעו מהקובץ ההיסטורי (גיבוי לגאסי) לרשימת "כל התרומות" בכרטיס', module: 'supporters' },
  { key: 'supporters.ayin.sheet', label: 'גיליון מעקב להורדה/ייבוא', desc: 'ייצוא גיליון מעקב הטיפול ל-CSV, מילוי מחוץ למערכת וייבוא חזרה (תת-דגל של מעקב טיפול)', module: 'supporters' },

  // ——— מסך הבית ———
  { key: 'home.digest', label: 'תקציר הבוקר', desc: 'תקציר יומי בראש מסך הבית', module: 'home' },
  { key: 'home.carousel', label: 'קרוסלה', desc: 'קרוסלת כרטיסים מתחלפת במסך הבית', module: 'home' },
  { key: 'home.care', label: 'דורש טיפול', desc: 'רשימת פריטים הדורשים טיפול במסך הבית', module: 'home' },
  { key: 'home.board', label: 'לוח נבנה אישית', desc: 'עריכת מסך הבית: הוספה, הסרה וסידור ווידג\'טים', module: 'home' },
  { key: 'home.impactwall', label: 'קיר ההשפעה ✨', desc: 'מסך ראווה לטלוויזיה ולערבי גיוס — מונים חיים וזוהרים', module: 'home' },
  // ווידג'טים עדינים — כל אחד ניתן להסתרה בנפרד ממסך הבית (עצמאי לחלוטין)
  { key: 'home.bdays', label: 'ווידג\'ט: ימי הולדת היום', desc: 'הבאנר החם של החוגגים במסך הבית', module: 'home' },
  { key: 'home.stats', label: 'ווידג\'ט: כרטיסי נתונים', desc: 'גריד כרטיסי הסיכום במסך הבית', module: 'home' },
  { key: 'home.today', label: 'ווידג\'ט: לוח "היום"', desc: 'מפגשים, אירועים וימי הולדת של היום', module: 'home' },
  { key: 'home.recent', label: 'ווידג\'ט: משפחות אחרונות', desc: 'טבלת המשפחות האחרונות שנוספו', module: 'home' },
  { key: 'home.goldbook', label: 'ווידג\'ט: ספר הזהב', desc: 'פודיום התורמים המובילים', module: 'home' },
  { key: 'home.hebcal', label: 'ווידג\'ט: הלוח העברי', desc: 'הפריטים הקרובים בלוח העברי', module: 'home' },
  { key: 'home.community', label: 'ווידג\'ט: אמינות קהילתית', desc: 'גריד הדרגות וממוצע האמינות', module: 'home' },
  { key: 'home.contacts', label: 'ווידג\'ט: יעדי קשר', desc: 'רשימת יעדי הקשר עם תורמים', module: 'home' },
  { key: 'home.punchlow', label: 'ווידג\'ט: מלאי כרטיסיות', desc: 'כרטיסיות עם יתרה נמוכה', module: 'home' },
  { key: 'home.quick', label: 'ווידג\'ט: פעולות מהירות', desc: 'פאנל הפעולות המהירות במסך הבית', module: 'home' },

  // ——— דוחות (סעיף לכל סוג דוח — עצמאי לחלוטין) ———
  { key: 'reports.enroll', label: 'דוח רישום לחוגים', desc: 'סעיף סיכום הרישום, התפוסה וההכנסות', module: 'reports' },
  { key: 'reports.attendance', label: 'דוח נוכחות', desc: 'סעיף הנוכחות והחיסורים', module: 'reports' },
  { key: 'reports.donations', label: 'דוח תרומות', desc: 'סעיף סיכום התרומות לפי חודש וקטגוריה', module: 'reports' },
  { key: 'reports.families', label: 'דוח מבט-על משפחות', desc: 'סעיף ספירות סטטוס/עיר/קהילה', module: 'reports' },
  { key: 'reports.punch', label: 'דוח כרטיסיות ניקוב', desc: 'סעיף מצב הכרטיסיות ויתרות נמוכות', module: 'reports' },
  { key: 'reports.periodic', label: 'דוחות תקופתיים', desc: 'מתגי יומי/שבועי/חודשי והפקה מיידית', module: 'reports' },

  // ——— הגדרות ———
  { key: 'settings.rooms', label: 'ניהול חדרים', desc: 'הוספה ועריכה של חדרים בהגדרות', module: 'settings' },
  { key: 'settings.teachers', label: 'ניהול מורים', desc: 'הוספה ועריכה של מורים בהגדרות', module: 'settings' },
  { key: 'settings.import', label: 'ייבוא נתונים', desc: 'ייבוא נתונים מקובץ אל המערכת', module: 'settings' },
  { key: 'settings.import.families13', label: 'ייבוא משפחות 13 עמודות', desc: 'מסלול ייבוא המשפחות המלא מהקובץ החי — 13 עמודות, ניקויים אוטומטיים ותצוגה מקדימה (כבוי = מסלול 5 העמודות הישן)', module: 'settings' },
  { key: 'settings.audit', label: 'בדיקת תקינות נתונים', desc: 'סריקת כפילויות, ת"ז, טלפונים ולוגיקה — מסך ממצאים ותיקון אוטומטי', module: 'settings' },
  { key: 'settings.dedup', label: 'איחוד כפילויות משפחות', desc: 'זיהוי משפחות כפולות (טלפון/שם+עיר) ומיזוגן לרשומה אחת — בלי אובדן נתונים', module: 'settings' },
  { key: 'settings.export', label: 'ייצוא נתונים', desc: 'ייצוא גיבוי ונתונים לקובץ', module: 'settings' },
  { key: 'settings.reset', label: 'איפוס מערכת', desc: 'מחיקת כל הנתונים ואיפוס המערכת', module: 'settings' },

  // ——— ליבה ———
  { key: 'core.receipts', label: 'קבלות להורדה', desc: 'הפקת קבלות להורדה על תשלומים ותרומות', module: 'core' },
  { key: 'core.timer', label: 'טיימר כסף', desc: 'שעון-עצר/טיימר לחיוב לפי זמן — תעריף לשעה, תקרות זמן/סכום וגביית תשלום', module: 'core' },
  { key: 'core.taxreceipt', label: 'קבלת סעיף 46', desc: 'קבלות תרומה פורמליות מוכרות-מס (§46) — סכום במילים, ת"ז, מספר עמותה וחתימה', module: 'core' },
  { key: 'core.cashbox', label: 'קופה רושמת', desc: 'קבלת מזומן במטבעות/שטרות, חישוב עודף והפקת חשבונית', module: 'core' },
  { key: 'core.bodymap', label: 'מפת אזורי טיפול', desc: 'מעקב טיפולים לפי אזורי גוף — בוצע מול יעד לכל אזור, פר-לקוח', module: 'core' },
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
  { key: 'nav.timer', label: 'שם טיימר הכסף', fallback: 'טיימר כסף' },
  { key: 'nav.cashbox', label: 'שם הקופה הרושמת', fallback: 'קופה רושמת' },
  { key: 'nav.bodymap', label: 'שם מפת אזורי הטיפול', fallback: 'אזורי טיפול' },

  // ——— ישויות ———
  { key: 'entity.family', label: 'משפחה (יחיד)', fallback: 'משפחה' },
  // סמיכות — קידומת לפני שם פרטי: "משפחת כהן". בעסק אחר: "לקוח כהן"/"מטופל כהן".
  { key: 'entity.familyOf', label: 'משפחה (סמיכות: "משפחת דוד")', fallback: 'משפחת' },
  { key: 'entity.member', label: 'בן/בת משפחה', fallback: 'בן/בת משפחה' },
  { key: 'entity.members', label: 'בני משפחה (רבים)', fallback: 'בני משפחה' },
  { key: 'entity.course', label: 'חוג (יחיד)', fallback: 'חוג' },
  { key: 'entity.teacher', label: 'מורה', fallback: 'מורה' },
  { key: 'entity.room', label: 'חדר', fallback: 'חדר' },
  { key: 'entity.rooms', label: 'חדרים (רבים)', fallback: 'חדרים' },
  { key: 'entity.student', label: 'תלמיד/ה', fallback: 'תלמיד/ה' },
  { key: 'entity.students', label: 'תלמידים (רבים)', fallback: 'תלמידים' },
  { key: 'entity.supporter', label: 'תורם', fallback: 'תורם' },
  { key: 'entity.donation', label: 'תרומה', fallback: 'תרומה' },
  { key: 'entity.donations', label: 'תרומות (רבים)', fallback: 'תרומות' },
  { key: 'entity.enrollment', label: 'שיבוץ', fallback: 'שיבוץ' },
  { key: 'entity.enrollments', label: 'שיבוצים (רבים)', fallback: 'שיבוצים' },
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
