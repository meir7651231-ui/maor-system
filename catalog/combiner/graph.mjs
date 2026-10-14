/**
 * 🕸️ צורת `graph` של מכונת-השילוב (MACHINE-V2, 14.10.2026) — כמה חלקים מוכחים, מחוברים לפי מתכון.
 *
 * `chain` מעביר פלט של חלק אחד לקלט הראשון של הבא. יש פעולות שצריכות **אותו קלט בכמה מקומות** (קו-הרוחב נכנס גם לזמני-היום
 * וגם לסיבוב) — לכן המתכון (catalog/combiner/verb-recipes.json) מתאר צמתים: לכל צומת חלק מוכח אחד בשמו המלא, ולכל קלט שלו
 * חוט: `$קלט` / `$קלט.שדה` (מהבקשה) · `@צומת` / `@צומת.שדה` (מפלט של צומת קודם) · מספר (קבוע מוצהר) · אובייקט (רשומה שמורכבת מחוטים).
 * החוטים לא מחשבים כלום — רק מעבירים ובוחרים שדה. כל החישוב נעשה בחלקים; הקבועים מוצהרים במתכון עם הסבר (`consts`).
 * טהור: הקריאה לחלק מוזרקת (`callNode`), בלי שעון ובלי I/O. רץ ב-node ובדפדפן.
 *
 * 🔁 PRODUCT-V2 (14.10.2026) — **חיווט בלבד, בלי חישוב** (נבנה חדש; מסומן במתכון ובדוח):
 *   · צומת-לולאה `{id, loop: {over, init, item, index?, state, nodes, next, emit?, until?, max?}}` — מריץ את אותם צמתים
 *     (חלקים מוכחים) פעם לכל פריט ב-`over`, ומעביר מצב: `$<state>` = המצב, `$<item>` = הפריט, `$<index>` = המקום שלו.
 *     הפלט: `{state, emits}` — המצב בסוף, ומה ש-`emit` אסף בכל סיבוב (כמו Array.reduce/scan; אין בקטלוג חלק-נתונים שמקבל
 *     פונקציה, ולכן החזרה היא צורת-חיבור, כמו chain). `until: "stable"` — חוזר על כל הסבב עד שסבב שלם לא שינה את המצב
 *     (השוואת-JSON — בקרה בלבד), עד `max` סבבים.
 *   · חוטים שמעבירים ולא מחשבים: `{"$slice": [רשימה, מ, עד?]}` (חתיכה — כמו בחירת-שדה, רק לטווח) ·
 *     `{"$cat": [רשימה, רשימה, …]}` או `{"$cat": רשימה-של-רשימות}` (שרשור). אין חיבור/השוואה/תנאי בחוט.
 *   · `out` יכול להיות חוט (`@opt.state.r`), לא רק שם-צומת.
 */

const REF = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/;
const strCache = new Map();
/** חוט-מחרוזת ⇒ {at, name, path} (פעם אחת לכל מחרוזת — הריצה של לולאות עוברת על אותם חוטים אלפי פעמים). */
function parseRef(w) {
  let p = strCache.get(w);
  if (!p) {
    const m = REF.exec(w);
    if (!m) throw new Error('חוט לא מובן: ' + w);
    p = { at: m[1], name: m[2], path: m[3].split('.').filter(Boolean) };
    strCache.set(w, p);
  }
  return p;
}
const isOp = (w) => w !== null && typeof w === 'object' && !Array.isArray(w) && ('$slice' in w || '$cat' in w) && Object.keys(w).length === 1;

/** חוט ⇒ ערך. זורק אם החוט מצביע על משהו שאין (צומת לפני שרץ, שדה חסר). */
export function wire(w, inputs, vals) {
  return compiled(w)(inputs, vals);
}

const objCache = new WeakMap();
/** חוט ⇒ פונקציה (פעם אחת לכל חוט; אותה משמעות בדיוק כמו קריאת-החוט — רק בלי לפרש אותו מחדש בכל סיבוב של לולאה). */
function compiled(w) {
  if (typeof w === 'number' || typeof w === 'boolean' || w === null) return () => w;
  if (typeof w === 'string') {
    let f = strCache.get('\0' + w);
    if (!f) {
      const { at, name, path } = parseRef(w);
      f = (inputs, vals) => {
        const base = at === '$' ? inputs[name] : vals[name];
        if (base === undefined) throw new Error('אין ' + w);
        let v = base;
        for (const k of path) {
          if (v === null || typeof v !== 'object' || !(k in v)) throw new Error('אין שדה ' + k + ' ב-' + w);
          v = v[k];
        }
        return v;
      };
      strCache.set('\0' + w, f);
    }
    return f;
  }
  if (typeof w !== 'object') throw new Error('חוט לא מובן');
  let f = objCache.get(w);
  if (f) return f;
  if (Array.isArray(w)) {
    const fs = w.map(compiled);
    f = (i, v) => fs.map((g) => g(i, v));
  } else if (isOp(w) && '$slice' in w) {
    const [l, a, b] = w.$slice.map((x) => (x === undefined ? undefined : compiled(x)));
    f = (i, v) => {
      const list = l(i, v);
      if (!Array.isArray(list)) throw new Error('$slice על משהו שאינו רשימה');
      return b === undefined ? list.slice(a(i, v)) : list.slice(a(i, v), b(i, v));
    };
  } else if (isOp(w)) {
    const many = Array.isArray(w.$cat) ? w.$cat.map(compiled) : null;
    const one = many ? null : compiled(w.$cat);
    f = (i, v) => {
      const parts = many ? many.map((g) => g(i, v)) : one(i, v);
      if (!Array.isArray(parts) || !parts.every(Array.isArray)) throw new Error('$cat על משהו שאינו רשימות');
      return [].concat(...parts);
    };
  } else {
    const ks = Object.keys(w); const fs = ks.map((k) => compiled(w[k]));
    f = (i, v) => { const o = {}; for (let k = 0; k < ks.length; k++) o[ks[k]] = fs[k](i, v); return o; };
  }
  objCache.set(w, f);
  return f;
}

