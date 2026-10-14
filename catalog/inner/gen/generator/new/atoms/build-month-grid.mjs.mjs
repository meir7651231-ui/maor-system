// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-month-grid.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildMonthGrid$arr(byDate, ev) {
    const arr = byDate.get(ev.date) ?? [];
    return arr;
}
export function inner$buildMonthGrid$anchor(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    return anchor;
}
export function inner$buildMonthGrid$first(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return first;
}
export function inner$buildMonthGrid$first$$step(anchor) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return first;
}
export function inner$buildMonthGrid$start(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return start;
}
export function inner$buildMonthGrid$start$$step(first) {
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    return start;
}
export function inner$buildMonthGrid$d(anchorIso, i) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$buildMonthGrid$d$$step(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$buildMonthGrid$last(days) {
    const last = days[days.length - 1];
    return last;
}
export function inner$buildMonthGrid$i(first) {
    let i = first.getDay();
    return i;
}
export function inner$buildMonthGrid$lastCell(cells) {
    const lastCell = new Date(cells[cells.length - 1].iso + 'T12:00:00');
    return lastCell;
}
export function inner$buildMonthGrid$byDate$$after_loop(events) {
    const byDate = new Map();
    for (const ev of events) {
        if (!ev.date)
            continue;
        const arr = byDate.get(ev.date) ?? [];
        arr.push(ev);
        byDate.set(ev.date, arr);
    }
    return byDate;
}

export const SIGS = {
  inner$buildMonthGrid$arr: [{"name":"byDate","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
  inner$buildMonthGrid$anchor: [{"name":"anchorIso","d":{"t":"any"},"opt":false}],
  inner$buildMonthGrid$first: [{"name":"anchorIso","d":{"t":"any"},"opt":false}],
  inner$buildMonthGrid$first$$step: [{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$start: [{"name":"anchorIso","d":{"t":"any"},"opt":false}],
  inner$buildMonthGrid$start$$step: [{"name":"first","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$d: [{"name":"anchorIso","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildMonthGrid$d$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildMonthGrid$last: [{"name":"days","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildMonthGrid$i: [{"name":"first","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$lastCell: [{"name":"cells","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$buildMonthGrid$byDate$$after_loop: [{"name":"events","d":{"t":"any"},"opt":false}],
};
