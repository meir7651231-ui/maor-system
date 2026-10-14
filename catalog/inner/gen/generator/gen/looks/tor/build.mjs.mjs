// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/tor/build.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$R$t(S) {
    let t = Math.imul(S ^ S >>> 15, 1 | S);
    return t;
}

export const SIGS = {
  inner$R$t: [{"name":"S","d":{"t":"num"},"opt":false}],
};
