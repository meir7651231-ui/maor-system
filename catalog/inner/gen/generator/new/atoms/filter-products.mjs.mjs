// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/filter-products.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$filterProducts$base(products, onlyActive) {
    const base = onlyActive ? products.filter((p) => p.active) : [...products];
    return base;
}

export const SIGS = {
  inner$filterProducts$base: [{"name":"products","d":{"t":"any"},"opt":false},{"name":"onlyActive","d":{"t":"any"},"opt":false}],
};
