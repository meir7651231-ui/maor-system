/**
 * 🧬 מנועים וחלקים — ריפוי **צורת** `ui.capabilities` (ATOMS, 14.10.2026). אותו דפוס כמו `enginebox/linkShape.ts`.
 *
 * הקובץ היחיד משכבת-החלקים שהבנדל-הראשי (persist/cloud-merge) מייבא — ולכן **אפס ייבואים** במכוון (לא כרטיסים,
 * לא חלקים, לא תצוגות), ויושב ב-chunk של linkShape (vite.config) ⇒ אין בקשת-הפעלה נוספת.
 * כאן רק צורה: מערך של רשומות עם `id` מחרוזת, עד 200. לא-מערך ⇒ המפתח יורד; חסר נשאר חסר; תקין ⇒ אותה הפניה.
 * האימות המלא מול הכרטיסים (מנוע/מקום/חלק/פרמטרים) נעשה בזמן-השימוש — `sanitizeCapabilities` ב-capabilities.ts.
 */

/** תקרת רשימה שמורה. */
export const MAX_CAPABILITIES = 200;

const ok = (c: unknown, i: number): boolean => i < MAX_CAPABILITIES && typeof (c as { id?: unknown } | null)?.id == 'string';

/** ריפוי `capabilities` בתוך אובייקט-ui. לעולם לא זורק. */
export function healCapabilitiesIn<T>(ui: T): T {
  const c = (ui as { capabilities?: unknown } | null)?.capabilities;
  if (c === undefined || (Array.isArray(c) && c.every(ok))) return ui;
  const out = { ...ui } as { capabilities?: unknown };
  if (Array.isArray(c)) out.capabilities = c.filter(ok);
  else delete out.capabilities;
  return out as T;
}
