// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/reenroll-counts.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$reenrollCounts$c$$after_loop(rows, T) {
    const c = { total: 0, yes: 0, no: 0, hold: 0, undecided: 0, renewed: 0 };
    for (const r of rows) {
        c.total++;
        if (r.renewed)
            c.renewed++;
        if (r.decision === T.k1)
            c.yes++;
        else if (r.decision === 'no')
            c.no++;
        else if (r.decision === T.k2)
            c.hold++;
        else
            c.undecided++;
    }
    return c;
}

export const SIGS = {
  inner$reenrollCounts$c$$after_loop: [{"name":"rows","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
