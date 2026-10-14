// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/item-of.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$itemOf$item(db, comp) {
    const item = db.shopItems.find((i) => i.id === comp.itemId);
    return item;
}

export const SIGS = {
  inner$itemOf$item: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"comp","d":{"t":"any"},"opt":false}],
};
