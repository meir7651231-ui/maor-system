// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/trust-report.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$trustReport$hasK(bundle, T) {
    const tenant = bundle.tenant || {};
    const hasK = (tenant.numbers || []).some((n) => n.kosher && n.onramp === T.k15 && Number.isInteger(n.gatewayChannel) && (n.channels || []).includes(T.k16));
    return hasK;
}
export function inner$trustReport$hasK$$step(T, tenant) {
    const hasK = (tenant.numbers || []).some((n) => n.kosher && n.onramp === T.k15 && Number.isInteger(n.gatewayChannel) && (n.channels || []).includes(T.k16));
    return hasK;
}
export function inner$trustReport$failing(checks) {
    const failing = checks.filter((c) => !c.pass);
    return failing;
}
export function inner$trustReport$totalW(checks) {
    const SEV = { critical: 3, high: 2, info: 1 };
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    return totalW;
}
export function inner$trustReport$totalW$$step(SEV, checks) {
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    return totalW;
}
export function inner$trustReport$gotW(checks) {
    const SEV = { critical: 3, high: 2, info: 1 };
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    return gotW;
}
export function inner$trustReport$gotW$$step(SEV, checks) {
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    return gotW;
}
export function inner$trustReport$score(T, checks) {
    const SEV = { critical: 3, high: 2, info: 1 };
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    const score = totalW ? Math.round((gotW / totalW) * T.k44) : T.k44;
    return score;
}
export function inner$trustReport$score$$step(T, totalW, gotW) {
    const score = totalW ? Math.round((gotW / totalW) * T.k44) : T.k44;
    return score;
}
export function inner$trustReport$anyCritical(T, checks) {
    const failing = checks.filter((c) => !c.pass);
    const anyCritical = failing.some((c) => c.severity === T.k3);
    return anyCritical;
}
export function inner$trustReport$anyCritical$$step(T, failing) {
    const anyCritical = failing.some((c) => c.severity === T.k3);
    return anyCritical;
}
export function inner$trustReport$grade(T, checks) {
    const SEV = { critical: 3, high: 2, info: 1 };
    const failing = checks.filter((c) => !c.pass);
    const totalW = checks.reduce((s, c) => s + SEV[c.severity], 0);
    const gotW = checks.reduce((s, c) => s + (c.pass ? SEV[c.severity] : 0), 0);
    const score = totalW ? Math.round((gotW / totalW) * T.k44) : T.k44;
    const anyCritical = failing.some((c) => c.severity === T.k3);
    const grade = anyCritical ? 'F' : score >= T.k45 ? 'A' : score >= T.k46 ? 'B' : score >= T.k47 ? 'C' : 'D';
    return grade;
}
export function inner$trustReport$grade$$step(T, score, anyCritical) {
    const grade = anyCritical ? 'F' : score >= T.k45 ? 'A' : score >= T.k46 ? 'B' : score >= T.k47 ? 'C' : 'D';
    return grade;
}

export const SIGS = {
  inner$trustReport$hasK: [{"name":"bundle","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$trustReport$hasK$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"tenant","d":{"t":"any"},"opt":false}],
  inner$trustReport$failing: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$totalW: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$totalW$$step: [{"name":"SEV","d":{"t":"obj","p":[["critical",{"t":"num"},false],["high",{"t":"num"},false],["info",{"t":"num"},false]]},"opt":false},{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$gotW: [{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$gotW$$step: [{"name":"SEV","d":{"t":"obj","p":[["critical",{"t":"num"},false],["high",{"t":"num"},false],["info",{"t":"num"},false]]},"opt":false},{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$score: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$score$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"totalW","d":{"t":"num"},"opt":false},{"name":"gotW","d":{"t":"num"},"opt":false}],
  inner$trustReport$anyCritical: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$anyCritical$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"failing","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$grade: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"checks","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$trustReport$grade$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"score","d":{"t":"num"},"opt":false},{"name":"anyCritical","d":{"t":"bool"},"opt":false}],
};
