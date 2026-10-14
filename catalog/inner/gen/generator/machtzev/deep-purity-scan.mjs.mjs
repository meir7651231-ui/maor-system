// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/deep-purity-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DEEP_CRIT = /(^|[^a-z])id$|idnum|^hok$|extid|^rid|passw|iban|acct|amount|seq|dek|token/i;
export function inner$isPureData$skel(code) {
    const skel = code.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
    return skel;
}
export function inner$isLaw6$q(ln) {
    let q = Math.max(0, ln - 2);
    return q;
}
export function inner$walk$isExp(_ts, n) {
    const isExp = (n.modifiers || []).some(m => m.kind === _ts.SyntaxKind.ExportKeyword);
    return isExp;
}
export function inner$walk$val(n) {
    const val = parseFloat(n.text);
    return val;
}
export function inner$deepFindings$crit(f1) {
    const crit = DEEP_CRIT.test(f1);
    return crit;
}
export function inner$deepFindings$seqM(dbody) {
    const seqM = dbody.match(/\b(?:seq|serial|counter|receiptseq|donationseq|shopreceiptseq)\w*\+\+/i);
    return seqM;
}
export function inner$deepFindings$moneyM(dbody) {
    const moneyM = dbody.match(/reduce\([^\n]*\+[^\n]*\.(?:amount|ils|usd|price)\b/i) || dbody.match(/\.(?:amount|price)\s*[+*]/i);
    return moneyM;
}
export function inner$deepFindings$utcM(dbody) {
    const utcM = dbody.match(/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/);
    return utcM;
}

export const SIGS = {
  inner$isPureData$skel: [{"name":"code","d":{"t":"any"},"opt":false}],
  inner$isLaw6$q: [{"name":"ln","d":{"t":"num"},"opt":false}],
  inner$walk$isExp: [{"name":"_ts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false}],
  inner$walk$val: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$deepFindings$crit: [{"name":"f1","d":{"t":"any"},"opt":false}],
  inner$deepFindings$seqM: [{"name":"dbody","d":{"t":"any"},"opt":false}],
  inner$deepFindings$moneyM: [{"name":"dbody","d":{"t":"any"},"opt":false}],
  inner$deepFindings$utcM: [{"name":"dbody","d":{"t":"any"},"opt":false}],
};
