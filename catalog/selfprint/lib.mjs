/**
 * 🧭 מנוע-השרטוטים-העצמי · הלב הטהור (SELFPRINT, 15.10.2026) — "המנוע צריך לבנות לעצמו שרטוטים".
 *
 * שרטוט = מתכון-גרף רגיל של combiner/graph.mjs שחלק מהצמתים בו **חורים**: ‎{id, part: '□<v>', args}‎ (v = משתנה-החור;
 * כל המקומות עם אותו v ממולאים באותו דבר). כאן רק דברים טהורים (בלי ארגז-חול, בלי דיסק, בלי שעון):
 *   · עץ-של-דבר: ‎ref‎ (דבר על המדף) · ‎hole‎ · ‎form‎ (צורה של הצמיחה: chain/pair/map/mapc/fold/fix) · ‎skel‎ (שלד-עם-חורים).
 *   · גרף מעץ (treeGraph), מילוי חורים בגרף (fillGraph — הטמעה עם קבועים), סוגי-חורים (typings), סדר-מילוי (layered).
 *   · שרטוט מהצלחה (derive): מחליפים רכיב אחד בעץ של דבר-שהצליח בחור מאותה חתימה.
 */
import * as G from '../grow/lib.mjs';

export const SEMS = G.SEMS;
export const isHole = (part) => typeof part === 'string' && part.startsWith('□');
export const holeVar = (part) => Number(part.slice(1));
const IN = ['i0', 'i1'];
export const sigKey = (sig, out) => sig.join(',') + '>' + out;

/** גרף של חור בודד: ‎□k(i0, i1?)‎. */
export const holeGraph = (k, arity) => ({ inputs: IN.slice(0, arity), nodes: [{ id: 'n', part: '□' + k, args: IN.slice(0, arity).map((n) => '$' + n) }], out: 'n' });

/* ═══════════════ הטמעה עם קבועים ═══════════════ */

const REF = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/;
/** כמו grow/lib.mjs › rw, ועוד: קלט שמחובר לקבוע (מספר) ⇒ המספר עצמו. */
function rw(w, ins, loc, P) {
  if (typeof w === 'string') {
    const m = REF.exec(w);
    if (!m) return w;
    if (m[1] === '@') return '@' + P + m[2] + m[3];
    if (m[2] in ins) { const t = ins[m[2]]; if (typeof t === 'number') { if (m[3]) throw new Error('שדה של קבוע: ' + w); return t; } return t + m[3]; }
    if (loc.has(m[2])) return '$' + P + m[2] + m[3];
    throw new Error('חוט לא מוכר בהטמעה: ' + w);
  }
  if (Array.isArray(w)) return w.map((x) => rw(x, ins, loc, P));
  if (w && typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, rw(v, ins, loc, P)]));
  return w;
}
function rwNodes(nodes, ins, loc, P) {
  return nodes.map((n) => {
    if (!n.loop) return { id: P + n.id, part: n.part, args: rw(n.args, ins, loc, P) };
    const L = n.loop;
    const inner = new Set([...loc, L.item, L.state, ...(L.index ? [L.index] : [])]);
    const out = { id: P + n.id, loop: { over: rw(L.over, ins, new Set([...loc, L.state]), P), init: rw(L.init, ins, loc, P), item: P + L.item, state: P + L.state, nodes: rwNodes(L.nodes, ins, inner, P), next: rw(L.next, ins, inner, P) } };
    if (L.index) out.loop.index = P + L.index;
    if (L.emit !== undefined) out.loop.emit = rw(L.emit, ins, inner, P);
    if (L.until) { out.loop.until = L.until; out.loop.max = L.max; }
    return out;
  });
}
export function inlineK(g, argWires, P) {
  const ins = Object.fromEntries(g.inputs.map((n, k) => [n, argWires[k]]));
  const nodes = rwNodes(g.nodes, ins, new Set(), P);
  const out = g.out.startsWith('@') ? rw(g.out, ins, new Set(), P) : '@' + P + g.out;
  return { nodes, out };
}
/** חוטים ‎@X…‎ שהם כינוי (חור שמולא) ⇒ הפלט של מה שמילא אותו. */
function alias(w, A) {
  if (typeof w === 'string') { const m = REF.exec(w); if (m && m[1] === '@' && A.has(m[2])) return A.get(m[2]) + m[3]; return w; }
  if (Array.isArray(w)) return w.map((x) => alias(x, A));
  if (w && typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, alias(v, A)]));
  return w;
}
/**
 * מילוי: כל צומת ‎□v‎ ⇐ הגרף fill[v], מוטמע במקום (עם הקלטים של הצומת, גם קבועים). חור שלא ממולא נשאר חור.
 * הפלט — גרף רגיל (אם כל החורים מולאו).
 */
