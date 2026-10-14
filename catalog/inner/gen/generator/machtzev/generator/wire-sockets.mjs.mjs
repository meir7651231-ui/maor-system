// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/wire-sockets.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$map$m(p) {
    const m = String(p).match(/^(.+?)\s+(\w+)\s*$/);
    return m;
}

export const SIGS = {
  inner$map$m: [{"name":"p","d":{"t":"str"},"opt":false}],
};
