// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/sulam/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ORDER = ['חינוך', 'מנהלה', 'משק', 'תפעול'];
export function inner$flatMap$g(D, d) {
    const g = D.people.filter(p => p.dom === d);
    return g;
}
export function inner$map$x(D, d) {
    const x = D.doms.find(y => y.name === d);
    return x;
}
export function inner$map$i(p) {
    const i = ORDER.indexOf(p.dom);
    return i;
}

export const SIGS = {
  inner$flatMap$g: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"str"},"opt":false}],
  inner$map$x: [{"name":"D","d":{"t":"any"},"opt":false},{"name":"d","d":{"t":"str"},"opt":false}],
  inner$map$i: [{"name":"p","d":{"t":"any"},"opt":false}],
};
