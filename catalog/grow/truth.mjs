/**
 * ⚖️ בדיקת-אמת למנוע-הצמיחה (GROW, 15.10.2026) — כדי לא לתת שם שגוי.
 *
 * הממצא של BLUEPRINTS (§5): החוקים של sum/average/extreme חלשים — −סכום עובר את חוקי "מסכם", אמצע-הטווח עובר את
 * חוקי "ממצע". לכן שם של פועל ניתן רק אם החוקים עברו **וגם** הבדיקה כאן (כשיש בדיקה לאותה חתימה). פועל "חלש"
 * (WEAK) בלי בדיקה מתאימה ⇒ לא מקבל שם. דטרמיניסטי (LCG קבוע), 200 קלטים, טהור — הפונקציה מוזרקת.
 */
import { pathLen } from '../lib/verbs-route.mjs';

export const WEAK = new Set(['sum', 'average', 'extreme']);
const N = 200;
function lcg(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const nums = (r, lo = 0) => Array.from({ length: int(r, lo, 9) }, () => int(r, -40, 60));
const pt = (r, hi = 40) => ({ x: int(r, 0, hi), y: int(r, 0, hi) });
const near = (a, b) => typeof a === 'number' && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
const J = (v) => JSON.stringify(v);
const key = (p) => p.x + ',' + p.y;
const uniq = (xs) => { const s = new Set(); return xs.filter((p) => { const k = key(p); if (s.has(k)) return false; s.add(k); return true; }); };

/** כל בדיקה: (f, rnd) ⇒ null (עבר) או דוגמה שנכשלה. f מקבל רשימת-ארגומנטים ומחזיר ערך או undefined. */
const CHECKS = {
  'nums>num': {
    sum: (f, r) => { for (let k = 0; k < N; k++) { const xs = nums(r); const o = f([xs]); if (!near(o, xs.reduce((a, b) => a + b, 0))) return { in: xs, out: o }; } return null; },
    average: (f, r) => { for (let k = 0; k < N; k++) { const xs = nums(r, 1); const o = f([xs]); if (!near(o, xs.reduce((a, b) => a + b, 0) / xs.length)) return { in: xs, out: o }; } return null; },
    extreme: (f, r) => {
      let side = null;
      for (let k = 0; k < N; k++) {
        const xs = nums(r, 1); const o = f([xs]);
        if (!xs.includes(o)) return { in: xs, out: o, why: 'לא אחד הפריטים' };
        const mx = Math.max(...xs); const mn = Math.min(...xs);
        if (mx === mn) continue;
        const s = o === mx ? 'max' : o === mn ? 'min' : 'mid';
        if (s === 'mid' || (side && s !== side)) return { in: xs, out: o, why: 'לא תמיד אותו קצה' };
        side = s;
      }
      return null;
    },
    count: (f, r) => { for (let k = 0; k < N; k++) { const a = nums(r); const b = nums(r); const fa = f([a]); const fb = f([b]); const fab = f([a.concat(b)]); if (![fa, fb, fab].every(Number.isInteger) || fa < 0 || fa > a.length || fab !== fa + fb) return { in: a, out: fa }; } return null; },
  },
  'nums>nums': {
    sort: (f, r) => {
      let dir = 0;
      for (let k = 0; k < N; k++) {
        const xs = nums(r); const o = f([xs]);
        if (!Array.isArray(o) || J([...o].sort((a, b) => a - b)) !== J([...xs].sort((a, b) => a - b))) return { in: xs, out: o, why: 'לא אותם פריטים' };
        const up = J(o) === J([...xs].sort((a, b) => a - b)); const dn = J(o) === J([...xs].sort((a, b) => b - a));
        if (!up && !dn) return { in: xs, out: o, why: 'לא ממוין' };
        if (up !== dn) { const d = up ? 1 : -1; if (dir && d !== dir) return { in: xs, out: o, why: 'לא תמיד אותו כיוון' }; dir = d; }
      }
      return null;
    },
    reverse: (f, r) => { for (let k = 0; k < N; k++) { const xs = nums(r); const o = f([xs]); if (J(o) !== J([...xs].reverse())) return { in: xs, out: o }; } return null; },
    dedupe: (f, r) => {
      for (let k = 0; k < N; k++) {
        const xs = Array.from({ length: int(r, 0, 9) }, () => int(r, 0, 5)); const o = f([xs]);
        if (!Array.isArray(o) || o.length !== new Set(xs).size || new Set(o).size !== o.length || !o.every((v) => xs.includes(v))) return { in: xs, out: o };
      }
      return null;
    },
  },
  'num,num>num': {
    compare: (f, r) => {
      let side = 0;
      for (let k = 0; k < N; k++) {
        const a = int(r, -50, 120); const b = int(r, -50, 120); const o = f([a, b]);
        if (typeof o !== 'number') return { in: [a, b], out: o };
        const want = Math.sign(a - b); const s = Math.sign(o);
        if (want === 0) { if (s !== 0) return { in: [a, b], out: o, why: 'שווים אבל לא 0' }; continue; }
        const d = s === want ? 1 : s === -want ? -1 : 0;
        if (!d || (side && d !== side)) return { in: [a, b], out: o, why: 'הסימן לא עקבי' };
        side = d;
      }
      return null;
    },
  },
  'pt,pts>pts': {
    tour: (f, r) => {
      for (let k = 0; k < N; k++) {
        const from = pt(r); const stops = Array.from({ length: int(r, 2, 9) }, () => pt(r, 12));
        if (k % 3 === 0) stops.push({ ...stops[0] });
        const o = f([from, stops]);
        if (!Array.isArray(o) || o.length < 1) return { why: 'לא רשימה' };
        const bag = (xs) => xs.map(key).sort().join('|');
        if (bag(o.slice(1)) !== bag(uniq(stops))) return { why: 'לא כל תחנה-ייחודית פעם אחת' };
        if (key(o[0]) !== key(from)) return { why: 'לא מתחיל במוצא' };
        if (pathLen(o) > pathLen([from, ...uniq(stops)]) + 1e-9) return { why: 'ארוך מהסדר שהגיע' };
      }
      return null;
    },
  },
};

/** האם יש בדיקה לפועל הזה בחתימה הזו? */
export const hasTruth = (verb, sigKey) => !!CHECKS[sigKey]?.[verb];
/** מריץ את הבדיקה: null = עבר; אחרת דוגמה שנכשלה. */
export function truthOf(verb, sigKey, f, seed = 0x7a17) {
  const c = CHECKS[sigKey]?.[verb];
  if (!c) return undefined;
  return c((args) => { try { return f(args); } catch { return undefined; } }, lcg(seed));
}
