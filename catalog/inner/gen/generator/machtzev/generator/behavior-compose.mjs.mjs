// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/behavior-compose.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const NEED_ARITY = { 'phone.fmtSafe': 1 };
export function inner$camel$last(id) {
    const last = id.split('.').pop();
    return last;
}
export function inner$walk$at(CENSUS, v) {
    const at = CENSUS.get(v.id + '@' + v.file) || CENSUS.get(v.id) || [];
    return at;
}
export function inner$forEach$env(ex) {
    const env = (ex[2] && typeof ex[2] === 'object') ? ex[2] : {};
    return env;
}
export function inner$forEach$hn(h) {
    const hn = typeof h === 'string' ? h : h.name;
    return hn;
}
export function inner$forEach$wInit(need) {
    const wInit = need.world ? (need.world.init || '<dynamic>[]') : null;
    return wInit;
}
export function inner$N$ps(id) {
    const n = (NEED_ARITY[id] ?? 1);
    const ps = Array.from({ length: n }, (_, i) => 'a' + i).join(', ');
    return ps;
}
export function inner$N$ps$$step(n) {
    const ps = Array.from({ length: n }, (_, i) => 'a' + i).join(', ');
    return ps;
}

export const SIGS = {
  inner$camel$last: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$walk$at: [{"name":"CENSUS","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$forEach$env: [{"name":"ex","d":{"t":"any"},"opt":false}],
  inner$forEach$hn: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$forEach$wInit: [{"name":"need","d":{"t":"any"},"opt":false}],
  inner$N$ps: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$N$ps$$step: [{"name":"n","d":{"t":"any"},"opt":false}],
};
