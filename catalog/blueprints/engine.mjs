/**
 * 🧭 מנוע-השרטוטים · הלב (BLUEPRINTS, 14.10.2026) — שרטוט + חלקים מוכחים ⇒ שילוב שעובר את חוקי פועל-היעד n/n.
 *
 * הצעדים (search.mjs מריץ אותם לכל פועל-יעד):
 *   1. התאמה — שרטוט מתאים לפועל אם סוגי-הקלטים שלו (‎num/nums/pt/pts/list/any‎) הם הסוגים של חתימת-הייחוס של הפועל.
 *   2. מאגר לכל משבצת — חלקים מוכחים-בהרצה (`provenAs`) לפעלים של המשבצת, שאפשר להריץ כאן, **בלי** חלקים שמוכחים לפועל-היעד
 *      עצמו (אחרת "נמצא" = "קרא לחלק שכבר יש"). סינון-סוג סטטי ⇒ טעינה ⇒ **סינון-משבצת בהרצה**: לכל פריסת-ארגומנטים
 *      (`layoutsFor` — מקומי, הפוך, ‎נקודה ⇒ x,y‎) החלק רץ על דוגמאות-סוג ומחזיר את הסוג הנכון + עומד בחוזה-המשבצת (shapes.mjs).
 *   3. מילוי — כל המשבצות ממולאות, בסדר "הטוב-קודם" (סכום הדרגות במאגרים, ואז לקסיקוגרפי) — דטרמיניסטי, עד התקציב.
 *   4. אימות — התבנית הממולאת = מתכון-גרף רגיל (graph.mjs) ⇒ `composeGraph` + `verify` של מכונת-השילוב: רק החוקים של
 *      פועל-היעד, אותו ארגז-חול, n/n. כל ניסיון נרשם (עבר / החוק הראשון שנכשל + הסיבה).
 *   5. דירוג — הכי מעט חלקים ⇒ הכי מעט צעדים (lib/steps.mjs, על אותן דוגמאות) ⇒ מזהה.
 * טהור מלבד מה שמוזרק (runners/verify/B). בלי שעון.
 */
import { provenAs } from '../combiner/core.mjs';
import { VERB_BY_ID as LAW_VERBS } from '../lib/verbs.mjs';
import { callerFor } from '../lib/sandbox.mjs';

/* ═══════════════ סוגים ═══════════════ */

const isPt = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && Number.isFinite(v.x) && Number.isFinite(v.y);
const isNumD = (d) => d && (d.t === 'int' || d.t === 'num');
const ptD = (d) => d && d.t === 'obj' && ['x', 'y'].every((k) => (d.p || []).some(([n, dd]) => n === k && isNumD(dd)));
/** תיאור-קלט של האלפבית ⇒ סוג-שרטוט. */
export function semOfD(d) {
  if (!d) return 'any';
  if (isNumD(d)) return 'num';
  if (d.t === 'bool') return 'bool';
  if (ptD(d)) return 'pt';
  if (d.t === 'arr') { if (isNumD(d.of)) return 'nums'; if (ptD(d.of)) return 'pts'; return 'list'; }
  if (d.t === 'obj') return 'rec';
  if (d.t === 'str') return 'str';
  return 'any';
}
/** סוג-שרטוט (מהצורה) מקבל סוג-פועל? any מקבל הכול; list מקבל כל רשימה. */
export const semAccepts = (shapeSem, verbSem) => shapeSem === 'any' || shapeSem === verbSem || (shapeSem === 'list' && ['nums', 'pts', 'list'].includes(verbSem));

/** ערך ⇒ עומד בסוג? (לבדיקת פלט-משבצת) */
export function valueIs(sem, v) {
  switch (sem) {
    case 'num': return typeof v === 'number' && Number.isFinite(v);
    case 'nums': return Array.isArray(v) && v.every((x) => typeof x === 'number' && Number.isFinite(x));
    case 'pt': return isPt(v);
    case 'pts': return Array.isArray(v) && v.every(isPt);
    case 'list': return Array.isArray(v);
    case 'bool': return typeof v === 'boolean';
    case 'int': return Number.isInteger(v);
    default: return v !== null && v !== undefined;
  }
}

