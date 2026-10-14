// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/run-audit.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const digits = (x) => (x || '').replace(/\D/g, '');
const members = (f) => (Array.isArray(f.members) ? f.members : []);
export function inner$runAudit$d(p) {
    const d = digits(p);
    return d;
}
export function inner$runAudit$d_L32(idn) {
    const d = digits(idn);
    return d;
}
export function inner$runAudit$key(g2, k) {
    const a = [...new Set(g2[k])];
    const key = a.map((f) => f.id).sort().join();
    return key;
}
export function inner$runAudit$key$$step(a) {
    const key = a.map((f) => f.id).sort().join();
    return key;
}
export function inner$runAudit$d_L61(idn) {
    const d = digits(idn);
    return d;
}
export function inner$runAudit$single(T2, f) {
    const single = f.maritalStatus === T2.k24 || f.maritalStatus === T2.k25 || f.maritalStatus === T2.k26;
    return single;
}
export function inner$runAudit$kk(m) {
    const kk = m.first + '|' + (m.birth || '');
    return kk;
}
export function inner$runAudit$paid(e) {
    const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0);
    return paid;
}
export function inner$runAudit$fam(db, e) {
    const famByMember = new Map();
    for (const f of (Array.isArray(db.families) ? db.families : []))
        for (const m of members(f))
            famByMember.set(m.id, f);
    const fam = famByMember.get(e.memberId);
    return fam;
}
export function inner$runAudit$fam$$step(famByMember, e) {
    const fam = famByMember.get(e.memberId);
    return fam;
}
export function inner$runAudit$sp(db, supByName, k) {
    const sp = db.supporters.find((x) => x.id === supByName[k][0]);
    return sp;
}
export function inner$runAudit$famByMember$$after_loop(db) {
    const famByMember = new Map();
    for (const f of (Array.isArray(db.families) ? db.families : []))
        for (const m of members(f))
            famByMember.set(m.id, f);
    return famByMember;
}

export const SIGS = {
  inner$runAudit$d: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$runAudit$d_L32: [{"name":"idn","d":{"t":"any"},"opt":false}],
  inner$runAudit$key: [{"name":"g2","d":{"t":"obj","n":"g2","p":[]},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$runAudit$key$$step: [{"name":"a","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$runAudit$d_L61: [{"name":"idn","d":{"t":"any"},"opt":false}],
  inner$runAudit$single: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$runAudit$kk: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$runAudit$paid: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$runAudit$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$runAudit$fam$$step: [{"name":"famByMember","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$runAudit$sp: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"supByName","d":{"t":"obj","n":"supByName","p":[]},"opt":false},{"name":"k","d":{"t":"str"},"opt":false}],
  inner$runAudit$famByMember$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false}],
};
