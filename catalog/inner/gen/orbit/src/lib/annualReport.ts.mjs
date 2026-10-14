// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/annualReport.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function donationsOfYear(donations, year) {
    return donations.filter((d) => (d.date || '').startsWith(year + '-')).sort((a, b) => a.date.localeCompare(b.date));
}
export function inner$annualReportLines$rows(inp) {
    const rows = donationsOfYear(inp.donations, inp.year);
    return rows;
}
export function inner$annualReportLines$ils(inp) {
    const rows = donationsOfYear(inp.donations, inp.year);
    const ils = rows.filter((d) => d.cur !== '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return ils;
}
export function inner$annualReportLines$ils$$step(rows) {
    const ils = rows.filter((d) => d.cur !== '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return ils;
}
export function inner$annualReportLines$usd(inp) {
    const rows = donationsOfYear(inp.donations, inp.year);
    const usd = rows.filter((d) => d.cur === '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return usd;
}
export function inner$annualReportLines$usd$$step(rows) {
    const usd = rows.filter((d) => d.cur === '$').reduce((a, d) => a + (Number.isFinite(d.amount) ? d.amount : 0), 0);
    return usd;
}
export function inner$annualReportLines$out(inp) {
    const D = inp.terms?.donations ?? 'תרומות';
    const S = inp.terms?.supporter ?? 'התורם/ת';
    const out = [
        '='.repeat(46),
        '        דוח ' + D + ' שנתי — שנת ' + inp.year,
        '='.repeat(46),
        '',
        'הארגון: ' + inp.orgName,
        ...(inp.orgTaxId ? ['מס׳ עמותה/מלכ"ר: ' + inp.orgTaxId] : []),
        S + ': ' + inp.supporterName + (inp.payerId ? ' · ת"ז ' + inp.payerId : ''),
        '',
        '-'.repeat(46),
    ];
    return out;
}
export function inner$annualReportLines$out$$step(inp, D, S) {
    const out = [
        '='.repeat(46),
        '        דוח ' + D + ' שנתי — שנת ' + inp.year,
        '='.repeat(46),
        '',
        'הארגון: ' + inp.orgName,
        ...(inp.orgTaxId ? ['מס׳ עמותה/מלכ"ר: ' + inp.orgTaxId] : []),
        S + ': ' + inp.supporterName + (inp.payerId ? ' · ת"ז ' + inp.payerId : ''),
        '',
        '-'.repeat(46),
    ];
    return out;
}

export const SIGS = {
  inner$annualReportLines$rows: [{"name":"inp","d":{"t":"obj","n":"AnnualReportInput","p":[["orgName",{"t":"str"},false],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporterName",{"t":"str"},false],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"str"},false],["donations",{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AnnualReportTerms","p":[["donations",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$annualReportLines$ils: [{"name":"inp","d":{"t":"obj","n":"AnnualReportInput","p":[["orgName",{"t":"str"},false],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporterName",{"t":"str"},false],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"str"},false],["donations",{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AnnualReportTerms","p":[["donations",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$annualReportLines$ils$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$annualReportLines$usd: [{"name":"inp","d":{"t":"obj","n":"AnnualReportInput","p":[["orgName",{"t":"str"},false],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporterName",{"t":"str"},false],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"str"},false],["donations",{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AnnualReportTerms","p":[["donations",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$annualReportLines$usd$$step: [{"name":"rows","d":{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},"opt":false}],
  inner$annualReportLines$out: [{"name":"inp","d":{"t":"obj","n":"AnnualReportInput","p":[["orgName",{"t":"str"},false],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporterName",{"t":"str"},false],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"str"},false],["donations",{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AnnualReportTerms","p":[["donations",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false}],
  inner$annualReportLines$out$$step: [{"name":"inp","d":{"t":"obj","n":"AnnualReportInput","p":[["orgName",{"t":"str"},false],["orgTaxId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporterName",{"t":"str"},false],["payerId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"str"},false],["donations",{"t":"arr","of":{"t":"obj","n":"AnnualDonation","p":[["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["rid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["designation",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["site",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["terms",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"AnnualReportTerms","p":[["donations",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporter",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["supporters",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},true]]},"opt":false},{"name":"D","d":{"t":"str"},"opt":false},{"name":"S","d":{"t":"str"},"opt":false}],
};
