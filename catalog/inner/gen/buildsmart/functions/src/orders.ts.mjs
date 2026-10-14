// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/orders.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onCall$runTransaction$cur(snap) {
    const cur = snap.get("stage");
    return cur;
}
export function inner$onCall$runTransaction$grantedVia(roles, allowed) {
    const grantedVia = roles.find((r) => allowed.includes(r)) ?? null;
    return grantedVia;
}
export function inner$onDocumentUpdated$fromStage(before) {
    const fromStage = before.get("stage");
    return fromStage;
}
export function inner$onDocumentUpdated$toStage(after) {
    const toStage = after.get("stage");
    return toStage;
}
export function inner$onDocumentUpdated$guardBefore(before) {
    const guardBefore = JSON.stringify(before.get("stageGuard") ?? null);
    return guardBefore;
}
export function inner$onDocumentUpdated$guardAfter(after) {
    const guardAfter = JSON.stringify(after.get("stageGuard") ?? null);
    return guardAfter;
}

export const SIGS = {
  inner$onCall$runTransaction$cur: [{"name":"snap","d":{"t":"any"},"opt":false}],
  inner$onCall$runTransaction$grantedVia: [{"name":"roles","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"allowed","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$onDocumentUpdated$fromStage: [{"name":"before","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$toStage: [{"name":"after","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$guardBefore: [{"name":"before","d":{"t":"any"},"opt":false}],
  inner$onDocumentUpdated$guardAfter: [{"name":"after","d":{"t":"any"},"opt":false}],
};
