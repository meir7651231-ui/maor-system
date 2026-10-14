// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/extract/schema.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$ent(line) {
    const ent = line.match(/(?:export interface|class)\s+([A-Z][A-Za-z0-9]*)/);
    return ent;
}
export function inner$forEach$fld(line) {
    const fld = line.match(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)(\??):\s*([^;]+);/);
    return fld;
}

export const SIGS = {
  inner$forEach$ent: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$forEach$fld: [{"name":"line","d":{"t":"any"},"opt":false}],
};
