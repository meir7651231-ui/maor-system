// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/undo-last.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$undoLast$last(c) {
    const last = c.log[c.log.length - 1];
    return last;
}
export function inner$undoLast$at(c, queue) {
    const last = c.log[c.log.length - 1];
    const at = queue.lastIndexOf(last.id);
    return at;
}
export function inner$undoLast$at$$step(last, queue) {
    const at = queue.lastIndexOf(last.id);
    return at;
}

export const SIGS = {
  inner$undoLast$last: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$undoLast$at: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"queue","d":{"t":"any"},"opt":false}],
  inner$undoLast$at$$step: [{"name":"last","d":{"t":"any"},"opt":false},{"name":"queue","d":{"t":"any"},"opt":false}],
};
