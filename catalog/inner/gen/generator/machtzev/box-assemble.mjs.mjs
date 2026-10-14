// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/box-assemble.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$map$orig(x) {
    const [orig, alias] = x.split(/\s+as\s+/).map(s => s.trim());
    return orig;
}
export function inner$map$alias(x) {
    const [orig, alias] = x.split(/\s+as\s+/).map(s => s.trim());
    return alias;
}
export function inner$ser$s(v) {
    const s = JSON.stringify(v);
    return s;
}

export const SIGS = {
  inner$map$orig: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$map$alias: [{"name":"x","d":{"t":"any"},"opt":false}],
  inner$ser$s: [{"name":"v","d":{"t":"any"},"opt":false}],
};
