// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/product-sheet.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ProductSheetPanel$hasPrice(product) {
    const hasPrice = typeof product.price === 'number' && product.price > 0;
    return hasPrice;
}
export function inner$ProductSheetPanel$total(product, qty) {
    const hasPrice = typeof product.price === 'number' && product.price > 0;
    const total = hasPrice
        ? (product.price * qty).toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
        : null;
    return total;
}
export function inner$ProductSheetPanel$total$$step(product, qty, hasPrice) {
    const total = hasPrice
        ? (product.price * qty).toLocaleString('he-IL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
        : null;
    return total;
}
export function inner$ProductSheetPanel$fn$v(e) {
    const v = parseInt(e.target.value, 10);
    return v;
}

export const SIGS = {
  inner$ProductSheetPanel$hasPrice: [{"name":"product","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false}],
  inner$ProductSheetPanel$total: [{"name":"product","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false},{"name":"qty","d":{"t":"num"},"opt":false}],
  inner$ProductSheetPanel$total$$step: [{"name":"product","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false},{"name":"qty","d":{"t":"num"},"opt":false},{"name":"hasPrice","d":{"t":"bool"},"opt":false}],
  inner$ProductSheetPanel$fn$v: [{"name":"e","d":{"t":"any"},"opt":false}],
};
