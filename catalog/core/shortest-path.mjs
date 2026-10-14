/**
 * 🧭 דרך קצרה (shortest-path) — ברשת של נקודות וקשתות עם מחיר, הדרך הזולה ביותר מנקודה לנקודה (דייקסטרה).
 * הליבה בלי עולם של: findShortestPath של בנייה-חכמה (שרשרת-מחברים בין שני מוצרי-אינסטלציה, תור-עדיפויות),
 * hopsBetween (BFS = דייקסטרה כשכל קשת עולה 1). מקורות: origins.json.
 * טהור; קשתות לא-מכוונות; מחיר שלילי ⇒ ערכו המוחלט.
 * @param {{edges: {a: 0|1|2|3|4|5, b: 0|1|2|3|4|5, w: number}[]}} spec
 * @param {0|1|2|3|4|5} from
 * @param {0|1|2|3|4|5} to
 * @returns {{cost: number, path: number[]} | null} null — אין דרך
 */
export function shortestPath(spec, from, to) {
  const adj = new Map();
  const add = (u, v, w) => { if (!adj.has(u)) adj.set(u, []); adj.get(u).push([v, w]); };
  for (const e of Array.isArray(spec?.edges) ? spec.edges : []) {
    const a = e?.a; const b = e?.b; const w = Math.abs(Number(e?.w));
    if (a == null || b == null || !Number.isFinite(w)) continue;
    add(a, b, w); add(b, a, w);
  }
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const done = new Set();
  for (;;) {
    let u; let best = Infinity;
    for (const [n, d] of dist) if (!done.has(n) && (d < best || (d === best && String(n) < String(u)))) { best = d; u = n; }
    if (u === undefined) return null;
    if (u === to) break;
    done.add(u);
    for (const [v, w] of adj.get(u) ?? []) {
      const nd = best + w;
      if (!dist.has(v) || nd < dist.get(v)) { dist.set(v, nd); prev.set(v, u); }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0]));
  return { cost: dist.get(to), path };
}
