// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/census/atom-census.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const NUM = new Set(['int', 'double', 'num']);
function fieldKind(ty) {
    const t = ty.replace(/\?$/, '');
    if (t === 'VoidCallback' || /^(ValueChanged|ValueSetter)</.test(t) || /Function/.test(t))
        return 'cb';
    if (t === 'Color' || /Tokens$/.test(t) || t === 'IconData')
        return 'style';
    if (t === 'Widget' || t === 'List<Widget>')
        return 'widget';
    const lm = t.match(/^List<([A-Za-z0-9<>]+)>$/);
    if (lm)
        return NUM.has(lm[1]) ? 'series' : 'list';
    if (t === 'String')
        return 'str';
    if (NUM.has(t))
        return 'num';
    if (t === 'bool')
        return 'bool';
    return 'other';
}
export function inner$walk$r(rel, e) {
    const r = rel + '/' + e.name;
    return r;
}
export function inner$fieldKind$t(ty) {
    const t = ty.replace(/\?$/, '');
    return t;
}
export function inner$fieldKind$lm(ty) {
    const t = ty.replace(/\?$/, '');
    const lm = t.match(/^List<([A-Za-z0-9<>]+)>$/);
    return lm;
}
export function inner$fieldKind$lm$$step(t) {
    const lm = t.match(/^List<([A-Za-z0-9<>]+)>$/);
    return lm;
}
export function inner$analyzeAtom$k(m) {
    const k = fieldKind(m[1]);
    return k;
}
export function inner$analyzeAtom$data(src) {
    const fields = [];
    for (const m of src.matchAll(/^\s*final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*(?:\s*,\s*[a-z][A-Za-z0-9_]*)*);/gm)) {
        const k = fieldKind(m[1]);
        for (const nm of m[2].split(',').map((s) => s.trim()))
            fields.push({ ty: m[1], nm, k });
    }
    const data = fields.filter((f) => ['str', 'num', 'bool', 'list', 'series', 'widget'].includes(f.k));
    return data;
}
export function inner$analyzeAtom$data$$step(fields) {
    const data = fields.filter((f) => ['str', 'num', 'bool', 'list', 'series', 'widget'].includes(f.k));
    return data;
}
export function inner$analyzeAtom$names(src) {
    const fields = [];
    for (const m of src.matchAll(/^\s*final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*(?:\s*,\s*[a-z][A-Za-z0-9_]*)*);/gm)) {
        const k = fieldKind(m[1]);
        for (const nm of m[2].split(',').map((s) => s.trim()))
            fields.push({ ty: m[1], nm, k });
    }
    const names = new Set(fields.map((f) => f.nm.toLowerCase()));
    return names;
}
export function inner$analyzeAtom$names$$step(fields) {
    const names = new Set(fields.map((f) => f.nm.toLowerCase()));
    return names;
}
export function inner$census$chrome(atoms) {
    const chrome = atoms.filter((a) => (a.caps || []).length === 1 && a.caps[0] === 'chrome');
    return chrome;
}
export function inner$census$zeroSeam(atoms) {
    const zeroSeam = atoms.filter((a) => a.seam === 'zero');
    return zeroSeam;
}
export function inner$analyzeAtom$fields$$after_loop(src) {
    const fields = [];
    for (const m of src.matchAll(/^\s*final ([A-Za-z0-9<>?]+) ([a-z][A-Za-z0-9_]*(?:\s*,\s*[a-z][A-Za-z0-9_]*)*);/gm)) {
        const k = fieldKind(m[1]);
        for (const nm of m[2].split(',').map((s) => s.trim()))
            fields.push({ ty: m[1], nm, k });
    }
    return fields;
}

export const SIGS = {
  inner$walk$r: [{"name":"rel","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$fieldKind$t: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$fieldKind$lm: [{"name":"ty","d":{"t":"any"},"opt":false}],
  inner$fieldKind$lm$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$analyzeAtom$k: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$analyzeAtom$data: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$analyzeAtom$data$$step: [{"name":"fields","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$analyzeAtom$names: [{"name":"src","d":{"t":"any"},"opt":false}],
  inner$analyzeAtom$names$$step: [{"name":"fields","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$census$chrome: [{"name":"atoms","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$census$zeroSeam: [{"name":"atoms","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$analyzeAtom$fields$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
