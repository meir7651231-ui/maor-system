/**
 * 🔎 מנוע "מה צריך?" — כרטיס-מנוע (ATOMS-ENGINES, 14.10.2026).
 * הפירוק ל-12 חלקים, נאמן ל-src/components/parnasa/lib.ts (+ transitions.ts למכונת-האישור).
 * נתונים בלבד — בלי חישוב, בלי store/DOM.
 */
import type { EngineCard } from '../contract';

export const WHAT_NEED_CARD: EngineCard = {
  id: 'whatNeed',
  name: 'מנוע מה צריך?',
  emoji: '🔎',
  from: 'פרנסה׳לע',
  computes: 'מבין מה האדם צריך מטקסט חופשי, מוצא את בעל-המקצוע המתאים, ומנתב את הבקשה עד שמישהו עונה.',
  parts: [
    // lib.ts:146 prNorm
    { num: 1, name: 'מנקה טקסט', computes: 'מוריד ניקוד, גרשיים ופיסוק, ומיישר אותיות סופיות, וו כפולה ויוד כפולה.' },
    // lib.ts:219 PREFIX_RE · lib.ts:220 stem
    { num: 2, name: 'מוריד תחיליות ורבים', computes: 'מוריד ו/ה/ב/ל/מ/ש/כ מתחילת מילה וסיומות כמו ות/ים, כדי להגיע לשורש.' },
    // lib.ts:175 CONCEPT_SRC · lib.ts:249 analyzeQuery
    { num: 3, name: 'מתרגם בעיה למקצוע', computes: 'הופך "דולף לי בכיור" למושג "אינסטלציה" ולשער המקצוע שלו.' },
    // lib.ts:228 tokMatch — לוינשטיין ≤1
    { num: 4, name: 'התאמה עם שגיאת כתיב', computes: 'נותן ציון למילה מול מילה, וסולח לאות אחת שגויה.', atom: 'fuzzy' },
    // lib.ts:335 searchListings
    { num: 5, name: 'מדרג תוצאות', computes: 'מסדר עסקים לפי רלוונטיות, מיקום, מודגש, פתוח עכשיו והמלצות.' },
    // lib.ts:607 listingStatus · lib.ts:645 openNow
    { num: 6, name: 'פתוח עכשיו', computes: 'אומר אם עסק פתוח עכשיו, נפתח בקרוב, או מתי הוא חוזר (כולל סגירת שבת).' },
    // transitions.ts:78 listingStatusOnSave · :120 approveListing · :125 rejectListing
    { num: 7, name: 'מכונת אישור', computes: 'מעביר עסק או מודעה בין ממתין, מאושר ונדחה, ושינוי תוכן מחזיר לאישור.' },
    // lib.ts:753 routeRequest — עסקים 3 שעות (שעה בדחוף), אחר-כך כל הקהילה
    { num: 8, name: 'ניתוב עם הסלמה', computes: 'שולח בקשה קודם לעסקים בתחום, ואם אין מענה בזמן — לכל הקהילה.', atom: 'escalate' },
    // lib.ts:799 SENSITIVE · lib.ts:812 sensitiveTopic
    { num: 9, name: 'מזהה נושא רגיש', computes: 'מזהה נושאים רגישים (פוריות, חובות, שלום בית) והופך את הבקשה לשקטה.' },
    // lib.ts:819 redactContact
    { num: 10, name: 'מסתיר פרטי קשר בטקסט', computes: 'משחיר טלפונים ומיילים שהוקלדו בגוף בקשה שקטה.' },
    // lib.ts:1014 adRotation — offset = יום % n
    { num: 11, name: 'סבב הוגן', computes: 'כמה פרסומות באותה משבצת — כל יום אחרת בתורה, כל משלם מקבל את תורו.', atom: 'rotate' },
    // lib.ts:909 needsCare
    { num: 12, name: '"דורש טיפול"', computes: 'אוסף לגבאי מה תקוע: בקשה בלי מענה, פרסומת לא משולמת, קוד חיוג כפול.' },
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
