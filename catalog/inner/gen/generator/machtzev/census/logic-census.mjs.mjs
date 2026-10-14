// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/census/logic-census.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const PRIM = new Set(['String', 'int', 'double', 'num', 'bool']);
function splitParams(s) {
    const out = [];
    let depth = 0, cur = '';
    s = s.replace(/[{}\[\]]/g, ' '); // שטוח את סמני-named/optional ⇒ פסיקי-הפרמטרים ברמה-עליונה
    for (const ch of s) {
        if (ch === '<' || ch === '(' || ch === '[' || ch === '{')
            depth++;
        else if (ch === '>' || ch === ')' || ch === ']' || ch === '}')
            depth--;
        if (ch === ',' && depth === 0) {
            out.push(cur.trim());
            cur = '';
        }
        else
            cur += ch;
    }
    if (cur.trim())
        out.push(cur.trim());
    return out;
}
const paramType = (p) => {
    const c = p.replace(/^\{|\}$/g, '').replace(/\brequired\b/g, '').trim();
    const m = c.match(/^([A-Za-z_][A-Za-z0-9_<>?,. ]*?)\s+[a-z_][A-Za-z0-9_]*(\s*=.*)?$/);
    return (m ? m[1] : c).trim();
};
const isPrim = (t) => PRIM.has(t.replace(/\?$/, ''));
export function inner$paramType$c(p) {
    const c = p.replace(/^\{|\}$/g, '').replace(/\brequired\b/g, '').trim();
    return c;
}
export function inner$paramType$m(p) {
    const c = p.replace(/^\{|\}$/g, '').replace(/\brequired\b/g, '').trim();
    const m = c.match(/^([A-Za-z_][A-Za-z0-9_<>?,. ]*?)\s+[a-z_][A-Za-z0-9_]*(\s*=.*)?$/);
    return m;
}
export function inner$paramType$m$$step(c) {
    const m = c.match(/^([A-Za-z_][A-Za-z0-9_<>?,. ]*?)\s+[a-z_][A-Za-z0-9_]*(\s*=.*)?$/);
    return m;
}
export function inner$isDisplayable$x(t) {
    const x = t.replace(/\?$/, '');
    return x;
}
export function inner$logicCensus$ret(ret0) {
    const ret = ret0.trim();
    return ret;
}
export function inner$logicCensus$params(paramStr) {
    const params = paramStr.trim() ? splitParams(paramStr).map(paramType) : [];
    return params;
}
export function inner$logicCensus$allPrim(paramStr) {
    const params = paramStr.trim() ? splitParams(paramStr).map(paramType) : [];
    const allPrim = params.length > 0 && params.every(isPrim);
    return allPrim;
}
export function inner$logicCensus$allPrim$$step(params) {
    const allPrim = params.length > 0 && params.every(isPrim);
    return allPrim;
}
export function inner$logicCensus$nonWirable(atoms) {
    const nonWirable = atoms.filter((a) => !a.wireable).length;
    return nonWirable;
}

export const SIGS = {
  inner$paramType$c: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$paramType$m: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$paramType$m$$step: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$isDisplayable$x: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$logicCensus$ret: [{"name":"ret0","d":{"t":"any"},"opt":false}],
  inner$logicCensus$params: [{"name":"paramStr","d":{"t":"any"},"opt":false}],
  inner$logicCensus$allPrim: [{"name":"paramStr","d":{"t":"any"},"opt":false}],
  inner$logicCensus$allPrim$$step: [{"name":"params","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$logicCensus$nonWirable: [{"name":"atoms","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
};
