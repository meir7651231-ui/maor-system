/**
 * 🌱 מנוע-הצמיחה · הלב הטהור (GROW, 15.10.2026) — "חיבור א עם ב ⇒ יצא ג. רושם ג. יש ג יותר טוב? משאיר את הטוב וממשיך מעליו."
 *
 * כאן רק דברים טהורים (בלי ארגז-חול, בלי דיסק, בלי שעון):
 *   · העולם — 4 סוגים: מספר (num) · רשימת-מספרים (nums) · נקודה (pt) · רשימת-נקודות (pts). עד 2 קלטים.
 *   · סט-קלטים קבוע לכל חתימה (כולל קלטי-לחץ: ריק, כפולים, שליליים, ארוך) ⇒ טביעת-התנהגות = הפלטים עליו.
 *   · צורות-החיבור — חיווט בלבד, כמתכון-גרף רגיל של מכונת-השילוב (combiner/graph.mjs):
 *       chain  ב(א(x…), y?)        pair  ב(א(x), א(y))
 *       map    [א(p) לכל p ב-xs]    mapc  [א(p, y) לכל p ב-xs]
 *       fold   צבירה: s ⇐ ב(s, p) לכל p ב-xs, מ-s0      fix  חזרה על א עד שאין שינוי
 *     הגרף של דבר מורכב = הגרפים של חלקיו, מוטמעים (inline) עם שמות חדשים. אין חישוב בחוטים.
 */

export const SEMS = ['num', 'nums', 'pt', 'pts'];
export const ELEM = { nums: 'num', pts: 'pt' };
export const LIST_OF = { num: 'nums', pt: 'pts' };

/* ═══════════════ סט-הקלטים הקבוע ═══════════════ */

const P = (x, y) => ({ x, y });
/** ערכים קבועים לכל סוג — כולל קלטי-לחץ (ריק, איבר אחד, כפולים, שליליים, ארוך, על קו אחד). */
export const VALUES = {
  num: [0, 1, -1, 2, 3, 5, 7, 10, 13, -6, 25, 40, 100, 4],
  nums: [[], [5], [3, 1, 2], [3, 3, 3], [-7, 0, 7], [10, -2, 8, -2, 5], [1, 2, 3, 4, 5, 6], [9, 8, 7, 6, 5], [0, 0, 1], [4, -9, 4, 13, 0, 2, 2, 7, -1, 6], [12, 30], [-3, -8, -1], [6, 1, 9, 1, 3, 7, 2]],
  pt: [P(0, 0), P(3, 4), P(1, 1), P(10, 0), P(0, 10), P(7, 2), P(-5, 6), P(20, 20), P(2, 9), P(6, 6), P(15, 3), P(4, 12)],
  pts: [
    [], [P(3, 4)], [P(0, 0), P(3, 4)], [P(1, 1), P(1, 1), P(5, 5)],
    [P(0, 0), P(10, 10), P(1, 0), P(9, 9), P(2, 1)], [P(5, 5), P(0, 5), P(5, 0), P(0, 0)],
    [P(1, 0), P(2, 0), P(3, 0), P(4, 0)], [P(12, 3), P(2, 14), P(7, 7), P(30, 1), P(0, 22), P(18, 18)],
    [P(4, 4), P(8, 1), P(4, 4), P(2, 9), P(6, 3), P(1, 7), P(9, 9)], [P(-3, 2), P(6, -1), P(0, 0)],
    [P(20, 0), P(0, 20), P(20, 20), P(0, 0), P(10, 10), P(5, 15), P(15, 5), P(12, 12)],
  ],
};
/** סט-הקלטים של חתימה: קלט אחד ⇒ כל הערכים; שניים ⇒ 16 זוגות קבועים (שני האינדקסים זזים בקצב שונה). */
export function samplesOf(sig) {
  if (sig.length === 1) return VALUES[sig[0]].map((v) => [v]);
  const [A, B] = sig.map((s) => VALUES[s]);
  return Array.from({ length: 16 }, (_, k) => [A[k % A.length], B[(k * 5 + 3) % B.length]]);
}

