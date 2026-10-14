// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/people/cmpsheet.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$val$m(M, id) {
    const m = M.find(x => x.id === id);
    return m;
}

export const SIGS = {
  inner$val$m: [{"name":"M","d":{"t":"any"},"opt":false},{"name":"id","d":{"t":"any"},"opt":false}],
};
