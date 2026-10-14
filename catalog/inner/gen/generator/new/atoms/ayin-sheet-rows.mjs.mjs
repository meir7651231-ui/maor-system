// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/ayin-sheet-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const makeAYIN_SHEET_HEADER = (T) => ([
    T.k1,
    T.k2,
    T.k3,
    T.k4,
    T.k5,
    T.k6,
    T.k7,
    T.k8,
]);
export function inner$ayinSheetRows$rows(T) {
    const rows = [[...makeAYIN_SHEET_HEADER(T)]];
    return rows;
}
export function inner$ayinSheetRows$leadDone(T, a) {
    const leadDone = [T.k9, T.k10, T.k11].includes(a.stage) ? T.k12 : T.k13;
    return leadDone;
}
export function inner$ayinSheetRows$rows$$after_loop(supporters, T) {
    const rows = [[...makeAYIN_SHEET_HEADER(T)]];
    for (const sp of supporters) {
        const a = sp.ayin;
        if (!a)
            continue;
        const lastAns = a.answers[0];
        const leadDone = [T.k9, T.k10, T.k11].includes(a.stage) ? T.k12 : T.k13;
        for (const n of a.names) {
            rows.push([
                sp.name,
                sp.phone || '',
                n.name,
                n.eyes === '' || n.eyes == null ? '' : String(n.eyes),
                n.done ? T.k12 : T.k13,
                a.paid ? T.k12 : T.k13,
                (lastAns ? lastAns.note : a.answeredNote || '').replace(/,/g, ' '),
                leadDone,
            ]);
        }
    }
    return rows;
}

export const SIGS = {
  inner$ayinSheetRows$rows: [{"name":"T","d":{"t":"any"},"opt":false}],
  inner$ayinSheetRows$leadDone: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$ayinSheetRows$rows$$after_loop: [{"name":"supporters","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
