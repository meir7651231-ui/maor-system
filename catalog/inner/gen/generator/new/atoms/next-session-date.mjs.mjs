// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/next-session-date.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$nextSessionDate$t(ss) {
    const t = (ss.time || '17:00').split(':');
    return t;
}
export function inner$nextSessionDate$d(n, ss) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    return d;
}
export function inner$nextSessionDate$d$$step(n, t) {
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    return d;
}
export function inner$nextSessionDate$add(n, ss) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    let add = (ss.day - d.getDay() + 7) % 7;
    return add;
}
export function inner$nextSessionDate$add$$step(ss, d) {
    let add = (ss.day - d.getDay() + 7) % 7;
    return add;
}

export const SIGS = {
  inner$nextSessionDate$t: [{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$nextSessionDate$d: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$nextSessionDate$d$$step: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
  inner$nextSessionDate$add: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$nextSessionDate$add$$step: [{"name":"ss","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"date"},"opt":false}],
};
