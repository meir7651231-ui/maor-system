// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/ayin-daily-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ayinDailyRows$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$ayinDailyRows$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$ayinDailyRows$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$ayinDailyRows$rows(T, unit, item) {
    const rows = [
        [T.k1, T.k2, `${unit}${T.k6}`, T.k3, item, T.k4, T.k5],
    ];
    return rows;
}
export function inner$ayinDailyRows$touched(supporters, todayIso) {
    const touched = supporters.filter((sp) => sp.ayin && (sp.ayin.lastTouch === todayIso || sp.ayin.log?.some((l) => l.date === todayIso)));
    return touched;
}
export function inner$ayinDailyRows$logToday(todayIso, a) {
    const logToday = a.log.filter((l) => l.date === todayIso);
    return logToday;
}
export function inner$ayinDailyRows$namesLine(a) {
    const namesLine = a.names
        .map((n) => n.name + (n.eyes !== '' && n.eyes != null ? ' ·' + n.eyes : '') + (n.done ? ' ✓' : ''))
        .join(' · ');
    return namesLine;
}
export function inner$ayinDailyRows$noteLine(a) {
    const noteLine = a.answers.map((x) => x.note).join(' | ') || a.note || '';
    return noteLine;
}

export const SIGS = {
  inner$ayinDailyRows$fmtD$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$fmtD$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$fmtD$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$rows: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"unit","d":{"t":"any"},"opt":false},{"name":"item","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$touched: [{"name":"supporters","d":{"t":"any"},"opt":false},{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$logToday: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$namesLine: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$ayinDailyRows$noteLine: [{"name":"a","d":{"t":"any"},"opt":false}],
};
