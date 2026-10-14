// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/server.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$declaredServer$m(SERVER_RE, specText) {
    const m = String(specText || '').match(SERVER_RE);
    return m;
}

export const SIGS = {
  inner$declaredServer$m: [{"name":"SERVER_RE","d":{"t":"any"},"opt":false},{"name":"specText","d":{"t":"any"},"opt":false}],
};
