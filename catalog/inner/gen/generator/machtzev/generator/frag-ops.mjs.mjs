// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/frag-ops.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const guess = (v) => /^'\d{4}-\d{2}-\d{2}'$/.test(v) ? 'IsoDate' : /^'\d{2}:\d{2}'$/.test(v) ? 'TimeHM' : /^'[a-z]{1,3}\d+'$/.test(v) ? 'Id' : /^'/.test(v) ? 'string' : /^(true|false)$/.test(v) ? 'boolean' : /^-?\d/.test(v) ? 'number' : /^\[/.test(v) ? 'list' : /^\{/.test(v) ? 'map' : '?';
export function inner$keyTypes$g(kv) {
    const g = guess(kv[2].trim());
    return g;
}
export function inner$attribute$text(src, f) {
    const text = src[f.module].slice(f.range[0], f.range[1]).join('\n');
    return text;
}
export function inner$attribute$keys(src, kt, f) {
    const text = src[f.module].slice(f.range[0], f.range[1]).join('\n');
    const keys = [...new Set([...text.matchAll(/\['([a-zA-Z_]\w*)'\]/g)].map((m) => m[1]))].filter((k) => kt[f.module][k] && kt[f.module][k] !== '?');
    return keys;
}
export function inner$attribute$keys$$step(kt, f, text) {
    const keys = [...new Set([...text.matchAll(/\['([a-zA-Z_]\w*)'\]/g)].map((m) => m[1]))].filter((k) => kt[f.module][k] && kt[f.module][k] !== '?');
    return keys;
}

export const SIGS = {
  inner$keyTypes$g: [{"name":"kv","d":{"t":"any"},"opt":false}],
  inner$attribute$text: [{"name":"src","d":{"t":"obj","n":"src","p":[]},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$attribute$keys: [{"name":"src","d":{"t":"obj","n":"src","p":[]},"opt":false},{"name":"kt","d":{"t":"obj","n":"kt","p":[]},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$attribute$keys$$step: [{"name":"kt","d":{"t":"obj","n":"kt","p":[]},"opt":false},{"name":"f","d":{"t":"any"},"opt":false},{"name":"text","d":{"t":"any"},"opt":false}],
};
