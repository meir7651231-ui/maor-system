// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-ics.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildIcs$nextIso$d(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d;
}
export function inner$buildIcs$parsedStart(oc) {
    const parsedStart = oc.time && /^\d{2}:\d{2}$/.test(oc.time) ? new Date(oc.date + 'T' + oc.time + ':00') : null;
    return parsedStart;
}
export function inner$buildIcs$end(T2, oc) {
    const parsedStart = oc.time && /^\d{2}:\d{2}$/.test(oc.time) ? new Date(oc.date + 'T' + oc.time + ':00') : null;
    const end = new Date(parsedStart.getTime() + T2.k19);
    return end;
}
export function inner$buildIcs$end$$step(T2, parsedStart) {
    const end = new Date(parsedStart.getTime() + T2.k19);
    return end;
}

export const SIGS = {
  inner$buildIcs$nextIso$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildIcs$parsedStart: [{"name":"oc","d":{"t":"any"},"opt":false}],
  inner$buildIcs$end: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"oc","d":{"t":"any"},"opt":false}],
  inner$buildIcs$end$$step: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"parsedStart","d":{"t":"or","of":[{"t":"null"},{"t":"date"}]},"opt":false}],
};
