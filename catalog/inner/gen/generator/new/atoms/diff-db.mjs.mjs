// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/diff-db.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$diffDb$prevById(prevList) {
    const prevById = new Map(prevList.map((x) => [x.id, x]));
    return prevById;
}
export function inner$diffDb$old(prevById, item) {
    const old = prevById.get(item.id);
    return old;
}

export const SIGS = {
  inner$diffDb$prevById: [{"name":"prevList","d":{"t":"any"},"opt":false}],
  inner$diffDb$old: [{"name":"prevById","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
};
