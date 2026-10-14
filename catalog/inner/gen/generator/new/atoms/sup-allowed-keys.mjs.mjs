// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup-allowed-keys.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$supAllowedKeys$clean(allowed, T) {
    const clean = [...new Set(allowed.map((s) => s.trim()).filter(Boolean))].slice(0, T.k1);
    return clean;
}

export const SIGS = {
  inner$supAllowedKeys$clean: [{"name":"allowed","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
