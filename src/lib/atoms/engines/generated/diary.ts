/**
 * 🚪 מנוע יומן החדרים — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/diary · 17 חלקים · 7 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_DIARY: GenEngine = {
  "id": "diary",
  "name": "מנוע יומן החדרים",
  "emoji": "🚪",
  "from": "src/components/diary",
  "computes": "יודע איזה חדר תפוס ומתי, ומתי אסור לקבוע.",
  "entities": [
    "rooms"
  ],
  "parts": [
    {
      "num": 1,
      "name": "תצוגת תאריך DD/MM/YYYY",
      "computes": "תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO).",
      "fn": "lib#fmtDate",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 2,
      "name": "ISO מקומי",
      "computes": "ISO מקומי (מקור-אמת יחיד ב-date-util) — למניעת גלישת יום באזורי-זמן.",
      "fn": "lib#localIso",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "חלק בלי הסבר (isoToday)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#isoToday",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "חלק בלי הסבר (pad2)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#pad2",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "חלק בלי הסבר (timeToMin)",
      "computes": "\"HH:MM\" → דקות מחצות; מחרוזת לא תקינה → NaN.",
      "fn": "lib#timeToMin",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "חלק בלי הסבר (minToHM)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#minToHM",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "תווית קבוצה",
      "computes": "תווית קבוצה — label או \"קבוצה N\" לפי המיקום (כמו במודול הקורסים).",
      "fn": "lib#groupLabelOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "חלק בלי הסבר (makeupEligibility)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#makeupEligibility",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "סיבת חסימת היום לתזמון חוגים",
      "computes": "סיבת חסימת היום לתזמון חוגים — שבת, שישי, חג מלא או חול המועד (כמו במקור).",
      "fn": "lib#blockReason",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "בונה את משבצות היום לחדר",
      "computes": "בונה את משבצות היום לחדר: מ-room.from עד room.to בקפיצות של room.slot דקות.",
      "fn": "lib#buildSlots",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 11,
      "name": "המשובצים למפגש",
      "computes": "המשובצים למפגש: כל שיבוצי הקורס; כשיש כמה קבוצות — רק מי ששויך/ה לקבוצה של המפגש הזה, בתוספת מי שעדיין ללא שיוך קבוצה (כדי שלא ייעלמו מהיומן).",
      "fn": "lib#enrollmentsForSession",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 12,
      "name": "ניצולת שבועית",
      "computes": "ניצולת שבועית — מספר המפגשים השבועיים המשויכים לחדר (חוגים שלא הסתיימו).",
      "fn": "lib#weeklyRoomSessions",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 13,
      "name": "חוגים",
      "computes": "חוגים (שלא הסתיימו) המשויכים לחדר לא פעיל או לחדר שאינו קיים.",
      "fn": "lib#inactiveRoomCourses",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 14,
      "name": "תווית מסלול קצרה לשורת תלמיד/ה ביומן",
      "computes": "תווית מסלול קצרה לשורת תלמיד/ה ביומן — עקבי עם מודול הקורסים (planWord).",
      "fn": "lib#planLabelOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "תוויות סטטוס שיבוץ",
      "computes": "תוויות סטטוס שיבוץ (כמו במודול הקורסים).",
      "fn": "lib#enrollStatusMeta",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "צ'יפ קטן בסגנון אחיד",
      "computes": "צ'יפ קטן בסגנון אחיד.",
      "fn": "lib#chipStyle",
      "takes": [],
      "gives": null
    },
    {
      "num": 17,
      "name": "שורת המידע על החדר",
      "computes": "שורת המידע על החדר — כמו slotLabel במקור.",
      "fn": "lib#roomInfoLabel",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "diary.rooms.from~to",
      "engine": "diary",
      "name": "מההתחלה עד הסוף של כל חדר",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "rooms",
        "path": "from",
        "to": "to",
        "unit": "clock",
        "kind": "span"
      }
    },
    {
      "id": "diary.rooms.name",
      "engine": "diary",
      "name": "השם של כל חדר",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "rooms",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "diary.rooms.cap",
      "engine": "diary",
      "name": "התפוסה המרבית של כל חדר",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "rooms",
        "path": "cap",
        "kind": "amount"
      }
    },
    {
      "id": "diary.rooms.rate",
      "engine": "diary",
      "name": "התעריף של כל חדר",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "rooms",
        "path": "rate",
        "kind": "amount"
      }
    },
    {
      "id": "diary.rooms.from",
      "engine": "diary",
      "name": "שעת ההתחלה של כל חדר",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "rooms",
        "path": "from",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "diary.rooms.to",
      "engine": "diary",
      "name": "שעת הסוף של כל חדר",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "rooms",
        "path": "to",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "diary.rooms.notes",
      "engine": "diary",
      "name": "ההערות של כל חדר",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "rooms",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    }
  ],
  "fnPlaces": [],
  "unclassified": {
    "הפניה לרשומה אחרת — לא נתון": 1,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 5,
    "טיפוס מורכב — לא אחד מששת הסוגים": 1,
    "טקסט טכני (לא שם ולא תיאור)": 1,
    "כן/לא בודד": 2,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1
  }
};
