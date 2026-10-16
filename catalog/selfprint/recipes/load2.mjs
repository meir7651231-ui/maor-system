/**
 * 📖 כרך ב׳ ⇒ שלדים (RECIPES2, 16.10.2026). טהור. אותו load.mjs › recipeShapes (גרסאות בלי חורים-אופציונליים), ועוד:
 *   · `{ $const: true }` ⇒ שלד נפרד לכל קבוע מהקוד שלנו (`consts` — selfprint.mjs › minedConsts), מזהה ‎…#<k>‎.
 *   · `minedConsts(shapes, minCount)` — הקבועים המספריים שבשלדים שהכורה קרא מהקוד (library-code.json), שמופיעים לפחות
 *     minCount פעמים, לפי שכיחות (ואז לפי ערך). הספר עצמו לא כותב אותם.
 */
import { recipeShapes } from './load.mjs';

const hasConst = (w) => (Array.isArray(w) ? w.some(hasConst) : w && typeof w === 'object' ? (w.$const === true && Object.keys(w).length === 1) || Object.values(w).some(hasConst) : false);
const subConst = (w, k) => (Array.isArray(w) ? w.map((x) => subConst(x, k)) : w && typeof w === 'object' ? (w.$const === true && Object.keys(w).length === 1 ? k : Object.fromEntries(Object.entries(w).map(([a, v]) => [a, subConst(v, k)]))) : w);

export function minedConsts(codeShapes, minCount = 5) {
  const cnt = new Map();
  const walk = (w) => { if (typeof w === 'number' && Number.isFinite(w)) cnt.set(w, (cnt.get(w) || 0) + 1); else if (Array.isArray(w)) w.forEach(walk); else if (w && typeof w === 'object') Object.values(w).forEach(walk); };
  for (const s of codeShapes) walk(s.graph.nodes);
  return [...cnt].filter(([, n]) => n >= minCount).sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([k]) => k);
}

/** כרך ב׳ ⇒ שלדים; כל שלד עם ‎$const‎ — פעם לכל קבוע (בסדר-השכיחות). */
export function recipeShapes2(recipes, consts) {
  const out = [];
  for (const s of recipeShapes(recipes)) {
    if (!hasConst(s.graph)) { out.push(s); continue; }
    for (const k of consts) out.push({ ...s, id: s.id + '#' + k, konst: k, graph: subConst(s.graph, k) });
  }
  return out;
}
