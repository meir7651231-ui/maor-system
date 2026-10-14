// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/orderFlow.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ORDER_FLOW = [
    "new",
    "preparing",
    "ready",
    "pickup",
    "transit",
    "delivered",
];
function stageIndex(stage) {
    return typeof stage === "string"
        ? ORDER_FLOW.indexOf(stage)
        : -1;
}
function isLegalStep(from, to) {
    const a = stageIndex(from);
    const b = stageIndex(to);
    return a >= 0 && b >= 0 && b === a + 1;
}
const TRANSITION_OWNER = {
    "new>preparing": "store",
    "preparing>ready": "store",
    "ready>pickup": "store", // the "מסור לשליח" hand-off — store-owned
    "pickup>transit": "courier",
    "transit>delivered": "courier",
};
function rolesAllowedFor(from, to) {
    if (!isLegalStep(from, to))
        return [];
    const owner = TRANSITION_OWNER[`${from}>${to}`];
    return owner === undefined ? [] : [owner, "manager", "admin"];
}
export function inner$nextStage$i(stage) {
    const i = stageIndex(stage);
    return i;
}
export function inner$isLegalStep$a(from) {
    const a = stageIndex(from);
    return a;
}
export function inner$isLegalStep$b(to) {
    const b = stageIndex(to);
    return b;
}
export function inner$rolesAllowedFor$owner(from, to) {
    const owner = TRANSITION_OWNER[`${from}>${to}`];
    return owner;
}
export function inner$roleMayStep$allowed(from, to) {
    const allowed = rolesAllowedFor(from, to);
    return allowed;
}

export const SIGS = {
  inner$nextStage$i: [{"name":"stage","d":{"t":"lit","v":["new","preparing","ready","pickup","transit","delivered"]},"opt":false}],
  inner$isLegalStep$a: [{"name":"from","d":{"t":"any"},"opt":false}],
  inner$isLegalStep$b: [{"name":"to","d":{"t":"any"},"opt":false}],
  inner$rolesAllowedFor$owner: [{"name":"from","d":{"t":"lit","v":["new","preparing","ready","pickup","transit","delivered"]},"opt":false},{"name":"to","d":{"t":"lit","v":["new","preparing","ready","pickup","transit","delivered"]},"opt":false}],
  inner$roleMayStep$allowed: [{"name":"from","d":{"t":"lit","v":["new","preparing","ready","pickup","transit","delivered"]},"opt":false},{"name":"to","d":{"t":"lit","v":["new","preparing","ready","pickup","transit","delivered"]},"opt":false}],
};
