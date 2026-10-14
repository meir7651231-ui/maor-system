// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:box-drafts/buildsmart-seed/search-fuzzy@app_src_lib_search_ts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$searchFuzzy$tolerance(q) {
    const tolerance = Math.floor(q.length / 3) + 1;
    return tolerance;
}
export function inner$searchFuzzy$window(q, norm) {
    const tolerance = Math.floor(q.length / 3) + 1;
    const window = Math.min(norm.length, q.length + tolerance);
    return window;
}
export function inner$searchFuzzy$window$$step(q, tolerance, norm) {
    const window = Math.min(norm.length, q.length + tolerance);
    return window;
}
export function inner$searchFuzzy$slice(q, norm, start) {
    const tolerance = Math.floor(q.length / 3) + 1;
    const window = Math.min(norm.length, q.length + tolerance);
    const slice = norm.slice(start, start + window);
    return slice;
}
export function inner$searchFuzzy$slice$$step(norm, window, start) {
    const slice = norm.slice(start, start + window);
    return slice;
}

export const SIGS = {
  inner$searchFuzzy$tolerance: [{"name":"q","d":{"t":"any"},"opt":false}],
  inner$searchFuzzy$window: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"norm","d":{"t":"any"},"opt":false}],
  inner$searchFuzzy$window$$step: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"tolerance","d":{"t":"num"},"opt":false},{"name":"norm","d":{"t":"any"},"opt":false}],
  inner$searchFuzzy$slice: [{"name":"q","d":{"t":"any"},"opt":false},{"name":"norm","d":{"t":"any"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false}],
  inner$searchFuzzy$slice$$step: [{"name":"norm","d":{"t":"any"},"opt":false},{"name":"window","d":{"t":"num"},"opt":false},{"name":"start","d":{"t":"num"},"opt":false}],
};
