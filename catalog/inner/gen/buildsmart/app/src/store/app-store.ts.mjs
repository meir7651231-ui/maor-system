// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/store/app-store.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$computed$parent(path) {
    const parent = path.length === 0 ? null : path[path.length - 1];
    return parent;
}
export function inner$setQty$clamped(qty) {
    const clamped = Math.max(0, qty);
    return clamped;
}
export function inner$setQty$existing(cart, productId) {
    const existing = cart.value.find((l) => l.productId === productId);
    return existing;
}

export const SIGS = {
  inner$computed$parent: [{"name":"path","d":{"t":"any"},"opt":false}],
  inner$setQty$clamped: [{"name":"qty","d":{"t":"num"},"opt":false}],
  inner$setQty$existing: [{"name":"cart","d":{"t":"any"},"opt":false},{"name":"productId","d":{"t":"str"},"opt":false}],
};
