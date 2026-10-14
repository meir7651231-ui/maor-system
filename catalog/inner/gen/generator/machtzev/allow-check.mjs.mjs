// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/allow-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$opt$i(argv, k) {
    const i = argv.indexOf(k);
    return i;
}
export function inner$reasonExists$m(reason) {
    const m = reason.match(/^(?:הכרעה|decision)-(.+)$/);
    return m;
}
export function inner$reasonExists$x(reason) {
    const m = reason.match(/^(?:הכרעה|decision)-(.+)$/);
    const x = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return x;
}
export function inner$reasonExists$x$$step(m) {
    const x = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return x;
}
export function inner$parseAllows$m(line) {
    const m = line.match(/^Allow:\s*(.+?)\s*$/);
    return m;
}
export function inner$parseAllows$t(line) {
    const m = line.match(/^Allow:\s*(.+?)\s*$/);
    const t = m[1].match(/^([a-z-]+)(?::([^\s]+))?\s+(L[\w-]+|הכרעה-[A-Za-z0-9א-ת.-]+|decision-[A-Za-z0-9.-]+)$/);
    return t;
}
export function inner$parseAllows$t$$step(m) {
    const t = m[1].match(/^([a-z-]+)(?::([^\s]+))?\s+(L[\w-]+|הכרעה-[A-Za-z0-9א-ת.-]+|decision-[A-Za-z0-9.-]+)$/);
    return t;
}

export const SIGS = {
  inner$opt$i: [{"name":"argv","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
  inner$reasonExists$m: [{"name":"reason","d":{"t":"any"},"opt":false}],
  inner$reasonExists$x: [{"name":"reason","d":{"t":"any"},"opt":false}],
  inner$reasonExists$x$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$parseAllows$m: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseAllows$t: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$parseAllows$t$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
};
