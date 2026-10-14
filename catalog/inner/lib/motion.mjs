/**
 * 🌊 צופי-התנועה (INNER, 14.10.2026) — "מה קורה לאורך הזמן", **נמדד בהרצה**, לא משם.
 *
 * מילון-המטרות צריך פעלים שעוד אין להם חוקים באלפבית (`catalog/verbs.json` שייך לסשן אחר ולא נוגעים בו):
 * דועך · סופר לאחור · צובר · מתנדנד · מקיף. כאן הם **תכונות-תנועה** עם חוקים משלהם, שנבדקות על הפונקציה המורמת:
 * מזיזים קלט מספרי אחד בצעדים שווים (סריקה), משאירים את השאר קבוע, ומסתכלים על הסדרה שיוצאת.
 *
 *   decay      — לא עולה אף פעם, יורדת בפועל, הצעדים קטנים והולכים (מתקרבת לרצפה), וחלקה.
 *   countdown  — יורדת בקו ישר (אותו צעד בדיוק) עד רצפה, ושם נעצרת.
 *   accumulate — עולה בקו ישר (אותו צעד בדיוק), והקצב תלוי בקלט אחר (לא סתם x+5).
 *   oscillate  — עולה ויורדת שוב ושוב (≥ 4 שינויי-כיוון), חלקה (לא רעש), והשיאים באותו גובה.
 *   orbit      — שני חלקים-אחים (x ו-y מאותה פונקציה, אותם קלטים) מתנדנדים יחד על אותה סריקה, והנקודה (x,y) נשארת על אליפסה.
 *
 * "מתקיים" = בכל בסיס שבו הערך זז בכלל (n/n), עם לפחות 4 כאלה; קלטי-בחירה (כן/לא, אפשרויות) מקובעים לתצורה —
 * כמו `config` של הקורא — וכתובים בתוצאה. אלה **לא** פעלים של האלפבית: הם נשמרים בשדה `motion` בנפרד מ-`verbs`.
 * דטרמיניסטי: הזרע נגזר מהמזהה. הקריאה לחלק מוזרקת (בארגז-החול).
 */
import { gen, hintOf } from '../../lib/shape.mjs';
import { fnvHash } from '../../lib/probe.mjs';

export const MOTION = { N: 48, STEPS: [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000], BASES: 6, MIN_MOVING: 4, MAX_CONFIGS: 4 };
const isNumD = (d) => d && (d.t === 'num' || d.t === 'int' || (d.t === 'tp' && isNumD(d.of)));
const choiceVals = (d) => (d.t === 'bool' ? [false, true] : d.t === 'lit' ? d.v.slice(0, 4) : null);

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const relEq = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(a), Math.abs(b));

/** מסווג סדרה אחת: אילו תכונות היא מקיימת. */
export function seriesTraits(ys) {
  const n = ys.length;
  const d = []; for (let i = 0; i + 1 < n; i++) d.push(ys[i + 1] - ys[i]);
  const lo = Math.min(...ys); const hi = Math.max(...ys); const R = hi - lo;
  const scale = Math.max(1e-12, Math.abs(hi), Math.abs(lo));
  if (!(R > 1e-9 * scale)) return { moving: false, traits: new Set() };
  const maxD = Math.max(...d.map(Math.abs));
  let maxDD = 0; for (let i = 0; i + 1 < d.length; i++) maxDD = Math.max(maxDD, Math.abs(d[i + 1] - d[i]));
  const smooth = maxDD <= 1.0 * maxD;
  const eps = 1e-9 * scale;
  const traits = new Set();
  const nonInc = d.every((x) => x <= eps);
  const nonDec = d.every((x) => x >= -eps);
  const linear = (xs) => xs.length >= 2 && xs.every((x) => relEq(x, xs[0], 1e-6));
  // דועך: אחרי השיא (שבא ברבע הראשון — "התקפה" קצרה מותרת) לא עולה אף פעם, יורד בפועל, הצעדים קטנים-והולכים
  const top = ys.indexOf(hi);
  if (top <= Math.floor(n / 4)) {
    const tail = d.slice(top);
    const mags = tail.map(Math.abs);
    const tailSmooth = tail.every((x, i) => i === 0 || Math.abs(x - tail[i - 1]) <= maxD);
    if (tail.length >= n / 2 && tail.every((x) => x <= eps) && tailSmooth && mags[0] > eps && mags[mags.length - 1] < 0.5 * mags[0] &&
      mags.every((m, i) => i === 0 || m <= mags[i - 1] * (1 + 1e-6) + eps)) traits.add('decay');
  }
  // קו ישר יורד (מועמד ל"סופר לאחור"; הרצפה נבדקת בהמשך — floorAfter); או קו יורד שכבר פגע ברצפה בתוך הסדרה
  if (nonInc && d[0] < -eps) {
    const k = ys.findIndex((y) => Math.abs(y - lo) <= eps);
    if (k === n - 1 && linear(d)) traits.add('linear-down');
    else if (k >= 3 && ys.slice(k).every((y) => Math.abs(y - lo) <= eps) && linear(d.slice(0, k - 1))) traits.add('countdown');
  }
  if (nonDec && linear(d) && d[0] > eps) traits.add('accumulate-linear');
  if (smooth) {
    let changes = 0; let prev = 0;
    const peaks = []; const troughs = [];
    for (let i = 0; i < d.length; i++) {
      const s = d[i] > eps ? 1 : d[i] < -eps ? -1 : 0;
      if (!s) continue;
      if (prev && s !== prev) { changes++; (prev > 0 ? peaks : troughs).push(ys[i]); }
      prev = s;
    }
    const even = (xs) => xs.length < 2 || Math.max(...xs) - Math.min(...xs) <= 0.25 * R;
    if (changes >= 4 && even(peaks) && even(troughs)) traits.add('oscillate');
  }
  return { moving: true, traits, slope: d[0] };
}

