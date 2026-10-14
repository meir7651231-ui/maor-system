/**
 * 👨‍👩‍👧 מנוע המשפחות — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/families · 13 חלקים · 21 מקומות · 1 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_FAMILIES: GenEngine = {
  "id": "families",
  "name": "מנוע המשפחות",
  "emoji": "👨‍👩‍👧",
  "from": "src/components/families",
  "computes": "יודע מי במשפחה, מה היא צריכה ומה המצב שלה.",
  "entities": [
    "families"
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
      "name": "חלק בלי הסבר (isoToday)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#isoToday",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "גיל בשנים מלאות מתאריך לידה, או null אם אין…",
      "computes": "גיל בשנים מלאות מתאריך לידה, או null אם אין תאריך.",
      "fn": "lib#ageOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 4,
      "name": "דרגת מדד האמינות",
      "computes": "דרגת מדד האמינות — זהה לחלוקה במקור (950/800/500).",
      "fn": "lib#tierOf",
      "takes": [
        "amount"
      ],
      "gives": null
    },
    {
      "num": 5,
      "name": "כל השיבוצים של בני המשפחה",
      "computes": "כל השיבוצים של בני המשפחה (כולל שהסתיימו/ברשימת-המתנה — להיסטוריה/דוחות).",
      "fn": "lib#famEnrollments",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 6,
      "name": "השיבוצים ה\"חיים\" של המשפחה",
      "computes": "השיבוצים ה\"חיים\" של המשפחה — פעילים+מוקפאים בלבד.",
      "fn": "lib#famLiveEnrollments",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 7,
      "name": "צירי הצלילה",
      "computes": "צירי הצלילה — לפי סדר הקדימות במקור.",
      "fn": "lib#finderAxes",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "ערך המשפחה בציר נתון",
      "computes": "ערך המשפחה בציר נתון — תוויות עבריות כמו במקור.",
      "fn": "lib#finderAxisValue",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "המשפחות העוברות את נעילות הגלגל",
      "computes": "המשפחות העוברות את נעילות הגלגל — משמש גם לסינון הטבלה החי.",
      "fn": "lib#finderMatches",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 10,
      "name": "התאמת מספר לתחביר סינון עמודות",
      "computes": "התאמת מספר לתחביר סינון עמודות — \"3\" בדיוק, \"3+\" לפחות, \"2-4\" תקופה.",
      "fn": "lib#numMatch",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 11,
      "name": "היסטוריית הפעולות של המשפחה",
      "computes": "היסטוריית הפעולות של המשפחה (כמו famHistoryOf במקור) — נגזרת מהנתונים: הצטרפות · אירועי הלוח של המשפחה (P3 פריט 9) · לוג מדד האמינות · מסמכים · שיבוצים ·…",
      "fn": "lib#famHistoryOf",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 12,
      "name": "צ'יפ סטטוס/דרגה קטן בסגנון אחיד",
      "computes": "צ'יפ סטטוס/דרגה קטן בסגנון אחיד.",
      "fn": "lib#chipStyle",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "חלק בלי הסבר (maritalChipStyle)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#maritalChipStyle",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "families.families.@?waiting",
      "engine": "families",
      "name": "המשפחות שמחכים (ממתין)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "families",
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "pending"
          ]
        },
        "since": "createdAt",
        "kind": "waiting"
      },
      "personal": true
    },
    {
      "id": "families.families.@seq",
      "engine": "families",
      "name": "המשפחות, לפי מועד היצירה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "families",
        "path": "",
        "dateField": "createdAt",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "families.families.name",
      "engine": "families",
      "name": "השם של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "name",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.father",
      "engine": "families",
      "name": "שם האב של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "father",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.mother",
      "engine": "families",
      "name": "שם האם של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "mother",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.city",
      "engine": "families",
      "name": "העיר של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "city",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.community",
      "engine": "families",
      "name": "הקהילה של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "community",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.notes",
      "engine": "families",
      "name": "ההערות של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.kidsHome",
      "engine": "families",
      "name": "הילדים בבית של כל משפחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "families",
        "path": "kidsHome",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "families.families.kidsMarried",
      "engine": "families",
      "name": "הילדים הנשואים של כל משפחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "families",
        "path": "kidsMarried",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "families.families.members[]@seq",
      "engine": "families",
      "name": "בני המשפחה של כל משפחה, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "families",
        "path": "members[]",
        "dateField": "birth",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "families.families.members[].first",
      "engine": "families",
      "name": "השם הפרטי בבני המשפחה של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "members[].first",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.members[].birth",
      "engine": "families",
      "name": "מועד יום ההולדת בבני המשפחה של כל משפחה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "families",
        "path": "members[].birth",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "families.families.members[].school",
      "engine": "families",
      "name": "בית הספר בבני המשפחה של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "members[].school",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.members[].grade",
      "engine": "families",
      "name": "הכיתה בבני המשפחה של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "members[].grade",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.members[].notes",
      "engine": "families",
      "name": "ההערות בבני המשפחה של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "members[].notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.cred.score",
      "engine": "families",
      "name": "הניקוד בניקוד המשפחתי של כל משפחה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "families",
        "path": "cred.score",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "families.families.cred.log[]@seq",
      "engine": "families",
      "name": "רישומי היומן של כל משפחה, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "families",
        "path": "cred.log[]",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "families.families.cred.log[].date",
      "engine": "families",
      "name": "מועדי רישומי היומן של כל משפחה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "families",
        "path": "cred.log[].date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "families.families.cred.log[].reason",
      "engine": "families",
      "name": "הסיבה ברישומי היומן של כל משפחה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "families",
        "path": "cred.log[].reason",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "families.families.createdAt",
      "engine": "families",
      "name": "מועד היצירה של כל משפחה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "families",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    }
  ],
  "fnPlaces": [
    {
      "id": "families.fn.famHistoryOf",
      "engine": "families",
      "name": "היסטוריית הפעולות של המשפחה",
      "kind": "sequence",
      "fn": "lib#famHistoryOf",
      "takes": "Db"
    }
  ],
  "unclassified": {
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 2,
    "הפניה לרשומה אחרת — לא נתון": 2,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 2,
    "טיפוס מורכב — לא אחד מששת הסוגים": 1,
    "טקסט טכני (לא שם ולא תיאור)": 4,
    "כן/לא בודד": 7,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 11
  }
};
