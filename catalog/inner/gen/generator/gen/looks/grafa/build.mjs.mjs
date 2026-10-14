// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/grafa/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const lum = (h) => {
    const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255)
        .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};
export function inner$lum$c(h) {
    const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255)
        .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c;
}
export function inner$cr$x(a) {
    const x = lum(a);
    return x;
}
export function inner$cr$y(b) {
    const y = lum(b);
    return y;
}
export function inner$mixHex$map$a(h, i) {
    const a = parseInt(h.substr(i, 2), 16);
    return a;
}
export function inner$mixHex$map$b(t, i) {
    const b = parseInt(t.substr(i, 2), 16);
    return b;
}
export function inner$map$over(a, pl) {
    const over = a > pl;
    return over;
}
export function inner$map$w(a, pl) {
    const w = Math.max(a, pl) || 1;
    return w;
}

export const SIGS = {
  inner$lum$c: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$cr$x: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$cr$y: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$mixHex$map$a: [{"name":"h","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$mixHex$map$b: [{"name":"t","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$map$over: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"pl","d":{"t":"num"},"opt":false}],
  inner$map$w: [{"name":"a","d":{"t":"num"},"opt":false},{"name":"pl","d":{"t":"num"},"opt":false}],
};
