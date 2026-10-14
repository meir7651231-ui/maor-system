// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/balagan-run.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$measure$amt(r) {
    const amt = Object.entries(r || {}).find(([k]) => /פיקדון/.test(k) && !/תאריך/.test(k));
    return amt;
}
export function inner$measure$dt(r) {
    const dt = Object.entries(r || {}).find(([k]) => /תאריך/.test(k));
    return dt;
}

export const SIGS = {
  inner$measure$amt: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$measure$dt: [{"name":"r","d":{"t":"any"},"opt":false}],
};
