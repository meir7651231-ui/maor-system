/**
 * מדריך 📖 מובנה — תוכן "המדריך המהיר" מהקובץ החי (P2 פער 29).
 *
 * מקור האמת: legacy-markup.html:2891-2912 (showGuide) — קופסת "לפני הכל",
 * שורה-לכל-מסך, "המתכונים המהירים" והערת הסיום. התוכן כאן מילה-במילה;
 * העטיפה (Modal נגיש, #guide, דגל shell.guide) היא השדרוג.
 *
 * קובץ טהור: אין React/DOM/store — כשירות ל-port עתידי (Dart).
 */
import type { ModuleKey, OrgConfig } from '../types/config';
import { termOf } from './config';

export interface GuideSection {
  /** מודול שמסתיר את השורה כשהוא כבוי; ריק = תמיד מוצג (בית/הגדרות). */
  module?: ModuleKey;
  /** מפתח termOf לכותרת (מסכים עם שם דינמי); ריק = הכותרת קבועה. */
  term?: string;
  /** כותרת ברירת המחדל — הנוסח מהלגאסי. */
  title: string;
  /** גוף השורה — מילה-במילה מהלגאסי. */
  text: string;
}

/** הקופסה הכהה שבראש המדריך (legacy:2897-2899). */
export const GUIDE_INTRO_LABEL = 'לפני הכל:';
export const GUIDE_INTRO =
  'אי אפשר לקלקל — הכל נשמר לבד · ↩ חזרה מחזיר אחורה · Esc סוגר כל חלון · ' +
  'אבודים? ⌕ חיפוש מוצא הכל (גם עם שגיאות כתיב) · ▶ הדמיה מראה את המערכת לבד.';

/** שורה לכל מסך (legacy:2900-2908) — הסדר כסדר המסכים בלגאסי. */
export const GUIDE_SECTIONS: GuideSection[] = [
  { title: 'בית', text: 'תקציר הבוקר, "דורש טיפול" (המשימות שלך), חדרים חיים וגרפים.' },
  {
    module: 'families',
    term: 'nav.families',
    title: 'משפחות',
    text: 'הטבלה: לחיצה על כותרת ממיינת, ⏷ מסנן כל עמודה, ✦ סינון מורחב עם גלגל.',
  },
  {
    module: 'families',
    title: 'כרטיס משפחה',
    text: 'ניקוב ✓, חיסור ✕, ⚙ לתשלומים וקבלות, 📜 היסטוריה + דוח מלא.',
  },
  {
    module: 'courses',
    term: 'nav.courses',
    title: 'קורסים',
    text: 'לחיצה על חדר = היומן שלו; בתוך חוג: קבוצות, שיבוץ, ⬇ תדפיס למורה.',
  },
  {
    module: 'supporters',
    term: 'nav.supporters',
    title: 'תומכות',
    text: 'דרגות זהב/כסף/ארד, ＋ תרומה עם קבלה, 🎯 יעד קשר.',
  },
  {
    module: 'calendar',
    term: 'nav.calendar',
    title: 'לוח שנה',
    text: 'עברי גדול בכל תא, לחיצה על יום = סדר היום, אזכרות חוזרות בעברי לבד.',
  },
  // העמודות המבודדות (CONNECT חיבור 5) — מה זו כל עמודה + 3 הפעולות העיקריות
  {
    module: 'tzedaka',
    term: 'nav.tzedaka',
    title: 'קופות צדקה',
    text: 'רכזים וקופות בבתים. שלוש פעולות: ➕ רכז → ➕ קופה מכרטיס הרכז → 💰 ריקון (עם ניקוד ומבצעים).',
  },
  {
    module: 'shop',
    term: 'nav.shop',
    title: 'חנות',
    text: 'חבילות שירות למצבי חיים. שלוש פעולות: 📦 פריט בקטלוג → 🛍 חבילה → שיוך למשפחה ו-🎁 מימוש (אישור S-).',
  },
  { title: 'הגדרות', text: 'ייצוא לאקסל, דוחות, מורות, וגיבוי מלא (פעם בשבוע!).' },
];

