// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/buybox/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$split$w(n) {
    const w = Math.floor(n);
    return w;
}
export function inner$split$c(n) {
    const w = Math.floor(n);
    const c = Math.round((n - w) * 100);
    return c;
}
export function inner$split$c$$step(n, w) {
    const c = Math.round((n - w) * 100);
    return c;
}

export const SIGS = {
  inner$split$w: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$split$c: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$split$c$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"w","d":{"t":"num"},"opt":false}],
};
