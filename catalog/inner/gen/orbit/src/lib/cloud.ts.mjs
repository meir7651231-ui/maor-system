// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/cloud.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const META_COUNTER_KEYS = ['seq', 'receiptSeq', 'donationSeq', 'shopReceiptSeq'];
export function inner$pushAuditRing$ring(entries, AUDIT_CAP) {
    const ring = entries.slice(-AUDIT_CAP);
    return ring;
}
export function inner$hebrewAuthError$code(e) {
    const code = (e?.code ?? '').toString();
    return code;
}
export function inner$signUp$code(e) {
    const code = (e?.code ?? '').toString();
    return code;
}
export function inner$resetPassword$code(e) {
    const code = (e?.code ?? '').toString();
    return code;
}
export function inner$changePassword$code(e) {
    const code = (e?.code ?? '').toString();
    return code;
}
export function inner$changePassword$code_L377(e) {
    const code = (e?.code ?? '').toString();
    return code;
}
export function inner$pullAll$arr(bySup, supporterId) {
    const arr = bySup.get(supporterId) ?? [];
    return arr;
}
export function inner$pullNedarim$clean(pullUrl) {
    const clean = String(pullUrl || '').trim();
    return clean;
}
export function inner$pullNedarim$org(scope) {
    const org = scope.cloudRoot ? 'root' : scope.slug;
    return org;
}
export function inner$pullSola$clean(pullUrl) {
    const clean = String(pullUrl || '').trim();
    return clean;
}
export function inner$pullSola$org(scope) {
    const org = scope.cloudRoot ? 'root' : scope.slug;
    return org;
}
export function inner$syncGContacts$clean(fnUrl) {
    const clean = String(fnUrl || '').trim();
    return clean;
}
export function inner$syncGContacts$org(scope) {
    const org = scope.cloudRoot ? 'root' : scope.slug;
    return org;
}
export function inner$fetchOutboxIssues$colName(box) {
    const colName = box === 'sms' ? 'smsOutbox' : 'mailOutbox';
    return colName;
}
export function inner$retryOutboxItem$colName(box) {
    const colName = box === 'sms' ? 'smsOutbox' : 'mailOutbox';
    return colName;
}
export function inner$pushMetaCounterSafe$runTransaction$safe$$after_loop(meta, existing) {
    const safe = { ...meta };
    for (const k of META_COUNTER_KEYS) {
        const cur = existing?.[k];
        const nxt = safe[k];
        if (typeof cur === 'number' && (typeof nxt !== 'number' || cur > nxt))
            safe[k] = cur;
    }
    return safe;
}

export const SIGS = {
  inner$pushAuditRing$ring: [{"name":"entries","d":{"t":"arr","of":{"t":"obj","n":"AuditEntry","p":[["at",{"t":"str"},false],["who",{"t":"str"},false],["act",{"t":"str"},false],["what",{"t":"str"},false]]}},"opt":false},{"name":"AUDIT_CAP","d":{"t":"lit","v":[500]},"opt":false}],
  inner$hebrewAuthError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$signUp$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$resetPassword$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$changePassword$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$changePassword$code_L377: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$pullAll$arr: [{"name":"bySup","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"obj","n":"Donation","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["cat",{"t":"str"},false],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["purpose",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}},"opt":false},{"name":"supporterId","d":{"t":"any"},"opt":false}],
  inner$pullNedarim$clean: [{"name":"pullUrl","d":{"t":"str"},"opt":false}],
  inner$pullNedarim$org: [{"name":"scope","d":{"t":"obj","p":[["slug",{"t":"str"},false],["cloudRoot",{"t":"bool"},false]]},"opt":false}],
  inner$pullSola$clean: [{"name":"pullUrl","d":{"t":"str"},"opt":false}],
  inner$pullSola$org: [{"name":"scope","d":{"t":"obj","p":[["slug",{"t":"str"},false],["cloudRoot",{"t":"bool"},false]]},"opt":false}],
  inner$syncGContacts$clean: [{"name":"fnUrl","d":{"t":"str"},"opt":false}],
  inner$syncGContacts$org: [{"name":"scope","d":{"t":"obj","p":[["slug",{"t":"str"},false],["cloudRoot",{"t":"bool"},false]]},"opt":false}],
  inner$fetchOutboxIssues$colName: [{"name":"box","d":{"t":"lit","v":["sms","mail"]},"opt":false}],
  inner$retryOutboxItem$colName: [{"name":"box","d":{"t":"lit","v":["sms","mail"]},"opt":false}],
  inner$pushMetaCounterSafe$runTransaction$safe$$after_loop: [{"name":"meta","d":{"t":"rec","of":{"t":"any"}},"opt":false},{"name":"existing","d":{"t":"or","of":[{"t":"null"},{"t":"rec","of":{"t":"any"}}]},"opt":false}],
};