/** אילו צמתים/קלטים חוט מצביע עליהם (לבדיקת-מבנה: כל צומת מצביע רק אחורה, כל קלט קיים). */
export function refsOf(w, out = []) {
  if (typeof w === 'string') { const m = /^([$@])([\w-]+)/.exec(w); if (m) out.push(m[1] + m[2]); }
  else if (Array.isArray(w)) w.forEach((x) => refsOf(x, out));
  else if (w && typeof w === 'object') Object.values(w).forEach((x) => refsOf(x, out));
  return out;
}

/** כל צמתי-החלקים של הגרף, כולל אלה שבתוך לולאות — לפי הסדר (זה המספור של callNode). */
export function graphNodes(g) {
  const out = [];
  const walk = (nodes) => { for (const n of nodes) if (n.loop) walk(n.loop.nodes); else out.push(n); };
  walk(g.nodes || []);
  return out;
}

/** בדיקת-מבנה של מתכון-גרף: שמות ייחודיים, חוטים רק אחורה, הפלט הוא צומת (או חוט לצומת). מחזיר null או סיבה. */
export function graphProblem(g) {
  if (!Array.isArray(g.inputs) || !Array.isArray(g.nodes) || !g.nodes.length) return 'חסרים inputs/nodes';
  const names = new Set(g.inputs);
  const check = (w, ins, seen, where) => {
    for (const r of refsOf(w)) {
      const name = r.slice(1);
      if (r[0] === '$' && !ins.has(name)) return where + ': אין קלט ' + name;
      if (r[0] === '@' && !seen.has(name)) return where + ': מצביע קדימה על ' + name;
    }
    return null;
  };
  const scope = (nodes, ins, seen) => {
    for (const n of nodes) {
      if (!n.id || names.has(n.id)) return n.id ? 'שם כפול: ' + n.id : 'צומת בלי id';
      names.add(n.id);
      if (n.loop) {
        const L = n.loop;
        if (!Array.isArray(L.nodes) || !L.item || !L.state || L.next === undefined) return n.id + ': לולאה חסרה nodes/item/state/next';
        if (L.until !== undefined && L.until !== 'stable') return n.id + ': until לא מוכר';
        const inner = new Set([...ins, L.item, L.state, ...(L.index ? [L.index] : [])]);
        const p = check(L.over, new Set([...ins, L.state]), seen, n.id) || check(L.init, ins, seen, n.id);
        if (p) return p;
        const seenIn = new Set(seen);
        const q = scope(L.nodes, inner, seenIn);
        if (q) return q;
        const r = check(L.next, inner, seenIn, n.id) || (L.emit !== undefined ? check(L.emit, inner, seenIn, n.id) : null);
        if (r) return r;
      } else {
        if (!n.part || !Array.isArray(n.args)) return 'צומת חסר id/part/args';
        const p = check(n.args, ins, seen, n.id);
        if (p) return p;
      }
      seen.add(n.id);
    }
    return null;
  };
  const seen = new Set();
  const prob = scope(g.nodes, new Set(g.inputs), seen);
  if (prob) return prob;
  if (typeof g.out !== 'string') return 'אין פלט';
  if (g.out.startsWith('@')) { const p = check(g.out, new Set(g.inputs), seen, 'out'); if (p) return 'הפלט: ' + p; }
  else if (!seen.has(g.out)) return 'הפלט אינו צומת: ' + g.out;
  return null;
}

const bad = (v) => v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v));
const planCache = new WeakMap();
/**
 * הגרף ⇒ תוכנית-ריצה (פעם אחת לכל גרף): כל צומת עם החוט המהודר שלו ומספר-החלק שלו. אותה משמעות כמו לקרוא את החוטים
 * בכל פעם — רק בלי לפרש אותם שוב באלפי הסיבובים של לולאה (2-opt על 400 משפחות).
 */
