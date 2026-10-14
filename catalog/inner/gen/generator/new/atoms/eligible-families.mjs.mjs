// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/eligible-families.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$eligibleFamilies$filter$theirs(db, f) {
    const theirs = db.shopAssignments.filter((a) => a.famId === f.id);
    return theirs;
}
export function inner$eligibleFamilies$filter$held(db, f) {
    const theirs = db.shopAssignments.filter((a) => a.famId === f.id);
    const held = new Set(theirs.flatMap((a) => a.criterionIds));
    return held;
}
export function inner$eligibleFamilies$filter$held$$step(theirs) {
    const held = new Set(theirs.flatMap((a) => a.criterionIds));
    return held;
}

export const SIGS = {
  inner$eligibleFamilies$filter$theirs: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$eligibleFamilies$filter$held: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"f","d":{"t":"any"},"opt":false}],
  inner$eligibleFamilies$filter$held$$step: [{"name":"theirs","d":{"t":"any"},"opt":false}],
};
