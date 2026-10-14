// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/assemble/gen-theme.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$keyOf$k(v) {
    const k = 'p_' + v.toLowerCase().replace(/[^a-z0-9]/g, '');
    return k;
}

export const SIGS = {
  inner$keyOf$k: [{"name":"v","d":{"t":"any"},"opt":false}],
};
