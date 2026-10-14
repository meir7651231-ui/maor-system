// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/learn-check.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$field$l(e, k) {
    const l = e.body.find((x) => x.startsWith(k + ':'));
    return l;
}

export const SIGS = {
  inner$field$l: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"k","d":{"t":"any"},"opt":false}],
};
