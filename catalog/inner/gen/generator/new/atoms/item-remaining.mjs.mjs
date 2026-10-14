// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/item-remaining.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$itemRemaining$item(db, itemId) {
    const item = db.shopItems.find((i) => i.id === itemId);
    return item;
}
export function inner$itemRemaining$p(db, a) {
    const p = db.shopProducts.find((x) => x.id === a.productId);
    return p;
}
export function inner$itemRemaining$c(db, a, r) {
    const p = db.shopProducts.find((x) => x.id === a.productId);
    const c = p.components.find((x) => x.id === r.componentId);
    return c;
}
export function inner$itemRemaining$c$$step(p, r) {
    const c = p.components.find((x) => x.id === r.componentId);
    return c;
}

export const SIGS = {
  inner$itemRemaining$item: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"itemId","d":{"t":"any"},"opt":false}],
  inner$itemRemaining$p: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$itemRemaining$c: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$itemRemaining$c$$step: [{"name":"p","d":{"t":"any"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
};
