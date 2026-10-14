// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/receipt-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$receiptLines$d(o, T) {
    const d = new Date(o.date.slice(0, T.k29) + 'T12:00:00');
    return d;
}
export function inner$receiptLines$gregorian(o, T) {
    const d = new Date(o.date.slice(0, T.k29) + 'T12:00:00');
    const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
    return gregorian;
}
export function inner$receiptLines$gregorian$$step(o, d) {
    const gregorian = isNaN(d.getTime()) ? o.date : d.toLocaleDateString('he-IL');
    return gregorian;
}
export function inner$receiptLines$curSym(o) {
    const cur = o.currency || '₪';
    const curSym = cur === '$' ? '$' : '₪';
    return curSym;
}
export function inner$receiptLines$curSym$$step(cur) {
    const curSym = cur === '$' ? '$' : '₪';
    return curSym;
}
export function inner$receiptLines$isShopConfirmation(o) {
    const isShopConfirmation = o.rid.startsWith('S-');
    return isShopConfirmation;
}

export const SIGS = {
  inner$receiptLines$d: [{"name":"o","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$receiptLines$gregorian: [{"name":"o","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$receiptLines$gregorian$$step: [{"name":"o","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"date"},"opt":false}],
  inner$receiptLines$curSym: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$receiptLines$curSym$$step: [{"name":"cur","d":{"t":"any"},"opt":false}],
  inner$receiptLines$isShopConfirmation: [{"name":"o","d":{"t":"any"},"opt":false}],
};
