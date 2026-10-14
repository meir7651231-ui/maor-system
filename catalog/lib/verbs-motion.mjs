/**
 * 🌀 פעלי-הזמן-והתנועה (MINED-VERBS, 14.10.2026) — 15 פעלים שנכרו מתוך הקוד שכבר כתבנו.
 *
 * הבעלים: "יש הכל". המפקד הראשון הריץ רק לוגיקה עסקית וקפץ על קוד-המסך, האנימציה, האפקטים, התלת-ממד, הקול והניתוב —
 * ושם בדיוק גרים הזמן והתנועה. כאן כל פעולה כזאת חולצה לליבה בלי עולם (`catalog/core/<verb>.mjs`), עם רשימת המקומות
 * שבהם נמצאה (`catalog/core/origins.json`), וקיבלה חוקים שרצים + מוטנט שכל חוק תופס — בדיוק כמו 45 הפעלים הקיימים.
 *
 * כל הפעלים כאן נקשרים בצורה אחת (`bind: 'spec'`): קלט ראשון = אובייקט-הגדרה עם שדות בשמות קבועים (החוזה של הפועל),
 * קלט שני = מה שזז (צעד-זמן, רשימה, גוף). החוקים קוראים לחלק שוב עם צעדים/קלטים שהם בוחרים (e.f + e.put) — כך
 * "דועך מתקרב לרצפה" נבדק על המסלול כולו, לא על נקודה אחת.
 * מימוש-הייחוס של כל פועל = הליבה עצמה (catalog/core). טהור: בלי שעון, בלי Math.random.
 */
import { isArr, isNum, isStr, isObj, isNil, same, isSubseq, canon } from './shape.mjs';
import { decay } from '../core/decay.mjs';
import { countdown } from '../core/countdown.mjs';
import { accumulate } from '../core/accumulate.mjs';
import { oscillate } from '../core/oscillate.mjs';
import { random } from '../core/random.mjs';
import { gravity } from '../core/gravity.mjs';
import { moveAlongPath } from '../core/move-along-path.mjs';
import { orbit } from '../core/orbit.mjs';
import { shortestPath } from '../core/shortest-path.mjs';
import { spread } from '../core/spread.mjs';
import { sample } from '../core/sample.mjs';
import { echo } from '../core/echo.mjs';
import { follow } from '../core/follow.mjs';
import { bounce } from '../core/bounce.mjs';
import { sunPosition } from '../core/sun-position.mjs';
import { nearNet } from '../core/near-net.mjs';

/* ═══════════════ עזרים ═══════════════ */

const FAIL = (s) => s;
/** קרוב: הפרש קטן ביחס לגודל הערכים (ולסקאלה נוספת שהחוק נותן). */
const close = (a, b, scale = 1, rel = 1e-7) => isNum(a) && isNum(b) && Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b), Math.abs(scale));
const nums = (o, ks) => isObj(o) && ks.every((k) => isNum(o[k]));
const has = (o, ks) => isObj(o) && ks.every((k) => k in o);
/** "בצעד s": אותם קלטים, רק הקלט שזז (j) מוחלף. */
const at = (e, v) => e.f(e.put(v, e.j));
/** "בהגדרה אחרת": אותם קלטים, רק אובייקט-ההגדרה (i) מוחלף. */
const withSpec = (e, patch, v = e.y) => e.f(Object.assign(e.put({ ...e.x, ...patch }, e.i), { [e.j]: v }));
const pt = (o) => isObj(o) && isNum(o.x) && isNum(o.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function segDist(p, a, b) {
  const L = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / L)) : 0;
  return Math.hypot(p.x - (a.x + (b.x - a.x) * t), p.y - (a.y + (b.y - a.y) * t));
}
const minW = (edges, u, v) => { let m = Infinity; for (const e of edges) if ((e.a === u && e.b === v) || (e.a === v && e.b === u)) m = Math.min(m, Math.abs(e.w)); return m; };
/** מחיר הדרך הזולה בכוח-גס: כל הדרכים הפשוטות (גרף קטן — עד 6 נקודות). */
function bruteCost(edges, from, to) {
  if (from === to) return 0;
  let best = Infinity;
  const go = (u, seen, c) => {
    if (c >= best) return;
    if (u === to) { best = c; return; }
    for (const e of edges) {
      const v = e.a === u ? e.b : e.b === u ? e.a : undefined;
      if (v === undefined || seen.has(v)) continue;
      seen.add(v); go(v, seen, c + Math.abs(e.w)); seen.delete(v);
    }
  };
  go(from, new Set([from]), 0);
  return best;
}
/**
 * הרשת שההגדרה מתארת (MACHINE-V4): קשתות מפורשות (`edges`), או — נקודות + `near` ⇒ הרשת שליבת «מחבר לשכנים»
 * (catalog/core/near-net.mjs — רשת-הסינפסות של three-scene) בונה מהן. כך חוקי «דרך קצרה» ו«מתפשט» רצים גם על **נקודות**:
 * הדרך/הגל נבדקים ברשת שהנקודות האלה יוצרות, והחוק עצמו לא משתנה. אין רשת ⇒ null (הפועל לא חל).
 */
export const netEdges = (x) => (isArr(x?.edges) ? x.edges : isObj(x) && isArr(x.points) && x.points.length > 0 && x.points.every(pt) && 'near' in x ? nearNet(x).edges : null);
/** הקואורדינטות של רשימה: מספרים כמו שהם; נקודות ⇒ x,y,x,y… (MACHINE-V4 — «מגריל» על נקודות). אחרת null. */
const coordsOf = (xs) => (!isArr(xs) ? null : xs.every(isNum) ? xs : xs.length && xs.every(pt) ? xs.flatMap((p) => [p.x, p.y]) : null);
/** מספר או נקודה כווקטור (MACHINE-V4 — «הולך אחרי» על נקודות): 5 ⇒ [5] · {x, y} ⇒ [x, y]. אחרת null. */
const vecOf = (v) => (isNum(v) ? [v] : pt(v) ? [v.x, v.y] : null);
const sameVec = (a, b) => { const p = vecOf(a); const q = vecOf(b); return !!p && !!q && p.length === q.length; };
const fromVec = (v, like) => (isNum(like) ? v[0] : { x: v[0], y: v[1] });
const sub = (a, b) => a.map((v, k) => v - b[k]);
const dot = (a, b) => a.reduce((s0, v, k) => s0 + v * b[k], 0);
const norm = (a) => Math.sqrt(dot(a, a));
/** איזה חלק מהדרך y⇒t עברו כשהגיעו ל-o — רק אם o על הקו הישר (אחרת null). */
function fracOf(y, o, t) {
  const d = sub(t, y); const L = dot(d, d);
  if (!(L > 0) || !o || o.length !== y.length) return null;
  const fr = dot(sub(o, y), d) / L;
  const off = norm(sub(o, y.map((v, k) => v + fr * d[k])));
  return off <= 1e-6 * Math.max(1, Math.sqrt(L), norm(y)) ? fr : null;
}
const neighborsOf = (edges, u) => edges.flatMap((e) => (e.a === u ? [e.b] : e.b === u ? [e.a] : []));
const pctOk = (v) => isNum(v) && v >= 0 && v <= 100;

/* ═══════════════ מוטנטים — מימושים מקולקלים (כל אחד שובר חוק אחד) ═══════════════ */

const fin = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const pairs = (r) => { const o = []; for (let k = 0; k + 1 < r.length; k += 2) o.push({ x: r[k], y: r[k + 1] }); return o; };
function decayLoop(spec, step, sign, minKeep, snap) {
  const from = fin(spec?.from); const floor = fin(spec?.floor);
  const keep = Math.max(minKeep, Math.min(99, Math.abs(fin(spec?.keepPct))) / 100);
  const n = Math.min(100000, Math.floor(Math.abs(fin(step))));
  const eps = 1e-6 * Math.max(1e-6, Math.abs(from - floor));
  let v = from;
  for (let k = 0; k < n && v !== floor; k++) { v = floor + sign * (v - floor) * keep; if (snap && Math.abs(v - floor) <= eps) v = floor; }
  return v;
}
function dfsFirst(spec, from, to) {
  const edges = (spec?.edges ?? []).filter((e) => e && e.a != null && e.b != null && Number.isFinite(Number(e.w)));
  if (from === to) return { cost: 0, path: [from] };
  const go = (u, seen, path, c) => {
    if (u === to) return { cost: c, path };
    for (const e of edges) {
      const v = e.a === u ? e.b : e.b === u ? e.a : undefined;
      if (v === undefined || seen.has(v)) continue;
      const r = go(v, new Set([...seen, v]), [...path, v], c + Math.abs(e.w));
      if (r) return r;
    }
    return null;
  };
  return go(from, new Set([from]), [from], 0);
}

