// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/ics.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function icsEscape(s) {
    return (s || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}
function stampUtc(now) {
    const p = (n) => String(n).padStart(2, '0');
    return (String(now.getUTCFullYear()) + p(now.getUTCMonth() + 1) + p(now.getUTCDate()) +
        'T' + p(now.getUTCHours()) + p(now.getUTCMinutes()) + p(now.getUTCSeconds()) + 'Z');
}
export function inner$nextIso$d(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d;
}
export function inner$buildIcs$lines(calName) {
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//maor-system//he//',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:' + icsEscape(calName),
    ];
    return lines;
}
export function inner$buildIcs$stamp(now) {
    const stamp = stampUtc(now);
    return stamp;
}
export function inner$buildIcs$parsedStart(oc) {
    const parsedStart = oc.time && /^\d{2}:\d{2}$/.test(oc.time) ? new Date(oc.date + 'T' + oc.time + ':00') : null;
    return parsedStart;
}
export function inner$buildIcs$end(oc) {
    const parsedStart = oc.time && /^\d{2}:\d{2}$/.test(oc.time) ? new Date(oc.date + 'T' + oc.time + ':00') : null;
    const end = new Date(parsedStart.getTime() + 3600e3);
    return end;
}
export function inner$buildIcs$end$$step(parsedStart) {
    const end = new Date(parsedStart.getTime() + 3600e3);
    return end;
}

export const SIGS = {
  inner$nextIso$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$buildIcs$lines: [{"name":"calName","d":{"t":"str"},"opt":false}],
  inner$buildIcs$stamp: [{"name":"now","d":{"t":"date"},"opt":false}],
  inner$buildIcs$parsedStart: [{"name":"oc","d":{"t":"obj","n":"IcsOccurrence","p":[["uid",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["notes",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["location",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildIcs$end: [{"name":"oc","d":{"t":"obj","n":"IcsOccurrence","p":[["uid",{"t":"str"},false],["title",{"t":"str"},false],["date",{"t":"str"},false],["time",{"t":"str"},false],["notes",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["location",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$buildIcs$end$$step: [{"name":"parsedStart","d":{"t":"or","of":[{"t":"null"},{"t":"date"}]},"opt":false}],
};
