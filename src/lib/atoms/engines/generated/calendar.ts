/**
 * 📅 מנוע הלוח — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/calendar · 21 חלקים · 11 מקומות · 3 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_CALENDAR: GenEngine = {
  "id": "calendar",
  "name": "מנוע הלוח",
  "emoji": "📅",
  "from": "src/components/calendar",
  "computes": "יודע מה קורה בכל יום, בעברי ובלועזי.",
  "entities": [
    "events"
  ],
  "parts": [
    {
      "num": 1,
      "name": "היום בלוח העברי",
      "computes": "היום בלוח העברי — טהור; תאריך פגום ⇒ EMPTY (valid:false).",
      "fn": "abilities#dayInfoOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "ISO מקומי",
      "computes": "ISO מקומי (מקור-אמת יחיד ב-date-util).",
      "fn": "calLib#isoOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "תצוגת תאריך DD/MM/YYYY מתוך ISO",
      "computes": "תצוגת תאריך DD/MM/YYYY מתוך ISO.",
      "fn": "calLib#fmtD",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 4,
      "name": "חלק בלי הסבר (hpOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "calLib#hpOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 5,
      "name": "סיבת חסימת היום",
      "computes": "סיבת חסימת היום — שבת וחג מלא לכל אירוע; ב-kind 'course' נוספים גם יום שישי וחול המועד (port של blockReason מהמקור).",
      "fn": "calLib#blockReason",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "שגיאת חסימה לאירוע ארגוני",
      "computes": "שגיאת חסימה לאירוע ארגוני — שבת או חג מלא (ולידציית saveEvent מהמקור).",
      "fn": "calLib#orgBlockError",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 7,
      "name": "התנגשות חדר",
      "computes": "התנגשות חדר: אירוע אחר (אותו תאריך, חדר ושעה, לא בוצע) או מפגש חוג (אותו יום בשבוע בתקופה החוג, אותה שעה) — כמו ולידציית saveEvent במקור.",
      "fn": "calLib#roomClashError",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "האם אירוע חל ביום נתון",
      "computes": "האם אירוע חל ביום נתון: תאריך מדויק, או — לסוגים החוזרים (אזכרה / יום נישואין / יום הולדת) — התאמת יום+חודש עבריים בכל שנה שאחרי המקור.",
      "fn": "calLib#eventOccursOn",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 9,
      "name": "האם פריט יום עובר את הפילטרים",
      "computes": "האם פריט יום עובר את הפילטרים (כמו allowE במקור).",
      "fn": "calLib#allowItem",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "כל מה שקורה ביום",
      "computes": "כל מה שקורה ביום: אירועים (כולל חוזרים) + מפגשי חוגים.",
      "fn": "calLib#dayItems",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "מצב הפתיחה של הלוח",
      "computes": "מצב הפתיחה של הלוח (P1.1, feature calendar.hebdefault) — טהור.",
      "fn": "calLib#initialHebMode",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "רשת חודש לועזי",
      "computes": "רשת חודש לועזי — 42 תאים קבועים, ראשון עד שבת.",
      "fn": "calLib#buildGregorianGrid",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "רשת חודש עברי מלא",
      "computes": "רשת חודש עברי מלא (א׳–ל׳) סביב תאריך עוגן — כמו במקור.",
      "fn": "calLib#buildHebrewGrid",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 14,
      "name": "רשת שבוע",
      "computes": "רשת שבוע (ראשון–שבת) סביב תאריך עוגן — 7 תאים.",
      "fn": "calLib#buildWeekGrid",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 15,
      "name": "רשת יום",
      "computes": "רשת יום — תא יחיד (העוגן).",
      "fn": "calLib#buildDayGrid",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 16,
      "name": "אזהרה רכה בשמירת אירוע",
      "computes": "אזהרה רכה בשמירת אירוע: אירוע אחר (לא בוצע) באותו יום ובאותה שעה — גם בחדר אחר או בלי חדר.",
      "fn": "calLib#softClashSuffix",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 17,
      "name": "המופע הבא של אירוע חוזר-בעברי מ-fromIso והלאה",
      "computes": "המופע הבא של אירוע חוזר-בעברי מ-fromIso והלאה — סריקה עד 400 ימים (כמו nextOccurLabel בלגאסי) למציאת התאמת חודש+יום עבריים (hebAnnualEq, כולל דין אדר).",
      "fn": "calLib#nextOccurIso",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 18,
      "name": "פריסת אירועי-הארגון לחלון-ימים קדימה כמופעים קונקרטיים ל-ICS",
      "computes": "פריסת אירועי-הארגון לחלון-ימים קדימה כמופעים קונקרטיים ל-ICS.",
      "fn": "calLib#icsWindowEvents",
      "takes": [
        "amount",
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 19,
      "name": "הזזת תאריך מהירה מ-base",
      "computes": "הזזת תאריך מהירה מ-base (ISO): היום/מחר/בעוד שבוע/בעוד חודש.",
      "fn": "calLib#quickDate",
      "takes": [],
      "gives": null
    },
    {
      "num": 20,
      "name": "הפריטים של 30 הימים הקרובים",
      "computes": "הפריטים של 30 הימים הקרובים — אירועים (כולל חוזרים בעברי) והשכבות הנגזרות (ימי הולדת/הצטרפות/הרשמה) דרך dayItems; מפגשי חוגים מוחרגים (חוזרים שבועית — רעש).",
      "fn": "calLib#upcomingItems",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 21,
      "name": "אירועים ותזכורות ב-14 הימים הקרובים, כולל חוזרים לפי התאריך…",
      "computes": "אירועים ותזכורות ב-14 הימים הקרובים, כולל חוזרים לפי התאריך העברי.",
      "fn": "calLib#upcomingRows",
      "takes": [],
      "gives": "sequence"
    }
  ],
  "places": [
    {
      "id": "calendar.events.@?waiting",
      "engine": "calendar",
      "name": "האירועים בלוח שעוד לא סומנו כבוצעו",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "events",
        "path": "",
        "done": "done",
        "since": "date",
        "kind": "waiting"
      }
    },
    {
      "id": "calendar.events.@seq",
      "engine": "calendar",
      "name": "האירועים בלוח, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "events",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "calendar.events.roomId@seq",
      "engine": "calendar",
      "name": "האירועים בלוח של כל חדר, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "events",
        "path": "",
        "dateField": "date",
        "groupBy": "roomId",
        "kind": "sequence"
      }
    },
    {
      "id": "calendar.events.famId@seq",
      "engine": "calendar",
      "name": "האירועים בלוח של כל משפחה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "events",
        "path": "",
        "dateField": "date",
        "groupBy": "famId",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "calendar.events.spId@seq",
      "engine": "calendar",
      "name": "האירועים בלוח של כל תורם, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "events",
        "path": "",
        "dateField": "date",
        "groupBy": "spId",
        "kind": "sequence"
      }
    },
    {
      "id": "calendar.events.title",
      "engine": "calendar",
      "name": "הכותרת של כל אירוע",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "events",
        "path": "title",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "calendar.events.date",
      "engine": "calendar",
      "name": "התאריך של כל אירוע",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "events",
        "path": "date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "calendar.events.time",
      "engine": "calendar",
      "name": "השעה של כל אירוע",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "events",
        "path": "time",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "calendar.events.customType",
      "engine": "calendar",
      "name": "הסוג של כל אירוע",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "events",
        "path": "customType",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "calendar.events.notes",
      "engine": "calendar",
      "name": "ההערות של כל אירוע",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "events",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "calendar.events.price",
      "engine": "calendar",
      "name": "המחיר של כל אירוע",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "events",
        "path": "price",
        "kind": "amount"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "calendar.fn.icsWindowEvents",
      "engine": "calendar",
      "name": "פריסת אירועי-הארגון לחלון-ימים קדימה כמופעים קונקרטיים ל-ICS",
      "kind": "sequence",
      "fn": "calLib#icsWindowEvents",
      "takes": "Db"
    },
    {
      "id": "calendar.fn.upcomingItems",
      "engine": "calendar",
      "name": "הפריטים של 30 הימים הקרובים",
      "kind": "sequence",
      "fn": "calLib#upcomingItems",
      "takes": "Db"
    },
    {
      "id": "calendar.fn.upcomingRows",
      "engine": "calendar",
      "name": "אירועים ותזכורות ב-14 הימים הקרובים, כולל חוזרים לפי התאריך…",
      "kind": "sequence",
      "fn": "calLib#upcomingRows",
      "takes": "Db"
    }
  ],
  "unclassified": {
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 2,
    "הפניה לרשומה אחרת — לא נתון": 4,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1,
    "כן/לא בודד": 1
  }
};
