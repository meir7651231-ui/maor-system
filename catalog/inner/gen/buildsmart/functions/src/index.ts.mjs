// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:functions/src/index.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$onCall$targetLabel(request) {
    const { uid, role, roles, storeId } = (request.data ?? {});
    const targetLabel = typeof uid === "string" && uid.length > 0 ? `users/${uid}` : "users/?";
    return targetLabel;
}
export function inner$onCall$targetLabel$$step(uid) {
    const targetLabel = typeof uid === "string" && uid.length > 0 ? `users/${uid}` : "users/?";
    return targetLabel;
}

export const SIGS = {
  inner$onCall$targetLabel: [{"name":"request","d":{"t":"any"},"opt":false}],
  inner$onCall$targetLabel$$step: [{"name":"uid","d":{"t":"any"},"opt":false}],
};
