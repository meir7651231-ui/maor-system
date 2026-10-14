// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/find-duplicate-groups.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$findDuplicateGroups$find$nx(parent, c) {
    const nx = parent.get(c);
    return nx;
}
export function inner$findDuplicateGroups$prev(byPhone, p) {
    const prev = byPhone.get(p);
    return prev;
}
export function inner$findDuplicateGroups$prev_L40(byNameCity, nk) {
    const prev = byNameCity.get(nk);
    return prev;
}

export const SIGS = {
  inner$findDuplicateGroups$find$nx: [{"name":"parent","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$findDuplicateGroups$prev: [{"name":"byPhone","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$findDuplicateGroups$prev_L40: [{"name":"byNameCity","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"nk","d":{"t":"any"},"opt":false}],
};
