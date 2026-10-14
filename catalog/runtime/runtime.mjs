/**
 * ▶️ זמן-הריצה של המכונה (PRODUCT, 14.10.2026) — הרכבה ⇒ פונקציות שאפשר לקרוא להן.
 *
 * המכונה עוצרת בתוכנית מוכחת: לכל צורך — חלק אחד, חלק פנימי, או שילוב (שרשרת · זוג · אותו-חלק-על-החומר · גרף).
 * כאן התוכנית נהיית קוד: `makeRuntime(assembly, parts)` מחזיר לכל צורך פונקציה שמריצה **את החלק המוכח עצמו**
 * (או את השילוב, באותו חיבור שהמאמת בדק — combine.mjs: composeChain / compose('pair') / composeOn / composeGraph).
 * בלי שורת-חישוב אחת משלו: רק מעביר פלט לקלט, כמו המכונה.
 *
 * טהור: בלי DOM, בלי node, בלי שעון — רץ בדפדפן וב-node. `parts` = מפתח-חלק ⇒ הפונקציה (מהחבילה parts.bundle.mjs
 * בדפדפן, או מהמודולים עצמם ב-node). `assembly` = מה ש-catalog/runtime/manifest.mjs כותב מההרכבה של המכונה.
 */
import { runGraph } from '../combiner/graph.mjs';

/** קריאה לחלק: {v} או {err} — כמו callerFor של ארגז-החול (שגיאה לא זורקת החוצה באמצע שרשרת). */
function call(fn, args) {
  try {
    return { v: fn(...args) };
  } catch (err) {
    return { err: String((err && err.message) || err) };
  }
}

/** הפונקציה של צעד: חלק מהחבילה לפי המפתח שלו. חסר ⇒ שגיאה ברורה מיד (לא באמצע ריצה). */
function partFn(parts, step) {
  const fn = parts[step.key];
  if (typeof fn !== 'function') throw new Error('חלק חסר בחבילה: ' + step.key + ' (' + step.id + ')');
  return fn;
}

/**
 * צורך אחד ⇒ פונקציה. אותו חיבור כמו מכונת-השילוב:
 *   single / on — החלק עצמו (ב-on החומר נכנס לקלט הפתוח — אין המרה, רק הקלט עצמו)
 *   chain       — C(a…, b…, c…) = P3(P2(P1(a…), b…), c…)        (הקלטים הנוספים של כל שלב לפי הסדר)
 *   pair        — C(x, y, k…, r…) = P2(P1(x, k…), P1(y, k…), r…)   (`at` = המקום של "הדבר" בקלטים של P1)
 *   graph       — כל צומת = חלק; החוטים רק מעבירים/בוחרים שדה (graph.mjs)
 */
export function needFunction(need, parts) {
  const fns = need.steps.map((s) => partFn(parts, s));
  const form = need.form;
  if (form === 'single' || form === 'on') {
    const f = fns[0];
    return (...args) => f(...args);
  }
  if (form === 'chain') {
    const ar = need.steps.map((s) => s.arity);
    return (...args) => {
      let at = ar[0];
      let r = call(fns[0], args.slice(0, at));
      for (let k = 1; k < fns.length && !('err' in r); k++) {
        const extra = ar[k] - 1;
        r = call(fns[k], [r.v, ...args.slice(at, at + extra)]);
        at += extra;
      }
      if ('err' in r) throw new Error(r.err);
      return r.v;
    };
  }
  if (form === 'pair') {
    const n1 = need.steps[0].arity;
    const at = need.combo.at ?? 0;
    const with1 = (x, k) => { const a = k.slice(); a.splice(at, 0, x); return a; };
    return (...args) => {
      const k = args.slice(2, 1 + n1);
      const a = call(fns[0], with1(args[0], k)); if ('err' in a) throw new Error(a.err);
      const b = call(fns[0], with1(args[1], k)); if ('err' in b) throw new Error(b.err);
      const c = call(fns[1], [a.v, b.v, ...args.slice(1 + n1)]); if ('err' in c) throw new Error(c.err);
      return c.v;
    };
  }
  if (form === 'graph') {
    const g = need.combo.graph;
    const byPart = new Map(need.steps.map((s, k) => [s.id, fns[k]]));
    const nodeFns = g.nodes.map((n) => byPart.get(n.part));
    return (...args) => {
      const r = runGraph(g, args, (k, a) => call(nodeFns[k], a));
      if ('err' in r) throw new Error(r.err);
      return r.v;
    };
  }
  throw new Error('צורה לא מוכרת: ' + form);
}

/** כל הצרכים ⇒ {מזהה-צורך: פונקציה}. צורך בלי חלק (🔎/⛏️) ⇒ לא מופיע — אין פונקציה מומצאת. */
export function makeRuntime(assembly, parts) {
  const out = {};
  for (const need of assembly.needs) if (need.steps?.length) out[need.id] = needFunction(need, parts);
  return out;
}

/** "נמצא ב:" לצורך — הפרויקטים והקבצים שהחלקים שלו באו מהם (לשבב בכל לוח במסך). */
export function whereChip(need) {
  return '🧩 נמצא ב: ' + need.steps.map((s) => s.project + ' · ' + s.name).join(' ⇒ ');
}