export function fillGraph(g, fill) {
  const A = new Map();
  const walk = (nodes) => {
    const out = [];
    for (const n of nodes) {
      if (n.loop) {
        const L = n.loop;
        const inner = walk(L.nodes);
        const nl = { ...L, over: alias(L.over, A), init: alias(L.init, A), nodes: inner, next: alias(L.next, A) };
        if (L.emit !== undefined) nl.emit = alias(L.emit, A);
        out.push({ id: n.id, loop: nl });
        continue;
      }
      const args = alias(n.args, A);
      const f = isHole(n.part) ? fill[holeVar(n.part)] : null;
      if (!f) { out.push({ id: n.id, part: n.part, args }); continue; }
      const x = inlineK(f, args, n.id + '_');
      out.push(...x.nodes);
      A.set(n.id, x.out);
    }
    return out;
  };
  const nodes = walk(g.nodes);
  const o = g.out.startsWith('@') ? alias(g.out, A) : A.has(g.out) ? A.get(g.out) : g.out;
  return { inputs: g.inputs, nodes, out: o };
}
/** כל צמתי-החורים (גם בלולאות). */
export const holeNodesOf = (g) => { const out = []; const walk = (ns) => { for (const n of ns) if (n.loop) walk(n.loop.nodes); else if (isHole(n.part)) out.push(n); }; walk(g.nodes); return out; };
export const holeVars = (g) => [...new Set(holeNodesOf(g).map((n) => holeVar(n.part)))].sort((a, b) => a - b);

/* ═══════════════ עצים ═══════════════ */

/**
 * עץ ⇒ גרף. ‎ref‎ ⇒ הגרף של הדבר (things.get) · ‎hole‎ ⇒ holeGraph · ‎form‎ ⇒ grow/lib › FORMS · ‎skel‎ ⇒ fillGraph(השלד, הילדים לפי v).
 * כל צומת נושא sig/out (מה שצריך לצורות).
 */
export function treeGraph(t, things) {
  if (t.k === 'ref') return things.get(t.id).graph;
  if (t.k === 'hole') return holeGraph(t.v, t.sig.length);
  const kid = (c) => ({ sig: c.sig, out: c.out, graph: treeGraph(c, things) });
  if (t.k === 'form') { const f = G.FORMS[t.form]; const ks = t.kids.map(kid); return f.two ? f.graph(ks[0], ks[1]) : f.graph(ks[0]); }
  if (t.k === 'skel') return fillGraph(t.graph, t.kids.map((c) => treeGraph(c, things)));
  throw new Error('עץ לא מוכר: ' + t.k);
}
/** העץ של דבר, פרוס עד depth: דבר מהצמיחה ⇒ form של ילדיו; דבר-משרטוט ⇒ העץ השמור שלו. */
export function treeOf(t, things, depth) {
  const node = (x) => ({ k: 'ref', id: x.id, sig: x.sig, out: x.out });
  if (depth <= 0 || t.form === 'part') return node(t);
  if (t.tree) return expandRefs(t.tree, things, depth);
  return { k: 'form', form: t.form, id: t.id, sig: t.sig, out: t.out, kids: t.of.map((id) => treeOf(things.get(id), things, depth - 1)) };
}
function expandRefs(tree, things, depth) {
  if (tree.k === 'ref') return depth > 0 ? treeOf(things.get(tree.id), things, depth) : tree;
  if (tree.k === 'hole') return tree;
  return { ...tree, kids: tree.kids.map((c) => expandRefs(c, things, depth - 1)) };
}
/** מקומות בעץ (לא השורש) שאפשר להחליף בחור: כל צומת שמייצג דבר (יש לו id). path = אינדקסים. */
export function positions(tree, path = [], out = []) {
  if (path.length && tree.id) out.push(path);
  for (const [k, c] of (tree.kids || []).entries()) positions(c, [...path, k], out);
  return out;
}
const at = (tree, path) => path.reduce((t, k) => t.kids[k], tree);
/** העץ עם חורים במקומות; v לפי הסדר. */
export function withHoles(tree, paths) {
  const rec = (t, p) => {
    const i = paths.findIndex((q) => q.length === p.length && q.every((x, j) => x === p[j]));
    if (i >= 0) return { k: 'hole', v: i, sig: t.sig, out: t.out };
    if (!t.kids) return t;
    return { ...t, kids: t.kids.map((c, k) => rec(c, [...p, k])) };
  };
  return rec(tree, []);
}
/** הרכיבים הקונקרטיים שנשארו בעץ (ids של ref/form/skel עם id) — בלי השורש. */
export function concrete(tree, out = []) {
  for (const c of tree.kids || []) { if (c.k === 'hole') continue; if (c.id) out.push(c.id); if (c.k !== 'ref') concrete(c, out); }
  return out;
}
/** האם בעץ נשאר משהו קונקרטי (אחרת השרטוט = צורה ריקה — כמו הצורות של הצמיחה עצמה). */
export const hasConcrete = (tree) => (tree.kids || []).some((c) => c.k !== 'hole' && (c.k === 'ref' || hasConcrete(c) || c.k === 'form'));
/** עץ-שרטוט + מילוי (v ⇒ ref) ⇒ עץ-דבר. */
export function fillTree(tree, refs) {
  if (tree.k === 'hole') return refs[tree.v];
  if (!tree.kids) return tree;
  return { ...tree, kids: tree.kids.map((c) => fillTree(c, refs)) };
}
/** החורים של עץ-שרטוט: v ⇒ {sig, out}. */
export function treeHoles(tree, out = []) {
  if (tree.k === 'hole') out[tree.v] = { sig: tree.sig, out: tree.out };
  for (const c of tree.kids || []) treeHoles(c, out);
  return out;
}

