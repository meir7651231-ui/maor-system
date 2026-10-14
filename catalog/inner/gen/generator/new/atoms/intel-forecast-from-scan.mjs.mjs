// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intel-forecast-from-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forecastFromScan$avg(scan) {
    const avg = Math.round(scan.ils / scan.count);
    return avg;
}
export function inner$forecastFromScan$cadence(scan, T, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k2;
    return cadence;
}
export function inner$forecastFromScan$lastMs(scan, T) {
    const lastMs = Date.parse(scan.last.slice(0, T.k3) + 'T12:00:00');
    return lastMs;
}
export function inner$forecastFromScan$dueMs(scan, T, MS_DAY, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k2;
    const lastMs = Date.parse(scan.last.slice(0, T.k3) + 'T12:00:00');
    const dueMs = lastMs + cadence * MS_DAY;
    return dueMs;
}
export function inner$forecastFromScan$dueMs$$step(MS_DAY, cadence, lastMs) {
    const dueMs = lastMs + cadence * MS_DAY;
    return dueMs;
}
export function inner$forecastFromScan$dueIso(scan, T, MS_DAY, span) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k2;
    const lastMs = Date.parse(scan.last.slice(0, T.k3) + 'T12:00:00');
    const dueMs = lastMs + cadence * MS_DAY;
    const dueIso = new Date(dueMs).toISOString().slice(0, T.k3);
    return dueIso;
}
export function inner$forecastFromScan$dueIso$$step(T, dueMs) {
    const dueIso = new Date(dueMs).toISOString().slice(0, T.k3);
    return dueIso;
}
export function inner$forecastFromScan$overdue(scan, T, span, daysSince) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k2;
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    return overdue;
}
export function inner$forecastFromScan$overdue$$step(cadence, daysSince) {
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    return overdue;
}
export function inner$forecastFromScan$confidence(scan, T, span, daysSince) {
    const cadence = scan.count >= 2 && span > 0 ? span / (scan.count - 1) : T.k2;
    const overdue = cadence > 0 ? Math.max(0, daysSince / cadence - 1) : 0;
    const confidence = Math.max(T.k4, Math.min(T.k5, Math.round(T.k6 + scan.count * 7 - overdue * T.k7)));
    return confidence;
}
export function inner$forecastFromScan$confidence$$step(scan, T, overdue) {
    const confidence = Math.max(T.k4, Math.min(T.k5, Math.round(T.k6 + scan.count * 7 - overdue * T.k7)));
    return confidence;
}

export const SIGS = {
  inner$forecastFromScan$avg: [{"name":"scan","d":{"t":"any"},"opt":false}],
  inner$forecastFromScan$cadence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$lastMs: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$forecastFromScan$dueMs: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"MS_DAY","d":{"t":"num"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$dueMs$$step: [{"name":"MS_DAY","d":{"t":"num"},"opt":false},{"name":"cadence","d":{"t":"num"},"opt":false},{"name":"lastMs","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$dueIso: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"MS_DAY","d":{"t":"num"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$dueIso$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"dueMs","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$overdue: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$overdue$$step: [{"name":"cadence","d":{"t":"num"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$confidence: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"span","d":{"t":"num"},"opt":false},{"name":"daysSince","d":{"t":"num"},"opt":false}],
  inner$forecastFromScan$confidence$$step: [{"name":"scan","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"overdue","d":{"t":"num"},"opt":false}],
};
