// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/data/catalog.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$productsForPath$current(path) {
    const current = path[path.length - 1];
    return current;
}

export const SIGS = {
  inner$productsForPath$current: [{"name":"path","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
};