/** סוג-שרטוט ⇒ אילו סוגי-קטלוג (kind של קלט-חלק) יכולים לקבל אותו. */
const KIND_OK = {
  pt: (k) => k === 'geo' || k.startsWith('record') || k === 'unknown' || k === 'any',
  pts: (k) => ['geo', 'list', 'waiting', 'sequence', 'unknown'].includes(k),
  num: (k) => ['number', 'amount', 'times', 'unknown'].includes(k),
  nums: (k) => ['list', 'sequence', 'times', 'amount', 'unknown'].includes(k),
  list: (k) => ['list', 'sequence', 'waiting', 'geo', 'times', 'unknown'].includes(k),
  any: () => true, rec: (k) => k.startsWith('record') || k === 'unknown', str: (k) => k === 'text' || k === 'unknown', bool: () => true,
};
const kindOk = (sem, k) => (KIND_OK[sem] || KIND_OK.any)(String(k || 'unknown'));

/* ═══════════════ דוגמאות-סוג (לסינון-המשבצות) — דטרמיניסטי ═══════════════ */

function lcg(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
function sample(sem, r, k) {
  switch (sem) {
    case 'num': return int(r, 0, 30);
    case 'nums': return Array.from({ length: k % 5 === 0 ? 0 : int(r, 1, 6) }, () => int(r, -5, 30));
    case 'pt': return { x: int(r, 0, 40), y: int(r, 0, 40) };
    // רשימת-נקודות: בחצי מהדוגמאות לכל נקודה יש גם שדה נוסף (k) — חלק שזורק שדות נכשל ב-permute/pick/subset
    case 'pts': return Array.from({ length: k % 6 === 0 ? 0 : int(r, 1, 6) }, (_, j) => (k % 2 ? { x: int(r, 0, 40), y: int(r, 0, 40), k: j } : { x: int(r, 0, 40), y: int(r, 0, 40) }));
    case 'list': return Array.from({ length: int(r, 0, 6) }, () => int(r, 0, 9));
    case 'bool': return r() < 0.5;
    default: return int(r, 0, 9);
  }
}
export const SAMPLES = 14;
export function samplesFor(sems, seed) {
  const r = lcg(seed); const out = [];
  for (let k = 0; k < SAMPLES; k++) out.push(sems.map((s) => sample(s, r, k)));
  // ‎pts‎ עם כפולים — אחד בכל רשימה (subset/permute חייבים לשמור על הכמות)
  if (sems[0] === 'pts') out.push([[{ x: 3, y: 4 }, { x: 3, y: 4 }, { x: 9, y: 1 }], ...sems.slice(1).map((s) => sample(s, r, 1))]);
  return out;
}

/* ═══════════════ חוזי-משבצת (כלליים — לא חוקי פועל-היעד) ═══════════════ */

const J = (v) => JSON.stringify(v);
const bag = (xs) => xs.map(J).sort().join('|');
export const CONTRACTS = {
  none: () => true,
  permute: (args, out) => Array.isArray(out) && bag(out) === bag(args[0]),
  subset: (args, out) => { if (!Array.isArray(out) || out.length > args[0].length) return false; const have = args[0].map(J); return out.every((x) => have.includes(J(x))); },
  pick: (args, out) => args[0].length > 0 && args[0].some((c) => J(c) === J(out)),
  /** כל קריאה בודדת: ‎≥0‎. הזוגיות (‎f(a,a)=0‎, סימטריה, תלות) — ב-`pairwise`. */
  metric: (args, out) => typeof out === 'number' && out >= 0,
  additive: (args, out) => typeof out === 'number' && Math.abs(out - args[0].reduce((a, b) => a + b, 0)) < 1e-9,
};
/** בדיקות-חוזה שדורשות כמה קריאות. */
const PAIRWISE = {
  metric: (f, samples) => {
    let dep = false;
    for (const [a, b] of samples) {
      const aa = f([a, a]); const ab = f([a, b]); const ba = f([b, a]);
      if (aa === undefined || ab === undefined || ba === undefined) return false;
      if (Math.abs(aa) > 1e-9 || Math.abs(ab - ba) > 1e-9 * Math.max(1, Math.abs(ab))) return false;
      if (Math.abs(ab) > 1e-9) dep = true;
    }
    return dep;
  },
  additive: (f) => (f([[]]) === 0 || f([[]]) === undefined) && f([[7]]) === 7 && f([[2, 3]]) === 5 && f([[-4, 9, 1]]) === 6,
};

/* ═══════════════ פריסת-ארגומנטים ═══════════════ */

/**
 * k סוגי-משבצת מול n קלטים של החלק ⇒ פריסות: מקום-מקום · הפוך (k=2) · נקודה ⇒ שני מספרים (x, y) לאחד הקלטים או לשניהם.
 * פריסה = רשימת {arg, field?} באורך n. חיווט בלבד (בחירת-שדה), לא חישוב.
 */
export function layoutsFor(sems, kinds) {
  const k = sems.length; const n = kinds.length; const out = [];
  const orders = k === 2 ? [[0, 1], [1, 0]] : [Array.from({ length: k }, (_, i) => i)];
  for (const ord of orders) {
    const ptIdx = ord.filter((i) => sems[i] === 'pt');
    const masks = [];
    for (let m = 0; m < 1 << ptIdx.length; m++) masks.push(m);
    for (const m of masks) {
      const spread = new Set(ptIdx.filter((_, j) => m & (1 << j)));
      if (k + spread.size !== n) continue;
      const lay = [];
      for (const i of ord) { if (spread.has(i)) lay.push({ arg: i, field: 'x' }, { arg: i, field: 'y' }); else lay.push({ arg: i }); }
      if (lay.every((L, p) => (L.field ? kindOk('num', kinds[p]) : kindOk(sems[L.arg], kinds[p])))) out.push(lay);
    }
  }
  const seen = new Set();
  return out.filter((l) => { const s = J(l); if (seen.has(s)) return false; seen.add(s); return true; });
}
const applyLayoutVals = (lay, vals) => lay.map((L) => (L.field ? vals[L.arg]?.[L.field] : vals[L.arg]));
/** חוט ⇒ חוט לשדה (‎"@a"‎ ⇒ ‎"@a.x"‎; רשומה מחוטים ⇒ השדה שלה). null אם אי אפשר. */
function fieldWire(w, f) {
  if (typeof w === 'string') return w + '.' + f;
  if (w && typeof w === 'object' && !Array.isArray(w) && f in w && !('$slice' in w) && !('$cat' in w)) return w[f];
  return null;
}
export function applyLayoutWires(lay, wires) {
  const out = [];
  for (const L of lay) { const w = L.field ? fieldWire(wires[L.arg], L.field) : wires[L.arg]; if (w === null || w === undefined) return null; out.push(w); }
  return out;
}

/* ═══════════════ מאגר למשבצת ═══════════════ */

const verbsOfCls = (cls) => { const cs = [].concat(cls); return [...LAW_VERBS.values()].filter((v) => cs.includes(v.bind)).map((v) => v.id); };
export const rolesOf = (slot) => (slot.roles ? slot.roles : verbsOfCls(slot.cls));

/**
 * המועמדים הסטטיים של משבצת: חלקים מוכחים לאחד הפעלים, שרצים כאן, לא מוכחים לפועל-היעד (`hide`), ושיש להם פריסה אחת
 * לפחות לפי הסוגים. סדר: כמה קלטים בסוג המדויק ⇒ סדר הפעלים במשבצת ⇒ סדר-האינדקס; ואז סבב בין הפעלים (גיוון). עד `cap`.
 */
export function staticPool(slot, sems, ix, homeOf, hide, cap = 48) {
  const all = []; const seen = new Set();
  rolesOf(slot).forEach((v, vi) => {
    for (const p of ix.byVerb.get(v) || []) {
      if (seen.has(p.id) || !provenAs(p, v) || hide(p) || !homeOf(p)) continue;
      const lays = layoutsFor(sems, p.takes);
      if (!lays.length) continue;
      seen.add(p.id); all.push({ part: p, role: v, layouts: lays, fit: exactness(sems, p.takes, lays[0]), vi, k: all.length });
    }
  });
  // סוג מדויק קודם (נקודה ⇔ geo, מספר ⇔ number…), ואז סדר הפעלים במשבצת, ואז סדר-האינדקס
  all.sort((a, b) => b.fit - a.fit || a.vi - b.vi || a.k - b.k);
  // גיוון לפני התקרה: סבב על הפעלים (בתוך כל פועל — הסדר שלמעלה)
  const lanes = new Map(); for (const c of all) { if (!lanes.has(c.role)) lanes.set(c.role, []); lanes.get(c.role).push(c); }
  const L = [...lanes.values()]; const out = [];
  for (let k = 0; out.length < Math.min(cap, all.length); k++) for (const l of L) if (k < l.length && out.length < cap) out.push(l[k]);
  return out.map(({ part, role, layouts }) => ({ part, role, layouts }));
}
const EXACT = { pt: ['geo'], pts: ['geo'], num: ['number'], nums: ['list', 'sequence'], list: ['list'], bool: ['bool'] };
/** כמה מהקלטים של החלק הם בדיוק הסוג של המשבצת (ולא "unknown"/רשומה כללית). */
function exactness(sems, kinds, lay) {
  let s = 0;
  lay.forEach((L, p) => { const want = L.field ? 'num' : sems[L.arg]; if ((EXACT[want] || []).includes(String(kinds[p]))) s++; });
  return s;
}

/**
 * סינון-משבצת בהרצה: לכל מועמד ולכל פריסה — הדוגמאות; נשאר מה שלא נכשל, מחזיר את סוג-הפלט, ועומד בחוזה.
 * תאומי-התנהגות (אותם פלטים בדיוק על כל הדוגמאות, כמו שש העתקות של אותו "הפוך" בתפריטים של בנייה-חכמה) ⇒ רק הראשון.
 * מחזיר [{part, role, layout}] בסדר המועמדים, עד `keep`.
 */
export function screenPool(cands, slot, sems, outSem, runners, seed, keep = 12) {
  const samples = samplesFor(sems, seed);
  const C = CONTRACTS[slot.contract || 'none']; const P = PAIRWISE[slot.contract];
  const out = []; const rejected = { load: 0, error: 0, type: 0, contract: 0, twin: 0 };
  const seenBeh = new Set(); // תאום-התנהגות: אותם פלטים על כל הדוגמאות ⇒ אותו דבר בשביל המשבצת — נשאר הראשון
  // גיוון: סבב על הפעלים של המשבצת (הראשון של כל פועל, ואז השני…) — כך משבצת עם כמה פעלים לא מתמלאת כולה מהראשון
  const byRole = new Map(); for (const c of cands) { if (!byRole.has(c.role)) byRole.set(c.role, []); byRole.get(c.role).push(c); }
  const lanes = [...byRole.values()]; const order = [];
  for (let k = 0; order.length < cands.length; k++) for (const L of lanes) if (k < L.length) order.push(L[k]);
  for (const c of order) {
    if (out.length >= keep) break;
    const R = runners.get(c.part.id);
    if (!R) { rejected.load++; continue; }
    let ok = null; let why = 'error'; let beh = null;
    for (const lay of c.layouts) {
      const call = callerFor(R.ctx, R.fn, seed, R.self);
      const f = (vals) => { try { const r = call(applyLayoutVals(lay, vals)); return 'err' in r || r.async ? undefined : r.v; } catch { return undefined; } };
      let good = true; let anyRan = false; const outs = [];
      for (const s of samples) {
        const v = f(s);
        outs.push(v === undefined ? null : v);
        // רשימה ריקה = מחוץ לתחום של רוב המשבצות (אין מה לבחור/לסכם): לא נחשבת כשל — רק לא נספרת
        if (s.some((a) => Array.isArray(a) && !a.length) && (v === undefined || !valueIs(outSem, v) || !C(s, v))) continue;
        if (v === undefined) { good = false; why = 'error'; break; }
        anyRan = true;
        if (!valueIs(outSem, v)) { good = false; why = 'type'; break; }
        if (!C(s, v)) { good = false; why = 'contract'; break; }
      }
      if (good && anyRan && P && !P(f, samples)) { good = false; why = 'contract'; }
      if (good && anyRan) { ok = lay; beh = J(outs); break; }
    }
    if (ok && seenBeh.has(beh)) { rejected.twin++; continue; }
    if (ok) { seenBeh.add(beh); out.push({ part: c.part, role: c.role, layout: ok }); } else rejected[why]++;
  }
  return { pool: out, rejected };
}

/* ═══════════════ מילוי ═══════════════ */

/** כל ה-tuples של דרגות (אחת לכל משבצת), לפי סכום-הדרגות ואז לקסיקוגרפי, עד max. */
export function* bestFirst(sizes, max = Infinity) {
  const d = sizes.length; let n = 0;
  if (sizes.some((s) => s === 0)) return;
  const top = sizes.reduce((a, s) => a + s - 1, 0);
  for (let sum = 0; sum <= top; sum++) {
    const cur = Array.from({ length: d }, () => 0);
    const rec = function* (i, left) {
      if (i === d - 1) { if (left <= sizes[i] - 1) { cur[i] = left; yield cur.slice(); } return; }
      for (let v = 0; v <= Math.min(left, sizes[i] - 1); v++) { cur[i] = v; yield* rec(i + 1, left - v); }
    };
    for (const t of rec(0, sum)) { if (n++ >= max) return; yield t; }
  }
}

/** שמות-שדות של הפלט (ITEM/BIN בתבנית) ⇒ השמות של הפועל. */
function renameKeys(w, map) {
  if (typeof w === 'string') return w.replace(/\.([A-Z]+)\b/g, (m, k) => (map[k] ? '.' + map[k] : m));
  if (Array.isArray(w)) return w.map((x) => renameKeys(x, map));
  if (w && typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, v]) => [map[k] || k, renameKeys(v, map)]));
  return w;
}