function planOf(g) {
  let plan = planCache.get(g);
  if (plan) return plan;
  let k = 0;
  const comp = (nodes) => nodes.map((n) => {
    if (!n.loop) return { id: n.id, k: k++, args: compiled(n.args) };
    const L = n.loop;
    return {
      id: n.id, loop: true, state: L.state, item: L.item, index: L.index || null,
      over: compiled(L.over), init: compiled(L.init), next: compiled(L.next), emit: L.emit === undefined ? null : compiled(L.emit),
      passes: L.until === 'stable' ? (Number(L.max) >= 1 ? Number(L.max) : 50) : 1, stable: L.until === 'stable',
      body: comp(L.nodes),
    };
  });
  plan = { nodes: comp(g.nodes), out: g.out.startsWith('@') ? compiled(g.out) : null };
  planCache.set(g, plan);
  return plan;
}

/** מריץ רשימת-צמתים בסביבה (inputs, vals). מחזיר null, או {err}/{async} מהצומת הראשון שנכשל. */
function runNodes(nodes, inputs, vals, callNode) {
  for (let q = 0; q < nodes.length; q++) {
    const n = nodes[q];
    if (n.loop) {
      const r = runLoop(n, inputs, vals, callNode);
      if (r.async) return r;
      if ('err' in r) return { err: n.id + ': ' + r.err };
      vals[n.id] = r.v;
      continue;
    }
    let a;
    try { a = n.args(inputs, vals); } catch (e) { return { err: n.id + ': ' + String(e?.message || e) }; }
    const r = callNode(n.k, a);
    if (!r || r.async) return { async: true };
    if ('err' in r) return { err: n.id + ': ' + r.err };
    if (bad(r.v)) return { err: n.id + ': אין ערך' };
    vals[n.id] = r.v;
  }
  return null;
}

/** לולאה: אותם צמתים לכל פריט, המצב עובר הלאה. until=stable ⇒ עוד סבב כל עוד סבב שלם שינה את המצב (עד max). */
function runLoop(n, inputs, vals, callNode) {
  let state;
  try { state = n.init(inputs, vals); } catch (e) { return { err: String(e?.message || e) }; }
  // סביבה אחת לכל הרצה של הלולאה: יורשת מהסביבה שבחוץ (קלטים + משתני-לולאות חיצוניות); בכל סיבוב רק המצב/הפריט/המקום מתחלפים.
  // הצמתים שבפנים רצים כולם בכל סיבוב, וכל חוט מצביע רק אחורה — לכן ערך מסיבוב קודם לא נקרא לעולם.
  const ins = Object.create(inputs);
  const inner = Object.create(vals);
  let emits = [];
  for (let pass = 0; pass < n.passes; pass++) {
    ins[n.state] = state;
    let over;
    try { over = n.over(ins, vals); } catch (e) { return { err: String(e?.message || e) }; }
    if (!Array.isArray(over)) return { err: 'over אינו רשימה' };
    const before = n.stable ? JSON.stringify(state) : null;
    emits = [];
    for (let k = 0; k < over.length; k++) {
      ins[n.state] = state; ins[n.item] = over[k];
      if (n.index) ins[n.index] = k;
      const r = runNodes(n.body, ins, inner, callNode);
      if (r) return r;
      try {
        if (n.emit) emits.push(n.emit(ins, inner));
        state = n.next(ins, inner);
      } catch (e) { return { err: String(e?.message || e) }; }
    }
    if (before !== null && JSON.stringify(state) === before) break;
  }
  return { v: { state, emits } };
}

/**
 * מריץ את הגרף. callNode(k, args) ⇒ {v} | {err} | {async} (כמו callerFor של ארגז-החול); k = המספר ב-graphNodes.
 * מחזיר {v} — הפלט (`out`: שם-צומת או חוט) — או את השגיאה הראשונה, עם שם הצומת.
 */
export function runGraph(g, args, callNode) {
  const plan = planOf(g);
  const inputs = Object.fromEntries(g.inputs.map((n, k) => [n, args[k]]));
  const vals = {};
  const r = runNodes(plan.nodes, inputs, vals, callNode);
  if (r) return r;
  if (plan.out) {
    try { return { v: plan.out(inputs, vals) }; } catch (e) { return { err: 'out: ' + String(e?.message || e) }; }
  }
  return { v: vals[g.out] };
}

/** החלקים של הגרף לפי סדר ההופעה, בלי כפילויות (לתצוגה: כל חלק פעם אחת עם "נמצא ב:"). */
export const graphParts = (g) => [...new Set(graphNodes(g).map((n) => n.part))];
/** האם בגרף יש לולאה (חיווט-חוזר — נבנה חדש ב-PRODUCT-V2; מוצג במפורש). */
export const graphLoops = (g) => { const out = []; const walk = (ns) => { for (const n of ns) if (n.loop) { out.push(n.id); walk(n.loop.nodes); } }; walk(g.nodes || []); return out; };