/* ═══════════════ צורות-ייחוס (כמו שהמהדר קורא את ה-JSDoc של הליבה) ═══════════════ */

const N = { t: 'num' };
const O = (...ks) => ({ t: 'obj', p: ks.map((k) => [k, N, false]) });
const LIT6 = { t: 'lit', v: [0, 1, 2, 3, 4, 5] };
const LIT8 = { t: 'lit', v: [0, 1, 2, 3, 4, 5, 6, 7] };

/* ═══════════════ הפעלים ═══════════════ */

export const MOTION_VERBS = [
  {
    id: 'decay', he: 'דועך', mined: true, bind: 'spec',
    means: 'ערך שמתקרב לרצפה בכל צעד (חיכוך, דהייה, ריסון) — לא עובר אותה, ובסוף נוגע בה בדיוק ונשאר',
    takes: ['record', 'number'], gives: 'number',
    fit: (e) => has(e.x, ['from', 'floor', 'keepPct']) && isNum(e.y) && isNum(e.out),
    witness: (e) => e.y > 0 && nums(e.x, ['from', 'floor']) && !close(e.out, e.x.from),
    laws: [
      { id: 'decay.start', says: 'בצעד אפס — הערך ההתחלתי בדיוק', catches: 'מתחיל צעד אחד מאוחר מדי', check: (e) => (!nums(e.x, ['from']) ? null : close(at(e, 0), e.x.from, 0, 1e-12) ? true : FAIL('בצעד 0 ⇒ ' + at(e, 0) + ' ולא ' + e.x.from)) },
      {
        id: 'decay.toward', says: 'כל צעד מקרב לרצפה ולא עובר אותה: המרחק לא גדל, והצד לא מתחלף', catches: 'קופץ מעבר לרצפה ובחזרה (מתנדנד סביבה)',
        check: (e) => {
          if (!nums(e.x, ['from', 'floor', 'keepPct']) || !pctOk(e.x.keepPct)) return null;
          const fl = e.x.floor;
          for (let k = 0; k < 4; k++) {
            const s = e.r.int(0, 80);
            const a = at(e, s); const b = at(e, s + 1);
            if ((b - fl) * (a - fl) < 0) return FAIL('עבר את הרצפה בצעד ' + (s + 1));
            if (Math.abs(b - fl) > Math.abs(a - fl) + 1e-12) return FAIL('התרחק מהרצפה בצעד ' + (s + 1));
          }
          return true;
        },
      },
      {
        id: 'decay.reach', says: 'אחרי מספיק צעדים — בדיוק על הרצפה, ונשאר שם', catches: 'דועך בלי להיצמד — מתקרב לנצח ולא נוגע',
        check: (e) => {
          if (!nums(e.x, ['from', 'floor', 'keepPct']) || !pctOk(e.x.keepPct)) return null;
          const a = at(e, 20000); const b = at(e, 20001);
          return a === e.x.floor && b === e.x.floor ? true : FAIL('אחרי 20000 צעדים ' + a + ' ולא ' + e.x.floor);
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('from', 'floor', 'keepPct') }, { name: 'step', d: N }], fn: () => decay },
    mutants: {
      'decay.start': () => (s, n) => decay(s, fin(n) + 1),
      'decay.toward': () => (s, n) => decayLoop(s, n, -1, 0, true),
      'decay.reach': () => (s, n) => decayLoop(s, n, 1, 0.999, false),
    },
    cues: { en: ['decay', 'fade', 'friction', 'damp', 'damping', 'drag', 'dampen', 'falloff', 'cool', 'attenuate'], he: ['דועך', 'דוהה', 'נחלש', 'מאט'] },
  },
  {
    id: 'countdown', he: 'סופר לאחור', mined: true, bind: 'spec',
    means: 'כמה נשאר עד הרגע: יורד בדיוק במה שעבר, נעצר באפס ולא יורד מתחתיו',
    takes: ['record', 'number'], gives: 'number',
    fit: (e) => has(e.x, ['total']) && isNum(e.y) && isNum(e.out),
    witness: (e) => nums(e.x, ['total']) && e.out > 0 && e.out < e.x.total,
    laws: [
      { id: 'countdown.start', says: 'כשעוד לא עבר כלום — נשאר הכול', catches: 'מתחיל דקה אחת פחות', check: (e) => (!nums(e.x, ['total']) || e.x.total < 0 ? null : close(at(e, 0), e.x.total, 0, 1e-12) ? true : FAIL('בהתחלה ' + at(e, 0) + ' ולא ' + e.x.total)) },
      {
        id: 'countdown.down', says: 'עוד d עבר ⇒ נשאר d פחות (עד אפס)', catches: 'יורד פי שניים מהר מהזמן',
        check: (e) => {
          if (!nums(e.x, ['total']) || e.x.total < 0 || !(e.y >= 0)) return null;
          const d = e.r.int(0, 40);
          const want = Math.max(0, e.out - d);
          return close(at(e, e.y + d), want, e.x.total, 1e-9) ? true : FAIL('אחרי עוד ' + d + ' ⇒ ' + at(e, e.y + d) + ' ולא ' + want);
        },
      },
      {
        id: 'countdown.zero', says: 'כשעבר הכול — בדיוק אפס, ואחר כך נשאר אפס (אף פעם לא שלילי)', catches: 'ממשיך מתחת לאפס',
        check: (e) => {
          if (!nums(e.x, ['total']) || e.x.total < 0) return null;
          if (e.out < 0) return FAIL('שלילי: ' + e.out);
          const z = at(e, e.x.total); const after = at(e, e.x.total + 1 + e.r.int(0, 50));
          return z === 0 && after === 0 ? true : FAIL('בסוף ' + z + ', אחרי הסוף ' + after);
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('total') }, { name: 'elapsed', d: N }], fn: () => countdown },
    mutants: {
      'countdown.start': () => (s, el) => Math.max(0, countdown(s, el) - 1),
      'countdown.down': () => (s, el) => Math.max(0, fin(s?.total) - 2 * Math.max(0, fin(el))),
      'countdown.zero': () => (s, el) => fin(s?.total) - Math.max(0, fin(el)),
    },
    cues: { en: ['countdown', 'remaining', 'left', 'timeLeft', 'secsLeft', 'daysLeft', 'expires', 'cooldown', 'eta', 'until'], he: ['נותרו', 'נשאר', 'עוד', 'לאחור'] },
  },
  {
    id: 'accumulate', he: 'צובר', mined: true, bind: 'spec',
    means: 'מוסיף עוד ועוד לקופה — כל הפקדה מגדילה בדיוק בגודלה, וכשהקופה מלאה: ריקון ומתחילים מאפס',
    takes: ['record', 'list'], gives: 'sequence',
    fit: (e) => has(e.x, ['capacity']) && isArr(e.y) && e.y.every(isNum) && isArr(e.out),
    witness: (e) => isArr(e.out) && e.out.length >= 2 && e.out.some((v, k) => k > 0 && v > e.out[k - 1]),
    laws: [
      {
        id: 'accumulate.adds', says: 'אחרי כל הפקדה הקופה גדלה בדיוק בגודל ההפקדה — או שרוקנה, ואז יש בה רק את ההפקדה החדשה', catches: 'מוסיף פי 1.5 מההפקדה',
        check: (e) => {
          if (e.y.some((d) => d < 0)) return null;
          if (e.out.length !== e.y.length) return FAIL('אורך ' + e.out.length + ' ולא ' + e.y.length);
          let prev = 0;
          for (let k = 0; k < e.y.length; k++) {
            const sc = prev + e.y[k];
            if (!close(e.out[k], prev + e.y[k], sc, 1e-9) && !(prev > 0 && close(e.out[k], e.y[k], sc, 1e-9))) return FAIL('צעד ' + k + ': ' + prev + ' + ' + e.y[k] + ' ⇒ ' + e.out[k]);
            prev = e.out[k];
          }
          return true;
        },
      },
      {
        id: 'accumulate.cap', says: 'כשיש תקרה — הקופה אף פעם לא מעליה (חוץ מהפקדה אחת שגדולה מהתקרה כולה)', catches: 'לא מתרוקן אף פעם (גולש מעל התקרה)',
        check: (e) => {
          if (!nums(e.x, ['capacity']) || !(e.x.capacity > 0) || e.y.some((d) => d < 0)) return null;
          for (let k = 0; k < e.out.length; k++) if (e.out[k] > Math.max(e.x.capacity, e.y[k]) * (1 + 1e-12)) return FAIL('צעד ' + k + ': ' + e.out[k] + ' מעל התקרה ' + e.x.capacity);
          return true;
        },
      },
      {
        id: 'accumulate.needed', says: 'מרוקנים רק כשצריך: ריקון קורה רק כשההפקדה הייתה עוברת את התקרה', catches: 'מרוקן כל צעד שני גם כשלא מלא',
        check: (e) => {
          if (!nums(e.x, ['capacity']) || e.y.some((d) => d < 0)) return null;
          const cap = e.x.capacity > 0 ? e.x.capacity : Infinity;
          let prev = 0;
          for (let k = 0; k < e.out.length; k++) {
            const grew = close(e.out[k], prev + e.y[k], prev + e.y[k], 1e-9);
            if (!grew && !(prev + e.y[k] > cap)) return FAIL('צעד ' + k + ': רוקן בלי שהתמלא');
            prev = e.out[k];
          }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('capacity') }, { name: 'deposits', d: { t: 'arr', of: N } }], fn: () => accumulate },
    mutants: {
      'accumulate.adds': () => (s, ds) => accumulate(s, (ds ?? []).map((d) => fin(d) * 1.5)),
      'accumulate.cap': () => (s, ds) => accumulate({ capacity: 0 }, ds),
      'accumulate.needed': () => (s, ds) => { const out = []; let lv = 0; const c = fin(s?.capacity) > 0 ? fin(s.capacity) : Infinity; (ds ?? []).forEach((d0, k) => { const d = Math.abs(fin(d0)); if (lv > 0 && (lv + d > c || k % 2 === 1)) lv = 0; lv += d; out.push(lv); }); return out; },
    },
    cues: { en: ['accumulate', 'accum', 'running', 'total', 'tally', 'fill', 'collect', 'counter', 'countUp', 'elapsed', 'empty', 'jar', 'box'], he: ['צובר', 'מצטבר', 'קופה', 'ריקון', 'מונה'] },
  },
  {
    id: 'oscillate', he: 'מתנדנד', mined: true, bind: 'spec',
    means: 'עולה ויורד סביב מרכז בקצב קבוע (נשימה, הבהוב, גל, צליל) — חוזר על עצמו כל מחזור ולא חורג מהמשרעת',
    takes: ['record', 'number'], gives: 'number|sound', // צליל = גל שמתנדנד (המשמעות עצמה: "נשימה, הבהוב, גל, צליל")
    fit: (e) => has(e.x, ['center', 'amplitude', 'period']) && isNum(e.y) && isNum(e.out),
    witness: (e) => nums(e.x, ['center']) && !close(e.out, e.x.center, 1, 1e-6),
    laws: [
      {
        id: 'oscillate.periodic', says: 'אחרי מחזור שלם — אותו ערך בדיוק', catches: 'מחזור ארוך פי 1.5 מהמוצהר',
        check: (e) => {
          if (!nums(e.x, ['center', 'amplitude', 'period']) || !(e.x.period > 0)) return null;
          const b = at(e, e.y + e.x.period);
          return close(b, e.out, Math.abs(e.x.amplitude) + Math.abs(e.x.center), 1e-6) ? true : FAIL('אחרי מחזור ' + b + ' ולא ' + e.out);
        },
      },
      {
        id: 'oscillate.bounded', says: 'אף פעם לא רחוק מהמרכז יותר מהמשרעת', catches: 'משרעת גדולה פי 1.5',
        check: (e) => (!nums(e.x, ['center', 'amplitude']) ? null : Math.abs(e.out - e.x.center) <= Math.abs(e.x.amplitude) * (1 + 1e-9) + 1e-9 ? true : FAIL('חרג: ' + e.out + ' מול מרכז ' + e.x.center + ' ± ' + e.x.amplitude)),
      },
      {
        id: 'oscillate.balanced', says: 'מאוזן: הממוצע על פני מחזור שלם (8 נקודות שוות) = המרכז', catches: 'רק החצי העליון של הגל (|sin|)',
        check: (e) => {
          if (!nums(e.x, ['center', 'amplitude', 'period']) || !(e.x.period > 0)) return null;
          let s = 0;
          for (let k = 0; k < 8; k++) s += at(e, e.y + (k * e.x.period) / 8);
          return close(s / 8, e.x.center, Math.abs(e.x.amplitude) + Math.abs(e.x.center), 1e-6) ? true : FAIL('ממוצע ' + s / 8 + ' ולא ' + e.x.center);
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('center', 'amplitude', 'period') }, { name: 'step', d: N }], fn: () => oscillate },
    mutants: {
      'oscillate.periodic': () => (s, n) => oscillate({ ...s, period: fin(s?.period) * 1.5 }, n),
      'oscillate.bounded': () => (s, n) => oscillate({ ...s, amplitude: fin(s?.amplitude) * 1.5 }, n),
      'oscillate.balanced': () => (s, n) => fin(s?.center) + Math.abs(oscillate(s, n) - fin(s?.center)),
    },
    cues: { en: ['oscillate', 'wave', 'sin', 'sine', 'pulse', 'breathe', 'blink', 'twinkle', 'sway', 'bob', 'wobble', 'oscillator'], he: ['מתנדנד', 'נושם', 'מהבהב', 'גל'] },
  },
  {
    id: 'random', he: 'מגריל', mined: true, bind: 'spec',
    means: 'רצף מספרים בין 0 ל-1 שנראה אקראי ומפוזר שווה — אבל אותו זרע נותן אותו רצף בדיוק',
    takes: ['record', 'number'], gives: 'sequence',
    fit: (e) => has(e.x, ['seed']) && isNum(e.y) && !!coordsOf(e.out),
    witness: (e) => e.out.length >= 3 && new Set(e.out.map(canon)).size === e.out.length,
    laws: [
      { id: 'random.replay', says: 'אותו זרע ⇒ אותו רצף; לבקש עוד מספרים לא משנה את הראשונים', catches: 'הרצף תלוי בכמה ביקשו', check: (e) => { const more = at(e, e.out.length + 5); return isArr(more) && same(more.slice(0, e.out.length), e.out) ? true : FAIL('הרצף השתנה כשביקשו יותר'); } },
      { id: 'random.range', says: 'כל מספר בין 0 (כולל) ל-1 (לא כולל)', catches: 'מספרים עד 1.25', check: (e) => { const c = coordsOf(e.out) ?? []; return c.every((v) => v >= 0 && v < 1) ? true : FAIL('מחוץ ל-[0,1): ' + c.find((v) => !(v >= 0 && v < 1))); } },
      {
        id: 'random.seeded', says: 'זרע אחר ⇒ רצף אחר', catches: 'מתעלם מהזרע',
        check: (e) => {
          if (e.out.length < 3 || !nums(e.x, ['seed'])) return null;
          const o = withSpec(e, { seed: e.x.seed + 1 });
          return !same(o, e.out) ? true : FAIL('זרע ' + (e.x.seed + 1) + ' נתן אותו רצף');
        },
      },
      {
        id: 'random.even', says: 'מפוזר שווה: ב-400 הגרלות הממוצע קרוב לחצי ובכל רבע יש לפחות 60', catches: 'מוטה לאפס (x²)',
        check: (e) => {
          const got = at(e, 400);
          const xs = coordsOf(got);
          if (!isArr(got) || got.length !== 400 || !xs) return FAIL('ביקשו 400, קיבלו ' + (isArr(got) ? got.length : typeof got));
          // נקודות: כל ציר נבדק — 800 קואורדינטות, אותו סף יחסי
          const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
          const q = [0, 0, 0, 0];
          for (const v of xs) q[Math.min(3, Math.max(0, Math.floor(v * 4)))]++;
          return mean > 0.42 && mean < 0.58 && q.every((c) => c >= (60 * xs.length) / 400) ? true : FAIL('ממוצע ' + mean.toFixed(3) + ' · רבעים ' + q.join('/'));
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('seed') }, { name: 'count', d: { t: 'num', h: 'count' } }], fn: () => random },
    refGeo: { sig: [{ name: 'spec', d: O('seed') }, { name: 'count', d: { t: 'num', h: 'count' } }], fn: () => (s, n) => pairs(random(s, 2 * Math.floor(Math.abs(fin(n))))) },
    mutantsGeo: {
      'random.replay': () => (s, n) => pairs(random({ seed: (fin(s?.seed) ^ Math.floor(fin(n))) >>> 0 }, 2 * Math.floor(Math.abs(fin(n))))),
      'random.range': () => (s, n) => pairs(random(s, 2 * Math.floor(Math.abs(fin(n)))).map((v) => v * 1.25)),
      'random.seeded': () => (s, n) => pairs(random({ seed: 7 }, 2 * Math.floor(Math.abs(fin(n))))),
      'random.even': () => (s, n) => pairs(random(s, 2 * Math.floor(Math.abs(fin(n)))).map((v) => v * v)),
    },
    mutants: {
      'random.replay': () => (s, n) => random({ seed: (fin(s?.seed) ^ Math.floor(fin(n))) >>> 0 }, n),
      'random.range': () => (s, n) => random(s, n).map((v) => v * 1.25),
      'random.seeded': () => (s, n) => random({ seed: 7 }, n),
      'random.even': () => (s, n) => random(s, n).map((v) => v * v),
    },
    cues: { en: ['random', 'rand', 'rng', 'seed', 'seeded', 'shuffle', 'mulberry', 'lcg', 'prng', 'jitter', 'noise', 'dice', 'lottery'], he: ['מגריל', 'אקראי', 'הגרלה', 'ערבוב'] },
  },
  {
    id: 'gravity', he: 'נופל', mined: true, bind: 'spec',
    means: 'בכל צעד המהירות גדלה באותה כמות והמקום זז במהירות החדשה — מסלול ריבועי של נפילה (vy += g; y += vy)',
    takes: ['record', 'number'], gives: 'record',
    fit: (e) => has(e.x, ['y', 'vy', 'g']) && isNum(e.y) && isObj(e.out) && isNum(e.out.y) && isNum(e.out.vy),
    witness: (e) => nums(e.x, ['g']) && e.x.g !== 0 && e.y >= 1,
    laws: [
      { id: 'gravity.start', says: 'בצעד אפס — המקום והמהירות ההתחלתיים', catches: 'מתחיל צעד אחד מאוחר', check: (e) => { if (!nums(e.x, ['y', 'vy'])) return null; const o = at(e, 0); return close(o.y, e.x.y, 0, 1e-12) && close(o.vy, e.x.vy, 0, 1e-12) ? true : FAIL('בצעד 0 ⇒ ' + JSON.stringify(o)); } },
      {
        id: 'gravity.speed', says: 'המהירות גדלה בכל צעד בדיוק ב-g', catches: 'מדווח מהירות כפולה',
        check: (e) => {
          if (!nums(e.x, ['y', 'vy', 'g'])) return null;
          const s = e.r.int(0, 60); const a = at(e, s); const b = at(e, s + 1);
          return close(b.vy - a.vy, e.x.g, Math.abs(a.vy) + Math.abs(b.vy), 1e-9) ? true : FAIL('המהירות גדלה ב-' + (b.vy - a.vy) + ' ולא ב-' + e.x.g);
        },
      },
      {
        id: 'gravity.quadratic', says: 'המסלול ריבועי: ההפרש-השני של המקום קבוע ושווה ל-g', catches: 'נופל בקו ישר (בלי האצה)',
        check: (e) => {
          if (!nums(e.x, ['y', 'vy', 'g'])) return null;
          const s = e.r.int(0, 60); const a = at(e, s).y; const b = at(e, s + 1).y; const c = at(e, s + 2).y;
          return close(c - 2 * b + a, e.x.g, Math.abs(a) + Math.abs(b) + Math.abs(c), 1e-9) ? true : FAIL('ההפרש-השני ' + (c - 2 * b + a) + ' ולא ' + e.x.g);
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('y', 'vy', 'g') }, { name: 'step', d: N }], fn: () => gravity },
    mutants: {
      'gravity.start': () => (s, n) => gravity(s, Math.floor(Math.abs(fin(n))) + 1),
      'gravity.speed': () => (s, n) => { const o = gravity(s, n); return { y: o.y, vy: o.vy + Math.floor(Math.abs(fin(n))) * fin(s?.g) }; },
      'gravity.quadratic': () => (s, n) => { const k = Math.floor(Math.abs(fin(n))); return { y: fin(s?.y) + k * fin(s?.vy) + fin(s?.g) * k, vy: fin(s?.vy) + k * fin(s?.g) }; },
    },
    cues: { en: ['gravity', 'fall', 'falling', 'drop', 'vy', 'projectile', 'parabola', 'ballistic', 'arc'], he: ['נופל', 'נפילה', 'כבידה', 'צונח'] },
  },
  {
    id: 'move-along-path', he: 'מתקדם במסלול', mined: true, bind: 'spec',
    means: 'נקודה שזזה על דרך של תחנות: 0 = בראשונה, 1 = באחרונה, ובאמצע — על הדרך עצמה, לפי המרחק שעברה',
    takes: ['record', 'number'], gives: 'geo',
    fit: (e) => has(e.x, ['points']) && isArr(e.x.points) && e.x.points.length >= 2 && e.x.points.every(pt) && isNum(e.y),
    witness: (e) => { const o = at(e, 0.37); const ps = e.x.points; return pt(o) && dist(o, ps[0]) > 1e-6 && dist(o, ps[ps.length - 1]) > 1e-6; },
    laws: [
      {
        id: 'move-along-path.ends', says: 'בהתחלה (0) — בתחנה הראשונה; בסוף (1) — באחרונה', catches: 'נעצר ב-90% מהדרך',
        check: (e) => {
          const ps = e.x.points; const a = at(e, 0); const b = at(e, 1);
          return pt(a) && pt(b) && dist(a, ps[0]) < 1e-9 && dist(b, ps[ps.length - 1]) < 1e-9 ? true : FAIL('קצוות: ' + JSON.stringify([a, b]));
        },
      },
      {
        id: 'move-along-path.onpath', says: 'באמצע — תמיד על אחד מקטעי הדרך (לא קיצור דרך)', catches: 'חותך בקו ישר מהראשונה לאחרונה',
        check: (e) => {
          const ps = e.x.points; const sc = Math.max(1, ...ps.map((p) => Math.abs(p.x) + Math.abs(p.y)));
          for (let k = 0; k < 3; k++) {
            const p = e.r.next(); const o = at(e, p);
            if (!pt(o)) return FAIL('לא נקודה ב-' + p);
            let m = Infinity; for (let s = 1; s < ps.length; s++) m = Math.min(m, segDist(o, ps[s - 1], ps[s]));
            if (m > 1e-7 * sc) return FAIL('ב-' + p.toFixed(3) + ' מחוץ לדרך במרחק ' + m);
          }
          return true;
        },
      },
      {
        id: 'move-along-path.even', says: 'לפי המרחק: ב-p עבר בדיוק p מאורך הדרך כולה (לא לפי מספר התחנות)', catches: 'זמן שווה לכל קטע (לא לפי אורך)',
        check: (e) => {
          const ps = e.x.points; const sc = Math.max(1, ...ps.map((p) => Math.abs(p.x) + Math.abs(p.y)));
          const cum = [0]; for (let s = 1; s < ps.length; s++) cum.push(cum[s - 1] + dist(ps[s - 1], ps[s]));
          const L = cum[cum.length - 1];
          if (L < 1e-6) return null;
          for (let k = 0; k < 3; k++) {
            const p = e.r.next(); const o = at(e, p);
            if (!pt(o)) return FAIL('לא נקודה');
            let ok = false;
            for (let s = 1; s < ps.length && !ok; s++) if (segDist(o, ps[s - 1], ps[s]) <= 1e-7 * sc && Math.abs(cum[s - 1] + dist(ps[s - 1], o) - p * L) <= 1e-6 * Math.max(1, L)) ok = true;
            if (!ok) return FAIL('ב-' + p.toFixed(3) + ' לא עבר ' + (p * L).toFixed(3) + ' מתוך ' + L.toFixed(3));
          }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['points', { t: 'arr', of: O('x', 'y') }, false]] } }, { name: 'progress', d: N }], fn: () => moveAlongPath },
    mutants: {
      'move-along-path.ends': () => (s, p) => moveAlongPath(s, fin(p) * 0.9),
      'move-along-path.onpath': () => (s, p) => { const ps = s?.points ?? []; if (ps.length < 2) return moveAlongPath(s, p); return moveAlongPath({ points: [ps[0], ps[ps.length - 1]] }, p); },
      'move-along-path.even': () => (s, p) => { const ps = (s?.points ?? []).map((q) => ({ x: fin(q?.x), y: fin(q?.y) })); if (ps.length < 2) return moveAlongPath(s, p); const t = Math.min(1, Math.max(0, fin(p))) * (ps.length - 1); const k = Math.min(ps.length - 2, Math.floor(t)); const f = t - k; return { x: ps[k].x + (ps[k + 1].x - ps[k].x) * f, y: ps[k].y + (ps[k + 1].y - ps[k].y) * f }; },
    },
    cues: { en: ['path', 'along', 'waypoint', 'waypoints', 'route', 'progress', 'lerp', 'bezier', 'tween', 'interpolate', 'pointAt', 'getPointAtLength'], he: ['מסלול', 'בדרך', 'מתקדם', 'תחנות'] },
  },
  {
    id: 'orbit', he: 'מקיף', mined: true, bind: 'spec',
    means: 'מסתובב סביב מרכז: תמיד באותו מרחק, באותה מהירות, וחוזר לאותו מקום אחרי מחזור שלם',
    takes: ['record', 'number'], gives: 'geo',
    fit: (e) => has(e.x, ['cx', 'cy', 'radius', 'period']) && isNum(e.y) && pt(e.out),
    witness: (e) => nums(e.x, ['radius']) && Math.abs(e.x.radius) > 1e-9,
    laws: [
      {
        id: 'orbit.radius', says: 'המרחק מהמרכז תמיד הרדיוס', catches: 'אליפסה במקום מעגל',
        check: (e) => (!nums(e.x, ['cx', 'cy', 'radius']) ? null : close(Math.hypot(e.out.x - e.x.cx, e.out.y - e.x.cy), Math.abs(e.x.radius), Math.abs(e.x.cx) + Math.abs(e.x.cy), 1e-9) ? true : FAIL('מרחק ' + Math.hypot(e.out.x - e.x.cx, e.out.y - e.x.cy) + ' ולא ' + e.x.radius)),
      },
      {
        id: 'orbit.period', says: 'אחרי מחזור שלם — באותו מקום', catches: 'מחזור ארוך פי 1.3',
        check: (e) => {
          if (!nums(e.x, ['cx', 'cy', 'radius', 'period']) || !(e.x.period > 0)) return null;
          const b = at(e, e.y + e.x.period); const sc = Math.abs(e.x.radius) + Math.abs(e.x.cx) + Math.abs(e.x.cy);
          return close(b.x, e.out.x, sc, 1e-6) && close(b.y, e.out.y, sc, 1e-6) ? true : FAIL('אחרי מחזור ' + JSON.stringify(b) + ' ולא ' + JSON.stringify(e.out));
        },
      },
      {
        id: 'orbit.steady', says: 'מהירות קבועה: כל צעד עובר אותו מרחק', catches: 'מאיץ ומאט בתוך הסיבוב',
        check: (e) => {
          if (!nums(e.x, ['cx', 'cy', 'radius', 'period']) || !(e.x.period > 2)) return null;
          const a = at(e, e.y); const b = at(e, e.y + 1); const c = at(e, e.y + 2); const sc = Math.abs(e.x.radius) + Math.abs(e.x.cx) + Math.abs(e.x.cy);
          return close(dist(a, b), dist(b, c), sc, 1e-6) ? true : FAIL('צעד ' + dist(a, b) + ' ואחריו ' + dist(b, c));
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('cx', 'cy', 'radius', 'period') }, { name: 'step', d: N }], fn: () => orbit },
    mutants: {
      'orbit.radius': () => (s, n) => { const o = orbit(s, n); return { x: o.x, y: fin(s?.cy) + (o.y - fin(s?.cy)) * 0.6 }; },
      'orbit.period': () => (s, n) => orbit({ ...s, period: fin(s?.period) * 1.3 }, n),
      'orbit.steady': () => (s, n) => { const P = Math.abs(fin(s?.period)) || 1; const ph = (((fin(n) % P) + P) % P) / P; const a = 2 * Math.PI * ph + 0.3 * Math.sin(2 * Math.PI * ph); const r = Math.abs(fin(s?.radius)); return { x: fin(s?.cx) + r * Math.cos(a), y: fin(s?.cy) + r * Math.sin(a) }; },
    },
    cues: { en: ['orbit', 'revolve', 'rotate', 'spin', 'circle', 'circular', 'around', 'yaw', 'turntable', 'sweep', 'satellite'], he: ['מקיף', 'מסתובב', 'סביב', 'מעגל'] },
  },
  {
    id: 'shortest-path', he: 'מוצא דרך קצרה', mined: true, bind: 'spec',
    means: 'ברשת של נקודות וקשתות עם מחיר — הדרך הזולה ביותר מנקודה לנקודה, ואם אין דרך אומר שאין',
    takes: ['record', 'choice'], gives: 'sequence',
    fit: (e) => !!netEdges(e.x) && e.args.length === 3 && !isNil(e.y) && (isNil(e.out) || (isObj(e.out) && isArr(e.out.path))),
    witness: (e) => isObj(e.out) && e.out.path.length >= 3,
    laws: [
      {
        id: 'shortest-path.valid', says: 'הדרך אמיתית: מתחילה במוצא, נגמרת ביעד, כל שתי נקודות צמודות מחוברות בקשת, והמחיר = סכום הקשתות', catches: 'מחיר מדווח שלא תואם את הדרך',
        check: (e) => {
          if (isNil(e.out)) return true;
          const E = netEdges(e.x); const p = e.out.path; const to = e.args[3 - e.i - e.j];
          if (!same(p[0], e.y) || !same(p[p.length - 1], to)) return FAIL('הדרך לא מהמוצא ליעד');
          let c = 0;
          for (let k = 1; k < p.length; k++) { const w = minW(E, p[k - 1], p[k]); if (w === Infinity) return FAIL('אין קשת ' + p[k - 1] + '–' + p[k]); c += w; }
          return close(c, e.out.cost, c, 1e-9) ? true : FAIL('מחיר ' + e.out.cost + ' ולא ' + c);
        },
      },
      {
        id: 'shortest-path.shortest', says: 'אין דרך זולה יותר לאף יעד (בדיקה בכוח-גס על כל הדרכים), ו"אין דרך" רק כשבאמת אין', catches: 'לוקח את הדרך הראשונה שמצא (חיפוש-לעומק)',
        check: (e) => {
          const E = netEdges(e.x);
          if (E.some((x) => !isObj(x) || !isNum(x.w) || isNil(x.a) || isNil(x.b))) return null;
          const k = 3 - e.i - e.j;
          const targets = [...new Set([e.args[k], ...E.flatMap((x) => [x.a, x.b])])];
          for (const to of targets) {
            const a = e.args.slice(); a[k] = to;
            const o = e.f(a); const best = bruteCost(E, e.y, to);
            if (isNil(o)) { if (best !== Infinity) return FAIL('אמר "אין דרך" ל-' + to + ' ויש במחיר ' + best); continue; }
            if (!close(o.cost, best, best, 1e-9)) return FAIL('ל-' + to + ': מחיר ' + o.cost + ' ויש דרך במחיר ' + best);
          }
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['edges', { t: 'arr', of: { t: 'obj', p: [['a', LIT6, false], ['b', LIT6, false], ['w', N, false]] } }, false]] } }, { name: 'from', d: LIT6 }, { name: 'to', d: LIT6 }], fn: () => shortestPath },
    // MACHINE-V4: אותם חוקים על נקודות — ההגדרה היא נקודות + near, והרשת = רשת-הסינפסות (netEdges)
    refGeo: { sig: [{ name: 'net', d: { t: 'obj', p: [['points', { t: 'arr', of: O('x', 'y'), max: 6 }, false], ['near', { t: 'lit', v: [1, 2, 3] }, false]] } }, { name: 'from', d: LIT6 }, { name: 'to', d: LIT6 }], fn: () => (s, a, b) => shortestPath(nearNet(s), a, b) },
    mutantsGeo: {
      'shortest-path.valid': () => (s, a, b) => { const o = shortestPath(nearNet(s), a, b); return o && o.path.length > 1 ? { cost: o.cost * 0.9 + 0.5, path: o.path } : o; },
      'shortest-path.shortest': () => (s, a, b) => dfsFirst(nearNet(s), a, b),
    },
    mutants: {
      'shortest-path.valid': () => (s, a, b) => { const o = shortestPath(s, a, b); return o && o.path.length > 1 ? { cost: o.cost * 0.9 + 0.5, path: o.path } : o; },
      'shortest-path.shortest': () => (s, a, b) => dfsFirst(s, a, b),
    },
    cues: { en: ['shortest', 'dijkstra', 'bfs', 'astar', 'path', 'route', 'hops', 'cheapest', 'nearest', 'graph'], he: ['קצר', 'קצרה', 'דרך', 'מסלול'] },
  },
  {
    id: 'spread', he: 'מתפשט', mined: true, bind: 'spec',
    means: 'בכל צעד מה שנגע עובר לכל השכנים הישירים — גל שמתרחב טבעת אחרי טבעת, ומה שנגע נשאר',
    takes: ['record', 'number'], gives: 'list',
    fit: (e) => has(e.x, ['sources']) && !!netEdges(e.x) && isArr(e.x.sources) && isNum(e.y) && isArr(e.out),
    witness: (e) => e.out.length > new Set(e.x.sources).size,
    laws: [
      {
        id: 'spread.grows', says: 'מתחיל מהמקורות, ומה שנגע נשאר: כל צעד מכיל את כל מה שהיה בצעד הקודם', catches: 'רק הטבעת החדשה — מה שנגע נשכח',
        check: (e) => {
          const z = at(e, 0);
          if (!same([...new Set(z)].sort(), [...new Set(e.x.sources.filter((s) => !isNil(s)))].sort())) return FAIL('בצעד 0 לא בדיוק המקורות');
          const s = e.r.int(0, 5); const a = at(e, s); const b = new Set(at(e, s + 1));
          return a.every((v) => b.has(v)) ? true : FAIL('בצעד ' + (s + 1) + ' נעלם מישהו שכבר נגעו בו');
        },
      },
      {
        id: 'spread.neighbors', says: 'עובר רק לשכן ישיר: כל מי שנוסף בצעד הזה צמוד למישהו שנגעו בו קודם', catches: 'קופץ שתי טבעות בצעד',
        check: (e) => {
          for (let s = 0; s < 4; s++) {
            const a = new Set(at(e, s)); const b = at(e, s + 1);
            for (const v of b) if (!a.has(v) && !neighborsOf(netEdges(e.x), v).some((u) => a.has(u))) return FAIL(v + ' נוסף בצעד ' + (s + 1) + ' בלי שכן שנגעו בו');
          }
          return true;
        },
      },
      {
        id: 'spread.reach', says: 'עובר לכל השכנים: כל שכן של מי שנגעו בו — נגעו בו בצעד הבא', catches: 'עובר רק לחצי מהשכנים',
        check: (e) => {
          const s = e.r.int(0, 5); const a = at(e, s); const b = new Set(at(e, s + 1));
          for (const u of a) for (const v of neighborsOf(netEdges(e.x), u)) if (!b.has(v)) return FAIL(v + ' שכן של ' + u + ' ולא נגעו בו');
          return true;
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['edges', { t: 'arr', of: { t: 'obj', p: [['a', LIT8, false], ['b', LIT8, false]] } }, false], ['sources', { t: 'arr', of: LIT8 }, false]] } }, { name: 'steps', d: { t: 'num', h: 'count' } }], fn: () => spread },
    refGeo: { sig: [{ name: 'net', d: { t: 'obj', p: [['points', { t: 'arr', of: O('x', 'y'), max: 6 }, false], ['near', { t: 'lit', v: [1, 2] }, false], ['sources', { t: 'arr', of: LIT6, max: 2 }, false]] } }, { name: 'steps', d: { t: 'num', h: 'count' } }], fn: () => (s, n) => spread(nearNet(s), n) },
    mutantsGeo: {
      'spread.grows': () => (s, n) => { const g = nearNet(s); const k = Math.floor(Math.abs(fin(n))); if (!k) return spread(g, 0); const prev = new Set(spread(g, k - 1)); return spread(g, k).filter((v) => !prev.has(v)); },
      'spread.neighbors': () => (s, n) => spread(nearNet(s), Math.floor(Math.abs(fin(n))) * 2),
      'spread.reach': () => (s, n) => { const g = nearNet(s); return spread({ ...g, edges: g.edges.filter((_, q) => q % 2 === 0) }, Math.floor(Math.abs(fin(n)))); },
    },
    mutants: {
      'spread.grows': () => (s, n) => { const k = Math.floor(Math.abs(fin(n))); if (!k) return spread(s, 0); const prev = new Set(spread(s, k - 1)); return spread(s, k).filter((v) => !prev.has(v)); },
      'spread.neighbors': () => (s, n) => spread(s, Math.floor(Math.abs(fin(n))) * 2),
      'spread.reach': () => (s, n) => { const k = Math.floor(Math.abs(fin(n))); return spread({ ...s, edges: (s?.edges ?? []).filter((_, q) => q % 2 === 0) }, k); },
    },
    cues: { en: ['spread', 'flood', 'cascade', 'propagate', 'contagion', 'ripple', 'reach', 'reachWithin', 'frontier', 'infect', 'diffuse'], he: ['מתפשט', 'מתפזר', 'מדביק', 'גל'] },
  },
  {
    id: 'sample', he: 'דוגם', mined: true, bind: 'spec',
    means: 'קורא מהסביבה כל קריאה k-ית (הראשונה, ה-k, ה-2k…) — בלי לשנות ובלי לדלג על תור',
    takes: ['record', 'list'], gives: 'list',
    fit: (e) => has(e.x, ['every']) && isArr(e.y) && isArr(e.out),
    witness: (e) => e.out.length >= 1 && e.out.length < e.y.length,
    laws: [
      {
        id: 'sample.picks', says: 'הקריאה ה-k בפלט = הקריאה ה-k·every בקלט, לפי הסדר', catches: 'קורא את השכן של הקריאה הנכונה',
        check: (e) => {
          if (!nums(e.x, ['every']) || !Number.isInteger(e.x.every) || e.x.every < 1) return null;
          for (let k = 0; k < e.out.length; k++) if (!same(e.out[k], e.y[k * e.x.every])) return FAIL('הקריאה ' + k + ' לא מהמקום ' + k * e.x.every);
          return isSubseq(e.out, e.y) ? true : FAIL('לא תת-רצף');
        },
      },
      {
        id: 'sample.count', says: 'בדיוק כמה שצריך: עיגול-למעלה של (כמה קריאות ÷ every)', catches: 'מפיל את הקריאה האחרונה',
        check: (e) => (!nums(e.x, ['every']) || !Number.isInteger(e.x.every) || e.x.every < 1 ? null : e.out.length === Math.ceil(e.y.length / e.x.every) ? true : FAIL(e.out.length + ' קריאות ולא ' + Math.ceil(e.y.length / e.x.every))),
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['every', { t: 'int', lo: 1, hi: 4 }, false]] } }, { name: 'readings', d: { t: 'arr', of: N, max: 12 } }], fn: () => sample },
    mutants: {
      'sample.picks': () => (s, xs) => { const k = Math.max(1, Math.floor(Math.abs(fin(s?.every))) || 1); const a = Array.isArray(xs) ? xs : []; const o = []; for (let i = 0; i < a.length; i += k) o.push(a[Math.min(a.length - 1, i + (k > 1 ? 1 : 0))]); return o; },
      'sample.count': () => (s, xs) => sample(s, xs).slice(0, -1),
    },
    cues: { en: ['sample', 'sampling', 'every', 'nth', 'stride', 'poll', 'read', 'probe', 'getImageData', 'pixel', 'detect'], he: ['דוגם', 'דגימה', 'קורא', 'מודד'] },
  },
  {
    id: 'echo', he: 'מודד בהד', mined: true, bind: 'spec',
    means: 'שולח אות ומודד אחרי כמה זמן חזר — המרחק הוא הדרך הלוך-וחזור חלקי שתיים',
    takes: ['record', 'number'], gives: 'number',
    fit: (e) => has(e.x, ['speed']) && isNum(e.y) && isNum(e.out),
    witness: (e) => e.out > 0,
    laws: [
      { id: 'echo.zero', says: 'חזר מיד ⇒ המרחק אפס', catches: 'מוסיף מטר אחד תמיד', check: (e) => (at(e, 0) === 0 ? true : FAIL('בזמן 0 ⇒ ' + at(e, 0))) },
      {
        id: 'echo.linear', says: 'פי שניים זמן ⇒ פי שניים מרחק', catches: 'מרחק בריבוע הזמן',
        check: (e) => (!(e.y >= 0) ? null : close(at(e, 2 * e.y), 2 * e.out, e.out, 1e-9) ? true : FAIL('זמן כפול ⇒ ' + at(e, 2 * e.y) + ' ולא ' + 2 * e.out)),
      },
      {
        id: 'echo.there-back', says: 'הלוך וחזור: לעבור את המרחק פעמיים במהירות האות לוקח בדיוק את הזמן שנמדד', catches: 'שוכח לחלק בשתיים (סופר רק הלוך)',
        check: (e) => (!nums(e.x, ['speed']) || !(e.x.speed > 0) || !(e.y >= 0) ? null : close((2 * e.out) / e.x.speed, e.y, e.y, 1e-9) ? true : FAIL('2·' + e.out + '/' + e.x.speed + ' ≠ ' + e.y)),
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('speed') }, { name: 'roundTrip', d: N }], fn: () => echo },
    mutants: {
      'echo.zero': () => (s, t) => echo(s, t) + 1,
      'echo.linear': () => (s, t) => echo(s, Math.max(0, fin(t)) ** 2 / 10),
      'echo.there-back': () => (s, t) => echo(s, t) * 2,
    },
    cues: { en: ['echo', 'ping', 'rtt', 'roundTrip', 'latency', 'sonar', 'pong', 'heartbeat'], he: ['הד', 'פינג', 'זמן-תגובה'] },
  },
  {
    id: 'follow', he: 'הולך אחרי', mined: true, bind: 'spec',
    means: 'בכל צעד מתקרב חלק קבוע מהדרך אל המטרה — לא עובר אותה, וכשהגיע נשאר (החלקה, מצלמה שנגררת, להקה)',
    takes: ['record', 'number'], gives: 'number',
    // מספר — או נקודה {x, y} (MACHINE-V4): אותם חוקים, בחשבון של וקטורים (מספר = וקטור באורך 1)
    fit: (e) => has(e.x, ['target', 'pullPct']) && sameVec(e.x.target, e.y) && sameVec(e.y, e.out),
    witness: (e) => { const t = vecOf(e.x.target); const y = vecOf(e.y); const o = vecOf(e.out); return !!t && norm(sub(o, y)) > 1e-9 * Math.max(1, norm(y)) && norm(sub(o, t)) > 1e-9 * Math.max(1, norm(t)); },
    laws: [
      {
        id: 'follow.closer', says: 'מתקרב ולא עובר: המרחק למטרה לא גדל, והצד לא מתחלף', catches: 'קופץ לצד השני של המטרה',
        check: (e) => {
          const t = vecOf(e.x.target);
          if (!t || !pctOk(e.x.pullPct)) return null;
          const y = vecOf(e.y); const o = vecOf(e.out); const sc = Math.max(1, norm(t));
          if (dot(sub(o, t), sub(y, t)) < -1e-12 * sc * sc) return FAIL('עבר את המטרה');
          return norm(sub(o, t)) <= norm(sub(y, t)) * (1 + 1e-12) + 1e-12 ? true : FAIL('התרחק');
        },
      },
      { id: 'follow.still', says: 'כשכבר במטרה — נשאר בה', catches: 'זז גם כשכבר במטרה', check: (e) => { const t = vecOf(e.x.target); if (!t) return null; const o = vecOf(at(e, e.x.target)); return !!o && o.length === t.length && o.every((v, k) => close(v, t[k], 0, 1e-12)) ? true : FAIL('במטרה ' + JSON.stringify(e.x.target) + ' זז ל-' + JSON.stringify(at(e, e.x.target))); } },
      {
        id: 'follow.fraction', says: 'החלק שעובר קבוע: מכל מרחק מתקרב באותו אחוז מהדרך', catches: 'מהירות קבועה במקום חלק מהדרך',
        check: (e) => {
          const t = vecOf(e.x.target);
          if (!t || !pctOk(e.x.pullPct)) return null;
          const y = vecOf(e.y);
          if (norm(sub(y, t)) < 1e-6) return null;
          const c2 = t.map((v, k) => v + (y[k] - v) * 3 + 7);
          const fr1 = fracOf(y, vecOf(e.out), t); const o2 = vecOf(at(e, fromVec(c2, e.y))); const fr2 = o2 && fracOf(c2, o2, t);
          if (fr1 === null || fr2 === null || fr2 === undefined) return FAIL('לא בקו ישר אל המטרה');
          return close(fr1, fr2, 1, 1e-6) ? true : FAIL('מרחק אחד ' + fr1.toFixed(4) + ', אחר ' + fr2.toFixed(4));
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['target', N, false], ['pullPct', { t: 'num', h: 'pct' }, false]] } }, { name: 'current', d: N }], fn: () => follow },
    refGeo: { sig: [{ name: 'spec', d: { t: 'obj', p: [['target', O('x', 'y'), false], ['pullPct', { t: 'num', h: 'pct' }, false]] } }, { name: 'current', d: O('x', 'y') }], fn: () => (s, c) => ({ x: follow({ target: s?.target?.x, pullPct: s?.pullPct }, c?.x), y: follow({ target: s?.target?.y, pullPct: s?.pullPct }, c?.y) }) },
    mutantsGeo: {
      'follow.closer': () => (s, c) => { const k = Math.min(100, Math.abs(fin(s?.pullPct))) / 100; const t = s?.target ?? {}; return { x: fin(t.x) + (fin(t.x) - fin(c?.x)) * k, y: fin(t.y) + (fin(t.y) - fin(c?.y)) * k }; },
      'follow.still': () => (s, c) => ({ x: follow({ target: s?.target?.x, pullPct: s?.pullPct }, c?.x) + 0.5, y: follow({ target: s?.target?.y, pullPct: s?.pullPct }, c?.y) }),
      'follow.fraction': () => (s, c) => { const t = s?.target ?? {}; const dx = fin(t.x) - fin(c?.x); const dy = fin(t.y) - fin(c?.y); const L = Math.hypot(dx, dy); const st = L ? Math.min(L, 1) / L : 0; return { x: fin(c?.x) + dx * st, y: fin(c?.y) + dy * st }; },
    },
    mutants: {
      'follow.closer': () => (s, c) => fin(s?.target) + (fin(s?.target) - fin(c)) * (Math.min(100, Math.abs(fin(s?.pullPct))) / 100),
      'follow.still': () => (s, c) => follow(s, c) + 0.5,
      'follow.fraction': () => (s, c) => { const d = fin(s?.target) - fin(c); return fin(c) + Math.sign(d) * Math.min(Math.abs(d), 1); },
    },
    cues: { en: ['follow', 'chase', 'lerp', 'ease', 'easeToward', 'smooth', 'smoothing', 'track', 'approach', 'ema', 'lag', 'seek'], he: ['הולך אחרי', 'עוקב', 'נגרר', 'מתקרב'] },
  },
  {
    id: 'bounce', he: 'קופץ', mined: true, combination: ['oscillate', 'decay'], bind: 'spec',
    means: 'גוף שפוגע ברצפה חוזר ממנה: המהירות מתהפכת ונחלשת לפי מקדם-הקפיצה, ואף פעם לא נשאר מתחת לרצפה',
    takes: ['record', 'record'], gives: 'record',
    fit: (e) => has(e.x, ['floor', 'bouncePct']) && isObj(e.y) && 'pos' in e.y && 'vel' in e.y && isObj(e.out),
    witness: (e) => { if (!nums(e.x, ['floor', 'bouncePct']) || !pctOk(e.x.bouncePct) || e.x.bouncePct === 0) return false; const o = at(e, { pos: e.x.floor + 1, vel: -5 }); return isObj(o) && o.vel > 0; },
    laws: [
      {
        id: 'bounce.flip', says: 'בפגיעה ברצפה המהירות מתהפכת ונחלשת בדיוק במקדם-הקפיצה', catches: 'קופץ בלי לאבד אנרגיה',
        check: (e) => {
          if (!nums(e.x, ['floor', 'bouncePct']) || !pctOk(e.x.bouncePct)) return null;
          const pos = e.x.floor + e.r.int(0, 20); const vel = -(pos - e.x.floor) - 1 - e.r.int(0, 30);
          const o = at(e, { pos, vel }); const want = (-vel * e.x.bouncePct) / 100;
          return isObj(o) && close(o.vel, want, vel, 1e-9) ? true : FAIL('מהירות ' + vel + ' ⇒ ' + o?.vel + ' ולא ' + want);
        },
      },
      {
        id: 'bounce.inside', says: 'אף פעם לא מתחת לרצפה', catches: 'נשאר מתחת לרצפה',
        check: (e) => {
          if (!nums(e.x, ['floor', 'bouncePct']) || !pctOk(e.x.bouncePct)) return null;
          for (let k = 0; k < 3; k++) {
            const pos = e.x.floor + e.r.int(0, 20); const vel = e.r.int(-60, 20);
            const o = at(e, { pos, vel });
            if (!isObj(o) || !(o.pos >= e.x.floor - 1e-9 * Math.max(1, Math.abs(e.x.floor)))) return FAIL('מתחת לרצפה: ' + o?.pos);
          }
          return true;
        },
      },
      {
        id: 'bounce.free', says: 'בלי פגיעה — ממשיך כרגיל: המקום זז במהירות והמהירות לא משתנה', catches: 'מאט גם באוויר',
        check: (e) => {
          if (!nums(e.x, ['floor'])) return null;
          const pos = e.x.floor + 40 + e.r.int(0, 20); const vel = e.r.int(-30, 30);
          const o = at(e, { pos, vel });
          return isObj(o) && close(o.pos, pos + vel, pos, 1e-12) && close(o.vel, vel, 0, 1e-12) ? true : FAIL('בלי פגיעה ⇒ ' + JSON.stringify(o));
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: { t: 'obj', p: [['floor', N, false], ['bouncePct', { t: 'num', h: 'pct' }, false]] } }, { name: 'body', d: O('pos', 'vel') }], fn: () => bounce },
    mutants: {
      'bounce.flip': () => (s, b) => bounce({ ...s, bouncePct: 100 }, b),
      'bounce.inside': () => (s, b) => { const o = bounce(s, b); const fl = fin(s?.floor); const nx = Math.max(fl, fin(b?.pos)) + fin(b?.vel); return nx < fl ? { pos: nx, vel: o.vel } : o; },
      'bounce.free': () => (s, b) => { const o = bounce(s, b); return { pos: o.pos, vel: o.vel * 0.99 }; },
    },
    cues: { en: ['bounce', 'rebound', 'restitution', 'reflect', 'collide', 'collision', 'wall', 'bouncy'], he: ['קופץ', 'קפיצה', 'ניתור', 'חוזר'] },
  },
  {
    id: 'sun-position', he: 'מוצא את מקום השמש', mined: true, bind: 'spec',
    means: 'מתי השמש נמצאת בזווית נתונה מתחת לאופק ביום ובמקום נתונים — בבוקר עולה, בערב שוקעת, וחצות-היום באמצע',
    takes: ['geo|record', 'date'], gives: 'times', // הקלט הוא מקום על הארץ (lat, lon) + זווית
    fit: (e) => has(e.x, ['lat', 'lon', 'depression']) && isStr(e.y) && (isNil(e.out) || nums(e.out, ['rise', 'noon', 'set'])),
    witness: (e) => isObj(e.out) && e.out.set - e.out.rise > 60,
    laws: [
      { id: 'sun-position.order', says: 'קודם עולה, אחר כך חצות-היום, אחר כך שוקעת', catches: 'מחליף בוקר וערב', check: (e) => (isNil(e.out) ? null : e.out.rise < e.out.noon && e.out.noon < e.out.set ? true : FAIL('סדר: ' + JSON.stringify(e.out))) },
      { id: 'sun-position.symmetric', says: 'חצות-היום בדיוק באמצע בין העלייה לשקיעה', catches: 'שקיעה מאוחרת ב-3 דקות', check: (e) => (isNil(e.out) ? null : close(e.out.noon - e.out.rise, e.out.set - e.out.noon, 1440, 1e-9) ? true : FAIL('בוקר ' + (e.out.noon - e.out.rise) + ' דק׳, ערב ' + (e.out.set - e.out.noon))) },
      {
        id: 'sun-position.deeper', says: 'זווית עמוקה יותר (דמדומים) ⇒ מוקדם יותר בבוקר ומאוחר יותר בערב, וחצות-היום לא זז', catches: 'הופך את סימן הזווית',
        check: (e) => {
          if (isNil(e.out) || !nums(e.x, ['depression']) || Math.abs(e.x.depression) > 87) return null;
          const o = withSpec(e, { depression: e.x.depression + 3 });
          if (isNil(o)) return null;
          return o.rise < e.out.rise && o.set > e.out.set && close(o.noon, e.out.noon, 1440, 1e-9) ? true : FAIL('עמוק ב-3° ⇒ ' + JSON.stringify(o) + ' מול ' + JSON.stringify(e.out));
        },
      },
    ],
    ref: { sig: [{ name: 'spec', d: O('lat', 'lon', 'depression') }, { name: 'day', d: { t: 'str', h: 'iso' } }], fn: () => sunPosition },
    mutants: {
      'sun-position.order': () => (s, d) => { const o = sunPosition(s, d); return o && { rise: o.set, noon: o.noon, set: o.rise }; },
      'sun-position.symmetric': () => (s, d) => { const o = sunPosition(s, d); return o && { ...o, set: o.set + 3 }; },
      'sun-position.deeper': () => (s, d) => sunPosition({ ...s, depression: -fin(s?.depression) }, d),
    },
    cues: { en: ['sun', 'sunrise', 'sunset', 'zmanim', 'solar', 'noaa', 'dawn', 'dusk', 'twilight', 'declination', 'zenith'], he: ['שמש', 'זריחה', 'שקיעה', 'נץ', 'זמנים', 'צאת'] },
  },
];

/** פועל ⇒ קובץ-הליבה (catalog/core) ושם-הפונקציה שבו. */
export const CORE_OF = Object.fromEntries(MOTION_VERBS.map((v) => [v.id, { file: 'catalog/core/' + v.id + '.mjs', symbol: v.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) }]));