/**
 * תבנית + מילוי ⇒ מתכון-גרף רגיל (graph.mjs): כל צומת-משבצת מקבל `part` (בשמו המלא — מזהה-הבית), `role`, והארגומנטים לפי
 * הפריסה. `out` שאינו שם-צומת (חוט) נשמר כחוט; חוט שאינו מחרוזת (‎$slice‎) נעטף בלולאה של סבב-אחד (חיווט בלבד).
 */
export function expand(tpl, fill, fieldMap, homeId) {
  let bad = null;
  const mapNodes = (nodes) => nodes.map((n) => {
    if (n.loop) {
      const L = n.loop;
      return { id: n.id, loop: { ...renameKeys(L, fieldMap), nodes: mapNodes(L.nodes) } };
    }
    const f = fill[n.slot];
    const args = applyLayoutWires(f.layout, renameKeys(n.args, fieldMap));
    if (!args) bad = n.id + ': אין פריסה לחוטים';
    return { id: n.id, part: homeId(f.part), role: f.role, args: args || [], says: n.slot };
  });
  const nodes = mapNodes(tpl.nodes);
  let out = tpl.out || null;
  const ow = tpl.outWire !== undefined ? renameKeys(tpl.outWire, fieldMap) : null;
  if (ow !== null && typeof ow === 'string') out = ow;
  else if (ow !== null) { nodes.push({ id: 'ret', loop: { over: [0], init: 0, item: 'rv', state: 'rz', nodes: [], next: '$rz', emit: ow } }); out = '@ret.emits.0'; }
  return bad ? { bad } : { inputs: tpl.inputs, nodes, out, consts: tpl.consts };
}
