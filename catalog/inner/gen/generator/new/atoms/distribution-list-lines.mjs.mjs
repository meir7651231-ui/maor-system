// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/distribution-list-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$distributionListLines$product(db, productId) {
    const product = db.shopProducts.find((p) => p.id === productId);
    return product;
}
export function inner$distributionListLines$lines(db, productId, T) {
    const product = db.shopProducts.find((p) => p.id === productId);
    const lines = [T.k1 + (product?.name ?? ''), '='.repeat(T.k5)];
    return lines;
}
export function inner$distributionListLines$lines$$step(T, product) {
    const lines = [T.k1 + (product?.name ?? ''), '='.repeat(T.k5)];
    return lines;
}
export function inner$distributionListLines$active(db, productId, T) {
    const active = db.shopAssignments.filter((a) => a.productId === productId && a.status === T.k2);
    return active;
}
export function inner$distributionListLines$fam(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    return fam;
}

export const SIGS = {
  inner$distributionListLines$product: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"productId","d":{"t":"any"},"opt":false}],
  inner$distributionListLines$lines: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"productId","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$distributionListLines$lines$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"product","d":{"t":"any"},"opt":false}],
  inner$distributionListLines$active: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"productId","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$distributionListLines$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
};
