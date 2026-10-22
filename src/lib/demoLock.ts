/**
 * 🔒 נעילת-הדמו (22.10.2026). דרישת-הבעלים, מילה במילה:
 * «בדמו זה צריך חסום ללא כל אפשרות להורדת מידע ואם רוצים אתר משלך זה שולח אותך למסך הרשמה».
 *
 * הדמו הציבורי (?org=demo) הוא ארגז-חול: מבקר משחק בנתוני-דוגמה, אבל אסור שייצא ממנו שום
 * מידע — לא קובץ, לא הדפסה ולא העתקה. שלוש שכבות:
 *  1. שער יציאת-המידע (lib/exportGate) נחסם בדמו ⇒ כל נתיב-הורדה/הדפסה/העתקה של האפליקציה
 *     מסרב בנקודת-חנק אחת עם הודעה שמזמינה לפתוח אתר משלכם (App). נתיבים שלא היו בשער לפני
 *     הדמו (העתקות, קבצים-מצורפים, גיבוי) נחסמים במנעול-הדמו (guardDemo/demoLocked) — רק בדמו,
 *     כך שאצל עובד/ת שהמנהל כיבה לה core.export הם כמו קודם (ביקורת 22.10).
 *  2. קיצורי-הדפדפן Ctrl/Cmd+P (הדפסה) ו-Ctrl/Cmd+S (שמירת-הדף) נבלעים, והעתקה/גזירה
 *     ידנית של טקסט מהמסך מבוטלת (installDemoLock). גם מה שלא עובר באירוע-העתקה נחסם:
 *     סימון-טקסט (Ctrl+A ⇒ גרירה ל-Word/לשונית אחרת, או «שיתוף/חיפוש» בסרגל-הסימון בנייד) —
 *     אין סימון מחוץ לשדות-קלט (global.css); גרירת טקסט/קישור/תמונה מבוטלת (חוץ מידיות-גרירה
 *     של האפליקציה, [draggable="true"]); ותפריט-הלחיצה-הימנית («העתקת כתובת הקישור», «שמירת
 *     תמונה בשם», «חיפוש ב-Google», «תרגום») לא נפתח — גם לא בשדה-קלט שיש בו תוכן (טפסי-העריכה
 *     בדמו ממולאים בשם/טלפון/ת"ז/כתובת של הרשומה; ביקורת 22.10). רק בשדה ריק התפריט נשאר (הדבקה).
 *     שארית מתועדת: בנייד, סרגל-הסימון של טקסט **בתוך שדה עריך** («שיתוף»/«חיפוש באינטרנט») לא
 *     ניתן לחסימה מ-JS בלי לשבור הקלדה ותיקון; שדות לקריאה-בלבד — בלי סימון בכלל (global.css).
 *  3. הדפסה מתפריט-הדפדפן — אי-אפשר לבטל אותה מ-JS, לכן גיליון-ההדפסה מסתיר את הדף
 *     כש-data-demo-lock על ה-root (styles/global.css).
 *
 * מחוץ לדמו שום דבר כאן לא רץ — הלקוח-החי ביט-זהה.
 */
import type { OrgConfig } from '../types/config';
import { orgSlugFromUrl } from './config';

export const DEMO_SLUG = 'demo';

/** ההודעה שהמבקר בדמו רואה בכל ניסיון להוציא מידע — בעברית פשוטה, עם הדרך החוצה. */
export const DEMO_EXPORT_BLOCKED_MSG =
  '🔒 בדמו אי אפשר להוריד, להדפיס או להעתיק מידע. רוצים לעבוד עם המידע שלכם? פתחו אתר משלכם';

/** תכונת-ה-root שגיליון-ההדפסה נשען עליה (global.css). */
export const DEMO_LOCK_ATTR = 'data-demo-lock';

/**
 * האם זה סשן-דמו. גם הכתובת (?org=demo) נבדקת, לא רק config.slug — הגנת-עומק: שינוי של
 * מזהה-הלקוח בתוך האשף לא יפתח את המנעול באמצע הסשן.
 */
export function isDemoSession(cfg: Pick<OrgConfig, 'slug'>, urlSlug: string | null = orgSlugFromUrl()): boolean {
  return cfg.slug === DEMO_SLUG || urlSlug === DEMO_SLUG;
}

/** האם צירוף-המקשים הוא הדפסה (P) או שמירת-הדף (S) — גם בפריסה עברית (לפי code). */
export function isPrintOrSaveShortcut(e: { key: string; code?: string; ctrlKey: boolean; metaKey: boolean; altKey?: boolean }): boolean {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
  const k = (e.key || '').toLowerCase();
  return k === 'p' || k === 's' || e.code === 'KeyP' || e.code === 'KeyS';
}

/**
 * שדות-קלט — שם הסימון וההדבקה נשארים (המבקר צריך להקליד ולתקן). תפריט-ההקשר נשאר רק בשדה **ריק**
 * (isEmptyEditable) — בשדה עם תוכן הוא היה מוציא את הטקסט («חיפוש ב-Google»/«תרגום»/«שיתוף»).
 */
