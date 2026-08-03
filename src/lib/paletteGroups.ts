/**
 * קיבוץ תוצאות הפלטה לפי סוג (P1.6, feature shell.palette.actions) — טהור.
 *
 * ratchet — בלגאסי תוצאות החיפוש מקובצות תחת כותרות-סוג (push(type,...) —
 * legacy-main-script.js:2373 והלאה: משפחות/ילדים/חוגים/מורות/תומכות/מסמכים/
 * אירועים). כאן: מיון יציב לדליי-סוג לפי קידומת ה-key, שמירת סדר הרלוונטיות
 * בתוך כל דלי, וכותרת section על הפריט הראשון של כל דלי.
 */

import type { OrgConfig } from '../types/config';
import { termOf } from './config';

export interface KeyedCmd {
  key: string;
  section?: string;
}

/**
 * סדר הדליים והכותרות — לפי קידומת ה-key של פריטי הפלטה. הכותרות עוברות
 * termOf כדי שתיוג-מחדש פר-עסק יחלחל; בלי config (טסטים/קוראים ישנים) = נוסח
 * ברירת-המחדל, ביט-זהה. הקידומות קבועות (bucketOf לא תלוי config).
 */
function buckets(config?: OrgConfig): [prefix: string, label: string][] {
  const T = (k: string, fb: string) => (config ? termOf(config, k, fb) : fb);
  const teacher = T('entity.teacher', 'מורה');
  return [
    ['nav-', 'ניווט ופעולות'],
    ['act-', 'ניווט ופעולות'],
    ['enr-', T('entity.enrollments', 'שיבוצים')],
    ['fam-', T('nav.families', 'משפחות')],
    ['mem-', T('entity.members', 'בני משפחה')],
    ['crs-', T('nav.courses', 'חוגים')],
    ['tch-', teacher === 'מורה' ? 'מורים' : teacher],
    ['sup-', 'תומכות'],
    ['doc-', 'מסמכים'],
    ['ev-', 'אירועים'],
    ['punch-', 'כרטיסיות'],
  ];
}

function bucketOf(key: string): number {
  const b = buckets();
  const i = b.findIndex(([p]) => key.startsWith(p));
  return i < 0 ? b.length : i;
}

/**
 * קיבוץ יציב: הפריטים ממוינים לפי דלי (סדר BUCKETS), הסדר הפנימי נשמר,
 * והפריט הראשון בכל דלי מקבל את כותרת הקבוצה.
 */
export function groupPaletteResults<T extends KeyedCmd>(items: T[], config?: OrgConfig): T[] {
  const B = buckets(config);
  const indexed = items.map((it, i) => ({ it, i, b: bucketOf(it.key) }));
  indexed.sort((a, b) => a.b - b.b || a.i - b.i);
  const out: T[] = [];
  let lastLabel = '';
  for (const { it, b } of indexed) {
    const label = b < B.length ? B[b][1] : '';
    // שני דליים חולקים כותרת ('nav-'/'act-') — הכותרת לא מוכפלת
    out.push({ ...it, section: label && label !== lastLabel ? label : undefined });
    if (label) lastLabel = label;
  }
  return out;
}
