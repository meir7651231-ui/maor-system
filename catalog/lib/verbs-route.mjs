/**
 * 🧭 שלושת פעלי-המסלול (PRODUCT-V2, 14.10.2026) — הפעלים 63–65: «מסדר מסלול» · «משבץ עד התקרה» · «מתזמן בחלונות».
 *
 * למה פעלים משלהם: מוקד-החלוקה צריך דרך **קצרה באמת** לכל מתנדב (לא "מהקרובה לרחוקה"), רכב שמחזיק עד K סלים,
 * ושעת-הגעה לכל תחנה — עם משפחות שבבית רק אחרי 16:00. לאף אחד מאלה אין ליבה אחת בקוד שלנו; הם נמצאים **רק כשילוב**
 * של חלקים מוכחים (catalog/combiner/verb-recipes.json — גרף עם לולאה) — ולכן כאן רק מה שהפועל *אומר*: החוקים, ולכל
 * חוק מוטנט שהוא תופס. המימוש-לדוגמה (ref) הוא כלי-בדיקה של החוקים, לא קוד-מוצר (כמו בכל פועל באלפבית).
 *
 *   tour(from, stops)          ⇒ [from, …stops בסדר-ביקור]           — מסדר מסלול
 *   allot(bins, items, cap)    ⇒ [{item, b}]  (b = -1: רשימת-המתנה) — משבץ עד התקרה
 *   schedule(route, spec)      ⇒ [{at, wait, late, km}] לכל תחנה    — מתזמן בחלונות
 * טהור: בלי שעון, בלי I/O.
 */
import { isArr, isNum, isObj, same, canon } from './shape.mjs';

const FAIL = (s) => s;
const pt = (o) => isObj(o) && isNum(o.x) && isNum(o.y);
const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
const tol = (L) => 1e-9 * Math.max(1, Math.abs(L));
const counter = (fn) => { let c = 0; return (...a) => fn(c++, ...a); };
/** אורך דרך: סכום הרגליים בין תחנות צמודות. */
export const pathLen = (r) => { let s = 0; for (let k = 1; k < r.length; k++) s += d(r[k - 1], r[k]); return s; };
/** כל תחנה פעם אחת (אותו מקום = אותה תחנה), בסדר ההגעה. */
const uniq = (xs) => { const seen = new Set(); return xs.filter((p) => { const k = Number(p.x) + ',' + Number(p.y); if (seen.has(k)) return false; seen.add(k); return true; }); };
const bag = (xs) => xs.map(canon).sort().join('|');
/** היפוך-קטע (מהלך 2-opt): r[i..j] הפוך, השאר במקום. */
const flip = (r, i, j) => [...r.slice(0, i), ...r.slice(i, j + 1).reverse(), ...r.slice(j + 1)];

/* ═══════════════ מימושי-ייחוס (לבדיקת החוקים בלבד) ═══════════════ */

function nnOrder(from, stops) {
  const left = uniq(stops); const out = [from]; let at = from;
  while (left.length) {
    let bi = 0;
    for (let k = 1; k < left.length; k++) { const a = d(at, left[k]); const b = d(at, left[bi]); if (a < b || (a === b && (left[k].x - left[bi].x || left[k].y - left[bi].y) < 0)) bi = k; }
    at = left.splice(bi, 1)[0]; out.push(at);
  }
  return out;
}
function twoOpt(r0) {
  let r = r0; let L = pathLen(r);
  for (let changed = true, pass = 0; changed && pass < 60; pass++) {
    changed = false;
    for (let i = 1; i < r.length - 1; i++) for (let j = i + 1; j < r.length; j++) {
      const c = flip(r, i, j); const cl = pathLen(c);
      if (cl < L - 1e-12) { r = c; L = cl; changed = true; }
    }
  }
  return r;
}
/** ייחוס «מסדר מסלול»: השכן-הקרוב, או הסדר שהגיע — הקצר מהשניים — ואז 2-opt עד שאין שיפור. */
export function tourRef(from, stops) {
  const a = nnOrder(from, stops); const b = [from, ...uniq(stops)];
  return twoOpt(pathLen(a) <= pathLen(b) ? a : b);
}
/** ייחוס «משבץ עד התקרה»: כל פריט (מהקרוב-למתנדב-שלו ראשון) לתא הפנוי הקרוב; אין תא ⇒ רשימת-המתנה (b=-1). */
export function allotRef(bins, items, cap) {
  const load = bins.map(() => 0); const K = Math.max(0, Math.floor(cap));
  const near = (p) => Math.min(...bins.map((q) => d(p, q)));
  const order = items.map((p, k) => ({ p, k, n: near(p) })).sort((a, b) => a.n - b.n || a.k - b.k);
  return order.map(({ p }) => {
    let best = -1;
    bins.forEach((q, b) => { if (load[b] < K && (best < 0 || d(p, q) < d(p, bins[best]))) best = b; });
    if (best >= 0) load[best]++;
    return { item: p, b: best };
  });
}
/** ייחוס «מתזמן בחלונות»: נוסעים בקו ישר במהירות קבועה, לא מגיעים לפני פתיחת-החלון, נשארים stay דקות בכל תחנה. */
export function scheduleRef(route, spec) {
  const out = []; let t = spec.start; let km = 0;
  for (let k = 1; k < route.length; k++) {
    const leg = d(route[k - 1], route[k]); km += leg;
    const eta = t + leg / spec.speed; const at = Math.max(eta, route[k].open);
    out.push({ at, wait: at - eta, late: route[k].close < at, km });
    t = at + spec.stay;
  }
  return out;
}

