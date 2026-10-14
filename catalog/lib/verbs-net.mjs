/**
 * 🕸️ «מחבר לשכנים» (connect · MACHINE-V4, 14.10.2026) — הפועל ה-62: נקודות ⇒ רשת.
 *
 * למה פועל משלו: «מוצא דרך קצרה» ו«מתפשט» עובדים על רשת (קשתות עם מחיר), והמילון מבקש אותם על **מקום**
 * ("הדרך המהירה", "האש מתפשטת לשכנים"). שום חלק מוכח לא בנה רשת מנקודות — אבל הקוד שלנו כן: רשת-הסינפסות
 * של כדור-המוח בדף ההרשמה (src/lib/three-scene.ts:114–131) מחברת כל צומת לשלושת הקרובים אליו.
 * הליבה: catalog/core/near-net.mjs (origins: catalog/core/origins-c.json). כאן — החוקים והמוטנטים, כמו לכל פועל.
 *
 * הקישור (`bind: 'x>x'`): הקלט = הגדרה {points, near}; הפלט = אותה הגדרה + edges.
 */
import { isArr, isNum, isObj, same } from './shape.mjs';
import { nearNet } from '../core/near-net.mjs';

const FAIL = (s) => s;
const pt = (o) => isObj(o) && isNum(o.x) && isNum(o.y);
const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
// 🪞 SELF: היה Math.abs לפני החיתוך ⇒ near = -23 נתן 8 שכנים (התקרה) במקום 1 (הרצפה) — «מגביל» דלף. ratchet: self.test
const kOf = (x) => Math.max(1, Math.min(8, Math.floor(Number(x?.near)) || 1));
/** המרחק של השכן ה-k הקרוב ביותר ל-i (או Infinity כשאין k שכנים). */
function kth(P, i, k) {
  const ds = P.map((q, j) => (j === i ? Infinity : d(P[i], q))).filter((v) => v < Infinity).sort((a, b) => a - b);
  return ds.length ? ds[Math.min(k, ds.length) - 1] : Infinity;
}
const nbrs = (E, i) => new Set(E.flatMap((e) => (e.a === i ? [e.b] : e.b === i ? [e.a] : [])));

export const NET_VERBS = [
  {
    id: 'connect', he: 'מחבר לשכנים', mined: true, bind: 'x>x', core: 'catalog/core/near-net.mjs',
    means: 'הופך נקודות לרשת: כל נקודה נקשרת לנקודות הקרובות אליה (כמה — לפי near), כל קשת פעם אחת, והמחיר של קשת הוא המרחק',
    takes: ['record'], gives: 'record',
    fit: (e) => isObj(e.x) && isArr(e.x.points) && e.x.points.length >= 2 && e.x.points.every(pt) && 'near' in e.x && isObj(e.out) && isArr(e.out.edges),
    witness: (e) => e.out.edges.length >= 2,
    laws: [
      { id: 'connect.keeps', says: 'הנקודות נשארות כמו שהן — מתווספות רק הקשתות', catches: 'מאבד נקודה', check: (e) => (same(e.out.points, e.x.points) ? true : FAIL('הנקודות השתנו')) },
      {
        id: 'connect.real', says: 'כל קשת מחברת שתי נקודות שונות שקיימות, פעם אחת, והמחיר שלה = המרחק ביניהן', catches: 'מחיר = המרחק בריבוע',
        check: (e) => {
          const P = e.x.points; const seen = new Set();
          for (const x of e.out.edges) {
            if (!isObj(x) || !Number.isInteger(x.a) || !Number.isInteger(x.b) || x.a === x.b || !P[x.a] || !P[x.b]) return FAIL('קשת לא אמיתית: ' + JSON.stringify(x));
            const k = Math.min(x.a, x.b) + '_' + Math.max(x.a, x.b);
            if (seen.has(k)) return FAIL('קשת כפולה ' + k);
            seen.add(k);
            if (!isNum(x.w) || !close(x.w, d(P[x.a], P[x.b]))) return FAIL('מחיר ' + x.w + ' ולא ' + d(P[x.a], P[x.b]));
          }
          return true;
        },
      },
      {
        id: 'connect.nearest', says: 'כל נקודה מחוברת לשכנות הקרובות אליה: אף נקודה קרובה יותר מהשכנה ה-near לא נשארת בחוץ', catches: 'מחבר לרחוקות',
        check: (e) => {
          const P = e.x.points; const k = kOf(e.x);
          for (let i = 0; i < P.length; i++) {
            const lim = kth(P, i, k); const N = nbrs(e.out.edges, i);
            for (let j = 0; j < P.length; j++) if (j !== i && d(P[i], P[j]) < lim - 1e-9 * Math.max(1, lim) && !N.has(j)) return FAIL(j + ' קרובה ל-' + i + ' ולא מחוברת');
            if (N.size < Math.min(k, P.length - 1)) return FAIL(i + ' עם ' + N.size + ' שכנות בלבד');
          }
          return true;
        },
      },
      {
        id: 'connect.only', says: 'רק שכנות: כל קשת היא בין נקודה לאחת הקרובות אליה (לא כל-עם-כל)', catches: 'מחבר כל נקודה לכל נקודה',
        check: (e) => {
          const P = e.x.points; const k = kOf(e.x);
          for (const x of e.out.edges) {
            const w = d(P[x.a], P[x.b]);
            if (!(w <= kth(P, x.a, k) * (1 + 1e-9) + 1e-12 || w <= kth(P, x.b, k) * (1 + 1e-9) + 1e-12)) return FAIL('קשת ' + x.a + '–' + x.b + ' לא בין שכנות');
          }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['points', { t: 'arr', of: { t: 'obj', p: [['x', { t: 'num' }, false], ['y', { t: 'num' }, false]] }, max: 7 }, false], ['near', { t: 'lit', v: [1, 2, 3] }, false]] } }], fn: () => nearNet },
    mutants: {
      'connect.keeps': () => (s) => { const o = nearNet(s); return { ...o, points: o.points.slice(0, -1) }; },
      'connect.real': () => (s) => { const o = nearNet(s); return { ...o, edges: o.edges.map((x) => ({ ...x, w: x.w * x.w + 1 })) }; },
      'connect.nearest': () => (s) => { const P = Array.isArray(s?.points) ? s.points : []; const E = []; const seen = new Set(); P.forEach((p, i) => { let far = -1; let fd = -1; P.forEach((q, j) => { if (j !== i && d(p, q) > fd) { fd = d(p, q); far = j; } }); if (far < 0) return; const k = Math.min(i, far) + '_' + Math.max(i, far); if (!seen.has(k)) { seen.add(k); E.push({ a: Math.min(i, far), b: Math.max(i, far), w: fd }); } }); return { ...s, edges: E }; },
      'connect.only': () => (s) => { const P = Array.isArray(s?.points) ? s.points : []; const E = []; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) E.push({ a: i, b: j, w: d(P[i], P[j]) }); return { ...s, edges: E }; },
    },
    cues: { en: ['knn', 'synapse'], he: ['סינפסות'] }, // צרים בכוונה: התיוג-מהשם לא ידביק «מחבר לשכנים» לכל link/connect
  },
];