export const DEMO_EDITABLE_SELECTOR = 'input, textarea, [contenteditable]:not([contenteditable="false"])';

/** ידיות-גרירה של האפליקציה (BoardEdit — סידור לוח-הבית) — הגרירה שלהן ממשיכה לעבוד. */
export const DEMO_DRAG_ALLOWED_SELECTOR = '[draggable="true"]';

/** פקדי-האפליקציה — לחיצה-ימנית עליהם היא פעולה (הקופה: −1), לא יציאת-מידע ⇒ בלי הודעה. */
export const DEMO_APP_CONTROL_SELECTOR = 'button, [role="button"]';

/** closest בטוח — יעד האירוע יכול להיות צומת-טקסט (גרירת טקסט מסומן) שאין לו closest. */
function closestEl(target: EventTarget | null, selector: string): unknown {
  const el = target as { closest?: (s: string) => unknown } | null;
  return typeof el?.closest === 'function' ? el.closest(selector) ?? null : null;
}

function closestOf(target: EventTarget | null, selector: string): boolean {
  return !!closestEl(target, selector);
}

/**
 * האם שדה-הקלט ריק — אין בו טקסט שתפריט-ההקשר יכול להוציא («חיפוש»/«תרגום»/«שיתוף»), ולכן התפריט
 * (הדבקה) נשאר. input/textarea ⇒ value; contenteditable ⇒ textContent. לא-ידוע ⇒ לא ריק (חוסמים).
 */
export function isEmptyEditable(el: unknown): boolean {
  const f = el as { value?: unknown; textContent?: unknown } | null;
  if (!f) return false;
  if (typeof f.value === 'string') return f.value === '';
  if (typeof f.textContent === 'string') return f.textContent.trim() === '';
  return false;
}

/**
 * מתקין את המנעול על המסמך (בדמו בלבד, מ-App). מחזיר פונקציית-ניקוי שמסירה הכול —
 * יציאה מהדמו לא משאירה מאזין או תכונה.
 */
export function installDemoLock(onBlocked: () => void, doc: Document = document): () => void {
  const root = doc.documentElement;
  root.setAttribute(DEMO_LOCK_ATTR, '');
  const onKey = (e: KeyboardEvent) => {
    if (!isPrintOrSaveShortcut(e)) return;
    e.preventDefault();
    e.stopPropagation();
    onBlocked();
  };
  const onCopy = (e: Event) => {
    e.preventDefault(); // הלוח נשאר כמו שהיה — שום טקסט מהמסך לא יוצא
    onBlocked();
  };
  // גרירת טקסט מסומן / קישור / תמונה החוצה (ל-Word, לשורת-הכתובת, ללשונית אחרת) — לא עוברת
  // באירוע-העתקה. ידיות-הגרירה של האפליקציה ([draggable="true"]) ממשיכות לעבוד.
  const onDrag = (e: Event) => {
    if (closestOf(e.target, DEMO_DRAG_ALLOWED_SELECTOR)) return;
    e.preventDefault();
    onBlocked();
  };
  // תפריט-ההקשר: «העתקת כתובת הקישור», «העתקת תמונה», «שמירה בשם», «חיפוש ב-Google», «תרגום» —
  // עוקפים את אירוע-ההעתקה. נבלע גם בשדה-קלט שיש בו תוכן (ביקורת 22.10: טפסי-העריכה ממולאים בנתוני
  // הרשומה); רק בשדה ריק התפריט נשאר (הדבקה — ואין בו מה להוציא). הקלדה, הדבקה ותיקון במקלדת —
  // ללא שינוי (רק הצעות-האיות של התפריט אובדות בשדה ממולא, בדמו בלבד). על כפתור (הקופה: לחיצה-ימנית
  // = −1) — נבלע אבל בלי הודעה: פעולה של האפליקציה.
  const onMenu = (e: Event) => {
    const field = closestEl(e.target, DEMO_EDITABLE_SELECTOR);
    if (field && isEmptyEditable(field)) return;
    e.preventDefault();
    if (!field && closestOf(e.target, DEMO_APP_CONTROL_SELECTOR)) return;
    onBlocked();
  };
  doc.addEventListener('keydown', onKey, true);
  doc.addEventListener('copy', onCopy, true);
  doc.addEventListener('cut', onCopy, true);
  doc.addEventListener('dragstart', onDrag, true);
  doc.addEventListener('contextmenu', onMenu, true);
  return () => {
    doc.removeEventListener('keydown', onKey, true);
    doc.removeEventListener('copy', onCopy, true);
    doc.removeEventListener('cut', onCopy, true);
    doc.removeEventListener('dragstart', onDrag, true);
    doc.removeEventListener('contextmenu', onMenu, true);
    root.removeAttribute(DEMO_LOCK_ATTR);
  };
}