/* ═══════════════ צורות-ייחוס ═══════════════ */

const C = { t: 'int', lo: 0, hi: 40 };
const P = { t: 'obj', p: [['x', C, false], ['y', C, false]] };
const W = { t: 'obj', p: [['x', C, false], ['y', C, false], ['open', { t: 'int', lo: 480, hi: 720 }, false], ['close', { t: 'int', lo: 540, hi: 900 }, false]] };

/* ═══════════════ החוקים ═══════════════ */

const tourFit = (e) => e.args.length === 2 && e.i === 1 && e.j === 0 && isArr(e.x) && e.x.every(pt) && pt(e.y) && isArr(e.out) && e.out.every(pt);
const allotFit = (e) => e.args.length === 3 && e.i === 0 && e.j === 1 && isArr(e.x) && e.x.length >= 1 && e.x.every(pt) && isArr(e.y) && e.y.every(pt) && Number.isInteger(e.args[2]) && e.args[2] >= 1 &&
  isArr(e.out) && e.out.every((o) => isObj(o) && pt(o.item) && Number.isInteger(o.b));
const schedFit = (e) => e.args.length === 2 && e.i === 1 && e.j === 0 && isArr(e.y) && e.y.length >= 1 && e.y.every((p) => pt(p) && isNum(p.open) && isNum(p.close)) && isObj(e.x) && isNum(e.x.start) && isNum(e.x.speed) && e.x.speed > 0 && isNum(e.x.stay) &&
  isArr(e.out) && e.out.every((o) => isObj(o) && isNum(o.at) && isNum(o.wait) && typeof o.late === 'boolean' && isNum(o.km));

