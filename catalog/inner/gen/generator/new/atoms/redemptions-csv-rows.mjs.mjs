// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/redemptions-csv-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$redemptionsCsvRows$product(db, a) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    return product;
}
export function inner$redemptionsCsvRows$comp(db, a, r) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    const comp = product?.components.find((c) => c.id === r.componentId);
    return comp;
}
export function inner$redemptionsCsvRows$comp$$step(product, r) {
    const comp = product?.components.find((c) => c.id === r.componentId);
    return comp;
}

export const SIGS = {
  inner$redemptionsCsvRows$product: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$redemptionsCsvRows$comp: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$redemptionsCsvRows$comp$$step: [{"name":"product","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
};
