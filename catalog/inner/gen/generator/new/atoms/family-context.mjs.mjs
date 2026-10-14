// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/family-context.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$familyContext$openDeliveries(db, famId, T) {
    const openDeliveries = (db.deliveries || []).filter((d) => d.familyId === famId && d.status !== T.k1).length;
    return openDeliveries;
}
export function inner$familyContext$activeAssignments(db, famId, T) {
    const activeAssignments = (db.shopAssignments || []).filter((a) => a.famId === famId && a.status === T.k2).length;
    return activeAssignments;
}

export const SIGS = {
  inner$familyContext$openDeliveries: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"famId","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$familyContext$activeAssignments: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"famId","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
