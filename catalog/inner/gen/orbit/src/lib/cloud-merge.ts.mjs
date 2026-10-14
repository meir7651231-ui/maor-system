// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/cloud-merge.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const RID_UNION = { supporters: 'donations', enrollments: 'payments' };
function mergeDonationsPreserving(col, local, incoming) {
    const field = RID_UNION[col];
    if (!field)
        return incoming;
    if (col === 'enrollments') {
        const loc = Array.isArray(local[field]) ? local[field] : [];
        const inc = Array.isArray(incoming[field]) ? incoming[field] : [];
        const incRids = new Set(inc.map((d) => d && d.rid).filter(Boolean));
        const only = loc.filter((d) => d && d.rid && !incRids.has(d.rid));
        return only.length ? { ...incoming, [field]: [...inc, ...only] } : incoming;
    }
    const localDon = Array.isArray(local.donations) ? local.donations : [];
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const count = Math.max(num(incoming.count), num(local.count));
    const ils = Math.max(num(incoming.ils), num(local.ils));
    const usd = Math.max(num(incoming.usd), num(local.usd));
    // אם אין תרומה מקומית-בלבד והמונים לא גדלו — אין מה לשמר, הענן כמות-שהוא.
    if (localOnly.length === 0 && count === num(incoming.count) && ils === num(incoming.ils) && usd === num(incoming.usd)) {
        return incoming;
    }
    return { ...incoming, donations: [...incDon, ...localOnly], count, ils, usd };
}
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
export function inner$healRecord$listsOk(ayin) {
    const listsOk = Array.isArray(ayin.names) && Array.isArray(ayin.log) && Array.isArray(ayin.answers);
    return listsOk;
}
export function inner$mergeDonationsPreserving$loc(local, field) {
    const loc = Array.isArray(local[field]) ? local[field] : [];
    return loc;
}
export function inner$mergeDonationsPreserving$inc(incoming, field) {
    const inc = Array.isArray(incoming[field]) ? incoming[field] : [];
    return inc;
}
export function inner$mergeDonationsPreserving$incRids(incoming, field) {
    const inc = Array.isArray(incoming[field]) ? incoming[field] : [];
    const incRids = new Set(inc.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$incRids$$step(inc) {
    const incRids = new Set(inc.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$only(local, incoming, field) {
    const loc = Array.isArray(local[field]) ? local[field] : [];
    const inc = Array.isArray(incoming[field]) ? incoming[field] : [];
    const incRids = new Set(inc.map((d) => d && d.rid).filter(Boolean));
    const only = loc.filter((d) => d && d.rid && !incRids.has(d.rid));
    return only;
}
export function inner$mergeDonationsPreserving$only$$step(loc, incRids) {
    const only = loc.filter((d) => d && d.rid && !incRids.has(d.rid));
    return only;
}
export function inner$mergeDonationsPreserving$localDon(local) {
    const localDon = Array.isArray(local.donations) ? local.donations : [];
    return localDon;
}
export function inner$mergeDonationsPreserving$incDon(incoming) {
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    return incDon;
}
export function inner$mergeDonationsPreserving$incRids_L119(incoming) {
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$incRids_L119$$step(incDon) {
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    return incRids;
}
export function inner$mergeDonationsPreserving$localOnly(local, incoming) {
    const localDon = Array.isArray(local.donations) ? local.donations : [];
    const incDon = Array.isArray(incoming.donations) ? incoming.donations : [];
    const incRids = new Set(incDon.map((d) => d && d.rid).filter(Boolean));
    const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
    return localOnly;
}
export function inner$mergeDonationsPreserving$localOnly$$step(localDon, incRids) {
    const localOnly = localDon.filter((d) => d && d.rid && !incRids.has(d.rid));
    return localOnly;
}
export function inner$mergeDonationsPreserving$count(local, incoming) {
    const count = Math.max(num(incoming.count), num(local.count));
    return count;
}
export function inner$mergeDonationsPreserving$ils(local, incoming) {
    const ils = Math.max(num(incoming.ils), num(local.ils));
    return ils;
}
export function inner$mergeDonationsPreserving$usd(local, incoming) {
    const usd = Math.max(num(incoming.usd), num(local.usd));
    return usd;
}
export function inner$applyEntityPartial$deleted(docs) {
    const deleted = new Set(docs.filter((d) => d.deleted).map((d) => d.id));
    return deleted;
}
export function inner$applyEntityPartial$map$inc(incoming, x) {
    const inc = incoming.get(x.id);
    return inc;
}
export function inner$applyEntityPartial$map$merged(col, incoming, x) {
    const inc = incoming.get(x.id);
    const merged = mergeDonationsPreserving(col, x, inc);
    return merged;
}
export function inner$applyEntityPartial$map$merged$$step(col, x, inc) {
    const merged = mergeDonationsPreserving(col, x, inc);
    return merged;
}
export function inner$applyEntityPartial$next(incoming, kept) {
    const next = [...incoming.values(), ...kept];
    return next;
}
export function inner$sanitizeIncoming$out$$after_loop(item, fields) {
    let out = item;
    for (const f of fields ?? []) {
        if (!Array.isArray(out[f]))
            out = { ...out, [f]: [] };
    }
    return out;
}

export const SIGS = {
  inner$healRecord$listsOk: [{"name":"ayin","d":{"t":"or","of":[{"t":"undef"},{"t":"null"},{"t":"obj","n":"Partial","p":[["stage",{"t":"or","of":[{"t":"lit","v":["done","new","lead","eyes","answer"]},{"t":"undef"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["answeredNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paid",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["answerPushed",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["nextTalk",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["nextTalkTime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["lastTouch",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["names",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"AyinName","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["eyes",{"t":"or","of":[{"t":"lit","v":[""]},{"t":"num"}]},false],["done",{"t":"bool"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["days",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["deps",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true]]}}]},true],["answers",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"AyinAnswer","p":[["date",{"t":"str"},false],["note",{"t":"str"},false]]}}]},true],["log",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"AyinLog","p":[["date",{"t":"str"},false],["eyes",{"t":"num"},false],["name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["time",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"TimeEntry","p":[["date",{"t":"str"},false],["hours",{"t":"num"},false],["note",{"t":"str"},false],["rate",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["mat",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"MatEntry","p":[["name",{"t":"str"},false],["qty",{"t":"num"},false],["cost",{"t":"num"},false]]}}]},true],["kit",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"KitItem","p":[["label",{"t":"str"},false],["done",{"t":"bool"},false]]}}]},true],["boardEventIds",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}}]},true]]}]},"opt":false}],
  inner$mergeDonationsPreserving$loc: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$mergeDonationsPreserving$inc: [{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$mergeDonationsPreserving$incRids: [{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$mergeDonationsPreserving$incRids$$step: [{"name":"inc","d":{"t":"arr","of":{"t":"obj","p":[["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$mergeDonationsPreserving$only: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"field","d":{"t":"str"},"opt":false}],
  inner$mergeDonationsPreserving$only$$step: [{"name":"loc","d":{"t":"arr","of":{"t":"obj","p":[["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"incRids","d":{"t":"set","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}},"opt":false}],
  inner$mergeDonationsPreserving$localDon: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$incDon: [{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$incRids_L119: [{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$incRids_L119$$step: [{"name":"incDon","d":{"t":"arr","of":{"t":"obj","p":[["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$mergeDonationsPreserving$localOnly: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$localOnly$$step: [{"name":"localDon","d":{"t":"arr","of":{"t":"obj","p":[["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false},{"name":"incRids","d":{"t":"set","of":{"t":"or","of":[{"t":"undef"},{"t":"str"}]}},"opt":false}],
  inner$mergeDonationsPreserving$count: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$ils: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$mergeDonationsPreserving$usd: [{"name":"local","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"incoming","d":{"t":"rec","of":{"t":"any"}},"opt":false}],
  inner$applyEntityPartial$deleted: [{"name":"docs","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"any"},false],["deleted",{"t":"bool"},false]]}},"opt":false}],
  inner$applyEntityPartial$map$inc: [{"name":"incoming","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"x","d":{"t":"obj","p":[["id",{"t":"str"},false]]},"opt":false}],
  inner$applyEntityPartial$map$merged: [{"name":"col","d":{"t":"str"},"opt":false},{"name":"incoming","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"x","d":{"t":"obj","p":[["id",{"t":"str"},false]]},"opt":false}],
  inner$applyEntityPartial$map$merged$$step: [{"name":"col","d":{"t":"str"},"opt":false},{"name":"x","d":{"t":"obj","p":[["id",{"t":"str"},false]]},"opt":false},{"name":"inc","d":{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"any"}}]},"opt":false}],
  inner$applyEntityPartial$next: [{"name":"incoming","d":{"t":"map","k":{"t":"str"},"v":{"t":"rec","of":{"t":"any"}}},"opt":false},{"name":"kept","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false]]}},"opt":false}],
  inner$sanitizeIncoming$out$$after_loop: [{"name":"item","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"fields","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