/* ═══════════════ סוג-ערך + טביעה ═══════════════ */

const isPt = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Number.isFinite(v.x) && Number.isFinite(v.y);
/** ערך ⇒ הסוג שלו בעולם ('empty' = רשימה ריקה, מתאימה ל-nums ול-pts) או null (מחוץ לעולם). */
export function semOfValue(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? 'num' : null;
  if (Array.isArray(v)) {
    if (!v.length) return 'empty';
    if (v.every((x) => typeof x === 'number' && Number.isFinite(x))) return 'nums';
    if (v.every(isPt)) return 'pts';
    return null;
  }
  return isPt(v) ? 'pt' : null;
}
/** ערך ⇒ צורה קנונית לטביעה: מספרים מעוגלים ל-12 ספרות (‎-0 ⇒ 0‎), מפתחות ממוינים. */
export function canon(v) {
  if (typeof v === 'number') { const r = Number(v.toPrecision(12)); return Object.is(r, -0) ? 0 : r; }
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]));
  return v;
}
/** FNV-1a 32 ⇒ 8 ספרות הקס. */
export function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
/** פלטים (null = נכשל/מחוץ לעולם) ⇒ {out, fp, ok} או {junk: סיבה}. */
export function judge(sig, samples, outs) {
  const ok = outs.filter((o) => o !== null);
  if (ok.length < Math.max(6, Math.ceil(0.6 * outs.length))) return { junk: 'לא רץ על רוב הקלטים' };
  const kinds = new Set(ok.map(semOfValue));
  kinds.delete('empty');
  if (kinds.size > 1) return { junk: 'פלט מעורב' };
  const out = [...kinds][0];
  if (!out) return { junk: 'תמיד רשימה ריקה' };
  const texts = outs.map((o) => JSON.stringify(o === null ? null : canon(o)));
  if (texts.every((t) => t === texts[0])) return { junk: 'תמיד אותו פלט' };
  if (LIST_OF.num === out || LIST_OF.pt === out) {
    // GROW2 · זבל לפני המדף: כל רשימת-פלט (≥2 פריטים) עשויה מפריט אחד שחוזר — [3,1,2]⇒[1,1,1]. זו לא פעולה על
    // הערכים אלא "רשימה של קבוע באורך הקלט". (מסיר-כפולים/ממיין עוברים: על [3,3,3] אחיד, אבל לא על כל הסט.)
    const long = ok.filter((o) => o.length >= 2);
    if (long.length >= 3 && long.every((o) => o.every((x) => JSON.stringify(canon(x)) === JSON.stringify(canon(o[0]))))) return { junk: 'רשימה של פריט אחד שחוזר' };
  }
  for (let a = 0; a < sig.length; a++) {
    if (sig[a] !== out) continue;
    if (samples.every((s, k) => outs[k] !== null && JSON.stringify(canon(s[a])) === texts[k])) return { junk: 'מחזיר את הקלט כמו שהוא' };
  }
  return { out, ok: ok.length, fp: fnv(sig.join(',') + '>' + out + '|' + texts.join('\u0001')) };
}

/* ═══════════════ גרפים — הטמעה וצורות ═══════════════ */

