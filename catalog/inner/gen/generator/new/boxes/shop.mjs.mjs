// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/shop.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$pendingCount$product(db, a) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    return product;
}
export function inner$progressOf$product(db, a) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    return product;
}

export const SIGS = {
  inner$pendingCount$product: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$progressOf$product: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
};
