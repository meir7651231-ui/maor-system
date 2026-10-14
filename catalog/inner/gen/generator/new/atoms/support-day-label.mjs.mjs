// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/support-day-label.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supportDayLabel$day(at, T) {
    const day = at.slice(0, T.k3);
    return day;
}
export function inner$supportDayLabel$t(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    return t;
}
export function inner$supportDayLabel$y(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const y = t.getFullYear();
    return y;
}
export function inner$supportDayLabel$y$$step(t) {
    const y = t.getFullYear();
    return y;
}
export function inner$supportDayLabel$m(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const m = String(t.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$supportDayLabel$m$$step(t) {
    const m = String(t.getMonth() + 1).padStart(2, '0');
    return m;
}
export function inner$supportDayLabel$dd(todayIso) {
    const t = new Date(todayIso + 'T12:00:00');
    const dd = String(t.getDate()).padStart(2, '0');
    return dd;
}
export function inner$supportDayLabel$dd$$step(t) {
    const dd = String(t.getDate()).padStart(2, '0');
    return dd;
}
export function inner$supportDayLabel$yy(at, T) {
    const day = at.slice(0, T.k3);
    const [yy, mm, d2] = day.split('-');
    return yy;
}
export function inner$supportDayLabel$yy$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return yy;
}
export function inner$supportDayLabel$mm(at, T) {
    const day = at.slice(0, T.k3);
    const [yy, mm, d2] = day.split('-');
    return mm;
}
export function inner$supportDayLabel$mm$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return mm;
}
export function inner$supportDayLabel$d2(at, T) {
    const day = at.slice(0, T.k3);
    const [yy, mm, d2] = day.split('-');
    return d2;
}
export function inner$supportDayLabel$d2$$step(day) {
    const [yy, mm, d2] = day.split('-');
    return d2;
}

export const SIGS = {
  inner$supportDayLabel$day: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$t: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$y: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$y$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$m: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$m$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$dd: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$dd$$step: [{"name":"t","d":{"t":"date"},"opt":false}],
  inner$supportDayLabel$yy: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$yy$$step: [{"name":"day","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$mm: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$mm$$step: [{"name":"day","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$d2: [{"name":"at","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$supportDayLabel$d2$$step: [{"name":"day","d":{"t":"any"},"opt":false}],
};
