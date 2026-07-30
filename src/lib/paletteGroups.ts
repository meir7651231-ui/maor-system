/**
 * קיבוץ תוצאות הפלטה לפי סוג (P1.6, feature shell.palette.actions) — טהור.
 *
 * ratchet — בלגאסי תוצאות החיפוש מקובצות תחת כותרות-סוג (push(type,...) —
 * legacy-main-script.js:2373 והלאה: משפחות/ילדים/חוגים/מורות/תומכות/מסמכים/
 * אירועים). כאן: מיון יציב לדליי-סוג לפי קידומת ה-key, שמירת סדר הרלוונטיות
 * בתוך כל דלי, וכותרת section על הפריט הראשון של כל דלי.
 */

export interface KeyedCmd {
  key: string;
  section?: string;
}

/** סדר הדליים והכותרות — לפי קידומת ה-key של פריטי הפלטה. */
const BUCKETS: [prefix: string, label: string][] = [
  ['nav-', 'ניווט ופעולות'],
  ['act-', 'ניווט ופעולות'],
  ['enr-', 'שיבוצים'],
  ['fam-', 'משפחות'],
  ['mem-', 'בני משפחה'],
  ['crs-', 'חוגים'],
  ['tch-', 'מורים'],
  ['sup-', 'תומכות'],
  ['doc-', 'מסמכים'],
  ['ev-', 'אירועים'],
  ['punch-', 'כרטיסיות'],
];

function bucketOf(key: string): number {
  const i = BUCKETS.findIndex(([p]) => key.startsWith(p));
  return i < 0 ? BUCKETS.length : i;
}

/**
 * קיבוץ יציב: הפריטים ממוינים לפי דלי (סדר BUCKETS), הסדר הפנימי נשמר,
 * והפריט הראשון בכל דלי מקבל את כותרת הקבוצה.
 */
export function groupPaletteResults<T extends KeyedCmd>(items: T[]): T[] {
  const indexed = items.map((it, i) => ({ it, i, b: bucketOf(it.key) }));
  indexed.sort((a, b) => a.b - b.b || a.i - b.i);
  const out: T[] = [];
  let lastLabel = '';
  for (const { it, b } of indexed) {
    const label = b < BUCKETS.length ? BUCKETS[b][1] : '';
    // שני דליים חולקים כותרת ('nav-'/'act-') — הכותרת לא מוכפלת
    out.push({ ...it, section: label && label !== lastLabel ? label : undefined });
    if (label) lastLabel = label;
  }
  return out;
}
