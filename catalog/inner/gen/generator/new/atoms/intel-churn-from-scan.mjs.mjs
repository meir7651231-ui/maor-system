// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intel-churn-from-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$churnFromScan$cadence(scan, T, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k1;
    return cadence;
}
export function inner$churnFromScan$expected(scan, T, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k1;
    const expected = Math.max(T.k2, cadence * 1.5);
    return expected;
}
export function inner$churnFromScan$expected$$step(T, cadence) {
    const expected = Math.max(T.k2, cadence * 1.5);
    return expected;
}
export function inner$churnFromScan$ratio(scan, T, daysSince, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k1;
    const expected = Math.max(T.k2, cadence * 1.5);
    const ratio = daysSince / expected;
    return ratio;
}
export function inner$churnFromScan$ratio$$step(daysSince, expected) {
    const ratio = daysSince / expected;
    return ratio;
}

export const SIGS = {
  inner$churnFromScan$cadence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$churnFromScan$expected: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$churnFromScan$expected$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"cadence","d":{"t":"num"},"opt":false}],
  inner$churnFromScan$ratio: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$churnFromScan$ratio$$step: [{"name":"daysSince","d":{"t":"num"},"opt":false},{"name":"expected","d":{"t":"num"},"opt":false}],
};
