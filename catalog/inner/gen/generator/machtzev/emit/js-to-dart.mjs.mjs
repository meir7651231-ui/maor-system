// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/emit/js-to-dart.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$emitToDart$replace$mm(rxs, i) {
    const r = rxs[+i];
    const mm = r.match(/^\/([^]*)\/([gimsuy]*)$/);
    return mm;
}
export function inner$emitToDart$replace$mm$$step(r) {
    const mm = r.match(/^\/([^]*)\/([gimsuy]*)$/);
    return mm;
}
export function inner$dartParams$map$d(x) {
    const d = x.match(/^(\w+)\s*=\s*(.+)$/);
    return d;
}

export const SIGS = {
  inner$emitToDart$replace$mm: [{"name":"rxs","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"i","d":{"t":"any"},"opt":false}],
  inner$emitToDart$replace$mm$$step: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$dartParams$map$d: [{"name":"x","d":{"t":"any"},"opt":false}],
};
