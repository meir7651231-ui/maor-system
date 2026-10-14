// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/enum-values.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$quarry$vals(m) {
    const vals = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
    return vals;
}
export function inner$quarry$enums$$after_loop(src) {
    const enums = {};
    for (const m of src.matchAll(/^export type (\w+) =\s*\|?\s*((?:'[^']*'\s*\|?\s*)+);/gm)) {
        const vals = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
        if (vals.length >= 2)
            enums[m[1]] = vals;
    }
    return enums;
}

export const SIGS = {
  inner$quarry$vals: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$quarry$enums$$after_loop: [{"name":"src","d":{"t":"any"},"opt":false}],
};
