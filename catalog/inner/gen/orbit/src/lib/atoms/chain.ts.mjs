// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/chain.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ROOT_VALUE = {
    'bookings.turnover:divide': 'slots',
    'bookings.nights:merge': 'windows',
    'bookings.arrivals:next': 'moments',
    'bookings.arrivals:offset': 'moments',
    'bookings.arrivals:round': 'moments',
    // FACTORY 14.10: סגירת הפער של C — גם מחשבון הזמנים ו"מה צריך?" נותנים פלט שאפשר לבנות עליו
    'zmanim.times:next': 'moments',
    'zmanim.times:offset': 'moments',
    'zmanim.times:round': 'moments',
    'zmanim.day:divide': 'slots',
    'whatNeed.openings:next': 'moments',
};
export function inner$rootValueOf$v(place, atom) {
    const v = ROOT_VALUE[place + ':' + atom];
    return v;
}
export function inner$parseCapId$root(id) {
    const [root, ...rest] = id.split('>');
    return root;
}
export function inner$parseCapId$rest(id) {
    const [root, ...rest] = id.split('>');
    return rest;
}
export function inner$parseCapId$seg(id) {
    const [root, ...rest] = id.split('>');
    const seg = root.split(':');
    return seg;
}
export function inner$parseCapId$seg$$step(root) {
    const seg = root.split(':');
    return seg;
}
export function inner$capStatus$byId(list) {
    const byId = new Map(list.map((c) => [c.id, c]));
    return byId;
}
export function inner$capStatus$up(list, cur) {
    const byId = new Map(list.map((c) => [c.id, c]));
    const up = byId.get(cur.parent);
    return up;
}
export function inner$capStatus$up$$step(byId, cur) {
    const up = byId.get(cur.parent);
    return up;
}
export function inner$childProblem$parent(cap, list) {
    const parent = list.find((c) => c.id === cap.parent);
    return parent;
}

export const SIGS = {
  inner$rootValueOf$v: [{"name":"place","d":{"t":"str"},"opt":false},{"name":"atom","d":{"t":"str"},"opt":false}],
  inner$parseCapId$root: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$parseCapId$rest: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$parseCapId$seg: [{"name":"id","d":{"t":"any"},"opt":false}],
  inner$parseCapId$seg$$step: [{"name":"root","d":{"t":"str"},"opt":false}],
  inner$capStatus$byId: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$capStatus$up: [{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"cur","d":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$capStatus$up$$step: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"cur","d":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$childProblem$parent: [{"name":"cap","d":{"t":"obj","n":"Pick","p":[["id",{"t":"str"},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"list","d":{"t":"arr","of":{"t":"obj","n":"Capability","p":[["id",{"t":"str"},false],["engine",{"t":"lit","v":["zmanim","whatNeed","bookings"]},false],["place",{"t":"str"},false],["atom",{"t":"lit","v":["divide","merge","next","round","offset","escalate","rotate","fuzzy"]},false],["params",{"t":"rec","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},false],["name",{"t":"str"},false],["parent",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
};
