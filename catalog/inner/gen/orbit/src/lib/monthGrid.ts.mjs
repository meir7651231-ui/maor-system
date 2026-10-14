// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/monthGrid.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function indexByDate(events) {
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
export function inner$indexByDate$arr(byDate, ev) {
    const arr = byDate.get(ev.date) ?? [];
    return arr;
}
export function inner$buildWeekGrid$byDate(events) {
    const byDate = indexByDate(events);
    return byDate;
}
export function inner$buildWeekGrid$anchor(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    return anchor;
}
export function inner$buildWeekGrid$sunday(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    return sunday;
}
export function inner$buildWeekGrid$sunday$$step(anchor) {
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    return sunday;
}
export function inner$buildWeekGrid$d(anchorIso, i) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$buildWeekGrid$d$$step(sunday, i) {
    const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    return d;
}
export function inner$buildWeekGrid$sat(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    const sunday = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay());
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$buildWeekGrid$sat$$step(sunday) {
    const sat = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
    return sat;
}
export function inner$buildDayGrid$byDate(events) {
    const byDate = indexByDate(events);
    return byDate;
}
export function inner$buildDayGrid$anchor(anchorIso) {
    const anchor = new Date(anchorIso + 'T12:00:00');
    return anchor;
}
export function inner$buildMonthGrid$byDate(events) {
    const byDate = indexByDate(events);
    return byDate;
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
export function inner$indexByDate$byDate$$after_loop(events) {
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
  inner$indexByDate$arr: [{"name":"byDate","d":{"t":"map","k":{"t":"str"},"v":{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}}},"opt":false},{"name":"ev","d":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}},"opt":false}],
  inner$buildWeekGrid$byDate: [{"name":"events","d":{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}},"opt":false}],
  inner$buildWeekGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sunday: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sunday$$step: [{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$buildWeekGrid$d: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildWeekGrid$d$$step: [{"name":"sunday","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildWeekGrid$sat: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildWeekGrid$sat$$step: [{"name":"sunday","d":{"t":"date"},"opt":false}],
  inner$buildDayGrid$byDate: [{"name":"events","d":{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}},"opt":false}],
  inner$buildDayGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildMonthGrid$byDate: [{"name":"events","d":{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}},"opt":false}],
  inner$buildMonthGrid$anchor: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildMonthGrid$first: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildMonthGrid$first$$step: [{"name":"anchor","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$start: [{"name":"anchorIso","d":{"t":"str"},"opt":false}],
  inner$buildMonthGrid$start$$step: [{"name":"first","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$d: [{"name":"anchorIso","d":{"t":"str"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildMonthGrid$d$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$buildMonthGrid$last: [{"name":"days","d":{"t":"arr","of":{"t":"date"}},"opt":false}],
  inner$buildMonthGrid$i: [{"name":"first","d":{"t":"date"},"opt":false}],
  inner$buildMonthGrid$lastCell: [{"name":"cells","d":{"t":"arr","of":{"t":"obj","n":"MonthGridCell","p":[["iso",{"t":"str"},false],["dayNum",{"t":"str"},false],["hebDay",{"t":"str"},false],["inMonth",{"t":"bool"},false],["holiday",{"t":"or","of":[{"t":"null"},{"t":"str"}]},false],["fullHoliday",{"t":"bool"},false],["events",{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}},false]]}},"opt":false}],
  inner$indexByDate$byDate$$after_loop: [{"name":"events","d":{"t":"arr","of":{"t":"tp","id":"E","of":{"t":"obj","p":[["date",{"t":"str"},false]]}}},"opt":false}],
};
