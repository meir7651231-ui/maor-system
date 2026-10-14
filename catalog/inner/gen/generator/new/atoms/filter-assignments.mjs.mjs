// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/filter-assignments.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$filterAssignments$smartFilter$fam(db, a) {
    const fam = db.families.find((f) => f.id === a.famId);
    return fam;
}
export function inner$filterAssignments$smartFilter$product(db, a) {
    const product = db.shopProducts.find((p) => p.id === a.productId);
    return product;
}

export const SIGS = {
  inner$filterAssignments$smartFilter$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
  inner$filterAssignments$smartFilter$product: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"a","d":{"t":"any"},"opt":false}],
};
