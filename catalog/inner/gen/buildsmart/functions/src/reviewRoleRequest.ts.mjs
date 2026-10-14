// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/reviewRoleRequest.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onCall$approved(request) {
    const { uid, decision } = (request.data ?? {});
    const approved = decision === "approve";
    return approved;
}
export function inner$onCall$approved$$step(decision) {
    const approved = decision === "approve";
    return approved;
}

export const SIGS = {
  inner$onCall$approved: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$approved$$step: [{"name":"decision","d":{"t":"any"},"opt":false}],
};
