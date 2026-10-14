// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/solaPull.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isOrgAdmin$email(tok) {
    const email = String(tok.email || '').toLowerCase();
    return email;
}
export function inner$isOrgAdmin$members(data) {
    const members = Array.isArray(data.members) ? data.members.map((x) => String(x).toLowerCase()) : [];
    return members;
}
export function inner$solaKey$tries(org) {
    const tries = org === 'root' ? ['root', 'maor-hachesed'] : [org];
    return tries;
}
export function inner$fetchSolaReport$bad(text) {
    const bad = /invalid field:?\s*([A-Za-z0-9_]+)/i.exec(text);
    return bad;
}
export function inner$fetchSolaReport$okMarker(json) {
    const okMarker = json.xResult === 'S' || /^success$/i.test(String(json.xStatus || ''));
    return okMarker;
}
export function inner$runSolaAudit$ref(r) {
    const ref = String(r.xRefNum || '');
    return ref;
}
export function inner$runSolaAudit$res(r) {
    const res = String(r.xResult || r.xResponseResult || r.xStatus || '');
    return res;
}
export function inner$runSolaAudit$c(d) {
    const c = String(d.currency || '?');
    return c;
}
export function inner$runSolaAudit$dt(d) {
    const dt = String(d.d || '');
    return dt;
}
export function inner$runSolaAudit$c_L293(d) {
    const c = String(d.currency || '?');
    return c;
}
export function inner$runSolaAudit$st(d) {
    const st = String(d.status || '?');
    return st;
}
export function inner$runSolaAudit$dt_L297(d) {
    const dt = String(d.d || '');
    return dt;
}
export function inner$runSolaAudit$missing(gwWrites, qIds) {
    const missing = [...gwWrites.keys()].filter((id) => !qIds.has(id));
    return missing;
}
export function inner$runSolaAudit$extra(gwWrites, qIds) {
    const extra = [...qIds].filter((id) => !gwWrites.has(id));
    return extra;
}
export function inner$runSolaAudit$curKeys(gwWrites, gwRaw, voided, notApproved, q) {
    const gw = { raw: gwRaw, eligible: gwWrites.size, notApproved, voided, byCur: {}, first: '', last: '' };
    for (const d of gwWrites.values()) {
        const c = String(d.currency || '?');
        gw.byCur[c] = Math.round(((gw.byCur[c] || 0) + Number(d.amount || 0)) * 100) / 100;
        const dt = String(d.d || '');
        if (dt && (!gw.first || dt < gw.first))
            gw.first = dt;
        if (dt > gw.last)
            gw.last = dt;
    }
    const curKeys = new Set([...Object.keys(gw.byCur), ...Object.keys(q.byCur)]);
    return curKeys;
}
export function inner$runSolaAudit$curKeys$$step(gw, q) {
    const curKeys = new Set([...Object.keys(gw.byCur), ...Object.keys(q.byCur)]);
    return curKeys;
}
export function inner$runSolaAudit$sumsMatch(gwWrites, gwRaw, voided, notApproved, q) {
    const gw = { raw: gwRaw, eligible: gwWrites.size, notApproved, voided, byCur: {}, first: '', last: '' };
    for (const d of gwWrites.values()) {
        const c = String(d.currency || '?');
        gw.byCur[c] = Math.round(((gw.byCur[c] || 0) + Number(d.amount || 0)) * 100) / 100;
        const dt = String(d.d || '');
        if (dt && (!gw.first || dt < gw.first))
            gw.first = dt;
        if (dt > gw.last)
            gw.last = dt;
    }
    const curKeys = new Set([...Object.keys(gw.byCur), ...Object.keys(q.byCur)]);
    const sumsMatch = [...curKeys].every((k) => (gw.byCur[k] || 0) === (q.byCur[k] || 0));
    return sumsMatch;
}
export function inner$runSolaAudit$sumsMatch$$step(gw, q, curKeys) {
    const sumsMatch = [...curKeys].every((k) => (gw.byCur[k] || 0) === (q.byCur[k] || 0));
    return sumsMatch;
}
export function inner$runSolaPull$byId(writes) {
    const byId = new Map(writes.map((w) => [w.id, w]));
    return byId;
}
export function inner$runSolaPull$w(writes, s) {
    const byId = new Map(writes.map((w) => [w.id, w]));
    const w = byId.get(s.id);
    return w;
}
export function inner$runSolaPull$w$$step(byId, s) {
    const w = byId.get(s.id);
    return w;
}
export function inner$runSolaPull$nv(writes, s, f) {
    const byId = new Map(writes.map((w) => [w.id, w]));
    const w = byId.get(s.id);
    const nv = String((w && w.data[f]) || '').trim();
    return nv;
}
export function inner$runSolaPull$nv$$step(w, f) {
    const nv = String((w && w.data[f]) || '').trim();
    return nv;
}
export function inner$runSolaPull$fresh(writes, existing) {
    const fresh = writes.filter((w) => !existing.has(w.id));
    return fresh;
}
export function inner$runSolaPull$slice(writes, existing, i) {
    const fresh = writes.filter((w) => !existing.has(w.id));
    const slice = fresh.slice(i, i + 400);
    return slice;
}
export function inner$runSolaPull$slice$$step(fresh, i) {
    const slice = fresh.slice(i, i + 400);
    return slice;
}
export function inner$runSolaPull$slice_L393(enrichSets, i) {
    const slice = enrichSets.slice(i, i + 400);
    return slice;
}
export function inner$runSolaPull$clamped(we, lastDateIso) {
    const clamped = lastDateIso > we ? we : lastDateIso;
    return clamped;
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
export function inner$onRequest$vaultRaw(req) {
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const vaultRaw = String(p.vault ?? '').trim();
    return vaultRaw;
}
export function inner$onRequest$vaultRaw$$step(p) {
    const vaultRaw = String(p.vault ?? '').trim();
    return vaultRaw;
}
export function inner$onRequest$vaultOrg(req) {
    const p = { ...(req.query ?? {}), ...(req.body ?? {}) };
    const org = String(p.org ?? '').trim();
    const vaultRaw = String(p.vault ?? '').trim();
    const vaultOrg = org === 'root' && /^[a-z0-9-]{2,40}$/.test(vaultRaw) ? vaultRaw : org;
    return vaultOrg;
}
export function inner$onRequest$vaultOrg$$step(org, vaultRaw) {
    const vaultOrg = org === 'root' && /^[a-z0-9-]{2,40}$/.test(vaultRaw) ? vaultRaw : org;
    return vaultOrg;
}
export function inner$onRequest$error(ambiguous) {
    const error = ambiguous ? 'כמה כספות עם xKey: ' + ambiguous.join(', ') : 'אין xKey בכספת';
    return error;
}
export function inner$runSolaAudit$gw$$after_loop(gwWrites, gwRaw, voided, notApproved) {
    const gw = { raw: gwRaw, eligible: gwWrites.size, notApproved, voided, byCur: {}, first: '', last: '' };
    for (const d of gwWrites.values()) {
        const c = String(d.currency || '?');
        gw.byCur[c] = Math.round(((gw.byCur[c] || 0) + Number(d.amount || 0)) * 100) / 100;
        const dt = String(d.d || '');
        if (dt && (!gw.first || dt < gw.first))
            gw.first = dt;
        if (dt > gw.last)
            gw.last = dt;
    }
    return gw;
}
export function inner$runSolaPull$fill$$after_loop(writes, s, cur) {
    const byId = new Map(writes.map((w) => [w.id, w]));
    const w = byId.get(s.id);
    const fill = {};
    for (const f of ['phone', 'email', 'name']) {
        const nv = String((w && w.data[f]) || '').trim();
        if (nv && !String(cur[f] || '').trim())
            fill[f] = nv;
    }
    return fill;
}

export const SIGS = {
  inner$isOrgAdmin$email: [{"name":"tok","d":{"t":"any"},"opt":false}],
  inner$isOrgAdmin$members: [{"name":"data","d":{"t":"any"},"opt":false}],
  inner$solaKey$tries: [{"name":"org","d":{"t":"any"},"opt":false}],
  inner$fetchSolaReport$bad: [{"name":"text","d":{"t":"str"},"opt":false}],
  inner$fetchSolaReport$okMarker: [{"name":"json","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$ref: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$res: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$c: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$dt: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$c_L293: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$st: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$dt_L297: [{"name":"d","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$missing: [{"name":"gwWrites","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"qIds","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$runSolaAudit$extra: [{"name":"gwWrites","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"qIds","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$runSolaAudit$curKeys: [{"name":"gwWrites","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"gwRaw","d":{"t":"num"},"opt":false},{"name":"voided","d":{"t":"num"},"opt":false},{"name":"notApproved","d":{"t":"num"},"opt":false},{"name":"q","d":{"t":"obj","p":[["count",{"t":"any"},false],["byCur",{"t":"obj","p":[]},false],["byStatus",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false}],
  inner$runSolaAudit$curKeys$$step: [{"name":"gw","d":{"t":"obj","p":[["raw",{"t":"num"},false],["eligible",{"t":"num"},false],["notApproved",{"t":"num"},false],["voided",{"t":"num"},false],["byCur",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false},{"name":"q","d":{"t":"obj","p":[["count",{"t":"any"},false],["byCur",{"t":"obj","p":[]},false],["byStatus",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false}],
  inner$runSolaAudit$sumsMatch: [{"name":"gwWrites","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"gwRaw","d":{"t":"num"},"opt":false},{"name":"voided","d":{"t":"num"},"opt":false},{"name":"notApproved","d":{"t":"num"},"opt":false},{"name":"q","d":{"t":"obj","p":[["count",{"t":"any"},false],["byCur",{"t":"obj","p":[]},false],["byStatus",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false}],
  inner$runSolaAudit$sumsMatch$$step: [{"name":"gw","d":{"t":"obj","p":[["raw",{"t":"num"},false],["eligible",{"t":"num"},false],["notApproved",{"t":"num"},false],["voided",{"t":"num"},false],["byCur",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false},{"name":"q","d":{"t":"obj","p":[["count",{"t":"any"},false],["byCur",{"t":"obj","p":[]},false],["byStatus",{"t":"obj","p":[]},false],["first",{"t":"str"},false],["last",{"t":"str"},false]]},"opt":false},{"name":"curKeys","d":{"t":"set","of":{"t":"str"}},"opt":false}],
  inner$runSolaPull$byId: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false}],
  inner$runSolaPull$w: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$runSolaPull$w$$step: [{"name":"byId","d":{"t":"map","k":{"t":"str"},"v":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
  inner$runSolaPull$nv: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"str"},"opt":false}],
  inner$runSolaPull$nv$$step: [{"name":"w","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}]},"opt":false},{"name":"f","d":{"t":"str"},"opt":false}],
  inner$runSolaPull$fresh: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"existing","d":{"t":"set","of":{"t":"any"}},"opt":false}],
  inner$runSolaPull$slice: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"existing","d":{"t":"set","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$runSolaPull$slice$$step: [{"name":"fresh","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$runSolaPull$slice_L393: [{"name":"enrichSets","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$runSolaPull$clamped: [{"name":"we","d":{"t":"str"},"opt":false},{"name":"lastDateIso","d":{"t":"str"},"opt":false}],
  inner$onRequest$org: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$org$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$onRequest$bearer: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultRaw: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultRaw$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultOrg: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$onRequest$vaultOrg$$step: [{"name":"org","d":{"t":"str"},"opt":false},{"name":"vaultRaw","d":{"t":"str"},"opt":false}],
  inner$onRequest$error: [{"name":"ambiguous","d":{"t":"any"},"opt":false}],
  inner$runSolaAudit$gw$$after_loop: [{"name":"gwWrites","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"gwRaw","d":{"t":"num"},"opt":false},{"name":"voided","d":{"t":"num"},"opt":false},{"name":"notApproved","d":{"t":"num"},"opt":false}],
  inner$runSolaPull$fill$$after_loop: [{"name":"writes","d":{"t":"arr","of":{"t":"obj","p":[["id",{"t":"str"},false],["data",{"t":"rec","of":{"t":"any"}},false]]}},"opt":false},{"name":"s","d":{"t":"any"},"opt":false},{"name":"cur","d":{"t":"any"},"opt":false}],
};
