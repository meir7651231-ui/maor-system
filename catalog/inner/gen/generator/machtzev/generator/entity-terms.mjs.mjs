// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/generator/entity-terms.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function inner$resolveEntity$c(suffix) {
    const c = [pascal(suffix), pascal(suffix.replace(/s$/, '')), pascal(suffix.replace(/Of$/, ''))];
    return c;
}
export function inner$quarry$v(m) {
    const v = m[2].trim();
    return v;
}

export const SIGS = {
  inner$resolveEntity$c: [{"name":"suffix","d":{"t":"any"},"opt":false}],
  inner$quarry$v: [{"name":"m","d":{"t":"any"},"opt":false}],
};
