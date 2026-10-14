// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/find-all-open-plans.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$findAllOpenPlans$fam(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    return fam;
}
export function inner$findAllOpenPlans$mem(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    const mem = fam?.members.find((m) => m.id === en.memberId);
    return mem;
}
export function inner$findAllOpenPlans$mem$$step(en, fam) {
    const mem = fam?.members.find((m) => m.id === en.memberId);
    return mem;
}
export function inner$findAllOpenPlans$nm(db, en) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    const mem = fam?.members.find((m) => m.id === en.memberId);
    const nm = ((mem?.first || '') + ' ' + (fam?.name || '')).trim();
    return nm;
}
export function inner$findAllOpenPlans$nm$$step(fam, mem) {
    const nm = ((mem?.first || '') + ' ' + (fam?.name || '')).trim();
    return nm;
}
export function inner$findAllOpenPlans$fam_L24(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    return fam;
}

export const SIGS = {
  inner$findAllOpenPlans$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"en","d":{"t":"any"},"opt":false}],
  inner$findAllOpenPlans$mem: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"en","d":{"t":"any"},"opt":false}],
  inner$findAllOpenPlans$mem$$step: [{"name":"en","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false}],
  inner$findAllOpenPlans$nm: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"en","d":{"t":"any"},"opt":false}],
  inner$findAllOpenPlans$nm$$step: [{"name":"fam","d":{"t":"any"},"opt":false},{"name":"mem","d":{"t":"any"},"opt":false}],
  inner$findAllOpenPlans$fam_L24: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
};
