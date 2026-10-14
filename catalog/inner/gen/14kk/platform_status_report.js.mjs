// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך 14kk:platform_status_report.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$PlatformStatusReporter$calculateOverallStatus$overallScore(componentScore, featureScore, protocolScore, testScore) {
    const overallScore = Math.round((componentScore + featureScore + protocolScore + testScore) / 4);
    return overallScore;
}
export function inner$PlatformStatusReporter$printReport$forEach$status(comp) {
    const status = comp.status === 'active' ? '✅' : '❌';
    return status;
}
export function inner$PlatformStatusReporter$printReport$forEach$status_L243(feature) {
    const status = feature.status === 'working' ? '✅' : '❌';
    return status;
}
export function inner$PlatformStatusReporter$printReport$forEach$status_L247(protocol) {
    const status = protocol.status === 'active' ? '✅' : '❌';
    return status;
}
export function inner$PlatformStatusReporter$printReport$forEach$status_L251(test) {
    const status = test.status === 'passed' ? '✅' : '❌';
    return status;
}

export const SIGS = {
  inner$PlatformStatusReporter$calculateOverallStatus$overallScore: [{"name":"componentScore","d":{"t":"num"},"opt":false},{"name":"featureScore","d":{"t":"num"},"opt":false},{"name":"protocolScore","d":{"t":"num"},"opt":false},{"name":"testScore","d":{"t":"num"},"opt":false}],
  inner$PlatformStatusReporter$printReport$forEach$status: [{"name":"comp","d":{"t":"any"},"opt":false}],
  inner$PlatformStatusReporter$printReport$forEach$status_L243: [{"name":"feature","d":{"t":"any"},"opt":false}],
  inner$PlatformStatusReporter$printReport$forEach$status_L247: [{"name":"protocol","d":{"t":"any"},"opt":false}],
  inner$PlatformStatusReporter$printReport$forEach$status_L251: [{"name":"test","d":{"t":"any"},"opt":false}],
};
