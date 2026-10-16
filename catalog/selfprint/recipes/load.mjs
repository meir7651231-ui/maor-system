/**
 * 📖 ספר-המתכונים ⇒ שלדים (RECIPES, 16.10.2026). טהור. **לא חלק מהספר** — זה החיבור של הספר למנוע, ונכתב יחד איתו.
 *
 * כל מתכון ⇒ שלד באותו פורמט כמו library-code.json (inputs/graph/labels), כדי שהמנוע ימלא אותו בדיוק כמו שלד-מהקוד.
 * חור `optional` ⇒ גם גרסה שבה הצומת שלו הוא מעבר-ישר של הקלט הראשון (הצמתים שנשארו בלי שימוש — יוצאים), החורים ממוספרים
 * מחדש ברצף. גרסה בלי חורים בכלל — לא נכנסת (זה כבר לא מתכון אלא תשובה).
 */
const REF = /^([$@])([\w-]+)((?:\.[\w-]+)*)$/;
const isHole = (p) => typeof p === 'string' && p.startsWith('□');
const hv = (p) => Number(p.slice(1));

function mapWires(w, f) {
  if (typeof w === 'string') return f(w);
  if (Array.isArray(w)) return w.map((x) => mapWires(x, f));
  if (w && typeof w === 'object') return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, mapWires(v, f)]));
  return w;
}
const mapNodes = (nodes, fn) => nodes.flatMap((n) => {
  if (n.loop) { const L = n.loop; const o = { ...L, over: fn.w(L.over), init: fn.w(L.init), nodes: mapNodes(L.nodes, fn), next: fn.w(L.next) }; if (L.emit !== undefined) o.emit = fn.w(L.emit); return [{ id: n.id, loop: o }]; }
  const r = fn.n(n); return r ? [{ ...r, args: fn.w(r.args) }] : [];
});
const refsIn = (x, acc) => { mapWires(x, (s) => { const m = REF.exec(s); if (m && m[1] === '@') acc.add(m[2]); return s; }); return acc; };

/** מוריד את החורים ב-drop (מעבר-ישר לקלט הראשון), מנקה צמתים שאין להם שימוש, ממספר חורים מחדש. */
export function variant(graph, drop) {
  const alias = new Map();
  const collect = (nodes) => { for (const n of nodes) { if (n.loop) collect(n.loop.nodes); else if (isHole(n.part) && drop.has(hv(n.part))) alias.set(n.id, n.args[0]); } };
  collect(graph.nodes);
  const sub = (s) => { const m = REF.exec(s); if (!m || m[1] !== '@' || !alias.has(m[2])) return s; const a = alias.get(m[2]); return typeof a === 'string' ? a + m[3] : a; };
  const deep = (w) => { let prev; let cur = w; do { prev = JSON.stringify(cur); cur = mapWires(cur, sub); } while (JSON.stringify(cur) !== prev); return cur; };
  let nodes = mapNodes(graph.nodes, { n: (n) => (alias.has(n.id) ? null : n), w: deep });
  let out = typeof graph.out === 'string' && graph.out.startsWith('@') ? deep(graph.out) : alias.has(graph.out) ? deep('@' + graph.out) : graph.out;
  // צמתים בלי שימוש (גם בתוך לולאות) — יוצאים, עד שאין שינוי
  for (;;) {
    const used = new Set();
    refsIn(out.startsWith?.('@') ? out : '@' + out, used);
    const walk = (ns) => { for (const n of ns) { if (n.loop) { refsIn([n.loop.over, n.loop.init, n.loop.next, n.loop.emit ?? null], used); walk(n.loop.nodes); } else refsIn(n.args, used); } };
    walk(nodes);
    let removed = false;
    const prune = (ns) => ns.filter((n) => { if (n.loop) { n.loop.nodes = prune(n.loop.nodes); return true; } if (!used.has(n.id)) { removed = true; return false; } return true; });
    nodes = prune(nodes);
    if (!removed) break;
  }
  const left = []; const seen = (ns) => { for (const n of ns) { if (n.loop) seen(n.loop.nodes); else if (isHole(n.part) && !left.includes(hv(n.part))) left.push(hv(n.part)); } };
  seen(nodes); left.sort((a, b) => a - b);
  const ren = new Map(left.map((v, i) => [v, i]));
  nodes = mapNodes(nodes, { n: (n) => (isHole(n.part) ? { ...n, part: '□' + ren.get(hv(n.part)) } : n), w: (x) => x });
  return { graph: { inputs: graph.inputs, nodes, out: typeof out === 'string' && out.startsWith('@') && /^@[\w-]+$/.test(out) ? out.slice(1) : out }, keep: left };
}

/** הספר ⇒ שלדים (בסדר קבוע: מתכון, ואז גרסאות לפי מספר החורים שהוסרו). */
export function recipeShapes(recipes) {
  const out = [];
  for (const r of recipes) {
    const opt = r.holes.map((h, v) => (h.optional ? v : -1)).filter((v) => v >= 0);
    const subsets = [[]];
    for (const v of opt) for (const s of [...subsets]) subsets.push([...s, v]);
    subsets.sort((a, b) => a.length - b.length || (a.join() < b.join() ? -1 : 1));
    for (const drop of subsets) {
      const { graph, keep } = variant(r.graph, new Set(drop));
      if (!keep.length) continue;
      const labels = keep.map((v) => r.holes[v].label || null);
      out.push({ id: 'rcp-' + r.id + (drop.length ? '~' + drop.join('') : ''), recipe: r.id, chapter: r.chapter, he: r.he, dropped: drop, holes: keep.map((v) => r.holes[v]), graph, labels, n: 1 });
    }
  }
  return out;
}
