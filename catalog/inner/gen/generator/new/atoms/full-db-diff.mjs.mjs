// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/full-db-diff.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fullDbDiff$sets$$after_loop(db, entityCollections) {
    const sets = [];
    for (const col of entityCollections) {
        for (const item of db[col]) {
            sets.push({ col, id: item.id, data: item });
        }
    }
    return sets;
}

export const SIGS = {
  inner$fullDbDiff$sets$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"entityCollections","d":{"t":"any"},"opt":false}],
};
