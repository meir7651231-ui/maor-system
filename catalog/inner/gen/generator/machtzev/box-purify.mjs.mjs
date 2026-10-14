// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/box-purify.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$walk$parts(n) {
    const parts = [n.head.text, ...n.templateSpans.map(s => s.literal.text)];
    return parts;
}
export function inner$purifyExpr$x(src, es, ee) {
    let x = src.slice(es, ee);
    return x;
}

export const SIGS = {
  inner$walk$parts: [{"name":"n","d":{"t":"any"},"opt":false}],
  inner$purifyExpr$x: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"es","d":{"t":"any"},"opt":false},{"name":"ee","d":{"t":"any"},"opt":false}],
};
