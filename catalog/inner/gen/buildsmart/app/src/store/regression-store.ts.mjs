// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/store/regression-store.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$computed$passed(filteredResults) {
    const passed = filteredResults.value.filter((r) => r.checks.every((c) => c.pass)).length;
    return passed;
}
export function inner$computed$map$items(regressionResults, category) {
    const items = regressionResults.value.filter((r) => r.category === category);
    return items;
}

export const SIGS = {
  inner$computed$passed: [{"name":"filteredResults","d":{"t":"any"},"opt":false}],
  inner$computed$map$items: [{"name":"regressionResults","d":{"t":"any"},"opt":false},{"name":"category","d":{"t":"lit","v":["buttons","tabs","products","behavior","dsync","dupes"]},"opt":false}],
};
