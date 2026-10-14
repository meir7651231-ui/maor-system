// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/effective-price.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$effectivePrice$base(basePrice) {
    const base = Number.isFinite(basePrice) ? basePrice : 0;
    return base;
}

export const SIGS = {
  inner$effectivePrice$base: [{"name":"basePrice","d":{"t":"any"},"opt":false}],
};