export const ROUTE_VERBS = [
  {
    id: 'tour', he: 'מסדר מסלול', bind: 'list+key',
    means: 'מסדר תחנות לדרך אחת קצרה שמתחילה במוצא — כל תחנה פעם אחת, לא ארוכה מהסדר שבו הגיעו, ושום היפוך-קטע אחד לא מקצר אותה',
    takes: ['geo', 'geo'], gives: 'geo', fit: tourFit,
    witness: (e) => uniq(e.x).length >= 3 && !same(e.out.slice(1), uniq(e.x)),
    laws: [
      { id: 'tour.visits', says: 'כל תחנה פעם אחת בדיוק (אותו מקום פעמיים = תחנה אחת), ושום דבר שלא היה', catches: 'מפיל תחנה', check: (e) => (bag(e.out.slice(1)) === bag(uniq(e.x)) ? true : FAIL('התחנות במסלול ≠ התחנות שהתבקשו')) },
      { id: 'tour.start', says: 'הדרך מתחילה במוצא (אצל המתנדב)', catches: 'מתחיל בתחנה הראשונה', check: (e) => (e.out.length && same(e.out[0], e.y) ? true : FAIL('הדרך לא מתחילה במוצא')) },
      {
        id: 'tour.shorter', says: 'הדרך לא ארוכה מהסדר שבו התחנות הגיעו', catches: 'הולך כל פעם לרחוקה',
        check: (e) => { const L = pathLen(e.out); const B0 = pathLen([e.y, ...uniq(e.x)]); return L <= B0 + tol(B0) ? true : FAIL(L.toFixed(3) + ' ארוך מהסדר המקורי ' + B0.toFixed(3)); },
      },
      {
        id: 'tour.local', says: 'שום היפוך של קטע אחד (מהלך 2-opt) לא מקצר את הדרך', catches: 'השכן-הקרוב בלי שיפור',
        check: (e) => {
          const r = e.out; const L = pathLen(r);
          for (let i = 1; i < r.length - 1; i++) for (let j = i + 1; j < r.length; j++) { const c = pathLen(flip(r, i, j)); if (c < L - tol(L) - 1e-9) return FAIL('היפוך ' + i + '–' + j + ' מקצר: ' + c.toFixed(4) + ' < ' + L.toFixed(4)); }
          return true;
        },
      },
      { id: 'tour.det', says: 'אותן תחנות ואותו מוצא ⇒ אותה דרך', catches: 'דרך אחרת בכל פעם', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('דרך אחרת בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'from', d: P }, { name: 'stops', d: { t: 'arr', of: P, max: 7 } }], fn: () => tourRef },
    mutants: {
      'tour.visits': () => (f, s) => { const r = tourRef(f, s); return r.length > 1 ? r.slice(0, -1) : r; },
      'tour.start': () => (f, s) => { const r = tourRef(f, s); return r.length > 1 ? [...r.slice(1), r[0]] : r; },
      'tour.shorter': () => (f, s) => {
        const left = uniq(s); const out = [f]; let at = f;
        while (left.length) { let bi = 0; for (let k = 1; k < left.length; k++) if (d(at, left[k]) > d(at, left[bi])) bi = k; at = left.splice(bi, 1)[0]; out.push(at); }
        return out;
      },
      'tour.local': () => (f, s) => { const a = nnOrder(f, s); const b = [f, ...uniq(s)]; return pathLen(a) <= pathLen(b) ? a : b; },
      'tour.det': () => counter((c, f, s) => { const r = tourRef(f, s); return c % 7 < 4 && r.length > 2 ? [r[0], ...r.slice(1).reverse()] : r; }),
    },
    cues: { en: ['tour', 'tsp', 'twoOpt', '2opt', 'itinerary'], he: ['מסלול-ביקור'] }, // צרים בכוונה
  },
  {
    id: 'allot', he: 'משבץ עד התקרה', bind: 'list+key',
    means: 'משבץ כל פריט לתא הקרוב שעוד יש בו מקום (עד cap לתא) — כל פריט פעם אחת, אף תא לא מתמלא מעבר, ורק כשהכול מלא פריט נשאר ברשימת-המתנה',
    takes: ['geo', 'geo', 'number'], gives: 'list', fit: allotFit,
    witness: (e) => e.y.length >= 3 && e.x.length >= 2,
    laws: [
      {
        id: 'allot.once', says: 'כל פריט משובץ פעם אחת בדיוק (לתא קיים, או לרשימת-המתנה −1)', catches: 'מאבד פריט',
        check: (e) => (bag(e.out.map((o) => o.item)) === bag(e.y) && e.out.every((o) => o.b >= -1 && o.b < e.x.length) ? true : FAIL('השיבוץ לא מכסה כל פריט פעם אחת')),
      },
      {
        id: 'allot.cap', says: 'אף תא לא מקבל יותר מהתקרה', catches: 'מתעלם מהתקרה',
        check: (e) => { const n = e.x.map((_, b) => e.out.filter((o) => o.b === b).length); const k = n.findIndex((v) => v > e.args[2]); return k < 0 ? true : FAIL('תא ' + k + ' קיבל ' + n[k] + ' > ' + e.args[2]); },
      },
      {
        id: 'allot.full', says: 'פריט נשאר בחוץ רק כשכל התאים מלאים', catches: 'שולח להמתנה כשהקרוב מלא, גם כשיש מקום אחר',
        check: (e) => { if (!e.out.some((o) => o.b === -1)) return true; const n = e.x.map((_, b) => e.out.filter((o) => o.b === b).length); return n.every((v) => v >= e.args[2]) ? true : FAIL('יש מקום, ופריט נשאר בחוץ'); },
      },
      {
        id: 'allot.ample', says: 'כשיש מקום לכולם — כל פריט הולך לתא הקרוב אליו', catches: 'שולח לרחוק',
        check: (e) => {
          if (e.args[2] < e.y.length) return null;
          for (const o of e.out) { if (o.b < 0) return FAIL('נשאר בחוץ למרות שיש מקום'); const m = Math.min(...e.x.map((q) => d(o.item, q))); if (d(o.item, e.x[o.b]) > m + tol(m)) return FAIL('לא לקרוב'); }
          return true;
        },
      },
      { id: 'allot.det', says: 'אותו קלט ⇒ אותו שיבוץ', catches: 'שיבוץ אחר בכל פעם', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('שיבוץ אחר בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'bins', d: { t: 'arr', of: P, max: 4 } }, { name: 'items', d: { t: 'arr', of: P, max: 7 } }, { name: 'cap', d: { t: 'int', lo: 1, hi: 4 } }], fn: () => allotRef },
    mutants: {
      'allot.once': () => (b, s, k) => allotRef(b, s, k).slice(1),
      'allot.cap': () => (b, s, k) => allotRef(b, s, s.length + 1),
      'allot.full': () => (b, s, k) => {
        const load = b.map(() => 0);
        return s.map((p) => { let n = 0; b.forEach((q, j) => { if (d(p, q) < d(p, b[n])) n = j; }); if (load[n] < k) { load[n]++; return { item: p, b: n }; } return { item: p, b: -1 }; });
      },
      'allot.ample': () => (b, s, k) => allotRef(b, s, k).map((o) => { if (o.b < 0) return o; let far = 0; b.forEach((q, j) => { if (d(o.item, q) > d(o.item, b[far])) far = j; }); return { ...o, b: far }; }),
      'allot.det': () => counter((c, b, s, k) => { const r = allotRef(b, s, k); return c % 7 < 4 ? r.slice().reverse() : r; }),
    },
    cues: { en: ['allot', 'capacitated', 'binPacking'], he: ['משבץ-עד-התקרה'] },
  },
  {
    id: 'schedule', he: 'מתזמן בחלונות', bind: 'spec',
    means: 'שעת-הגעה לכל תחנה בדרך: נסיעה במהירות קבועה, לא לפני שהחלון נפתח (ואז מחכים), עצירה קבועה בכל תחנה — ומי שמגיעים אליו אחרי שהחלון נסגר מסומן מאחר',
    takes: ['geo', 'record'], gives: 'times', fit: schedFit,
    witness: (e) => e.out.some((o) => o.wait > 0) && e.out.some((o) => o.wait === 0),
    laws: [
      { id: 'schedule.each', says: 'שורה אחת לכל תחנה אחרי המוצא, לפי הסדר', catches: 'מדלג על תחנה', check: (e) => (e.out.length === e.y.length - 1 ? true : FAIL(e.out.length + ' שורות ל-' + (e.y.length - 1) + ' תחנות')) },
      {
        id: 'schedule.drive', says: 'מגיעים = יציאה מהתחנה הקודמת + נסיעה (מרחק ÷ מהירות), אבל לא לפני שהחלון נפתח', catches: 'מתעלם מהחלון',
        check: (e) => {
          let t = e.x.start;
          for (let k = 0; k < e.out.length; k++) {
            const eta = t + d(e.y[k], e.y[k + 1]) / e.x.speed; const want = Math.max(eta, e.y[k + 1].open);
            if (Math.abs(e.out[k].at - want) > 1e-6 * Math.max(1, want)) return FAIL('תחנה ' + (k + 1) + ': ' + e.out[k].at + ' ולא ' + want);
            if (Math.abs(e.out[k].wait - (want - eta)) > 1e-6 * Math.max(1, want)) return FAIL('המתנה ' + e.out[k].wait + ' ולא ' + (want - eta));
            t = e.out[k].at + e.x.stay;
          }
          return true;
        },
      },
      { id: 'schedule.late', says: 'מאחר ⇔ ההגעה אחרי שהחלון נסגר', catches: 'מסמן מאחר הפוך', check: (e) => (e.out.every((o, k) => o.late === e.y[k + 1].close < o.at) ? true : FAIL('סימון-איחור שגוי')) },
      {
        id: 'schedule.km', says: 'ק״מ מצטבר = סכום הרגליים עד התחנה (בקו ישר)', catches: 'סופר רק את הרגל האחרונה',
        check: (e) => { let s = 0; for (let k = 0; k < e.out.length; k++) { s += d(e.y[k], e.y[k + 1]); if (Math.abs(e.out[k].km - s) > 1e-6 * Math.max(1, s)) return FAIL('ק״מ ' + e.out[k].km + ' ולא ' + s); } return true; },
      },
      { id: 'schedule.det', says: 'אותה דרך ⇒ אותן שעות', catches: 'שעות אחרות בכל פעם', check: (e) => (same(e.f(e.args), e.out) ? true : FAIL('שעות אחרות בפעם השנייה')) },
    ],
    ref: { sig: [{ name: 'route', d: { t: 'arr', of: W, max: 6 } }, { name: 'spec', d: { t: 'obj', p: [['start', { t: 'int', lo: 420, hi: 600 }, false], ['speed', { t: 'lit', v: [0.25, 0.5, 1] }, false], ['stay', { t: 'int', lo: 0, hi: 8 }, false]] } }], fn: () => scheduleRef },
    mutants: {
      'schedule.each': () => (r, s) => scheduleRef(r, s).slice(0, -1),
      'schedule.drive': () => (r, s) => scheduleRef(r.map((p) => ({ ...p, open: 0 })), s).map((o, k) => ({ ...o, late: r[k + 1].close < o.at })),
      'schedule.late': () => (r, s) => scheduleRef(r, s).map((o) => ({ ...o, late: !o.late })),
      'schedule.km': () => (r, s) => scheduleRef(r, s).map((o, k) => ({ ...o, km: d(r[k], r[k + 1]) })),
      'schedule.det': () => counter((c, r, s) => scheduleRef(r, s).map((o) => ({ ...o, at: o.at + (c % 7 < 4 ? 1 : 0) }))),
    },
    cues: { en: ['eta', 'schedule', 'timeWindow', 'windows'], he: ['שעת-הגעה'] },
  },
];
