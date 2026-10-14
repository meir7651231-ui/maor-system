/**
 * 🔥 מתפשט (spread) — בכל צעד, מה שנגע עובר לכל השכנים הישירים: גל שמתרחב טבעת אחרי טבעת.
 * הליבה בלי עולם של: reachWithin של בנייה-חכמה (כל מה שמגיעים אליו ב-N קפיצות, חזית שמתרחבת), אש שעוברת מעץ לעץ.
 * מקורות: origins.json. טהור; קשתות לא-מכוונות.
 * @param {{edges: {a: 0|1|2|3|4|5|6|7, b: 0|1|2|3|4|5|6|7}[], sources: (0|1|2|3|4|5|6|7)[]}} spec
 * @param {number} steps
 * @returns {number[]} מי שנגעו בהם אחרי `steps` צעדים, ממוינים
 */
export function spread(spec, steps) {
  const adj = new Map();
  const add = (u, v) => { if (!adj.has(u)) adj.set(u, new Set()); adj.get(u).add(v); };
  for (const e of Array.isArray(spec?.edges) ? spec.edges : []) { if (e?.a == null || e?.b == null) continue; add(e.a, e.b); add(e.b, e.a); }
  const seen = new Set(Array.isArray(spec?.sources) ? spec.sources.filter((s) => s != null) : []);
  let frontier = [...seen];
  const n = Math.min(64, Math.floor(Math.abs(Number(steps) || 0)));
  for (let k = 0; k < n && frontier.length; k++) {
    const next = [];
    for (const u of frontier) for (const v of adj.get(u) ?? []) if (!seen.has(v)) { seen.add(v); next.push(v); }
    frontier = next;
  }
  return [...seen].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
