// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/commands-filter-commands.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
export function inner$filterCommands$q(query) {
    const q = norm(query);
    return q;
}
export function inner$filterCommands$tokens(query) {
    const q = norm(query);
    const tokens = q.split(' ');
    return tokens;
}
export function inner$filterCommands$tokens$$step(q) {
    const tokens = q.split(' ');
    return tokens;
}
export function inner$filterCommands$nl(c) {
    const nl = norm(c.label);
    return nl;
}
export function inner$filterCommands$score(query, T, c) {
    const q = norm(query);
    const nl = norm(c.label);
    let score = nl === q ? T.k2 : nl.startsWith(q) ? T.k3 : nl.includes(q) ? T.k4 : T.k5;
    return score;
}
export function inner$filterCommands$score$$step(T, q, nl) {
    let score = nl === q ? T.k2 : nl.startsWith(q) ? T.k3 : nl.includes(q) ? T.k4 : T.k5;
    return score;
}

export const SIGS = {
  inner$filterCommands$q: [{"name":"query","d":{"t":"any"},"opt":false}],
  inner$filterCommands$tokens: [{"name":"query","d":{"t":"any"},"opt":false}],
  inner$filterCommands$tokens$$step: [{"name":"q","d":{"t":"any"},"opt":false}],
  inner$filterCommands$nl: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$filterCommands$score: [{"name":"query","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
  inner$filterCommands$score$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"q","d":{"t":"any"},"opt":false},{"name":"nl","d":{"t":"any"},"opt":false}],
};
