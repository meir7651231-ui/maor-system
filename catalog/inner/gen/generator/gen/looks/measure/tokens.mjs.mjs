// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/measure/tokens.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pick$key(path) {
    const [key, ...rest] = path.split('.');
    return key;
}
export function inner$pick$rest(path) {
    const [key, ...rest] = path.split('.');
    return rest;
}
export function inner$pick$v$$after_loop(S, path) {
    const [key, ...rest] = path.split('.');
    let v = S[key];
    for (const p of rest)
        v = v && v[isNaN(+p) ? p : +p];
    return v;
}

export const SIGS = {
  inner$pick$key: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$pick$rest: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$pick$v$$after_loop: [{"name":"S","d":{"t":"any"},"opt":false},{"name":"path","d":{"t":"any"},"opt":false}],
};
