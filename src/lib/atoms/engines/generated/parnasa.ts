/**
 * 📒 מנוע "מה צריך?" — נוצר אוטומטית ע״י המפרק — לא לערוך ידנית. להרצה מחדש: node scripts/atoms-decompose.mjs
 * מקור: src/components/parnasa · 186 חלקים · 61 מקומות · 12 פונקציות-גישה.
 */
import type { GenEngine } from '../../decompose/types';

export const GEN_PARNASA: GenEngine = {
  "id": "parnasa",
  "name": "מנוע \"מה צריך?\"",
  "emoji": "📒",
  "from": "src/components/parnasa",
  "computes": "מוצא בעל מקצוע לכל בקשה, ומחלק את הבקשות בין העסקים.",
  "entities": [
    "prListings",
    "prRequests",
    "prPosts",
    "prAds"
  ],
  "parts": [
    {
      "num": 1,
      "name": "הנוסח של כרטיס-העסק",
      "computes": "הנוסח של כרטיס-העסק (ListingCard.waIntro) — נעול בבדיקה כזהה.",
      "fn": "abilities#proWaIntro",
      "takes": [],
      "gives": null
    },
    {
      "num": 2,
      "name": "הדגשה \"עד שיבוטל\"",
      "computes": "הדגשה \"עד שיבוטל\".",
      "fn": "admin#featuredOpen",
      "takes": [],
      "gives": null
    },
    {
      "num": 3,
      "name": "מחיר-ההדגשה לחודש",
      "computes": "מחיר-ההדגשה לחודש: מה שהוסכם (promoPrice), אחרת מחירון \"כרטיס מודגש\".",
      "fn": "admin#featuredPrice",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 4,
      "name": "חסות פעילה היום",
      "computes": "חסות פעילה היום (שער · מטבע-פלטינה · דף-הבית) — לא מודעת-חוברת.",
      "fn": "admin#isSponsorship",
      "takes": [],
      "gives": null
    },
    {
      "num": 5,
      "name": "מודעות-החוברת שבספר",
      "computes": "מודעות-החוברת שבספר (פעילות, שלא פגו — כמו bookletPlan).",
      "fn": "admin#bookletAdsOf",
      "takes": [
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 6,
      "name": "revenue של המקור, מעל מודל הפורט",
      "computes": "revenue של המקור, מעל מודל הפורט.",
      "fn": "admin#revenueOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 7,
      "name": "\"N מתוך 15 · ודף הבית · ומטבע הפלטינה\"",
      "computes": "\"N מתוך 15 · ודף הבית · ומטבע הפלטינה\" (spN במקור).",
      "fn": "admin#sponsorCountText",
      "takes": [],
      "gives": null
    },
    {
      "num": 8,
      "name": "pl של המקור",
      "computes": "pl של המקור: 1 ⇒ הצורה-ליחיד, אחרת \"N רבים\".",
      "fn": "admin#pl",
      "takes": [],
      "gives": null
    },
    {
      "num": 9,
      "name": "חלק בלי הסבר (nis)",
      "computes": "\"1,234 ₪\" (nis במקור).",
      "fn": "admin#nis",
      "takes": [],
      "gives": null
    },
    {
      "num": 10,
      "name": "רשימות-הניהול",
      "computes": "רשימות-הניהול (renderAdmin): ממתינים · הוזנו ע״י הגבאי · מוסתרים — בסדר-השמירה.",
      "fn": "admin#adminLists",
      "takes": [],
      "gives": null
    },
    {
      "num": 11,
      "name": "איזו תמונה לובש עסק",
      "computes": "איזו תמונה לובש עסק (photoOf במקור): לפי השער, מעודן לפי מילות-המקצוע; '' = בלי תמונה (סמל-המותג).",
      "fn": "banners#photoOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 12,
      "name": "כתובת-התמונה",
      "computes": "כתובת-התמונה (public/parnasa/photos — קבצים לצד האתר, נטענים לפי דרישה).",
      "fn": "banners#photoUrl",
      "takes": [],
      "gives": null
    },
    {
      "num": 13,
      "name": "התאמת-השם",
      "computes": "התאמת-השם (nameFit במקור): מילה ארוכה או שם ארוך ⇒ גופן קטן יותר.",
      "fn": "banners#nameFit",
      "takes": [],
      "gives": null
    },
    {
      "num": 14,
      "name": "שכבת-הסצנה",
      "computes": "שכבת-הסצנה: תמונה + שכבת-החיים (SMIL), מחרוזת-SVG.",
      "fn": "banners#sceneSvg",
      "takes": [],
      "gives": null
    },
    {
      "num": 15,
      "name": "חלק בלי הסבר (pbLayers)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "banners#pbLayers",
      "takes": [],
      "gives": null
    },
    {
      "num": 16,
      "name": "המחיר כמו במקור",
      "computes": "המחיר כמו במקור (fmtPrice): \"1500\" ⇒ \"1,500 ₪\" · \"מ300\" / \"החל מ-300\" ⇒ \"מ־300 ₪\" · טקסט אחר — כמות-שהוא.",
      "fn": "biz#fmtPrice",
      "takes": [],
      "gives": null
    },
    {
      "num": 17,
      "name": "\"עד D.M\" של המבצע",
      "computes": "\"עד D.M\" של המבצע (offerUntil במקור) מתאריך ISO.",
      "fn": "biz#offerUntilText",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 18,
      "name": "תגי-האמון",
      "computes": "תגי-האמון (trustHTML): מומלץ · ותק · ממליצים · תעודה · השגחה · הנחה · גמ״ח · חירום — בסדר של המקור.",
      "fn": "biz#trustOf",
      "takes": [
        "text",
        "times"
      ],
      "gives": null
    },
    {
      "num": 19,
      "name": "אריחי \"פרטים / פרטי העסק\"",
      "computes": "אריחי \"פרטים / פרטי העסק\": תחום · גר ב · אזור שירות · שפות · מתאים · אמצעי תשלום.",
      "fn": "biz#tilesOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 20,
      "name": "\"איך פונים\"",
      "computes": "\"איך פונים\" — שלושת הצעדים של המקור (כשאין תיאור, שירותים ותמונות).",
      "fn": "biz#howtoOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 21,
      "name": "\"העתקת הפרטים כטקסט\"",
      "computes": "\"העתקת הפרטים כטקסט\" — השורה שמועתקת לשיתוף (המקור).",
      "fn": "biz#shareLine",
      "takes": [],
      "gives": null
    },
    {
      "num": 22,
      "name": "שעה כמו במקור",
      "computes": "שעה כמו במקור (tfmt): \"7:30\" בלי אפס מוביל; 24:00 ⇒ \"חצות\".",
      "fn": "biz#tfmt",
      "takes": [],
      "gives": null
    },
    {
      "num": 23,
      "name": "חלונות-השעות של יום",
      "computes": "חלונות-השעות של יום (dow) כטקסט (\"7:30–19:00, 20:00–22:00\"); אין ⇒ ''.",
      "fn": "biz#dayWindowsText",
      "takes": [],
      "gives": null
    },
    {
      "num": 24,
      "name": "טבלת-השבוע",
      "computes": "טבלת-השבוע (hoursTable): א׳–ו׳ — החלונות/\"24 שעות\"/\"סגור\"; שבת — \"שבת קודש\" (+ חלונות-מוצ״ש של הפורט).",
      "fn": "biz#weekRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 25,
      "name": "יש מה להציג בסעיף-השעות",
      "computes": "יש מה להציג בסעיף-השעות (שעות · הערת-שעות · חירום).",
      "fn": "biz#hasHours",
      "takes": [],
      "gives": null
    },
    {
      "num": 26,
      "name": "חלק בלי הסבר (kupaArt)",
      "computes": "kpArt: ספי-המילוי של המקור ⇒ שם-הקובץ.",
      "fn": "biz#kupaArt",
      "takes": [],
      "gives": null
    },
    {
      "num": 27,
      "name": "coinEv של המקור",
      "computes": "coinEv של המקור: כל תשובה של העסק לבקשה (בפורט — תגובה עם listingId שלו) וכל תודה (המלצה) = מטבע.",
      "fn": "biz#kupaOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 28,
      "name": "escaping מלא ל-HTML",
      "computes": "escaping מלא ל-HTML (טקסט ומאפיינים): & < > \" '.",
      "fn": "booklet#escHtml",
      "takes": [],
      "gives": null
    },
    {
      "num": 29,
      "name": "תוכן-העניינים החי + הערכת-העמודים",
      "computes": "תוכן-העניינים החי + הערכת-העמודים (לפאנל-החוברת ולבדיקות).",
      "fn": "booklet#bookletPlan",
      "takes": [],
      "gives": null
    },
    {
      "num": 30,
      "name": "טקסט-שעות כ-HTML",
      "computes": "טקסט-שעות כ-HTML (אשכול 8): כל תקופה \"08:00–19:00\" בבידוד-LTR.",
      "fn": "booklet#hoursHtml",
      "takes": [],
      "gives": null
    },
    {
      "num": 31,
      "name": "החוברת כ-HTML מוכן-להדפסה",
      "computes": "החוברת כ-HTML מוכן-להדפסה (A5, RTL, מספרי-עמוד בגימטריה).",
      "fn": "booklet#bookletHtml",
      "takes": [],
      "gives": null
    },
    {
      "num": 32,
      "name": "מונוגרמת-הנותן בחסות",
      "computes": "מונוגרמת-הנותן בחסות (שתי אותיות על אמייל שחור) — מטבע-הפלטינה.",
      "fn": "coins#monoIcon",
      "takes": [],
      "gives": null
    },
    {
      "num": 33,
      "name": "הפנים",
      "computes": "הפנים: שוליים + תאי-אמייל + תבליט (נבנה פעם אחת לכל אייקון×מתכת×שוליים).",
      "fn": "coins#coinFront",
      "takes": [],
      "gives": null
    },
    {
      "num": 34,
      "name": "הגב",
      "computes": "הגב: המספר האמיתי של בעלי-המקצוע (n=null ⇒ \"…\"; גודל-הספרות לפי האורך — cnCount במקור).",
      "fn": "coins#coinBack",
      "takes": [],
      "gives": null
    },
    {
      "num": 35,
      "name": "המטבע השלם",
      "computes": "המטבע השלם (coinHTML במקור): הטיה › סיבוב › פנים (+גב, לא במיני) עם השדה, הברק וההבהוב.",
      "fn": "coins#coinHTML",
      "takes": [],
      "gives": null
    },
    {
      "num": 36,
      "name": "מטבע-מיני",
      "computes": "מטבע-מיני (מסילת-התחומים, שורות-הניהול).",
      "fn": "coins#miniCoin",
      "takes": [],
      "gives": null
    },
    {
      "num": 37,
      "name": "מונוגרמה מהשם",
      "computes": "מונוגרמה מהשם (monoOf במקור): שתי אותיות, עם גרשיים בעברית (\"א״ש\").",
      "fn": "coins#monoOf",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 38,
      "name": "completeness של המקור",
      "computes": "completeness של המקור: משקלים, ו-3 הצעדים הבאים (הכבדים ראשונים).",
      "fn": "editor#completeness",
      "takes": [],
      "gives": null
    },
    {
      "num": 39,
      "name": "secDone של המקור",
      "computes": "secDone של המקור.",
      "fn": "editor#secDone",
      "takes": [],
      "gives": null
    },
    {
      "num": 40,
      "name": "secSum של המקור",
      "computes": "secSum של המקור — שורת-המשנה בכותרת כל חלק.",
      "fn": "editor#secSum",
      "takes": [],
      "gives": null
    },
    {
      "num": 41,
      "name": "פירוק",
      "computes": "פירוק: החלון הראשי = צמד-השעות השכיח בימי-החול; כל השאר — חלונות נוספים.",
      "fn": "editor#schedOf",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 42,
      "name": "הרכבה בחזרה",
      "computes": "הרכבה בחזרה: ימי-החלון-הראשי × משעה-עד + החלונות הנוספים (ממוין לפי יום ושעה).",
      "fn": "editor#composeHours",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 43,
      "name": "איחוד-שלושה מול הרשומה החיה",
      "computes": "איחוד-שלושה מול הרשומה החיה: הטיוטה שורדת מעבר-לשונית (במקור הטופס נשאר בדף), ובינתיים הרשומה יכולה להשתנות — המלצה מהגיליון, אישור וקוד-חיוג מהגבאי, קידום…",
      "fn": "editor#rebaseDraft",
      "takes": [],
      "gives": null
    },
    {
      "num": 44,
      "name": "חלק בלי הסבר (kb)",
      "computes": "\"34KB\" (kb במקור).",
      "fn": "editor#kb",
      "takes": [],
      "gives": null
    },
    {
      "num": 45,
      "name": "מד-הגודל",
      "computes": "מד-הגודל: מעל התקרה / מעל 82% / תקין.",
      "fn": "editor#sizeState",
      "takes": [],
      "gives": null
    },
    {
      "num": 46,
      "name": "envOf של המקור",
      "computes": "envOf של המקור: הקבוצות (עד 4 בכל אחת, קרובים קודם), המקומות-הפנויים ואחוז-המעטפת.",
      "fn": "envelope#envOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 47,
      "name": "\"עובדים לצידו\"",
      "computes": "\"עובדים לצידו\" (nearRow): שותפים + עמיתים, בלי כפילות, עד 6.",
      "fn": "envelope#nearOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 48,
      "name": "שורת-המעטפת",
      "computes": "שורת-המעטפת (envRow): האחוז · כמה קשרים · כמה מקומות פנויים.",
      "fn": "envelope#envSummary",
      "takes": [],
      "gives": null
    },
    {
      "num": 49,
      "name": "קבוצת-הכוכבים",
      "computes": "קבוצת-הכוכבים (envHTML): שלוש טבעות סביב העסק — שותפים · לקוחות ועמיתים · מקצועי/שיווק/תפעול + מקומות פנויים.",
      "fn": "envelope#envLayout",
      "takes": [],
      "gives": null
    },
    {
      "num": 50,
      "name": "הזמנה לעסק שחסר",
      "computes": "הזמנה לעסק שחסר (envInvite) — בלי קישור-ציבורי (אין לפורט קישור כזה; המקור נופל לנקודה).",
      "fn": "envelope#envInvite",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 51,
      "name": "העונה לפי החודש/היום העבריים",
      "computes": "העונה לפי החודש/היום העבריים (season במקור; m: תשרי 1 … אלול 12, אדר א׳ 5.5).",
      "fn": "home#seasonOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 52,
      "name": "חלק בלי הסבר (editionOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "home#editionOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 53,
      "name": "חלק בלי הסבר (coinOfTile)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "home#coinOfTile",
      "takes": [],
      "gives": null
    },
    {
      "num": 54,
      "name": "אייקון-הקו של העסק",
      "computes": "אייקון-הקו של העסק (tradeIc במקור): לפי המילים בשם/במקצוע, אחרת לפי השער.",
      "fn": "home#tradeIcon",
      "takes": [],
      "gives": null
    },
    {
      "num": 55,
      "name": "שם קצר לחיוג-המהיר",
      "computes": "שם קצר לחיוג-המהיר (shortName במקור).",
      "fn": "home#shortName",
      "takes": [],
      "gives": null
    },
    {
      "num": 56,
      "name": "צבע-המדליון",
      "computes": "צבע-המדליון: הפלטה של העסק, אחרת צבע-השער.",
      "fn": "home#medalColor",
      "takes": [],
      "gives": null
    },
    {
      "num": 57,
      "name": "הפלטה כמפתח תקין",
      "computes": "הפלטה כמפתח תקין (חסר/זר ⇒ velvet, כמו המקור).",
      "fn": "home#paletteKey",
      "takes": [],
      "gives": null
    },
    {
      "num": 58,
      "name": "חלק בלי הסבר (hm)",
      "computes": "\"18:11\" (בלי אפס מוביל — hhmm במקור).",
      "fn": "home#hm",
      "takes": [],
      "gives": null
    },
    {
      "num": 59,
      "name": "מוצאי-שבת",
      "computes": "מוצאי-שבת: מצאת השבת ועד 6 בבוקר (motzOf במקור).",
      "fn": "home#isMotzei",
      "takes": [],
      "gives": null
    },
    {
      "num": 60,
      "name": "הברכה",
      "computes": "הברכה (greetHTML במקור) — בוקר טוב … לילה טוב · שבת שלום · שבוע טוב; זמן-היום; צ'יפ-התקופה.",
      "fn": "home#greetingOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 61,
      "name": "\"החודש בקהילה\"",
      "computes": "\"החודש בקהילה\" (30 יום): בקשות שנמצאו (לא-שקטות) · פעמים שבעלי-מקצוע ענו · תודות.",
      "fn": "home#pulseOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 62,
      "name": "מומלצי-השבוע",
      "computes": "מומלצי-השבוע: מודגשים מאושרים לפי ההמלצות ואז השם (עד 8), בסבב-יומי — כל כרטיס משלם מגיע לראש.",
      "fn": "home#featuredRotation",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 63,
      "name": "מספר-היום",
      "computes": "מספר-היום (לסבב-היומי) מתאריך ISO — יציב לכל הצופים באותו יום.",
      "fn": "home#dayIndexOf",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 64,
      "name": "חלק בלי הסבר (newJoiners)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "home#newJoiners",
      "takes": [],
      "gives": null
    },
    {
      "num": 65,
      "name": "\"מבקשים עכשיו\"",
      "computes": "\"מבקשים עכשיו\": עד 3 בקשות שכבר פתוחות לכל הקהילה (לא שקטות), הדחופות ואז החדשות ראשונות.",
      "fn": "home#askingNow",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 66,
      "name": "דחופה",
      "computes": "דחופה (urgOf במקור): מסומנת או מתחילה ב\"דחוף\", ופתוחה פחות מ-48 שעות.",
      "fn": "home#isUrgentNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 67,
      "name": "\"שבוע טוב!\" במוצאי-שבת",
      "computes": "\"שבוע טוב!\" במוצאי-שבת: הבקשות שחיכו מהשבת (משעתיים לפני הדלקת-הנרות; לא שקטות, לא רק-לעסקים).",
      "fn": "home#weekWaiting",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 68,
      "name": "שורת-הסיכום",
      "computes": "שורת-הסיכום: בעלי-מקצוע מאושרים · תחומים · בקשות פתוחות (לא שקטות).",
      "fn": "home#homeStats",
      "takes": [],
      "gives": null
    },
    {
      "num": 69,
      "name": "\"כל התחומים\"",
      "computes": "\"כל התחומים\": השערים לפי מספר-הכרטיסים (רבים ראשונים), ואז סדר-המקור.",
      "fn": "home#tradeRail",
      "takes": [],
      "gives": null
    },
    {
      "num": 70,
      "name": "חיוג-מהיר",
      "computes": "חיוג-מהיר: ואז אחרונים (בלי כפילות), רק עסקים מאושרים שעדיין קיימים — עד 10.",
      "fn": "home#quickDialList",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 71,
      "name": "תוצאות מטבע-הפלטינה",
      "computes": "תוצאות מטבע-הפלטינה (pinRes במקור): כל עסקי השער, מודגשים ⇒ פתוחים ⇒ המלצות ⇒ שם; העסק של הנותן בחסות (לפי 9 ספרות אחרונות של הטלפון או שם זהה) — מוצמד ראשון.",
      "fn": "home#pinnedHits",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 72,
      "name": "שער לפי מפתח",
      "computes": "שער לפי מפתח — לא-מוכר/ריק ⇒ 'other' (כמו clean במקור).",
      "fn": "lib#categoryOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 73,
      "name": "מקום השער בסדר",
      "computes": "מקום השער בסדר (לא-מוכר ⇒ אחרון).",
      "fn": "lib#categoryIndex",
      "takes": [],
      "gives": null
    },
    {
      "num": 74,
      "name": "מחיר ממחירון-הגבאי",
      "computes": "מחיר ממחירון-הגבאי (מספר סופי ≥0) או ברירת-המחדל.",
      "fn": "lib#priceOf",
      "takes": [],
      "gives": "amount"
    },
    {
      "num": 75,
      "name": "נרמול-חיפוש",
      "computes": "נרמול-חיפוש (fz של המקור): הסרת ניקוד/טעמים וגרשיים, סימני-פיסוק ⇒ רווח, אותיות-סופיות ⇒ רגילות, וו⇒ו, יי⇒י, רווחים מכווצים, אותיות קטנות.",
      "fn": "lib#prNorm",
      "takes": [],
      "gives": null
    },
    {
      "num": 76,
      "name": "ציון טוקן מול נרדף",
      "computes": "ציון טוקן מול נרדף (שניהם מנורמלים) — טבלת המקור: זהה 3 · אחרי-תחילית 2.8 · אותו-גזע 2.6 · תחילית+גזע 2.5 · הנרדף מתחיל בטוקן 2.2/1.2 · הטוקן מתחיל בנרדף 2.2…",
      "fn": "lib#tokMatch",
      "takes": [],
      "gives": null
    },
    {
      "num": 77,
      "name": "חלק בלי הסבר (analyzeQuery)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#analyzeQuery",
      "takes": [],
      "gives": null
    },
    {
      "num": 78,
      "name": "מודגש-עד",
      "computes": "מודגש-עד (כולל).",
      "fn": "lib#isFeatured",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 79,
      "name": "רק מאושרים",
      "computes": "רק מאושרים — חיפוש, עיון, חוברת ו-CSV (כמו המקור).",
      "fn": "lib#approvedListings",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 80,
      "name": "\"מה צריך?\"",
      "computes": "\"מה צריך?\" — דירוג דטרמיניסטי של עסקים מאושרים (rank במקור, נספח A7): לכל מושג — גזע בטקסט- העסק ⇒ רלוונטיות ×10 וכיסוי 2, אחרת שער-תואם ⇒ ×3 וכיסוי 0.5; לכל…",
      "fn": "lib#searchListings",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 81,
      "name": "כמה עסקים השאילתה מוצאת",
      "computes": "כמה עסקים השאילתה מוצאת (מטבעות-העונה במקור).",
      "fn": "lib#searchCount",
      "takes": [
        "text"
      ],
      "gives": "amount"
    },
    {
      "num": 82,
      "name": "סינון \"כל האלפון\"",
      "computes": "סינון \"כל האלפון\" (matches במקור): כל מילה בשאילתה מופיעה בשם / מקצוע / תיאור / עיר / אזור / שער / שעות / משפט-מפתח / שירותים — ובפורט גם קוד-החיוג.",
      "fn": "lib#matchesAll",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 83,
      "name": "חלק בלי הסבר (filterListings)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#filterListings",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 84,
      "name": "חלק בלי הסבר (groupByCategory)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#groupByCategory",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 85,
      "name": "קוד-החיוג של עסק כפי שהקו קורא אותו",
      "computes": "קוד-החיוג של עסק כפי שהקו קורא אותו: 3 ספרות (אחרי ניקוי-רווחים), אחרת ''.",
      "fn": "lib#dialCodeOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 86,
      "name": "שערים בלי עסק כפול-מזהה",
      "computes": "שערים בלי עסק כפול-מזהה (הראשון גובר) — רשומה פגומה לא יוצרת שני צמתים באותו מזהה ולא נספרת פעמיים.",
      "fn": "lib#uniqueGates",
      "takes": [],
      "gives": null
    },
    {
      "num": 87,
      "name": "מי נושא כל קוד-חיוג בשערים",
      "computes": "מי נושא כל קוד-חיוג בשערים (מאושרים, בסדר-השערים).",
      "fn": "lib#dialCodeHolders",
      "takes": [],
      "gives": null
    },
    {
      "num": 88,
      "name": "הקודים הכפולים בין המאושרים",
      "computes": "הקודים הכפולים בין המאושרים — **בדיוק** מה שהקו מסרב לענות לו (אותם שערים, אותו כלל); לפי הקוד.",
      "fn": "lib#duplicateDialCodes",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 89,
      "name": "מצב-פתיחה ברגע",
      "computes": "מצב-פתיחה ברגע (שעון-הקהילה): שבת/יו״ט ⇒ \"חוזר במוצ״ש\" (סגירה מלוח-המנוע — גם לעסק \"תמיד\"); תמיד ⇒ פתוח; בתוך חלון (כולל חוצה-חצות מאתמול) ⇒ \"פנוי עכשיו ·…",
      "fn": "lib#listingStatus",
      "takes": [],
      "gives": null
    },
    {
      "num": 90,
      "name": "פתוח עכשיו",
      "computes": "פתוח עכשיו (שעון-הקהילה, כולל סגירת שבת/יו״ט).",
      "fn": "lib#openNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 91,
      "name": "שעות-פעילות במילים",
      "computes": "שעות-פעילות במילים: hoursNote אם נכתב; אחרת סיכום-החלונות (\"א׳–ה׳ 08:00–19:00 · ו׳ 08:00–12:00\").",
      "fn": "lib#hoursText",
      "takes": [],
      "gives": null
    },
    {
      "num": 92,
      "name": "חלק בלי הסבר (pendingApprovals)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "lib#pendingApprovals",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 93,
      "name": "דחוף",
      "computes": "דחוף: פתוחה, מסומנת (או מתחילה ב\"דחוף\"), ופחות מ-48 שעות (המקור, נספח A15).",
      "fn": "lib#isUrgent",
      "takes": [],
      "gives": null
    },
    {
      "num": 94,
      "name": "מקבלי-הבקשה בשלב-המקצוע",
      "computes": "מקבלי-הבקשה בשלב-המקצוע: עסקים **מאושרים** באותו שער, **שנרשמו בעצמם** (source='owner') — רשומות-גבאי לא נספרות (תיקון: במקור בקשה בתחום שיש בו רק רשומות-גבאי…",
      "fn": "lib#requestRecipients",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 95,
      "name": "שליחה",
      "computes": "שליחה (reqStage במקור, נספח A14): נסגרה ⇒ closed · שקטה ⇒ biz/gabbai **ולעולם לא לקהילה** · אין מקבלים ⇒ all מיד · יש מענה ⇒ נשארת biz · אחרת biz עד יצירה+3ש׳…",
      "fn": "lib#routeRequest",
      "takes": [],
      "gives": null
    },
    {
      "num": 96,
      "name": "משך במילים",
      "computes": "משך במילים (inMins במקור): \"40 דקות\" · \"שעה\" · \"שעתיים ו־10 דקות\".",
      "fn": "lib#inMinsText",
      "takes": [],
      "gives": null
    },
    {
      "num": 97,
      "name": "שורת-המסלול למבקש/לגבאי",
      "computes": "שורת-המסלול למבקש/לגבאי (נוסח המקור, מילה-במילה).",
      "fn": "lib#routeSummary",
      "takes": [],
      "gives": null
    },
    {
      "num": 98,
      "name": "תווית-הנושא הרגיש הראשון שזוהה",
      "computes": "תווית-הנושא הרגיש הראשון שזוהה ('' = לא רגיש).",
      "fn": "lib#sensitiveTopic",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 99,
      "name": "השחרת טלפונים",
      "computes": "השחרת טלפונים (≥7 ספרות; לא תאריכים) ומיילים בטקסט — לתצוגת-עסקים של בקשה שקטה.",
      "fn": "lib#redactContact",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 100,
      "name": "פרטיות-השקט במנוע",
      "computes": "פרטיות-השקט במנוע: עסק לעולם לא מקבל את זהות מבקש-השקט — לא שם, לא טלפון, ולא טלפון/מייל שהוקלדו בגוף-הבקשה (מושחרים).",
      "fn": "lib#businessView",
      "takes": [],
      "gives": null
    },
    {
      "num": 101,
      "name": "מה עסק רואה",
      "computes": "מה עסק רואה: בקשות פתוחות בשער שלו שהוא מקבל-שלהן (כולל אחרי מעבר לקהילה) — בתצוגה המוגנת.",
      "fn": "lib#requestsForListing",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 102,
      "name": "מה הקהילה רואה",
      "computes": "מה הקהילה רואה: בקשות פתוחות, לא-שקטות, בשלב all (דחופות ראשונות, אח\"כ החדשות).",
      "fn": "lib#communityRequests",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 103,
      "name": "רשימת-הטיפול של הגבאי",
      "computes": "רשימת-הטיפול של הגבאי (מעבר לממתינים-לאישור): בקשה שקטה בלי עסק בתחום · דחופה בלי מענה · פתוחה לקהילה בלי מענה ≥24ש׳ · פרסומת שהחלה ולא שולמה · פרסומת…",
      "fn": "lib#needsCare",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 104,
      "name": "פעילה ביום",
      "computes": "פעילה ביום (כוללני; קצה ריק = פתוח).",
      "fn": "lib#adActiveOn",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 105,
      "name": "הפרסומות הפעילות במשבצת",
      "computes": "הפרסומות הפעילות במשבצת (ובאופציה ליעד — שער/עסק), לפי המפרסם (עברית) ואז מזהה.",
      "fn": "lib#activeAds",
      "takes": [
        "text",
        "times"
      ],
      "gives": "sequence"
    },
    {
      "num": 106,
      "name": "מטבע-הפלטינה בחסות של היום",
      "computes": "מטבע-הפלטינה בחסות של היום (sponsors/coin במקור): פעיל, בשער מוכר; כמה ⇒ סבב-יומי.",
      "fn": "lib#coinSponsor",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 107,
      "name": "קישור-סליקה לפרסומת",
      "computes": "קישור-סליקה לפרסומת (payLink של הארגון, סכום+שם ממולאים).",
      "fn": "lib#adPayLink",
      "takes": [],
      "gives": null
    },
    {
      "num": 108,
      "name": "סבב-יומי במשבצת",
      "computes": "סבב-יומי במשבצת (המקור §4.5: offset = floor(now/day) % n — כל משלם מקבל את תורו): כמה פעילות באותה משבצת/יעד ⇒ אחת \"בתורנות\" היום, מתחלפת בכל יום.",
      "fn": "lib#adRotation",
      "takes": [
        "text",
        "times"
      ],
      "gives": null
    },
    {
      "num": 109,
      "name": "סיכום-הפרסומות להיום",
      "computes": "סיכום-הפרסומות להיום: מושהות ופגות לא נספרות (המקור: \"ממתין לגבייה\" = לא שולם).",
      "fn": "lib#adsLedger",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 110,
      "name": "שורות CSV של המדריך",
      "computes": "שורות CSV של המדריך — מאושרים בלבד, לפי סדר-השערים ואז שם.",
      "fn": "lib#listingsCsvRows",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 111,
      "name": "פתק ממודעה של הפורט",
      "computes": "פתק ממודעה של הפורט.",
      "fn": "luach#noteOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 112,
      "name": "המודעות שעל הלוח",
      "computes": "המודעות שעל הלוח (luNotices): מאושרות ושלא ירדו; ממתינות שעוד לא עבר תאריכן — רק למאשר/ת.",
      "fn": "luach#luachNotes",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 113,
      "name": "סיבוב-הפתק",
      "computes": "סיבוב-הפתק: מהדוגמה, אחרת ((i·37) mod 7) − 3 מעלות; בתצוגה הגדולה — 0.",
      "fn": "luach#noteRot",
      "takes": [],
      "gives": null
    },
    {
      "num": 114,
      "name": "המניינים לפי בית-כנסת",
      "computes": "המניינים לפי בית-כנסת ← תפילה ← שעות; עבר / הבא (lumn במקור).",
      "fn": "luach#shulRows",
      "takes": [],
      "gives": null
    },
    {
      "num": 115,
      "name": "הספירה למניין הבא",
      "computes": "הספירה למניין הבא (luach \"in\"): פחות משעה — דקות; אחרת \"ש:דד\" שעות.",
      "fn": "luach#minsUntil",
      "takes": [],
      "gives": null
    },
    {
      "num": 116,
      "name": "זמני-היום של הלוח",
      "computes": "זמני-היום של הלוח: זמני-המנוע (dayZmanim — אותם זמנים של החוברת והקו) + \"זמן ציצית ותפילין · משיכיר\" אחרי עלות-השחר, כמו 12 הלוחיות של המקור.",
      "fn": "luach#luachZmanim",
      "takes": [
        "times"
      ],
      "gives": "times"
    },
    {
      "num": 117,
      "name": "שורת-התחתית של המודעות",
      "computes": "שורת-התחתית של המודעות (nbFoot).",
      "fn": "luach#noticeFoot",
      "takes": [],
      "gives": null
    },
    {
      "num": 118,
      "name": "גודל ה-JSON בבייטים",
      "computes": "גודל ה-JSON בבייטים (docBytes במקור).",
      "fn": "model#docBytes",
      "takes": [],
      "gives": null
    },
    {
      "num": 119,
      "name": "משקל-התמונות של עסק",
      "computes": "משקל-התמונות של עסק (לוגו + תמונות, בתווים).",
      "fn": "model#listingImageLen",
      "takes": [],
      "gives": null
    },
    {
      "num": 120,
      "name": "משקל-התמונות של כל הארגון",
      "computes": "משקל-התמונות של כל הארגון (בלי העסק הנערך — exceptId).",
      "fn": "model#orgImageLen",
      "takes": [],
      "gives": null
    },
    {
      "num": 121,
      "name": "שמות-השדות ממפרט",
      "computes": "שמות-השדות ממפרט.",
      "fn": "model#optKeys",
      "takes": [],
      "gives": null
    },
    {
      "num": 122,
      "name": "עסק",
      "computes": "עסק: source/category/status זרים ⇒ owner/other/pending; hours/services/recs/languages ⇒ מערכים; dialCode ⇒ 3 ספרות או ''.",
      "fn": "model#healPrListing",
      "takes": [],
      "gives": null
    },
    {
      "num": 123,
      "name": "בקשה",
      "computes": "בקשה: status זר ⇒ open; category זר ⇒ '' (לא משנה); responses ⇒ מערך; requester ⇒ {name,phone}; quiet+job ⇒ job=false.",
      "fn": "model#healPrRequest",
      "takes": [],
      "gives": null
    },
    {
      "num": 124,
      "name": "מודעת-לוח",
      "computes": "מודעת-לוח: kind זר ⇒ notice; approved לא-בוליאני ⇒ false (fail-closed); prayers/days ⇒ מערכים תקינים.",
      "fn": "model#healPrPost",
      "takes": [],
      "gives": null
    },
    {
      "num": 125,
      "name": "פרסומת",
      "computes": "פרסומת: slot זר ⇒ booklet; kind עקבי ל-slot (חוברת ⇒ full/half/small, אחרת line); מחיר לא-תקין ⇒ 0; active חסר ⇒ true.",
      "fn": "model#healPrAd",
      "takes": [],
      "gives": "span"
    },
    {
      "num": 126,
      "name": "ריפוי-אוסף",
      "computes": "ריפוי-אוסף (migrate): איבר לא-אובייקט נזרק; מזהה חסר ⇒ (שונה מכל מזהה-nextId, שמתחיל בספרה אחרי הקידומת); אוסף תקין ⇒ **אותו מערך** (ביט-זהה).",
      "fn": "model#healPrCollection",
      "takes": [],
      "gives": null
    },
    {
      "num": 127,
      "name": "ריפוי-רשומה בודדת לאיחוד-החי",
      "computes": "ריפוי-רשומה בודדת לאיחוד-החי (cloud-merge.healRecord) — שם המזהה תמיד קיים (מזהה-המסמך).",
      "fn": "model#healPrRecord",
      "takes": [],
      "gives": null
    },
    {
      "num": 128,
      "name": "ריפוי db.ui.parnasa",
      "computes": "ריפוי db.ui.parnasa: מחרוזות נחתכות לתקרה, מפתח-ידוע לא-תקין **נמחק** (= ברירת-מחדל), מחירים ידועים = מספר סופי ≥0, נ\"צ בתקופה, אזור-זמן IANA תקין,…",
      "fn": "model#healParnasaPrefs",
      "takes": [],
      "gives": null
    },
    {
      "num": 129,
      "name": "הפלטה",
      "computes": "הפלטה: בקשה לפתוח עסק במדריך (לפני go('parnasa')) — מסך פתוח מקבל מיד, מסך שעולה — בעלייה.",
      "fn": "paletteLink#requestOpenListing",
      "takes": [],
      "gives": null
    },
    {
      "num": 130,
      "name": "משפטים",
      "computes": "משפטים ⇒ נוסח אחד עד התקרה: משפט שלא נכנס נשמט, וכל מה שאחריו (הסדר = סדר-החשיבות; הראשון נחתך אם צריך).",
      "fn": "phoneLine#phonePrompt",
      "takes": [],
      "gives": null
    },
    {
      "num": 131,
      "name": "ספרות-חיוג מטלפון שמור",
      "computes": "ספרות-חיוג מטלפון שמור: ספרות בלבד (ו-+ מוביל), 3–15 ספרות — כולל מספרי-חירום קצרים; אחרת ''.",
      "fn": "phoneLine#phoneTel",
      "takes": [],
      "gives": null
    },
    {
      "num": 132,
      "name": "קבוצות-הקראה",
      "computes": "קבוצות-הקראה: קצר (≤4) כמות-שהוא · קווי (9 ספרות, 0…) 2-3-4 · אחר — שלשות, ספרה בודדת בסוף מצטרפת (נייד ⇒ 3-3-4).",
      "fn": "phoneLine#telGroups",
      "takes": [],
      "gives": null
    },
    {
      "num": 133,
      "name": "הקראה ספרה-ספרה, הפסקה בין קבוצות",
      "computes": "הקראה ספרה-ספרה, הפסקה בין קבוצות: \"אפס חמש אפס, אפס אפס אפס, אפס אחת אפס אחת\"; + ⇒ \"פלוס\".",
      "fn": "phoneLine#speakDigits",
      "takes": [],
      "gives": null
    },
    {
      "num": 134,
      "name": "עץ-הקו לרגע נתון",
      "computes": "עץ-הקו לרגע נתון.",
      "fn": "phoneLine#buildPhoneMenu",
      "takes": [],
      "gives": null
    },
    {
      "num": 135,
      "name": "\"היום ה׳ חשוון.\" · \"היום כ״ה כסלו, חנוכה.\"",
      "computes": "\"היום ה׳ חשוון.\" · \"היום כ״ה כסלו, חנוכה.\" — מהלוח העברי דרך ask.",
      "fn": "phoneLine#hebTodaySentence",
      "takes": [],
      "gives": null
    },
    {
      "num": 136,
      "name": "קוד-חיוג מהחוברת",
      "computes": "קוד-חיוג מהחוברת ⇒ צומת-אישור: \"הקשתם אחת אפס אחת: <העסק>.",
      "fn": "phoneLine#resolveDialCode",
      "takes": [],
      "gives": null
    },
    {
      "num": 137,
      "name": "דיבור",
      "computes": "דיבור (תמליל מזהה-הדיבור) בצומת-דיבור ⇒ צומת-אישור: \"שמעתי: … — <העסק>.",
      "fn": "phoneLine#resolveSpeech",
      "takes": [],
      "gives": null
    },
    {
      "num": 138,
      "name": "מקש אחד",
      "computes": "מקש אחד ('0'–'9' '*' '#') — הלב של walkPhone, מיוצא לסימולטור (לשונית \" הקו\") כדי שההליכה שם תהיה **אותה** הליכה: מקש לא-חוקי ⇒ הקו חוזר על הצומת · צומת-הקשה…",
      "fn": "phoneLine#phoneStep",
      "takes": [],
      "gives": null
    },
    {
      "num": 139,
      "name": "סימולטור-מקשים",
      "computes": "סימולטור-מקשים (לבדיקות ולתצוגה-מקדימה): מהשורש, מקש אחר מקש ('0'–'9' '*' '#'; שאר התווים מדולגים) ⇒ הצמתים שבהם ביקר.",
      "fn": "phoneLine#walkPhone",
      "takes": [],
      "gives": null
    },
    {
      "num": 140,
      "name": "כל מה שהקו אומר בצומת",
      "computes": "כל מה שהקו אומר בצומת — הנוסח ואחריו האפשרויות, לפי הסדר.",
      "fn": "phoneLine#nodeSpeech",
      "takes": [],
      "gives": null
    },
    {
      "num": 141,
      "name": "שם-המקש להקראה/תצוגה",
      "computes": "שם-המקש להקראה/תצוגה: כוכבית · סולמית · ספרה.",
      "fn": "phoneLine#phoneKeyName",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 142,
      "name": "תסריט-קריינות בטקסט-פשוט",
      "computes": "תסריט-קריינות בטקסט-פשוט (להקלטת-הנוסחים בעתיד): כל צומת — מזהה, סוג, הנוסח, המקשים והפעולה.",
      "fn": "phoneLine#phoneScriptText",
      "takes": [],
      "gives": null
    },
    {
      "num": 143,
      "name": "התחלה",
      "computes": "התחלה: השורש (התפריט הראשי, או הודעת-הסגירה בשבת/יו״ט).",
      "fn": "phoneSim#simStart",
      "takes": [],
      "gives": null
    },
    {
      "num": 144,
      "name": "הצומת הנוכחי",
      "computes": "הצומת הנוכחי — הנוסח הטרי מהעץ (העץ נבנה מחדש כל דקה); צומת דינמי (אישור) — כפי שנשמר.",
      "fn": "phoneSim#simNode",
      "takes": [],
      "gives": null
    },
    {
      "num": 145,
      "name": "האם הקו מקשיב בצומת",
      "computes": "האם הקו מקשיב בצומת (יש מקשים או איסוף-ספרות).",
      "fn": "phoneSim#simListening",
      "takes": [],
      "gives": null
    },
    {
      "num": 146,
      "name": "מקש אחד",
      "computes": "מקש אחד.",
      "fn": "phoneSim#simPress",
      "takes": [],
      "gives": null
    },
    {
      "num": 147,
      "name": "\"אמרו משהו\"",
      "computes": "\"אמרו משהו\" — התמליל עובר את resolveSpeech של המודל: בצומת-דיבור ⇒ צומת-אישור (\"שמעתי: … — לאישור הקישו 1\") או \"לא נמצא\"; בצומת שאינו מקבל דיבור ⇒ \"כאן אפשר…",
      "fn": "phoneSim#simSay",
      "takes": [],
      "gives": null
    },
    {
      "num": 148,
      "name": "רגע-התצוגה",
      "computes": "רגע-התצוגה (epoch) מהרגע המוזרק, בשעון-הקהילה: 'now' — כמות-שהוא; 'shabbat' — השבת הקרובה ב-12:00 (בשבת עצמה — היום); 'weekday' — היום הקרוב (ממחר) שהקו פתוח…",
      "fn": "phoneSim#phonePreviewMs",
      "takes": [],
      "gives": null
    },
    {
      "num": 149,
      "name": "קול עברי מתוך קולות-המכשיר",
      "computes": "קול עברי מתוך קולות-המכשיר (he, או iw — הקוד הישן), עדיפות ל-he-IL; אין ⇒ null.",
      "fn": "phoneSim#hebrewVoice",
      "takes": [],
      "gives": null
    },
    {
      "num": 150,
      "name": "\"מי עוד יכול לעזור לך\"",
      "computes": "\"מי עוד יכול לעזור לך\" (relatedFor): האירוע שבטקסט ⇒ מה עוד צריך בדרך כלל, עם עד 2 עסקים מאושרים לכל צורך.",
      "fn": "requests#relatedFor",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 151,
      "name": "\"באלפון יש N בעלי מקצוע ב…\"",
      "computes": "\"באלפון יש N בעלי מקצוע ב…\" (reqMatch) — המאושרים בשער.",
      "fn": "requests#matchCount",
      "takes": [
        "text"
      ],
      "gives": "amount"
    },
    {
      "num": 152,
      "name": "חלק בלי הסבר (reqGroupOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "requests#reqGroupOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 153,
      "name": "הרשימה בלוח",
      "computes": "הרשימה בלוח (renderReq): הסינון, ואז משרה מקודמת ← דחוף ← החדשה ראשונה; מחוץ ל\"הצעות עבודה\" — מקובץ לפי דחוף · פתוחות · נמצאו (המיון יציב).",
      "fn": "requests#boardRequests",
      "takes": [],
      "gives": "sequence"
    },
    {
      "num": 154,
      "name": "\"יום ג׳ · ב׳ חשוון\"",
      "computes": "\"יום ג׳ · ב׳ חשוון\" (rdate במקור) — באזור-הזמן של הקהילה.",
      "fn": "requests#reqDateText",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 155,
      "name": "התאריך העברי ברגע",
      "computes": "התאריך העברי ברגע (מתחלף בשקיעה).",
      "fn": "shell#hebNow",
      "takes": [],
      "gives": null
    },
    {
      "num": 156,
      "name": "חלק בלי הסבר (periodOf)",
      "computes": "אין הסבר בעברית בקוד.",
      "fn": "shell#periodOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 157,
      "name": "גוון ערב-שבת",
      "computes": "גוון ערב-שבת (eveOf במקור): ביום שישי — 0 בצהריים, 1 בהדלקת-הנרות; אחרת 0.",
      "fn": "shell#eveOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 158,
      "name": "ראש-החודש העברי הנוכחי",
      "computes": "ראש-החודש העברי הנוכחי (התאריך הלועזי של א׳ בחודש).",
      "fn": "shell#hebMonthStartIso",
      "takes": [],
      "gives": "times"
    },
    {
      "num": 159,
      "name": "החודש בקהילה",
      "computes": "החודש בקהילה (helpCount במקור): בקשות שנמצאו + תשובות של בעלי-מקצוע + המלצות — מראש-החודש העברי.",
      "fn": "shell#helpCount",
      "takes": [
        "times"
      ],
      "gives": "amount"
    },
    {
      "num": 160,
      "name": "מילוי-הפושקע",
      "computes": "מילוי-הפושקע (renderPushke): מטרה = max(30, 2×עסקים); גובה-הזהב עד 32 יח׳.",
      "fn": "shell#pushkeFill",
      "takes": [],
      "gives": null
    },
    {
      "num": 161,
      "name": "\"החודש בקהילה",
      "computes": "\"החודש בקהילה: N פעמים עזרו אחד לשני\" (הודעת-הפושקע).",
      "fn": "shell#pushkeText",
      "takes": [],
      "gives": null
    },
    {
      "num": 162,
      "name": "ההקדשה",
      "computes": "ההקדשה: הטקסט + האם להוסיף ת.נ.צ.ב.ה.",
      "fn": "shell#dedicationOf",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 163,
      "name": "שם-הקהילה בפס",
      "computes": "שם-הקהילה בפס — או השורה של המותג (commName || TAGLINE).",
      "fn": "shell#commLine",
      "takes": [
        "text"
      ],
      "gives": null
    },
    {
      "num": 164,
      "name": "הרשאה אחידה לממשק ול-store",
      "computes": "הרשאה אחידה לממשק ול-store (מקור-אמת אחד): הדגל דלוק (כולל שרשור-המודול — opt-in, כבוי כשחסר) **וגם** סמכות-מנהל או הדלקה-פר-עובד (canGrantedAction).",
      "fn": "transitions#prCan",
      "takes": [],
      "gives": null
    },
    {
      "num": 165,
      "name": "אישור-גבאי לכרטיס חדש",
      "computes": "אישור-גבאי לכרטיס חדש — חסר/לא-בוליאני ⇒ true (ברירת-המקור).",
      "fn": "transitions#requireApprovalOf",
      "takes": [],
      "gives": null
    },
    {
      "num": 166,
      "name": "האם השתנה תוכן ציבורי",
      "computes": "האם השתנה תוכן ציבורי (לא: הדגשה/קוד-חיוג/הערה-פנימית/המלצות/חותמות).",
      "fn": "transitions#listingContentChanged",
      "takes": [],
      "gives": null
    },
    {
      "num": 167,
      "name": "הסטטוס אחרי שמירה",
      "computes": "הסטטוס אחרי שמירה: · חדש — מאשר / אישור-כבוי ⇒ approved; אחרת pending.",
      "fn": "transitions#listingStatusOnSave",
      "takes": [],
      "gives": null
    },
    {
      "num": 168,
      "name": "שמירת-עסק",
      "computes": "שמירת-עסק (טהור): מחשב סטטוס, חותמות, ומגן על שדות-הגבאי — מי שאינו מאשר לא משנה הדגשה (featuredUntil — קידום בתשלום), קוד-חיוג ומקור-רישום (נלקחים מהקודם;…",
      "fn": "transitions#saveListing",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 169,
      "name": "שער-התמונות של שמירת-עסק",
      "computes": "שער-התמונות של שמירת-עסק ('' = תקין): לוגו ותמונות = data:image בתקרות המקור; כשמשקל-התמונות עלה — הדף ≤240KB ותקציב-התמונות של הארגון.",
      "fn": "transitions#listingImagesWhy",
      "takes": [],
      "gives": null
    },
    {
      "num": 170,
      "name": "אישור-גבאי",
      "computes": "אישור-גבאי (pending/rejected ⇒ approved) עם חותמת-ביקורת.",
      "fn": "transitions#approveListing",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 171,
      "name": "דחייה/הסתרה",
      "computes": "דחייה/הסתרה (⇒ rejected) עם חותמת-ביקורת.",
      "fn": "transitions#rejectListing",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 172,
      "name": "אותו כלל למודעות-הלוח",
      "computes": "אותו כלל למודעות-הלוח: חדשה ⇒ מאושרת רק אם המאשר כתב; עריכת-תוכן ע\"י לא-מאשר ⇒ ממתינה.",
      "fn": "transitions#postApprovedOnSave",
      "takes": [],
      "gives": null
    },
    {
      "num": 173,
      "name": "שמירת-מודעה",
      "computes": "שמירת-מודעה (טהור): approved לפי הכלל + חותמות.",
      "fn": "transitions#savePost",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 174,
      "name": "אישור-מודעה מפורש",
      "computes": "אישור-מודעה מפורש (גבאי) — נתלית בלוח.",
      "fn": "transitions#approvePost",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 175,
      "name": "דחייה / \"הורדה מהלוח\"",
      "computes": "דחייה / \"הורדה מהלוח\" (גבאי): לא-מאושרת **ותוקף שפג אתמול** — המודל אינו מחזיק סטטוס-דחייה למודעות (additive-free), ולכן \"ירדה מהלוח\" = פגה: יוצאת גם מהלוח…",
      "fn": "transitions#takeDownPost",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 176,
      "name": "ריפוי-טיוטת-מודעה לפני שמירה",
      "computes": "ריפוי-טיוטת-מודעה לפני שמירה (טהור): שדות-חובה/enum/מערכים דרך healPrPost של המודל; כותרת נחתכת-רווחים.",
      "fn": "transitions#normalizePostDraft",
      "takes": [],
      "gives": null
    },
    {
      "num": 177,
      "name": "שמירת-בקשה",
      "computes": "שמירת-בקשה (טהור): טקסט נחתך-רווחים · שער לא-מוכר ⇒ '' (לא משנה) · שקטה ⇒ לעולם לא הצעת-עבודה · פרטי-המבקש נשמרים בנפרד מגוף-הבקשה (לעסקים — רק דרך…",
      "fn": "transitions#saveRequest",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 178,
      "name": "משרה מקודמת",
      "computes": "משרה מקודמת (jobpromo במקור): הצעת-עבודה פתוחה שקודמה — ראשונה בלוח, במסגרת זהב.",
      "fn": "transitions#isPromotedJob",
      "takes": [],
      "gives": null
    },
    {
      "num": 179,
      "name": "קידום/ביטול",
      "computes": "קידום/ביטול (טהור): רק להצעת-עבודה פתוחה; הקידום רושם את מחיר \"משרה מקודמת\" מהמחירון ברגע הזה.",
      "fn": "transitions#setJobPromo",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 180,
      "name": "תשובה לבקשה",
      "computes": "תשובה לבקשה (טהור): עסק = תשובה אחת (מחליפה את הקודמת שלו); open ⇒ answered.",
      "fn": "transitions#addResponse",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 181,
      "name": "סגירת-בקשה",
      "computes": "סגירת-בקשה (טהור): רגילה ⇒ closed + חותמת.",
      "fn": "transitions#closeRequest",
      "takes": [
        "times"
      ],
      "gives": null
    },
    {
      "num": 182,
      "name": "שגיאת-טיוטה לפרסומת",
      "computes": "שגיאת-טיוטה לפרסומת ('' = תקינה): מפרסם חובה · מחיר מספר סופי ≥0 · שער תקין לחסות-שער · תקופה עקבית.",
      "fn": "transitions#adDraftError",
      "takes": [],
      "gives": null
    },
    {
      "num": 183,
      "name": "שמירת-פרסומת",
      "computes": "שמירת-פרסומת (טהור): גודל עקבי למשבצת (חוברת ⇒ full/half/small, אחרת line — דרך healPrAd) · מפרסם/כותרת נחתכים · סימון-תשלום: false⇒true חותם paidAt=עכשיו…",
      "fn": "transitions#saveAd",
      "takes": [
        "times"
      ],
      "gives": "span"
    },
    {
      "num": 184,
      "name": "הקוד הבא",
      "computes": "הקוד הבא (בן 3 ספרות): מקסימום-קיים + 1 (מינימום 101) — **לא ממחזרים** קוד של עסק שנמחק כל עוד יש מקום (חוברת מודפסת עלולה עוד להפנות אליו); רק כשמגיעים ל-999…",
      "fn": "transitions#nextDialCode",
      "takes": [],
      "gives": null
    },
    {
      "num": 185,
      "name": "האם קוד תפוס",
      "computes": "האם קוד תפוס (חוץ מהעסק עצמו).",
      "fn": "transitions#dialCodeTaken",
      "takes": [],
      "gives": null
    },
    {
      "num": 186,
      "name": "קוד-חיוג תקין לשמירה",
      "computes": "קוד-חיוג תקין לשמירה: '' (טרם הוקצה) או 3 ספרות בתקופה 101–999.",
      "fn": "transitions#validDialCode",
      "takes": [],
      "gives": null
    }
  ],
  "places": [
    {
      "id": "parnasa.prListings.@?waiting",
      "engine": "parnasa",
      "name": "העסקים שמחכים (ממתין)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prListings",
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
      "id": "parnasa.prListings.@seq",
      "engine": "parnasa",
      "name": "העסקים, לפי מועד היצירה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prListings",
        "path": "",
        "dateField": "createdAt",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prListings.name",
      "engine": "parnasa",
      "name": "השם של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.title",
      "engine": "parnasa",
      "name": "הכותרת של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "title",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.category",
      "engine": "parnasa",
      "name": "הקטגוריה של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "category",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.area",
      "engine": "parnasa",
      "name": "האזור של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "area",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.city",
      "engine": "parnasa",
      "name": "העיר של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "city",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.hours[].from~to",
      "engine": "parnasa",
      "name": "שעות הפתיחה של כל עסק (מההתחלה עד הסוף)",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "prListings",
        "path": "hours[].from",
        "to": "hours[].to",
        "unit": "clock",
        "kind": "span"
      }
    },
    {
      "id": "parnasa.prListings.hours[].from",
      "engine": "parnasa",
      "name": "שעת ההתחלה בשעות הפתיחה של כל עסק",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "prListings",
        "path": "hours[].from",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prListings.hours[].to",
      "engine": "parnasa",
      "name": "שעת הסוף בשעות הפתיחה של כל עסק",
      "kind": "times",
      "results": {
        "next": "השעה הבאה שעוד לא הגיעה",
        "offset": "תזכורת לפני כל שעה",
        "round": "שעה מעוגלת"
      },
      "spec": {
        "entity": "prListings",
        "path": "hours[].to",
        "unit": "clock",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prListings.hoursNote",
      "engine": "parnasa",
      "name": "הערת השעות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "hoursNote",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.services[].name",
      "engine": "parnasa",
      "name": "השם בשירותים של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "services[].name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.services[].note",
      "engine": "parnasa",
      "name": "ההערה בשירותים של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "services[].note",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.languages[]",
      "engine": "parnasa",
      "name": "השפות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "languages[]",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.kashrut",
      "engine": "parnasa",
      "name": "הכשרות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "kashrut",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.desc",
      "engine": "parnasa",
      "name": "התיאור של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "desc",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.notes",
      "engine": "parnasa",
      "name": "ההערות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "notes",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.featuredUntil",
      "engine": "parnasa",
      "name": "מועד סוף ההבלטה של כל עסק",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prListings",
        "path": "featuredUntil",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prListings.recs[]@seq",
      "engine": "parnasa",
      "name": "ההמלצות של כל עסק, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prListings",
        "path": "recs[]",
        "dateField": "at",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prListings.recs[].text",
      "engine": "parnasa",
      "name": "הטקסט בהמלצות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "recs[].text",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.recs[].at",
      "engine": "parnasa",
      "name": "מועדי ההמלצות של כל עסק",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prListings",
        "path": "recs[].at",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prListings.tagline",
      "engine": "parnasa",
      "name": "שורת התיאור של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "tagline",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.offer.text",
      "engine": "parnasa",
      "name": "הטקסט במבצע של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "offer.text",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.offer.until",
      "engine": "parnasa",
      "name": "מועד הסיום במבצע של כל עסק",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prListings",
        "path": "offer.until",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prListings.faq[].q",
      "engine": "parnasa",
      "name": "השאלה בשאלות של כל עסק",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prListings",
        "path": "faq[].q",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prListings.years",
      "engine": "parnasa",
      "name": "שנות הניסיון של כל עסק",
      "kind": "amount",
      "results": {
        "divide": "מחולק לחלקים שווים",
        "round": "מעוגל למספר עגול"
      },
      "spec": {
        "entity": "prListings",
        "path": "years",
        "kind": "amount"
      }
    },
    {
      "id": "parnasa.prListings.promoPrice",
      "engine": "parnasa",
      "name": "מחיר הקידום של כל עסק",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "prListings",
        "path": "promoPrice",
        "kind": "amount"
      }
    },
    {
      "id": "parnasa.prListings.createdAt",
      "engine": "parnasa",
      "name": "מועד היצירה של כל עסק",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prListings",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prRequests.@?waiting",
      "engine": "parnasa",
      "name": "הבקשות שמחכים (פתוח)",
      "kind": "waiting",
      "results": {
        "escalate": "עובר לאחראי הבא אם אין תשובה",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prRequests",
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
      "id": "parnasa.prRequests.@seq",
      "engine": "parnasa",
      "name": "הבקשות, לפי מועד היצירה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prRequests",
        "path": "",
        "dateField": "createdAt",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prRequests.text",
      "engine": "parnasa",
      "name": "הטקסט של כל בקשה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prRequests",
        "path": "text",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prRequests.category",
      "engine": "parnasa",
      "name": "הקטגוריה של כל בקשה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prRequests",
        "path": "category",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prRequests.area",
      "engine": "parnasa",
      "name": "האזור של כל בקשה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prRequests",
        "path": "area",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prRequests.requester.name",
      "engine": "parnasa",
      "name": "השם אצל המבקש של כל בקשה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prRequests",
        "path": "requester.name",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prRequests.responses[]@seq",
      "engine": "parnasa",
      "name": "התשובות של כל בקשה, לפי הסדר",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prRequests",
        "path": "responses[]",
        "dateField": "at",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prRequests.responses[].text",
      "engine": "parnasa",
      "name": "הטקסט בתשובות של כל בקשה",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prRequests",
        "path": "responses[].text",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prRequests.responses[].at",
      "engine": "parnasa",
      "name": "מועדי התשובות של כל בקשה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prRequests",
        "path": "responses[].at",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prRequests.createdAt",
      "engine": "parnasa",
      "name": "מועד היצירה של כל בקשה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prRequests",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prRequests.closedAt",
      "engine": "parnasa",
      "name": "מועד הסגירה של כל בקשה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prRequests",
        "path": "closedAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prRequests.promoAt",
      "engine": "parnasa",
      "name": "מועד הקידום של כל בקשה",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prRequests",
        "path": "promoAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prRequests.promoPrice",
      "engine": "parnasa",
      "name": "מחיר הקידום של כל בקשה",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "prRequests",
        "path": "promoPrice",
        "kind": "amount"
      }
    },
    {
      "id": "parnasa.prPosts.@seq",
      "engine": "parnasa",
      "name": "המודעות בלוח, לפי תאריך",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prPosts",
        "path": "",
        "dateField": "date",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prPosts.title",
      "engine": "parnasa",
      "name": "הכותרת של כל מודעה בלוח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prPosts",
        "path": "title",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prPosts.text",
      "engine": "parnasa",
      "name": "הטקסט של כל מודעה בלוח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prPosts",
        "path": "text",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prPosts.place",
      "engine": "parnasa",
      "name": "המקום של כל מודעה בלוח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prPosts",
        "path": "place",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prPosts.noticeKind",
      "engine": "parnasa",
      "name": "סוג המודעה של כל מודעה בלוח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prPosts",
        "path": "noticeKind",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prPosts.prayers[].prayer",
      "engine": "parnasa",
      "name": "התפילה בתפילות של כל מודעה בלוח",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prPosts",
        "path": "prayers[].prayer",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prPosts.date",
      "engine": "parnasa",
      "name": "התאריך של כל מודעה בלוח",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prPosts",
        "path": "date",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prPosts.until",
      "engine": "parnasa",
      "name": "מועד הסיום של כל מודעה בלוח",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prPosts",
        "path": "until",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prPosts.createdAt",
      "engine": "parnasa",
      "name": "מועד היצירה של כל מודעה בלוח",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prPosts",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prAds.from~to",
      "engine": "parnasa",
      "name": "מההתחלה עד הסוף של כל פרסומת",
      "kind": "span",
      "results": {
        "divide": "מחולק לחלקים שווים"
      },
      "spec": {
        "entity": "prAds",
        "path": "from",
        "to": "to",
        "unit": "date",
        "kind": "span"
      }
    },
    {
      "id": "parnasa.prAds.@seq",
      "engine": "parnasa",
      "name": "הפרסומות, לפי מועד ההתחלה",
      "kind": "sequence",
      "results": {
        "merge": "כמה פעמים ברצף, בלי הפסקה",
        "next": "הבא בתור לפי תאריך",
        "rotate": "מתחלק בתורות בין אנשי הצוות"
      },
      "spec": {
        "entity": "prAds",
        "path": "",
        "dateField": "from",
        "kind": "sequence"
      }
    },
    {
      "id": "parnasa.prAds.target",
      "engine": "parnasa",
      "name": "היעד של כל פרסומת",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prAds",
        "path": "target",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prAds.advertiser",
      "engine": "parnasa",
      "name": "המפרסם של כל פרסומת",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prAds",
        "path": "advertiser",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prAds.headline",
      "engine": "parnasa",
      "name": "הכותרת של כל פרסומת",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prAds",
        "path": "headline",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prAds.body",
      "engine": "parnasa",
      "name": "הטקסט של כל פרסומת",
      "kind": "text",
      "results": {
        "fuzzy": "מוצא גם עם טעות כתיב"
      },
      "spec": {
        "entity": "prAds",
        "path": "body",
        "echo": false,
        "kind": "text"
      }
    },
    {
      "id": "parnasa.prAds.from",
      "engine": "parnasa",
      "name": "מועד ההתחלה של כל פרסומת",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prAds",
        "path": "from",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prAds.to",
      "engine": "parnasa",
      "name": "מועד הסוף של כל פרסומת",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prAds",
        "path": "to",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prAds.price",
      "engine": "parnasa",
      "name": "המחיר של כל פרסומת",
      "kind": "amount",
      "results": {
        "divide": "מחולק לתשלומים שווים",
        "round": "מעוגל לסכום עגול"
      },
      "spec": {
        "entity": "prAds",
        "path": "price",
        "kind": "amount"
      }
    },
    {
      "id": "parnasa.prAds.paidAt",
      "engine": "parnasa",
      "name": "מועד התשלום של כל פרסומת",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prAds",
        "path": "paidAt",
        "unit": "date",
        "kind": "times"
      }
    },
    {
      "id": "parnasa.prAds.createdAt",
      "engine": "parnasa",
      "name": "מועד היצירה של כל פרסומת",
      "kind": "times",
      "results": {
        "next": "המועד הבא שעוד לא הגיע",
        "offset": "תזכורת לפני כל מועד"
      },
      "spec": {
        "entity": "prAds",
        "path": "createdAt",
        "unit": "date",
        "kind": "times"
      }
    }
  ],
  "fnPlaces": [
    {
      "id": "parnasa.fn.featuredPrice",
      "engine": "parnasa",
      "name": "מחיר-ההדגשה לחודש",
      "kind": "amount",
      "fn": "admin#featuredPrice",
      "takes": "PrListing"
    },
    {
      "id": "parnasa.fn.schedOf",
      "engine": "parnasa",
      "name": "פירוק",
      "kind": "span",
      "fn": "editor#schedOf",
      "takes": "readonly PrHours[]"
    },
    {
      "id": "parnasa.fn.composeHours",
      "engine": "parnasa",
      "name": "הרכבה בחזרה",
      "kind": "sequence",
      "fn": "editor#composeHours",
      "takes": "PnSched"
    },
    {
      "id": "parnasa.fn.priceOf",
      "engine": "parnasa",
      "name": "מחיר ממחירון-הגבאי",
      "kind": "amount",
      "fn": "lib#priceOf",
      "takes": "ParnasaPrefs | null | undefined"
    },
    {
      "id": "parnasa.fn.searchCount",
      "engine": "parnasa",
      "name": "כמה עסקים השאילתה מוצאת",
      "kind": "amount",
      "fn": "lib#searchCount",
      "takes": "readonly PrListing[]"
    },
    {
      "id": "parnasa.fn.requestsForListing",
      "engine": "parnasa",
      "name": "מה עסק רואה",
      "kind": "sequence",
      "fn": "lib#requestsForListing",
      "takes": "PrListing"
    },
    {
      "id": "parnasa.fn.communityRequests",
      "engine": "parnasa",
      "name": "מה הקהילה רואה",
      "kind": "sequence",
      "fn": "lib#communityRequests",
      "takes": "readonly PrRequest[]"
    },
    {
      "id": "parnasa.fn.coinSponsor",
      "engine": "parnasa",
      "name": "מטבע-הפלטינה בחסות של היום",
      "kind": "span",
      "fn": "lib#coinSponsor",
      "takes": "readonly PrAd[]"
    },
    {
      "id": "parnasa.fn.luachZmanim",
      "engine": "parnasa",
      "name": "זמני-היום של הלוח",
      "kind": "times",
      "fn": "luach#luachZmanim",
      "takes": "readonly PrZman[]"
    },
    {
      "id": "parnasa.fn.matchCount",
      "engine": "parnasa",
      "name": "\"באלפון יש N בעלי מקצוע ב…\"",
      "kind": "amount",
      "fn": "requests#matchCount",
      "takes": "readonly PrListing[]"
    },
    {
      "id": "parnasa.fn.hebMonthStartIso",
      "engine": "parnasa",
      "name": "ראש-החודש העברי הנוכחי",
      "kind": "times",
      "fn": "shell#hebMonthStartIso",
      "takes": "PrClock"
    },
    {
      "id": "parnasa.fn.helpCount",
      "engine": "parnasa",
      "name": "החודש בקהילה",
      "kind": "amount",
      "fn": "shell#helpCount",
      "takes": "Pick<Db, 'prRequests' | 'prListings'>"
    }
  ],
  "unclassified": {
    "בחירה מתוך רשימה קבועה — נבדקת כסטטוס": 7,
    "הפניה לרשומה אחרת — לא נתון": 6,
    "חלק בלי הערה בעברית — נשמר בשם הפונקציה": 14,
    "טקסט טכני (לא שם ולא תיאור)": 9,
    "כן/לא בודד": 13,
    "מספר בלי משמעות ברורה (לא כסף ולא כמות)": 1,
    "פרטי קשר, מזהה אישי או מידע רגיש — לא מקום": 11,
    "קובץ לא טהור (ממשק/אחסון/דפדפן) — לא נקרא": 1,
    "רגע טכני (עדכון/בדיקה) — לא נתון של העבודה": 5,
    "רשימה — נבדקת לפי הפריט שבה": 3
  }
};
