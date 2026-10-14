// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/beneficiary-label.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$beneficiaryLabel$fam(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    return fam;
}
export function inner$beneficiaryLabel$m(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    const m = fam.members.find((x) => x.id === a.memberId);
    return m;
}
export function inner$beneficiaryLabel$m$$step(a, fam) {
    const m = fam.members.find((x) => x.id === a.memberId);
    return m;
}

export const SIGS = {
  inner$beneficiaryLabel$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$beneficiaryLabel$m: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$beneficiaryLabel$m$$step: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false}],
};