/** "המתכונים המהירים" (legacy:2909-2912) — מילה-במילה. */
export const GUIDE_RECIPES_LABEL = 'המתכונים המהירים:';
export const GUIDE_RECIPES =
  'תשלום + קבלה ← ⚙ ליד השיבוץ ← 💳 ← ＋ קבלת תשלום · ניקוב ← כפתור "ניקוב" בכרטיס · ' +
  'משפחה חדשה תוך כדי שיבוץ ← "לא נמצא/ה במערכת?" · חוג מתאים לילד ← ✦ מצא חוג · ' +
  'תרומה ← תומכות ← לחיצה על השם ← ＋ תרומה · רשימה למורה ← החוג ← ⬇ תדפיס למורה · ' +
  'גיבוי ← הגדרות ← גיבוי מלא.';

/** הערת הסיום (legacy:2913). */
export const GUIDE_FOOT =
  'המדריך המלא והמפורט נמצא בקובץ "מדריך למשתמש" — מסך-מסך וכפתור-כפתור.';

/** החלפת תת-מחרוזת גלובלית (בלי regex) — לתרגום מונחי-ישות בגוף השורות. */
function swap(s: string, from: string, to: string): string {
  return s.split(from).join(to);
}

/**
 * סינון השורות לפי מודולים פעילים — שורה בלי מודול תמיד נשארת.
 * מונחי-הישות בכותרות (ללא term) ובגוף השורות עוברים termOf כדי שהתיוג פר-עסק
 * יחלחל למדריך; בלי config = הנוסח מהלגאסי מילה-במילה (ratchet — GUIDE_SECTIONS
 * עצמו לא נגע). כותרות עם term מתורגמות ברכיב (termOf על s.term).
 */
export function guideSections(isModuleOn: (m: ModuleKey) => boolean, config?: OrgConfig): GuideSection[] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const loc = (s: GuideSection): GuideSection => {
    let { title, text } = s;
    if (title === 'כרטיס משפחה') title = 'כרטיס ' + T('entity.family', 'משפחה');
    text = swap(text, 'חדרים חיים', T('entity.rooms', 'חדרים') + ' חיים');
    text = swap(text, 'על חדר', 'על ' + T('entity.room', 'חדר'));
    text = swap(text, 'בתוך חוג', 'בתוך ' + T('entity.course', 'חוג'));
    text = swap(text, 'תדפיס למורה', 'תדפיס ל' + T('entity.teacher', 'מורה'));
    text = swap(text, '＋ תרומה', '＋ ' + T('entity.donation', 'תרומה'));
    text = swap(text, 'שיוך למשפחה', 'שיוך ל' + T('entity.family', 'משפחה'));
    return title === s.title && text === s.text ? s : { ...s, title, text };
  };
  return GUIDE_SECTIONS.filter((s) => !s.module || isModuleOn(s.module)).map(loc);
}

/**
 * "המתכונים המהירים" ממותג-מחדש — מונחי-הישות עוברים termOf; בלי config =
 * GUIDE_RECIPES מילה-במילה (ratchet — הקבוע עצמו לא נגע, נשאר fallback).
 */
export function guideRecipes(config?: OrgConfig): string {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  let r = GUIDE_RECIPES;
  r = swap(r, 'ליד השיבוץ', 'ליד ה' + T('entity.enrollment', 'שיבוץ'));
  r = swap(r, 'כדי שיבוץ', 'כדי ' + T('entity.enrollment', 'שיבוץ'));
  r = swap(r, 'משפחה חדשה', T('entity.family', 'משפחה') + ' חדשה');
  r = swap(r, 'חוג מתאים', T('entity.course', 'חוג') + ' מתאים');
  r = swap(r, 'מצא חוג', 'מצא ' + T('entity.course', 'חוג'));
  r = swap(r, 'החוג', 'ה' + T('entity.course', 'חוג'));
  r = swap(r, 'למורה', 'ל' + T('entity.teacher', 'מורה'));
  r = swap(r, '← ＋ תרומה', '← ＋ ' + T('entity.donation', 'תרומה'));
  r = swap(r, 'תרומה ←', T('entity.donation', 'תרומה') + ' ←');
  return r;
}
