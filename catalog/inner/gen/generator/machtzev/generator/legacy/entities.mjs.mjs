// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/legacy/entities.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$forEach$ent(line) {
    const ent = line.match(/(?:export\s+interface|abstract\s+class|class)\s+([A-Z][A-Za-z0-9]*)/);
    return ent;
}
export function inner$forEach$fld(line) {
    let fld = line.match(/^\s{2,4}([a-zA-Z][a-zA-Z0-9_]*)(\??)\s*:\s*([^;=]+)[;=]/);
    return fld;
}
export function inner$forEach$d(line) {
    const d = line.match(/^\s*final\s+([\w<>,?. ]+?)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*;/);
    return d;
}

export const SIGS = {
  inner$forEach$ent: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$forEach$fld: [{"name":"line","d":{"t":"any"},"opt":false}],
  inner$forEach$d: [{"name":"line","d":{"t":"any"},"opt":false}],
};
