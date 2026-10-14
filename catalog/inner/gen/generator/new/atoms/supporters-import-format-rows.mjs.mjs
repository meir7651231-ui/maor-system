// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/supporters-import-format-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supportersImportFormatRows$rows$$after_loop(db, T) {
    const rows = [[T.k1, T.k2, T.k3, T.k4, T.k5, T.k6, T.k7]];
    for (const sp of db.supporters) {
        rows.push([sp.name, sp.phone, sp.email, sp.idNum, sp.address, sp.cat, sp.forWho]);
    }
    return rows;
}

export const SIGS = {
  inner$supportersImportFormatRows$rows$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
