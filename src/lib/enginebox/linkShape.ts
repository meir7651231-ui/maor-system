/**
 * 🧰 ארגז-המנועים — ריפוי **צורת** `ui.engineLinks` (תיקון משקל-טעינה A2, 13.10.2026).
 *
 * הקובץ הזה הוא היחיד מארגז-המנועים שהבנדל-הראשי (persist/cloud-merge) מייבא — ולכן **אפס ייבואים** במכוון:
 * לא parts, לא plugs, לא match, לא config, לא המרכזייה. נמדד: ייבוא `links` גרר את כל הקטלוג ל-chunk ה-persist
 * (‏+3,279 bytes gzip לכל ארגון) — וארגז-המנועים opt-in ובלתי-נראה, הלקוח-החי לא משלם עליו.
 *
 * כאן רק צורה: מערך מחרוזות `חלק>מחבר>חלק` (תווי-מזהה מותרים בלבד) · trim · בלי כפילויות · מיון לקסיקוגרפי · עד 500.
 * לא-מערך ⇒ המפתח יורד (החלטה 7); חסר נשאר חסר. האימות מול הקטלוג (`sanitizeLinks`/`effectiveLinks` ב-links.ts)
 * נעשה בזמן-השימוש — מפתח בצורה תקינה שאינו בקטלוג פשוט לעולם לא "מחובר".
 *
 * 🧬 ATOMS 14.10: הייבוא היחיד — `../atoms/capShape` (גם הוא בלי ייבואים, ובאותו chunk — vite.config): `healEngineBoxIn` מרפא
 * בקריאה אחת גם את `engineLinks` וגם את `capabilities`, כדי ש-persist/cloud-merge לא יגדלו בקריאה נוספת.
 */
import { healCapabilitiesIn } from '../atoms/capShape';

/** תקרת רשימה שמורה (זהה ל-`MAX_LINKS` ב-links.ts — ננעל בבדיקה). */
export const MAX_LINK_SHAPES = 500;

const ID = '[a-z][a-z0-9._-]{0,39}';
const LINK_SHAPE = new RegExp('^' + ID + '>' + ID + '>' + ID + '$');

/** חיטוי-צורה: לא-מערך ⇒ undefined; אחרת מחרוזות בצורת-חיבור, מקוצצות, ייחודיות, ממוינות, עד 500. לעולם לא זורק. */
export function sanitizeLinkShapes(x: unknown): string[] | undefined {
  if (!Array.isArray(x)) return undefined;
  const seen = new Set<string>();
  for (const k of x as unknown[]) {
    if (typeof k !== 'string') continue;
    const t = k.trim();
    if (LINK_SHAPE.test(t)) seen.add(t);
  }
  return [...seen].sort().slice(0, MAX_LINK_SHAPES);
}

const sameList = (a: readonly unknown[], b: readonly string[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * ריפוי `engineLinks` בתוך אובייקט-ui (migrate · מיזוג meta מהענן). בלי המפתח / לא-אובייקט ⇒ אותו ערך (ביט-זהה);
 * רשימה בצורה תקינה וממוינת ⇒ אותה הפניה; אחרת — עותק עם הרשימה המחוטאת, או בלי המפתח כשהערך אינו מערך.
 */
export function healEngineLinksIn<T>(ui: T): T {
  if (!ui || typeof ui !== 'object' || Array.isArray(ui) || !('engineLinks' in ui)) return ui;
  const rec = ui as Record<string, unknown>;
  const cur = rec.engineLinks;
  if (cur === undefined) return ui;
  const clean = sanitizeLinkShapes(cur);
  if (clean === undefined) {
    const out = { ...rec };
    delete out.engineLinks;
    return out as T;
  }
  if (Array.isArray(cur) && sameList(cur, clean)) return ui;
  return { ...rec, engineLinks: clean } as T;
}

/** ריפוי-הצורה של ארגז-המנועים ב-ui: `engineLinks` + `capabilities` (ATOMS 14.10). בלי שני המפתחות ⇒ אותו ערך. */
export function healEngineBoxIn<T>(ui: T): T {
  return healCapabilitiesIn(healEngineLinksIn(ui));
}
