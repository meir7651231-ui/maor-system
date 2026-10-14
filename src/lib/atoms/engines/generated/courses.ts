/**
 * 🎨 מנוע החוגים — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/courses · 83 חלקים · 61 מקומות · 8 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_COURSES: GenEngine = {
  "id": "courses",
  "name": "מנוע החוגים",
  "emoji": "🎨",
  "from": "src/components/courses",
  "computes": "יודע מי רשום לאיזה חוג, מי הגיע, מי חסר ומי חייב.",
  "entities": [
    "enrollments",
    "courses",
    "teachers"
  ],
  "parts": [
    {
      "num": 1,
      "name": "אנשי-הקשר של החוג",
      "computes": "אנשי-הקשר של החוג — רוסטר פעיל/מוקפא (לא wait/ended), מדודפים לפי-טלפון.",
      "fn": "broadcast#classContacts",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "נוסח-פתיחה לברירת-מחדל להודעת-כיתה",
      "computes": "נוסח-פתיחה לברירת-מחדל להודעת-כיתה.",
      "fn": "broadcast#defaultClassMessage",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "רשימת-טלפונים להעתקה",
      "computes": "רשימת-טלפונים להעתקה (מדולגים ריקים).",
      "fn": "broadcast#classPhonesText",
      "takes": [],
      "gives": null
    },
    {
      "num": 4,
      "name": "כל השיבוצים הפעילים/מוקפאים עם יתרת-חוב פתוחה, מועשרים בשם/טלפון/חוג, מהגבוה",
      "computes": "כל השיבוצים הפעילים/מוקפאים עם יתרת-חוב פתוחה, מועשרים בשם/טלפון/חוג, מהגבוה.",
      "fn": "collection#collectionList",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "סך-כל החוב הפתוח",
      "computes": "סך-כל החוב הפתוח.",
      "fn": "collection#collectionTotal",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 6,
      "name": "שורות-CSV לייצוא מרכז-הגבייה",
      "computes": "שורות-CSV לייצוא מרכז-הגבייה (כותרת + נתונים).",
      "fn": "collection#collectionCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 7,
      "name": "נוסח-תזכורת ידידותי לגבייה",
      "computes": "נוסח-תזכורת ידידותי לגבייה (WhatsApp) — לא קבלה, רק תזכורת.",
      "fn": "collection#collectionMessage",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "דשבורד-חוגים מלא",
      "computes": "דשבורד-חוגים מלא — שורה-פר-חוג + סיכומים + החוגים-המבוקשים.",
      "fn": "dashboard#courseDashboard",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "שורות-CSV לייצוא הדשבורד",
      "computes": "שורות-CSV לייצוא הדשבורד (כותרת + שורה-פר-חוג).",
      "fn": "dashboard#dashboardCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "תצוגת תאריך DD/MM/YYYY",
      "computes": "תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO).",
      "fn": "lib#fmtDate",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 11,
      "name": "חלק בלי הסבר (isoToday)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#isoToday",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "ברירת-מחדל דינמית לתקופה תאריכי חוג",
      "computes": "ברירת-מחדל דינמית לתקופה תאריכי חוג — שנת-הלימודים הנוכחית (1.9 עד 31.7 שאחריה).",
      "fn": "lib#defaultCourseDates",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "מונה-נוכחות חודשי",
      "computes": "מונה-נוכחות חודשי (#10, הכרעת בעלים \"לאפס ולשמור בדוחות\"): מספר תאריכי-הנוכחות (presents) בחודש הקלנדרי של todayIso.",
      "fn": "lib#presentsInMonth",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 14,
      "name": "ולידציית תקופה תאריכי החוג",
      "computes": "ולידציית תקופה תאריכי החוג — מחזיר הודעת שגיאה או null.",
      "fn": "lib#courseDateError",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "גיל בשנים מלאות מתאריך לידה, או null אם אין…",
      "computes": "גיל בשנים מלאות מתאריך לידה, או null אם אין תאריך.",
      "fn": "lib#ageOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 16,
      "name": "המפגשים בפועל",
      "computes": "המפגשים בפועל — fallback למפגש יחיד מהשדות הראשיים (כמו sessionsOf במקור).",
      "fn": "lib#sessionsOf",
      "takes": [],
      "gives": "times"
    },
    {
      "num": 17,
      "name": "הצעת מספר קבוצות מטקסט קהל-היעד",
      "computes": "הצעת מספר קבוצות מטקסט קהל-היעד (P3 פריט 1; לגאסי: regex 'קבוצות|פעמים').",
      "fn": "lib#groupsHintFromAudience",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 18,
      "name": "סינון תפקיד-מורה",
      "computes": "סינון תפקיד-מורה (P3 פריט 15, הכרעה 2): teacherId ⇒ רק החוגים שלה; null (אין תפקיד/אין ענן) ⇒ הכל, כהתנהגות של היום.",
      "fn": "lib#coursesOfTeacher",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 19,
      "name": "מצב החדרים ברגע נתון",
      "computes": "מצב החדרים ברגע נתון — now מוזרק (טוהר): חדר פעיל תפוס כשמפגש של חוג בחדר חל באותו יום-שבוע והשעה בתוך [תחילת המפגש, +משך המשבצת); ברירת המחדל 60 דק׳ (slot של…",
      "fn": "lib#roomsNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 20,
      "name": "תווית קבוצה",
      "computes": "תווית קבוצה — label או \"קבוצה N\" לפי המיקום.",
      "fn": "lib#groupLabelOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 21,
      "name": "מיפוי-שיוכים בהסרת מפגש",
      "computes": "מיפוי-שיוכים בהסרת מפגש (#8/#9): כשמסירים מפגש באינדקס removeIdx, תוויות \"קבוצה N\" הפוזיציוניות של המפגשים שאחריו זזות (N⇒N-1) — שיבוץ שנשמר כ\"קבוצה 3\" היה…",
      "fn": "lib#groupRemapOnRemoval",
      "takes": [],
      "gives": null
    },
    {
      "num": 22,
      "name": "אפשרויות שיוך קבוצה",
      "computes": "אפשרויות שיוך קבוצה — רק כשיש יותר ממפגש אחד.",
      "fn": "lib#groupOptionsOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 23,
      "name": "שם המסלול",
      "computes": "שם המסלול (יחיד) — פורט מ-planWord באב-הטיפוס.",
      "fn": "lib#planWord",
      "takes": [],
      "gives": null
    },
    {
      "num": 24,
      "name": "סיומת תקופת המחיר",
      "computes": "סיומת תקופת המחיר — \"לחודש\" / \"לחצי שנה\" / \"לשנה\" (פורט מ-pricePer).",
      "fn": "lib#priceSuffix",
      "takes": [],
      "gives": null
    },
    {
      "num": 25,
      "name": "תווית + צבעי מסלול התמחור",
      "computes": "תווית + צבעי מסלול התמחור.",
      "fn": "lib#modelMeta",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "תווית תקופה קריאה",
      "computes": "תווית תקופה קריאה — 'מספר חודשים' מציג את המספר.",
      "fn": "lib#termLabel",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "מספר-השיעורים בתקופה לפי התדירות שנבחרה",
      "computes": "מספר-השיעורים בתקופה לפי התדירות שנבחרה — טהור.",
      "fn": "lib#lessonsInTerm",
      "takes": [
        "amount"
      ],
      "gives": null
    },
    {
      "num": 28,
      "name": "מחיר-לשיעור לפי רמת-ההנחה שנבחרה",
      "computes": "מחיר-לשיעור לפי רמת-ההנחה שנבחרה (fallback ל-lessonPrice המלא).",
      "fn": "lib#lessonPriceForTier",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 29,
      "name": "רמות-ההנחה הזמינות לחוג פר-שיעור",
      "computes": "רמות-ההנחה הזמינות לחוג פר-שיעור — רק אלו עם מחיר+שם.",
      "fn": "lib#lessonTierOptions",
      "takes": [],
      "gives": null
    },
    {
      "num": 30,
      "name": "תמחור משוקלל",
      "computes": "תמחור משוקלל — טהור.",
      "fn": "lib#weightedQuote",
      "takes": [],
      "gives": null
    },
    {
      "num": 31,
      "name": "תמחור משוקלל מתוך שדות-שיבוץ שמורים",
      "computes": "תמחור משוקלל מתוך שדות-שיבוץ שמורים (או null אם החוג אינו פר-שיעור / חסר תדירות).",
      "fn": "lib#enrollmentQuote",
      "takes": [],
      "gives": null
    },
    {
      "num": 32,
      "name": "סכום ששולם עד כה על השיבוץ",
      "computes": "סכום ששולם עד כה על השיבוץ — סכומים לא-מספריים (NaN מקלט פגום) נספרים כ-0.",
      "fn": "lib#paidOf",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 33,
      "name": "יתרת חוב",
      "computes": "יתרת חוב — max(0, סה\"כ-עסקה + חוב-מועבר-משנה-קודמת - שולם).",
      "fn": "lib#payBal",
      "takes": [],
      "gives": null
    },
    {
      "num": 34,
      "name": "יתרת-זכות",
      "computes": "יתרת-זכות — max(0, שולם - סה\"כ-עסקה - חוב-מועבר).",
      "fn": "lib#payCredit",
      "takes": [],
      "gives": null
    },
    {
      "num": 35,
      "name": "גוזר את סטטוס-התשלום מהנתונים בפועל",
      "computes": "גוזר את סטטוס-התשלום מהנתונים בפועל: • paidFull ידני ⇒ 'paid' (דריסה — לחוגים בלי סכום-עסקה, או תשלום חיצוני).",
      "fn": "lib#enrollmentPaidStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 36,
      "name": "מספר המשובצים התופסים מקום בקורס",
      "computes": "מספר המשובצים התופסים מקום בקורס — פעילים + מוקפאים.",
      "fn": "lib#enrollCount",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 37,
      "name": "שכפול-חוג לסמסטר-חדש",
      "computes": "שכפול-חוג לסמסטר-חדש — כל השדות עם id-חדש ותאריכים-חדשים, שם מסומן \"(עותק)\".",
      "fn": "lib#duplicateCourse",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 38,
      "name": "חיסורים-זכאים-להשלמה",
      "computes": "חיסורים-זכאים-להשלמה (makeup===true) — אופציונלית פר-חוג.",
      "fn": "lib#pendingMakeups",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 39,
      "name": "רשימת-ההמתנה של חוג",
      "computes": "רשימת-ההמתנה של חוג — status 'wait', לפי סדר-ההצטרפות (FIFO).",
      "fn": "lib#waitlistFor",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 40,
      "name": "המפגש הקרוב הבא של הקורס",
      "computes": "המפגש הקרוב הבא של הקורס (לזכאות השלמה בחיסור — 48 שעות).",
      "fn": "lib#nextSessionDate",
      "takes": [],
      "gives": null
    },
    {
      "num": 41,
      "name": "גיליון-נוכחות",
      "computes": "גיליון-נוכחות (roll-call) — שיבוצים פעילים/מוקפאים (לא שהסתיימו, לא רשימת-המתנה).",
      "fn": "lib#sheetRoster",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 42,
      "name": "סיכום-נוכחות ליום",
      "computes": "סיכום-נוכחות ליום: כמה מהרשימה מסומנים-נוכחים (presents כולל את התאריך).",
      "fn": "lib#sheetSummary",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 43,
      "name": "תוויות סטטוס שיבוץ",
      "computes": "תוויות סטטוס שיבוץ.",
      "fn": "lib#enrollStatusMeta",
      "takes": [],
      "gives": null
    },
    {
      "num": 44,
      "name": "תווית המסלול בשורת תלמיד",
      "computes": "תווית המסלול בשורת תלמיד — כולל הקפאה/סיום, חיסורים ויתרת חוב (כמו planLabel במקור).",
      "fn": "lib#planLabelOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 45,
      "name": "צ'יפ קטן בסגנון אחיד",
      "computes": "צ'יפ קטן בסגנון אחיד.",
      "fn": "lib#chipStyle",
      "takes": [],
      "gives": null
    },
    {
      "num": 46,
      "name": "אינדקס כיתה בסולם",
      "computes": "אינדקס כיתה בסולם — סובלני לגרשיים ולקידומת \"כיתה\"; לא מזוהה = ‎-1.",
      "fn": "lib#gradeIndex",
      "takes": [],
      "gives": null
    },
    {
      "num": 47,
      "name": "התאמת כיתה לחוג",
      "computes": "התאמת כיתה לחוג: אין תקופה לחוג או שכיתת הילד/ה לא מזוהה ⇒ מתאים (רך — לא מסתירים על סמך מידע חסר); אחרת נדרש בתוך [gradeMin, gradeMax].",
      "fn": "lib#gradeFits",
      "takes": [],
      "gives": null
    },
    {
      "num": 48,
      "name": "חלק בלי הסבר (courseFitsMember)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#courseFitsMember",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 49,
      "name": "אזהרת התנגשות לו\"ז",
      "computes": "אזהרת התנגשות לו\"ז — מפגשי חוג-היעד מול מפגשי השיבוצים הפעילים של הילד (אותו יום ואותה שעה).",
      "fn": "lib#scheduleClashText",
      "takes": [],
      "gives": null
    },
    {
      "num": 50,
      "name": "האם להציע \"＋ משפחה חדשה\" עבור השאילתה",
      "computes": "האם להציע \"＋ משפחה חדשה\" עבור השאילתה — ≥2 תווים ואין משפחה בשם זהה.",
      "fn": "lib#offerNewFamily",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 51,
      "name": "פתרון המשפחה לשיבוץ-חדש",
      "computes": "פתרון המשפחה לשיבוץ-חדש: id קיים ⇒ הקיימת; '__new' ⇒ דה-דופ לפי normName — שם קיים משתמש בקיימת (create=false), אחרת יש ליצור חדשה (create=true).",
      "fn": "lib#resolveEnrollFamily",
      "takes": [],
      "gives": null
    },
    {
      "num": 52,
      "name": "צעד אחד במכונת-המצבים של האישור הכפול",
      "computes": "צעד אחד במכונת-המצבים של האישור הכפול — טהור.",
      "fn": "lib#punchConfirmStep",
      "takes": [],
      "gives": null
    },
    {
      "num": 53,
      "name": "גלגל-החוגים · מצב-ידני",
      "computes": "גלגל-החוגים · מצב-ידני (17.8) — איזה קטע נמצא מתחת למחוג-העליון בזווית-סיבוב נתונה.",
      "fn": "lib#wheelIndexUnderPointer",
      "takes": [],
      "gives": null
    },
    {
      "num": 54,
      "name": "חוגים פעילים עם מפגש היום",
      "computes": "חוגים פעילים עם מפגש היום (יום-בשבוע מוזרק) ובתקופה-התאריכים.",
      "fn": "ops#coursesToday",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 55,
      "name": "שיבוצים עם יתרת-חוב פתוחה",
      "computes": "שיבוצים עם יתרת-חוב פתוחה (payBal>0), מהגבוה לנמוך.",
      "fn": "ops#debtors",
      "takes": [],
      "gives": null
    },
    {
      "num": 56,
      "name": "כרטיסיות פעילות שעומדות להסתיים",
      "computes": "כרטיסיות פעילות שעומדות להסתיים — נותרו ≤ סף (ברירת-מחדל 2), מהנמוך לגבוה.",
      "fn": "ops#punchLowList",
      "takes": [],
      "gives": null
    },
    {
      "num": 57,
      "name": "תלמידים בסיכון-נשירה",
      "computes": "תלמידים בסיכון-נשירה — צברו ≥ סף חיסורים (ברירת-מחדל 3), מהגבוה לנמוך.",
      "fn": "ops#dropoutRisk",
      "takes": [],
      "gives": null
    },
    {
      "num": 58,
      "name": "מדדי-על לקוקפיט",
      "computes": "מדדי-על לקוקפיט: חוגים-פעילים · שיבוצים-פעילים · תפוסה-ממוצעת%.",
      "fn": "ops#opsKpis",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 59,
      "name": "סך-כל פריטי-העבודה בקוקפיט",
      "computes": "סך-כל פריטי-העבודה בקוקפיט (למונה-הכללי).",
      "fn": "ops#opsTotal",
      "takes": [
        "times"
      ],
      "gives": "amount"
    },
    {
      "num": 60,
      "name": "כרטיס-הורה פר-ילד",
      "computes": "כרטיס-הורה פר-ילד (memberId) — סיכום החוגים-הפעילים שלו.",
      "fn": "parent#parentCard",
      "takes": [],
      "gives": null
    },
    {
      "num": 61,
      "name": "נוסח-שיתוף להורה",
      "computes": "נוסח-שיתוף להורה (WhatsApp/העתקה/הדפסה) — read-only, בלי לשון-קבלה.",
      "fn": "parent#parentCardText",
      "takes": [],
      "gives": null
    },
    {
      "num": 62,
      "name": "תווית שנת-לימודים עברית מתוך תאריך-פתיחה",
      "computes": "תווית שנת-לימודים עברית מתוך תאריך-פתיחה — למשל 2026-09-01 → \"תשפ״ז\".",
      "fn": "reenroll-lib#academicYearLabel",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 63,
      "name": "תווית שנת-הלימודים העברית **הבאה** אחרי תאריך-הפתיחה",
      "computes": "תווית שנת-הלימודים העברית **הבאה** אחרי תאריך-הפתיחה — למשל 2025-09-01 → \"תשפ״ז\".",
      "fn": "reenroll-lib#nextAcademicYearLabel",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 64,
      "name": "תאריכי השנה הבאה",
      "computes": "תאריכי השנה הבאה — הזזת start/end בשנה קדימה (שומר יום/חודש).",
      "fn": "reenroll-lib#nextYearDates",
      "takes": [],
      "gives": null
    },
    {
      "num": 65,
      "name": "ההחלטה הנוכחית של השיבוץ",
      "computes": "ההחלטה הנוכחית של השיבוץ (חסר = טרם הוחלט).",
      "fn": "reenroll-lib#renewOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 66,
      "name": "האם השיבוץ כבר נרשם לשנה הבאה",
      "computes": "האם השיבוץ כבר נרשם לשנה הבאה (יש קישור לשיבוץ-היעד).",
      "fn": "reenroll-lib#isRenewed",
      "takes": [],
      "gives": null
    },
    {
      "num": 67,
      "name": "\"מה היה בעבר\"",
      "computes": "\"מה היה בעבר\" — סיכום דטרמיניסטי פר-שיבוץ מהשדות הקיימים.",
      "fn": "reenroll-lib#enrollSummary",
      "takes": [],
      "gives": null
    },
    {
      "num": 68,
      "name": "בניית שורות-הרישום",
      "computes": "בניית שורות-הרישום — מצטרף member+course+summary לכל שיבוץ של \"השנה הנוכחית\".",
      "fn": "reenroll-lib#buildReenrollRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 69,
      "name": "מוני-התקדמות מעל שורות-הרישום",
      "computes": "מוני-התקדמות מעל שורות-הרישום.",
      "fn": "reenroll-lib#reenrollCounts",
      "takes": [],
      "gives": null
    },
    {
      "num": 70,
      "name": "מי מיועד לרישום המוני",
      "computes": "מי מיועד לרישום המוני — \"ממשיך\" שעדיין לא נרשם.",
      "fn": "reenroll-lib#renewTargets",
      "takes": [],
      "gives": null
    },
    {
      "num": 71,
      "name": "טיוטת-שיבוץ טהורה לשנה הבאה",
      "computes": "טיוטת-שיבוץ טהורה לשנה הבאה — מעתיקה מסלול/קבוצה/תמחור מהמקור, מאפסת היסטוריה (used/purchased/presents/absences/payments) ומסמנת פעיל מהיום.",
      "fn": "reenroll-lib#freshNextYearEnrollment",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 72,
      "name": "טיוטת-חוג טהורה לשנה הבאה",
      "computes": "טיוטת-חוג טהורה לשנה הבאה — עותק של החוג עם תאריכים מוזזים בשנה, תווית-שנה וקישור-לחוג-הקודם.",
      "fn": "reenroll-lib#nextYearCourseDraft",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 73,
      "name": "כל ההשתתפויות של תלמיד/ה לאורך הזמן",
      "computes": "כל ההשתתפויות של תלמיד/ה לאורך הזמן — שיבוץ אחר שיבוץ בכל החוגים והשנים, ממויין מהחדש לישן לפי תאריך-פתיחת-החוג (שובר-שוויון: enrolledAt).",
      "fn": "reenroll-lib#studentHistory",
      "takes": [],
      "gives": null
    },
    {
      "num": 74,
      "name": "טקסט קריא של ההיסטוריה",
      "computes": "טקסט קריא של ההיסטוריה (שורה להשתתפות) — לתדפיס/העתקה.",
      "fn": "reenroll-lib#studentHistoryText",
      "takes": [],
      "gives": null
    },
    {
      "num": 75,
      "name": "שורות CSV לרשימת-הרישום",
      "computes": "שורות CSV לרשימת-הרישום (כותרת + נתונים).",
      "fn": "reenroll-lib#reenrollCsvRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 76,
      "name": "טקסט-תדפיס קריא",
      "computes": "טקסט-תדפיס קריא (שורה לתלמיד/ה).",
      "fn": "reenroll-lib#reenrollListText",
      "takes": [],
      "gives": null
    },
    {
      "num": 77,
      "name": "תלמידים-בסיכון-נשירה מועשרים",
      "computes": "תלמידים-בסיכון-נשירה מועשרים — מהסיכון-הגבוה לנמוך.",
      "fn": "retention#dropoutInsights",
      "takes": [],
      "gives": null
    },
    {
      "num": 78,
      "name": "בונה-הפרומפט להצעת-התערבות",
      "computes": "בונה-הפרומפט להצעת-התערבות — טהור ונבדק; הודעת-פנייה חמה להורה (בלי אשמה).",
      "fn": "retention#interventionPrompt",
      "takes": [],
      "gives": null
    },
    {
      "num": 79,
      "name": "החוגים של המורה",
      "computes": "החוגים של המורה (teacherId על החוג).",
      "fn": "teacher#teacherCourses",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 80,
      "name": "מפגשי-היום של המורה",
      "computes": "מפגשי-היום של המורה — החוגים-שלה שיש להם מפגש היום, עם רוסטר וסיכום-נוכחות.",
      "fn": "teacher#teacherAgenda",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 81,
      "name": "השלמות-ממתינות בחוגי-המורה בלבד",
      "computes": "השלמות-ממתינות בחוגי-המורה בלבד (חיסורים-זכאים).",
      "fn": "teacher#teacherMakeups",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 82,
      "name": "מדדי-על למסך-המורה",
      "computes": "מדדי-על למסך-המורה.",
      "fn": "teacher#teacherKpis",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 83,
      "name": "דוח-חודשי למורה",
      "computes": "דוח-חודשי למורה — שורה פר (חוג × תלמיד): נוכחויות-בחודש + חיסורים-בחודש.",
      "fn": "teacher#teacherMonthCsvRows",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "courses.enrollments.@?waiting",
      "engine": "courses",
      "name": "השיבוצים שמחכים (ברשימת המתנה)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "",
        "status": {
          "field": "status",
          "open": [
            "wait"
          ]
        },
        "since": "enrolledAt",
        "kind": "waiting"
      }
    },
    {
      "id": "courses.enrollments.@seq",
      "engine": "courses",
      "name": "השיבוצים, לפי מועד ההרשמה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "",
        "dateField": "enrolledAt",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.memberId@seq",
      "engine": "courses",
      "name": "השיבוצים של כל ילד, לפי מועד ההרשמה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "",
        "dateField": "enrolledAt",
        "groupBy": "memberId",
        "kind": "sequence"
      },
      "personal": true
    },
    {
      "id": "courses.enrollments.courseId@seq",
      "engine": "courses",
      "name": "השיבוצים של כל חוג, לפי מועד ההרשמה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "",
        "dateField": "enrolledAt",
        "groupBy": "courseId",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.purchased",
      "engine": "courses",
      "name": "הניקובים שנקנו של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "purchased",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.used",
      "engine": "courses",
      "name": "הניקובים שנוצלו של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "used",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.absences[]@seq",
      "engine": "courses",
      "name": "החיסורים של כל שיבוץ, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "absences[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.absences[].date",
      "engine": "courses",
      "name": "מועדי החיסורים של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "absences[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.absences[].reason",
      "engine": "courses",
      "name": "הסיבה בחיסורים של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "absences[].reason",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.absences[].makeupDate",
      "engine": "courses",
      "name": "מועד ההשלמה בחיסורים של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "absences[].makeupDate",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.presents[]",
      "engine": "courses",
      "name": "ימי הנוכחות של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "presents[]",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.presents[]@seq",
      "engine": "courses",
      "name": "ימי הנוכחות של כל שיבוץ, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "presents[]",
        "dateField": "",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.payments[]@seq",
      "engine": "courses",
      "name": "התשלומים של כל שיבוץ, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "payments[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.payments[].date",
      "engine": "courses",
      "name": "מועדי התשלומים של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "payments[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.payments[].amount",
      "engine": "courses",
      "name": "סכומי התשלומים של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "payments[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.payments[].method",
      "engine": "courses",
      "name": "אמצעי התשלום בתשלומים של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "payments[].method",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.totalDue",
      "engine": "courses",
      "name": "הסכום לתשלום של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "totalDue",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.dueDate",
      "engine": "courses",
      "name": "מועד התשלום של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "dueDate",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.note",
      "engine": "courses",
      "name": "ההערה של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.enrolledAt",
      "engine": "courses",
      "name": "מועד ההרשמה של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "enrolledAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.endedAt",
      "engine": "courses",
      "name": "מועד הסיום של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "endedAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.freq",
      "engine": "courses",
      "name": "התדירות של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "freq",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.termMonths",
      "engine": "courses",
      "name": "מספר החודשים של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "termMonths",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[]@seq",
      "engine": "courses",
      "name": "החיובים המתוכננים של כל שיבוץ, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[]",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].date",
      "engine": "courses",
      "name": "מועדי החיובים המתוכננים של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].amount",
      "engine": "courses",
      "name": "סכומי החיובים המתוכננים של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].amount",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].method",
      "engine": "courses",
      "name": "אמצעי התשלום בחיובים המתוכננים של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].method",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].cat",
      "engine": "courses",
      "name": "הקטגוריה בחיובים המתוכננים של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].cat",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].cancelledAt",
      "engine": "courses",
      "name": "מועד הביטול בחיובים המתוכננים של כל שיבוץ",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].cancelledAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].note",
      "engine": "courses",
      "name": "ההערה בחיובים המתוכננים של כל שיבוץ",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.enrollments.plannedCharges[].shopValue",
      "engine": "courses",
      "name": "השווי בחיובים המתוכננים של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "plannedCharges[].shopValue",
        "kind": "amount"
      }
    },
    {
      "id": "courses.enrollments.carryBalance",
      "engine": "courses",
      "name": "היתרה מהשנה הקודמת של כל שיבוץ",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "enrollments",
        "path": "carryBalance",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.start~end",
      "engine": "courses",
      "name": "מההתחלה עד הסיום של כל חוג",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "courses",
        "path": "start",
        "to": "end",
        "unit": "date",
        "kind": "span"
      }
    },
    {
      "id": "courses.courses.ageMin~ageMax",
      "engine": "courses",
      "name": "מגיל עד גיל של כל חוג",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "courses",
        "path": "ageMin",
        "to": "ageMax",
        "unit": "number",
        "kind": "span"
      }
    },
    {
      "id": "courses.courses.@seq",
      "engine": "courses",
      "name": "החוגים, לפי מועד ההתחלה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "courses",
        "path": "",
        "dateField": "start",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.courses.teacherId@seq",
      "engine": "courses",
      "name": "החוגים של כל מורה, לפי מועד ההתחלה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "courses",
        "path": "",
        "dateField": "start",
        "groupBy": "teacherId",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.courses.roomId@seq",
      "engine": "courses",
      "name": "החוגים של כל חדר, לפי מועד ההתחלה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "courses",
        "path": "",
        "dateField": "start",
        "groupBy": "roomId",
        "kind": "sequence"
      }
    },
    {
      "id": "courses.courses.name",
      "engine": "courses",
      "name": "השם של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "name",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.description",
      "engine": "courses",
      "name": "התיאור של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "description",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.price",
      "engine": "courses",
      "name": "המחיר של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "price",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.price1",
      "engine": "courses",
      "name": "המחיר המוזל הראשון של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "price1",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.price2",
      "engine": "courses",
      "name": "המחיר המוזל השני של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "price2",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.price3",
      "engine": "courses",
      "name": "המחיר המוזל השלישי של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "price3",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.size",
      "engine": "courses",
      "name": "גודל הכרטיסייה של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "size",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.start",
      "engine": "courses",
      "name": "מועד ההתחלה של כל חוג",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "courses",
        "path": "start",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.courses.end",
      "engine": "courses",
      "name": "מועד הסיום של כל חוג",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "courses",
        "path": "end",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "courses.courses.time",
      "engine": "courses",
      "name": "השעה של כל חוג",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "courses",
        "path": "time",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "courses.courses.maxStudents",
      "engine": "courses",
      "name": "מספר המקומות של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "maxStudents",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.cat",
      "engine": "courses",
      "name": "הקטגוריה של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "cat",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.semester",
      "engine": "courses",
      "name": "המחזור של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "semester",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.sector",
      "engine": "courses",
      "name": "המגזר של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "sector",
        "echo": true,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.audience",
      "engine": "courses",
      "name": "הקהל של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "audience",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.sessions[].time",
      "engine": "courses",
      "name": "השעה במפגשים של כל חוג",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "courses",
        "path": "sessions[].time",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "courses.courses.sessions[].label",
      "engine": "courses",
      "name": "התווית במפגשים של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "sessions[].label",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.notes",
      "engine": "courses",
      "name": "ההערות של כל חוג",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "courses",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.courses.lessonPrice",
      "engine": "courses",
      "name": "המחיר לשיעור של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "lessonPrice",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.lessonPrice1",
      "engine": "courses",
      "name": "המחיר לשיעור (הנחה ראשונה) של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "lessonPrice1",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.lessonPrice2",
      "engine": "courses",
      "name": "המחיר לשיעור (הנחה שנייה) של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "lessonPrice2",
        "kind": "amount"
      }
    },
    {
      "id": "courses.courses.lessonPrice3",
      "engine": "courses",
      "name": "המחיר לשיעור (הנחה שלישית) של כל חוג",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "courses",
        "path": "lessonPrice3",
        "kind": "amount"
      }
    },
    {
      "id": "courses.teachers.name",
      "engine": "courses",
      "name": "השם של כל מורה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "teachers",
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "courses.teachers.notes",
      "engine": "courses",
      "name": "ההערות של כל מורה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "teachers",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "courses.fn.collectionTotal",
      "engine": "courses",
      "name": "סך-כל החוב הפתוח",
      "kind": "amount",
      "fn": "collection#collectionTotal",
      "takes": "DebtRow[]"
    },
    {
      "id": "courses.fn.sessionsOf",
      "engine": "courses",
      "name": "המפגשים בפועל",
      "kind": "times",
      "fn": "lib#sessionsOf",
      "takes": "Course"
    },
    {
      "id": "courses.fn.lessonPriceForTier",
      "engine": "courses",
      "name": "מחיר-לשיעור לפי רמת-ההנחה שנבחרה",
      "kind": "amount",
      "fn": "lib#lessonPriceForTier",
      "takes": "Course"
    },
    {
      "id": "courses.fn.paidOf",
      "engine": "courses",
      "name": "סכום ששולם עד כה על השיבוץ",
      "kind": "amount",
      "fn": "lib#paidOf",
      "takes": "Enrollment"
    },
    {
      "id": "courses.fn.enrollCount",
      "engine": "courses",
      "name": "מספר המשובצים התופסים מקום בקורס",
      "kind": "amount",
      "fn": "lib#enrollCount",
      "takes": "Db"
    },
    {
      "id": "courses.fn.pendingMakeups",
      "engine": "courses",
      "name": "חיסורים-זכאים-להשלמה",
      "kind": "sequence",
      "fn": "lib#pendingMakeups",
      "takes": "Enrollment[]"
    },
    {
      "id": "courses.fn.opsTotal",
      "engine": "courses",
      "name": "סך-כל פריטי-העבודה בקוקפיט",
      "kind": "amount",
      "fn": "ops#opsTotal",
      "takes": "Course[]"
    },
    {
      "id": "courses.fn.teacherMakeups",
      "engine": "courses",
      "name": "השלמות-ממתינות בחוגי-המורה בלבד",
      "kind": "sequence",
      "fn": "teacher#teacherMakeups",
      "takes": "Db"
    }
  ],
  "unclassified": {
    "אין שם עברי לשדה": 1,
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 10,
    "הפניה לרשומה אחרת — לא נתון": 11,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 2,
    "טיפוס מורכב — לא אחד מששת הסוגים": 5,
    "טקסט טכני (לא שם ולא תיאור)": 18,
    "כן/לא בודד": 6,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 3,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 7
  }
};