/** חוט ⇒ חוט בשמות חדשים. ins: שם-קלט ⇒ חוט-מחרוזת; loc: משתני-לולאה מקומיים (מקבלים קידומת); P: קידומת לצמתים. */
function rw(w, ins, loc, P) {
  if (typeof w === 'string') {
    const m = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/.exec(w);
    if (!m) return w;
    if (m[1] === '@') return '@' + P + m[2] + m[3];
    if (m[2] in ins) return ins[m[2]] + m[3];
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
/** מטמיע גרף: הקלטים שלו ⇐ חוטים (מחרוזות); מחזיר {nodes, out} — out = חוט-מחרוזת לפלט. */
export function inline(g, argWires, P) {
  const ins = Object.fromEntries(g.inputs.map((n, k) => [n, argWires[k]]));
  const nodes = rwNodes(g.nodes, ins, new Set(), P);
  const out = g.out.startsWith('@') ? rw(g.out, ins, new Set(), P) : '@' + P + g.out;
  return { nodes, out };
}
const IN = ['i0', 'i1'];
/** החלק עצמו כגרף. */
export function partGraph(partId, arity) {
  return { inputs: IN.slice(0, arity), nodes: [{ id: 'n', part: partId, args: IN.slice(0, arity).map((n) => '$' + n) }], out: 'n' };
}
export const FIX_MAX = 12;

/**
 * הצורות. כל אחת: (A, B?) ⇒ {sig, out} של התוצאה (או null — לא מתאים בסוג), ו-graph(A, B) ⇒ הגרף.
 * דבר = {sig: [סוגים], out: סוג, graph}.
 */
export const FORMS = {
  /** ב(א(x…), y?) — הפלט של א נכנס לקלט הראשון של ב; קלט שני של ב (אם יש) = קלט חופשי. */
  chain: {
    two: true,
    type: (A, B) => (B.sig[0] === A.out && A.sig.length + B.sig.length - 1 <= 2 ? { sig: [...A.sig, ...B.sig.slice(1)], out: B.out } : null),
    graph: (A, B) => {
      const nA = A.sig.length; const ins = IN.slice(0, nA + B.sig.length - 1);
      const a = inline(A.graph, ins.slice(0, nA).map((n) => '$' + n), 'a_');
      const b = inline(B.graph, [a.out, ...ins.slice(nA).map((n) => '$' + n)], 'b_');
      return { inputs: ins, nodes: [...a.nodes, ...b.nodes], out: b.out };
    },
  },
  /** ב(א(x), א(y)) — אותו א על שני קלטים, ו-ב מצרף. */
  pair: {
    two: true,
    type: (A, B) => (A.sig.length === 1 && B.sig.length === 2 && B.sig[0] === A.out && B.sig[1] === A.out ? { sig: [A.sig[0], A.sig[0]], out: B.out } : null),
    graph: (A, B) => {
      const x = inline(A.graph, ['$i0'], 'x_'); const y = inline(A.graph, ['$i1'], 'y_');
      const b = inline(B.graph, [x.out, y.out], 'b_');
      return { inputs: ['i0', 'i1'], nodes: [...x.nodes, ...y.nodes, ...b.nodes], out: b.out };
    },
  },
  /** [א(p) לכל p ב-xs] */
  map: {
    type: (A) => (A.sig.length === 1 && LIST_OF[A.sig[0]] && LIST_OF[A.out] ? { sig: [LIST_OF[A.sig[0]]], out: LIST_OF[A.out] } : null),
    graph: (A) => {
      const a = inline(A.graph, ['$it'], 'm_');
      return { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: a.nodes, next: '$st', emit: a.out } }], out: '@L.emits' };
    },
  },
  /** [א(p, y) לכל p ב-xs] — אותו y לכולם. */
  mapc: {
    type: (A) => (A.sig.length === 2 && LIST_OF[A.sig[0]] && LIST_OF[A.out] ? { sig: [LIST_OF[A.sig[0]], A.sig[1]], out: LIST_OF[A.out] } : null),
    graph: (A) => {
      const a = inline(A.graph, ['$it', '$i1'], 'm_');
      return { inputs: ['i0', 'i1'], nodes: [{ id: 'L', loop: { over: '$i0', init: 0, item: 'it', state: 'st', nodes: a.nodes, next: '$st', emit: a.out } }], out: '@L.emits' };
    },
  },
  /** צבירה: s ⇐ ב(s, p) לכל p ב-xs, מתחילים מ-s0 (הקלט השני). */
  fold: {
    type: (B) => (B.sig.length === 2 && B.out === B.sig[0] && LIST_OF[B.sig[1]] ? { sig: [LIST_OF[B.sig[1]], B.sig[0]], out: B.out } : null),
    graph: (B) => {
      const b = inline(B.graph, ['$st', '$it'], 'f_');
      return { inputs: ['i0', 'i1'], nodes: [{ id: 'L', loop: { over: '$i0', init: '$i1', item: 'it', state: 'st', nodes: b.nodes, next: b.out } }], out: '@L.state' };
    },
  },
  /** חזרה על א עד שאין שינוי (עד FIX_MAX פעמים). */
  fix: {
    type: (A) => (A.sig.length === 1 && A.out === A.sig[0] ? { sig: A.sig, out: A.out } : null),
    graph: (A) => {
      const a = inline(A.graph, ['$st'], 'x_');
      return { inputs: ['i0'], nodes: [{ id: 'L', loop: { over: [0], init: '$i0', item: 'it', state: 'st', nodes: a.nodes, next: a.out, until: 'stable', max: FIX_MAX } }], out: '@L.state' };
    },
  },
};
export const FORM_HE = { part: 'חלק', chain: 'שרשרת ב(א)', pair: 'זוג ב(א(x),א(y))', map: 'על כל פריט', mapc: 'על כל פריט, עם קבוע', fold: 'צבירה', fix: 'חזרה עד שאין שינוי' };

