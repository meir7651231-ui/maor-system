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
  /** המודול-אב; 'core'/'home'/'settings'/'shell' אינם כפופים לטוגל מודול. */
  module:
    | 'families'
    | 'courses'
    | 'calendar'
    | 'diary'
    | 'supporters'
    | 'reports'
    | 'tzedaka'
    | 'shop'
    | 'shop7'
    | 'home'
    | 'settings'
    | 'core'
    | 'shell'
    | 'signup';
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
  { key: 'families.cred.trendCreditsOnly', label: 'מקדם מגמה על זיכויים בלבד', desc: 'דלוק: המקדם מוכפל רק על זיכויים (התנהגות המערכת); כבוי: מוכפל גם על עונשים (תאימות לקובץ החי)', module: 'families' },
  { key: 'families.shortcuts', label: 'קיצורי ייבוא ובדיקה במסך', desc: 'כפתורי "⬆ ייבוא" ו"✓ בדיקת נתונים" בראש מסך המשפחות — קפיצה לסקשן בהגדרות (כמו בקובץ החי)', module: 'families' },
  { key: 'families.showid', label: 'חשיפת ת"ז בכרטיס', desc: 'כפתור "הצג ת"ז" שחושף מספרי ת"ז של ההורים (PII) — כבוי מסתיר לגמרי', module: 'families' },
  { key: 'families.filter', label: 'סינון מורחב', desc: 'פאנל סינון נפתח במסך המשפחות (מצב משפחתי/שפה/ספח/ילדים/חוגים/אמינות)', module: 'families' },

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
  { key: 'courses.enroll.inlinecreate', label: 'תלמיד/ה חדש/ה מתוך השיבוץ', desc: 'יצירת משפחה חדשה והוספת בן משפחה ישירות ממודאל השיבוץ — בלי לצאת מהמסך', module: 'courses' },
  { key: 'courses.roomslive', label: 'רצועת חדרים LIVE', desc: 'צ׳יפ לכל חדר בראש מסך החוגים — 🟢 פנוי / 🔴 החוג שמתקיים עכשיו (לחיצה פותחת אותו)', module: 'courses' },
  { key: 'courses.gradeimg', label: 'טווח כיתות ותמונת חוג', desc: 'שדות מכיתה/עד-כיתה (גן–י"ב) שנכנסים לסינון השיבוץ החכם + תמונת חוג בטופס ובכרטיס', module: 'courses' },
  { key: 'courses.absence', label: 'רישום חיסורים', desc: 'רישום חיסור/No-Show לתלמיד (מכרטיס החוג והיומן) + מדד אמינות', module: 'courses' },
  { key: 'courses.absence.history', label: 'היסטוריית חיסורים', desc: 'כפתור 📜 לצפייה בהיסטוריית החיסורים של התלמיד/ה', module: 'courses' },
  { key: 'courses.makeup.justified', label: 'חיסור מוצדק (השלמה)', desc: 'תיבת "חיסור מוצדק" — זכאות להשלמה גם מתחת ל-48ש׳ (מחלה/אירוע)', module: 'courses' },
  { key: 'courses.reminder', label: 'תזכורת ללוח', desc: 'כפתור "🔔 תזכורת ללוח" — יצירת אירוע תזכורת לחוג בלוח השנה', module: 'courses' },
  { key: 'courses.enroll.freeze', label: 'הקפאת שיבוץ', desc: 'הקפאה/הפשרה זמנית של שיבוץ (הניקוב נחסם עד הפשרה)', module: 'courses' },
  { key: 'courses.enroll.end', label: 'סיום שיבוץ', desc: 'סימון שיבוץ כ"הסתיים" (נשמר בדוח ההיסטורי)', module: 'courses' },
  { key: 'courses.enroll.note', label: 'הערה על שיבוץ', desc: 'שדה הערה חופשית פר-תלמיד בניהול השיבוץ', module: 'courses' },
  { key: 'courses.notes', label: 'הערות פנימיות לחוג', desc: 'שדה הערות פנימיות בכרטיס החוג', module: 'courses' },
  { key: 'courses.colfilter', label: 'סינון עמודות ברשימה', desc: 'כפתור "⏷ סינון עמודות" ושורת שדות סינון ברשימת החוגים', module: 'courses' },
  { key: 'courses.viewtoggle', label: 'החלפת גריד/רשימה', desc: 'כפתור "▦ גריד / ☰ רשימה" במסך החוגים', module: 'courses' },

  // ——— לוח שנה ———
  { key: 'calendar.dayview', label: 'תצוגת יום', desc: 'מעבר לתצוגת יום מפורטת בלוח השנה', module: 'calendar' },
  { key: 'calendar.hebdefault', label: 'הלוח נפתח בעברי', desc: 'לוח השנה נפתח בגריד החודש העברי (כמו בקובץ החי) — כבוי: נפתח בלועזי', module: 'calendar' },
  { key: 'calendar.upcoming', label: 'פאנל "הקרובים"', desc: '30 הימים הבאים מתחת ללוח — אירועים ושכבות עבריות, צ׳יפ משפחה לחיץ; כבוי: רשימת 14 הימים הישנה', module: 'calendar' },
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
  { key: 'calendar.export', label: 'דו"ח מותאם מהלוח', desc: 'כפתור "📊 דו"ח מותאם" בכותרת הלוח — פתיחת ייצוא מותאם', module: 'calendar' },
  // ייצוא-ICS (הרחבת gcal) — שכבות-נגזרות פר-ארגון: סטודיו/עסק מדליק, חסד מכבה (צנעה)
  { key: 'calendar.ics.bdays', label: 'ימי-הולדת בייצוא ליומן', desc: 'ייצוא-ה-ICS כולל ימי-הולדת עבריים של חברים/תלמידים (כבו לצנעת-מוטבים)', module: 'calendar' },
  { key: 'calendar.ics.sessions', label: 'מפגשים בייצוא ליומן', desc: 'ייצוא-ה-ICS כולל את מפגשי-החוגים השבועיים (שם, שעה, חדר)', module: 'calendar' },
  { key: 'calendar.layers.urgent', label: 'סינון "דחוף בלבד"', desc: 'צ׳יפ סינון להצגת אירועים דחופים בלבד', module: 'calendar' },
  { key: 'calendar.hebtoggle', label: 'מתג גריד עברי/לועזי', desc: 'כפתור החלפה בין גריד עברי ללועזי (כבוי = נעול לברירת-המחדל)', module: 'calendar' },

  // ——— יומן חדרים ———
  { key: 'diary.booking', label: 'הזמנת משבצת', desc: 'הזמנת משבצת זמן בחדר ישירות מהיומן', module: 'diary' },
  { key: 'diary.utilization', label: 'ניצולת חדרים', desc: 'סטטיסטיקת ניצולת ותפוסה של החדרים', module: 'diary' },
  { key: 'diary.attendance', label: 'פאנל נוכחות ביומן', desc: 'טבלת נוכחות/חיסור למפגש ישירות ביומן החדרים', module: 'diary' },
  { key: 'diary.inactivewarn', label: 'אזהרת חדר לא-פעיל', desc: 'באנר "חוגים המשויכים לחדר לא פעיל/לא קיים" ביומן', module: 'diary' },

  // ——— תורמים ———
  { key: 'supporters.rfm', label: 'דירוג תורמים', desc: 'דירוג RFM — תדירות, עדכניות וסכום תרומות', module: 'supporters' },
  { key: 'supporters.sponsor', label: 'אמץ חתן/משפחה 🤝', desc: 'ייעוד תרומה לנהנה (אמץ חתן) — קבלת מס אמיתית (D-) עם ייעוד; סיכום אימוצים במבט-הנהלה', module: 'supporters' },
  { key: 'supporters.nextdate', label: 'יעדי קשר', desc: 'תזכורות ותאריכי יעד לקשר הבא עם תורם', module: 'supporters' },
  { key: 'supporters.ayin', label: 'מעקב טיפול רב-שלבי', desc: 'תהליך טיפול מרובה-שלבים לכל תומך/ת — שמות, מעקב, תזכורות ודוח יומי', module: 'supporters' },
  { key: 'supporters.multicur', label: 'מטבע כפול (₪/$)', desc: 'אפשרות לבחור מטבע דולר ברישום תרומה — כבוי: הכול בשקלים', module: 'supporters' },
  { key: 'supporters.doncal', label: 'לוח תרומות בכרטיס', desc: 'לוח-חודש חזותי של תרומות התורם/ת + יעד הקשר הבא, בכרטיס התורם', module: 'supporters' },
  { key: 'supporters.customreport', label: 'דו"ח מותאם (תומכים)', desc: 'כפתור ייצוא דו"ח מותאם במסך התומכים', module: 'supporters' },
  { key: 'supporters.annualreport', label: 'דוח שנתי לתורם 📄', desc: 'ריכוז תרומות שנת-המס לתורם/ת (ולכולם בקובץ אחד) — לרו"ח ולמס; אינו קבלה', module: 'supporters' },
  { key: 'supporters.hok', label: 'הוראות קבע 🔁', desc: 'הגדרת הו"ק על תורם/ת + תזכורת-חודשית "טרם נרשמה" + רישום-בקליק; החיוב עצמו אצל הסליקה/הבנק', module: 'supporters' },
  { key: 'supporters.ayin.dailyreport', label: 'דוח יומי — מעקב טיפול', desc: 'כפתור ייצוא הדוח היומי של מעקב הטיפול (תת-דגל של מעקב טיפול)', module: 'supporters' },
  { key: 'supporters.hist', label: 'תרומות מהקובץ ההיסטורי', desc: 'מיזוג התרומות שהגיעו מהקובץ ההיסטורי (גיבוי לגאסי) לרשימת "כל התרומות" בכרטיס', module: 'supporters' },
  { key: 'supporters.ayin.sheet', label: 'גיליון מעקב להורדה/ייבוא', desc: 'ייצוא גיליון מעקב הטיפול ל-CSV, מילוי מחוץ למערכת וייבוא חזרה (תת-דגל של מעקב טיפול)', module: 'supporters' },
  { key: 'supporters.import.preview', label: 'סיכום לפני ייבוא', desc: 'ייבוא תומכות דו-שלבי — בדיקת הקובץ והצגת חדשות/עדכונים לפני ההחלה; כבוי = החלה מיידית', module: 'supporters' },
  { key: 'supporters.thankyou', label: 'תזכורת "התקשר לתודה"', desc: 'כפתור "📞 תודה" — יצירת אירוע תזכורת קשר בלוח', module: 'supporters' },
  { key: 'supporters.click2call', label: 'חיוג ישיר מהרשימה', desc: 'קישור tel: להתקשרות ישירה מטבלת התומכים', module: 'supporters' },

  // ——— מסך הבית ———
  { key: 'home.digest', label: 'תקציר הבוקר', desc: 'תקציר יומי בראש מסך הבית', module: 'home' },
  { key: 'home.carousel', label: 'קרוסלה', desc: 'קרוסלת כרטיסים מתחלפת במסך הבית', module: 'home' },
  { key: 'home.care', label: 'דורש טיפול', desc: 'רשימת פריטים הדורשים טיפול במסך הבית', module: 'home' },
  { key: 'home.board', label: 'לוח נבנה אישית', desc: 'עריכת מסך הבית: הוספה, הסרה וסידור ווידג\'טים', module: 'home' },
  { key: 'home.impactwall', label: 'קיר ההשפעה ✨', desc: 'מסך ראווה לטלוויזיה ולערבי גיוס — מונים חיים וזוהרים', module: 'home' },
  { key: 'home.suggest', label: 'הצעות מקדימות 💡', desc: 'מנוע מקדים-הצורך: חג מתקרב, גיל בית-ספר, תינוק, כרטיסייה נגמרת — הצעות שהמשרד מאשר', module: 'home' },
  // ווידג'טים עדינים — כל אחד ניתן להסתרה בנפרד ממסך הבית (עצמאי לחלוטין)
  { key: 'home.bdays', label: 'ווידג\'ט: ימי הולדת היום', desc: 'הבאנר החם של החוגגים במסך הבית', module: 'home' },
  { key: 'home.stats', label: 'ווידג\'ט: כרטיסי נתונים', desc: 'גריד כרטיסי הסיכום במסך הבית', module: 'home' },
  { key: 'home.today', label: 'ווידג\'ט: לוח "היום"', desc: 'מפגשים, אירועים וימי הולדת של היום', module: 'home' },
  { key: 'home.recent', label: 'ווידג\'ט: משפחות אחרונות', desc: 'טבלת המשפחות האחרונות שנוספו', module: 'home' },
  { key: 'home.goldbook', label: 'ווידג\'ט: ספר הזהב', desc: 'פודיום התורמים המובילים', module: 'home' },
  { key: 'home.hebcal', label: 'ווידג\'ט: הלוח העברי', desc: 'הפריטים הקרובים בלוח העברי', module: 'home' },
  { key: 'home.community', label: 'ווידג\'ט: אמינות קהילתית', desc: 'גריד הדרגות וממוצע האמינות', module: 'home' },
  { key: 'home.coursemetrics', label: 'ווידג\'ט: תפוסת החוגים', desc: 'מד תפוסה ממוצעת, עמודה לכל חוג, הכנסה חודשית משוקללת ו"הכי מבוקשים"', module: 'home' },
  { key: 'home.credmetrics', label: 'ווידג\'ט: מדד אמינות מורחב', desc: 'מד-מחוג, היסטוגרמת 20 סלים, מגמת היום ו"דורשות חיזוק"', module: 'home' },
  { key: 'home.contacts', label: 'ווידג\'ט: יעדי קשר', desc: 'רשימת יעדי הקשר עם תורמים', module: 'home' },
  { key: 'home.punchlow', label: 'ווידג\'ט: מלאי כרטיסיות', desc: 'כרטיסיות עם יתרה נמוכה', module: 'home' },
  { key: 'home.quick', label: 'ווידג\'ט: פעולות מהירות', desc: 'פאנל הפעולות המהירות במסך הבית', module: 'home' },

  { key: 'home.crosscare', label: 'מונה טיפול מהעמודות', desc: 'צ\'יפי "🪙 קופות: N" / "🛍 חנות: M" בווידג\'ט הטיפול — מונה-עם-קפיצה בלבד, בלי פירוט', module: 'home' },
  // ——— דוחות (סעיף לכל סוג דוח — עצמאי לחלוטין) ———
  { key: 'reports.enroll', label: 'דוח רישום לחוגים', desc: 'סעיף סיכום הרישום, התפוסה וההכנסות', module: 'reports' },
  { key: 'reports.attendance', label: 'דוח נוכחות', desc: 'סעיף הנוכחות והחיסורים', module: 'reports' },
  { key: 'reports.donations', label: 'דוח תרומות', desc: 'סעיף סיכום התרומות לפי חודש וקטגוריה', module: 'reports' },
  { key: 'reports.families', label: 'דוח מבט-על משפחות', desc: 'סעיף ספירות סטטוס/עיר/קהילה', module: 'reports' },
  { key: 'reports.punch', label: 'דוח כרטיסיות ניקוב', desc: 'סעיף מצב הכרטיסיות ויתרות נמוכות', module: 'reports' },
  { key: 'reports.management', label: 'מבט הנהלה 📊', desc: 'סיכום תפעולי חוצה-מודולים: חלוקה, חנות, קופות ומשפחות — קריאה בלבד', module: 'reports' },
  { key: 'reports.periodic', label: 'דוחות תקופתיים', desc: 'מתגי יומי/שבועי/חודשי והפקה מיידית', module: 'reports' },
  { key: 'reports.custom.full', label: 'דו"ח מותאם מלא', desc: 'רשימות השדות המלאות מהקובץ החי (חוגים 14 · תומכות 17), טווח עברי חי, תצוגה מקדימה עם עריכת הערות ובחר-הכל/נקה', module: 'reports' },
  { key: 'reports.export.full', label: 'השלמות ייצוא CSV', desc: 'ייצוא אירועים ישיר (עברי+לועזי+עדיפות), עמודות כיתות/הכנסות בחוגים ופעולת "⬇ ייצוא CSV" בחיפוש המהיר', module: 'reports' },
  { key: 'reports.csv', label: 'ייצוא/הדפסה פר-סעיף', desc: 'כפתורי "⬇ CSV" ו"🖨 הדפסה" בכל סעיף דוח', module: 'reports' },
  { key: 'reports.management.recon', label: 'התחשבנות במבט-ההנהלה', desc: 'קבוצת "💰 התחשבנות" (יעד-תקציב/סבסוד/עלויות) במבט-ההנהלה', module: 'reports' },
  { key: 'reports.management.sponsor', label: 'אימוצים במבט-ההנהלה', desc: 'קבוצת "🤝 אימוצים" (אמץ חתן/משפחה) במבט-ההנהלה', module: 'reports' },
  { key: 'reports.donations.bycat', label: 'תרומות לפי קטגוריה', desc: 'תת-טבלת פילוח תרומות לפי קטגוריה בסיכום התרומות', module: 'reports' },
  { key: 'reports.families.geo', label: 'פילוח עיר/קהילה', desc: 'טבלאות פילוח משפחות לפי עיר ולפי קהילה במבט-העל', module: 'reports' },
  { key: 'reports.attendance.member', label: 'נוכחות לפי תלמיד/ה', desc: 'מצב "לפי תלמיד/ה" בדוח הנוכחות (כולל חיסור אחרון)', module: 'reports' },

  // ——— קופות צדקה ———
  { key: 'tzedaka.campaigns', label: 'מבצעי התרמה', desc: 'ניהול מבצעים עם יעד ושיוך ריקונים למבצע', module: 'tzedaka' },
  { key: 'tzedaka.score', label: 'ניקוד רכזים', desc: 'ניקוד גיימיפיקציה אוטומטי על ריקונים + לוח מובילים', module: 'tzedaka' },
  { key: 'tzedaka.showcase', label: 'מסך ראווה', desc: 'תצוגת ראווה של המבצע והרכזים המובילים למסך גדול', module: 'tzedaka' },
  { key: 'tzedaka.calendar', label: 'לוח ייעודי', desc: 'לוח שנה פנימי לסבבי ריקון, מבצעים ותזכורות (מבודד מהלוח הראשי)', module: 'tzedaka' },
  { key: 'tzedaka.inlinecreate', label: 'הוספת לא-רשומים', desc: 'יצירת משפחה חדשה או ילד/הורה חדש ישירות מתוך העמודה', module: 'tzedaka' },
  { key: 'tzedaka.familypanel', label: 'פאנל בכרטיס המשפחה', desc: 'קופות שהמשפחה מחזיקה ורכזים בני הבית — תצוגה בלבד בכרטיס המשפחה', module: 'tzedaka' },
  { key: 'tzedaka.export', label: 'תדפיס וייצוא', desc: 'תדפיס רכז לסבב שטח + ייצוא CSV של כל הריקונים', module: 'tzedaka' },
  { key: 'tzedaka.boxstatus', label: 'מעברי-סטטוס לקופה', desc: 'כפתורי "⤵ למשרד" / "⚠ אבדה" ישירות מכרטיס הרכז', module: 'tzedaka' },

  // ——— חנות מוצרי-שירות ———
  { key: 'shop.stores', label: 'חנויות שותפות', desc: 'ניהול חנויות שותפות וקופונים לרכישה מסובסדת', module: 'shop' },
  { key: 'shop.criteria', label: 'קריטריוני זכאות', desc: 'הנחות למחיר הסמלי לפי קריטריונים (יתום מאם/מאבא וכו׳)', module: 'shop' },
  { key: 'shop.calendar', label: 'לוח ייעודי', desc: 'לוח פנימי לפגישות, מסירות וחגים קרובים (מבודד מהלוח הראשי)', module: 'shop' },
  { key: 'shop.showcase', label: 'מסך ראווה', desc: 'תצוגת הקטלוג וסיכומי הנתינה למסך גדול', module: 'shop' },
  { key: 'shop.inlinecreate', label: 'הוספת לא-רשומים', desc: 'יצירת משפחה/בן-משפחה חדשים ישירות מתוך העמודה', module: 'shop' },
  { key: 'shop.familypanel', label: 'פאנל בכרטיס המשפחה', desc: 'חבילות השירות והמגיע-וטרם-נמסר של המשפחה — תצוגה בלבד בכרטיס המשפחה', module: 'shop' },
  { key: 'shop.export', label: 'ייצוא מימושים', desc: 'ייצוא CSV של כל המימושים — כולל מבוטלים מסומנים (שקיפות)', module: 'shop' },
  { key: 'shop.photo', label: 'תמונת מוצר', desc: 'העלאת תמונה למוצר בקטלוג (מכווצת) + תצוגה בכרטיס', module: 'shop' },
  { key: 'shop.stock', label: 'מלאי וקליטות', desc: 'מעקב מלאי פר-פריט, חידוש מהיר ויומן קליטות (מלאי נכנס)', module: 'shop' },
  { key: 'shop.expiry', label: 'תפוגת אצווה', desc: 'תאריך-תפוגה בקליטת מלאי → התרעת "פג-תוקף" בטיפול', module: 'shop' },
  { key: 'shop.waitlist', label: 'רשימות המתנה', desc: 'רישום ממתינים לפריט שאזל + הצעה אוטומטית בחידוש מלאי', module: 'shop' },
  { key: 'shop.bulkassign', label: 'שיוך המוני', desc: 'שיוך מוצר לכל המשפחות הזכאות בבת-אחת', module: 'shop' },
  { key: 'shop.bulkredeem', label: 'חלוקה המונית', desc: 'סימון "חולק לכולם" — מימוש מרוכז עם רשימת חלוקה', module: 'shop' },
  { key: 'shop.sreceipt', label: 'אישור תשלום סמלי', desc: 'הורדה חוזרת של אישור S- (לא קבלת מס) על מימוש', module: 'shop' },
  { key: 'shop.void', label: 'ביטול מימוש', desc: 'ביטול מימוש עם סימון סיבה (הרשומה נשמרת, מוחרגת מהחי)', module: 'shop' },
  { key: 'shop.meeting', label: 'קביעת פגישה ביומן', desc: 'קישור מימוש לתפיסת חדר ביומן החדרים הראשי (החור המבוקר בבידוד)', module: 'shop' },
  { key: 'shop.merge', label: 'מיזוג פריטים כפולים', desc: 'איחוד שני פריטי-קטלוג לאחד (בלתי-הפיך)', module: 'shop' },

  // ——— חלוקה (shop7) ———
  { key: 'shop7.familypanel', label: 'פאנל חלוקה בכרטיס המשפחה', desc: 'מסירות המשפחה וסטטוסן (איסוף/בדרך/נמסר) — תצוגה בלבד בכרטיס המשפחה', module: 'shop7' },
  { key: 'shop7.export', label: 'תדפיס וייצוא מסירות', desc: 'תדפיס מסירות פר-מתנדב (ליום) + ייצוא CSV של כל המסירות — כולל סטטוס (שקיפות)', module: 'shop7' },
  { key: 'shop7.capacity', label: 'קיבולת מתנדב', desc: 'שדה "קיבולת מסירות ליום" + התרעת עומס-יתר על מתנדב', module: 'shop7' },

  // ——— הגדרות ———
  { key: 'settings.rooms', label: 'ניהול חדרים', desc: 'הוספה ועריכה של חדרים בהגדרות', module: 'settings' },
  { key: 'settings.teachers', label: 'ניהול מורים', desc: 'הוספה ועריכה של מורים בהגדרות', module: 'settings' },
  { key: 'settings.import', label: 'ייבוא נתונים', desc: 'ייבוא נתונים מקובץ אל המערכת', module: 'settings' },
  { key: 'settings.import.families13', label: 'ייבוא משפחות 13 עמודות', desc: 'מסלול ייבוא המשפחות המלא מהקובץ החי — 13 עמודות, ניקויים אוטומטיים ותצוגה מקדימה (כבוי = מסלול 5 העמודות הישן)', module: 'settings' },
  { key: 'settings.audit', label: 'בדיקת תקינות נתונים', desc: 'סריקת כפילויות, ת"ז, טלפונים ולוגיקה — מסך ממצאים ותיקון אוטומטי', module: 'settings' },
  { key: 'settings.audittrail', label: 'לוג פעולות 🧾', desc: 'מי-שינה-מה-ומתי (תרומות, תשלומים, מחיקות, שחזור) — 500 האחרונות; צפייה למנהל בלבד', module: 'settings' },
  { key: 'settings.dedup', label: 'איחוד כפילויות משפחות', desc: 'זיהוי משפחות כפולות (טלפון/שם+עיר) ומיזוגן לרשומה אחת — בלי אובדן נתונים', module: 'settings' },
  { key: 'settings.audit.extra', label: 'ביקורת מורחבת', desc: 'בדיקות נוספות: יעד-קשר שעבר, תרומות בסכום אפס/שלילי + שליחת ממצא למרכז הטיפול וקפיצה לאיחוד כפילויות', module: 'settings' },
  { key: 'settings.dedup.fields', label: 'מיזוג שדה-שדה', desc: 'בחירת הערך הנכון לכל שדה (18 שדות) בין הרשומות הכפולות + מחיקת רשומה מהקבוצה', module: 'settings' },
  { key: 'settings.export', label: 'ייצוא נתונים', desc: 'ייצוא גיבוי ונתונים לקובץ', module: 'settings' },
  { key: 'settings.reset', label: 'איפוס מערכת', desc: 'מחיקת כל הנתונים ואיפוס המערכת', module: 'settings' },
  { key: 'settings.backup', label: 'גיבוי ושחזור', desc: 'סעיף "גיבוי ושחזור" בהגדרות — הורדת גיבוי מלא, שחזור מקובץ וצילומים יומיים', module: 'settings' },
  { key: 'settings.encryption', label: 'סעיף הצפנה', desc: 'סעיף "הצפנת נתונים" בהגדרות — הפעלה, סיסמה, מפתח-שחזור והחלפת-סיסמה', module: 'settings' },
  { key: 'settings.access', label: 'סעיף נגישות', desc: 'סעיף "נגישות" בהגדרות — גודל טקסט, ניגודיות, אנימציות וריווח', module: 'settings' },
  { key: 'settings.notif', label: 'ערוצי התראות', desc: 'סעיף "ערוצי התראות" בהגדרות — אימייל/פוש/SMS', module: 'settings' },
  { key: 'settings.theme', label: 'בורר ערכת נושא', desc: 'סעיף "ערכת נושא" בהגדרות — בחירת ערכה וצבע הדגשה (למנהל)', module: 'settings' },

  // ——— מעטפת (shell) — ניווט ופלטת הפקודות ———
  { key: 'shell.navhist', label: 'ניווט אחורה ↩', desc: 'מחסנית ניווט של 20 צעדים — כפתור "↩ חזרה" גלובלי + "נפתחו לאחרונה" בחיפוש', module: 'shell' },
  { key: 'shell.palette.actions', label: 'פעולות בחיפוש המהיר', desc: 'העתקת כל הטלפונים, + אירוע/תזכורת/חוג/תומכת, ניקוב-מהיום + קיבוץ תוצאות לפי סוג', module: 'shell' },
  { key: 'shell.guide', label: 'המדריך המהיר 📖', desc: 'מדריך מובנה — שורה לכל מסך + "המתכונים המהירים" מהקובץ החי, נפתח מהחיפוש המהיר', module: 'shell' },
  { key: 'shell.privacy', label: 'מצב צנעה 🕶️', desc: 'כפתור בכותרת שמסתיר מסכי מקבלי-צדקה (פאנלי קופות/חנות/חלוקה ומוני-הבית) מעיון מזדמן — כבוד למשפחות', module: 'shell' },
  { key: 'shell.demo', label: 'מצב הדגמה ▶', desc: 'סיור spotlight מודרך על המסכים האמיתיים לפי תסריט הקובץ החי — הבא/הקודם, Esc עוצר', module: 'shell' },
  { key: 'shell.a11yfab', label: 'כפתור נגישות צף ♿', desc: 'FAB נגיש מכל מסך — גודל אותיות 80%-160% בצעדי 10%, ניגודיות, הדגשה, עצירת אנימציות וריווח', module: 'shell' },
  { key: 'shell.roles', label: 'תפקיד מורה', desc: 'מורה מחוברת (roles.teachers בקונפיג) רואה רק את החוגים שלה; הוספה/עריכה/מחיקה והגדרות מוסתרות', module: 'shell' },
  { key: 'shell.lock', label: 'נעילת PIN', desc: 'סעיף "נעילת גישה" בהגדרות — קוד ראשי/מנהל, אזורים מוגנים ו"נעילה עכשיו" (מסך הפענוח נשאר פעיל אם כבר הוגדר קוד)', module: 'shell' },
  { key: 'shell.palette', label: 'פלטת פקודות וחיפוש-על', desc: 'פלטת ⌘K וצ׳יפ "חיפוש בכל המערכת" — כבוי מסתיר את החיפוש הגלובלי', module: 'shell' },
  { key: 'shell.armdel', label: 'מחיקה בשני קליקים', desc: 'מחיקות משפחה/בן משפחה/חוג/שיבוץ בדפוס חימוש-ופקיעה 3.5ש׳ כמו בקובץ החי; כבוי = דיאלוג אישור של הדפדפן', module: 'shell' },
  { key: 'signup.hero3d', label: 'כדור-מוח תלת-ממד בהרשמה', desc: 'ה-Hero של מסך ההרשמה (אורביט) מציג כדור-מוח Three.js חי; כבוי ⇒ רקע סטטי (טעינה מהירה / מכשיר חלש)', module: 'signup' },

  // ——— ליבה ———
  { key: 'core.receipts', label: 'קבלות להורדה', desc: 'הפקת קבלות להורדה על תשלומים ותרומות', module: 'core' },
  { key: 'core.timer', label: 'טיימר כסף', desc: 'שעון-עצר/טיימר לחיוב לפי זמן — תעריף לשעה, תקרות זמן/סכום וגביית תשלום', module: 'core' },
  { key: 'core.taxreceipt', label: 'קבלת סעיף 46', desc: 'קבלות תרומה פורמליות מוכרות-מס (§46) — סכום במילים, ת"ז, מספר עמותה וחתימה', module: 'core' },
  { key: 'core.receipt.verifycode', label: 'קוד-אימות על קבלה 🔍', desc: 'קוד דטרמיניסטי על כל קבלה + כלי-אימות בהגדרות — הוכחת-מקור מול רישומי המערכת', module: 'core' },
  { key: 'core.cashbox', label: 'קופה רושמת', desc: 'קבלת מזומן במטבעות/שטרות, חישוב עודף והפקת חשבונית', module: 'core' },
  { key: 'core.bodymap', label: 'מפת אזורי טיפול', desc: 'מעקב טיפולים לפי אזורי גוף — בוצע מול יעד לכל אזור, פר-לקוח', module: 'core' },
  { key: 'core.daygate', label: 'מסך פתיחת יום', desc: 'מסך פתיחת יום בכניסה הראשונה של היום', module: 'core' },
  { key: 'core.receipt.copymark', label: 'סימון מקור/העתק', desc: 'שורת "מקור" / "העתק נאמן למקור" בראש הקבלה (הוראות ניהול ספרים)', module: 'core' },
  { key: 'core.dayendbackup', label: 'גיבוי אוטומטי בסוף-יום', desc: 'הורדת קובץ גיבוי אוטומטית אחרי שעת-הסיום היומית', module: 'core' },
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
  { key: 'nav.tzedaka', label: 'שם עמודת קופות הצדקה', fallback: 'קופות צדקה' },
  { key: 'entity.tzCoordinator', label: 'רכז/ת קופות', fallback: 'רכז' },
  { key: 'entity.tzBox', label: 'קופת צדקה', fallback: 'קופה' },
  { key: 'entity.tzCampaign', label: 'מבצע התרמה', fallback: 'מבצע' },
  { key: 'nav.shop', label: 'שם עמודת החנות', fallback: 'חנות' },
  { key: 'nav.shop7', label: 'שם עמודת החלוקה', fallback: 'חלוקה' },
  { key: 'entity.volunteer', label: 'מתנדב', fallback: 'מתנדב' },
  { key: 'entity.shopProduct', label: 'מוצר שירות', fallback: 'מוצר' },
  { key: 'entity.shopStore', label: 'חנות שותפה', fallback: 'חנות' },
  { key: 'entity.shopCriterion', label: 'קריטריון זכאות', fallback: 'קריטריון' },
  { key: 'entity.shopAssignment', label: 'שיוך מוצר', fallback: 'שיוך' },
  { key: 'entity.shopItem', label: 'פריט קטלוג', fallback: 'פריט' },

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
