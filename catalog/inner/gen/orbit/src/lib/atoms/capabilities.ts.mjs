// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/capabilities.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const CAP_NAME_MAX = 60;
const ATOM_SHORT = {
    divide: 'חלוקה',
    merge: 'חיבור צמודים',
    next: 'הבא בתור',
    round: 'עיגול',
    offset: 'הזזת זמן',
    escalate: 'העברה הלאה',
    rotate: 'תורות',
    fuzzy: 'חיפוש עם טעויות',
};
export function inner$suggestedChildName$key(p) {
    const key = p ? p.place + ':' + p.atoms.join('>') : '';
    return key;
}
export function inner$cleanParams$src(raw) {
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return src;
}
export function inner$cleanParams$n(v) {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    return n;
}
export function inner$validChild$parent(c) {
    const parent = typeof c.parent === 'string' ? c.parent : '';
    return parent;
}
export function inner$validChild$name(c, a) {
    const name = (typeof c.name === 'string' ? c.name.trim() : '').slice(0, CAP_NAME_MAX) || 'מנוע ' + ATOM_SHORT[a.id];
    return name;
}
export function inner$withCapability$i(cap, cur) {
    const i = cur.findIndex((c) => c.id === cap.id);
    return i;
}
export function inner$withCapability$next(cur) {
    const next = cur.slice();
    return next;
}
export function inner$withoutCapability$cap(id, cur) {
    const cap = cur.find((c) => c.id === id);
    return cap;
}

export const SIGS = {
  inner$suggestedChildName$key: [{"name":"p","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"ParsedCapId","p":[["root",{"t":"str"},false],["engine",{"t":"str"},false],["place",{"t":"str"},false],["atoms",{"t":"arr","of":{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]}},false]]}]},"opt":false}],
  inner$cleanParams$src: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$cleanParams$n: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$validChild$parent: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["id",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["engine",{"t":"or","of":[{"t":"lit","v":["zmanim","whatNeed","bookings"]},{"t":"undef"}]},true],["place",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true],["params",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}}]},true],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$validChild$name: [{"name":"c","d":{"t":"obj","n":"Partial","p":[["id",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["engine",{"t":"or","of":[{"t":"lit","v":["zmanim","whatNeed","bookings"]},{"t":"undef"}]},true],["place",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["atom",{"t":"or","of":[{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},{"t":"undef"}]},true],["params",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}}]},true],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"a","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"AtomCard","p":[["id",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["from",{"t":"obj","p":[["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["num",{"t":"num"},false]]},false],["computes",{"t":"str"},false],["worksOn",{"t":"arr","of":{"t":"lit","v":["amount","span","text","sequence","times","waiting"]}},false],["question",{"t":"str"},false],["details",{"t":"arr","of":{"t":"obj","n":"Detail","p":[["id",{"t":"str"},false],["label",{"t":"str"},false],["type",{"t":"lit","v":["number","minutes","choice"]},false],["choices",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["label",{"t":"str"},false]]}}]},true],["min",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["max",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["default",{"t":"or","of":[{"t":"str"},{"t":"num"}]},false]]}},false]]}]},"opt":false}],
  inner$withCapability$i: [{"name":"cap","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"cur","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$withCapability$next: [{"name":"cur","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$withoutCapability$cap: [{"name":"id","d":{"t":"str"},"opt":false},{"name":"cur","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
};
