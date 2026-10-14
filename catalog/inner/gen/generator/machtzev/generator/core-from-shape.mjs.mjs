// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/core-from-shape.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const chanKind = (n) => /(^|[_-])(mail|email)([_-]|$)|mail/i.test(n) ? 'email' : /(^|[_-])(phone|tel|mobile|wa|whatsapp)([_-]|$)|phone/i.test(n) ? 'phone' : null;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nsOf = (e) => (e.match(/^(Tz|Shop|Ayin|Course|Family|Dial)/) || [null])[0];
export function inner$relationTarget$base(field) {
    const base = field.replace(/Id$/, '');
    return base;
}
export function inner$relationTarget$B(field) {
    const base = field.replace(/Id$/, '');
    const B = cap(base);
    return B;
}
export function inner$relationTarget$B$$step(base) {
    const B = cap(base);
    return B;
}
export function inner$relationTarget$lb(field) {
    const base = field.replace(/Id$/, '');
    const lb = base.toLowerCase();
    return lb;
}
export function inner$relationTarget$lb$$step(base) {
    const lb = base.toLowerCase();
    return lb;
}
export function inner$relationTarget$exact(ENTITIES, field) {
    const base = field.replace(/Id$/, '');
    const B = cap(base);
    const lb = base.toLowerCase();
    const exact = ENTITIES.find((x) => x === B || x.toLowerCase() === lb);
    return exact;
}
export function inner$relationTarget$exact$$step(ENTITIES, B, lb) {
    const exact = ENTITIES.find((x) => x === B || x.toLowerCase() === lb);
    return exact;
}
export function inner$relationTarget$ns(entity) {
    const ns = nsOf(entity);
    return ns;
}
export function inner$relationTarget$suffix(ENTITIES, field) {
    const base = field.replace(/Id$/, '');
    const B = cap(base);
    const suffix = ENTITIES.filter((x) => x.endsWith(B));
    return suffix;
}
export function inner$relationTarget$suffix$$step(ENTITIES, B) {
    const suffix = ENTITIES.filter((x) => x.endsWith(B));
    return suffix;
}
export function inner$relationTarget$sameNs(ENTITIES, entity, field) {
    const base = field.replace(/Id$/, '');
    const B = cap(base);
    const ns = nsOf(entity);
    const suffix = ENTITIES.filter((x) => x.endsWith(B));
    const sameNs = suffix.find((x) => ns && x.startsWith(ns));
    return sameNs;
}
export function inner$relationTarget$sameNs$$step(ns, suffix) {
    const sameNs = suffix.find((x) => ns && x.startsWith(ns));
    return sameNs;
}
export function inner$relationTarget$org(ENTITIES, field) {
    const base = field.replace(/Id$/, '');
    const B = cap(base);
    const suffix = ENTITIES.filter((x) => x.endsWith(B));
    const org = suffix.find((x) => x.startsWith('Org'));
    return org;
}
export function inner$relationTarget$org$$step(suffix) {
    const org = suffix.find((x) => x.startsWith('Org'));
    return org;
}
export function inner$relationTarget$pre(ENTITIES, field) {
    const base = field.replace(/Id$/, '');
    const lb = base.toLowerCase();
    const pre = ENTITIES.filter((x) => x.toLowerCase().startsWith(lb)).sort((a, b) => a.length - b.length);
    return pre;
}
export function inner$relationTarget$pre$$step(ENTITIES, lb) {
    const pre = ENTITIES.filter((x) => x.toLowerCase().startsWith(lb)).sort((a, b) => a.length - b.length);
    return pre;
}
export function inner$relationTarget$last(field) {
    const base = field.replace(/Id$/, '');
    const last = (base.match(/[A-Z][a-z0-9]*$/) || [])[0];
    return last;
}
export function inner$relationTarget$last$$step(base) {
    const last = (base.match(/[A-Z][a-z0-9]*$/) || [])[0];
    return last;
}
export function inner$relationTarget$sfx(ENTITIES, field) {
    const base = field.replace(/Id$/, '');
    const last = (base.match(/[A-Z][a-z0-9]*$/) || [])[0];
    const sfx = ENTITIES.filter((x) => x.endsWith(last));
    return sfx;
}
export function inner$relationTarget$sfx$$step(ENTITIES, last) {
    const sfx = ENTITIES.filter((x) => x.endsWith(last));
    return sfx;
}
export function inner$relationTarget$pick(ENTITIES, entity, field) {
    const base = field.replace(/Id$/, '');
    const ns = nsOf(entity);
    const last = (base.match(/[A-Z][a-z0-9]*$/) || [])[0];
    const sfx = ENTITIES.filter((x) => x.endsWith(last));
    const pick = sfx.find((x) => x.startsWith('Org')) || sfx.find((x) => ns && x.startsWith(ns)) || (sfx.length === 1 ? sfx[0] : null);
    return pick;
}
export function inner$relationTarget$pick$$step(ns, sfx) {
    const pick = sfx.find((x) => x.startsWith('Org')) || sfx.find((x) => ns && x.startsWith(ns)) || (sfx.length === 1 ? sfx[0] : null);
    return pick;
}
export function inner$core$term(TERMS, entity) {
    const term = TERMS.find((t) => t.entity === entity);
    return term;
}
export function inner$core$map$states(ENUMS, f) {
    const states = ENUMS[f.t] || (/'/.test(f.t) ? [...f.t.matchAll(/'([^']*)'/g)].map((m) => m[1]) : null);
    return states;
}
export function inner$core$events(fields) {
    const events = fields.filter((f) => /IsoDate/.test(f.t) && /(At|Date|date|start|end|expiry|due)$/i.test(f.n)).map((f) => ({ field: f.n, event: f.n.replace(/(At|Date)$/, '').replace(/^date$/, 'recorded') || 'recorded', optional: f.o }));
    return events;
}
export function inner$core$rules(ENUMS, fields, relations) {
    const rules = [
        ...fields.filter((f) => !f.o && f.n !== 'id' && !/\[\]$/.test(f.t)).map((f) => ({ kind: 'required', field: f.n })),
        ...fields.filter((f) => ENUMS[f.t] || /'\s*\|\s*'/.test(f.t)).map((f) => ({ kind: 'enum', field: f.n, values: ENUMS[f.t] || [...f.t.matchAll(/'([^']*)'/g)].map((m) => m[1]) })),
        ...relations.filter((r) => r.target).map((r) => ({ kind: 'ref', field: r.field, target: r.target })),
        ...(fields.some((f) => f.n === 'id') ? [{ kind: 'unique', field: 'id' }] : []),
    ];
    return rules;
}
export function inner$core$notification(fields) {
    const notification = fields.filter((f) => chanKind(f.n)).map((f) => ({ field: f.n, channel: chanKind(f.n) }));
    return notification;
}

export const SIGS = {
  inner$relationTarget$base: [{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$B: [{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$B$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$relationTarget$lb: [{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$lb$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$relationTarget$exact: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$exact$$step: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"B","d":{"t":"any"},"opt":false},{"name":"lb","d":{"t":"any"},"opt":false}],
  inner$relationTarget$ns: [{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$relationTarget$suffix: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$suffix$$step: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"B","d":{"t":"any"},"opt":false}],
  inner$relationTarget$sameNs: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$sameNs$$step: [{"name":"ns","d":{"t":"any"},"opt":false},{"name":"suffix","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$relationTarget$org: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$org$$step: [{"name":"suffix","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$relationTarget$pre: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$pre$$step: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"lb","d":{"t":"any"},"opt":false}],
  inner$relationTarget$last: [{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$last$$step: [{"name":"base","d":{"t":"any"},"opt":false}],
  inner$relationTarget$sfx: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$sfx$$step: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"last","d":{"t":"any"},"opt":false}],
  inner$relationTarget$pick: [{"name":"ENTITIES","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false},{"name":"field","d":{"t":"any"},"opt":false}],
  inner$relationTarget$pick$$step: [{"name":"ns","d":{"t":"any"},"opt":false},{"name":"sfx","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$core$term: [{"name":"TERMS","d":{"t":"any"},"opt":false},{"name":"entity","d":{"t":"any"},"opt":false}],
  inner$core$map$states: [{"name":"ENUMS","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]},"opt":false}],
  inner$core$events: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]}},"opt":false}],
  inner$core$rules: [{"name":"ENUMS","d":{"t":"any"},"opt":false},{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]}},"opt":false},{"name":"relations","d":{"t":"arr","of":{"t":"obj","p":[["target",{"t":"any"},false],["how",{"t":"str"},false],["field",{"t":"str"},false],["optional",{"t":"bool"},false]]}},"opt":false}],
  inner$core$notification: [{"name":"fields","d":{"t":"arr","of":{"t":"obj","p":[["e",{"t":"str"},false],["n",{"t":"str"},false],["o",{"t":"bool"},false],["t",{"t":"str"},false]]}},"opt":false}],
};
