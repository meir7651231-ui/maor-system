// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/apply-entity-partial.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$applyEntityPartial$deleted(docs) {
    const deleted = new Set(docs.filter((d) => d.deleted).map((d) => d.id));
    return deleted;
}
export function inner$applyEntityPartial$map$inc(incoming, x) {
    const inc = incoming.get(x.id);
    return inc;
}
export function inner$applyEntityPartial$next(incoming, kept) {
    const next = [...incoming.values(), ...kept];
    return next;
}

export const SIGS = {
  inner$applyEntityPartial$deleted: [{"name":"docs","d":{"t":"any"},"opt":false}],
  inner$applyEntityPartial$map$inc: [{"name":"incoming","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"x","d":{"t":"any"},"opt":false}],
  inner$applyEntityPartial$next: [{"name":"incoming","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"kept","d":{"t":"any"},"opt":false}],
};
