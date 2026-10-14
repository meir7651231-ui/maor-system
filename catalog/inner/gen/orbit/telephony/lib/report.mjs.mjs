// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:telephony/lib/report.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const SEV = { critical: 3, high: 2, info: 1 };
export function inner$trustReport$hasK(bundle) {
    const tenant = bundle.tenant || {};
    const hasK = (tenant.numbers || []).some((n) => n.kosher && n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel) && (n.channels || []).includes('voice'));
    return hasK;
}
export function inner$trustReport$hasK$$step(tenant) {
    const hasK = (tenant.numbers || []).some((n) => n.kosher && n.onramp === 'sim-in-gateway' && Number.isInteger(n.gatewayChannel) && (n.channels || []).includes('voice'));
    return hasK;
}
export function inner$trustReport$failing(checks) {
    const failing = checks.filter((c) => !c.pass);
    return failing;
}
export function inner$trustReport$totalW(checks) {
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    return totalW;
}
export function inner$trustReport$gotW(checks) {
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    return gotW;
}
export function inner$trustReport$score(checks) {
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    const score = totalW ? Math.round((gotW / totalW) * 100) : 100;
    return score;
}
export function inner$trustReport$score$$step(totalW, gotW) {
    const score = totalW ? Math.round((gotW / totalW) * 100) : 100;
    return score;
}
export function inner$trustReport$anyCritical(checks) {
    const failing = checks.filter((c) => !c.pass);
    const anyCritical = failing.some((c) => c.severity === 'critical');
    return anyCritical;
}
export function inner$trustReport$anyCritical$$step(failing) {
    const anyCritical = failing.some((c) => c.severity === 'critical');
    return anyCritical;
}
export function inner$trustReport$grade(checks) {
    const failing = checks.filter((c) => !c.pass);
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    const score = totalW ? Math.round((gotW / totalW) * 100) : 100;
    const anyCritical = failing.some((c) => c.severity === 'critical');
    const grade = anyCritical ? 'F' : score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D';
    return grade;
}
export function inner$trustReport$grade$$step(score, anyCritical) {
    const grade = anyCritical ? 'F' : score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : 'D';
    return grade;
}

export const SIGS = {
  inner$trustReport$hasK: [{"name":"bundle","d":{"t":"obj","p":[["tenant",{"t":"any"},false],["files",{"t":"rec","of":{"t":"str"}},false],["manifest",{"t":"or","of":[{"t":"undef"},{"t":"any"}]},true]]},"opt":false}],
  inner$trustReport$hasK$$step: [{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$trustReport$failing: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$totalW: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$gotW: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$score: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$score$$step: [{"name":"totalW","d":{"t":"num"},"opt":false},{"name":"gotW","d":{"t":"num"},"opt":false}],
  inner$trustReport$anyCritical: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$anyCritical$$step: [{"name":"failing","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$grade: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$grade$$step: [{"name":"score","d":{"t":"num"},"opt":false},{"name":"anyCritical","d":{"t":"bool"},"opt":false}],
};
