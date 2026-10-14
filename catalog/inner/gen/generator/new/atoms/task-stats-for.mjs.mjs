// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/task-stats-for.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$taskStatsFor$t0(todayIso) {
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    return t0;
}
export function inner$taskStatsFor$d(T, t) {
    const d = new Date((t.doneAt ?? '').slice(0, T.k1) + 'T12:00:00').getTime();
    return d;
}
export function inner$taskStatsFor$diff(todayIso, T, t) {
    const t0 = new Date(todayIso + 'T12:00:00').getTime();
    const d = new Date((t.doneAt ?? '').slice(0, T.k1) + 'T12:00:00').getTime();
    const diff = (t0 - d) / T.k2;
    return diff;
}
export function inner$taskStatsFor$diff$$step(T, t0, d) {
    const diff = (t0 - d) / T.k2;
    return diff;
}

export const SIGS = {
  inner$taskStatsFor$t0: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$taskStatsFor$d: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$taskStatsFor$diff: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$taskStatsFor$diff$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"t0","d":{"t":"num"},"opt":false},{"name":"d","d":{"t":"num"},"opt":false}],
};
