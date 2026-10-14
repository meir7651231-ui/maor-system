// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/studio.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function numOr0(v) {
    return typeof v === "number" ? v : 0;
}
export function inner$rateLimitExceeded$windowStart(cur) {
    const windowStart = typeof cur?.windowStart === "number" ? cur.windowStart : 0;
    return windowStart;
}
export function inner$rateLimitExceeded$count(cur) {
    const count = typeof cur?.count === "number" ? cur.count : 0;
    return count;
}
export function inner$enforcePublishRateLimit$runTransaction$windowStart(cur) {
    const windowStart = typeof cur?.windowStart === "number" ? cur.windowStart : 0;
    return windowStart;
}
export function inner$enforcePublishRateLimit$runTransaction$count(cur) {
    const count = typeof cur?.count === "number" ? cur.count : 0;
    return count;
}
export function inner$onCall$runTransaction$pv(pubSnap) {
    const pv = pubSnap.get("version");
    return pv;
}
export function inner$onCall$runTransaction$publishedVersion(pubSnap) {
    const pv = pubSnap.get("version");
    const publishedVersion = typeof pv === "number" ? pv : 0;
    return publishedVersion;
}
export function inner$onCall$runTransaction$publishedVersion$$step(pv) {
    const publishedVersion = typeof pv === "number" ? pv : 0;
    return publishedVersion;
}
export function inner$onCall$runTransaction$liveAllow(allowSnap) {
    const liveAllow = allowSnap.get("enabled") === true;
    return liveAllow;
}
export function inner$onCall$runTransaction$dualControlApproved(uid, apprSnap, approvedBy) {
    const dualControlApproved = apprSnap.get("approved") === true &&
        approvedBy !== null &&
        approvedBy !== uid;
    return dualControlApproved;
}
export function inner$onCall$runTransaction$snapId(toVersion) {
    const snapId = `v${toVersion}`;
    return snapId;
}
export function inner$onCall$runTransaction$snapPath(toVersion) {
    const snapId = `v${toVersion}`;
    const snapPath = `studioConfigSnapshots/${snapId}`;
    return snapPath;
}
export function inner$onCall$runTransaction$snapPath$$step(snapId) {
    const snapPath = `studioConfigSnapshots/${snapId}`;
    return snapPath;
}
export function inner$decideRevert$guardBefore(i) {
    const guardBefore = JSON.stringify(i.before.publishGuard ?? null);
    return guardBefore;
}
export function inner$decideRevert$guardAfter(i) {
    const guardAfter = JSON.stringify(i.after.publishGuard ?? null);
    return guardAfter;
}
export function inner$onDocumentUpdated$toVersion(after) {
    const toVersion = numOr0(after.get("version"));
    return toVersion;
}

export const SIGS = {
  inner$rateLimitExceeded$windowStart: [{"name":"cur","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["windowStart",{"t":"any"},true],["count",{"t":"any"},true]]}]},"opt":false}],
  inner$rateLimitExceeded$count: [{"name":"cur","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["windowStart",{"t":"any"},true],["count",{"t":"any"},true]]}]},"opt":false}],
  inner$enforcePublishRateLimit$runTransaction$windowStart: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$enforcePublishRateLimit$runTransaction$count: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$pv: [{"name":"pubSnap","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$publishedVersion: [{"name":"pubSnap","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$publishedVersion$$step: [{"name":"pv","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$liveAllow: [{"name":"allowSnap","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$dualControlApproved: [{"name":"uid","d":{"t":"any"},"opt":false},{"name":"apprSnap","d":{"t":"any"},"opt":false},{"name":"approvedBy","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
  inner$onCall$runTransaction$snapId: [{"name":"toVersion","d":{"t":"num"},"opt":false}],
  inner$onCall$runTransaction$snapPath: [{"name":"toVersion","d":{"t":"num"},"opt":false}],
  inner$onCall$runTransaction$snapPath$$step: [{"name":"snapId","d":{"t":"str"},"opt":false}],
  inner$decideRevert$guardBefore: [{"name":"i","d":{"t":"obj","n":"RevertDecisionInput","p":[["before",{"t":"obj","n":"ConfigPointerState","p":[["version",{"t":"num"},false],["ref",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["publishGuard",{"t":"any"},false]]},false],["after",{"t":"obj","n":"ConfigPointerState","p":[["version",{"t":"num"},false],["ref",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["publishGuard",{"t":"any"},false]]},false]]},"opt":false}],
  inner$decideRevert$guardAfter: [{"name":"i","d":{"t":"obj","n":"RevertDecisionInput","p":[["before",{"t":"obj","n":"ConfigPointerState","p":[["version",{"t":"num"},false],["ref",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["publishGuard",{"t":"any"},false]]},false],["after",{"t":"obj","n":"ConfigPointerState","p":[["version",{"t":"num"},false],["ref",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["publishGuard",{"t":"any"},false]]},false]]},"opt":false}],
  inner$onDocumentUpdated$toVersion: [{"name":"after","d":{"t":"any"},"opt":false}],
};
