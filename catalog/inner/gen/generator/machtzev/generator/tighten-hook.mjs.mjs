// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/tighten-hook.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function unify(shapes) {
    const s = [...new Set(shapes)];
    if (!s.length)
        return '?';
    const nul = s.includes('null');
    const rest = s.filter((x) => x !== 'null');
    if (!rest.length)
        return 'null';
    let u;
    if (rest.length === 1)
        u = rest[0];
    else if (rest.every((x) => x === 'int' || x === 'double' || x === 'num'))
        u = 'num';
    else if (rest.every((x) => x.startsWith('List<'))) {
        const inner = unify(rest.map((x) => x.slice(5, -1)));
        u = 'List<' + (inner === '?' ? '?' : inner) + '>';
    }
    else if (rest.every((x) => x.startsWith('Map<String, '))) {
        const inner = unify(rest.map((x) => x.slice(12, -1)));
        u = 'Map<String, ' + (inner === '?' || inner === 'null' ? 'dynamic' : inner) + '>';
    }
    else if (rest.every((x) => x.startsWith('Function/')))
        u = 'Function/?';
    else
        u = 'dynamic';
    if (u === '?')
        return nul ? 'null' : '?';
    return nul && u !== 'dynamic' ? u + '?' : u;
}
export function inner$shape$vals(v) {
    const vals = Object.values(v);
    return vals;
}
export function inner$unify$nul(shapes) {
    const s = [...new Set(shapes)];
    const nul = s.includes('null');
    return nul;
}
export function inner$unify$nul$$step(s) {
    const nul = s.includes('null');
    return nul;
}
export function inner$unify$rest(shapes) {
    const s = [...new Set(shapes)];
    const rest = s.filter((x) => x !== 'null');
    return rest;
}
export function inner$unify$rest$$step(s) {
    const rest = s.filter((x) => x !== 'null');
    return rest;
}
export function inner$unify$inner(shapes) {
    const s = [...new Set(shapes)];
    const rest = s.filter((x) => x !== 'null');
    const inner = unify(rest.map((x) => x.slice(5, -1)));
    return inner;
}
export function inner$unify$inner$$step(rest) {
    const inner = unify(rest.map((x) => x.slice(5, -1)));
    return inner;
}
export function inner$unify$inner_L34(shapes) {
    const s = [...new Set(shapes)];
    const rest = s.filter((x) => x !== 'null');
    const inner = unify(rest.map((x) => x.slice(12, -1)));
    return inner;
}
export function inner$unify$inner_L34$$step(rest) {
    const inner = unify(rest.map((x) => x.slice(12, -1)));
    return inner;
}

export const SIGS = {
  inner$shape$vals: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$unify$nul: [{"name":"shapes","d":{"t":"any"},"opt":false}],
  inner$unify$nul$$step: [{"name":"s","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$unify$rest: [{"name":"shapes","d":{"t":"any"},"opt":false}],
  inner$unify$rest$$step: [{"name":"s","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$unify$inner: [{"name":"shapes","d":{"t":"any"},"opt":false}],
  inner$unify$inner$$step: [{"name":"rest","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$unify$inner_L34: [{"name":"shapes","d":{"t":"any"},"opt":false}],
  inner$unify$inner_L34$$step: [{"name":"rest","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
