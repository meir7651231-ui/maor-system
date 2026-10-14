// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/free-ref-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$scan$walk$isProp(ts, n, p) {
    const isProp = p && p.kind === ts.SyntaxKind.PropertyAccessExpression && p.name === n;
    return isProp;
}
export function inner$scan$walk$isKey(ts, n, p) {
    const isKey = p && (p.kind === ts.SyntaxKind.PropertyAssignment && p.name === n);
    return isKey;
}

export const SIGS = {
  inner$scan$walk$isProp: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
  inner$scan$walk$isKey: [{"name":"ts","d":{"t":"any"},"opt":false},{"name":"n","d":{"t":"any"},"opt":false},{"name":"p","d":{"t":"any"},"opt":false}],
};
