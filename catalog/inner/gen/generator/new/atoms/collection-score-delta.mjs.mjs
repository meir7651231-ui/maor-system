// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/collection-score-delta.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$collectionScoreDelta$pts(amount, rules) {
    let pts = rules.emptyPts + Math.floor(amount / rules.ilsPerPoint);
    return pts;
}
export function inner$collectionScoreDelta$days(date, T, prev) {
    const days = Math.round((new Date(date + 'T12:00:00').getTime() - new Date(prev + 'T12:00:00').getTime()) / T.k1);
    return days;
}

export const SIGS = {
  inner$collectionScoreDelta$pts: [{"name":"amount","d":{"t":"num"},"opt":false},{"name":"rules","d":{"t":"obj","p":[["emptyPts",{"t":"num"},false],["ilsPerPoint",{"t":"num"},false],["streakDays",{"t":"num"},false],["streakPts",{"t":"num"},false]]},"opt":false}],
  inner$collectionScoreDelta$days: [{"name":"date","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"prev","d":{"t":"any"},"opt":false}],
};
