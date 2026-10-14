// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך buildsmart:app/src/components/product-card.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$formatPrice$text(p) {
    const text = p.price.toLocaleString('he-IL', {
        minimumFractionDigits: p.price % 1 ? 2 : 0,
    });
    return text;
}
export function inner$ProductCard$inCart(qty) {
    const inCart = qty > 0;
    return inCart;
}
export function inner$ProductCard$fn$v(e) {
    const v = parseInt(e.target.value, 10);
    return v;
}

export const SIGS = {
  inner$formatPrice$text: [{"name":"p","d":{"t":"obj","n":"CatalogProduct","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["emoji",{"t":"str"},false],["categoryTopId",{"t":"str"},false],["categoryLeafId",{"t":"str"},false],["productType",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["series",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["material",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["price",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["image",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["catalogProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessoryProduct",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["accessories",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"Accessory","p":[["name",{"t":"str"},false],["emoji",{"t":"str"},false],["price",{"t":"num"},false],["qty",{"t":"num"},false],["why",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["must",{"t":"bool"},false],["sizes",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"any"}}]},true]]}}]},true]]},"opt":false}],
  inner$ProductCard$inCart: [{"name":"qty","d":{"t":"num"},"opt":false}],
  inner$ProductCard$fn$v: [{"name":"e","d":{"t":"any"},"opt":false}],
};