/**
 * בסיסים לכל תצורה של קלטי-הבחירה. ערך-הבסיס של כל קלט נגזר מ-(מפתח, שם-הקלט, מספר-הבסיס) —
 * כך לשני אחים עם קלט באותו שם (t) יש אותו t, ואפשר להשוות את הסדרות שלהם נקודה-נקודה.
 */
function basesFor(sig, key, seed, B) {
  const choice = sig.takes.map((t, k) => [k, choiceVals(t.d)]).filter(([, v]) => v);
  let configs = [{}];
  for (const [k, vals] of choice) configs = configs.flatMap((c) => vals.map((v) => ({ ...c, [k]: v })));
  return configs.slice(0, MOTION.MAX_CONFIGS).map((cfg) => {
    const bases = [];
    for (let i = 0; i < MOTION.BASES; i++) {
      const Bc = { ...B, tpick: new Map() };
      bases.push(sig.takes.map((t, k) => { if (k in cfg) return cfg[k]; const v = gen(t.d, B.rng((fnvHash(key + '|' + t.name + '|' + i) ^ seed) >>> 0), Bc, 0, hintOf(t.name)); return isNumD(t.d) && typeof v === 'number' ? Math.abs(v) : v; }));
    }
    return { cfg, bases, name: Object.entries(cfg).map(([i, v]) => `${sig.takes[i].name}=${JSON.stringify(v)}`).join(',') };
  });
}

/** קו יורד ⇒ האם הוא נעצר ברצפה: קופצים רחוק (x0 + δ·2^j) עד ששלוש קפיצות רצופות נותנות אותו ערך, נמוך מההתחלה ומעל ההמשך-הישר. */
function floorAfter(call, args, k, step, ys) {
  const slope = (ys[ys.length - 1] - ys[0]) / ((ys.length - 1) * step);
  const at = (x) => { const a = args.slice(); a[k] = x; const r = call(a); return r && 'v' in r && fin(r.v) ? r.v : null; };
  let prev = null; let same = 0;
  for (let j = 6; j <= 52; j++) {
    const x = args[k] + step * 2 ** j;
    const v = at(x);
    if (v === null) return false;
    if (prev !== null && relEq(v, prev, 1e-12)) { same++; if (same >= 2) return v < ys[0] && v > ys[0] + slope * (x - args[k]) + 1e-9 * Math.abs(v); } else same = 0;
    prev = v;
  }
  return false;
}

/** סריקה של קלט k מבסיס: x0 + i·δ. */
function sweep(call, args, k, step) {
  const ys = [];
  const x0 = typeof args[k] === 'number' && Number.isFinite(args[k]) ? args[k] : 0;
  for (let i = 0; i < MOTION.N; i++) {
    const a = args.slice(); a[k] = x0 + i * step;
    const res = call(a);
    if (!res || 'err' in res || res.async || !fin(res.v)) return null;
    ys.push(res.v);
  }
  return ys;
}

