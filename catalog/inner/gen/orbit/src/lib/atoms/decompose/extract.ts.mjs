// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/decompose/extract.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;
const CLOCK = /^([01]?\d|2[0-3]):[0-5]\d$/;
function momentOf(v) {
    if (typeof v !== 'string')
        return null;
    const s = v.trim();
    if (ISO_DAY.test(s) && Number.isFinite(Date.parse(s.slice(0, 10) + 'T12:00:00Z')))
        return s.length > 10 ? s : s.slice(0, 10);
    if (CLOCK.test(s))
        return s.padStart(5, '0');
    return null;
}
export function inner$momentOf$s(v) {
    const s = v.trim();
    return s;
}
export function inner$readPath$segs(path) {
    const segs = String(path ?? '')
        .split('.')
        .filter(Boolean);
    return segs;
}
export function inner$readPath$many(seg) {
    const many = seg.endsWith('[]');
    return many;
}
export function inner$readPath$key(seg) {
    const many = seg.endsWith('[]');
    const key = many ? seg.slice(0, -2) : seg;
    return key;
}
export function inner$readPath$key$$step(seg, many) {
    const key = many ? seg.slice(0, -2) : seg;
    return key;
}
export function inner$spanValue$m(v) {
    const m = momentOf(v);
    return m;
}
export function inner$extractUnsafe$path(spec) {
    const path = typeof spec.path === 'string' ? spec.path : '';
    return path;
}
export function inner$extractUnsafe$m(v) {
    const m = momentOf(v);
    return m;
}
export function inner$extractUnsafe$unit(spec) {
    const unit = spec.unit === 'clock' || spec.unit === 'number' ? spec.unit : 'date';
    return unit;
}
export function inner$extractUnsafe$to(spec) {
    const to = typeof spec.to === 'string' ? spec.to : '';
    return to;
}
export function inner$extractUnsafe$df(spec) {
    const df = typeof spec.dateField === 'string' ? spec.dateField : '';
    return df;
}
export function inner$extractUnsafe$g(by, k) {
    const g = by.get(String(k));
    return g;
}
export function inner$extractUnsafe$sinceKey(spec) {
    const sinceKey = typeof spec.since === 'string' ? spec.since : '';
    return sinceKey;
}

export const SIGS = {
  inner$momentOf$s: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$readPath$segs: [{"name":"path","d":{"t":"str"},"opt":false}],
  inner$readPath$many: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$readPath$key: [{"name":"seg","d":{"t":"str"},"opt":false}],
  inner$readPath$key$$step: [{"name":"seg","d":{"t":"str"},"opt":false},{"name":"many","d":{"t":"bool"},"opt":false}],
  inner$spanValue$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$extractUnsafe$path: [{"name":"spec","d":{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$extractUnsafe$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$extractUnsafe$unit: [{"name":"spec","d":{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$extractUnsafe$to: [{"name":"spec","d":{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$extractUnsafe$df: [{"name":"spec","d":{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
  inner$extractUnsafe$g: [{"name":"by","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"str"}}},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$extractUnsafe$sinceKey: [{"name":"spec","d":{"t":"obj","n":"ExtractSpec","p":[["entity",{"t":"str"},false],["where",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"bool"},{"t":"str"},{"t":"num"},{"t":"arr","of":{"t":"str"}}]}}]},true],["path",{"t":"str"},false],["kind",{"t":"lit","v":["amount","span","text","sequence","times","waiting"]},false],["to",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["unit",{"t":"or","of":[{"t":"lit","v":["number","date","clock"]},{"t":"undef"}]},true],["dateField",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["groupBy",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["field",{"t":"str"},false],["open",{"t":"arr","of":{"t":"str"}},false]]}]},true],["done",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["since",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["echo",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]},"opt":false}],
};