/**
 * שרטוטים מהצלחה (מקור 1): דבר-שהצליח (שם אמיתי) ⇒ לכל רכיב בעץ שלו (עד עומק 2 מתחת לשורש) — אותו עץ, והרכיב
 * הזה חור מאותה חתימה. ‎maxHoles=2‎ ⇒ גם זוגות-רכיבים. שרטוט שלא נשאר בו שום דבר קונקרטי — לא (זו רק צורה).
 */
export function derive(thing, things, { depth = 2, maxHoles = 1 } = {}) {
  const tree = treeOf(thing, things, depth);
  const ps = positions(tree);
  const out = [];
  const add = (paths) => { const t = withHoles(tree, paths); if (hasConcrete(t)) out.push({ tree: t, holed: paths.map((p) => at(tree, p).id) }); };
  for (const p of ps) add([p]);
  if (maxHoles >= 2) for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const a = ps[i]; const b = ps[j];
    if (a.length < b.length && a.every((x, k) => x === b[k])) continue; // אחד בתוך השני
    add([a, b]);
  }
  return out;
}

/* ═══════════════ סוגים ═══════════════ */

/** תוויות-אופרטור מהקוד ⇒ הסוג שהן מחייבות (null = פתוח). */
export const OP_SIG = (label, n) => {
  if (/^([-+*/%]|\*\*|neg|Math\.\w+)$/.test(label)) return { args: Array(n).fill(['num']), out: ['num'] };
  if (label === '.length') return { args: [['nums', 'pts']], out: ['num'] };
  return null;
};
/**
 * כל ההשמות של סוגים לשלד (קלטים + פלט של כל משתנה-חור) שעקביות: אותו v ⇒ אותה חתימה בכל מקום; אופרטור ⇒ הסוג שלו;
 * לולאה ⇒ על רשימה, הפריט = האיבר, המצב = ההתחלה = הבא. available(sigKey) ⇒ יש דברים בחתימה הזו.
 * מחזיר [{ins:[...], holes: [{sig, out}], out}] בסדר קבוע.
 */
export function typings(skel, labelsList, available) {
  const g = skel.graph; const nIn = g.inputs.length;
  const vs = holeVars(g); const nV = vs.length ? Math.max(...vs) + 1 : 0;
  const res = [];
  const total = nIn + nV;
  const idx = Array(total).fill(0);
  for (;;) {
    const ins = idx.slice(0, nIn).map((k) => SEMS[k]); const vout = idx.slice(nIn).map((k) => SEMS[k]);
    const t = check(g, ins, vout, labelsList, available);
    if (t) res.push(t);
    let i = total - 1; while (i >= 0 && ++idx[i] === SEMS.length) { idx[i] = 0; i--; }
    if (i < 0) break;
  }
  return res;
}
function check(g, ins, vout, labelsList, available) {
  const env = new Map(g.inputs.map((n, k) => [n, ins[k]]));
  const sigs = [];
  const semOf = (w, loc) => {
    if (typeof w === 'number') return 'num';
    const m = REF.exec(w); if (!m) return null;
    let s = m[1] === '$' ? (loc.has(m[2]) ? loc.get(m[2]) : env.get(m[2])) : env.get('@' + m[2]);
    const path = m[3].split('.').filter(Boolean);
    if (m[1] === '@' && path.length && (path[0] === 'state' || path[0] === 'emits')) { s = env.get('@' + m[2] + '.' + path[0]); path.shift(); }
    for (const p of path) { if (s === 'pt' && (p === 'x' || p === 'y')) s = 'num'; else return null; }
    return s || null;
  };
  const walk = (nodes, loc) => {
    for (const n of nodes) {
      if (n.loop) {
        const L = n.loop; const over = semOf(L.over, loc); const el = G.ELEM[over];
        if (!el) return false;
        const init = L.emit !== undefined ? null : semOf(L.init, loc);
        const inner = new Map(loc); inner.set(L.item, el);
        if (L.emit === undefined) { if (!init) return false; inner.set(L.state, init); }
        else inner.set(L.state, 'num');
        if (!walk(L.nodes, inner)) return false;
        if (L.emit === undefined) { if (semOf(L.next, inner) !== init) return false; env.set('@' + n.id + '.state', init); }
        else { const e = semOf(L.emit, inner); if (!e || !G.LIST_OF[e]) return false; env.set('@' + n.id + '.emits', G.LIST_OF[e]); }
        continue;
      }
      const v = holeVar(n.part); const a = n.args.map((w) => semOf(w, loc));
      if (a.some((x) => !x)) return false;
      const lab = labelsList ? labelsList.map((ls) => ls[v]) : [];
      for (const l of lab) { const o = l && OP_SIG(l, a.length); if (o && (a.some((x, k) => !o.args[k].includes(x)) || !o.out.includes(vout[v]))) return false; }
      const sk = sigKey(a, vout[v]);
      if (sigs[v] && sigs[v] !== sk) return false;
      sigs[v] = sk;
      env.set('@' + n.id, vout[v]);
    }
    return true;
  };
  if (!walk(g.nodes, new Map())) return null;
  const out = semOf(g.out.startsWith('@') ? g.out : '@' + g.out, new Map());
  if (!out) return null;
  if (sigs.some((s) => !s || !available(s))) return null;
  if (sigs.length !== vout.length) return null;
  // קלט שלא בשימוש בסוג הזה — כל הקלטים בשימוש בשלד, אז מספיק
  return { ins, holes: sigs.map((s) => { const [a, o] = s.split('>'); return { sig: a.split(','), out: o }; }), out, key: ins.join(',') + '|' + sigs.join(';') };
}

