// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/parse-csv.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$parseCsv$t(text) {
    const t = text.replace(/^\uFEFF/, '');
    return t;
}
export function inner$parseCsv$nl(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    return nl;
}
export function inner$parseCsv$nl$$step(t) {
    const nl = t.indexOf('\n');
    return nl;
}
export function inner$parseCsv$firstLine(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    return firstLine;
}
export function inner$parseCsv$firstLine$$step(t, nl) {
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    return firstLine;
}
export function inner$parseCsv$delim(text) {
    const t = text.replace(/^\uFEFF/, '');
    const nl = t.indexOf('\n');
    const firstLine = nl < 0 ? t : t.slice(0, nl);
    const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ',';
    return delim;
}
export function inner$parseCsv$delim$$step(firstLine) {
    const delim = (firstLine.split('\t').length - 1) > (firstLine.split(',').length - 1) ? '\t' : ',';
    return delim;
}

export const SIGS = {
  inner$parseCsv$t: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseCsv$nl: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseCsv$nl$$step: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$parseCsv$firstLine: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseCsv$firstLine$$step: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"nl","d":{"t":"num"},"opt":false}],
  inner$parseCsv$delim: [{"name":"text","d":{"t":"any"},"opt":false}],
  inner$parseCsv$delim$$step: [{"name":"firstLine","d":{"t":"any"},"opt":false}],
};
