// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/push-diff.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pushDiff$keyed(sup, s) {
    const keyed = sup.enforceOn && sup.keyedCols.includes(s.col);
    return keyed;
}

export const SIGS = {
  inner$pushDiff$keyed: [{"name":"sup","d":{"t":"obj","p":[["enforceOn",{"t":"bool"},false],["keyedCols",{"t":"arr","of":{"t":"undef"}},false],["docSkey",{"t":"null"},false],["stripAuditMeta",{"t":"null"},false]]},"opt":false},{"name":"s","d":{"t":"any"},"opt":false}],
};
