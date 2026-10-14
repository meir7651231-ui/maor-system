// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/annual-report-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$annualReportLines$ils(rows) {
    const ils = rows.filter((d) => d.cur !== '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return ils;
}
export function inner$annualReportLines$usd(rows) {
    const usd = rows.filter((d) => d.cur === '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return usd;
}
export function inner$annualReportLines$out(inp, T) {
    const out = [
        '='.repeat(T.k14),
        T.k1 + inp.year,
        '='.repeat(T.k14),
        '',
        T.k2 + inp.orgName,
        ...(inp.orgTaxId ? [T.k3 + inp.orgTaxId] : []),
        T.k4 + inp.supporterName + (inp.payerId ? T.k5 + inp.payerId : ''),
        '',
        '-'.repeat(T.k14),
    ];
    return out;
}

export const SIGS = {
  inner$annualReportLines$ils: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$annualReportLines$usd: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$annualReportLines$out: [{"name":"inp","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
