// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/parity-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$emitTest$s(src) {
    let s = src.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    return s;
}

export const SIGS = {
  inner$emitTest$s: [{"name":"src","d":{"t":"any"},"opt":false}],
};
