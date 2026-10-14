// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:yeshiva/shofet.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const GRAPH_FN = `
function reachCountRecs(recs: Array<Record<string, string>>, key: string, down: string[], up: string[], from: string): number {
  const succ = new Map<string, string[]>();
  const vals = (s: string): string[] => String(s ?? '').split(/[,;|]/).map((x) => x.split(':')[0].trim()).filter((x) => x.length > 0);
  for (const r of recs) {
    const me = String(r[key] ?? '').trim();
    for (const f of down) for (const v of vals(r[f])) { if (me.length > 0) { const l = succ.get(me) ?? []; l.push(v); succ.set(me, l); } }
    for (const f of up) for (const v of vals(r[f])) { if (me.length > 0) { const l = succ.get(v) ?? []; l.push(me); succ.set(v, l); } }
  }
  const g: Graph = { ids: [], type: new Map<string, string>(), succ: succ, pred: new Map<string, string[]>() };
  return reach(g, [from.trim()], 'down', new Set<string>()).size - 1;
}`;
export function inner$judge$r(j) {
    const r = JSON.parse(j.stdout);
    return r;
}
export function inner$graphEngineDart$src(g) {
    const src = g.match(/export interface Graph[\s\S]*?\n}\n/)[0] + g.match(/export function reach[\s\S]*?\n}\n/)[0] + GRAPH_FN;
    return src;
}
export function inner$graphEngineDart$code(H, body) {
    const code = `// 🔗 מנוע-התלות (systems-engine/sensors/graph.reach) — הומר אוטומטית מ-TS (emitTs). לא לערוך ביד: נוצר מחדש בכל בנייה.\n// ignore_for_file: type=lint, unused_element, dead_code, argument_type_not_assignable, for_in_of_invalid_type, invalid_assignment, non_bool_condition, non_bool_operand, non_bool_negation_expression, not_iterable_spread, return_of_invalid_type\n${H}\n${body}\n`;
    return code;
}

export const SIGS = {
  inner$judge$r: [{"name":"j","d":{"t":"any"},"opt":false}],
  inner$graphEngineDart$src: [{"name":"g","d":{"t":"any"},"opt":false}],
  inner$graphEngineDart$code: [{"name":"H","d":{"t":"any"},"opt":false},{"name":"body","d":{"t":"str"},"opt":false}],
};
