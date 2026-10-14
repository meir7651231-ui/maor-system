// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/audit-report-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$auditReportLines$L(orgName, nowLabel, T) {
    const L = [T.k1 + (orgName || T.k2), T.k3 + nowLabel, ''];
    return L;
}
export function inner$auditReportLines$L$$after_loop(orgName, issues, nowLabel, T) {
    const L = [T.k1 + (orgName || T.k2), T.k3 + nowLabel, ''];
    for (const i of issues)
        L.push('[' + i.cat + '] ' + i.title);
    return L;
}

export const SIGS = {
  inner$auditReportLines$L: [{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"nowLabel","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$auditReportLines$L$$after_loop: [{"name":"orgName","d":{"t":"any"},"opt":false},{"name":"issues","d":{"t":"any"},"opt":false},{"name":"nowLabel","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
