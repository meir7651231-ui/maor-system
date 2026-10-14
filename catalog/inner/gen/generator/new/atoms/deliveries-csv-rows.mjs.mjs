// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/deliveries-csv-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$deliveriesCsvRows$famAddr$f(db, id) {
    const f = db.families.find((x) => x.id === id);
    return f;
}

export const SIGS = {
  inner$deliveriesCsvRows$famAddr$f: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
};