/** "טוב יותר": פחות צעדים ⇒ פחות חלקים ⇒ מפתח (לקסיקוגרפי). */
export const better = (a, b) => a.steps - b.steps || a.nParts - b.nParts || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/* ═══════════════ קלטים נוספים — לאימות שיפורים מעבר לסט הקבוע ═══════════════ */

function lcg(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
function randomOf(sem, r) {
  switch (sem) {
    case 'num': return rint(r, -50, 120);
    case 'nums': { const xs = Array.from({ length: rint(r, 0, 10) }, () => rint(r, -40, 60)); if (xs.length > 2 && r() < 0.3) xs.push(xs[0]); return xs; }
    case 'pt': return P(rint(r, 0, 40), rint(r, 0, 40));
    default: { const xs = Array.from({ length: rint(r, 0, 9) }, () => P(rint(r, 0, 30), rint(r, 0, 30))); if (xs.length > 2 && r() < 0.3) xs.push({ ...xs[0] }); return xs; }
  }
}
/** n קלטים אקראיים (דטרמיניסטי) לחתימה — שונים מסט-הטביעה. */
export function extraSamples(sig, n = 200, seed = 0x6e0) {
  const r = lcg(seed ^ parseInt(fnv(sig.join(',')), 16));
  return Array.from({ length: n }, () => sig.map((s) => randomOf(s, r)));
}
/** חתימת-דבר ⇒ מפתח-דלי (לדגימת זוגות בלי לפרוס את כולם). */
export const bucketKey = (sig0, arity, sig1, isNew) => sig0 + '|' + arity + '|' + (sig1 || '') + '|' + (isNew ? 1 : 0);
/**
 * הזוגות-המועמדים של קומה, בלי לפרוס אותם: לכל א ולכל צורה-דו-מקומית — רשימות-הדליים של ב המתאימים.
 * (A חדש ⇒ כל ב מתאים; A ישן ⇒ רק ב חדש.) מחזיר בלוקים עם מונה מצטבר.
 */
export function pairBlocks(cur, isNewIdx, buckets) {
  const blocks = []; let total = 0;
  const get = (k) => buckets.get(k) || [];
  for (const A of cur) {
    const nw = isNewIdx(A.idx);
    const pick = (sig0, ar, sig1) => [1, 0].filter((n) => nw || n === 1).map((n) => get(bucketKey(sig0, ar, sig1, n)));
    const lists = { chain: [], pair: [] };
    lists.chain.push(...pick(A.out, 1, ''));
    if (A.sig.length === 1) for (const s of SEMS) lists.chain.push(...pick(A.out, 2, s));
    if (A.sig.length === 1) lists.pair.push(...pick(A.out, 2, A.out));
    for (const form of ['chain', 'pair']) {
      const ls = lists[form].filter((l) => l.length);
      const count = ls.reduce((a, l) => a + l.length, 0);
      if (count) { blocks.push({ A, form, lists: ls, count, start: total }); total += count; }
    }
  }
  return { blocks, total };
}
/** אינדקס ⇒ (בלוק, ב). */
export function pairAt(blocks, i) {
  let lo = 0; let hi = blocks.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (blocks[m].start <= i) lo = m; else hi = m - 1; }
  const b = blocks[lo]; let o = i - b.start;
  for (const l of b.lists) { if (o < l.length) return { block: b, B: l[o] }; o -= l.length; }
  throw new Error('pairAt: מחוץ לטווח');
}
/** בחירת cap אינדקסים מתוך total — דטרמיניסטי (LCG לפי הקומה), ממוינים. total ≤ cap ⇒ כולם. */
export function sampleIdx(total, cap, seed) {
  if (total <= cap) return Array.from({ length: total }, (_, i) => i);
  const r = lcg(seed); const s = new Set();
  while (s.size < cap) s.add(Math.floor(r() * total));
  return [...s].sort((a, b) => a - b);
}

