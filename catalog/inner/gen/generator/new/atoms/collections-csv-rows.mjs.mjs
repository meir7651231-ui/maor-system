// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/collections-csv-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$collectionsCsvRows$coord(db, b) {
    const coord = db.tzCoordinators.find((c) => c.id === b.coordinatorId);
    return coord;
}
export function inner$collectionsCsvRows$fam(db, b) {
    const fam = db.families.find((f) => f.id === b.famId);
    return fam;
}
export function inner$collectionsCsvRows$camp(db, c) {
    const camp = c.campaignId ? db.tzCampaigns.find((p) => p.id === c.campaignId) : undefined;
    return camp;
}

export const SIGS = {
  inner$collectionsCsvRows$coord: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$collectionsCsvRows$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
  inner$collectionsCsvRows$camp: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
};
