/**
 * מנוע-פריסה טהור לווידג'טים (5.10.2026) — מופשט מלוח-הבית (HomeView/BoardEdit) כדי שגם כרטיס-התורם
 * יסדר את הקוביות שלו באותם כללים: רשימת-מזהים שמורה ב-db.ui, חסר/ריק = ברירת-המחדל, מזהה שלא ברשימה = מוסתר.
 * אפס DOM/store — הכול פונקציות על מערכי-מחרוזות.
 */

/** ניקוי פריסה שמורה: רק מזהים מוכרים, בלי כפולים, בסדר השמור. ריק/חסר ⇒ fallback. */
export function sanitizeIds(
  raw: readonly string[] | undefined,
  allowed: readonly string[],
  fallback: readonly string[],
  opts: { fallbackIfEmpty?: boolean } = {},
): string[] {
  if (!raw || raw.length === 0) return [...fallback];
  const out: string[] = [];
  for (const id of raw) if (allowed.includes(id) && !out.includes(id)) out.push(id);
  return out.length === 0 && opts.fallbackIfEmpty ? [...fallback] : out;
}

/** חצים ▲/▼ — החלפה עם השכן; לא חוצים את minIndex (לוח-הבית נועל את hero ב-0). */
export function shiftId(list: readonly string[], id: string, dir: 1 | -1, minIndex = 0): string[] {
  const from = list.indexOf(id);
  const to = from + dir;
  if (from < minIndex || to < minIndex || to >= list.length) return [...list];
  const next = [...list];
  next[from] = next[to];
  next[to] = id;
  return next;
}

export const removeId = (list: readonly string[], id: string): string[] => list.filter((x) => x !== id);
export const addId = (list: readonly string[], id: string): string[] => (list.includes(id) ? [...list] : [...list, id]);
export const sameOrder = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * מה להתמיד אחרי "שמירה": ברירת-המחדל ⇒ undefined (ביט-זהה ללקוח שלא נגע);
 * אחרת ה-draft + המזהים שמוסתרים כרגע ע"י דגל/מודול (שורדים שמירה — אחרת עריכה בזמן שמודול כבוי
 * הייתה משמיטה אותם לתמיד; לקח לוח-הבית 19.8).
 */
export function persistLayout(
  draft: readonly string[],
  saved: readonly string[],
  isVisible: (id: string) => boolean,
  defaultVisible: readonly string[],
): string[] | undefined {
  const hidden = saved.filter((id) => !isVisible(id));
  return sameOrder(draft, defaultVisible) && hidden.length === 0 ? undefined : [...draft, ...hidden];
}
