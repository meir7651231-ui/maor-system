// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/nedarimPull.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isOrgAdmin$email(tok) {
    const email = String(tok.email || '').toLowerCase();
    return email;
}
export function inner$isOrgAdmin$members(data) {
    const members = Array.isArray(data.members) ? data.members.map((x) => String(x).toLowerCase()) : [];
    return members;
}
export function inner$nedarimCreds$ownsGlobal(org, globalOwner) {
    const ownsGlobal = !!globalOwner && org === globalOwner;
    return ownsGlobal;
}
export function inner$runNedarimPull$fresh(writes, existing) {
    const fresh = writes.filter((w) => !existing.has(w.id));
    return fresh;
}
export function inner$runNedarimPull$slice(writes, existing, i) {
    const fresh = writes.filter((w) => !existing.has(w.id));
    const slice = fresh.slice(i, i + 400);
    return slice;
}
export function inner$runNedarimPull$slice$$step(fresh, i) {
    const slice = fresh.slice(i, i + 400);
    return slice;
}
export function inner$onRequest$org(req) {
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const org = String(p.org ?? '').trim();
    return org;
}
export function inner$onRequest$org$$step(p) {
    const org = String(p.org ?? '').trim();
    return org;
}
export function inner$onRequest$bearer(req) {
    const bearer = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
    return bearer;
}

export const SIGS = {
  inner$isOrgAdmin$email: [{"name":"tok","d":{"t":"any"},"opt":false}],
  inner$isOrgAdmin$members: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$nedarimCreds$ownsGlobal: [{"name":"org","d":{"t":"any"},"opt":false},{"name":"globalOwner","d":{"t":"any"},"opt":false}],
  inner$runNedarimPull$fresh: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"existing","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$runNedarimPull$slice: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"existing","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$runNedarimPull$slice$$step: [{"name":"fresh","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$onRequest$org: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$org$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$onRequest$bearer: [{"name":"req","d":{"t":"any"},"opt":false}],
};
