// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/setOrg.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onCall$targetLabel(request) {
    const { uid, orgId } = (request.data ?? {});
    const targetLabel = typeof uid === "string" && uid.length > 0 ? `users/${uid}` : "users/?";
    return targetLabel;
}
export function inner$onCall$targetLabel$$step(uid) {
    const targetLabel = typeof uid === "string" && uid.length > 0 ? `users/${uid}` : "users/?";
    return targetLabel;
}
export function inner$onCall$trimmed(request) {
    const { uid, orgId } = (request.data ?? {});
    const trimmed = orgId.trim();
    return trimmed;
}
export function inner$onCall$trimmed$$step(orgId) {
    const trimmed = orgId.trim();
    return trimmed;
}
export function inner$onCall$revoke(orgIdValue) {
    const revoke = orgIdValue === null;
    return revoke;
}

export const SIGS = {
  inner$onCall$targetLabel: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$targetLabel$$step: [{"name":"uid","d":{"t":"any"},"opt":false}],
  inner$onCall$trimmed: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$trimmed$$step: [{"name":"orgId","d":{"t":"any"},"opt":false}],
  inner$onCall$revoke: [{"name":"orgIdValue","d":{"t":"or","of":[{"t":"null"},{"t":"str"}]},"opt":false}],
};
