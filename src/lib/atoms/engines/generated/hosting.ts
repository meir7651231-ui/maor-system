/**
 * 🛏️ מנהל ההזמנות — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/hosting · 151 חלקים · 94 מקומות · 11 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_HOSTING: GenEngine = {
  "id": "hosting",
  "name": "מנהל ההזמנות",
  "emoji": "🛏️",
  "from": "src/components/hosting",
  "computes": "יודע מה פנוי, מי מגיע ומתי, כמה זה עולה וכמה שולם.",
  "entities": [
    "hostUnits",
    "hostBookings",
    "hostRecords"
  ],
  "parts": [
    {
      "num": 1,
      "name": "השלב הבא בשרשרת",
      "computes": "השלב הבא בשרשרת (חדש ⇒ בהכנה ⇒ בקרת איכות ⇒ מוכן ⇒ נמסר) — null בסוף/בבוטל.",
      "fn": "kitchen#mealNextStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "חלק בלי הסבר (toMin)",
      "computes": "\"HH:MM\" ⇒ דקות; לא-תקין ⇒ null.",
      "fn": "kitchen#toMin",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "דקות",
      "computes": "דקות ⇒ \"HH:MM\" (מעגלי ל-24 שעות — ).",
      "fn": "kitchen#minTo",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "זמן-ההכנה הארוך מבין המנות",
      "computes": "זמן-ההכנה הארוך מבין המנות (הכנה+בישול, דקות) — .",
      "fn": "kitchen#mealLeadMinutes",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "התחלת-הכנה מומלצת = שעת-הגשה − זמן-ההכנה",
      "computes": "התחלת-הכנה מומלצת = שעת-הגשה − זמן-ההכנה — null בלי שעה.",
      "fn": "kitchen#mealStartTime",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "\" להתחיל להכין עכשיו\"",
      "computes": "\" להתחיל להכין עכשיו\" — חדשה, ועבר זמן-ההתחלה (או שתאריכה עבר) — .",
      "fn": "kitchen#mealDueNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "\"להזמין חומרים עד\" = תאריך-הארוחה − ימי-ההזמנה",
      "computes": "\"להזמין חומרים עד\" = תאריך-הארוחה − ימי-ההזמנה.",
      "fn": "kitchen#orderByDate",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "חלון-ההזמנה נפתח",
      "computes": "חלון-ההזמנה נפתח (חדשה, היום ≥ \"עד\", והארוחה עוד לא עברה) — .",
      "fn": "kitchen#orderDue",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "רגע-ההגשה \"YYYY-MM-DDTHH:MM\" לטיימר",
      "computes": "רגע-ההגשה \"YYYY-MM-DDTHH:MM\" לטיימר ('' בלי תאריך/שעה).",
      "fn": "kitchen#mealServeAt",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "ספירה-לאחור",
      "computes": "ספירה-לאחור: \"1:05:09\" / \"12:04\"; אחרי הזמן ⇒ \"2 שע׳ 5 דק׳\" + over.",
      "fn": "kitchen#countdown",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "הסכום הכולל של הסועד",
      "computes": "מחשב את הסכום הכולל של הסועד.",
      "fn": "kitchen#dinerTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 12,
      "name": "שמות המשפחות הסועדות",
      "computes": "שמות המשפחות הסועדות.",
      "fn": "kitchen#dinerNames",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "הסועדים ממשפחת-ההזמנה",
      "computes": "הסועדים ממשפחת-ההזמנה (מבוגרים+ילדים של ההזמנה).",
      "fn": "kitchen#dinersFromBooking",
      "takes": [],
      "gives": null
    },
    {
      "num": 14,
      "name": "משתתפי-ההושבה מהמשפחות",
      "computes": "משתתפי-ההושבה מהמשפחות: \"{משפחה} · מבוגר 1 … · ילד 1 …\".",
      "fn": "kitchen#dinersToPeople",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "\"קמח · 1 ק״ג\"",
      "computes": "\"קמח · 1 ק״ג\" ⇒ {name:'קמח', qty:'1 ק״ג'}.",
      "fn": "kitchen#parseIng",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "הכפלת המספר הראשון בכמות",
      "computes": "הכפלת המספר הראשון בכמות (עיגול לעשירית) — \"2 כוסות\" ×1.5 ⇒ \"3 כוסות\".",
      "fn": "kitchen#scaleQty",
      "takes": [],
      "gives": null
    },
    {
      "num": 17,
      "name": "מקדם-ההכפלה של מנה",
      "computes": "מקדם-ההכפלה של מנה: מנות-מבוקשות ÷ מנות-בסיס.",
      "fn": "kitchen#mealFactor",
      "takes": [],
      "gives": null
    },
    {
      "num": 18,
      "name": "תפקידי איש-הצוות בארוחה",
      "computes": "תפקידי איש-הצוות בארוחה: מכין · מגיש · מוריד · שולחן · המנות שהוא מכין.",
      "fn": "kitchen#staffRoleIn",
      "takes": [],
      "gives": null
    },
    {
      "num": 19,
      "name": "הארוחות הפעילות שאיש-הצוות משובץ בהן",
      "computes": "הארוחות הפעילות שאיש-הצוות משובץ בהן.",
      "fn": "kitchen#staffActiveMeals",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 20,
      "name": "אמוג׳י אוטומטי לפריט",
      "computes": "אמוג׳י אוטומטי לפריט.",
      "fn": "kitchen#shopIcon",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 21,
      "name": "סך הסועדים בארוחות הפעילות",
      "computes": "סך הסועדים בארוחות הפעילות.",
      "fn": "kitchen#activeDinerTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 22,
      "name": "הרכיבים המצטברים מכל הארוחות הפעילות, מוכפלים לפי מנות",
      "computes": "הרכיבים המצטברים מכל הארוחות הפעילות, מוכפלים לפי מנות (שם ⇒ רשימת-כמויות).",
      "fn": "kitchen#aggregateIngredients",
      "takes": [],
      "gives": null
    },
    {
      "num": 23,
      "name": "חוויית-הקנייה",
      "computes": "חוויית-הקנייה: 3 מדפים + מצב-\"לקחתי\" + אחוז.",
      "fn": "kitchen#shoppingList",
      "takes": [],
      "gives": null
    },
    {
      "num": 24,
      "name": "\"⧉ העתק רשימה\"",
      "computes": "\"⧉ העתק רשימה\" — בדיוק הנוסח של המקור.",
      "fn": "kitchen#shoppingText",
      "takes": [],
      "gives": null
    },
    {
      "num": 25,
      "name": "החלת-מערך",
      "computes": "החלת-מערך ( לכל פריט): שם קיים ⇒ עדכון הכמות; חדש ⇒ הוספה.",
      "fn": "kitchen#tablesetPresetPlan",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "± חצי לאורח",
      "computes": "± חצי לאורח (מעוגל לעשירית, לא שלילי) — כפתורי −/＋ במקור.",
      "fn": "kitchen#stepPerGuest",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "חלק בלי הסבר (money)",
      "computes": "\"₪ 1,234\" — במקור (מעוגל, מפריד-אלפים עברי).",
      "fn": "lib#money",
      "takes": [],
      "gives": null
    },
    {
      "num": 28,
      "name": "חלק בלי הסבר (fmtDM)",
      "computes": "\"14/10\" — במקור; לא-תקין ⇒ '—'.",
      "fn": "lib#fmtDM",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 29,
      "name": "ראשי-תיבות לאווטאר",
      "computes": "ראשי-תיבות לאווטאר — / במקור.",
      "fn": "lib#initialsOf",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 30,
      "name": "ברכה לפי השעה",
      "computes": "ברכה לפי השעה — בדיוק כמו במקור.",
      "fn": "lib#greetingOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 31,
      "name": "קישור \"שתף בוואטסאפ\" בלי נמען",
      "computes": "קישור \"שתף בוואטסאפ\" בלי נמען (דוח/הושבה) — wa.me או סכמת-האפליקציה (מצב-סינון כשר).",
      "fn": "lib#waShareHref",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 32,
      "name": "קישור-חיוג",
      "computes": "קישור-חיוג — ספרות ו-+ בלבד (כמו בשאר אורביט; רווחים/מקפים/תווים זרים לא נכנסים ל-URI).",
      "fn": "lib#telHref",
      "takes": [],
      "gives": null
    },
    {
      "num": 33,
      "name": "ראשית-החודש / סופו של תאריך ISO",
      "computes": "ראשית-החודש / סופו של תאריך ISO.",
      "fn": "lib#monthBounds",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 34,
      "name": "השהייה הנוכחית ביחידה",
      "computes": "השהייה הנוכחית ביחידה — בצ׳ק-אין שהחל (כולל אורח שעבר את מועד-העזיבה ועוד לא עשה צ׳ק-אאוט).",
      "fn": "lib#currentStay",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 35,
      "name": "ההזמנה הבאה ליחידה",
      "computes": "ההזמנה הבאה ליחידה (הגעה אחרי היום, לא בוטלה).",
      "fn": "lib#nextStay",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 36,
      "name": "מצב-היחידה עכשיו",
      "computes": "מצב-היחידה עכשיו: חסומה > תפוסה > לניקיון > פנויה ( במקור).",
      "fn": "lib#unitLiveStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 37,
      "name": "הגעות לטיפול היום",
      "computes": "הגעות לטיפול היום — כולל **באיחור** (F8; במקור רק checkIn === היום — הגעה מאוחרת נעלמה מהלוח).",
      "fn": "lib#arrivalsOn",
      "takes": [],
      "gives": null
    },
    {
      "num": 38,
      "name": "עזיבות לטיפול היום",
      "computes": "עזיבות לטיפול היום — כולל **שעבר זמנן** (F8; במקור רק checkOut === היום).",
      "fn": "lib#departuresOn",
      "takes": [],
      "gives": null
    },
    {
      "num": 39,
      "name": "יתרות פתוחות",
      "computes": "יתרות פתוחות — כל הזמנה שלא בוטלה עם חוב, **כולל אחרי צ׳ק-אאוט** (F6: החוב לא נעלם מהלוח).",
      "fn": "lib#openBalances",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 40,
      "name": "תקבולי-החודש",
      "computes": "תקבולי-החודש (לפי חודש-ההגעה) — **תיקון F2:** חודש **ושנה** (במקור בלבד: ינואר-שעבר נספר).",
      "fn": "lib#monthPaidRevenue",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 41,
      "name": "חיובי-החודש",
      "computes": "חיובי-החודש (לפי חודש-ההגעה) — \"הכנסת החודש\" במרכז-ההזמנות (כמו במקור: תקופה-תאריכים מלא).",
      "fn": "lib#monthChargedRevenue",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 42,
      "name": "הכנסות N החודשים האחרונים",
      "computes": "הכנסות N החודשים האחרונים (תקבולים לפי חודש-הגעה) — עמודות \" הכנסות · 6 חודשים\".",
      "fn": "lib#revenueSeries",
      "takes": [],
      "gives": null
    },
    {
      "num": 43,
      "name": "חלק בלי הסבר (dashboardOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#dashboardOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 44,
      "name": "סינון+חיפוש+מיון",
      "computes": "סינון+חיפוש+מיון (ההגעה המאוחרת ראשונה) — במקור; החיפוש: שם-אורח · יחידה · טלפון.",
      "fn": "lib#bookingsView",
      "takes": [
        "text"
      ],
      "gives": "sequence"
    },
    {
      "num": 45,
      "name": "הספירה של ההזמנה",
      "computes": "מחשב את הספירה של ההזמנה.",
      "fn": "lib#bookingCounts",
      "takes": [],
      "gives": null
    },
    {
      "num": 46,
      "name": "5 ה-KPI של מרכז-ההזמנות",
      "computes": "5 ה-KPI של מרכז-ההזמנות: הגעות · עזיבות · בבית · הכנסת החודש (חיובים) · לגבייה.",
      "fn": "lib#bookingsKpis",
      "takes": [],
      "gives": null
    },
    {
      "num": 47,
      "name": "הכנסת-החודש של יחידה",
      "computes": "הכנסת-החודש של יחידה (חיובים, לפי חודש-הגעה) — כרטיס-היחידה.",
      "fn": "lib#unitMonthRevenue",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 48,
      "name": "שהיות · הוצאה · ביקור-אחרון",
      "computes": "שהיות · הוצאה · ביקור-אחרון (בלי ביטולים) — במקור.",
      "fn": "lib#guestStats",
      "takes": [],
      "gives": null
    },
    {
      "num": 49,
      "name": "רשימת-האורחים",
      "computes": "רשימת-האורחים: חיפוש (שם/טלפון/מייל) + מיון לפי הוצאה יורדת.",
      "fn": "lib#guestsView",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 50,
      "name": "חלק בלי הסבר (cleanTasksOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#cleanTasksOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 51,
      "name": "שבת או יום-טוב בתאריך",
      "computes": "שבת או יום-טוב בתאריך — (שבת + חגים-מלאים כולל דין-נדחה), **בלי** צום תשעה-באב (צום, לא יו״ט — צ׳ק-אין בו מותר).",
      "fn": "lib#sacredDayOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 52,
      "name": "ימי שבת/יו״ט שבהם האורח שוהה",
      "computes": "ימי שבת/יו״ט שבהם האורח שוהה (מיום-ההגעה עד יום-העזיבה, כולל).",
      "fn": "lib#staySacredDays",
      "takes": [],
      "gives": null
    },
    {
      "num": 53,
      "name": "אזהרת צ׳ק-אין/צ׳ק-אאוט בשבת/יו״ט",
      "computes": "אזהרת צ׳ק-אין/צ׳ק-אאוט בשבת/יו״ט (אזהרה — לא חסימה; שהייה שחוצה שבת היא הרגילה).",
      "fn": "lib#arrivalWarnings",
      "takes": [],
      "gives": null
    },
    {
      "num": 54,
      "name": "ימי-החודש",
      "computes": "ימי-החודש (לועזי או **עברי**) + ניווט — מתוך buildMonthGrid הקיים (אותו גריד של הקופות/החנות).",
      "fn": "lib#calendarMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 55,
      "name": "הפסים של היומן + נתיבים לחפיפות",
      "computes": "הפסים של היומן + נתיבים לחפיפות (הזמנות-חדרים באותה יחידה) — במקור: נתיב = הראשון שהסתיים עד ההגעה; פס מכסה את הלילות בתוך החלון (מההגעה עד יום-לפני-העזיבה).",
      "fn": "lib#calendarBars",
      "takes": [],
      "gives": null
    },
    {
      "num": 56,
      "name": "יחידה",
      "computes": "יחידה: status זר ⇒ free; מספרים לא-תקינים ⇒ 0; subRooms ⇒ מערך חדרים תקין.",
      "fn": "model#healHostUnit",
      "takes": [],
      "gives": null
    },
    {
      "num": 57,
      "name": "הזמנה",
      "computes": "הזמנה: status זר ⇒ pending (חוסם-זמינות — בטוח מול overbooking); תאריך לא-ISO ⇒ ''; חיובים/תשלומים ⇒ תקינים.",
      "fn": "model#healHostBooking",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 58,
      "name": "רשומה נלווית",
      "computes": "רשומה נלווית: kind חסר ⇒ נזרקת; kind לא-מוכר ⇒ נשמרת כמות-שהיא (תאימות-קדימה); מוכר ⇒ ריפוי-שדות.",
      "fn": "model#healHostRecord",
      "takes": [],
      "gives": null
    },
    {
      "num": 59,
      "name": "ריפוי-אוסף",
      "computes": "ריפוי-אוסף (migrate): איבר לא-תקין נזרק; מזהה חסר ⇒ ; אוסף תקין ⇒ **אותו מערך** (ביט-זהה).",
      "fn": "model#healHostCollection",
      "takes": [],
      "gives": null
    },
    {
      "num": 60,
      "name": "ריפוי-רשומה בודדת לאיחוד-החי",
      "computes": "ריפוי-רשומה בודדת לאיחוד-החי (cloud-merge) — המזהה = מזהה-המסמך.",
      "fn": "model#healHostDoc",
      "takes": [],
      "gives": null
    },
    {
      "num": 61,
      "name": "מחרוזות נחתכות לתקרה",
      "computes": "מחרוזות נחתכות לתקרה; מפתח-ידוע לא-תקין **נמחק** (= ברירת-מחדל); שעות HH:MM; מספרים בתקופה; עגלת-הקניות: got = רק true, אמוג׳י = מחרוזת קצרה; מפתח לא-מוכר נשמר.",
      "fn": "model#healHostingPrefs",
      "takes": [],
      "gives": null
    },
    {
      "num": 62,
      "name": "התקופה לפי ה-preset",
      "computes": "התקופה לפי ה-preset — מותאם: קצה ריק ⇒ 30 יום אחורה / היום; הפוך ⇒ מוחלף.",
      "fn": "reports#repRange",
      "takes": [],
      "gives": null
    },
    {
      "num": 63,
      "name": "מס׳ הימים בתקופה",
      "computes": "מס׳ הימים בתקופה (כולל) — .",
      "fn": "reports#daysInRange",
      "takes": [],
      "gives": null
    },
    {
      "num": 64,
      "name": "הלילות של שהייה שבתוך התקופה",
      "computes": "הלילות של שהייה שבתוך התקופה — .",
      "fn": "reports#rangeNights",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 65,
      "name": "בניית הדוח",
      "computes": "בניית הדוח.",
      "fn": "reports#buildReport",
      "takes": [],
      "gives": null
    },
    {
      "num": 66,
      "name": "טקסט-הדוח",
      "computes": "טקסט-הדוח (העתקה / וואטסאפ) — .",
      "fn": "reports#reportPlainText",
      "takes": [],
      "gives": null
    },
    {
      "num": 67,
      "name": "שורות-ה-CSV",
      "computes": "שורות-ה-CSV (כותרת + נתונים) — ליציאה דרך downloadCsv (BOM + הגנת-נוסחאות של אורביט).",
      "fn": "reports#reportCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 68,
      "name": "מסמך-HTML להדפסה/הורדה",
      "computes": "מסמך-HTML להדפסה/הורדה — במקור (escaping מלא; בלי סקריפט).",
      "fn": "reports#reportHtmlDoc",
      "takes": [],
      "gives": null
    },
    {
      "num": 69,
      "name": "הממתינים",
      "computes": "הממתינים (לא יושבים) — .",
      "fn": "seating#seatPool",
      "takes": [],
      "gives": null
    },
    {
      "num": 70,
      "name": "צבע לכל משפחה",
      "computes": "צבע לכל משפחה (לפי סדר-ההופעה) — .",
      "fn": "seating#seatFamColors",
      "takes": [],
      "gives": null
    },
    {
      "num": 71,
      "name": "צבע-המשתתף",
      "computes": "צבע-המשתתף: צבע-המשפחה, אחרת ילד=info / מבוגר=brand (טוקני-הסקין).",
      "fn": "seating#seatColorOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 72,
      "name": "המשפחות בתוכנית",
      "computes": "המשפחות בתוכנית (ידני = \"__solo\") — .",
      "fn": "seating#seatFamilies",
      "takes": [],
      "gives": null
    },
    {
      "num": 73,
      "name": "הושבת משפחה אחת יחד",
      "computes": "הושבת משפחה אחת יחד: לשולחן שמכיל את כולה (הצפוף-ביותר שמתאים), אחרת לפי מקום-פנוי.",
      "fn": "seating#seatOneFamily",
      "takes": [],
      "gives": null
    },
    {
      "num": 74,
      "name": "מילוי אוטומטי",
      "computes": "מילוי אוטומטי — סבב על השולחנות.",
      "fn": "seating#seatAutoFill",
      "takes": [],
      "gives": null
    },
    {
      "num": 75,
      "name": "לפי משפחות",
      "computes": "לפי משפחות — כל משפחה ממתינה בתורה.",
      "fn": "seating#seatByFamilies",
      "takes": [],
      "gives": null
    },
    {
      "num": 76,
      "name": "איזון",
      "computes": "איזון — כל ממתין לשולחן הריק-ביותר שאינו מלא.",
      "fn": "seating#seatBalance",
      "takes": [],
      "gives": null
    },
    {
      "num": 77,
      "name": "ערבוב",
      "computes": "ערבוב — ניקוי + ערבוב פישר-ייטס (אקראיות מוזרקת) + מילוי-בסבב.",
      "fn": "seating#seatShuffle",
      "takes": [],
      "gives": null
    },
    {
      "num": 78,
      "name": "נקה",
      "computes": "נקה — כל השולחנות ריקים, המשתתפים נשארים.",
      "fn": "seating#seatClear",
      "takes": [],
      "gives": null
    },
    {
      "num": 79,
      "name": "סנכרן מהסועדים",
      "computes": "סנכרן מהסועדים — משתתפים מהמשפחות, השולחנות מתרוקנים.",
      "fn": "seating#seatFromDiners",
      "takes": [],
      "gives": null
    },
    {
      "num": 80,
      "name": "חלק בלי הסבר (seatAddPerson)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatAddPerson",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 81,
      "name": "מלא N מקומות",
      "computes": "מלא N מקומות — \"אורח k\" עד מס׳ הסועדים.",
      "fn": "seating#seatFillTo",
      "takes": [],
      "gives": null
    },
    {
      "num": 82,
      "name": "חלק בלי הסבר (seatRemovePerson)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatRemovePerson",
      "takes": [],
      "gives": null
    },
    {
      "num": 83,
      "name": "חלק בלי הסבר (seatUnseat)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatUnseat",
      "takes": [],
      "gives": null
    },
    {
      "num": 84,
      "name": "הושבה ידנית בשולחן",
      "computes": "הושבה ידנית בשולחן (מוריד מכל שולחן אחר) — שולחן מלא ⇒ error.",
      "fn": "seating#seatPlace",
      "takes": [],
      "gives": null
    },
    {
      "num": 85,
      "name": "חלק בלי הסבר (seatAddTable)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatAddTable",
      "takes": [],
      "gives": null
    },
    {
      "num": 86,
      "name": "חלק בלי הסבר (seatDupTable)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatDupTable",
      "takes": [],
      "gives": null
    },
    {
      "num": 87,
      "name": "חלק בלי הסבר (seatDeleteTable)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatDeleteTable",
      "takes": [],
      "gives": null
    },
    {
      "num": 88,
      "name": "חלק בלי הסבר (seatToggleHead)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatToggleHead",
      "takes": [],
      "gives": null
    },
    {
      "num": 89,
      "name": "חלק בלי הסבר (seatRename)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatRename",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 90,
      "name": "מס׳ כיסאות",
      "computes": "מס׳ כיסאות (≥1); מי שמעבר לכיסאות החדשים — חוזר לממתינים.",
      "fn": "seating#seatSetCap",
      "takes": [],
      "gives": null
    },
    {
      "num": 91,
      "name": "חלק בלי הסבר (seatSetNote)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "seating#seatSetNote",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 92,
      "name": "מקומות · הושבו · ממתינים · ניצולת% · חוסר-מקומות",
      "computes": "מקומות · הושבו · ממתינים · ניצולת% · חוסר-מקומות.",
      "fn": "seating#seatStats",
      "takes": [],
      "gives": null
    },
    {
      "num": 93,
      "name": "\"⧉ העתק\" / \" וואטסאפ\"",
      "computes": "\"⧉ העתק\" / \" וואטסאפ\" — נוסח-המקור.",
      "fn": "seating#seatText",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 94,
      "name": "מיקומי-הכיסאות סביב השולחן",
      "computes": "מיקומי-הכיסאות סביב השולחן.",
      "fn": "seating#seatPositions",
      "takes": [
        "amount"
      ],
      "gives": null
    },
    {
      "num": 95,
      "name": "מידות-השולחן ומשטחו + מיקומי-הכיסאות",
      "computes": "מידות-השולחן ומשטחו + מיקומי-הכיסאות.",
      "fn": "seating#seatRing",
      "takes": [],
      "gives": null
    },
    {
      "num": 96,
      "name": "יום-השישי הראשון שהשהייה לנה בו",
      "computes": "יום-השישי הראשון שהשהייה לנה בו (checkIn ≤ שישי < checkOut) — '' כשהשהייה לא כוללת ליל-שבת.",
      "fn": "switchLinks#stayFriday",
      "takes": [],
      "gives": null
    },
    {
      "num": 97,
      "name": "מניינים לפי בית-כנסת",
      "computes": "מניינים לפי בית-כנסת (בסדר ההופעה הראשונה) ואז לפי יום; כל פריט \"תפילה שעה\".",
      "fn": "switchLinks#groupMinyanim",
      "takes": [],
      "gives": null
    },
    {
      "num": 98,
      "name": "\"שישי",
      "computes": "\"שישי: מנחה 17:53, קבלת שבת 17:58 · שבת: שחרית 08:30\".",
      "fn": "switchLinks#shulDaysText",
      "takes": [],
      "gives": null
    },
    {
      "num": 99,
      "name": "זמני השבת לכרטיס",
      "computes": "זמני השבת לכרטיס — תווית + שעה (השעה מוצגת בספרות, מופרדת מהעברית).",
      "fn": "switchLinks#shabbatTimeItems",
      "takes": [],
      "gives": null
    },
    {
      "num": 100,
      "name": "ההודעה למשפחה",
      "computes": "ההודעה למשפחה (\" שליחה למשפחה\"): ברכה · איפה מחכים להם · זמני השבת · המניינים בקהילה עם הכתובות · האופק · שבת שלום.",
      "fn": "switchLinks#shabbatFamilyText",
      "takes": [],
      "gives": null
    },
    {
      "num": 101,
      "name": "מה שואלים את המדריך מקריאת-תחזוקה",
      "computes": "מה שואלים את המדריך מקריאת-תחזוקה: התיאור + הקטגוריה (\"אחר\" — לא מוסיפה).",
      "fn": "switchLinks#faultNeed",
      "takes": [],
      "gives": null
    },
    {
      "num": 102,
      "name": "מה שואלים את המדריך ממשימת-ניקיון",
      "computes": "מה שואלים את המדריך ממשימת-ניקיון: סוג-המשימה, ותמיד \"ניקיון\" (גם \"החלפת מצעים\" — עבודת ניקיון).",
      "fn": "switchLinks#cleanNeed",
      "takes": [],
      "gives": null
    },
    {
      "num": 103,
      "name": "אזהרת-שבת/יו״ט לטופס-ההזמנה",
      "computes": "אזהרת-שבת/יו״ט לטופס-ההזמנה: שורה לכניסה ושורה לעזיבה שנופלות בשבת/יו״ט, עם התאריך העברי — \" הכניסה נופלת בשבת · ה׳ חשוון\" · \" העזיבה נופלת ביום טוב · סוכות ·…",
      "fn": "switchLinks#sacredGuardLines",
      "takes": [],
      "gives": null
    },
    {
      "num": 104,
      "name": "תקופה-השהייה בלוח העברי, לצד התאריכים הרגילים",
      "computes": "תקופה-השהייה בלוח העברי, לצד התאריכים הרגילים: אותו חודש ⇒ \"ה׳–ז׳ חשוון\"; חודשים שונים ⇒ \"כ״ט תשרי – ב׳ חשוון\"; שנים שונות ⇒ עם השנים (\"כ״ח אלול תשפ״ו – ב׳…",
      "fn": "switchLinks#hebRangeText",
      "takes": [],
      "gives": null
    },
    {
      "num": 105,
      "name": "הרשאה אחידה לממשק ול-store",
      "computes": "הרשאה אחידה לממשק ול-store: הדגל דלוק (כולל שרשור-המודול — opt-in) **וגם** סמכות-מנהל או הדלקה-פר-עובד.",
      "fn": "transitions#hostCan",
      "takes": [],
      "gives": null
    },
    {
      "num": 106,
      "name": "מונחי-המודול לממשק ול-store",
      "computes": "מונחי-המודול לממשק ול-store (מקור-אמת אחד): מונח-האשף גובר; אחרת — מתג \"משפחה מתארחת\" של המקור ( ⇒ \"משפחה מתארחת\", ובלשונית/KPI \"אורחים\" ⇒ \"משפחות\").",
      "fn": "transitions#hostTerms",
      "takes": [],
      "gives": null
    },
    {
      "num": 107,
      "name": "חלק בלי הסבר (isIso)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "transitions#isIso",
      "takes": [],
      "gives": null
    },
    {
      "num": 108,
      "name": "מספר הלילות [a, b)",
      "computes": "מספר הלילות [a, b) — לא-תקין ⇒ 0 (כמו במקור).",
      "fn": "transitions#nightsBetween",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 109,
      "name": "ISO + n ימים",
      "computes": "ISO + n ימים — לא-תקין ⇒ ''.",
      "fn": "transitions#addDaysIso",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 110,
      "name": "חפיפת שהיות",
      "computes": "חפיפת שהיות (לילות חצי-פתוחים) — כמו במקור.",
      "fn": "transitions#overlaps",
      "takes": [],
      "gives": null
    },
    {
      "num": 111,
      "name": "ההגדרות האפקטיביות",
      "computes": "ההגדרות האפקטיביות — חסר ⇒ ברירות-המחדל של האפליקציה המקורית.",
      "fn": "transitions#hostSettings",
      "takes": [],
      "gives": null
    },
    {
      "num": 112,
      "name": "הסכום הכולל של ההזמנה",
      "computes": "מחשב את הסכום הכולל של ההזמנה.",
      "fn": "transitions#bookingTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 113,
      "name": "התשלומים של ההזמנה",
      "computes": "מחשב את התשלומים של ההזמנה.",
      "fn": "transitions#bookingPaid",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 114,
      "name": "היתרה של ההזמנה",
      "computes": "מחשב את היתרה של ההזמנה.",
      "fn": "transitions#bookingBalance",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 115,
      "name": "משתתפי-ההזמנה",
      "computes": "משתתפי-ההזמנה (מבוגרים+ילדים) — במקור.",
      "fn": "transitions#bookingParty",
      "takes": [],
      "gives": null
    },
    {
      "num": 116,
      "name": "הזמנה \"פעילה\" = לא בוטלה",
      "computes": "הזמנה \"פעילה\" = לא בוטלה ( במקור — כולל הושלמה).",
      "fn": "transitions#isActive",
      "takes": [],
      "gives": null
    },
    {
      "num": 117,
      "name": "חלק בלי הסבר (unitHasRooms)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "transitions#unitHasRooms",
      "takes": [],
      "gives": null
    },
    {
      "num": 118,
      "name": "חלק בלי הסבר (roomNameOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "transitions#roomNameOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 119,
      "name": "\"חדר הורים + חדר ילדים\"",
      "computes": "\"חדר הורים + חדר ילדים\" — '' כשהוזמנה כל היחידה.",
      "fn": "transitions#roomsLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 120,
      "name": "מיטות של בחירת-החדרים",
      "computes": "מיטות של בחירת-החדרים (או קיבולת-היחידה כשלמה) — במקור.",
      "fn": "transitions#bookBeds",
      "takes": [],
      "gives": null
    },
    {
      "num": 121,
      "name": "מחיר-ללילה של בחירת-החדרים",
      "computes": "מחיר-ללילה של בחירת-החדרים (או מחיר-היחידה) — במקור.",
      "fn": "transitions#bookRate",
      "takes": [],
      "gives": null
    },
    {
      "num": 122,
      "name": "הזמנה חוסמת-זמינות",
      "computes": "הזמנה חוסמת-זמינות: לא בוטלה ולא הושלמה (כמו במקור).",
      "fn": "transitions#blocksAvailability",
      "takes": [],
      "gives": null
    },
    {
      "num": 123,
      "name": "החדרים התפוסים ביחידה בתקופה",
      "computes": "החדרים התפוסים ביחידה בתקופה (ALL_ROOMS = היחידה כולה) — במקור.",
      "fn": "transitions#occupiedRoomIds",
      "takes": [],
      "gives": null
    },
    {
      "num": 124,
      "name": "בדיקת-זמינות להזמנה",
      "computes": "בדיקת-זמינות להזמנה (חדשה או עריכה — exceptId).",
      "fn": "transitions#checkAvailability",
      "takes": [],
      "gives": null
    },
    {
      "num": 125,
      "name": "הצעת-המחיר של המקור",
      "computes": "הצעת-המחיר של המקור: לינה (מחיר×לילות) + דמי-ניקיון + מע״מ על השניים (מעוגל).",
      "fn": "transitions#priceQuote",
      "takes": [],
      "gives": null
    },
    {
      "num": 126,
      "name": "החיובים המחושבים",
      "computes": "החיובים המחושבים (מזהים קבועים — מוחלפים בכל שמירה).",
      "fn": "transitions#systemCharges",
      "takes": [],
      "gives": null
    },
    {
      "num": 127,
      "name": "תיקון F3",
      "computes": "תיקון F3: שמירת-הזמנה מחליפה **רק** את החיובים-המחושבים (לינה/ניקיון/מע״מ) ומשאירה כל חיוב אחר — ארוחות, חבילת-שבת, חיובים ידניים.",
      "fn": "transitions#withSystemCharges",
      "takes": [],
      "gives": null
    },
    {
      "num": 128,
      "name": "סכום הזמנת-מטבח",
      "computes": "סכום הזמנת-מטבח — Σ מחיר×כמות ( במקור).",
      "fn": "transitions#mealTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 129,
      "name": "חיוב-הארוחה בתיק",
      "computes": "חיוב-הארוחה בתיק: מסיר את החיוב הקודם של הארוחה ומוסיף חדש כשיש סכום.",
      "fn": "transitions#withMealCharge",
      "takes": [],
      "gives": null
    },
    {
      "num": 130,
      "name": "סנכרון ארוחות-ההזמנה לגודל-ההזמנה",
      "computes": "סנכרון ארוחות-ההזמנה לגודל-ההזמנה ( במקור): כל ארוחה פעילה המשויכת — מס׳ הסועדים = משתתפי-ההזמנה; כמות-מנה שלא שונתה ידנית (=הסועדים הקודמים, או ריקה)…",
      "fn": "transitions#syncMealsToParty",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 131,
      "name": "ארוחה פעילה = לא נמסרה ולא בוטלה",
      "computes": "ארוחה פעילה = לא נמסרה ולא בוטלה.",
      "fn": "transitions#isMealActive",
      "takes": [],
      "gives": null
    },
    {
      "num": 132,
      "name": "המנה בתפריט",
      "computes": "המנה בתפריט — לפי dishId, ואם אין (נתוני-מקור) — לפי השם (כמו במקור).",
      "fn": "transitions#dishOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 133,
      "name": "\" סנכרן הכל\"",
      "computes": "\" סנכרן הכל\": כל ארוחה פעילה המשויכת — סועדים ⇐ משתתפי-ההזמנה (וחיוב-המטבח מתחדש); כל מנה בלי טבח ⇐ טבח-ברירת-המחדל של המנה, ואם אין — המכין-האחראי של הארוחה.",
      "fn": "transitions#syncAllKitchen",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 134,
      "name": "מעברים מותרים",
      "computes": "מעברים מותרים: אישור ⇐ ממתינה · צ׳ק-אין ⇐ ממתינה/מאושרת (קיצור-הלוח של המקור) · צ׳ק-אאוט ⇐ בשהייה · ביטול ⇐ ממתינה/מאושרת/בשהייה (ההיסטוריה נשמרת).",
      "fn": "transitions#canSetBookingStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 135,
      "name": "תשלום מותר בכל הזמנה שלא בוטלה",
      "computes": "תשלום מותר בכל הזמנה שלא בוטלה — **תיקון F6** (במקור נחסם אחרי צ׳ק-אאוט אף שהחוב בדוח-הגבייה).",
      "fn": "transitions#canAddPayment",
      "takes": [],
      "gives": null
    },
    {
      "num": 136,
      "name": "הזמנת-המטבח של חבילת-השבת",
      "computes": "הזמנת-המטבח של חבילת-השבת — הסועדים **מההזמנה** (במקור מכרטיס-האורח, ולכן לא תאמה את ההזמנה).",
      "fn": "transitions#shabbatPackageMeal",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 137,
      "name": "חלק בלי הסבר (isCleanTask)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "transitions#isCleanTask",
      "takes": [],
      "gives": null
    },
    {
      "num": 138,
      "name": "תיקון F10",
      "computes": "תיקון F10: סיום משימה משחרר יחידה מלוכלכת רק כשאין לה משימה פתוחה נוספת (במקור כל סיום שחרר — גם כש\"ניקיון אחרי עזיבה\" עוד פתוחה, והיחידה הוצגה \"פנויה\" לפני…",
      "fn": "transitions#unitFreeAfter",
      "takes": [],
      "gives": null
    },
    {
      "num": 139,
      "name": "תיקון F11",
      "computes": "תיקון F11: \" נקייה\" ידני סוגר את משימות \"ניקיון אחרי עזיבה\" הפתוחות של היחידה (במקור נשארו פתוחות לנצח).",
      "fn": "transitions#checkoutTasksToClose",
      "takes": [],
      "gives": null
    },
    {
      "num": 140,
      "name": "תיקון F12",
      "computes": "תיקון F12: שחרור-חסימה מחזיר את היחידה ל\"לניקיון\" כשממתינה לה משימת \"ניקיון אחרי עזיבה\" (צ׳ק-אאוט שקרה בזמן שהיחידה הייתה חסומה) — אחרת לפנויה.",
      "fn": "transitions#releasedUnitStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 141,
      "name": "חלק בלי הסבר (faultBlocksUnit)",
      "computes": "P0 (סכנת חיים) / P1 (יחידה לא ראויה) חוסמות את היחידה ומתריעות (כמו במקור).",
      "fn": "transitions#faultBlocksUnit",
      "takes": [],
      "gives": null
    },
    {
      "num": 142,
      "name": "פתוחה",
      "computes": "פתוחה ⇒ בטיפול ⇒ טופלה (טופלה ⇒ סופית).",
      "fn": "transitions#nextFaultStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 143,
      "name": "תיקון F13",
      "computes": "תיקון F13: קריאה חוסמת **נוספת** פתוחה על אותה יחידה — אז סגירת הקריאה הנוכחית לא משחררת את היחידה (במקור סגירת קריאה אחת שחררה יחידה שעוד עמדה עליה קריאת P0…",
      "fn": "transitions#otherBlockingFault",
      "takes": [],
      "gives": null
    },
    {
      "num": 144,
      "name": "בטיחות-מזון",
      "computes": "בטיחות-מזון: מקרר עד 5° · מקפיא עד −15° · חימום מעל 63° (כמו במקור).",
      "fn": "transitions#tempOk",
      "takes": [
        "amount",
        "text"
      ],
      "gives": null
    },
    {
      "num": 145,
      "name": "תיקון F7",
      "computes": "תיקון F7: חריגת-טמפרטורה ⇒ קריאה **כללית** (בלי יחידה), בטיחות, P1, לא חוסמת יחידה.",
      "fn": "transitions#tempBreachFault",
      "takes": [
        "amount",
        "text",
        "times"
      ],
      "gives": null
    },
    {
      "num": 146,
      "name": "תיקון F5",
      "computes": "תיקון F5: מחיקת הזמנה — הארוחות המשויכות **נשמרות ומתנתקות** (במקור נשארו מצביעות להזמנה שאינה), ומשימת-העזיבה שלה מאבדת את הקישור.",
      "fn": "transitions#unlinkBookingRecords",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 147,
      "name": "מחיקת איש-צוות",
      "computes": "מחיקת איש-צוות (כמו במקור): כל השיבוצים שלו — מכין/מגיש/מפנה/מסדר, טבח-המנה, טבח-ברירת-המחדל של מנה — מתרוקנים.",
      "fn": "transitions#clearStaffRefs",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 148,
      "name": "מחיקת ציוד",
      "computes": "מחיקת ציוד (יכולת חדשה — במקור לא היה אפשר למחוק ציוד): קריאות ותוכניות-תחזוקה שהצביעו אליו — מתנתקות.",
      "fn": "transitions#clearAssetRefs",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 149,
      "name": "חלק בלי הסבר (isPlainKind)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "transitions#isPlainKind",
      "takes": [],
      "gives": null
    },
    {
      "num": 150,
      "name": "ניקוי-הטופס של המקור + הודעת-השגיאה שלו",
      "computes": "ניקוי-הטופס של המקור + הודעת-השגיאה שלו (שם חסר וכו׳).",
      "fn": "transitions#cleanPlainRecord",
      "takes": [],
      "gives": null
    },
    {
      "num": 151,
      "name": "מזהה-מקומי הבא ברשימה",
      "computes": "מזהה-מקומי הבא ברשימה: prefix + (הסיומת המספרית הגבוהה + 1) — דטרמיניסטי, בלי לצרוך את מונה-ה-DB.",
      "fn": "transitions#nextLocalId",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "hosting.hostUnits.name",
      "engine": "hosting",
      "name": "השם של כל יחידה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostUnits.type",
      "engine": "hosting",
      "name": "הסוג של כל יחידה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "type",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostUnits.beds",
      "engine": "hosting",
      "name": "מספר המיטות של כל יחידה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "beds",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostUnits.cap",
      "engine": "hosting",
      "name": "התפוסה המרבית של כל יחידה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "cap",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostUnits.rate",
      "engine": "hosting",
      "name": "התעריף של כל יחידה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "rate",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostUnits.subRooms[].name",
      "engine": "hosting",
      "name": "השם בחדרים של כל יחידה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "subRooms[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostUnits.subRooms[].beds",
      "engine": "hosting",
      "name": "מספר המיטות בחדרים של כל יחידה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "subRooms[].beds",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostUnits.subRooms[].rate",
      "engine": "hosting",
      "name": "התעריף בחדרים של כל יחידה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "subRooms[].rate",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostUnits.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל יחידה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostUnits",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.checkIn~checkOut",
      "engine": "hosting",
      "name": "מהכניסה עד היציאה של כל הזמנה",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "checkIn",
        "to": "checkOut",
        "unit": "date",
        "kind": "span"
      }
    },
    {
      "id": "hosting.hostBookings.@?waiting",
      "engine": "hosting",
      "name": "ההזמנות שמחכים (ממתין)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "pending"
          ]
        },
        "since": "createdAt",
        "kind": "waiting"
      }
    },
    {
      "id": "hosting.hostBookings.@seq",
      "engine": "hosting",
      "name": "ההזמנות, לפי מועד הכניסה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "",
        "dateField": "checkIn",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostBookings.guestId@seq",
      "engine": "hosting",
      "name": "ההזמנות של כל אורח, לפי מועד הכניסה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "",
        "dateField": "checkIn",
        "groupBy": "guestId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostBookings.unitId@seq",
      "engine": "hosting",
      "name": "ההזמנות של כל יחידה, לפי מועד הכניסה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "",
        "dateField": "checkIn",
        "groupBy": "unitId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostBookings.checkIn",
      "engine": "hosting",
      "name": "מועד הכניסה של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "checkIn",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.checkOut",
      "engine": "hosting",
      "name": "מועד היציאה של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "checkOut",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.adults",
      "engine": "hosting",
      "name": "המבוגרים של כל הזמנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "adults",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostBookings.kids",
      "engine": "hosting",
      "name": "הילדים של כל הזמנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "kids",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostBookings.charges[].label",
      "engine": "hosting",
      "name": "התווית בחיובים של כל הזמנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "charges[].label",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostBookings.charges[].amount",
      "engine": "hosting",
      "name": "סכומי החיובים של כל הזמנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "charges[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostBookings.payments[]@seq",
      "engine": "hosting",
      "name": "התשלומים של כל הזמנה, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "payments[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostBookings.payments[].amount",
      "engine": "hosting",
      "name": "סכומי התשלומים של כל הזמנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "payments[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostBookings.payments[].date",
      "engine": "hosting",
      "name": "מועדי התשלומים של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "payments[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.payments[].note",
      "engine": "hosting",
      "name": "ההערה בתשלומים של כל הזמנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "payments[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostBookings.notes",
      "engine": "hosting",
      "name": "ההערות של כל הזמנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostBookings.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.checkedInAt",
      "engine": "hosting",
      "name": "מועד הכניסה בפועל של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "checkedInAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.checkedOutAt",
      "engine": "hosting",
      "name": "מועד היציאה בפועל של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "checkedOutAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostBookings.cancelledAt",
      "engine": "hosting",
      "name": "מועד הביטול של כל הזמנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostBookings",
        "path": "cancelledAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:guest.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל אורח",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "guest"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:guest.name",
      "engine": "hosting",
      "name": "השם של כל אורח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "guest"
        },
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:guest.adults",
      "engine": "hosting",
      "name": "המבוגרים של כל אורח",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "guest"
        },
        "path": "adults",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:guest.kids",
      "engine": "hosting",
      "name": "הילדים של כל אורח",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "guest"
        },
        "path": "kids",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:guest.notes",
      "engine": "hosting",
      "name": "ההערות של כל אורח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "guest"
        },
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:clean.@?waiting",
      "engine": "hosting",
      "name": "משימות הניקיון שמחכים (פתוח)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "open"
          ]
        },
        "since": "createdAt",
        "kind": "waiting"
      }
    },
    {
      "id": "hosting.hostRecords:clean.unitId@seq",
      "engine": "hosting",
      "name": "משימות הניקיון של כל יחידה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "",
        "dateField": "date",
        "groupBy": "unitId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:clean.bookingId@seq",
      "engine": "hosting",
      "name": "משימות הניקיון של כל הזמנה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "",
        "dateField": "date",
        "groupBy": "bookingId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:clean.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל משימת ניקיון",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:clean.type",
      "engine": "hosting",
      "name": "הסוג של כל משימת ניקיון",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "type",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:clean.date",
      "engine": "hosting",
      "name": "התאריך של כל משימת ניקיון",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:clean.doneAt",
      "engine": "hosting",
      "name": "מועד הסיום של כל משימת ניקיון",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "clean"
        },
        "path": "doneAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:meal.@?waiting",
      "engine": "hosting",
      "name": "הארוחות שמחכים (חדש)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "new"
          ]
        },
        "since": "createdAt",
        "kind": "waiting"
      }
    },
    {
      "id": "hosting.hostRecords:meal.bookingId@seq",
      "engine": "hosting",
      "name": "הארוחות של כל הזמנה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "",
        "dateField": "date",
        "groupBy": "bookingId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:meal.unitId@seq",
      "engine": "hosting",
      "name": "הארוחות של כל יחידה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "",
        "dateField": "date",
        "groupBy": "unitId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:meal.guestId@seq",
      "engine": "hosting",
      "name": "הארוחות של כל אורח, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "",
        "dateField": "date",
        "groupBy": "guestId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:meal.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל ארוחה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:meal.mealName",
      "engine": "hosting",
      "name": "שם הארוחה של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "mealName",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.diners[].adults",
      "engine": "hosting",
      "name": "המבוגרים בסועדים של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "diners[].adults",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.diners[].kids",
      "engine": "hosting",
      "name": "הילדים בסועדים של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "diners[].kids",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.dinerCount",
      "engine": "hosting",
      "name": "מספר הסועדים של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "dinerCount",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.date",
      "engine": "hosting",
      "name": "התאריך של כל ארוחה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:meal.items[].name",
      "engine": "hosting",
      "name": "השם בפריטים של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "items[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.items[].price",
      "engine": "hosting",
      "name": "המחיר בפריטים של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "items[].price",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.items[].qty",
      "engine": "hosting",
      "name": "הכמות בפריטים של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "items[].qty",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.items[].alg",
      "engine": "hosting",
      "name": "האלרגנים בפריטים של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "items[].alg",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.allergens",
      "engine": "hosting",
      "name": "האלרגנים של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "allergens",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.notes",
      "engine": "hosting",
      "name": "ההערות של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.seatPlan.people[].name",
      "engine": "hosting",
      "name": "השם באנשים של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "seatPlan.people[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.seatPlan.tables[].name",
      "engine": "hosting",
      "name": "השם בשולחנות של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "seatPlan.tables[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.seatPlan.tables[].cap",
      "engine": "hosting",
      "name": "התפוסה המרבית בשולחנות של כל ארוחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "seatPlan.tables[].cap",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:meal.seatPlan.tables[].chair",
      "engine": "hosting",
      "name": "הכיסא בשולחנות של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "seatPlan.tables[].chair",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:meal.seatPlan.tables[].note",
      "engine": "hosting",
      "name": "ההערה בשולחנות של כל ארוחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "meal"
        },
        "path": "seatPlan.tables[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל מנה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:dish.name",
      "engine": "hosting",
      "name": "השם של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.type",
      "engine": "hosting",
      "name": "הסוג של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "type",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.price",
      "engine": "hosting",
      "name": "המחיר של כל מנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "price",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:dish.allergens",
      "engine": "hosting",
      "name": "האלרגנים של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "allergens",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.baseServings",
      "engine": "hosting",
      "name": "מספר המנות של כל מנה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "baseServings",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:dish.ingredients[]",
      "engine": "hosting",
      "name": "המרכיבים של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "ingredients[]",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.steps[]",
      "engine": "hosting",
      "name": "השלבים של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "steps[]",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:dish.notes",
      "engine": "hosting",
      "name": "ההערות של כל מנה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "dish"
        },
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:staff.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל איש צוות",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "staff"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:staff.name",
      "engine": "hosting",
      "name": "השם של כל איש צוות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "staff"
        },
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:staff.role",
      "engine": "hosting",
      "name": "התפקיד של כל איש צוות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "staff"
        },
        "path": "role",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:supply.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל מצרך",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "supply"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:supply.name",
      "engine": "hosting",
      "name": "השם של כל מצרך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "supply"
        },
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:supply.cat",
      "engine": "hosting",
      "name": "הקטגוריה של כל מצרך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "supply"
        },
        "path": "cat",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:tableItem.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל פריט שולחן",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "tableItem"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:tableItem.name",
      "engine": "hosting",
      "name": "השם של כל פריט שולחן",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "tableItem"
        },
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:tableItem.perGuest",
      "engine": "hosting",
      "name": "הכמות לאורח של כל פריט שולחן",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "tableItem"
        },
        "path": "perGuest",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:temp.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל מדידת חום",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "temp"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:temp.device",
      "engine": "hosting",
      "name": "המכשיר של כל מדידת חום",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "temp"
        },
        "path": "device",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:temp.temp",
      "engine": "hosting",
      "name": "החום של כל מדידת חום",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "temp"
        },
        "path": "temp",
        "kind": "amount"
      }
    },
    {
      "id": "hosting.hostRecords:temp.at",
      "engine": "hosting",
      "name": "הרגע של כל מדידת חום",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "temp"
        },
        "path": "at",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:fault.@?waiting",
      "engine": "hosting",
      "name": "התקלות שמחכים (פתוח, בטיפול)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "fault"
        },
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "open",
            "inprogress"
          ]
        },
        "since": "createdAt",
        "kind": "waiting"
      }
    },
    {
      "id": "hosting.hostRecords:fault.unitId@seq",
      "engine": "hosting",
      "name": "התקלות של כל יחידה, לפי מועד היצירה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "fault"
        },
        "path": "",
        "dateField": "createdAt",
        "groupBy": "unitId",
        "kind": "sequence"
      }
    },
    {
      "id": "hosting.hostRecords:fault.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל תקלה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "fault"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:fault.category",
      "engine": "hosting",
      "name": "הקטגוריה של כל תקלה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "fault"
        },
        "path": "category",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:fault.desc",
      "engine": "hosting",
      "name": "התיאור של כל תקלה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "fault"
        },
        "path": "desc",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:asset.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל ציוד",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "asset"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:asset.name",
      "engine": "hosting",
      "name": "השם של כל ציוד",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "asset"
        },
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:asset.category",
      "engine": "hosting",
      "name": "הקטגוריה של כל ציוד",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "asset"
        },
        "path": "category",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "hosting.hostRecords:asset.next",
      "engine": "hosting",
      "name": "מועד טיפול הבא של כל ציוד",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "asset"
        },
        "path": "next",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "hosting.hostRecords:plan.createdAt",
      "engine": "hosting",
      "name": "מועד היצירה של כל תוכנית",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "hostRecords",
        "where": {
          "kind": "plan"
        },
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "hosting.fn.dinerTotal",
      "engine": "hosting",
      "name": "הסכום הכולל של הסועד",
      "kind": "amount",
      "fn": "kitchen#dinerTotal",
      "takes": "readonly HostDiner[]"
    },
    {
      "id": "hosting.fn.activeDinerTotal",
      "engine": "hosting",
      "name": "סך הסועדים בארוחות הפעילות",
      "kind": "amount",
      "fn": "kitchen#activeDinerTotal",
      "takes": "readonly HostMeal[]"
    },
    {
      "id": "hosting.fn.currentStay",
      "engine": "hosting",
      "name": "השהייה הנוכחית ביחידה",
      "kind": "span",
      "fn": "lib#currentStay",
      "takes": "Pick<HostUnit, 'id'>"
    },
    {
      "id": "hosting.fn.nextStay",
      "engine": "hosting",
      "name": "ההזמנה הבאה ליחידה",
      "kind": "span",
      "fn": "lib#nextStay",
      "takes": "Pick<HostUnit, 'id'>"
    },
    {
      "id": "hosting.fn.monthPaidRevenue",
      "engine": "hosting",
      "name": "תקבולי-החודש",
      "kind": "amount",
      "fn": "lib#monthPaidRevenue",
      "takes": "readonly HostBooking[]"
    },
    {
      "id": "hosting.fn.monthChargedRevenue",
      "engine": "hosting",
      "name": "חיובי-החודש",
      "kind": "amount",
      "fn": "lib#monthChargedRevenue",
      "takes": "readonly HostBooking[]"
    },
    {
      "id": "hosting.fn.unitMonthRevenue",
      "engine": "hosting",
      "name": "הכנסת-החודש של יחידה",
      "kind": "amount",
      "fn": "lib#unitMonthRevenue",
      "takes": "Pick<HostUnit, 'id'>"
    },
    {
      "id": "hosting.fn.bookingTotal",
      "engine": "hosting",
      "name": "הסכום הכולל של ההזמנה",
      "kind": "amount",
      "fn": "transitions#bookingTotal",
      "takes": "Pick<HostBooking, 'charges'>"
    },
    {
      "id": "hosting.fn.bookingPaid",
      "engine": "hosting",
      "name": "התשלומים של ההזמנה",
      "kind": "amount",
      "fn": "transitions#bookingPaid",
      "takes": "Pick<HostBooking, 'payments'>"
    },
    {
      "id": "hosting.fn.bookingBalance",
      "engine": "hosting",
      "name": "היתרה של ההזמנה",
      "kind": "amount",
      "fn": "transitions#bookingBalance",
      "takes": "Pick<HostBooking, 'charges' | 'payments'>"
    },
    {
      "id": "hosting.fn.mealTotal",
      "engine": "hosting",
      "name": "סכום הזמנת-מטבח",
      "kind": "amount",
      "fn": "transitions#mealTotal",
      "takes": "Pick<HostMeal, 'items'>"
    }
  ],
  "unclassified": {
    "אין שם עברי לשדה": 1,
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 19,
    "הפניה לרשומה אחרת — לא נתון": 38,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 20,
    "טקסט טכני (לא שם ולא תיאור)": 8,
    "כן/לא בודד": 6,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 5,
    "קובץ לא טהור (ממשק/אחסון/דפדפן) — לא נקרא": 1,
    "רגע טכני (עדכון/בדיקה) — לא נתון של העבודה": 13,
    "רשימה — נבדקת לפי הפריט שבה": 1
  }
};
