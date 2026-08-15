/**
 * נגישות — החלה על ה-DOM והתמדה ב-localStorage. משותף לשני הכניסות:
 * הגדרות ← נגישות (AccessSection) וה-FAB הצף ♿ (A11yFab, P2 פער 31).
 * ההעדפות אישיות לדפדפן זה ואינן חלק מגיבוי הנתונים.
 * הקובץ מיישם את ההעדפות גם בעליית האפליקציה (side-effect בטעינת המודול).
 */
import { clampScale, parseAcc, type AccPrefs } from '../../lib/a11y';

const SCALE_KEY = 'maor_ui_scale';
const ACC_KEY = 'maor_acc';

export function readScale(): number {
  try {
    const v = parseFloat(localStorage.getItem(SCALE_KEY) ?? '1');
    return Number.isFinite(v) ? clampScale(v) : 1;
  } catch {
    return 1;
  }
}

export function readAcc(): AccPrefs {
  try {
    return parseAcc(localStorage.getItem(ACC_KEY));
  } catch {
    return parseAcc(null);
  }
}

export function applyScale(scale: number): void {
  // zoom מגדיל את כל הממשק — כולל רכיבים עם מידות px קבועות, ש-root font-size
  // לא השפיע עליהם (נתמך בכל הדפדפנים המודרניים, כולל Firefox 126+).
  // ההצהרה עדיין לא בכל גרסאות lib.dom — לכן ההרחבה הטיפוסית המקומית.
  (document.body.style as CSSStyleDeclaration & { zoom: string }).zoom = String(scale);
  // ניקוי המנגנון הישן (root font-size) — שלא יוכפל עם ה-zoom
  document.documentElement.style.fontSize = '';
  // דגל-זום ל-CSS: ‏zoom על body שובר יחידות-viewport (50vw) — באנר הבית של קהילה
  // גלש והתוכן נחתך בזום>1. הדגל מחליף את מילוי-הרוחב מבוסס-ה-vw בשוליים-בפיקסלים
  // (עקביים-לזום). scale=1 ⇒ הדגל מוסר ⇒ מילוי-הרוחב המקורי חוזר ביט-זהה.
  if (Math.abs(scale - 1) > 0.001) document.documentElement.setAttribute('data-ui-zoom', '1');
  else document.documentElement.removeAttribute('data-ui-zoom');
}

export function applyAcc(a: AccPrefs): void {
  const el = document.documentElement;
  if (a.contrast) el.setAttribute('data-contrast', 'high');
  else el.removeAttribute('data-contrast');
  if (a.noanim) el.setAttribute('data-noanim', '1');
  else el.removeAttribute('data-noanim');
  if (a.links) el.setAttribute('data-links', '1');
  else el.removeAttribute('data-links');
  if (a.spacing) el.setAttribute('data-spacing', '1');
  else el.removeAttribute('data-spacing');
}

export function persistScale(scale: number): void {
  try {
    localStorage.setItem(SCALE_KEY, String(scale));
  } catch {
    /* localStorage חסום — ההעדפה תחזיק עד רענון */
  }
}

export function persistAcc(a: AccPrefs): void {
  try {
    localStorage.setItem(ACC_KEY, JSON.stringify(a));
  } catch {
    /* localStorage חסום */
  }
}

// שחזור ההעדפות בעליית האפליקציה — פעם אחת, בטעינת המודול
try {
  applyScale(readScale());
  applyAcc(readAcc());
} catch {
  /* סביבה ללא DOM */
}
