/**
 * 💝 מנוע התורמים — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/supporters · 115 חלקים · 75 מקומות · 18 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_SUPPORTERS: GenEngine = {
  "id": "supporters",
  "name": "מנוע התורמים",
  "emoji": "💝",
  "from": "src/components/supporters",
  "computes": "יודע מי תרם, כמה ומתי, מי צריך שיחה ומי בסכנה לעזוב.",
  "entities": [
    "supporters",
    "warehouse"
  ],
  "parts": [
    {
      "num": 1,
      "name": "הפרשן",
      "computes": "הפרשן: שאלה חופשית ⇒ תשובה מהמנועים, או null כשאין כוונה מזוהה (הממשק מציג אז את רשימת-הדוגמאות — לא מנחש).",
      "fn": "askMaor#askMaor",
      "takes": [
        "text",
        "times"
      ],
      "gives": null
    },
    {
      "num": 2,
      "name": "ימים בין תאריך-ISO ליום",
      "computes": "ימים בין תאריך-ISO ליום (חיובי = בעבר).",
      "fn": "cockpit#daysSince",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 3,
      "name": "בסיכון-נטישה",
      "computes": "בסיכון-נטישה: נתן בעבר, שקט מעל הסף, ואין לו יעד-קשר עתידי מתוזמן.",
      "fn": "cockpit#cockpitAtRisk",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 4,
      "name": "שיחות מומלצות = יעד-קשר שעבר",
      "computes": "שיחות מומלצות = יעד-קשר שעבר (עדיפות ראשונה) ‏∪ בסיכון-נטישה.",
      "fn": "cockpit#cockpitCalls",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 5,
      "name": "תודות ממתינות = תורמים שנכנסה להם תרומה ב-COCKPIT_THANK_DAYS הימים…",
      "computes": "תודות ממתינות = תורמים שנכנסה להם תרומה ב-COCKPIT_THANK_DAYS הימים האחרונים.",
      "fn": "cockpit#cockpitThanks",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 6,
      "name": "הוראות-קבע שטרם נרשמו החודש",
      "computes": "הוראות-קבע שטרם נרשמו החודש — עטיפת hokDue הקיים כתור-פעולה.",
      "fn": "cockpit#cockpitHokTasks",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 7,
      "name": "סכום שנגבה בפועל החודש",
      "computes": "סכום שנגבה בפועל החודש (ש״ח-שקול) — קבלות + hist בחודש-הנוכחי.",
      "fn": "cockpit#cockpitCollectedThisMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 8,
      "name": "ארבעת מדדי-הראש של הקוקפיט",
      "computes": "ארבעת מדדי-הראש של הקוקפיט.",
      "fn": "cockpit#cockpitKpis",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 9,
      "name": "התור המלא של היום",
      "computes": "התור המלא של היום — שלוש הקבוצות + רשימה-מאוחדת + מונה.",
      "fn": "cockpit#cockpitQueue",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 10,
      "name": "התקדמות-היום מול קבוצת-מזהים-שטופלה",
      "computes": "התקדמות-היום מול קבוצת-מזהים-שטופלה (טהור; ה-UI מחזיק את ה-Set).",
      "fn": "cockpit#cockpitProgress",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "שורות-CSV של תור-המשימות",
      "computes": "שורות-CSV של תור-המשימות (כותרת + שורה למשימה) — לתדפיס/ייצוא.",
      "fn": "cockpit#cockpitCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "רשימת-המשימות כטקסט",
      "computes": "רשימת-המשימות כטקסט (שורה למשימה) — להעתקה/שיתוף.",
      "fn": "cockpit#cockpitWorkListText",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "פעילות-חיה",
      "computes": "פעילות-חיה — N האירועים האחרונים מכל התורמים (תרומות/יעדים/מעקב), מהחדש לישן.",
      "fn": "cockpit#cockpitFeed",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 14,
      "name": "בונה את רשימת-הפקודות המלאה לפי ההקשר",
      "computes": "בונה את רשימת-הפקודות המלאה לפי ההקשר (דגלים) + כרטיס-לכל-תורם.",
      "fn": "commands#buildCommands",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "מסנן פקודות לפי שאילתה",
      "computes": "מסנן פקודות לפי שאילתה.",
      "fn": "commands#filterCommands",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "פריסת כל התורמים לכוכבים",
      "computes": "פריסת כל התורמים לכוכבים.",
      "fn": "constellation#donorConstellation",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 17,
      "name": "חלק בלי הסבר (hebSeasonOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "hebTiming#hebSeasonOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 18,
      "name": "המשימות-העונתיות של היום",
      "computes": "המשימות-העונתיות של היום: תורמים שנתנו בחודש-העברי-הנוכחי ב-2+ שנים עבריות שונות — וטרם נתנו בו השנה.",
      "fn": "hebTiming#hebTimingTasks",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 19,
      "name": "הזזת תאריך-ISO ב-N ימים",
      "computes": "הזזת תאריך-ISO ב-N ימים — חשבון-לוח **מקומי** (Date(y,m,d+N) בצהריים), פורמט ידני.",
      "fn": "intel#shiftIso",
      "takes": [
        "amount",
        "times"
      ],
      "gives": null
    },
    {
      "num": 20,
      "name": "הפרש-ימים בין תאריך-ISO ליום המוזרק",
      "computes": "הפרש-ימים בין תאריך-ISO ליום המוזרק (חיובי = בעבר).",
      "fn": "intel#dayDiff",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 21,
      "name": "מעבר יחיד על כל אירועי-הנתינה של תורם",
      "computes": "מעבר יחיד על כל אירועי-הנתינה של תורם.",
      "fn": "intel#donorScan",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 22,
      "name": "פירוק ה-RFM מתוך scan מוכן",
      "computes": "פירוק ה-RFM מתוך scan מוכן (בלי לסרוק שוב).",
      "fn": "intel#rfmFromScan",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 23,
      "name": "סיכון-נטישה 0–100",
      "computes": "סיכון-נטישה 0–100 (דטרמיניסטי).",
      "fn": "intel#churnFromScan",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 24,
      "name": "תחזית-המתנה-הבאה מתוך scan מוכן",
      "computes": "תחזית-המתנה-הבאה מתוך scan מוכן.",
      "fn": "intel#forecastFromScan",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 25,
      "name": "מגמת-נתינה",
      "computes": "מגמת-נתינה: מחצית-חדשה מול מחצית-ישנה של הסדרה-החודשית.",
      "fn": "intel#trendFromScan",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "כל המודיעין של תורם",
      "computes": "כל המודיעין של תורם — **מעבר יחיד** ואז נגזרות זולות.",
      "fn": "intel#donorIntel",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 27,
      "name": "כותרת + שורה-לתורם",
      "computes": "כותרת + שורה-לתורם (רק תורמים עם היסטוריית-נתינה).",
      "fn": "intelExport#intelCsvRows",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 28,
      "name": "תצוגת תאריך DD/MM/YYYY",
      "computes": "תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO).",
      "fn": "lib#fmtDate",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 29,
      "name": "חלק בלי הסבר (isoToday)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#isoToday",
      "takes": [],
      "gives": null
    },
    {
      "num": 30,
      "name": "קבוצת הייעודים שעל התורם",
      "computes": "קבוצת הייעודים שעל התורם (distinct, בלי ריקים) — איחוד (פר-תורם) + (פר-תרומה).",
      "fn": "lib#supporterPurposes",
      "takes": [],
      "gives": null
    },
    {
      "num": 31,
      "name": "האם התורם גלוי לעובד/ת עם רשימת-ייעודים מותרת",
      "computes": "האם התורם גלוי לעובד/ת עם רשימת-ייעודים מותרת.",
      "fn": "lib#supporterVisibleForDesignations",
      "takes": [],
      "gives": null
    },
    {
      "num": 32,
      "name": "רשימת-התורמים הגלויה לעובד/ת עם רשימת-ייעודים מותרת",
      "computes": "רשימת-התורמים הגלויה לעובד/ת עם רשימת-ייעודים מותרת — נקודת-חנק אחת לכל המשטחים הנגזרים/המצטברים (מבט-הנהלה, מסך-הבית, קיר-השפעה, דוחות, ייצוא).",
      "fn": "lib#visibleSupportersForDesignations",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 33,
      "name": "סינון אירועי-לוח לעובד/ת מוגבל/ת-ייעוד",
      "computes": "סינון אירועי-לוח לעובד/ת מוגבל/ת-ייעוד (בקשת-שטח 24.8): תזכורת המקושרת לתורם (spId) נראית לעובד/ת רק אם התורם גלוי לה (forWho בייעודיה); אירוע שאינו מקושר…",
      "fn": "lib#visibleEventsForDesignations",
      "takes": [],
      "gives": null
    },
    {
      "num": 34,
      "name": "כל ייעודי-התרומה הקיימים",
      "computes": "כל ייעודי-התרומה הקיימים (distinct, ממויין) — להצעה באשף ולבורר-הסינון.",
      "fn": "lib#allDonationPurposes",
      "takes": [],
      "gives": null
    },
    {
      "num": 35,
      "name": "סה\"כ ₪ כולל היסטוריה",
      "computes": "סה\"כ ₪ כולל היסטוריה.",
      "fn": "lib#supIls",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 36,
      "name": "סה\"כ $ כולל היסטוריה",
      "computes": "סה\"כ $ כולל היסטוריה.",
      "fn": "lib#supUsd",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 37,
      "name": "מספר תרומות כולל היסטוריה",
      "computes": "מספר תרומות כולל היסטוריה.",
      "fn": "lib#supCount",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 38,
      "name": "התרומה האחרונה",
      "computes": "התרומה האחרונה — המאוחר מבין הקבלות וההיסטוריה ('' כשאין).",
      "fn": "lib#supLast",
      "takes": [],
      "gives": null
    },
    {
      "num": 39,
      "name": "האם התרומה האחרונה",
      "computes": "האם התרומה האחרונה (קבלות+היסטוריה, supLast) נופלת בדלי.",
      "fn": "lib#supLastInBucket",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 40,
      "name": "האם **התרומה האחרונה** של התורם נפלה בתקופה",
      "computes": "האם **התרומה האחרונה** של התורם נפלה בתקופה — שנה (yyyy) ו/או חודש (1–12).",
      "fn": "lib#supLastInPeriod",
      "takes": [],
      "gives": null
    },
    {
      "num": 41,
      "name": "שווי כולל בש\"ח",
      "computes": "שווי כולל בש\"ח — דולר לפי השער העריך (ברירת-מחדל 3.7, כמו במקור); כולל היסטוריה.",
      "fn": "lib#supTotalIls",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 42,
      "name": "ציון משוקלל 0–1000 בסגנון RFM",
      "computes": "ציון משוקלל 0–1000 בסגנון RFM — ספי הניקוד verbatim מהמקור: R — טריות (ימים מאז התרומה האחרונה), F — תדירות (מספר תרומות), M — סכום מצטבר.",
      "fn": "lib#supScore",
      "takes": [],
      "gives": null
    },
    {
      "num": 43,
      "name": "דרגה לפי הציון",
      "computes": "דרגה לפי הציון — זהה לחלוקה ולצבעים במקור (800/600/400).",
      "fn": "lib#supTier",
      "takes": [],
      "gives": null
    },
    {
      "num": 44,
      "name": "היסטוגרמת ציון",
      "computes": "היסטוגרמת ציון — 10 סלים של 100 נקודות (legacy supBars:3018-3022).",
      "fn": "lib#supScoreBins",
      "takes": [],
      "gives": null
    },
    {
      "num": 45,
      "name": "ממוצע לתרומה",
      "computes": "ממוצע לתרומה — סה\"כ ₪-שקול (‎$×3.7‎) חלקי מספר התרומות (legacy supAvgDon:3024); אין תרומות ⇒ null.",
      "fn": "lib#supAvgDon",
      "takes": [],
      "gives": null
    },
    {
      "num": 46,
      "name": "מונה \"תרמו ב-12 החודשים\"",
      "computes": "מונה \"תרמו ב-12 החודשים\" — התרומה האחרונה (כולל היסטוריה) בתוך 365 יום.",
      "fn": "lib#sup12m",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 47,
      "name": "צ'יפ דרגה/סטטוס קטן בסגנון אחיד",
      "computes": "צ'יפ דרגה/סטטוס קטן בסגנון אחיד.",
      "fn": "lib#chipStyle",
      "takes": [],
      "gives": null
    },
    {
      "num": 48,
      "name": "עיצוב טלפון ישראלי",
      "computes": "עיצוב טלפון ישראלי — מאוחד עם formatIsraeliPhone כדי שאותו מספר יעוצב זהה בכל הטפסים (תומכים/משפחות/מורים).",
      "fn": "lib#fixPhone",
      "takes": [],
      "gives": null
    },
    {
      "num": 49,
      "name": "סיווג מספר-טלפון",
      "computes": "סיווג מספר-טלפון: ישראלי ('il') או חו\"ל ('intl').",
      "fn": "lib#phoneRegion",
      "takes": [],
      "gives": null
    },
    {
      "num": 50,
      "name": "כל הטלפונים של תורם",
      "computes": "כל הטלפונים של תורם — הראשי (phone) ואז phones[], עם סיווג-אזור.",
      "fn": "lib#allSupPhones",
      "takes": [],
      "gives": null
    },
    {
      "num": 51,
      "name": "האם לתורם יש מספר באזור המבוקש",
      "computes": "האם לתורם יש מספר באזור המבוקש (לסינון חול/ישראל בלוח התורמים).",
      "fn": "lib#supHasRegion",
      "takes": [],
      "gives": null
    },
    {
      "num": 52,
      "name": "ניקוי מערך-טלפונים לשמירה",
      "computes": "ניקוי מערך-טלפונים לשמירה: fixPhone לכל מספר, סינון ריקים, שמירת שדות.",
      "fn": "lib#cleanSupPhones",
      "takes": [],
      "gives": null
    },
    {
      "num": 53,
      "name": "תזכורות-סגולה מדורגות מתאריך-התחלה",
      "computes": "תזכורות-סגולה מדורגות מתאריך-התחלה — יום N מוסיף N ימים.",
      "fn": "lib#segulaReminders",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 54,
      "name": "כותרת-תזכורת לסגולה",
      "computes": "כותרת-תזכורת לסגולה (יום N מתוך היעד).",
      "fn": "lib#segulaTitle",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 55,
      "name": "מצב-הסגולה של תומך/ת",
      "computes": "מצב-הסגולה של תומך/ת — נגזרת טהורה מאירועי-הלוח שלו (type 'call', spId, הערה שמתחילה ב-SEGULA_NOTE_PREFIX).",
      "fn": "lib#segulaStatus",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 56,
      "name": "הסרת שורת-הסגולה מהערת-קשר-הבא",
      "computes": "הסרת שורת-הסגולה מהערת-קשר-הבא (ביטול/התחלה-מחדש) — שורות שמכילות \"סגולת N יום\" יורדות, השאר נשמר ביט-זהה.",
      "fn": "lib#stripSegulaNote",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 57,
      "name": "חלק בלי הסבר (recurDef)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#recurDef",
      "takes": [],
      "gives": null
    },
    {
      "num": 58,
      "name": "תאריכי-הסדרה מתאריך-התחלה",
      "computes": "תאריכי-הסדרה מתאריך-התחלה — דטרמיניסטי.",
      "fn": "lib#recurDates",
      "takes": [
        "amount",
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 59,
      "name": "מצב-סדרה חוזרת של תומך/ת",
      "computes": "מצב-סדרה חוזרת של תומך/ת — לסגולה מאציל ל-segulaStatus (ריצה-נוכחית = 40 יום אחורה); לשאר: כל אירועי-הסדרה (type call, spId, הערה מתחילה בתחילית-המצב), target…",
      "fn": "lib#recurStatus",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 60,
      "name": "כל הסדרות הפעילות של תומך/ת",
      "computes": "כל הסדרות הפעילות של תומך/ת (סגולה/יומי/שבועי/חודשי) — נגזרת טהורה מאירועי-הלוח.",
      "fn": "lib#activeRecurSeries",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 61,
      "name": "התזכורת המוקדמת-ביותר בכל הסדרות של תומך/ת שתאריכה ≤ היום…",
      "computes": "התזכורת המוקדמת-ביותר בכל הסדרות של תומך/ת שתאריכה ≤ היום ולא בוצעה — או null.",
      "fn": "lib#dueRecurReminder",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 62,
      "name": "הסרת שורת-הסדרה",
      "computes": "הסרת שורת-הסדרה (לפי תחילית-המצב) מהערת-קשר-הבא — טהור.",
      "fn": "lib#stripRecurNote",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 63,
      "name": "\"₪1,200 + $300\" או \"—\" כשאין כלום",
      "computes": "\"₪1,200 + $300\" או \"—\" כשאין כלום — כולל היסטוריה (הכרעת 9.8).",
      "fn": "lib#totalLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 64,
      "name": "איחוד התרומות לתצוגה",
      "computes": "איחוד התרומות לתצוגה — verbatim מהלגאסי (legacy-main-script.js:1486-1495, supDonEvents): donations עם 'קבלה <rid>' + hist עם 'מהקובץ ההיסטורי'; כשאין hist —…",
      "fn": "lib#supDonEvents",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 65,
      "name": "שורות הלוח האישי של תומכת",
      "computes": "שורות הלוח האישי של תומכת — legacy supCalMine (2940-2944).",
      "fn": "lib#personalCalEntries",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 66,
      "name": "שורות הלוח הכלל-ארגוני",
      "computes": "שורות הלוח הכלל-ארגוני — כל התומכות (legacy supCalAll, 2928-2937).",
      "fn": "lib#orgCalEntries",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 67,
      "name": "שורת סיכום החודש",
      "computes": "שורת סיכום החודש — 'N תרומות החודש · ₪X + $Y' (legacy supCalData monthLine).",
      "fn": "lib#donCalMonthLine",
      "takes": [],
      "gives": null
    },
    {
      "num": 68,
      "name": "נרמול שם להשוואה",
      "computes": "נרמול שם להשוואה — נרמול חיפוש עברי + הסרת רווחים.",
      "fn": "lib#normName",
      "takes": [],
      "gives": null
    },
    {
      "num": 69,
      "name": "המרת מספר-סריאל של Excel",
      "computes": "המרת מספר-סריאל של Excel (ימים מ-1899-12-30) ל-ISO 'YYYY-MM-DD'.",
      "fn": "lib#excelSerialToIso",
      "takes": [],
      "gives": null
    },
    {
      "num": 70,
      "name": "פענוח רשת-תאים",
      "computes": "פענוח רשת-תאים (‏string[][]) לשורות-ייבוא — משמש גם ל-CSV וגם ל-xlsx.",
      "fn": "lib#parseSupporterGrid",
      "takes": [],
      "gives": null
    },
    {
      "num": 71,
      "name": "פענוח טקסט CSV לשורות ייבוא",
      "computes": "פענוח טקסט CSV לשורות ייבוא (עוטף את [parseSupporterGrid] מעל [parseCsv]).",
      "fn": "lib#parseSupporterCsv",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 72,
      "name": "חיווט \"עבור מי\"",
      "computes": "חיווט \"עבור מי\" ⇒ שם-לטיפול (בקשת-בעלים 9.8): מוסיף לתיק-המעקב את השמות שהגיעו מהייבוא.",
      "fn": "lib#applyAyinNames",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 73,
      "name": "איחוד-היסטוריה אידמפוטנטי",
      "computes": "איחוד-היסטוריה אידמפוטנטי: לכל מפתח (תאריך|סכום|מטבע) הכמות הסופית = max(קיים, נכנס) — ייבוא-חוזר של אותו קובץ לא מכפיל, עסקאות-אמת כפולות באותו יום (אותו…",
      "fn": "lib#mergeHist",
      "takes": [],
      "gives": null
    },
    {
      "num": 74,
      "name": "תכנון ייבוא",
      "computes": "תכנון ייבוא — הצלבה לפי שם מנורמל: שם קיים ⇒ עדכון, שם חדש ⇒ הוספה.",
      "fn": "lib#planSupporterImport",
      "takes": [],
      "gives": null
    },
    {
      "num": 75,
      "name": "החלת שורת ייבוא על תומכת קיימת",
      "computes": "החלת שורת ייבוא על תומכת קיימת — ערך לא-ריק בשורה דורס, אחרת נשמר הקיים.",
      "fn": "lib#mergeSupporterRow",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 76,
      "name": "יצירת תומכת חדשה משורת ייבוא",
      "computes": "יצירת תומכת חדשה משורת ייבוא (מונים ותרומות מתחילים מאפס).",
      "fn": "lib#newSupporterFromRow",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 77,
      "name": "האם ההו\"ק **אפקטיבית-פעילה**",
      "computes": "האם ההו\"ק **אפקטיבית-פעילה**.",
      "fn": "lib#hokEffectivelyActive",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 78,
      "name": "האם חיוב-החודש של ההוראה כבר נרשם",
      "computes": "האם חיוב-החודש של ההוראה כבר נרשם (חודש אזרחי נוכחי).",
      "fn": "lib#hokRecordedThisMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 79,
      "name": "התומכים שהו\"ק-החודש שלהם טרם נרשמה",
      "computes": "התומכים שהו\"ק-החודש שלהם טרם נרשמה — ממוינים לפי יום-החיוב.",
      "fn": "lib#hokDue",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 80,
      "name": "סה\"כ הו\"ק חודשי פעיל בש\"ח-שקול",
      "computes": "סה\"כ הו\"ק חודשי פעיל בש\"ח-שקול (ההכנסה-הקבועה) — לפי שער-הדולר העריך.",
      "fn": "lib#hokMonthlyTotal",
      "takes": [
        "times"
      ],
      "gives": "amount"
    },
    {
      "num": 81,
      "name": "תווית אמצעי-ההו\"ק לתצוגה",
      "computes": "תווית אמצעי-ההו\"ק לתצוגה.",
      "fn": "lib#hokMethodLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 82,
      "name": "חלק בלי הסבר (paretoReport)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "pareto#paretoReport",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 83,
      "name": "האם החיוב פעיל",
      "computes": "האם החיוב פעיל (עדיין ממתין לחיוב)?",
      "fn": "planned#isOpenPlan",
      "takes": [],
      "gives": null
    },
    {
      "num": 84,
      "name": "רק החיובים הפתוחים של הישות",
      "computes": "רק החיובים הפתוחים של הישות.",
      "fn": "planned#openPlans",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 85,
      "name": "סכום פתוח בשקלים",
      "computes": "סכום פתוח בשקלים (חיובים בשקל, לא-חויבו-עדיין ולא-בוטלו).",
      "fn": "planned#pendingIls",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 86,
      "name": "סכום פתוח בדולרים",
      "computes": "סכום פתוח בדולרים.",
      "fn": "planned#pendingUsd",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 87,
      "name": "התאריך של החיוב-הפתוח הקרוב-ביותר",
      "computes": "התאריך של החיוב-הפתוח הקרוב-ביותר (ISO); '' = אין פתוחים.",
      "fn": "planned#plannedNextDate",
      "takes": [],
      "gives": null
    },
    {
      "num": 88,
      "name": "חיובים-פתוחים שכבר עבר תאריכם ומעולם לא חויבו",
      "computes": "חיובים-פתוחים שכבר עבר תאריכם ומעולם לא חויבו (איחור).",
      "fn": "planned#overduePlans",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 89,
      "name": "הבא-בזמן",
      "computes": "הבא-בזמן (הקרוב שעדיין לא-עבר).",
      "fn": "planned#nextUpcomingPlan",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 90,
      "name": "הזזת חודשים כלפי-מעלה על תאריך-ISO, עם קלמפ ליום-האחרון-בחודש-היעד",
      "computes": "הזזת חודשים כלפי-מעלה על תאריך-ISO, עם קלמפ ליום-האחרון-בחודש-היעד: ‏31.1 + 1 = 28/29.2 (לא 3.3).",
      "fn": "planned#addMonthsClamped",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 91,
      "name": "זריעת פריסת-תשלומים אחידה",
      "computes": "זריעת פריסת-תשלומים אחידה — N שורות PlannedCharge בפערים שווים.",
      "fn": "planned#planCharges",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 92,
      "name": "חלק בלי הסבר (portfolioIntel)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "portfolio#portfolioIntel",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 93,
      "name": "פרוקסי-מיגרציה",
      "computes": "פרוקסי-מיגרציה: לכל דרגה, כמה תורמים במגמת-עלייה/ירידה/יציבות (מ-trend).",
      "fn": "portfolio#tierTrendCounts",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 94,
      "name": "מונה תורמים-פעילים פר-חודש",
      "computes": "מונה תורמים-פעילים פר-חודש (נתנו באותו חודש) — עקומת-פעילות ל-N חודשים אחרונים.",
      "fn": "portfolio#activeByMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 95,
      "name": "חלק בלי הסבר (normPrayerName)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "prayer#normPrayerName",
      "takes": [],
      "gives": null
    },
    {
      "num": 96,
      "name": "הוספת שם",
      "computes": "הוספת שם — דדופ (שם מנורמל), הערה מנוקה, addedAt מוזרק (דטרמיניסטי).",
      "fn": "prayer#planAddPrayerName",
      "takes": [
        "text",
        "times"
      ],
      "gives": null
    },
    {
      "num": 97,
      "name": "חלק בלי הסבר (setPrayerNote)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "prayer#setPrayerNote",
      "takes": [
        "text"
      ],
      "gives": "sequence"
    },
    {
      "num": 98,
      "name": "חלק בלי הסבר (togglePrayerName)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "prayer#togglePrayerName",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 99,
      "name": "חלק בלי הסבר (removePrayerName)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "prayer#removePrayerName",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 100,
      "name": "מונה פעילים",
      "computes": "מונה פעילים (לא-הוזכרו) — לצ׳יפ בכותרת.",
      "fn": "prayer#prayerOpenCount",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 101,
      "name": "טקסט להעתקה/שיתוף",
      "computes": "טקסט להעתקה/שיתוף — שורה לשם: \"שם — הערה\" (הערה ריקה ⇒ רק שם); הוזכרו בסוף עם ✓.",
      "fn": "prayer#prayerListText",
      "takes": [],
      "gives": null
    },
    {
      "num": 102,
      "name": "חלון-הקשר לתורם",
      "computes": "חלון-הקשר לתורם.",
      "fn": "quietHours#contactWindow",
      "takes": [],
      "gives": null
    },
    {
      "num": 103,
      "name": "האם עכשיו שעת-מנוחה מקומית אצל הרכז עצמו",
      "computes": "האם עכשיו שעת-מנוחה מקומית אצל הרכז עצמו (לבאנר-הכללי).",
      "fn": "quietHours#localQuiet",
      "takes": [],
      "gives": null
    },
    {
      "num": 104,
      "name": "מפת דירוג פר-מזהה-תורם",
      "computes": "מפת דירוג פר-מזהה-תורם.",
      "fn": "ranks#donorRanks",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 105,
      "name": "קוהורטות-גיוס",
      "computes": "קוהורטות-גיוס.",
      "fn": "retention#acquisitionCohorts",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 106,
      "name": "אגרגציית-עונתיות על כל התיק",
      "computes": "אגרגציית-עונתיות על כל התיק — מעבר-יחיד.",
      "fn": "seasonality#seasonality",
      "takes": [],
      "gives": null
    },
    {
      "num": 107,
      "name": "קצב-הנתינה של תורם-יחיד",
      "computes": "קצב-הנתינה של תורם-יחיד — החודש-הדומיננטי והאם הוא עונתי.",
      "fn": "seasonality#donorRhythm",
      "takes": [],
      "gives": null
    },
    {
      "num": 108,
      "name": "האותות של תורם-יחיד",
      "computes": "האותות של תורם-יחיד (0 או יותר).",
      "fn": "signals#donorSignals",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 109,
      "name": "אגרגציית-אותות על כל התיק",
      "computes": "אגרגציית-אותות על כל התיק.",
      "fn": "signals#portfolioSignals",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 110,
      "name": "דרגת-התורם נכון-ל-asOfIso",
      "computes": "דרגת-התורם נכון-ל-asOfIso — סופר רק נתינות עד אותו יום, וטריות ביחס-אליו.",
      "fn": "tierMigration#tierAsOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 111,
      "name": "מטריצת-מעברי-דרגה אמיתית",
      "computes": "מטריצת-מעברי-דרגה אמיתית: דרגה לפני monthsBack חודשים מול היום.",
      "fn": "tierMigration#tierMigration",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 112,
      "name": "סיכון-נטישה של scan **בעוד offsetDays ימים**",
      "computes": "סיכון-נטישה של scan **בעוד offsetDays ימים** — אותה נוסחה כמו churnFromScan, אבל daysSince מוזז קדימה.",
      "fn": "timemachine#churnAtOffset",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 113,
      "name": "סימולציה קדימה על כל התיק",
      "computes": "סימולציה קדימה על כל התיק.",
      "fn": "timemachine#timeMachine",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 114,
      "name": "מרים את כוכבי-הגלקסיה למרחב תלת-ממדי",
      "computes": "מרים את כוכבי-הגלקסיה למרחב תלת-ממדי.",
      "fn": "universe3d#donorUniverse",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 115,
      "name": "הקרנת-פרספקטיבה של נקודה",
      "computes": "הקרנת-פרספקטיבה של נקודה (אחרי סיבוב) למסך.",
      "fn": "universe3d#project",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "supporters.supporters.first~last",
      "engine": "supporters",
      "name": "מהתרומה הראשונה עד האחרונה של כל תורם",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "supporters",
        "path": "first",
        "to": "last",
        "unit": "date",
        "kind": "span"
      }
    },
    {
      "id": "supporters.supporters.@seq",
      "engine": "supporters",
      "name": "התורמים, לפי מועד הקשר הבא",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "",
        "dateField": "nextDate",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.name",
      "engine": "supporters",
      "name": "השם של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.city",
      "engine": "supporters",
      "name": "העיר של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "city",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.cat",
      "engine": "supporters",
      "name": "הקטגוריה של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "cat",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.forWho",
      "engine": "supporters",
      "name": "הייעוד של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "forWho",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.notes",
      "engine": "supporters",
      "name": "ההערות של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.count",
      "engine": "supporters",
      "name": "מספר התרומות של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "count",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ils",
      "engine": "supporters",
      "name": "סך התרומות בשקלים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ils",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.usd",
      "engine": "supporters",
      "name": "סך התרומות בדולרים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "usd",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.first",
      "engine": "supporters",
      "name": "מועד התרומה הראשונה של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "first",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.last",
      "engine": "supporters",
      "name": "מועד התרומה האחרונה של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "last",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.nextDate",
      "engine": "supporters",
      "name": "מועד הקשר הבא של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "nextDate",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.nextNote",
      "engine": "supporters",
      "name": "על מה לדבר של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "nextNote",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.prayerNames[]@seq",
      "engine": "supporters",
      "name": "השמות לתפילה של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "prayerNames[]",
        "dateField": "addedAt",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.prayerNames[]?waiting",
      "engine": "supporters",
      "name": "השמות לתפילה שעוד לא סומנו כבוצעו של כל תורם",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "prayerNames[]",
        "done": "done",
        "since": "addedAt",
        "kind": "waiting"
      }
    },
    {
      "id": "supporters.supporters.prayerNames[].name",
      "engine": "supporters",
      "name": "השם בשמות לתפילה של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "prayerNames[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.prayerNames[].note",
      "engine": "supporters",
      "name": "ההערה בשמות לתפילה של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "prayerNames[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.prayerNames[].addedAt",
      "engine": "supporters",
      "name": "מועד ההוספה בשמות לתפילה של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "prayerNames[].addedAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.donations[]@seq",
      "engine": "supporters",
      "name": "התרומות של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.donations[].date",
      "engine": "supporters",
      "name": "מועדי התרומות של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.donations[].amount",
      "engine": "supporters",
      "name": "סכומי התרומות של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.donations[].cat",
      "engine": "supporters",
      "name": "הקטגוריה בתרומות של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[].cat",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.donations[].designation",
      "engine": "supporters",
      "name": "הייעוד בתרומות של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[].designation",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.donations[].purpose",
      "engine": "supporters",
      "name": "המטרה בתרומות של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "donations[].purpose",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.hist[]@seq",
      "engine": "supporters",
      "name": "התרומות מהקובץ הישן של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "hist[]",
        "dateField": "d",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.hist[].d",
      "engine": "supporters",
      "name": "מועדי התרומות מהקובץ הישן של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "hist[].d",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.hist[].a",
      "engine": "supporters",
      "name": "סכומי התרומות מהקובץ הישן של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "hist[].a",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.hok.amount",
      "engine": "supporters",
      "name": "הסכום בהוראת הקבע של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "hok.amount",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.hok.method",
      "engine": "supporters",
      "name": "אמצעי התשלום בהוראת הקבע של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "hok.method",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.hok.note",
      "engine": "supporters",
      "name": "ההערה בהוראת הקבע של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "hok.note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.hok.startedAt",
      "engine": "supporters",
      "name": "מועד תחילת ההוראה בהוראת הקבע של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "hok.startedAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[]@seq",
      "engine": "supporters",
      "name": "החיובים המתוכננים של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].date",
      "engine": "supporters",
      "name": "מועדי החיובים המתוכננים של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].amount",
      "engine": "supporters",
      "name": "סכומי החיובים המתוכננים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].method",
      "engine": "supporters",
      "name": "אמצעי התשלום בחיובים המתוכננים של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].method",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].cat",
      "engine": "supporters",
      "name": "הקטגוריה בחיובים המתוכננים של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].cat",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].cancelledAt",
      "engine": "supporters",
      "name": "מועד הביטול בחיובים המתוכננים של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].cancelledAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].note",
      "engine": "supporters",
      "name": "ההערה בחיובים המתוכננים של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.plannedCharges[].shopValue",
      "engine": "supporters",
      "name": "השווי בחיובים המתוכננים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "plannedCharges[].shopValue",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin?waiting",
      "engine": "supporters",
      "name": "התורמים שמחכים בתיק הטיפול (חדש, בתהליך, מחכה לתשובה)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin",
        "status": {
          "field": "stage",
          "open": [
            "new",
            "lead",
            "eyes",
            "answer"
          ]
        },
        "since": "nextTalk",
        "kind": "waiting"
      }
    },
    {
      "id": "supporters.supporters.ayin.note",
      "engine": "supporters",
      "name": "ההערה בתיק הטיפול של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.answeredNote",
      "engine": "supporters",
      "name": "הערת התשובה בתיק הטיפול של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.answeredNote",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.nextTalk",
      "engine": "supporters",
      "name": "מועד השיחה הבאה בתיק הטיפול של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.nextTalk",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.nextTalkTime",
      "engine": "supporters",
      "name": "שעת השיחה הבאה בתיק הטיפול של כל תורם",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.nextTalkTime",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.lastTouch",
      "engine": "supporters",
      "name": "מועד הקשר האחרון בתיק הטיפול של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.lastTouch",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[]?waiting",
      "engine": "supporters",
      "name": "השורות בטיפול שעוד לא סומנו כבוצעו של כל תורם",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[]",
        "done": "done",
        "kind": "waiting"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[].name",
      "engine": "supporters",
      "name": "השם בשורות בטיפול של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[].eyes",
      "engine": "supporters",
      "name": "המונה בשורות בטיפול של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[].eyes",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[].rate",
      "engine": "supporters",
      "name": "התעריף בשורות בטיפול של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[].rate",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[].note",
      "engine": "supporters",
      "name": "ההערה בשורות בטיפול של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.names[].days",
      "engine": "supporters",
      "name": "מספר הימים בשורות בטיפול של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.names[].days",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.answers[]@seq",
      "engine": "supporters",
      "name": "התשובות של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.answers[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.ayin.answers[].date",
      "engine": "supporters",
      "name": "מועדי התשובות של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.answers[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.answers[].note",
      "engine": "supporters",
      "name": "ההערה בתשובות של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.answers[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.log[]@seq",
      "engine": "supporters",
      "name": "רישומי היומן של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.log[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.ayin.log[].date",
      "engine": "supporters",
      "name": "מועדי רישומי היומן של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.log[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.log[].eyes",
      "engine": "supporters",
      "name": "המונה ברישומי היומן של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.log[].eyes",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.log[].name",
      "engine": "supporters",
      "name": "השם ברישומי היומן של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.log[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.time[]@seq",
      "engine": "supporters",
      "name": "שעות העבודה של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.time[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.ayin.time[].date",
      "engine": "supporters",
      "name": "מועדי שעות העבודה של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.time[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.supporters.ayin.time[].hours",
      "engine": "supporters",
      "name": "השעות בשעות העבודה של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.time[].hours",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.time[].note",
      "engine": "supporters",
      "name": "ההערה בשעות העבודה של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.time[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.time[].rate",
      "engine": "supporters",
      "name": "התעריף בשעות העבודה של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.time[].rate",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.mat[].name",
      "engine": "supporters",
      "name": "השם בחומרים של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.mat[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.ayin.mat[].qty",
      "engine": "supporters",
      "name": "הכמות בחומרים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.mat[].qty",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.mat[].cost",
      "engine": "supporters",
      "name": "העלות בחומרים של כל תורם",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.mat[].cost",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.supporters.ayin.kit[]?waiting",
      "engine": "supporters",
      "name": "פריטי המסירה שעוד לא סומנו כבוצעו של כל תורם",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.kit[]",
        "done": "done",
        "kind": "waiting"
      }
    },
    {
      "id": "supporters.supporters.ayin.kit[].label",
      "engine": "supporters",
      "name": "התווית בפריטי המסירה של כל תורם",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "supporters",
        "path": "ayin.kit[].label",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "supporters.supporters.calls[]@seq",
      "engine": "supporters",
      "name": "השיחות של כל תורם, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "supporters",
        "path": "calls[]",
        "dateField": "at",
        "kind": "sequence"
      }
    },
    {
      "id": "supporters.supporters.calls[].at",
      "engine": "supporters",
      "name": "מועדי השיחות של כל תורם",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "supporters",
        "path": "calls[].at",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "supporters.warehouse.name",
      "engine": "supporters",
      "name": "השם של כל פריט במחסן",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "warehouse",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "supporters.warehouse.unit",
      "engine": "supporters",
      "name": "היחידה של כל פריט במחסן",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "warehouse",
        "path": "unit",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "supporters.warehouse.qty",
      "engine": "supporters",
      "name": "הכמות של כל פריט במחסן",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "warehouse",
        "path": "qty",
        "kind": "amount"
      }
    },
    {
      "id": "supporters.warehouse.cost",
      "engine": "supporters",
      "name": "העלות של כל פריט במחסן",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "warehouse",
        "path": "cost",
        "kind": "amount"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "supporters.fn.cockpitFeed",
      "engine": "supporters",
      "name": "פעילות-חיה",
      "kind": "sequence",
      "fn": "cockpit#cockpitFeed",
      "takes": "readonly Supporter[]"
    },
    {
      "id": "supporters.fn.donorScan",
      "engine": "supporters",
      "name": "מעבר יחיד על כל אירועי-הנתינה של תורם",
      "kind": "span",
      "fn": "intel#donorScan",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.supIls",
      "engine": "supporters",
      "name": "סה\"כ ₪ כולל היסטוריה",
      "kind": "amount",
      "fn": "lib#supIls",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.supUsd",
      "engine": "supporters",
      "name": "סה\"כ $ כולל היסטוריה",
      "kind": "amount",
      "fn": "lib#supUsd",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.supCount",
      "engine": "supporters",
      "name": "מספר תרומות כולל היסטוריה",
      "kind": "amount",
      "fn": "lib#supCount",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.supTotalIls",
      "engine": "supporters",
      "name": "שווי כולל בש\"ח",
      "kind": "amount",
      "fn": "lib#supTotalIls",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.supDonEvents",
      "engine": "supporters",
      "name": "איחוד התרומות לתצוגה",
      "kind": "sequence",
      "fn": "lib#supDonEvents",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.personalCalEntries",
      "engine": "supporters",
      "name": "שורות הלוח האישי של תומכת",
      "kind": "sequence",
      "fn": "lib#personalCalEntries",
      "takes": "Supporter"
    },
    {
      "id": "supporters.fn.orgCalEntries",
      "engine": "supporters",
      "name": "שורות הלוח הכלל-ארגוני",
      "kind": "sequence",
      "fn": "lib#orgCalEntries",
      "takes": "Supporter[]"
    },
    {
      "id": "supporters.fn.hokMonthlyTotal",
      "engine": "supporters",
      "name": "סה\"כ הו\"ק חודשי פעיל בש\"ח-שקול",
      "kind": "amount",
      "fn": "lib#hokMonthlyTotal",
      "takes": "Supporter[]"
    },
    {
      "id": "supporters.fn.openPlans",
      "engine": "supporters",
      "name": "רק החיובים הפתוחים של הישות",
      "kind": "sequence",
      "fn": "planned#openPlans",
      "takes": "HasPlannedCharges"
    },
    {
      "id": "supporters.fn.pendingIls",
      "engine": "supporters",
      "name": "סכום פתוח בשקלים",
      "kind": "amount",
      "fn": "planned#pendingIls",
      "takes": "HasPlannedCharges"
    },
    {
      "id": "supporters.fn.pendingUsd",
      "engine": "supporters",
      "name": "סכום פתוח בדולרים",
      "kind": "amount",
      "fn": "planned#pendingUsd",
      "takes": "HasPlannedCharges"
    },
    {
      "id": "supporters.fn.overduePlans",
      "engine": "supporters",
      "name": "חיובים-פתוחים שכבר עבר תאריכם ומעולם לא חויבו",
      "kind": "sequence",
      "fn": "planned#overduePlans",
      "takes": "HasPlannedCharges"
    },
    {
      "id": "supporters.fn.planCharges",
      "engine": "supporters",
      "name": "זריעת פריסת-תשלומים אחידה",
      "kind": "sequence",
      "fn": "planned#planCharges",
      "takes": "PlanSpec"
    },
    {
      "id": "supporters.fn.setPrayerNote",
      "engine": "supporters",
      "name": "שם לתפילה על כרטיס-תורם",
      "kind": "sequence",
      "fn": "prayer#setPrayerNote",
      "takes": "readonly PrayerName[]"
    },
    {
      "id": "supporters.fn.togglePrayerName",
      "engine": "supporters",
      "name": "שם לתפילה על כרטיס-תורם",
      "kind": "sequence",
      "fn": "prayer#togglePrayerName",
      "takes": "readonly PrayerName[]"
    },
    {
      "id": "supporters.fn.removePrayerName",
      "engine": "supporters",
      "name": "שם לתפילה על כרטיס-תורם",
      "kind": "sequence",
      "fn": "prayer#removePrayerName",
      "takes": "readonly PrayerName[]"
    }
  ],
  "unclassified": {
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 6,
    "הפניה לרשומה אחרת — לא נתון": 8,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 9,
    "טיפוס מורכב — לא אחד מששת הסוגים": 2,
    "טקסט טכני (לא שם ולא תיאור)": 2,
    "כן/לא בודד": 6,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 9,
    "קובץ לא טהור (ממשק/אחסון/דפדפן) — לא נקרא": 1,
    "רשימה — נבדקת לפי הפריט שבה": 1
  }
};
