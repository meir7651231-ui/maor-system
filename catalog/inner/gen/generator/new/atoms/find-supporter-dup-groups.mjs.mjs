// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/find-supporter-dup-groups.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$findSupporterDupGroups$find$nx(parent, c) {
    const nx = parent.get(c);
    return nx;
}
export function inner$findSupporterDupGroups$link$prev(map, key) {
    const prev = map.get(key);
    return prev;
}

export const SIGS = {
  inner$findSupporterDupGroups$find$nx: [{"name":"parent","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$findSupporterDupGroups$link$prev: [{"name":"map","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
};
