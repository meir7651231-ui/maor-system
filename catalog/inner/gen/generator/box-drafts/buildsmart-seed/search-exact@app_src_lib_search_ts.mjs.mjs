// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/buildsmart-seed/search-exact@app_src_lib_search_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$searchExact$bucket(prefix, contains, bestPos) {
    const bucket = bestPos === 0 ? prefix : contains;
    return bucket;
}
export function inner$editDistance$prev(n) {
    let prev = new Array(n + 1);
    return prev;
}
export function inner$editDistance$cur(n) {
    let cur = new Array(n + 1);
    return cur;
}
export function inner$editDistance$cost(a, b, i, j) {
    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
    return cost;
}

export const SIGS = {
  inner$searchExact$bucket: [{"name":"prefix","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"contains","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"bestPos","d":{"t":"num"},"opt":false}],
  inner$editDistance$prev: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$editDistance$cur: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$editDistance$cost: [{"name":"a","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false},{"name":"j","d":{"t":"num"},"opt":false}],
};
