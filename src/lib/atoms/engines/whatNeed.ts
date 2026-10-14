/**
 * 🔎 מנוע "מה צריך?" — כרטיס-מנוע (ATOMS-ENGINES, 14.10.2026).
 * הפירוק ל-12 חלקים, נאמן ל-src/components/parnasa/lib.ts (+ transitions.ts למכונת-האישור).
 * נתונים בלבד — בלי חישוב, בלי store/DOM.
 */
import type { EngineCard } from '../contract';

export const WHAT_NEED_CARD: EngineCard = {
  id: 'whatNeed',
  name: 'מבין בקשות',
  emoji: '🙋',
  from: 'פרנסה׳לע',
  computes: 'קורא מה האדם כתב, מבין מה הוא צריך, ומוצא מי יכול לעזור.',
  parts: [
    // lib.ts:146 prNorm
    { num: 1, name: 'מנקה את הטקסט', computes: 'מוריד ניקוד, גרשיים וסימני פיסוק, כדי שכל כתיב ייראה אותו דבר.' },
    // lib.ts:219 PREFIX_RE · lib.ts:220 stem
    { num: 2, name: 'מוריד אותיות מיותרות בהתחלה ובסוף', computes: 'מוריד ו, ה, ב, ל, מ, ש, כ מתחילת מילה, וסיומות כמו ים ו-ות, כדי להגיע לעיקר המילה.' },
    // lib.ts:175 CONCEPT_SRC · lib.ts:249 analyzeQuery
    { num: 3, name: 'מבין איזה מקצוע צריך', computes: 'הופך תיאור של בעיה, כמו "דולף לי בכיור", למקצוע: אינסטלציה.' },
    // lib.ts:228 tokMatch — לוינשטיין ≤1
    { num: 4, name: 'מוצא מילה גם עם טעות', computes: 'בודק אם שתי מילים דומות, וסולח לאות אחת שגויה.', atom: 'fuzzy' },
    // lib.ts:335 searchListings
    { num: 5, name: 'מסדר את התוצאות מהמתאים ביותר', computes: 'שם קודם את העסקים הכי מתאימים: לפי הנושא, המקום, אם פתוח עכשיו וההמלצות.' },
    // lib.ts:607 listingStatus · lib.ts:645 openNow
    { num: 6, name: 'בודק אם עסק פתוח עכשיו', computes: 'אומר אם העסק פתוח, נפתח בקרוב, או מתי הוא חוזר (כולל סגירה בשבת).' },
    // transitions.ts:78 listingStatusOnSave · :120 approveListing · :125 rejectListing
    { num: 7, name: 'שולח עסק לאישור', computes: 'עסק או מודעה חדשים מחכים לאישור, ושינוי בתוכן מחזיר אותם לאישור.' },
    // lib.ts:753 routeRequest — עסקים 3 שעות (שעה בדחוף), אחר-כך כל הקהילה
    { num: 8, name: 'מעביר בקשה הלאה כשאין תשובה', computes: 'שולח בקשה קודם לעסקים בתחום. אם אין תשובה בזמן, שולח לכל הקהילה.', atom: 'escalate' },
    // lib.ts:799 SENSITIVE · lib.ts:812 sensitiveTopic
    { num: 9, name: 'מזהה נושא רגיש', computes: 'מזהה נושאים רגישים, כמו חובות או שלום בית, ושולח את הבקשה בשקט.' },
    // lib.ts:819 redactContact
    { num: 10, name: 'מסתיר טלפונים ומיילים', computes: 'מוחק טלפונים ומיילים שנכתבו בתוך בקשה שקטה.' },
    // lib.ts:1014 adRotation — offset = יום % n
    { num: 11, name: 'מחליף פרסומות בתורות', computes: 'כמה פרסומות באותו מקום: כל יום מופיעה אחרת, וכל משלם מקבל את התור שלו.', atom: 'rotate' },
    // lib.ts:909 needsCare
    { num: 12, name: 'מראה מה תקוע', computes: 'אוסף לגבאי מה מחכה: בקשה בלי תשובה, פרסומת שלא שולמה, קוד חיוג כפול.' },
  ],
  places: [
    {
      id: 'whatNeed.requests',
      engine: 'whatNeed',
      name: 'בקשות שמחכות לתשובה',
      kind: 'waiting',
      results: {
        escalate: 'בקשה בלי מענה עוברת לכל הקהילה (אחרי 3 שעות, שעה בדחוף)',
        rotate: 'כל בקשה חדשה מגיעה קודם לעסק הבא בתור, לא תמיד לאותו ראשון',
      },
    },
    {
      id: 'whatNeed.text',
      engine: 'whatNeed',
      name: 'הבקשה בטקסט חופשי',
      kind: 'text',
      results: { fuzzy: 'מוצא את המקצוע גם כשכתבו עם שגיאת כתיב' },
    },
    {
      id: 'whatNeed.names',
      engine: 'whatNeed',
      name: 'שמות העסקים והתיאורים שלהם',
      kind: 'text',
      results: { fuzzy: 'מוצא עסק לפי שם גם כשהשם נכתב קצת אחרת' },
    },
    {
      id: 'whatNeed.hours',
      engine: 'whatNeed',
      name: 'שעות הפתיחה של כל עסק',
      kind: 'span',
      results: { divide: 'תורים שווים בשעות הפתיחה של העסק' },
    },
    {
      id: 'whatNeed.openings',
      engine: 'whatNeed',
      name: 'הרגעים שבהם עסקים נפתחים ונסגרים',
      kind: 'times',
      results: {
        next: 'מתי העסק נפתח הבא ("חוזר מחר ב־08:00")',
        offset: 'תזכורת רבע שעה לפני שהעסק נסגר',
      },
    },
    {
      id: 'whatNeed.adSlot',
      engine: 'whatNeed',
      name: 'הפרסומות הפעילות במשבצת, לפי סדר',
      kind: 'sequence',
      results: { rotate: 'כל יום פרסומת אחרת בתורה במשבצת' },
    },
    {
      id: 'whatNeed.adPrice',
      engine: 'whatNeed',
      name: 'המחיר של פרסומת',
      kind: 'amount',
      results: {
        divide: 'מחיר הפרסומת בתשלומים שווים',
        round: 'מחיר הפרסומת מעוגל לסכום עגול',
      },
    },
  ],
};
