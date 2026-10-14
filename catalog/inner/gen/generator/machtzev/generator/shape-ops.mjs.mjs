// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/shape-ops.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fieldOps$t(f) {
    const t = f.t.replace(/\s*\|\s*''$/, '');
    return t;
}
export function inner$entityOps$fs_(FIELDS, e) {
    const fs_ = FIELDS.filter((f) => f.e === e);
    return fs_;
}
export function inner$entityOps$types(FIELDS, e) {
    const fs_ = FIELDS.filter((f) => f.e === e);
    const types = fs_.map((f) => f.t.replace(/\s*\|\s*''$/, ''));
    return types;
}
export function inner$entityOps$types$$step(fs_) {
    const types = fs_.map((f) => f.t.replace(/\s*\|\s*''$/, ''));
    return types;
}
export function inner$entityOps$nDates(FIELDS, e) {
    const fs_ = FIELDS.filter((f) => f.e === e);
    const types = fs_.map((f) => f.t.replace(/\s*\|\s*''$/, ''));
    const nDates = types.filter((t) => t === 'IsoDate').length;
    return nDates;
}
export function inner$entityOps$nDates$$step(types) {
    const nDates = types.filter((t) => t === 'IsoDate').length;
    return nDates;
}
export function inner$entityOps$nTime(FIELDS, e) {
    const fs_ = FIELDS.filter((f) => f.e === e);
    const types = fs_.map((f) => f.t.replace(/\s*\|\s*''$/, ''));
    const nTime = types.filter((t) => t === 'TimeHM' || t === 'Weekday').length;
    return nTime;
}
export function inner$entityOps$nTime$$step(types) {
    const nTime = types.filter((t) => t === 'TimeHM' || t === 'Weekday').length;
    return nTime;
}

export const SIGS = {
  inner$fieldOps$t: [{"name":"f","d":{"t":"any"},"opt":false}],
  inner$entityOps$fs_: [{"name":"FIELDS","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$entityOps$types: [{"name":"FIELDS","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$entityOps$types$$step: [{"name":"fs_","d":{"t":"any"},"opt":false}],
  inner$entityOps$nDates: [{"name":"FIELDS","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$entityOps$nDates$$step: [{"name":"types","d":{"t":"any"},"opt":false}],
  inner$entityOps$nTime: [{"name":"FIELDS","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$entityOps$nTime$$step: [{"name":"types","d":{"t":"any"},"opt":false}],
};
