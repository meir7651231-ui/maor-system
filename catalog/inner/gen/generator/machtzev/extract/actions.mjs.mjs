// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/actions.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$m(line) {
    const m = line.match(/^\s{2,6}([a-zA-Z0-9_]+):\s*(?:async\s*)?\(/);
    return m;
}

export const SIGS = {
  inner$forEach$m: [{"name":"line","d":{"t":"any"},"opt":false}],
};
