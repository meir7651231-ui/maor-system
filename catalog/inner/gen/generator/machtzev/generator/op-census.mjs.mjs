// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/op-census.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const STYLE = new Set(['tone', 'size', 'color', 'colour', 'glyph', 'icon', 'emoji', 'accent', 'seed', 'width', 'height', 'padding', 'margin',
    'radius', 'dense', 'compact', 'elevated', 'grad', 'fillAlpha', 'fontWeight', 'verticalPadding', 'align', 'animate', 'duration', 'key', 'trailing', 'leading']);
const isStyle = (x) => STYLE.has(x) || /(Color|Colour|Radius|Alpha|Weight|Padding|Size|Style|Opacity|Elevation)$/.test(x);
export function inner$sockets$m(cls, src) {
    const m = src.match(new RegExp(`\\bclass\\s+${cls}\\b[\\s\\S]*?(?=\\n(?:abstract\\s+)?class\\s+|$)`));
    return m;
}
export function inner$sockets$s(region) {
    const s = new Set([...region.matchAll(/\bthis\.([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1]));
    return s;
}
export function inner$classifyForge$D(m) {
    const s = m.sig || {};
    const D = [m.fieldSlots ? 'fields' : null, m.items ? 'items' : null, m.columns ? 'columns' : null, m.values ? 'values' : null, m.control || s.input ? 'onChanged' : null, m.actions ? 'onTap' : null, m.child ? 'child' : null].filter(Boolean);
    return D;
}
export function inner$classifyForge$D$$step(m, s) {
    const D = [m.fieldSlots ? 'fields' : null, m.items ? 'items' : null, m.columns ? 'columns' : null, m.values ? 'values' : null, m.control || s.input ? 'onChanged' : null, m.actions ? 'onTap' : null, m.child ? 'child' : null].filter(Boolean);
    return D;
}
export function inner$classifyForge$all(m, real) {
    const s = m.sig || {};
    const D = [m.fieldSlots ? 'fields' : null, m.items ? 'items' : null, m.columns ? 'columns' : null, m.values ? 'values' : null, m.control || s.input ? 'onChanged' : null, m.actions ? 'onTap' : null, m.child ? 'child' : null].filter(Boolean);
    const all = [...D, ...real.filter((x) => !D.includes(x))];
    return all;
}
export function inner$classifyForge$all$$step(D, real) {
    const all = [...D, ...real.filter((x) => !D.includes(x))];
    return all;
}
export function inner$classifyForge$fallback(hits) {
    const op = hits[0] || 'panel';
    const fallback = hits.length <= 1 && op === 'panel';
    return fallback;
}
export function inner$classifyForge$fallback$$step(hits, op) {
    const fallback = hits.length <= 1 && op === 'panel';
    return fallback;
}
export function inner$classifyDisplay$fm(FORGE, a) {
    const fm = /^dart-forge-bs\//.test(a.file) ? FORGE.get(a.id) : null;
    return fm;
}
export function inner$classifyDisplay$data(all) {
    const data = all.filter((x) => !isStyle(x));
    return data;
}
export function inner$classifyDisplay$structural(all) {
    const structural = all.filter((x) => /^(child|children|body|content)$/.test(x));
    return structural;
}
export function inner$classifyDisplay$D(all) {
    const data = all.filter((x) => !isStyle(x));
    const structural = all.filter((x) => /^(child|children|body|content)$/.test(x));
    const D = new Set(data.length ? data : structural);
    return D;
}
export function inner$classifyDisplay$D$$step(data, structural) {
    const D = new Set(data.length ? data : structural);
    return D;
}
export function inner$classifyLogic$e(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    return e;
}
export function inner$classifyLogic$ret(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const ret = String(e.ret || a.ret || 'dynamic');
    return ret;
}
export function inner$classifyLogic$ret$$step(a, e) {
    const ret = String(e.ret || a.ret || 'dynamic');
    return ret;
}
export function inner$classifyLogic$params(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    return params;
}
export function inner$classifyLogic$params$$step(a, e) {
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    return params;
}
export function inner$classifyLogic$ho(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    const ho = params.some((p) => /Function/.test(p));
    return ho;
}
export function inner$classifyLogic$ho$$step(params) {
    const ho = params.some((p) => /Function/.test(p));
    return ho;
}
export function inner$classifyLogic$temporal(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const ret = String(e.ret || a.ret || 'dynamic');
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    const temporal = params.some((p) => /DateTime/.test(p)) || /DateTime/.test(ret);
    return temporal;
}
export function inner$classifyLogic$temporal$$step(ret, params) {
    const temporal = params.some((p) => /DateTime/.test(p)) || /DateTime/.test(ret);
    return temporal;
}
export function inner$classifyLogic$listIn(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    const listIn = params.some((p) => /^List|^Iterable/.test(p));
    return listIn;
}
export function inner$classifyLogic$listIn$$step(params) {
    const listIn = params.some((p) => /^List|^Iterable/.test(p));
    return listIn;
}
export function inner$classifyLogic$flags(lcByName, a) {
    const e = lcByName.get(a.id) || {};
    const ret = String(e.ret || a.ret || 'dynamic');
    const params = Array.isArray(e.params) ? e.params : (a.params ? String(a.params).replace(/^\[|\]$/g, '').split(/', '/).map((s) => s.replace(/^'|'$/g, '')) : []);
    const ho = params.some((p) => /Function/.test(p));
    const temporal = params.some((p) => /DateTime/.test(p)) || /DateTime/.test(ret);
    const listIn = params.some((p) => /^List|^Iterable/.test(p));
    const flags = [ho && 'ho', temporal && 'temporal', listIn && 'listIn'].filter(Boolean);
    return flags;
}
export function inner$classifyLogic$flags$$step(ho, temporal, listIn) {
    const flags = [ho && 'ho', temporal && 'temporal', listIn && 'listIn'].filter(Boolean);
    return flags;
}
export function inner$dataAtoms$map$kind(f) {
    const kind = /-terms\.dart$/.test(f) ? 'terms' : /-sockets\.dart$/.test(f) ? 'sockets' : /-strings\.dart$/.test(f) ? 'strings' : 'table';
    return kind;
}
export function inner$unindexedDisplay$indexed(IDX) {
    const indexed = new Set(IDX.filter((a) => a.layer === 'display').map((a) => a.file));
    return indexed;
}
export function inner$unindexedDisplay$classes(src) {
    const classes = [...src.matchAll(/^\s*class\s+([A-Z]\w*)\s+extends\s+Stat(?:eless|eful)Widget/gm)].map((m) => m[1]);
    return classes;
}

export const SIGS = {
  inner$sockets$m: [{"name":"cls","d":{"t":"any"},"opt":false},{"name":"src","d":{"t":"any"},"opt":false}],
  inner$sockets$s: [{"name":"region","d":{"t":"any"},"opt":false}],
  inner$classifyForge$D: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$classifyForge$D$$step: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$classifyForge$all: [{"name":"m","d":{"t":"any"},"opt":false},{"name":"real","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyForge$all$$step: [{"name":"D","d":{"t":"arr","of":{"t":"or","of":[{"t":"null"},{"t":"str"}]}},"opt":false},{"name":"real","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyForge$fallback: [{"name":"hits","d":{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"fn"}]}},"opt":false}],
  inner$classifyForge$fallback$$step: [{"name":"hits","d":{"t":"arr","of":{"t":"or","of":[{"t":"str"},{"t":"fn"}]}},"opt":false},{"name":"op","d":{"t":"or","of":[{"t":"str"},{"t":"fn"}]},"opt":false}],
  inner$classifyDisplay$fm: [{"name":"FORGE","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyDisplay$data: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyDisplay$structural: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyDisplay$D: [{"name":"all","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyDisplay$D$$step: [{"name":"data","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"structural","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$classifyLogic$e: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$ret: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$ret$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$params: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$params$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$ho: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$ho$$step: [{"name":"params","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$temporal: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$temporal$$step: [{"name":"ret","d":{"t":"str"},"opt":false},{"name":"params","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$listIn: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$listIn$$step: [{"name":"params","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$flags: [{"name":"lcByName","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$classifyLogic$flags$$step: [{"name":"ho","d":{"t":"any"},"opt":false},{"name":"temporal","d":{"t":"any"},"opt":false},{"name":"listIn","d":{"t":"any"},"opt":false}],
  inner$dataAtoms$map$kind: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$unindexedDisplay$indexed: [{"name":"IDX","d":{"t":"any"},"opt":false}],
  inner$unindexedDisplay$classes: [{"name":"src","d":{"t":"any"},"opt":false}],
};
