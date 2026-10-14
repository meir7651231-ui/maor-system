/**
 * 🪙 מנוע קופות הצדקה — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/tzedaka · 17 חלקים · 26 מקומות · 7 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_TZEDAKA: GenEngine = {
  "id": "tzedaka",
  "name": "מנוע קופות הצדקה",
  "emoji": "🪙",
  "from": "src/components/tzedaka",
  "computes": "יודע איפה כל קופה, מתי רוקנה וכמה היה בה.",
  "entities": [
    "tzCoordinators",
    "tzBoxes",
    "tzCampaigns",
    "tzEvents"
  ],
  "parts": [
    {
      "num": 1,
      "name": "הריקון האחרון של קופה",
      "computes": "הריקון האחרון של קופה — '' כשאין.",
      "fn": "lib#lastCollectionIso",
      "takes": [],
      "gives": "times"
    },
    {
      "num": 2,
      "name": "דלתת הניקוד על ריקון",
      "computes": "דלתת הניקוד על ריקון — לפני הוספת הריקון לקופה (השורה נמדד מול הקודם).",
      "fn": "lib#collectionScoreDelta",
      "takes": [
        "amount",
        "times"
      ],
      "gives": null
    },
    {
      "num": 3,
      "name": "הסכום הכולל של הקופה",
      "computes": "מחשב את הסכום הכולל של הקופה.",
      "fn": "lib#boxTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 4,
      "name": "חלק בלי הסבר (coordinatorBoxes)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#coordinatorBoxes",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 5,
      "name": "הסכום הכולל של הרכז",
      "computes": "מחשב את הסכום הכולל של הרכז.",
      "fn": "lib#coordinatorTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 6,
      "name": "הסכום הכולל של הכול",
      "computes": "מחשב את הסכום הכולל של הכול.",
      "fn": "lib#grandTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 7,
      "name": "הסכום הכולל של המבצע",
      "computes": "מחשב את הסכום הכולל של המבצע.",
      "fn": "lib#campaignTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 8,
      "name": "קופות אצל משפחות שלא רוקנו ≥N יום",
      "computes": "קופות אצל משפחות שלא רוקנו ≥N יום (או מעולם — לפי since).",
      "fn": "lib#staleBoxes",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 9,
      "name": "רשימת הטיפול המשרדי",
      "computes": "רשימת הטיפול המשרדי — ממוינת לפי סוג (ישנות → אבודות → רכזים → מבצעים).",
      "fn": "lib#needsCare",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 10,
      "name": "רכזים פעילים ממוינים",
      "computes": "רכזים פעילים ממוינים: score יורד, ואז סכום יורד.",
      "fn": "lib#leaderboard",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "ההתקדמות של המבצע",
      "computes": "מחשב את ההתקדמות של המבצע.",
      "fn": "lib#campaignProgress",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "סינון+מיון הרכזים",
      "computes": "סינון+מיון הרכזים: q דרך smartFilter על השם (עברית, שגיאות-כתיב); 'stale' = ריקון-אחרון-ישן-קודם (מי שדורש דחיפה למעלה; מעולם-לא ראשון).",
      "fn": "lib#filterCoordinators",
      "takes": [
        "text"
      ],
      "gives": "sequence"
    },
    {
      "num": 13,
      "name": "מבט \"כל הקופות\"",
      "computes": "מבט \"כל הקופות\" — כל הקופות עם שם הרכז והמשפחה, חיפוש/סינון/מיון.",
      "fn": "lib#boxesOverview",
      "takes": [
        "text"
      ],
      "gives": "sequence"
    },
    {
      "num": 14,
      "name": "סינון היסטוריית ריקונים",
      "computes": "סינון היסטוריית ריקונים — תקופה תאריכים (כוללני, dateInRange המשותף) + מבצע.",
      "fn": "lib#filterCollections",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 15,
      "name": "שורות תדפיס הרכז",
      "computes": "שורות תדפיס הרכז — רשימת הקופות שלו לסבב שטח: מספר, משפחה, כתובת, טלפון וריקון אחרון.",
      "fn": "lib#coordinatorPrintLines",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "שורות CSV של כל הריקונים",
      "computes": "שורות CSV של כל הריקונים — תאריך, רכז, קופה, משפחה, סכום, מבצע.",
      "fn": "lib#collectionsCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 17,
      "name": "גריד יומי/שבועי/חודשי לועזי/עברי עם האירועים הייעודיים בלבד",
      "computes": "גריד יומי/שבועי/חודשי לועזי/עברי עם האירועים הייעודיים בלבד — wrapper דק על הגנרי המשותף ב-lib/monthGrid.",
      "fn": "lib#buildTzGrid",
      "takes": [
        "times"
      ],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "tzedaka.tzCoordinators.name",
      "engine": "tzedaka",
      "name": "השם של כל רכז",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "name",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCoordinators.notes",
      "engine": "tzedaka",
      "name": "ההערות של כל רכז",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCoordinators.score",
      "engine": "tzedaka",
      "name": "הניקוד של כל רכז",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "score",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCoordinators.scoreLog[]@seq",
      "engine": "tzedaka",
      "name": "הפריטים של כל רכז, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "scoreLog[]",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCoordinators.scoreLog[].date",
      "engine": "tzedaka",
      "name": "מועדי הפריטים של כל רכז",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "scoreLog[].date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCoordinators.scoreLog[].reason",
      "engine": "tzedaka",
      "name": "הסיבה בתוך הפריטים של כל רכז",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzCoordinators",
        "path": "scoreLog[].reason",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzBoxes.notes",
      "engine": "tzedaka",
      "name": "ההערות של כל קופה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzBoxes",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzBoxes.collections[]@seq",
      "engine": "tzedaka",
      "name": "הריקונים של כל קופה, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzBoxes",
        "path": "collections[]",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzBoxes.collections[].date",
      "engine": "tzedaka",
      "name": "מועדי הריקונים של כל קופה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tzBoxes",
        "path": "collections[].date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzBoxes.collections[].amount",
      "engine": "tzedaka",
      "name": "סכומי הריקונים של כל קופה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "tzBoxes",
        "path": "collections[].amount",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzBoxes.collections[].note",
      "engine": "tzedaka",
      "name": "ההערה בריקונים של כל קופה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzBoxes",
        "path": "collections[].note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.start~end",
      "engine": "tzedaka",
      "name": "מההתחלה עד הסיום של כל מבצע",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "start",
        "to": "end",
        "unit": "date",
        "kind": "span"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.@seq",
      "engine": "tzedaka",
      "name": "המבצעים, לפי מועד ההתחלה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "",
        "dateField": "start",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.name",
      "engine": "tzedaka",
      "name": "השם של כל מבצע",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "name",
        "echo": true,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.start",
      "engine": "tzedaka",
      "name": "מועד ההתחלה של כל מבצע",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "start",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.end",
      "engine": "tzedaka",
      "name": "מועד הסיום של כל מבצע",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "end",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.goal",
      "engine": "tzedaka",
      "name": "היעד של כל מבצע",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "goal",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzCampaigns.notes",
      "engine": "tzedaka",
      "name": "ההערות של כל מבצע",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzCampaigns",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.@?waiting",
      "engine": "tzedaka",
      "name": "אירועי הקופות שעוד לא סומנו כבוצעו",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "",
        "done": "done",
        "since": "date",
        "kind": "waiting"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.@seq",
      "engine": "tzedaka",
      "name": "אירועי הקופות, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.coordinatorId@seq",
      "engine": "tzedaka",
      "name": "אירועי הקופות של כל רכז, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "",
        "dateField": "date",
        "groupBy": "coordinatorId",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.boxId@seq",
      "engine": "tzedaka",
      "name": "אירועי הקופות של כל קופה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "",
        "dateField": "date",
        "groupBy": "boxId",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.title",
      "engine": "tzedaka",
      "name": "הכותרת של כל אירוע קופות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "title",
        "echo": true,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.date",
      "engine": "tzedaka",
      "name": "התאריך של כל אירוע קופות",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.time",
      "engine": "tzedaka",
      "name": "השעה של כל אירוע קופות",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "time",
        "unit": "clock",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "tzedaka.tzEvents.notes",
      "engine": "tzedaka",
      "name": "ההערות של כל אירוע קופות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tzEvents",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    }
  ],
  "fnPlaces": [
    {
      "id": "tzedaka.fn.lastCollectionIso",
      "engine": "tzedaka",
      "name": "הריקון האחרון של קופה",
      "kind": "times",
      "fn": "lib#lastCollectionIso",
      "takes": "TzBox"
    },
    {
      "id": "tzedaka.fn.boxTotal",
      "engine": "tzedaka",
      "name": "הסכום הכולל של הקופה",
      "kind": "amount",
      "fn": "lib#boxTotal",
      "takes": "TzBox"
    },
    {
      "id": "tzedaka.fn.coordinatorTotal",
      "engine": "tzedaka",
      "name": "הסכום הכולל של הרכז",
      "kind": "amount",
      "fn": "lib#coordinatorTotal",
      "takes": "readonly TzBox[]"
    },
    {
      "id": "tzedaka.fn.grandTotal",
      "engine": "tzedaka",
      "name": "הסכום הכולל של הכול",
      "kind": "amount",
      "fn": "lib#grandTotal",
      "takes": "readonly TzBox[]"
    },
    {
      "id": "tzedaka.fn.campaignTotal",
      "engine": "tzedaka",
      "name": "הסכום הכולל של המבצע",
      "kind": "amount",
      "fn": "lib#campaignTotal",
      "takes": "readonly TzBox[]"
    },
    {
      "id": "tzedaka.fn.boxesOverview",
      "engine": "tzedaka",
      "name": "מבט \"כל הקופות\"",
      "kind": "sequence",
      "fn": "lib#boxesOverview",
      "takes": "Db"
    },
    {
      "id": "tzedaka.fn.filterCollections",
      "engine": "tzedaka",
      "name": "סינון היסטוריית ריקונים",
      "kind": "sequence",
      "fn": "lib#filterCollections",
      "takes": "TzBox"
    }
  ],
  "unclassified": {
    "אין שם עברי לשדה": 2,
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 3,
    "הפניה לרשומה אחרת — לא נתון": 12,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1,
    "טקסט טכני (לא שם ולא תיאור)": 1,
    "כן/לא בודד": 3,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 1
  }
};
