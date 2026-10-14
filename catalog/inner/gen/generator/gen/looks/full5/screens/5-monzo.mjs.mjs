// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/full5/screens/5-monzo.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$body$c$bg(cols, i) {
    const [bg, fg] = cols[i % 4].split(':');
    return bg;
}
export function inner$body$c$fg(cols, i) {
    const [bg, fg] = cols[i % 4].split(':');
    return fg;
}
export function inner$body$budTot(D) {
    const budTot = D.budget.reduce((a, b) => a + b.actual, 0);
    return budTot;
}

export const SIGS = {
  inner$body$c$bg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$c$fg: [{"name":"cols","d":{"t":"arr","of":{"t":"str"}},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$body$budTot: [{"name":"D","d":{"t":"any"},"opt":false}],
};