/* ═══════════════ GROW2 · קלטי-לחץ ═══════════════ */

/**
 * קלטי-לחץ (דטרמיניסטי) — מה שהסט הקבוע וה-200 האקראיים לא מכסים: רשימות של 40–500 פריטים, מספרים עד 10^15,
 * שליליים, כפולים, נקודות רחוקות. שיפור מחליף ושם ניתן רק אם הם עוברים גם כאן (שני ה"שיפורים" השגויים של GROW
 * נכשלו בדיוק כאן: 10^15 ⇒ 7 במקום 1; רשימה של 100 ⇒ 40 במקום 100).
 */
const BIG = [1e15, -1e15, 999999999999, 123456789012, -9876543210, 2 ** 40, 1e9 + 7];
const LENS = [40, 100, 250, 500];
function stressOf(sem, r, k) {
  const big = () => (r() < 0.5 ? BIG[rint(r, 0, BIG.length - 1)] : rint(r, -1e6, 1e6));
  switch (sem) {
    case 'num': return k < BIG.length ? BIG[k] : big();
    case 'nums': {
      const n = LENS[k % LENS.length];
      const mode = Math.floor(k / LENS.length) % 3; // 0: קטנים עם כפולים · 1: ענקיים ושליליים · 2: מעורב
      return Array.from({ length: n }, () => (mode === 0 ? rint(r, -9, 9) : mode === 1 ? big() : r() < 0.5 ? rint(r, -50, 50) : big()));
    }
    case 'pt': return k < 4 ? P(BIG[k % BIG.length], -BIG[(k + 1) % BIG.length]) : P(rint(r, -1e6, 1e6), rint(r, -1e6, 1e6));
    default: {
      const n = LENS[k % LENS.length] / (k % 2 ? 1 : 5);
      return Array.from({ length: n }, () => (r() < 0.2 ? P(1, 1) : P(rint(r, -1e5, 1e5), rint(r, -1e5, 1e5))));
    }
  }
}
export const STRESS_N = 12;
/** STRESS_N קלטי-לחץ לחתימה (אותם בכל הרצה). */
export function stressSamples(sig, n = STRESS_N, seed = 0x57e55) {
  const r = lcg(seed ^ parseInt(fnv(sig.join(',')), 16));
  return Array.from({ length: n }, (_, k) => sig.map((s, a) => stressOf(s, r, (k + a * 5) % n)));
}
/** שני פלטים זהים (קנוני)? null = לא רץ. */
export const sameOut = (x, y) => JSON.stringify(x === null ? null : canon(x)) === JSON.stringify(y === null ? null : canon(y));
/**
 * שתי רשימות-פלטים על קלטי-לחץ ⇒ {same, ran, n, differ?}. "זהים" = שווים בכל מקום שאחד מהם רץ; וחובה שלפחות חצי
 * מהקלטים רצו בשניהם (אחרת אי-אפשר לדעת ⇒ לא זהים — לא מחליפים בעיוור).
 */
