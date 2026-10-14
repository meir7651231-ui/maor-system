// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/flags.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$m(line) {
    let m = line.match(/\{\s*key:\s*'([^']+)'\s*,\s*label:\s*'([^']*)'/);
    return m;
}

export const SIGS = {
  inner$forEach$m: [{"name":"line","d":{"t":"any"},"opt":false}],
};
