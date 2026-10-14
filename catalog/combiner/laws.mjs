/**
 * ⚖️ המצרף · חוקי-הפעלים הכלליים על דוגמה (COMBINER, 14.10.2026).
 *
 * לחלק שיש לו דוגמה אמיתית (מקובץ-בדיקה, או לבנת-טבעות) — בודקים שהדוגמה מקיימת את החוק של הפועל.
 * למשל "ממיין" ⇒ הפלט מסודר והוא אותם איברים כמו הקלט. דוגמה שסותרת את החוק ⇒ התווית הסטטית שגויה והפועל יורד.
 * החוקים המלאים (אלפי קלטים מחוללים) של שמונת החלקים — ב-`judge.ts` (מהמאמת של אורביט).
 *
 * טהור: בלי fs ובלי שעון. null = אין חוק לבדוק · {ok, why}.
 */

const nums = (x) => Array.isArray(x) && x.length > 0 && x.every((v) => typeof v === 'number' && Number.isFinite(v));
const arrIn = (inp) => Object.values(inp || {}).find((v) => Array.isArray(v));
const numsIn = (inp) => Object.values(inp || {}).filter((v) => typeof v === 'number');
const bag = (xs) => JSON.stringify([...xs].map((x) => JSON.stringify(x)).sort());
/** לבני-הטבעות מחשבות מודולו 16 (מכונת 16 התאים). */
const mod = (part) => (part.source === 'rings' ? 16 : 0);
const m = (v, M) => (M ? ((v % M) + M) % M : v);
const ok = { ok: true, why: '' };
const bad = (why) => ({ ok: false, why });

export const EXAMPLE_LAWS = {
  sort: (ex) => {
    const a = arrIn(ex.in);
    if (!Array.isArray(a) || !Array.isArray(ex.out) || !nums(ex.out)) return null;
    if (bag(a) !== bag(ex.out)) return bad('הפלט אינו אותם איברים');
    const up = ex.out.every((v, i) => !i || ex.out[i - 1] <= v);
    const down = ex.out.every((v, i) => !i || ex.out[i - 1] >= v);
    return up || down ? ok : bad('הפלט לא מסודר');
  },
  reverse: (ex) => {
    const a = arrIn(ex.in);
    if (!Array.isArray(a) || !Array.isArray(ex.out)) return null;
    return JSON.stringify([...a].reverse()) === JSON.stringify(ex.out) ? ok : bad('לא הפוך');
  },
  count: (ex, part) => {
    const a = arrIn(ex.in);
    if (!Array.isArray(a) || typeof ex.out !== 'number') return null;
    return Number.isInteger(ex.out) && ex.out >= 0 && (mod(part) || ex.out <= a.length) ? ok : bad('ספירה מחוץ לתחום');
  },
  sum: (ex, part) => {
    const a = arrIn(ex.in);
    const M = mod(part);
    if (typeof ex.out !== 'number') return null;
    const xs = nums(a) ? a : numsIn(ex.in);
    if (xs.length < 2) return null;
    const s = xs.reduce((p, v) => p + v, 0);
    // לבנה "סכום רווי" — עד 15
    if (/רווי/.test(part.name)) return ex.out === Math.min(s, 15) || m(s, M) === ex.out ? ok : bad('סכום רווי שגוי');
    return Math.abs(m(s, M) - ex.out) < 1e-9 ? ok : null; // סכום חלקי (בלי הגדול / הזוגיים) — לא נבדק כאן
  },
  extreme: (ex) => {
    const a = arrIn(ex.in);
    const xs = nums(a) ? a : numsIn(ex.in);
    if (xs.length < 2 || typeof ex.out !== 'number') return null;
    if (!xs.includes(ex.out)) return null; // "הגדול כפול 2" — פלט נגזר, לא נבדק
    return ex.out === Math.max(...xs) || ex.out === Math.min(...xs) || [...xs].sort((p, q) => q - p)[1] === ex.out ? ok : bad('לא הגדול ולא הקטן');
  },
  filter: (ex) => {
    const a = arrIn(ex.in);
    if (!Array.isArray(a) || !Array.isArray(ex.out)) return null;
    let i = 0;
    for (const v of ex.out) {
      while (i < a.length && JSON.stringify(a[i]) !== JSON.stringify(v)) i++;
      if (i++ >= a.length) return bad('הפלט מכיל מה שלא היה בקלט, או בסדר אחר');
    }
    return ex.out.length <= a.length ? ok : bad('הפלט ארוך מהקלט');
  },
  dedupe: (ex) => {
    if (!Array.isArray(ex.out)) return null;
    const s = ex.out.map((v) => JSON.stringify(v));
    return new Set(s).size === s.length ? ok : bad('נשארו כפולים');
  },
  validate: (ex) => (typeof ex.out === 'boolean' ? ok : null),
  clamp: (ex) => {
    const xs = numsIn(ex.in);
    if (typeof ex.out !== 'number' || xs.length < 2) return null;
    return ex.out >= Math.min(...xs, 0) && ex.out <= Math.max(...xs, 15) ? ok : bad('מחוץ לגבולות');
  },
};

/** בדיקת דוגמה לפועל. null = אין חוק/אין דוגמה מתאימה. */
export function exampleLaw(verb, part) {
  const law = EXAMPLE_LAWS[verb];
  if (!law || !part.example || typeof part.example !== 'object') return null;
  try {
    return law(part.example, part);
  } catch {
    return null;
  }
}