export function stressCompare(S, xs, ys) {
  let ran = 0; let differ = null;
  for (let k = 0; k < S.length; k++) {
    if (xs[k] !== null && ys[k] !== null) ran++;
    if (!sameOut(xs[k], ys[k]) && !differ) differ = { at: k, got: brief(xs[k]), want: brief(ys[k]) };
  }
  return { same: !differ && ran * 2 >= S.length, ran, n: S.length, ...(differ ? { differ } : {}) };
}
const brief = (v) => (Array.isArray(v) ? (v.length > 6 ? { len: v.length, head: canon(v.slice(0, 4)) } : canon(v)) : v === null ? null : canon(v));

/* ═══════════════ GROW2 · קרבה לפעלים ═══════════════ */

/**
 * קרבה של דבר לפועל = אחוז הקלטים "המעניינים" בסט-הטביעה שבהם הפלט זהה לפלט של מימוש-הייחוס באותה חתימה.
 * מעניין = כל קלט-רשימה ≥2 פריטים (על [] ועל [5] כמעט כל דבר "צודק" במקרה). זול: הפלטים כבר חושבו בטביעה.
 * refOuts = פלטי-הייחוס על samplesOf(sig) (null = הייחוס לא רץ ⇒ הקלט לא נספר).
 */
export function closeness(S, outs, refOuts) {
  let n = 0; let hit = 0;
  for (let k = 0; k < S.length; k++) {
    if (refOuts[k] === null || S[k].some((x) => Array.isArray(x) && x.length < 2)) continue;
    n++; if (outs[k] !== null && sameOut(outs[k], refOuts[k])) hit++;
  }
  return n ? hit / n : 0;
}
/**
 * GROW2 · בחירה לפי ניקוד: רשימת-עבודות טובות (כל אחת עם ניקוד) ⇒ cap מהן, הטובים קודם אבל בלי שהטוב-ביותר יבלע הכול:
 * סבב-סבבים לפי "עוגן" (הדבר הטוב שבזוג), כל עוגן לוקח בסבב חלק לפי הניקוד שלו (≥1). דטרמיניסטי.
 */
export function pickGuided(jobs, cap) {
  const byAnchor = new Map();
  for (const j of jobs) { if (!byAnchor.has(j.anchor)) byAnchor.set(j.anchor, { score: j.anchorScore, list: [] }); byAnchor.get(j.anchor).list.push(j); }
  const anchors = [...byAnchor.entries()].sort((a, b) => b[1].score - a[1].score || (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
  for (const a of anchors) a.list.sort((x, y) => y.partnerScore - x.partnerScore || (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  const out = []; const seen = new Set(); const pos = anchors.map(() => 0);
  const top = anchors.length ? anchors[0].score || 1 : 1;
  while (out.length < cap) {
    let moved = false;
    for (let i = 0; i < anchors.length && out.length < cap; i++) {
      const a = anchors[i]; const take = Math.max(1, Math.round(4 * (a.score / top)));
      for (let t = 0; t < take && pos[i] < a.list.length && out.length < cap; ) {
        const j = a.list[pos[i]++]; if (seen.has(j.key)) continue; seen.add(j.key); out.push(j); t++; moved = true;
      }
    }
    if (!moved) break;
  }
  return out;
}
