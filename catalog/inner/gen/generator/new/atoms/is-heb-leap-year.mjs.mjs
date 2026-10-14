// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/is-heb-leap-year.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$isHebLeapYear$hit(leapCache, hebYear) {
    const hit = leapCache.get(hebYear);
    return hit;
}

export const SIGS = {
  inner$isHebLeapYear$hit: [{"name":"leapCache","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"hebYear","d":{"t":"any"},"opt":false}],
};
