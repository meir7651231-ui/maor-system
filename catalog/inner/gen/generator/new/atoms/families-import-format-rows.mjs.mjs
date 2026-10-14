// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/families-import-format-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$familiesImportFormatRows$rows$$after_loop(db, T) {
    const rows = [
        [T.k1, T.k2, T.k3, T.k4, T.k5, T.k6, T.k7, T.k8, '', T.k9, T.k10, '', T.k11],
    ];
    for (const f of db.families) {
        rows.push([
            f.name, f.fatherId, f.phone, f.mother, f.motherId, f.phone2, f.city, f.address, '',
            (f.maritalStatus || '').includes(T.k9) ? T.k9 : '', f.community, '', f.notes,
        ]);
    }
    return rows;
}

export const SIGS = {
  inner$familiesImportFormatRows$rows$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
