// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:artifacts/api-server/src/routes/items.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$get$profileId(req) {
    const profileId = req.query.profileId ? parseInt(req.query.profileId) : undefined;
    return profileId;
}
export function inner$put$id(req) {
    const id = parseInt(req.params.id);
    return id;
}
export function inner$delete$id(req) {
    const id = parseInt(req.params.id);
    return id;
}

export const SIGS = {
  inner$get$profileId: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$put$id: [{"name":"req","d":{"t":"any"},"opt":false}],
  inner$delete$id: [{"name":"req","d":{"t":"any"},"opt":false}],
};
