/**
 * 👥 מנוע הצוות — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/platform · 34 חלקים · 6 מקומות · 2 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_PLATFORM: GenEngine = {
  "id": "platform",
  "name": "מנוע הצוות",
  "emoji": "👥",
  "from": "src/components/platform",
  "computes": "יודע מי בצוות, מה מותר לו ומה הוא עשה.",
  "entities": [
    "tasks",
    "audit"
  ],
  "parts": [
    {
      "num": 1,
      "name": "גזירת סלאג משם הארגון",
      "computes": "גזירת סלאג משם הארגון: תעתיק לטיני, אותיות-קטנות/ספרות/מקפים בלבד, ייחודי מול הרשימה (סיומת ‎-2, ‎-3 …).",
      "fn": "lib#slugify",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "סלאג חוקי",
      "computes": "סלאג חוקי — כמו orgSlugFromUrl (‏a-z0-9-, ‏2-40 תווים).",
      "fn": "lib#isValidSlug",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "קונפיג-הלידה של ארגון חדש",
      "computes": "קונפיג-הלידה של ארגון חדש (הכרעת ארכיטקט): ‏all-off — כל המודולים ‏false מפורש (לא \"חסר=דלוק\"!); הבעלים מדליק בלייב מה שסוכם בשיחה.",
      "fn": "lib#allOffConfig",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "קישור הלקוח",
      "computes": "קישור הלקוח — ‏{origin}{base}?org={slug} (לכפתור \" העתק קישור\").",
      "fn": "lib#orgLink",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "נירמול מייל",
      "computes": "נירמול מייל — trim + אותיות-קטנות (זהה להשוואת ה-Rules).",
      "fn": "lib#normEmail",
      "takes": [],
      "gives": null
    },
    {
      "num": 6,
      "name": "קוד-הזמנה קצר ודטרמיניסטי מ-seed",
      "computes": "קוד-הזמנה קצר ודטרמיניסטי מ-seed (הקורא מספק אנטרופיה: slug+חותם-זמן).",
      "fn": "lib#genJoinCode",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "קישור-הזמנה לעובד/ת",
      "computes": "קישור-הזמנה לעובד/ת — ‏{origin}{base}?org={slug}&join={code}.",
      "fn": "lib#orgJoinLink",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "קוד-הזמנה מלא לעובד/ת",
      "computes": "קוד-הזמנה מלא לעובד/ת (ORGADMIN — \"קוד מהבוס\"): ‏{slug}.{code}.",
      "fn": "lib#orgJoinFullCode",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "פירוק \"קוד מהבוס\" ל-{slug, code}",
      "computes": "פירוק \"קוד מהבוס\" ל-{slug, code}.",
      "fn": "lib#parseJoinFullCode",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "האם המייל הוא מנהל-הארגון",
      "computes": "האם המייל הוא מנהל-הארגון (מואצל)?",
      "fn": "lib#isOrgManager",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "תקופה-הכפתורים שהמנהל בכלל רואה באשף-הייחודי שלו = **רק המודולים…",
      "computes": "תקופה-הכפתורים שהמנהל בכלל רואה באשף-הייחודי שלו = **רק המודולים שהבעלים הדליק לארגון** (הכרעת-בעלים: \"רק את הכפתורים שאני הדלקתי\"; מה שלא-שודרג/לא-נקנה לא…",
      "fn": "lib#orgEnabledModules",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "תקופה **תת-הדגלים** שהמנהל יכול לחלק לעובדות = דגלים ש**דלוקים…",
      "computes": "תקופה **תת-הדגלים** שהמנהל יכול לחלק לעובדות = דגלים ש**דלוקים בארגון** (לא-false) ושהמודול-האב שלהם (אם הוא מודול-אמיתי) דלוק.",
      "fn": "lib#orgEnabledFeatures",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "האם המייל חבר בארגון",
      "computes": "האם המייל חבר בארגון (עובד/ת מאושרת או מנהל)?",
      "fn": "lib#isMember",
      "takes": [],
      "gives": null
    },
    {
      "num": 14,
      "name": "כרטיס-העובד של מייל",
      "computes": "כרטיס-העובד של מייל (דריסות אישיות).",
      "fn": "lib#overrideOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "האם המפתח הוא יכולת-הדלקה-פר-עובד",
      "computes": "האם המפתח הוא יכולת-הדלקה-פר-עובד (מכבד בכרטיס-העובד).",
      "fn": "lib#isGrantableFeature",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "הקונפיג האפקטיבי של עובד/ת = קונפיג-הארגון **בניכוי** מה שהמנהל…",
      "computes": "הקונפיג האפקטיבי של עובד/ת = קונפיג-הארגון **בניכוי** מה שהמנהל כיבה לה בכרטיס-העובד (רק הגבלה — לא מדליקה מה שהארגון כיבה).",
      "fn": "lib#effectiveConfigFor",
      "takes": [],
      "gives": null
    },
    {
      "num": 17,
      "name": "ייעודי-התרומה שהעובד/ת רשאי/ת לראות",
      "computes": "ייעודי-התרומה שהעובד/ת רשאי/ת לראות (בקשת-בעלים 13.8 ג') — טהור.",
      "fn": "lib#allowedDesignationsFor",
      "takes": [],
      "gives": null
    },
    {
      "num": 18,
      "name": "מי מנפיק קבלות-§46",
      "computes": "מי מנפיק קבלות-§46 (הכרעת-בעלים 14.8: \"רק המנהל מפיק קבלות\") — טהור.",
      "fn": "lib#canIssueReceipt",
      "takes": [],
      "gives": null
    },
    {
      "num": 19,
      "name": "אישור בקשת-הצטרפות",
      "computes": "אישור בקשת-הצטרפות (טהור) — מוסיף ל-members (בלי כפילויות, מנורמל).",
      "fn": "lib#approveMember",
      "takes": [],
      "gives": null
    },
    {
      "num": 20,
      "name": "שם-תצוגה של עובד/ת",
      "computes": "שם-תצוגה של עובד/ת — memberConfigs[email].displayName, אחרת המייל עצמו.",
      "fn": "lib#memberDisplayName",
      "takes": [],
      "gives": null
    },
    {
      "num": 21,
      "name": "מפת מייל⇒שם-תצוגה",
      "computes": "מפת מייל⇒שם-תצוגה (רק למי שהוגדר שם) — לסטור, כדי שכל המסכים יציגו שם במקום מייל.",
      "fn": "lib#memberNamesOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 22,
      "name": "תווית \"מי\"",
      "computes": "תווית \"מי\" — שם-תצוגה אם ידוע, אחרת המחרוזת כמות-שהיא (מייל/'—').",
      "fn": "lib#whoLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 23,
      "name": "חלק בלי הסבר (setEmployeeOverride)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#setEmployeeOverride",
      "takes": [],
      "gives": null
    },
    {
      "num": 24,
      "name": "הסרת עובד/ת",
      "computes": "הסרת עובד/ת (טהור) — מוציא מ-members ומ-memberConfigs.",
      "fn": "lib#removeMember",
      "takes": [],
      "gives": null
    },
    {
      "num": 25,
      "name": "מפת-המודולים שהפרופיל כותב לכרטיס-העובד",
      "computes": "מפת-המודולים שהפרופיל כותב לכרטיס-העובד: ‏false לכל מודול-מוסתר שנמצא בתקרת-הארגון; פרופיל ריק (גישה-מלאה) ⇒ מפה ריקה = הכול בירושה.",
      "fn": "rolePresets#presetModules",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "האם כרטיס-העובד תואם כרגע את הפרופיל",
      "computes": "האם כרטיס-העובד תואם כרגע את הפרופיל (להדגשת הצ'יפ הפעיל).",
      "fn": "rolePresets#presetMatches",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "חץ-מגמה",
      "computes": "חץ-מגמה: שבוע-נוכחי מול שבוע-קודם.",
      "fn": "teamIntel#trendOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 28,
      "name": "מודיעין לעובד/ת אחת",
      "computes": "מודיעין לעובד/ת אחת — סריקה אחת על הלוג.",
      "fn": "teamIntel#workerIntel",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 29,
      "name": "מודיעין-צוות",
      "computes": "מודיעין-צוות: כרטיס לכל מייל, ממוין לפי פעילות-השבוע (ואז סך-הכול).",
      "fn": "teamIntel#teamIntel",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 30,
      "name": "שורת-סיכום לצוות",
      "computes": "שורת-סיכום לצוות: סך-פעולות-השבוע + המובילה + כמה פעילים היום.",
      "fn": "teamIntel#teamSummary",
      "takes": [],
      "gives": null
    },
    {
      "num": 31,
      "name": "העובדות השקטות",
      "computes": "העובדות השקטות — quietDays ≥ הסף וגם לא-חדשות-לגמרי בלי כלום מעולם.",
      "fn": "teamIntel#quietWorkers",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 32,
      "name": "התקדמות מול יעד-שבועי",
      "computes": "התקדמות מול יעד-שבועי: אחוז-חסום-ל-100 + סטטוס.",
      "fn": "teamIntel#goalProgress",
      "takes": [
        "amount"
      ],
      "gives": null
    },
    {
      "num": 33,
      "name": "שורות-CSV לדוח-הצוות",
      "computes": "שורות-CSV לדוח-הצוות (שורה ראשונה = כותרות) — לייצוא דרך downloadCsv.",
      "fn": "teamIntel#teamCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 34,
      "name": "תווית \"לפני N ימים / היום / אתמול\"",
      "computes": "תווית \"לפני N ימים / היום / אתמול\" — דטרמיניסטית מול todayIso.",
      "fn": "teamIntel#agoLabel",
      "takes": [
        "times"
      ],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "platform.tasks.title",
      "engine": "platform",
      "name": "הכותרת של כל משימה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tasks",
        "path": "title",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "platform.tasks.createdAt",
      "engine": "platform",
      "name": "מועד היצירה של כל משימה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tasks",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "platform.tasks.doneAt",
      "engine": "platform",
      "name": "מועד הסיום של כל משימה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "tasks",
        "path": "doneAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "platform.tasks.note",
      "engine": "platform",
      "name": "ההערה של כל משימה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "tasks",
        "path": "note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "platform.audit.@seq",
      "engine": "platform",
      "name": "הרשומות, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "audit",
        "path": "",
        "dateField": "at",
        "kind": "sequence"
      }
    },
    {
      "id": "platform.audit.at",
      "engine": "platform",
      "name": "הרגע של כל רשומה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "audit",
        "path": "at",
        "unit": "date",
        "kind": "times"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "platform.fn.teamIntel",
      "engine": "platform",
      "name": "מודיעין-צוות",
      "kind": "sequence",
      "fn": "teamIntel#teamIntel",
      "takes": "AuditEntry[]"
    },
    {
      "id": "platform.fn.quietWorkers",
      "engine": "platform",
      "name": "העובדות השקטות",
      "kind": "sequence",
      "fn": "teamIntel#quietWorkers",
      "takes": "WorkerIntel[]"
    }
  ],
  "unclassified": {
    "הפניה לרשומה אחרת — לא נתון": 2,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 1,
    "טיפוס מורכב — לא אחד מששת הסוגים": 1,
    "טקסט טכני (לא שם ולא תיאור)": 5,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 1
  }
};
