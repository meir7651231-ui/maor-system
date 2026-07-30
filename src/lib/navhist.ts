/**
 * ניווט-אחורה + "נפתחו לאחרונה" (P1.5, feature shell.navhist) — טהור בלבד.
 *
 * ratchet — legacy-main-script.js:
 * - 166: מחסנית navHist עד 20 צעדים — כל מעבר-מיקום דוחף את הקודם, מעבר לתקרה
 *   נזרק הישן ביותר (shift).
 * - 3146-3147: "↩ חזרה" מוצג רק כשיש היסטוריה; goBack שולף את האחרון ומנווט
 *   אליו בלי לרשום את החזרה עצמה כצעד.
 * - 344-346, 422: recentIds — פתיחת משפחה מקדמת אותה לראש הרשימה, עד 6.
 */

/** מיקום ניווט — מסך + הבחירות הפעילות (המקבילה ל-view/selId/selCourseId בלגאסי). */
export interface NavLoc {
  view: string;
  selFamilyId: string | null;
  selCourseId: string | null;
}

export const NAV_HIST_MAX = 20;
export const RECENT_MAX = 6;

/** האם שני מיקומים זהים — מעבר לאותו מיקום אינו נרשם כצעד. */
export function sameLoc(a: NavLoc, b: NavLoc): boolean {
  return a.view === b.view && a.selFamilyId === b.selFamilyId && a.selCourseId === b.selCourseId;
}

/** דחיפת המיקום הקודם למחסנית — תקרה 20, הישן ביותר נזרק (legacy:166). */
export function pushNav(hist: NavLoc[], prev: NavLoc): NavLoc[] {
  const h = [...hist, prev];
  return h.length > NAV_HIST_MAX ? h.slice(h.length - NAV_HIST_MAX) : h;
}

/** קידום משפחה לראש "נפתחו לאחרונה" — ייחודי, עד 6 (legacy:344-346). */
export function pushRecent(ids: string[], id: string): string[] {
  return [id, ...ids.filter((x) => x !== id)].slice(0, RECENT_MAX);
}
