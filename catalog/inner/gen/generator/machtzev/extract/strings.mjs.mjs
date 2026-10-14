// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/strings.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$viaTerm(line, m) {
    const viaTerm = line.includes('termOf(') && line.indexOf('termOf(') < m.index;
    return viaTerm;
}

export const SIGS = {
  inner$forEach$viaTerm: [{"name":"line","d":{"t":"any"},"opt":false},{"name":"m","d":{"t":"any"},"opt":false}],
};
