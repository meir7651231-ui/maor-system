/**
 * 🚚 מנוע החלוקה — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/shop7 · 14 חלקים · 12 מקומות · 0 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_SHOP7: GenEngine = {
  "id": "shop7",
  "name": "מנוע החלוקה",
  "emoji": "🚚",
  "from": "src/components/shop7",
  "computes": "יודע מי מחלק למי, ומה כבר נמסר.",
  "entities": [
    "volunteers",
    "distributionDays",
    "deliveries"
  ],
  "parts": [
    {
      "num": 1,
      "name": "הסטטוס הבא",
      "computes": "הסטטוס הבא — קדימה; delivered הוא סופי (מחזיר את עצמו).",
      "fn": "lib#advanceStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "תווית הסטטוס לתצוגה",
      "computes": "תווית הסטטוס לתצוגה.",
      "fn": "lib#statusLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "חלק בלי הסבר (deliveriesOfDay)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#deliveriesOfDay",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 4,
      "name": "חלק בלי הסבר (deliveriesOfVolunteer)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#deliveriesOfVolunteer",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 5,
      "name": "שיוכי-חנות פעילים שטרם הפכו למסירה **ביום הזה**",
      "computes": "שיוכי-חנות פעילים שטרם הפכו למסירה **ביום הזה** — הקלט לבורר-השיוך.",
      "fn": "lib#eligibleAssignmentsForDay",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 6,
      "name": "מד-התקדמות ליום",
      "computes": "מד-התקדמות ליום — ספירת מסירות לפי סטטוס.",
      "fn": "lib#dayProgress",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "רמז-קיבולת",
      "computes": "רמז-קיבולת (לא-חוסם): כמה מסירות כבר על המתנדב ביום, והאם חרג מ-maxDeliveries.",
      "fn": "lib#volunteerLoadHint",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "מסירות של משפחה",
      "computes": "מסירות של משפחה (לפאנל כרטיס-המשפחה — תצוגה בלבד).",
      "fn": "lib#deliveriesOfFamily",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 9,
      "name": "מסירות פתוחות עד-היום שטרם נמסרו",
      "computes": "מסירות פתוחות עד-היום שטרם נמסרו — למונה-הבית.",
      "fn": "lib#pendingDeliveriesToday",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 10,
      "name": "שורות תדפיס ליום-חלוקה",
      "computes": "שורות תדפיס ליום-חלוקה — מקובצות פר-מתנדב: כותרת-מתנדב ואז \"משפחה · סטטוס · כתובת · הערה\" לכל מסירה.",
      "fn": "lib#deliveryListLines",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "שורות CSV של כל המסירות",
      "computes": "שורות CSV של כל המסירות — תאריך-יום · משפחה · מתנדב · סטטוס · הערה.",
      "fn": "lib#deliveriesCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "עצירות-המסלול של מתנדב ביום-חלוקה",
      "computes": "עצירות-המסלול של מתנדב ביום-חלוקה (INTEGRATIONS גל א׳ · הרחבת maps): כתובות המשפחות של המסירות שלו באותו יום, בסדר-הלוח, '[address, city]' מסונן-ריקים; משפחה…",
      "fn": "lib#volunteerRouteStops",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "סינון מתנדבים",
      "computes": "סינון מתנדבים (שם/טלפון/אזור) דרך smartFilter.",
      "fn": "lib#filterVolunteers",
      "takes": [
        "text"
      ],
      "gives": "sequence"
    },
    {
      "num": 14,
      "name": "סינון מסירות",
      "computes": "סינון מסירות (שם-משפחה/סטטוס) — familyName נגזר ב-caller ומוזרק.",
      "fn": "lib#filterDeliveries",
      "takes": [
        "text"
      ],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "shop7.volunteers.name",
      "engine": "shop7",
      "name": "השם של כל מתנדב",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "volunteers",
        "path": "name",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop7.volunteers.area",
      "engine": "shop7",
      "name": "האזור של כל מתנדב",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "volunteers",
        "path": "area",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop7.volunteers.note",
      "engine": "shop7",
      "name": "ההערה של כל מתנדב",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "volunteers",
        "path": "note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop7.volunteers.createdAt",
      "engine": "shop7",
      "name": "מועד היצירה של כל מתנדב",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "volunteers",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop7.distributionDays.@seq",
      "engine": "shop7",
      "name": "ימי החלוקה, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "distributionDays",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "shop7.distributionDays.date",
      "engine": "shop7",
      "name": "התאריך של כל יום חלוקה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "distributionDays",
        "path": "date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop7.distributionDays.title",
      "engine": "shop7",
      "name": "הכותרת של כל יום חלוקה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "distributionDays",
        "path": "title",
        "echo": true,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop7.distributionDays.note",
      "engine": "shop7",
      "name": "ההערה של כל יום חלוקה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "distributionDays",
        "path": "note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop7.distributionDays.createdAt",
      "engine": "shop7",
      "name": "מועד היצירה של כל יום חלוקה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "distributionDays",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop7.deliveries.@?waiting",
      "engine": "shop7",
      "name": "המסירות שמחכים (לאיסוף, בדרך)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "deliveries",
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "pickup",
            "enroute"
          ]
        },
        "kind": "waiting"
      },
      "personal": true
    },
    {
      "id": "shop7.deliveries.deliveredAt",
      "engine": "shop7",
      "name": "מועד חותמת מסירה של כל מסירה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "deliveries",
        "path": "deliveredAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop7.deliveries.note",
      "engine": "shop7",
      "name": "ההערה של כל מסירה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "deliveries",
        "path": "note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    }
  ],
  "fnPlaces": [],
  "unclassified": {
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 1,
    "הפניה לרשומה אחרת — לא נתון": 7,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 2,
    "כן/לא בודד": 2,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 2
  }
};
