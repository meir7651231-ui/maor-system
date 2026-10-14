// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/normalize-prices.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normalizePrices$base(raw, T) {
    const base = raw && typeof raw === T.k1 ? raw : {};
    return base;
}

export const SIGS = {
  inner$normalizePrices$base: [{"name":"raw","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