/* ═══════════════ סדר-המילוי ═══════════════ */

/**
 * מחולל-מילויים בשכבות (דטרמיניסטי): קודם כל הצירופים שכל האינדקסים בהם ≤ 0, אחר-כך ≤ 1 (עם לפחות אחד = 1), וכו'.
 * pools[v] = רשימת מועמדים (לפי הסדר). distinct(v1, c1, v2, c2) ⇒ false = לא לשים (למשל אותו דבר בשני חורים שונים).
 */
export function* layered(pools, ok = () => true) {
  const n = pools.length; if (!n || pools.some((p) => !p.length)) return;
  const max = Math.max(...pools.map((p) => p.length));
  for (let m = 0; m < max; m++) {
    const idx = Array(n).fill(0);
    for (;;) {
      if (idx.some((x) => x === m) && idx.every((x, v) => x < pools[v].length)) { const c = idx.map((x, v) => pools[v][x]); if (ok(c)) yield c; }
      let i = n - 1; while (i >= 0 && ++idx[i] > m) { idx[i] = 0; i--; }
      if (i < 0) break;
    }
  }
}

/**
 * "קודם מה שמבינים": שני מעברים — (1) רק מועמדים "מובנים" (understood(t) — עם שם מיוחד, או מתנהג כמו אופרטור בסיסי),
 * בשכבות; (2) כל המאגר בשכבות, בלי מה שכבר יצא. דטרמיניסטי.
 */
export function* conceptsFirst(pools, understood, ok = () => true) {
  const seen = new Set();
  // 🔴 SELFPRINT-באג (נתפס בבדיקה): המפתח היה ‎t.id‎ — על מועמדים בלי id (עטופים) כל הצירופים קיבלו אותו מפתח, והמעבר
  // השני (כל המאגר) לא הוציא כלום. עכשיו: המקום של כל מועמד במאגר שלו.
  const key = (c) => c.map((t, v) => pools[v].indexOf(t)).join(',');
  const inner = pools.map((p) => p.filter(understood));
  if (inner.every((p) => p.length)) for (const c of layered(inner, ok)) { seen.add(key(c)); yield c; }
  for (const c of layered(pools, ok)) if (!seen.has(key(c))) yield c;
}

/** סמנטיקה של אופרטורי-JS (לסדר-המילוי של חור-אופרטור, ולבדיקת "המקור עצמו מממש את הפועל"). */
export const OPS = {
  '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b, '%': (a, b) => a % b, '**': (a, b) => a ** b,
  neg: (a) => -a, '.length': (a) => (Array.isArray(a) ? a.length : undefined),
  'Math.max': (...a) => Math.max(...a), 'Math.min': (...a) => Math.min(...a), 'Math.abs': Math.abs, 'Math.round': Math.round, 'Math.floor': Math.floor,
  'Math.ceil': Math.ceil, 'Math.sqrt': Math.sqrt, 'Math.hypot': Math.hypot, 'Math.pow': Math.pow, 'Math.sign': Math.sign, 'Math.trunc': Math.trunc, 'Math.log': Math.log, 'Math.exp': Math.exp,
};
