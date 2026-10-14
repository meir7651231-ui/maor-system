// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/lib-cloud.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const AUDIT_CAP = 500;
export function inner$hebrewAuthError$code(e) {
    const code = ((e && e.code) ?? '').toString();
    return code;
}
export function inner$signUpError$code(e) {
    const code = ((e && e.code) ?? '').toString();
    return code;
}
export function inner$resetPasswordError$code(e) {
    const code = ((e && e.code) ?? '').toString();
    return code;
}
export function inner$changePasswordCurrentError$code(e) {
    const code = ((e && e.code) ?? '').toString();
    return code;
}
export function inner$changePasswordNextError$code(e) {
    const code = ((e && e.code) ?? '').toString();
    return code;
}
export function inner$pullBase$clean(rawUrl) {
    const clean = String(rawUrl || '').trim();
    return clean;
}
export function inner$createLibCloud$pushAuditRing$ring(entries) {
    const ring = entries.slice(-AUDIT_CAP);
    return ring;
}
export function inner$createLibCloud$pullAll$arr(bySup, supporterId) {
    const arr = bySup.get(supporterId) ?? [];
    return arr;
}
export function inner$mergeMetaCounters$safe$$after_loop(META_COUNTER_KEYS, existing, meta, LIB_CLOUD_TERMS) {
    const safe = { ...meta };
    for (const k of META_COUNTER_KEYS) {
        const cur = existing?.[k];
        const nxt = safe[k];
        if (typeof cur === LIB_CLOUD_TERMS.k30 && (typeof nxt !== LIB_CLOUD_TERMS.k30 || cur > nxt))
            safe[k] = cur;
    }
    return safe;
}

export const SIGS = {
  inner$hebrewAuthError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$signUpError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$resetPasswordError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$changePasswordCurrentError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$changePasswordNextError$code: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$pullBase$clean: [{"name":"rawUrl","d":{"t":"any"},"opt":false}],
  inner$createLibCloud$pushAuditRing$ring: [{"name":"entries","d":{"t":"any"},"opt":false}],
  inner$createLibCloud$pullAll$arr: [{"name":"bySup","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"supporterId","d":{"t":"any"},"opt":false}],
  inner$mergeMetaCounters$safe$$after_loop: [{"name":"META_COUNTER_KEYS","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"existing","d":{"t":"any"},"opt":false},{"name":"meta","d":{"t":"any"},"opt":false},{"name":"LIB_CLOUD_TERMS","d":{"t":"obj","p":[["k1",{"t":"str"},false],["k2",{"t":"str"},false],["k3",{"t":"str"},false],["k4",{"t":"str"},false],["k5",{"t":"str"},false],["k6",{"t":"str"},false],["k7",{"t":"str"},false],["k8",{"t":"str"},false],["k9",{"t":"str"},false],["k10",{"t":"str"},false],["k11",{"t":"str"},false],["k12",{"t":"str"},false],["k13",{"t":"str"},false],["k14",{"t":"str"},false],["k15",{"t":"str"},false],["k16",{"t":"str"},false],["k17",{"t":"str"},false],["k18",{"t":"str"},false],["k19",{"t":"str"},false],["k20",{"t":"str"},false],["k21",{"t":"str"},false],["k22",{"t":"str"},false],["k23",{"t":"str"},false],["k24",{"t":"str"},false],["k25",{"t":"str"},false],["k26",{"t":"str"},false],["k27",{"t":"str"},false],["k28",{"t":"str"},false],["k29",{"t":"str"},false],["k30",{"t":"str"},false],["k31",{"t":"str"},false],["k32",{"t":"str"},false],["k33",{"t":"str"},false],["k34",{"t":"str"},false],["k35",{"t":"str"},false],["k36",{"t":"str"},false],["k37",{"t":"str"},false],["k38",{"t":"str"},false],["k39",{"t":"str"},false],["k40",{"t":"str"},false]]},"opt":false}],
};
