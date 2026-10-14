/**
 * 🕯️ מחשבון הזמנים — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/parnasa · 29 חלקים · 0 מקומות · 7 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_ZMANIM_BOARD: GenEngine = {
  "id": "zmanimBoard",
  "name": "מחשבון הזמנים",
  "emoji": "🕯️",
  "from": "src/components/parnasa",
  "computes": "יודע איפה השמש נמצאת בכל מקום ובכל יום, ומזה מחשב את כל הזמנים.",
  "entities": [],
  "parts": [
    {
      "num": 1,
      "name": "מיקום מהגדרות-הגבאי",
      "computes": "מיקום מהגדרות-הגבאי (db.ui.parnasa.zmanim): נ\"צ מותאם (שניהם תקינים) גובר; אחרת עיר מטבלת- המנוע; אחרת בני ברק.",
      "fn": "zmanimBoard#resolveZmanimLoc",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "הערת-המקום לתצוגה",
      "computes": "הערת-המקום לתצוגה.",
      "fn": "zmanimBoard#locNote",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "רגע",
      "computes": "רגע (epoch ms, מוזרק) ⇒ שעון-קיר באזור-הזמן (DST דרך Intl) — לעולם לא שעון-המכשיר.",
      "fn": "zmanimBoard#clockAt",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "חלק בלי הסבר (hmToMin)",
      "computes": "\"H:MM\"/\"HH:MM\" ⇒ דקות-מחצות (24:00 = 1440); לא-תקין ⇒ null.",
      "fn": "zmanimBoard#hmToMin",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "דקות",
      "computes": "דקות ⇒ \"HH:MM\" (מודולו יממה).",
      "fn": "zmanimBoard#minToHm",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "תאריך ISO תקין",
      "computes": "תאריך ISO תקין (YYYY-MM-DD שקיים בלוח).",
      "fn": "zmanimBoard#isIsoDate",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "צעד-ימים על ISO",
      "computes": "צעד-ימים על ISO (צהרי-UTC — בלי תלות באזור-הזמן של המכשיר).",
      "fn": "zmanimBoard#addDaysIso",
      "takes": [
        "times"
      ],
      "gives": "times"
    },
    {
      "num": 8,
      "name": "יום-בשבוע של תאריך ISO",
      "computes": "יום-בשבוע של תאריך ISO (0=ראשון); קלט פגום ⇒ -1.",
      "fn": "zmanimBoard#dowOfIso",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 9,
      "name": "סיווג-היום",
      "computes": "סיווג-היום (שבת/יו״ט/צום/ר״ח…) לפי לוח-המנוע; סגור = שבת או יו״ט.",
      "fn": "zmanimBoard#dayInfo",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 10,
      "name": "הזמנים של היום",
      "computes": "מחשב את הזמנים של היום.",
      "fn": "zmanimBoard#dayTimes",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 11,
      "name": "שעת-קיר",
      "computes": "שעת-קיר (באזור-הזמן של הקהילה) שבה השמש מעלות מתחת לאופק — למשל משיכיר = 11.5° בבוקר.",
      "fn": "zmanimBoard#sunAngleTime",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 12,
      "name": "האם הרגע",
      "computes": "האם הרגע (תאריך+שעה באזור-הזמן) בתוך שבת/יו״ט: יום-סגור לפני-צאת, או ערב-יום-סגור מהדלקת- הנרות.",
      "fn": "zmanimBoard#closureAt",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 13,
      "name": "פונקציית-סגירה קשורה-למיקום",
      "computes": "פונקציית-סגירה קשורה-למיקום (למנוע-הסטטוס/הדירוג ב-lib.ts).",
      "fn": "zmanimBoard#makeClosureFn",
      "takes": [],
      "gives": null
    },
    {
      "num": 14,
      "name": "היום והחודש העבריים בלי שנה",
      "computes": "היום והחודש העבריים בלי שנה (\"ב׳ חשוון\" — rdate של לוח-הבקשות במקור).",
      "fn": "zmanimBoard#hebDayMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 15,
      "name": "תאריך במילים",
      "computes": "תאריך במילים (dateFmt של המקור, לבוררי-התאריך): \"יום ד׳, 11 בנובמבר 2026 · א׳ כסלו\".",
      "fn": "zmanimBoard#dateWords",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 16,
      "name": "\"ה׳ חשוון תשפ״ז\" לתאריך לועזי",
      "computes": "\"ה׳ חשוון תשפ״ז\" לתאריך לועזי (בצהריים, באזור-הזמן).",
      "fn": "zmanimBoard#hebDateText",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 17,
      "name": "התאריך העברי ברגע הנתון",
      "computes": "התאריך העברי ברגע הנתון — מתחלף בשקיעה (תיקון: במקור לא התחלף עד חצות).",
      "fn": "zmanimBoard#hebDateAt",
      "takes": [],
      "gives": null
    },
    {
      "num": 18,
      "name": "זמני-היום",
      "computes": "זמני-היום (בסדר כרונולוגי): עלות (נץ−72) · נץ · סוף ק״ש מג״א/גר״א · סוף תפילה · חצות · מנחה גדולה/קטנה · פלג · [הדלקת נרות בערב שבת/חג] · שקיעה · צאת (או \"צאת…",
      "fn": "zmanimBoard#dayZmanim",
      "takes": [
        "times"
      ],
      "gives": "times"
    },
    {
      "num": 19,
      "name": "זמני-היום מסומנים מול השעון",
      "computes": "זמני-היום מסומנים מול השעון — past לשעה שעברה, next לראשון שטרם הגיע.",
      "fn": "zmanimBoard#markZmanim",
      "takes": [],
      "gives": "times"
    },
    {
      "num": 20,
      "name": "השבת לתצוגה",
      "computes": "השבת לתצוגה: בשבת עצמה (עד צאת) — **השבת הנוכחית** (תיקון באג-המקור שקפץ לשבוע הבא); אחרי צאת-השבת — השבת הבאה; ראשון–שישי — השבת הקרובה.",
      "fn": "zmanimBoard#shabbatOf",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 21,
      "name": "חלונות-שבת/חג שטרם הסתיימו",
      "computes": "חלונות-שבת/חג שטרם הסתיימו (כולל הנוכחי) — מנוע-הטלפוניה, לכותרת \"שבת/חג קרוב\".",
      "fn": "zmanimBoard#upcomingClosures",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 22,
      "name": "טבלת-זמנים ל-N ימים מתאריך",
      "computes": "טבלת-זמנים ל-N ימים מתאריך (ברירת 7) — אותם חישובים כמו dayZmanim.",
      "fn": "zmanimBoard#weekZmanim",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 23,
      "name": "טוקן-זמן",
      "computes": "טוקן-זמן ⇒ שעה: \"HH:MM\" קבוע · \"sh±N\" שקיעה±דק׳ · \"tz±N\" צאת±דק׳ · \"nz±N\" נץ±דק׳ (תוספת על המקור — מניין ותיקין).",
      "fn": "zmanimBoard#resolveTimeToken",
      "takes": [],
      "gives": null
    },
    {
      "num": 24,
      "name": "מודעה מאושרת שטרם ירדה מהלוח",
      "computes": "מודעה מאושרת שטרם ירדה מהלוח (until כולל).",
      "fn": "zmanimBoard#postActiveOn",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 25,
      "name": "כל זמני-המניינים ליום",
      "computes": "כל זמני-המניינים ליום (מודעות kind='minyan' מאושרות, לפי ימי-התוקף), ממוינים לפי שעה.",
      "fn": "zmanimBoard#resolveMinyanim",
      "takes": [
        "times"
      ],
      "gives": "times"
    },
    {
      "num": 26,
      "name": "המניין הבא מהשעה",
      "computes": "המניין הבא מהשעה (אותו יום) — null כשאין עוד היום.",
      "fn": "zmanimBoard#nextMinyan",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "הרשימה האפקטיבית",
      "computes": "הרשימה האפקטיבית: מודעות-חירום מאושרות (נעוצות ראשונות, אח\"כ לפי יצירה) — או ברירות-המחדל.",
      "fn": "zmanimBoard#emergencyNumbers",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 28,
      "name": "טיוטות-מודעה לזריעת ברירות-המחדל",
      "computes": "טיוטות-מודעה לזריעת ברירות-המחדל (כפתור \"ערוך את מספרי-החירום\" — הגבאי מתחיל מהן).",
      "fn": "zmanimBoard#emergencyDrafts",
      "takes": [],
      "gives": null
    },
    {
      "num": 29,
      "name": "כל לוח-הזמנים לרגע נתון",
      "computes": "כל לוח-הזמנים לרגע נתון — מקור אחד לממשק (הלוח) ולבדיקות.",
      "fn": "zmanimBoard#buildZmanimBoard",
      "takes": [],
      "gives": null
    }
  ],
  "places": [],
  "fnPlaces": [
    {
      "id": "zmanimBoard.fn.dayTimes",
      "engine": "zmanimBoard",
      "name": "הזמנים של היום",
      "kind": "span",
      "fn": "zmanimBoard#dayTimes",
      "takes": "PrZmanimLoc"
    },
    {
      "id": "zmanimBoard.fn.dayZmanim",
      "engine": "zmanimBoard",
      "name": "זמני-היום",
      "kind": "times",
      "fn": "zmanimBoard#dayZmanim",
      "takes": "PrZmanimLoc"
    },
    {
      "id": "zmanimBoard.fn.markZmanim",
      "engine": "zmanimBoard",
      "name": "זמני-היום מסומנים מול השעון",
      "kind": "times",
      "fn": "zmanimBoard#markZmanim",
      "takes": "readonly PrZman[]"
    },
    {
      "id": "zmanimBoard.fn.shabbatOf",
      "engine": "zmanimBoard",
      "name": "השבת לתצוגה",
      "kind": "span",
      "fn": "zmanimBoard#shabbatOf",
      "takes": "PrClock"
    },
    {
      "id": "zmanimBoard.fn.upcomingClosures",
      "engine": "zmanimBoard",
      "name": "חלונות-שבת/חג שטרם הסתיימו",
      "kind": "sequence",
      "fn": "zmanimBoard#upcomingClosures",
      "takes": "PrClock"
    },
    {
      "id": "zmanimBoard.fn.weekZmanim",
      "engine": "zmanimBoard",
      "name": "טבלת-זמנים ל-N ימים מתאריך",
      "kind": "sequence",
      "fn": "zmanimBoard#weekZmanim",
      "takes": "PrZmanimLoc"
    },
    {
      "id": "zmanimBoard.fn.resolveMinyanim",
      "engine": "zmanimBoard",
      "name": "כל זמני-המניינים ליום",
      "kind": "times",
      "fn": "zmanimBoard#resolveMinyanim",
      "takes": "readonly PrPost[]"
    }
  ],
  "unclassified": {
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1
  }
};
