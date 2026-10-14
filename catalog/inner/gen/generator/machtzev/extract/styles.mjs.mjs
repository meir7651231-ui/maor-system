// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/styles.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$key(pair) {
    const key = pair[1] + ':' + pair[2].trim().replace(/['"]/g, '');
    return key;
}
export function inner$forEach$a(census, agg, pair) {
    const key = pair[1] + ':' + pair[2].trim().replace(/['"]/g, '');
    const a = agg.get(key) || { id: `L0b:${census.repo}:${key}`, level: 'L0b-inline-style',
        prop: pair[1], value: pair[2].trim().replace(/['"]/g, ''), count: 0, sources: [] };
    return a;
}
export function inner$forEach$a$$step(census, agg, pair, key) {
    const a = agg.get(key) || { id: `L0b:${census.repo}:${key}`, level: 'L0b-inline-style',
        prop: pair[1], value: pair[2].trim().replace(/['"]/g, ''), count: 0, sources: [] };
    return a;
}

export const SIGS = {
  inner$forEach$key: [{"name":"pair","d":{"t":"any"},"opt":false}],
  inner$forEach$a: [{"name":"census","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"pair","d":{"t":"any"},"opt":false}],
  inner$forEach$a$$step: [{"name":"census","d":{"t":"any"},"opt":false},{"name":"agg","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"pair","d":{"t":"any"},"opt":false},{"name":"key","d":{"t":"str"},"opt":false}],
};
