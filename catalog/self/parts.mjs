/**
 * 🧩 חלקי-המכונה (SELF, 14.10.2026) — העוזרים שהמכונה כתבה לעצמה שוב ושוב (13 ממיינים-לפי-id, 3 "מונים בסדר יורד",
 * 6 העתקים של FNV-1a), כל אחד פעם אחת, מוכח בהרצה לפועל שלו ב-catalog/scripts/self-check.mjs (אותו ארגז-חול, אותו זרע;
 * הדוח: catalog/self/report.json › roles). הקוד כאן = הקוד שהיה בהעתקים, מילה במילה — ולכן ההחלפה ביט-זהה.
 * `ORIGINS` = איפה כל אחד היה (קובץ:שורה לפני ההחלפה) — כמו origins של ליבות-החומר.
 * טהור. בלי I/O.
 */

/** «ממיין»: משווה לפי id (קודם קטן, שווה ⇒ 0). `xs.sort(byId)`. */
export const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** «ממיין»: מונים — הגדול קודם, שווים לפי השם. אובייקט {שם: מונה} ⇒ אותו אובייקט בסדר הזה. */
export const rankCounts = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));

/** FNV-1a על יחידות UTF-16 (charCodeAt) ⇒ מספר 32-ביט. זרעים וטביעות של הקורא. */
export function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}
/** «מטביע חותם»: FNV-1a (UTF-16) ⇒ 8 ספרות הקס — אורך קבוע. */
export const fnvHex = (s) => fnv1a(s).toString(16).padStart(8, '0');

/** FNV-1a על נקודות-קוד (for…of · codePointAt) ⇒ מספר 32-ביט. שונה מ-fnv1a רק בתווים מחוץ ל-BMP (אמוג'י). */
export function fnv1aPoints(s) {
  let h = 0x811c9dc5;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}
/** «מטביע חותם»: FNV-1a (נקודות-קוד) ⇒ 8 ספרות הקס. מזהי-מילים וחותמות-תוכן של המפקדים. */
export const fnvHexPoints = (s) => fnv1aPoints(s).toString(16).padStart(8, '0');

/** איפה כל חלק היה כתוב לפני שהוחלף (ובמה): file:line בקומיט-הבסיס 2c990a6. */
export const ORIGINS = {
  byId: [
    'catalog/combiner/core.mjs:185', 'catalog/combiner/core.mjs:245', 'catalog/inner/lib/build.mjs:166', 'catalog/scripts/behavior-probe.mjs:58',
    'catalog/scripts/core-census.mjs:69', 'catalog/scripts/orbit-census.mjs:728', 'catalog/scripts/core-b-census.mjs:84', 'catalog/scripts/core-c-census.mjs:98',
    'catalog/inner/scripts/prove.mjs:119',
  ],
  rankCounts: ['catalog/lib/build-index.mjs:28', 'catalog/inner/lib/build.mjs:25', 'catalog/lib/entry.mjs:70'],
  fnv1a: ['catalog/lib/probe.mjs:19', 'catalog/lib/verbs-sun.mjs:74'],
  fnvHex: ['catalog/lib/verbs.mjs:74', 'catalog/lib/probe.mjs:433'],
  fnvHexPoints: ['catalog/combiner/core.mjs:796', 'catalog/scripts/core-b-census.mjs:22', 'catalog/scripts/core-c-census.mjs:79'],
};
