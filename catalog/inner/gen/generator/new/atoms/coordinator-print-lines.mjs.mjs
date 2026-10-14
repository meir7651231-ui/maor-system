// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/coordinator-print-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$coordinatorPrintLines$coord(db, coordinatorId) {
    const coord = db.tzCoordinators.find((c) => c.id === coordinatorId);
    return coord;
}
export function inner$coordinatorPrintLines$lines(db, coordinatorId, T2) {
    const coord = db.tzCoordinators.find((c) => c.id === coordinatorId);
    const lines = [
        T2.k3 + (coord?.name ?? ''),
        '='.repeat(T2.k10),
    ];
    return lines;
}
export function inner$coordinatorPrintLines$lines$$step(T2, coord) {
    const lines = [
        T2.k3 + (coord?.name ?? ''),
        '='.repeat(T2.k10),
    ];
    return lines;
}
export function inner$coordinatorPrintLines$fam(db, b) {
    const fam = db.families.find((f) => f.id === b.famId);
    return fam;
}

export const SIGS = {
  inner$coordinatorPrintLines$coord: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"coordinatorId","d":{"t":"any"},"opt":false}],
  inner$coordinatorPrintLines$lines: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"coordinatorId","d":{"t":"any"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false}],
  inner$coordinatorPrintLines$lines$$step: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"coord","d":{"t":"any"},"opt":false}],
  inner$coordinatorPrintLines$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"b","d":{"t":"any"},"opt":false}],
};
