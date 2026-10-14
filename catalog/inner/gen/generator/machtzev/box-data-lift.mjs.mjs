// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/box-data-lift.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$annotatedMath$line(src, startPos) {
    const line = src.slice(0, startPos).split('\n').length - 1;
    return line;
}

export const SIGS = {
  inner$annotatedMath$line: [{"name":"src","d":{"t":"any"},"opt":false},{"name":"startPos","d":{"t":"any"},"opt":false}],
};