/**
 * התכונות של חלק אחד: [{id, on, holds, step, config?}] + הסדרות (לבדיקת-הזוגות של orbit).
 * call(args) ⇒ {v}|{err}; sig = {takes:[{name,d}]}.
 */
export function motionOf({ sig, call, key, seed, B }) {
  const nums = sig.takes.map((t, k) => [k, t]).filter(([, t]) => isNumD(t.d));
  if (!nums.length) return { motion: [], series: new Map() };
  const groups = basesFor(sig, key, seed, B);
  const out = []; const series = new Map();
  for (const [k, t] of nums) {
    let found = null;
    for (const step of MOTION.STEPS) {
      for (const g of groups) {
        const res = g.bases.map((a) => {
          // שני עוגנים: מערך-הבסיס, ומאפס ("מההתחלה") — זמן-מאז-ההתחלה מתחיל ב-0
          for (const from of [a[k], 0]) {
            const b = a.slice(); b[k] = from;
            const ys = sweep(call, b, k, step);
            if (!ys) continue;
            const st = seriesTraits(ys);
            if (st.traits.has('linear-down')) { const fl = floorAfter(call, b, k, step, ys); if (fl) st.traits.add('countdown'); }
            if (st.moving || from === 0) return { ys, ...st };
          }
          return null;
        });
        // בסיס שהסריקה שלו נופלת (NaN, שגיאה) לא נספר; צריך לפחות 4 בסיסים שזזים
        const moving = res.filter((x) => x && x.moving);
        if (moving.length < MOTION.MIN_MOVING) continue;
        const all = ['decay', 'countdown', 'oscillate', 'accumulate-linear'].filter((tr) => moving.every((x) => x.traits.has(tr)));
        const traits = all.map((tr) => {
          if (tr !== 'accumulate-linear') return tr;
          // צובר: הקצב (השיפוע) תלוי בקלט אחר — לא אותו שיפוע בכל הבסיסים
          const slopes = new Set(moving.map((x) => Number(x.slope.toPrecision(6))));
          return slopes.size >= 2 ? 'accumulate' : null;
        }).filter(Boolean);
        if (!traits.length) continue;
        if (!found) {
          found = { traits, step, holds: `${moving.length}/${moving.length}`, config: g.name || undefined, still: res.length - moving.length };
          if (res.some((x) => !x)) found.invalid = res.filter((x) => !x).length;
        }
        // הסדרות של כל צעד שבו יש תנודה נשמרות — כדי שאחים שנמצאו בצעדים שונים יושוו באותו צעד (orbit)
        if (traits.includes('oscillate')) series.set(`${t.name}@${step}@${g.name}`, res.map((x) => (x ? x.ys : null)));
        if (!found.traits.includes('oscillate')) break;
      }
      if (found && !found.traits.includes('oscillate')) break;
    }
    if (found) for (const tr of found.traits) out.push({ id: tr, on: t.name, holds: found.holds, step: found.step, ...(found.config ? { config: found.config } : {}), ...(found.still ? { still: found.still } : {}), ...(found.invalid ? { invalid: found.invalid } : {}) });
  }
  return { motion: out, series };
}

/** orbit: שני אחים שמתנדנדים על אותה סריקה ⇒ (x,y) על אליפסה בכל נקודה ובכל בסיס. */
export function orbitPair(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length) return false;
  let n = 0;
  for (let b = 0; b < xs.length; b++) {
    const X = xs[b]; const Y = ys[b];
    if (!X || !Y) continue;
    const cx = (Math.max(...X) + Math.min(...X)) / 2; const ax = (Math.max(...X) - Math.min(...X)) / 2;
    const cy = (Math.max(...Y) + Math.min(...Y)) / 2; const ay = (Math.max(...Y) - Math.min(...Y)) / 2;
    if (!(ax > 0) || !(ay > 0)) continue;
    for (let i = 0; i < X.length; i++) {
      const rr = ((X[i] - cx) / ax) ** 2 + ((Y[i] - cy) / ay) ** 2;
      if (rr < 0.8 || rr > 1.25) return false;
    }
    n++;
  }
  return n >= MOTION.MIN_MOVING ? n : false;
}
