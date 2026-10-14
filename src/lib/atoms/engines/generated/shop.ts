/**
 * 🛍️ מנוע החנות — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/shop · 29 חלקים · 47 מקומות · 10 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_SHOP: GenEngine = {
  "id": "shop",
  "name": "מנוע החנות",
  "emoji": "🛍️",
  "from": "src/components/shop",
  "computes": "יודע מה במלאי, למי מגיע ומה מומש.",
  "entities": [
    "shopItems",
    "shopProducts",
    "shopStores",
    "shopCriteria",
    "shopAssignments",
    "shopEvents",
    "shopIntakes"
  ],
  "parts": [
    {
      "num": 1,
      "name": "המימושים החיים של שיוך",
      "computes": "המימושים החיים של שיוך — מוחרגים המבוטלים (voidedAt).",
      "fn": "lib#liveRedemptions",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 2,
      "name": "פענוח רכיב לפריט שלו + דריסות",
      "computes": "פענוח רכיב לפריט שלו + דריסות.",
      "fn": "lib#itemOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "האם החג רלוונטי לפריט מתנת-חג",
      "computes": "האם החג רלוונטי לפריט מתנת-חג — ריק/חסר = כל החגים (הכרעה 17).",
      "fn": "lib#holidayAllowed",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "הנותר במלאי של פריט",
      "computes": "הנותר במלאי של פריט — לב הכרעה 18: מלאי הפריט פחות **כל** המימושים החיים של רכיבים המצביעים עליו בכל החבילות.",
      "fn": "lib#itemRemaining",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 5,
      "name": "המחיר הסמלי אחרי הנחות קריטריונים",
      "computes": "המחיר הסמלי אחרי הנחות קריטריונים — ההנחה **הגבוהה** מבין קריטריוני המוטב (לא מצטבר — ברירת ארכיטקט, הבעלים רשאי להכריע אחרת), עיגול לש\"ח שלם, לעולם לא שלילי.",
      "fn": "lib#effectivePrice",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 6,
      "name": "אחוז ההנחה האפקטיבי",
      "computes": "אחוז ההנחה האפקטיבי — הגבוה מבין קריטריוני המוטב (0 כשאין).",
      "fn": "lib#maxDiscountPct",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 7,
      "name": "החגים בתקופה הימים הקרוב",
      "computes": "החגים בתקופה הימים הקרוב — סריקה יום-יום עם holidayOf; שם-חג ייחודי (חג רב-ימי מוחזר ביומו הראשון בתקופה).",
      "fn": "lib#upcomingHolidays",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 8,
      "name": "כל שמות החגים הייחודיים",
      "computes": "כל שמות החגים הייחודיים — סריקת שנה עברית מלאה (400 יום מעוגן קבוע, דטרמיניסטי) עם holidayOf; ממורש ברמת המודול (הרשימה קבועה).",
      "fn": "lib#holidayNames",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "האם רכיב מומש בשיוך",
      "computes": "האם רכיב מומש בשיוך.",
      "fn": "lib#assignmentRedeemed",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "הנותר במלאי לרכיב",
      "computes": "הנותר במלאי לרכיב — null כשאין מעקב (stock=undefined); אחרת stock פחות סך מימושי הרכיב בכל שיוכי המוצר, קטום ב-0.",
      "fn": "lib#componentRemaining",
      "takes": [
        "amount"
      ],
      "gives": "amount"
    },
    {
      "num": 11,
      "name": "תאריך פקיעת קופון",
      "computes": "תאריך פקיעת קופון — '' כשאין validDays (או 0) או שאין לשיוך since.",
      "fn": "lib#couponExpiry",
      "takes": [],
      "gives": "times"
    },
    {
      "num": 12,
      "name": "רשימת הטיפול המשרדי",
      "computes": "רשימת הטיפול המשרדי — ממוינת לפי סוג: מתנות-חג שמועדן קרב → פגישות שטרם מומשו → קופונים שטרם מומשו → קופונים שפקעו → מלאי שאזל.",
      "fn": "lib#needsCare",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 13,
      "name": "קליטות מתכלות שפגו/עומדות-לפוג",
      "computes": "קליטות מתכלות שפגו/עומדות-לפוג (SHOP10) — טהור.",
      "fn": "lib#expiringIntakes",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 14,
      "name": "הפגישות הקרובות",
      "computes": "הפגישות הקרובות — אירועי meeting פתוחים (done=false) בתקופה הימים (ברירת מחדל 2 = היום ומחר), ממוינים תאריך+שעה (בלי שעה — לסוף היום), עם שם המוטב ושם החדר.",
      "fn": "lib#upcomingMeetings",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 15,
      "name": "Σ השווי שנמסר בפועל",
      "computes": "Σ השווי שנמסר בפועל (value של המימושים החיים — מבוטלים מוחרגים).",
      "fn": "lib#givenValue",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 16,
      "name": "Σ מה ששולם בפועל במחיר הסמלי",
      "computes": "Σ מה ששולם בפועל במחיר הסמלי (מימושים חיים בלבד).",
      "fn": "lib#collectedPaid",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 17,
      "name": "הסבסוד הכולל",
      "computes": "הסבסוד הכולל — שווי שנמסר פחות מה ששולם.",
      "fn": "lib#subsidyTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 18,
      "name": "השיוכים של מוצר נתון",
      "computes": "השיוכים של מוצר נתון.",
      "fn": "lib#productAssignments",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 19,
      "name": "תיקון",
      "computes": "תיקון (swarm-audit): \"האם הרכיב מומש עכשיו\" — מתנת-חג נבחנת מול מופע-החג הקרוב **פר-שנה-עברית** (כמו needsCare ותג-הכרטיס), לא \"מומש אי-פעם\": מתנה שנמסרה…",
      "fn": "lib#componentRedeemedNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 20,
      "name": "סינון+מיון השיוכים",
      "computes": "סינון+מיון השיוכים: q על שם המשפחה/החבילה (smartFilter); 'pending' (ברירת המחדל) = יש-רכיב-ממתין קודם, ובתוכם since עולה — הכי-ותיק-ממתין ראשון; ממומש-כולו…",
      "fn": "lib#filterAssignments",
      "takes": [
        "text",
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 21,
      "name": "סינון החבילות בקטלוג",
      "computes": "סינון החבילות בקטלוג — q על שם/תיאור; פעילות בלבד (רשות).",
      "fn": "lib#filterProducts",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 22,
      "name": "סינון הפריטים",
      "computes": "סינון הפריטים — q על השם; מצב מלאי: out=אזל · low=נמוך (≤2, כשיש מעקב) · untracked=ללא מעקב.",
      "fn": "lib#filterItems",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 23,
      "name": "סינון מימושי שיוך",
      "computes": "סינון מימושי שיוך — תקופה כוללני (dateInRange המשותף); includeVoided=true (ברירת שקיפות).",
      "fn": "lib#filterRedemptions",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 24,
      "name": "יומן הקליטות",
      "computes": "יומן הקליטות — חדש-ראשון (תאריך יורד, שוויון = סדר ההזנה שכבר חדש-ראשון) + סה\"כ עלויות (תרומות-בעין = 0, לא מוסיפות).",
      "fn": "lib#intakeLog",
      "takes": [],
      "gives": null
    },
    {
      "num": 25,
      "name": "המשפחות הזכאיות לשיוך המוני",
      "computes": "המשפחות הזכאיות לשיוך המוני: משפחות פעילות שיש להן — ברמת שיוך קיים כלשהו — את **כל** הקריטריונים שנבחרו (איחוד על-פני השיוכים), או כל המשפחות הפעילות כשלא…",
      "fn": "lib#eligibleFamilies",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "רשימת חלוקה מודפסת לחבילה",
      "computes": "רשימת חלוקה מודפסת לחבילה — משפחה, כתובת, טלפון, רכיבים, עמודת \" נמסר\".",
      "fn": "lib#distributionListLines",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "שורות CSV של כל המימושים",
      "computes": "שורות CSV של כל המימושים — תאריך, מוטב, פריט, חבילה, שולם, שווי, אישור, מבוטל.",
      "fn": "lib#redemptionsCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 28,
      "name": "\"משפחת X",
      "computes": "\"משפחת X — שם הבן/בת\" (בלי בן/בת ספציפי/ת — שם המשפחה בלבד).",
      "fn": "lib#beneficiaryLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 29,
      "name": "ספירת רכיבי מוצר לפי סוג",
      "computes": "ספירת רכיבי מוצר לפי סוג — לתצוגת כרטיסי הקטלוג.",
      "fn": "lib#componentCounts",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "shop.shopItems.name",
      "engine": "shop",
      "name": "השם של כל פריט",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopItems",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopItems.value",
      "engine": "shop",
      "name": "השווי של כל פריט",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopItems",
        "path": "value",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopItems.stock",
      "engine": "shop",
      "name": "המלאי של כל פריט",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "shopItems",
        "path": "stock",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopItems.minStock",
      "engine": "shop",
      "name": "המלאי המינימלי של כל פריט",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "shopItems",
        "path": "minStock",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopItems.waits[]@seq",
      "engine": "shop",
      "name": "רשימת ההמתנה של כל פריט, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopItems",
        "path": "waits[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "shop.shopItems.waits[].date",
      "engine": "shop",
      "name": "מועדי רשימת ההמתנה של כל פריט",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopItems",
        "path": "waits[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "shop.shopItems.waits[].note",
      "engine": "shop",
      "name": "ההערה ברשימת ההמתנה של כל פריט",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopItems",
        "path": "waits[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopItems.notes",
      "engine": "shop",
      "name": "ההערות של כל פריט",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopItems",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopProducts.name",
      "engine": "shop",
      "name": "השם של כל חבילה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopProducts.desc",
      "engine": "shop",
      "name": "התיאור של כל חבילה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "desc",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopProducts.components[].label",
      "engine": "shop",
      "name": "התווית ברכיבים של כל חבילה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "components[].label",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopProducts.components[].value",
      "engine": "shop",
      "name": "השווי ברכיבים של כל חבילה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "components[].value",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopProducts.components[].stock",
      "engine": "shop",
      "name": "המלאי ברכיבים של כל חבילה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "components[].stock",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopProducts.components[].notes",
      "engine": "shop",
      "name": "ההערות ברכיבים של כל חבילה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "components[].notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopProducts.notes",
      "engine": "shop",
      "name": "ההערות של כל חבילה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopProducts",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopStores.name",
      "engine": "shop",
      "name": "השם של כל חנות שותפה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopStores",
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopStores.notes",
      "engine": "shop",
      "name": "ההערות של כל חנות שותפה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopStores",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopCriteria.name",
      "engine": "shop",
      "name": "השם של כל תנאי זכאות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopCriteria",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopCriteria.notes",
      "engine": "shop",
      "name": "ההערות של כל תנאי זכאות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopCriteria",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopAssignments.notes",
      "engine": "shop",
      "name": "ההערות של כל שיוך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.redemptions[]@seq",
      "engine": "shop",
      "name": "המימושים של כל שיוך, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "redemptions[]",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.redemptions[].voidedAt",
      "engine": "shop",
      "name": "מועד ביטול מתועד במימושים של כל שיוך",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "redemptions[].voidedAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.redemptions[].date",
      "engine": "shop",
      "name": "מועדי המימושים של כל שיוך",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "redemptions[].date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.redemptions[].value",
      "engine": "shop",
      "name": "השווי במימושים של כל שיוך",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "redemptions[].value",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.redemptions[].note",
      "engine": "shop",
      "name": "ההערה במימושים של כל שיוך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "redemptions[].note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[]@seq",
      "engine": "shop",
      "name": "החיובים המתוכננים של כל שיוך, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[]",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].date",
      "engine": "shop",
      "name": "מועדי החיובים המתוכננים של כל שיוך",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].amount",
      "engine": "shop",
      "name": "סכומי החיובים המתוכננים של כל שיוך",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].amount",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].method",
      "engine": "shop",
      "name": "אמצעי התשלום בחיובים המתוכננים של כל שיוך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].method",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].cat",
      "engine": "shop",
      "name": "הקטגוריה בחיובים המתוכננים של כל שיוך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].cat",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].cancelledAt",
      "engine": "shop",
      "name": "מועד הביטול בחיובים המתוכננים של כל שיוך",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].cancelledAt",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].note",
      "engine": "shop",
      "name": "ההערה בחיובים המתוכננים של כל שיוך",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].note",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopAssignments.plannedCharges[].shopValue",
      "engine": "shop",
      "name": "השווי בחיובים המתוכננים של כל שיוך",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopAssignments",
        "path": "plannedCharges[].shopValue",
        "kind": "amount"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.@?waiting",
      "engine": "shop",
      "name": "אירועי החנות שעוד לא סומנו כבוצעו",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "",
        "done": "done",
        "since": "date",
        "kind": "waiting"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.@seq",
      "engine": "shop",
      "name": "אירועי החנות, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.roomId@seq",
      "engine": "shop",
      "name": "אירועי החנות של כל חדר, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "",
        "dateField": "date",
        "groupBy": "roomId",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.title",
      "engine": "shop",
      "name": "הכותרת של כל אירוע חנות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "title",
        "echo": true,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.date",
      "engine": "shop",
      "name": "התאריך של כל אירוע חנות",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "date",
        "unit": "date",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.time",
      "engine": "shop",
      "name": "השעה של כל אירוע חנות",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "time",
        "unit": "clock",
        "kind": "times"
      },
      "personal": true
    },
    {
      "id": "shop.shopEvents.notes",
      "engine": "shop",
      "name": "ההערות של כל אירוע חנות",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopEvents",
        "path": "notes",
        "echo": false,
        "kind": "text"
      },
      "personal": true
    },
    {
      "id": "shop.shopIntakes.@seq",
      "engine": "shop",
      "name": "קליטות המלאי, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "shop.shopIntakes.itemId@seq",
      "engine": "shop",
      "name": "קליטות המלאי של כל פריט, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "",
        "dateField": "date",
        "groupBy": "itemId",
        "kind": "sequence"
      }
    },
    {
      "id": "shop.shopIntakes.date",
      "engine": "shop",
      "name": "התאריך של כל קליטה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "shop.shopIntakes.qty",
      "engine": "shop",
      "name": "הכמות של כל קליטה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "qty",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopIntakes.cost",
      "engine": "shop",
      "name": "העלות של כל קליטה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "cost",
        "kind": "amount"
      }
    },
    {
      "id": "shop.shopIntakes.note",
      "engine": "shop",
      "name": "ההערה של כל קליטה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "shop.shopIntakes.expiry",
      "engine": "shop",
      "name": "מועד תאריך תפוגה לאצווה של כל קליטה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "shopIntakes",
        "path": "expiry",
        "unit": "date",
        "kind": "times"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "shop.fn.liveRedemptions",
      "engine": "shop",
      "name": "המימושים החיים של שיוך",
      "kind": "sequence",
      "fn": "lib#liveRedemptions",
      "takes": "ShopAssignment"
    },
    {
      "id": "shop.fn.itemRemaining",
      "engine": "shop",
      "name": "הנותר במלאי של פריט",
      "kind": "amount",
      "fn": "lib#itemRemaining",
      "takes": "Db"
    },
    {
      "id": "shop.fn.effectivePrice",
      "engine": "shop",
      "name": "המחיר הסמלי אחרי הנחות קריטריונים",
      "kind": "amount",
      "fn": "lib#effectivePrice",
      "takes": "readonly ShopCriterion[]"
    },
    {
      "id": "shop.fn.maxDiscountPct",
      "engine": "shop",
      "name": "אחוז ההנחה האפקטיבי",
      "kind": "amount",
      "fn": "lib#maxDiscountPct",
      "takes": "readonly ShopCriterion[]"
    },
    {
      "id": "shop.fn.componentRemaining",
      "engine": "shop",
      "name": "הנותר במלאי לרכיב",
      "kind": "amount",
      "fn": "lib#componentRemaining",
      "takes": "readonly ShopAssignment[]"
    },
    {
      "id": "shop.fn.couponExpiry",
      "engine": "shop",
      "name": "תאריך פקיעת קופון",
      "kind": "times",
      "fn": "lib#couponExpiry",
      "takes": "ShopAssignment"
    },
    {
      "id": "shop.fn.givenValue",
      "engine": "shop",
      "name": "Σ השווי שנמסר בפועל",
      "kind": "amount",
      "fn": "lib#givenValue",
      "takes": "readonly ShopAssignment[]"
    },
    {
      "id": "shop.fn.collectedPaid",
      "engine": "shop",
      "name": "Σ מה ששולם בפועל במחיר הסמלי",
      "kind": "amount",
      "fn": "lib#collectedPaid",
      "takes": "readonly ShopAssignment[]"
    },
    {
      "id": "shop.fn.subsidyTotal",
      "engine": "shop",
      "name": "הסבסוד הכולל",
      "kind": "amount",
      "fn": "lib#subsidyTotal",
      "takes": "readonly ShopAssignment[]"
    },
    {
      "id": "shop.fn.filterRedemptions",
      "engine": "shop",
      "name": "סינון מימושי שיוך",
      "kind": "sequence",
      "fn": "lib#filterRedemptions",
      "takes": "ShopAssignment"
    }
  ],
  "unclassified": {
    "אין שם עברי לשדה": 1,
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 6,
    "הפניה לרשומה אחרת — לא נתון": 24,
    "טיפוס מורכב — לא אחד מששת הסוגים": 1,
    "טקסט טכני (לא שם ולא תיאור)": 6,
    "כן/לא בודד": 4,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 6,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 3,
    "רשימה — נבדקת לפי הפריט שבה": 1
  }
};
