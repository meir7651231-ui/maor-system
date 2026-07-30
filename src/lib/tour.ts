/**
 * מצב הדגמה ▶ משודרג — סיור spotlight מודרך (P2 פער 30, מימוש הכרעה 4).
 *
 * מקור האמת: legacy-main-script.js:1105-1258 (runDemo) — הלגאסי מריץ
 * אוטו-קליקר שמדגים את המערכת לבד עם כיתובים. הכרעת המשתמש #4
 * (DECISIONS-2026-07-29): לא פורט של האוטו-קליקר אלא סיור מודרך על המסכים
 * האמיתיים — הצעדים לפי תסריט הלגאסי (הכיתובים מילה-במילה), המשתמש שולט
 * בקצב (הבא/הקודם) וניתן לעצור בכל שלב (Esc / ■).
 *
 * קובץ טהור: אין React/DOM/store — לוגיקת הצעדים והגאומטריה נבדקות ביחידה.
 */

/** המסכים שהסיור עובר בהם — תת-קבוצה של View. */
export type TourView = 'home' | 'families' | 'courses' | 'calendar' | 'tzedaka' | 'shop' | 'settings';

/** מודול שמסתיר צעד כשהוא כבוי (בית/הגדרות — תמיד פעילים). */
export type TourModule = 'families' | 'courses' | 'calendar' | 'tzedaka' | 'shop';

export interface TourStep {
  /** המסך שהצעד מתרחש בו — הסיור מנווט אליו בפועל. */
  view: TourView;
  /** הכיתוב — מילה-במילה מכיתובי ההדמיה של הלגאסי. */
  caption: string;
  /** טקסט לאיתור אלמנט ל-spotlight; חסר/לא נמצא = כיתוב בלבד. */
  anchorText?: string;
  /** מודול שנדרש לצעד; ריק = תמיד. */
  module?: TourModule;
}

/** כפתור העצירה — הנוסח מהלגאסי (markup:2956). */
export const TOUR_STOP_LABEL = '■ עצירת הדמיה (Esc)';

/** תסריט הסיור — פרקי runDemo בסדר הלגאסי, כיתובים מילה-במילה (script:1133-1256). */
export const TOUR_STEPS: TourStep[] = [
  { view: 'home', caption: '👋 הדמיה מלאה — המערכת מדגימה את עצמה, על הנתונים האמיתיים' },
  { view: 'home', caption: 'סטטיסטיקות חיות — כל אריח לחיץ', anchorText: 'מדד אמינות' },
  { view: 'home', caption: '⌘K — חיפוש חכם מכל מקום', anchorText: 'חיפוש' },
  {
    view: 'families',
    module: 'families',
    caption: '🎡 מאתר המשפחות — גלגל בתוך הדף',
    anchorText: 'סינון מורחב',
  },
  { view: 'families', module: 'families', caption: 'ניקוב נוכחות — היתרה יורדת + 5 נק׳ אמינות' },
  { view: 'families', module: 'families', caption: 'רישום חיסור — עם כלל 48 השעות' },
  { view: 'courses', module: 'courses', caption: '🎡 מאתר החוגים', anchorText: 'מצא חוג' },
  { view: 'courses', module: 'courses', caption: 'חיזוי חוגים: רק תואמי גיל ומגדר' },
  { view: 'calendar', module: 'calendar', caption: '📅 עברי + לועזי · שכבות סינון' },
  // העמודות המבודדות (CONNECT חיבור 5) — צעד לכל עמודה, מגודר במודול שלה
  { view: 'tzedaka', module: 'tzedaka', caption: '🪙 קופות צדקה — רכזים, קופות בבתים, ריקונים ומבצעים' },
  { view: 'shop', module: 'shop', caption: '🛍 החנות — חבילות שירות, מלאי משותף ומימושים עם אישור' },
  { view: 'settings', caption: '⚙ ארגון, התראות, דוחות, מנוע אמינות' },
  { view: 'home', caption: 'ובחזרה הביתה — הכל התעדכן' },
  { view: 'home', caption: 'זו המערכת. חיה, מלאה, במקום אחד ✦' },
];

/** סינון הצעדים לפי מודולים פעילים — צעד בלי מודול תמיד נשאר. */
export function tourSteps(isModuleOn: (m: TourModule) => boolean): TourStep[] {
  return TOUR_STEPS.filter((s) => !s.module || isModuleOn(s.module));
}

/**
 * ניווט בין צעדים: delta ‎+1/-1‎; לפני ההתחלה נצמד ל-0, אחרי הסוף = null (סיום).
 */
export function tourAdvance(index: number, delta: number, length: number): number | null {
  const next = index + delta;
  if (next < 0) return 0;
  if (next >= length) return null;
  return next;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * חישוב חלון ה-spotlight סביב אלמנט: ריפוד קבוע, ונצמד לגבולות המסך
 * כך שהחור לעולם לא חורג מה-viewport. rect ריק (מידות 0) = אין חור.
 */
export function spotlightBox(rect: Rect | null, vw: number, vh: number, pad = 10): Rect | null {
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  const left = Math.max(0, rect.left - pad);
  const top = Math.max(0, rect.top - pad);
  return {
    left,
    top,
    width: Math.min(vw - left, rect.width + pad * 2),
    height: Math.min(vh - top, rect.height + pad * 2),
  };
}
