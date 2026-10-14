// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/call-stats.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$callStats$noanswer$$after_loop(calls, T) {
    const list = calls ?? [];
    let noanswer = 0;
    for (const c of list)
        if (c.outcome === T.k1)
            noanswer++;
    return noanswer;
}

export const SIGS = {
  inner$callStats$noanswer$$after_loop: [{"name":"calls","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
