/**
 * 🧊 freeze · מקפיא ומחליף תוכן — חלק טהור בלי עולם (STATIC-VERBS, 14.10.2026).
 *
 * מריץ רשימת פעולות על מחסן של רשומות-עם-גרסאות:
 *   · 'put'     — כתיבה. ברשומה פתוחה מחליפה את הגרסה הנוכחית (טיוטה); ברשומה קפואה — **נדחית** ולא נוגעת בכלום.
 *   · 'freeze'  — מקפיא את הרשומה (קבלה שהונפקה, תצלום, מהדורה שפורסמה).
 *   · 'replace' — ברשומה קפואה: גרסה **חדשה** נוספת בסוף והישנות נשארות כמו שהן; ברשומה פתוחה — כמו put.
 * כמו קבלות-המס באורביט (קבלה שהונפקה לא נערכת; ביטול-מימוש = voidedAt והרשומה וה-S- נשארים; ביטול-כפול נדחה),
 * והקבלות בענן (עדכון/מחיקה רק למנהל).
 */

/**
 * @param {{op: 'put'|'freeze'|'replace', id: 'r1'|'r2'|'r3', content?: string}[]} ops
 * @returns {{records: Record<string, {versions: any[], frozen: boolean}>, rejected: number[]}}
 */
export function applyFrozen(ops) {
  /** @type {Record<string, {versions: any[], frozen: boolean}>} */
  const records = {};
  const rejected = [];
  (Array.isArray(ops) ? ops : []).forEach((o, k) => {
    if (!o || typeof o !== 'object' || typeof o.id !== 'string' || !o.id) { rejected.push(k); return; }
    const r = Object.hasOwn(records, o.id) ? records[o.id] : null;
    if (o.op === 'freeze') {
      if (!r || r.frozen) { rejected.push(k); return; }
      r.frozen = true;
    } else if (o.op === 'put' || o.op === 'replace') {
      const c = o.content === undefined ? null : o.content;
      if (!r) records[o.id] = { versions: [c], frozen: false };
      else if (!r.frozen) r.versions[r.versions.length - 1] = c;
      else if (o.op === 'replace') r.versions.push(c);
      else rejected.push(k);
    } else rejected.push(k);
  });
  const sorted = {};
  for (const id of Object.keys(records).sort()) sorted[id] = { versions: records[id].versions.slice(), frozen: records[id].frozen };
  return { records: sorted, rejected };
}
